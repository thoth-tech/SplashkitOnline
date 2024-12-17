"use strict";
// Temporary callbacks for inter-window messaging

let __tempCallbacks = new Map();
let __nextTempCallbackID = 0;

class PromiseChannel {
    constructor(listener, receiver) {
        this.receiver = receiver;
        this.listener = listener;
        this.events = new Map();

        this.dummySignalFunction = function(signalName, data){};

        if (this.listener != null) {
            this.listener.addEventListener("message", (m) => {
                if (m.data.type == "callback"){
                    m.stopPropagation()
                    this.executeTempCallback(m.data);
                    return;
                }
                if (m.data.type == "signalCallback"){
                    m.stopPropagation()
                    this.executeSignalCallback(m.data);
                    return;
                }

                let isAwaited = typeof m.data == 'object' && 'callbackID' in m.data;
                let eventFn = this.events.get(m.data.type);

                if (eventFn == undefined) {
                    if (isAwaited)
                        this.rejectMessageFallible(m, new Error("Unhandled event: " + m.data.type), this.receiver);
                    return;
                }

                m.stopPropagation();

                if (isAwaited) {
                    try {
                        Promise.resolve(eventFn(m.data, (signalName, data) => this.signalMessageFallible(m, signalName, data))).then((result) => {
                            this.resolveMessageFallible(m, result);
                        }).catch((err) => {
                            this.rejectMessageFallible(m, err);
                        })
                    }
                    catch (err) {
                        this.rejectMessageFallible(m, err);
                    }
                } else {
                    eventFn(m.data, this.dummySignalFunction /*can't send back anyway*/);
                }

            }, true);
        }
    }

    setReceiver(receiver) {
        this.receiver = receiver;
    }

    async executeTempCallback(eventData){
        try {
            await __tempCallbacks.get(eventData.responseCallbackID).callbackFn(eventData.result, eventData.error);
        } catch(e){
            throw e;
        } finally {
            __tempCallbacks.delete(eventData.responseCallbackID);
        }
    }

    async executeSignalCallback(eventData){
        let signalFunc = __tempCallbacks.get(eventData.responseCallbackID).signalFns[eventData.signalName];
        if (signalFunc)
            await signalFunc(eventData.data);
    }

    async postMessage(eventType, message, signals){
        let self = this;
        return new Promise((resolve, reject) => {
            let _message = structuredClone(message ?? {});
            _message.callbackID = registerTempCallback((result, error) => {
                if(error !== undefined) reject(error);
                else resolve(result);
            }, signals);
            _message.type = eventType;

            self.receiver.postMessage(_message, isWorker(self.receiver) ? null : "*");
        });
    }

    setEventListener(eventName, eventFn){
        this.events.set(eventName, eventFn);
    }

    signalMessageFallible(m, signalName, data){
        this.receiver.postMessage({
            type: "signalCallback",
            responseCallbackID: m.data.callbackID,
            signalName: signalName,
            data: data,
        }, isInWorker() ? null : "*");
    }

    resolveMessageFallible(m, result){
        this.receiver.postMessage({
            type: "callback",
            responseCallbackID: m.data.callbackID,
            result: result,
            error: undefined,
        }, isInWorker() ? null : "*");
    }

    rejectMessageFallible(m, err){
        this.receiver.postMessage({
            type: "callback",
            responseCallbackID: m.data.callbackID,
            result: null,
            error: err.toString(),
        }, isInWorker() ? null : "*");
    }
}

function registerTempCallback(callbackFn, signalFns){
    let callbackID = __nextTempCallbackID++;
    __tempCallbacks.set(callbackID, {callbackFn, signalFns});
    return callbackID;
}

function isWorker(oWindow){
    return (oWindow instanceof Worker) || (oWindow instanceof ServiceWorker);
}

function isInWorker(){
    return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);
}

function resolveMessageFallibleManual(m, result, oWindow=self){
    if(typeof m.data == 'object' && 'callbackID' in m.data){
        oWindow.postMessage({
            type: "callback",
            responseCallbackID: m.data.callbackID,
            result: result,
            error: undefined,
        }, isInWorker() ? null : "*");
    }
}