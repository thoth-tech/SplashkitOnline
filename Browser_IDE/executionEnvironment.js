"use strict";

class ExecutionEnvironment extends EventTarget{

    constructor(container) {
        super();

        this.container = container;
        this.iFrame = this._constructiFrame(container);
        let EE = this;
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

    runCodeBlock(block, source){
        if (block == "Init"){
            this.iFrame.contentWindow.postMessage({
                type: "InitCode",
                code: source,
            }, "*");
        }
        if (block == "Main"){
            this.iFrame.contentWindow.postMessage({
                type: "RunMainLoop",
                code: source,
            }, "*");
        }
    }
    stop(){
        this.iFrame.contentWindow.postMessage({
            type: "StopMainLoop",
        }, "*");
    }

    resetEnvironment(){
        this.iFrame.remove();
        this.iFrame = this._constructiFrame(this.container);
    }

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