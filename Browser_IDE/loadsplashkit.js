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



let downloadSet = new DownloadSet(runtimeLoadingProgress, 15);

// Start both downloads
let wasmDownload = downloadSet.downloadFile("runtimes/javascript/bin/SplashKitBackendWASM.wasm", 10, false)
let jsRuntime = downloadSet.downloadFile("runtimes/javascript/bin/SplashKitBackendWASM.js", 5, false)

// Handle assigning the downloaded WASM binary once it downloads
let wasmAssign = wasmDownload.then((binary) => {
    Module.wasmBinary = binary;
});

// Once both are downloaded and the WASM binary is assigned, add the script and load
Promise.all([wasmDownload, jsRuntime]).then(([, jsRuntimeBinary]) => {
    // Attach the downloaded script to the page
    var s = document.createElement("script");

    var blob = new Blob([jsRuntimeBinary], {
        type: "text/javascript"
    });

    s.src = window.URL.createObjectURL(blob);
    document.documentElement.appendChild(s);
});
