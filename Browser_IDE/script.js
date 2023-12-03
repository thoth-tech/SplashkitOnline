"use strict";

// ------ Setup UI ------
let editorInit = CodeMirror.fromTextArea(document.getElementById("editorInit"), {
    mode: "text/javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
});
editorInit.display.wrapper.classList.add("flex-grow-1");

let editorMainLoop = CodeMirror.fromTextArea(document.getElementById("editorMainLoop"), {
    mode: "text/javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
});
editorMainLoop.display.wrapper.classList.add("flex-grow-1");

let width = window.innerWidth;
let runInitButton = document.getElementById("runInit");
let runMainLoopButton = document.getElementById("runMainLoop");
let pauseMainLoopButton = document.getElementById("pauseMainLoop");

// ------ Setup Project and Execution Environment ------
let executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"));
let storedProject = new IDBStoredProject(makeNewProject);
storedProject.attachToProject("Untitled");

let haveMirrored = false;
let canMirror = false;
async function newProject(){
    disableCodeExecution();
    storedProject.detach();
    canMirror = false;
    executionEnviroment.resetEnvironment();
    await storedProject.deleteProject("Untitled");
    haveMirrored = false;
    await storedProject.attachToProject("Untitled");
}

// File System and File System View Initialization
executionEnviroment.addEventListener("initialized", function() {
    canMirror = true;
    MirrorToExecutionEnvironment();
});

storedProject.addEventListener("initialized", async function() {
    MirrorToExecutionEnvironment();
    loadInitialization();
    loadMainLoop();
});


async function MirrorToExecutionEnvironment(){
    if (!haveMirrored && canMirror){
        haveMirrored = true;
        let tree = await storedProject.getFileTree();

        async function mirror(tree, path){
            let dirs_files = tree;

            for(let node of dirs_files){
                let abs_path = path+""+node.label;
                if (node.children != null){
                    executionEnviroment.mkdir(abs_path);
                    mirror(node.children, abs_path+"/");
                }
                else{
                    executionEnviroment.writeFile(abs_path, await storedProject.readFile(abs_path));
                }
            }
        }

        await mirror(tree, "/");
        enableCodeExecution();
    }
}



// ------ Code Execution + Saving ------
disableCodeExecution();
function disableCodeExecution(){
    stopMainLoop();
    runInitButton.disabled = true;
    pauseMainLoopButton.disabled = true;
    runMainLoopButton.disabled = true;
}
function enableCodeExecution(){
    runInitButton.disabled = false;
    pauseMainLoopButton.disabled = true;
    runMainLoopButton.disabled = false;
}

function runInitialization(){
    clearErrorLines(editorInit);
    executionEnviroment.runCodeBlock("Init", editorInit.getValue());
}

function runMainLoop(){
    clearErrorLines(editorMainLoop);
    executionEnviroment.runCodeBlock("Main", editorMainLoop.getValue());
}

function stopMainLoop(){
    executionEnviroment.stop();
}

async function saveInitialization(){
    await storedProject.mkdir(codePath);
    await storedProject.writeFile(initCodePath, editorInit.getValue());
}
async function saveMainLoop(){
    await storedProject.mkdir(codePath);
    await storedProject.writeFile(mainLoopCodePath, editorMainLoop.getValue());
}

async function loadInitialization(){
    let newVal = await fileAsString(await storedProject.readFile(initCodePath));
    if (newVal != editorInit.getValue())
        editorInit.setValue(newVal);
}
async function loadMainLoop(){
    let newVal = await fileAsString(await storedProject.readFile(mainLoopCodePath));
    if (newVal != editorMainLoop.getValue())
        editorMainLoop.setValue(newVal);
}
storedProject.addEventListener('onWriteToFile', function(e) {
    if (e.path == initCodePath)
        loadInitialization();
    else if (e.path == mainLoopCodePath)
        loadMainLoop();
});

// ------ Setup code editor buttons ------
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
                storedProject.mkdir(abs_path);
            }
            else{
                let uint8_view = await zip.file(rel_path).async("uint8array");
                executionEnviroment.writeFile(abs_path, uint8_view);
                storedProject.writeFile(abs_path, uint8_view);
            }
        });
    });
}

async function projectToZip(){
    let zip = new JSZip();

    let tree = await storedProject.getFileTree();

    async function addFolderToZip(tree, path, zip){
        let dirs_files = tree;

        for(let node of dirs_files){
            let abs_path = path+""+node.label;
            if (node.children != null){
                addFolderToZip(node.children, abs_path+"/", zip.folder(node.label));
            }
            else{
                zip.file(node.label, storedProject.readFile(abs_path), {base64: false});
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
        storedProject.writeFile(path+"/"+file.name, uint8_view);
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

    let content = await storedProject.readFile(filename);

    let url = URL.createObjectURL(new Blob([content], {type: mime}));

    window.open(url+"#"+filename);
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
}
async function FSdownloadFile(filename, mime) {
    let content = await storedProject.readFile(filename);

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

// ----- Error Reporting -----
function clearErrorLines(editor){
    for (var i = 0; i < editor.lineCount(); i++) {
        editor.removeLineClass(i, "wrap", "error-line");
    }
}

executionEnviroment.addEventListener("error", function(e){
    let editor = (e.block=="Init"?editorInit:editorMainLoop);
    if (e.line != null){
        editor.addLineClass(e.line-1, "wrap", "error-line");
        editor.scrollIntoView({line:e.line-1, char:0}, 200);
        editor.setCursor({line:e.line-1, char:0});
    }
    editor.focus();
    pauseMainLoopButton.disabled = true;
});