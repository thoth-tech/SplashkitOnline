


using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices.JavaScript;
using __sklib_ptr = System.IntPtr;


[UnmanagedFunctionPointerAttribute(CallingConvention.Cdecl)]
public delegate void KeyCallback(int code);


[UnmanagedFunctionPointerAttribute(CallingConvention.Cdecl)]
public delegate void FreeNotifier(IntPtr pointer);


[UnmanagedFunctionPointerAttribute(CallingConvention.Cdecl)]
public delegate void SpriteEventHandler(IntPtr s, int evt);


[UnmanagedFunctionPointerAttribute(CallingConvention.Cdecl)]
public delegate void SpriteFloatFunction(IntPtr s, float f);


[UnmanagedFunctionPointerAttribute(CallingConvention.Cdecl)]
public delegate void SpriteFunction(IntPtr s);



 

namespace SplashKitSDK 
{
   public partial class AnimationScript
   {
      

      

     } 

   public partial class SplashKit
   {
      [JSImport("SplashKitBackendWASM.audio_ready", "main.js")] 
      public static partial bool AudioReady();

      [JSImport("SplashKitBackendWASM.close_audio", "main.js")] 
      public static partial void CloseAudio();

      [JSImport("SplashKitBackendWASM.open_audio", "main.js")] 
      public static partial void OpenAudio();

      [JSImport("SplashKitBackendWASM.camera_x", "main.js")] 
      public static partial double CameraX();

      [JSImport("SplashKitBackendWASM.camera_y", "main.js")] 
      public static partial double CameraY();

      [JSImport("SplashKitBackendWASM.move_camera_by", "main.js")] 
      public static partial void MoveCameraBy(double dx, double dy);

      [JSImport("SplashKitBackendWASM.move_camera_to", "main.js")] 
      public static partial void MoveCameraTo(double x, double y);

      [JSImport("SplashKitBackendWASM.set_camera_x", "main.js")] 
      public static partial void SetCameraX(double x);

      [JSImport("SplashKitBackendWASM.set_camera_y", "main.js")] 
      public static partial void SetCameraY(double y);

      [JSImport("SplashKitBackendWASM.to_screen_x", "main.js")] 
      public static partial double ToScreenX(double worldX);

      [JSImport("SplashKitBackendWASM.to_screen_y", "main.js")] 
      public static partial double ToScreenY(double worldY);

      [JSImport("SplashKitBackendWASM.to_world_x", "main.js")] 
      public static partial double ToWorldX(double screenX);

      [JSImport("SplashKitBackendWASM.to_world_y", "main.js")] 
      public static partial double ToWorldY(double screenY);

      [JSImport("SplashKitBackendWASM.circles_intersect", "main.js")] 
      public static partial bool CirclesIntersect(double c1X, double c1Y, double c1Radius, double c2X, double c2Y, double c2Radius);

      [JSImport("SplashKitBackendWASM.cosine", "main.js")] 
      public static partial float Cosine(float degrees);

      [JSImport("SplashKitBackendWASM.sine", "main.js")] 
      public static partial float Sine(float degrees);

      [JSImport("SplashKitBackendWASM.tangent", "main.js")] 
      public static partial float Tangent(float degrees);

      [JSImport("SplashKitBackendWASM.point_in_circle", "main.js")] 
      public static partial bool PointInCircle(double ptx, double pty, double cx, double cy, double radius);

      [JSImport("SplashKitBackendWASM.point_in_rectangle", "main.js")] 
      public static partial bool PointInRectangle(double ptx, double pty, double rectX, double rectY, double rectWidth, double rectHeight);

      [JSImport("SplashKitBackendWASM.pop_clip", "main.js")] 
      public static partial void PopClip();

      [JSImport("SplashKitBackendWASM.reset_clip", "main.js")] 
      public static partial void ResetClip();

      [JSImport("SplashKitBackendWASM.clear_screen", "main.js")] 
      public static partial void ClearScreen();

      [JSImport("SplashKitBackendWASM.refresh_screen", "main.js")] 
      public static partial void RefreshScreen();

      [JSImport("SplashKitBackendWASM.screen_height", "main.js")] 
      public static partial int ScreenHeight();

      [JSImport("SplashKitBackendWASM.screen_width", "main.js")] 
      public static partial int ScreenWidth();

      [JSImport("SplashKitBackendWASM.take_screenshot", "main.js")] 
      public static partial void TakeScreenshot(string basename);

      [JSImport("SplashKitBackendWASM.text_height", "main.js")] 
      public static partial int TextHeight(string text, string fnt, int fontSize);

      [JSImport("SplashKitBackendWASM.text_width", "main.js")] 
      public static partial int TextWidth(string text, string fnt, int fontSize);

      [JSImport("SplashKitBackendWASM.process_events", "main.js")] 
      public static partial void ProcessEvents();

      [JSImport("SplashKitBackendWASM.quit_requested", "main.js")] 
      public static partial bool QuitRequested();

      [JSImport("SplashKitBackendWASM.reset_quit", "main.js")] 
      public static partial void ResetQuit();

      [JSImport("SplashKitBackendWASM.any_key_pressed", "main.js")] 
      public static partial bool AnyKeyPressed();

      [JSImport("SplashKitBackendWASM.hide_mouse", "main.js")] 
      public static partial void HideMouse();

      [JSImport("SplashKitBackendWASM.mouse_shown", "main.js")] 
      public static partial bool MouseShown();

      [JSImport("SplashKitBackendWASM.mouse_x", "main.js")] 
      public static partial float MouseX();

      [JSImport("SplashKitBackendWASM.mouse_y", "main.js")] 
      public static partial float MouseY();

      [JSImport("SplashKitBackendWASM.move_mouse", "main.js")] 
      public static partial void MoveMouse(double x, double y);

      [JSImport("SplashKitBackendWASM.show_mouse", "main.js")] 
      public static partial void ShowMouse();

      [JSImport("SplashKitBackendWASM.show_mouse", "main.js")] 
      public static partial void ShowMouse(bool show);

      [JSImport("SplashKitBackendWASM.end_reading_text", "main.js")] 
      public static partial void EndReadingText();

      [JSImport("SplashKitBackendWASM.reading_text", "main.js")] 
      public static partial bool ReadingText();

      [JSImport("SplashKitBackendWASM.text_entry_cancelled", "main.js")] 
      public static partial bool TextEntryCancelled();

      [JSImport("SplashKitBackendWASM.text_input", "main.js")] 
      public static partial string TextInput();

      [JSImport("SplashKitBackendWASM.add_column", "main.js")] 
      public static partial void AddColumn(int width);

      [JSImport("SplashKitBackendWASM.add_column_relative", "main.js")] 
      public static partial void AddColumnRelative(double width);

      [JSImport("SplashKitBackendWASM.button", "main.js")] 
      public static partial bool Button(string text);

      [JSImport("SplashKitBackendWASM.button", "main.js")] 
      public static partial bool Button(string labelText, string text);

      [JSImport("SplashKitBackendWASM.checkbox", "main.js")] 
      public static partial bool Checkbox(string text, bool value);

      [JSImport("SplashKitBackendWASM.checkbox", "main.js")] 
      public static partial bool Checkbox(string labelText, string text, bool value);

      [JSImport("SplashKitBackendWASM.disable_interface", "main.js")] 
      public static partial void DisableInterface();

      [JSImport("SplashKitBackendWASM.draw_interface", "main.js")] 
      public static partial void DrawInterface();

      [JSImport("SplashKitBackendWASM.enable_interface", "main.js")] 
      public static partial void EnableInterface();

      [JSImport("SplashKitBackendWASM.end_inset", "main.js")] 
      public static partial void EndInset(string name);

      [JSImport("SplashKitBackendWASM.end_panel", "main.js")] 
      public static partial void EndPanel(string name);

      [JSImport("SplashKitBackendWASM.end_popup", "main.js")] 
      public static partial void EndPopup(string name);

      [JSImport("SplashKitBackendWASM.end_treenode", "main.js")] 
      public static partial void EndTreenode(string labelText);

      [JSImport("SplashKitBackendWASM.enter_column", "main.js")] 
      public static partial void EnterColumn();

      [JSImport("SplashKitBackendWASM.get_interface_label_width", "main.js")] 
      public static partial int GetInterfaceLabelWidth();

      [JSImport("SplashKitBackendWASM.header", "main.js")] 
      public static partial bool Header(string labelText);

      [JSImport("SplashKitBackendWASM.interface_enabled", "main.js")] 
      public static partial bool InterfaceEnabled();

      [JSImport("SplashKitBackendWASM.label_element", "main.js")] 
      public static partial void LabelElement(string text);

      [JSImport("SplashKitBackendWASM.last_element_changed", "main.js")] 
      public static partial bool LastElementChanged();

      [JSImport("SplashKitBackendWASM.last_element_confirmed", "main.js")] 
      public static partial bool LastElementConfirmed();

      [JSImport("SplashKitBackendWASM.leave_column", "main.js")] 
      public static partial void LeaveColumn();

      [JSImport("SplashKitBackendWASM.number_box", "main.js")] 
      public static partial float NumberBox(float value, float step);

      [JSImport("SplashKitBackendWASM.number_box", "main.js")] 
      public static partial float NumberBox(string labelText, float value, float step);

      [JSImport("SplashKitBackendWASM.open_popup", "main.js")] 
      public static partial void OpenPopup(string name);

      [JSImport("SplashKitBackendWASM.paragraph", "main.js")] 
      public static partial void Paragraph(string text);

      [JSImport("SplashKitBackendWASM.reset_layout", "main.js")] 
      public static partial void ResetLayout();

      [JSImport("SplashKitBackendWASM.set_interface_label_width", "main.js")] 
      public static partial void SetInterfaceLabelWidth(int width);

      [JSImport("SplashKitBackendWASM.set_interface_spacing", "main.js")] 
      public static partial void SetInterfaceSpacing(int spacing, int padding);

      [JSImport("SplashKitBackendWASM.set_layout_height", "main.js")] 
      public static partial void SetLayoutHeight(int height);

      [JSImport("SplashKitBackendWASM.single_line_layout", "main.js")] 
      public static partial void SingleLineLayout();

      [JSImport("SplashKitBackendWASM.slider", "main.js")] 
      public static partial float Slider(float value, float minValue, float maxValue);

      [JSImport("SplashKitBackendWASM.slider", "main.js")] 
      public static partial float Slider(string labelText, float value, float minValue, float maxValue);

      [JSImport("SplashKitBackendWASM.split_into_columns", "main.js")] 
      public static partial void SplitIntoColumns(int count);

      [JSImport("SplashKitBackendWASM.split_into_columns", "main.js")] 
      public static partial void SplitIntoColumns(int count, int lastWidth);

      [JSImport("SplashKitBackendWASM.split_into_columns_relative", "main.js")] 
      public static partial void SplitIntoColumnsRelative(int count, double lastWidth);

      [JSImport("SplashKitBackendWASM.start_custom_layout", "main.js")] 
      public static partial void StartCustomLayout();

      [JSImport("SplashKitBackendWASM.start_inset", "main.js")] 
      public static partial void StartInset(string name, int height);

      [JSImport("SplashKitBackendWASM.start_popup", "main.js")] 
      public static partial bool StartPopup(string name);

      [JSImport("SplashKitBackendWASM.start_treenode", "main.js")] 
      public static partial bool StartTreenode(string labelText);

      [JSImport("SplashKitBackendWASM.text_box", "main.js")] 
      public static partial string TextBox(string labelText, string value);

      [JSImport("SplashKitBackendWASM.text_box", "main.js")] 
      public static partial string TextBox(string labelText, string value, bool showLabel);

      [JSImport("SplashKitBackendWASM.close_log_process", "main.js")] 
      public static partial void CloseLogProcess();

      [JSImport("SplashKitBackendWASM.check_network_activity", "main.js")] 
      public static partial void CheckNetworkActivity();

      [JSImport("SplashKitBackendWASM.close_all_servers", "main.js")] 
      public static partial void CloseAllServers();

      [JSImport("SplashKitBackendWASM.close_server", "main.js")] 
      public static partial bool CloseServer(string name);

      [JSImport("SplashKitBackendWASM.has_server", "main.js")] 
      public static partial bool HasServer(string name);

      [JSImport("SplashKitBackendWASM.hex_str_to_ipv4", "main.js")] 
      public static partial string HexStrToIpv4(string aHex);

      [JSImport("SplashKitBackendWASM.hex_to_dec_string", "main.js")] 
      public static partial string HexToDecString(string aHex);

      [JSImport("SplashKitBackendWASM.hex_to_mac", "main.js")] 
      public static partial string HexToMac(string hexStr);

      [JSImport("SplashKitBackendWASM.ipv4_to_hex", "main.js")] 
      public static partial string Ipv4ToHex(string aIP);

      [JSImport("SplashKitBackendWASM.is_valid_ipv4", "main.js")] 
      public static partial bool IsValidIpv4(string ip);

      [JSImport("SplashKitBackendWASM.is_valid_mac", "main.js")] 
      public static partial bool IsValidMac(string macAddress);

      [JSImport("SplashKitBackendWASM.mac_to_hex", "main.js")] 
      public static partial string MacToHex(string macAddress);

      [JSImport("SplashKitBackendWASM.my_ip", "main.js")] 
      public static partial string MyIP();

      [JSImport("SplashKitBackendWASM.reconnect", "main.js")] 
      public static partial void Reconnect(string name);

      [JSImport("SplashKitBackendWASM.close_adc", "main.js")] 
      public static partial void CloseAdc(string name);

      [JSImport("SplashKitBackendWASM.close_all_adc", "main.js")] 
      public static partial void CloseAllAdc();

      [JSImport("SplashKitBackendWASM.has_gpio", "main.js")] 
      public static partial bool HasGpio();

      [JSImport("SplashKitBackendWASM.raspi_cleanup", "main.js")] 
      public static partial void RaspiCleanup();

      [JSImport("SplashKitBackendWASM.raspi_init", "main.js")] 
      public static partial void RaspiInit();

      [JSImport("SplashKitBackendWASM.raspi_spi_close", "main.js")] 
      public static partial int RaspiSpiClose(int handle);

      [JSImport("SplashKitBackendWASM.raspi_spi_open", "main.js")] 
      public static partial int RaspiSpiOpen(int channel, int speed, int spiFlags);

      [JSImport("SplashKitBackendWASM.free_resource_bundle", "main.js")] 
      public static partial void FreeResourceBundle(string name);

      [JSImport("SplashKitBackendWASM.has_resource_bundle", "main.js")] 
      public static partial bool HasResourceBundle(string name);

      [JSImport("SplashKitBackendWASM.load_resource_bundle", "main.js")] 
      public static partial void LoadResourceBundle(string name, string filename);

      [JSImport("SplashKitBackendWASM.path_to_resources", "main.js")] 
      public static partial string PathToResources();

      [JSImport("SplashKitBackendWASM.set_resources_path", "main.js")] 
      public static partial void SetResourcesPath(string path);

      [JSImport("SplashKitBackendWASM.read_char", "main.js")] 
      public static partial char ReadChar();

      [JSImport("SplashKitBackendWASM.read_line", "main.js")] 
      public static partial string ReadLine();

      [JSImport("SplashKitBackendWASM.terminal_has_input", "main.js")] 
      public static partial bool TerminalHasInput();

      [JSImport("SplashKitBackendWASM.write", "main.js")] 
      public static partial void Write(char data);

      [JSImport("SplashKitBackendWASM.write", "main.js")] 
      public static partial void Write(double data);

      [JSImport("SplashKitBackendWASM.write", "main.js")] 
      public static partial void Write(int data);

      [JSImport("SplashKitBackendWASM.write", "main.js")] 
      public static partial void Write(string text);

      [JSImport("SplashKitBackendWASM.write_line", "main.js")] 
      public static partial void WriteLine(char data);

      [JSImport("SplashKitBackendWASM.write_line", "main.js")] 
      public static partial void WriteLine();

      [JSImport("SplashKitBackendWASM.write_line", "main.js")] 
      public static partial void WriteLine(double data);

      [JSImport("SplashKitBackendWASM.write_line", "main.js")] 
      public static partial void WriteLine(int data);

      [JSImport("SplashKitBackendWASM.write_line", "main.js")] 
      public static partial void WriteLine(string line);

      [JSImport("SplashKitBackendWASM.base64_decode", "main.js")] 
      public static partial string Base64Decode(string input);

      [JSImport("SplashKitBackendWASM.base64_encode", "main.js")] 
      public static partial string Base64Encode(string input);

      [JSImport("SplashKitBackendWASM.bin_to_hex", "main.js")] 
      public static partial string BinToHex(string binStr);

      [JSImport("SplashKitBackendWASM.bin_to_oct", "main.js")] 
      public static partial string BinToOct(string binStr);

      [JSImport("SplashKitBackendWASM.contains", "main.js")] 
      public static partial bool Contains(string text, string subtext);

      [JSImport("SplashKitBackendWASM.convert_to_double", "main.js")] 
      public static partial double ConvertToDouble(string text);

      [JSImport("SplashKitBackendWASM.convert_to_integer", "main.js")] 
      public static partial int ConvertToInteger(string text);

      [JSImport("SplashKitBackendWASM.greatest_common_divisor", "main.js")] 
      public static partial int GreatestCommonDivisor(int number1, int number2);

      [JSImport("SplashKitBackendWASM.hex_to_bin", "main.js")] 
      public static partial string HexToBin(string hexStr);

      [JSImport("SplashKitBackendWASM.hex_to_oct", "main.js")] 
      public static partial string HexToOct(string hexStr);

      [JSImport("SplashKitBackendWASM.index_of", "main.js")] 
      public static partial int IndexOf(string text, string subtext);

      [JSImport("SplashKitBackendWASM.is_binary", "main.js")] 
      public static partial bool IsBinary(string binStr);

      [JSImport("SplashKitBackendWASM.is_double", "main.js")] 
      public static partial bool IsDouble(string text);

      [JSImport("SplashKitBackendWASM.is_hex", "main.js")] 
      public static partial bool IsHex(string hexStr);

      [JSImport("SplashKitBackendWASM.is_integer", "main.js")] 
      public static partial bool IsInteger(string text);

      [JSImport("SplashKitBackendWASM.is_number", "main.js")] 
      public static partial bool IsNumber(string text);

      [JSImport("SplashKitBackendWASM.is_octal", "main.js")] 
      public static partial bool IsOctal(string octalStr);

      [JSImport("SplashKitBackendWASM.is_prime_number", "main.js")] 
      public static partial bool IsPrimeNumber(int number);

      [JSImport("SplashKitBackendWASM.least_common_multiple", "main.js")] 
      public static partial int LeastCommonMultiple(int number1, int number2);

      [JSImport("SplashKitBackendWASM.length_of", "main.js")] 
      public static partial int LengthOf(string text);

      [JSImport("SplashKitBackendWASM.oct_to_bin", "main.js")] 
      public static partial string OctToBin(string octalStr);

      [JSImport("SplashKitBackendWASM.oct_to_hex", "main.js")] 
      public static partial string OctToHex(string octStr);

      [JSImport("SplashKitBackendWASM.replace_all", "main.js")] 
      public static partial string ReplaceAll(string text, string substr, string newText);

      [JSImport("SplashKitBackendWASM.square_root", "main.js")] 
      public static partial double SquareRoot(int number);

      [JSImport("SplashKitBackendWASM.to_lowercase", "main.js")] 
      public static partial string ToLowercase(string text);

      [JSImport("SplashKitBackendWASM.to_uppercase", "main.js")] 
      public static partial string ToUppercase(string text);

      [JSImport("SplashKitBackendWASM.trim", "main.js")] 
      public static partial string Trim(string text);

      [JSImport("SplashKitBackendWASM.rnd", "main.js")] 
      public static partial int Rnd(int min, int max);

      [JSImport("SplashKitBackendWASM.rnd", "main.js")] 
      public static partial float Rnd();

      [JSImport("SplashKitBackendWASM.rnd", "main.js")] 
      public static partial int Rnd(int ubound);

      [JSImport("SplashKitBackendWASM.delay", "main.js")] 
      public static partial void Delay(int milliseconds);

     } 

   public partial class Animation
   {
      

      

      

      

      

      

      [JSImport("SplashKitBackendWASM.free_all_animation_scripts", "main.js")] 
      public static partial void FreeAll();

     } 

   public partial class Audio
   {
      

      [JSImport("SplashKitBackendWASM.fade_music_out", "main.js")] 
      public static partial void FadeOut(int ms);

      

      

      [JSImport("SplashKitBackendWASM.pause_music", "main.js")] 
      public static partial void Pause();

      [JSImport("SplashKitBackendWASM.resume_music", "main.js")] 
      public static partial void Resume();

      [JSImport("SplashKitBackendWASM.stop_music", "main.js")] 
      public static partial void Stop();

     } 

   public partial class Music
   {
      

      

     } 

   public partial class SoundEffect
   {
      

      

      

     } 

   public partial class Camera
   {
      

      

      

      [JSImport("SplashKitBackendWASM.move_camera_by", "main.js")] 
      public static partial void MoveBy(double dx, double dy);

      [JSImport("SplashKitBackendWASM.move_camera_to", "main.js")] 
      public static partial void MoveTo(double x, double y);

      

      

      [JSImport("SplashKitBackendWASM.to_screen_x", "main.js")] 
      public static partial double ToScreenX(double worldX);

      [JSImport("SplashKitBackendWASM.to_screen_y", "main.js")] 
      public static partial double ToScreenY(double worldY);

      [JSImport("SplashKitBackendWASM.to_world_x", "main.js")] 
      public static partial double ToWorldX(double screenX);

      [JSImport("SplashKitBackendWASM.to_world_y", "main.js")] 
      public static partial double ToWorldY(double screenY);

      

     } 

   public partial class Window
   {
      

      

      

      

      

      

      

      

      

      

      

      

     } 

   public partial class Bitmap
   {
      

      

      

      

      

      

      

      

      

      

      

     } 

   public partial class Display
   {
      

      

      

      

      

     } 

   public partial class Font
   {
      

     } 

   public partial class Text
   {
      [JSImport("SplashKitBackendWASM.free_all_fonts", "main.js")] 
      public static partial void FreeAll();

      [JSImport("SplashKitBackendWASM.text_height", "main.js")] 
      public static partial int Height(string text, string fnt, int fontSize);

      [JSImport("SplashKitBackendWASM.text_width", "main.js")] 
      public static partial int Width(string text, string fnt, int fontSize);

     } 

   public partial class Json
   {
     } 

   public partial class ServerSocket
   {
      

      

      

      

     } 

   public partial class Connection
   {
      

      

      

     } 

   public partial class Message
   {
      

      

      

      

      

     } 

   public partial class Networking
   {
      

     } 

   public partial class HttpResponse
   {
     } 

   public partial class WebServer
   {
      

      

     } 

   public partial class HttpRequest
   {
      

      

      

      

      

      

     } 

   public partial class Sprite
   {
      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

      

     } 

   public partial class Timer
   {
      

      

     } 


public struct Matrix2D {


       public double[] Elements;

}

public struct DrawingOptions {


       public IntPtr Dest;
       public float Scale_x;
       public float Scale_y;
       public float Angle;
       public float Anchor_offset_x;
       public float Anchor_offset_y;
       public bool Flip_x;
       public bool Flip_y;
       public bool Is_part;
       public Rectangle Part;
       public int Draw_cell;
       public DrawingDest Camera;
       public int Line_width;
       public Animation Anim;

}

public struct Line {


       public Point2D Start_point;
       public Point2D End_point;

}

public struct Point2D {


       public double X;
       public double Y;

}

public struct Quad {


       public Point2D[] Points;

}

public struct Rectangle {


       public double X;
       public double Y;
       public double Width;
       public double Height;

}

public struct Triangle {


       public Point2D[] Points;

}

public struct Vector2D {


       public double X;
       public double Y;

}
public enum KeyCode{ 
UnknownKey = 0,
BackspaceKey = 8,
TabKey = 9,
ClearKey = 12,
ReturnKey = 13,
PauseKey = 19,
EscapeKey = 27,
SpaceKey = 32,
ExclaimKey = 33,
DoubleQuoteKey = 34,
HashKey = 35,
DollarKey = 36,
AmpersandKey = 38,
QuoteKey = 39,
LeftParenKey = 40,
RightParenKey = 41,
AsteriskKey = 42,
PlusKey = 43,
CommaKey = 44,
MinusKey = 45,
PeriodKey = 46,
SlashKey = 47,
Num0Key = 48,
Num1Key = 49,
Num2Key = 50,
Num3Key = 51,
Num4Key = 52,
Num5Key = 53,
Num6Key = 54,
Num7Key = 55,
Num8Key = 56,
Num9Key = 57,
ColonKey = 58,
SemiColonKey = 59,
LessKey = 60,
EqualsKey = 61,
GreaterKey = 62,
QuestionKey = 63,
AtKey = 64,
LeftBracketKey = 91,
BackslashKey = 92,
RightBracketKey = 93,
CaretKey = 94,
UnderscoreKey = 95,
BackquoteKey = 96,
AKey = 97,
BKey = 98,
CKey = 99,
DKey = 100,
EKey = 101,
FKey = 102,
GKey = 103,
HKey = 104,
IKey = 105,
JKey = 106,
KKey = 107,
LKey = 108,
MKey = 109,
NKey = 110,
OKey = 111,
PKey = 112,
QKey = 113,
RKey = 114,
SKey = 115,
TKey = 116,
UKey = 117,
VKey = 118,
WKey = 119,
XKey = 120,
YKey = 121,
ZKey = 122,
DeleteKey = 127,
Keypad0 = 256,
Keypad1 = 257,
Keypad2 = 258,
Keypad3 = 259,
Keypad4 = 260,
Keypad5 = 261,
Keypad6 = 262,
Keypad7 = 263,
Keypad8 = 264,
Keypad9 = 265,
KeypadPeriod = 266,
KeypadDivide = 267,
KeypadMultiply = 268,
KeypadMinus = 269,
KeypadPlus = 270,
KeypadEnter = 271,
KeypadEquals = 272,
UpKey = 273,
DownKey = 274,
RightKey = 275,
LeftKey = 276,
InsertKey = 277,
HomeKey = 278,
EndKey = 279,
PageUpKey = 280,
PageDownKey = 281,
F1Key = 282,
F2Key = 283,
F3Key = 284,
F4Key = 285,
F5Key = 286,
F6Key = 287,
F7Key = 288,
F8Key = 289,
F9Key = 290,
F10Key = 291,
F11Key = 292,
F12Key = 293,
F13Key = 294,
F14Key = 295,
F15Key = 296,
NumLockKey = 300,
CapsLockKey = 301,
ScrollLockKey = 302,
RightShiftKey = 303,
LeftShiftKey = 304,
RightCtrlKey = 305,
LeftCtrlKey = 306,
RightAltKey = 307,
LeftAltKey = 308,
LeftSuperKey = 311,
RightSuperKey = 312,
ModeKey = 313,
HelpKey = 315,
SysReqKey = 317,
MenuKey = 319,
PowerKey = 320,
}
public enum MouseButton{ 
NoButton = 0,
LeftButton = 0,
MiddleButton = 0,
RightButton = 0,
MouseX1Button = 0,
MouseX2Button = 0,
}
public enum LogLevel{ 
None = 0,
Info = 0,
Debug = 0,
Warning = 0,
Error = 0,
Fatal = 0,
}
public enum LogMode{ 
LogNone = 0,
LogConsole = 0,
LogFileOnly = 0,
LogConsoleAndFile = 0,
}
public enum ConnectionType{ 
TCP = 0,
UDP = 0,
Unknown = 0,
}
public enum HttpMethod{ 
HttpGetMethod = 0,
HttpPostMethod = 0,
HttpPutMethod = 0,
HttpDeleteMethod = 0,
HttpOptionsMethod = 0,
HttpTraceMethod = 0,
UnknownHttpMethod = 0,
}
public enum ResourceKind{ 
AnimationResource = 0,
BundleResource = 0,
FontResource = 0,
ImageResource = 0,
JsonResource = 0,
MusicResource = 0,
ServerResource = 0,
SoundResource = 0,
TimerResource = 0,
OtherResource = 0,
}
public enum CollisionTestKind{ 
PixelCollisions = 0,
AabbCollisions = 0,
}
public enum SpriteEventKind{ 
SpriteArrivedEvent = 0,
SpriteAnimationEndedEvent = 0,
SpriteTouchedEvent = 0,
SpriteClickedEvent = 0,
}
public enum AdcPin{ 
AdcPin0 = 0,
AdcPin1 = 1,
AdcPin2 = 2,
AdcPin3 = 3,
AdcPin4 = 4,
AdcPin5 = 5,
AdcPin6 = 6,
AdcPin7 = 7,
}
public enum AdcType{ 
Ads7830 = 0,
}
public enum DrawingDest{ 
DrawToScreen = 0,
DrawToWorld = 0,
DrawDefault = 0,
}
public enum FontStyle{ 
NormalFont = 0,
BoldFont = 1,
ItalicFont = 2,
UnderlineFont = 4,
}
public enum GpioPin{ 
Pin1 = 1,
Pin2 = 2,
Pin3 = 3,
Pin4 = 4,
Pin5 = 5,
Pin6 = 6,
Pin7 = 7,
Pin8 = 8,
Pin9 = 9,
Pin10 = 10,
Pin11 = 11,
Pin12 = 12,
Pin13 = 13,
Pin14 = 14,
Pin15 = 15,
Pin16 = 16,
Pin17 = 17,
Pin18 = 18,
Pin19 = 19,
Pin20 = 20,
Pin21 = 21,
Pin22 = 22,
Pin23 = 23,
Pin24 = 24,
Pin25 = 25,
Pin26 = 26,
Pin27 = 27,
Pin28 = 28,
Pin29 = 29,
Pin30 = 30,
Pin31 = 31,
Pin32 = 32,
Pin33 = 33,
Pin34 = 34,
Pin35 = 35,
Pin36 = 36,
Pin37 = 37,
Pin38 = 38,
Pin39 = 39,
Pin40 = 40,
}
public enum GpioPinMode{ 
GpioInput = 0,
GpioOutput = 1,
GpioAlt0 = 4,
GpioAlt1 = 5,
GpioAlt2 = 6,
GpioAlt3 = 7,
GpioAlt4 = 3,
GpioAlt5 = 2,
GpioDefaultMode = -1,
}
public enum GpioPinValue{ 
GpioDefaultValue = -1,
GpioLow = 0,
GpioHigh = 1,
}
public enum HttpStatusCode{ 
HttpStatusOk = 200,
HttpStatusCreated = 201,
HttpStatusNoContent = 204,
HttpStatusMovedPermanently = 301,
HttpStatusFound = 302,
HttpStatusSeeOther = 303,
HttpStatusBadRequest = 400,
HttpStatusUnauthorized = 401,
HttpStatusForbidden = 403,
HttpStatusNotFound = 404,
HttpStatusMethodNotAllowed = 405,
HttpStatusRequestTimeout = 408,
HttpStatusConflict = 409,
HttpStatusInternalServerError = 500,
HttpStatusNotImplemented = 501,
HttpStatusServiceUnavailable = 503,
}
public enum InterfaceStyle{ 
FlatDarkStyle = 0,
ShadedDarkStyle = 1,
FlatLightStyle = 2,
ShadedLightStyle = 3,
Bubble = 4,
BubbleMulticolored = 5,
}
public enum MotorDirection{ 
MotorForward = 0,
MotorBackward = 0,
}
public enum MotorDriverType{ 
L298n = 0,
}
public enum PullUpDown{ 
PudOff = 0,
PudDown = 1,
PudUp = 2,
}
} 
