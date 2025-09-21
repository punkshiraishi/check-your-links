#!/usr/bin/env python3
import os
import sys
import zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT_DIR = os.path.join(ROOT_DIR, 'extension')
ZIP_PATH = os.path.join(ROOT_DIR, 'upload-extension.zip')

if not os.path.exists(os.path.join(EXT_DIR, 'manifest.json')):
    sys.stderr.write(f'Error: manifest.json not found under {EXT_DIR}\n')
    sys.exit(1)

with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zf:
    for folder, _, files in os.walk(EXT_DIR):
        for fname in files:
            if fname.endswith('.map'):
                continue
            fpath = os.path.join(folder, fname)
            arcname = os.path.relpath(fpath, EXT_DIR)
            zf.write(fpath, arcname)

print('Wrote', ZIP_PATH)
