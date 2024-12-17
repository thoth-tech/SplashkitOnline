"use strict";

// ------ Setup UI ------

class CodeViewer {
    constructor(filename) {
        let self = this;

        this.filename = filename;
        this.basename = filename.slice(filename.lastIndexOf("/")+1);

        let viewArea = document.getElementById("codeEditorContainer");
        let tabArea = document.getElementById("codeViewTabs");

        let editorElem = elem("textarea", {type: "text", style:{height:'100%'}});

        this.editorContainer = elem("div", {class: "sk-contents sk-tab-hidden", file: filename}, [
            editorElem
        ]);

        let closeButton = elem("button", { class: "bi bi-x", style:{'margin-right': '-20px'} });

        closeButton.addEventListener('click', function(event){
            closeCodeEditor(self);
            event.stopPropagation();
        })

        this.label = elem("div", {class: "sk-tab-label", title: this.filename}, [this.basename]);
        this.tab = elem("li", {}, [this.label, closeButton]);

        this.tab.addEventListener('click', function(){
            SwitchToTab(self);
            event.stopPropagation();
        })

        this.tab.addEventListener('dblclick', function(){
            self.showRenameInput();
            event.stopPropagation();
        })

        viewArea.appendChild(this.editorContainer);
        tabArea.appendChild(this.tab);

        this.editor = this.setupCodeArea(editorElem);
    }

    showRenameInput() {
        let self = this;
        self.label.contentEditable = true;
        self.label.focus();

        function resetRenameInput() {
            self.label.removeEventListener('blur', blurListener);
            self.label.removeEventListener('keydown', keydownListener);
            var sel = window.getSelection();
            sel.removeAllRanges();
            self.label.contentEditable = false;

            self.label.blur();
        }

        let blurListener = (e) => {
            resetRenameInput();
            self.renameBasename(self.label.innerText);
        };

        let keydownListener = (e) => {
            if(e.key == "Escape"){
                resetRenameInput();
                self.label.innerText = self.basename;
            }

            if(e.key == "Enter"){
                resetRenameInput();
                self.renameBasename(self.label.innerText);
                e.preventDefault();
            }
        };

        self.label.addEventListener("blur", blurListener);

        self.label.addEventListener("keydown", keydownListener);
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
        await runFile(this.filename, this.editor.getValue());
    }

    async syntaxCheck() {
        await syntaxCheckFile(this.filename, this.editor.getValue());
    }

    // Functions to save/load the code blocks
    async save() {
        let self = this;
        try {
            await storedProject.access(async function(project){
                let source = self.editor.getValue();
                if (await project.exists(self.filename) || source != "")
                    await project.writeFile(self.filename, source);
            });
        } catch(err){
            let errEv = new Event("filesystemError");
            errEv.shortMessage = "Save failed";
            errEv.longMessage = "An error occured and " + self.filename + " could not be saved.\n\nReason:\n" + err;
            window.dispatchEvent(errEv);
            return;
        }
    }

    async load() {
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

    async renameBasename(basename) {
        let self = this;

        if (basename == self.basename) {
            self.label.innerText = self.basename;
            return;
        }

        let newFilename = self.filename.slice(0, self.filename.lastIndexOf("/")+1)+basename;

        try {
            let newExists = await storedProject.access((project) => project.exists(newFilename));
            if (newExists) {
                self.label.innerText = self.basename;
                displayEditorNotification("Cannot rename to " + basename + " - file already exists!", NotificationIcons.WARNING);
                return;
            }

            // ignore rename if still unsaved
            let oldExists = await storedProject.access((project) => project.exists(self.filename));
            if (oldExists) {
                await storedProject.access((project) => project.rename(self.filename, newFilename));
                // don't really care if the execution environment fails - should the code be mirrored there in the first place?
                try {
                    executionEnviroment.rename(self.filename, newFilename);
                } catch {};
            }

            self.filename = newFilename;
            self.basename = basename;

            self.label.innerText = self.basename;
        }
        catch(err) {
            let errEv = new Event("filesystemError");
            errEv.shortMessage = "Rename failed";
            errEv.longMessage = "An error occured and " + self.filename + " could not be renamed to " + newFilename + ".\n\nReason:\n" + err;
            window.dispatchEvent(errEv);
            return;
        }
    }

    close() {
        this.tab.remove();
        this.editorContainer.remove();

        this.filename = null;
        this.basename = null;
        this.label = null;
        this.tab = null;
        this.editorContainer = null;
        this.editor = null;
    }

}

function getExtension(filename) {
    return filename.slice(filename.lastIndexOf('.')+1);
}

async function getFilesByExtension(extensions) {
    let files = await storedProject.access((project) => project.getFlatFileList());

    return files.filter((filename) => extensions.indexOf(getExtension(filename)) != -1);
}

async function findAllSourceFiles() {
    return await getFilesByExtension(activeLanguage.sourceExtensions);
}

async function findAllCompilableFiles() {
    return await getFilesByExtension(activeLanguage.compilableExtensions);
}

let editors = [];

function getCodeEditor(filename) {

    for(let i = 0; i < editors.length; i ++) {
        if (editors[i].filename == filename)
            return editors[i];
    }

    return null;
}

function openCodeEditor(filename, setFocus=true, load=true) {
    let existing = getCodeEditor(filename);
    if (existing) {
        if (setFocus)
            SwitchToTab(existing);

        return;
    }

    let codeView = new CodeViewer(filename);

    if (load)
        codeView.load();

    editors.push(codeView);

    if (setFocus) {
        SwitchToTab(codeView);
    }
}

async function updateNoEditorsMessage() {
    document.getElementById("noEditorsMessage").style.opacity = (editors.length == 0 && !makingNewProject) ? 1 : 0;
}

async function openCodeEditors(editorLimit = 3) {
    let sourceFiles = await findAllSourceFiles();

    if (sourceFiles.length > editorLimit) {
        updateNoEditorsMessage();
        return;
    }

    for(let i = 0; i < sourceFiles.length; i ++) {
        openCodeEditor(sourceFiles[i], false);
    }

    if (editors.length > 0)
        SwitchToTab(editors[0]);
    else
        currentEditor = null;

    updateNoEditorsMessage();
}

const shownRenameMessageKey = 'sk-online-shown-rename-message';
async function openUntitledCodeEditor() {
    let number = 0;
    let filename = "/code/untitled."+activeLanguage.defaultSourceExtension;

    while(await storedProject.access((project) => project.exists(filename)))
    {
        number ++;
        filename = "/code/untitled (" + number + ")."+activeLanguage.defaultSourceExtension;
    }

    openCodeEditor(filename, true, false);

    updateNoEditorsMessage();

    if (!localStorage.getItem(shownRenameMessageKey)) {
        displayEditorNotification("You can double click a code tab's name to rename it!", NotificationIcons.INFO, 6);
        localStorage.setItem(shownRenameMessageKey, true);
    }
}

async function closeCodeEditor(editor, autosave = true) {
    let index = editors.indexOf(editor);
    if (index != -1) {
        let editor = editors[index];
        editors.splice(index, 1);

        if (autosave)
            await editor.save();

        editor.close();
    }

    if (currentEditor == editor) {
        if (index >= editors.length)
            index = editors.length - 1;
        if (editors.length > 0)
            SwitchToTab(editors[index]);
        else
            currentEditor = null;
    }

    updateNoEditorsMessage();
}

function closeAllCodeEditors() {
    for(let i = 0; i < editors.length; i ++) {
        editors[i].close();
    }
    editors = [];

    currentEditor = null;

    updateNoEditorsMessage();
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

function createGutterSplitters(){
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
}
// -------------------- Setup Tabs --------------------
let currentEditor = null;

function SwitchToTab(editor){
    for (let i = 0; i < editors.length; i ++) {
        if (editors[i] == editor) {
            editors[i].editorContainer.style.display = 'flex';
            editors[i].tab.classList.add('sk-tabs-active');

            currentEditor = editors[i];
        }
        else {
            editors[i].editorContainer.style.display = 'none';
            editors[i].tab.classList.remove('sk-tabs-active');
        }
    }

    for (let i = 0; i < editors.length; i ++) {
        // Before refreshing the editor, get the scroll position of the editor window
        let display = currentEditor.editor.display;
        let scrollTop = display.scroller.scrollTop;
        // Refresh the editor
        editors[i].editor.refresh();
        // Update the scrollbar with the original scrollbar position
        display.scrollbars.setScrollTop(scrollTop);
    }
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

let languageSelectElem = null;
function setupLanguageSelectionBox(){
    // setup language selection box
    languageSelectElem = document.getElementById("languageSelection");
    for (let i = 0; i < SplashKitOnlineLanguageDefinitions.length; i++) {
        let language = SplashKitOnlineLanguageDefinitions[i];
        languageSelectElem.append(elem("option", {value: language.name}, [language.userVisibleName]));
    }

    languageSelectElem.addEventListener('change', function(event) {
        // just switch active language
        // TODO: store chosen language inside project
        switchActiveLanguage(event.target.value);
    });
}

// ------ Setup Project and Execution Environment ------

// decide which language to use
let activeLanguage = null;
let activeLanguageSetup = null;


function setupActiveLanguage(){
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
}



let executionEnviroment = null;
let appStorage = null;
let storedProject = null;
let unifiedFS = null;

let makingNewProject = false;

// Project handling needs to be fixed
// This function is a big issue;
// making a new project shouldn't delete
// the current one...
// TODO: Rationalize project handling
async function newProject(initializer){
    // Guard against re-entry on double click
    if (makingNewProject)
        return;
    makingNewProject = true;

    let projectID = storedProject.projectID;

    disableCodeExecution();
    storedProject.detachFromProject();
    closeAllCodeEditors();

    await Promise.all([
        executionEnviroment.resetEnvironment(),
        (async () => {
            await storedProject.deleteProject(projectID);
            await appStorage.attach();

            storedProject.initializer = initializer;
            await storedProject.attachToProject();

            openCodeEditors();
        })()
    ])

    await mirrorProject();
    updateCodeExecutionState();

    makingNewProject = false;
}

async function mirrorProject(){
    if (!activeLanguageSetup.persistentFilesystem)
        return;

    // Mirror project to execution environment
    displayEditorNotification("Loading project files...", NotificationIcons.INFO);

    // Now wait for the project to be fully mirrored,
    // then allow code execution.
    await MirrorToExecutionEnvironment();
}

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
                    await mirror(node.children, abs_path+"/");
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
// ------ Code Execution + Saving ------


let allowExecution = false;
let haveUploadedCodeOnce = false;

// Functions to disable/enable code-execution

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
// automatically enable/disable based on IDE state
function updateCodeExecutionState(){
    if (getCompiler(activeLanguageSetup.compilerName))
        executionEnviroment.updateCompilerLoadProgress(1);

    if (getCompiler(activeLanguageSetup.compilerName) && executionEnviroment.readyForExecution) {
        enableCodeExecution();
    }
    else
        disableCodeExecution();
}

function reportCompilationError(error){
    executionEnviroment.reportError(error.name, error.line, error.message, error.formatted);
}

function setupCodeEditorCallbacks() {
    storedProject.addEventListener('onWriteToFile', function(e) {
        let editor = getCodeEditor(e.path);
        if (editor)
            editor.load();
    });

    storedProject.addEventListener('onDeletePath', function(e) {
        let editor = getCodeEditor(e.path);
        if (editor)
            closeCodeEditor(editor, false);
    });
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


function asyncSleep(time=0) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getCurrentCompiler() {
    let currentCompiler = getCompiler(activeLanguageSetup.compilerName);

    if (currentCompiler == null)
        displayEditorNotification("Failed to start compiler! Maybe it hasn't loaded yet, try again in a bit!", NotificationIcons.ERROR);

    return currentCompiler;
}

// ------ Audio Notification ------
let audioNotificationRunOnce = false;
let audioNotification = null;

// This is a hack to detect if the user has clicked into the iFrame
// If they do, we set a flag to prevent the audio notification from showing and remove it if it's already showing
// The timeout is to ensure that the activeElement is set correctly, essentially we're telling the browser to wait one tick before checking
if (SKO.language == "C++") {
    window.addEventListener("blur", () => {
        setTimeout(() => {
            if (document.activeElement.id == "iframetest") {
                audioNotificationRunOnce = true;
                if (audioNotification != null) audioNotification.deleteNotification();
            }
        });
    });
}

function audioFunctionNotification(source) {
    // Audio functions
    let audioFunctions = [
        "audio_ready",
        "close_audio",
        "open_audio",
        "fade_music_in",
        "fade_music_out",
        "free_all_music",
        "free_music",
        "has_music",
        "load_music",
        "music_filename",
        "music_name",
        "music_named",
        "music_playing",
        "music_volume",
        "pause_music",
        "play_music",
        "resume_music",
        "set_music_volume",
        "stop_music",
        "fade_all_sound_effects_out",
        "fade_sound_effect_out",
        "free_all_sound_effects",
        "free_sound_effect",
        "has_sound_effect",
        "load_sound_effect",
        "play_sound_effect",
        "play_sound_effect_named_with_volume",
        "play_sound_effect_named_with_times",
        "play_sound_effect_with_volume",
        "play_sound_effect_with_times",
        "sound_effect_filename",
        "sound_effect_name",
        "sound_effect_named",
        "sound_effect_playing",
        "stop_sound_effect"
    ];

    // Check if any audio functions are present in the source code
    if (audioFunctions.some(func => source.includes(func))) {
        // Set flag to prevent the audio notification from showing again
        audioNotificationRunOnce = true;
        // Display notification and return it so that it can be globally accessed and removed if needed
        return displayEditorNotification("Audio functions are present in the code! Please click into the window to hear audio.", NotificationIcons.WARNING, -1);
    }
    return null;
}

// Functions to run/pause/continue/stop/restart the program itself
async function runProgram(){
    try {
        clearErrorLines();
       // the notification object returned by displayEditorNotification
        const notificationMessage = activeLanguageSetup.compiled ? "Compiling project..." : "Building project...";
        let currentNotification = displayEditorNotification(notificationMessage,NotificationIcons.CONSTRUCTION,-1);   
        // give the notification a chance to show
        await asyncSleep();
        let currentCompiler = await getCurrentCompiler();

        if (currentCompiler == null) {
            currentNotification.deleteNotification(); // delete the current notification if no compiler is found
            return;
        }

        async function mapBit(filename){
            let source = await fileAsString(await storedProject.access((project) => project.readFile(filename)));
            if (SKO.language == "C++" && !audioNotificationRunOnce) audioNotification = audioFunctionNotification(source);
            return {
                name: filename,
                source: source
            };
        }
        let compilableFiles = await findAllCompilableFiles();
        let sourceFiles = await findAllSourceFiles();
        if (compilableFiles.length == 0) {
            currentNotification.deleteNotification(); 
            const notificationMessage = "Project has no source files! In a " + activeLanguage.name + " project, valid source files end with:</br><ul>" + 
            activeLanguage.compilableExtensions.map((s) => "<li>." + s + "</li>").join("") + "</ul>";
            displayEditorNotification(notificationMessage,NotificationIcons.ERROR,-1);
            return;
        }

        let compiled = await currentCompiler.compileAll(await Promise.all(compilableFiles.map(mapBit)), await Promise.all(sourceFiles.map(mapBit)), reportCompilationError);

        currentNotification.deleteNotification();

        if (compiled.output != null) {
            executionEnviroment.runProgram(compiled.output);
        } 
        else {
            displayEditorNotification("Project has errors! Please see terminal for details.",NotificationIcons.ERROR,-1);
        }
    }
    catch (err) {
        displayEditorNotification("Failed to run program!<br/>"+err.toString(),NotificationIcons.ERROR,-1);
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
function updateButtons() {
    // First disable the update code button if we can't execute
    document.getElementById("runOne").disabled = !allowExecution;

    // Get if the program buttons should be on
    let runProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Unstarted && !executionEnviroment.hasRunOnce;
    let continueProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Paused
    let restartProgramButtonOn = executionEnviroment.hasRunOnce;
    let stopProgramButtonOn = executionEnviroment.executionStatus == ExecutionStatus.Running;

    // Update the main program buttons
    updateProgramButton("runProgram", allowExecution, runProgramButtonOn);
    updateProgramButton("continueProgram", allowExecution, continueProgramButtonOn);
    updateProgramButton("restartProgram", allowExecution, restartProgramButtonOn);
    updateProgramButton("stopProgram", allowExecution, stopProgramButtonOn);

    // Update the collapsed program buttons
    updateProgramButton("collapsedRunProgram", allowExecution, runProgramButtonOn);
    updateProgramButton("collapsedContinueProgram", allowExecution, continueProgramButtonOn);
    updateProgramButton("collapsedRestartProgram", allowExecution, restartProgramButtonOn);
    updateProgramButton("collapsedStopProgram", allowExecution, stopProgramButtonOn);
}

// Update the visibility and disabled state of a program button based on the state of the ExecutionEnvironment
function updateProgramButton(buttonId, allowExecution, buttonOn) {
    let button = document.getElementById(buttonId);
    button.disabled = !(allowExecution && buttonOn);
    button.style.display = !buttonOn ? "none" : "";
}

function setupIDEButtonEvents() {
    // Add events for the code view
    document.getElementById("runOne").addEventListener("click", function () {
        if (currentEditor == null) return;
        currentEditor.save();
        if (activeLanguageSetup.supportHotReloading) currentEditor.runOne();
        else currentEditor.syntaxCheck();
    });

    // Add events to new file source file button
    document.getElementById("addSourceFile").addEventListener("click", openUntitledCodeEditor);

    // Add events for the main program buttons
    setupProgramButton("runProgram", runProgram);
    setupProgramButton("continueProgram", continueProgram);
    setupProgramButton("restartProgram", restartProgram);
    setupProgramButton("stopProgram", pauseProgram);

    // Add events for the collapsed program buttons
    setupProgramButton("collapsedRunProgram", runProgram, true);
    setupProgramButton("collapsedContinueProgram", continueProgram, true);
    setupProgramButton("collapsedRestartProgram", restartProgram, true);
    setupProgramButton("collapsedStopProgram", pauseProgram, true);

    // Add events for the project buttons
    document.getElementById("UploadProject").addEventListener("click", () => document.getElementById("projectuploader").click());

    setupProjectButton("DownloadProject", downloadProject);
    setupProjectButton("NewProject", () => newProject(activeLanguageSetup.getDefaultProject()));
    setupProjectButton("LoadDemo", () => ShowProjectLoader("Choose a demo project:", LoadDemoProjects));

    if (!activeLanguageSetup.supportHotReloading) document.getElementById("runOne").children[0].innerText = "Syntax Check File";
}

function setupProjectButton(buttonId, callback) {
    document.getElementById(buttonId).addEventListener("click", async () => callback());
}

function setupProgramButton(buttonId, callback, collapseView) {
    document.getElementById(buttonId).addEventListener("click", async function () {
        if (collapseView) collapseProgramViewToggle();
        await saveAllOpenCode();
        callback();
    });
}

/*
Toggle collapsed view

Example HTML for a collapsible view:
    <div id="viewContainer">
        <div class="sk-column">
            <!-- Main view -->
        </div>
        <div class="sk-collapsed-column sk-hidden">
            <!-- Collapsed view -->
        </div>
    </div>
*/
function collapseViewToggle(containerId) {
    // Get the container, the main view, and the collapsed view
    let viewContainer = document.getElementById(containerId);
    // The first child should be the main view, the second should be the collapsed view
    let view = viewContainer.firstElementChild;
    let collapsedView = viewContainer.lastElementChild;

    // Toggle the visibility of the main view and the collapsed view
    view.classList.toggle("sk-hidden");
    collapsedView.classList.toggle("sk-hidden");

    // Restore the original width of the view container if it was saved
    // Otherwise, save the original width and set the width to auto
    if (viewContainer.dataset.originalWidth) {
        viewContainer.style.width = viewContainer.dataset.originalWidth;
        delete viewContainer.dataset.originalWidth;
    } else {
        viewContainer.dataset.originalWidth = viewContainer.style.width;
        viewContainer.style.width = "auto";
    }

    // Prevent the user from being able to resize the view when the view is collapsed
    // The gutter is placed either before or after the view container depending on which side of the screen the view is on
    let gutter = viewContainer.previousElementSibling || viewContainer.nextElementSibling;
    if (!gutter.firstChild.classList.contains("gutter")) gutter = viewContainer.previousElementSibling || viewContainer.nextElementSibling;
    gutter.style.pointerEvents = view.classList.contains("sk-hidden") ? "none" : "";
}

function collapseFileViewToggle() {
    collapseViewToggle("fileViewContainer");
}

function collapseProgramViewToggle() {
    collapseViewToggle("runtimeContainer");
}

function setupMinifiedInterface() {
    if (SKO.useMinifiedInterface) {
        // Add the sk-minified class to the body if the minified interface option is enabled
        // that way we can style the interface differently
        document.body.classList.add("sk-minified");
        // If the minification option is enabled, the files and program view should be collapsed by default
        collapseFileViewToggle();
        collapseProgramViewToggle();
    }
}

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

/*
This is not great design. A better refactor would be to make the various
'filesystem' related objects (StoredProject, ExecutionEnvironment(Internal), etc)
inherit from a class that defines these functions. Already this is duplicating
some stuff that exists in StoredProject.
*/
function FSsplitPath(path){
    return path.split("/").slice(1);
}
async function FSEnsurePath(FS, path) {
    let pathBits = FSsplitPath(path);
    let dir = "/";
    for (let ii = 0; ii < pathBits.length-1; ii ++) {
        try {
            await FS.mkdir(dir + pathBits[ii]);
        } catch (err){
            if (err.toString() != "ErrnoError: File exists" /*again, a hack to deal with our various error types. Something like err.errno != 20 (from Module['ERRNO_CODES']['EEXIST']) would be nicer*/)
                throw err;
        }
        dir += pathBits[ii] + "/";
    }
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
                    promises.push(FSEnsurePath(unifiedFS, abs_path+"/"));
                }
                else{
                    promises.push(async function () {
                        let uint8_view = await zip.file(rel_path).async("uint8array");
                        await FSEnsurePath(unifiedFS, abs_path);
                        await unifiedFS.writeFile(abs_path, uint8_view)
                    }());
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

async function FSviewFiletran(filename) {
    let content = undefined;

    try {
        content = await executionEnviroment.readFile(filename);
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
    let projectName = (await appStorage.access((s) => s.getProject(storedProject.projectID))).name;
    downloadFileGeneric(await projectToZip(), projectName + ".zip");
}

function openProjectFile(filename) {
    let extension = getExtension(filename);
    if (activeLanguage.sourceExtensions.indexOf(extension) > -1) {
        openCodeEditor(filename);
    } else {
        FSviewFile(filename)
    }
}

async function loadProjectFromURL(url){
    return fetch(url).then(res => res.blob()).then(async blob => {
        await newProject(function(){});

        await projectFromZip(blob);

        openCodeEditors();
    });
}

// ------ Project Zipping/Unzipping Click Handling ------
async function uploadProjectFromInput(){
    let reader = new FileReader();
    let files = document.getElementById('projectuploader').files;
    let file = files[0];
    await newProject(function(){});

    await projectFromZip(file);

    openCodeEditors();
}


// ----- Program Runtime & Error Reporting -----
function clearErrorLines(){
    for (let editor of editors){
        for (var i = 0; i < editor.editor.lineCount(); i++) {
            editor.editor.removeLineClass(i, "wrap", "error-line");
        }
    }
}

// Update buttons when the state of the ExecutionEnvironment changes
function setupProgramExecutionEvents(){
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
}

// ----- Handle "Project Opened in Another Tab" Conflict -----
let projectConflictModal = null;

let userHasIgnoredProjectConflict = false;

function setupProjectConflictAndConfirmationModals() {
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
}


function addErrorEventListeners(){
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
}

function AddWindowListeners(){
    window.addEventListener('message', async function(m){
        switch (m.data.eventType){
            case "InitializeProjectFromOutsideWorld":
                await newProject(async function(storedProject){
                    // load individual files
                    await initializeFromFileList(storedProject, m.data.files)
                });
                // load from requested zips
                if (m.data.zips) {
                    for(let i = 0; i < m.data.zips.length; i ++) {
                        await projectFromZip(m.data.zips[i].data);
                    }
                }
                break;
        }
    }, false);
}