cmake_minimum_required(VERSION 3.2)
project(splashkit)

cmake_policy(SET CMP0083 NEW)
include(CheckPIESupported)
check_pie_supported()

# SK Directories relative to cmake project
set(SK_CMAKE "${CMAKE_CURRENT_SOURCE_DIR}/../external/splashkit-core/projects/cmake")

set(SK_SRC "${SK_CMAKE}/../../coresdk/src")
set(SK_EXT "${SK_CMAKE}/../../coresdk/external")
set(SK_LIB "${SK_CMAKE}/../../coresdk/lib")
set(SK_BIN "${SK_CMAKE}/../../bin")
set(SK_WASMEXT "${CMAKE_CURRENT_SOURCE_DIR}/..")
set(SK_BROWSERIDE "${CMAKE_CURRENT_SOURCE_DIR}/../../Browser_IDE")
set(SK_OUT "${SK_WASMEXT}/out")

# Check if compiling properly with emcmake/emmake
if (NOT EMSCRIPTEN)
  message(FATAL_ERROR "================================\nPlease re-run via Emscripten emmake/emcmake!\nAlso next time, run with --fresh once to\nclear the cache, or it'll show the same error.\n================================")
endif()

IF(NOT DEFINED ENV{EMSDK})
  message(SEND_ERROR "==========================================\nPlease activate Emscripten before running!\n(use emsdk_env.bat/sh)\n==========================================")
ENDIF()

option(ENABLE_FUNCTION_OVERLOADING "Fake function overloading in the JavaScript bindings" ON)
if (ENABLE_FUNCTION_OVERLOADING)
    set(FUNCTION_OVERLOADING "true")
else()
    set(FUNCTION_OVERLOADING "false")
endif()

option(ENABLE_JS_BACKEND "Enable compiling SplashKit for use in SplashKit Online JavaScript Projects" ON)

option(ENABLE_CPP_BACKEND "Enable compiling SplashKit for use in SplashKit Online C++ Projects" OFF)

option(COMPRESS_BACKENDS "Enable LZMA compression of the backend files - good for releases" OFF)


if (WIN32 OR MSYS OR MINGW)
  SET(MSYS "true")
  add_definitions(-DWINDOWS)
endif()

if(EMSCRIPTEN)
  SET(MSYS "false")
endif()

#### SETUP ####
if (APPLE)
    # MAC OS PROJECT FLAGS
    add_link_options("-Wl-U,___darwin_check_fd_set_overflow")
    set(LIB_FLAGS "-L${SK_LIB}/mac \
                   -framework IOKit \
                   -framework ForceFeedback \
                   -framework CoreFoundation \
                   -framework Metal \
                   -framework Cocoa \
                   -framework Carbon \
                   -framework AudioUnit \
                   -framework AudioToolbox \
                   -framework CoreAudio \
                   -framework CoreVideo \
                   -lSDL2 \
                   -lSDL2_mixer \
                   -lSDL2_ttf \
                   -lSDL2_gfx \
                   -lSDL2_image \
                   -lSDL2_net \
                   -lpthread \
                   -lbz2 \
                   -lFLAC \
                   -lvorbis \
                   -lz \
                   -lpng16 \
                   -lvorbisfile \
                   -logg \
                   -lwebp \
                   -lcurl \
                   -lncurses \
                   -liconv \
                   -ldl")
# WINDOWS PROJECT FLAGS
elseif(MSYS)
    string(COMPARE EQUAL "MINGW32" "$ENV{MSYSTEM}" MINGW32)
    string(COMPARE EQUAL "MINGW64" "$ENV{MSYSTEM}" MINGW64)

    if (${MINGW32})
        message("Using mingw32")
        set(OS_PATH_SUFFIX "win32")
        set(MINGW_PATH_PART "mingw32")
    elseif (${MINGW64})
        message("Using mingw64")
        set(OS_PATH_SUFFIX "win64")
        set(MINGW_PATH_PART "mingw64")
    else ( )
        message(SEND_ERROR "Failed to detect windows architecture")
        return ()
    endif()

    set(LIB_FLAGS  "-L${SK_LIB}/${OS_PATH_SUFFIX} \
                    -L/${MINGW_PATH_PART}/lib \
                    -L/usr/lib \
                    -lSDL2main")
# EMSCRIPTEN PROJECT FLAGS
elseif(EMSCRIPTEN)
    message("Using emscripten")
    set(LIB_FLAGS "-lpthread \
                   -ldl \
                   -s LINKABLE=1 \
                   -s EXPORT_ALL=1 \
                   -sUSE_SDL=2 \
                   -sUSE_SDL_TTF=2 \
                   -sUSE_SDL_GFX=2 \
                   -sUSE_SDL_NET=2 \
                   -sUSE_SDL_MIXER=2 \
                   -sUSE_SDL_IMAGE=2 \
                   -sSDL2_IMAGE_FORMATS='[\"bmp\",\"png\",\"xpm\"]'")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -sUSE_SDL=2")

    file(GLOB BUILD_AS_WINDOWS_FILES
        "${SK_EXT}/civetweb/src/civetweb.c"
        "${SK_EXT}/sqlite/sqlite3.c"
        "${SK_EXT}/hash-library/*.cpp"
        "${SK_SRC}/coresdk/terminal.cpp"
    )
    file(GLOB BUILD_AS_LINUX_FILES
        "${SK_EXT}/easyloggingpp/*.cc"
    )

    set_source_files_properties(${BUILD_AS_WINDOWS_FILES} PROPERTIES COMPILE_DEFINITIONS "WINDOWS")
    set_source_files_properties(${BUILD_AS_LINUX_FILES} PROPERTIES COMPILE_DEFINITIONS "__linux")
    set(CMAKE_EXECUTABLE_SUFFIX ".html")

# LINUX PROJECT FLAGS
else()
    set(LIB_FLAGS "-lSDL2 \
                   -lSDL2_mixer \
                   -lSDL2_ttf \
                   -lSDL2_gfx \
                   -lSDL2_image \
                   -lSDL2_net \
                   -lpthread \
                   -lbz2 \
                   -lFLAC \
                   -lvorbis \
                   -lz \
                   -lpng16 \
                   -lvorbisfile \
                   -logg \
                   -lwebp \
                   -lfreetype \
                   -lcurl \
                   -lncurses \
                   -ldl \
                   -lstdc++fs")
endif()

# FLAGS
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17")

# SOURCE FILES
file(GLOB SOURCE_FILES
    "${SK_SRC}/coresdk/*.cpp"
    "${SK_SRC}/backend/*.cpp"
    "${SK_EXT}/civetweb/src/civetweb.c"
    "${SK_EXT}/sqlite/sqlite3.c"
    "${SK_EXT}/hash-library/*.cpp"
    "${SK_EXT}/easyloggingpp/*.cc"
)

if (EMSCRIPTEN)
  file(GLOB WASM_SOURCE_FILES
    "${SK_WASMEXT}/stubs/*.cpp"
    "${SK_WASMEXT}/src/cxxbackend/funcs/*.cpp"
  )
  set(SOURCE_FILES ${SOURCE_FILES} ${WASM_SOURCE_FILES})
endif()

# TEST FILE INCLUDES
file(GLOB TEST_SOURCE_FILES
    "${SK_SRC}/test/*.cpp"
)

file(GLOB UNIT_TEST_SOURCE_FILES
    "${SK_SRC}/test/unit_tests/*.cpp"
)

# SKSDK FILE INCLUDES
file(GLOB INCLUDE_FILES
    "${SK_SRC}/coresdk/*.h"
)

# DIRECTORY INCLUDES
include_directories("${SK_SRC}")
include_directories("${SK_SRC}/coresdk")
include_directories("${SK_SRC}/backend")
include_directories("${SK_SRC}/test")
include_directories("${SK_EXT}/civetweb/include")
include_directories("${SK_EXT}/easyloggingpp")
include_directories("${SK_EXT}/hash-library")
include_directories("${SK_EXT}/json")
include_directories("${SK_EXT}/sqlite")
include_directories("${SK_EXT}/catch")
include_directories("${SK_WASMEXT}/src/lib")

# MAC OS AND WINDOWS DIRECTORY INCLUDES
if (APPLE OR MSYS OR EMSCRIPTEN)
    include_directories("${SK_EXT}/SDL/include")
    include_directories("${SK_EXT}/SDL_gfx")
    include_directories("${SK_EXT}/SDL_image")
    include_directories("${SK_EXT}/SDL_mixer")
    include_directories("${SK_EXT}/SDL_net")
    include_directories("${SK_EXT}/SDL_ttf")
endif()
# MAC OS ONLY DIRECTORY INCLUDES
if (APPLE)
    include_directories("${SK_EXT}/SDL_image/external/libpng-1.6.2")
endif()
# WINDOWS ONLY DIRECTORY INCLUDES
if (MSYS OR EMSCRIPTEN)
    include_directories(/${MINGW_PATH_PART}/include)
    include_directories(/${MINGW_PATH_PART}/include/libpng16)
    include_directories("${SK_LIB}/win_inc")
    include_directories("${SK_EXT}/sqlite")
endif()

# MACRO DEFINITIONS #
add_definitions(-DELPP_THREAD_SAFE)

#### END SETUP ####
#### SplashKitBackend STATIC LIBRARY ####
add_library(SplashKitBackend STATIC ${SOURCE_FILES} ${INCLUDE_FILES})
#### SplashKitBackendCXX STATIC LIBRARY ####
# IMPORTANT NOTE: This library does _not _ get linked anywhere in this file.
# Instead, it is linked only during in-browser compilation.
# It will not link without specific linker parameters (i.e --wrap=_ZN13splashkit_lib14process_eventsEv)
add_library(SplashKitBackendCXX STATIC "${SK_WASMEXT}/src/cxxbackend/patched_functions.cpp" ${SOURCE_FILES} ${INCLUDE_FILES})

target_link_libraries(SplashKitBackend ${LIB_FLAGS})
target_link_libraries(SplashKitBackendCXX ${LIB_FLAGS})

if (EMSCRIPTEN)
    # Ensure the 'generated' folder exists
    add_custom_target(WASMBindingsDirectory ALL
    COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_WASMEXT}/generated/")

    # ensure the 'api' folder exists
    add_custom_target(SKAPIDirectory ALL
    COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_OUT}/api")


if (ENABLE_JS_BACKEND)
    # Auto generate C++ Javascript Glue code
    add_custom_target( WASMBindings ALL DEPENDS
        "${SK_WASMEXT}/generated/SplashKitWasmGlue.cpp"
        "${SK_WASMEXT}/generated/SplashKitWasmGlue.js"
    )

    add_custom_command(
        DEPENDS
            "${SK_CMAKE}/../../generated/docs/api.json"
            "${SK_WASMEXT}/tools/generate_javascript_bindings_and_glue.py"
            "${SK_WASMEXT}/tools/json_api_reader.py"
            "${SK_WASMEXT}/tools/js_binding_gen/*.py"
        OUTPUT
            "${SK_WASMEXT}/generated/SplashKitWasmGlue.cpp"
            "${SK_WASMEXT}/generated/SplashKitWasmGlue.js"
        COMMENT "Generating Web IDL Bindings..."
        COMMAND python "${SK_WASMEXT}/tools/generate_javascript_bindings_and_glue.py"
            "${SK_CMAKE}/../../generated/docs/api.json"
            "${SK_WASMEXT}/generated/SplashKitWasmGlue.cpp"
            "${SK_WASMEXT}/generated/SplashKitWasmGlue.js"
            "${FUNCTION_OVERLOADING}"
        )

    add_dependencies(WASMBindings WASMBindingsDirectory)
endif()

    # Auto generate JSON file used to perform autocomplete in the IDE
    add_custom_target( AutocompleteJSON ALL DEPENDS "${SK_OUT}/api/splashkit_autocomplete.json")

    add_custom_command(
        DEPENDS
            "${SK_CMAKE}/../../generated/docs/api.json"
            "${SK_WASMEXT}/tools/generate_autocomplete_json.py"
            "${SK_WASMEXT}/tools/json_api_reader.py"
        OUTPUT "${SK_OUT}/api/splashkit_autocomplete.json"
        COMMENT "Generating Autocomplete JSON..."
        COMMAND python "${SK_WASMEXT}/tools/generate_autocomplete_json.py"
            "${SK_CMAKE}/../../generated/docs/api.json"
            "${SK_OUT}/api/splashkit_autocomplete.json"
            "${FUNCTION_OVERLOADING}"
    )

    add_dependencies(AutocompleteJSON SKAPIDirectory)

endif()

if (MSYS)
    add_definitions(-DWINDOWS)
    link_directories("${SK_LIB}/${OS_PATH_SUFFIX}")
    target_link_libraries(SplashKitBackend SDL2_mixer
                                           SDL2_image
                                           SDL2_net
                                           libcivetweb
                                           SDL2
                                           SDL2_ttf
                                           libcurl
                                           libSDL2_gfx-1-0-0
                                           libpng16-16
                                           libsqlite
                                           pthread
                                           stdc++
                                           ws2_32
                                           libncursesw
                                           )
elseif(APPLE)
    # To make a universal single static library from dependent
    # static libraries, run libtool on SplashKitBackend
    file(GLOB APPLE_STATIC_LIBS
        "${SK_LIB}/mac/*.a"
    )
    add_custom_command(TARGET SplashKitBackend POST_BUILD
      COMMAND /usr/bin/libtool -static -o $<TARGET_FILE:SplashKitBackend>
      $<TARGET_FILE:SplashKitBackend> ${APPLE_STATIC_LIBS}
    )
endif()


# SET OUTPUT TO /path/to/splashkit/out/lib
set_target_properties(SplashKitBackend
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "${SK_OUT}/lib"
)
set_target_properties(SplashKitBackendCXX
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "${SK_OUT}/lib"
)

#### END SplashKitBackend STATIC LIBRARY ####
#### SplashKitBackend WASM LIBRARY ####
if (EMSCRIPTEN)
    if (ENABLE_JS_BACKEND)
        add_executable(SplashKitBackendWASM "${SK_WASMEXT}/generated/SplashKitWasmGlue.cpp")
        set_target_properties(SplashKitBackendWASM PROPERTIES LINK_FLAGS "-sALLOW_TABLE_GROWTH -s MAXIMUM_MEMORY=1gb -sALLOW_MEMORY_GROWTH -s EXPORTED_RUNTIME_METHODS=addFunction -s EXPORTED_FUNCTIONS=\"['_malloc','stackAlloc','stackSave','stackRestore','_free']\" -s EXPORT_ALL=1 -sFS_DEBUG --post-js ${SK_WASMEXT}/generated/SplashKitWasmGlue.js")
        target_link_libraries(SplashKitBackendWASM SplashKitBackend) #NOTE: deliberately using SplashKitBackend rather than SplashKitBackendCXX - we don't care about the final linked output, we just want Emscripten to give us its JS runtime
        set_target_properties(SplashKitBackendWASM
            PROPERTIES
            RUNTIME_OUTPUT_DIRECTORY "${SK_OUT}/wasmlib_javascript"
        )
        add_dependencies(SplashKitBackendWASM WASMBindings)
        set_target_properties(SplashKitBackendWASM PROPERTIES SUFFIX ".js")

        # Copy built library to the IDE
        add_custom_target( SplashKitOnlineIDEComponents ALL DEPENDS SplashKitBackendWASM AutocompleteJSON)
        add_custom_command(TARGET SplashKitOnlineIDEComponents
            POST_BUILD COMMAND
            ${CMAKE_COMMAND} -E copy_directory "${SK_OUT}/wasmlib_javascript" "${SK_BROWSERIDE}/runtimes/javascript/bin")

        add_custom_command(TARGET SplashKitOnlineIDEComponents POST_BUILD
                       COMMAND ${CMAKE_COMMAND} -E cmake_echo_color --cyan
                       "Copied built JavaScript library to the IDE!")

    endif()
    if (ENABLE_CPP_BACKEND)
        add_executable(SplashKitBackendWASMCPP "${SK_WASMEXT}/src/cxxbackend/stubs/dummy.cpp")
        set_target_properties(SplashKitBackendWASMCPP PROPERTIES LINK_FLAGS " -sWASM_BIGINT -sDEMANGLE_SUPPORT --proxy-to-worker --pre-js=${SK_WASMEXT}/src/cxxbackend/cxx_preamble.js -sINCLUDE_FULL_LIBRARY  -sALLOW_TABLE_GROWTH -s MAXIMUM_MEMORY=1gb -sALLOW_MEMORY_GROWTH -sEXPORTED_RUNTIME_METHODS=['addFunction'] -s EXPORTED_FUNCTIONS=\"['_malloc','stackAlloc','stackSave','stackRestore','_free']\" -s EXPORT_ALL=1 -sFS_DEBUG" LINK_DEPENDS "${SK_WASMEXT}/src/cxxbackend/cxx_preamble.js")

        target_link_libraries(SplashKitBackendWASMCPP SplashKitBackend)
        set_target_properties(SplashKitBackendWASMCPP
            PROPERTIES
            RUNTIME_OUTPUT_DIRECTORY "${SK_OUT}/wasm_cpplib"
        )

        set_target_properties(SplashKitBackendWASMCPP PROPERTIES SUFFIX ".js")

        # Patch generated JavaScript runtime
        add_custom_target( SplashKitBackendWASMCPPPatched ALL DEPENDS SplashKitBackendWASMCPP "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.worker.js" "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.js")

        add_custom_command(
            DEPENDS
                "${SK_WASMEXT}/out/wasm_cpplib/SplashKitBackendWASMCPP.js"
                "${SK_WASMEXT}/out/wasm_cpplib/SplashKitBackendWASMCPP.worker.js"
                "${SK_WASMEXT}/tools/cxx_backend_emscripten_glue_patcher.py"
            OUTPUT
                "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.worker.js"
                "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.js"
            COMMENT "Patching generated Emscripten glue JavaScript for C++ Backend..."
            COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_WASMEXT}/out/cxx/runtime/"
            COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_WASMEXT}/out/cxx/compiler/"
            COMMAND python "${SK_WASMEXT}/tools/cxx_backend_emscripten_glue_patcher.py"
                "${SK_WASMEXT}/out/wasm_cpplib/SplashKitBackendWASMCPP.worker.js"
                "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.worker.js"
                "${SK_WASMEXT}/out/wasm_cpplib/SplashKitBackendWASMCPP.js"
                "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.js"
            )

        # Generate compilation system root files
        add_custom_target( CPPCompilationSystemRoot ALL DEPENDS SplashKitBackendCXX "${SK_OUT}/cxx/compiler/wasi-sysroot.zip")

        if (COMPRESS_BACKENDS)
            set(ZIP_COMPRESSION_FLAG "stored") #make the zip easily compressible later
        else()
            set(ZIP_COMPRESSION_FLAG "compressed")
        endif()

        add_custom_command(
            DEPENDS
                "${SK_WASMEXT}/prebuilt/cxx/compiler/sysroot.zip"
                "${SK_WASMEXT}/tools/cxx_backend_systemroot_builder.py"
                SplashKitBackendCXX
            OUTPUT
                "${SK_OUT}/cxx/compiler/wasi-sysroot.zip"
            COMMENT "Bundling C++ Compilation System Root..."
            COMMAND python "${SK_WASMEXT}/tools/cxx_backend_systemroot_builder.py"
                $<TARGET_FILE:SplashKitBackendCXX>
                "${SK_SRC}/coresdk/"
                "${SK_WASMEXT}/prebuilt/cxx/compiler/sysroot.zip"
                "${SK_OUT}/cxx/compiler/wasi-sysroot.zip"
                ${ZIP_COMPRESSION_FLAG}
            )

        # RUNTIME FILES
        set(UNCOMPRESSED_RUNTIME_FILES
            "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.js"
            "${SK_WASMEXT}/out/cxx/runtime/SplashKitBackendWASMCPP.worker.js"
        )

        # COMPILER Root FILES
        set(UNCOMPRESSED_COMPILER_ROOT_FILES
            "${SK_WASMEXT}/out/cxx/compiler/wasi-sysroot.zip"
        )

        # COMPILER FILES
        set(UNCOMPRESSED_COMPILER_SCRIPT_FILES
            "${SK_WASMEXT}/prebuilt/cxx/compiler/clang++.js"
            "${SK_WASMEXT}/prebuilt/cxx/compiler/wasm-ld.js"
        )

        # COMPILER FILES
        set(UNCOMPRESSED_COMPILER_BINARY_FILES
            "${SK_WASMEXT}/prebuilt/cxx/compiler/clang.wasm"
            "${SK_WASMEXT}/prebuilt/cxx/compiler/lld.wasm"
        )

        if (COMPRESS_BACKENDS)
            set(COMPRESSED_COMPILER_ROOT_FILES ${UNCOMPRESSED_COMPILER_ROOT_FILES})
            list(TRANSFORM COMPRESSED_COMPILER_ROOT_FILES APPEND ".lzma")

            set(COMPRESSED_COMPILER_BINARY_FILES ${UNCOMPRESSED_COMPILER_BINARY_FILES})
            list(TRANSFORM COMPRESSED_COMPILER_BINARY_FILES APPEND ".lzma")
            list(TRANSFORM COMPRESSED_COMPILER_BINARY_FILES REPLACE "/prebuilt/" "/out/")

            # Compress compilation system root files
            add_custom_command(
                DEPENDS ${UNCOMPRESSED_COMPILER_ROOT_FILES} "${SK_WASMEXT}/tools/backend_binary_compressor.py"
                OUTPUT ${COMPRESSED_COMPILER_ROOT_FILES}
                COMMENT "Compressing C++ Compiler Root Files..."
                COMMAND python "${SK_WASMEXT}/tools/backend_binary_compressor.py" ${UNCOMPRESSED_COMPILER_ROOT_FILES} ${COMPRESSED_COMPILER_ROOT_FILES}
            )

            # Compress compiler binaries
            add_custom_command(
                DEPENDS ${UNCOMPRESSED_COMPILER_BINARY_FILES} "${SK_WASMEXT}/tools/backend_binary_compressor.py"
                OUTPUT ${COMPRESSED_COMPILER_BINARY_FILES}
                COMMENT "Compressing C++ Compiler Binaries..."
                COMMAND python "${SK_WASMEXT}/tools/backend_binary_compressor.py" ${UNCOMPRESSED_COMPILER_BINARY_FILES} ${COMPRESSED_COMPILER_BINARY_FILES}
            )

            set(CXX_RUNTIME_FILES ${UNCOMPRESSED_RUNTIME_FILES})
            set(CXX_COMPILER_FILES ${UNCOMPRESSED_COMPILER_SCRIPT_FILES} ${COMPRESSED_COMPILER_BINARY_FILES} ${COMPRESSED_COMPILER_ROOT_FILES})
        else()
            set(CXX_RUNTIME_FILES ${UNCOMPRESSED_RUNTIME_FILES})
            set(CXX_COMPILER_FILES ${UNCOMPRESSED_COMPILER_SCRIPT_FILES} ${UNCOMPRESSED_COMPILER_BINARY_FILES} ${UNCOMPRESSED_COMPILER_ROOT_FILES})
        endif()

        # Copy built library to the IDE
        add_custom_target( SplashKitOnlineIDE_CPPBackend ALL DEPENDS SplashKitBackendWASMCPPPatched CPPCompilationSystemRoot ${CXX_RUNTIME_FILES} ${CXX_COMPILER_FILES})

        add_custom_command(TARGET SplashKitOnlineIDE_CPPBackend
            POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_BROWSERIDE}/runtimes/cxx/bin"
            COMMAND ${CMAKE_COMMAND} -E make_directory "${SK_BROWSERIDE}/compilers/cxx/bin"
        )

        foreach(current_file IN LISTS CXX_RUNTIME_FILES)
            add_custom_command(TARGET SplashKitOnlineIDE_CPPBackend POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy ${current_file} "${SK_BROWSERIDE}/runtimes/cxx/bin/" COMMENT "Copying file: ${current_file}")
        endforeach()

        foreach(current_file IN LISTS CXX_COMPILER_FILES)
            add_custom_command(TARGET SplashKitOnlineIDE_CPPBackend POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy ${current_file} "${SK_BROWSERIDE}/compilers/cxx/bin/" COMMENT "Copying file: ${current_file}")
        endforeach()

        add_custom_command(TARGET SplashKitOnlineIDE_CPPBackend POST_BUILD
                       COMMAND ${CMAKE_COMMAND} -E cmake_echo_color --cyan
                       "Copied built C++ library to the IDE!")

    endif()


    # Copy built library to the IDE
    add_custom_target( SplashKitOnlineIDEAutoComplete ALL DEPENDS AutocompleteJSON)
    add_custom_command(TARGET SplashKitOnlineIDEAutoComplete
        POST_BUILD COMMAND
        ${CMAKE_COMMAND} -E copy_directory "${SK_OUT}/api" "${SK_BROWSERIDE}/splashkit")

    add_custom_command(TARGET SplashKitOnlineIDEAutoComplete POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E cmake_echo_color --cyan
                   "Copied auto-complete JSON to the IDE!")
endif()
#### END SplashKitBackend WASM LIBRARY ####
#### sktest EXECUTABLE ####
add_executable(sktest ${TEST_SOURCE_FILES})
set_property(TARGET sktest PROPERTY POSITION_INDEPENDENT_CODE FALSE)

target_link_libraries(sktest SplashKitBackend)
target_link_libraries(sktest ${LIB_FLAGS})

# target_link_options(sktest PUBLIC "LINKER:-U,___darwin_check_fd_set_overflow")

set_target_properties(sktest
    PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${SK_BIN}
)

# Copy resources folder in
add_custom_command(TARGET sktest
    PRE_BUILD COMMAND
    ${CMAKE_COMMAND} -E copy_directory "${SK_SRC}/test/Resources" $<TARGET_FILE_DIR:sktest>/Resources)


if (EMSCRIPTEN)
    set_target_properties(sktest PROPERTIES LINK_FLAGS "--preload-file ${SK_SRC}/test/Resources@Resources")
endif()

# if (MSYS)
#     add_custom_command(TARGET sktest
#         PRE_BUILD COMMAND
#         cmake -E copy ../../coresdk/lib/win64/*.dll ../../bin
#         )
# endif()

#### END sktest EXECUTABLE ####

#### skunit_tests EXECUTABLE ####
add_executable(skunit_tests ${UNIT_TEST_SOURCE_FILES})
set_property(TARGET skunit_tests PROPERTY POSITION_INDEPENDENT_CODE FALSE)

# target_link_options(skunit_tests PUBLIC "LINKER:-U,___darwin_check_fd_set_overflow")
target_link_libraries(skunit_tests SplashKitBackend)
target_link_libraries(skunit_tests ${LIB_FLAGS})

if (EMSCRIPTEN)
    set_target_properties(skunit_tests PROPERTIES LINK_FLAGS "--preload-file ${SK_SRC}/test/Resources@Resources")
endif()

set_target_properties(skunit_tests
        PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${SK_BIN}
        )
#### END sktest EXECUTABLE ####

install(TARGETS SplashKitBackend DESTINATION lib)
install(FILES ${INCLUDE_FILES} DESTINATION include/SplashKitBackend)
