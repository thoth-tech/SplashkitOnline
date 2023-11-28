"use strict";

// ------- Utility Functions --------
// function 'contains' from Aleksandr Makov - https://stackoverflow.com/a/47485168
// How does this work??
function contains(parent, child) {
  return parent !== child && parent.contains(child);
}
// Node Utility Functions
function isNode(node){
    return node.classList.contains("node");
}
function isDirectory(node){
    return node.classList.contains("directory");
}
function getParentDirectory(node){
    if (node.dataset.label=="" || node.dataset.label==undefined)
        return null;
    return node.parentElement.parentElement;
}
function getDirectoryContents(node){
    return node.children[1];
}
function getFilename(node){
    return node.dataset.label;
}
function getFullDirectoryPath(node){
    let ret = "";
    let dir = getParentDirectory(node);
    while(dir!=null){
        ret = getFilename(dir)+"/"+ret;
        dir = getParentDirectory(dir);
    }
    return ret;
}
function getFullPath(node){
    return getFullDirectoryPath(node)+getFilename(node);
}
function getChildNodeWithFilename(root, name){
    for(let child of getDirectoryContents(root).children){
        if (getFilename(child)==name)
            return child;
    }
    return null;
}
function getNodeFromPath(path){
    let dir = document.getElementById("fileView");

    for (let part of splitPath(path)){
        dir = getChildNodeWithFilename(dir, part);
        if (dir==null)
            return null;
    }
    return dir;
}

// String Path Utility Functions
function pathDirName(path){
    return path.substring(0, path.lastIndexOf("/"));
}
function pathFileName(path){
    return path.substring(path.lastIndexOf("/")+1);
}
function pathFileExtension(path){
    return path.substring(path.lastIndexOf(".")+1);
}
function splitPath(path){
    return path.split("/").slice(1);
}

// TreeView Utility Functions
function moveNodeToPathUI(node, newPath, index){
    if (!isViewablePath(newPath))return;
    let new_dir_node = getNodeFromPath(pathDirName(newPath));

    if (index == -1 || index >= getDirectoryContents(new_dir_node).children.length)
        getDirectoryContents(new_dir_node).appendChild(node);
    else
        getDirectoryContents(new_dir_node).insertBefore(node, getDirectoryContents(new_dir_node).children[index]);
}

// File System Utility Functions
function FSFileExists(path){
    try{FS.lookupPath(path, { follow: false }).node; return true;}
    catch(e) {return false;}
}
function scanFilesystem(path){
    let dirs_files = FS.readdir(path).slice(2);

    let nodes = []
    for(let thing of dirs_files){
        if (thing == "fd")
            continue;
        let abs_path = path+""+thing;

        let info = FS.stat(abs_path);
        let node = new Map();
        node.set("label", thing);
        node.set("path", abs_path);
        node.set("children", null);
        if (FS.isDir(info.mode)){
            node.set("children", scanFilesystem(abs_path+"/"));
        }
        nodes.push(node);
    }
    return nodes;
}
function isViewablePath(path){
    if (path == null || path == undefined)return false;
    if (path.startsWith("/tmp"))return false;
    if (path.startsWith("/home"))return false;
    if (path.startsWith("/dev"))return false;
    if (path.startsWith("/proc"))return false;
    return true;
}


// File System Upload/Download Functions
let reader = null;
function uploadFile(){
    reader= new FileReader();
    let files = document.getElementById('fileuploader').files;
    let file = files[0]; // maybe should handle multiple at once?
    reader.addEventListener('loadend', function(e){
        let result = reader.result;
        const uint8_view = new Uint8Array(result);

        let path = document.getElementById('fileuploader').dataset.uploadDirectory;
        FS.writeFile(path+"/"+file.name, uint8_view);
    });
    reader.readAsArrayBuffer(file);
}

// Thanks Lucas Vinicius Hartmann! - https://stackoverflow.com/a/54468787
// for viewFile and downloadFile - somewhat modified
function viewFile(filename, mime) {
    mime = mime || "application/octet-stream";

    let content = Module.FS.readFile(filename);

    let url = URL.createObjectURL(new Blob([content], {type: mime}));

    window.open(url+"#"+filename);
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
}
function downloadFile(filename, mime) {
    mime = mime || "application/octet-stream";

    let content = Module.FS.readFile(filename);

    let a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(new Blob([content], {type: mime}));
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    window.open(a.href+"#"+filename);
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }, 2000);
}



// File System UI Node Creation Functions
function initFileNodeCallbacks(_node)
{
    let node = _node;
    node.addEventListener("mousedown", async function (e) {
        e.stopPropagation();
        e.preventDefault();

        isDragPotential = true;

        mouseStart[0] = e.clientX;
        mouseStart[1] = e.clientY;

        let offsets = node.getBoundingClientRect();
        dragOffset[0] = offsets.left;
        dragOffset[1] = offsets.top;

        draggedNode = node;
    });
}

function makeDirectoryNode(label){
    let dir_node = document.createElement("div");
    dir_node.classList.add("node");
    dir_node.classList.add("directory");
    dir_node.dataset.label = label;

    let dir_node_label = document.createElement("div");
    dir_node_label.classList.add("node-label", "bi-folder2-open");

    let dir_node_label_text_div = document.createElement("div");
    dir_node_label_text_div.classList.add("node-label-text");

    let dir_node_upload_file_button = document.createElement("button");
    dir_node_upload_file_button.classList.add("bi-plus-circle", "node-button");

    let dir_node_label_text = document.createTextNode(label);

    let dir_node_contents = document.createElement("div");
    dir_node_contents.classList.add("directory-contents", "open-directory");


    dir_node_label_text_div.appendChild(dir_node_label_text);
    dir_node_label.appendChild(dir_node_label_text_div);
    dir_node_label.appendChild(dir_node_upload_file_button);
    dir_node.appendChild(dir_node_label);
    dir_node.appendChild(dir_node_contents);

    // Handle showing/hiding the folder's contents
    // Uses a combination of CSS transitions + some Javascript
    // hacks to make it function correctly.
    dir_node.addEventListener("click", async function (e) {
        let isOpen = dir_node_contents.classList.contains("open-directory");
        let newState = !isOpen;
        if (newState == false){
            dir_node_contents.classList.remove("open-directory");
            dir_node_contents.classList.add("closed-directory");
            dir_node_contents.style.maxHeight = dir_node.children[1].scrollHeight+"px";
            window.getComputedStyle(dir_node.children[1]).maxHeight; // Hack to force it to immediately update its height
            dir_node_contents.style.maxHeight = "0px"; // This then becomes the target height to transition to
            dir_node_label.classList.remove("bi-folder2-open");
            dir_node_label.classList.add("bi-folder2");
        }
        else{
            dir_node_contents.classList.add("open-directory");
            dir_node_contents.classList.remove("closed-directory");
            dir_node_contents.style.maxHeight = dir_node.children[1].scrollHeight+"px";
            dir_node_label.classList.add("bi-folder2-open");
            dir_node_label.classList.remove("bi-folder2");
            setTimeout(function(){
                isOpen = dir_node.children[1].classList.contains("open-directory");
                if (isOpen)
                    dir_node.children[1].style.maxHeight = 'initial';
            }, 320);
        }
        e.stopPropagation();
    });
    // Handle uploading files when clicked.
    dir_node_upload_file_button.addEventListener("click", async function (e) {
        document.getElementById("fileuploader").dataset.uploadDirectory = getFullPath(dir_node);
        document.getElementById("fileuploader").click();
        e.stopPropagation();
    });

    initFileNodeCallbacks(dir_node);
    return dir_node;
}

function makeFileNode(label){
    let extensionLookup = {"json":"json","ogg":"sound", "mp3":"sound", "wav":"sound", "m4a":"sound", "png":"image", "jpg":"image", "bmp":"image"};
    let iconLookup = {"sound":"bi-file-music", "image":"bi-file-image", "json":"bi-filetype-json", "unknown":"bi-file"};

    let file_node_label = document.createElement("div");
    file_node_label.classList.add("node", "file", "node-label");
    file_node_label.dataset.label = label;

    let fileType = extensionLookup[pathFileExtension(label)];
    if (fileType==null||fileType==undefined)
        fileType = "unknown";
    file_node_label.classList.add(iconLookup[fileType]);

    let file_node_label_text_div = document.createElement("div");
    file_node_label_text_div.classList.add("node-label-text");

    let file_node_label_text = document.createTextNode(label);

    file_node_label_text_div.appendChild(file_node_label_text);
    file_node_label.appendChild(file_node_label_text_div);

    file_node_label.addEventListener("click", async function (e) {
        e.stopPropagation();
    });
    file_node_label.addEventListener("dblclick", async function (e) {
        e.stopPropagation();
        viewFile(getFullPath(file_node_label),"text/plain");
    });

    initFileNodeCallbacks(file_node_label);
    return file_node_label;
}

function populatefileView(files, root){
    for (let file of files){
        if (!isViewablePath(file.get("path")))continue;
        if (file.get("children")!=null)
        {
            let dir_node = makeDirectoryNode(file.get("label"));
            root.appendChild(dir_node);
            populatefileView(file.get("children"), dir_node.children[1]);
        }
        else
        {
            let file_node_label = makeFileNode(file.get("label"));
            root.appendChild(file_node_label);
        }
    }
}


// Drag&Drop Handling Functions, Variables and Events
let isDragPotential = false;
let mouseStart = [0,0];
let dragOffset = [0,0];
let draggedNode = null;
let draggedClone = null;
let isDragging = false;
let dragDist = 4*4;

let insertionPoint = document.createElement("div");
insertionPoint.classList.add("insertion-point-display");

function getNewPathInTree(cx,cy,elem){
    for(let under of document.elementsFromPoint(cx, cy)){
        if (isNode(under) && !contains(draggedNode, under) && !contains(draggedClone, under) && draggedClone != under){
            let isDir = isDirectory(under);
            let label = under;
            if (isDir)
                label = under.children[0];
            let offsets = label.getBoundingClientRect();
            let midpoint = offsets.top + offsets.height/2;

            let dropPos = "/";
            let dropIndex = -1;

            if (cy < midpoint || draggedNode == under){
                dropPos = getFullDirectoryPath(under)+getFilename(elem);
                dropIndex = [].indexOf.call(under.parentNode.children, under);
            }
            else{
                if (isDir){
                    dropPos = getFullPath(under)+"/"+elem.dataset.label;
                    dropIndex = 0;
                }
                else{
                    dropPos = getFullDirectoryPath(under)+elem.dataset.label;
                    dropIndex = [].indexOf.call(under.parentNode.children, under)+1;
                }
            }
            return {path:dropPos, index:dropIndex};
        }
    }
    return "/"+elem.dataset.label;
}


document.addEventListener("mousemove", function(e) {
    if (isDragPotential || isDragging){
        let cx = e.clientX;
        let mx = mouseStart[0];
        let cy = e.clientY;
        let my = mouseStart[1];

        // Check if should begin dragging
        if (!isDragging && (cx-mx)*(cx-mx) + (cy-my)*(cy-my) > dragDist){
            // If so, create a clone of the dragged object
            isDragging = true;
            draggedClone = draggedNode.cloneNode(true);
            document.body.appendChild(draggedClone);
            draggedClone.classList.add('in-drag');
        }

        // If dragging, update the position of the clone and move the
        // insertionPoint line to the current insertion point.
        if (isDragging){
            draggedClone.style.left = (cx-mx+dragOffset[0])+"px";
            draggedClone.style.top = (cy-my+dragOffset[1])+"px";

            let newPath = getNewPathInTree(cx,cy,insertionPoint);
            moveNodeToPathUI(insertionPoint, newPath.path, newPath.index);
        }

    }
});

document.addEventListener("mouseup", function(e) {
    if (isDragging){
        let cx = e.clientX;
        let cy = e.clientY;

        let newPath = getNewPathInTree(cx,cy,draggedNode);
        let oldPath = getFullPath(draggedNode);

        // Perform the rename, then reposition the draggedNode to the correct index
        FS.rename(oldPath, newPath.path);
        draggedNode.remove();
        moveNodeToPathUI(draggedNode, newPath.path, newPath.index);

        // Tidy up drag
        insertionPoint.remove();
        draggedClone.remove();
        draggedClone = null;
        e.stopPropagation();
    }
    isDragPotential = false;
    isDragging = false;
});


// File System and File System View Initialization
moduleEvents.addEventListener("onRuntimeInitialized", function() {

    // Initialize file view with existing folders/files
    populatefileView(scanFilesystem("/"), document.getElementById("fileView").children[1]);

    // Attach to file system callbacks
    FSEvents.addEventListener('onMovePath', function(e) {
        moveNodeToPathUI(getNodeFromPath(e.oldpath), e.newPath, -1);
    });
    FSEvents.addEventListener('onMakeDirectory', function(e) {
        if (!isViewablePath(e.path))return;

        let new_dir_node = getNodeFromPath(pathDirName(e.path));

        if (getChildNodeWithFilename(new_dir_node, pathFileName(e.path)) != null)
            return;

        let dir_node = makeDirectoryNode(pathFileName(e.path), e.path);
        getDirectoryContents(new_dir_node).appendChild(dir_node);
    });
    FSEvents.addEventListener('onDeletePath', function(e) {
        if (!isViewablePath(e.path))return;

        let new_dir_node = getNodeFromPath(pathDirName(e.path));
        new_dir_node.remove();
    });
    FSEvents.addEventListener('onOpenFile', function(e) {
        if ((e.flags & 64)==0)
            return;

        let path = e.path;
        if (!path.startsWith("/"))
            path = "/"+e.path;
        if (!isViewablePath(path))return;

        let new_dir_node = getNodeFromPath(path);
        if (new_dir_node!=null)
            return;

        new_dir_node = getNodeFromPath(pathDirName(path));
        let dir_node = makeFileNode(pathFileName(path), path);
        getDirectoryContents(new_dir_node).appendChild(dir_node);
    });

    // Create default folders
    if (!FSFileExists("/Resources"))
        FS.mkdir("/Resources");
    if (!FSFileExists("/Resources/animations"))
        FS.mkdir("/Resources/animations");
    if (!FSFileExists("/Resources/bundles"))
        FS.mkdir("/Resources/bundles");
    if (!FSFileExists("/Resources/databases"))
        FS.mkdir("/Resources/databases");
    if (!FSFileExists("/Resources/fonts"))
        FS.mkdir("/Resources/fonts");
    if (!FSFileExists("/Resources/images"))
        FS.mkdir("/Resources/images");
    if (!FSFileExists("/Resources/json"))
        FS.mkdir("/Resources/json");
    if (!FSFileExists("/Resources/server"))
        FS.mkdir("/Resources/server");
    if (!FSFileExists("/Resources/sounds"))
        FS.mkdir("/Resources/sounds");
});