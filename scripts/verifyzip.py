#!/usr/bin/env python3
import sys
import zipfile

zip_path = 'upload-extension.zip'

try:
    with zipfile.ZipFile(zip_path, 'r') as zf:
        names = zf.namelist()
        print('Archive entries:', len(names))
        has_manifest = 'manifest.json' in names
        print('Has manifest at root:', has_manifest)
        for n in names[:10]:
            print('-', n)
        if not has_manifest:
            sys.exit('manifest.json missing at archive root')
except FileNotFoundError:
    sys.exit(f'Archive not found: {zip_path}')
