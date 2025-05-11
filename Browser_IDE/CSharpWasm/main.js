import { dotnet } from "./wwwroot/_framework/dotnet.js";
import methods from "./splashKitMethods.generated.js";

const parseMethods = (methods) => {
  const methodList = methods
    .split(",") // split into array
    .map((method) => method.trim().replace("\n", ""))
    .filter(Boolean);

  const bindingsFunctions = {};

  for (const name of methodList) {
    try {
      bindingsFunctions[name] = eval(name);
    } catch (e) {
      console.warn(e);
    }
  }

  return bindingsFunctions;
};

const loadDotNet = async () => {
  const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

  const skFunctions = parseMethods(methods);

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

// This event will be trigger by the csharp compiler
document.addEventListener("compileAndRun", (ev) => {
  CompileAndRun(ev.detail.program[0].source, ev.detail.reportError);
});
