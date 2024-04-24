"use strict";

let userCodeBlockIdentifier = "__USERCODE__";
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


let isInitialized = false;

moduleEvents.addEventListener("onRuntimeInitialized", function() {

    // Patch screen_refresh to await a screen refresh, to unblock
    // 'main' while loops and give the browser time to process the UI.
    // See executionEnvironment_CodeProcessor.js for plenty of detail.
    let original_refresh_screen = refresh_screen;
    refresh_screen = async function (...args){
        original_refresh_screen(...args);

        let target_fps = undefined;
        if (args[0] != undefined)
            target_fps = args[0];
        // Heuristic - only yield to browser if the
        // user is aiming for less than 90fps.
        // That way it runs as fast as possible if
        // not restricted, as it does natively.
        // It will still yield eventually thanks
        // to the automatic loop yielding inserted
        // during code processing
        if (target_fps!=undefined && target_fps<90)
            await asyncifyScreenRefresh();
    }

    delay = function(milliseconds){
        return new Promise((re) => setTimeout(re, milliseconds));
    }

    // In case function overloads are disabled
    if (window.refresh_screen_with_target_fps != undefined){
        let original_refresh_screen_with_target_fps = refresh_screen_with_target_fps;
        refresh_screen_with_target_fps = async function (...args){
            original_refresh_screen_with_target_fps(...args);
            await asyncifyScreenRefresh();
        }
    }


    // Keep track of registered notifiers, so we can
    // de-register them when doing a clean.
    // In the future we could perhaps have a deregister_all_callbacks()
    // in-built, which would remove the need for this.
    let key_down_callbacks = new Set();
    let key_typed_callbacks = new Set();
    let key_up_callbacks = new Set();
    let free_notifier_callbacks = new Set();
    let sprite_event_callbacks = new Set();

    let original_register_callback_on_key_down = register_callback_on_key_down;
    register_callback_on_key_down = function(...args){
        original_register_callback_on_key_down(...args);
        key_down_callbacks.add((args[0]));
        console.log(key_down_callbacks);
    }
    let original_register_callback_on_key_typed = register_callback_on_key_typed;
    register_callback_on_key_typed = function(...args){
        original_register_callback_on_key_typed(...args);
        key_typed_callbacks.add((args[0]));
    }
    let original_register_callback_on_key_up = register_callback_on_key_up;
    register_callback_on_key_up = function(...args){
        original_register_callback_on_key_up(...args);
        key_up_callbacks.add((args[0]));
    }
    let original_register_free_notifier = register_free_notifier;
    register_free_notifier = function(...args){
        original_register_free_notifier(...args);
        free_notifier_callbacks.add((args[0]));
    }
    let original_call_on_sprite_event = call_on_sprite_event;
    call_on_sprite_event = function(...args){
        original_call_on_sprite_event(...args);
        sprite_event_callbacks.add((args[0]));
    }

    let original_deregister_callback_on_key_down = deregister_callback_on_key_down;
    deregister_callback_on_key_down = function(...args){
        original_deregister_callback_on_key_down(...args);
        key_down_callbacks.delete((args[0]));
    }
    let original_deregister_callback_on_key_typed = deregister_callback_on_key_typed;
    deregister_callback_on_key_typed = function(...args){
        original_deregister_callback_on_key_typed(...args);
        key_typed_callbacks.delete((args[0]));
    }
    let original_deregister_callback_on_key_up = deregister_callback_on_key_up;
    deregister_callback_on_key_up = function(...args){
        original_deregister_callback_on_key_up(...args);
        key_up_callbacks.delete((args[0]));
    }
    let original_deregister_free_notifier = deregister_free_notifier;
    deregister_free_notifier = function(...args){
        original_deregister_free_notifier(...args);
        free_notifier_callbacks.delete((args[0]));
    }
    let original_stop_calling_on_sprite_event = stop_calling_on_sprite_event;
    stop_calling_on_sprite_event = function(...args){
        original_stop_calling_on_sprite_event(...args);
        sprite_event_callbacks.delete((args[0]));
    }

    window.deregister_all_callbacks = function deregister_all_callbacks(){
        for (let callback of                key_down_callbacks)
            original_deregister_callback_on_key_down(callback);

        for (let callback of               key_typed_callbacks)
            original_deregister_callback_on_key_typed(callback);

        for (let callback of                key_up_callbacks)
            original_deregister_callback_on_key_up(callback);

        for (let callback of    free_notifier_callbacks)
            original_deregister_free_notifier(callback);

        for (let callback of      sprite_event_callbacks)
            original_stop_calling_on_sprite_event(callback);

        key_down_callbacks.clear();
        key_typed_callbacks.clear();
        key_up_callbacks.clear();
        free_notifier_callbacks.clear();
        sprite_event_callbacks.clear();
    }


    isInitialized = true;
});

// Convenience function for reporting errors, printing them to the terminal
// and also sending a message to the main window.
function ReportError(block, message, line){
    if (line != null)
        message = "Error on line "+line+": "+message;

    if (!block.startsWith(userCodeBlockIdentifier)){
        message = "Please file a bug report and send us the following info!\n    Error in file: "+block+"\n    "+message;
        block = "Internal Error";
    }
    else{
        block = block.slice(userCodeBlockIdentifier.length);
    }

    document.getElementById("output").value += "("+block+") "+message+"\n";
    parent.postMessage({
        type: "error",
        block: block,
        message: message,
        line: line
    },"*");
}

// ------ Code Running ------
let finishResetNextRun = false;
function ResetExecutionScope(){
    for (let decl of findGlobalDeclarationsTransform__userScope){
        try{
            delete window[decl];
        }
        catch(err){
            console.log(err);
        }
    }
    // Make sure we free bundles first - will try to double free otherwise and throw warnings
    free_all_resource_bundles();
    free_all_music();
    free_all_sound_effects();
    //free_all_timers(); // Seems to also double up on freeing?
    free_all_json();
    free_all_animation_scripts();
    free_all_bitmaps();
    free_all_fonts();
    free_all_query_results();
    free_all_databases();
    //free_all_sprite_packs(); // Calling free_all_sprite_packs makes free_all_sprites attempt to double free and throw warnings
    free_all_sprites();
    close_all_connections();
    close_all_servers();
    deregister_all_callbacks();
    finishResetNextRun = true;
    // We should also close_all_windows() here,
    // but this causes visible flicker before the next window is created.
    // Let's wait until the program is run next, and
    // close all windows then. If the user creates the window before
    // any loops, it will be entirely synchronous and there will be
    // little/no flicker.
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

function parseErrorStack(err){
    const stackParse = /(?:@|\()((?:[^;:`]|[:;`](?=.*(?:\/|\.)))*)`?;?:([0-9]*)/g;
    let stack = [...err.stack.matchAll(stackParse)];

    let stackIndex = 0;

    //Should we limit this to only SplashKitArgumentError? (i.e if (err instanceof SplashKitArgumentError))

	// Unwind stack until we find user code:
	while(stackIndex < stack.length && !stack[stackIndex][1].startsWith(userCodeBlockIdentifier))
		stackIndex += 1;

    if (stackIndex >= stack.length)
        stackIndex = 0;

    let lineNumber = stack[stackIndex][2];

    let file = stack[stackIndex][1];

    if (file.startsWith(userCodeBlockIdentifier))
        lineNumber -= userCodeStartLineOffset;

    return {lineNumber, file};
}


async function tryRunFunction_Internal(func) {
    try{
        let run = null;
        // If we are running the user's main,
        // finishing resetting the environment
        if (func == window.main){
            if (finishResetNextRun)
                close_all_windows();
            finishResetNextRun = false;
        }
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

        let error = parseErrorStack(err);

        return{
            state: "error",
            message: err,
            line: error.lineNumber,
            block: error.file,
        };
    }
}

// Run a function
async function tryRunFunction(func){
    let res = await tryRunFunction_Internal(func);
    if (res.state == "error"){
        stopProgram();
        ReportError(res.block, res.message, res.line);
    }
    return res;
}

// This function will attempt to create an AsyncFunction from the user's source code.
// This should pass, as the user's code was already syntax checked earlier outside the iFrame.
// But just in case, check it anyway.
async function createEvalFunctionAndSyntaxCheck(block, source){
    let res = await tryRunFunction_Internal(function (){
        return Object.getPrototypeOf(async function() {}).constructor(
            "\"use strict\";"+source+"\n//# sourceURL="+userCodeBlockIdentifier+block
        );
    });
    if (res.state == "error"){
        ReportError(res.block, res.message, res.line);
    }
    return res;
}

async function tryEvalSource(block, source){
    // First create and syntax check the function
    let blockFunction = await createEvalFunctionAndSyntaxCheck(block, source);

    if (blockFunction.state != "success")
        return blockFunction;

    return await tryRunFunction(
        blockFunction.value,
    );
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
    if (window.main === undefined || !(window.main instanceof Function)){
        ReportError(userCodeBlockIdentifier+"Program", "There is no main() function to run!", null);
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
            // At this point, the code has already been syntax checked outside of the iFrame, so we
            // should have no trouble here.
            processedCode = processCodeForExecutionEnvironment(m.data.code, "mainLoopStop", "mainLoopPause", "mainLoopContinuer", "onProgramPause");

            tryEvalSource(m.data.name, processedCode);
        }
        catch(e) {
            // If we got a syntax error from Babel, we know the browser can't return a more user friendly
            // one since it didn't report one initially. So for now just report Unknown error.
            // TODO: Report Babel's syntax error.
            ReportError(userCodeBlockIdentifier+m.data.name, "Unknown syntax error.", null);
        }
    }

    if (m.data.type == "ReportError"){
        ReportError(userCodeBlockIdentifier + m.data.block, m.data.message, m.data.line);
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

    if (m.data.type == "unlink"){
        FS.unlink(m.data.path);
    }
    
    if (m.data.type == "rmdir"){
        if(m.data.recursive){
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
            deleteContentsRecursive(m.data.path);
            FS.rmdir(m.data.path);
			// FS.rmdir expects the directory to be empty
			// and will throw an error if it is not.
        } else {
            FS.rmdir(m.data.path);
        }
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