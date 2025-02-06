// utility functions for reporting errors from Clang
function removeAnsiFromString(text){
    return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function reportCompilerError(err){
    const stackParse = /([^:]*):([0-9]*):([0-9]*):(.*)/gm;

    let errors = [...err.matchAll(stackParse)];

    // Report the errors (so lines can be highlighted), but don't output them to the terminal
    for (let error of errors){
        let fileName = removeAnsiFromString(error[1]);
        let line = removeAnsiFromString(error[2]);
        let character = removeAnsiFromString(error[3]);
        let message = error[4];

        printCompilerMessage({
            name: fileName,
            line: line,
            message: "",
            formatted: true
        });
    }

    // Then just report the message here, without worrying about our custom error format
    // This means the output is exactly what the user would get from the compiler,
    // which is better for learning.
    printCompilerMessage({
        name: null,
        line: null,
        message: err,
        formatted: true
    });

}

// create the worker - this is where Clang will run, so the main page doesn't pause
// as it compiles.
let w = new Worker("./compilers/cxx/cxxCompilerClangWebWorker.js");
let promiseChannel = new PromiseChannel(w, w);

export let printCompilerMessage = console.log;
export const setPrintFunction = (func) => {printCompilerMessage = func;};

w.onmessage = function(event){
    switch (event.data.type) {
        case "print":
            // Tidy up the returned messages a little
            if (event.data.message.includes("__syscall_prlimit64"))
                break;
            if (event.data.message.includes("symbol exported via --export not found: main"))
                event.data.message = "Could not find main function when linking! Please make sure main is declared.";

            // output
            reportCompilerError(event.data.message);
            break;
        case "callback":
            break;
        case "signalCallback":
            break;
        default:
            console.log(event);
            throw new Error("Unexpected event in cxxCompilerClangBackend.js: "+JSON.stringify(event.data, null, 2));
    }
}

// initialize the compilers
await promiseChannel.postMessage("initialize", {SKO}, {
    downloadProgress: (data) => executionEnviroment.updateCompilerLoadProgress(data.progress)
});

// export functions to compile and link objects - this is used in the main cxxCompiler.js
export const writeFile = async (name, source) => {
    try {
        await promiseChannel.postMessage("setupUserCode", {
            codeFiles : [{
                name: name,
                source: source
            }]
        });
    }
    catch(err) {
        displayEditorNotification("Failed to compile due to internal error!</br>"+err.toString(), NotificationIcons.CRITICAL_ERROR);
    }
}
export const compileObject = async (name, source) => {
    let output = null;

    try {
        await promiseChannel.postMessage("setupUserCode", {
            codeFiles : [{
                name: name,
                source: source
            }]
        });
        output = await promiseChannel.postMessage("compileObject", {
            arguments: ['-idirafter/lib/clang/16.0.4/include/', '-fdiagnostics-color=always', '-c', name, "-o", name+".o"],
            outputName: name+".o"
        });
    }
    catch(err) {
        displayEditorNotification("Failed to compile due to internal error!</br>"+err.toString(), NotificationIcons.CRITICAL_ERROR);
    }

    return {
        name: name+".o",
        output: output
    };
}

export const linkObjects = async (objects) => {
    let output = null;

    try {
        let objectOutputs = [];
        let objectNames = [];

        for(let i = 0; i < objects.length; i ++) {
            objectOutputs.push({
                name: objects[i].name+".o",
                output: objects[i].output
            })
            objectNames.push(objects[i].name+".o");
        }

        await promiseChannel.postMessage("setupUserObjects", {
            objects : objectOutputs
        });

        output = await promiseChannel.postMessage("linkObjects", {
            arguments: [
                '-flavor',
                'wasm',
                '--export-all',
                '--static',
                '-L/lib/wasm32-emscripten',
                '-L/lib/',
                '--no-demangle',
                '-lGL',
                '-lal',
                '-lhtml5',
                '-lstubs-debug',
                '-lnoexit',
                '-lc-debug',
                '-ldlmalloc',
                '-lcompiler_rt',
                '-lc++-noexcept',
                '-lc++abi-debug-noexcept',
                '-lsockets',
                '--no-entry',

                '--wrap=_ZN13splashkit_lib14process_eventsEv',
                '-lSplashKitBackend',

                '-o',
                'main.wasm',

                "-lSDL2",
                "-lSDL2_mixer_ogg",
                "-lSDL2_ttf",
                "-lSDL2_gfx",
                "-lSDL2_image_bmp-png-xpm",
                "-lSDL2_net",

                "-lvorbis",
                "-lz",
                "-lpng",

                "-logg",
                "-lharfbuzz",

                "-lfreetype",

                '--allow-undefined-file=/lib/libemscripten_js_symbols.txt',
                '--export=main','--export=emscripten_stack_init',
                '--export=stackSave',
                '--export=__cxa_demangle',
                '--export=fileno',
                '--export=__wrap__ZN13splashkit_lib14process_eventsEv',
                '--export=_ZN13splashkit_lib14process_eventsEv',
            ].concat(objectNames),
            outputName: "main.wasm"
        });
    }
    catch(err) {
        displayEditorNotification("Failed to link due to internal error!</br>"+err.toString(), NotificationIcons.CRITICAL_ERROR);
    }

    return output;
}