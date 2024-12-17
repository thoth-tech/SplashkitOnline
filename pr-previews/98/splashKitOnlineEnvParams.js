"use strict";

// Global object that can be used to configure the IDE
let SKO = (function () {
    let page_url = new URL(window.location.href);

    // Parse raw parameters
    var parsedRawParams = {};
    page_url.search.slice(1).split("&").forEach(function (param) {
        var pieces = param.split("=");
        parsedRawParams[pieces[0]] = pieces[1];
    });

    function getEnvParam(paramName, _default = null, decode = true) {
        if (decode)
            return page_url.searchParams.get(paramName) ?? _default;
        else
            return parsedRawParams[paramName] ?? _default;
    }

    let isPreview = (page_url.pathname.indexOf("/pr-previews/") >= 0)
                 || (page_url.pathname.indexOf("/branch-previews/") >= 0);

    return {
        language: getEnvParam("language", "JavaScript", false), // Don't decode, so + remains +
        useCompressedBinaries: getEnvParam("useCompressedBinaries", "on", true) === "on",
        useMinifiedInterface: getEnvParam("useMinifiedInterface") === "on",
        isPRPreview: getEnvParam("isPRPreview", isPreview ? "on" : "off") === "on",
        projectURL: getEnvParam("projectURL", null, true) // Added projectURL parameter
    };
})();
