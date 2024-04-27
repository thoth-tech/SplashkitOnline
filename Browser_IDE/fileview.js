"use strict";
let myTreeView = new TreeView(document.getElementById("fileView"), {"persistent":"node-persistent", "transient":"node-transient"});


// Attach callbacks for treeview GUI
myTreeView.addEventListener("nodeMoveRequest", async function(e){
    try {
        await unifiedFS.rename(
            e.oldPath,
            e.newPath,
            e.FS.includes("transient"),
            e.FS.includes("persistent")
        );

        if('onsuccess' in e) e.onsuccess();
    } catch(err){
        if('onerror' in e) e.onerror(err);
    }
});

myTreeView.addEventListener("nodeDoubleClick", function(e){
    if (e.FS.includes("persistent"))
        FSviewFile(e.path,"text/plain");
});

myTreeView.addEventListener("folderUploadRequest", function(e){
    document.getElementById("fileuploader").dataset.uploadDirectory = e.path;
    document.getElementById("fileuploader").click();
});

myTreeView.addEventListener("fileDeleteRequest", function(e){
    if (e.FS.includes("transient"))
        executionEnviroment.unlink(e.path);
    if (e.FS.includes("persistent"))
        storedProject.access((project)=>project.unlink(e.path));
});

myTreeView.addEventListener("folderDeleteRequest", function(e){
    if (e.FS.includes("transient"))
        executionEnviroment.rmdir(e.path, true);
    if (e.FS.includes("persistent"))
        storedProject.access((project)=>project.rmdir(e.path, true));
});

// Attach to file system callbacks within the Execution Environment
executionEnviroment.addEventListener('onMovePath', function(e) {
    myTreeView.moveNode(e.oldPath, e.newPath, "transient");
});

executionEnviroment.addEventListener('onMakeDirectory', function(e) {
    myTreeView.addDirectory(e.path, "transient");
});

executionEnviroment.addEventListener('onDeletePath', function(e) {
    myTreeView.deleteNode(e.path, "transient");
});

executionEnviroment.addEventListener('onOpenFile', function(e) {
    myTreeView.addFile(e.path, "transient");
});

// Attach to file system callbacks within the IDBStoredProject
storedProject.addEventListener('onMovePath', function(e) {
    //TODO: Get moving to specific index working again - ideally make it persistent as well
    myTreeView.moveNode(e.oldPath, e.newPath, "persistent");
});

storedProject.addEventListener('onMakeDirectory', function(e) {
    myTreeView.addDirectory(e.path, "persistent");
});

storedProject.addEventListener('onDeletePath', function(e) {
    myTreeView.deleteNode(e.path, "persistent");
});

storedProject.addEventListener('onOpenFile', function(e) {
    myTreeView.addFile(e.path, "persistent");
});


storedProject.addEventListener("attached", async function() {
    let fileTree = await storedProject.access((project)=>project.getFileTree());
    myTreeView.populatefileView(fileTree, "persistent");
});

storedProject.addEventListener("detached", function() {
    myTreeView.reset();
});