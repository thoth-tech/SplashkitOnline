async function customReadLine() {
    return new Promise((resolve) => {
        window.userInputResolve = resolve;
    });
}

async function main() {
    while (true) {
        console.log("Please enter some input:");
        const userInput = await customReadLine();
        console.log("You entered:", userInput);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    main();
});
