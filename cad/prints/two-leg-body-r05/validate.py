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
HIP=P['hip']['x']; MID=-67.5; LD=P['leg_drive']; CX,CZ=LD['crank_centre_xz']
import leg_drive as KIN
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
    if pid=='25_servo_frame':
        for x,y,d in f['holes']:assert circle_at(mesh,7.0,x,y,d),(pid,'hole',x,y,d)   # between the counterbores and the nut pockets
    elif pid=='26_crank_hub':
        assert circle_at(mesh,15.0,0,0,f['holes'][0][2]),(pid,'centre bore')
        rx,ry,rd=f['stud_hole']; assert circle_at(mesh,2.5,rx,-ry,rd),(pid,'stud hole')   # crank face on the bed
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
    '11_pico_plate':[66,40,3],'12_imu_plate':[44,44,3],'25_servo_frame':[52,42,12],
    '27_wall_bushing':[25,25,7.5],'08_upper_link':[126,16,5],'15_interface_cassette':[62,54,3],'24_battery_tray':[120,133.8,14]}
parts={p['id']:p for p in M['parts']}
for pid,dims in expected.items():assert np.allclose(parts[pid]['bounds_mm'],dims,atol=.05),(pid,parts[pid]['bounds_mm'])
side=parts['01_body_side']['features']['holes']
for need in [(HIP,0),(HIP,40),(HIP-12,-24*math.cos(math.pi/6)),(48,42),(-44,42),(CX,CZ)]+[tuple(h) for h in LD['frame']['m4_holes_xz']]:
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
for x,z in LD['frame']['m4_holes_xz']:
    hardware.append((f'frame bolt head {x:.1f},{z:.1f}',cylinder(3.6,2.8,(x,6,z),(0,1,0))))
    hardware.append((f'frame nut {x:.1f},{z:.1f}',cylinder(4.05,3.2,(x,-LD['frame']['thickness']+LD['frame']['nut_pocket_depth'],z),(0,-1,0))))
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
allowed2=lambda r:('servo_frame' in r['a']+r['b'] and 'frame nut' in r['a']+r['b']) or (r['a'].startswith('ST3215_') and r['b'].startswith('ST3215_'))
real=[r for r in intersections if not allowed(r) and not allowed2(r)]
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

# Leg drive sweep: the crank hub turns about its axis, the pushrod follows the boss on the upper link.
drive_clear=[]; drive_min=None
hub0=solids['crank_hub']; a30=KIN.crank_angle(30)
drive_fixed=[(n,s) for n,s in fixed_items if not n.endswith('_far') and 'far' not in n]
for q in np.arange(15,QMAX+.01,.5):
    q=float(q); ang=KIN.crank_angle(q)
    hub=hub0.rotate((CX,0,CZ),(CX,1,CZ),-(ang-a30))
    S=KIN.crank_tip(q); Pb=KIN.boss(q); d=(Pb[0]-S[0],Pb[1]-S[1]); n=math.hypot(*d)
    rod=cq.Solid.makeCylinder(1,n,cq.Vector(S[0],28,S[1]),cq.Vector(d[0],0,d[1]))
    for x,z in (S,Pb):rod=rod.fuse(cq.Solid.makeSphere(3).translate(cq.Vector(x,28,z)))
    up=solids['upper_link'].rotate((HIP,0,40),(HIP,1,40),q-30); lo=solids['lower_link'].rotate((HIP,0,0),(HIP,1,0),q-30)
    pairs=[('crank_hub',hub,fn,fs) for fn,fs in drive_fixed if not fn.startswith('wall_bushing') and 'disc' not in fn and 'body_near' not in fn]
    pairs+=[('pushrod',rod,fn,fs) for fn,fs in drive_fixed]
    pairs+=[('crank_hub',hub,'upper_link',up),('crank_hub',hub,'lower_link',lo),('pushrod',rod,'lower_link',lo),('pushrod',rod,'upper_link',up)]
    for an,a,bn,b in pairs:
        if lower_distance(a,b)>3:continue
        dd=a.distance(b)
        assert dd>=1-1e-5,(q,an,bn,dd)
        drive_clear.append({'angle_deg':q,'crank_deg':round(ang,2),'a':an,'b':bn,'clearance_mm':round(dd,3)})
# the hub must stay inside the bushing bore and the wall bore
bush=solids['wall_bushing_near']; wall=solids['body_near']
assert hub0.intersect(bush).Volume()<1e-6 and hub0.intersect(wall).Volume()<1e-6,'hub touches the bushing or the wall'
drive_min=min(c['clearance_mm'] for c in drive_clear) if drive_clear else None
sweep_angles=[KIN.crank_angle(q) for q in (15,QMAX)]
print(f'Leg drive sweep passed: {len(drive_clear)} exact distances, minimum {drive_min} mm, crank sweep {abs(sweep_angles[1]-sweep_angles[0]):.1f} degrees.',flush=True)
gm=[c['clearance_mm'] for c in clearances if 'gearbox' in (c['a'],c['b']) or 'motor' in (c['a'],c['b'])]
print(f'Sampled leg sweep passed: {broad} pairs, {len(clearances)} exact distances. Minimum gearmotor clearance {min(gm) if gm else None} mm.',flush=True)
report={'revision':'R05','status':'CAD checks passed. Printed fits, the servo drive hardware and load capacity remain unverified.',
    'parts':checks,'fixed_exact_intersections':exact,'wall_hardware_envelopes':len(hardware),
    'sweep':{'poses':int((QMAX-15)/.5)+1,'sides':2,'range_deg':[15,QMAX],'step_deg':.5,'pairs':broad,'exact_checks':len(clearances),
        'minimum_exact_clearance_mm':min(c['clearance_mm'] for c in clearances if 'spacer' not in c['a']+c['b']),
        'minimum_gearmotor_clearance_mm':min(gm) if gm else None,
        'leg_drive':{'exact_checks':len(drive_clear),'minimum_clearance_mm':drive_min,'crank_sweep_deg':round(abs(sweep_angles[1]-sweep_angles[0]),1),
            'transmission_angles_deg':[round(min(min(KIN.transmission_angles(q)) for q in np.arange(15,QMAX+.01,.5)),1),round(max(max(KIN.transmission_angles(q)) for q in np.arange(15,QMAX+.01,.5)),1)]},
        'scope':'Nominal parts, reserved board volumes, wall bolt envelopes and the leg drive at the nominal pushrod length. No cable, print tolerance, deflection, ball-link body or servo backlash.'},
    'source_hashes':M['source_hashes']}
(HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
(HERE/'clearance-audit.json').write_text(json.dumps(clearances,indent=2)+'\n')
print('R05 validation passed.',flush=True)
