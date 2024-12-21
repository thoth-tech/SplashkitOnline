"use strict";

let defaultGameLoopCodeJS =
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
    fill_ellipse(COLOR_LIME, 0, 400, 800, 400);
    fill_rectangle(rgba_color(0.4,0.4,0.4,1), 300, 300, 200, 200);
    fill_triangle(COLOR_RED, 250, 300, 400, 150, 550, 300);

    // If the mouse is being held down,
    // set the global variable circle_pos
    // to the mouse's position
    if (mouse_down(LEFT_BUTTON)){
        circle_pos = mouse_position();
    }

    // Draw the circle!
    fill_ellipse(
        rgba_color(0.3,0.7,1,0.7),     // Color of the ellipse
        circle_pos.x - circleSize/2, // The x (horizontal) position
        circle_pos.y - circleSize/2, // The y (vertical) position
        circleSize,                  // The width
        circleSize                   // The height
    );
}
`;

let defaultMainCodeJS =
`let windowName = "My Game!";

// Declare a global variable for the circle's position
// Hide circle off screen at start
// (way off past the top-left corner)
let circle_pos = new point_2d(-1000, -1000);

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
        clear_screen(COLOR_WHITE);

        // Do the game related stuff (in the code block above!)
        gameInnerLoop();

        // Show the user what we've drawn!
        refresh_screen(60);
    }
}
`;

let defaultGameLoopCodeCXX =
`#include "splashkit.h"
// Example code!
// - Draws a circle where the user clicks!

// Declare the circle's size
float circleSize = 100;

extern point_2d circle_pos;

void gameInnerLoop(){
    // Test if the player is holding A
    if (key_down(A_KEY))
        write_line("A key!");

    // Test if the player clicked
    if (mouse_clicked(LEFT_BUTTON))
        write_line("click!");

    // Draw a simple scene
    fill_ellipse(COLOR_LIME, 0, 400, 800, 400);
    fill_rectangle(rgba_color(0.4,0.4,0.4,1.0), 300, 300, 200, 200);
    fill_triangle(COLOR_RED, 250, 300, 400, 150, 550, 300);

    // If the mouse is being held down,
    // set the global variable circle_pos
    // to the mouse's position
    if (mouse_down(LEFT_BUTTON)){
        circle_pos = mouse_position();
    }

    // Draw the circle!
    fill_ellipse(
        rgba_color(0.3,0.7,1.0,0.7),     // Color of the ellipse
        circle_pos.x - circleSize/2, // The x (horizontal) position
        circle_pos.y - circleSize/2, // The y (vertical) position
        circleSize,                  // The width
        circleSize                   // The height
    );
}
`;

let defaultMainCodeCXX =
`#include "splashkit.h"

std::string windowName = "My Game!";

// Declare a global variable for the circle's position
// Hide circle off screen at start
// (way off past the top-left corner)
point_2d circle_pos = {-1000, -1000};

// gameInnerLoop is defined in the other file,
// so forward declare it here too so we can call it!
void gameInnerLoop();

// Main function - when you change this,
// you have to Restart the program!
int main(){
    // Open a window with the title stored in 'windowName'
    open_window(windowName, 1280, 720);
    write_line("Initialized!");

    while(true){
        // Check if the user's clicked or pressed keys
        process_events();

        // Clear the screen - try removing this!
        // If you change it, don't forget to "Restart"!
        clear_screen(COLOR_WHITE);

        // Do the game related stuff (in the code block above!)
        gameInnerLoop();

        // Show the user what we've drawn!
        refresh_screen(60);
    }

    return 0;
}
`;

const defaultMainCodeCSharp = `
using System;
public class Program {
    public static void Main() {
        for(int i = 0; i < 5; i++) {
            if(i < 4) {
                Console.WriteLine(i);
            } else {
                SplashKitInterop.OpenWindow("test", 800, 600);
                SplashKitInterop.FillEllipse();
                SplashKitInterop.RefreshScreen(60);
            }
        }
    }
}
`;

let codePath = "/code";

async function initializeSplashKitResourceFolders(storedProject) {
    await storedProject.mkdir("/Resources");
    await storedProject.mkdir("/Resources/animations");
    await storedProject.mkdir("/Resources/bundles");
    await storedProject.mkdir("/Resources/databases");
    await storedProject.mkdir("/Resources/fonts");
    await storedProject.mkdir("/Resources/images");
    await storedProject.mkdir("/Resources/json");
    await storedProject.mkdir("/Resources/server");
    await storedProject.mkdir("/Resources/sounds");
}

async function makeNewProject_JavaScript(storedProject){
    await initializeSplashKitResourceFolders(storedProject);

    await storedProject.mkdir("/code");
    await storedProject.writeFile("/code/innerLoop.js", defaultGameLoopCodeJS);
    await storedProject.writeFile("/code/main.js", defaultMainCodeJS);
}

async function makeNewProject_CSharp(storedProject){
    await initializeSplashKitResourceFolders(storedProject);

    await storedProject.mkdir("/code");
    await storedProject.writeFile("/code/main.cs", defaultMainCodeCSharp);
}

async function makeNewProject_CXX(storedProject){
    await initializeSplashKitResourceFolders(storedProject);

    await storedProject.mkdir("/code");
    await storedProject.writeFile("/code/inner_loop.cpp", defaultGameLoopCodeCXX);
    await storedProject.writeFile("/code/main.cpp", defaultMainCodeCXX);
}

async function initializeFromFileList(storedProject, files){
    await initializeSplashKitResourceFolders(storedProject);

    for (let i = 0; i < files.length; i ++) {
        await FSEnsurePath(storedProject, files[i].path);

        await storedProject.writeFile(files[i].path, files[i].data);
    }
}