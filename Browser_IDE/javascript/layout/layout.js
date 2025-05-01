

/*
    active table:
    1 File system
    2 Code editor
    3 Exectution enviroment 

*/

let activeTabIndex = 1

//'#fileViewContainer', "#codeViewContainer", '#runtimeContainer']


function updateActive(tabIndex) {

    switch(tabIndex) {
        case 1:
            document.getElementById("fileViewContainer").style.display = "block"
        break;
    }

}
