"use strict";

const ExecutionStatus = {
  Unstarted: 'Unstarted',
  Running: 'Running',
  Paused: 'Paused'
};

class ExecutionEnvironment extends EventTarget{

    constructor(container) {
        super();

        this.container = container;
        this.iFrame = this._constructiFrame(container);
        let EE = this;

        this.hasRunOnce = false;
        this.executionStatus = ExecutionStatus.Unstarted;

        window.addEventListener('message', function(e){
            const key = e.message ? 'message' : 'data';
            const data = e[key];

            if (data.type == "initialized"){
                EE.dispatchEvent(new Event("initialized"));
            }
            else if (data.type == "error"){
                let ev = new Event("error");
                ev.message = data.message;
                ev.line = data.line;
                ev.block = data.block;
                EE.dispatchEvent(ev);
            }
            else if (data.type == "programStarted"){
                EE.hasRunOnce = true;
                EE.executionStatus = ExecutionStatus.Running;

                let ev = new Event("programStarted");
                EE.dispatchEvent(ev);
            }
            else if (data.type == "programStopped"){
                EE.executionStatus = ExecutionStatus.Unstarted;

                let ev = new Event("programStopped");
                EE.dispatchEvent(ev);
            }
            else if (data.type == "programPaused"){
                EE.executionStatus = ExecutionStatus.Paused;

                let ev = new Event("programPaused");
                EE.dispatchEvent(ev);
            }
            else if (data.type == "programContinued"){
                EE.executionStatus = ExecutionStatus.Running;

                let ev = new Event("programContinued");
                EE.dispatchEvent(ev);
            }
            else if (data.type == "FS")
            {
                if (data.message.type == "onMovePath"){
                    let ev = new Event("onMovePath");
                    ev.oldPath = data.message.oldPath;
                    ev.newPath = data.message.newPath;
                    EE.dispatchEvent(ev);
                }
                else if (data.message.type == "onMakeDirectory"){
                    let ev = new Event("onMakeDirectory");
                    ev.path = data.message.path;
                    EE.dispatchEvent(ev);
                }
                else if (data.message.type == "onDeletePath"){
                    let ev = new Event("onDeletePath");
                    ev.path = data.message.path;
                    EE.dispatchEvent(ev);
                }
                else if (data.message.type == "onOpenFile"){
                    let ev = new Event("onOpenFile");
                    ev.path = data.message.path;
                    EE.dispatchEvent(ev);
                }
            }
        });
    }

    // Public Facing Methods

    // --- Code Execution Functions ---
    // Code blocks can be run, that declare variables, functions, classes, etc.
    // The program itself can then be run - this will call main().
    // Code blocks can then be updated while the program ("main()") is running.
    runCodeBlocks(blocks){
        for (let block of blocks){
            this.runCodeBlock(block.name, block.code);
        }
    }

    runCodeBlock(block, source){
        // Syntax check code - will throw if fails.
        this._syntaxCheckCode(block, source);

        this.iFrame.contentWindow.postMessage({
            type: "RunCodeBlock",
            name: block,
            code: source,
        }, "*");
    }

    runProgram(){
        this.iFrame.contentWindow.postMessage({
            type: "RunProgram",
        }, "*");
    }

    async pauseProgram(){
        return new Promise((resolve,reject) => {
            let f = function(ev){this.removeEventListener("programPaused", f);resolve();}
            this.addEventListener("programPaused", f);
            this.iFrame.contentWindow.postMessage({
                type: "PauseProgram",
            }, "*");
            setTimeout(function(){reject();}, 2000)
        });
    }

    continueProgram(){
        this.iFrame.contentWindow.postMessage({
            type: "ContinueProgram",
        }, "*");
    }

    async stopProgram(){
        return new Promise((resolve,reject) => {
            let f = function(ev){this.removeEventListener("programStopped", f);resolve();}
            this.addEventListener("programStopped", f);
            this.iFrame.contentWindow.postMessage({
                type: "StopProgram",
            }, "*");
            setTimeout(function(){reject();}, 2000)
        });
    }


    // --- Environment Functions ---

    // Completely destroys and recreates the environment.
    resetEnvironment(){
        return new Promise((resolve,reject) => {

            this.iFrame.remove();

            let f = function(ev){this.removeEventListener("initialized", f);resolve();}
            this.addEventListener("initialized", f);

            this.iFrame = this._constructiFrame(this.container);

            this.executionStatus = ExecutionStatus.Unstarted;
            this.hasRunOnce = false;

            let ev = new Event("programStopped");
            this.dispatchEvent(ev);
            setTimeout(function(){reject();}, 20000)
        });
    }

    // Does a 'best-efforts' attempt to tidy the environment,
    // such as removing global variables.
    // Much faster than resetEnvironment()
    cleanEnvironment(){
        this.iFrame.contentWindow.postMessage({
            type: "CleanEnvironment",
        }, "*");
    }

    // --- File System Functions ---
    mkdir(path){
        this.iFrame.contentWindow.postMessage({
            type: "mkdir",
            path: path,
        }, "*");
    }
    writeFile(path, data){
        this.iFrame.contentWindow.postMessage({
            type: "writeFile",
            path: path,
            data: data,
        }, "*");
    }
    rename(oldPath, newPath){
        this.iFrame.contentWindow.postMessage({
            type: "rename",
            oldPath: oldPath,
            newPath: newPath,
        }, "*");
    }
    unlink(path){
        this.iFrame.contentWindow.postMessage({
            type: "unlink",
            path: path
        }, "*");
    }




    // "Private" Methods

    // The only cross browser way to syntax check the user's function
    // and get a line number is to use window.onerror. Unfortunately,
    // due to the sandboxed nature of the iFrame, the resulting information
    // just becomes "Syntax error", with line/column as 0s. So we syntax
    // check _outside_ the iFrame first.
    // Once the code is running (inside the iFrame), the stack traces
    // become more useful and can all be handled in there. It's only
    // the syntax check that runs outside here, so this should be
    // safe from a security point of view.

    // Note: This function can only be called inside non-async functions!
    // If called inside an async function, syntax errors will not propogate
    // to the window.onerror handler.

    _syntaxCheckCode(block, source){

        let errorFunction = (errorEvent) => {
            const {lineno, colno, message} = errorEvent;
            errorEvent.preventDefault();

            this.iFrame.contentWindow.postMessage({
                type: "ReportError",
                block: block,
                line: lineno - userCodeStartLineOffset,
                message: message,
            }, "*");

            window.removeEventListener('error', errorFunction);
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
    }

    _constructiFrame(container){

        var iframe = document.createElement('iframe');
        iframe.id="iframetest";
        iframe.sandbox = 'allow-scripts allow-modals';

        container.appendChild(iframe);
        iframe.src="executionEnvironment.html";
        iframe.style = "display: flex;flex: 1;/*! flex-grow: 1; */width: 100%;height: 100%;";
        iframe.focus();
        return iframe;
    }

}

// Note: Brought across from executionEnvironment_Internal.js
// I don't like the duplication, but unsure how to avoid it without
// placing this single function inside another script file.

let userCodeStartLineOffset = findAsyncFunctionConstructorLineOffset();

// In Firefox at least, the AsyncFunction constructor appends two lines of code to
// the start of the function.
// So we'll detect where a dummy identifier inserted on the first line of the code
//  is located (*/SK_ID*/), and update userCodeStartLineOffsets.
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
