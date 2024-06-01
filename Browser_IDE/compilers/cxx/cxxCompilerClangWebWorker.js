let SKO = null;

importScripts('./../../jszip/jszip.min.js');
importScripts('./../../fallibleMessage.js');
importScripts('./../../external/js-lzma/src/wlzma.js');
importScripts('./../../external/js-lzma/src/lzma.shim.js');

self.wlzmaCustomPath = "./../../external/js-lzma/src/wlzma.wrk.js";
importScripts('./../../downloadHandler.js');

// function to load the system libraries zip file
async function loadSystemRootFiles(){
    try {
        return await downloadFile("bin/wasi-sysroot.zip", null, true);
    }
    catch(err) {
        throw new Error("Failed to load compiler system root files: \""+err.responseURL+" "+err.statusText+"\"</br> Please check that the files are installed correctly.");
    }
}

// function to load in the system root files from a zip file
async function preloadSysroot(FS, sysroot){
    let contents = [];
    
    // cannot await for each zip.forEach,
    // so just extract all the data
    // and do the writing later
    await JSZip.loadAsync(sysroot)
    .then(function(zip) {
        zip.forEach(function (rel_path, zipEntry) {
            let abs_path = "/"+rel_path;
            if (zipEntry.dir){
                abs_path = abs_path.substring(0, abs_path.length-1);
                contents.push({name:abs_path, data:null});
            }
            else{
                let uint8_view = zip.file(rel_path).async("uint8array");
                contents.push({name:abs_path, data:uint8_view});
            }
        });
    })

    // write out the data into the real filesystem
    for(let i = 0; i < contents.length; i ++){
        if (contents[i].name == "/")
            continue;

        if (contents[i].data == null){
            try {
                await FS.mkdir(contents[i].name);
            }catch(e){};
        }
        else{
            let dir = contents[i].name.substr(0,contents[i].name.lastIndexOf("/"));

            try {
                await FS.mkdir(dir);
            }catch(e){};

            await FS.writeFile(contents[i].name, await contents[i].data);
        }
    }
}

// print utility
let silenceCompilerOutput = false;
function print(message){
    if (silenceCompilerOutput)
        return;

    postMessage({
        type:"print", message: message
    });
}

// initial settings for the modules
function initSettings(binary) {
    return {
        noExitRuntime: true,
        printErr: print,
        print: print,
        locateFile: function(file){
            return "bin/"+file;
        },
        wasmBinary: binary,
    }
}

// global variables for the compiler pieces
let clang = null;
let lld = null;

// main event handling for the worker
let promiseChannel = new PromiseChannel(self, self);

promiseChannel.setEventListener("initialize", async function(data){
    SKO = data.SKO;

    try { importScripts('./bin/clang++.js'); }
    catch(err) {
        throw new Error("Failed to load Clang++: \""+err.toString()+"\"</br> Please check that the files are installed correctly.");
    }

    try { importScripts('./bin/wasm-ld.js'); }
    catch(err) {
        throw new Error("Failed to load Wasm-ld: \""+err.toString()+"\"</br> Please check that the files are installed correctly.");
    }

    let [ , rootFiles] = await Promise.all([initializeCompiler(), loadSystemRootFiles()]);
    await initializeSystemRoot(rootFiles);
});
promiseChannel.setEventListener("setupUserCode", async function(data){
    await setupUserCode(data.codeFiles);
});
promiseChannel.setEventListener("compileObject", async function(data){
    return await compileObject(data.arguments, data.outputName);
});
promiseChannel.setEventListener("setupUserObjects", async function(data){
    await setupUserObjects(data.objects);
});
promiseChannel.setEventListener("linkObjects", async function(data){
    return await linkObjects(data.arguments, data.outputName);
});

// initialize the compilers, and tidy their output
async function initializeCompiler(){
    await Promise.all([
        downloadFile("bin/clang.wasm", null, true)
            .then((binary) => Clang(initSettings(binary)))
            .then((result) => {clang = result;}),

        downloadFile("bin/lld.wasm", null, true)
            .then((binary) => Lld(initSettings(binary)))
            .then((result) => {lld = result;})
    ]);
    // Lld and Clang doesn't really like us re-running their mains over and over,
    // and ask us to submit a bug report - let's let them get it out of their system once here
    // so the user doesn't need to see it...this feels wrong (´；ω；`)ｳｩｩ
    silenceCompilerOutput = true;
        clang.FS.writeFile("dummy.cpp", "");
        await clang.callMain(["-c", "dummy.cpp"]);
        await linkObjects(['-flavor', 'wasm', 'dummy.o'], "dummy.wasm");

        tidyClang();
        tidyLld();
    silenceCompilerOutput = false;
}

// initialize the system files for both compilers
async function initializeSystemRoot(sysroot){
    await preloadSysroot(clang.FS, sysroot);
    await preloadSysroot(lld.FS, sysroot);

    // setup additional 'undefined symbols', that are JavaScript function imports
    let additional_undefined_symbols = "__sko_process_events";

    lld.FS.writeFile('/lib/libemscripten_js_symbols.txt',
       lld.FS.readFile('/lib/libemscripten_js_symbols.txt',  { encoding: 'utf8' })+"\n"+additional_undefined_symbols,
       { encoding: 'utf8' }
    );
}

// write user code files
function setupUserCode(codeFiles){
    for(let i = 0; i < codeFiles.length; i ++){
        clang.FS.createPath("", codeFiles[i].name.slice(0, codeFiles[i].name.lastIndexOf("/")));
        clang.FS.writeFile(codeFiles[i].name, codeFiles[i].source);
    }
}

// compile user code and return the output
async function compileObject(arguments, outputName){
    tidyClang();

    // Might be good to include '-fno-exceptions', '-no-pthread'
    let exitCode = await clang.callMain(arguments);

    tidyClang(); // found it safest to do this twice, otherwise sometimes Clang still complained...

    let output = null;
    if (exitCode == 0 && outputName != null)
        output = clang.FS.readFile(outputName);

    return output;
}

// write user object files
function setupUserObjects(objects){
    for(let i = 0; i < objects.length; i ++){
        lld.FS.createPath("", objects[i].name.slice(0, objects[i].name.lastIndexOf("/")));
        lld.FS.writeFile(objects[i].name, objects[i].output);
    }
}

// link user's objects and return the output
async function linkObjects(arguments, outputName){
    tidyLld();

    let exitCode = await lld.callMain(arguments);

    tidyLld();

    let output = null;
    if (exitCode == 0 && outputName != null)
        output = lld.FS.readFile(outputName);

    return output;
}


// functions to make Clang and Lld survive being called
// repeatedly like we do here. Without these, they can only be called
// a maximum of 8 times before needing to be reinstantiated, which
// is costly and increases memory usage dramatically.
function tidyClang(){
    /*sigkill, tidies up Clang's internal signal handlers*/
    clang.__ZN4llvm3sys15CleanupOnSignalEm(4);
}
function tidyLld(){
    /*sigkill, tidies up Lld's internal signal handlers*/
    lld.__ZN4llvm3sys15CleanupOnSignalEm(4);
}