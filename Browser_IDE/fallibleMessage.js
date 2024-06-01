"use strict";
// Temporary callbacks for inter-window messaging

let __tempCallbacks = new Map();
let __nextTempCallbackID = 0;

class PromiseChannel {
    constructor(listener, receiver) {
        this.receiver = receiver;
        this.listener = listener;
        this.events = new Map();

        if (this.listener != null) {
            this.listener.addEventListener("message", (m) => {
                if (m.data.type == "callback"){
                    m.stopPropagation()
                    this.executeTempCallback(m.data);
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
                        Promise.resolve(eventFn(m.data)).then((result) => {
                            this.resolveMessageFallible(m, result);
                        }).catch((err) => {
                            this.rejectMessageFallible(m, err);
                        })
                    }
                    catch (err) {
                        this.rejectMessageFallible(m, err);
                    }
                } else {
                    eventFn(m.data);
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

    async postMessage(eventType, message){
        let self = this;
        return new Promise((resolve, reject) => {
            let _message = structuredClone(message ?? {});
            _message.callbackID = registerTempCallback((result, error) => {
                if(error !== undefined) reject(error);
                else resolve(result);
            });
            _message.type = eventType;

            self.receiver.postMessage(_message, isWorker(self.receiver) ? null : "*");
        });
    }

    setEventListener(eventName, eventFn){
        this.events.set(eventName, eventFn);
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

function registerTempCallback(callbackFn){
    let callbackID = __nextTempCallbackID++;
    __tempCallbacks.set(callbackID, {callbackFn});
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