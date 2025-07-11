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

                    let reroutedURL = await rerouteURL(item["file"]);

                    scheduleLoadProjectFromURL(reroutedURL);
                    schedulePotentialLanguageSwitch(item["language"]);
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
