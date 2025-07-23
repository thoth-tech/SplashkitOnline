#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define source and target directories
BIN_DIR="./bin/Debug/net8.0"
TARGET_DIR="../CSharpWasmExpo/bin"
FRAMEWORK_SRC="./bin/Debug/net8.0/wwwroot/_framework"
FRAMEWORK_DEST="../CSharpWasmExpo/wwwroot/_framework"

# List of files to copy
FILES=(
    "mscorlib.dll"
    "netstandard.dll"
    "CSharpWasm.dll"
    "System.Console.dll"
    "System.Private.CoreLib.dll"
    "System.Runtime.dll"
)

echo "Building the project..."
dotnet build

# Check if the build succeeded
if [ $? -eq 0 ]; then
    echo "Build succeeded!"

    # Copy required files from bin to target directory
    echo "Copying files to $TARGET_DIR..."
    mkdir -p "$TARGET_DIR"  # Create the target directory if it doesn't exist
    for FILE in "${FILES[@]}"; do
        if [[ -f "$BIN_DIR/$FILE" ]]; then
            cp "$BIN_DIR/$FILE" "$TARGET_DIR/"
            echo "Copied $FILE to $TARGET_DIR."
        else
            echo "Warning: $FILE not found in $BIN_DIR."
        fi
    done

    # Copy _framework directory to the target destination
    echo "Copying _framework directory..."
    if [[ -d "$FRAMEWORK_SRC" ]]; then
        mkdir -p "$FRAMEWORK_DEST"  # Create the target directory if it doesn't exist
        cp -r "$FRAMEWORK_SRC"/* "$FRAMEWORK_DEST/"
        echo "Copied _framework to $FRAMEWORK_DEST."
    else
        echo "Error: Framework directory not found at $FRAMEWORK_SRC."
        exit 1
    fi

    echo "Build and copy process completed successfully!"
else
    echo "Build failed. Exiting script."
    exit 1
fi