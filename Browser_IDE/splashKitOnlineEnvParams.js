"use strict";

function findGetParameter(parameterName, _default=null) {
    location.search.substr(1).split("&").forEach(function (piece) {
      let tmp = piece.split("=");
      if (tmp[0] === parameterName)
          return decodeURIComponent(tmp[1]);
    });

    return _default;
}

let page_url = new URL(window.location.href);

// global object that can be used to configure the IDE
let SKO = {
	language: page_url.searchParams.get("language") ?? "JavaScript",
};