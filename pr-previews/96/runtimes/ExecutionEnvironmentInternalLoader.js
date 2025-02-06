"use strict";

let hasInitializedLanguage = false;

let globalLoadingBarDownloadSet = null;
let runtimeLoadingProgress = null;
let compilerLoadingProgress = null;
let serviceWorkerLoadingProgress = null;
let serviceWorkerLoaded = null;

let SKO = null;

window.addEventListener('message', function(m){
    if (m.data.type == "InitializeLanguage"){
        if (hasInitializedLanguage){
            console.error("Double call to InitializeLanguage, please investigate and fix!");
            return;
        }
        hasInitializedLanguage = true;

        SKO = m.data.SKO;

        globalLoadingBarDownloadSet = new DownloadSet((progress) => {
            if (progress < 0) {
                showLoadingContainer();
                showDownloadFailure();
            }
            else if (progress < 1) {
                showLoadingContainer();
                updateLoadingProgress(progress);
            } else {
                updateLoadingProgress(progress);
                hideLoadingContainer();
            }
        }, 0);

        runtimeLoadingProgress = globalLoadingBarDownloadSet.addManualReporter(m.data.runtimeSizeAprox);
        compilerLoadingProgress = globalLoadingBarDownloadSet.addManualReporter(m.data.compilerSizeAprox);
        serviceWorkerLoadingProgress = globalLoadingBarDownloadSet.addManualReporter(m.data.compilerSizeAprox*0.1);

        if (m.data.needsServiceWorker){
            serviceWorkerLoaded = registerServiceWorker(serviceWorkerLoadingProgress);
        } else {
            serviceWorkerLoadingProgress(1);
        }

        console.log("Initializing with " + m.data.languageName);
        for (let script of m.data.runtimeFiles){
            var s = document.createElement("script");

            s.src = script;
            s.async = false;
            document.documentElement.appendChild(s);
        }
    }
    if (m.data.type == "UpdateCompilerLoadProgress"){
        compilerLoadingProgress(m.data.progress);
    }
}, false);



// Service worker, which is used to provide a location we can send events to,
// and that our user's program can recieve them from. Using a SharedArrayBuffer would of course
// be better, but has less support (and also can't be served easily when hosting on GitHub)

// heavily inspired by the work here: https://blog.persistent.info/2021/08/worker-loop.html

let currentServiceWorker = null;
let serviceWorkerChannel = null;

function serviceWorkerSanityCheck() {
    if (!currentServiceWorker)
        return false;
    if (currentServiceWorker.state == "redundant") {
        executionEnvironment.Reload();
    }
    return true;
}

function sendWorkerCommand(command, args) {
    if (!serviceWorkerSanityCheck())
        return;

    currentServiceWorker.postMessage({type: "programEvent", command, args});
}

// seperate function to keep performance up (sendWorkerCommand is called a _lot_)
async function sendAwaitableWorkerCommand(command, args) {
    if (!serviceWorkerSanityCheck())
        return;

    await serviceWorkerChannel.postMessage("programEvent", {command, args});
}

function clearWorkerCommands(command) {
    if (!serviceWorkerSanityCheck())
        return;

    currentServiceWorker.postMessage({type: "clearEvents"});
}
async function registerServiceWorker(serviceWorkerLoadingProgress){
    // first try tidying up any erroneous service workers
    try {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
                if (registration.scope.includes("executionEnvironment.html"))
                    registration.unregister();
            }
        });
    }
    catch(err) {
        executionEnvironment.reportCriticalInitializationFail(
            "Error when modifying service workers. <br/>"+
            err.toString()
        );
    }

    try {
        let path = (new URL(window.location.href)).pathname;
        let scope = path.slice(0,path.lastIndexOf("/")+1);

        let worker = await navigator.serviceWorker.register("SKOservice-worker.js", { scope: scope });

        worker.addEventListener("statechange", (event) => {
            if (this.state == "activated" || this.state == "redundant") {
                // trigger reload so service worker starts intercepting properly
                executionEnvironment.Reload();
                return true;
            }
        });

        // Wait up to three second for it to become active - sometimes statechange just doesn't trigger...
        // Seems to always work after the first delay - timing issue or perhaps just needs an async step?
        for(let i = 0; i < 30; i ++) {
            if (!worker.active) {
                console.log("Wait " + i); // Leaving this in as it might be a useful thing to check when providing support
                await new Promise((resolve,reject) => {setTimeout(function(){resolve();}, 100);});
            }
        }

        if (worker.active) {
            currentServiceWorker = worker.active;
            serviceWorkerChannel = new PromiseChannel(navigator.serviceWorker, currentServiceWorker);

            serviceWorkerLoadingProgress(1);
            return true;
        }

        return false;
    }
    catch(err){
        executionEnvironment.reportCriticalInitializationFail(
            "Failed to initialize critical component: Service Worker. <br/>"+
            "You can still compile and run programs, but you will be unable to interact with them with your mouse or keyboard.<br/>"+
            err.toString()
        );
        return false;
    }
}


parent.postMessage({type:"languageLoaderReady"}, "*");