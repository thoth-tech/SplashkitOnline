// In order to run the code the user writes well, there are two main challenges.
// 1. We want the user to be able to run loops - for example the 'main' loop.
//    However, Javascript executed in the same thread as the browser's interface,
//    meaning that a long running while loop will simply freeze the page. A 'main'
//    loop, like in a game, will only render the last frame once the script is terminated.
//
//    To handle this, we use Javascripts async/await syntax, and modify the user's code as follows:
//    - All loops automatically await a timeout of 0 seconds after executing for more than ~25ms.
//    - screen_refresh (and other similar functions) await a window.requestAnimationFrame
//    - All user functions are marked as async, so that they can use await.
//    - Similarly, all calls to user functions are marked with await.
//    - Constructors cannot be async, so rename all constructors of user classes to `__constructor`,
//      and call it when user classes are newed. `let player = new Player()` becomes `let player = (new Player()).__constructor()`
//
//    This same setup is used to enable code pausing, and stopping, by simply listening for pausing/stopping/continuing
//    around when it does the awaits. To stop, we simple throw a 'ForceBreakLoop' error. To continue, pause, we create
//    a promise and await it. To continue, we call that promise.
//
// 2. We want the user to be able to declare global variables, however we also want to enable Strict Mode,
//    and additionally want a way to remove them all when the program is reset.

//    We handle this as follows:
//    - In an initial step, we identify and record all global variables into findGlobalDeclarationsTransform__userScope
//    - Next, we modify all declarations (variables, classes, functions) in the global scope, to directly set `window`.
//      For example `let a = 10;` becomes `window.a = 10;`. `function func(){}` becomes `window.func = function func(){}`
//    To reset the globals, we just delete all the variables in findGlobalDeclarationsTransform__userScope (`delete window[globalVar];`)

// Note: I was unable to work out how to pass in parameters or return values from a Babel transform, hence the usage of
// global variables. If anyone is able to figure this out, please change it!



class ForceBreakLoop extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = "Stopped the code!";
  }
}


// -------- Handle Loop Escaping --------
// Global variable for determining how long it's been since it last yielded to the browser.
let lastAsyncTime = Date.now();

// In-parameters for asyncifyTransform
let asyncifyTransform__asyncStopName = "ERROR";
let asyncifyTransform__asyncPauseName = "ERROR";
let asyncifyTransform__asyncContinueName = "ERROR";
let asyncifyTransform__asyncOnPauseName = "ERROR";
function asyncifyTransform(babel){
    let template = babel.template;
    let types = babel.types;
    const timeNow = template.expression.ast('Date.now()');


    // Automatically modifies the user's code so that all loops
    // continously keep track of how long they've been executing for,
    // and if over 16ms, yield to the browser for a short time.
    // As checking Date.now() every iteration is prohibitively expensive
    // in tight loops, it tries to keep track of how many loops it can do
    // before passing 10ms, via a binary search. Once it passes this number,
    // it then does the 'expensive' Date.now() call and updates its tracker.
    const asyncifyStatementTemplate = template(`
        if (LOOPCOUNT++>MAXLOOPCOUNT){
            LOOPCOUNT = 0;
            let timeSinceLastLoopBatch = Date.now() - LASTLOOPTIME;
            let timeSinceLastAsync = Date.now() - lastAsyncTime;

            LASTLOOPTIME = Date.now();

            if (timeSinceLastLoopBatch<10)
                MAXLOOPCOUNT *= 2;
            else
                MAXLOOPCOUNT /= 2;
            MAXLOOPCOUNT = Math.min(Math.max(1, MAXLOOPCOUNT), 10000000);

            if (ASYNCPAUSENAME){
                await new Promise(re => {
                    ASYNCCONTINUENAME = re;
                    lastAsyncTime = LASTLOOPTIME = Date.now();
                    ASYNCONPAUSENAME();
                });
                ASYNCPAUSENAME = false;
            }

            if (ASYNCSTOPNAME)
                throw new ForceBreakLoop("");

            if (timeSinceLastAsync>14){
                await new Promise(re => setTimeout(function(){
                    lastAsyncTime = LASTLOOPTIME = Date.now();
                    re();
                }, 0));
            }
        }
    `);

    return{
        visitor:{
            'WhileStatement|ForStatement|DoWhileStatement': {exit(path){
                if (path.scope.parent.block.kind == "constructor")
                {
                    path.skip();
                    return;
                }
                const loopCount = path.scope.parent.generateUidIdentifier('loopCount');
                path.scope.parent.push({
                  id: loopCount,
                  init: babel.types.numericLiteral(0),
                });

                const maxLoopCount = path.scope.parent.generateUidIdentifier('maxLoopCount');
                path.scope.parent.push({
                  id: maxLoopCount,
                  init: babel.types.numericLiteral(1),
                });

                const lastLoopTime = path.scope.parent.generateUidIdentifier('lastLoopTime');
                path.scope.parent.push({
                  id: lastLoopTime,
                  init: timeNow,
                });

                const asyncifyStatement = asyncifyStatementTemplate({
                    LOOPCOUNT: loopCount,
                    MAXLOOPCOUNT: maxLoopCount,
                    LASTLOOPTIME: lastLoopTime,

                    ASYNCSTOPNAME: asyncifyTransform__asyncStopName,
                    ASYNCPAUSENAME: asyncifyTransform__asyncPauseName,
                    ASYNCCONTINUENAME: asyncifyTransform__asyncContinueName,
                    ASYNCONPAUSENAME: asyncifyTransform__asyncOnPauseName,
                })

                if (!path.get('body').isBlockStatement()){
                    const statement = path.get('body').node;
                    path.get('body').replaceWith(types.blockStatement([asyncifyStatement, statement]));
                }
                else{
                    path.get('body').unshiftContainer('body', asyncifyStatement);
                }
                path.get('body').skip();
            }},
        },
    };
};
Babel.registerPlugin("asyncify", asyncifyTransform);


// -------- Handle Making Functions Async & Global Declarations --------
function makeFunctionsAsyncAwaitTransform(babel){
    let template = babel.template;
    let types = babel.types;

    const returnThis = template.statement.ast('return this;');
    const setGlobalTemplate = template('window.IDENTIFIER = VALUE;');
    const constructorTemplate = template('(await (CONSTRUCTOR).__constructor())');
    return{
        visitor:{
            // Directly assign variable declarations to window
            VariableDeclaration: (path) => {
                if (path.getFunctionParent() == null){
                    let statements = []
                    for (let decl of path.node.declarations){
                        statements.push(setGlobalTemplate({IDENTIFIER:decl.id, VALUE:(decl.init==null)?types.NullLiteral():decl.init}))
                    }
                    path.replaceWith(types.blockStatement(statements));
                }
            },
            // Directly assign function declarations to window
            FunctionDeclaration: (path) => {
                path.node.async = true;
                if (path.getFunctionParent() == null){
                    path.replaceWith(setGlobalTemplate({IDENTIFIER:path.node.id, VALUE:types.functionExpression(
                        path.node.id,
                        path.node.params,
                        path.node.body,
                        path.node.generator,
                        path.node.async,
                    )}));
                }
            },
            // Directly assign class declarations to window
            ClassDeclaration: (path) => {
                if (path.getFunctionParent() == null){
                    path.replaceWith(setGlobalTemplate({IDENTIFIER:path.node.id, VALUE:types.classExpression(
                        path.node.id,
                        path.node.superClass,
                        path.node.body,
                        path.node.decorators,
                    )}));
                }
            },
            // Make class methods async, and replace constructor (since it cannot be async)
            ClassMethod: (path) => {
                if (path.node.kind == "constructor"){
                    path.node.kind == "method";
                    path.node.key.name = "__constructor"
                    path.node.async = true;
                    path.get('body').pushContainer('body', returnThis);
                }
                else{
                    path.node.async = true;
                }
            },

            // Modify calls to user functions to 'await' their return value
            CallExpression: (path) => {
                const statement = path.node;
                if (findGlobalDeclarationsTransform__userScope.has(path.node.callee.name) && (path.container.type != "AwaitExpression"))
                    path.replaceWith(types.awaitExpression(statement));
            },
            // Use patched up constructor on user classes
            NewExpression: (path) => {
                if (findGlobalDeclarationsTransform__userScope.has(path.node.callee.name)){
                    path.replaceWith(constructorTemplate({CONSTRUCTOR:path.node}));
                    path.skip();
                }
            },
        },
    };
};
Babel.registerPlugin("makeFunctionsAsyncAwaitTransform", makeFunctionsAsyncAwaitTransform);


// -------- Handle Finding Global Declarations --------
let findGlobalDeclarationsTransform__userScope = new Set();
findGlobalDeclarationsTransform__userScope.add("refresh_screen");
findGlobalDeclarationsTransform__userScope.add("refresh_screen_with_target_fps");
findGlobalDeclarationsTransform__userScope.add("delay");

function findGlobalDeclarationsTransform(babel){
    return{
        visitor:{
            FunctionDeclaration: (path) => {
                if (path.getFunctionParent() == null){
                    findGlobalDeclarationsTransform__userScope.add(path.node.id.name);
                }
            },
            ClassDeclaration: (path) => {
                if (path.getFunctionParent() == null){
                    findGlobalDeclarationsTransform__userScope.add(path.node.id.name);
                }
            },
            VariableDeclaration: (path) => {
                if (path.getFunctionParent() == null){
                    for (let decl of path.node.declarations){
                        findGlobalDeclarationsTransform__userScope.add(decl.id.name);
                    }
                }
            },
        },
    };
};
Babel.registerPlugin("findGlobalDeclarationsTransform", findGlobalDeclarationsTransform);




// -------- Utility Functions for Manually Making Functions Async --------

async function asyncifyForce(){
    await new Promise(re => setTimeout(function(){
        lastAsyncTime =  Date.now();
        re();
    }, 0));
}
async function asyncifyScreenRefresh(){
    await new Promise(re => window.requestAnimationFrame(function(){
        lastAsyncTime =  Date.now();
        re();
    }));
}

// -------- The Function to Process the Code --------
function processCodeForExecutionEnvironment(userCode, asyncStopName, asyncPauseName, asyncContinueName, asyncOnPauseName){

    asyncifyTransform__asyncStopName = asyncStopName;
    asyncifyTransform__asyncPauseName = asyncPauseName;
    asyncifyTransform__asyncContinueName = asyncContinueName;
    asyncifyTransform__asyncOnPauseName = asyncOnPauseName;

    // Find the user's global declarations - important for next step
    // Couldn't find a way to return extra information, so they are stored
    // in the global 'findGlobalDeclarationsTransform__userScope'
    Babel.transform(userCode, {
        plugins: ["findGlobalDeclarationsTransform"]
    });

    // Now do the actual transforms!
    userCode = Babel.transform(userCode, {
        plugins: ["makeFunctionsAsyncAwaitTransform","asyncify"],
        retainLines: true
    });

    return userCode.code;
}