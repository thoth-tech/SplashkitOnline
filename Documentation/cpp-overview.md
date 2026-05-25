# C++ Implementation Overview in SplashKit Online

## Introduction

This document gives an overview of how Splashkit Online compiles and executes code. It describes how user-written C++ code flows from the browser editor to WebAssembly compilation and execution.

The main purpose is to help new contributors understand how the system integrates C++ capabilities without requiring in-depth compiler knowledge.

## Where C++ Lives in Repository

- **compilers/cxx:**  
Includes the primary logic for applying Clang to compile C++ code to WebAssembly.
- **runtimes/cxx:**
Manages the browser's runtime execution of C++ programmes that have been compiled.
- **SplashKitWasm:**
Contains the WebAssembly build of the SplashKit library used by compiled programs.
- **javascript/compilers/cxxCompiler.js:**
Manages the front-end compilation process.

## Role of CXXCompiler

The **CXXCompiler** class manages the C++ compilation process. Its responsibilities include:

- Writing source files to the virtual filesystem
- Compiling each C++ file into object files
- Linking object files into final WebAssembly output
- Providing syntax checking and error reporting
- Warning users about unsupported API usage

It communicates with a Web Worker to ensure the main interface doesn't freeze during compilation.


## Web Workers and Clang Backend

In a Web Worker, the actual compilation process is carried out using:

- **clang++.wasm**: Compiles C++ source into object files
- **wasm-ld.wasm**: Links object files into a final 

This occurs asynchronously to maintain UI responsiveness.

## Relationship with WebAssembly (WASM)

SplashKit Online can securely run C++ code within the browser thanks to WebAssembly.
The browser's runtime interprets WASM, which is created by the compiler from C++.
This method offers:

- Sandboxing for security
- Compatibility between platforms
- Real-time execution in web environments

## Execution Environment

Runtime environment handles:

- Program start / stop / pause
- File system interactions
- Canvas rendering
- Audio output
- Keyboard and user input

The ExecutionEnvironmentInternalCXX class is in charge of this, coordinating communication between the browser user interface and the compiled programme.

## Error Handling and Output

During error handling, compiler messages are processed and formatted before being displayed to the user. 
This is done to ensure key lines are emphasised and clear terminal feedback is provided through error analysis.