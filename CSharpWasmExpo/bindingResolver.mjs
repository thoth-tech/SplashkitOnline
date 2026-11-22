
export const resolveBinding = (name, wasmScope, globalScope = globalThis) => {
    let fn =
        globalScope[name] ??
        wasmScope?.[name] ??
        wasmScope?.[`_CPP_${name}`] ??
        globalScope[`__sko_${name}`] ??
        wasmScope?.[`__sko_${name}`];

    if (typeof fn !== "function") {
        const sklibMatch = Object.keys(wasmScope || {}).find(
            (key) =>
                key === `__sklib__${name}` ||
                key.startsWith(`__sklib__${name}__`)
        );

        if (sklibMatch && typeof wasmScope[sklibMatch] === "function") {
            fn = wasmScope[sklibMatch];
        }
    }

    return typeof fn === "function" ? fn : null;
};
