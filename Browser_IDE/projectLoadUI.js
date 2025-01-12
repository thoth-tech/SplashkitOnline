"use strict";

async function ShowProjectLoader(title, getChoices){
    let closeButton = elem('button', {type:"button"}, [elem('i', {class: "bi bi-x-lg"}, [])]);

    let loadingText =
        elem('div', {class: "sk-demo-window-loading-text", id:"DemoChooserLoader", style:{'position':'absolute'}}, [
            elem('h2', {style:{'text-align':'center'}}, ["Loading..."])
        ]);

    let mainRows =
        elem('div', {class: "sk-column"}, [
            elem('div', {class: "sk-header sk-header-indent"}, [
                elem('div', {class: "flex-column"}, [
                    title
                ]),
                elem('div', {class: "flex-column"}, [
                    closeButton,
                ]),
            ]),
            loadingText,
        ]);

    let loaderWindow =
        elem('div', {class: "sk-main-columns sk-demo-window-container fade-on-create"}, [
            elem('div', {class: "sk-notification sk-notification-body sk-contents sk-contents-focusable sk-demo-window", tabindex: "10"}, [
                mainRows,
            ]),
        ]);

    closeButton.addEventListener('click', function(){
        removeFadeOut(loaderWindow, 200);
    });

    // show the window
    document.body.appendChild(loaderWindow);

    // wait for our choices to download, then show them
    try {
        let choices = await getChoices();
        removeFadeOut(loadingText, 200);

        let gridContainer = elem('div', {class: "sk-contents sk-demo-thumbnail-grid-container fade-on-create", id:"DemoChooser"}, []);
        for(let i = 0 ; i < choices.length; i ++){
            let set = elem('div', {class: "sk-demo-thumbnail-grid", id:"DemoChooser"}, []);
            for(let j = 0 ; j < choices[i].length; j ++){
                let item = choices[i][j];
                let thumbnail =
                    elem('div', {class: "sk-demo-thumbnail"}, [
                        elem('img', {src: item["thumbnail"], class: "sk-demo-thumbnail-img"}),
                        elem('div', {class: "sk-header sk-header-indent sk-demo-tags"}, [
                            elem('div', {class: "sk-demo-tag"}, [item["language"]]),
                        ]),
                        elem('div', {class: "sk-header sk-header-indent sk-demo-title"}, [
                            item["title"]
                        ]),
                    ]);
                set.appendChild(thumbnail);

                thumbnail.addEventListener('click', async function(){
                    removeFadeOut(loaderWindow, 200);

                    //TODO: Improve - this is barely visible.
                    if (activeLanguage.name != item["language"])
                        displayEditorNotification("Switching language to " + item["language"] + "<br>Page will reload.", NotificationIcons.INFO);

                    // wait until the project has loaded, only then switch language if needed
                    await loadProjectFromURL(await rerouteURL(item["file"]));

                    if (activeLanguage.name != item["language"])
                        switchActiveLanguage(item["language"]);
                });
            }
            gridContainer.appendChild(set);
            gridContainer.appendChild(elem("hr"));
        }

        mainRows.appendChild(gridContainer);
    }
    catch(e){
        loadingText.childNodes[0].innerText = "Failed to load demo project list, sorry!";
    }
}

function LoadDemoProjects(){
    return fetch("DemoProjects/metadata/demos.json").then(res => res.json()).then(async json => {
        return json;
    });
}

//!!!!!!!!!!!!!!!!
async function loadUserProjects() {
    return new Promise((resolve, reject) => {
        // Open the database
        let dbRequest = indexedDB.open('SplashkitOnline', 1);

        dbRequest.onupgradeneeded = function(event) {
            let db = event.target.result;
            // Create the 'userProjects' object store if it doesn't exist
            if (!db.objectStoreNames.contains('userProjects')) {
                db.createObjectStore('userProjects', { keyPath: 'id', autoIncrement: true });
            }
        };

        dbRequest.onsuccess = function(event) {
            let db = event.target.result;
            let transaction = db.transaction(['userProjects'], 'readonly');
            let objectStore = transaction.objectStore('userProjects');
            
            // Get all projects
            let getRequest = objectStore.getAll();

            getRequest.onsuccess = function() {
                // Convert to display format
                let userProjects = getRequest.result.map(project => ({
                    title: project.name,  // project name
                    language: project.language || "Unknown",  // default language
                    file: project.filePath || "",  // file path
                    thumbnail: project.thumbnail || ""  // thumbnail
                }));
                resolve(userProjects);
            };

            getRequest.onerror = function() {
                reject('Failed to load user project data');
            };
        };

        dbRequest.onerror = function() {
            reject('Failed to open IndexedDB');
        };
    });
}

//!!!!!!!!!!!!!!!!
async function ShowProjectLoader(title, getChoices) {
    let closeButton = elem('button', {type:"button"}, [elem('i', {class: "bi bi-x-lg"}, [])]);

    let loadingText = elem('div', {class: "sk-demo-window-loading-text", id:"DemoChooserLoader", style:{'position':'absolute'}}, [
        elem('h2', {style:{'text-align':'center'}}, ["Loading..."])
    ]);

    let mainRows = elem('div', {class: "sk-column"}, [
        elem('div', {class: "sk-header sk-header-indent"}, [
            elem('div', {class: "flex-column"}, [title]),
            elem('div', {class: "flex-column"}, [closeButton]),
        ]),
        loadingText,
    ]);

    let loaderWindow = elem('div', {class: "sk-main-columns sk-demo-window-container fade-on-create"}, [
        elem('div', {class: "sk-notification sk-notification-body sk-contents sk-contents-focusable sk-demo-window", tabindex: "10"}, [
            mainRows,
        ]),
    ]);

    closeButton.addEventListener('click', function() {
        removeFadeOut(loaderWindow, 200);
    });

    // Show the window
    document.body.appendChild(loaderWindow);

    try {
        let choices = await getChoices();
        console.log(choices);
        removeFadeOut(loadingText, 200);
    } catch(e) {
        console.error("Failed to load project data:", e);
        loadingText.childNodes[0].innerText = "Failed to load project list, sorry!";
    }
}