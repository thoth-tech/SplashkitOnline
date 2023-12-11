// Note, deliberately not using strict to allow new variables
// to be created within the scope of the Execution_Scope

function* Execution_Scope(expr) {
    while(true){
        try{
            let run = null;
            if (expr != "")
                run = eval(expr);
            expr = yield{
                state: "success",
                value: run
            };
        }
        catch(err){
            let lineNumber = null;
            let message = "Error: "+err;
            // TODO: Add support for browsers other than Firefox
            if (err.hasOwnProperty("lineNumber")){
                lineNumber = err.lineNumber;
                message = "Error on line "+lineNumber+": "+err;
            }
            expr = yield{
                state: "error",
                message: message,
                line: lineNumber,
            };
        }
    }
}