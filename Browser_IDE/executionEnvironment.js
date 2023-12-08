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
                EE.executionStatus = ExecutionStatus.Unstarted;

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
        this.iFrame.remove();
        this.iFrame = this._constructiFrame(this.container);

        this.executionStatus = ExecutionStatus.Unstarted;
        this.hasRunOnce = false;

        let ev = new Event("programStopped");
        this.dispatchEvent(ev);
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





    // "Private" Methods
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