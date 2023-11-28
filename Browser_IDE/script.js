"use strict";

let editorInit = CodeMirror.fromTextArea(document.getElementById("editorInit"), {
    mode: "text/javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
})
editorInit.display.wrapper.classList.add("flex-grow-1");

let editorMainLoop = CodeMirror.fromTextArea(document.getElementById("editorMainLoop"), {
    mode: "text/javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
})
editorMainLoop.display.wrapper.classList.add("flex-grow-1");

let width = window.innerWidth
let runInitButton = document.getElementById("runInit")
let runMainLoopButton = document.getElementById("runMainLoop")
let pauseMainLoopButton = document.getElementById("pauseMainLoop")

// Code Running
let runMainLoopGo = false;
let mainLoopCode = "";
let mainLoop = function(){
    eval(mainLoopCode);
    if (runMainLoopGo)
        window.requestAnimationFrame(mainLoop);
}


function runInitialization(){
    eval(editorInit.getValue());
}

function runMainLoop(){
    runMainLoopGo = true;
    mainLoopCode = editorMainLoop.getValue();
    window.requestAnimationFrame(mainLoop);
}

function stopMainLoop(){
    runMainLoopGo = false;
}

let initCodePath = "/code/codeblock_init.js"
let mainLoopCodePath = "/code/codeblock_mainloop.js"
function makeCodeFolder(){
    try{
        FS.mkdir("/code");
    }
    catch {}
}
function saveInitialization(){
    makeCodeFolder();
    FS.writeFile(initCodePath, editorInit.getValue());
}
function saveMainLoop()
{
    makeCodeFolder();
    FS.writeFile(mainLoopCodePath, editorMainLoop.getValue());
}

function loadInitialization(){
    editorInit.setValue(FS.readFile(initCodePath, {encoding: 'utf8'}));
}
function loadMainLoop()
{
    editorMainLoop.setValue(FS.readFile(mainLoopCodePath, {encoding: 'utf8'}));
}
FSEvents.addEventListener('onWriteToFile', function(e) {
    if (e.path == initCodePath)
        loadInitialization();
    else if (e.path == mainLoopCodePath)
        loadMainLoop();
});

// Setup code editor buttons
pauseMainLoopButton.disabled = true;

runInitButton.addEventListener("click", async function () {
    saveInitialization();
    runInitialization();
});

runMainLoopButton.addEventListener("click", async function () {
    saveMainLoop();
    runMainLoop();
    pauseMainLoopButton.disabled = false;
});

pauseMainLoopButton.addEventListener("click", async function () {
    stopMainLoop();
    runMainLoopButton.disabled = false;
    pauseMainLoopButton.disabled = true;
});