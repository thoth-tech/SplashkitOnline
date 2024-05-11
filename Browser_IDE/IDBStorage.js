"use strict";

class IDBStorage extends EventTarget{
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
        let RW = new __IDBStorageRW(this);
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

class __IDBStorageRW{
    constructor(IDBS) {
        this.owner = IDBS;
        this.db = null;
		this.doInitialization = false;
        this.performedWrite = false;
    }

    openDB(){
        let IDBS = this;
        return new Promise((resolve, reject)=>{
            if (IDBS.db != null)
                reject();

            let req = indexedDB.open("SplashKitOnline", 1);

            req.onupgradeneeded = async (e) => {
                IDBS.db = req.result;
                IDBS.db.createObjectStore("app", {keyPath: "category"});
                
				let userProjectsStore = IDBS.db.createObjectStore("userProjects", {keyPath: "id"});
				userProjectsStore.createIndex("name", "name", {unique: true});

                if (e.oldVersion == 0)
                    IDBS.doInitialization = true;
            };

            req.onsuccess = async (e) => {
                IDBS.db = req.result;
                if (IDBS.doInitialization){
                    await IDBS.updateLastWriteTime();
                }
                IDBS.doInitialization = false;
                resolve();
            };

            req.onerror = async (e) => {
                IDBS.owner.dispatchEvent(new Event("connectionFailed"));
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
		let IDBS = this;
        return new Promise(async (resolve, reject) => {
            let transaction = IDBS.db.transaction(store, state);
            let files = transaction.objectStore(store);
            let result = undefined;

            try {
                result = await func(transaction, files);
            } catch(err){
                reject(err);
				return;
            }

            transaction.onerror = function(){
				console.log("error");
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
				console.log("error");
				transaction.abort(); 
				reject(result.error);
			};

            result.onsuccess = function(){
				resolve(result.result);
			};
        });
    }

    async getLastWriteTime(){
        let IDBS = this;
        return await IDBS.doTransaction("app", "readwrite", async (t, s) => {
            let lastTime =  await IDBS.request(t, async () => {
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

        let IDBS = this;
        await IDBS.doTransaction("app", "readwrite", async (t, s) => {
            await IDBS.request(t, async () => {
                return s.put({
					category: "lastWriteTime", 
					time: time
				});
            });
        });
    }

	async getLastOpenProject(){
        let IDBS = this;
        return await IDBS.doTransaction("app", "readwrite", async (t, s) => {
            let res =  await IDBS.request(t, async () => {
                return s.get("lastOpenProject");
            });
            if (res == undefined || res == null)
                return undefined;
            else
                return res.projectID;
        });
    }

    async updateLastOpenProject(projectID){
        let IDBS = this;
        await IDBS.doTransaction("app", "readwrite", async (t, s) => {
            await IDBS.request(t, async () => {
                return s.put({
					category: "lastOpenProject", 
					projectID: projectID
				});
            });
        });
    }

	async getProject(projectID){
		let IDBS = this;
		let project = await IDBS.doTransaction("userProjects", "readwrite", async (t, s) => {
            let _project = await IDBS.request(t, async () => {
                return s.get(projectID);
            });
            return _project;
        });

		return project;
	}

    async createProject(projectName, projectID = null){
        projectID = projectID || Date.now(); // TODO: Generate IDs properly

        let IDBS = this;
        await IDBS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await IDBS.request(t, async () => {
                return s.put({
                    id: projectID, 
                    name: projectName
                });
            });
        });
        this.performedWrite = true;

        return projectID;
    }

	async renameProject(projectID, newProjectName){
		let IDBS = this;

		await IDBS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await IDBS.request(t, async () => {
                return s.put({
					id: projectID,
                    name: newProjectName
                });
            });
        });
        this.performedWrite = true;
	}

    async deleteProject(projectID){
        let IDBS = this;
        await IDBS.doTransaction("userProjects", "readwrite", async (t, s) => {
            await IDBS.request(t, () => {
                return s.delete(projectID);
            });
        });
        this.performedWrite = true;
    }
}

async function Test_IDBStorage(){
	let IDBS = new IDBStorage();

	await IDBS.attach();

	let projectID = await IDBS.access(async (storage)=>{
		try { 
			await storage.deleteProject("test");
		} catch(err){}
		return await storage.createProject("New Project", "test");
	});

	console.log("projectID = " + projectID);

	await IDBS.detach();
}