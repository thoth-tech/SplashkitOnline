function handleUserInput(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission
        const input = document.getElementById('user-input');
        const output = document.getElementById('output');
        const command = input.value;
        input.value = ''; // Clear input field
        
        if (readlineResolve) {
            output.value += "> " + command + "\n"; // Display the command in the output area
            readlineResolve(command); // Resolve the Promise with the command
            readlineResolve = null; // Reset the resolve function
        }
    }
}