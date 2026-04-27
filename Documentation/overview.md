
# IDE Architecture & Loading Process Documentation

## Purpose

Explains how each JavaScript file fits into the IDE startup, loading, and runtime process. Shows how the pieces interact to build the editor and initialize the environment. This documentation explains the software architecture of the IDE, helping developers better understand how the system works. This makes it easier to navigate, extend, and debug.

---

## Files Overview

---

## Server Layer

| File | Role | Responsibilities |
|------|------|------------------|
| `server.js` | Server entry point | Starts Express server, serves `index.html` and static assets |
| `setup.js` | Dependency bootstrapper | Ensures backend dependencies and WASM assets are available |
| `setup.py` | Python setup helper | Supports build/setup automation for tooling |
| `package.json` | Node project definition | Defines dependencies and scripts |
| `package-lock.json` | Dependency lockfile | Ensures consistent installs |
| `node_modules/` | Dependency ecosystem | Contains installed Node.js packages used by the server |

---

## Startup & Orchestration Layer

| File | Role | Responsibilities |
|------|------|------------------|
| `javascript/startup/IDEStartupMain.js` | IDE bootstrapper | Coordinates full IDE initialization flow |
| `javascript/startup/projectInitializer.js` | Project loader | Loads or creates initial workspace/project |
| `javascript/startup/projectLoadUI.js` | Project selection UI | Handles demo/project selection interface |
| `javascript/startup/splashKitOnlineEnvParams.js` | Runtime config | Sets environment parameters for IDE runtime |
| `javascript/middleware/actionQueue.js` | Task scheduler | Manages ordered async initialization tasks |
| `javascript/middleware/downloadHandler.js` | Asset downloader | Handles downloading and extracting project/assets |
| `javascript/communication/communication.js` | Messaging layer | Handles inter-module messaging system |
| `javascript/languages/languageDefinitions.js` | Language registry | Defines supported languages and configuration |
| `compilers/compiler.js` | Compiler coordinator | Central registry and dispatch for language compilers |

---

## Compiler System

| File | Role | Responsibilities |
|------|------|------------------|
| `compilers/compiler.js` | Compiler controller | Registers and manages all language compilers |
| `compilers/javascript/javascriptCompiler.js` | JavaScript compiler | Executes JavaScript code in browser runtime |
| `compilers/cxx/cxxCompiler.js` | C++ compiler frontend | Interfaces with WASM/Clang backend |
| `compilers/cxx/cxxCompilerClangBackend.js` | WASM backend bridge | Connects compiler to Clang WebAssembly toolchain |
| `compilers/cxx/cxxCompilerClangWebWorker.js` | Background compiler worker | Runs C++ compilation in separate thread |
| `compilers/javascript/executionEnvironmentCodeProcessor.js` | Code transformer | Transforms JavaScript code for execution environment |
| `compilers/csharp/csharpCompiler.js` | C# compiler | Handles C# compilation via WASM runtime |

---

## Execution Environment System

| File | Role | Responsibilities |
|------|------|------------------|
| `javascript/executionEnvironment/executionEnvironment.js` | Execution controller | Manages sandbox/iframe execution lifecycle |
| `javascript/executionEnvironment/executionEnvironment_Page.js` | Output renderer | Displays runtime output, logs, and errors |
| `compilers/javascript/executionEnvironmentInternal.js` | Execution bridge engine | Executes transformed JavaScript within controlled runtime context |
| `moduleEventTarget.js` | Event system | Central pub/sub event dispatcher |
| `loadsplashkit.js` | WASM bootstrapper | Loads SplashKit WebAssembly runtime |
| `fsevents.js` | FS event dispatcher | Syncs file system events with UI and runtime systems |

---

## Runtime Systems

| File | Role | Responsibilities |
|------|------|------------------|
| `runtimes/ExecutionEnvironmentInternal.js` | Core runtime engine | Manages execution lifecycle (run, stop, reset) |
| `runtimes/ExecutionEnvironmentInternalLoader.js` | Runtime loader | Loads and initializes execution runtime |
| `runtimes/cxx/cxxRuntime.js` | C++ runtime | Executes compiled WebAssembly C++ output |
| `runtimes/csharp/csharpRuntime.js` | C# runtime | Executes compiled C# programs via WASM |
| `runtimes/javascript/` | JavaScript runtime | Executes JavaScript programs in browser environment |

---

## Storage & Filesystem Layer

| File | Role | Responsibilities |
|------|------|------------------|
| `javascript/storage/appStorage/` | App storage | IndexedDB-based persistent storage system |
| `javascript/storage/unifiedfs.js` | Virtual filesystem | Unifies persistent storage and runtime filesystem |
| `javascript/storage/fileview.js` | File UI sync | Synchronizes filesystem with file explorer UI |
| `javascript/storage/fsevents.js` | FS event system | Emits file system change events for UI/runtime sync |

---

## UI Layer

| File | Role | Responsibilities |
|------|------|------------------|
| `javascript/UI/editorMain.js` | Editor controller | Manages CodeMirror editor instance and editing lifecycle |
| `javascript/UI/treeview.js` | File explorer | Displays and manages project file hierarchy |
| `javascript/UI/modal.js` | Modal system | Handles dialogs, popups, and confirmations |
| `javascript/UI/notifications.js` | Notification system | Displays IDE alerts and messages |
| `javascript/UI/themes.js` | Theme manager | Applies and switches UI themes |
| `javascript/UI/HTMLBuilderUtil.js` | DOM utilities | Helper functions for UI construction |
| `javascript/layout/layout.js` | Layout engine | Controls panel layout, resizing, and IDE structure |

---

## Service Worker Layer

| File | Role | Responsibilities |
|------|------|------------------|
| `SKOservice-worker.js` | Service worker | Handles caching, offline support, and request interception |

---

## External Runtime / WASM Systems

| Folder/File | Role | Responsibilities |
|-------------|------|------------------|
| `SplashKitWasm/` | WASM engine | Builds and compiles SplashKit C++ WebAssembly runtime |
| `CSharpWasm/` | C# WASM bridge | Compiles and binds C# code to WebAssembly runtime |
| `CSharpWasmExpo/` | WASM output runtime | Hosts compiled C# runtime artifacts |
| `assets/` | Static assets | Images, icons, logos, and static resources |
| `DemoProjects/` | Sample projects | Prebuilt example projects and metadata for demos |

---
## Loading & Initialization Flow

---

### Server Side

server.js  
↳ setup.js  
↳ node_modules (dependency ecosystem injected at runtime via npm install)  
↳ Node.js module resolution system  
   ↳ injects dependencies using require() at runtime  
   ↳ resolves Express, middleware, build tools, and setup utilities  

↳ Static folder injection  
   ↳ assets/ (images, icons, UI resources)  
   ↳ DemoProjects/ (prebuilt project templates)  
   ↳ SplashKitWasm/ (WASM runtime and build artifacts served to client)  

---

### Client Side

index.html  
↳ Client entry point (triggers full IDE initialization sequence)

&emsp;↳ Header  
&emsp;&emsp;↳ Loads client-side external packages  
&emsp;&emsp;&emsp;↳ CodeMirror assets (browser code editor)  
&emsp;&emsp;&emsp;↳ Bootstrap  
&emsp;&emsp;&emsp;↳ JSZip  

&emsp;&emsp;↳ Loads stylesheets  
&emsp;&emsp;&emsp;↳ baseTheme.css  
&emsp;&emsp;&emsp;↳ colours.css  
&emsp;&emsp;&emsp;↳ stylesheet.css  
&emsp;&emsp;&emsp;↳ (Includes Bootstrap & CodeMirror styles)  

&emsp;&emsp;↳ splashkit-javascript-hint.js  

---

&emsp;↳ Footer (Initialization Pipeline Order)

&emsp;&emsp;1. Environment Configuration  
&emsp;&emsp;&emsp;↳ splashKitOnlineEnvParams.js  

&emsp;&emsp;2. Asset + Runtime Download System  
&emsp;&emsp;&emsp;↳ downloadHandler.js  

&emsp;&emsp;3. Compiler System Initialization  
&emsp;&emsp;&emsp;↳ compiler.js  
&emsp;&emsp;&emsp;↳ languageDefinitions.js  

&emsp;&emsp;&emsp;&emsp;↳ moduleEventTarget.js  
&emsp;&emsp;&emsp;&emsp;↳ loadsplashkit.js  
&emsp;&emsp;&emsp;&emsp;↳ fsevents.js  
&emsp;&emsp;&emsp;&emsp;↳ executionEnvironmentCodeProcessor.js  
&emsp;&emsp;&emsp;&emsp;↳ executionEnvironmentInternal.js  

&emsp;&emsp;4. UI + DOM Utilities  
&emsp;&emsp;&emsp;↳ HTMLBuilderUtil.js  

&emsp;&emsp;5. Execution Environment Setup  
&emsp;&emsp;&emsp;↳ executionEnvironment.js  
&emsp;&emsp;&emsp;&emsp;↳ executionEnvironment.html  
&emsp;&emsp;&emsp;&emsp;&emsp;↳ executionEnvironment_Page.js  
&emsp;&emsp;&emsp;&emsp;&emsp;↳ ExecutionEnvironmentInternalLoader.js  
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;↳ SKOservice-worker.js  

&emsp;&emsp;6. Storage & Filesystem Layer  
&emsp;&emsp;&emsp;↳ AppStorage.js  
&emsp;&emsp;&emsp;↳ IDBStoredProject.js  
&emsp;&emsp;&emsp;↳ unifiedfs.js  
&emsp;&emsp;&emsp;↳ projectInitializer.js  

&emsp;&emsp;7. UI Layer Initialization  
&emsp;&emsp;&emsp;↳ modal.js  
&emsp;&emsp;&emsp;↳ notifications.js  
&emsp;&emsp;&emsp;↳ treeview.js  

&emsp;&emsp;8. Editor + IDE Interface  
&emsp;&emsp;&emsp;↳ editorMain.js  
&emsp;&emsp;&emsp;↳ fileview.js  
&emsp;&emsp;&emsp;↳ projectLoadUI.js  
&emsp;&emsp;&emsp;↳ actionQueue.js  
&emsp;&emsp;&emsp;↳ IDEStartupMain.js  
&emsp;&emsp;&emsp;↳ themes.js  


---
## Server Side Component Interactions

### Server.js
- Includes required libraries and demo project assets.
- Serves the `index.html` content to clients on port 8000, acting as the entry point for the IDE web app.
- **Triggers `setup.js`** at server startup to ensure all backend dependencies are available before the client IDE loads.

### Setup.js
- Checks for required pre-built dependency files in the local environment.
- Downloads missing dependencies such as:
  - `splashkit_autocomplete.json`
  - `SplashKitBackendWASM.js` 
  - `SplashKitBackendWASM.wasm` 
  - `compiler.zip`
  - `wasi-sysroot.zip` 
  - `SplashKitBackendWASMCPP.js` 
  - `SplashKitBackendWASMCPP.worker.js` 
---

## Client Side Component Interactions

### splashKitOnlineEnvParams.js
- Loads environment parameters at runtime, either from defaults or URL query parameters.
- Used throughout the IDE to alter behavior.
- Included env parameters include:
  - `language` (e.g., `javascript`, `cpp`)
  - `useCompressedBinaries` - boolean (`on`/`off`)
  - `useMinifiedInterface` - boolean (`on`/`off`)
  - `isPRPreview` - boolean; **do not modify manually**. Used to enable development mode on peer-review deployments (e.g., GitHub PR preview builds).

### downloadHandler.js
- Manages dynamic file downloading, adapting to environment flags like `isPRPreview` and `useCompressedBinaries` from `splashKitOnlineEnvParams.js`.
- If `isPRPreview` is enabled, reroutes asset URLs using `PRPathMap.json` to ensure correct pathing for GitHub PR deployments. Automatically patches all redirect entries based on the current subdirectory path.
- The main download function supports both compressed and uncompressed assets, using LZMA decompression if `useCompressedBinaries` is enabled.
- Uses XMLHttpRequests wrapped in promises, with optional progress callbacks to support loading UIs.
- Defines `DownloadSet` class that tracks the progress of multiple concurrent downloads and reports progress.

### actionQueue.js
- Implements `ActionQueue`, the system behind all task scheduling and dependency management in the IDE (can be viewed in `IDEStartupMain.js` to understand how its used).
- Allows for (`waitOn`), cancellations (`cancelOn`), and ('synchronousWith').
- Includes test utilities and full control over task execution flow via `Schedule()` and `Consume()`.

### communication.js
- Central messaging layer between IDE modules
- Used for sending events between compiler, execution environment, and UI
- Enables decoupled communication instead of direct imports

### IDEStartupMain.js
- Controls the startup process for the entire IDE using a sequence of `ActionQueue` instances.
- Queues like `IDECoreInitQueue`, `CompilerInitQueue`, `ExecutionEnvironmentLoadQueue`, and others run in order or in parallel.
- Handles initialization of the UI, compiler, project storage, and sandbox.
- Defines `StartIDE()` as the main startup entrypoint.

### projectInitializer.js
- Creates the default folder and file structure for new projects.
- Provides `makeNewProject_JavaScript`, `makeNewProject_CXX`, and `initializeFromFileList` to create defaults projects.
- Also sets up required `/Resources` directories and example main/game loop code.
- Used by `IDBStoredProject.js` when initializing a new project IndexedDB.

### projectLoadUI.js
- Builds the UI for loading demo projects in a modal-style grid.
- Uses `getChoices()` to fetch metadata and displays project thumbnails with necessary metadata.
- Includes error fallback if demo metadata fails to load.



### languageDefinitions.js
- Defines the supported languages in the IDE, including metadata and setup instructions for compilers and runtimes.
- Each language definition includes:
  - A `name`, human-readable `userVisibleName`, and multiple `aliases` (e.g., `'JS'`, `'CXX'`)
  - File extension support (e.g., `.js`, `.cpp`) for both editing and compiling
  - One or more `setups`, which define:
    - Files to load into the runtime (`runtimeFiles`)
    - WASM or other binary dependencies (`runtimeDependencies`)
    - One or more `compilerFiles` to dynamically inject
    - Estimated size of assets (`runtimeSizeAprox`, `compilerSizeAprox`)
    - Environment flags like `needsSandbox`, `compiled`, or `supportHotReloading`
    - Default project setup function (`getDefaultProject`)
- Used by components like `compiler.js` to determine which files to load and which actions to perform based on the selected language.
- Builds `SplashKitOnlineLanguageAliasMap`, allowing any component to retrieve full language definitions using either the language name or any alias.

### compiler.js
- Manages compiler registration, initialization, and usage across supported languages.
- Provides a base `Compiler` class that defines the interface for compilation, syntax checking, and readiness signaling.
- Tracks available compilers via a shared registry (`registeredCompilers`) and uses events to trigger when compilers are readythrough `registeredCompilersEvents`.
- `initializeLanguageCompilerFiles()` dynamically injects script tags into the document for the selected language, based on metadata defined in `languageDefinitions.js`. This allows compilers to be loaded only when needed.
- Other components can retrieve compilers using `getCompiler(name)` and listen for readiness via the compiler event system.

### executionEnvironmentCodeProcessor.js
- Preprocesses user-written code to make it safe for async execution in a single-threaded browser context using `asyncifyTransform` & `makeFunctionsAsyncAwaitTransform`.
- Rewrites all global variables, classes, and functions to attach to `window` for better cleanup/reset.
- Auto-awaits all user defined functions and class instantiations .
- Registers Babel plugins: `asyncify`, `makeFunctionsAsyncAwaitTransform`, and `findGlobalDeclarationsTransform`.
- Used by `processCodeForExecutionEnvironment()` to prepare code for sandboxed execution.

#### Deeper look into executionEnvironmentCodeProcessor
Credits to the developers of splashkit online for documenting this function deeply. This comes directly from the JavaScript file but is added here for clarity on the functionality as it provides an excellent overview.
- In order to run the code the user writes well, there are two main challenges.
    1. We want the user to be able to run loops - for example the 'main' loop.
        However, Javascript executed in the same thread as the browser's interface,
        meaning that a long running while loop will simply freeze the page. A 'main'
        loop, like in a game, will only render the last frame once the script is terminated.

        To handle this, we use Javascripts async/await syntax, and modify the user's code as follows:
       - All loops automatically await a timeout of 0 seconds after executing for more than ~25ms.
       - screen_refresh (and other similar functions) await a window.requestAnimationFrame
       - All user functions are marked as async, so that they can use await.
       - Similarly, all calls to user functions are marked with await.
       - Constructors cannot be async, so rename all constructors of user classes to `__constructor`,
        
        and call it when user classes are newed. `let player = new Player()` becomes `let player = (new Player()).__constructor()`
        This same setup is used to enable code pausing, and stopping, by simply listening for pausing/stopping/continuing
        around when it does the awaits. To stop, we simple throw a 'ForceBreakLoop' error. To continue, pause, we create
        a promise and await it. To continue, we call that promise.
    2. We want the user to be able to declare global variables, however we also want to enable Strict Mode, and additionally want a way to remove them all when the program is reset.

    We handle this as follows:
    - In an initial step, we identify and record all global variables into findGlobalDeclarationsTransform__userScope
    - Next, we modify all declarations (variables, classes, functions) in the global scope, to directly set `window`.
    For example `let a = 10;` becomes `window.a = 10;`. `function func(){}` becomes `window.func = function func(){}`.
    To reset the globals, we just delete all the variables in findGlobalDeclarationsTransform__userScope (`delete window[globalVar];`)


### moduleEventTarget.js
- Thin wrapper around a single shared EventTarget instance (moduleEvents).

### loadsplashkit.js
- Dynamically loads and initializes the SplashKit WebAssembly runtime into the IDE.
- Defines a global Module object with definitions for `onRuntimeInitialized`, `print`, `preRun`, `canvas`, and `totalDependencies`.
- Dispatches events like `onRuntimeInitialized` via `moduleEvents` and output via a custom "print" event which intends to write to terminal in `executionEnvironment_Page.js`.
- Handles download and injection of the .wasm and .js runtime binaries using `DownloadSet` into the document.
- Allows access to the canvas in the DOM via `Module` allowing an object-oriented approach.

### fsevents.js
- Acts as a wrapper around `EventTarget` to listen for file system (FS) events.
- Sets up handlers on `FS.trackingDelegate` to emit events like before specified FS functions run
- `TestFSEvents` function created in order to test each case


### ExecutionEnvironmentInternal.js
- Manages execution control, reset logic, and exception handling for the user's code.
- Provides `runProgram()`, `stopProgram()`, and `pauseProgram()` for runtime control.
- Cleans global scope and memory between runs using `ResetExecutionScope()`.
- Parses stack traces to map error lines back to user code for accurate error reporting with `parseErrorStack`.
- Attaches to FS events using `FSEvents` to report back file system changes.
- Dispatches execution state (started, stopped, paused) to the parent page.       

### executionEnvironment.js
- Implements `ExecutionEnvironment`, encompasses all environment functionality at a higher level.
- Launches an isolated iframe (`executionEnvironment.html`) to run user code, based on the selected language's metadata in `languageDefinitions.js`.
- Handles two-way messaging between the IDE and the iframe using `PromiseChannel`, allowing components to:
  - Start, pause, continue, stop, or hotReload the user program
  - Send runtime commands (e.g., initialize filesystem, report errors, write to terminal)
  - Handle and dispatch events like `programStarted`, `onDownloadFail`, and `onCriticalInitializationFail`
- Maintains internal status tracking using `ExecutionStatus`.
- Creates control functions to wrap post messages in order to have a cleaner object oriented method of executing common functions with events set up.
- Loads `executionEnvironment.html` into the iframe

### executionEnvironment_Page.js
- Handles terminal output rendering and formatting using DOM manipulation.
- Supports escape codes for colored output and terminal emulation.
- Displays runtime errors and stack traces.
- Provides `ReportError()` for printing error messaging to the terminal.
- Registers event listeners for output messages and error reporting.
- Implements basic loading UI: progress bar, failure message, and visibility toggles.


### executionEnvironmentInternalLoader.js
- Loads language-specific runtime JS files dynamically using `<script>` tags.
- Tracks download progress via a manual progress reporting system.
- Registers a Service Worker (if required) to handle program input events (mouse/keyboard).
- Emits `languageLoaderReady` message to signal completion of setup.

### SKOservice-worker.js
- Acts as an event relay for input between user code and main page in order to allow for program events to be triggered.
- Queues and returns input commands (like key presses) via `/programEvents.js` endpoint.
- Clears events when instructed via `clearEvents` message.


### AppStorage.js
- When working with the filesystem, `unifiedfs.js` should be used instead of directly using `AppStorage.js` to ensure consistency between transient and persistent storage.
- Handles saving and loading app-level data using IndexedDB. This includes things like project names and which project was last opened.
- The `AppStorage` class manages attach/detach events and gives other modules access to the storage through its `access()` method.
- Uses a helper class (`__AppStorageRW`) to do all the actual reads/writes with IndexedDB.
- Can store and retrieve:
  - Last open project
  - Last write timestamp
  - Project data by ID or name
- Can create, rename, or delete saved projects.
- Automatically avoids name conflicts with `getAutoName()`.
- Emits `attached`, `detached`, and `connectionFailed` events so other parts of the IDE know when storage is ready or not.
- Used at startup to check or load saved project data by `IDEStartupMain.js` in a function from `IDBStoredProject.js`


### IDBStoredProject.js
- When using the filesystem make sure to use `unifiedfs.js` instead of `IDBStoredProject` to ensure transient and persistent filesystems stay in sync
- Manages the local file system and metadata for a single project using IndexedDB.
- `IDBStoredProject` handles high-level project operations like attaching, detaching, and checking for write conflicts by taking advantage of `AppStorage.js`.
  - Automatically restores the last opened project if no ID is provided.
  - Creates a new project if one does not exist.
- Uses `__IDBStoredProjectRW` as an internal class to handle low-level DB access and file operations.
  - Supports project-wide file system methods like `mkdir`, `writeFile`, `readFile`, `rename`, `unlink`, and `rmdir`.
  - Provides helpers for listing files (`getFileTree`, `getFlatFileList`, `getAllFilesRaw`).
- Triggered during IDE startup via `InitializeProjectQueue` in `IDEStartupMain.js` to restore or create the user’s project.

### unifiedfs.js
- Manages file operations across both the persistent (`IDBStoredProject`) and transient (`ExecutionEnvironment`) file systems so both file systems remain synced.
- The `UnifiedFS` class exposes methods like `mkdir`, `writeFile`, `rename`, `unlink`, and `rmdir` that apply to both file systems at the same time.
- Implements some logic to keep both file systems in sync in case of failure by reverting changes.

### HTMLBuilderUtil.js
- Provides helper functions for dynamically creating and manipulating HTML elements.
- Commonly used by UI-related components to construct DOM elements without manual DOM code duplication.
- Includes:
  - `elem(tag, attrs, children)`: Creates an HTML element with attributes and child elements, including support for inline style objects.
  - `elemFromText(text)`: Parses an HTML string into DOM nodes using `DOMParser`.
  - `removeFadeOut(el, speed)`: Applies a fade-out transition to an element and removes it from the DOM after the animation completes.
- Used across various UI modules for building modals, notifications, or custom interface elements at runtime.

### modal.js
- Builds Bootstrap-based modals dynamically with customizable buttons and content.
- The `createModal()` function adds modals to the DOM and returns a usable Bootstrap modal instance.
- Encapsulates all modal-related logic to keep UI code modular and replaceable. (only one modal in one file that can be used for multiple usecases)
- Used by confirmation dialogs and error prompts in the IDE. (can be viewed in `editorMain.js`)

### notifications.js
- Displays pop-up editor notifications with support for icons, auto-dismiss timers, and click callbacks.
- Built with plain DOM manipulation in the div containing the class `sk-notification-area`.
- The `displayEditorNotification()` function creates and returns a notification DOM element.
- Used to alert users of errors, actions, or state changes within the IDE.
- Possible notification icons include: CONSTRUCTION, CRITICAL_ERROR, ERROR, WARNING, SUCCESS, INFO, NONE.
- This shows the types of usecases notifications are usually used for

### treeview.js
- Handles the visual file explorer panel in the IDE.
- Reacts to file system events to update the tree in real-time.
- Supports file/folder creation, deletion, renaming, moving, and uploads through UI events.

### fileview.js
- Manages the interactive file panel UI using `TreeView.js`.
- Routes user actions (create, rename, delete, upload) through `UnifiedFS` depending on file type (persistent/transient).
- Listens for FS events (eg. `onOpenFile`, `onDeletePath`, etc.) to keep the file panel in sync.
- Populates files on attach and clears on detach.

### editorMain.js
- Builds the tabbed editor UI using CodeMirror for syntax highlighting and autocomplete.
- Manages multiple file tabs with support for open, close, rename, and autosave.
- Integrates with `storedProject` and `executionEnviroment` for saving/loading.
- Syncs file changes across the persistent and transient filesystems via `unifiedFS`.
- Shows error lines based on compiler/runtime feedback.
- Runs syntax checks or hot reloads individual files with `runOne()`.
- Runs full project via `runProgram()`, `pauseProgram()`, etc., with notification support.
- Automatically mirrors files into the sandboxed iframe environment.
- Offers import/export via ZIP.
- Handles language switching via URL param and UI selector.
- Sets up minified interface mode and gutter resizing.
- Registers all editor buttons and their event handlers (run, pause, restart, etc.).
- Monitors for write conflicts from other tabs and prompts reload to resolve.
- Is the main high level controller for the IDE that interacts with most the other files.


### layout.js
- Controls IDE panel layout structure
- Manages resizing and UI panel organization
- Initialized early during UI setup phase


### themes.js
- Defines multiple color themes as JSON objects that map to CSS variable values.
- Applies themes dynamically by setting CSS variables on `document.documentElement.style`.
- Provides a global `applyTheme()` function that can be run from the browser console.
- Populates a `<select id="themeSelection">` dropdown with all available themes on `DOMContentLoaded`.
- Resets to default theme when no theme is selected.
- Meant to override visual properties like background, comment color, and keyword color.
- Intended for flexible customization without changing CSS files directly.
- Should be applied after DOM/UI initialization (layout.js + editorMain.js) to ensure all theme-targeted elements exist before CSS variables are applied

---

