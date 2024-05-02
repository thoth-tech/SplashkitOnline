class CodeEditor {
    constructor(input) {
        this.editorout =   this.setupCodeArea(input);
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

    runCode() {
        clearErrorLines();
        executionEnviroment.runCodeBlock(this.filename, this.editor.getValue());
    }
    

    async saveCode() {
        let codePath = '/path/to/code'; // Update this to  actual path
        let filePath = `${codePath}/${this.filename}`;
        await storedProject.access(async function(project){
            await project.mkdir(codePath);
            await project.writeFile(filePath, this.editor.getValue());
        });
    }

    async loadCode() {
        let codePath = '/path/to/code'; // Update this to actual path
        let filePath = `${codePath}/${this.filename}`;
        let newVal = await fileAsString(await storedProject.access(function(project){
            return project.readFile(filePath);
        }));
        if (newVal != this.editor.getValue())
            this.editor.setValue(newVal);
    }
}
    

