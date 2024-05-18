class CodeEditor {
    constructor(filename,codeblock_name,eleID,executionEnvironment, storedProject,filePath) {
        this.filename = filename;
        this.codeblock_name = codeblock_name;
        this.editorout =   this.setupCodeArea(eleID);
        this.executionEnvironment = executionEnvironment;
        this.storedProject = storedProject;
        this.filePath = filePath;

    }

    setupCodeArea(element){
        let editor = CodeMirror.fromTextArea(element, {
            mode: "text/javascript",
            theme: "dracula",
            lineNumbers: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            hintOptions: {
                alignWithWord: false,
                completeSingle: false,
                useGlobalScope: false,
            },
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });
    
        editor.on('inputRead', (cm, change) => {
            if (!cm.state.completeActive) {
                cm.showHint();
            }
        });
        return editor;
    }

    // Utility function for saving/loading the code blocks
    async  fileAsString(buffer){
        return new Promise((resolve,error) => {
            //_arrayBufferToString from https://stackoverflow.com/a/14078925
            // Thanks Will Scott!
            function _arrayBufferToString(buffer) {
                var bb = new Blob([new Uint8Array(buffer)]);
                var f = new FileReader();
                f.onload = function(e) {
                    resolve(e.target.result);
                };
                f.readAsText(bb);
            }
            if (typeof buffer === 'string' || buffer instanceof String)
                resolve(buffer);
            else
                return _arrayBufferToString(buffer);
        });
    }

    clearErrorLines(editors){
        for (let editor of editors){
            for (var i = 0; i < editor.lineCount(); i++) {
                editor.removeLineClass(i, "wrap", "error-line");
            }
        }
    }
    

    runCode(editors) {
        this.clearErrorLines(editors);
        let code = this.editorout.getValue();
        this.executionEnvironment.runCodeBlock(this.codeblock_name, code);
    }
    

    async saveCode(codePath) {
        let code = this.editorout.getValue();
        await this.storedProject.access(async function(project){
            await project.mkdir(codePath);
            await project.writeFile(this.filePath, code);
            
        }.bind(this));
    }

    
    async loadCode() {
        let code = this.editorout.getValue();
        let newVal = await this.fileAsString(await this.storedProject.access((project) => {
            return project.readFile(this.filePath);
        }));
        if (newVal != code)
            this.editorout.setValue(newVal);
    }
    async loadCode() {
        let code = this.editorout.getValue();
        let newVal = await this.fileAsString(await this.storedProject.access(function(project) {
            return project.readFile(this.filePath);
        }.bind(this)));
        if (newVal != code)
            this.editorout.setValue(newVal);
    }
    
    
    
    
}
    

