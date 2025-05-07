// This file contains all the logic and visual handling for the code hint dialog.
// The logic for popping it up and hiding it is in editorMain.js in `setupCodeArea`

//////////////////////////////////
// Utility functions for parsing the code and working out our context,
// and matching SplashKit Functions
//////////////////////////////////
// While CodeMirror does some code parsing already to handle syntax highlighting,
// it didn't seem possible at the time to get all the info needed out of it reliably,
// and there wasn't any relevant documentation to check against.
// So instead manual parsing was chosen instead. This is really just technical debt
// already haha, and I hope it can be removed in the future when we upgrade the
// code editor more.


// A bit of an tricky function that handles estimating the context around
// where the cursor is, without too involved parsing.
//
// First it scans backwards to figure out how many levels deep in brackets
// the cursor is, saving any function names as well.
// Then it scans forward to figure out how many arguments are in the
// current function.
// The result is a stack of functions, storing the name, argument count,
// and argument position of the cursor.
function getCodeContextAtCursor(cm){
    let currentToken = cm.getTokenAt(cm.getCursor());
    let currentLine = cm.getCursor();

    let stack = []; // tracks brackets - we basically skip until we find the character in it
    let context = [];
    let arg_pos = -1;
    let closedContextCount = 0;

    // This function scans backwards to work out the overall context
    function scanBackward(){
        arg_pos = -1; // start with -1. Our position in a function with no args is -1, but first position in one _with_ args is 0.

        // loop upwards from the cursor's line - CodeMirror doesn't give us a single
        // string, but rather each line seperately.
        for(let i = cm.getCursor().line; i >= 0; i --){
            let line = cm.getLine(i);

            // find the start point
            let startChar = line.length; // start from the end of the line
            if (i == cm.getCursor().line) // unless it's the line the cursor is on
                startChar = cm.getCursor().ch-1; // in which case start from the cursor

            // head backwards from that start point
            for(let j = startChar; j >= 0; j --) {
                // stop completely if we encounter ';'
                if (line[j] == ';')
                    return;
                // found a ')' - we need to skip until we find the matching '('
                else if (line[j] == ')')
                    stack.push('(');
                // if we're inside things to skip (stack.length > 0) and we found the matching bracket, consume it
                else if (stack.length > 0 && line[j] == stack[0])
                    stack.pop();
                // we found the '(' that's the edge of our current stack! :D
                else if (stack.length == 0 && line[j] == '(') {
                    // get the function name (whatever token is next to the '(')
                    let token = cm.getTokenAt({line: i, ch: j-1});
                    // Push this into the context
                    context.push({token, arg_pos, i, j, arg_count:arg_pos});
                    // reset the arg position
                    arg_pos = -1;
                }
                // found a ',' - this means there's at least two arguments
                else if (stack.length == 0 && line[j] == ','){
                    if (arg_pos == -1) arg_pos = 0;
                    arg_pos += 1;
                }
                // we found _something_, so there's at least one argument
                else if (stack.length == 0 && arg_pos == -1){
                    arg_pos = 0;
                }
            }
        }
    }

    // This function just finishes figuring out how many arguments are in the
    // current function. It's fairly similar to the previous one.
    function scanForward() {
        arg_pos = -1;
        for(let i = cm.getCursor().line; i < cm.lineCount(); i ++){
            let line = cm.getLine(i);
            let startChar = 0;
            if (i == cm.getCursor().line) startChar = cm.getCursor().ch;
            if (closedContextCount >= context.length)
                return;

            for(let j = startChar; j < line.length; j ++){
                if (line[j] == ';')
                    return;
                else if (line[j] == '(')
                    stack.push(')');
                else if (stack.length > 0 && line[j] == stack[0])
                    stack.pop();
                // we found the ')' that's at the edge of our current stack! :D
                else if (stack.length == 0 && line[j] == ')'){
                    arg_pos = -1;
                    if (context[closedContextCount].arg_count > 0 && context[closedContextCount].arg_pos == -1)
                        context[closedContextCount].arg_pos = 0;
                    closedContextCount += 1;
                    if (closedContextCount >= context.length)
                        return;
                }
                else if (stack.length == 0 && line[j] == ','){
                    if (context[closedContextCount].arg_count == -1) context[closedContextCount].arg_count = 0;
                    context[closedContextCount].arg_count += 1;
                }
                else if (stack.length == 0 && context[closedContextCount].arg_count == -1){
                    context[closedContextCount].arg_count = 0;
                }
            }
        }
    }

    // Just call each of the functions for their side-effects on `context`.
    scanBackward();
    scanForward();

    // Done!
    return context;
};

// Returns the SplashKit API matches found for a single level of the context
// Also computes whether they are possible within that context based on
// the argument count.
// It also handles filtering out known 'non-functions' like while/if.
// Finally, it also has some logic to estimate 'optional' parameters
// to help keep the number of matches manageable and tidy.
function getMatches(context, ignore_impossible = false){
    // return null for known non-function. Otherwise we'll return an empty match list
    if (["if", "while", "do", "for"].includes(context.token.string)){
        return null;
    }

    let matches = [];

    // Loop over every possible function
    // NOTE: These are stored in alphabetical order, and then by argument count.
    // This is important for the algorithm.
    for (let func of splashKitAutocompletes.functions){
        // Skip if the name is different
        if (context.token.string != func.name)
            continue;
        // Skip if we have too many args already for the function and ignore_impossible is true
        if (context.arg_count >= func.params.length && ignore_impossible)
            continue;

        // Detect if this function is a superset of one we've already matched.
        // If it is, we'll add the new params as 'optional' params of the old one.
        let subSet = null;
        for (let k = 0; k < matches.length; k ++){
            let funcB = matches[k];

            let isSuperSet = function(){
                let totalParams = funcB.params.concat(funcB.optParams);

                // If we have less or the same number of params, we can't be a superset
                if (func.length <= totalParams.length)
                    return false;

                // Let's keep zero-parameter functions as a special case
                if (totalParams.length == 0)
                    return false;

                // Check all the param names within the matching subset match
                for (let j = 0; j < totalParams.length; j ++) {
                    if (totalParams[j] != func.params[j])
                        return false;
                }

                return true;
            }();

            if (isSuperSet) {
                subSet = funcB;
                break;
            }
        }
        // If we are a superset, add all the new params, then continue
        if (subSet != null) {
            let subSetSize = subSet.params.length + subSet.optParams.length;

            for (let j = subSetSize; j < func.params.length; j ++) {
                subSet.optParams.push(func.params[j]);
            }

            // recalculate if the expanded function is possible
            subSet.possible = context.arg_count < func.params.length;

            // continue to next potential match
            continue;
        }

        // We are a new match - make a clone of the function, determine if we're possible
        // based on the arg count in the context, and push the match.
        let x = structuredClone(func);
        x.possible = context.arg_count < func.params.length;
        x.optParams = [];
        matches.push(x);
    }

    return matches;
}

//////////////////////////////////
// Main function for creating the code hinter - is called for each code editor tab
//////////////////////////////////

// Maybe this'd be better as a class?

function createCodeHinter(editor){
    //////////////////////////////////
    // Create the elements
    //////////////////////////////////
    let overloadCounter = elemFromText(`<div style="line-height: 0.5em;">1/2</div>`).children[0];
    let overloadNextButton = elemFromText(`<button><i class="bi bi-chevron-up"></i></button>`).children[0];
    let overloadPrevButton = elemFromText(`<button><i class="bi bi-chevron-down"></i></button>`).children[0];

    let overloadSelector = elem("div", {style:{"text-align": "center", "font-size": "0.8em", "display": "flex", "justify-content":"end", "flex-direction":"column"}}, [
        overloadNextButton, overloadCounter, overloadPrevButton
    ]);

    let functionHintInner = elem("div", {style:{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column"
    }});

    let functionHint = elem("div", {class: "sk-contents sk-notification sk-function-hint sk-contents-focusable", tabindex: "10"}, [
        overloadSelector,
        functionHintInner
    ]);

    //////////////////////////////////
    // Setup instance variables
    //////////////////////////////////
    let codeMirrorWidget = null;

    let isVisible = false;

    let currentMatches = null;
    let overloadDivs = null;
    let currentOverload = 0;


    //////////////////////////////////
    // Setup the overload switching events/function
    //////////////////////////////////
    function setOverload(overload){
        if (overloadDivs.length > currentOverload)
            overloadDivs[currentOverload].style.display = "none";
        overloadDivs[overload].style.display = "initial";

        currentOverload = overload;

        overloadNextButton.disabled = currentOverload+1 >= overloadDivs.length;
        overloadPrevButton.disabled = currentOverload == 0;

        overloadCounter.innerText = (currentOverload+1) + "/" + overloadDivs.length;
    }

    overloadNextButton.addEventListener("mousedown", function (e){
        setOverload(currentOverload + 1);
        e.preventDefault(); // avoid taking focus from the editor
    });

    overloadPrevButton.addEventListener("mousedown", function (e){
        setOverload(currentOverload - 1);
        e.preventDefault(); // avoid taking focus from the editor
    });


    //////////////////////////////////
    // Core update logic for deciding the hints to show
    //////////////////////////////////
    function update(cm){
        // no point updating if we're invisible
        if (!isVisible)
            return;

        // First fetch the context (stack of function calls at cursor)
        let context = getCodeContextAtCursor(cm);

        // if no context, just close the dialog
        if (context.length == 0){
            close();
            return;
        }

        // get matches against SplashKit functions.
        let matches = getMatches(context[0]);

        // if no matches, just close the dialog
        if (matches == null || matches.length == 0){
            close();
            return;
        }

        // If we ended up with matches, update the hint object.
        // This involves adding an 'overload Div' for each match.
        // We also find a decent default overload to show by picking
        // the first 'possible' one (while still allowing the user
        // to switch and view the other ones).

        // clear the existing overload divs
        overloadDivs = [];
        functionHintInner.innerHTML = "";

        let bestOverload = null;

        // Loop over each overload
        for (let k = 0; k < matches.length; k ++){
            let func = matches[k];

            let paramList = "";
            // We'll loop over all params including the guessed 'optional' ones
            let totalParams = func.params.concat(func.optParams);

            for (let i = 0; i < totalParams.length; i ++) {
                let param = totalParams[i];

                // group the '<type> <name>' parts together when wrapping
                param = "<div style='display: inline-block;'>"+param+"</div>";

                // if we're up to the optional params, give them lower opacity
                if (i >= func.params.length)
                    param = "<span style='opacity:0.7;'><i>"+param+"</i></span>"

                // If this is where the cursor is, highlight it
                if (i == Math.max(0, context[0].arg_pos))
                    param = "<b><u style = 'color: var(--editorFunctionsAndObject);'>"+param+"</u></b>"

                // Now add the param to the paramList
                paramList += param+", "
            }

            let sig = (func.return!="" ? func.return + " " : "") + func.name + "(" + paramList.slice(0, paramList.length - 2) + ")";
            let div = elemFromText("<div style=\"display:none;\">"+sig+"</div>").children[0];

            if (func.possible && bestOverload == null) bestOverload = k;

            overloadDivs.push(div);
            functionHintInner.appendChild(div);
        }

        // If we didn't find any possible overloads, default to the first (also the shortest)
        if (bestOverload == null) bestOverload = 0;

        // If the current matches are different to what we were showing before,
        // update the count display and switch to that bestOverload.
        // Otherwise just ensure we're still on the same overload as before.
        if (JSON.stringify(matches) != JSON.stringify(currentMatches)){
            currentMatches = matches;
            overloadSelector.style.display = matches.length > 1 ? "flex" : "none";
            setOverload(bestOverload);
        } else {
            setOverload(currentOverload);
        }

        // Now update the widget within the code editor

        // First remove the widget if it's already added
        if (codeMirrorWidget)
            codeMirrorWidget.clear();

        // Position it as close to the cursor as we can while still fitting it
        // First compute how large it'd be if it was all the way on the left
        functionHint.style.left = "0px";
        functionHint.style.maxWidth = "30em";
        editor.getWrapperElement().appendChild(functionHint);

        // Compute sizes/positions
        let functionHintBounding = functionHint.getBoundingClientRect();
        let gutterRect = cm.getGutterElement().getBoundingClientRect();
        let wrapperRect = cm.getWrapperElement().getBoundingClientRect();
        let cursorRect = cm.cursorCoords();
        editor.getWrapperElement().removeChild(functionHint);

        // Compute the minimum width needed with some padding
        let minimumWidth = functionHintBounding.width + 16;

        // Also check if it'll fix vertically
        let height = functionHintBounding.height;
        let positionAbove = cursorRect.top > (height + wrapperRect.top);

        // re-add it above/below the current line
        codeMirrorWidget = cm.addLineWidget(cm.getCursor().line, functionHint, {above: positionAbove});

        // ensure it's positioned correctly vertically
        functionHint.style.transform = positionAbove ? "translateY(-100%)" : "initial";

        // Now position it at the cursor, or move it to the left if it'll go out of the editor
        let maxX = wrapperRect.width - minimumWidth - gutterRect.width;
        functionHint.style.left = Math.min(maxX, cursorRect.left - gutterRect.width - wrapperRect.left) + "px";

        // trigger updating the widget fully in the editor
        codeMirrorWidget.changed(); // does this do anything anymore? Used to be important...
    }


    //////////////////////////////////
    // The 'public' functions to be used elsewhere
    //////////////////////////////////
    function show(cm){
        isVisible = true;
        window.requestAnimationFrame(function(){
            functionHint.style.opacity = "0.9";
            functionHint.style.pointerEvents = "initial";
        });
        update(cm);
    }
    function close(){
        isVisible = false;
        window.requestAnimationFrame(function(){
            functionHint.style.opacity = "0";
            functionHint.style.pointerEvents = "none";
        });
    }

    // return the object - the interface is just these functions
    return {
        show: show,
        update: update,
        close: close,
    };
}