using System;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.JavaScript;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Net.Http;
using System.Threading.Tasks;

public class DiagnosticInfo
{
    public int Line { get; set; }
    public string Message { get; set; }
}

public partial class CSharpCodeRunner
{

    static async Task<MetadataReference> LoadAssemblyFromServer(string assemblyName)
    {
        var baseUrl = GetHRef();
        var url = $"/CSharpWasm/bin/{assemblyName}";

        try
        {
            using var httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
            var assemblyBytes = await httpClient.GetByteArrayAsync(url);
            return MetadataReference.CreateFromImage(assemblyBytes);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading assembly {assemblyName}: {ex.Message}");
            throw;
        }
    }

    [JSExport]
    internal static Task<string> CompileAndRun(string code)
    {
        return Task.Run(async () =>
        {
            try
            {
                var syntaxTree = CSharpSyntaxTree.ParseText(code);

                // Use Task.WhenAll to run async LoadAssemblyFromServer in parallel
                var references = await Task.WhenAll(
                    LoadAssemblyFromServer("mscorlib.dll"),
                    LoadAssemblyFromServer("netstandard.dll"),
                    LoadAssemblyFromServer("System.Console.dll"),
                    LoadAssemblyFromServer("System.Private.CoreLib.dll"),
                    LoadAssemblyFromServer("System.Runtime.dll"),
                    LoadAssemblyFromServer("CSharpWasm.dll")
                );

                // Create a compilation with the syntax tree and references
                var compilation = CSharpCompilation.Create(
                    assemblyName: "DynamicAssembly",
                    syntaxTrees: new[] { syntaxTree },
                    references: references,
                    options: new CSharpCompilationOptions(OutputKind.ConsoleApplication)
                );

                // Create a MemoryStream to store the compiled assembly
                using var ms = new MemoryStream();
                var emitResult = compilation.Emit(ms);

                // Check for compilation errors
                if (!emitResult.Success)
                {
                    var errors = emitResult.Diagnostics
                        .Where(d => d.Severity == DiagnosticSeverity.Error)
                        .Select(d => new DiagnosticInfo
                        {
                            Line = d.Location.GetLineSpan().StartLinePosition.Line,
                            Message = d.GetMessage()
                        })
                        .ToList();

                    // If you need to format it as a string, you can do:
                    var errorString = string.Join("\n", errors.Select(e => $"Line {e.Line}: {e.Message}"));

                    return $"Compilation failed:\n{errorString}";
                }

                // Load the compiled assembly into the current AppDomain
                ms.Seek(0, SeekOrigin.Begin);
                #pragma warning disable IL2026
                var assembly = AppDomain.CurrentDomain.Load(ms.ToArray());
                #pragma warning restore IL2026

                // Get the entry point and invoke it
                var entryPoint = assembly.EntryPoint;
                if (entryPoint != null)
                {
                    var result = entryPoint.Invoke(null, null);
                    return result?.ToString() ?? "Execution complete, no output.";
                }

                return "No entry point found.";
            }
            catch (Exception ex)
            {
                return $"Error: {ex}";
            }
        });
    }

    [JSImport("window.location.href", "main.js")]
    public static partial string GetHRef();
}
