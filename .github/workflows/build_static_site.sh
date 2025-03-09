set -e

# Do we need to build?
cd ./splashkitonline
if ! git diff --quiet $(git merge-base main "$1").."$1" -- SplashKitWasm &>/dev/null || [ "$2" == "push" ]; then
    cd ../

    echo "========================================"
    echo "Downloading Compilation Pre-builts (To improve...these should be buildable too)"
    echo "========================================"
    mkdir -p ./splashkitonline/SplashKitWasm/prebuilt/cxx/compiler/
    cd ./splashkitonline/SplashKitWasm/prebuilt/cxx/compiler/
    wget -O clang++.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang++.js
    wget -O clang.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang.wasm.lzma
    wget -O wasm-ld.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/wasm-ld.js
    wget -O lld.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/lld.wasm.lzma
    # decompress them - silly since they'll just be re-compressed again, but it is what it is for now...
    xz -d clang.wasm.lzma
    xz -d lld.wasm.lzma

    cd ../../../../../

    echo "========================================"
    echo "Set Up Compilation Environment"
    echo "========================================"

    sudo apt-get -qq update
    sudo apt-get install -y build-essential cmake libpng-dev libcurl4-openssl-dev libsdl2-dev libsdl2-mixer-dev libsdl2-gfx-dev libsdl2-image-dev libsdl2-net-dev libsdl2-ttf-dev libmikmod-dev libbz2-dev libflac-dev libvorbis-dev libwebp-dev
    git clone https://github.com/emscripten-core/emsdk.git
    ./emsdk/emsdk install 3.1.48


    echo "========================================"
    echo "Build SplashKit WASM Libraries"
    echo "========================================"

    cd emsdk
    ./emsdk activate 3.1.48
    source ./emsdk_env.sh
    cd ../
    mkdir -p ./splashkitonline/SplashKitWasm/prebuilt/cxx/compiler/
    wget -O ./splashkitonline/SplashKitWasm/prebuilt/cxx/compiler/sysroot.zip https://github.com/WhyPenguins/SplashkitOnline/tree/cxx_language_backend_binaries/SplashKitWasm/prebuilt/sysroot.zip


    cd ./splashkitonline/SplashKitWasm/cmake/

    emcmake cmake -G "Unix Makefiles" -DENABLE_JS_BACKEND=ON -DENABLE_CPP_BACKEND=ON -DENABLE_FUNCTION_OVERLOADING=ON -DCOMPRESS_BACKENDS=ON .
    emmake make -j8

    cd ../../../

else
    cd ../

    cd ./splashkitonline/Browser_IDE

    wget -O splashkit/splashkit_autocomplete.json https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/splashkit/splashkit_autocomplete.json
    wget -O runtimes/javascript/bin/SplashKitBackendWASM.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/runtimes/javascript/bin/SplashKitBackendWASM.js
    wget -O runtimes/javascript/bin/SplashKitBackendWASM.wasm https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/runtimes/javascript/bin/SplashKitBackendWASM.wasm
    wget -O compilers/cxx/bin/wasi-sysroot.zip.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/wasi-sysroot.zip.lzma
    wget -O compilers/cxx/bin/clang++.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang++.js
    wget -O compilers/cxx/bin/clang.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang.wasm.lzma
    wget -O compilers/cxx/bin/wasm-ld.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/wasm-ld.js
    wget -O compilers/cxx/bin/lld.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/lld.wasm.lzma
    wget -O runtimes/cxx/bin/SplashKitBackendWASMCPP.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.js
    wget -O runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js

    cd ../../

fi


echo "========================================"
echo "Install Node Dependencies"
echo "========================================"
cd ./splashkitonline/Browser_IDE

npm install

cd ../../



echo "========================================"
echo "Re-Structure Static Site"
echo "========================================"
cd ./splashkitonline/Browser_IDE

mv node_modules/codemirror codemirror-5.65.15
mv node_modules/jszip/dist jszip
mv node_modules/@babel/standalone babel
mv node_modules/split.js/dist split.js
mv node_modules/mime/dist mime
rm -rf external/js-lzma/data
mv ../DemoProjects DemoProjects

cd ../
