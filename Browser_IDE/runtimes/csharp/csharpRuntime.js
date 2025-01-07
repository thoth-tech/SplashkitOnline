// define and create the ExecutionEnvironmentInternal subclass
class ExecutionEnvironmentInternalCSharp extends ExecutionEnvironmentInternal {
    constructor(listenOn) {
        return super(listenOn);
    }

    async runProgram(program) {
        const event = new CustomEvent("compileAndRun", {
            detail: {
                program: program,
                reportError: executionEnvironment.ReportError,
            },
        });
        // temporal solution to run
        document.dispatchEvent(event);
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
