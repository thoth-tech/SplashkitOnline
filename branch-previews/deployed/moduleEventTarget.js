"use strict";

// A global event hook for module loading events
let moduleEvents = new EventTarget();

// Events:
// onRuntimeInitialized

// onDownloadProgress:
//     info             (directly from XMLHttpRequest)
//     downloadName
//     downloadIndex    (1 indexed)
//     downloadCount
//     downloadProgress (betwen 0 and 1)

// onDownloadFail:
//     info             (directly from XMLHttpRequest)
//     downloadName
//     downloadIndex    (1 indexed)
//     downloadCount
