"use strict";

// Drag&Drop Handling Functions, Variables and Events
let isDragPotential = false;
let mouseStart = [0,0];
let dragOffset = [0,0];
let draggedNode = null;
let draggedClone = null;
let activeTree = null;
let isDragging = false;
let dragDist = 4*4;

let insertionPoint = document.createElement("div");
insertionPoint.classList.add("insertion-point-display");

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

            let newPath = activeTree.getNewPathInTree(cx,cy,insertionPoint);
            activeTree.moveNodeToPathUI(insertionPoint, newPath.path, newPath.index);
        }

    }
});

document.addEventListener("mouseup", function(e) {
    if (isDragging){
        let cx = e.clientX;
        let cy = e.clientY;

        let newPath = activeTree.getNewPathInTree(cx,cy,draggedNode);
        let oldPath = activeTree.getFullPath(draggedNode);


        let boundNode = draggedNode;
        let boundTree = activeTree;


        let ev = new Event("nodeMoveRequest");
        ev.treeView = activeTree;
        ev.oldPath = oldPath;
        ev.newPath = newPath.path;
        ev.FS = boundTree.nodeGetFS(boundNode);

        ev.onsuccess = () => {
            // TODO: Move moveNodeToPathUI call here.
            // It currently expects to run *before* the FS node is renamed,
            // and so it cannot check whether the rename succeeded.
        };
        ev.onerror = (err) => {
			let errEv = new Event("filesystemError");
			errEv.shortMessage = "Move failed";
			errEv.longMessage = "An error occured and the file/directory could not be moved to its new location.\n\nReason:\n" + err;
			window.dispatchEvent(errEv);

            boundTree.moveNodeToPathUI(boundNode, oldPath, 0);

			throw err;
        };
        
        boundNode.remove();
        boundTree.moveNodeToPathUI(boundNode, newPath.path, newPath.index);

        activeTree.dispatchEvent(ev);


        // Tidy up drag
        insertionPoint.remove();
        draggedClone.remove();
        draggedClone = null;
        e.stopPropagation();
        e.preventDefault();
    }
    isDragPotential = false;
    isDragging = false;
    draggedNode = null;
    activeTree = null;
});

// TreeView class that can display files from multiple file systems
class TreeView extends EventTarget{

    constructor(container, FSes){
        super();
        this.container = container;
        this.container._TreeView = this;

        this.root = this.makeDirectoryNode("");
        this.container.appendChild(this.root);
        this.FSes = FSes;
        let FSesReverseLookup = {}
        for (let [key,value] of Object.entries(FSes)){
            FSesReverseLookup[value] = key;
        }
        this.FSesRL = FSesReverseLookup;
    }

    // Public Facing Methods
    // note: None of these manual changes to the tree call any callbacks - this stops any recursion happening
    moveNode(oldPath, newPath, FS){
        let treeView = this;
        if (oldPath == newPath)
            return;
        // Recursively merge trees
        function recurseTree(rel_path){
            let node = treeView.getNodeFromPath(oldPath+rel_path);
            let newPath_this = newPath+rel_path;

            if (treeView.isDirectory(node)){
                treeView.addDirectory(newPath_this, FS);
                let c = treeView.getDirectoryContents(node).children
                for (let i = c.length-1; i >=0 ; i--){
                    let child = c[i]
                    recurseTree(rel_path + "/" + treeView.getFilename(child));
                }
            }
            else{
                treeView.addFile(newPath_this, FS);
            }

            treeView.dettachNodeFromFS(node, FS);
        }

        recurseTree("");
    }
    deleteNode(path, FS){
        let dir_node = this.getNodeFromPath(path);
        if (dir_node != null)
            this.dettachNodeFromFS(dir_node, FS);
    }
    addDirectory(path, FS){
        let parent_dir_node = this.getNodeFromPath(this.pathDirName(path));
        let new_dir_node = this.getChildNodeWithFilename(parent_dir_node, this.pathFileName(path));
        if (new_dir_node == null){
            new_dir_node = this.makeDirectoryNode(this.pathFileName(path), path);
            this.getDirectoryContents(parent_dir_node).appendChild(new_dir_node);
        }
        this.attachNodeToFS(new_dir_node, FS);
    }
    addFile(path, FS){
        let file_node = this.getNodeFromPath(path);
        if (file_node==null){
            let dir_node = this.getNodeFromPath(this.pathDirName(path));
            file_node = this.makeFileNode(this.pathFileName(path), path);
            this.getDirectoryContents(dir_node).appendChild(file_node);
        }
        this.attachNodeToFS(file_node, FS);
    }
    reset(){
        let rootContent = this.getDirectoryContents(this.root);
        while (rootContent.firstChild){
            rootContent.firstChild.remove();
        }
    }




    // "Private" Methods
    attachNodeToFS(node, FS){
        node.classList.add(this.FSes[FS]);
    }
    dettachNodeFromFS(node, FS){
        node.classList.remove(this.FSes[FS]);
        for (let [_v, _FS] of Object.entries(this.FSes)){
            if (node.classList.contains(_FS))
                return;// Is attached to an FS
        }
        // Is not attached - remove
        node.remove();
    }
    nodeGetFS(node){
        let FSes = []
        for (let [_FSname, _FSclass] of Object.entries(this.FSes)){
            if (node.classList.contains(_FSclass))
                FSes.push(_FSname);
        }
        return FSes;
    }

    getNewPathInTree(cx,cy,elem){
        for(let under of document.elementsFromPoint(cx, cy)){
            if (this.isNode(under) && !this.contains(draggedNode, under) && !this.contains(draggedClone, under) && draggedClone != under){
                let isDir = this.isDirectory(under);
                let label = under;
                if (isDir)
                    label = under.children[0];
                let offsets = label.getBoundingClientRect();
                let midpoint = offsets.top + offsets.height/2;

                let dropPos = "/";
                let dropIndex = -1;

                if (cy < midpoint || draggedNode == under){
                    dropPos = this.getFullDirectoryPath(under)+this.getFilename(elem);
                    dropIndex = [].indexOf.call(under.parentNode.children, under);
                }
                else{
                    if (isDir){
                        dropPos = this.getFullPath(under)+"/"+elem.dataset.label;
                        dropIndex = 0;
                    }
                    else{
                        dropPos = this.getFullDirectoryPath(under)+elem.dataset.label;
                        dropIndex = [].indexOf.call(under.parentNode.children, under)+1;
                    }
                }
                return {path:dropPos, index:dropIndex};
            }
        }
        return {path:"/"+elem.dataset.label, index:0};
    }

    // ------- Utility Functions --------
    // function 'contains' from Aleksandr Makov - https://stackoverflow.com/a/47485168
    // How does this work??
    contains(parent, child) {
        return parent !== child && parent.contains(child);
    }
    // Node Utility Functions
    isNode(node){
        return node.classList.contains("node");
    }
    isDirectory(node){
        return node.classList.contains("directory");
    }
    getParentDirectory(node){
        if (node.dataset.label=="" || node.dataset.label==undefined)
            return null;
        return node.parentElement.parentElement;
    }
    getDirectoryContents(node){
        return node.children[1];
    }
    getFilename(node){
        return node.dataset.label;
    }
    getFullDirectoryPath(node){
        let ret = "";
        let dir = this.getParentDirectory(node);
        while(dir!=null){
            ret = this.getFilename(dir)+"/"+ret;
            dir = this.getParentDirectory(dir);
        }
        return ret;
    }
    getFullPath(node){
        return this.getFullDirectoryPath(node)+this.getFilename(node);
    }
    getChildNodeWithFilename(root, name){
        for(let child of this.getDirectoryContents(root).children){
            if (this.getFilename(child)==name)
                return child;
        }
        return null;
    }
    getNodeFromPath(path){
        let dir = this.root;

        for (let part of this.splitPath(path)){
            dir = this.getChildNodeWithFilename(dir, part);
            if (dir==null)
                return null;
        }
        return dir;
    }

    // String Path Utility Functions
    pathDirName(path){
        return path.substring(0, path.lastIndexOf("/"));
    }
    pathFileName(path){
        return path.substring(path.lastIndexOf("/")+1);
    }
    pathFileExtension(path){
        return path.substring(path.lastIndexOf(".")+1);
    }
    splitPath(path){
        return path.split("/").slice(1);
    }

    // TreeView Utility Functions
    moveNodeToPathUI(node, newPath, index){
        //if (!this.isViewablePath(newPath))return;
        let new_dir_node = this.getNodeFromPath(this.pathDirName(newPath));

        if (node!=insertionPoint)
            this.renameNode(node, this.pathFileName(newPath));

        if (index == -1 && node.parent == this.getDirectoryContents(new_dir_node))
            return;

        if (index == -1 || index >= this.getDirectoryContents(new_dir_node).children.length)
            this.getDirectoryContents(new_dir_node).appendChild(node);
        else
            this.getDirectoryContents(new_dir_node).insertBefore(node, this.getDirectoryContents(new_dir_node).children[index]);
    }

    // File System UI Node Creation Functions
    initFileNodeCallbacks(_node)
    {
        let node = _node;
        let TreeView = this;
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
            activeTree = TreeView;
        });
    }

    makeDirectoryNode(label){
        let dir_node = document.createElement("div");
        dir_node.classList.add("node");
        dir_node.classList.add("directory");
        dir_node.dataset.label = label;

        let dir_node_label = document.createElement("div");
        dir_node_label.classList.add("node-label", "bi-folder2-open");

        let dir_node_label_text_div = document.createElement("div");
        dir_node_label_text_div.classList.add("node-label-text");

        let dir_node_upload_file_button = document.createElement("button");
        dir_node_upload_file_button.classList.add("bi-file-earmark-arrow-up", "node-button");

        // The root directory should not be deleteable.
        // Seems hack-y. Is "" a valid file/dir name?
        // Maybe it would be better for the caller to just remove the button afterwards. 
        let dir_node_delete_button = undefined;
        if(label != ""){
            dir_node_delete_button = document.createElement("button");
            dir_node_delete_button.classList.add("bi-trash", "node-button");
        }

        let dir_node_label_text = document.createTextNode(label==""?"/":label);

        let dir_node_contents = document.createElement("div");
        dir_node_contents.classList.add("directory-contents", "open-directory");


        dir_node_label_text_div.appendChild(dir_node_label_text);
        dir_node_label.appendChild(dir_node_label_text_div);
        dir_node_label.appendChild(dir_node_upload_file_button);

        if(label != ""){
            dir_node_label.appendChild(dir_node_delete_button);
        }

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
        let boundTree = this;
        // Handle uploading files when clicked.
        dir_node_upload_file_button.addEventListener("click", async function (e) {
            let ev = new Event("folderUploadRequest");
            ev.treeView = boundTree;
            ev.path = boundTree.getFullPath(dir_node);
            ev.FS = boundTree.nodeGetFS(dir_node);
            boundTree.dispatchEvent(ev);
            e.stopPropagation();
        });

        if(label != ""){
            dir_node_delete_button.addEventListener("click", async function(e){
                let confirmEv = new Event("needConfirmation");
                confirmEv.shortMessage = "Confirm delete";
                confirmEv.longMessage = "Are you sure you want to delete this?";
                confirmEv.confirmLabel = "Delete";
                confirmEv.oncancel = ()=>{};
                confirmEv.onconfirm = ()=>{
                    let deleteEv = new Event("folderDeleteRequest");
                    deleteEv.treeView = boundTree;
                    deleteEv.path = boundTree.getFullPath(dir_node);
                    deleteEv.FS = boundTree.nodeGetFS(dir_node);
                    boundTree.dispatchEvent(deleteEv);
                };
                window.dispatchEvent(confirmEv);
                e.stopPropagation();
            });
        }

        this.initFileNodeCallbacks(dir_node);
        return dir_node;
    }

    makeFileNode(label){
        let extensionLookup = {"json":"json","ogg":"sound", "mp3":"sound", "wav":"sound", "m4a":"sound", "png":"image", "jpg":"image", "bmp":"image"};
        let iconLookup = {"sound":"bi-file-music", "image":"bi-file-image", "json":"bi-filetype-json", "unknown":"bi-file"};

        let file_node_label = document.createElement("div");
        file_node_label.classList.add("node", "file", "node-label");
        file_node_label.dataset.label = label;

        let fileType = extensionLookup[this.pathFileExtension(label)];
        if (fileType==null||fileType==undefined)
            fileType = "unknown";
        file_node_label.classList.add(iconLookup[fileType]);

        let file_node_label_text_div = document.createElement("div");
        file_node_label_text_div.classList.add("node-label-text");

        let file_node_delete_button = document.createElement("button");
        file_node_delete_button.classList.add("bi-trash", "node-button");

        let file_node_label_text = document.createTextNode(label);

        file_node_label_text_div.appendChild(file_node_label_text);
        file_node_label.appendChild(file_node_label_text_div);
        file_node_label.appendChild(file_node_delete_button);

        file_node_label.addEventListener("click", async function (e) {
            e.stopPropagation();
        });
        let boundTree = this;
        file_node_label.addEventListener("dblclick", async function (e) {
            e.stopPropagation();

            let ev = new Event("nodeDoubleClick");
            ev.treeView = boundTree;
            ev.path = boundTree.getFullPath(file_node_label);
            ev.FS = boundTree.nodeGetFS(file_node_label);
            boundTree.dispatchEvent(ev);
        });

        file_node_delete_button.addEventListener("click", async function(e){
            let confirmEv = new Event("needConfirmation");
            confirmEv.shortMessage = "Confirm delete";
            confirmEv.longMessage = "Are you sure you want to delete this?";
            confirmEv.confirmLabel = "Delete";
            confirmEv.oncancel = ()=>{};
            confirmEv.onconfirm = ()=>{
                let deleteEv = new Event("fileDeleteRequest");
                deleteEv.treeView = boundTree;
                deleteEv.path = boundTree.getFullPath(file_node_label);
                deleteEv.FS = boundTree.nodeGetFS(file_node_label);
                boundTree.dispatchEvent(deleteEv);
            };
            window.dispatchEvent(confirmEv);
            e.stopPropagation();
        });

        this.initFileNodeCallbacks(file_node_label);
        return file_node_label;
    }

    renameNode(node, newLabel){
        node.dataset.label = newLabel;
        if (this.isDirectory(node))
            node.children[0].children[0].innerText = newLabel;
        else
            node.children[0].innerText = newLabel;
    }

    _populatefileView(files, path, FS){
        for (let file of files){


            if (file.children!=null)
            {
                this.addDirectory(path + file.label, FS);
                this._populatefileView(file.children, path + file.label + "/", FS);
            }
            else
            {
                this.addFile(path + file.label, FS);
            }
        }
    }
    populatefileView(files, FS){
        this._populatefileView(files, "/", FS);
    }

}

