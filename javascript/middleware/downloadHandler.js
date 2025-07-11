"use strict";

let wlzmaPath = self['wlzmaCustomPath'] || "./external/js-lzma/src/wlzma.wrk.js";
let downloadRootPath = self['downloadRootPath'] || "./";

// url patch map
let urlPatchMap = null;

async function rerouteURL(url){
    if (SKO.isPRPreview) {
        const requestUrl = new URL(url, self.location);

        if (urlPatchMap == null){
            const requestUrl = new URL(downloadRootPath+"PRPathMap.json", self.location);
            let response = await fetch(requestUrl.href);
            urlPatchMap = await response.json();
            // patch the patch map...
            // initially entries look like:
            // "/pr-previews/2/compilers/cxx/bin/clang.wasm.lzma": "/compilers/cxx/bin/clang.wasm.lzma"
            // which only works if the site is running at /. Under GitHub pages it runs in a sub-directory,
            // so we re-map the paths to be in that sub-directory as well.

            // find the prefix
            const current_prefix = new URL(downloadRootPath, self.location).pathname;
            let prefix_offset = current_prefix.indexOf(urlPatchMap.root);
            let prefix = current_prefix.slice(0, prefix_offset);

            let orig_redirects = urlPatchMap.redirects;
            urlPatchMap.redirects = {};

            Object.keys(orig_redirects).forEach(function(key) {
                urlPatchMap.redirects[prefix+key] = prefix+orig_redirects[key];
            });
        }
        if (requestUrl.pathname in urlPatchMap.redirects) {
            return urlPatchMap.redirects[requestUrl.pathname];
        }
    }
    return url;
}


function XMLHttpRequestPromise(url, progressCallback, type="GET") {
    return new Promise(async function (resolve, reject) {
        let req = new XMLHttpRequest();
        req.responseType = 'arraybuffer';

        if (progressCallback != null)
            req.addEventListener("progress", function(event) {
                if (event.lengthComputable && event.target.status == 200)
                    progressCallback(event.loaded / event.total);
            }, false);

        req.addEventListener("loadend", function(event) {
            if (event.target.status != 200){
                reject(event.target);
                if (progressCallback != null)
                    progressCallback(-1);
                return;
            }
            if (progressCallback != null)
                progressCallback(1);
            resolve(event.target);
        }, false);

        req.open(type, await rerouteURL(url));
        req.send();
    });
}

let wlzma = (self.WLZMA != undefined) ? new WLZMA.Manager(0, wlzmaPath) : null;

async function downloadFile(url, progressCallback = null, maybeLZMACompressed = false){
    url = await rerouteURL(url);

    // First try downloading the LZMA version
    if (wlzma && maybeLZMACompressed && SKO.useCompressedBinaries) {
        let exists = false;
        try {
            await XMLHttpRequestPromise(url+".lzma", null, "HEAD");
            exists = true;
        }
        catch (err) {}

        // seems alright, let's try downloading it properly!
        if (exists) {
            let decompressionPercentage = 0.2;
            let downloadPercentage = 1.0 - decompressionPercentage;
            let downloadProgressCallback = (progressCallback==null) ? null : function(percentage) { progressCallback(percentage * downloadPercentage); };
            let compressed = await XMLHttpRequestPromise(url+".lzma", downloadProgressCallback, "GET");

            let decompressProgressCallback = (progressCallback==null) ? null : function(percentage) { progressCallback(downloadPercentage + percentage * decompressionPercentage); };
            let result = (await wlzma.decode(compressed.response, decompressProgressCallback)).toUint8Array();

            return result;
        }
    }

    return new Uint8Array((await XMLHttpRequestPromise(url, progressCallback, "GET")).response);
}

class DownloadSet {
    constructor(progressCallback, expectedTotalSize) {
        this.progressCallback = progressCallback;
        this.expectedTotalSize = expectedTotalSize;
        this.downloads = [];
        this.reportProgress();
    }

    async downloadFile(url, aproxSizeMB, maybeLZMACompressed = false) {
        return downloadFile(url, this.addManualReporter(aproxSizeMB), maybeLZMACompressed);
    }

    addManualReporter(aproxSizeMB) {
        this.downloads.push({progress: 0, size: aproxSizeMB});

        let index = this.downloads.length - 1;
        this.reportProgress();

        return (progress) => {
            this.downloads[index].progress = progress;
            this.reportProgress();
        }
    }

    reportProgress(){
        // Force to -1 if any downloads have failed
        if (this.downloads.length > 0 && this.downloads.some((x) => x < 0))
            this.progressCallback(-1);
        // Force to 1 when all downloads are complete, in case of rounding errors
        else if (this.downloads.length > 0 && this.downloads.every((x) => x == 1))
            this.progressCallback(1);
        else
            this.progressCallback(this.downloads.reduce((x,y) => x+y.progress*y.size, 0) / Math.max(this.expectedTotalSize, this.downloads.reduce((x,y) => x+y.size, 0)));
    }
}