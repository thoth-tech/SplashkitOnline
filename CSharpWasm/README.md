# CSharpWasm

This project enables building and running C# code in the browser using WebAssembly (Wasm).

## Project Structure

- **SplashKitInterop.cs**: This file contains the logic for binding C# code with JavaScript functions, enabling the use of SplashKit functions within the C# environment.

- **CSharpCodeRunner.cs**: A class responsible for compiling C# code, providing the necessary functionality to run the code dynamically.

- **buildAndCopy.sh**: A shell script that builds the project and copies the necessary files into the `Browser_IDE/CSharpWasm` directory. This script helps automate the build process for easy integration with the browser.

### Running the Build and Copy Script

To build the project and copy the necessary files into the `Browser_IDE/CSharpWasm` directory, run the following shell script:

```bash
./buildAndCopy.sh
