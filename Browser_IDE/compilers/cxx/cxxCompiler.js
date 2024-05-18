"use strict";

// the C++ compiler subclass
class CXXCompiler extends Compiler{
    constructor(compileObject, linkObjects, setPrintFunction){
        super()
        this.compileObject = compileObject;
        this.linkObjects = linkObjects;
        this.setPrintFunction = setPrintFunction;
        this.signalReady();
    }

    async compileAll(sourceList, print){
        this.setPrintFunction(print);

        let compiled = {
            output : null,
        };

        let compiledObjects = [];

        let hasErrors = false;

        // compile each object
        for(let i = 0; i < sourceList.length; i ++) {
            if (sourceList[i].source == "") continue;

            let object = await this.compileOne(sourceList[i].name, sourceList[i].source, print);

            if (object.output == null){
                hasErrors = true;
                continue;
            }

            compiledObjects.push(object.output);
        }

        if (!hasErrors)
            compiled.output = await this.linkObjects(compiledObjects);

        return compiled;
    }

    async compileOne(name, source, print){
        this.setPrintFunction(print);

        let object = await this.compileObject(name, source);

        return {
            output: object
        };
    }

    async syntaxCheckOne(name, source, print){
        this.setPrintFunction(print);

        // this should be changed so we actually just get clang to syntax check, should be possible.
        let object = await this.compileObject(name, source);

        return object.output != null;
    }
}

displayEditorNotification("Preparing for C++ Compilation! This may take some time...", NotificationIcons.INFO);

// import the Clang backend (where all the real work happens), setup the compiler object, then register it.
import('./cxxCompilerClangBackend.js').then(({ compileObject, linkObjects, setPrintFunction }) => {
    registerCompiler("cxxCompiler", new CXXCompiler(compileObject, linkObjects, setPrintFunction));
}).catch((err)=>{
    displayEditorNotification("Compiler had an internal error during initialization!</br>"+err.toString(), NotificationIcons.CRITICAL_ERROR, -1);
});