"use strict";

let hasInitializedLanguage = false;


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

parent.postMessage({type:"languageLoaderReady"}, "*");