#!/usr/bin/env python3
"""Build R03 B-rep solids, STEP/STL parts, an assembly and a manifest.

Dependencies: cadquery==2.6.1. Dimensions are millimeters.
These are fit candidates for a supported bench assembly, not load qualification.
"""
from pathlib import Path
import json
import math
import hashlib
import cadquery as cq

HERE = Path(__file__).resolve().parent
P = json.loads((HERE / 'parameters.json').read_text())
for folder in ('stl', 'step', 'reference'):
    (HERE / folder).mkdir(exist_ok=True)
PARTS = {}
INSTANCES = []
COLORS = {'frame': (0.17, .38, .32), 'deck': (.56, .67, .59), 'link': (.82, .40, .15),
          'metal': (.45, .49, .54), 'tire': (.08, .10, .12), 'wood': (.68, .52, .32)}
H4 = P['fit']['m4_clearance']


def rect(w, h, t, x=0, y=0, r=0):
    obj = cq.Workplane('XY').center(x, y).rect(w, h).extrude(t)
    return obj.edges('|Z').fillet(r) if r else obj


def bore(obj, x, y, d, t):
    return obj.cut(cq.Workplane('XY').workplane(offset=-1).center(x, y).circle(d/2).extrude(t+2))


def save(part_id, obj, qty, label, features, color='frame', note='Print fit candidate'):
    shape = obj.val() if isinstance(obj, cq.Workplane) else obj
    assert shape.isValid() and len(shape.Solids()) == 1, part_id
    bb = shape.BoundingBox()
    assert abs(bb.zmin) < 1e-6 and max(bb.xlen, bb.ylen, bb.zlen) < 256, part_id
    cq.exporters.export(shape, str(HERE / 'step' / (part_id+'.step')))
    cq.exporters.export(shape, str(HERE / 'stl' / (part_id+'.stl')), tolerance=.025, angularTolerance=.08)
    PARTS[part_id] = {'shape': shape, 'id': part_id, 'quantity': qty, 'label': label,
        'color': color, 'features': features, 'status': note,
        'bounds_mm': [round(bb.xlen, 3), round(bb.ylen, 3), round(bb.zlen, 3)],
        'solid_volume_mm3': round(shape.Volume(), 2),
        'solid_pla_mass_g_at_1_24': round(shape.Volume()*.00124, 1)}
    return shape


def panel():
    p = P['panel']; t = p['thickness']
    obj = rect(p['width'], p['top']-p['bottom'], t, y=(p['top']+p['bottom'])/2, r=p['corner_radius'])
    obj = obj.cut(rect(72, 66, t+2, y=103, r=5).translate((0, 0, -1)))
    lock = (P['leg']['lock_radius']*.5, -P['leg']['lock_radius']*math.cos(math.pi/6))
    centers = [(0, 0), (0, 40), lock]
    centers += [(x, z-13) for x in (-43, 43) for z in P['body']['deck_z']]
    centers += [(-43, z) for z in P['fixture']['body_bolt_z']]
    for x, y in centers:
        obj = bore(obj, x, y, H4, t)
    return save('01_body_side', obj, 2, 'Body side', {'holes': [[x, y, H4] for x, y in centers],
        'window': [0, 103, 72, 66, 5], 'datum': 'Lower body pivot (0, 0)', 'thickness': t})


def deck():
    t = P['body']['deck_thickness']
    obj = rect(120, 135, t, r=4)
    holes = [(x, y) for x in (-43, 43) for y in (-54.5, 54.5)]
    for x, y in holes:
        obj = bore(obj, x, y, H4, t)
    slots = [(x, y, 18, 4.5) for x in (-44, -22, 0, 22, 44) for y in (-36, -12, 12, 36)]
    for x, y, length, width in slots:
        obj = obj.cut(cq.Workplane('XY').workplane(offset=-1).center(x,y).slot2D(length,width).extrude(t+2))
    return save('02_equipment_deck', obj, 2, 'Equipment deck', {'holes': [[x, y, H4] for x,y in holes],
        'slots': slots, 'thickness': t, 'datum': 'Deck center'}, 'deck')


def bracket():
    # Local XY is the 26 mm cross section. Local Z is the width.
    # A solid triangular first layer supports two L-section arms. No roof spans the cavity.
    b = P['bracket']; L, w, t, g = b['leg'], b['width'], b['wall'], b['gusset']
    obj = cq.Workplane('XY').polyline([(0,0),(L,0),(0,L)]).close().extrude(g)
    obj = obj.union(rect(L, t, w, L/2, t/2)).union(rect(t, L, w, t/2, L/2))
    # Bores cross the two arms, centered across the 18 mm width.
    obj = obj.cut(cq.Solid.makeCylinder(H4/2, t+2, cq.Vector(13,-1,9), cq.Vector(0,1,0)))
    obj = obj.cut(cq.Solid.makeCylinder(H4/2, t+2, cq.Vector(-1,13,9), cq.Vector(1,0,0)))
    return save('03_deck_angle', obj, 8, 'Deck angle', {'leg': L, 'width': w, 'wall': t,
        'gusset': g, 'hole_center_from_corner': 13, 'hole_center_across_width': 9, 'bore': H4}, 'deck')


def link_outline(lock=False):
    # Reproduce R01 neck and end geometry, with a local lock boss at 24 mm.
    pts = []
    for i in range(33):
        a = math.pi/2+math.pi*i/32; pts.append((8*math.cos(a), 8*math.sin(a)))
    pts += [(14,-4),(96,-4),(110,-8)]
    for i in range(1,33):
        a = -math.pi/2+math.pi*i/32; pts.append((110+8*math.cos(a), 8*math.sin(a)))
    pts += [(96,4),(14,4)]
    obj = cq.Workplane('XY').polyline(pts).close().extrude(5)
    centers = [0,110]
    if lock:
        obj = obj.union(cq.Workplane('XY').center(24,0).circle(8).extrude(5)); centers += [24]
    for x in centers: obj = bore(obj, x, 0, H4, 5)
    return obj, centers


def hull(points):
    points=sorted(set(points))
    def cross(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower=[]; upper=[]
    for point in points:
        while len(lower)>1 and cross(lower[-2],lower[-1],point)<=0: lower.pop()
        lower.append(point)
    for point in reversed(points):
        while len(upper)>1 and cross(upper[-2],upper[-1],point)<=0: upper.pop()
        upper.append(point)
    return lower[:-1]+upper[:-1]


def carrier():
    c=P['carrier']; center=c['axle_offset']+c['motor_axis_offset']; t=c['thickness']
    pts=hull([(x+r*math.cos(i*math.pi/36), y+r*math.sin(i*math.pi/36))
        for x,y,r in [(0,0,8),(0,40,8),(center,0,23)] for i in range(72)])
    obj=cq.Workplane('XY').polyline(pts).close().extrude(t)
    holes=[(0,0,H4),(0,40,H4),(25,0,P['fit']['motor_pilot'])]
    holes += [(center+15.5*math.cos(math.radians(a)),15.5*math.sin(math.radians(a)),P['fit']['m3_clearance'])
              for a in c['hole_angles_deg']]
    for x,y,d in holes: obj=bore(obj,x,y,d,t)
    return save('05_motor_carrier',obj,1,'Motor carrier',{'outline':pts,'holes':holes,'thickness':t,
        'datum':'Lower carrier pivot (0, 0)','axle':[25,0],'motor_axis':[32,0]},'frame',
        'Suspended wheel fit candidate. No body load on the motor shaft.')


def side(shape, y, x=0, z=0):
    return shape.rotate((0,0,0),(1,0,0),90).translate((x,y,z))


def link_pose(shape, q, y, z=0):
    return side(shape,y).rotate((0,0,0),(0,1,0),90-q).translate((0,0,z))


def cyl(d, length, x,y,z, outward=False):
    return cq.Solid.makeCylinder(d/2,length,cq.Vector(x,y,z),cq.Vector(0,1 if outward else -1,0))


def angle_pose(shape,x,far,z):
    # (u,v,t) -> (x+t-9, -u, z-v), right-handed.
    obj=shape.rotate((0,0,0),(1,1,1),120).rotate((0,0,0),(1,0,0),180)
    if far: obj=obj.rotate((0,0,0),(0,0,1),180)
    return obj.translate((x+(9 if far else -9),-135 if far else 0,z))


def add(name, shape, color, part=None, reference=False):
    cq.exporters.export(shape,str(HERE/'reference'/(name+'.stl')),tolerance=.06,angularTolerance=.12)
    INSTANCES.append({'name':name,'file':'reference/'+name+'.stl','color':COLORS[color],
        'part_id':part,'reference_only':reference,'shape':shape})


def moving(q):
    x=110*math.sin(math.radians(q)); z=-110*math.cos(math.radians(q))
    return {
        'lower_link':link_pose(PARTS['04_lower_lock_link']['shape'],q,13),
        'upper_link':link_pose(UPPER,q,23,40),
        'carrier':side(PARTS['05_motor_carrier']['shape'],31,x,z),
        'gearbox':cyl(36.8,21.5,x+32,25,z),
        'motor':cyl(34.8,30.7,x+32,3.5,z),
        'encoder':cyl(34,15.4,x+32,-27.2,z),
        'wheel':cyl(100,24,x+25,35.5,z,True).cut(cyl(22,24,x+25,35.5,z,True)),
    }


SIDE=panel(); DECK=deck(); ANGLE=bracket()
obj,centers=link_outline(True)
save('04_lower_lock_link',obj,1,'Lower link with neutral lock',{'holes':[[x,0,H4] for x in centers],
    'thickness':5,'datum':'Body pivot (0, 0)','pivot_centers':110,'lock_radius':24},'link')
CARRIER=carrier()
obj,centers=link_outline(False); UPPER=obj.val()
# An optional clean duplicate keeps the delivered kit self-contained.
save('06_upper_link',obj,1,'Upper link',{'holes':[[x,0,H4] for x in centers],'thickness':5,
    'datum':'Body pivot (0, 0)','pivot_centers':110},'link','Reuse the R01 upper link if its fit agrees.')
for part_id,h in [('07_spacer_2mm',2),('08_spacer_12mm',12)]:
    save(part_id,cq.Workplane('XY').circle(4.5).circle(H4/2).extrude(h),2,'Spacer '+str(h)+' mm',
         {'outside_diameter':9,'bore':H4,'thickness':h},'deck','Reuse the R01 spacers if their fit agrees.')
coupon=rect(86,30,4,r=3)
coupon_holes=[[-30,6,4.3],[-15,6,4.5],[0,6,4.7],[15,6,3.4],[30,6,12.4]]
for x,y,d in coupon_holes: coupon=bore(coupon,x,y,d,4)
save('09_interface_coupon',coupon,1,'Interface coupon',{'holes':coupon_holes,'thickness':4,
    'datum':'Coupon center. Hole row is 6 mm above center.'},'link')

add('body_near',side(SIDE,6),'frame','01_body_side')
add('body_far',side(SIDE,-135),'frame','01_body_side')
for z in P['body']['deck_z']:
    add('deck_'+str(z),DECK.translate((0,-67.5,z)),'deck','02_equipment_deck')
    for x in (-43,43):
        for far in (False,True):
            add(f'angle_{z}_{x}_{int(far)}',angle_pose(ANGLE,x,far,z),'deck','03_deck_angle')
for name,obj in moving(30).items():
    part={'lower_link':'04_lower_lock_link','upper_link':'06_upper_link','carrier':'05_motor_carrier'}.get(name)
    add(name,obj,'link' if 'link' in name else 'frame' if name=='carrier' else 'tire' if name=='wheel' else 'metal',part,part is None)
x=55; z=-110*math.cos(math.pi/6)
add('motor_pilot',cyl(12,6,80,25,z,True),'metal',reference=True)
add('shaft',cyl(6,16,80,31,z,True),'metal',reference=True)
add('hub_envelope',cyl(18,12,80,34,z,True).cut(cyl(6,12,80,34,z,True)),'metal',reference=True)
for name,xx,yy,zz,h in [('body_lower',0,8,0,2),('body_upper',0,18,40,12),
                       ('carrier_lower',55,25,z,12),('carrier_upper',55,25,z+40,2)]:
    spacer=PARTS[f'{7 if h==2 else 8:02d}_spacer_{h}mm']['shape']
    add(name+'_spacer',side(spacer,yy,xx,zz),'deck',f'{7 if h==2 else 8:02d}_spacer_{h}mm')
# Fixture stock is separate from the body exports. Top of plywood base is z=-200.
base=rect(280,230,18,x=40,y=-70).val().translate((0,0,-218))
add('fixture_base',base,'wood',reference=True)
for name,y in [('near',24),('far',-141)]:
    upright=rect(54,300,18,x=-53,y=-50).val()
    for zz in (-190,-175,10,80): upright=bore(cq.Workplane(obj=upright),-43,zz,H4,18).val()
    add('fixture_upright_'+name,side(upright,y),'wood',reference=True)
# The fixture also needs user-supplied cleats, screws and clamps. See the drawing.
assembly=cq.Assembly(name='HUX_ONE_LEG_BODY_R03')
for item in INSTANCES:
    if item['name'].startswith('fixture_'): continue
    assembly.add(item['shape'],name=item['name'],color=cq.Color(*item['color']))
assembly.save(str(HERE/'one-leg-body-r03.step'))

# Exact B-rep checks at thirteen sampled poses. Exclude intentional joint contact.
fixed=[i for i in INSTANCES if i['name'].startswith(('body_','deck_','angle_','fixture_')) and not i['name'].endswith('spacer')]
pairs=[('lower_link','upper_link'),('lower_link','gearbox'),('upper_link','gearbox'),('carrier','wheel')]
checks=[]
for q in [15+i*2.5 for i in range(13)]:
    m=moving(q)
    for a,b in pairs:
        distance=m[a].distance(m[b])
        assert distance>=1.0-1e-6,(q,a,b,distance)
        checks.append({'angle':q,'a':a,'b':b,'distance_mm':round(distance,3)})
    for name,shape in m.items():
        for item in fixed:
            distance=shape.distance(item['shape'])
            assert distance>=1.0-1e-6,(q,name,item['name'],distance)
            checks.append({'angle':q,'a':name,'b':item['name'],'distance_mm':round(distance,3)})
audit={'revision':'R03','method':'Exact solid distance at 13 poses, 15 to 45 degrees. Lock removed.',
    'scope':'Nominal parts and envelopes. Fasteners, wires, deflection and purchased fit require physical checks.',
    'minimum_screened_clearance_mm':min(c['distance_mm'] for c in checks),'checks':checks}
(HERE/'clearance-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
manifest={'revision':'R03','date':P['date'],'units':'mm','parameters_sha256':hashlib.sha256((HERE/'parameters.json').read_bytes()).hexdigest(),
    'scope':P['scope'],'parts':[{k:v for k,v in p.items() if k!='shape'} for p in PARTS.values()],
    'assembly':[{k:v for k,v in p.items() if k!='shape'} for p in INSTANCES],
    'solid_pla_mass_g_for_printed_assembly':round(sum(p['quantity']*p['solid_pla_mass_g_at_1_24'] for p in PARTS.values() if p['id']!='09_interface_coupon'),1)}
(HERE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'part_types':len(PARTS),'assembly_instances':len(INSTANCES),'clearance_checks':len(checks),
    'minimum_clearance_mm':audit['minimum_screened_clearance_mm'],'solid_pla_mass_g':manifest['solid_pla_mass_g_for_printed_assembly']}))
