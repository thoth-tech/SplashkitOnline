using System;

class Program
{
    static void Main()
    {
        JsonParser parser = new JsonParser();
        parser.ProcessJSON("../SplashKitWasm/external/splashkit-core/generated/docs/api.json");
        Console.WriteLine("JSON processing completed.");
    }
}
