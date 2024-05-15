"use strict";

let userCodeBlockIdentifier = "__USERCODE__";

// Base class for all Execution Environments
class ExecutionEnvironmentInternal {
    constructor(listenOn) {
        const self = this;
        // ------ Message Listening ------
        listenOn.addEventListener('message', async function(m){
            try {
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
                        await self.runProgram(m.data.program);
                        break;
                    case "PauseProgram":
                        await self.pauseProgram();
                        break;
                    case "ContinueProgram":
                        await self.continueProgram();
                        break;
                    case "StopProgram":
                        await self.stopProgram();
                        break;

                    case "callback":
                        executeTempCallback(m.data);
                        break;

                    // --- FS Handling ---
                    case "mkdir":
                        await self.mkdir(m.data.path);
                        break;

                    case "writeFile":
                        await self.writeFile(m.data.path,m.data.data);
                        break;

                    case "rename":
                        await self.rename(m.data.oldPath,m.data.newPath);
                        break;

                    case "rmdir":
                        await self.rmdir(m.data.path, m.data.recursive);
                        break;

                    case "unlink":
                        await self.unlink(m.data.path);
                        break;
                }

                resolveMessageFallible(m, undefined, parent);
            } catch(err){
                // TODO: Do anything other than this.
                err = err.toString();
                rejectMessageFallible(m, err, parent);
                throw err;
            }
        });
    }

    signalReady() { parent.postMessage({type:"initialized"},"*"); }
    signalStarted() { parent.postMessage({type:"programStarted"},"*"); }
    signalStopped() { parent.postMessage({type:"programStopped"},"*"); }
    signalPaused()  { parent.postMessage({type:"programPaused"},"*"); }
    signalContinue(){ parent.postMessage({type:"programContinued"},"*"); }

    sendProgram(program)                      { throw new Error("Unhandled sendProgram");}
    hotReloadFile(name, code)                 { throw new Error("Unhandled hotReloadFile");}
    resetExecutionScope()                     { throw new Error("Unhandled resetExecutionScope");}
    async runProgram(program)                 { throw new Error("Unhandled runProgram");}
    async pauseProgram()                      { throw new Error("Unhandled pauseProgram");}
    async continueProgram()                   { throw new Error("Unhandled continueProgram");}
    async stopProgram()                       { throw new Error("Unhandled stopProgram");}
    async mkdir(path)                         { throw new Error("Unhandled mkdir");}
    async rmdir(path, recursive)              { throw new Error("Unhandled rmdir");}
    async writeFile(path, data)               { throw new Error("Unhandled writeFile");}
    async unlink(path)                        { throw new Error("Unhandled unlink");}
    async rename(oldPath, newPath)            { throw new Error("Unhandled rename");}
    async initializeFilesystem(folders, files){ throw new Error("Unhandled initializeFilesystem");}

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