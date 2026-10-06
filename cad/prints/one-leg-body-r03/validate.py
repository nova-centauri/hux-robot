#!/usr/bin/env python3
"""Independent export checks. Read STL and STEP outputs, not in-memory solids."""
from pathlib import Path
import hashlib
import json
import math
import numpy as np
import trimesh
import cadquery as cq

HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'manifest.json').read_text())
EXPECTED={'01_body_side':(120,185,6),'02_equipment_deck':(120,135,4),'03_deck_angle':(26,26,18),
 '04_lower_lock_link':(126,16,5),'05_motor_carrier':(63,71,6),'06_upper_link':(126,16,5),
 '07_spacer_2mm':(9,9,2),'08_spacer_12mm':(9,9,12),'09_interface_coupon':(86,30,4)}
checks=[]
for part in M['parts']:
    name=part['id']; path=HERE/'stl'/(name+'.stl')
    mesh=trimesh.load_mesh(path,process=True)
    assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0, name
    assert len(mesh.split())==1, name
    assert np.allclose(mesh.extents,EXPECTED[name],atol=.05), (name,mesh.extents)
    assert abs(mesh.bounds[0,2])<1e-5 and max(mesh.extents)<256, name
    solid=cq.importers.importStep(str(HERE/'step'/(name+'.step'))).val()
    assert solid.isValid() and len(solid.Solids())==1, name
    assert abs(solid.Volume()-mesh.volume)/solid.Volume()<.003, name
    # Section the independent mesh and find a separate closed loop for each through hole.
    features=part['features']
    if 'holes' in features:
        section=mesh.section(plane_origin=[0,0,features['thickness']/2],plane_normal=[0,0,1])
        assert section is not None, name
        loops=section.discrete
        for x,y,d in features['holes']:
            candidates=[loop for loop in loops if np.linalg.norm((loop[:,:2].min(0)+loop[:,:2].max(0))/2-[x,y])<.06]
            assert any(np.max(np.abs(np.linalg.norm(loop[:,:2]-[x,y],axis=1)-d/2))<.04 for loop in candidates),(name,x,y,d)
    checks.append({'id':name,'watertight':True,'single_solid':True,'step_valid':True,
        'bounds_mm':mesh.extents.round(3).tolist(),'volume_mm3':round(float(mesh.volume),2),
        'stl_sha256':hashlib.sha256(path.read_bytes()).hexdigest()})

# Coordinate checks independent of CAD transforms.
link=next(p for p in M['parts'] if p['id']=='04_lower_lock_link')
assert link['features']['holes']==[[0,0,4.5],[110,0,4.5],[24,0,4.5]]
panel=next(p for p in M['parts'] if p['id']=='01_body_side')
assert any(math.dist(h[:2],[12,-24*math.cos(math.pi/6)])<1e-6 for h in panel['features']['holes'])

# All stationary parts must have zero solid overlap. Touching joint faces are allowed.
instances=M['assembly']; solids={i['name']:trimesh.load_mesh(HERE/i['file']) for i in instances}
fixed=[i for i in instances if i['name'].startswith(('body_near','body_far','deck_','angle_','fixture_'))]
fixed_overlaps=[]
for index,a in enumerate(fixed):
    for b in fixed[index+1:]:
        ma,mb=solids[a['name']],solids[b['name']]
        overlap=np.minimum(ma.bounds[1],mb.bounds[1])-np.maximum(ma.bounds[0],mb.bounds[0])
        if np.min(overlap)<.01: continue
        # AABB overlap can occur at the hollow bracket corner. Compare B-rep placement from STL solids via mesh volume intersection is unnecessary here.
        fixed_overlaps.append([a['name'],b['name'],overlap.round(3).tolist()])
assert not fixed_overlaps, fixed_overlaps
report={'revision':'R03','status':'Export checks passed. Physical fit and strength remain unverified.',
    'parts':checks,'stationary_aabb_overlap_count':0,'clearance_audit':'clearance-audit.json'}
(HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'{len(checks)} STL/STEP pairs passed. Hole sections, dimensions and fixed-part overlaps passed.')
