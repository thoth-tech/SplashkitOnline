// IDE specific action queues

let IDECoreInitQueue = new ActionQueue("IDECoreInitQueue", {
    cancelRunning: false,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [],
});

// These three execute in parallel, after IDECoreInitQueue has cleared
let CompilerInitQueue = new ActionQueue("CompilerInitQueue", {
    cancelRunning: false,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [IDECoreInitQueue],
});
let ExecutionEnvironmentLoadQueue = new ActionQueue("ExecutionEnvironmentLoadQueue", {
    cancelRunning: false,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [IDECoreInitQueue],
});
let InitializeProjectQueue = new ActionQueue("InitializeProjectQueue", {
    cancelRunning: true,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [IDECoreInitQueue],
});

// These cancel if the project is re-initialized/loaded
// Can have multipled scheduled - they don't cancel eachother out'
/* Note: LoadProjectQueue actions use the UnifiedFS - so they write to both the
         project FS and the transient FS in the ExecutableEnvironment.
         We mirror inbetween 'Init'ing the project, and Loading data into it.
*/
let MirrorProjectQueue = new ActionQueue("MirrorProjectQueue", {
    cancelRunning: true,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [InitializeProjectQueue],
    cancelOn: [InitializeProjectQueue],
});
let LoadProjectQueue = new ActionQueue("LoadProjectQueue", {
    cancelRunning: false,
    replaceQueued: false,
    maxQueued: 100,
    waitOn: [ExecutionEnvironmentLoadQueue, InitializeProjectQueue, MirrorProjectQueue],
    cancelOn: [InitializeProjectQueue, ExecutionEnvironmentLoadQueue],
});

// This only executes if everything has loaded, and cancels if another project is loaded
let LanguageSwitchAfterLoadQueue = new ActionQueue("LanguageSwitchAfterLoadQueue", {
    cancelRunning: true,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [LoadProjectQueue],
    cancelOn: [LoadProjectQueue, InitializeProjectQueue],
});

// TODO: This only executes if everything has loaded, and cancels if another project is loaded
let CompileQueue = new ActionQueue("CompileQueue", {
    cancelRunning: true,
    replaceQueued: true,
    maxQueued: 1,
    waitOn: [CompilerInitQueue, InitializeProjectQueue, ExecutionEnvironmentLoadQueue],
    cancelOn: [InitializeProjectQueue],
});

// add loadUserProject!!!!!!!!!!!!!!!!
let LoadUserProjectQueue = new ActionQueue("LoadUserProjectQueue", {
    cancelRunning: false,
    replaceQueued: false,
    maxQueued: 100,
    waitOn: [ExecutionEnvironmentLoadQueue, InitializeProjectQueue],
    cancelOn: [InitializeProjectQueue, ExecutionEnvironmentLoadQueue],
});

// Whenever both execution environment and load project queue clear, mirror the project
ActionQueue.OnClear([ExecutionEnvironmentLoadQueue, InitializeProjectQueue], async function(){
    MirrorProjectQueue.Schedule("Mirror", async function(){
        // mirror project once execution environment +
        // project are ready
        await mirrorProject();
    });
});

// Update execution state whenever these queues clear
[
    InitializeProjectQueue,
    MirrorProjectQueue,
    LoadProjectQueue,
    CompilerInitQueue,
    ExecutionEnvironmentLoadQueue,
].forEach(queue => ActionQueue.OnClear([queue], updateCodeExecutionState));

// TODO: refactor this so that it's clearer where each
//       global variable is initialized/setup (should they be
//       global in the first place? Probably not...)
async function StartIDE() {
    IDECoreInitQueue.Schedule("IDECoreInit", async function IDECoreInitQueue (isCanceled){
        // Interface setup
        createGutterSplitters();
        setupLanguageSelectionBox();

        // Initialize language
        setupActiveLanguage();
        setupIDEButtonEvents(); // uses current language

        // Create execution environment and project storage objects
        executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"), activeLanguageSetup);
        appStorage = new AppStorage();
        
        // Check if projectID exists in URL, if so, load that project
        let projectID = SKO.projectID;
        if (projectID) {
            storedProject = new IDBStoredProject(appStorage, projectID);  // Use project ID if available
        } 
        else {
            storedProject = new IDBStoredProject(appStorage, activeLanguageSetup.getDefaultProject());  // Default project
        }

        unifiedFS = new UnifiedFS(storedProject, executionEnviroment);

        // Setup callbacks/listeners
        addErrorEventListeners();
        setupProgramExecutionEvents();
        disableCodeExecution();

        setupProjectConflictAndConfirmationModals();
        setupCodeEditorCallbacks();
        setupFilePanelAndEvents();

        setupMinifiedInterface();
    });

    // use LoadUserProjectQueue to load user projects!!!!!!!!!
    LoadUserProjectQueue.Schedule("LoadUserProjects", async function() {
        await ShowProjectLoader("Choose a project to load:", loadUserProjects);
    });

    CompilerInitQueue.Schedule("CompilerInit", async function CompilerInitQueue (isCanceled){
        await initializeLanguageCompilerFiles(activeLanguageSetup);
        await executionEnviroment.updateCompilerLoadProgress(1);
    });

    ExecutionEnvironmentLoadQueue.Schedule("ExecutionEnvironmentInit", async function ExecutionEnvironmentLoadQueue (isCanceled){
        await executionEnviroment.initialize();
    });

    InitializeProjectQueue.Schedule("LoadLastProjectInit", async function InitializeProjectQueue (isCanceled){
        await isCanceled();

        await appStorage.attach();

        await isCanceled();

        await storedProject.attachToProject();

        await isCanceled();

        openCodeEditors();
    });

    AddWindowListeners();

    // Focus the window, this is used in order to detect if the user clicks inside the iFrame containing the program
    window.focus();
}

StartIDE();
