// TODO: refactor this so that it's clearer where each
//       global variable is initialized/setup (should they be
//       global in the first place? Probably not...)
async function StartIDE() {
    makingNewProject = true;
    // Interface setup
    setupIDEExecutionButtons();
    createGutterSplitters();
    setupLanguageSelectionBox();

    // Initialize language
    setupActiveLanguage();
    SetupIDEButtonEvents(); // uses current language

    // Create execution environment and project storage objects
    // These constructors don't _do_ anything important.
    executionEnviroment = new ExecutionEnvironment(document.getElementById("ExecutionEnvironment"), activeLanguageSetup);
    appStorage = new AppStorage();
    storedProject = new IDBStoredProject(appStorage, activeLanguageSetup.getDefaultProject());
    unifiedFS = new UnifiedFS(storedProject, executionEnviroment);

    // Setup callbacks/listeners
    addErrorEventListeners();
    setupProgramExecutionEvents();
    disableCodeExecution();

    setupProjectConflictAndConfirmationModals();
    setupCodeEditorCallbacks();
    setupFilePanelAndEvents();

    // Initialize compiler in parallel with everything else
    // This is where the bulk of the startup occurs
    await Promise.all([
        (async () => {
            await initializeLanguageCompilerFiles(activeLanguageSetup);
            executionEnviroment.updateCompilerLoadProgress(1);
        })(),
        (async () => {
            // Initialize execution environment
            // in parallel with project+treeview
            await Promise.all([
                executionEnviroment.initialize(),
                (async () => {
                    await appStorage.attach();
                    await storedProject.attachToProject();
                })()
            ])

            makingNewProject = false;

            // mirror project once execution environment +
            // project are ready
            await mirrorProject();
        })()
    ]);

    // enable code execution once project is mirrored to the execution
    // environment and compiler is ready.
    updateCodeExecutionState();
}

StartIDE();