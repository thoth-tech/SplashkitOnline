"use strict";

// utility functions for constructing HTML elements in JavaScript
function elem(tag, attrs = {}, childElems = []){
    let elem = document.createElement(tag);

    // loop over each attribute and apply it to the new element
    for (const [attrName, attrVal] of Object.entries(attrs)){
        if (attrName == 'style'){ // style special case
            for (const [styleName, styleVal] of Object.entries(attrVal)){
                elem.style[styleName] = styleVal;
            }
        }
        else{
            elem.setAttribute(attrName, attrVal);
        }
    }

    // add all the children
    elem.append(...childElems);

    return elem;
}

function elemFromText(text) {
    return new DOMParser().parseFromString(text, "text/html").body;
}