"use strict";

let wlzmaPath = self['wlzmaCustomPath'] || "./external/js-lzma/src/wlzma.wrk.js";

function XMLHttpRequestPromise(url, progressCallback, type="GET") {
    return new Promise(function (resolve, reject) {
        let req = new XMLHttpRequest();
        req.responseType = 'arraybuffer';

        if (progressCallback != null)
            req.addEventListener("progress", function(event) {
                if (event.lengthComputable)
                    progressCallback(event.loaded / event.total);
            }, false);

        req.addEventListener("loadend", function(event) {
            if (event.target.status != 200){
                reject(event.target);
            }

            resolve(event.target);
        }, false);

        req.open(type, url);
        req.send();
    });
}

let wlzma = new WLZMA.Manager(0, wlzmaPath);

async function downloadFile(url, progressCallback = null, maybeLZMACompressed = false){
    // First try downloading the LZMA version
    if (maybeLZMACompressed && SKO.useCompressedBinaries) {
        let exists = false;
        try {
            await XMLHttpRequestPromise(url+".lzma", progressCallback, "HEAD");
            exists = true;
        }
        catch (err) {}

        // seems alright, let's try downloading it properly!
        if (exists) {
            let decompressionPercentage = 0.2;
            let downloadPercentage = 1.0 - decompressionPercentage;
            let downloadProgressCallback = (progressCallback==null) ? null : function(percentage) { progressCallback(percentage * downloadPercentage); };
            let compressed = await XMLHttpRequestPromise(url+".lzma", downloadProgressCallback, "GET");

            let result = (await wlzma.decode(compressed.response)).toUint8Array();

            return result;
        }
    }

    return new Uint8Array((await XMLHttpRequestPromise(url, progressCallback, "GET")).response);
}