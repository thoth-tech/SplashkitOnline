# Using TypeScript Compiler (tsc) to Convert TypeScript to JavaScript

This document outlines how to use the TypeScript Compiler (`tsc`) to convert TypeScript code to JavaScript.The main strategy is to use "tsc" to cross-compile the typescript code to javascript code.

## Steps

### Step 1: Install TypeScript

Firstly, ensure you have Node.js installed. Then, globally install TypeScript using the following command:

```bash
npm install -g typescript
```
## Step 2: Create TypeScript File
Create a .ts file in your project, such as example.ts, and write your TypeScript code within it. 
Example code:
```bash
function greet(name: string) {
    return `Hello, ${name}!`;
}

const message = greet("World");
console.log(message);
```
## Step 3: Compile TypeScript File using tsc
Navigate to the directory containing the .ts file in your terminal and execute the following command:
```bash
tsc example.ts
```

## Step Four: Run the JavaScript File
now the typescript has been changed to javascript and you can copy it to IDE and run.
```bash
node example.js
```