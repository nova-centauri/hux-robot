#!/usr/bin/env python3
"""Package the checked R05 kit without stale or recursive archives."""
from pathlib import Path
import hashlib, json, zipfile
HERE=Path(__file__).resolve().parent
validation=json.loads((HERE/'validation.json').read_text())
for name,want in validation['source_hashes'].items():
    assert hashlib.sha256((HERE/name).read_bytes()).hexdigest()==want,('stale validation',name)
for part in validation['parts']:
    p=HERE/'stl'/(part['part']+'.stl')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==part['sha256'],p
for name in ('two-leg-body-r05.step','bambu/plates.json'):assert (HERE/name).is_file(),name
files=[p for p in HERE.rglob('*') if p.is_file() and p.suffix not in ('.zip','.pyc')
       and '__pycache__' not in p.parts and p.name!='package-manifest.json' and 'reference' not in p.parts]
record={'revision':'R05','files':{str(p.relative_to(HERE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}}
(HERE/'package-manifest.json').write_text(json.dumps(record,indent=2)+'\n')
files.append(HERE/'package-manifest.json')
with zipfile.ZipFile(HERE/'two-leg-body-r05-kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(files):z.write(p,Path('two-leg-body-r05')/p.relative_to(HERE))
with zipfile.ZipFile(HERE/'two-leg-body-r05-kit.zip') as z:assert z.testzip() is None
print('two-leg-body-r05-kit.zip',round((HERE/'two-leg-body-r05-kit.zip').stat().st_size/1e6,2),'MB')
