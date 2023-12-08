"use strict";

let defaultInitCode =
`// Example code!
// - Draws a circle where the user clicks!

// Declare the circle's size
let circleSize = 100;

function gameInnerLoop(){
    // Test if the player is holding A
    if (key_down(A_KEY))
        write_line("A key!");

    // Test if the player clicked
    if (mouse_clicked(LEFT_BUTTON))
        write_line("click!");

    // Draw a simple scene
    fill_ellipse(rgba_color_from_double(0,1,0,1), 0, 400, 800, 400);
    fill_rectangle(rgba_color_from_double(0.4,0.4,0.4,1), 300, 300, 200, 200);
    fill_triangle(rgba_color_from_double(1,0,0,1), 250, 300, 400, 150, 550, 300);

    // If the mouse is being held down,
    // set the global variables circleX/Y
    // to the mouse's position
    if (mouse_down(LEFT_BUTTON)){
        circleX = mouse_position().x;
        circleY = mouse_position().y;
    }

    // Draw the circle!
    fill_ellipse(
        rgba_color_from_double(0.3,0.7,1,1), // Color of the ellipse
        circleX - circleSize/2,             // The x (horizontal) position
        circleY - circleSize/2,             // The y (vertical) position
        circleSize,                          // The width
        circleSize                           // The height
    );
}
`;

let defaultMainLoopCode =
`let windowName = "My Game!";

// Declare some global variables for the circle's position
// Hide circle off screen at start
// (way off past the top-left corner)
let circleX = -1000;
let circleY = -1000;

// Main function - when you change this,
// you have to Restart the program!
function main(){
    // Open a window with the title stored in 'windowName'
    open_window(windowName, 1280, 720);
    write_line("Initialized!");

    while(true){
        // Check if the user's clicked or pressed keys
        process_events();

        // Clear the screen - try removing this!
		// If you change it, don't forget to "Restart"!
        clear_screen(color_white());

        // Do the game related stuff (in the code block above!)
        gameInnerLoop();

        // Show the user what we've drawn!
        refresh_screen();
    }
}
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