<img src="SplashKitOnlineIDETitle.png" alt="SplashKit Online IDE"/>

# SplashKit Online

SplashKit Online is a browser-based development environment for beginner programmers!
With it you can immediately get started programming in Javascript (and experimentally C++!) using the [SplashKit](https://splashkit.io) library, which is an easy to use library for handling input, graphics, and sound - everything you need to make a game!

![prototype-image](SplashKitOnlineIDEPrototypeImage.png)

## [Try Online!](https://whypenguins.github.io/SplashkitOnline/)

## Table Of Contents

- [Installation](#installation)
    - [Setting up the IDE](#setting-up-the-ide)
- [Project Goals and Structure](#project-goals-and-structure)
    - [Technology Used](#technology-used)
- [SplashKit Wasm Library Manual Compilation](#splashkit-wasm-library-manual-compilation)
- [Experimental C++ Support](#experimental-c-support)
    - [Setup](#setup)
	    - [Installing the Compilers](#installing-the-compilers)
	    - [Installing the C++ Runtime](#installing-the-c-runtime)
	        - [(Optional) For Manual Compilation](#optional-for-manual-compilation)
    - [Switching to C++](#switching-to-c)
- [License](#license)
## Installation

Standard installation (of JavaScript support only) involves two steps:

 1. Setting up the IDE
 2. Importing the SplashKit Wasm Library

See the bottom of the readme for how to set up experimental C++ support.

### Setting up the IDE
The IDE is just a simple node project with few dependencies, and can be setup with the following lines:
```bash
git clone --recursive https://github.com/thoth-tech/SplashkitOnline.git
cd SplashkitOnline/Browser_IDE/
npm install
```
However, we also need to import the SplashKit library, as its not included in the repository by default. The Node server will import the necessary files automatically on start-up, but this can also be achieved with the included `setup.py` script.
```bash
py setup.py # optional
npm run server
```
Now you'll be able to load up `localhost:8000` in a browser and see the IDE!

## Project Goals and Structure
The goal of the SplashKit Online IDE is to provide a beginner friendly programming environment targeted towards using the SplashKit library. It has REPL like functionality to allow rapid feedback, with emphasis on game related functionality like interactivity, graphics rendering and audio playback. To support this, code execution should definitely happen in the browser (hence compiling SplashKit to run in the browser), and ideally compilation does as well. Currently Javascript is the only language supported (as it is quite easy to execute in a browser), however work on involving other languages is also under way.

## Technology Used
### IDE
The IDE is written as simply as possible, using straight HTML, CSS and Javascript. The code editors use the CodeMirror library (version 5) to provide syntax highlighting and other editing features. It is currently ran by using node for some reason, however as demonstrated by the unofficial demo, any sort of static page server can do the trick (such as `python -m http.server`)

### Code Execution
Currently Javascript is the language supported by the IDE, and it is executed securely inside an iFrame after some code transformations to make it run asynchronously and within a custom scope.

The SplashKit API has been exposed to the global scope of Javascript, allowing the user to interface with it in much the same way they can in other languages, like C++ and Python. Calls to the SplashKit API are then executed by the SplashKit Wasm module as native code (or as native as it gets in a browser).

### SplashKit Library
The SplashKit library handles all input, graphics, audio and file handling, and is invoked by the user's Javascript. The library has been compiled into a WebAssembly (Wasm) module via Emscripten. This module is loaded into the page as soon as the IDE starts, and the functions in it exported as Javascript functions.

## SplashKit Wasm Library Manual Compilation
First you'll need to install Emscripten, which will be used to compile SplashKit to Wasm so it can be used in the browser. The easiest way to do this is via the `emsdk`. Installation instructions are here - [Getting Started](https://emscripten.org/docs/getting_started/downloads.html)

Once you've got Emscripten installed and activated, you can compile the SplashKit Wasm library! We've included SplashKit's source code as a submodule, along with the scripts to compile it as a Wasm library, directly in this repo.

Currently only cmake builds are supported, so navigate to the cmake project and build it using Emscripten's `emcmake` and `emmake` wrappers.
```bash
cd SplashkitOnline\SplashKitWasm\cmake
emcmake cmake -G "Unix Makefiles" .
emmake make
```
If all goes well, you should find the three files built and copied to inside `Browser_IDE/runtimes/javascript/bin/` and `Browser_IDE/splashkit/` - if so, you're done!

# Experimental C++ Support
It is also possible to use C++ within SplashKit Online! This is still experimental, and as such is missing some features and can be a bit unstable. However, the majority of graphics, audio, and input functionality works, and you can use it to compile and test regular C++ programs too!

Assuming the IDE is set up correctly, installation of the C++ side involves three more steps:

 1. Installing the Compilers
 2. Installing the C++ Runtime
 3. Switching to C++

## Setup
### Installing the Compilers
Currently the binaries for the compilers can be found unoficially [here](https://github.com/WhyPenguins/SplashkitOnline/blob/cxx_language_backend_binaries/Browser_IDE/compilers/cxx/bin/)

1. Download [compiler.zip](https://github.com/WhyPenguins/SplashkitOnline/blob/cxx_language_backend_binaries/Browser_IDE/compilers/cxx/bin/compiler.zip)
2. Extract the files in it, and place them all inside `/Browser_IDE/compilers/cxx/bin/`
3. You'll also need [wasi-sysroot.zip](https://github.com/WhyPenguins/SplashkitOnline/blob/cxx_language_backend_binaries/Browser_IDE/compilers/cxx/bin/wasi-sysroot.zip) - this goes in the same directory (don't unzip it!)

####  Manual Compilation
If you want to compile some of this yourself, currently the repository supports building both the C++/JavaScript runtimes, and the Compiler System Root Files (partially).

To compile these:
1. Place [sysroot.zip](https://github.com/WhyPenguins/SplashkitOnline/tree/cxx_language_backend_binaries/SplashKitWasm/prebuilt/sysroot.zip) at `SplashKitWasm/prebuilt/` (don't unzip it!)
2. Run:
```bash
cd SplashkitOnline\SplashKitWasm\cmake
emcmake cmake -G "Unix Makefiles" -DENABLE_CPP_BACKEND=ON .
emmake make -j8
```

For more info, see the [this pull request](https://github.com/thoth-tech/SplashkitOnline/pull/65).

## Switching to C++

Once its all setup, you can head to `localhost:8000`, which will bring up the normal JavaScript runtime. To switch to C++, just go to `localhost:8000/?language=C++` - you'll probably also want to click `New Project` to create the default C++ project. You can also use `localhost:8000/?language=JavaScript` for JavaScript.

## License

Most of the SplashKit Online IDE is licensed under the GNU General Public License v3.0
Some of it is unlicensed - this code will be either removed shortly (it is no longer unused) or the original authors contacted and properly licensed.
