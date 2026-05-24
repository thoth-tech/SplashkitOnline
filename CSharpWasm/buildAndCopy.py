#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path
import shutil

# Paths are defined relative to this script's location
HERE = Path(__file__).resolve().parent

BIN_DIR = HERE / "bin" / "Debug" / "net8.0"
TARGET_DIR = HERE.parent / "CSharpWasmExpo" / "bin"
FRAMEWORK_SRC = BIN_DIR / "wwwroot" / "_framework"
FRAMEWORK_DEST = HERE.parent / "CSharpWasmExpo" / "wwwroot" / "_framework"

FILES = [
    "mscorlib.dll",
    "netstandard.dll",
    "CSharpWasm.dll",
    "System.Console.dll",
    "System.Private.CoreLib.dll",
    "System.Runtime.dll",
]


def run(cmd, cwd=None):
    """Run a command and fail loudly if it errors."""
    print("> " + " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def copy_required_files():
    print(f"Copying files to {TARGET_DIR}...")
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    for filename in FILES:
        src = BIN_DIR / filename
        dest = TARGET_DIR / filename

        if src.is_file():
            shutil.copy2(src, dest)
            print(f"Copied {filename} to {TARGET_DIR}")
        else:
            print(f"Warning: {filename} not found in {BIN_DIR}")


def copy_framework_directory():
    print("Copying _framework directory...")

    if not FRAMEWORK_SRC.is_dir():
        print(f"Error: Framework directory not found at {FRAMEWORK_SRC}", file=sys.stderr)
        sys.exit(1)

    FRAMEWORK_DEST.mkdir(parents=True, exist_ok=True)

    # Copy contents of _framework (not the directory itself)
    for item in FRAMEWORK_SRC.iterdir():
        dest = FRAMEWORK_DEST / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)

    print(f"Copied _framework to {FRAMEWORK_DEST}")


def main():
    print("Building the project...")
    run(["dotnet", "build"], cwd=HERE)
    print("Build succeeded!")

    copy_required_files()
    copy_framework_directory()

    print("Build and copy process completed successfully!")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        print(f"Build failed with exit code {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)