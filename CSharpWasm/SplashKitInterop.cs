using System.Runtime.InteropServices.JavaScript;

public partial class SplashKitInterop
{
    [JSImport("SplashKitBackendWASM.write_line", "main.js")]
    public static partial void WriteLine(string message);

    [JSImport("window.location.href", "main.js")]
    public static partial string GetHRef();

    [JSImport("SplashKitBackendWASM.fill_ellipse", "main.js")]
    public static partial void FillEllipse();

    [JSImport("SplashKitBackendWASM.refresh_screen", "main.js")]
    public static partial void RefreshScreen(int refreshRate);

    [JSImport("SplashKitBackendWASM.open_window", "main.js")]
    public static partial void OpenWindow(string title, int width, int height);
}
