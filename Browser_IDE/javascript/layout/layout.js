

/*
    active table:
    1 File system
    2 Code editor
    3 Exectution enviroment 

*/

//This function is used to toggle the active tab
function updateActive(tabIndex) {
    console.log("called")
    fileViewContainer.style.display = tabIndex == 1 ? "block" : "none";
    codeViewContainer.style.display = tabIndex == 2 ? "block" : "none";
    runtimeContainer.style.display = tabIndex == 3 ? "block" : "none";
    menu.style.display = tabIndex == 4 ? "block" : "none";
}

//'#fileViewContainer', "#codeViewContainer", '#runtimeContainer']


// Elements for buttons
const fsButton = document.getElementById("fsButton");
const editorButton = document.getElementById("editorButton");
const executionEnviromentButton = document.getElementById("executionEnviromentButton");
const menuButton = document.getElementById("menuButton");

// Elements we want to show
const fileViewContainer = document.getElementById("fileViewContainer");
const codeViewContainer = document.getElementById("codeViewContainer");
const runtimeContainer = document.getElementById("runtimeContainer");
const menu = document.getElementById("menu");

// Only run this code if window is smaller than threshold
if (window.innerWidth < 500) {
    codeViewContainer.style.display = "block";
}


fsButton.addEventListener("click", () => {
    updateActive(1);
});
editorButton.addEventListener("click", () => {
    updateActive(2);
});
executionEnviromentButton.addEventListener("click", () => {
    updateActive(3);
});
menuButton.addEventListener("click", () => {
    updateActive(4);
});


