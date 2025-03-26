using System;

class Program
{
    static void Main()
    {
        JsonParser parser = new JsonParser();
        parser.ProcessJSON();
        Console.WriteLine("JSON processing completed.");
    }
}
