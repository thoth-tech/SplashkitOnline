"use strict";

let FSEvents = new EventTarget();

// File System Delegate Initialization
moduleEvents.addEventListener("onRuntimeInitialized", function() {
    // Attach to file system callbacks
    FS.trackingDelegate['willMovePath'] = function(oldpath, newpath) {
        let ev = new Event("willMovePath");
        ev.oldpath = oldpath;
        ev.newpath = newpath;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onMovePath'] = function(oldpath, newpath) {
        let ev = new Event("onMovePath");
        ev.oldpath = oldpath;
        ev.newpath = newpath;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['willDeletePath'] = function(path) {
        let ev = new Event("willDeletePath");
        ev.path = path;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onDeletePath'] = function(path) {
        let ev = new Event("onDeletePath");
        ev.path = path;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onOpenFile'] = function(path, flags) {
        let ev = new Event("onOpenFile");
        ev.path = path;
        ev.flags = flags;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onReadFile'] = function(path, bytesRead) {
        let ev = new Event("onReadFile");
        ev.path = path;
        ev.bytesRead = bytesRead;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onWriteToFile'] = function(path, bytesWritten) {
        let ev = new Event("onWriteToFile");
        ev.path = path;
        ev.bytesWritten = bytesWritten;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onSeekFile'] = function(path, position, whence) {
        let ev = new Event("onSeekFile");
        ev.path = path;
        ev.position = position;
        ev.whence = whence;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onCloseFile'] = function(path) {
        let ev = new Event("onCloseFile");
        ev.path = path;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onMakeDirectory'] = function(path, mode) {
        let ev = new Event("onMakeDirectory");
        ev.path = path;
        ev.mode = mode;
        FSEvents.dispatchEvent(ev);
    };
    FS.trackingDelegate['onMakeSymlink'] = function(oldpath, newpath) {
        let ev = new Event("onMakeSymlink");
        ev.oldpath = oldpath;
        ev.newpath = newpath;
        FSEvents.dispatchEvent(ev);
    };
});

function TestFSEvents()
{
    FSEvents.addEventListener('willMovePath', function(e) {
        console.log('About to move "' + e.oldpath + '" to "' + e.newpath + '"');
    });
    FSEvents.addEventListener('onMovePath', function(e) {
        console.log('Moved "' + e.oldpath + '" to "' + e.newpath + '"');
    });
    FSEvents.addEventListener('willDeletePath', function(e) {
        console.log('About to delete "' + e.path + '"');
    });
    FSEvents.addEventListener('onDeletePath', function(e) {
        console.log('Deleted "' + e.path + '"');
    });
    FSEvents.addEventListener('onOpenFile', function(e) {
        console.log('Opened "' + e.path + '" with flags ' + e.flags);
    });
    FSEvents.addEventListener('onReadFile', function(e) {
        console.log('Read ' + e.bytesRead + ' bytes from "' + e.path + '"');
    });
    FSEvents.addEventListener('onWriteToFile', function(e) {
        console.log('Wrote to file "' + e.path + '" with ' + e.bytesWritten + ' bytes written');
    });
    FSEvents.addEventListener('onSeekFile', function(e) {
        console.log('Seek on "' + e.path + '" with position ' + e.position + ' and whence ' + e.whence);
    });
    FSEvents.addEventListener('onCloseFile', function(e) {
        console.log('Closed ' + e.path);
    });
    FSEvents.addEventListener('onMakeDirectory', function(e) {
        console.log('Created directory ' + e.path + ' with mode ' + e.mode);
    });
    FSEvents.addEventListener('onMakeSymlink', function(e) {
        console.log('Created symlink from ' + e.oldpath + ' to ' + e.newpath);
    });

    FS.mkdir("/testDir");
    FS.rename("/testDir","/testDirRnm");
    FS.rmdir("/testDirRnm");
    FS.writeFile('/testFile.txt', 'Hello World!');
    FS.readFile('/testFile.txt');
    FS.symlink("/testFile.txt", "/testFileRenamed.txt");

    let stream = FS.open("/testFileRenamed.txt", "r");
    FS.llseek(stream, 6, 0);
    let buf = new Uint8Array(5);
    FS.read(stream, buf, 0, 5, 0);
    FS.close(stream);

    FS.unlink("/testFileRenamed.txt");
    FS.unlink("/testFile.txt");
}