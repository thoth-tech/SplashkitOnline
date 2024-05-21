"use strict";

let userCodeBlockIdentifier = "__USERCODE__";

// Base class for all Execution Environments
class ExecutionEnvironment {
    constructor(listenOn) {
        const self = this;
        // ------ Message Listening ------
        listenOn.addEventListener('message', function(m){
            switch(m.data.type){
                // --- Code Execution Functions ---
                case "HotReloadFile":
                    self.hotReloadFile(m.data.name, m.data.code);
                    break;

                case "ReportError":
                    self.ReportError(userCodeBlockIdentifier + m.data.block, m.data.message, m.data.line, m.data.formatted);
                    break;

                case "WriteToTerminal":
                    self.WriteToTerminal(m.data.message);
                    break;

                case "CleanEnvironment":
                    self.resetExecutionScope();
                    break;

                case "RunProgram":
                    self.runProgram(m.data.program);
                    break;
                case "PauseProgram":
                    self.pauseProgram();
                    break;
                case "ContinueProgram":
                    self.continueProgram();
                    break;
                case "StopProgram":
                    self.stopProgram();
                    break;

                // --- FS Handling ---
                case "mkdir":
                    self.mkdir(m.data.path);
                    break;

                case "writeFile":
                    self.writeFile(m.data.path,m.data.data);
                    break;

                case "rename":
                    self.rename(m.data.oldPath,m.data.newPath);
                    break;
            }
        });
    }

    signalReady() { parent.postMessage({type:"initialized"},"*"); }
    signalStarted() { parent.postMessage({type:"programStarted"},"*"); }
    signalStopped() { parent.postMessage({type:"programStopped"},"*"); }
    signalPaused()  { parent.postMessage({type:"programPaused"},"*"); }
    signalContinue(){ parent.postMessage({type:"programContinued"},"*"); }

    sendProgram(program)                { throw new Error("Unhandled sendProgram");}
    hotReloadFile(name, code)           { throw new Error("Unhandled hotReloadFile");}
    resetExecutionScope()               { throw new Error("Unhandled resetExecutionScope");}
    async runProgram(program)           { throw new Error("Unhandled runProgram");}
    async pauseProgram()                { throw new Error("Unhandled pauseProgram");}
    async continueProgram()             { throw new Error("Unhandled continueProgram");}
    async stopProgram()                 { throw new Error("Unhandled stopProgram");}
    mkdir(path)                         { throw new Error("Unhandled mkdir");}
    writeFile(path, data)               { throw new Error("Unhandled writeFile");}
    rename(oldPath, newPath)            { throw new Error("Unhandled rename");}
    initializeFilesystem(folders, files){ throw new Error("Unhandled initializeFilesystem");}

    ReportError(block, message, line, formatted) {
        ReportError(block, message, line, formatted); // call external function
    }

    reportCriticalInitializationFail(message) {
        parent.postMessage({type:"onCriticalInitializationFail", message:message},"*");
    }

    WriteToTerminal(message) {
        writeTerminal(message);
    }

    Reload() {
        parent.postMessage({type:"executionEnvironmentReloadRequest"},"*");
    }

    GetFilesystem() {
        parent.postMessage({type:"executionEnvironmentGetFilesystemRequest"},"*");
    }
}