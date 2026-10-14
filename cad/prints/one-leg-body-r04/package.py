#!/usr/bin/env python3
"""Package the checked kit and the small first-fit batch without stale or recursive archives."""
from pathlib import Path
import hashlib
import json
import zipfile
HERE=Path(__file__).resolve().parent
validation=json.loads((HERE/'validation.json').read_text())
for name,want in validation['source_hashes'].items():
    assert hashlib.sha256((HERE/name).read_bytes()).hexdigest()==want,('stale validation',name)
manifest=json.loads((HERE/'manifest.json').read_text())
for part in validation['parts']:
    p=HERE/'stl'/(part['part']+'.stl')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==part['sha256'],p
for name in ('assembly.png','equipment.png','parts.png','one-leg-body-r04.blend','one-leg-body-r04.step','one-leg-body-r04-drawings.pdf','vendor-servo-check.json'):
    assert (HERE/name).is_file(),name
# A local review copy keeps the downloaded kit self-contained.
review=HERE.parents[2]/'docs/checklists/2026-10-13-r04-fit-review.md'
if review.exists():
    (HERE/'review.md').write_text(review.read_text().replace('../../cad/prints/one-leg-body-r04/README.md','README.md'))
files=[p for p in HERE.rglob('*') if p.is_file() and p.suffix not in ('.zip','.pyc')
       and '__pycache__' not in p.parts and p.name!='package-manifest.json']
record={'revision':'R04','files':{str(p.relative_to(HERE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}}
(HERE/'package-manifest.json').write_text(json.dumps(record,indent=2)+'\n')
files.append(HERE/'package-manifest.json')
with zipfile.ZipFile(HERE/'one-leg-body-r04-kit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(files):z.write(p,Path('one-leg-body-r04')/p.relative_to(HERE))
with zipfile.ZipFile(HERE/'r04-first-fit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for pid in ('02_open_deck_angle','19_fit_coupon','21_side_joint_sample','22_deck_joint_sample'):
        z.write(HERE/'stl'/(pid+'.stl'),pid+'.stl')
    z.writestr('READ-ME.txt','HUX R04 FIRST FIT\nPrint one of each STL at 100% in mm.\nUse the supplied flat orientations.\nTest BOTH M4 x 16 bolts, plain nuts and two 0.5 mm washers per bolt in the corner sample.\nCheck the actual socket or wrench on both nuts.\nDo not print the full body until this joint fits.\nRead the full R04 guide for the next wall/deck trial.\n')
for name in ('one-leg-body-r04-kit.zip','r04-first-fit.zip'):
    with zipfile.ZipFile(HERE/name) as z:assert z.testzip() is None
    print(name,round((HERE/name).stat().st_size/1e6,2),'MB')
