"use strict";

// ------ Setup UI ------

class CodeViewer {
    constructor(filename) {
        this.filename = filename;
        this.shortname = filename.slice(filename.lastIndexOf("/")+1);

        let viewArea = document.getElementById("codeEditorContainer");
        let tabArea = document.getElementById("codeViewTabs");

        this.editorElem = elem("textarea", {type: "text", style:{height:'100%'}});

        this.editorContainer = elem("div", {class: "sk-contents sk-tab-hidden", file: filename}, [
            this.editorElem
        ]);

        this.tab = elem("li", {}, [this.shortname]);

        let self = this;
        this.tab.addEventListener('click', function(){
            SwitchToTab(self);
        })

        viewArea.appendChild(this.editorContainer);
        tabArea.appendChild(this.tab);

        this.editor = this.setupCodeArea(this.editorElem);
    }

    setupCodeArea(element) {
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

        editor.display.wrapper.classList.add("sk-contents");
        return editor;
    }

    async runOne() {
        await runFile(this.shortname, this.editor.getValue());
    }

    async syntaxCheck() {
        await syntaxCheckFile(this.shortname, this.editor.getValue());
    }

    // Functions to save/load the code blocks
    async save(){
        let self = this;
        try {
            await storedProject.access(async function(project){
                await project.writeFile(self.filename, self.editor.getValue());
            });
        } catch(err){
            let errEv = new Event("filesystemError");
            errEv.shortMessage = "Save failed";
            errEv.longMessage = "An error occured and " + self.filename + " could not be saved.\n\nReason:\n" + err;
            window.dispatchEvent(errEv);
            return;
        }
    }

    async load(){
        let self = this;
        let newVal = undefined;
        try {
            newVal = await fileAsString(await storedProject.access(function(project){
                return project.readFile(self.filename);
            }));
        } catch(err){
            let errEv = new Event("filesystemError");
            errEv.shortMessage = "Load failed";
            errEv.longMessage = "An error occured and " + self.filename + " could not be loaded.\n\nReason:\n" + err;
            window.dispatchEvent(errEv);
            return;
        }
        if (newVal != self.editor.getValue())
            self.editor.setValue(newVal);
    }

}

// TODO: make it search for user's source files...
function findAllSourceFiles() {
    return [
        "/code/codeblock_init.js",
        "/code/codeblock_mainloop.js"
    ];
}


let editors = [];

function openCodeEditors() {
    let sourceFiles = findAllSourceFiles();
    for(let i = 0; i < sourceFiles.length; i ++) {
        let codeView = new CodeViewer(sourceFiles[i]);
        codeView.load();
        editors.push(codeView);
    }
    if (editors.length > 0)
        SwitchToTab(editors[0]);
}

function closeAllCodeEditors() {
    for(let i = 0; i < editors.length; i ++) {
        editors[i].tab.remove();
        editors[i].editorContainer.remove();
    }
    editors = [];
}

async function saveAllOpenCode() {
    let promises = [];

    for(let i = 0; i < editors.length; i ++) {
        promises.push(
            editors[i].save()
        );
    }

    await Promise.all(promises);
}



let updateCodeButton = document.getElementById("runOne");

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
let currentEditor = null;

function SwitchToTab(editor){
    for (let i = 0; i < editors.length; i ++) {
        if (editors[i] == editor) {
            editors[i].editorContainer.style.display = 'flex';
            editors[i].tab.classList.add('sk-tabs-active');

            currentEditor = editors;
        }
        else {
            editors[i].editorContainer.style.display = 'none';
            editors[i].tab.classList.remove('sk-tabs-active');
        }
    }

    for (let i = 0; i < editors.length; i ++) {
        editors[i].editor.refresh();
    }
}

SwitchToTab(editors[0]);

// setup language selection box
let languageSelectElem = document.getElementById("languageSelection");
for (let i = 0; i < SplashKitOnlineLanguageDefinitions.length; i++) {
    let language = SplashKitOnlineLanguageDefinitions[i];
    languageSelectElem.append(elem("option", {value: language.name}, [language.userVisibleName]));
}

// switch active language
// currently just reloads the page with the 'language' parameter set
// in the future, ideally this will work _without_ reloading the page,
// by unloading the existing language scripts then loading the new ones
function switchActiveLanguage(language){
     let page_url = new URL(window.location.href);
     page_url.searchParams.set('language', language.replaceAll("+"," ") /* spaces become + in url */);
     window.location = page_url;
}

languageSelectElem.addEventListener('change', function(event) {
    // just switch active language
    // TODO: store chosen language inside project
    switchActiveLanguage(event.target.value);
})

// ------ Setup Project and Execution Environment ------

// decide which language to use
let activeLanguage = null;
let activeLanguageSetup = null;
if (SKO.language in SplashKitOnlineLanguageAliasMap) {
    activeLanguage = SplashKitOnlineLanguageAliasMap[SKO.language];
} else {
    activeLanguage = SplashKitOnlineLanguageAliasMap["JavaScript"];

    displayEditorNotification("Unable to switch to language "+SKO.language+", defaulting to JavaScript.", NotificationIcons.ERROR, -1);
    displayEditorNotification("Available languages are: <br/><ul>"+
        SplashKitOnlineLanguageDefinitions.map(val => `<li>${val.userVisibleName}</li>`).join("")+
        "</ul>", NotificationIcons.ERROR, -1
    );
}
activeLanguageSetup = activeLanguage.setups[0];

languageSelectElem.value = activeLanguage.name;

// initialize language
initializeLanguageCompilerFiles(activeLanguageSetup);

// initialize execution environment and project storage objects
let executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"), activeLanguageSetup);
let appStorage = new AppStorage();
appStorage.attach();
let storedProject = new IDBStoredProject(appStorage, activeLanguageSetup.getDefaultProject());
let unifiedFS = new UnifiedFS(storedProject, executionEnviroment);
storedProject.attachToProject();

let haveMirrored = false;
let canMirror = false;

let makingNewProject = false;
async function newProject(initializer){
    // Guard against re-entry on double click
    if (makingNewProject)
        return;
    makingNewProject = true;

    let preparationPromises = prepareIDEForLoading();

    let projectID = storedProject.projectID;

    disableCodeExecution();
    storedProject.detachFromProject();
    closeAllCodeEditors();
    canMirror = false;
    await executionEnviroment.resetEnvironment();
    await storedProject.deleteProject(projectID);
    haveMirrored = false;
    storedProject.initializer = initializer;
    await storedProject.attachToProject(projectID);

    await storedProject.access(async (project) => {
        await project.renameProject("New Project");
    });

    makingNewProject = false;

    await preparationPromises.waitForMirrorCompletion;
}

function prepareIDEForLoading(){
    let waitForCompilerReady = new Promise((resolve) => {
        if (getCompiler(activeLanguageSetup.compilerName))
            resolve();
        registeredCompilersEvents.addEventListener("compilerReady", () => {
            resolve();
        });
    });

    let waitForInitialize = new Promise((resolve) => {
        executionEnviroment.addEventListener("initialized", () => {
            canMirror = true;
            resolve();
        });
    });

    let waitForProjectAttach = new Promise((resolve) => {
        storedProject.addEventListener("attached", async () => {
            resolve();
        });
    });

    waitForProjectAttach.then(openCodeEditors);

    let waitForMirrorCompletion = new Promise((resolve) => {
        if (!activeLanguageSetup.persistentFilesystem){
            resolve();
            return;
        }
        Promise.all([waitForInitialize, waitForProjectAttach]).then(async function() {
            if (!haveMirrored && canMirror){
                displayEditorNotification("Loading project files.", NotificationIcons.INFO);

                haveMirrored = true;
                await MirrorToExecutionEnvironment();
            }
            resolve();
        });
    });

    let waitForCodeExecution = new Promise((resolve) => {
        Promise.all([waitForCompilerReady, waitForInitialize, waitForMirrorCompletion]).then(function() {
            enableCodeExecution();
            resolve();
        });
    });

    return {
        waitForCompilerReady,
        waitForInitialize,
        waitForProjectAttach,
        waitForMirrorCompletion,
        waitForCodeExecution
    };
}
prepareIDEForLoading();

executionEnviroment.addEventListener("onDownloadFail", function(data) {
    displayEditorNotification("Failed to load critical part of IDE: "+data.name+". Click for more details.", NotificationIcons.CRITICAL_ERROR, -1,
         function() {
            displayEditorNotification("If you are a <i>developer</i>, please ensure you have placed the file '"+data.url.slice(data.url.lastIndexOf("/")+1)+"' inside your /Browser_IDE/splashkit/ folder."+
                "<hr/>Status: "+data.status+" "+data.statusText, NotificationIcons.CRITICAL_ERROR
            );
            displayEditorNotification("If you are a <i>user</i>, please report this issue on our <a href=\"https://github.com/thoth-tech/SplashkitOnline/\">GitHub page</a>!",
                NotificationIcons.CRITICAL_ERROR
            );
        }
    );
});

executionEnviroment.addEventListener("onCriticalInitializationFail", function(data) {
    displayEditorNotification("Failed to load critical part of IDE: "+data.message+". ", NotificationIcons.CRITICAL_ERROR);
});

async function MirrorToExecutionEnvironment(){
    try {
        let tree = await storedProject.access((project)=>project.getFileTree());

        let promises = []

        async function mirror(tree, path){
            let dirs_files = tree;

            for(let node of dirs_files){
                let abs_path = path+""+node.label;
                if (node.children != null){
                    promises.push(executionEnviroment.mkdir(abs_path));
                    promises.push(await mirror(node.children, abs_path+"/"));
                }
                else{
                    promises.push(executionEnviroment.writeFile(abs_path, await storedProject.access((project)=>project.readFile(abs_path))));
                }
            }
        }

        await mirror(tree, "/");

        await Promise.all(promises);
    } catch(err){
        let errEv = new Event("filesystemError");
        errEv.shortMessage = "Internal error";
        errEv.longMessage = "Failed to sync execution environment filesystem.\n\nReason:\n" + err;
        window.dispatchEvent(errEv);
        return;
    }
}

executionEnviroment.addEventListener("mirrorRequest", async function(e){
    try {
        displayEditorNotification("Loading project files...", NotificationIcons.INFO);
        await MirrorToExecutionEnvironment();
        e.resolve();
    }
    catch(err) {
        e.reject(err);
    }
});



// ------ Code Execution + Saving ------
if (!activeLanguageSetup.supportHotReloading) {
    document.getElementById("runOne").children[0].innerText = "Syntax Check File";
}

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
    if (!allowExecution)
        displayEditorNotification("IDE is ready to run projects!", NotificationIcons.SUCCESS);

    allowExecution = true;
    updateButtons();
}

function reportCompilationError(error){
    executionEnviroment.reportError(error.name, error.line, error.message, error.formatted);
}

async function runFile(name, code) {
    try {
        clearErrorLines();

        let message = `Preparing ${name}...`;
        if (activeLanguageSetup.compiled)
            message = `Compiling ${name}...`
        displayEditorNotification(message, NotificationIcons.CONSTRUCTION);

        // give the notification a chance to show
        await asyncSleep();

        let currentCompiler = await getCurrentCompiler();
        if (currentCompiler == null) return;

        let compiled = await currentCompiler.compileOne(name, code, reportCompilationError);

        if (compiled.output == null)
            displayEditorNotification(`${name} had errors!`, NotificationIcons.WARNING);

        if (compiled.output != null) {
            displayEditorNotification(`Reloading ${name}!`, NotificationIcons.CONSTRUCTION);
            executionEnviroment.hotReloadFile(name, compiled.output);
        }
    }
    catch (err) {
        displayEditorNotification("Internal error while preparing file! <br/>"+err.toString(), NotificationIcons.CRITICAL_ERROR);
    }
}
async function syntaxCheckFile(name, code) {
    try {
        clearErrorLines();

        let message = `Checking ${name}...`;
        displayEditorNotification(message, NotificationIcons.CONSTRUCTION);

        // give the notification a chance to show
        await asyncSleep();

        let currentCompiler = await getCurrentCompiler();
        if (currentCompiler == null) return;

        let okay = await currentCompiler.syntaxCheckOne(name, code, reportCompilationError);

        if (!okay)
            displayEditorNotification(`${name} had syntax errors!`, NotificationIcons.WARNING);
        else
            displayEditorNotification(`${name} is all good!`, NotificationIcons.SUCCESS);
    }
    catch (err) {
        displayEditorNotification("Internal error while syntax checking! <br/>"+err.toString(), NotificationIcons.CRITICAL_ERROR);
    }
}

storedProject.addEventListener('onWriteToFile', function(e) {
    for (let i = 0; i < editors.length; i ++) {
        if (e.path == editors[i].filename) {
            editors[i].load();
        }
    }
});


function asyncSleep(time=0) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getCurrentCompiler() {
    let currentCompiler = getCompiler(activeLanguageSetup.compilerName);

    if (currentCompiler == null)
        displayEditorNotification("Failed to start compiler! Maybe it hasn't loaded yet, try again in a bit!", NotificationIcons.ERROR);

    return currentCompiler;
}

// Functions to run/pause/continue/stop/restart the program itself
async function runProgram(){
    try {
        clearErrorLines();

        displayEditorNotification(activeLanguageSetup.compiled ? "Compiling project..." : "Building project...", NotificationIcons.CONSTRUCTION);

        // give the notification a chance to show
        await asyncSleep();

        let currentCompiler = await getCurrentCompiler();
        if (currentCompiler == null) return;

        async function mapBit(filename){
            let source = await fileAsString(await storedProject.access((project) => project.readFile(filename)));
            return {
                name: filename,
                source: source
            };
        }

        let compiled = await currentCompiler.compileAll(await Promise.all(findAllSourceFiles().map(mapBit)), reportCompilationError);

        if (compiled.output != null) {
            executionEnviroment.runProgram(compiled.output);
        } else {
            displayEditorNotification("Project has errors! Please see terminal for details.", NotificationIcons.ERROR);
        }
    }
    catch (err) {
        displayEditorNotification("Failed to run program!<br/>"+err.toString(), NotificationIcons.ERROR);
    }
}

async function continueProgram(){
    clearErrorLines();

    try {
        await executionEnviroment.continueProgram();
    }
    catch (err) {
        displayEditorNotification("Failed to continue program!", NotificationIcons.ERROR);
    }
}

async function pauseProgram(){
    try {
        await executionEnviroment.pauseProgram();
    }
    catch (err) {
        displayEditorNotification("Failed to pause program!", NotificationIcons.ERROR);
    }
}

async function stopProgram(){
    try {
        await executionEnviroment.stopProgram();
    }
    catch (err) {
        displayEditorNotification("Failed to stop program!", NotificationIcons.ERROR);
    }
}

async function restartProgram(){
    clearErrorLines();

    if (executionEnviroment.executionStatus != ExecutionStatus.Unstarted)
        await executionEnviroment.stopProgram(); // Make sure we wait for it to stop via await.
    await executionEnviroment.cleanEnvironment();

    runProgram();
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


// Add events for the code view
updateCodeButton.addEventListener("click", function () {
    currentEditor.save();
    if (activeLanguageSetup.supportHotReloading)
        currentEditor.runOne();
    else
        currentEditor.syntaxCheck();
});


// Add events for the main program buttons
runProgramButton.addEventListener("click", function () {
    saveAllOpenCode();
    runProgram();
});

stopProgramButton.addEventListener("click", function () {
    pauseProgram();
});

restartProgramButton.addEventListener("click", function () {
    saveAllOpenCode();
    restartProgram();
});

continueProgramButton.addEventListener("click", function () {
    saveAllOpenCode();
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
    let promises = [];

    try {
        await JSZip.loadAsync(file)
        .then(async function(zip) {
            zip.forEach(async function (rel_path, zipEntry) {
                let abs_path = "/"+rel_path;
                if (zipEntry.dir){
                    abs_path = abs_path.substring(0, abs_path.length-1);

                    promises.push(unifiedFS.mkdir(abs_path));
                }
                else{
                    let uint8_view = await zip.file(rel_path).async("uint8array");
                    promises.push(unifiedFS.writeFile(abs_path, uint8_view));
                }
            });
        });

        await Promise.all(promises);
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
    await newProject(function(){});
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
    newProject(activeLanguageSetup.getDefaultProject());
    e.stopPropagation();
});

// ----- Program Runtime & Error Reporting -----
function clearErrorLines(){
    for (let editor of editors){
        for (var i = 0; i < editor.editor.lineCount(); i++) {
            editor.editor.removeLineClass(i, "wrap", "error-line");
        }
    }
}

// Update buttons when the state of the ExecutionEnvironment changes
executionEnviroment.addEventListener("programStarted", function(e){
    displayEditorNotification("Running project!", NotificationIcons.SUCCESS);

    updateButtons();
});
executionEnviroment.addEventListener("programContinued", function(e){
    updateButtons();
});
executionEnviroment.addEventListener("programStopped", function(e){
    updateButtons();
    displayEditorNotification("Program Stopped!", NotificationIcons.INFO);
});
executionEnviroment.addEventListener("programPaused", function(e){
    updateButtons();
});

// Also highlight errors when they come
executionEnviroment.addEventListener("error", function(e){
    for(let i = 0; i < editors.length; i ++) {
        if (editors[i].filename != e.block)
            continue;

        let editor = editors[i].editor;

        if (e.line != null){
            if (editor.lineCount() < e.line)
                e.line = editor.lineCount();
            editor.addLineClass(e.line-1, "wrap", "error-line");
            editor.scrollIntoView({line:e.line-1, char:0}, 200);
            editor.setCursor({line:e.line-1, char:0});
        }

        editor.focus();
    }
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

