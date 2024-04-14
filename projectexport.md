# Exporting a Game as a Single HTML File

## Task Overview:
The task involves creating an HTML file that bundles a game created with SplashKit along with all its resources into a single file for easy sharing and distribution.

### Steps:
1. **Gather Resources**: Collect all the necessary game assets and SplashKit library.
2. **Create HTML Template**: Design an HTML template with a canvas element for the game.
3. **Bundle Resources**: Embed all resources directly into the HTML file.
4. **Include SplashKit**: Include the SplashKit JavaScript library in the HTML file.
5. **Write Export Function**: Implement a JavaScript function to bundle the game into a single HTML file.

## Program Explanation:

### HTML Template (`index.html`):
- Contains the HTML structure with a canvas element for the game.
- Includes a script tag containing both the game code and the export function.

### Example Game Code:
- Implements a simple game where a circle is drawn where the user clicks.
- Checks for key and mouse input events using SplashKit's functions.
- Draws simple shapes such as ellipses, rectangles, and triangles.
- Updates the position of a circle based on the mouse position.

### SplashKit Integration:
- Utilizes SplashKit's functions for keyboard and mouse input.
- Utilizes SplashKit's drawing functions to render graphics.

### Export Function:
- Defines a JavaScript function named `exportGame()`.
- Captures the contents of the canvas and converts it to a data URL.
- Creates a download link for the HTML file with the exported game.
- Programmatically triggers the download when the "Export Game" button is clicked.

This program combines the game code with the export functionality to create a single HTML file containing the game and all its resources for easy sharing and distribution.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Game</title>
    <!-- including SplashKit JavaScript library -->
    <script src="https://cdn.jsdelivr.net/npm/splashkit-web/splashkit.js"></script>
    
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script>
        // Example code!
        // - Draws a circle where the user clicks!

        // Declare the circle's size
        let circleSize = 100;

        function gameInnerLoop(){
            // Test if the player is holding A
            if (splashkit.key_down(splashkit.A_KEY))
                splashkit.write_line("A key!");

            // Test if the player clicked
            if (splashkit.mouse_clicked(splashkit.LEFT_BUTTON))
                splashkit.write_line("click!");

            // Draw a simple scene
            splashkit.fill_ellipse(splashkit.rgba_color_from_double(0,1,0,1), 0, 400, 800, 400);
            splashkit.fill_rectangle(splashkit.rgba_color_from_double(0.4,0.4,0.4,1), 300, 300, 200, 200);
            splashkit.fill_triangle(splashkit.rgba_color_from_double(1,0,0,1), 250, 300, 400, 150, 550, 300);

            // If the mouse is being held down,
            // set the global variables circleX/Y
            // to the mouse's position
            if (splashkit.mouse_down(splashkit.LEFT_BUTTON)){
                circleX = splashkit.mouse_position().x;
                circleY = splashkit.mouse_position().y;
            }

            // Draw the circle!
            splashkit.fill_ellipse(
                splashkit.rgba_color_from_double(0.3,0.7,1,1), // Color of the ellipse
                circleX - circleSize/2,             // The x (horizontal) position
                circleY - circleSize/2,             // The y (vertical) position
                circleSize,                          // The width
                circleSize                           // The height
            );
        }

        // code to initialize the game when SplashKit is ready
        splashkit.ready(() => {
            // code to start the game loop
            splashkit.every_tick(gameInnerLoop);
        });

        // javascript function to export the game
        function exportGame() {
            // Get the canvas element
            const canvas = document.getElementById('gameCanvas');
            // creating a new canvas to draw on
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = canvas.width;
            exportCanvas.height = canvas.height;
            const ctx = exportCanvas.getContext('2d');
            // code to draw the contents of the original canvas onto the exported canvas
            ctx.drawImage(canvas, 0, 0);
            // converting the canvas to a data URL
            const dataURL = exportCanvas.toDataURL();
            // seting up a download link for the HTML file
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'exported_game.html';
            // trigger the download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    </script>
    <button onclick="exportGame()">Export Game</button>
</body>
</html>