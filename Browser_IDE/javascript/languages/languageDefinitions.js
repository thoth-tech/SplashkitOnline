"use strict";

// definitions for the languages supported by SplashKit
// Depending on the project's language, we'll dynamically load
// the relevant scripts/dependencies

// Each language is composed of a compiler and a runtime
// The runtimes are instantiated in the Execution Environment
// and generally should inherit from ExecutionEnvironmentInternal
// The compilers are instantiated in the main page,
// should inherit from Compiler, and need to register themselves to be used

let SplashKitOnlineLanguageDefinitions = [
    {
        name: "CSharp",
        userVisibleName: "C#",
        aliases: ['C#', 'CSharp'],
        sourceExtensions: ['cs'],
        compilableExtensions: ['cs'],
        defaultSourceExtension: "cs",
        setups: [{
            name: "C#",
            runtimeFiles: [
                { src: "moduleEventTarget.js", type: "text/javascript" },
                { src: "loadsplashkit.js", type: "text/javascript" },
                { src: "javascript/storage/fsevents.js", type: "text/javascript" },
                { src: "CSharpWasm/main.js", type: "module" },
                { src: "runtimes/ExecutionEnvironmentInternal.js", type: "text/javascript" },
                { src: "runtimes/csharp/csharpRuntime.js", type: "text/javascript" },
            ],
            runtimeDependencies: [
                "runtimes/javascript/bin/SplashKitBackendWASM.js",
                "runtimes/javascript/bin/SplashKitBackendWASM.wasm",
            ],
            compilerFiles: [
                "compilers/csharp/csharpCompiler.js",
            ],
            runtimeSizeAprox: 20,
            compilerSizeAprox: 150,
            compilerName: "csharpCompiler",
            supportHotReloading: false,
            getDefaultProject: ()=>{return makeNewProject_CSharp;},
            persistentFilesystem: false,
            compiled: true,
            needsSandbox: false,
            needsServiceWorker: false,
        }]
    },
    {
        name: "JavaScript",
        userVisibleName: "JavaScript",
        aliases: ['JS'],
        sourceExtensions: ['js', 'jsx', 'ts', 'mjs'],
        compilableExtensions: ['js', 'jsx', 'ts', 'mjs'],
        defaultSourceExtension: "js",
        setups: [{
            name: "JavaScript Native",
            runtimeFiles: [
                { src: "babel/babel.js", type: "text/javascript" }, //intention is to make this a compilerFile instead
                { src: "moduleEventTarget.js", type: "text/javascript" },
                { src: "loadsplashkit.js", type: "text/javascript" },
                { src: "javascript/storage/fsevents.js", type: "text/javascript" },
                { src: "executionEnvironment_CodeProcessor.js", type: "text/javascript" }, //intention is to make this a compilerFile instead
                { src: "executionEnvironment_Internal.js", type: "text/javascript" }, // and this should be based on ExecutionEnvironmentInternal.js
            ],
            runtimeDependencies: [
                "runtimes/javascript/bin/SplashKitBackendWASM.js",
                "runtimes/javascript/bin/SplashKitBackendWASM.wasm",
            ],
            compilerFiles: [
                "compilers/javascript/javascriptCompiler.js",
            ],
            runtimeSizeAprox: 20,
            compilerSizeAprox: 1,
            compilerName: "javascriptPatcher",
            supportHotReloading: true,
            getDefaultProject: ()=>{return makeNewProject_JavaScript;},
            persistentFilesystem: true,
            compiled: false,
            needsSandbox: true,
            needsServiceWorker: false,
        }]
    },
    {
        name: "C++",
        userVisibleName: "C++ (Experimental)",
        aliases: ['CXX','C'],
        sourceExtensions: ['c', 'h', 'cpp', 'hpp', 'cc'],
        compilableExtensions: ['cpp', 'c', 'cc'],
        defaultSourceExtension: "cpp",
        setups: [{
            name: "C++ (Clang)",
            runtimeFiles: [
                { src: "runtimes/ExecutionEnvironmentInternal.js", type: "text/javascript" },
                { src: "runtimes/cxx/cxxRuntime.js", type: "text/javascript" },
                { src: "runtimes/cxx/bin/SplashKitBackendWASMCPP.js", type: "text/javascript" },
            ],
            runtimeDependencies: [
                "runtimes/cxx/bin/SplashKitBackendWASMCPP.js",
                "runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js",
            ],
            compilerFiles: [
                "external/js-lzma/src/wlzma.js",
                "external/js-lzma/src/lzma.shim.js",
                "compilers/cxx/cxxCompiler.js",
            ],
            runtimeSizeAprox: 0, // user's compiled code becomes the 'runtime'
            compilerSizeAprox: 150,
            compilerName: "cxxCompiler",
            supportHotReloading: false,
            getDefaultProject: ()=>{return makeNewProject_CXX;},
            persistentFilesystem: false,
            compiled: true,
            needsSandbox: false,
            needsServiceWorker: true,
        }]
    }
];

function makeAliasMap(languages){
    let aliasMap = {};

    for (let i = 0; i < languages.length; i ++) {
        let language = languages[i];

        aliasMap[language.name] = language;
        aliasMap[language.userVisibleName] = language;

        for (let i = 0; i < language.aliases.length; i ++) {
            aliasMap[language.aliases[i]] = language;
        }
    }

    return aliasMap;
}

let SplashKitOnlineLanguageAliasMap = makeAliasMap(SplashKitOnlineLanguageDefinitions);

