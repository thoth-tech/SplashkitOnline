#include <emscripten.h>
void _emscripten_memcpy_js(void* __restrict__ dest,
                           const void* __restrict__ src,
                           size_t n) EM_IMPORT(_emscripten_memcpy_js);