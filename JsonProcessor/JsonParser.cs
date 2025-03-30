using System.Text.Json;
using System.Text;
using System.Text.Json.Serialization;
using System.IO;
using System.Linq;
using System.Collections.Generic;

class JsonParser
{
    public void ProcessJSON(string jsonPath)
    {
        string outputPath = "SplashKit.Generated.cs";

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
                if (module.Functions != null)
                {
                    foreach (var method in module.Functions)
                    {
                        string pascalMethodName = ToPascalCase(method.Name);

                        string jsImportValue = !string.IsNullOrWhiteSpace(method.JsImport)
                            ? method.JsImport
                            : $"SplashKitBackendWASM.{method.Name}";

                        sb.AppendLine($"        [JSImport(\"{jsImportValue}\", \"main.js\")]");

                        // Format the return type.
                        string returnType = method.Return?.Type ?? "void";
                        returnType = FormatType(returnType);

                        sb.Append($"        public static partial {returnType} {pascalMethodName}(");

                        // Build parameter list using the Parameters dictionary.
                        // Parameter names remain unchanged.
                        if (method.Parameters != null && method.Parameters.Any())
                        {
                            string paramList = string.Join(", ", method.Parameters.Select(kvp =>
                                $"{FormatType(kvp.Value.Type)} {kvp.Key}"));
                            sb.Append(paramList);
                        }

                        sb.AppendLine(");");
                        sb.AppendLine();
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

    // Helper to convert snake_case to PascalCase.
    private string ToPascalCase(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;
        var parts = input.Split('_');
        return string.Join("", parts.Select(s => char.ToUpperInvariant(s[0]) + s.Substring(1)));
    }

    // Format a type name to PascalCase if not a built-in type.
    private string FormatType(string typeName)
    {
        var builtInTypes = new HashSet<string>
        {
            "int", "string", "bool", "double", "float", "decimal", "object", "void", "long", "short", "byte", "char"
        };
        if (builtInTypes.Contains(typeName.ToLowerInvariant()))
        {
            return typeName.ToLowerInvariant();
        }

        return ToPascalCase(typeName);
    }

    public class Module
    {
        [JsonPropertyName("functions")]
        public Method[] Functions { get; set; } = Array.Empty<Method>();
    }

    public class Method
    {
        public string Name { get; set; }
        public string JsImport { get; set; }

        // JSON contains parameters as an object/dictionary.
        [JsonPropertyName("parameters")]
        public Dictionary<string, Param> Parameters { get; set; } = new Dictionary<string, Param>();

        public ReturnType Return { get; set; }
    }

    public class Param
    {
        public string Type { get; set; }
        public string Description { get; set; }
    }

    public class ReturnType
    {
        public string Type { get; set; }
        public string Description { get; set; }
        public bool IsPointer { get; set; }
        public bool IsReference { get; set; }
        public bool IsVector { get; set; }
    }
}
