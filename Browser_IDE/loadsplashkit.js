"use strict";

var Module = {
    onRuntimeInitialized: (function() {
        moduleEvents.dispatchEvent(new Event("onRuntimeInitialized"));
    }),
    print: (function(text){
        let ev = new Event("print");
        ev.text = text;
        window.dispatchEvent(ev);
    }),
    canvas: (() => {
        let canvas = document.getElementById('canvas');

        // As a default initial behavior, pop up an alert when webgl context is lost. To make your
        // application robust, you may want to override this behavior before shipping!
        // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
        canvas.addEventListener("webglcontextlost", (e) => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

        return canvas;
    })(),
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
    },
    preRun: (function() {
        ENV.SDL_EMSCRIPTEN_KEYBOARD_ELEMENT = "canvas";
    }),
};






function LoadSplashKitWASMDependency(pieceURL, pieceName, pieceIndex, pieceCount){
    return new Promise(function (resolve, reject) {

        let req = new XMLHttpRequest();
        req.responseType = 'arraybuffer';

        let progressEvent = new Event("onDownloadProgress");

        progressEvent.downloadName = pieceName;
        progressEvent.downloadIndex = pieceIndex;
        progressEvent.downloadCount = pieceCount;
        progressEvent.downloadProgress = 0;

        req.addEventListener("progress", function(event) {
            progressEvent.info = event.target;

            if (event.lengthComputable)
                progressEvent.downloadProgress = event.loaded / event.total;

            moduleEvents.dispatchEvent(progressEvent);
        }, false);

        req.addEventListener("loadend", function(event) {
            if (event.target.status != 200 || !event.target.response.byteLength){
                let failEvent = new Event("onDownloadFail");

                failEvent.info = event.target;
                failEvent.downloadName = pieceName;
                failEvent.downloadIndex = pieceIndex;
                failEvent.downloadCount = pieceCount;

                moduleEvents.dispatchEvent(failEvent);
                reject(event.target);
            }

            resolve(event.target);
        }, false);

        req.open("GET", pieceURL);
        req.send();
    });
}

// First, load the WebAssembly
LoadSplashKitWASMDependency("splashkit/SplashKitBackendWASM.wasm", "SplashKit Library", 1, 2).then(function(e){

    // Pre-set the module's binary with our manually downloaded one
    Module.wasmBinary = e.response;

    // Next, load the Emscripten generated JS runtime
    LoadSplashKitWASMDependency("splashkit/SplashKitBackendWASM.js", "Runtime", 2, 2).then(function(e){

        // Attach the downloaded script to the page
        var s = document.createElement("script");

        var blob = new Blob([e.response], {
            type: "text/javascript"
        });

        s.src = window.URL.createObjectURL(blob);
        document.documentElement.appendChild(s);

    }).catch(function(){});

}).catch(function(){});
