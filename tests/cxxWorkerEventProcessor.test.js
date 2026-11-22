
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const workerPath = path.join(
    __dirname,
    "../runtimes/cxx/workerEventProcessor.js"
);

const workerSource = fs.readFileSync(workerPath, "utf8");

function createWorkerContext() {
    const calls = [];

    const context = {
        calls,
        postMessage: (message) => calls.push(["postMessage", message]),
        performance: { now: () => 1000 },
        FS: {
            mkdir: (...args) => calls.push(["mkdir", ...args]),
            writeFile: (...args) => calls.push(["writeFile", ...args]),
            rename: (...args) => calls.push(["rename", ...args]),
            unlink: (...args) => calls.push(["unlink", ...args]),
            rmdir: (...args) => calls.push(["rmdir", ...args]),
            readdir: () => [".", ".."],
            stat: () => ({ mode: 0 }),
            isDir: () => false,
            isFile: () => false
        },
        Module: {
            intArrayFromString: (value) =>
                Array.from(Buffer.from(value, "utf8"))
        },
        XMLHttpRequest: class {
            open() {}
            send() {
                this.response = "";
            }
        },
        moduleEvents: {
            addEventListener: () => {}
        },
        FSEvents: {
            addEventListener: () => {}
        },
        console,
        Uint8Array,
        Float32Array,
        Array,
        JSON,
        Error,
        Event: class {}
    };

    vm.createContext(context);
    vm.runInContext(workerSource, context);

    return context;
}

test("mkdir forwards directory creation to the filesystem", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["mkdir", { path: "/project" }])',
        context
    );

    assert.deepEqual(context.calls[0], ["mkdir", "/project"]);
});

test("writeFile forwards text data to the filesystem", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["writeFile", { path: "/project/main.cpp", data: "int main() {}" }])',
        context
    );

    assert.deepEqual(context.calls[0], [
        "writeFile",
        "/project/main.cpp",
        "int main() {}"
    ]);
});

test("writeFile converts binary data to Uint8Array", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["writeFile", { path: "/project/data.bin", data: [1, 2, 3] }])',
        context
    );

    const call = context.calls[0];

    assert.equal(call[0], "writeFile");
    assert.equal(call[1], "/project/data.bin");
    assert.deepEqual(Array.from(call[2]), [1, 2, 3]);
});

test("rename forwards old and new paths", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["rename", { oldPath: "/old.cpp", newPath: "/new.cpp" }])',
        context
    );

    assert.deepEqual(context.calls[0], [
        "rename",
        "/old.cpp",
        "/new.cpp"
    ]);
});

test("unlink forwards file deletion", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["unlink", { path: "/project/main.cpp" }])',
        context
    );

    assert.deepEqual(context.calls[0], [
        "unlink",
        "/project/main.cpp"
    ]);
});

test("rmdir forwards non-recursive directory deletion", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["rmdir", { path: "/project", recursive: false }])',
        context
    );

    assert.deepEqual(context.calls[0], [
        "rmdir",
        "/project"
    ]);
});

test("stdin converts input into character codes and adds a terminator", () => {
    const context = createWorkerContext();

    vm.runInContext(
        'handleEvent(["stdin", { value: "hello" }])',
        context
    );

    const input = vm.runInContext("inputBuffer", context);

    assert.deepEqual(Array.from(input), [
        104, 101, 108, 108, 111, null
    ]);
});

test("unexpected worker events throw an error", () => {
    const context = createWorkerContext();

    assert.throws(
        () => vm.runInContext(
            'handleEvent(["unknownCommand", {}])',
            context
        ),
        /Unexpected event/
    );
});
