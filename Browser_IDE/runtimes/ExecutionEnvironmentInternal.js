"use strict";

let userCodeBlockIdentifier = "__USERCODE__";

// Base class for all Execution Environments
class ExecutionEnvironmentInternal {
    constructor(listenOn) {
        const self = this;

        // ------ Message Listening ------
        this.channel = new PromiseChannel(listenOn, parent);
        // --- FS Handling ---
        this.channel.setEventListener("mkdir", async function (data){
            await self.mkdir(data.path);
        });
        this.channel.setEventListener("writeFile", async function (data){
            await self.writeFile(data.path, data.data);
        });
        this.channel.setEventListener("rename", async function (data){
            await self.rename(data.oldPath, data.newPath);
        });
        this.channel.setEventListener("rmdir", async function (data){
            await self.rmdir(data.path, data.recursive);
        });
        this.channel.setEventListener("unlink", async function (data){
            await self.unlink(data.path);
        });

        // --- Code Execution Functions ---
        this.channel.setEventListener("CleanEnvironment", async function (data){
            await self.resetExecutionScope();
        });
        this.channel.setEventListener("HotReloadFile", async function (data){
            self.hotReloadFile(data.name, data.code);
        });
        this.channel.setEventListener("ReportError", async function (data){
            self.ReportError(userCodeBlockIdentifier + data.block, data.message, data.line, data.stackTrace, data.formatted);
        });
        this.channel.setEventListener("WriteToTerminal", async function (data){
            self.WriteToTerminal(data.message);
        });
        this.channel.setEventListener("RunProgram", async function (data){
            await self.runProgram(data.program);
        });
        this.channel.setEventListener("PauseProgram", async function (data){
            await self.pauseProgram();
        });
        this.channel.setEventListener("ContinueProgram", async function (data){
            await self.continueProgram();
        });
        this.channel.setEventListener("StopProgram", async function (data){
            await self.stopProgram();
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

    ReportError(block, message, line,stackTrace, formatted) {
        ReportError(block, message, line,stackTrace, formatted); // call external function
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