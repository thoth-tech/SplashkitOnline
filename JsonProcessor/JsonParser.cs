using System;
using System.IO;
using System.Text.Json;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json.Serialization;

class JsonParser
{
    public void ProcessJSON()
    {
        string jsonPath = "../SplashKitWasm/external/splashkit-core/generated/docs/api.json";
        string outputPath = "SplashKit.Generated.cs";

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine("JSON file not found.");
            return;
        }

        Console.WriteLine("JSON file found.");
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
            foreach (var module in jsonData.Values) // Iterate over all modules (terminal, graphics, etc.)
            {
                if (module.Functions != null)
                {
                    foreach (var method in module.Functions)
                    {
                        sb.AppendLine($"        [JSImport(\"{method.JsImport}\", \"main.js\")]");
                        sb.Append($"        public static partial {method.ReturnType} {method.Name}(");

                        if (method.Params != null && method.Params.Length > 0)
                        {
                            sb.Append(string.Join(", ", method.Params.Select(p => $"{p.Type} {p.Name}")));
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
        Console.WriteLine($"Generated file: {outputPath}");
    }

    public class Module
    {
        [JsonPropertyName("functions")]
        public Method[] Functions { get; set; } = Array.Empty<Method>(); // Ensure it's never null
    }

    public class Method
    {
        public string Name { get; set; }
        public string JsImport { get; set; }
        public Param[] Params { get; set; } = Array.Empty<Param>();
        public string ReturnType { get; set; }
    }

    public class Param
    {
        public string Type { get; set; }
        public string Name { get; set; }
    }
}
