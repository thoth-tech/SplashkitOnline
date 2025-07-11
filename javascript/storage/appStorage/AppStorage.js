"use strict";

/**
 * Storage for the SplashKitOnline web app, not specific to a particular project.
 */
class AppStorage extends EventTarget{
    constructor() {
        super();
        this.attached = false;
    }

    async attach(){
        await this.access(async ()=>{}); // force init
        this.dispatchEvent(new Event("attached"));
        this.attached = true;
    }

    async detach(){
        this.dispatchEvent(new Event("detached"));
        this.attached = false;
    }

    async access(func){
        let RW = new __AppStorageRW(this);
        try{
            await RW.openDB();
            let res = await func(RW);
            return res;
        }
        catch(err){
            throw err;
        }
        finally{
            await RW.closeDB();
        }
    }
}

class __AppStorageRW{
    constructor(AS) {
        this.owner = AS;
        this.db = null;
        this.doInitialization = false;
        this.performedWrite = false;
    }

    openDB(){
        let AS = this;
        return new Promise((resolve, reject)=>{
            if (AS.db != null)
                reject();

            let req = indexedDB.open("SplashKitOnline", 1);

            req.onupgradeneeded = async (e) => {
                AS.db = req.result;
                AS.db.createObjectStore("app", {keyPath: "category"});
                
                let userProjectsStore = AS.db.createObjectStore("userProjects", {keyPath: "id"});
                userProjectsStore.createIndex("name", "name", {unique: true});

                if (e.oldVersion == 0)
                    AS.doInitialization = true;
            };

            req.onsuccess = async (e) => {
                AS.db = req.result;
                if (AS.doInitialization){
                    await AS.updateLastWriteTime();
                }
                AS.doInitialization = false;
                resolve();
            };

            req.onerror = async (e) => {
                AS.owner.dispatchEvent(new Event("connectionFailed"));
                reject();
            };
        });
    }

    async closeDB(){
        if (this.performedWrite)
            this.updateLastWriteTime();
        if (this.db != null)
            this.db.close();
        this.db = null;
    }

    doTransaction(store, state, func)
    {
        let AS = this;
        return new Promise(async (resolve, reject) => {
            let transaction = AS.db.transaction(store, state);
            let files = transaction.objectStore(store);
            let result = undefined;

            try {
                result = await func(transaction, files);
            } catch(err){
                reject(err);
                return;
            }

            transaction.onerror = function(){
                console.log("error", func);
                transaction.abort(); 
                reject(transaction.error);
            };
            
            transaction.oncomplete = function(){
                resolve(result);
            };
        });
    }

    request(transaction, func)
    {
        return new Promise(async (resolve, reject) => {
            let result = undefined;
            
            try {
                result = await func();
            } catch(err){
                reject(err);
                return;
            }

            result.onerror = function(){
                console.log("error", func);
                transaction.abort(); 
                reject(result.error);
            };

            result.onsuccess = function(){
                resolve(result.result);
            };
        });
    }

    async getLastWriteTime(){
        let AS = this;
        return await AS.doTransaction("app", "readwrite", async (t, s) => {
            let lastTime =  await AS.request(t, async () => {
                return s.get("lastWriteTime");
            });
            if (lastTime == undefined || lastTime == null)
                return 0;
            else
                return lastTime.time;
        });
    }

    async updateLastWriteTime(time = null){
        if (time == null)
            time = Date.now();

        let AS = this;
        await AS.doTransaction("app", "readwrite", async (t, s) => {
            await AS.request(t, async () => {
                return s.put({
                    category: "lastWriteTime", 
                    time: time
                });
            });
        });
        this.performedWrite = true;
    }

    async getLastOpenProject(){
        let AS = this;
        return await AS.doTransaction("app", "readwrite", async (t, s) => {
            let res =  await AS.request(t, async () => {
                return s.get("lastOpenProject");
            });
            if (res == undefined || res == null)
                return undefined;
            else
                return res.projectID;
        });
    }

    async updateLastOpenProject(projectID){
        let AS = this;
        await AS.doTransaction("app", "readwrite", async (t, s) => {
            await AS.request(t, async () => {
                return s.put({
                    category: "lastOpenProject", 
                    projectID: projectID
                });
            });
        });
        this.performedWrite = true;
    }

    async getProject(projectID){
        let AS = this;
        let project = await AS.doTransaction("userProjects", "readwrite", async (t, s) => {
            let _project = await AS.request(t, async () => {
                return s.get(projectID);
            });
            return _project;
        });

        return project;
    }

    async getProjectByName(projectName){
        let AS = this;
        let project = await AS.doTransaction("userProjects", "readwrite", async (t, s) => {
            let _project = await AS.request(t, async () => {
                return s.index("name").get(projectName);
            });
            return _project;
        });

        return project;
    }

    async getAutoName(projectName){
        if (!await this.getProjectByName(projectName))
            return projectName

        let i = 1;
        let newName = "";
        do {
            // Just give up after 20 attempts...
            if (i > 20) {
                i = Date.now();
            }
            newName = projectName + "("+i+")";
            i ++;
        } while(await this.getProjectByName(newName) && i < 100);

        return newName;
    }

    async createProject(projectName, projectID = null, autoName = true){
        projectID = projectID || Date.now().toString();

        let AS = this;

        if (autoName) projectName = await this.getAutoName(projectName);

        await AS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await AS.request(t, async () => {
                return s.put({
                    id: projectID, 
                    name: projectName
                });
            });
        });
        this.performedWrite = true;

        return projectID;
    }

    async renameProject(projectID, newProjectName, autoName = true){
        let AS = this;

        if (autoName) projectName = await this.getAutoName(projectName);

        await AS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await AS.request(t, async () => {
                return s.put({
                    id: projectID,
                    name: newProjectName
                });
            });
        });
        this.performedWrite = true;
    }

    async deleteProject(projectID){
        let AS = this;
        await AS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await AS.request(t, () => {
                return s.delete(projectID);
            });
        });
        this.performedWrite = true;
    }
}

async function Test_AppStorage(){
    let AS = new AppStorage();

    await AS.attach();

    let projectID = await AS.access(async (storage)=>{
        try { 
            await storage.deleteProject("test");
        } catch(err){}
        return await storage.createProject("New Project", "test");
    });

    console.log("projectID = " + projectID);

    await AS.detach();
}
