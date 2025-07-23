"use strict";

function setupFilePanelAndEvents() {
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
            openProjectFile(e.path);
        else if (e.FS.includes("transient"))
            FSviewFiletran(e.path);
    });

    myTreeView.addEventListener("folderUploadRequest", function(e){
        document.getElementById("fileuploader").dataset.uploadDirectory = e.path;
        document.getElementById("fileuploader").click();
    });

    myTreeView.addEventListener("fileDeleteRequest", async function(e){
        try {
            await unifiedFS.unlink(
                e.path,
                e.FS.includes("transient"),
                e.FS.includes("persistent")
            );

            if('onsuccess' in e) e.onsuccess();
        } catch(err){
            if('onerror' in e) e.onerror(err);
        }
    });

    myTreeView.addEventListener("folderCreateRequest", async (e) => {
        try {
            await unifiedFS.mkdir(
                e.path,
                e.FS.includes("transient"),
                e.FS.includes("persistent")
            );

            if('onsuccess' in e) e.onsuccess();
        } catch(err){
            if('onerror' in e) e.onerror(err);
        }
    });

    myTreeView.addEventListener("folderDeleteRequest", async function(e){
        try {
            await unifiedFS.rmdir(
                e.path,
                true,
                e.FS.includes("transient"),
                e.FS.includes("persistent")
            );

            if('onsuccess' in e) e.onsuccess();
        } catch(err){
            if('onerror' in e) e.onerror(err);
        }
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
        //TODO: make these be ignored if the node has already been
		// moved by the user (and this callback is because of it)
		// Otherwise we get errors in the console.
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
}
