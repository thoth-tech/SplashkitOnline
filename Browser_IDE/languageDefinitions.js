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
        name: "JavaScript",
        userVisibleName: "JavaScript",
        aliases: ['JS'],
        sourceExtensions: ['js', 'jsx', 'ts', 'mjs'],
        compilableExtensions: ['js', 'jsx', 'ts', 'mjs'],
        defaultSourceExtension: "js",
        setups: [{
            name: "JavaScript Native",
            runtimeFiles: [
                "babel/babel.js", //intention is to make this a compilerFile instead
                "moduleEventTarget.js",
                "loadsplashkit.js",
                "fsevents.js",
                "executionEnvironment_CodeProcessor.js", //intention is to make this a compilerFile instead
                "executionEnvironment_Internal.js", // and this should be based on ExecutionEnvironmentInternal.js
                "executionEnvironment_Page.js",
            ],
            runtimeDependencies: [
                "runtimes/javascript/bin/SplashKitBackendWASM.js",
                "runtimes/javascript/bin/SplashKitBackendWASM.wasm",
            ],
            compilerFiles: [
                "compilers/javascript/javascriptCompiler.js",
            ],
            compilerName: "javascriptPatcher",
            supportHotReloading: true,
            getDefaultProject: ()=>{return makeNewProject_JavaScript;},
            persistentFilesystem: true,
            compiled: false,
            needsSandbox: true,
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
                "fallibleMessage.js",
                "runtimes/ExecutionEnvironmentInternal.js",
                "runtimes/cxx/cxxRuntime.js",
                "runtimes/cxx/bin/SplashKitBackendWASMCPP.js",
                "executionEnvironment_Page.js",
            ],
            runtimeDependencies: [
                "runtimes/cxx/bin/SplashKitBackendWASMCPP.js",
                "runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js",
            ],
            compilerFiles: [
                "compilers/cxx/cxxCompiler.js",
            ],
            compilerName: "cxxCompiler",
            supportHotReloading: false,
            getDefaultProject: ()=>{return makeNewProject_CXX;},
            persistentFilesystem: false,
            compiled: true,
            needsSandbox: false,
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

