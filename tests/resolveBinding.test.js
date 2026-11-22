
const test = require("node:test");
const assert = require("node:assert/strict");

const resolverPromise = import(
    "../CSharpWasmExpo/bindingResolver.mjs"
);

test("resolves a binding from the global scope", async () => {
    const { resolveBinding } = await resolverPromise;
    const expected = () => "global";

    assert.equal(
        resolveBinding("draw_circle", {}, {
            draw_circle: expected
        }),
        expected
    );
});

test("resolves a binding from the WASM scope", async () => {
    const { resolveBinding } = await resolverPromise;
    const expected = () => "wasm";

    assert.equal(
        resolveBinding("draw_circle", {
            draw_circle: expected
        }, {}),
        expected
    );
});

test("resolves a C++ prefixed binding", async () => {
    const { resolveBinding } = await resolverPromise;
    const expected = () => "cpp";

    assert.equal(
        resolveBinding("draw_circle", {
            _CPP_draw_circle: expected
        }, {}),
        expected
    );
});

test("resolves an __sko_ prefixed binding", async () => {
    const { resolveBinding } = await resolverPromise;
    const expected = () => "sko";

    assert.equal(
        resolveBinding("draw_circle", {
            __sko_draw_circle: expected
        }, {}),
        expected
    );
});

test("resolves a generated __sklib__ binding", async () => {
    const { resolveBinding } = await resolverPromise;
    const expected = () => "sklib";

    assert.equal(
        resolveBinding("draw_circle", {
            __sklib__draw_circle__module: expected
        }, {}),
        expected
    );
});

test("returns null when the binding is missing", async () => {
    const { resolveBinding } = await resolverPromise;

    assert.equal(
        resolveBinding("draw_circle", {}, {}),
        null
    );
});

test("does not accept a non-function binding", async () => {
    const { resolveBinding } = await resolverPromise;

    assert.equal(
        resolveBinding("draw_circle", {
            draw_circle: "not a function"
        }, {}),
        null
    );
});
