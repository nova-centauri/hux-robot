#!/usr/bin/env python3
"""Read exported R05 meshes and STEP solids. Fail on geometry or assembly defects."""
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
HIP=P['hip']['x']; MID=-67.5; SV=P['inner_servo']
checks=[]


def circle_at(mesh,z,x,y,d):
    sec=mesh.section(plane_origin=[0,0,z],plane_normal=[0,0,1])
    assert sec is not None
    loops=[a for a in sec.discrete if np.linalg.norm((a[:,:2].min(0)+a[:,:2].max(0))/2-[x,y])<.06]
    return any(np.max(np.abs(np.linalg.norm(a[:,:2]-[x,y],axis=1)-d/2))<.04 for a in loops)


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
    if pid=='13_inner_servo_cradle':
        for x,y,d in f['holes']:
            z=1.0 if abs(abs(x)-30)<1e-6 else 3.6     # wall bolts below their nut pockets, clamp bolts above
            assert circle_at(mesh,z,x,y,d),(pid,'hole',x,y,d)
    elif 'holes' in f:
        for x,y,d in f['holes']:assert circle_at(mesh,f['thickness']/2,x,y,d),(pid,'hole',x,y,d)
    if 'slots' in f:
        sec=mesh.section(plane_origin=[0,0,f['thickness']/2],plane_normal=[0,0,1])
        for x,y,L,w,a in f['slots']:
            loops=[v for v in sec.discrete if np.linalg.norm((v[:,:2].min(0)+v[:,:2].max(0))/2-[x,y])<.07]
            expected=[L,w] if a==0 else [w,L]
            assert any(np.allclose(v[:,:2].max(0)-v[:,:2].min(0),expected,atol=.06) for v in loops),(pid,'slot',x,y)
    checks.append({'part':pid,'quantity':part['quantity'],'watertight':True,'one_solid':True,'step_valid':True,
        'hole_and_slot_sections':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
print('STL/STEP and hole checks passed.',flush=True)

expected={'01_body_side':[120,215,6],'02_open_deck_angle':[34,34,22],
    '03_power_deck':[120,133.8,4],'04_interface_deck':[120,133.8,4],'05_control_deck':[120,133.8,4],
    '11_pico_plate':[66,40,3],'12_imu_plate':[44,44,3],'13_inner_servo_cradle':[70,39.72,40.5],
    '14_servo_cap_bar':[8,40.72,4],'15_interface_cassette':[62,54,3],'24_battery_tray':[120,133.8,14]}
parts={p['id']:p for p in M['parts']}
for pid,dims in expected.items():assert np.allclose(parts[pid]['bounds_mm'],dims,atol=.05),(pid,parts[pid]['bounds_mm'])
side=parts['01_body_side']['features']['holes']
for need in [(HIP,0),(HIP,40),(HIP-12,-24*math.cos(math.pi/6)),(48,42),(-44,42)]:
    assert any(abs(h[0]-need[0])<1e-6 and abs(h[1]-need[1])<1e-6 for h in side),('wall hole',need)
assert not any(abs(h[0])<1e-6 and abs(h[1])<1e-6 for h in side),'R04 centre-line hip hole remains'

solids={i['name']:cq.importers.importStep(str(HERE/'reference'/(i['name']+'.step'))).val() for i in M['assembly']}

def bounds(s):
    b=s.BoundingBox();return np.array([b.xmin,b.ymin,b.zmin]),np.array([b.xmax,b.ymax,b.zmax])

def lower_distance(a,b):
    alo,ahi=bounds(a);blo,bhi=bounds(b)
    return float(np.linalg.norm(np.maximum(0,np.maximum(alo-bhi,blo-ahi))))

def cylinder(r,length,start,axis):return cq.Solid.makeCylinder(r,length,cq.Vector(*start),cq.Vector(*axis))

# Wall hardware envelopes: inner nuts plus bolt ends, and outer heads, on both walls.
hardware=[]
for x,z,inner in [(HIP,0,9),(HIP,40,9),(HIP-12,-24*math.cos(math.pi/6),9)]:
    hardware.append((f'pivot nut {x:.0f},{z:.0f}',cylinder(4.05,inner,(x,0,z),(0,-1,0))))
for bx,bz in SV['wall_bolts']:
    x,z=SV['case_centre_x']+bx,SV['case_centre_z']+bz
    hardware.append((f'cradle bolt head {x:.1f},{z:.1f}',cylinder(3.6,2.8,(x,6,z),(0,1,0))))
for x in P['tray']['bolt_x']:
    hardware.append((f'tray bolt head {x}',cylinder(3.6,2.8,(x,6,P['tray']['bolt_z']),(0,1,0))))
far_hw=[(n+' far',s.mirror('XZ',(0,MID,0))) for n,s in hardware]
hardware+=far_hw

fixed=[i for i in M['assembly'] if i['group'] in ('fixed','keepout','joint')]
intersections=[]; exact=0
items=[(i['name'],solids[i['name']]) for i in fixed]+hardware
for (an,sa),(bn,sb) in itertools.combinations(items,2):
    alo,ahi=bounds(sa);blo,bhi=bounds(sb)
    if np.min(np.minimum(ahi,bhi)-np.maximum(alo,blo))<1e-5:continue
    exact+=1;v=sa.intersect(sb).Volume()
    if v>1e-3:intersections.append({'a':an,'b':bn,'volume_mm3':round(v,4)})
# Wall bolts and pivot nuts pass through their own wall and fixed mounts by design.
allowed=lambda r:(r['a'].startswith('body_') or r['b'].startswith('body_')) and ('nut' in r['a']+r['b'] or 'head' in r['a']+r['b'] or 'spacer' in r['a']+r['b'])
real=[r for r in intersections if not allowed(r)]
(HERE/'interferences.json').write_text(json.dumps(real,indent=2)+'\n')
assert not real,real
print(f'Fixed assembly, wall hardware and connector spaces passed ({exact} exact intersections).',flush=True)

# Leg sweep, both sides. Struts rotate about the rear hips. The carrier, the gearmotor and the wheel translate.
x30=HIP-110*math.sin(math.pi/6); z30=-110*math.cos(math.pi/6)
fixed_items=[(i['name'],solids[i['name']]) for i in fixed]+hardware
clearances=[]; broad=0
QMAX=P['leg']['max_deg']
for q in np.arange(15,QMAX+.01,.5):
    x=HIP-110*math.sin(math.radians(q)); z=-110*math.cos(math.radians(q))
    for suffix in ('','_far'):
        mv={}
        for name,pz in (('lower_link',0),('upper_link',40)):
            mv[name]=solids[name+suffix].rotate((HIP,0,pz),(HIP,1,pz),float(q)-30)
        for name in ('carrier','gearbox','motor','encoder','wheel','carrier_lower_spacer','carrier_upper_spacer'):
            mv[name]=solids[name+suffix].translate((x-x30,0,z-z30))
        pairs=[(n,s,fn,fs) for n,s in mv.items() for fn,fs in fixed_items]
        pairs+=[(a,mv[a],b,mv[b]) for a,b in [('lower_link','upper_link'),('lower_link','gearbox'),('upper_link','gearbox'),
            ('lower_link','motor'),('carrier','wheel')]]
        for an,a,bn,b in pairs:
            broad+=1
            if lower_distance(a,b)>3:continue
            if {an,bn}<= {'lower_link','body_lower_spacer'+suffix} or {an,bn}<={'upper_link','body_upper_spacer'+suffix}:continue
            d=a.distance(b)
            ok=d>=1-1e-5 or (('spacer' in an or 'spacer' in bn) and d>=-1e-6)
            assert ok,(q,suffix,an,bn,d)
            clearances.append({'angle_deg':float(q),'side':'far' if suffix else 'near','a':an,'b':bn,'clearance_mm':round(d,3)})
gm=[c['clearance_mm'] for c in clearances if 'gearbox' in (c['a'],c['b']) or 'motor' in (c['a'],c['b'])]
print(f'Sampled leg sweep passed: {broad} pairs, {len(clearances)} exact distances. Minimum gearmotor clearance {min(gm) if gm else None} mm.',flush=True)
report={'revision':'R05','status':'CAD checks passed. Printed fits, the servo transmission and load capacity remain unverified.',
    'parts':checks,'fixed_exact_intersections':exact,'wall_hardware_envelopes':len(hardware),
    'sweep':{'poses':int((QMAX-15)/.5)+1,'sides':2,'range_deg':[15,QMAX],'step_deg':.5,'pairs':broad,'exact_checks':len(clearances),
        'minimum_exact_clearance_mm':min(c['clearance_mm'] for c in clearances if 'spacer' not in c['a']+c['b']),
        'minimum_gearmotor_clearance_mm':min(gm) if gm else None,
        'scope':'Nominal parts, reserved board volumes and wall bolt envelopes. No cable, print tolerance, deflection or servo transmission.'},
    'source_hashes':M['source_hashes']}
(HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
(HERE/'clearance-audit.json').write_text(json.dumps(clearances,indent=2)+'\n')
print('R05 validation passed.',flush=True)
