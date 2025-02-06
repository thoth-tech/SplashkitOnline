const express = require("express");
const app = express();
const setup = require('./setup.js');
var path = require('path');

async function run(){

    await setup.run();

    app.use("/codemirror-5.65.15", express.static(path.join(__dirname,"node_modules/codemirror")));
    app.use("/jszip", express.static(path.join(__dirname,"node_modules/jszip/dist/")));
    app.use("/babel", express.static(path.join(__dirname,"node_modules/@babel/standalone/")));
    app.use("/split.js", express.static(path.join(__dirname,"node_modules/split.js/dist/")));
    app.use("/mime", express.static(path.join(__dirname,"node_modules/mime/dist/")));
    app.use("/DemoProjects", express.static(path.join(__dirname,"../DemoProjects")));

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        next();
    });

    app.use(express.static(path.join(__dirname,"")));

    app.get("/", function (req, res) {
        res.sendFile("index.html", { root: __dirname });
    })

    app.listen(8000);

}

run();