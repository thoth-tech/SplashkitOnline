# CSharpWasm Documentation

## Purpose 

CSharpWasm project enables users to execute C# code directly within their browser for SK Online (SKO).
The system relies on .NET 8 WebAssembly and Roslyn to execute user-submitted C# code while providing SplashKit functions through JavaScript interop.

The documentation provides essential information to help contributors understand the system architecture and build process and usage of the system.



## Project Layout  

The following shows the structure of the `CSharpWasm/`

```
CSharpWasm/
├─ Properties/
│  ├─ AssemblyInfo.cs           
│  └─ launchSettings.json      
├─ .gitignore                  
├─ CSharpCodeRunner.cs        
├─ CSharpWasm.csproj           
├─ Program.cs                 
├─ SplashKitBindings.Generated.cs 
├─ buildAndCopy.sh             
└─ runtimeconfig.template.json 
```

| File / Folder                    | Role              | Responsibilities                                                                           |
| -------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `CSharpCodeRunner.cs`            | Compiler & Runner |The `CompileAndRun` function performs  main operations which include loading reference assemblies followed by Roslyn-based C# compilation and then running the `Main()` function when it exists.|
| `SplashKitBindings.Generated.cs` | C# ↔ JS Interop   | The generated file contains `JSImport` bindings which expose SplashKitBackendWASM functions (graphics, audio, input).|
| `Program.cs`                     | Wasm Bootstrap    |The code provides a basic starting point for browser execution.|
| `buildAndCopy.sh`                | Build Script      | Shell script that builds the project and copies DLLs and `_framework` files into `../CSharpWasmExpo/`.|
| `CSharpWasm.csproj`              | Project File      | Targets .NET 8 WebAssembly, includes `Microsoft.CodeAnalysis` (Roslyn).|
| `Properties/AssemblyInfo.cs`     | Assembly Metadata | Marks supported platform as “browser”.|
| `Properties/launchSettings.json` | Launch Config     | Settings for running/debugging locally in browser.|
| `runtimeconfig.template.json`    | Runtime Template  | Template for browser runtime behavior.|
| `bindingGenerator.py`            | Binding Generator | Used to generate the `SplashKitBindings.Generated.cs` file.|

## Prerequisites
Before starting the build process you need to verify that you have:
- The .NET 8 SDK needs to be installed on your system.
- You need to install the WebAssembly tools workload using the command dotnet workload install wasm-tools.
- Your project folder CSharpWasmExpo requires either a local development environment or a hosting solution to function.

## Build and Copy Process
You can create and distribute the artifacts through the following command which needs to be executed from the `CSharpWasm/` directory.

```bash
chmod +x buildAndCopy.sh   # first time only
./buildAndCopy.sh
```
> **Note for Windows users:** The Unix shell script `buildAndCopy.sh` operates under Unix shell systems. The script requires execution from either WSL (Ubuntu on Windows) or Git Bash/MinGW environments. The script fails to execute properly when run from Command Prompt or PowerShell.  
You can execute the script through Git Bash by running `bash buildAndCopy.sh`.

This script is responsible for 
- Building project with `dotnet build`
- Required DLLs will be copied into the `../CSharpWasmExpo/bin/`
- WebAssembly runtime files need to be added to the Expo host at a path which depends on your specific setup.

## Usage in the Browser

You can provide C# code directly to the `CompileAndRun` function. For example:

```csharp
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C#!");
    }
}

```

### Output Expected 

```
Hello from C#!
```

- The program displays its output in the console after compilation completes successfully.
- The compiler returns a list of compilation errors when syntax or build problems occur.
- A program requires a valid entry point which should be static void Main().

## Troubleshooting 
- No entry point: This means program lacks an entry point which should be defined through `static void Main()`.
- Error loading assembly: Then build script requires DLLs to exist in the `../CSharpWasmExpo/bin/` directory for successful execution.
- Check your submitted code lines against the error messages because they show exact locations of the problems.