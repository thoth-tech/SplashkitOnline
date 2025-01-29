// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE
// Modified by Sean Boettger
// - Improve behaviour when performing continous autocompletion
// - Since was already modifying the file, added SplashKit autocompletion here too

// TODO: can this be moved down?
let startParameter = false;
let currentFound = null;
let currentCur = null;

// Sean Edit: Load SplashKit Autocompletes
let splashKitAutocompletes = null;
function loadSplashKitAutocompletes() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState === 4) {
            if (xhr.status === 0 || xhr.status === 200) {
                splashKitAutocompletes = JSON.parse(xhr.responseText);
            }
            else{
                throw new Error("Couldn't load SplashKit Autocompletes!");
            }
        }
    };
    xhr.open("GET", "splashkit/splashkit_autocomplete.json", true);
    xhr.send(null);
}
loadSplashKitAutocompletes();

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  var Pos = CodeMirror.Pos;

  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }

  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }

  function scriptHint(editor, keywords, getToken, options) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur);
    if (/\b(?:string|comment)\b/.test(token.type)) return;
    var innerMode = CodeMirror.innerMode(editor.getMode(), token.state);
    if (innerMode.mode.helperType === "json") return;
    token.state = innerMode.state;

    // Reset stored autocomplete data if the line changes or the character is the same
    if ((currentCur && currentCur.ch == cur.ch) || (currentCur && cur.line !== currentCur.line)) {
      currentCur = null;
      startParameter = false;
      currentFound = null;
    } 

    // Check if this is the beginning of a function call
    // If so, we want to show the function parameters
    if (token.string == "(") {
      // Get the token before the current one
      let prevCur = JSON.parse(JSON.stringify(cur));
      prevCur.ch--;
      // TODO: what if ch is 0?
      let prevToken = getToken(editor, prevCur);
      token = prevToken;
      startParameter = true;
      currentCur = prevCur;
    }

    // Check if an autocomplete suggestion was written out
    if ((currentFound) || !/^[\w$_]*$/.test(token.string)) { // If it's not a 'word-style' token, ignore the token.
      // Reset autocomplete data if someone types a closing ) or ;
      if (currentFound && (token.string == ")" || token.string == ";")) {
        currentFound = null;
        startParameter = false;
        token = {start: cur.ch, end: cur.ch, string: "", state: token.state,
          type: token.string == "." ? "property" : null};
      }
      token = {start: cur.ch, end: cur.ch, string: "", state: token.state,
               type: token.string == "." ? "property" : null};
    } else if (token.end > cur.ch) {
      token.end = cur.ch;
      token.string = token.string.slice(0, cur.ch - token.start);
    }

    var tprop = token;
    // If it is a property, find out what it is a property of.
    while (tprop.type == "property") {
      tprop = getToken(editor, Pos(cur.line, tprop.start));
      if (tprop.string != ".") return;
      tprop = getToken(editor, Pos(cur.line, tprop.start));
      if (!context) var context = [];
      context.push(tprop);
    }

    // Sean Edit: Skip tokens when too short (or literally empty)
    if (!currentFound && token.string.length<2) return;

    return {list: getCompletions(token, context, keywords, options),
            from: Pos(cur.line, token.start),
            to: Pos(cur.line, token.end)};
  }

  function javascriptHint(editor, options) {
    return scriptHint(editor, javascriptKeywords,
                      function (e, cur) {return e.getTokenAt(cur);},
                      options);
  };
  CodeMirror.registerHelper("hint", "javascript", javascriptHint);


  var stringProps = ("charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight " +
                     "toUpperCase toLowerCase split concat match replace search").split(" ");
  var arrayProps = ("length concat join splice push pop shift unshift slice reverse sort indexOf " +
                    "lastIndexOf every some filter forEach map reduce reduceRight ").split(" ");
  var funcProps = "prototype apply call bind".split(" ");
  var javascriptKeywords = ("break case catch class const continue debugger default delete do else export extends false finally for function " +
                  "if in import instanceof new null return super switch this throw true try typeof var void while with yield").split(" ");

  function forAllProps(obj, callback) {
    if (!Object.getOwnPropertyNames || !Object.getPrototypeOf) {
      for (var name in obj) callback(name)
    } else {
      for (var o = obj; o; o = Object.getPrototypeOf(o))
        Object.getOwnPropertyNames(o).forEach(callback)
    }
  }

  function getCompletions(token, context, keywords, options) {
    var found = [], start = token.string, global = options && options.globalScope || window;
    function maybeAdd(str) {
        // Sean Edit: Skip matches that are identical to the token itself
      if (str.lastIndexOf(start, 0) == 0 && !arrayContains(found, str) && str != start) found.push(str);
    }
    function gatherCompletions(obj) {
      if (typeof obj == "string") forEach(stringProps, maybeAdd);
      else if (obj instanceof Array) forEach(arrayProps, maybeAdd);
      else if (obj instanceof Function) forEach(funcProps, maybeAdd);
      forAllProps(obj, maybeAdd)
    }

    if (context && context.length) {
      // If this is a property, see if it belongs to some object we can
      // find in the current environment.
      var obj = context.pop(), base;
      if (obj.type && obj.type.indexOf("variable") === 0) {
        if (options && options.additionalContext)
          base = options.additionalContext[obj.string];
        if (!options || options.useGlobalScope !== false)
          base = base || global[obj.string];
      } else if (obj.type == "string") {
        base = "";
      } else if (obj.type == "atom") {
        base = 1;
      } else if (obj.type == "function") {
        if (global.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') &&
            (typeof global.jQuery == 'function'))
          base = global.jQuery();
        else if (global._ != null && (obj.string == '_') && (typeof global._ == 'function'))
          base = global._();
      }
      while (base != null && context.length)
        base = base[context.pop().string];
      if (base != null) gatherCompletions(base);
    } else {
      // If not, just look in the global object, any local scope, and optional additional-context
      // (reading into JS mode internals to get at the local and global variables)
      for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
      for (var c = token.state.context; c; c = c.prev)
        for (var v = c.vars; v; v = v.next) maybeAdd(v.name)
      for (var v = token.state.globalVars; v; v = v.next) maybeAdd(v.name);
      if (options && options.additionalContext != null)
        for (var key in options.additionalContext)
          maybeAdd(key);
      if (!options || options.useGlobalScope !== false)
        gatherCompletions(global);
      forEach(keywords, maybeAdd);
    }

    // Sean Edit: Handle SplashKit Keywords
    forEach(splashKitAutocompletes.keywords, maybeAdd);

    // If there is a complete suggestion and the user has started typing parameters, return the previously stored data for that
    if (currentFound && startParameter) return currentFound;

    // Sean Edit: Handle Splashkit Functions specially
    for (func of splashKitAutocompletes.functions) {
        if (func.name.lastIndexOf(start, 0) == 0 && !arrayContains(found, func.name)) {
            paramList = "";
            for (param of func.params) paramList += param + ", ";
            found.push({
                text: func.name,
                displayText: (func.return!="" ? func.return + " " : "") + func.name + "(" + paramList.slice(0, paramList.length - 2) + ")"
            });
            // If there is a complete match between what the user typed and the function name, store it for later
            if (func.name == start) currentFound = found;
        }
    }

    return found;
  }
});
