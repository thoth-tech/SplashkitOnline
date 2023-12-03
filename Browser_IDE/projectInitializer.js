"use strict";

let defaultInitCode =
`open_window("test!",1280,720);
clear_screen(rgba_color_from_double(1.0,1.0,1.0,0));
refresh_screen();
write_line("Initialized!");
`;

let defaultMainLoopCode =
`process_events();

if (key_down(A_KEY))
    write_line("A key!");

if (mouse_clicked(LEFT_BUTTON))
    write_line("click!");

clear_screen(rgba_color_from_double(1,1,1,1));
fill_ellipse(rgba_color_from_double(0,1,0,1), 0, 400, 800, 400);
fill_rectangle(rgba_color_from_double(0.4,0.4,0.4,1), 300, 300, 200, 200);
fill_triangle(rgba_color_from_double(1,0,0,1), 250, 300, 400, 150, 550, 300);

if (mouse_down(LEFT_BUTTON))
    fill_ellipse(rgba_color_from_double(0.3,0.7,1,1), mouse_position().x-50, mouse_position().y-50, 100, 100);

refresh_screen();
`;


let initCodePath = "/code/codeblock_init.js";
let mainLoopCodePath = "/code/codeblock_mainloop.js";
let codePath = "/code";
async function makeNewProject(storedProject){
    await storedProject.mkdir("/Resources");
    await storedProject.mkdir("/Resources/animations");
    await storedProject.mkdir("/Resources/bundles");
    await storedProject.mkdir("/Resources/databases");
    await storedProject.mkdir("/Resources/fonts");
    await storedProject.mkdir("/Resources/images");
    await storedProject.mkdir("/Resources/json");
    await storedProject.mkdir("/Resources/server");
    await storedProject.mkdir("/Resources/sounds");

    await storedProject.mkdir("/code");
    await storedProject.writeFile(initCodePath, defaultInitCode);
    await storedProject.writeFile(mainLoopCodePath, defaultMainLoopCode);
}