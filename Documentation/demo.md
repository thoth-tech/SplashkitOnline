# Demo



## Adding a Demo to SplashKit Online
To add a project to SplashKit Online please following the following process regardless of langauge. 

1. Firstly, navigate to ```DemoProjects``` folder.
2. Zip (```.zip```) your project and place it in this folder. **Please make sure to remove all hidden file**. Hidden file are files that start with a . e.g. ```.vscode```. These files are not neccessary and should be remove.
3. Make sure you get a screen shot of your code running for a thumbnail image
4. Next navigate to ```DemoProject/meta/demos.json```.
5. If your demo is a rewrite in a new language of an existing demo add it in the same array as the already existing demo. Please use the format in **step 6**
6. If the demo doesn't already exist in the ```demos.json``` file, please **add a new array** in the file to contain the demo project
7. To add a project please add code in the following format
```json
    [ // main array
    ...
        [ // Add this array only if no existing demos of the same project already exist. Otherwise add it to the existing array
            {
                "title": "Cave Escape (C++)",
                "language": "C++",
                "file": "DemoProjects/CaveEscapeCXX.zip", 
                "thumbnail": "DemoProjects/metadata/CaveEscape.png"
            }
        ]

    ]
```
8. Next load the demo projects and check that your game is visable on the demo menu and working.
