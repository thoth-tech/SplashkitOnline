#!/usr/bin/env bash
set -euo pipefail

# build_static_site.sh <sha> <workflow event_name> <username/repo>

ROOT_DIR="$(pwd)"
REPO_DIR="$ROOT_DIR/splashkitonline"
PREBUILT_DIR="$ROOT_DIR/prebuilt"

echo "========================================"
echo "Build Static Site Script"
echo "Repo dir: $REPO_DIR"
echo "========================================"

cd "$REPO_DIR"

# Only build WASM binaries if SplashKitWasm changed, or if this is a push
if ! git diff --quiet "$(git merge-base "origin/main" "$1")..$1" -- SplashKitWasm &>/dev/null || [ "$2" = "push" ]; then
    cd "$ROOT_DIR"

    echo "========================================"
    echo "Downloading Compilation Pre-builts"
    echo "========================================"

    mkdir -p "$REPO_DIR/SplashKitWasm/prebuilt/cxx/compiler"
    cd "$REPO_DIR/SplashKitWasm/prebuilt/cxx/compiler"

    wget -O clang++.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang++.js
    wget -O clang.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/clang.wasm.lzma
    wget -O wasm-ld.js https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/wasm-ld.js
    wget -O lld.wasm.lzma https://raw.githubusercontent.com/WhyPenguins/SplashkitOnline/github-live/Browser_IDE/compilers/cxx/bin/lld.wasm.lzma
    wget -O sysroot.zip https://github.com/WhyPenguins/SplashkitOnline/raw/refs/heads/cxx_language_backend_binaries/SplashKitWasm/prebuilt/sysroot.zip

    # Decompress downloaded wasm archives
    xz -d -f clang.wasm.lzma
    xz -d -f lld.wasm.lzma

    cd "$ROOT_DIR"

    echo "========================================"
    echo "Set Up Compilation Environment"
    echo "========================================"

    sudo apt-get -qq update
    sudo apt-get install -y \
        build-essential \
        cmake \
        libpng-dev \
        libcurl4-openssl-dev \
        libsdl2-dev \
        libsdl2-mixer-dev \
        libsdl2-gfx-dev \
        libsdl2-image-dev \
        libsdl2-net-dev \
        libsdl2-ttf-dev \
        libmikmod-dev \
        libbz2-dev \
        libflac-dev \
        libvorbis-dev \
        libwebp-dev

    git clone https://github.com/emscripten-core/emsdk.git
    ./emsdk/emsdk install 3.1.48

    echo "========================================"
    echo "Build SplashKit WASM Libraries"
    echo "========================================"

    cd "$ROOT_DIR/emsdk"
    ./emsdk activate 3.1.48
    # shellcheck disable=SC1091
    source ./emsdk_env.sh
    cd "$ROOT_DIR"

    mkdir -p "$REPO_DIR/SplashKitWasm/out/cxx/compiler"

    cd "$REPO_DIR/SplashKitWasm/cmake"
    emcmake cmake -G "Unix Makefiles" \
        -DENABLE_JS_BACKEND=ON \
        -DENABLE_CPP_BACKEND=ON \
        -DENABLE_FUNCTION_OVERLOADING=ON \
        -DCOMPRESS_BACKENDS=ON .
    emmake make -j8

    cd "$ROOT_DIR"

else
    echo "========================================"
    echo "Using Precompiled Binaries from Main"
    echo "========================================"

    cd "$REPO_DIR"

    # Get a list of tracked files so we only overlay prebuilt generated/static output
    TRACKED_FILES=$(git log --pretty=format: --name-only --diff-filter=A -- . | sort -u | sed '/^$/d')
    EXCLUDE_FILE=$(mktemp)
    echo "$TRACKED_FILES" > "$EXCLUDE_FILE"

    # Explicit excludes
    {
        echo "/codemirror-5.65.15"
        echo "/jszip"
        echo "/babel"
        echo "/split.js"
        echo "/mime"
        echo "/node_modules"
        echo "/prebuilt"
    } >> "$EXCLUDE_FILE"

    cd "$ROOT_DIR"

    rm -rf "$PREBUILT_DIR"
    mkdir -p "$PREBUILT_DIR"
    cd "$PREBUILT_DIR"

    wget "https://github.com/$3/releases/download/branch%2Fmain/splashkitonline-static-site-branch_main.zip"
    unzip splashkitonline-static-site-branch_main.zip
    rm splashkitonline-static-site-branch_main.zip

    cd "$ROOT_DIR"

    # Copy in all untracked/generated files from the release into repo root
    rsync -av --progress --exclude-from="$EXCLUDE_FILE" "$PREBUILT_DIR/" "$REPO_DIR/"

    rm -f "$EXCLUDE_FILE"
fi

echo "========================================"
echo "Install Node Dependencies"
echo "========================================"
cd "$REPO_DIR"
npm install

echo "========================================"
echo "Re-Structure Static Site"
echo "========================================"

# If changed, remember to update explicit excludes above
if [ -d node_modules/codemirror ]; then
    rm -rf codemirror-5.65.15
    mv node_modules/codemirror codemirror-5.65.15
fi

if [ -d node_modules/jszip/dist ]; then
    rm -rf jszip
    mv node_modules/jszip/dist jszip
fi

if [ -d node_modules/@babel/standalone ]; then
    rm -rf babel
    mv node_modules/@babel/standalone babel
fi

if [ -d node_modules/split.js/dist ]; then
    rm -rf split.js
    mv node_modules/split.js/dist split.js
fi

if [ -d node_modules/mime/dist ]; then
    rm -rf mime
    mv node_modules/mime/dist mime
fi

if [ -d js-lzma/data ]; then
    rm -rf js-lzma/data
fi

echo "========================================"
echo "Static site preparation complete"
echo "========================================"