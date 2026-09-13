// define and create the ExecutionEnvironmentInternal subclass
class ExecutionEnvironmentInternalCSharp extends ExecutionEnvironmentInternal {
    constructor(listenOn) {
        super(listenOn);

        // The C# backend runs to completion in a single shot, so it has no
        // natural point at which to report that it has finished. main.js
        // raises this event once CompileAndRun resolves, which lets us return
        // the IDE to the stopped state.
        document.addEventListener("compileAndRunComplete", () => {
            this.signalStopped();
        });
    }

    async runProgram(program) {
        // Report that the program has started.
        //
        // Without this the parent ExecutionEnvironment never leaves
        // ExecutionStatus.Unstarted and hasRunOnce stays false, so the Restart
        // and Stop controls are never shown (see updateButtons() in
        // javascript/UI/editorMain.js). Every subsequent click then falls
        // through the plain Run path, which - unlike restartProgram() - does
        // not call cleanEnvironment(), leaving the previous run's canvas in
        // place and producing a blank canvas on re-run.
        await this.signalStarted();

        const event = new CustomEvent("compileAndRun", {
            detail: {
                program: program,
                reportError: executionEnvironment.ReportError,
            },
        });
        // This event will be handled in the CSharpWasm/main.js file
        document.dispatchEvent(event);
    }

    async stopProgram() {
        // The C# backend runs synchronously to completion and cannot be
        // interrupted part-way through, so this reports the stopped state
        // rather than aborting execution. restartProgram() awaits this
        // resolving before it calls cleanEnvironment().
        this.signalStopped();
    }

    async pauseProgram() {
        // Not supported. The C# backend has no loop-yielding model, so there
        // is no safe point at which to suspend it. Kept as a no-op so the
        // base class does not throw "Unhandled pauseProgram".
        console.warn("pauseProgram is not supported by the C# runtime.");
    }

    async continueProgram() {
        // See pauseProgram above.
        console.warn("continueProgram is not supported by the C# runtime.");
    }

    resetExecutionScope() {
        // Nothing to tear down on the JS side - loadDotNet() recreates the
        // .NET runtime on the next run.
    }
}

let executionEnvironment = null;

// set everything up!
executionEnvironment = new ExecutionEnvironmentInternalCSharp(window);

// make canvas take focus when clicked
Module.canvas.addEventListener("click", async function () {
    Module.canvas.focus();
});

// send terminal input on enter
runtimeLoadingProgress(1);

executionEnvironment.signalReady();
