"use strict";

class JavascriptPatcher extends Compiler{
    constructor(){
        super()
        this.signalReady();
    }

    patchCode(source){
        // TODO: We just pass all the source straight through,
        // as code processing happens in the Execution Env (which shouldn't be the case)
        // This will be changed soon hopefully.
        return source;
    }

    async compileAll(sourceList, print){
        let compiled = {
            output : null,
        };

        let hasErrors = false;

        // First syntax check everything
        for(let i = 0; i < sourceList.length; i ++) {
            let okay = await this.syntaxCheckOne(sourceList[i].name, sourceList[i].source, print);

            hasErrors |= !okay;
        }

        // If all good, then output the 'compiled' result
        if (!hasErrors) {
            compiled.output = [];
            for(let i = 0; i < sourceList.length; i ++) {
                compiled.output.push({
                    name: sourceList[i].name,
                    source: this.patchCode(sourceList[i].source),
                })
            }
        }

        return compiled;
    }

    async compileOne(name, source, print){
        let okay = await this.syntaxCheckOne(name, source, print);

        return {
            output: okay ? this.patchCode(source) : null
        };
    }

    async syntaxCheckOne(name, source, print){
        // Syntax checking itself is a bit messy - wrapped in seperate function
        let error = await this._syntaxCheckCode(name, source);

        if (error != null)
            print(error);

        return error == null;
    }

    _syntaxCheckCode(name, source){
        return new Promise((resolve, reject) => {
            // The syntax checking cannot run inside an async function,
            // so just inside a timeout instead. A bit of a cludge, but it works.
            setTimeout(function(){
                let errorFunction = (errorEvent) => {
                    const {lineno, colno, message} = errorEvent;
                    errorEvent.preventDefault();

                    window.removeEventListener('error', errorFunction);

                    resolve({
                        name: name,
                        line: lineno - userCodeStartLineOffset,
                        message: message,
                    });
                }

                window.addEventListener('error', errorFunction);

                // Syntax check by creating a function based on the user's code
                // Don't execute it here!
                Object.getPrototypeOf(async function() {}).constructor(
                    "\"use strict\";"+source
                );

                // If there is a syntax error, this will not be reached
                // So make sure we remove it in the `errorFunction`
                // above too.
                window.removeEventListener('error', errorFunction);

                resolve();
            }, 0);
        });
    }
}

registerCompiler("javascriptPatcher", new JavascriptPatcher());


// Note: Brought across from executionEnvironment_Internal.js
// I don't like the duplication, but unsure how to avoid it without
// placing this single function inside another script file.

let userCodeStartLineOffset = findAsyncFunctionConstructorLineOffset();

// In Firefox at least, the AsyncFunction constructor appends two lines of code to
// the start of the function.
// So we'll detect where a dummy identifier inserted on the first line of the code
// is located (*/SK_ID*/), and update userCodeStartLineOffsets.
// Could just set it to 2, but unsure if this is browser/source dependent or not.
function findAsyncFunctionConstructorLineOffset(){
    let identifier = "/*SK_ID*/";
    let blockFunction = Object.getPrototypeOf(async function() {}).constructor(
        "\"use strict\";"+identifier+"\n;"
    );
    let functionCode = blockFunction.toString();
    let codeUntilIdentifier = functionCode.slice(0, functionCode.indexOf(identifier));
    let newlines = codeUntilIdentifier.match(/\n/g);
    let newlineCount = ((newlines==null)?0:newlines.length);

    return newlineCount;
}