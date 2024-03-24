# Adding Project Export Feature for Splashkit-online

## Task Description
The task is to add a Project Export feature to Splashkit-online. The goal is to allow users to export their game projects into a single HTML file that they can easily share with others. This feature involves bundling all the project resources and SplashKit into an HTML file and serving it as a download.

## Steps
1. **Investigate Bundling Process:**
   - Research methods for bundling SplashKit libraries and project resources into a single HTML file.
   - Explore existing tools or libraries that facilitate this bundling process.
   - Determine the most efficient and effective approach for bundling the necessary components.

2. **Develop HTML Template:**
   - Design a suitable HTML template that can host the game.
   - Ensure the template allows for a fullscreen-able canvas and other necessary features.
   - Consider usability and accessibility factors when designing the template.

3. **Implement Export Functionality:**
   - Integrate the bundling process into the Splashkit-online platform.
   - Develop functionality to package all resources and SplashKit libraries into the HTML file.
   - Ensure the exported project runs smoothly and accurately replicates the original project.

4. **Test the Export Feature:**
   - Conduct thorough testing to verify the functionality of the project export feature.
   - Test various scenarios, including projects with different resource types and complexities.
   - Address any bugs or issues that arise during testing.

5. **Refine and Optimize:**
   - Gather feedback from users and stakeholders on the export feature.
   - Make any necessary improvements or optimizations based on feedback and testing results.
   - Ensure the feature meets performance expectations and user requirements.

## HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Splashkit Game</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100%;
        }
        canvas {
            display: block;
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
        // Load Splashkit library and user's game code
        function loadScript(url, callback) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            if (script.readyState) {  // IE
                script.onreadystatechange = function() {
                    if (script.readyState == "loaded" || script.readyState == "complete") {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else {  // Others
                script.onload = function() {
                    callback();
                };
            }
            script.src = url;
            document.getElementsByTagName("head")[0].appendChild(script);
        }

        loadScript("splashkit.js", function() {
            // Initialize Splashkit
            splashkit.init("gameCanvas", function() {
                // Load user's game code
                loadScript("user_game.js", function() {
                    // User's game code loaded, start the game
                    startGame();
                });
            });
        });
    </script>
</body>
</html>
