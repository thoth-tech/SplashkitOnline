minimumEventsCheckInterval = 0; // set to 0, so we always fetch user events.
let nextEventsCheckTime = 0;

// disable keepAlive system until we receive first keepAlive signal
let lastKeepAlive = -1;

let terminated = false;

function postCustomMessage(data) {
  postMessage({ target: 'custom', userData: data });
}

function handleEvent([event, args]){
    switch (event){
        case "terminate":
            terminated = true;
            break;
        case "pause":
            postCustomMessage({
                type: "ProgramPaused"
            });
            pauseLoop('continue');
            break;
        case "keepAlive":
            lastKeepAlive = performance.now();
            break;

        // TODO: de-duplicate this code and the code in executionEnvironment_Internal.js
        case "mkdir":
            FS.mkdir(args.path);
            break;
        case "writeFile":
            if (typeof args.data == 'string')
                FS.writeFile(args.path, args.data);
            else
                FS.writeFile(args.path, new Uint8Array(args.data));
            break;
        case "rename":
            FS.rename(args.oldPath,args.newPath);
            break;
        case "unlink":
            FS.unlink(args.path);
            break;
        case "rmdir":
            if(args.recursive){
                let deleteContentsRecursive = function(p){
                    let entries = FS.readdir(p);
                    for(let entry of entries){
                        if(entry == "." || entry == "..")
                            continue;
                        // All directories contain a reference to themself
                        // and to their parent directory. Ignore them.

                        let entryPath = p + "/" + entry;
                        let entryStat = FS.stat(entryPath, false);

                        if(FS.isDir(entryStat.mode)){
                            deleteContentsRecursive(entryPath);
                            FS.rmdir(entryPath);
                        } else if(FS.isFile(entryStat.mode)){
                            FS.unlink(entryPath);
                        }

                    }
                }
                deleteContentsRecursive(args.path);
                FS.rmdir(args.path);
                // FS.rmdir expects the directory to be empty
                // and will throw an error if it is not.
            } else {
                FS.rmdir(args.path);
            }

        case "stdin":
            Module.intArrayFromString(args.value).forEach(function(v) {inputBuffer.push(v)});
            inputBuffer.push(null);
            break;
        case "continue":
            break;
        case "EmEvent":
            switch (args.target) {
                case 'document': {
                    document.fireEvent(args.event);
                    break;
                }
                case 'window': {
                    args.event.target = '';
                    window.fireEvent(args.event);
                    break;
                }
                case 'canvas': {
                    if (args.event) {
                        Module.canvas.fireEvent(args.event);
                    } else if (args.boundingClientRect) {
                        Module.canvas.boundingClientRect = args.boundingClientRect;
                    } else throw 'ey?';
                    break;
                }
            }

            break;
        default:
            throw new Error("Unexpected event in workerEventProcessor.js: " + JSON.stringify(event));
    }
}

var httpRequest = new XMLHttpRequest();
let skipNextCommands = false;

// fetch the latest events
function fetchEvents() {
    let programEvents = null;

    try{
        httpRequest.open("GET", "/programEvents.js", false);
        httpRequest.send(null);

        if (httpRequest.response != "")
            programEvents = JSON.parse(httpRequest.response);
        else
            programEvents = [];

    }
    catch (err){
        console.error("Failed to fetch new events: ", err, httpRequest.response);
    }
    return programEvents;
}

function __sko_process_events(){
    if (terminated)
        return;

    let now = performance.now();

    if (now >= nextEventsCheckTime){
        nextEventsCheckTime = now + minimumEventsCheckInterval;

        let programEvents = fetchEvents();

        try{
            if (programEvents && !skipNextCommands)
                programEvents.forEach(handleEvent);
        }
        catch (err){
            throw err;
        }

        skipNextCommands = false;
    }

    // if keep alive is active and it's been a while since we got a signal...
    if (lastKeepAlive > 0 && lastKeepAlive + 1000 < now) {
        pauseLoop('keepAlive', false);
    }
}

// a busy loop for when paused
function pauseLoop(waitOn, reportContinue=true, handleEvents=true) {
    let paused = true;
    while (paused) {
        let programEvents = fetchEvents();
        if (handleEvents) {
            programEvents.forEach(handleEvent);
        }

        for (let i = 0; i < programEvents.length; i ++) {
            if (programEvents[i][0] == waitOn) {
                lastKeepAlive = performance.now();
                paused = false;
            }
        }
        // TODO: implement a less busy wait by
        // making the service worker delay its
        // response a bit when paused.
    }

    if (reportContinue)
        postCustomMessage({
            type: "ProgramContinued"
        });
}

// FS Event Forwarding
function postFSEvent(data){
    postCustomMessage({type:"FS", message:data});
}

// TODO: de-duplicate this code and the code in executionEnvironment_Internal.js
moduleEvents.addEventListener("onRuntimeInitialized", function() {
    // Attach to file system callbacks
    FSEvents.addEventListener('onMovePath', function(e) {
        postFSEvent({type: "onMovePath", oldPath: e.oldPath, newPath: e.newPath});
    });
    FSEvents.addEventListener('onMakeDirectory', function(e) {
        postFSEvent({type: "onMakeDirectory", path: e.path});
    });
    FSEvents.addEventListener('onDeletePath', function(e) {
        postFSEvent({type: "onDeletePath", path: e.path});
    });
    FSEvents.addEventListener('onOpenFile', function(e) {
        if ((e.flags & 64)==0)
            return;

        postFSEvent({type: "onOpenFile", path: e.path});
    });
});

// ensure we're up to date on events before runnning.
// this way, even if the user's program never calls
// process_events(), we'll still have processed all the
// file commands at least.
Module['onRuntimeInitialized'] = function() {
    moduleEvents.dispatchEvent(new Event("onRuntimeInitialized"));

    __sko_process_events();
}

// setup user program exit event
Module['noExitRuntime'] = false;
Module['onExit'] = function() {
    postCustomMessage({
        type: "ProgramEnded"
    });
}

let inputBuffer = new Array(0);
let inputBufferWasFull = false;

Module['stdin'] = function() {
    if (inputBuffer.length == 0) {
        postCustomMessage({ type: "stdinAwait" });

        pauseLoop('stdin', false, true);
    }

    let character = inputBuffer.splice(0, 1);

    return character[0];
}
