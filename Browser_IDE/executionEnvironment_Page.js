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
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace('\n', '<br>', 'g');
}


function writeTerminal(text, escapeSpecialCharacters = true){
    if (terminalElement) {
        if (arguments.length > 2) {
            // Convert the arguments object to an array, excluding the last argument
            let textArgs = Array.prototype.slice.call(arguments, 0, -1);
            text = textArgs.join(' ');
        }
        
        // Escape special characters if needed
        if (escapeSpecialCharacters) {
            text = escapeHtml(text);
        }

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
function ReportError(block, message, line, stacktrace ,formatted=false){
    let outputMessage = message != "";
    let stackTrace = stacktrace;

    // Escape only the user-provided input
    let escapedBlock = escapeHtml(block);
    let escapedMessage = escapeHtml(message);

    if (outputMessage && line != null)
        escapedMessage = "Error on line "+line+": "+escapedMessage;

    if (escapedBlock != null && escapedBlock != "" && escapedBlock != "__USERCODE__null") {
        if (!escapedBlock.startsWith(userCodeBlockIdentifier)){
            escapedMessage = "Please file a bug report and send us the following info!\n    Error in file: "+escapedBlock+"\n    "+escapedMessage;
            escapedBlock = "Internal Error";
        }
        else{
            escapedBlock = escapedBlock.slice(userCodeBlockIdentifier.length);
        }
        if (outputMessage)
            escapedMessage = "(" + escapedBlock + ") " + escapedMessage;
    }
    
    // Format the stack trace with <details> and <summary> tags
    escapedMessage = '<summary style="color: red;">' + escapedMessage + '</summary>';
    stackTrace = '<pre>' + stackTrace + '</pre>';

    if (outputMessage && !formatted)
        escapedMessage = '<details>' + escapedMessage + stackTrace + '</details>';


    if (outputMessage)
        writeTerminal(escapedMessage, false);

    parent.postMessage({
        type: "error",
        block: escapedBlock,
        message: escapedMessage,
        line: line
    },"*");
}
