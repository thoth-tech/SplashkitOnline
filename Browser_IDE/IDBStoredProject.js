"use strict";


class IDBStoredProject extends EventTarget{
    constructor(initializer) {
        super();
        this.ROOT = -1;// ID for root node
        this.initializer = initializer;
        this.doInitialization = false;
    }

    // Public Facing Methods

    // Project Related
    attachToProject(storeName){
        let IDBFS = this;
        return new Promise((resolve, reject) => {
            let openRequest = indexedDB.open(storeName, 1);

            openRequest.onupgradeneeded = function() {
                IDBFS.db = openRequest.result;
                IDBFS.db.createObjectStore("project", {keyPath: "category"});
                let files = IDBFS.db.createObjectStore("files", {keyPath: "nodeId", autoIncrement: true});

                files.createIndex("name", "name", { unique: false });
                files.createIndex("parent", "parent", { unique: false });
                IDBFS.doInitialization = true;
            };
            openRequest.onsuccess = async function(e){
                IDBFS.db = openRequest.result;
                if (IDBFS.doInitialization){
                    await IDBFS.initializer(IDBFS);
                }
                IDBFS.doInitialization = false;
                IDBFS.dispatchEvent(new Event("initialized"));
                resolve();
            };
            openRequest.onerror = function(e){
                console.log("Failed to open DB");
                IDBFS.dispatchEvent(new Event("initializationFailed"));
                reject();
            };
        });
    }

    detach(){
        this.db.close();
        this.dispatchEvent(new Event("detached"));
    }

    deleteProject(storeName){
        return new Promise((resolve, reject) => {
            let res = indexedDB.deleteDatabase(storeName);
            res.onerror = function(){reject(res.error);};
            res.onsuccess = function(){resolve();};
        });

    }

    // File System Related
    async mkdir(path){
        let IDBSP = this;
        let dirName = this.pathFileName(path);
        await this.doTransaction("files", "readwrite", async function(t, files){
            let parentNode = await IDBSP.getNodeFromPath(t, files, IDBSP.pathDirName(path));
            if (parentNode != null && await IDBSP.getChildNodeWithName(t, files, parentNode, dirName) == null){
                await IDBSP.makeNode(t, files, dirName, "DIR", null, parentNode);
                let ev = new Event("onMakeDirectory");
                ev.path = path;
                IDBSP.dispatchEvent(ev);
            }
        });
    }

    async writeFile(path, data){
        let IDBSP = this;
        let fileName = this.pathFileName(path);
        await this.doTransaction("files", "readwrite", async function(t, files){
            let parentNode = await IDBSP.getNodeFromPath(t, files, IDBSP.pathDirName(path));
            if (parentNode != null){
                let node = await IDBSP.getChildNodeWithName(t, files, parentNode, fileName);
                if (node == null){
                    await IDBSP.makeNode(t, files, fileName, "FILE", data, parentNode);
                }
                else{
                    let nodeInt = await IDBSP.getNode(t, files, node);
                    await IDBSP.replaceNode(t, files, nodeInt.nodeId, nodeInt.name, nodeInt.type, data, nodeInt.parent);
                }
                let ev = new Event("onOpenFile");
                ev.path = path;
                IDBSP.dispatchEvent(ev);
                ev = new Event("onWriteToFile");
                ev.path = path;
                IDBSP.dispatchEvent(ev);
            }
        });
    }

    async rename(oldPath, newPath){
        let IDBSP = this;
        let oldPath_dir = this.pathDirName(oldPath);
        let newPath_dir = this.pathDirName(newPath);
        let newPath_name = this.pathFileName(newPath);
        await this.doTransaction("files", "readwrite", async function(t, files){
            let node = await IDBSP.getNodeFromPath(t, files, oldPath);
            if (node != null){
                let nodeInt = await IDBSP.getNode(t, files, node);
                if (oldPath_dir != newPath_dir){
                    let newPath_Node = await IDBSP.getNodeFromPath(t, files, newPath_dir);
                    if (newPath_Node == null)
                        return;
                    nodeInt.parent = newPath_Node;
                }
                await IDBSP.replaceNode(t, files, nodeInt.nodeId, newPath_name, nodeInt.type, nodeInt.data, nodeInt.parent);
                let ev = new Event("onMovePath");
                ev.oldPath = oldPath;
                ev.newPath = newPath;
                IDBSP.dispatchEvent(ev);
            }
        });
    }

    async readFile(path){
        let IDBSP = this;
        return this.doTransaction("files", "readonly", async function(t, files){
            let node = await IDBSP.getNodeFromPath(t, files, path);
            if (node != null)
                return (await IDBSP.getNode(t, files, node)).data;
            return null;
        });
    }

    // TODO: Finish these functions
    /*unlink(path){

    }

    rmdir(path){

    }*/

    getAllFilesRaw(){
        let IDBSP = this;
        return new Promise((resolve, reject) => {
            let transaction = IDBSP.db.transaction("files", "readonly");
            let files = transaction.objectStore("files");
            let result = files.getAll();

            transaction.onerror = function(){reject(transaction.error);};
            transaction.oncomplete = function(){resolve(result.result);};
        });
    }

    async getFileTree(){
        let IDBSP = this;
        return await this.doTransaction("files", "readonly", async function(t, files){
            async function _internal(node){
                let tree = [];
                for (node of await IDBSP.getChildNodes(t, files, node)){
                    let children = null;
                    if (node.type == "DIR")
                        children = await _internal(node.nodeId);
                    tree.push({
                        label: node.name,
                        children: children
                    });
                }
                return tree;
            }
            return _internal(IDBSP.ROOT);
        });
    }


    // "Private" Methods

    // Transactions Wrappers - to make them promises
    doTransaction(store, state, func)
    {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(store, state);
            let files = transaction.objectStore(store);
            let result = func(transaction, files);

            transaction.onerror = function(){console.log("error");transaction.abort(); reject(transaction.error);};
            transaction.oncomplete = function(){resolve(result);};
        });
    }
    request(transaction, func)
    {
        return new Promise((resolve, reject) => {
            let result = func();
            result.onerror = function(){console.log("error");transaction.abort(); reject(result.error);};
            result.onsuccess = function(){
            resolve(result.result);};
        });
    }

    // Basic Node Handling
    makeNode(transaction, files, name, type, data, parent){
        return this.request(transaction, function(){
            return files.add({name:name, type:type, data:data, parent:parent});
        });
    }
    replaceNode(transaction, files, nodeId, name, type, data, parent){
        return this.request(transaction, function(){
            return files.put({nodeId:nodeId, name:name, type:type, data:data, parent:parent});
        });
    }
    getNode(transaction, files, nodeId){
        return this.request(transaction, function(){
            return files.get(nodeId);
        });
    }

    // Directory Handling
    async getChildNodeWithName(transaction, files, nodeId, name){
        let children = await this.getChildNodes(transaction, files, nodeId);
        for(let child of children){
            if (child.name == name)
                return child.nodeId;
        }
        return null;
    }

    async getChildNodes(transaction, files, nodeId){
        let filesB = files;
        let result = await this.request(transaction, function(){return filesB.index("parent").getAll(nodeId);});
        return result;
    }

    async getNodeFromPath(transaction, files, path){
        let node = this.ROOT;

        let split = this.splitPath(path);
        for (let dir of split){
            node = await this.getChildNodeWithName(transaction, files, node, dir);
            if (node == null)
                return null;
        }
        return node;
    }

    // String Path Utility Functions
    pathDirName(path){
        return path.substring(0, path.lastIndexOf("/"));
    }
    pathFileName(path){
        return path.substring(path.lastIndexOf("/")+1);
    }
    splitPath(path){
        return path.split("/").slice(1);
    }



}