import { makeNewProject } from './testInitializer.js';

document.getElementById('test-unlink').addEventListener('click', function () {
    const project = new IDBStoredProject(makeNewProject);
    project.attachToProject("testDB").then(() => {
        project.unlink("/test.txt").then(() => {
            console.log("File deleted successfully");
        }).catch((error) => {
            console.error("Failed to delete file:", error);
        });
    });
});

document.getElementById('test-rmdir').addEventListener('click', function () {
    const project = new IDBStoredProject(makeNewProject);
    project.attachToProject("testDB").then(() => {
        project.rmdir("/test").then(() => {
            console.log("Directory deleted successfully");
        }).catch((error) => {
            console.error("Failed to delete directory:", error);
        });
    });
});
