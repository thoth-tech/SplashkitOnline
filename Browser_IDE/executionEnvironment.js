"use strict";

const ExecutionStatus = {
  Unstarted: 'Unstarted',
  Running: 'Running',
  Paused: 'Paused'
};

// useful util functions from Claude - https://stackoverflow.com/a/70789108, thanks!
function getPromiseFromEvent(item, event) {
  return new Promise((resolve) => {
    const listener = () => {
      item.removeEventListener(event, listener);
      resolve();
    }
    item.addEventListener(event, listener);
  })
}

class ExecutionEnvironment extends EventTarget{

    constructor(container, language) {
        super();

        this.language = language;
        this.container = container;

        this.hasRunOnce = false;
        this.executionStatus = ExecutionStatus.Unstarted;
        this.readyForExecution = false;
    }

    async initialize(){
        this.iFrame = this._constructiFrame(this.container, this.language);

        let EE = this;
        this.channel = new PromiseChannel(window, this.iFrame.contentWindow);

        this.channel.setEventListener('mirrorRequest', async function(ev) {
            return await new Promise((resolve, reject) => {
                let ev = new Event("mirrorRequest");
                ev.resolve = resolve;
                ev.reject = reject;
                EE.dispatchEvent(ev)
            });
        })

        window.addEventListener('message', async function(e){
            const key = e.message ? 'message' : 'data';
            const data = e[key];

            // TODO? Should this be a switch statement like all the other?
            if (data.type == "initialized"){
                EE.dispatchEvent(new Event("initialized"));
            } else if (data.type == "languageLoaderReady"){
                EE.dispatchEvent(new Event("languageLoaderReady"));
            }
            else if (data.type == "executionEnvironmentGetFilesystemRequest"){
                EE.dispatchEvent(new Event("getFilesystemRequest"));
            }
            else if (data.type == "executionEnvironmentReloadRequest"){
                EE.resetEnvironment();
            }
            else if (data.type == "onDownloadFail"){
                let ev = new Event("onDownloadFail");
                ev.name = data.name;
                ev.url = data.url;
                ev.status = data.status;
                ev.statusText = data.statusText;
                EE.dispatchEvent(ev);
            }
            else if (data.type == "onCriticalInitializationFail"){
                let ev = new Event("onCriticalInitializationFail");
                ev.message = data.message
                EE.dispatchEvent(ev);
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

        await getPromiseFromEvent(this, "initialized");
        this.readyForExecution = true;
    }

    // Public Facing Methods

    // --- Code Execution Functions ---

    hotReloadFile(block, source){
        this.iFrame.contentWindow.postMessage({
            type: "HotReloadFile",
            name: block,
            code: source,
        }, "*");
    }

    runProgram(program){
        this.iFrame.contentWindow.postMessage({
            type: "RunProgram",
            program: program,
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

    async updateCompilerLoadProgress(progress){
        this.iFrame.contentWindow.postMessage({
            type: "UpdateCompilerLoadProgress",
            progress: progress,
        }, "*");
    }


    // --- Environment Functions ---

    // Completely destroys and recreates the environment.
    resetEnvironment(language=null){
        return new Promise((resolve,reject) => {

            this.readyForExecution = false;
            this.iFrame.remove();

            let f = function(ev){
                this.removeEventListener("initialized", f);
                this.readyForExecution = true;
                resolve();
            }
            this.addEventListener("initialized", f);

            if (language)
                this.language = language;

            this.iFrame = this._constructiFrame(this.container, this.language);
            this.channel.setReceiver(this.iFrame.contentWindow);

            if (this.executionStatus != ExecutionStatus.Unstarted){
                let ev = new Event("programStopped");
                this.dispatchEvent(ev);
            }

            this.executionStatus = ExecutionStatus.Unstarted;
            this.hasRunOnce = false;

            setTimeout(function(){reject();}, 20000);
        });
    }

    // Does a 'best-efforts' attempt to tidy the environment,
    // such as removing global variables.
    // Much faster than resetEnvironment()
    async cleanEnvironment(){
        await this.channel.postMessage("CleanEnvironment");
    }

    // --- File System Functions ---
    async mkdir(path){
        await this.channel.postMessage("mkdir", {path});
    }
    async writeFile(path, data){
        await this.channel.postMessage("writeFile", {path, data});
    }
    async rename(oldPath, newPath){
        await this.channel.postMessage("rename", {
            oldPath: oldPath,
            newPath: newPath,
        });
    }
    async readFile(path){
        return await this.channel.postMessage("readFile", {path});
    }
    async unlink(path){
        await this.channel.postMessage("unlink", {path});
    }
    async rmdir(path, recursive = false){
        await this.channel.postMessage("rmdir", {path, recursive});
    }

    initializeFilesystem(folders, files){
        this.iFrame.contentWindow.postMessage({
            type: "initializeFilesystem",
            folders: folders,
            files: files,
        }, "*");
    }

    reportError(file, lineNumber, message, formatted=false) {
        this.iFrame.contentWindow.postMessage({
            type: "ReportError",
            block: file,
            line: lineNumber,
            message: message,
            formatted: formatted,
        }, "*");
    }
    writeToTerminal(message) {
        this.iFrame.contentWindow.postMessage({
            type: "WriteToTerminal",
            message: message,
        }, "*");
    }

    _constructiFrame(container, language){
        this.readyForExecution = false;
        var iframe = document.createElement('iframe');

        iframe.id="iframetest"; // this code is primordial...
        if (language.needsSandbox)
            iframe.sandbox = 'allow-scripts allow-modals allow-same-origin';

        container.appendChild(iframe);
        iframe.src="executionEnvironment.html";

        iframe.style = "display: flex;flex: 1;/*! flex-grow: 1; */width: 100%;height: 100%;";
        iframe.focus();

        let f = function(ev){
            this.removeEventListener("languageLoaderReady", f);

            // language must have a name, and a list of scripts to prepare itself
            this.iFrame.contentWindow.postMessage({
                type: "InitializeLanguage",
                languageName: language.name,
                runtimeFiles: language.runtimeFiles,
                runtimeSizeAprox: language.runtimeSizeAprox,
                compilerSizeAprox: language.compilerSizeAprox,
                needsServiceWorker: language.needsServiceWorker,
                SKO: SKO,
            }, "*");
        }
        this.addEventListener("languageLoaderReady", f);

        return iframe;
    }

}