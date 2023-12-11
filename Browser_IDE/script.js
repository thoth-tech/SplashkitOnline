"use strict";

// ------ Setup UI ------

function setupCodeArea(element){
    let editor = CodeMirror.fromTextArea(element, {
        mode: "text/javascript",
        theme: "dracula",
        lineNumbers: true,
        autoCloseBrackets: true,
        styleActiveLine: true,
        extraKeys: {"Ctrl-Space": "autocomplete"},
        hintOptions: {
            alignWithWord: false,
            completeSingle: false,
            useGlobalScope: false,
        },
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
    });

    editor.on('inputRead', (cm, change) => {
        if (!cm.state.completeActive) {
            cm.showHint();
        }
    });
    return editor;
}

let editorInit = setupCodeArea(document.getElementById("editorInit"));
editorInit.display.wrapper.classList.add("flex-grow-1");

let editorMainLoop = setupCodeArea(document.getElementById("editorMainLoop"));

let editors = [editorInit, editorMainLoop]

editorMainLoop.display.wrapper.classList.add("flex-grow-1");

let runInitButton = document.getElementById("runInit");
let runMainLoopButton = document.getElementById("runMainLoop");

let runProgramButton = document.getElementById("runProgram");
let restartProgramButton = document.getElementById("restartProgram");
let stopProgramButton = document.getElementById("stopProgram");
let continueProgramButton = document.getElementById("continueProgram");

// ------ Setup Project and Execution Environment ------
let executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"));
let storedProject = new IDBStoredProject(makeNewProject);
storedProject.attachToProject("Untitled");

let haveMirrored = false;
let canMirror = false;

async function newProject(){
    disableCodeExecution();
    storedProject.detachFromProject();
    canMirror = false;
    executionEnviroment.resetEnvironment();
    await storedProject.deleteProject("Untitled");
    haveMirrored = false;
    await storedProject.attachToProject("Untitled");
}



// File System, File System View Initialization
executionEnviroment.addEventListener("initialized", function() {
    canMirror = true;
    MirrorToExecutionEnvironment();
});

storedProject.addEventListener("attached", async function() {
    MirrorToExecutionEnvironment();
    loadInitialization();
    loadMainLoop();
});

async function MirrorToExecutionEnvironment(){
    if (!haveMirrored && canMirror){
        haveMirrored = true;
        let tree = await storedProject.access((project)=>project.getFileTree());

        async function mirror(tree, path){
            let dirs_files = tree;

            for(let node of dirs_files){
                let abs_path = path+""+node.label;
                if (node.children != null){
                    executionEnviroment.mkdir(abs_path);
                    mirror(node.children, abs_path+"/");
                }
                else{
                    executionEnviroment.writeFile(abs_path, await storedProject.access((project)=>project.readFile(abs_path)));
                }
            }
        }

        await mirror(tree, "/");
        enableCodeExecution();
    }
}



// ------ Code Execution + Saving ------
// TODO: Generalize to multiple code files better.
// There is currently a lot of repetition (for instance, runInitialization/runMainLoop, saveInitialization/saveMainLoop, etc)

let allowExecution = false
let haveUploadedCodeOnce = false;

// Functions to disable/enable code-execution
disableCodeExecution();
function disableCodeExecution(){
    if (executionEnviroment.executionStatus != ExecutionStatus.Unstarted)
        stopProgram();

    allowExecution = false;
    updateButtons();
}
function enableCodeExecution(){
    allowExecution = true;
    updateButtons();
}


// Functions to run the code blocks
function runInitialization(){
    clearErrorLines();

    executionEnviroment.runCodeBlock("GeneralCode", editorInit.getValue());
}

function runMainLoop(){
    clearErrorLines();

    executionEnviroment.runCodeBlock("MainCode", editorMainLoop.getValue());
}

function runAllCodeBlocks(){
    executionEnviroment.runCodeBlocks([
        {name: "GeneralCode", code: editorInit.getValue()},
        {name: "MainCode", code: editorMainLoop.getValue()}
    ]);
}

// Functions to save/load the code blocks
async function saveInitialization(){
    await storedProject.access(async function(project){
        await project.mkdir(codePath);
        await project.writeFile(initCodePath, editorInit.getValue());
    });
}
async function saveMainLoop(){
    await storedProject.access(async function(project){
        await project.mkdir(codePath);
        await project.writeFile(mainLoopCodePath, editorMainLoop.getValue());
    });
}

async function loadInitialization(){
    let newVal = await fileAsString(await storedProject.access(function(project){
        return project.readFile(initCodePath);
    }));
    if (newVal != editorInit.getValue())
        editorInit.setValue(newVal);
}
async function loadMainLoop(){
    let newVal = await fileAsString(await storedProject.access(function(project){
        return project.readFile(mainLoopCodePath);
    }));
    if (newVal != editorMainLoop.getValue())
        editorMainLoop.setValue(newVal);
}

storedProject.addEventListener('onWriteToFile', function(e) {
    if (e.path == initCodePath)
        loadInitialization();
    else if (e.path == mainLoopCodePath)
        loadMainLoop();
});


// Functions to run/pause/continue/stop/restart the program itself
function runProgram(){
    clearErrorLines();

    runAllCodeBlocks();

    executionEnviroment.runProgram();
}

async function continueProgram(){
    clearErrorLines();

    await executionEnviroment.continueProgram();
}

async function pauseProgram(){
    await executionEnviroment.pauseProgram();
}

async function stopProgram(){
    await executionEnviroment.stopProgram();
}

async function restartProgram(){
    clearErrorLines();

    if (executionEnviroment.executionStatus != ExecutionStatus.Unstarted)
        await executionEnviroment.stopProgram(); // Make sure we wait for it to stop via await.
    executionEnviroment.cleanEnvironment();

    runAllCodeBlocks();

    executionEnviroment.runProgram();
}

// ------ Setup code editor buttons ------

// Updates buttons based on the state of the ExecutionEnvironment
function updateButtons(){
    runInitButton.disabled = !allowExecution;
    runMainLoopButton.disabled = !allowExecution;

    let runProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Unstarted && !executionEnviroment.hasRunOnce;
    let continueProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Paused
    let restartProgramButtonOn = executionEnviroment.hasRunOnce;
    let stopProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Running;

    runProgramButton.disabled = !(allowExecution && runProgramButtonOn);
    continueProgramButton.disabled = !(allowExecution && continueProgramButtonOn);
    restartProgramButton.disabled = !(allowExecution && restartProgramButtonOn);
    stopProgramButton.disabled = !(allowExecution && stopProgramButtonOn);

    runProgramButton.style.display = !runProgramButtonOn?"none":"";
    continueProgramButton.style.display = !continueProgramButtonOn?"none":"";
    restartProgramButton.style.display = !restartProgramButtonOn?"none":"";
    stopProgramButton.style.display = !stopProgramButtonOn?"none":"";
}
updateButtons();


// Add events for the code blocks
runInitButton.addEventListener("click", async function () {
    saveInitialization();
    runInitialization();
});

runMainLoopButton.addEventListener("click", async function () {
    saveMainLoop();
    runMainLoop();
});


// Add events for the main program buttons
runProgramButton.addEventListener("click", async function () {
    saveMainLoop();
    saveInitialization();
    runProgram();
});

stopProgramButton.addEventListener("click", async function () {
    pauseProgram();
});

restartProgramButton.addEventListener("click", async function () {
    saveMainLoop();
    saveInitialization();
    restartProgram();
});

continueProgramButton.addEventListener("click", async function () {
    saveMainLoop();
    saveInitialization();
    continueProgram();
});


// Utility function for saving/loading the code blocks
async function fileAsString(buffer){
    return new Promise((resolve,error) => {
        //_arrayBufferToString from https://stackoverflow.com/a/14078925
        // Thanks Will Scott!
        function _arrayBufferToString(buffer) {
            var bb = new Blob([new Uint8Array(buffer)]);
            var f = new FileReader();
            f.onload = function(e) {
                resolve(e.target.result);
            };
            f.readAsText(bb);
        }
        if (typeof buffer === 'string' || buffer instanceof String)
            resolve(buffer);
        else
            return _arrayBufferToString(buffer);
    });
}


// ------ Project Zipping/Unzipping Functions ------
async function projectFromZip(file){
    await JSZip.loadAsync(file)
    .then(async function(zip) {
        zip.forEach(async function (rel_path, zipEntry) {
            let abs_path = "/"+rel_path;
            if (zipEntry.dir){
                abs_path = abs_path.substring(0, abs_path.length-1);

                executionEnviroment.mkdir(abs_path);
                storedProject.access((project)=>project.mkdir(abs_path));
            }
            else{
                let uint8_view = await zip.file(rel_path).async("uint8array");
                executionEnviroment.writeFile(abs_path, uint8_view);
                storedProject.access((project)=>project.writeFile(abs_path, uint8_view));
            }
        });
    });
}

async function projectToZip(){
    let zip = new JSZip();

    let tree = await storedProject.access((project)=>project.getFileTree());

    async function addFolderToZip(tree, path, zip){
        let dirs_files = tree;

        for(let node of dirs_files){
            let abs_path = path+""+node.label;
            if (node.children != null){
                addFolderToZip(node.children, abs_path+"/", zip.folder(node.label));
            }
            else{
                zip.file(node.label, storedProject.access((project)=>project.readFile(abs_path)), {base64: false});
            }
        }
    }

    await addFolderToZip(tree, "/",zip);
    return zip.generateAsync({type:"blob"});
}


// ------ File System Upload/Download Functions ------
let reader = null;
function uploadFileFromInput(){
    reader= new FileReader();
    let files = document.getElementById('fileuploader').files;
    let file = files[0]; // maybe should handle multiple at once?
    reader.addEventListener('loadend', function(e){
        let result = reader.result;
        const uint8_view = new Uint8Array(result);

        let path = document.getElementById('fileuploader').dataset.uploadDirectory;
        storedProject.access((project)=>project.writeFile(path+"/"+file.name, uint8_view));
        executionEnviroment.writeFile(path+"/"+file.name, uint8_view);
    });
    reader.readAsArrayBuffer(file);
}

// Thanks Lucas Vinicius Hartmann! - https://stackoverflow.com/a/54468787
// for FSviewFile and downloadFile - somewhat modified
function downloadFileGeneric(content, filename, mime) {
    mime = mime || "application/octet-stream";

    let a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(new Blob([content], {type: mime}));
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }, 2000);
}
async function FSviewFile(filename, mime) {
    mime = mime || "application/octet-stream";

    let content = await storedProject.access((project)=>project.readFile(filename));

    let url = URL.createObjectURL(new Blob([content], {type: mime}));

    window.open(url+"#"+filename);
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
}
async function FSdownloadFile(filename, mime) {
    let content = await storedProject.access((project)=>project.readFile(filename));

    downloadFileGeneric(content, filename, mime);
}


async function downloadProject(){
    downloadFileGeneric(await projectToZip(), "project.zip");
}



// ------ Project Zipping/Unzipping Click Handling ------
async function uploadProjectFromInput(){
    let reader = new FileReader();
    let files = document.getElementById('projectuploader').files;
    let file = files[0];
    await newProject();
    projectFromZip(file);
}
document.getElementById("DownloadProject").addEventListener("click", async function (e) {
    downloadProject();
    e.stopPropagation();
});
document.getElementById("UploadProject").addEventListener("click", function (e) {
    document.getElementById("projectuploader").click();
    e.stopPropagation();
});
document.getElementById("NewProject").addEventListener("click", async function (e) {
    newProject();
    e.stopPropagation();
});

// ----- Program Runtime & Error Reporting -----
function clearErrorLines(){
    for (let editor of editors){
        for (var i = 0; i < editor.lineCount(); i++) {
            editor.removeLineClass(i, "wrap", "error-line");
        }
    }
}

// Update buttons when the state of the ExecutionEnvironment changes
executionEnviroment.addEventListener("programStarted", function(e){
    updateButtons();
});
executionEnviroment.addEventListener("programContinued", function(e){
    updateButtons();
});
executionEnviroment.addEventListener("programStopped", function(e){
    updateButtons();
});
executionEnviroment.addEventListener("programPaused", function(e){
    updateButtons();
});
executionEnviroment.addEventListener("programStopped", function(e){
    updateButtons();
});

// Also highlight errors when they come
executionEnviroment.addEventListener("error", function(e){
    let editor = (e.block=="GeneralCode"?editorInit:editorMainLoop);
    if (e.line != null){
        editor.addLineClass(e.line-1, "wrap", "error-line");
        editor.scrollIntoView({line:e.line-1, char:0}, 200);
        editor.setCursor({line:e.line-1, char:0});
    }
    editor.focus();
});