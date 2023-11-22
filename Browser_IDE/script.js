"use strict";

let editorInit = CodeMirror.fromTextArea(document.getElementById("editorInit"), {
    mode: "text/javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
})
editorInit.display.wrapper.classList.add("flex-grow-1");

let width = window.innerWidth
let runInitButton = document.getElementById("runInit")

// Code Running
function runInitialization(){
    eval(editorInit.getValue());
}

// Setup code editor buttons
runInitButton.addEventListener("click", async function () {
    runInitialization();
});