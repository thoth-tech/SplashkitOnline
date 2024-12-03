async function StartIDE() {
    makingNewProject = true;

    // Interface setup
    createGutterSplitters();
    setupLanguageSelectionBox();

    // Initialize language
    setupActiveLanguage();
    setupIDEButtonEvents();

    // Create execution environment and project storage objects
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
    setupMinifiedInterface();

    // Initialize compiler in parallel with everything else
    await Promise.all([
        (async () => {
            await initializeLanguageCompilerFiles(activeLanguageSetup);
            executionEnviroment.updateCompilerLoadProgress(1);
        })(),
        (async () => {
            await Promise.all([
                executionEnviroment.initialize(),
                (async () => {
                    await appStorage.attach();
                    await storedProject.attachToProject();

                    // Load project from URL if specified
                    if (SKO.projectURL) {
                        try {
                            console.log(`Loading project from URL: ${SKO.projectURL}`);
                            await loadProjectFromURL(SKO.projectURL);
                            console.log("Project loaded successfully.");
                        } catch (error) {
                            console.error("Error loading project from URL:", error);
                        }
                    }

                    openCodeEditors();
                })()
            ]);

            makingNewProject = false;

            // Mirror project once execution environment + project are ready
            await mirrorProject();
        })()
    ]);

    // Enable code execution once project is mirrored to the execution environment and compiler is ready
    updateCodeExecutionState();

    AddWindowListeners();
}

// Focus the window for detecting user interaction inside the iFrame
window.focus();

// Start the IDE
StartIDE();
