"use strict";

// Utility function to instantiate a language's compiler scripts
function initializeLanguageCompilerFiles(language){
    // load in the script files for this language/setup
    for (let script of language.compilerFiles){
        var s = document.createElement("script");

        s.src = script;
        s.async = false;
        document.documentElement.appendChild(s);
    }
}

// Compiler registry
// Compilers register themselves so they can be found via the "compilerName"
// We also receive events once their ready, so we can update the UI and let the user know
let registeredCompilers = new Map();
let registeredCompilersEvents = new EventTarget();

function registerCompiler(name, compiler) {
    compiler.name = name;
    registeredCompilers.set(name, compiler);
}
function getCompiler(name) {
    return registeredCompilers.get(name);
}

// Compiler base class
class Compiler{
    constructor(){
        this.name = "";
    }

    async compileAll(sourceList, print){throw new Error("CompileAll not supported in current compiler!");}
    async compileOne(name, source, print){throw new Error("CompileOne not supported in current compiler!");}
    async syntaxCheckOne(name, source, print){throw new Error("SyntaxCheckOne not supported in current compiler!");}

    signalReady(){
        let ev = new Event("compilerReady");
        ev.compilerName = this.name;
        registeredCompilersEvents.dispatchEvent(ev);
    }
}
