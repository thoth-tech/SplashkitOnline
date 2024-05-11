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
            throw new Error("Unexpected event in workerEventProcessor.js: ", event);
    }
}

var httpRequest = new XMLHttpRequest();
let skipNextCommands = true;

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
function pauseLoop(waitOn, reportContinue=true) {
    let paused = true;
    while (paused) {
        let programEvents = fetchEvents();
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

// setup user program exit event
Module['noExitRuntime'] = false;
Module['onExit'] = function() {
    postCustomMessage({
        type: "ProgramEnded"
    });
}

// Clear event buffer
// Skip first set of commands, they may be old data
skipNextCommands = true;
__sko_process_events();