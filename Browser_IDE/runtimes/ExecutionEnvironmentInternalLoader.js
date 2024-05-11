"use strict";

window.addEventListener('message', function(m){
    if (m.data.type == "InitializeLanguage"){
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