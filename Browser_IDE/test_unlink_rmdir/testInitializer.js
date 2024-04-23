"use strict";

async function makeNewProject(storedProject) {
    await storedProject.mkdir("/test");

    let fileContent = "This is a test file.";
    await storedProject.writeFile("/test.txt", fileContent);
}

export { makeNewProject };
