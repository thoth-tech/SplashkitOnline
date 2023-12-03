"use strict";

let isInitialized = false;

moduleEvents.addEventListener("onRuntimeInitialized", function() {
    isInitialized = true;
});


// ------ Code Running ------
let scope;
function ResetExecutionScope(){
    scope = Execution_Scope();
    scope.next();
}
ResetExecutionScope();

function run_within_scope(block, source){
    let res = scope.next(source);
}

let runMainLoopGo = false;
let runInitCodeOnLoad = false;

let initCode = "";
let mainLoopCode = "";

let mainLoop = function(){
    run_within_scope("Main", mainLoopCode);
    if (runMainLoopGo)
        window.requestAnimationFrame(mainLoop);
}

function runMainLoop(loopCode){
    mainLoopCode = loopCode;
    if (!runMainLoopGo)
        window.requestAnimationFrame(mainLoop);
    runMainLoopGo = true;
}

function stopMainLoop(){
    runMainLoopGo = false;
}



// ------ Message Listening ------
window.addEventListener('message', function(m){

    // Code Running
    if (m.data.type == "InitCode"){
        ResetExecutionScope();
        initCode = m.data.code;
        if (isInitialized){
            run_within_scope("Init", initCode);
        }
        else{
            runInitCodeOnLoad = true;
        }
    }

    if (m.data.type == "RunMainLoop"){
        runMainLoop(m.data.code);
    }

    if (m.data.type == "StopMainLoop"){
        stopMainLoop();
    }

    // FS Handling
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


moduleEvents.addEventListener("onRuntimeInitialized", function() {
    if (runInitCodeOnLoad)
        run_within_scope("Init", initCode);
});


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