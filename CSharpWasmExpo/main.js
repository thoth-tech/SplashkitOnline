import { dotnet } from "./wwwroot/_framework/dotnet.js";
import methods from "./splashKitMethods.generated.js";

// Resolve a single SplashKit binding by name. The generated method list uses
// the plain SplashKit names, but the build can expose them under a few
// different shapes depending on which backend produced them, so each known
// shape is tried in turn.
const resolveBinding = (name, wasmScope) => {
  let fn =
    globalThis[name] ??
    wasmScope?.[name] ??
    wasmScope?.[`_CPP_${name}`] ??
    globalThis[`__sko_${name}`] ??
    wasmScope?.[`__sko_${name}`];

  if (typeof fn !== "function") {
    const sklibMatch = Object.keys(wasmScope || {}).find(
      (key) => key === `__sklib__${name}` || key.startsWith(`__sklib__${name}__`)
    );

    if (sklibMatch && typeof wasmScope[sklibMatch] === "function") {
      fn = wasmScope[sklibMatch];
    }
  }

  return typeof fn === "function" ? fn : null;
};

const parseMethods = (methods) => {
  if (!methods || typeof methods !== "string") {
    console.error("[SplashKit WASM] Invalid method list received.");
    return {};
  }

  const methodList = methods
    .split(",")
    .map((method) => method.trim().replace("\n", ""))
    .filter(Boolean);

  const bindingsFunctions = {};
  const missingFunctions = [];
  const errorFunctions = [];

  const frame = document.querySelector("iframe");
  const wasmScope = frame?.contentWindow;

  for (const name of methodList) {
    try {
      const fn = resolveBinding(name, wasmScope);

      if (fn) {
        bindingsFunctions[name] = fn;
      } else {
        missingFunctions.push(name);
      }
    } catch (e) {
      errorFunctions.push(name);
    }
  }

  // The current build is missing a large number of bindings, so log one
  // summary line and hide the full list behind a collapsed group rather than
  // printing a separate warning per name.
  if (missingFunctions.length > 0) {
    console.warn(
      `[SplashKit WASM] ${missingFunctions.length} SplashKit bindings are missing.`
    );

    console.groupCollapsed("[SplashKit WASM] View missing bindings");
    missingFunctions.forEach((name) => console.warn(name));
    console.groupEnd();
  }

  if (errorFunctions.length > 0) {
    console.warn(
      `[SplashKit WASM] ${errorFunctions.length} SplashKit bindings could not be loaded.`
    );

    console.groupCollapsed("[SplashKit WASM] View binding loading errors");
    errorFunctions.forEach((name) => console.warn(name));
    console.groupEnd();
  }

  return bindingsFunctions;
};

const loadDotNet = async () => {
  const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

  const skFunctions = parseMethods(methods);

  // process_events drives the event pump and the redraw, so C# programs stall
  // without it. It is provided by the C++ side as __sko_process_events and is
  // not always in scope when the bindings are first resolved, so it is looked
  // up lazily on each call instead of being bound up front.
  if (typeof skFunctions.process_events !== "function") {
    const frame = document.querySelector("iframe");

    skFunctions.process_events = () => {
      const fn = resolveBinding("process_events", frame?.contentWindow);

      if (fn) {
        return fn();
      }

      console.warn("[SplashKit WASM] process_events is not wired properly.");
    };
  }

  setModuleImports("main.js", {
    window: {
      location: {
        href: () => globalThis.window.location.href,
      },
    },
    SplashKitBackendWASM: skFunctions,
  });

  const config = getConfig();
  const exports = await getAssemblyExports(config.mainAssemblyName);
  return exports;
};

const CompileAndRun = async (code, reportError) => {
  try {
    const exports = await loadDotNet();
    const result = await exports.CSharpCodeRunner.CompileAndRun(code);
    if (result.includes("Compilation failed")) {
      const errors = result.split(":");
      const errorLine = errors[1].split("Line");

      const indexCorrector = 1;
      const filePath = "__USERCODE__/code/main.cs";
      reportError(
        filePath,
        result,
        Number(errorLine[1]) + indexCorrector,
        null,
        true,
      );
    }
  } catch (error) {
    console.error("Error during code execution:", error);
  } finally {
    // Signal that the run has finished so csharpRuntime.js can report the
    // stopped state back to the IDE, re-enabling Run/Restart correctly.
    document.dispatchEvent(new CustomEvent("compileAndRunComplete"));
  }
};

// This event will be trigger by the csharp compiler
document.addEventListener("compileAndRun", (ev) => {
  CompileAndRun(ev.detail.program[0].source, ev.detail.reportError);
});
