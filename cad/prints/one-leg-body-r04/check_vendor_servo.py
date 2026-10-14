#!/usr/bin/env python3
"""Optional check against the untouched ST3215 STEP downloaded from Waveshare."""
import argparse
import hashlib
import json
from pathlib import Path
import cadquery as cq
h=Path(__file__).resolve().parent
ap=argparse.ArgumentParser();ap.add_argument('vendor_step',type=Path);a=ap.parse_args()
s=cq.importers.importStep(str(a.vendor_step)).val()
# Vendor Y is the shaft axis; X is the long case direction; Z is the case width.
s=s.rotate((0,0,0),(0,1,0),-90).translate((0,38.2,107))
checks=[]
for name in ('servo_cradle','servo_bar_4','servo_bar_17','body_near'):
    t=cq.importers.importStep(str(h/'reference'/(name+'.step'))).val()
    overlap=s.intersect(t).Volume();distance=s.distance(t)
    assert overlap<1e-3,(name,overlap)
    checks.append({'part':name,'overlap_mm3':round(overlap,6),'clearance_mm':round(distance,4)})
report={'source':'https://files.waveshare.com/upload/5/59/ST3215-3D.zip',
    'step_sha256':hashlib.sha256(a.vendor_step.read_bytes()).hexdigest(),
    'transform':'Rotate -90 degrees about Y, translate (0,38.2,107) mm.',
    'checks':checks,'scope':'Vendor geometry only. Received servo, cable, pad compression and physical fit remain unverified.'}
(h/'vendor-servo-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
