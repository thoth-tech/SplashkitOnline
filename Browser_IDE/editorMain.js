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
editorInit.display.wrapper.classList.add("sk-contents");

let editorMainLoop = setupCodeArea(document.getElementById("editorMainLoop"));
editorMainLoop.display.wrapper.classList.add("sk-contents");

let editors = [editorInit, editorMainLoop]

let updateCodeButton = document.getElementById("runInit");

let runProgramButton = document.getElementById("runProgram");
let restartProgramButton = document.getElementById("restartProgram");
let stopProgramButton = document.getElementById("stopProgram");
let continueProgramButton = document.getElementById("continueProgram");

var sizes = localStorage.getItem('sk-online-split-sizes')

if (sizes) {
    sizes = JSON.parse(sizes)
} else {
    sizes = [20, 50, 30]
}
// Create the splitters.
// One problem is that they are too visible.
// The 'gutter' option lets you provide a function that handles
// creating the gutter, but unfortunately it adds the events
// on whatever you return, making it difficult to create a wrapper
// that lets the events pass through to the real gutter
let gutterWidth = 6;
Split(['#fileViewContainer', '#codeViewContainer', '#runtimeContainer'], {
    gutterSize: gutterWidth,
    sizes: sizes,
    onDragEnd: function (sizes) {
        localStorage.setItem('sk-online-split-sizes', JSON.stringify(sizes));
    },
});
// So just wrap them and hide them afterwards instead
const gutters = document.getElementsByClassName("gutter");
for (let i = 0; i < gutters.length; i++) {
    let gutterwrap = document.createElement('div')//wrapper
    gutterwrap.style.position = 'relative';

    // wrap
    gutters[i].parentNode.insertBefore(gutterwrap, gutters[i]);
    gutterwrap.appendChild(gutters[i]);

    // fix position
    gutters[i].style.position = 'absolute';
    gutters[i].style.left = "-"+(gutterWidth/2).toString()+"px";
    gutters[i].style.height = '100%';
}

// -------------------- Setup Tabs --------------------
// Right now this is all a bit hardcoded, but in the near future hopefully
// this will be abstracted out, and be dynamically openable/closeable
let tabs = []
let currentTab = null;

function SwitchToTabs(tabName){
    for (let i = 0; i < tabs.length; i ++) {
        if (tabs[i].contents.id == tabName) {
            tabs[i].contents.style.display = 'flex';
            tabs[i].tab.classList.add('sk-tabs-active');

            currentTab = tabs[i];
        }
        else {
            tabs[i].contents.style.display = 'none';
            tabs[i].tab.classList.remove('sk-tabs-active');
        }
    }

    for (let i = 0; i < editors.length; i ++) {
        editors[i].refresh();
    }
}

let tabElems = document.getElementById("codeViewTabs").children;
for (let i = 0; i < tabElems.length; i++) {
    let tabElem = tabElems[i];

    tabs.push({
        tab: tabElem,
        contents: document.getElementById(tabElem.dataset.tab)
    });

    tabElem.addEventListener('click', function(){
        SwitchToTabs(tabElem.dataset.tab);
    })
}

SwitchToTabs(tabs[0].contents.id);

// ------ Setup Project and Execution Environment ------
let executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"));
let appStorage = new AppStorage();
appStorage.attach();
let storedProject = new IDBStoredProject(appStorage, makeNewProject);
let unifiedFS = new UnifiedFS(storedProject, executionEnviroment);
storedProject.attachToProject();

let haveMirrored = false;
let canMirror = false;

let makingNewProject = false;
async function newProject(){
    // Guard against re-entry on double click
    if (makingNewProject)
        return;
    makingNewProject = true;

    let projectID = storedProject.projectID;

    disableCodeExecution();
    storedProject.detachFromProject();
    canMirror = false;
    await executionEnviroment.resetEnvironment();
    await storedProject.deleteProject(projectID);
    haveMirrored = false;
    await storedProject.attachToProject(projectID);

    makingNewProject = false;
}



// File System, File System View Initialization
executionEnviroment.addEventListener("initialized", function() {
    canMirror = true;
    MirrorToExecutionEnvironment();
});
// File System, File System View Initialization
executionEnviroment.addEventListener("onDownloadFail", function(data) {
    displayEditorNotification("Failed to load critical part of IDE: "+data.name+". Click for more details.", NotificationIcons.ERROR, -1,
         function() {
            displayEditorNotification("If you are a <i>developer</i>, please ensure you have placed the file '"+data.url.slice(data.url.lastIndexOf("/")+1)+"' inside your /Browser_IDE/splashkit/ folder."+
                "<hr/>Status: "+data.status+" "+data.statusText, NotificationIcons.ERROR, -1
            );
            displayEditorNotification("If you are a <i>user</i>, please report this issue on our <a href=\"https://github.com/thoth-tech/SplashkitOnline/\">GitHub page</a>!",
                NotificationIcons.ERROR, -1
            );
        }
    );
});

storedProject.addEventListener("attached", async function() {
    MirrorToExecutionEnvironment();
    loadInitialization();
    loadMainLoop();
});

async function MirrorToExecutionEnvironment(){
    try {
        if (!haveMirrored && canMirror){
            displayEditorNotification("Loading project files.", NotificationIcons.INFO);

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
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Internal error";
        errEv.longMessage = "Failed to sync execution environment filesystem.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
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
    displayEditorNotification("IDE is ready to run projects.", NotificationIcons.SUCCESS);

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
    try {
        await storedProject.access(async function(project){
            await project.mkdir(codePath);
            await project.writeFile(initCodePath, editorInit.getValue());
        });
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Save failed";
        errEv.longMessage = "An error occured and the initialisation code could not be saved.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
}
async function saveMainLoop(){
    try {
        await storedProject.access(async function(project){
            await project.mkdir(codePath);
            await project.writeFile(mainLoopCodePath, editorMainLoop.getValue());
        });
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Save failed";
        errEv.longMessage = "An error occured and the main loop code could not be saved.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
}

async function loadInitialization(){
    let newVal = undefined;
    try {
        newVal = await fileAsString(await storedProject.access(function(project){
            return project.readFile(initCodePath);
        }));
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Load failed";
        errEv.longMessage = "An error occured and the initialisation code could not be loaded.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
    if (newVal != editorInit.getValue())
        editorInit.setValue(newVal);
}
async function loadMainLoop(){
    let newVal = undefined;
    try {
        newVal = await fileAsString(await storedProject.access(function(project){
            return project.readFile(mainLoopCodePath);
        }));
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Load failed";
        errEv.longMessage = "An error occured and the main loop code could not be loaded.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
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

    displayEditorNotification("Running project!", NotificationIcons.SUCCESS);

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

    // The syntax checking cannot run inside an async function,
    // so just runAllCodeBlocks (which does syntax checking)
    // inside a timeout instead. A bit of a cludge, but it works.
    setTimeout(function(){
        runAllCodeBlocks();

        executionEnviroment.runProgram();
    }, 0);
}

// ------ Setup code editor buttons ------

// Updates buttons based on the state of the ExecutionEnvironment
function updateButtons(){
    updateCodeButton.disabled = !allowExecution;

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
updateCodeButton.addEventListener("click", function () {
    // Hack to make this work until this code gets generalized
    if (currentTab.contents.dataset.file == "codeblock_init.js") {
        saveInitialization();
        runInitialization();
    }
    if (currentTab.contents.dataset.file == "codeblock_mainloop.js") {
        saveMainLoop();
        runMainLoop();
    }
});


// Add events for the main program buttons
runProgramButton.addEventListener("click", function () {
    saveMainLoop();
    saveInitialization();
    runProgram();
});

stopProgramButton.addEventListener("click", function () {
    pauseProgram();
});

restartProgramButton.addEventListener("click", function () {
    saveMainLoop();
    saveInitialization();
    restartProgram();
});

continueProgramButton.addEventListener("click", function () {
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
    try {
        await JSZip.loadAsync(file)
        .then(async function(zip) {
            zip.forEach(async function (rel_path, zipEntry) {
                let abs_path = "/"+rel_path;
                if (zipEntry.dir){
                    abs_path = abs_path.substring(0, abs_path.length-1);

                    await unifiedFS.mkdir(abs_path);
                }
                else{
                    let uint8_view = await zip.file(rel_path).async("uint8array");
                    await unifiedFS.writeFile(abs_path, uint8_view);
                }
            });
        });
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Import failed";
        errEv.longMessage = "An error occured and the project could not be imported.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
}

async function projectToZip(){
    try {
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
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Export failed";
        errEv.longMessage = "An error occured and the project could not be exported.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
}


// ------ File System Upload/Download Functions ------
let reader = null;
function uploadFileFromInput(){
    reader= new FileReader();
    let files = document.getElementById('fileuploader').files;
    let file = files[0]; // maybe should handle multiple at once?
    reader.addEventListener('loadend', async function(e){
        let result = reader.result;
        const uint8_view = new Uint8Array(result);

        let path = document.getElementById('fileuploader').dataset.uploadDirectory;
        
        try {
            await unifiedFS.writeFile(path+"/"+file.name, uint8_view);
        } catch(err){
            let errEv = new Event("filesystemError");
            errEv.shortMessage = "Upload failed";
            errEv.longMessage = "An error occured and the file could not be created.\n\nReason:\n" + err;
            window.dispatchEvent(errEv);
            return;
        }
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
async function FSviewFile(filename) {

    let content = undefined;

    try {
        content = await storedProject.access((project)=>project.readFile(filename));
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Open failed";
        errEv.longMessage = "An error occured and the file could not be opened.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }

    let mimeType = mime.getType(filename) || 'application/octet-stream';
    let blob = new Blob([content], {type: mimeType});

    let url = URL.createObjectURL(blob);

    window.open(url+"#"+filename, '_blank');
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
}
async function FSdownloadFile(filename, mime) {
    let content = undefined;

    try {
        content = await storedProject.access((project)=>project.readFile(filename));
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Download failed";
        errEv.longMessage = "An error occured and the file could not be read.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }

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
        if (editor.lineCount() < e.line)
            e.line = editor.lineCount();
        editor.addLineClass(e.line-1, "wrap", "error-line");
        editor.scrollIntoView({line:e.line-1, char:0}, 200);
        editor.setCursor({line:e.line-1, char:0});
    }
    editor.focus();
});


// ----- Handle "Project Opened in Another Tab" Conflict -----
let projectConflictModal = null;

let userHasIgnoredProjectConflict = false;

projectConflictModal = createModal(
    "projectConflictModal",
    "Project open in another tab!",

    "<b>Reload now to avoid losing work!</b><br>"+
    "This project is already open in another tab and has been modified.<br>"+
    "Continuing to edit it in this tab will result in losing work! Please reload the project to continue working.",

    {label:"Reload Now", callback: function(){
        location.reload();
    }},
    {label:"Ignore", callback: function(){
        userHasIgnoredProjectConflict = true;
        // Remind the user in 60 seconds
        setTimeout(function(){
            userHasIgnoredProjectConflict = false;
        }, 60000);
        projectConflictModal.hide();
    }}
);

// Check for conflict every 2 seconds - if the lastWriteTime changes without us changing it,
// the user must be modifying the project in another tab - so show the conflict modal.
setInterval(function(){
    storedProject.checkForWriteConflicts();
}, 2000);

// Also check on focus/visibilitychange (different compatability)
window.addEventListener("focus", function(){
    storedProject.checkForWriteConflicts();
});

window.addEventListener("visibilitychange", function(){
    // Calling checkForWriteConflicts() directly inside visibilitychange
    // seems to cause the connection made to not close properly,
    // leading to strange timeouts and other issues - particularly when
    // deleting the database in newProject - it can delay up to 20 seconds
    // or more. This bug tends to manifest _after_ a page reload, making it
    // particularly confusing.
    // The fix is simple - do the check after a short timeout instead.
    setTimeout(function(){
        storedProject.checkForWriteConflicts();
    }, 1);
});

// If the conflict is detected, show the modal
storedProject.addEventListener("timeConflict", async function() {
    if (!userHasIgnoredProjectConflict)
        projectConflictModal.show();
});



window.addEventListener("needConfirmation", async function(ev){
    let confirmLabel = ev.confirmLabel || "Confirm";
    let cancelLabel = ev.cancelLabel || "Cancel";
    
    let confirmationModal = createModal(
        "confirmationModal",
        ev.shortMessage,
        ev.longMessage,
        {label: cancelLabel, callback: ()=>{
            ev.oncancel();
            confirmationModal.hide();
        }},
        {label: confirmLabel, callback: ()=>{
            ev.onconfirm();
            confirmationModal.hide();
        }}
    );
    confirmationModal.show();

    let confirmationModalEl = document.getElementById("confirmationModal");
    confirmationModalEl.addEventListener("hidden.bs.modal", function(innerEv){
        confirmationModal.dispose();
    });
});

window.addEventListener("filesystemError", async function(ev){
    // We should find a way to reuse this.
    // I am unsure what the interface of a modal is
    // beyond the show and hide methods.
    let errorModal = createModal(
        "filesystemErrorModal",
        ev.shortMessage,
        ev.longMessage,
        null,
        null
    );
    errorModal.show();

    let errorModelEl = document.getElementById("filesystemErrorModal");
    errorModelEl.addEventListener("hidden.bs.modal", function(innerEv){
        errorModal.dispose();
    });
});

