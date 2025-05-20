# written thanks to the wonders of GenAI, with minimal modifications :D
import subprocess
import requests
import os
import sys

#edit_release.py update <token> <username/repo> <tag> <SHA> <is_prerelease (yes/no)> <assetsfile> <description>
#edit_release.py delete <token> <username/repo> <tag>

assert len(sys.argv[1:]) > 1
assert sys.argv[1] == "update" or sys.argv[1] == "delete"
if sys.argv[1] == "update":
    assert len(sys.argv[1:]) == 8
    assert sys.argv[6] == "yes" or sys.argv[5] == "no"
else:
    assert len(sys.argv[1:]) == 4

# Configuration
GITHUB_TOKEN = sys.argv[2]
REPO = sys.argv[3]
REPO_URL = f"https://github.com/{REPO}.git"
API_BASE = f"https://api.github.com/repos/{REPO}"
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}

def run_git_command(*args):
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Git command failed: {' '.join(args)}\n{result.stderr}")
        exit(1)
    return result.stdout.strip()

def create_or_update_tag(tag_name, sha):
    run_git_command("tag", "-f", tag_name, sha)
    run_git_command("push", "--force", REPO_URL, tag_name)
    print(f"Tag {tag_name} created/updated at {sha}")

def get_release(tag_name):
    url = f"{API_BASE}/releases/tags/{tag_name}"
    response = requests.get(url, headers=HEADERS)
    return response.json() if response.status_code == 200 else None

def create_release(tag_name):
    url = f"{API_BASE}/releases"
    payload = {"tag_name": tag_name, "name": tag_name, "draft": False, "body": sys.argv[8].replace("\\n","\n"), "prerelease": sys.argv[6]=="yes"}
    response = requests.post(url, headers=HEADERS, json=payload)
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Failed to create release: {response.text}")
        exit(1)

def upload_asset(release_id, file_path):
    file_name = os.path.basename(file_path)
    delete_existing_asset(release_id, file_name)
    url = f"https://uploads.github.com/repos/{REPO}/releases/{release_id}/assets?name={file_name}"
    with open(file_path, "rb") as file:
        headers = HEADERS.copy()
        headers["Content-Type"] = "application/octet-stream"
        response = requests.post(url, headers=headers, data=file)
    if response.status_code == 201:
        print(f"Uploaded {file_name}")
    else:
        print(f"Failed to upload {file_name}: {response.text}")

def delete_existing_asset(release_id, asset_name):
    url = f"{API_BASE}/releases/{release_id}/assets"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        assets = response.json()
        for asset in assets:
            if asset["name"] == asset_name:
                delete_url = asset["url"]
                requests.delete(delete_url, headers=HEADERS)
                print(f"Deleted existing asset: {asset_name}")

def delete_tag(tag_name):
    run_git_command("push", "--delete", REPO_URL, tag_name)

def delete_release(release_id):
    requests.delete(f"{API_BASE}/releases/{release_id}", headers=HEADERS)

if __name__ == "__main__":
    tag_name = sys.argv[4]
    if sys.argv[1] == "update":
        sha = sys.argv[5]
        create_or_update_tag(tag_name, sha)

        release = get_release(tag_name) or create_release(tag_name)
        release_id = release["id"]

        with open(sys.argv[7], "r") as file:
            for line in file:
                file_path = line.strip()
                if os.path.isfile(file_path):
                    upload_asset(release_id, file_path)
                else:
                    print(f"File not found: {file_path}")
    else:
        release = get_release(tag_name)
        print("Deleting release:", release)
        if release:
            delete_release(release)
            delete_tag(tag_name)
