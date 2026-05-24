"use strict";

// helper: create element, set attrs/styles, append children
function elem(tag, attrs = {}, childElems = []){
    let elem = document.createElement(tag);

    for (const [attrName, attrVal] of Object.entries(attrs)){
        if (attrName == 'style'){
            for (const [styleName, styleVal] of Object.entries(attrVal)){
                elem.style[styleName] = styleVal;
            }
        } else {
            elem.setAttribute(attrName, attrVal);
        }
    }

    // append strings (-> TextNode) or Node objects
    elem.append(...childElems);

    return elem;
}

// parse HTML string into a document body (use with care)
function elemFromText(text) {
    return new DOMParser().parseFromString(text, "text/html").body;
}

// fade out and remove element
function removeFadeOut(el, speed) {
    var seconds = speed/1000;
    el.style.transition = "opacity " + seconds + "s ease";
    el.style.opacity = 0;
    setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, speed);
}

// createModal: builds a Bootstrap modal safely (no innerHTML)
function createModal(name, title, content, primaryButton, secondaryButton = null) {
    const modal = elem("div", {
        id: name,
        class: "modal fade",
        tabindex: "-1",
        "aria-hidden": "true",
        "aria-labelledby": "exampleModalLabel"
    });

    const dialog = elem("div", { class: "modal-dialog" });
    modal.append(dialog);

    const contents = elem("div", { class: "sk-contents" });
    dialog.append(contents);

    // header (title as text)
    const header = elem("div", { class: "sk-header sk-header-indent" }, [
        elem("h2", {}, [document.createTextNode(title)]),
        elem("button", {
            type: "button",
            class: "btn-close btn-close-white",
            "data-bs-dismiss": "modal",
            "aria-label": "Close"
        })
    ]);
    contents.append(header);

    // body: string -> TextNode; Node -> append
    const bodyNode = elem("div", { class: "sk-contents modal-body" });
    if (typeof content === "string") {
        bodyNode.appendChild(document.createTextNode(content));
    } else if (content instanceof Node) {
        bodyNode.appendChild(content);
    } else {
        bodyNode.appendChild(document.createTextNode(String(content)));
    }
    contents.append(bodyNode);

    // footer and buttons
    const footer = elem("div", { class: "sk-header sk-modal-footer" });
    contents.append(footer);

    if (secondaryButton) {
        const sButton = elem("button", { class: "btn btn-secondary" }, [
            document.createTextNode(secondaryButton.label)
        ]);
        sButton.onclick = secondaryButton.callback;
        footer.appendChild(sButton);
    }

    if (primaryButton) {
        const pButton = elem("button", { class: "btn btn-success" }, [
            document.createTextNode(primaryButton.label)
        ]);
        pButton.onclick = primaryButton.callback;
        footer.appendChild(pButton);
    }

    // attach and return Bootstrap modal instance
    document.body.appendChild(modal);
    return new bootstrap.Modal(modal, {});
}
