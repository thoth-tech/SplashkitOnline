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
                executionEnvironment.stopProgram();
                break;
            case "ProgramPaused":
                executionEnvironment.signalPaused();
                break;
            case "ProgramContinued":
                executionEnvironment.signalContinue();
                break;
            case "InitializeAudioBuffer":
                audioPlayer.setupBuffer(data.bufferSize);
                break;
            case "Audio":
                if (audioPlayer.readyToBuffer) {
                    audioPlayer.channelBuffers[0].set(data.channelBuffers[0], audioPlayer.bufferWritePosition*audioPlayer.bufferSize);
                    audioPlayer.channelBuffers[1].set(data.channelBuffers[1], audioPlayer.bufferWritePosition*audioPlayer.bufferSize);

                    audioPlayer.bufferWritePosition += 1;
                    if (audioPlayer.bufferWritePosition >= audioPlayer.bufferSegments)
                        audioPlayer.bufferWritePosition = 0;
                }
                break;
            case "FS":
                // just forward it straight through
                parent.postMessage(data, "*");
                break;
            case "stdinAwait":
                setTerminalInputAwaitState(true);
                break;
            default:
                console.log("Unexpected event in cxxRuntime.js!", event);
                break;
        }
    }
};

// define and create the ExecutionEnvironmentInternal subclass
class ExecutionEnvironmentInternalCXX extends ExecutionEnvironmentInternal{
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

        setTerminalInputAwaitState(false);
    }
    async runProgram(program){
        await this.stopProgram();

        clearInterval(this.keepAliveID);
        this.keepAliveID = setInterval(this.sendKeepAliveSignal, 500);

        clearWorkerCommands();
        setTerminalInputAwaitState(false);

        StartProgramWorker(program, {
            sampleRate: audioPlayer.audioContext.sampleRate
        });

        // attempt to synchronize to main project file system
        // this just schedules all the commands, which will
        // be run as soon as the program starts, and before
        // entering main.
        try {
            await postMessageFallible(parent, {type: "mirrorRequest"});
        }
        catch(err){
            // should we abort running the program if this fails?
            // user might not be using files at all
            console.log(err);
        }

        await this.signalStarted();

        // start the program!
        worker.RunProgram();
    }
    sendKeepAliveSignal(){
        sendWorkerCommand("keepAlive", {});
    }
    resetExecutionScope(){
        // nothing to do...
    }

    async sendFSCommandToWorker(command){
        if (worker == null)
            return;// no need to throw, since we'll resync next time we run

        await sendAwaitableWorkerCommand(command.type, command);
    }

    async mkdir(path){
        await this.sendFSCommandToWorker({type:'mkdir', path: path});
    }
    async writeFile(path, data){
        if (typeof data == 'string')
            await this.sendFSCommandToWorker({type:'writeFile', path: path, data: data});
        else
            await this.sendFSCommandToWorker({type:'writeFile', path: path, data: Array.from(data) /* can't encode Uint8Array in JSON */});
    }
    async rename(oldPath, newPath){
        await this.sendFSCommandToWorker({type:'rename', oldPath, newPath});
    }
    async unlink(path){
        await this.sendFSCommandToWorker({type:'unlink', path});
    }
    async rmdir(path, recursive){
        await this.sendFSCommandToWorker({type:'rmdir', path, recursive});
    }
}

let executionEnvironment = null;

// Service worker, which is used to provide a location we can send events to,
// and that our user's program can recieve them from. Using a SharedArrayBuffer would of course
// be better, but has less support (and also can't be served easily when hosting on GitHub)

// heavily inspired by the work here: https://blog.persistent.info/2021/08/worker-loop.html

let currentServiceWorker = null;

function serviceWorkerSanityCheck() {
    if (!currentServiceWorker)
        return false;
    if (currentServiceWorker.state == "redundant") {
        executionEnvironment.Reload();
    }
    return true;
}

function sendWorkerCommand(command, args) {
    if (!serviceWorkerSanityCheck())
        return;

    currentServiceWorker.postMessage({type: "programEvent", command, args});
}

// seperate function to keep performance up (sendWorkerCommand is called a _lot_)
async function sendAwaitableWorkerCommand(command, args) {
    if (!serviceWorkerSanityCheck())
        return;

    await postMessageFallible(currentServiceWorker, {type: "programEvent", command, args});
}

function clearWorkerCommands(command) {
    if (!serviceWorkerSanityCheck())
        return;

    currentServiceWorker.postMessage({type: "clearEvents"});
}

async function registerServiceWorker(){
    try {
        let worker = await navigator.serviceWorker.register("/SKOservice-worker.js", { scope: "/" });

        worker.addEventListener("statechange", (event) => {
            if (this.state == "activated" || this.state == "redundant") {
                // trigger reload so service worker starts intercepting properly
                executionEnvironment.Reload();
            }
        });

        if (worker.active) {
            currentServiceWorker = worker.active;
            navigator.serviceWorker.addEventListener('message', async function(m){
                switch(m.data.type){
                    case "callback":
                        executeTempCallback(m.data);
                        break;
                }
            });

            executionEnvironment.signalReady();
        }
    }
    catch(err){
        executionEnvironment.reportCriticalInitializationFail(
            "Failed to initialize critical component: Service Worker. <br/>"+
            "You can still compile and run programs, but you will be unable to interact with them with your mouse or keyboard.<br/>"+
            err.toString()
        );
    }
}

//  Audio
let audioPlayer = null;

function setupAudio(){
    let ctx = this;

    // initial settings
    ctx.audioContext = null;
    ctx.readyToBuffer = false;

    if (!ctx.audioContext) {
        if (typeof(AudioContext) !== 'undefined') {
            ctx.audioContext = new AudioContext();
        } else if (typeof(webkitAudioContext) !== 'undefined') {
            ctx.audioContext = new webkitAudioContext();
        }
    }

    ctx.setupBuffer = function (bufferSize) {
        if (!ctx.audioContext) return;

        // initialize the buffers
        ctx.bufferSize = bufferSize;

        ctx.bufferApproxLengthSeconds = 10;
        ctx.bufferSegments = Math.floor(ctx.bufferApproxLengthSeconds / (bufferSize / ctx.audioContext.sampleRate));
        ctx.channelBuffers = [new Float32Array(ctx.bufferSize*ctx.bufferSegments), new Float32Array(ctx.bufferSize*ctx.bufferSegments)];

        ctx.bufferWritePosition = 0;
        ctx.bufferReadPosition = 0;

        ctx.readyToBuffer = true;

        // util
        function mod(n, m) {
          return ((n % m) + m) % m;
        }

        // setup the script processor node, and make it output from our buffer
        ctx.scriptProcessorNode = ctx.audioContext.createScriptProcessor(ctx.bufferSize, 0, 2);

        ctx.scriptProcessorNode.onaudioprocess = function (e) {

            // synchronize if we're too far behind
            let diff = Math.abs(ctx.bufferReadPosition - ctx.bufferWritePosition);
            if (Math.min(diff, ctx.bufferSegments - diff) > 2) {
                ctx.bufferReadPosition = mod(ctx.bufferWritePosition-1, ctx.bufferSegments);
            }

            // only play if we haven't caught up
            if (ctx.bufferReadPosition != ctx.bufferWritePosition){
                // The output buffer contains the samples that will be modified and played
                let outputBuffer = e.outputBuffer;

                for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                    let outputData = outputBuffer.getChannelData(channel);
                    let inputData = ctx.channelBuffers[channel];

                    outputData.set(inputData.subarray(ctx.bufferReadPosition*ctx.bufferSize, ctx.bufferReadPosition*ctx.bufferSize+ctx.bufferSize));
                }

                ctx.bufferReadPosition++;
                if (ctx.bufferReadPosition >= ctx.bufferSegments)
                    ctx.bufferReadPosition = 0;
            }
        };

        ctx.scriptProcessorNode.connect(ctx.audioContext.destination);
    }

    // ensure context resumes once interacted with
    // listenOnce and autoResumeAudioContext from Emscripten
    var listenOnce = (object, event, func) => {
        object.addEventListener(event, func, { 'once': true });
    };
    var autoResumeAudioContext = (ctx, elements) => {
        if (!elements) {
            elements = [document, document.getElementById('canvas')];
        }
        ['keydown', 'mousedown', 'touchstart'].forEach((event) => {
            elements.forEach((element) => {
                if (element) {
                    listenOnce(element, event, () => {
                        if (ctx.state === 'suspended') ctx.resume();
                    });
                }
            });
        });
    };
    autoResumeAudioContext(ctx.audioContext);
}


// set everything up!
executionEnvironment = new ExecutionEnvironmentInternalCXX(window);
registerServiceWorker();
audioPlayer = new setupAudio();

// make canvas take focus when clicked
Module.canvas.addEventListener("click", async function () {
    Module.canvas.focus();
});
// send message when canvas is resized
new ResizeObserver(function(){
    if (window.cloneObject != undefined)
        sendWorkerCommand("EmEvent", { target: 'canvas', boundingClientRect: cloneObject(Module.canvas.getBoundingClientRect()) });
}).observe(Module.canvas);

// send terminal input on enter
let terminalInput = document.getElementById("terminal-input");

function setTerminalInputAwaitState(awaiting) {
    if (awaiting)
        terminalInput.placeholder = 'awaiting input...';
    else
        terminalInput.placeholder = '';
}

terminalInput.addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        writeTerminal("> " + terminalInput.value);
        sendWorkerCommand("stdin", {value: terminalInput.value + '\n'});

        terminalInput.value = '';
        setTerminalInputAwaitState(false);
    }
});
