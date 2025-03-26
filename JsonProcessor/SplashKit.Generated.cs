using System.Runtime.InteropServices.JavaScript;

namespace SplashKitSDK
{
    public partial class SplashKit
    {
        [JSImport("", "main.js")]
        public static partial  animation_count();

        [JSImport("", "main.js")]
        public static partial  animation_current_cell();

        [JSImport("", "main.js")]
        public static partial  animation_current_vector();

        [JSImport("", "main.js")]
        public static partial  animation_ended();

        [JSImport("", "main.js")]
        public static partial  animation_entered_frame();

        [JSImport("", "main.js")]
        public static partial  animation_frame_time();

        [JSImport("", "main.js")]
        public static partial  animation_index();

        [JSImport("", "main.js")]
        public static partial  animation_name();

        [JSImport("", "main.js")]
        public static partial  animation_script_name();

        [JSImport("", "main.js")]
        public static partial  animation_script_named();

        [JSImport("", "main.js")]
        public static partial  assign_animation();

        [JSImport("", "main.js")]
        public static partial  create_animation();

        [JSImport("", "main.js")]
        public static partial  free_all_animation_scripts();

        [JSImport("", "main.js")]
        public static partial  free_animation();

        [JSImport("", "main.js")]
        public static partial  free_animation_script();

        [JSImport("", "main.js")]
        public static partial  has_animation_named();

        [JSImport("", "main.js")]
        public static partial  has_animation_script();

        [JSImport("", "main.js")]
        public static partial  load_animation_script();

        [JSImport("", "main.js")]
        public static partial  restart_animation();

        [JSImport("", "main.js")]
        public static partial  update_animation();

        [JSImport("", "main.js")]
        public static partial  audio_ready();

        [JSImport("", "main.js")]
        public static partial  close_audio();

        [JSImport("", "main.js")]
        public static partial  open_audio();

        [JSImport("", "main.js")]
        public static partial  fade_music_in();

        [JSImport("", "main.js")]
        public static partial  fade_music_out();

        [JSImport("", "main.js")]
        public static partial  free_all_music();

        [JSImport("", "main.js")]
        public static partial  free_music();

        [JSImport("", "main.js")]
        public static partial  has_music();

        [JSImport("", "main.js")]
        public static partial  load_music();

        [JSImport("", "main.js")]
        public static partial  music_filename();

        [JSImport("", "main.js")]
        public static partial  music_name();

        [JSImport("", "main.js")]
        public static partial  music_named();

        [JSImport("", "main.js")]
        public static partial  music_playing();

        [JSImport("", "main.js")]
        public static partial  music_valid();

        [JSImport("", "main.js")]
        public static partial  music_volume();

        [JSImport("", "main.js")]
        public static partial  pause_music();

        [JSImport("", "main.js")]
        public static partial  play_music();

        [JSImport("", "main.js")]
        public static partial  resume_music();

        [JSImport("", "main.js")]
        public static partial  set_music_volume();

        [JSImport("", "main.js")]
        public static partial  stop_music();

        [JSImport("", "main.js")]
        public static partial  fade_all_sound_effects_out();

        [JSImport("", "main.js")]
        public static partial  fade_sound_effect_out();

        [JSImport("", "main.js")]
        public static partial  free_all_sound_effects();

        [JSImport("", "main.js")]
        public static partial  free_sound_effect();

        [JSImport("", "main.js")]
        public static partial  has_sound_effect();

        [JSImport("", "main.js")]
        public static partial  load_sound_effect();

        [JSImport("", "main.js")]
        public static partial  play_sound_effect();

        [JSImport("", "main.js")]
        public static partial  sound_effect_filename();

        [JSImport("", "main.js")]
        public static partial  sound_effect_name();

        [JSImport("", "main.js")]
        public static partial  sound_effect_named();

        [JSImport("", "main.js")]
        public static partial  sound_effect_playing();

        [JSImport("", "main.js")]
        public static partial  sound_effect_valid();

        [JSImport("", "main.js")]
        public static partial  stop_sound_effect();

        [JSImport("", "main.js")]
        public static partial  camera_position();

        [JSImport("", "main.js")]
        public static partial  camera_x();

        [JSImport("", "main.js")]
        public static partial  camera_y();

        [JSImport("", "main.js")]
        public static partial  center_camera_on();

        [JSImport("", "main.js")]
        public static partial  move_camera_by();

        [JSImport("", "main.js")]
        public static partial  move_camera_to();

        [JSImport("", "main.js")]
        public static partial  point_in_window();

        [JSImport("", "main.js")]
        public static partial  point_on_screen();

        [JSImport("", "main.js")]
        public static partial  rect_in_window();

        [JSImport("", "main.js")]
        public static partial  rect_on_screen();

        [JSImport("", "main.js")]
        public static partial  screen_center();

        [JSImport("", "main.js")]
        public static partial  screen_rectangle();

        [JSImport("", "main.js")]
        public static partial  set_camera_position();

        [JSImport("", "main.js")]
        public static partial  set_camera_x();

        [JSImport("", "main.js")]
        public static partial  set_camera_y();

        [JSImport("", "main.js")]
        public static partial  to_screen();

        [JSImport("", "main.js")]
        public static partial  to_screen_x();

        [JSImport("", "main.js")]
        public static partial  to_screen_y();

        [JSImport("", "main.js")]
        public static partial  to_world();

        [JSImport("", "main.js")]
        public static partial  to_world_x();

        [JSImport("", "main.js")]
        public static partial  to_world_y();

        [JSImport("", "main.js")]
        public static partial  vector_world_to_screen();

        [JSImport("", "main.js")]
        public static partial  window_area();

        [JSImport("", "main.js")]
        public static partial  alpha_of();

        [JSImport("", "main.js")]
        public static partial  blue_of();

        [JSImport("", "main.js")]
        public static partial  brightness_of();

        [JSImport("", "main.js")]
        public static partial  color_alice_blue();

        [JSImport("", "main.js")]
        public static partial  color_antique_white();

        [JSImport("", "main.js")]
        public static partial  color_aqua();

        [JSImport("", "main.js")]
        public static partial  color_aquamarine();

        [JSImport("", "main.js")]
        public static partial  color_azure();

        [JSImport("", "main.js")]
        public static partial  color_beige();

        [JSImport("", "main.js")]
        public static partial  color_bisque();

        [JSImport("", "main.js")]
        public static partial  color_black();

        [JSImport("", "main.js")]
        public static partial  color_blanched_almond();

        [JSImport("", "main.js")]
        public static partial  color_blue();

        [JSImport("", "main.js")]
        public static partial  color_blue_violet();

        [JSImport("", "main.js")]
        public static partial  color_bright_green();

        [JSImport("", "main.js")]
        public static partial  color_brown();

        [JSImport("", "main.js")]
        public static partial  color_burly_wood();

        [JSImport("", "main.js")]
        public static partial  color_cadet_blue();

        [JSImport("", "main.js")]
        public static partial  color_chartreuse();

        [JSImport("", "main.js")]
        public static partial  color_chocolate();

        [JSImport("", "main.js")]
        public static partial  color_coral();

        [JSImport("", "main.js")]
        public static partial  color_cornflower_blue();

        [JSImport("", "main.js")]
        public static partial  color_cornsilk();

        [JSImport("", "main.js")]
        public static partial  color_crimson();

        [JSImport("", "main.js")]
        public static partial  color_cyan();

        [JSImport("", "main.js")]
        public static partial  color_dark_blue();

        [JSImport("", "main.js")]
        public static partial  color_dark_cyan();

        [JSImport("", "main.js")]
        public static partial  color_dark_goldenrod();

        [JSImport("", "main.js")]
        public static partial  color_dark_gray();

        [JSImport("", "main.js")]
        public static partial  color_dark_green();

        [JSImport("", "main.js")]
        public static partial  color_dark_khaki();

        [JSImport("", "main.js")]
        public static partial  color_dark_magenta();

        [JSImport("", "main.js")]
        public static partial  color_dark_olive_green();

        [JSImport("", "main.js")]
        public static partial  color_dark_orange();

        [JSImport("", "main.js")]
        public static partial  color_dark_orchid();

        [JSImport("", "main.js")]
        public static partial  color_dark_red();

        [JSImport("", "main.js")]
        public static partial  color_dark_salmon();

        [JSImport("", "main.js")]
        public static partial  color_dark_sea_green();

        [JSImport("", "main.js")]
        public static partial  color_dark_slate_blue();

        [JSImport("", "main.js")]
        public static partial  color_dark_slate_gray();

        [JSImport("", "main.js")]
        public static partial  color_dark_turquoise();

        [JSImport("", "main.js")]
        public static partial  color_dark_violet();

        [JSImport("", "main.js")]
        public static partial  color_deep_pink();

        [JSImport("", "main.js")]
        public static partial  color_deep_sky_blue();

        [JSImport("", "main.js")]
        public static partial  color_dim_gray();

        [JSImport("", "main.js")]
        public static partial  color_dodger_blue();

        [JSImport("", "main.js")]
        public static partial  color_firebrick();

        [JSImport("", "main.js")]
        public static partial  color_floral_white();

        [JSImport("", "main.js")]
        public static partial  color_forest_green();

        [JSImport("", "main.js")]
        public static partial  color_fuchsia();

        [JSImport("", "main.js")]
        public static partial  color_gainsboro();

        [JSImport("", "main.js")]
        public static partial  color_ghost_white();

        [JSImport("", "main.js")]
        public static partial  color_gold();

        [JSImport("", "main.js")]
        public static partial  color_goldenrod();

        [JSImport("", "main.js")]
        public static partial  color_gray();

        [JSImport("", "main.js")]
        public static partial  color_green();

        [JSImport("", "main.js")]
        public static partial  color_green_yellow();

        [JSImport("", "main.js")]
        public static partial  color_honeydew();

        [JSImport("", "main.js")]
        public static partial  color_hot_pink();

        [JSImport("", "main.js")]
        public static partial  color_indian_red();

        [JSImport("", "main.js")]
        public static partial  color_indigo();

        [JSImport("", "main.js")]
        public static partial  color_ivory();

        [JSImport("", "main.js")]
        public static partial  color_khaki();

        [JSImport("", "main.js")]
        public static partial  color_lavender();

        [JSImport("", "main.js")]
        public static partial  color_lavender_blush();

        [JSImport("", "main.js")]
        public static partial  color_lawn_green();

        [JSImport("", "main.js")]
        public static partial  color_lemon_chiffon();

        [JSImport("", "main.js")]
        public static partial  color_light_blue();

        [JSImport("", "main.js")]
        public static partial  color_light_coral();

        [JSImport("", "main.js")]
        public static partial  color_light_cyan();

        [JSImport("", "main.js")]
        public static partial  color_light_goldenrod_yellow();

        [JSImport("", "main.js")]
        public static partial  color_light_gray();

        [JSImport("", "main.js")]
        public static partial  color_light_green();

        [JSImport("", "main.js")]
        public static partial  color_light_pink();

        [JSImport("", "main.js")]
        public static partial  color_light_salmon();

        [JSImport("", "main.js")]
        public static partial  color_light_sea_green();

        [JSImport("", "main.js")]
        public static partial  color_light_sky_blue();

        [JSImport("", "main.js")]
        public static partial  color_light_slate_gray();

        [JSImport("", "main.js")]
        public static partial  color_light_steel_blue();

        [JSImport("", "main.js")]
        public static partial  color_light_yellow();

        [JSImport("", "main.js")]
        public static partial  color_lime();

        [JSImport("", "main.js")]
        public static partial  color_lime_green();

        [JSImport("", "main.js")]
        public static partial  color_linen();

        [JSImport("", "main.js")]
        public static partial  color_magenta();

        [JSImport("", "main.js")]
        public static partial  color_maroon();

        [JSImport("", "main.js")]
        public static partial  color_medium_aquamarine();

        [JSImport("", "main.js")]
        public static partial  color_medium_blue();

        [JSImport("", "main.js")]
        public static partial  color_medium_orchid();

        [JSImport("", "main.js")]
        public static partial  color_medium_purple();

        [JSImport("", "main.js")]
        public static partial  color_medium_sea_green();

        [JSImport("", "main.js")]
        public static partial  color_medium_slate_blue();

        [JSImport("", "main.js")]
        public static partial  color_medium_spring_green();

        [JSImport("", "main.js")]
        public static partial  color_medium_turquoise();

        [JSImport("", "main.js")]
        public static partial  color_medium_violet_red();

        [JSImport("", "main.js")]
        public static partial  color_midnight_blue();

        [JSImport("", "main.js")]
        public static partial  color_mint_cream();

        [JSImport("", "main.js")]
        public static partial  color_misty_rose();

        [JSImport("", "main.js")]
        public static partial  color_moccasin();

        [JSImport("", "main.js")]
        public static partial  color_navajo_white();

        [JSImport("", "main.js")]
        public static partial  color_navy();

        [JSImport("", "main.js")]
        public static partial  color_old_lace();

        [JSImport("", "main.js")]
        public static partial  color_olive();

        [JSImport("", "main.js")]
        public static partial  color_olive_drab();

        [JSImport("", "main.js")]
        public static partial  color_orange();

        [JSImport("", "main.js")]
        public static partial  color_orange_red();

        [JSImport("", "main.js")]
        public static partial  color_orchid();

        [JSImport("", "main.js")]
        public static partial  color_pale_goldenrod();

        [JSImport("", "main.js")]
        public static partial  color_pale_green();

        [JSImport("", "main.js")]
        public static partial  color_pale_turquoise();

        [JSImport("", "main.js")]
        public static partial  color_pale_violet_red();

        [JSImport("", "main.js")]
        public static partial  color_papaya_whip();

        [JSImport("", "main.js")]
        public static partial  color_peach_puff();

        [JSImport("", "main.js")]
        public static partial  color_peru();

        [JSImport("", "main.js")]
        public static partial  color_pink();

        [JSImport("", "main.js")]
        public static partial  color_plum();

        [JSImport("", "main.js")]
        public static partial  color_powder_blue();

        [JSImport("", "main.js")]
        public static partial  color_purple();

        [JSImport("", "main.js")]
        public static partial  color_red();

        [JSImport("", "main.js")]
        public static partial  color_rosy_brown();

        [JSImport("", "main.js")]
        public static partial  color_royal_blue();

        [JSImport("", "main.js")]
        public static partial  color_saddle_brown();

        [JSImport("", "main.js")]
        public static partial  color_salmon();

        [JSImport("", "main.js")]
        public static partial  color_sandy_brown();

        [JSImport("", "main.js")]
        public static partial  color_sea_green();

        [JSImport("", "main.js")]
        public static partial  color_sea_shell();

        [JSImport("", "main.js")]
        public static partial  color_sienna();

        [JSImport("", "main.js")]
        public static partial  color_silver();

        [JSImport("", "main.js")]
        public static partial  color_sky_blue();

        [JSImport("", "main.js")]
        public static partial  color_slate_blue();

        [JSImport("", "main.js")]
        public static partial  color_slate_gray();

        [JSImport("", "main.js")]
        public static partial  color_snow();

        [JSImport("", "main.js")]
        public static partial  color_spring_green();

        [JSImport("", "main.js")]
        public static partial  color_steel_blue();

        [JSImport("", "main.js")]
        public static partial  color_swinburne_red();

        [JSImport("", "main.js")]
        public static partial  color_tan();

        [JSImport("", "main.js")]
        public static partial  color_teal();

        [JSImport("", "main.js")]
        public static partial  color_thistle();

        [JSImport("", "main.js")]
        public static partial  color_to_string();

        [JSImport("", "main.js")]
        public static partial  color_tomato();

        [JSImport("", "main.js")]
        public static partial  color_transparent();

        [JSImport("", "main.js")]
        public static partial  color_turquoise();

        [JSImport("", "main.js")]
        public static partial  color_violet();

        [JSImport("", "main.js")]
        public static partial  color_wheat();

        [JSImport("", "main.js")]
        public static partial  color_white();

        [JSImport("", "main.js")]
        public static partial  color_white_smoke();

        [JSImport("", "main.js")]
        public static partial  color_yellow();

        [JSImport("", "main.js")]
        public static partial  color_yellow_green();

        [JSImport("", "main.js")]
        public static partial  green_of();

        [JSImport("", "main.js")]
        public static partial  hsb_color();

        [JSImport("", "main.js")]
        public static partial  hue_of();

        [JSImport("", "main.js")]
        public static partial  random_color();

        [JSImport("", "main.js")]
        public static partial  random_rgb_color();

        [JSImport("", "main.js")]
        public static partial  red_of();

        [JSImport("", "main.js")]
        public static partial  rgb_color();

        [JSImport("", "main.js")]
        public static partial  rgba_color();

        [JSImport("", "main.js")]
        public static partial  saturation_of();

        [JSImport("", "main.js")]
        public static partial  string_to_color();

        [JSImport("", "main.js")]
        public static partial  center_point();

        [JSImport("", "main.js")]
        public static partial  circle_at();

        [JSImport("", "main.js")]
        public static partial  circle_radius();

        [JSImport("", "main.js")]
        public static partial  circle_x();

        [JSImport("", "main.js")]
        public static partial  circle_y();

        [JSImport("", "main.js")]
        public static partial  circles_intersect();

        [JSImport("", "main.js")]
        public static partial  closest_point_on_circle();

        [JSImport("", "main.js")]
        public static partial  closest_point_on_line_from_circle();

        [JSImport("", "main.js")]
        public static partial  closest_point_on_rect_from_circle();

        [JSImport("", "main.js")]
        public static partial  distant_point_on_circle();

        [JSImport("", "main.js")]
        public static partial  distant_point_on_circle_heading();

        [JSImport("", "main.js")]
        public static partial  ray_circle_intersect_distance();

        [JSImport("", "main.js")]
        public static partial  tangent_points();

        [JSImport("", "main.js")]
        public static partial  widest_points();

        [JSImport("", "main.js")]
        public static partial  cosine();

        [JSImport("", "main.js")]
        public static partial  sine();

        [JSImport("", "main.js")]
        public static partial  tangent();

        [JSImport("", "main.js")]
        public static partial  closest_point_on_line();

        [JSImport("", "main.js")]
        public static partial  closest_point_on_lines();

        [JSImport("", "main.js")]
        public static partial  line_from();

        [JSImport("", "main.js")]
        public static partial  line_intersection_point();

        [JSImport("", "main.js")]
        public static partial  line_intersects_circle();

        [JSImport("", "main.js")]
        public static partial  line_intersects_lines();

        [JSImport("", "main.js")]
        public static partial  line_intersects_rect();

        [JSImport("", "main.js")]
        public static partial  line_length();

        [JSImport("", "main.js")]
        public static partial  line_length_squared();

        [JSImport("", "main.js")]
        public static partial  line_mid_point();

        [JSImport("", "main.js")]
        public static partial  line_normal();

        [JSImport("", "main.js")]
        public static partial  line_to_string();

        [JSImport("", "main.js")]
        public static partial  lines_from();

        [JSImport("", "main.js")]
        public static partial  lines_intersect();

        [JSImport("", "main.js")]
        public static partial  point_at();

        [JSImport("", "main.js")]
        public static partial  point_at_origin();

        [JSImport("", "main.js")]
        public static partial  point_in_circle();

        [JSImport("", "main.js")]
        public static partial  point_in_quad();

        [JSImport("", "main.js")]
        public static partial  point_in_rectangle();

        [JSImport("", "main.js")]
        public static partial  point_in_triangle();

        [JSImport("", "main.js")]
        public static partial  point_line_distance();

        [JSImport("", "main.js")]
        public static partial  point_offset_by();

        [JSImport("", "main.js")]
        public static partial  point_offset_from_origin();

        [JSImport("", "main.js")]
        public static partial  point_on_line();

        [JSImport("", "main.js")]
        public static partial  point_point_angle();

        [JSImport("", "main.js")]
        public static partial  point_point_distance();

        [JSImport("", "main.js")]
        public static partial  point_to_string();

        [JSImport("", "main.js")]
        public static partial  random_bitmap_point();

        [JSImport("", "main.js")]
        public static partial  random_screen_point();

        [JSImport("", "main.js")]
        public static partial  random_window_point();

        [JSImport("", "main.js")]
        public static partial  same_point();

        [JSImport("", "main.js")]
        public static partial  quad_from();

        [JSImport("", "main.js")]
        public static partial  quads_intersect();

        [JSImport("", "main.js")]
        public static partial  set_quad_point();

        [JSImport("", "main.js")]
        public static partial  triangles_from();

        [JSImport("", "main.js")]
        public static partial  inset_rectangle();

        [JSImport("", "main.js")]
        public static partial  intersection();

        [JSImport("", "main.js")]
        public static partial  rectangle_around();

        [JSImport("", "main.js")]
        public static partial  rectangle_bottom();

        [JSImport("", "main.js")]
        public static partial  rectangle_center();

        [JSImport("", "main.js")]
        public static partial  rectangle_from();

        [JSImport("", "main.js")]
        public static partial  rectangle_left();

        [JSImport("", "main.js")]
        public static partial  rectangle_offset_by();

        [JSImport("", "main.js")]
        public static partial  rectangle_right();

        [JSImport("", "main.js")]
        public static partial  rectangle_to_string();

        [JSImport("", "main.js")]
        public static partial  rectangle_top();

        [JSImport("", "main.js")]
        public static partial  rectangles_intersect();

        [JSImport("", "main.js")]
        public static partial  triangle_barycenter();

        [JSImport("", "main.js")]
        public static partial  triangle_from();

        [JSImport("", "main.js")]
        public static partial  triangle_rectangle_intersect();

        [JSImport("", "main.js")]
        public static partial  triangle_to_string();

        [JSImport("", "main.js")]
        public static partial  triangles_intersect();

        [JSImport("", "main.js")]
        public static partial  draw_circle();

        [JSImport("", "main.js")]
        public static partial  draw_circle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_circle_on_window();

        [JSImport("", "main.js")]
        public static partial  fill_circle();

        [JSImport("", "main.js")]
        public static partial  fill_circle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  fill_circle_on_window();

        [JSImport("", "main.js")]
        public static partial  current_clip();

        [JSImport("", "main.js")]
        public static partial  pop_clip();

        [JSImport("", "main.js")]
        public static partial  push_clip();

        [JSImport("", "main.js")]
        public static partial  reset_clip();

        [JSImport("", "main.js")]
        public static partial  set_clip();

        [JSImport("", "main.js")]
        public static partial  option_defaults();

        [JSImport("", "main.js")]
        public static partial  option_draw_to();

        [JSImport("", "main.js")]
        public static partial  option_flip_x();

        [JSImport("", "main.js")]
        public static partial  option_flip_xy();

        [JSImport("", "main.js")]
        public static partial  option_flip_y();

        [JSImport("", "main.js")]
        public static partial  option_line_width();

        [JSImport("", "main.js")]
        public static partial  option_part_bmp();

        [JSImport("", "main.js")]
        public static partial  option_rotate_bmp();

        [JSImport("", "main.js")]
        public static partial  option_scale_bmp();

        [JSImport("", "main.js")]
        public static partial  option_to_screen();

        [JSImport("", "main.js")]
        public static partial  option_to_world();

        [JSImport("", "main.js")]
        public static partial  option_with_animation();

        [JSImport("", "main.js")]
        public static partial  option_with_bitmap_cell();

        [JSImport("", "main.js")]
        public static partial  draw_ellipse();

        [JSImport("", "main.js")]
        public static partial  draw_ellipse_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_ellipse_on_window();

        [JSImport("", "main.js")]
        public static partial  fill_ellipse();

        [JSImport("", "main.js")]
        public static partial  fill_ellipse_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  fill_ellipse_on_window();

        [JSImport("", "main.js")]
        public static partial  clear_screen();

        [JSImport("", "main.js")]
        public static partial  display_details();

        [JSImport("", "main.js")]
        public static partial  display_height();

        [JSImport("", "main.js")]
        public static partial  display_name();

        [JSImport("", "main.js")]
        public static partial  display_width();

        [JSImport("", "main.js")]
        public static partial  display_x();

        [JSImport("", "main.js")]
        public static partial  display_y();

        [JSImport("", "main.js")]
        public static partial  number_of_displays();

        [JSImport("", "main.js")]
        public static partial  refresh_screen();

        [JSImport("", "main.js")]
        public static partial  save_bitmap();

        [JSImport("", "main.js")]
        public static partial  screen_height();

        [JSImport("", "main.js")]
        public static partial  screen_width();

        [JSImport("", "main.js")]
        public static partial  take_screenshot();

        [JSImport("", "main.js")]
        public static partial  bitmap_bounding_circle();

        [JSImport("", "main.js")]
        public static partial  bitmap_bounding_rectangle();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_center();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_circle();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_columns();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_count();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_height();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_offset();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_rectangle();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_rows();

        [JSImport("", "main.js")]
        public static partial  bitmap_cell_width();

        [JSImport("", "main.js")]
        public static partial  bitmap_center();

        [JSImport("", "main.js")]
        public static partial  bitmap_filename();

        [JSImport("", "main.js")]
        public static partial  bitmap_height();

        [JSImport("", "main.js")]
        public static partial  bitmap_name();

        [JSImport("", "main.js")]
        public static partial  bitmap_named();

        [JSImport("", "main.js")]
        public static partial  bitmap_rectangle_of_cell();

        [JSImport("", "main.js")]
        public static partial  bitmap_set_cell_details();

        [JSImport("", "main.js")]
        public static partial  bitmap_valid();

        [JSImport("", "main.js")]
        public static partial  bitmap_width();

        [JSImport("", "main.js")]
        public static partial  clear_bitmap();

        [JSImport("", "main.js")]
        public static partial  create_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_bitmap_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_bitmap_on_window();

        [JSImport("", "main.js")]
        public static partial  free_all_bitmaps();

        [JSImport("", "main.js")]
        public static partial  free_bitmap();

        [JSImport("", "main.js")]
        public static partial  has_bitmap();

        [JSImport("", "main.js")]
        public static partial  load_bitmap();

        [JSImport("", "main.js")]
        public static partial  pixel_drawn_at_point();

        [JSImport("", "main.js")]
        public static partial  setup_collision_mask();

        [JSImport("", "main.js")]
        public static partial  draw_line();

        [JSImport("", "main.js")]
        public static partial  draw_line_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_line_on_window();

        [JSImport("", "main.js")]
        public static partial  draw_pixel();

        [JSImport("", "main.js")]
        public static partial  draw_pixel_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_pixel_on_window();

        [JSImport("", "main.js")]
        public static partial  get_pixel();

        [JSImport("", "main.js")]
        public static partial  get_pixel_from_window();

        [JSImport("", "main.js")]
        public static partial  draw_quad();

        [JSImport("", "main.js")]
        public static partial  draw_quad_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_quad_on_window();

        [JSImport("", "main.js")]
        public static partial  draw_rectangle();

        [JSImport("", "main.js")]
        public static partial  draw_rectangle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_rectangle_on_window();

        [JSImport("", "main.js")]
        public static partial  fill_quad();

        [JSImport("", "main.js")]
        public static partial  fill_quad_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  fill_quad_on_window();

        [JSImport("", "main.js")]
        public static partial  fill_rectangle();

        [JSImport("", "main.js")]
        public static partial  fill_rectangle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  fill_rectangle_on_window();

        [JSImport("", "main.js")]
        public static partial  draw_text();

        [JSImport("", "main.js")]
        public static partial  draw_text_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_text_on_window();

        [JSImport("", "main.js")]
        public static partial  font_has_size();

        [JSImport("", "main.js")]
        public static partial  font_load_size();

        [JSImport("", "main.js")]
        public static partial  font_named();

        [JSImport("", "main.js")]
        public static partial  free_all_fonts();

        [JSImport("", "main.js")]
        public static partial  free_font();

        [JSImport("", "main.js")]
        public static partial  get_font_style();

        [JSImport("", "main.js")]
        public static partial  has_font();

        [JSImport("", "main.js")]
        public static partial  load_font();

        [JSImport("", "main.js")]
        public static partial  set_font_style();

        [JSImport("", "main.js")]
        public static partial  text_height();

        [JSImport("", "main.js")]
        public static partial  text_width();

        [JSImport("", "main.js")]
        public static partial  draw_triangle();

        [JSImport("", "main.js")]
        public static partial  draw_triangle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  draw_triangle_on_window();

        [JSImport("", "main.js")]
        public static partial  fill_triangle();

        [JSImport("", "main.js")]
        public static partial  fill_triangle_on_bitmap();

        [JSImport("", "main.js")]
        public static partial  fill_triangle_on_window();

        [JSImport("", "main.js")]
        public static partial  process_events();

        [JSImport("", "main.js")]
        public static partial  quit_requested();

        [JSImport("", "main.js")]
        public static partial  reset_quit();

        [JSImport("", "main.js")]
        public static partial  any_key_pressed();

        [JSImport("", "main.js")]
        public static partial  deregister_callback_on_key_down();

        [JSImport("", "main.js")]
        public static partial  deregister_callback_on_key_typed();

        [JSImport("", "main.js")]
        public static partial  deregister_callback_on_key_up();

        [JSImport("", "main.js")]
        public static partial  key_down();

        [JSImport("", "main.js")]
        public static partial  key_name();

        [JSImport("", "main.js")]
        public static partial  key_released();

        [JSImport("", "main.js")]
        public static partial  key_typed();

        [JSImport("", "main.js")]
        public static partial  key_up();

        [JSImport("", "main.js")]
        public static partial  register_callback_on_key_down();

        [JSImport("", "main.js")]
        public static partial  register_callback_on_key_typed();

        [JSImport("", "main.js")]
        public static partial  register_callback_on_key_up();

        [JSImport("", "main.js")]
        public static partial  hide_mouse();

        [JSImport("", "main.js")]
        public static partial  mouse_clicked();

        [JSImport("", "main.js")]
        public static partial  mouse_down();

        [JSImport("", "main.js")]
        public static partial  mouse_movement();

        [JSImport("", "main.js")]
        public static partial  mouse_position();

        [JSImport("", "main.js")]
        public static partial  mouse_position_vector();

        [JSImport("", "main.js")]
        public static partial  mouse_shown();

        [JSImport("", "main.js")]
        public static partial  mouse_up();

        [JSImport("", "main.js")]
        public static partial  mouse_wheel_scroll();

        [JSImport("", "main.js")]
        public static partial  mouse_x();

        [JSImport("", "main.js")]
        public static partial  mouse_y();

        [JSImport("", "main.js")]
        public static partial  move_mouse();

        [JSImport("", "main.js")]
        public static partial  show_mouse();

        [JSImport("", "main.js")]
        public static partial  draw_collected_text();

        [JSImport("", "main.js")]
        public static partial  end_reading_text();

        [JSImport("", "main.js")]
        public static partial  reading_text();

        [JSImport("", "main.js")]
        public static partial  start_reading_text();

        [JSImport("", "main.js")]
        public static partial  text_entry_cancelled();

        [JSImport("", "main.js")]
        public static partial  text_input();

        [JSImport("", "main.js")]
        public static partial  create_json();

        [JSImport("", "main.js")]
        public static partial  free_all_json();

        [JSImport("", "main.js")]
        public static partial  free_json();

        [JSImport("", "main.js")]
        public static partial  json_count_keys();

        [JSImport("", "main.js")]
        public static partial  json_from_color();

        [JSImport("", "main.js")]
        public static partial  json_from_file();

        [JSImport("", "main.js")]
        public static partial  json_from_string();

        [JSImport("", "main.js")]
        public static partial  json_has_key();

        [JSImport("", "main.js")]
        public static partial  json_read_array();

        [JSImport("", "main.js")]
        public static partial  json_read_bool();

        [JSImport("", "main.js")]
        public static partial  json_read_number();

        [JSImport("", "main.js")]
        public static partial  json_read_number_as_double();

        [JSImport("", "main.js")]
        public static partial  json_read_number_as_int();

        [JSImport("", "main.js")]
        public static partial  json_read_object();

        [JSImport("", "main.js")]
        public static partial  json_read_string();

        [JSImport("", "main.js")]
        public static partial  json_set_array();

        [JSImport("", "main.js")]
        public static partial  json_set_bool();

        [JSImport("", "main.js")]
        public static partial  json_set_number();

        [JSImport("", "main.js")]
        public static partial  json_set_object();

        [JSImport("", "main.js")]
        public static partial  json_set_string();

        [JSImport("", "main.js")]
        public static partial  json_to_color();

        [JSImport("", "main.js")]
        public static partial  json_to_file();

        [JSImport("", "main.js")]
        public static partial  json_to_string();

        [JSImport("", "main.js")]
        public static partial  close_log_process();

        [JSImport("", "main.js")]
        public static partial  init_custom_logger();

        [JSImport("", "main.js")]
        public static partial  log();

        [JSImport("", "main.js")]
        public static partial  accept_all_new_connections();

        [JSImport("", "main.js")]
        public static partial  accept_new_connection();

        [JSImport("", "main.js")]
        public static partial  broadcast_message();

        [JSImport("", "main.js")]
        public static partial  check_network_activity();

        [JSImport("", "main.js")]
        public static partial  clear_messages();

        [JSImport("", "main.js")]
        public static partial  close_all_connections();

        [JSImport("", "main.js")]
        public static partial  close_all_servers();

        [JSImport("", "main.js")]
        public static partial  close_connection();

        [JSImport("", "main.js")]
        public static partial  close_message();

        [JSImport("", "main.js")]
        public static partial  close_server();

        [JSImport("", "main.js")]
        public static partial  connection_count();

        [JSImport("", "main.js")]
        public static partial  connection_ip();

        [JSImport("", "main.js")]
        public static partial  connection_named();

        [JSImport("", "main.js")]
        public static partial  connection_port();

        [JSImport("", "main.js")]
        public static partial  create_server();

        [JSImport("", "main.js")]
        public static partial  dec_to_hex();

        [JSImport("", "main.js")]
        public static partial  fetch_new_connection();

        [JSImport("", "main.js")]
        public static partial  has_connection();

        [JSImport("", "main.js")]
        public static partial  has_messages();

        [JSImport("", "main.js")]
        public static partial  has_new_connections();

        [JSImport("", "main.js")]
        public static partial  has_server();

        [JSImport("", "main.js")]
        public static partial  hex_str_to_ipv4();

        [JSImport("", "main.js")]
        public static partial  hex_to_dec_string();

        [JSImport("", "main.js")]
        public static partial  ipv4_to_dec();

        [JSImport("", "main.js")]
        public static partial  ipv4_to_hex();

        [JSImport("", "main.js")]
        public static partial  ipv4_to_str();

        [JSImport("", "main.js")]
        public static partial  is_connection_open();

        [JSImport("", "main.js")]
        public static partial  last_connection();

        [JSImport("", "main.js")]
        public static partial  message_connection();

        [JSImport("", "main.js")]
        public static partial  message_count();

        [JSImport("", "main.js")]
        public static partial  message_data();

        [JSImport("", "main.js")]
        public static partial  message_data_bytes();

        [JSImport("", "main.js")]
        public static partial  message_host();

        [JSImport("", "main.js")]
        public static partial  message_port();

        [JSImport("", "main.js")]
        public static partial  message_protocol();

        [JSImport("", "main.js")]
        public static partial  my_ip();

        [JSImport("", "main.js")]
        public static partial  name_for_connection();

        [JSImport("", "main.js")]
        public static partial  new_connection_count();

        [JSImport("", "main.js")]
        public static partial  open_connection();

        [JSImport("", "main.js")]
        public static partial  read_message();

        [JSImport("", "main.js")]
        public static partial  read_message_data();

        [JSImport("", "main.js")]
        public static partial  reconnect();

        [JSImport("", "main.js")]
        public static partial  release_all_connections();

        [JSImport("", "main.js")]
        public static partial  reset_new_connection_count();

        [JSImport("", "main.js")]
        public static partial  retrieve_connection();

        [JSImport("", "main.js")]
        public static partial  send_message_to();

        [JSImport("", "main.js")]
        public static partial  server_has_new_connection();

        [JSImport("", "main.js")]
        public static partial  server_named();

        [JSImport("", "main.js")]
        public static partial  set_udp_packet_size();

        [JSImport("", "main.js")]
        public static partial  udp_packet_size();

        [JSImport("", "main.js")]
        public static partial  download_bitmap();

        [JSImport("", "main.js")]
        public static partial  download_font();

        [JSImport("", "main.js")]
        public static partial  download_music();

        [JSImport("", "main.js")]
        public static partial  download_sound_effect();

        [JSImport("", "main.js")]
        public static partial  free_response();

        [JSImport("", "main.js")]
        public static partial  http_get();

        [JSImport("", "main.js")]
        public static partial  http_post();

        [JSImport("", "main.js")]
        public static partial  http_response_to_string();

        [JSImport("", "main.js")]
        public static partial  save_response_to_file();

        [JSImport("", "main.js")]
        public static partial  has_incoming_requests();

        [JSImport("", "main.js")]
        public static partial  is_delete_request_for();

        [JSImport("", "main.js")]
        public static partial  is_get_request_for();

        [JSImport("", "main.js")]
        public static partial  is_options_request_for();

        [JSImport("", "main.js")]
        public static partial  is_post_request_for();

        [JSImport("", "main.js")]
        public static partial  is_put_request_for();

        [JSImport("", "main.js")]
        public static partial  is_request_for();

        [JSImport("", "main.js")]
        public static partial  is_trace_request_for();

        [JSImport("", "main.js")]
        public static partial  next_web_request();

        [JSImport("", "main.js")]
        public static partial  request_body();

        [JSImport("", "main.js")]
        public static partial  request_has_query_parameter();

        [JSImport("", "main.js")]
        public static partial  request_headers();

        [JSImport("", "main.js")]
        public static partial  request_method();

        [JSImport("", "main.js")]
        public static partial  request_query_parameter();

        [JSImport("", "main.js")]
        public static partial  request_query_string();

        [JSImport("", "main.js")]
        public static partial  request_uri();

        [JSImport("", "main.js")]
        public static partial  request_uri_stubs();

        [JSImport("", "main.js")]
        public static partial  send_css_file_response();

        [JSImport("", "main.js")]
        public static partial  send_file_response();

        [JSImport("", "main.js")]
        public static partial  send_html_file_response();

        [JSImport("", "main.js")]
        public static partial  send_javascript_file_response();

        [JSImport("", "main.js")]
        public static partial  send_response();

        [JSImport("", "main.js")]
        public static partial  split_uri_stubs();

        [JSImport("", "main.js")]
        public static partial  start_web_server();

        [JSImport("", "main.js")]
        public static partial  stop_web_server();

        [JSImport("", "main.js")]
        public static partial  bitmap_circle_collision();

        [JSImport("", "main.js")]
        public static partial  bitmap_collision();

        [JSImport("", "main.js")]
        public static partial  bitmap_point_collision();

        [JSImport("", "main.js")]
        public static partial  bitmap_rectangle_collision();

        [JSImport("", "main.js")]
        public static partial  sprite_bitmap_collision();

        [JSImport("", "main.js")]
        public static partial  sprite_collision();

        [JSImport("", "main.js")]
        public static partial  sprite_point_collision();

        [JSImport("", "main.js")]
        public static partial  sprite_rectangle_collision();

        [JSImport("", "main.js")]
        public static partial  apply_matrix();

        [JSImport("", "main.js")]
        public static partial  identity_matrix();

        [JSImport("", "main.js")]
        public static partial  matrix_inverse();

        [JSImport("", "main.js")]
        public static partial  matrix_multiply();

        [JSImport("", "main.js")]
        public static partial  matrix_to_string();

        [JSImport("", "main.js")]
        public static partial  rotation_matrix();

        [JSImport("", "main.js")]
        public static partial  scale_matrix();

        [JSImport("", "main.js")]
        public static partial  scale_rotate_translate_matrix();

        [JSImport("", "main.js")]
        public static partial  translation_matrix();

        [JSImport("", "main.js")]
        public static partial  angle_between();

        [JSImport("", "main.js")]
        public static partial  dot_product();

        [JSImport("", "main.js")]
        public static partial  is_zero_vector();

        [JSImport("", "main.js")]
        public static partial  ray_intersection_point();

        [JSImport("", "main.js")]
        public static partial  unit_vector();

        [JSImport("", "main.js")]
        public static partial  vector_add();

        [JSImport("", "main.js")]
        public static partial  vector_angle();

        [JSImport("", "main.js")]
        public static partial  vector_from_angle();

        [JSImport("", "main.js")]
        public static partial  vector_from_line();

        [JSImport("", "main.js")]
        public static partial  vector_from_point_to_rect();

        [JSImport("", "main.js")]
        public static partial  vector_in_rect();

        [JSImport("", "main.js")]
        public static partial  vector_invert();

        [JSImport("", "main.js")]
        public static partial  vector_limit();

        [JSImport("", "main.js")]
        public static partial  vector_magnitude();

        [JSImport("", "main.js")]
        public static partial  vector_magnitude_sqared();

        [JSImport("", "main.js")]
        public static partial  vector_multiply();

        [JSImport("", "main.js")]
        public static partial  vector_normal();

        [JSImport("", "main.js")]
        public static partial  vector_out_of_circle_from_circle();

        [JSImport("", "main.js")]
        public static partial  vector_out_of_circle_from_point();

        [JSImport("", "main.js")]
        public static partial  vector_out_of_rect_from_circle();

        [JSImport("", "main.js")]
        public static partial  vector_out_of_rect_from_point();

        [JSImport("", "main.js")]
        public static partial  vector_out_of_rect_from_rect();

        [JSImport("", "main.js")]
        public static partial  vector_point_to_point();

        [JSImport("", "main.js")]
        public static partial  vector_subtract();

        [JSImport("", "main.js")]
        public static partial  vector_to();

        [JSImport("", "main.js")]
        public static partial  vector_to_string();

        [JSImport("", "main.js")]
        public static partial  vectors_equal();

        [JSImport("", "main.js")]
        public static partial  vectors_not_equal();

        [JSImport("", "main.js")]
        public static partial  has_gpio();

        [JSImport("", "main.js")]
        public static partial  raspi_cleanup();

        [JSImport("", "main.js")]
        public static partial  raspi_get_mode();

        [JSImport("", "main.js")]
        public static partial  raspi_init();

        [JSImport("", "main.js")]
        public static partial  raspi_read();

        [JSImport("", "main.js")]
        public static partial  raspi_set_mode();

        [JSImport("", "main.js")]
        public static partial  raspi_set_pull_up_down();

        [JSImport("", "main.js")]
        public static partial  raspi_set_pwm_dutycycle();

        [JSImport("", "main.js")]
        public static partial  raspi_set_pwm_frequency();

        [JSImport("", "main.js")]
        public static partial  raspi_set_pwm_range();

        [JSImport("", "main.js")]
        public static partial  raspi_write();

        [JSImport("", "main.js")]
        public static partial  free_resource_bundle();

        [JSImport("", "main.js")]
        public static partial  has_resource_bundle();

        [JSImport("", "main.js")]
        public static partial  load_resource_bundle();

        [JSImport("", "main.js")]
        public static partial  deregister_free_notifier();

        [JSImport("", "main.js")]
        public static partial  path_to_resource();

        [JSImport("", "main.js")]
        public static partial  path_to_resources();

        [JSImport("", "main.js")]
        public static partial  register_free_notifier();

        [JSImport("", "main.js")]
        public static partial  set_resources_path();

        [JSImport("", "main.js")]
        public static partial  call_for_all_sprites();

        [JSImport("", "main.js")]
        public static partial  call_on_sprite_event();

        [JSImport("", "main.js")]
        public static partial  create_sprite();

        [JSImport("", "main.js")]
        public static partial  create_sprite_pack();

        [JSImport("", "main.js")]
        public static partial  current_sprite_pack();

        [JSImport("", "main.js")]
        public static partial  draw_all_sprites();

        [JSImport("", "main.js")]
        public static partial  draw_sprite();

        [JSImport("", "main.js")]
        public static partial  free_all_sprites();

        [JSImport("", "main.js")]
        public static partial  free_sprite();

        [JSImport("", "main.js")]
        public static partial  free_sprite_pack();

        [JSImport("", "main.js")]
        public static partial  has_sprite();

        [JSImport("", "main.js")]
        public static partial  has_sprite_pack();

        [JSImport("", "main.js")]
        public static partial  move_sprite();

        [JSImport("", "main.js")]
        public static partial  move_sprite_to();

        [JSImport("", "main.js")]
        public static partial  select_sprite_pack();

        [JSImport("", "main.js")]
        public static partial  sprite_add_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_add_to_velocity();

        [JSImport("", "main.js")]
        public static partial  sprite_add_value();

        [JSImport("", "main.js")]
        public static partial  sprite_anchor_point();

        [JSImport("", "main.js")]
        public static partial  sprite_anchor_position();

        [JSImport("", "main.js")]
        public static partial  sprite_animation_has_ended();

        [JSImport("", "main.js")]
        public static partial  sprite_animation_name();

        [JSImport("", "main.js")]
        public static partial  sprite_at();

        [JSImport("", "main.js")]
        public static partial  sprite_bring_layer_forward();

        [JSImport("", "main.js")]
        public static partial  sprite_bring_layer_to_front();

        [JSImport("", "main.js")]
        public static partial  sprite_call_on_event();

        [JSImport("", "main.js")]
        public static partial  sprite_circle();

        [JSImport("", "main.js")]
        public static partial  sprite_collision_bitmap();

        [JSImport("", "main.js")]
        public static partial  sprite_collision_circle();

        [JSImport("", "main.js")]
        public static partial  sprite_collision_kind();

        [JSImport("", "main.js")]
        public static partial  sprite_collision_rectangle();

        [JSImport("", "main.js")]
        public static partial  sprite_current_cell();

        [JSImport("", "main.js")]
        public static partial  sprite_current_cell_rectangle();

        [JSImport("", "main.js")]
        public static partial  sprite_dx();

        [JSImport("", "main.js")]
        public static partial  sprite_dy();

        [JSImport("", "main.js")]
        public static partial  sprite_has_value();

        [JSImport("", "main.js")]
        public static partial  sprite_heading();

        [JSImport("", "main.js")]
        public static partial  sprite_height();

        [JSImport("", "main.js")]
        public static partial  sprite_hide_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_circle();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_count();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_height();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_index();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_name();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_offset();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_rectangle();

        [JSImport("", "main.js")]
        public static partial  sprite_layer_width();

        [JSImport("", "main.js")]
        public static partial  sprite_location_matrix();

        [JSImport("", "main.js")]
        public static partial  sprite_mass();

        [JSImport("", "main.js")]
        public static partial  sprite_move_from_anchor_point();

        [JSImport("", "main.js")]
        public static partial  sprite_move_to();

        [JSImport("", "main.js")]
        public static partial  sprite_name();

        [JSImport("", "main.js")]
        public static partial  sprite_named();

        [JSImport("", "main.js")]
        public static partial  sprite_offscreen();

        [JSImport("", "main.js")]
        public static partial  sprite_on_screen_at();

        [JSImport("", "main.js")]
        public static partial  sprite_position();

        [JSImport("", "main.js")]
        public static partial  sprite_replay_animation();

        [JSImport("", "main.js")]
        public static partial  sprite_rotation();

        [JSImport("", "main.js")]
        public static partial  sprite_scale();

        [JSImport("", "main.js")]
        public static partial  sprite_screen_rectangle();

        [JSImport("", "main.js")]
        public static partial  sprite_send_layer_backward();

        [JSImport("", "main.js")]
        public static partial  sprite_send_layer_to_back();

        [JSImport("", "main.js")]
        public static partial  sprite_set_anchor_point();

        [JSImport("", "main.js")]
        public static partial  sprite_set_collision_bitmap();

        [JSImport("", "main.js")]
        public static partial  sprite_set_collision_kind();

        [JSImport("", "main.js")]
        public static partial  sprite_set_dx();

        [JSImport("", "main.js")]
        public static partial  sprite_set_dy();

        [JSImport("", "main.js")]
        public static partial  sprite_set_heading();

        [JSImport("", "main.js")]
        public static partial  sprite_set_layer_offset();

        [JSImport("", "main.js")]
        public static partial  sprite_set_mass();

        [JSImport("", "main.js")]
        public static partial  sprite_set_move_from_anchor_point();

        [JSImport("", "main.js")]
        public static partial  sprite_set_position();

        [JSImport("", "main.js")]
        public static partial  sprite_set_rotation();

        [JSImport("", "main.js")]
        public static partial  sprite_set_scale();

        [JSImport("", "main.js")]
        public static partial  sprite_set_speed();

        [JSImport("", "main.js")]
        public static partial  sprite_set_value();

        [JSImport("", "main.js")]
        public static partial  sprite_set_velocity();

        [JSImport("", "main.js")]
        public static partial  sprite_set_x();

        [JSImport("", "main.js")]
        public static partial  sprite_set_y();

        [JSImport("", "main.js")]
        public static partial  sprite_show_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_speed();

        [JSImport("", "main.js")]
        public static partial  sprite_start_animation();

        [JSImport("", "main.js")]
        public static partial  sprite_stop_calling_on_event();

        [JSImport("", "main.js")]
        public static partial  sprite_toggle_layer_visible();

        [JSImport("", "main.js")]
        public static partial  sprite_value();

        [JSImport("", "main.js")]
        public static partial  sprite_value_count();

        [JSImport("", "main.js")]
        public static partial  sprite_velocity();

        [JSImport("", "main.js")]
        public static partial  sprite_visible_index_of_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_visible_layer();

        [JSImport("", "main.js")]
        public static partial  sprite_visible_layer_count();

        [JSImport("", "main.js")]
        public static partial  sprite_visible_layer_id();

        [JSImport("", "main.js")]
        public static partial  sprite_width();

        [JSImport("", "main.js")]
        public static partial  sprite_x();

        [JSImport("", "main.js")]
        public static partial  sprite_y();

        [JSImport("", "main.js")]
        public static partial  stop_calling_on_sprite_event();

        [JSImport("", "main.js")]
        public static partial  update_all_sprites();

        [JSImport("", "main.js")]
        public static partial  update_sprite();

        [JSImport("", "main.js")]
        public static partial  update_sprite_animation();

        [JSImport("", "main.js")]
        public static partial  vector_from_center_sprite_to_point();

        [JSImport("", "main.js")]
        public static partial  vector_from_to();

        [JSImport("", "main.js")]
        public static partial  read_char();

        [JSImport("", "main.js")]
        public static partial  read_line();

        [JSImport("", "main.js")]
        public static partial  terminal_has_input();

        [JSImport("", "main.js")]
        public static partial  write();

        [JSImport("", "main.js")]
        public static partial  write_line();

        [JSImport("", "main.js")]
        public static partial  create_timer();

        [JSImport("", "main.js")]
        public static partial  free_all_timers();

        [JSImport("", "main.js")]
        public static partial  free_timer();

        [JSImport("", "main.js")]
        public static partial  has_timer();

        [JSImport("", "main.js")]
        public static partial  pause_timer();

        [JSImport("", "main.js")]
        public static partial  reset_timer();

        [JSImport("", "main.js")]
        public static partial  resume_timer();

        [JSImport("", "main.js")]
        public static partial  start_timer();

        [JSImport("", "main.js")]
        public static partial  stop_timer();

        [JSImport("", "main.js")]
        public static partial  timer_named();

        [JSImport("", "main.js")]
        public static partial  timer_paused();

        [JSImport("", "main.js")]
        public static partial  timer_started();

        [JSImport("", "main.js")]
        public static partial  timer_ticks();

        [JSImport("", "main.js")]
        public static partial  convert_to_double();

        [JSImport("", "main.js")]
        public static partial  convert_to_integer();

        [JSImport("", "main.js")]
        public static partial  is_double();

        [JSImport("", "main.js")]
        public static partial  is_integer();

        [JSImport("", "main.js")]
        public static partial  is_number();

        [JSImport("", "main.js")]
        public static partial  to_lowercase();

        [JSImport("", "main.js")]
        public static partial  to_uppercase();

        [JSImport("", "main.js")]
        public static partial  trim();

        [JSImport("", "main.js")]
        public static partial  rnd();

        [JSImport("", "main.js")]
        public static partial  current_ticks();

        [JSImport("", "main.js")]
        public static partial  delay();

        [JSImport("", "main.js")]
        public static partial  display_dialog();

        [JSImport("", "main.js")]
        public static partial  file_as_string();

        [JSImport("", "main.js")]
        public static partial  clear_window();

        [JSImport("", "main.js")]
        public static partial  close_all_windows();

        [JSImport("", "main.js")]
        public static partial  close_current_window();

        [JSImport("", "main.js")]
        public static partial  close_window();

        [JSImport("", "main.js")]
        public static partial  current_window();

        [JSImport("", "main.js")]
        public static partial  current_window_has_border();

        [JSImport("", "main.js")]
        public static partial  current_window_height();

        [JSImport("", "main.js")]
        public static partial  current_window_is_fullscreen();

        [JSImport("", "main.js")]
        public static partial  current_window_position();

        [JSImport("", "main.js")]
        public static partial  current_window_toggle_border();

        [JSImport("", "main.js")]
        public static partial  current_window_toggle_fullscreen();

        [JSImport("", "main.js")]
        public static partial  current_window_width();

        [JSImport("", "main.js")]
        public static partial  current_window_x();

        [JSImport("", "main.js")]
        public static partial  current_window_y();

        [JSImport("", "main.js")]
        public static partial  has_window();

        [JSImport("", "main.js")]
        public static partial  is_current_window();

        [JSImport("", "main.js")]
        public static partial  move_current_window_to();

        [JSImport("", "main.js")]
        public static partial  move_window_to();

        [JSImport("", "main.js")]
        public static partial  open_window();

        [JSImport("", "main.js")]
        public static partial  refresh_window();

        [JSImport("", "main.js")]
        public static partial  resize_current_window();

        [JSImport("", "main.js")]
        public static partial  resize_window();

        [JSImport("", "main.js")]
        public static partial  set_current_window();

        [JSImport("", "main.js")]
        public static partial  window_caption();

        [JSImport("", "main.js")]
        public static partial  window_close_requested();

        [JSImport("", "main.js")]
        public static partial  window_has_border();

        [JSImport("", "main.js")]
        public static partial  window_has_focus();

        [JSImport("", "main.js")]
        public static partial  window_height();

        [JSImport("", "main.js")]
        public static partial  window_is_fullscreen();

        [JSImport("", "main.js")]
        public static partial  window_named();

        [JSImport("", "main.js")]
        public static partial  window_position();

        [JSImport("", "main.js")]
        public static partial  window_set_icon();

        [JSImport("", "main.js")]
        public static partial  window_toggle_border();

        [JSImport("", "main.js")]
        public static partial  window_toggle_fullscreen();

        [JSImport("", "main.js")]
        public static partial  window_width();

        [JSImport("", "main.js")]
        public static partial  window_with_focus();

        [JSImport("", "main.js")]
        public static partial  window_x();

        [JSImport("", "main.js")]
        public static partial  window_y();

    }
}
