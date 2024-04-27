"use strict";

/**
 * An adapter for mutating the IDB filesystem and the Emscripten filesystem at the same time.
 * Using this helps to avoid the two filesystems becoming out-of-sync.
 */
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
            if (tSucc) this.executionEnvironment.rmdir(path);
            if (pSucc) this.storedProject.access((project)=>project.rmdir(path));
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
            let pOriginalData = await this.storedProject.access((project)=>project.readFile(path));
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
        if (t && p){
            let pOriginalData = await this.storedProject.access((project)=>project.readFile(path));
            let tOriginalData = pOriginalData;
            let tSucc = false;
            let pSucc = false;
            let err = undefined;

            try {
                await this.executionEnvironment.unlink(path);
                tSucc = true;

                await this.storedProject.access((project)=>project.unlink(path));
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

        if (t) await this.executionEnvironment.unlink(path);
        if (p) await this.storedProject.access((project)=>project.unlink(path));
    }

    async rmdir(path, recursive, t = true, p = true){
        // TODO: Properly.
        // We cannot save the contents of an entire
        // folder in case we need to revert the deletion,
        // so what should be done?

        if (t) await this.executionEnvironment.rmdir(path, recursive);
        if (p) await this.storedProject.access((project)=>project.rmdir(path, recursive));
    }
}