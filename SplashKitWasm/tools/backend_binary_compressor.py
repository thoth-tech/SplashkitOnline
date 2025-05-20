'''
Takes two equal length lists of files.
Compresses the files in the first list, and outputs them
with the names in the second list.
'''
import sys
import lzma

file_list = sys.argv[1:]
assert len(file_list)%2 == 0, "Non even number of files passed to binary compressor - there should be two equal length sets of files, the uncompressed and compressed names."

file_count = len(file_list)//2;
# split files into two halves, then zip them together
files = zip(file_list[:file_count], file_list[file_count:])

for filename_in, filename_out in files:
    print("Compressing "+filename_in[filename_in.rfind("/"):]+"...")
    try:
        with open(filename_in, 'rb') as f:
            file_contents = f.read()
    except:
        sys.exit("\033[91mFailed to read in file to compress at "+filename_in+"\033[0m")

    with lzma.open(filename_out, "w", format=lzma.FORMAT_ALONE) as f:
        f.write(file_contents)
