#
#   NOTE: ENSURE /Browser_IDE/setup.js MAINTAINS PARITY
#

import zipfile
import urllib.request
import os

thoth_tech_repo_path = "https://github.com/thoth-tech/SplashkitOnline/raw/"
why_penguins_repo_path = "https://github.com/WhyPenguins/SplashkitOnline/raw/"

js_runtime_dir = "./runtimes/javascript/bin/"
cxx_compiler_dir = "./compilers/cxx/bin/"
cxx_runtime_dir = "./runtimes/cxx/bin/"

def download(repo_path, src, dst):
    print("Downloading " + src + "...")
    urllib.request.urlretrieve(repo_path + src, dst + os.path.basename(src))

# Language-agnostic files
download(thoth_tech_repo_path, "binaries/Browser_IDE/splashkit/splashkit_autocomplete.json", "./splashkit/")

# JS files
download(thoth_tech_repo_path, "binaries/Browser_IDE/splashkit/SplashKitBackendWASM.js", js_runtime_dir)
download(thoth_tech_repo_path, "binaries/Browser_IDE/splashkit/SplashKitBackendWASM.wasm", js_runtime_dir)

# C++ files
download(why_penguins_repo_path, "cxx-audio-support-binaries/Browser_IDE/compilers/cxx/bin/compiler.zip", cxx_compiler_dir)
download(why_penguins_repo_path, "cxx-audio-support-binaries/Browser_IDE/compilers/cxx/bin/wasi-sysroot.zip", cxx_compiler_dir)
download(why_penguins_repo_path, "cxx-audio-support-binaries/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.js", cxx_runtime_dir)
download(why_penguins_repo_path, "cxx-audio-support-binaries/Browser_IDE/runtimes/cxx/bin/SplashKitBackendWASMCPP.worker.js", cxx_runtime_dir)

# Unpack and delete compiler.zip
print("Extracting " + cxx_compiler_dir + "compiler.zip" + "...")
with zipfile.ZipFile(cxx_compiler_dir + "compiler.zip", 'r') as zip:
    zip.extractall(cxx_compiler_dir)
os.remove(cxx_compiler_dir + "compiler.zip")
