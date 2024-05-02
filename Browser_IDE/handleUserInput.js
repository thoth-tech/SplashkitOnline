function handleUserInput(event) {
    if (event.key === "Enter") {
        console.log("Event triggered:", event);
        event.preventDefault();
        const input = document.getElementById('user-input');
        const output = document.getElementById('output');
        const command = input.value;
        input.value = ''; // Clear the input field

        if (window.userInputResolve) {
            output.value += "> " + command + "\n"; // Display the command in the output area
            window.userInputResolve(command); // Resolve the Promise with the command
            window.userInputResolve = null; // Reset the resolve function
        }
    }
}