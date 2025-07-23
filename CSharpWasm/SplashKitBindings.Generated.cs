using System.Runtime.InteropServices.JavaScript;

namespace SplashKitSDK
{
    public partial class SplashKit
    {
        [JSImport("SplashKitBackendWASM.free_all_animation_scripts", "main.js")]
        public static partial void FreeAllAnimationScripts();

        [JSImport("SplashKitBackendWASM.free_animation_script", "main.js")]
        public static partial void FreeAnimationScript(string name);

        [JSImport("SplashKitBackendWASM.has_animation_script", "main.js")]
        public static partial bool HasAnimationScript(string name);

        [JSImport("SplashKitBackendWASM.audio_ready", "main.js")]
        public static partial bool AudioReady();

        [JSImport("SplashKitBackendWASM.close_audio", "main.js")]
        public static partial void CloseAudio();

        [JSImport("SplashKitBackendWASM.open_audio", "main.js")]
        public static partial void OpenAudio();

        [JSImport("SplashKitBackendWASM.fade_music_in", "main.js")]
        public static partial void FadeMusicIn(string name, int ms);

        [JSImport("SplashKitBackendWASM.fade_music_in", "main.js")]
        public static partial void FadeMusicIn(string name, int times, int ms);

        [JSImport("SplashKitBackendWASM.fade_music_out", "main.js")]
        public static partial void FadeMusicOut(int ms);

        [JSImport("SplashKitBackendWASM.free_all_music", "main.js")]
        public static partial void FreeAllMusic();

        [JSImport("SplashKitBackendWASM.has_music", "main.js")]
        public static partial bool HasMusic(string name);

        [JSImport("SplashKitBackendWASM.music_playing", "main.js")]
        public static partial bool MusicPlaying();

        [JSImport("SplashKitBackendWASM.music_volume", "main.js")]
        public static partial double MusicVolume();

        [JSImport("SplashKitBackendWASM.pause_music", "main.js")]
        public static partial void PauseMusic();

        [JSImport("SplashKitBackendWASM.play_music", "main.js")]
        public static partial void PlayMusic(string name);

        [JSImport("SplashKitBackendWASM.play_music", "main.js")]
        public static partial void PlayMusic(string name, int times);

        [JSImport("SplashKitBackendWASM.resume_music", "main.js")]
        public static partial void ResumeMusic();

        [JSImport("SplashKitBackendWASM.set_music_volume", "main.js")]
        public static partial void SetMusicVolume(double volume);

        [JSImport("SplashKitBackendWASM.stop_music", "main.js")]
        public static partial void StopMusic();

        [JSImport("SplashKitBackendWASM.fade_all_sound_effects_out", "main.js")]
        public static partial void FadeAllSoundEffectsOut(int ms);

        [JSImport("SplashKitBackendWASM.free_all_sound_effects", "main.js")]
        public static partial void FreeAllSoundEffects();

        [JSImport("SplashKitBackendWASM.has_sound_effect", "main.js")]
        public static partial bool HasSoundEffect(string name);

        [JSImport("SplashKitBackendWASM.play_sound_effect", "main.js")]
        public static partial void PlaySoundEffect(string name);

        [JSImport("SplashKitBackendWASM.play_sound_effect", "main.js")]
        public static partial void PlaySoundEffect(string name, double volume);

        [JSImport("SplashKitBackendWASM.play_sound_effect", "main.js")]
        public static partial void PlaySoundEffect(string name, int times);

        [JSImport("SplashKitBackendWASM.play_sound_effect", "main.js")]
        public static partial void PlaySoundEffect(string name, int times, double volume);

        [JSImport("SplashKitBackendWASM.sound_effect_playing", "main.js")]
        public static partial bool SoundEffectPlaying(string name);

        [JSImport("SplashKitBackendWASM.stop_sound_effect", "main.js")]
        public static partial void StopSoundEffect(string name);

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

        [JSImport("SplashKitBackendWASM.number_of_displays", "main.js")]
        public static partial int NumberOfDisplays();

        [JSImport("SplashKitBackendWASM.refresh_screen", "main.js")]
        public static partial void RefreshScreen();

        [JSImport("SplashKitBackendWASM.screen_height", "main.js")]
        public static partial int ScreenHeight();

        [JSImport("SplashKitBackendWASM.screen_width", "main.js")]
        public static partial int ScreenWidth();

        [JSImport("SplashKitBackendWASM.take_screenshot", "main.js")]
        public static partial void TakeScreenshot(string basename);

        [JSImport("SplashKitBackendWASM.bitmap_height", "main.js")]
        public static partial int BitmapHeight(string name);

        [JSImport("SplashKitBackendWASM.bitmap_width", "main.js")]
        public static partial int BitmapWidth(string name);

        [JSImport("SplashKitBackendWASM.draw_bitmap", "main.js")]
        public static partial void DrawBitmap(string name, double x, double y);

        [JSImport("SplashKitBackendWASM.free_all_bitmaps", "main.js")]
        public static partial void FreeAllBitmaps();

        [JSImport("SplashKitBackendWASM.has_bitmap", "main.js")]
        public static partial bool HasBitmap(string name);

        [JSImport("SplashKitBackendWASM.font_has_size", "main.js")]
        public static partial bool FontHasSize(string name, int fontSize);

        [JSImport("SplashKitBackendWASM.font_load_size", "main.js")]
        public static partial void FontLoadSize(string name, int fontSize);

        [JSImport("SplashKitBackendWASM.free_all_fonts", "main.js")]
        public static partial void FreeAllFonts();

        [JSImport("SplashKitBackendWASM.has_font", "main.js")]
        public static partial bool HasFont(string name);

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

        [JSImport("SplashKitBackendWASM.set_interface_font", "main.js")]
        public static partial void SetInterfaceFont(string fnt);

        [JSImport("SplashKitBackendWASM.set_interface_font_size", "main.js")]
        public static partial void SetInterfaceFontSize(int size);

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
        public static partial string TextBox(string value);

        [JSImport("SplashKitBackendWASM.text_box", "main.js")]
        public static partial string TextBox(string labelText, string value);

        [JSImport("SplashKitBackendWASM.free_all_json", "main.js")]
        public static partial void FreeAllJson();

        [JSImport("SplashKitBackendWASM.close_log_process", "main.js")]
        public static partial void CloseLogProcess();

        [JSImport("SplashKitBackendWASM.accept_all_new_connections", "main.js")]
        public static partial bool AcceptAllNewConnections();

        [JSImport("SplashKitBackendWASM.broadcast_message", "main.js")]
        public static partial void BroadcastMessage(string aMsg);

        [JSImport("SplashKitBackendWASM.broadcast_message", "main.js")]
        public static partial void BroadcastMessage(string aMsg, string name);

        [JSImport("SplashKitBackendWASM.check_network_activity", "main.js")]
        public static partial void CheckNetworkActivity();

        [JSImport("SplashKitBackendWASM.clear_messages", "main.js")]
        public static partial void ClearMessages(string name);

        [JSImport("SplashKitBackendWASM.close_all_connections", "main.js")]
        public static partial void CloseAllConnections();

        [JSImport("SplashKitBackendWASM.close_all_servers", "main.js")]
        public static partial void CloseAllServers();

        [JSImport("SplashKitBackendWASM.close_connection", "main.js")]
        public static partial bool CloseConnection(string name);

        [JSImport("SplashKitBackendWASM.close_server", "main.js")]
        public static partial bool CloseServer(string name);

        [JSImport("SplashKitBackendWASM.has_connection", "main.js")]
        public static partial bool HasConnection(string name);

        [JSImport("SplashKitBackendWASM.has_messages", "main.js")]
        public static partial bool HasMessages();

        [JSImport("SplashKitBackendWASM.has_messages", "main.js")]
        public static partial bool HasMessages(string name);

        [JSImport("SplashKitBackendWASM.has_new_connections", "main.js")]
        public static partial bool HasNewConnections();

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

        [JSImport("SplashKitBackendWASM.is_connection_open", "main.js")]
        public static partial bool IsConnectionOpen(string name);

        [JSImport("SplashKitBackendWASM.is_valid_ipv4", "main.js")]
        public static partial bool IsValidIpv4(string ip);

        [JSImport("SplashKitBackendWASM.is_valid_mac", "main.js")]
        public static partial bool IsValidMac(string macAddress);

        [JSImport("SplashKitBackendWASM.mac_to_hex", "main.js")]
        public static partial string MacToHex(string macAddress);

        [JSImport("SplashKitBackendWASM.my_ip", "main.js")]
        public static partial string MyIP();

        [JSImport("SplashKitBackendWASM.read_message_data", "main.js")]
        public static partial string ReadMessageData(string name);

        [JSImport("SplashKitBackendWASM.reconnect", "main.js")]
        public static partial void Reconnect(string name);

        [JSImport("SplashKitBackendWASM.release_all_connections", "main.js")]
        public static partial void ReleaseAllConnections();

        [JSImport("SplashKitBackendWASM.send_message_to", "main.js")]
        public static partial bool SendMessageTo(string aMsg, string name);

        [JSImport("SplashKitBackendWASM.server_has_new_connection", "main.js")]
        public static partial bool ServerHasNewConnection(string name);

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

        [JSImport("SplashKitBackendWASM.create_sprite_pack", "main.js")]
        public static partial void CreateSpritePack(string name);

        [JSImport("SplashKitBackendWASM.current_sprite_pack", "main.js")]
        public static partial string CurrentSpritePack();

        [JSImport("SplashKitBackendWASM.draw_all_sprites", "main.js")]
        public static partial void DrawAllSprites();

        [JSImport("SplashKitBackendWASM.free_all_sprites", "main.js")]
        public static partial void FreeAllSprites();

        [JSImport("SplashKitBackendWASM.free_sprite_pack", "main.js")]
        public static partial void FreeSpritePack(string name);

        [JSImport("SplashKitBackendWASM.has_sprite", "main.js")]
        public static partial bool HasSprite(string name);

        [JSImport("SplashKitBackendWASM.has_sprite_pack", "main.js")]
        public static partial bool HasSpritePack(string name);

        [JSImport("SplashKitBackendWASM.select_sprite_pack", "main.js")]
        public static partial void SelectSpritePack(string name);

        [JSImport("SplashKitBackendWASM.update_all_sprites", "main.js")]
        public static partial void UpdateAllSprites();

        [JSImport("SplashKitBackendWASM.update_all_sprites", "main.js")]
        public static partial void UpdateAllSprites(float pct);

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

        [JSImport("SplashKitBackendWASM.free_all_timers", "main.js")]
        public static partial void FreeAllTimers();

        [JSImport("SplashKitBackendWASM.has_timer", "main.js")]
        public static partial bool HasTimer(string name);

        [JSImport("SplashKitBackendWASM.pause_timer", "main.js")]
        public static partial void PauseTimer(string name);

        [JSImport("SplashKitBackendWASM.reset_timer", "main.js")]
        public static partial void ResetTimer(string name);

        [JSImport("SplashKitBackendWASM.resume_timer", "main.js")]
        public static partial void ResumeTimer(string name);

        [JSImport("SplashKitBackendWASM.start_timer", "main.js")]
        public static partial void StartTimer(string name);

        [JSImport("SplashKitBackendWASM.stop_timer", "main.js")]
        public static partial void StopTimer(string name);

        [JSImport("SplashKitBackendWASM.timer_paused", "main.js")]
        public static partial bool TimerPaused(string name);

        [JSImport("SplashKitBackendWASM.timer_started", "main.js")]
        public static partial bool TimerStarted(string name);

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

        [JSImport("SplashKitBackendWASM.close_all_windows", "main.js")]
        public static partial void CloseAllWindows();

        [JSImport("SplashKitBackendWASM.close_current_window", "main.js")]
        public static partial void CloseCurrentWindow();

        [JSImport("SplashKitBackendWASM.close_window", "main.js")]
        public static partial void CloseWindow(string name);

        [JSImport("SplashKitBackendWASM.current_window_has_border", "main.js")]
        public static partial bool CurrentWindowHasBorder();

        [JSImport("SplashKitBackendWASM.current_window_height", "main.js")]
        public static partial int CurrentWindowHeight();

        [JSImport("SplashKitBackendWASM.current_window_is_fullscreen", "main.js")]
        public static partial bool CurrentWindowIsFullscreen();

        [JSImport("SplashKitBackendWASM.current_window_toggle_border", "main.js")]
        public static partial void CurrentWindowToggleBorder();

        [JSImport("SplashKitBackendWASM.current_window_toggle_fullscreen", "main.js")]
        public static partial void CurrentWindowToggleFullscreen();

        [JSImport("SplashKitBackendWASM.current_window_width", "main.js")]
        public static partial int CurrentWindowWidth();

        [JSImport("SplashKitBackendWASM.current_window_x", "main.js")]
        public static partial int CurrentWindowX();

        [JSImport("SplashKitBackendWASM.current_window_y", "main.js")]
        public static partial int CurrentWindowY();

        [JSImport("SplashKitBackendWASM.has_window", "main.js")]
        public static partial bool HasWindow(string caption);

        [JSImport("SplashKitBackendWASM.move_current_window_to", "main.js")]
        public static partial void MoveCurrentWindowTo(int x, int y);

        [JSImport("SplashKitBackendWASM.move_window_to", "main.js")]
        public static partial void MoveWindowTo(string name, int x, int y);

        [JSImport("SplashKitBackendWASM.resize_current_window", "main.js")]
        public static partial void ResizeCurrentWindow(int width, int height);

        [JSImport("SplashKitBackendWASM.set_current_window", "main.js")]
        public static partial void SetCurrentWindow(string name);

        [JSImport("SplashKitBackendWASM.window_close_requested", "main.js")]
        public static partial bool WindowCloseRequested(string name);

        [JSImport("SplashKitBackendWASM.window_has_border", "main.js")]
        public static partial bool WindowHasBorder(string name);

        [JSImport("SplashKitBackendWASM.window_height", "main.js")]
        public static partial int WindowHeight(string name);

        [JSImport("SplashKitBackendWASM.window_is_fullscreen", "main.js")]
        public static partial bool WindowIsFullscreen(string name);

        [JSImport("SplashKitBackendWASM.window_toggle_border", "main.js")]
        public static partial void WindowToggleBorder(string name);

        [JSImport("SplashKitBackendWASM.window_toggle_fullscreen", "main.js")]
        public static partial void WindowToggleFullscreen(string name);

        [JSImport("SplashKitBackendWASM.window_width", "main.js")]
        public static partial int WindowWidth(string name);

        [JSImport("SplashKitBackendWASM.window_x", "main.js")]
        public static partial int WindowX(string name);

        [JSImport("SplashKitBackendWASM.window_y", "main.js")]
        public static partial int WindowY(string name);

    }
}