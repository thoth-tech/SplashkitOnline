"use strict";

class UnifiedFS {
    constructor(_storedProject, _executionEnvironment){
        this.storedProject = _storedProject;
        this.executionEnvironment = _executionEnvironment;
    }

    async mkdir(path){
        let tSucc = false;
        let pSucc = false;
        let err = undefined;

        try {
            await this.executionEnvironment.mkdir(path);
            tSucc = true;

            await this.storedProject.access((project)=>project.mkdir(path));
            pSucc = true;
        } catch(_err){
            err = _err;
        }

        if(err){
            // If one fails, we need to revert the other.
            // TODO: Relies on deletion functions in executionEnvironment.js
            throw err;
        }
    }



    // Functions that may modify/delete existing nodes take `t` and `p` 
    // parameters for convenience, so that the caller does not need to
    // do this `if (transient and persistent)` logic themself.

    async writeFile(path, data, t = true, p = true){
        if (t && p){
            // We don't have a general notion of transactions so
            // this seems like the simplest, even if most naive, solution.
            let pOriginalData = await this.storedProject.access((project)=>project.readFile(path, data));
            let tOriginalData = pOriginalData;
                // TODO: Create executionEnvironment.readFile function and use here.

            let tSucc = false;
            let pSucc = false;
            let err = undefined;

            try {
                await this.executionEnvironment.writeFile(path, data);
                tSucc = true;

                await this.storedProject.access((project)=>project.writeFile(path, data));
                pSucc = true;
            } catch(_err){
                err = _err;
            }

            if(err){
                // If one fails, we need to revert the other.
                if(tSucc) await this.executionEnvironment.writeFile(path, tOriginalData);
                if(pSucc) await this.storedProject.access((project)=>project.writeFile(path, pOriginalData));
                throw err;
            }

            return;
        }

        if(t) await this.executionEnvironment.writeFile(path, data);
        if(p) await this.storedProject.access((project)=>project.writeFile(path, data));
    }

    async rename(oldPath, newPath, t = true, p = true){
        if (t && p){
            let tSucc = false;
            let pSucc = false;
            let err = undefined;

            try {
                await this.executionEnvironment.rename(oldPath, newPath);
                tSucc = true;

                await this.storedProject.access((project)=>project.rename(oldPath, newPath));
                pSucc = true;
            } catch(_err){
                err = _err;
            }

            if(err){
                // If one fails, we need to revert the other.
                if(tSucc) await this.executionEnvironment.rename(newPath, oldPath);
                if(pSucc) await this.storedProject.access((project)=>project.rename(newPath, oldPath));
                throw err;
            }

            return;
        }

        if (t) await this.executionEnvironment.rename(oldPath, newPath);
        if (p) await this.storedProject.access((project)=>project.rename(oldPath, newPath));
    }

    async unlink(path, t = true, p = true){
        // TODO: Relies on deletion functions in executionEnvironment.js
    }

    async rmdir(path, recursive, t = true, p = true){
        // TODO: Relies on deletion functions in executionEnvironment.js
    }
}