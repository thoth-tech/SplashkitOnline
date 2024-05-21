// Setup module settings - used later on in bin/SplashKitBackendWASMCPP.js
var Module = {
    onRuntimeInitialized: (function() {
        moduleEvents.dispatchEvent(new Event("onRuntimeInitialized"));
    }),
    print: (function() {
        return function(text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            writeTerminal(text);
        };
    })(),
    printErr: (function() {
        return function(text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            writeTerminal(text);
        };
    })(),
    canvas: (() => {
        let canvas = document.getElementById('canvas');

        // As a default initial behavior, pop up an alert when webgl context is lost. To make your
        // application robust, you may want to override this behavior before shipping!
        // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
        canvas.addEventListener("webglcontextlost", (e) => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

        return canvas;
    })(),
    preRun: (function() {
        ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "canvas";
    }),
    onCustomMessage : function(event) {
        data = event.data.userData;
        switch(data.type){
            case "ProgramEnded":
                executionEnvironmentClient.stopProgram();
                break;
            case "ProgramPaused":
                executionEnvironmentClient.signalPaused();
                break;
            case "ProgramContinued":
                executionEnvironmentClient.signalContinue();
                break;
        }
    }
};

// define and create the ExecutionEnvironmentInternal subclass
class ExecutionEnvironmentInternalCXX extends ExecutionEnvironment{
    constructor(listenOn) {
        return super(listenOn);
    }
    async pauseProgram(){
        clearInterval(this.keepAliveID);

        sendWorkerCommand("pause", {});
    }
    async continueProgram(){
        sendWorkerCommand("continue", {});

        clearInterval(this.keepAliveID);
        this.keepAliveID = setInterval(this.sendKeepAliveSignal, 500);
    }
    async stopProgram(){
        clearInterval(this.keepAliveID);

        let boundThis = this;
        if (worker != null) {
            await new Promise((resolve,reject) => {
                sendWorkerCommand("terminate", {});

                // Just give it a little bit of time to stop trying to recieve events
                // This isn't critical, but it avoids errors in the console.
                setTimeout(function(){
                    worker.terminate();
                    boundThis.signalStopped();
                    worker = null;
                    resolve();
                }, 100);
            });
        }
    }
    async runProgram(program){
        await this.stopProgram();
        await this.signalStarted();

        clearInterval(this.keepAliveID);
        this.keepAliveID = setInterval(this.sendKeepAliveSignal, 500);

        RunProgram(program);
    }
    sendKeepAliveSignal(){
        sendWorkerCommand("keepAlive", {});
    }
    resetExecutionScope(){
        // nothing to do...
    }
}

let executionEnvironmentClient = null;

// Service worker, which is used to provide a location we can send events to,
// and that our user's program can recieve them from. Using a SharedArrayBuffer would of course
// be better, but has less support (and also can't be served easily when hosting on GitHub)

// heavily inspired by the work here: https://blog.persistent.info/2021/08/worker-loop.html

let currentServiceWorker = null;

function sendWorkerCommand(command, args) {
    if (!currentServiceWorker)
        return;

    currentServiceWorker.postMessage({type: "programEvent", command, args});
}

function handleServiceWorkerStateChange(event) {
    if (this.state == "activated") {
        // trigger reload so service worker starts intercepting properly
        executionEnvironmentClient.Reload();
    }
}

async function registerServiceWorker(){
    try {
        let worker = await navigator.serviceWorker.register("/SKOservice-worker.js", { scope: "/" });

        worker.addEventListener("statechange", (event) => {
            if (this.state == "activated") {
                // trigger reload so service worker starts intercepting properly
                executionEnvironmentClient.Reload();
            }
        });

        if (worker.active) {
            currentServiceWorker = worker.active;

            executionEnvironmentClient.signalReady();
        }
    }
    catch(err){
        executionEnvironmentClient.reportCriticalInitializationFail(
            "Failed to initialize critical component: Service Worker. <br/>"+
            "You can still compile and run programs, but you will be unable to interact with them with your mouse or keyboard.<br/>"+
            err.toString()
        );
    }
}

// set everything up!
executionEnvironmentClient = new ExecutionEnvironmentInternalCXX(window);
registerServiceWorker();

// make canvas take focus when clicked
Module.canvas.addEventListener("click", async function () {
    Module.canvas.focus();
});
// send message when canvas is resized
new ResizeObserver(function(){
    if (window.cloneObject != undefined)
        sendWorkerCommand("EmEvent", { target: 'canvas', boundingClientRect: cloneObject(Module.canvas.getBoundingClientRect()) });
}).observe(Module.canvas);