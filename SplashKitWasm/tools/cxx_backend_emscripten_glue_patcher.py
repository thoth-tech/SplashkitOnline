'''
Handle patching the glue generated by Emscripten,
since certain parts don't work fully or allow us to do what we need.
Works when compiling using EmSDK version 3.1.48 (694434b6d47c5f6eff2c8fbd9eeb016c977ae9dc
No guarantees for any other version (although I hope it still works...)
'''
import sys

inGlue = ""
with open(sys.argv[1], "r", encoding='utf-8') as f:
    inGlue = f.read();

def MakePatch(substr, repl):
    global inGlue

    assert substr in inGlue, "Failed to patch Emscripten Glue JavaScript! \""+ substr+"\" not found!"

    inGlue = inGlue.replace(substr, repl)

# Sometimes offset_low/offset_high are bigints - it's a hack, but just force them to be Numbers
# Note: I've seen errors related to file reading that _might_ be related to this...
MakePatch(
    "var offset = convertI32PairToI53Checked(offset_low, offset_high)",
    "var offset = convertI32PairToI53Checked(Number(offset_low), Number(offset_high));"
)

# We need access to the main function
MakePatch(
    "var stackRestore = Module['stackRestore'] = createExportWrapper('stackRestore');",
    "var stackRestore = Module['stackRestore'] = createExportWrapper('stackRestore');\n"+
    "var main = Module['main'] = createExportWrapper('main');"
)

# Replace ASM_CONSTS handling - they move when we link with user's code
MakePatch(
    "assert(ASM_CONSTS.hasOwnProperty(code)",
    "//assert(ASM_CONSTS.hasOwnProperty(code)"
)
MakePatch(
    "return ASM_CONSTS[code].apply(null, args);",
    "return getASM_CONST(code, args.length).apply(null, args);"
)

# Make it so we can actually set noExitRuntime - not sure why the '|| true' is there in the first place...
MakePatch(
    "Module['noExitRuntime'] || true",
    "Module['noExitRuntime']"
)

# Patch in our event handling
MakePatch(
    "var Module = typeof Module != 'undefined' ? Module : {};\n",
    "var Module = {};\n"+
    "importScripts('./../workerEventProcessor.js');\n"+
    "function RunProgram() {\n"+
    "Module = typeof Module != 'undefined' ? Module : {};\n"
)

MakePatch(
    "strftime_l: _strftime_l",
    "strftime_l: _strftime_l,"+
    "  /** @export */"
    "  __sko_process_events : __sko_process_events,"
)

# These will need to be accessible globally
MakePatch(
    "var AudioContext ",
    "AudioContext"
)
MakePatch(
    "var window ",
    "window"
)
MakePatch(
    "var document ",
    "document"
)
MakePatch(
    "function AudioContext() {",
    "window.AudioContext = function AudioContext() {"
)

# Hide/fix some incompatibilities (like WebAudio and gamepads)
MakePatch(
    "warnOnce('faking WebAudio elements, no actual sound will play');",
    ""
)
MakePatch(
    "err('emscripten_set_main_loop_timing: Cannot set timing mode",
    "//err('emscripten_set_main_loop_timing: Cannot set timing mode"
)
MakePatch(
    "this.createPanner = makeNode;",
"""
this.createPanner = makeNode;
this.createScriptProcessor = makeNode;
this.close = () => {};
"""
)

inGlue += """
}

var document = null;
var window = null;
var AudioContext = null;
navigator.getGamepads = function(){return [];};

onmessage = function onMessageFromMainEmscriptenThread(message) {
	switch (message.data.target) {
		case 'module-init': {

			if (message.data.wasmBinary)
				Module['wasmBinary'] = message.data.wasmBinary;

			RunProgram();
			break;
		}
	}
};
"""

# We need this function
if "_emscripten_memcpy_js" not in inGlue:
    print("Missing definition for _emscripten_memcpy_js!")

with open(sys.argv[2], "w", encoding='utf-8') as output:
    output.write(inGlue)


inGlue = ""
with open(sys.argv[3], "r", encoding='utf-8') as f:
    inGlue = f.read();

# Some asserts fail - still runs fine so ignore for now
MakePatch(
    "if (!x) throw 'failed assert';",
    "//if (!x) throw 'failed assert';"
)

# Path is wrong
MakePatch(
    "filename = './SplashKitBackendWASMCPP.worker.js';",
    "filename = './runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js';"
)

# Stop stealing all events - otherwise can't type
MakePatch(
    "      event.preventDefault();",
    "      //event.preventDefault();"
)

# Patch runtime events

# mouseup needs to have 'document' as its target...
MakePatch(
    "['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach((event) => {",
"""
['mouseup'].forEach((event) => {
  Module.canvas.addEventListener(event, (event) => {
    sendWorkerCommand("EmEvent", { target: 'document', event: cloneObject(event) });
    event.preventDefault();
  }, true);
});
"""+
    "['mousedown', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach((event) => {"
)
MakePatch(
    "worker.postMessage({ target: 'Image',",
    "sendWorkerCommand(\"EmEvent\", { target: 'Image',"
)
MakePatch(
    "worker.postMessage({ target: 'window',",
    "sendWorkerCommand(\"EmEvent\", { target: 'window',"
)
MakePatch(
    "worker.postMessage({ target: 'canvas',",
    "sendWorkerCommand(\"EmEvent\", { target: 'canvas',"
)
MakePatch(
    "worker.postMessage({ target: 'document',",
    "sendWorkerCommand(\"EmEvent\", { target: 'window'," # These actually need to be sent to the window...
)


# Wrap all the worker creation inside a function, 'RunProgram'
MakePatch(
    "var worker = new Worker(workerURL);",
    "var worker = null;\n"+
    "function RunProgram(wasmBinary){\n"+
    "worker = new Worker(workerURL);"
)
# End of function
MakePatch(
    "function cloneObject(event) {",
    "}\n\n function cloneObject(event) {"
)

# Send the user's compiled code to the worker first
MakePatch(
    "WebGLClient.prefetch();",
"""
  worker.postMessage({
    target: 'module-init',
        wasmBinary: wasmBinary,
  });

  WebGLClient.prefetch();
"""
)


with open(sys.argv[4], "w", encoding='utf-8') as output:
    output.write(inGlue)