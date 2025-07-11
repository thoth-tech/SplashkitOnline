'''This file contains the preamble used in the generated Javascript/C++ glue'''

CPPPreamble = """
#include "animations.h"
#include "audio.h"
#include "basics.h"
#include "bundles.h"
#include "camera.h"
#include "circle_drawing.h"
#include "circle_geometry.h"
#include "clipping.h"
#include "collisions.h"
#include "color.h"
#include "drawing_options.h"
#include "ellipse_drawing.h"
#include "geometry.h"
#include "graphics.h"
#include "images.h"
#include "input.h"
#include "json.h"
#include "keyboard_input.h"
#include "line_drawing.h"
#include "line_geometry.h"
#include "logging.h"
#include "matrix_2d.h"
#include "mouse_input.h"
#include "music.h"
#include "networking.h"
#include "physics.h"
#include "point_drawing.h"
#include "point_geometry.h"
#include "quad_geometry.h"
#include "random.h"
#include "raspi_gpio.h"
#include "rectangle_drawing.h"
#include "rectangle_geometry.h"
#include "resources.h"
#include "sound.h"
#include "sprites.h"
#include "terminal.h"
#include "text.h"
#include "text_input.h"
#include "timers.h"
#include "triangle_drawing.h"
#include "triangle_geometry.h"
#include "types.h"
#include "utils.h"
#include "vector_2d.h"
#include "web_client.h"
#include "web_server.h"
#include "window_manager.h"
#include "interface.h"

#include <cstring>
#include <emscripten.h>
#include <unordered_map>

namespace splashkit_lib
{
void free_all_sprite_packs();
};

using namespace splashkit_lib;
extern "C" {
EMSCRIPTEN_KEEPALIVE void CPP_free(void* p);
EMSCRIPTEN_KEEPALIVE void* CPP_malloc(size_t len);
}


template<typename T, typename Converter>
std::vector<decltype((*((Converter*)0))(*((T*)0)))> heapAllocatedArrayToVector(T* items, int count, Converter converter)
{
    std::vector<decltype(converter(*((T*)0)))> out;
    for (int i = 0; i < count ; i ++)
    {
        out.push_back(converter(items[i]));
    }
    return std::move(out);
}

template<typename T, typename T2, typename Converter>
void heapAllocateVectorToArray(const std::vector<T>& vec, T2*& items, int& count, Converter converter)
{
    if (items != nullptr)
        CPP_free((void*)items);

    count = vec.size();

    items = (T2*)CPP_malloc(vec.size() * sizeof(T2));//new T2[vec.size()];
    for (int i = 0; i < count ; i ++)
    {
        items[i] = converter(vec[i]);
    }
}

template<typename T, typename T2, typename Converter>
void heapAllocateVectorToArray(const std::vector<T>& vec, T2**& items, int& count, Converter converter)
{
    if (items != nullptr){
        for (int i = 0; i < count ; i ++)
            CPP_free((void*)items[i]);
        CPP_free((void*)items);
    }

    count = vec.size();

    items = (T2**)CPP_malloc(vec.size() * sizeof(T2*));//new T2[vec.size()];
    for (int i = 0; i < count ; i ++)
    {
        items[i] = converter(vec[i]);
    }
}




std::string heapAllocatedStringToCPPString(const char* str){
    return (std::string)str;
}
void heapAllocateString(char*& out, const std::string& str){
    if (out != nullptr)
        CPP_free(out);
    out = (char*)CPP_malloc(str.size()+1);
    memcpy( out, str.c_str(), str.size());
    out[str.size()] = '\\0';
}

// For debugging
#define DEBUG_MEMORY
#ifdef DEBUG_MEMORY
    std::unordered_map<void*, size_t> allocations;
    size_t totalAllocated = 0;
#endif

typedef window SKwindow;
extern "C" {

    #ifdef DEBUG_MEMORY
        EMSCRIPTEN_KEEPALIVE void CPP_free(void* p) {
            free(p);
            totalAllocated -= allocations[p];
        }
        EMSCRIPTEN_KEEPALIVE void* CPP_malloc(size_t len) {
            void* ptr = malloc(len);
            allocations[ptr] = len;
            totalAllocated += len;
            return ptr;
        }
        EMSCRIPTEN_KEEPALIVE int CPP_total_allocated() {
            return totalAllocated;
        }
    #else
        EMSCRIPTEN_KEEPALIVE void CPP_free(void* p) { free(p); }
        EMSCRIPTEN_KEEPALIVE void* CPP_malloc(size_t len) { return malloc(len); }
    #endif
"""

JSPreamble = """

class SplashKitArgumentError extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = message;
  }
}




function JSStringToHeapString(str){
    let len = lengthBytesUTF8(str)+1;
    let ptr = wasmExports.CPP_malloc(len);
    stringToUTF8Array(str, Module.HEAPU8, ptr, len);
    return ptr;
}

function DeallocHeapString(ptr){
    wasmExports.CPP_free(ptr);
}

function HeapStringToJSString(ptr){
    return UTF8ToString(ptr, 1000000);
}



function JSArrayToHeapArray(array, writeFunction, writeSize){
    let len = writeSize * array.length;
    let ptr = wasmExports.CPP_malloc(len);
    let cur_ptr = ptr;
    for(let i = 0 ; i < array.length ; i += 1){
        writeFunction(array[i], cur_ptr);
        cur_ptr += writeSize;
    }


    return ptr;
}

function DeallocHeapArray(ptr, count, deallocFunction, readSize){
    let cur_ptr = ptr;
    for(let i = 0 ; i < count ; i += 1){
        deallocFunction(cur_ptr);
        cur_ptr += readSize;
    }
    wasmExports.CPP_free(ptr);
}

function UpdateJSArrayFromHeapArray(array, ptr, count, readFunction, readSize){
    array.length = 0;
    let cur_ptr = ptr;
    for(let i = 0 ; i < count ; i += 1){
        array.push(readFunction(cur_ptr));
        cur_ptr += readSize;
    }
}

function user_params_to_string(params){
    let users_params = ""

    for (let i = 0; i < params.length; i ++){
        let x = params[i];

        if (typeof x === 'object')
            users_params += x.constructor.name;
        else
            users_params += typeof x;

        users_params += ", "
    }

    return users_params.slice(0, -2)
}
"""