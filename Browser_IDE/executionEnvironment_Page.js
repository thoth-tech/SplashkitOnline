"use strict";

let terminalElement = document.getElementById('output');
let terminalHead = undefined;

function clearTerminal() {
    terminalElement.innerHTML = "";
    terminalElement.insertAdjacentHTML('beforeend', "<div><span></span><br></div>");
    terminalHead = terminalElement.lastChild;
}
clearTerminal();

function writeTerminalSpan(head, text, classList){
    let el = head.appendChild(document.createElement('span'));
    el.classList.add(...classList);
    el.innerHTML = text;
}

function writeTerminal(text){
    if (terminalElement) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        
        // These replacements are necessary if you render to raw HTML
        text = text.replace(/&/g, "&amp;");
        text = text.replace(/</g, "&lt;");
        text = text.replace(/>/g, "&gt;");
        text = text.replace('\n', '<br>', 'g');

        let sections = text.split("\x1b[");

        let newTerminalHead = document.createElement("div");
        let curFmtClasses = terminalHead.lastChild.previousSibling.className.split(/,| /).filter(s=>s);

        // We can immediately insert all the text before the first control sequence,
        // as no styling needs to be changed yet.
        writeTerminalSpan(newTerminalHead, sections[0], curFmtClasses);
        sections.splice(0, 1);
                            
        sections = sections.map(s => {
            let i = s.indexOf("m");

            // Each section has the form: (format codes list, text)
            return [s.substring(0, i).split(";"), s.substring(i+1)]
        });

        for(let section of sections){
            let fmtCodes = section[0];
            let fmtText = section[1];

            curFmtClasses = newTerminalHead.lastChild.className.split(/,| /).filter(s=>s);

            if(fmtCodes.includes("0")){
                // SGR code 0 resets all styling.
                curFmtClasses = [];
            }

            let fmtClasses = fmtCodes.map(s => "sk-term-fmt-code" + s);
            fmtClasses = fmtClasses.filter(s => !curFmtClasses.includes(s));
            // Only concern ourself with styles that aren't already applied.

            writeTerminalSpan(newTerminalHead, fmtText, fmtClasses);
        }

        newTerminalHead.appendChild(document.createElement("br"));

        terminalHead = newTerminalHead;
        terminalElement.appendChild(newTerminalHead);

        terminalElement.scrollTop = terminalElement.scrollHeight; // focus on bottom
    }
}

window.addEventListener("print", async function(ev) {
    writeTerminal(ev.text);
});

document.getElementById("canvas").addEventListener("click", async function () {
    document.getElementById("canvas").focus();
});

// Convenience function for reporting errors, printing them to the terminal
// and also sending a message to the main window.
function ReportError(block, message, line, formatted=false){
    let outputMessage = message != "";

    if (outputMessage && line != null)
        message = "Error on line "+line+": "+message;

    if (block != null && block != "" && block != "__USERCODE__null") {
        if (!block.startsWith(userCodeBlockIdentifier)){
            message = "Please file a bug report and send us the following info!\n    Error in file: "+block+"\n    "+message;
            block = "Internal Error";
        }
        else{
            block = block.slice(userCodeBlockIdentifier.length);
        }
        if (outputMessage)
            message = "(" + block + ") " + message;
    }

    if (outputMessage && !formatted)
        message = "\x1b[0m\x1b[31m" + message + "\x1b[0m";

    if (outputMessage)
        writeTerminal(message);

    parent.postMessage({
        type: "error",
        block: block,
        message: message,
        line: line
    },"*");
}