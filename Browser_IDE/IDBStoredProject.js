"use strict";

class IDBStoredProject extends EventTarget {
    constructor(initializer) {
        super();
        this.initializer = initializer;
        this.projectName = null;
        this.lastKnownWriteTime = 0;
        this.projectGUID = null;

        // Initialize the SplashKitOnlineProjects database
        this.initializeProjectDB().catch(error => {
            console.error("Error initializing SplashKitOnlineProjects:", error);
        });
    }

    async initializeProjectDB() {
        // Open a connection to the SplashKitOnlineProjects database
        let openRequest = indexedDB.open("SplashKitOnlineProjects", 1);

        // Define the structure of the database
        openRequest.onupgradeneeded = function (event) {
            let db = event.target.result;
            db.createObjectStore("projects", { keyPath: "name" });
        };

        return new Promise((resolve, reject) => {
            openRequest.onsuccess = function (event) {
                resolve(event.target.result);
            };

            openRequest.onerror = function (event) {
                reject(event.error);
            };
        });
    }

    async attachToProject(projectName) {
        this.projectName = projectName;

        // Retrieve the project GUID from SplashKitOnlineProjects
        this.projectGUID = await this.getProjectGUID(projectName);

        // Force an init by performing an empty DB operation
        await this.access(() => {});

        // Initial update of lastKnownWriteTime
        await this.checkForWriteConflicts();

        this.dispatchEvent(new Event("attached"));
    }

    async getProjectGUID(projectName) {
        // Open a connection to the SplashKitOnlineProjects database
        let db = await this.initializeProjectDB();

        // Retrieve the project object from the projects object store
        let transaction = db.transaction("projects", "readonly");
        let objectStore = transaction.objectStore("projects");
        let request = objectStore.get(projectName);

        return new Promise((resolve, reject) => {
            request.onsuccess = function (event) {
                let project = event.target.result;
                resolve(project ? project.guid : null);
            };

            request.onerror = function (event) {
                reject(event.error);
            };
        });
    }

    async access(func) {
        let RW = new __IDBStoredProjectRW(this);
        try {
            await RW.openDB();
            return await func(RW);
        } catch (err) {
            throw err;
        } finally {
            RW.closeDB();
        }
    }

    async checkForWriteConflicts() {
        if (this.projectName == null) return;

        let storedTime = await this.access(project => project.getLastWriteTime());
        if (this.lastKnownWriteTime == 0) {
            this.lastKnownWriteTime = storedTime;
        }
        if (storedTime > this.lastKnownWriteTime)
            this.dispatchEvent(new Event("timeConflict"));
    }

    detachFromProject() {
        this.projectName = null;
        this.lastKnownWriteTime = 0;
        this.dispatchEvent(new Event("detached"));
    }

    deleteProject(projectName) {
        return new Promise((resolve, reject) => {
            let res = indexedDB.deleteDatabase(projectName);
            res.onerror = function () {
                reject(res.error);
            };
            res.onsuccess = function () {
                resolve();
            };
        });
    }

    async renameProject(newProjectName) {
        // Update project name in SplashKitOnlineProjects
        await this.updateProjectNameMapping(newProjectName);

        // Update the current project's name
        this.projectName = newProjectName;
    }

    async updateProjectNameMapping(newProjectName) {
        // Open a connection to the SplashKitOnlineProjects database
        let db = await this.initializeProjectDB();

        // Update the project name mapping
        let transaction = db.transaction("projects", "readwrite");
        let objectStore = transaction.objectStore("projects");
        let request = objectStore.put({ name: newProjectName, guid: this.projectGUID });

        return new Promise((resolve, reject) => {
            request.onsuccess = function () {
                resolve();
            };

            request.onerror = function (event) {
                reject(event.error);
            };
        });
    }
};

// Private class - can create by calling the 'access' function on a IDBStoredProject
class __IDBStoredProjectRW {
    constructor(IDBSP) {
        this.owner = IDBSP;
        this.ROOT = -1; // ID for root node
        this.db = null;
        this.doInitialization = false;
        this.performedWrite = false;
    }
    openDB() {
        let IDBFS = this;
        return new Promise(function (resolve, reject) {

            if (IDBFS.owner.projectName == null)
                return reject();

            if (IDBFS.db != null)
                reject();

            let openRequest = indexedDB.open(IDBFS.owner.projectName, 1);

            openRequest.onupgradeneeded = function (ev) {
                IDBFS.db = openRequest.result;
                IDBFS.db.createObjectStore("project", { keyPath: "category" });
                let files = IDBFS.db.createObjectStore("files", { keyPath: "nodeId", autoIncrement: true });

                files.createIndex("name", "name", { unique: false });
                files.createIndex("parent", "parent", { unique: false });
                if (ev.oldVersion == 0)
                    IDBFS.doInitialization = true;
            };
            openRequest.onsuccess = async function (e) {
                IDBFS.db = openRequest.result;
                if (IDBFS.doInitialization) {
                    await IDBFS.owner.initializer(IDBFS);
                    await IDBFS.updateLastWriteTime();
                }
                IDBFS.doInitialization = false;
                resolve();
            };
            openRequest.onerror = function (e) {
                IDBFS.owner.dispatchEvent(new Event("connectionFailed"));
                reject();
            };
        });
    }

    closeDB() {
        if (this.performedWrite)
            this.updateLastWriteTime();
        if (this.db != null)
            this.db.close();
        this.db = null;
    }

    async getLastWriteTime() {
        let IDBSP = this;
        return await this.doTransaction("project", "readwrite", async function (t, project) {
            let lastTime = await IDBSP.request(t, function () {
                return project.get("lastWriteTime");
            });
            if (lastTime == undefined || lastTime == null)
                return 0;
            else
                return lastTime.time;
        });
    }

    async updateLastWriteTime(time = null) {
        if (time == null)
            time = Date.now();

        let IDBSP = this;
        await this.doTransaction("project", "readwrite", async function (t, project) {
            await IDBSP.request(t, function () {
                return project.put({ category: "lastWriteTime", time: time });
            });
        });
        this.owner.lastKnownWriteTime = time;
    }

    // File System Related
    async mkdir(path) {
        let IDBSP = this;
        let dirName = this.pathFileName(path);
        await this.doTransaction("files", "readwrite", async function (t, files) {
            let parentNode = await IDBSP.getNodeFromPath(t, files, IDBSP.pathDirName(path));
            if (parentNode != null && await IDBSP.getChildNodeWithName(t, files, parentNode, dirName) == null) {
                await IDBSP.makeNode(t, files, dirName, "DIR", null, parentNode);
                let ev = new Event("onMakeDirectory");
                ev.path = path;
                IDBSP.owner.dispatchEvent(ev);
            }
        });
    }

    async writeFile(path, data) {
        let IDBSP = this;
        let fileName = this.pathFileName(path);
        await this.doTransaction("files", "readwrite", async function (t, files) {
            let parentNode = await IDBSP.getNodeFromPath(t, files, IDBSP.pathDirName(path));
            if (parentNode != null) {
                let node = await IDBSP.getChildNodeWithName(t, files, parentNode, fileName);
                if (node == null) {
                    await IDBSP.makeNode(t, files, fileName, "FILE", data, parentNode);
                } else {
                    let nodeInt = await IDBSP.getNode(t, files, node);
                    await IDBSP.replaceNode(t, files, nodeInt.nodeId, nodeInt.name, nodeInt.type, data, nodeInt.parent);
                }
                let ev = new Event("onOpenFile");
                ev.path = path;
                IDBSP.owner.dispatchEvent(ev);
                ev = new Event("onWriteToFile");
                ev.path = path;
                IDBSP.owner.dispatchEvent(ev);
            }
        });
    }

    async rename(oldPath, newPath) {
        let IDBSP = this;
        let oldPath_dir = this.pathDirName(oldPath);
        let newPath_dir = this.pathDirName(newPath);
        let newPath_name = this.pathFileName(newPath);
        await this.doTransaction("files", "readwrite", async function (t, files) {
            let node = await IDBSP.getNodeFromPath(t, files, oldPath);
            if (node != null) {
                let nodeInt = await IDBSP.getNode(t, files, node);
                if (oldPath_dir != newPath_dir) {
                    let newPath_Node = await IDBSP.getNodeFromPath(t, files, newPath_dir);
                    if (newPath_Node == null)
                        return;
                    nodeInt.parent = newPath_Node;
                }
                await IDBSP.replaceNode(t, files, nodeInt.nodeId, newPath_name, nodeInt.type, nodeInt.data, nodeInt.parent);
                let ev = new Event("onMovePath");
                ev.oldPath = oldPath;
                ev.newPath = newPath;
                IDBSP.owner.dispatchEvent(ev);
            }
        });
    }

    async readFile(path) {
        let IDBSP = this;
        return this.doTransaction("files", "readonly", async function (t, files) {
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

    getAllFilesRaw() {
        let IDBSP = this;
        return new Promise((resolve, reject) => {
            let transaction = IDBSP.db.transaction("files", "readonly");
            let files = transaction.objectStore("files");
            let result = files.getAll();

            transaction.onerror = function () { reject(transaction.error); };
            transaction.oncomplete = function () { resolve(result.result); };
        });
    }

    async getFileTree() {
        let IDBSP = this;
        return await this.doTransaction("files", "readonly", async function (t, files) {
            async function _internal(node) {
                let tree = [];
                for (node of await IDBSP.getChildNodes(t, files, node)) {
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
    doTransaction(store, state, func) {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(store, state);
            let files = transaction.objectStore(store);
            let result = func(transaction, files);

            transaction.onerror = function () { console.log("error"); transaction.abort(); reject(transaction.error); };
            transaction.oncomplete = function () { resolve(result); };
        });
    }
    request(transaction, func) {
        return new Promise((resolve, reject) => {
            let result = func();
            result.onerror = function () { console.log("error"); transaction.abort(); reject(result.error); };
            result.onsuccess = function () {
                resolve(result.result);
            };
        });
    }

    // Basic Node Handling
    makeNode(transaction, files, name, type, data, parent) {
        this.performedWrite = true;
        return this.request(transaction, function () {
            return files.add({ name: name, type: type, data: data, parent: parent });
        });
    }
    replaceNode(transaction, files, nodeId, name, type, data, parent) {
        this.performedWrite = true;
        return this.request(transaction, function () {
            return files.put({ nodeId: nodeId, name: name, type: type, data: data, parent: parent });
        });
    }
    getNode(transaction, files, nodeId) {
        return this.request(transaction, function () {
            return files.get(nodeId);
        });
    }

    // Directory Handling
    async getChildNodeWithName(transaction, files, nodeId, name) {
        let children = await this.getChildNodes(transaction, files, nodeId);
        for (let child of children) {
            if (child.name == name)
                return child.nodeId;
        }
        return null;
    }

    async getChildNodes(transaction, files, nodeId) {
        let filesB = files;
        let result = await this.request(transaction, function () { return filesB.index("parent").getAll(nodeId); });
        return result;
    }

    async getNodeFromPath(transaction, files, path) {
        let node = this.ROOT;

        let split = this.splitPath(path);
        for (let dir of split) {
            node = await this.getChildNodeWithName(transaction, files, node, dir);
            if (node == null)
                return null;
        }
        return node;
    }

    // String Path Utility Functions
    pathDirName(path) {
        return path.substring(0, path.lastIndexOf("/"));
    }
    pathFileName(path) {
        return path.substring(path.lastIndexOf("/") + 1);
    }
    splitPath(path) {
        return path.split("/").slice(1);
    }
}

// Example usage:

// Initialize IDBStoredProject
const storedProject = new IDBStoredProject(async (project) => {
    // Initialize the project here if necessary
});

// Attach to a project
storedProject.attachToProject("myProject").then(() => {
    console.log("Attached to project: myProject");
}).catch(error => {
    console.error("Error attaching to project:", error);
});

// Rename a project
storedProject.renameProject("newProjectName").then(() => {
    console.log("Project renamed successfully");
}).catch(error => {
    console.error("Error renaming project:", error);
});

// Other operations like writeFile, readFile, etc. can be performed similarly
