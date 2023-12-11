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
            console.log(err);
            expr = yield{
                state: "error",
                value: err
            };
        }
    }
}