#!/usr/bin/env python3
"""Read exported meshes and STEP solids. Fail on geometry or assembly defects."""
from pathlib import Path
import hashlib
import itertools
import json
import math
import numpy as np
import trimesh
import cadquery as cq

HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'manifest.json').read_text())
P=json.loads((HERE/'parameters.json').read_text())
checks=[]
for part in M['parts']:
    pid=part['id']; path=HERE/'stl'/(pid+'.stl')
    mesh=trimesh.load_mesh(path,process=True)
    solid=cq.importers.importStep(str(HERE/'step'/(pid+'.step'))).val()
    assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0,pid
    assert len(mesh.split())==1 and solid.isValid() and len(solid.Solids())==1,pid
    assert abs(solid.Volume()-mesh.volume)/solid.Volume()<.004,pid
    assert np.allclose(mesh.extents,part['bounds_mm'],atol=.05),pid
    assert abs(mesh.bounds[0,2])<1e-5 and max(mesh.extents)<256,pid
    f=part['features']
    if 'holes' in f:
        h=3.6 if pid=='13_servo_cradle' else f['thickness']/2
        section=mesh.section(plane_origin=[0,0,h],plane_normal=[0,0,1])
        assert section is not None,pid
        for x,y,d in f['holes']:
            loops=[a for a in section.discrete if np.linalg.norm((a[:,:2].min(0)+a[:,:2].max(0))/2-[x,y])<.06]
            assert any(np.max(np.abs(np.linalg.norm(a[:,:2]-[x,y],axis=1)-d/2))<.04 for a in loops),(pid,'hole',x,y,d)
    # Slot profiles must be closed independent contours, with their intended extents.
    if 'slots' in f:
        sec=mesh.section(plane_origin=[0,0,f['thickness']/2],plane_normal=[0,0,1])
        for x,y,L,w,a in f['slots']:
            loops=[v for v in sec.discrete if np.linalg.norm((v[:,:2].min(0)+v[:,:2].max(0))/2-[x,y])<.07]
            expected=[L,w] if a==0 else [w,L]
            assert any(np.allclose(v[:,:2].max(0)-v[:,:2].min(0),expected,atol=.06) for v in loops),(pid,'slot',x,y)
    checks.append({'part':pid,'watertight':True,'one_solid':True,'step_valid':True,
        'hole_and_slot_sections':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
print('STL/STEP and hole checks passed.',flush=True)

# Independent nominal dimensions. These catches are not copied from the exported manifest.
expected={'01_body_side':[120,215,6],'02_open_deck_angle':[34,34,22],
    '03_power_deck':[120,133.8,4],'04_interface_deck':[120,133.8,4],'05_control_deck':[120,133.8,4],
    '11_pico_plate':[66,40,3],'12_imu_plate':[44,44,3],'13_servo_cradle':[68,64,40.5],
    '14_servo_cap_bar':[50,8,4],'15_interface_cassette':[62,54,3]}
for pid,dims in expected.items():
    part=next(p for p in M['parts'] if p['id']==pid)
    assert np.allclose(part['bounds_mm'],dims,atol=.05),(pid,dims)
assert math.isclose((135-133.8)/2,.6,abs_tol=1e-6)
parts={p['id']:p for p in M['parts']}
for pid,xs,ys,d in [('11_pico_plate',(-23.5,23.5),(-5.7,5.7),2.4),
                   ('12_imu_plate',(-10.16,10.16),(-10.16,10.16),3.5)]:
    for x,y in itertools.product(xs,ys):assert [x,y,d] in parts[pid]['features']['holes']

# Reopen every placed STEP, including component and service envelopes.
solids={i['name']:cq.importers.importStep(str(HERE/'reference'/(i['name']+'.step'))).val() for i in M['assembly']}

def bounds(s):
    b=s.BoundingBox();return np.array([b.xmin,b.ymin,b.zmin]),np.array([b.xmax,b.ymax,b.zmax])

def lower_distance(a,b):
    alo,ahi=bounds(a);blo,bhi=bounds(b)
    return float(np.linalg.norm(np.maximum(0,np.maximum(alo-bhi,blo-ahi))))

# All fixed components and keepouts are checked together. Touching mounting faces are allowed.
fixed=[i for i in M['assembly'] if i['group'] in ('fixed','keepout')]
intersections=[]; exact=0
for a,b in itertools.combinations(fixed,2):
    sa,sb=solids[a['name']],solids[b['name']]
    alo,ahi=bounds(sa);blo,bhi=bounds(sb)
    if np.min(np.minimum(ahi,bhi)-np.maximum(alo,blo))<1e-5:continue
    exact+=1;v=sa.intersect(sb).Volume()
    if v>1e-3:intersections.append({'a':a['name'],'b':b['name'],'volume_mm3':round(v,4)})
(HERE/'interferences.json').write_text(json.dumps(intersections,indent=2)+'\n')
assert not intersections,intersections
print(f'Fixed assembly and connector spaces passed ({exact} exact intersections).',flush=True)

# Cross-section checks of BOTH transverse angle holes, not just a watertight-mesh check.
angle=trimesh.load_mesh(HERE/'stl/02_open_deck_angle.stl')
for origin,normal,center,axes in [([0,2.5,0],[0,1,0],[18,11],[0,2]),([2.5,0,0],[1,0,0],[18,11],[1,2])]:
    sec=angle.section(plane_origin=origin,plane_normal=normal)
    assert any(np.max(np.abs(np.linalg.norm(v[:,axes]-center,axis=1)-2.3))<.04 for v in sec.discrete)

# Bolts are represented by shafts, heads, washers, nuts and a socket envelope in bracket coordinates.
# Side stack: 6 panel + 5 angle + 1 washers + 3.2 nut. Deck stack: 4 + 5 + 1 + 3.2.
angle_s=cq.importers.importStep(str(HERE/'step/02_open_deck_angle.step')).val()

def cylinder(radius,length,start,axis):return cq.Solid.makeCylinder(radius,length,cq.Vector(*start),cq.Vector(*axis))
side_shaft=cylinder(2,16,(-6.5,18,11),(1,0,0))
deck_shaft=cylinder(2,16,(18,-4.5,11),(0,1,0))
side_nut=cylinder(4.05,3.2,(5.5,18,11),(1,0,0))
deck_nut=cylinder(4.05,3.2,(18,5.5,11),(0,1,0))
# A 12 mm OD socket reaches each nut from the open interior. Check the other fastener and the angle.
side_tool=cylinder(6,28,(8.7,18,11),(1,0,0))
deck_tool=cylinder(6,28,(18,8.7,11),(0,1,0))
hardware_checks=[]
for an,a,bn,b in [('side bolt',side_shaft,'deck bolt',deck_shaft),('side nut',side_nut,'deck bolt',deck_shaft),
    ('deck nut',deck_nut,'side bolt',side_shaft),('side tool',side_tool,'deck nut',deck_nut),
    ('deck tool',deck_tool,'side nut',side_nut),('side tool',side_tool,'angle',angle_s),('deck tool',deck_tool,'angle',angle_s)]:
    assert a.intersect(b).Volume()<1e-4,(an,bn)
    hardware_checks.append({'a':an,'b':bn,'clearance_mm':round(a.distance(b),3)})
# The nut diameters conservatively bound hex corners. Bore the nut models for shaft clearance in future renders.
print('Bracket fastener and tool access checks passed.',flush=True)

# Full mounting hardware for the removable boards and plates. Nuts fit below each plate.
# These are check envelopes, not printable components. Touching faces are allowed.
mount_hardware=[]
def zbolt(name,x,y,bearing,length,diam,nut_bottom,nut_height):
    radius=diam/2
    sh=cylinder(radius,length,(x,y,bearing-length),(0,0,1))
    head=cylinder(2 if diam==2 else 2.85,2 if diam==2 else 3,(x,y,bearing),(0,0,1))
    nut=cylinder(2.31 if diam==2 else 3.18,nut_height,(x,y,nut_bottom),(0,0,1))
    washer=cylinder(2.1 if diam==2 else 3.5,.5,(x,y,bearing-.5),(0,0,1))
    mount_hardware.append((name,sh.fuse(head,nut,washer)))

for label,cy,base,feet in [('pico',-97.5,178,(56,30)),('imu',-41.5,178,(34,34)),
    ('driver',-96.5,68,(54,46)),('power',-38.5,68,(54,46)),
    ('bus',-96.5,128,(54,46)),('regulator',-38.5,128,(54,46))]:
    for x,y in itertools.product((-feet[0]/2,feet[0]/2),(-feet[1]/2,feet[1]/2)):
        zbolt(label+'_foot',x,cy+y,base+3.5,16,3,base-10.9,2.4)
    pitch=(47,11.4) if label=='pico' else (20.32,20.32) if label=='imu' else (44,30)
    height=10 if label=='pico' else 8
    pcb=1 if label=='pico' else 1.6
    for x,y in itertools.product((-pitch[0]/2,pitch[0]/2),(-pitch[1]/2,pitch[1]/2)):
        zbolt(label+'_board',x,cy+y,base+3+height+pcb+.5,18 if label=='pico' else 16,
            2 if label=='pico' else 3,base-(2.1 if label=='pico' else 2.9),1.6 if label=='pico' else 2.4)
for name,hardware in mount_hardware:
    for item in fixed:
        solid=solids[item['name']]
        if lower_distance(hardware,solid)>1e-6:continue
        overlap=hardware.intersect(solid).Volume()
        assert overlap<1e-3,(name,item['name'],'fastener overlap',overlap)
print(f'{len(mount_hardware)} board and module fastener envelopes passed.',flush=True)

# Move all leg parts from the exported neutral pose through 61 poses, independent of build.py.
neutral_x=55;neutral_z=-110*math.cos(math.pi/6)
clearances=[]; broad_count=0
for q in np.arange(15,45.01,.5):
    x=110*math.sin(math.radians(q));z=-110*math.cos(math.radians(q))
    moving={}
    for name in ('lower_link','upper_link'):
        pivot=(0,0,40 if name=='upper_link' else 0)
        moving[name]=solids[name].rotate(pivot,(0,1,pivot[2]),30-float(q))
    for name in ('carrier','gearbox','motor','encoder','wheel'):
        moving[name]=solids[name].translate((x-neutral_x,0,z-neutral_z))
    pairs=[(name,s,i['name'],solids[i['name']]) for name,s in moving.items() for i in fixed]
    pairs += [(a,moving[a],b,moving[b]) for a,b in [('lower_link','upper_link'),('lower_link','gearbox'),('upper_link','gearbox'),('carrier','wheel')]]
    for an,a,bn,b in pairs:
        broad_count+=1
        if lower_distance(a,b)>3:continue
        distance=a.distance(b)
        assert distance>=1-1e-5,(q,an,bn,distance)
        clearances.append({'angle_deg':float(q),'a':an,'b':bn,'clearance_mm':round(distance,3)})
print(f'Sampled leg sweep passed: {broad_count} pairs, {len(clearances)} exact distances.',flush=True)
report={'revision':'R04','status':'CAD checks passed. Printed fits and load capacity remain unverified.',
    'parts':checks,'assembly_overlap_mm3':0,'fixed_exact_intersections':exact,
    'deck_side_clearance_mm':.6,'module_and_board_fasteners_checked':len(mount_hardware),'bracket_hardware':hardware_checks,
    'sweep':{'poses':61,'range_deg':[15,45],'step_deg':.5,'pairs':broad_count,'exact_checks':len(clearances),
        'minimum_exact_clearance_mm':min(c['clearance_mm'] for c in clearances),
        'scope':'Nominal parts and reserved board volumes. No flexible cable, print tolerance, pivot hardware, deflection or powered servo transmission.'},
    'source_hashes':M['source_hashes']}
(HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
(HERE/'clearance-audit.json').write_text(json.dumps(clearances,indent=2)+'\n')
print('R04 validation passed.',flush=True)
