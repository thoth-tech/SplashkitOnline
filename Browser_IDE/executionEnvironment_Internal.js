"use strict";

let isInitialized = false;

moduleEvents.addEventListener("onRuntimeInitialized", function() {
    // Patch open_window so that it cannot be called multiple times.
    // So far all other functions handle being re-called acceptably,
    // whereas when open_window is called enough, rendering stops working.
    // TODO: Update window size if subsequent calls give a different size
    let original_open_window = open_window;
    open_window = function(name, w, h){
        original_open_window(name, w, h);
        open_window = function(name, w, h){
            console.log("Window already open, ignoring calling to open_window");
        }
    }

    // Patch screen_refresh to await a screen refresh, to unblock
    // 'main' while loops and give the browser time to process the UI.
    // See executionEnvironment_CodeProcessor.js for plenty of detail.
    let original_refresh_screen = refresh_screen;
    refresh_screen = async function (){
        original_refresh_screen();
        await asyncifyScreenRefresh();
    }
    let original_refresh_screen_with_target_fps = refresh_screen_with_target_fps;
    refresh_screen_with_target_fps = async function (target_fps){
        original_refresh_screen_with_target_fps(target_fps);
        await asyncifyScreenRefresh();
    }

    isInitialized = true;
});

// Convenience function for reporting errors, printing them to the terminal
// and also sending a message to the main window.
function ReportError(block, message, line){
    document.getElementById("output").value += "("+block+") "+message+"\n";
    parent.postMessage({
        type: "error",
        block: block,
        message: message,
        line: line
    },"*");
}

// ------ Code Running ------
function ResetExecutionScope(){
    for (let decl of findGlobalDeclarationsTransform__userScope){
        delete window[decl];
    }
}

async function tryRunFunction_Internal(func) {
    try{
        let run = null;
        run = await func();
        return{
            state: "success",
            value: run
        };
    }
    catch(err){
        if (err instanceof ForceBreakLoop){
            return{
                state: "stopped",
                value: run
            };
        }


        // Parse the non-standard exceptions stack with a regex,
        // that returns file and line number.
        // For reference, here's some example stacks:
// Firefox:
/*
gameInnerLoop@Init.js`;:25:25
main@Main.js`;:25:11
async*tryRunFunction_Internal@http://localhost:8000/executionEnvironment_Internal.js:57:21
tryRunFunction@http://localhost:8000/executionEnvironment_Internal.js:89:21
runProgram@http://localhost:8000/executionEnvironment_Internal.js:132:15
@http://localhost:8000/executionEnvironment_Internal.js:167:9
EventListener.handleEvent*@http://localhost:8000/executionEnvironment_Internal.js:144:8
*/

// Edge/Chrome/Probably anything using V8
/*
ReferenceError: test is not defined
    at gameInnerLoop (Init.js`;:24:33)
    at main (Main.js`;:25:11)
    at async tryRunFunction_Internal (executionEnvironment_Internal.js:57:15)
    at async tryRunFunction (executionEnvironment_Internal.js:89:15)
    at async :8000/runProgram (http://localhost:8000/executionEnvironment_Internal.js:132:9)}
    at gameInnerLoop (Init.js`;:25:7)
*/
        // Currently those are the only two forms supported, but this should account for the majority well enough.
        // It also doesn't parse the url style ones - it only needs to work for the local user's code, so good enough.

        const stackParse = /(?:@|\()([^;:`]*)`?;?:([0-9]*)/g;
        let stack = [...err.stack.matchAll(stackParse)];
        let lineNumber = null;

        lineNumber = stack[0][2];
        let message = "Error on line "+lineNumber+": "+err;
        return{
            state: "error",
            message: message,
            line: lineNumber,
            block: stack[0][1],
        };
    }
}

// Run a function
async function tryRunFunction(func, reportError = true){
    let res = await tryRunFunction_Internal(func);
    if (res.state == "error"){
        stopProgram();
        ReportError(res.block, res.message, res.line);
    }
    return res;
}
async function tryEvalSource(block, source, reportError = true){
    return await tryRunFunction(function(){
        (0,eval)("\"use strict\";"+source+"\n//# sourceURL="+block+"`;");
    }, reportError);
}

let mainIsRunning = false;

// Signals for the asynchronous code.
let mainLoopStop = false; // True triggers it to throw a ForceBreakLoop exception
let mainLoopPause = false; // True triggers it to pause, and set mainLoopContinuer
let mainLoopContinuer = null; // Once set, calling it will unpause the program.

function onProgramPause(){
    parent.postMessage({type:"programPaused"},"*");
}

function pauseProgram(){
    mainLoopPause = true;
}
function continueProgram(){
    if (mainLoopContinuer != null){
        mainLoopContinuer();
        parent.postMessage({type:"programContinued"},"*");
    }
}
async function runProgram(){
    if (window.main === undefined){
        ReportError("Program", "There is no main() function to run!", null);
        return;
    }
    if (!mainIsRunning){
        mainLoopStop = false;

        mainIsRunning = true;
        parent.postMessage({type:"programStarted"},"*");
        await tryRunFunction(window.main);
        mainIsRunning = false;
        parent.postMessage({type:"programStopped"},"*");
    }
}

function stopProgram(){
    continueProgram();
    mainLoopStop = true;
}

// ------ Message Listening ------
window.addEventListener('message', function(m){

    // --- Code Execution Functions ---
    if (m.data.type == "RunCodeBlock"){
        let processedCode = "";
        try {
            processedCode = processCodeForExecutionEnvironment(m.data.code, "mainLoopStop", "mainLoopPause", "mainLoopContinuer", "onProgramPause");

            tryEvalSource(m.data.name, processedCode);
        }
        catch(e) {
            // If we got a syntax error, we prefer the browser's messages over Babel's - they're more user friendly.
            // Attempt to eval the code (knowing it has a syntax error) so we get the browser's message.
            tryEvalSource(m.data.name, m.data.code);
            // TODO: Check that it didn't actually run by accident. Perhaps add a deliberate syntax error at the end?
        }
    }

    if (m.data.type == "CleanEnvironment"){
        ResetExecutionScope();
    }

    if (m.data.type == "RunProgram"){
        runProgram();
    }
    if (m.data.type == "PauseProgram"){
        pauseProgram();
    }
    if (m.data.type == "ContinueProgram"){
        continueProgram();
    }
    if (m.data.type == "StopProgram"){
        stopProgram();
    }

    // --- FS Handling ---
    if (m.data.type == "mkdir"){
        try{
            FS.mkdir(m.data.path);
        }
        catch{}
    }

    if (m.data.type == "writeFile"){
        FS.writeFile(m.data.path,m.data.data);
    }

    if (m.data.type == "rename"){
        FS.rename(m.data.oldPath,m.data.newPath);
    }

}, false);

// FS Event Forwarding
function postFSEvent(data){
    parent.postMessage({type:"FS", message:data},"*");
}

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

    parent.postMessage({type:"initialized"},"*");
});