import { dotnet } from "./wwwroot/_framework/dotnet.js";
import methods from "./splashKitMethods.generated.js";

// Prefix all runtime logging so it's easy to filter/search for in devtools
const LOG_PREFIX = "[SKO C# Runtime]";

/**
 * Resolves a single SplashKit binding by name.
 *
 * Previously this project used eval(name) to look functions up. That has
 * two problems:
 *  1. Content-Security-Policy (CSP) headers that disallow 'unsafe-eval'
 *     (a very common, recommended CSP setting) cause every single lookup
 *     to throw, breaking the C# runtime completely in those environments.
 *  2. eval() runs arbitrary strings as code, which is unsafe in general
 *     even when the input is "trusted" - it's unnecessary risk for what is
 *     really just a global-variable lookup.
 *
 * The SplashKit WASM glue (Emscripten) attaches every SplashKit function as
 * a plain global, so a direct globalThis[name] lookup finds the exact same
 * function without needing eval() at all.
 */
const resolveBinding = (name) => {
  const fn = globalThis[name];
  return typeof fn === "function" ? fn : null;
};

/**
 * Builds the set of JS bindings passed into the .NET runtime, and logs
 * which (if any) SplashKit functions could not be found so missing/renamed
 * bindings are easy to spot instead of failing silently.
 */
const parseMethods = (methods) => {
  const methodList = methods
    .split(",")
    .map((method) => method.trim().replace("\n", ""))
    .filter(Boolean);

  const bindingsFunctions = {};
  const missing = [];

  for (const name of methodList) {
    const fn = resolveBinding(name);
    if (fn) {
      bindingsFunctions[name] = fn;
    } else {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `${LOG_PREFIX} ${missing.length} binding(s) could not be resolved and will be unavailable to C#:`,
      missing,
    );
  }

  console.log(
    `${LOG_PREFIX} Resolved ${Object.keys(bindingsFunctions).length}/${methodList.length} SplashKit bindings.`,
  );

  return bindingsFunctions;
};

/**
 * process_events drives SplashKit's event loop (input, window events, etc)
 * and is called continuously by most C# programs. If it's missing for any
 * reason (runtime not fully loaded yet, a future SplashKit rename, etc.),
 * calling it would throw "X is not a function" and crash the user's whole
 * program. We substitute a harmless no-op instead and log a clear warning,
 * so execution can continue in a degraded-but-stable state.
 */
const withProcessEventsFallback = (bindingsFunctions) => {
  if (typeof bindingsFunctions.process_events !== "function") {
    console.warn(
      `${LOG_PREFIX} process_events could not be resolved - using a no-op fallback. ` +
        `Input and window events will not be processed until this is fixed.`,
    );
    bindingsFunctions.process_events = () => {};
  }
  return bindingsFunctions;
};

const loadDotNet = async () => {
  console.log(`${LOG_PREFIX} Initialising .NET WASM runtime...`);

  const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

  const skFunctions = withProcessEventsFallback(parseMethods(methods));

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

  console.log(`${LOG_PREFIX} .NET WASM runtime ready.`);

  return exports;
};

const CompileAndRun = async (code, reportError) => {
  try {
    const exports = await loadDotNet();
    const result = await exports.CSharpCodeRunner.CompileAndRun(code);

    if (result && result.includes("Compilation failed")) {
      console.warn(`${LOG_PREFIX} Compilation failed:`, result);

      const errors = result.split(":");
      const errorLine = errors[1]?.split("Line");

      // Guard against unexpected compiler-error formats instead of throwing
      // (the original code assumed errors[1] and errorLine[1] always exist).
      if (!errorLine || errorLine.length < 2) {
        console.error(
          `${LOG_PREFIX} Could not parse a line number from the compiler error; reporting without one.`,
        );
        reportError("__USERCODE__/code/main.cs", result, null, null, true);
        return;
      }

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
    console.error(`${LOG_PREFIX} Error during code execution:`, error);
    // Surface runtime errors (not just compile errors) back to the IDE too,
    // instead of only logging them to the console where a learner may not
    // think to look.
    reportError?.(
      "__USERCODE__/code/main.cs",
      `Runtime error: ${error?.message ?? error}`,
      null,
      null,
      true,
    );
  }
};

// This event is triggered by the C# compiler
document.addEventListener("compileAndRun", (ev) => {
  console.log(`${LOG_PREFIX} Received compileAndRun event.`);
  CompileAndRun(ev.detail.program[0].source, ev.detail.reportError);
});