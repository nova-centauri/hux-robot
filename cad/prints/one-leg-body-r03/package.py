#!/usr/bin/env python3
"""Package the reviewed R03 kit. Exclude backups, caches and prior ZIPs."""
from pathlib import Path
import hashlib
import json
import zipfile
from pypdf import PdfReader

HERE=Path(__file__).resolve().parent
manifest=json.loads((HERE/'manifest.json').read_text())
validation=json.loads((HERE/'validation.json').read_text())
assert len(manifest['parts'])==len(validation['parts'])==9
for part in validation['parts']:
    actual=hashlib.sha256((HERE/'stl'/(part['id']+'.stl')).read_bytes()).hexdigest()
    assert actual==part['stl_sha256'],part['id']
reader=PdfReader(HERE/'one-leg-body-r03-drawings.pdf')
assert len(reader.pages)==4
for page in reader.pages:
    assert abs(float(page.mediabox.width)-1224)<.01
    assert abs(float(page.mediabox.height)-792)<.01
    assert 'REVISION R03' in page.extract_text()
allowed={'.md','.py','.json','.png','.pdf','.step','.stl','.blend','.3mf'}
files=sorted(p for p in HERE.rglob('*') if p.is_file() and p.suffix in allowed and
             '__pycache__' not in p.parts and p.name!='package-manifest.json')
record={'revision':'R03','pdf_pages':4,'pdf_page_inches':[17,11],
        'files':{p.relative_to(HERE).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(HERE/'package-manifest.json').write_text(json.dumps(record,indent=2)+'\n')
files.append(HERE/'package-manifest.json')
out=HERE/'one-leg-body-r03-kit.zip'
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files: z.write(p,'one-leg-body-r03/'+p.relative_to(HERE).as_posix())
with zipfile.ZipFile(out) as z: assert z.testzip() is None
print(f'Packaged {len(files)} files. ZIP: {out.stat().st_size/1024/1024:.2f} MiB. PDF: 4 sheets at 17 x 11 inches.')
