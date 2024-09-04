/*
    NOTE: MAINTAIN PARITY WITH /Browser_IDE/setup.py
*/

const request = require('request');
const fs = require('fs');
const extract = require('extract-zip');
const path = require('path');

class RequiredFile {
    constructor(repoPath, src, dst, onDownload = async () => {}){
        this.repoPath = repoPath;
        this.src = src;
        this.dst = dst;
        this.onDownload = onDownload;
    }

    async download(){
        console.log("Downloading " + this.src + "...");

        const dstFilePath = this.dst + "/" + path.basename(this.src);
        let file = fs.createWriteStream(dstFilePath);

        let requestPromise = new Promise((resolve, reject) => {
            let req = request(this.repoPath + this.src);
            req.pipe(file);
            file.on('finish', () => {
                resolve();
            });
            file.on('error', () => {
                reject();
            });
        });

        await requestPromise;

        await this.onDownload();

        let closePromise = new Promise((resolve, reject) => {
            file.close((err) => {
                if(err != null) reject();
                resolve();
            });
        });

        await closePromise;

    }
}

const thothTechRepoPath = "http://github.com/thoth-tech/SplashkitOnline/raw/"
const WhyPenguinsRepoPath = "http://github.com/WhyPenguins/SplashkitOnline/raw/"

const jsRuntimeDir = "runtimes/javascript/bin"
const cxxCompilerDir = "compilers/cxx/bin"
const cxxRuntimeDir = "runtimes/cxx/bin"

const requiredFiles = [
    // Language-agnostic files
    new RequiredFile(thothTechRepoPath, "binaries/Browser_IDE/splashkit/splashkit_autocomplete.json", "splashkit"),
    
    // JS files
    new RequiredFile(thothTechRepoPath, "binaries/Browser_IDE/splashkit/SplashKitBackendWASM.js", jsRuntimeDir),
    new RequiredFile(thothTechRepoPath, "binaries/Browser_IDE/splashkit/SplashKitBackendWASM.wasm", jsRuntimeDir),

    // C++ files
    new RequiredFile(WhyPenguinsRepoPath, "cxx_language_backend_binaries/Browser_IDE/compilers/cxx/bin/compiler.zip", cxxCompilerDir, async () => {
        // Unpack and delete compiler.zip
        console.log("Extracting " + cxxCompilerDir + "/compiler.zip" + "...");
        await extract(cxxCompilerDir + "/compiler.zip", {dir: path.resolve(cxxCompilerDir)});
        fs.unlinkSync(cxxCompilerDir + "/compiler.zip");
        console.log("Extracted " + cxxCompilerDir + "/compiler.zip");
    }),
    new RequiredFile(WhyPenguinsRepoPath, "cxx_language_backend_binaries/Browser_IDE/compilers/cxx/bin/wasi-sysroot.zip", cxxCompilerDir),
    new RequiredFile(WhyPenguinsRepoPath, "cxx_language_backend_binaries/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.js", cxxRuntimeDir),
    new RequiredFile(WhyPenguinsRepoPath, "cxx_language_backend_binaries/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js", cxxRuntimeDir)
];

exports.run = async function(){

    let alreadyExists = requiredFiles.filter((reqFile) => {
        return fs.existsSync(reqFile.dst + "/" + path.basename(reqFile.src));
    });

    if(alreadyExists.length > 0){
        return;
    }

    console.log("Setting up SKO files...");

    await Promise.all(requiredFiles.map((reqFile) => {
        return (async () => {
            await reqFile.download();
        })();
    }));

    console.log("SKO setup complete!");
}