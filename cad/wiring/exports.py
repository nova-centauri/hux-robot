#!/usr/bin/env python3
"""Record and check the sources and bytes of the electrical print exports."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

STEMS = (
    'v1-proof-el-01-overview', 'v1-proof-el-02-pico-imu',
    'v1-proof-el-03-wheel-harness', 'v1-proof-el-04-power-servo',
    'v1-proof-el-05-both-wheels',
)
PRINT_PDFS = (
    'v1-proof-el-01-overview-11x17.pdf',
    'v1-proof-el-05-both-wheels-11x17.pdf',
    'v1-proof-wiring-atlas.pdf',
)
INPUTS = ('build.py', 'complete.py', 'render.mjs', 'exports.py',
          *(stem + '.svg' for stem in STEMS))
OUTPUTS = (*PRINT_PDFS, *(stem + '.png' for stem in STEMS))
MANIFEST = 'v1-proof-export-manifest.json'
LAYOUT = {'paper_inches': [17, 11], 'margin_inches': 0.5}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_manifest(directory):
    data = {'schema': 1, 'layout': LAYOUT,
            'sources': {name: digest(directory / name) for name in INPUTS},
            'outputs': {name: digest(directory / name) for name in OUTPUTS}}
    (directory / MANIFEST).write_text(json.dumps(data, indent=2) + '\n')


def check_exports(directory):
    try:
        data = json.loads((directory / MANIFEST).read_text())
    except (OSError, ValueError):
        return ['The electrical export manifest is missing or invalid. Run node cad/wiring/render.mjs.']
    if data.get('schema') != 1 or data.get('layout') != LAYOUT:
        return ['The electrical print layout is stale. Run node cad/wiring/render.mjs.']
    errors = []
    for group, names in [('sources', INPUTS), ('outputs', OUTPUTS)]:
        hashes = data.get(group)
        if not isinstance(hashes, dict):
            errors.append(f'The electrical export manifest needs {group}. Run node cad/wiring/render.mjs.')
            continue
        for name in names:
            path = directory / name
            if not path.is_file() or digest(path) != hashes.get(name):
                errors.append(f'The electrical export is stale: {name}. Run node cad/wiring/render.mjs.')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent
    if args.write:
        write_manifest(directory)
    errors = check_exports(directory)
    for error in errors:
        print(error, file=sys.stderr)
    if not errors:
        print('Electrical PDFs and PNGs match the drawing sources.')
    return bool(errors)


if __name__ == '__main__':
    sys.exit(main())
