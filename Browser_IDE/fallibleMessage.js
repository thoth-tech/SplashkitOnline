"use strict";
// Temporary callbacks for inter-window messaging

let __tempCallbacks = new Map();
let __nextTempCallbackID = 0; // I *believe* a global counter like this is safe.

function registerTempCallback(callbackFn){
    let callbackID = __nextTempCallbackID++;
    __tempCallbacks[callbackID] = callbackFn;
    return callbackID;
}

async function executeTempCallback(eventData){
    try {
        await __tempCallbacks[eventData.responseCallbackID](eventData.result, eventData.error);
    } catch(e){
        throw e;
    } finally {
        __tempCallbacks.delete(eventData.responseCallbackID);
    }
}

function isWorker(oWindow){
    return (oWindow instanceof Worker) || (oWindow instanceof ServiceWorker);
}

function isInWorker(){
    return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);
}

async function postMessageFallible(oWindow, message){
    return new Promise((resolve, reject) => {
        let _message = structuredClone(message);
        _message.callbackID = registerTempCallback((result, error) => {
            if(error !== undefined) reject(error);
            else resolve(result);
        });

        oWindow.postMessage(_message, isWorker(oWindow) ? null : "*");
    });
}

function resolveMessageFallible(m, result, oWindow=self){
    if(typeof m.data == 'object' && 'callbackID' in m.data){
        oWindow.postMessage({
            type: "callback",
            responseCallbackID: m.data.callbackID,
            result: result,
            error: undefined,
        }, isInWorker() ? null : "*");
    }
}

function rejectMessageFallible(m, err, oWindow=self){
    if(typeof m.data == 'object' && 'callbackID' in m.data){
        oWindow.postMessage({
            type: "callback",
            responseCallbackID: m.data.callbackID,
            result: null,
            error: err,
        }, isInWorker() ? null : "*");
    }
}