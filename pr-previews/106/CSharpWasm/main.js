import { dotnet } from "./wwwroot/_framework/dotnet.js";

const loadDotNet = async () => {
    const { setModuleImports, getAssemblyExports, getConfig } = await dotnet
        .withDiagnosticTracing(false)
        .withApplicationArgumentsFromQuery()
        .create();

    setModuleImports("main.js", {
        window: {
            location: {
                href: () => globalThis.window.location.href,
            },
        },
        SplashKitBackendWASM: {
            // TODO: Pass the rest of the SplashKit functions
            write_line,
            refresh_screen,
            open_window,
            fill_ellipse: () => {
                // Research how to pass a JS object in WASM
                fill_ellipse(color_black(), 260, 260, 200, 200);
            },
        },
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
