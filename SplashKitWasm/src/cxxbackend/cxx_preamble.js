var _emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
Module['_emscripten_memcpy_js'] = _emscripten_memcpy_js;

// in-built ASM CONSTs inline JavaScript cannot work because they get relocated when linked with
// the user's code. Luckily, the strings themselves are still in the binary,
// so we just fetch those and make them JavaScript functions. Have to expose
// the relevant parts of the module as parameters.

function getASM_CONST(code, argcount){
    if (ASM_CONSTS.hasOwnProperty(code)){
        return ASM_CONSTS[code];
    }
    else{
        let inlineJSSource = "";
        let sourceIndex = code;
        while (HEAPU8[sourceIndex]!=0){
            inlineJSSource += String.fromCharCode(HEAPU8[sourceIndex]);
            sourceIndex +=1;
        }

        let argnames = []
        for(let i = 0; i < argcount ; i++){
            argnames.push("$"+String(i));
        }


        let newfunc = new Function("Module","AL","autoResumeAudioContext","dynCall","UTF8ToString",
            "HEAP8",
            "HEAP16",
            "HEAPU8",
            "HEAPU16",
            "HEAP32",
            "HEAPU32",
            "HEAPF32",
            "HEAPF64",
        ...argnames, inlineJSSource);

        ASM_CONSTS[code] = (...args) => {
            return newfunc(Module, AL, autoResumeAudioContext, dynCall,UTF8ToString,
                HEAP8,
                HEAP16,
                HEAPU8,
                HEAPU16,
                HEAP32,
                HEAPU32,
                HEAPF32,
                HEAPF64,
            ...args);
        };

        return ASM_CONSTS[code];
    }
}
ASM_CONSTS = {};