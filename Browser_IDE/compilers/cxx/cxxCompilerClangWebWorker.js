importScripts('./../../jszip/jszip.min.js');
importScripts('./../../fallibleMessage.js');

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
function initSettings() {
    return {
        noExitRuntime: true,
        printErr: print,
        print: print,
        locateFile: function(file){
            return "bin/"+file;
        },
    }
}

// global variables for the compiler pieces
let clang = null;
let lld = null;

// main event handling for the worker
onmessage = async function(event){
    try {
        switch (event.data.type) {
            case "initialize":
                try { importScripts('./bin/clang++.js'); }
                catch(err) {
                    throw new Error("Failed to load Clang++: \""+err.toString()+"\"</br> Please check that the files are installed correctly.");
                }

                try { importScripts('./bin/wasm-ld.js'); }
                catch(err) {
                    throw new Error("Failed to load Wasm-ld: \""+err.toString()+"\"</br> Please check that the files are installed correctly.");
                }

                await initializeCompiler();
                await initializeSystemRoot(event.data.sysroot);
                resolveMessageFallible(event);
                break;
            case "setupUserCode":
                await setupUserCode(event.data.codeFiles);
                resolveMessageFallible(event);
                break;
            case "compileObject":
                resolveMessageFallible(event, await compileObject(event.data.arguments, event.data.outputName));
                break;
            case "setupUserObjects":
                await setupUserObjects(event.data.objects);
                resolveMessageFallible(event);
                break;
            case "linkObjects":
                resolveMessageFallible(event, await linkObjects(event.data.arguments, event.data.outputName));
                break;
            default:
                throw new Error("Unexpected event in cxxCompilerClangWebWorker.js: "+JSON.stringify(event.data, null, 2));
        }

    } catch(err){
        // For good reason, postMessage cannot transfer function references.
        // We need to sanitise err to avoid that.
        // TODO: Do anything other than this.
        err = err.toString();
        rejectMessageFallible(event, err);
        throw err;
    }
};

// initialize the compilers, and tidy their output
async function initializeCompiler(){
    clang = await Clang(initSettings());
    lld = await Lld(initSettings());

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