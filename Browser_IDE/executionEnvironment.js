"use strict";

const ExecutionStatus = {
  Unstarted: 'Unstarted',
  Running: 'Running',
  Paused: 'Paused'
};

class ExecutionEnvironment extends EventTarget{

    constructor(container, language) {
        super();

        this.language = language;
        this.container = container;
        this.iFrame = this._constructiFrame(container, language);

        let EE = this;

        this.hasRunOnce = false;
        this.executionStatus = ExecutionStatus.Unstarted;

        window.addEventListener('message', async function(e){
            const key = e.message ? 'message' : 'data';
            const data = e[key];

            // TODO? Should this be a switch statement like all the other?
            try {
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
                else if (data.type == "callback"){
                    executeTempCallback(data);
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
                else if (data.type == "mirrorRequest"){
                    await new Promise((resolve, reject) => {
                        let ev = new Event("mirrorRequest");
                        ev.resolve = resolve;
                        ev.reject = reject;
                        EE.dispatchEvent(ev)
                    });
                }

                resolveMessageFallible(e, undefined, EE.iFrame.contentWindow);
            } catch(err){
                // TODO: Do anything other than this.
                err = err.toString();

                rejectMessageFallible(e, err, EE.iFrame.contentWindow);
                throw err;
            }
        });
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


    // --- Environment Functions ---

    // Completely destroys and recreates the environment.
    resetEnvironment(language=null){
        return new Promise((resolve,reject) => {

            this.iFrame.remove();

            let f = function(ev){this.removeEventListener("initialized", f);resolve();}
            this.addEventListener("initialized", f);

            if (language)
                this.language = language;

            this.iFrame = this._constructiFrame(this.container, this.language);

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
    cleanEnvironment(){
        this.iFrame.contentWindow.postMessage({
            type: "CleanEnvironment",
        }, "*");
    }

    // --- File System Functions ---
    async mkdir(path){
        await postMessageFallible(this.iFrame.contentWindow, {
            type: "mkdir",
            path: path,
        });
    }
    async writeFile(path, data){
        await postMessageFallible(this.iFrame.contentWindow, {
            type: "writeFile",
            path: path,
            data: data,
        });
    }
    async rename(oldPath, newPath){
        await postMessageFallible(this.iFrame.contentWindow, {
            type: "rename",
            oldPath: oldPath,
            newPath: newPath,
        });
    }
    unlink(path){
        this.iFrame.contentWindow.postMessage({
            type: "unlink",
            path: path
        }, "*");
    }
    rmdir(path, recursive = false){
        this.iFrame.contentWindow.postMessage({
            type: "rmdir",
            path: path,
            recursive: recursive
        }, "*");
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

        var iframe = document.createElement('iframe');
        iframe.id="iframetest";
        if (language.needsSandbox)
            iframe.sandbox = 'allow-scripts allow-modals';

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
            }, "*");
        }
        this.addEventListener("languageLoaderReady", f);

        return iframe;
    }

}