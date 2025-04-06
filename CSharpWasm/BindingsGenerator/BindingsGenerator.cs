using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;
using System.IO;
using System.Collections.Generic;

class BindingsGenerator
{
    public void ProcessJSON(string jsonPath)
    {
        string outputPath = "SplashKitInterop.cs";

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine("JSON file not found.");
            return;
        }

        string jsonContent = File.ReadAllText(jsonPath);

        var jsonData = JsonSerializer.Deserialize<Dictionary<string, Module>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        var sb = new StringBuilder();
        sb.AppendLine("using System.Runtime.InteropServices.JavaScript;");
        sb.AppendLine();
        sb.AppendLine("namespace SplashKitSDK");
        sb.AppendLine("{");
        sb.AppendLine("    public partial class SplashKit");
        sb.AppendLine("    {");

        if (jsonData != null)
        {
            foreach (var module in jsonData.Values)
            {
                if (module.Functions == null) continue;

                foreach (var function in module.Functions)
                {
                    if (function.Signatures != null &&
                        function.Signatures.TryGetValue("csharp", out var csharpSigs))
                    {
                        foreach (var sig in csharpSigs)
                        {
                            if (sig.Contains(" SplashKit."))
                            {
                                sb.AppendLine($"        [JSImport(\"SplashKitBackendWASM.{function.Name}\", \"main.js\")]");
                                sb.AppendLine($"        {CleanSignature(sig)}");
                                sb.AppendLine();
                            }
                        }
                    }
                }
            }
        }
        else
        {
            Console.WriteLine("No modules found.");
        }

        sb.AppendLine("    }");
        sb.AppendLine("}");

        File.WriteAllText(outputPath, sb.ToString());
        Console.WriteLine($"Generated new file: {outputPath}");
    }

    private string CleanSignature(string raw)
    {
        // Only keep the part after " SplashKit."
        var idx = raw.IndexOf(" SplashKit.");
        if (idx == -1) return raw;

        string partialSig = raw.Substring(idx + " SplashKit.".Length).TrimEnd(';');

        // Extract return type and modifiers
        var prefix = raw.Substring(0, idx).Trim();
        var parts = prefix.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length < 2) return raw; // Ensure we have at least "public static <type>"

        // Insert 'partial' before the return type
        var modifiers = string.Join(" ", parts.Take(parts.Length - 1));
        var returnType = parts.Last();

        return $"{modifiers} partial {returnType} {partialSig};";
    }

    public class Module
    {
        [JsonPropertyName("functions")]
        public List<Method> Functions { get; set; }
    }

    public class Method
    {
        public string Name { get; set; }

        [JsonPropertyName("signatures")]
        public Dictionary<string, List<string>> Signatures { get; set; }
    }
}
