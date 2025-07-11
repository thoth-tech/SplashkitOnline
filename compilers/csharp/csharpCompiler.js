"use strict";

class CSharpCompiler extends Compiler {
    constructor() {
        super();
        this.signalReady();
    }

    async compileAll(compileList, sourceList, print) {
        let compiled = {
            output: null,
        };

        let hasErrors = false;

        // If all good, then output the 'compiled' result
        if (!hasErrors) {
            compiled.output = [];
            for (let i = 0; i < sourceList.length; i++) {
                compiled.output.push({
                    name: sourceList[i].name,
                    source: sourceList[i].source,
                });
            }
        }

        return compiled;
    }

}

// The name has to match the one in languageDefinitions.js
registerCompiler("csharpCompiler", new CSharpCompiler());
