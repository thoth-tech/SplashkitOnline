# Thanks ChatGPT! I was way too lazy to write this ahaha
import os
import hashlib
import json
import shutil

# Define paths and extensions
ROOT_DIR = "./"
PR_DIRS = [os.path.join(ROOT_DIR, "pr-previews"), os.path.join(ROOT_DIR, "branch-previews")]
PR_BULK_DIRS = [os.path.join(ROOT_DIR, "pr-previews/bulk"), os.path.join(ROOT_DIR, "branch-previews/bulk")]
EXTENSIONS = {".wasm", ".lzma", ".zip"}

# Ensure PRBulk directory exists
for bulk_dir in PR_BULK_DIRS:
    os.makedirs(bulk_dir, exist_ok=True)

# Global cache for root file hashes
root_file_hashes = {}

def calculate_hash(filepath):
    """Calculates SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def get_relative_path(full_path, base_dir):
    """Gets the relative path from the base directory."""
    return "/" + os.path.relpath(full_path, base_dir).replace(os.sep, "/")

def cache_root_hashes():
    """Caches hashes of all files in the root directory with specified extensions."""
    for root, dirs, files in os.walk(ROOT_DIR, topdown=True):
        if "pr-previews" in dirs:
            del dirs[dirs.index("pr-previews")]
        if "branch-previews" in dirs:
            del dirs[dirs.index("branch-previews")]
        for file in files:
            if os.path.splitext(file)[1].lower() in EXTENSIONS:
                file_path = os.path.join(root, file)
                file_hash = calculate_hash(file_path)
                root_file_hashes[file_hash] = file_path

def process_pr_folder(pr_folder, bulk_dir):
    pr_path_map = {"redirects": {}, "root": get_relative_path(pr_folder, ROOT_DIR)}
    for root, _, files in os.walk(pr_folder):
        for file in files:
            if os.path.splitext(file)[1].lower() in EXTENSIONS:
                file_path = os.path.join(root, file)
                rel_path = get_relative_path(file_path, pr_folder)

                # Calculate file hash
                file_hash = calculate_hash(file_path)

                if file_hash in root_file_hashes:
                    # If an identical file exists in root, create a redirect and delete
                    root_file_path = root_file_hashes[file_hash]
                    pr_path_map["redirects"][get_relative_path(file_path, ROOT_DIR)] = get_relative_path(root_file_path, ROOT_DIR)
                    os.remove(file_path)
                    print("remove", file_path)
                else:
                    # Prepare to move file to PRBulk with hash-appended name if unique
                    new_name = f"{os.path.splitext(file)[0]}_{file_hash}{os.path.splitext(file)[1]}"
                    bulk_path = os.path.join(bulk_dir, new_name)

                    # Move file to PRBulk if it doesn’t already exist
                    if not os.path.exists(bulk_path):
                        shutil.move(file_path, bulk_path)
                        print("move", file_path, bulk_path)
                    else:
                        os.remove(file_path)
                        print("exists, delete", file_path, bulk_path)

                    pr_path_map["redirects"][get_relative_path(file_path, ROOT_DIR)] = get_relative_path(bulk_path, ROOT_DIR)

    # Write the PR path map JSON
    pr_map_file = os.path.join(pr_folder, "PRPathMap.json")
    with open(pr_map_file, "w") as json_file:
        json.dump(pr_path_map, json_file, indent=4)

# Cache root hashes once at the beginning
cache_root_hashes()

# Process each PR folder
for pr_dir, bulk_dir in zip(PR_DIRS, PR_BULK_DIRS):
    print(f"Processing {pr_dir}...")
    if not os.path.exists(pr_dir):
        print(f"!!!!!!{pr_dir} doesn't exist! Skipping!!!!!!")
        continue

    for pr_folder_name in os.listdir(pr_dir):
        pr_folder_path = os.path.join(pr_dir, pr_folder_name)
        if os.path.isdir(pr_folder_path) and pr_folder_path != bulk_dir:
            print(f"Processing {pr_folder_path}...")
            process_pr_folder(pr_folder_path, bulk_dir)

print("Deduplication and mapping complete!")
