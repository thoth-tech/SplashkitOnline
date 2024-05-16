"use strict";

let hasInitializedLanguage = false;

window.addEventListener('message', function(m){
    if (m.data.type == "InitializeLanguage"){
        if (hasInitializedLanguage){
            console.error("Double call to InitializeLanguage, please investigate and fix!");
            return;
        }
        hasInitializedLanguage = true;

        console.log("Initializing with " + m.data.languageName);
        for (let script of m.data.runtimeFiles){
            var s = document.createElement("script");

            s.src = script;
            s.async = false;
            document.documentElement.appendChild(s);
        }
    }
}, false);

parent.postMessage({type:"languageLoaderReady"}, "*");