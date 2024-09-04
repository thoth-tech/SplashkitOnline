"use strict";

// global object that can be used to configure the IDE

let SKO = (function(){
    let page_url = new URL(window.location.href);

    // parse raw parameters as well
    var parsedRawParams = {};
    // just remove the ?, split by &, then split by = and assign each piece
    page_url.search.slice(1).split("&").forEach(function(param){
        var pieces = param.split("=");
        parsedRawParams[pieces[0]] = pieces[1];
    });

    function getEnvParam(paramName, _default=null, decode=true){
        if (decode)
            return page_url.searchParams.get(paramName) ?? _default;
        else
            return parsedRawParams[paramName] ?? _default;
    }

    return {
        language: getEnvParam("language", "JavaScript", false), /*don't decode, so + remains + rather than a space*/
        useCompressedBinaries: getEnvParam("useCompressedBinaries", "on", true) == "on",
        useMinifiedInterface: getEnvParam("useMinifiedInterface", "on", true) == "on",
    };
})();