# written thanks to the wonders of GenAI, with minimal modifications :D
import os
import requests
import zipfile
import shutil
import sys

# GitHub repository details
REPO = sys.argv[1]
GITHUB_API_URL = f"https://api.github.com/repos/{REPO}/releases"
HEADERS = {"Accept": "application/vnd.github.v3+json"}  # Add authentication if needed

# Directory where the files will be extracted
STATIC_DIR = sys.argv[2]
os.makedirs(STATIC_DIR, exist_ok=True)

def get_releases():
    response = requests.get(GITHUB_API_URL, headers=HEADERS)
    response.raise_for_status()
    return response.json()

def download_asset(asset_url, filename):
    response = requests.get(asset_url, headers=HEADERS, stream=True)
    response.raise_for_status()
    with open(filename, "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

def extract_zip(zip_path, extract_to):
    os.makedirs(extract_to, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)

def process_release(release, base_dir):
    tag_name = release["tag_name"]
    asset_url = None
    
    zip_name = f"splashkitonline-static-site-{tag_name.replace("/","_")}.zip"
    
    for asset in release["assets"]:
        if asset["name"] == zip_name:
            asset_url = asset["browser_download_url"]
            break
    
    if asset_url:
        print(f"Downloading {tag_name}...")
        download_asset(asset_url, zip_name)
        extract_zip(zip_name, base_dir)
        os.remove(zip_name)
    else:
        print(f"No {zip_name} found for {tag_name}, skipping...")

if __name__ == "__main__":
    releases = get_releases()
    
    for release in releases:
        try:
            release_dir = os.path.join(STATIC_DIR, release["tag_name"])
            print(f"Processing release {release['tag_name']}...")
            process_release(release, release_dir)
        except Exception as e:
            print(f"Failed to process release", release, e)
    
    print("Done!")
