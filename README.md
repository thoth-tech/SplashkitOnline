<img src="SplashKitOnlineIDETitle.png" alt="SplashKit Online IDE"/>

# SplashKit Online

SplashKit Online is a browser-based development environment for beginner programmers!
With it you can immediately get started programming in Javascript using the [SplashKit](https://splashkit.io) library, which is an easy to use library for handling input, graphics, and sound - everything you need to make a game!

![prototype-image](SplashKitOnlineIDEPrototypeImage.png)

## [Try Online!](https://whypenguins.github.io/SplashkitOnline/)

## Table Of Contents

- [Installation](#installation)
    - [Setting up the IDE](#setting-up-the-ide)
    - [Installing SplashKit Wasm Library](#installing-splashkit-wasm-library)
	    - [For Pre-Built Files](#for-pre-built-files)
	    - [For Manual Compilation](#for-manual-compilation)
- [Project Goals and Structure](#project-goals-and-structure)
    - [Technology Used](#technology-used)
- [License](#license)
## Installation

Installation involves two steps.

 1. Setting up the IDE
 2. Importing the SplashKit Wasm Library

### Setting up the IDE
The IDE is just a simple node project with few dependencies, and can be setup with the following lines:
```bash
git clone https://github.com/thoth-tech/SplashkitOnline.git
cd SplashkitOnline/Browser_IDE/
npm install codemirror@5
npm run server
```
Now you'll be able to load up `localhost:8000` in a browser and see the IDE! However, we also need to import the SplashKit library, as its not included in the repository by default. 

### Installing SplashKit Wasm Library
Installing the SplashKit library involves:
1. Getting the SplashKit Wasm Libraries - three files called `SplashKitBackendWASM.js`, `SplashKitBackendWASM.wasm` and `SplashKitGlobalAPI.js`. You can either [compile them yourself](#for-manual-compilation) or get [pre-built](#for-pre-built-files) ones.
2. Copying them all into the `Browser_IDE/splashkit/`

#### For Pre-Built Files
You can find unofficial pre-built files [here](https://github.com/WhyPenguins/SplashkitOnline/tree/github-live/Browser_IDE/splashkit); just download those three files and copy them into `Browser_IDE/splashkit/`, and you're good to go! They're WebAssembly(Wasm) files so they'll run on any OS.

#### For Manual Compilation
Manual compilation is a little more involved.
First you'll need to install Emscripten, which will be used to compile SplashKit to Wasm so it can be used in the browser. The easiest way to do this is via the `emsdk`. Installation instructions are here - [Getting Started](https://emscripten.org/docs/getting_started/downloads.html)

Once you've got Emscripten installed and activated, you can compile the SplashKit Wasm library!
First checkout the unofficial Wasm build repository.
```bash
git clone --recursive https://github.com/WhyPenguins/splashkit-core
```
Currently only cmake builds are supported, so navigate to the cmake project and build it using Emscripten's `emcmake` and `emmake` wrappers. We also need to setup an additional environment variable - this will hopefully not be necessary in the future.
```bash
cd splashkit-core\projects\cmake
SET EMSCRIPTEN=%EMSDK%/upstream/emscripten #or if on linux, the bash equivalent
emcmake cmake -G "Unix Makefiles" .
emmake make
```
If all goes well, you should find the three files inside `out/lib/` - just copy them into `Browser_IDE/splashkit/` and you're done!

## Project Goals and Structure
The goal of the SplashKit Online IDE is to provide a beginner friendly programming environment targeted towards using the SplashKit library. It has REPL like functionality to allow rapid feedback, with emphasis on game related functionality like interactivity, graphics rendering and audio playback. To support this, code execution should definitely happen in the browser (hence compiling SplashKit to run in the browser), and ideally compilation does as well. Currently Javascript is the only language supported (as it is quite easy to execute in a browser), however work on involving other languages is also under way.

## Technology Used
### IDE
The IDE is written as simply as possible, using straight HTML, CSS and Javascript. The code editors use the CodeMirror library (version 5) to provide syntax highlighting and other editing features. It is currently ran by using node for some reason, however as demonstrated by the unofficial demo, any sort of static page server can do the trick (such as `python -m http.server`)

### Code Execution
Currently Javascript is the only language supported in the IDE, and it is currently executed using an `eval` command. There are plans to improve this to run the user's code inside an iFrame to prevent accidentally affecting the IDE itself. 

The SplashKit API has been exposed to the global scope of Javascript, allowing the user to interface with it in much the same way they can in other languages, like C++ and Python. Calls to the SplashKit API are then executed by the SplashKit Wasm module as native code (or as native as it gets in a browser).

### SplashKit Library
The SplashKit library handles all input, graphics, audio and file handling, and is invoked by the user's Javascript. The library has been compiled into a WebAssembly (Wasm) module via Emscripten. This module is loaded into the page as soon as the IDE starts, and the functions in it exported as Javascript functions.

## License

Most of the SplashKit Online IDE is licensed under the GNU General Public License v3.0
Some of it is unlicensed - this code will be either removed shortly (it is no longer unused) or the original authors contacted and properly licensed.
