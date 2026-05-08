import { dotnet } from "./wwwroot/_framework/dotnet.js";
import methods from "./splashKitMethods.generated.js";

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

  for (const name of methodList) {
    try {
      if (typeof window[name] === "function") {
        bindingsFunctions[name] = window[name];
      } else {
        missingFunctions.push(name);
      }
    } catch (e) {
      errorFunctions.push(name);
    }
  }

  if (missingFunctions.length > 0) {
    console.warn(
      `[SplashKit WASM] ${missingFunctions.length} SplashKit bindings are missing.`
    );

    console.groupCollapsed("[SplashKit WASM] View missing bindings");

    missingFunctions.forEach((name) => {
      console.warn(name);
    });

    console.groupEnd();
  }

  if (errorFunctions.length > 0) {
    console.warn(
      `[SplashKit WASM] ${errorFunctions.length} SplashKit bindings could not be loaded.`
    );

    console.groupCollapsed("[SplashKit WASM] View binding loading errors");

    errorFunctions.forEach((name) => {
      console.warn(name);
    });

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

  skFunctions.process_events = () => {
    if (typeof __sko_process_events === "function") {
      return __sko_process_events();
    }

    console.warn("[SplashKit WASM] process_events is not wired properly.");
  };

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
  }
};

document.addEventListener("compileAndRun", (ev) => {
  CompileAndRun(ev.detail.program[0].source, ev.detail.reportError);
});