using System;

class Program
{
    static void Main()
    {
        BindingsGenerator parser = new BindingsGenerator();
        parser.ProcessJSON("../../SplashKitWasm/external/splashkit-core/generated/docs/api.json");
        Console.WriteLine("JSON processing completed.");
    }
}
