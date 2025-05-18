
# IDE Architecture & Loading Process Documentation

## Purpose

Explains how each JavaScript file fits into the IDE startup, loading, and runtime process. Shows how the pieces interact to build the editor and initialize the environment. This documentation aims to explain the softwares architecture so that it can be understood better making the system easier to navigate, extend, and debug


## Files Overview

| File                                    | Role                               | Responsibilities                                                                                                            |
|-----------------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `server.js`                             | Server entry point                 | Serves `index.html` and assets on port 8000; starts the web server                                                          |
| `setup.js`                              | Dependency manager                 | Checks for and downloads missing backend WASM and JSON dependencies                                                         |
| `splashKitOnlineEnvParams.js`           | Runtime config initializer         | Sets global runtime environment variables and IDE parameters                                                                |
| `downloadHandler.js`                    | File download utility              | Handles user-initiated project/file downloads                                                                               |
| `compiler.js`                           | Compiler controller class          | Creates compiler class to initialize, register and track compilers                                                          |
| `languageDefinitions.js`                | Language metadata                  | Provides metadata for supported programming languages                                                                       |
| `moduleEventTarget.js`                  | EventTarget wrapper                | Wraps a global `EventTarget`                                                                                                |
| `loadSplashKit.js`                      | WASM runtime bootstrapper          | Loads SplashKit backend binaries, sets up `Module`, dispatches runtime and output events                                    |
| `fsevents.js`                           | FS event dispatcher                | Wraps `EventTarget` to emit file operation events from Emscripten’s virtual FS (read, write, etc.)                          |
| `executionEnvironment_CodeProcessor.js` | Code transformer & runtime patcher | Makes user code async-safe and pausable using Babel transforms.                                                             |
| `executionEnvironment_Internal.js`      | Sandbox execution controller       | Runs, pauses, resets, and manages user programs inside the iframe sandbox.                                                  |
| `HTMLBuilderUtil.js`                    | HTML utility functions             | Generates or modifies HTML snippets dynamically                                                                             |
| `executionEnvironment.js`               | Sandbox runtime controller         | Manages iframe-based execution environment for running user code                                                            |
| `executionEnvironment_Page.js`          | Terminal & UI Output Handler       | Renders output in the IDE terminal, formats escape sequences, displays errors, manages canvas-terminal layout               |
| `ExecutionEnvironmentInternalLoader.js` | Runtime Bootstrap Loader           | Loads language runtime scripts, registers service worker, tracks init progress, and sends ready state to parent window      |
| `SKOservice-worker.js`                  | Program event relay worker         | Acts as a service worker queue for program input events like keyboard/mouse.                                                |
| `AppStorage.js`                         | Local storage interface            | Provides direct access to browser storage APIs                                                                              |
| `IDBStoredProject.js`                   | IndexedDB file storage             | Handles saving/loading of project files using IndexedDB                                                                     |
| `unifiedfs.js`                          | Virtual filesystem bridge          | Unifies memory-based and persistent file storage into one virtual FS                                                        |
| `projectInitializer.js`                 | Project loader/initializer         | Loads files into editor, sets up project state                                                                              |
| `modal.js`                              | Modal controller                   | Manages modal windows for alerts, file dialogs, etc.                                                                        |
| `notifications.js`                      | Notification system                | Displays notifications in designated notification area for inline IDE alerts and error messages                             |
| `treeview.js`                           | File tree UI manager               | Renders the sidebar file explorer and handles file selection                                                                |
| `fallibleMessage.js`                    | Error messaging wrapper            | Wraps async operations with user-facing error messaging                                                                     |
| `editorMain.js`                         | Code editor integrator             | Boots up and configures the CodeMirror editor instance and acts as a high level class                                       |
| `fileview.js`                           | File panel UI manager              | Uses `TreeView` to create the interactivity of the file panel UI                                                            |
| `projectLoadUI.js`                      | Project UI feedback handler        | Shows UI for loading demo projects and provides indicators or errors during project load                                    |
| `actionQueue.js`                        | Action sequencing engine           | Manages async task execution, ordering, cancellation, and dependency in the form of a queue                                 |
| `IDEStartupMain.js`                     | IDE bootstrap coordinator          | Central script that initializes components and kicks off IDE startup sequence                                               |
| `themes.js`                             | Theme manager                      | Defines and applies color themes by modifying CSS variables; updates UI via dropdown                                        |

---
## Loading & Initialization Flow

### Server Side

server.js  
↳ setup.js  

---
### Client Side

index.html  
&emsp;↳ Header  
&emsp;&emsp;↳ Loads client-side external packages  
&emsp;&emsp;&emsp;↳ Codemirror assets (browser code editor)  
&emsp;&emsp;&emsp;↳ Bootstrap  
&emsp;&emsp;&emsp;↳ Jzip  
&emsp;&emsp;↳ Loads stylesheets  
&emsp;&emsp;&emsp;↳ baseTheme.css  
&emsp;&emsp;&emsp;↳ colours.css  
&emsp;&emsp;&emsp;↳ stylesheet.css  
&emsp;&emsp;&emsp;↳ (Includes bootstrap & codemirror styles)  
&emsp;&emsp;↳ splashkit-javascript-hint.js  

&emsp;↳ Footer  
&emsp;&emsp;↳ splashKitOnlineEnvParams.js  
&emsp;&emsp;↳ downloadHandler.js  
&emsp;&emsp;↳ compiler.js  
&emsp;&emsp;↳ languageDefinitions.js  
&emsp;&emsp;&emsp;↳ moduleEventTarget.js  
&emsp;&emsp;&emsp;↳ loadsplashkit.js  
&emsp;&emsp;&emsp;↳ fsevents.js  
&emsp;&emsp;&emsp;↳ executionEnvironment_CodeProcessor.js  
&emsp;&emsp;&emsp;↳ executionEnvironment_Internal.js  
&emsp;&emsp;↳ HTMLBuilderUtil.js  
&emsp;&emsp;↳ executionEnvironment.js  
&emsp;&emsp;&emsp;↳ executionEnvironment.html  
&emsp;&emsp;&emsp;&emsp;↳ executionEnvironment_Page.js  
&emsp;&emsp;&emsp;&emsp;↳ ExecutionEnvironmentInternalLoader.js  
&emsp;&emsp;&emsp;&emsp;&emsp;↳ SKOservice-worker.js  
&emsp;&emsp;↳ AppStorage.js  
&emsp;&emsp;↳ IDBStoredProject.js  
&emsp;&emsp;↳ unifiedfs.js  
&emsp;&emsp;↳ projectInitializer.js  
&emsp;&emsp;↳ modal.js  
&emsp;&emsp;↳ notifications.js  
&emsp;&emsp;↳ treeview.js  
&emsp;&emsp;↳ fallibleMessage.js  
&emsp;&emsp;↳ editorMain.js  
&emsp;&emsp;↳ fileview.js  
&emsp;&emsp;↳ projectLoadUI.js  
&emsp;&emsp;↳ actionQueue.js  
&emsp;&emsp;↳ IDEStartupMain.js  
&emsp;&emsp;↳ themes.js  

---
## Server Side Component Interactions

### Server.js
- Includes necessary libraries and demo project files.
- Serves the `index.html` content to clients on port 8000, acting as the entry point for the IDE web app.
- **Triggers `setup.js`** at server startup to ensure all backend dependencies are available before the client IDE loads.

### Setup.js
- Checks for required pre-built dependency files locally.
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
- The main download function supports both compressed and uncompressed assets, using LZMA decompression if `useCompressedBinaries` is enabled .
- Uses XMLHttpRequests wrapped in promises, with optional progress callbacks to support loading UIs.
- Defines `DownloadSet` class that tracks the progress of multiple concurrent downloads and reports progress.

### compiler.js
- Manages compiler registration, initialization, and usage across supported languages.
- Provides a base `Compiler` class that defines the interface for compilation, syntax checking, and readiness signaling.
- Tracks available compilers via a shared registry (`registeredCompilers`) and uses events to trigger when compilers are readythrough `registeredCompilersEvents`.
- `initializeLanguageCompilerFiles()` dynamically injects script tags into the document for the selected language, based on metadata defined in `languageDefinitions.js`. This allows compilers to be loaded only when needed.
- Other components can retrieve compilers using `getCompiler(name)` and listen for readiness via the compiler event system.


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
- Used by files like `compiler.js` to determine which files and actions to do based on the selected language.
- Builds `SplashKitOnlineLanguageAliasMap`, allowing any component to retrieve full language definitions using either the language name or any alias.

### moduleEventTarget.js
- Thin wrapper around a single shared EventTarget instance (moduleEvents).

### loadsplashkit.js
- Dynamically loads and initializes the SplashKit WebAssembly runtime into the IDE.
- Defines a global Module object with definitions for `onRuntimeInitialized`, `print`, `preRun`, `canvas`, and `totalDependencies`.
- Dispatches events like `onRuntimeInitialized` via `moduleEvents` and output via a custom "print" event which intends to write to terminal in `executionEnvironment_Page.js`.
- Handles download and injection of the .wasm and .js runtime binaries using `DownloadSet` into the document.
- Allows access to the canvas in the DOM via `Module` allowing a Object Oriented approach.

### fsevents.js
- Acts as a wrapper around `EventTarget` to listen for file system (FS) events.
- Sets up handlers on `FS.trackingDelegate` to emit events like before specified FS functions run
- `TestFSEvents` function created in order to test each case

### executionEnvironment_CodeProcessor.js
- Preprocesses user-written code to make it safe for async execution in a single-threaded browser context using `asyncifyTransform` & `makeFunctionsAsyncAwaitTransform`.
- Rewrites all global variables, classes, and functions to attach to `window` for better cleanup/reset.
- Auto-awaits all user defined functions and class instantiations .
- Registers Babel plugins: `asyncify`, `makeFunctionsAsyncAwaitTransform`, and `findGlobalDeclarationsTransform`.
- Used by `processCodeForExecutionEnvironment()` to prepare code for sandboxed execution.
#### Deeper look into executionEnvironment_CodeProcessor
Credits to the developers of splashkit online for documenting this function deeply. This comes from the JS file direcly but is added here for clarity on the functionality as it provides an excellent overview.
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

### executionEnvironment_Internal.js
- Manages execution control, reset logic, and exception handling for the users code.
- Provides `runProgram()`, `stopProgram()`, and `pauseProgram()` for runtime control.
- Cleans global scope and memory between runs using `ResetExecutionScope()`.
- Parses stack traces to map error lines back to user code for accurate error reporting with `parseErrorStack`.
- Attaches to FS events using `FSEvents` to report back file system changes.
- Dispatches execution state (started, stopped, paused) to the parent page.

### HTMLBuilderUtil.js
- Provides helper functions for dynamically creating and manipulating HTML elements.
- Commonly used by UI-related components to construct DOM elements without manual DOM code duplication.
- Includes:
  - `elem(tag, attrs, children)`: Creates an HTML element with attributes and child elements, including support for inline style objects.
  - `elemFromText(text)`: Parses an HTML string into DOM nodes using `DOMParser`.
  - `removeFadeOut(el, speed)`: Applies a fade-out transition to an element and removes it from the DOM after the animation completes.
- Used across various UI modules for building modals, notifications, or custom interface elements at runtime.


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

### ExecutionEnvironmentInternalLoader.js
- Loads language-specific runtime JS files dynamically using `<script>` tags.
- Tracks download progress via a manual progress reporting system.
- Registers a Service Worker (if required) to handle program input events (mouse/keyboard).
- Emits `languageLoaderReady` message to signal completion of setup.

### SKOservice-worker.js
- Acts as an event relay for input between user code and main page in order to allow for program events to be triggered.
- Queues and returns input commands (like key presses) via `/programEvents.js` endpoint.
- Clears events when instructed via `clearEvents` message.

### AppStorage.js
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
- Manages the local file system and metadata for a single project using IndexedDB.
- `IDBStoredProject` handles high-level project operations like attaching, detaching, and checking for write conflicts by taking advantage of `AppStorage.js`.
  - Automatically restores the last opened project if no ID is provided.
  - Creates a new project if one doesn’t exist.
- Uses `__IDBStoredProjectRW` as an internal class to handle low-level DB access and file operations.
  - Supports project-wide file system methods like `mkdir`, `writeFile`, `readFile`, `rename`, `unlink`, and `rmdir`.
  - Provides helpers for listing files (`getFileTree`, `getFlatFileList`, `getAllFilesRaw`).
- Triggered during IDE startup via `InitializeProjectQueue` in `IDEStartupMain.js` to restore or create the user’s project.

### unifiedfs.js
- Manages file operations across both the persistent (`IDBStoredProject`) and transient (`ExecutionEnvironment`) file systems so both file systems remain synced.
- The `UnifiedFS` class exposes methods like `mkdir`, `writeFile`, `rename`, `unlink`, and `rmdir` that apply to both file systems at the same time.
- Implements some logic to keep both file systems in sync in case of failure by reverting changes.

### projectInitializer.js
- Creates the default folder and file structure for new projects.
- Provides `makeNewProject_JavaScript`, `makeNewProject_CXX`, and `initializeFromFileList` to create defaults projects.
- Also sets up required `/Resources` directories and example main/game loop code.
- Used by `IDBStoredProject.js` when initializing a new project IndexedDB.

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

### fallibleMessage.js
- Manages messaging between windows/frames using promises and callback IDs.
- The `PromiseChannel` class wraps `postMessage` with support for temp callbacks and signal based messages.
- Used heavily by `executionEnvironment.js` to interact with the sandboxed iframe.

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

### fileview.js
- Manages the interactive file panel UI using `TreeView.js`.
- Routes user actions (create, rename, delete, upload) through `UnifiedFS` depending on file type (persistent/transient).
- Listens for FS events (eg. `onOpenFile`, `onDeletePath`, etc.) to keep the file panel in sync.
- Populates files on attach and clears on detach.


### projectLoadUI.js
- Builds the UI for loading demo projects in a modal-style grid.
- Uses `getChoices()` to fetch metadata and displays project thumbnails with necessary metadata.
- Includes error fallback if demo metadata fails to load.

### actionQueue.js
- Implements `ActionQueue`, the system behind all task scheduling and dependency management in the IDE (can be viewed in `IDEStartupMain.js` to understand how its used).
- Allows for (`waitOn`), cancellations (`cancelOn`), and ('synchronousWith').
- Includes test utilities and full control over task execution flow via `Schedule()` and `Consume()`.

### IDEStartupMain.js
- Controls the startup process for the entire IDE using a sequence of `ActionQueue` instances.
- Queues like `IDECoreInitQueue`, `CompilerInitQueue`, `ExecutionEnvironmentLoadQueue`, and others run in order or in parallel.
- Handles initialization of the UI, compiler, project storage, and sandbox.
- Defines `StartIDE()` as the main startup entrypoint.


### themes.js
- Defines multiple color themes as JSON objects that map to CSS variable values.
- Applies themes dynamically by setting CSS variables on `document.documentElement.style`.
- Provides a global `applyTheme()` function that can be run from the browser console.
- Populates a `<select id="themeSelection">` dropdown with all available themes on `DOMContentLoaded`.
- Resets to default theme when no theme is selected.
- Meant to override visual properties like background, comment color, and keyword color.
- Intended for flexible customization without changing CSS files directly.

---


