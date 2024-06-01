"use strict";

let wlzmaPath = self['wlzmaCustomPath'] || "./external/js-lzma/src/wlzma.wrk.js";

function XMLHttpRequestPromise(url, progressCallback, type="GET") {
    return new Promise(function (resolve, reject) {
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
                progressCallback(-1);
                return;
            }
            progressCallback(1);
            resolve(event.target);
        }, false);

        req.open(type, url);
        req.send();
    });
}

let wlzma = (self.WLZMA != undefined) ? new WLZMA.Manager(0, wlzmaPath) : null;

async function downloadFile(url, progressCallback = null, maybeLZMACompressed = false){
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

            let result = (await wlzma.decode(compressed.response)).toUint8Array();

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