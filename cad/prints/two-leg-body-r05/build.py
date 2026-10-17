#!/usr/bin/env python3
"""R05 two-leg body. CadQuery 2.6.1, mm.

Coordinates: X rearward, Y outward from the near wall, Z up. The origin is the R04 body origin:
the body centre line at the lower R04 pivot height. R05 moves both hips to X = +30 (near the rear).
Each strut slants forward and down to its wheel. The R04 motor carrier keeps its hand, so the axle
and the gearmotor sit rearward of the strut end, toward the hip. The ST3215 servos and the 3S pack
are inside the body. The far side is the near side, mirrored about the body mid-plane (Y = -67.5).
Leg drive (2026-10-16): each ST3215 sits inside its wall on a frame, output face toward the wall.
A printed hub on the output disc passes through a wall bushing. A 16 mm crank and a 40 mm RC pushrod
drive a boss at 42 mm on the upper link. The R05 servo cradle and cap bars (parts 13, 14) are superseded.
"""
from pathlib import Path
import hashlib
import json
import math
import cadquery as cq

HERE = Path(__file__).resolve().parent
P = json.loads((HERE / 'parameters.json').read_text())
for folder in ('stl', 'step', 'reference'):
    (HERE / folder).mkdir(exist_ok=True)
PARTS, INSTANCES = {}, []
F, B = P['fit'], P['bracket']
HIP = P['hip']['x']
REAR_LOWER_X = P['frame']['rear_lower_angle_x']   # moved rearward for upper hip nut and socket access
SVO = P['servo']; LD = P['leg_drive']
CX, CZ = LD['crank_centre_xz']
MID = -67.5
COLORS = {'frame': (.16,.35,.30), 'deck': (.55,.68,.60), 'mount': (.85,.47,.20),
          'board': (.12,.38,.52), 'metal': (.50,.53,.56), 'tire': (.08,.09,.09), 'pack': (.18,.44,.66)}


def rect(w,h,t,x=0,y=0,r=0):
    o = cq.Workplane('XY').center(x,y).rect(w,h).extrude(t)
    return o.edges('|Z').fillet(r) if r else o


def bore(o,x,y,d,t,z=-1):
    return o.cut(cq.Workplane('XY').workplane(offset=z).center(x,y).circle(d/2).extrude(t+2))


def slot(o,x,y,length,width,t,angle=0):
    return o.cut(cq.Workplane('XY').workplane(offset=-1).center(x,y).slot2D(length,width,angle).extrude(t+2))


def save(pid,o,qty,label,features=None,color='frame',reuse=None):
    s = o.val() if isinstance(o,cq.Workplane) else o
    assert s.isValid() and len(s.Solids()) == 1, pid
    bb=s.BoundingBox()
    assert abs(bb.zmin)<1e-5 and max(bb.xlen,bb.ylen,bb.zlen)<256, pid
    for ext in ('step','stl'):
        cq.exporters.export(s,str(HERE/ext/(pid+'.'+ext)),tolerance=.025,angularTolerance=.08)
    PARTS[pid]={'shape':s,'id':pid,'quantity':qty,'label':label,'features':features or {},'color':color,
        'bounds_mm':[round(bb.xlen,4),round(bb.ylen,4),round(bb.zlen,4)],'volume_mm3':round(s.Volume(),3),
        'reuse':reuse}
    return s


def side(s,y,x=0,z=0):
    return s.rotate((0,0,0),(1,0,0),90).translate((x,y,z))


def inward(s,y,x=0,z=0):
    # Local +Z becomes global -Y (into the body from the near wall). Local +Y becomes global +Z.
    return s.rotate((0,0,0),(1,0,0),90).translate((x,y,z))


def far(s):
    return s.mirror('XZ',(0,MID,0))


def cyl(d,h,x,y,z,axis=(0,1,0)):
    return cq.Solid.makeCylinder(d/2,h,cq.Vector(x,y,z),cq.Vector(*axis))


def add(name,s,color,part=None,reference=False,group='fixed'):
    cq.exporters.export(s,str(HERE/'reference'/(name+'.stl')),tolerance=.04,angularTolerance=.10)
    cq.exporters.export(s,str(HERE/'reference'/(name+'.step')))
    INSTANCES.append({'name':name,'shape':s,'color':COLORS[color], 'part_id':part,
        'reference_only':reference,'group':group,'file':'reference/'+name+'.stl'})


def wall_holes():
    lock=P['hip']['lock_offset_mm']
    holes=[(HIP,0,4.5),(HIP,40,4.5),(HIP-lock*math.sin(math.pi/6),-lock*math.cos(math.pi/6),4.5)]
    # Deck angles: lower deck front below the deck, lower deck rear above the deck, other decks below.
    for x in (-44,44):
        for z in P['frame']['deck_z']:
            xx=REAR_LOWER_X if (z==60 and x>0) else x
            holes.append((xx,z-18,F['m4']))
    # Leg drive: the hub bore for the wall bushing and four M4 bolts for the servo frame.
    holes.append((CX,CZ,LD['bushing']['wall_bore']))
    for bx,bz in LD['frame']['m4_holes_xz']:
        holes.append((bx,bz,F['m4']))
    # Battery tray flange bolts.
    for x in P['tray']['bolt_x']: holes.append((x,P['tray']['bolt_z'],F['m4']))
    return holes


def panel():
    p=P['panel']; t=p['thickness']
    o=rect(p['width'],p['top']-p['bottom'],t,y=(p['top']+p['bottom'])/2,r=5)
    holes=wall_holes()
    for x,y,d in holes:o=bore(o,x,y,d,t)
    o=o.cut(cq.Workplane('XY').workplane(offset=t-.5).center(0,160).text('R05 SIDE',5,.7,font='Arial'))
    return save('01_body_side',o,2,'R05 body side, rear hips',{'holes':holes,'thickness':t})


def bracket():
    L,w,t,g=B['leg'],B['width'],B['wall'],B['gusset']
    o=cq.Workplane('XY').polyline([(0,0),(L,0),(0,L)]).close().extrude(g)
    o=o.union(rect(L,t,w,L/2,t/2)).union(rect(t,L,w,t/2,L/2))
    o=o.cut(cq.Solid.makeCylinder(F['m4']/2,t+2,cq.Vector(18,-1,11),cq.Vector(0,1,0)))
    o=o.cut(cq.Solid.makeCylinder(F['m4']/2,t+2,cq.Vector(-1,18,11),cq.Vector(1,0,0)))
    return save('02_open_deck_angle',o,12,'Open deck angle',{'leg':L,'wall':t,'width':w,
        'hole_offset':18,'hole_axis_height':11,'bore':F['m4']},'deck')


def deck(pid,label,mount_holes,tie_slots=(),rear_x=44):
    f=P['frame']; t=f['deck_thickness']
    o=rect(f['deck_depth'],f['deck_width'],t,r=3)
    slots=[]
    for x in (-44,rear_x):
        for y in (-49.5,49.5):
            o=slot(o,x,y,F['deck_slot_length'],F['m4'],t,90)
            slots.append([x,y,F['deck_slot_length'],F['m4'],90])
    for x,y,d in mount_holes:o=bore(o,x,y,d,t)
    for y in (-27,27):o=o.cut(rect(12,16,t+2,x=-58,y=y,r=2).translate((0,0,-1)))
    for x,y,length,width,angle in tie_slots:
        o=slot(o,x,y,length,width,t,angle);slots.append([x,y,length,width,angle])
    code={'03_power_deck':'R05 PWR','04_interface_deck':'R05 BUS','05_control_deck':'R05 CTRL'}[pid]
    o=o.cut(cq.Workplane('XY').workplane(offset=t-.5).center(0,58).text(code,5,.7,font='Arial'))
    return save(pid,o,1,label,{'holes':mount_holes,'slots':slots,'thickness':t},'deck')


def grid(cx,cy,px,py,d):
    return [(cx+x*px/2,cy+y*py/2,d) for x in (-1,1) for y in (-1,1)]


def carrier():
    src=HERE/'legacy/05_motor_carrier.step'
    o=cq.importers.importStep(str(src))
    for x,y in ((12,27),(22,20)):o=slot(o,x,y,8,3.2,6,0)
    old=json.loads((HERE/'legacy/manifest.json').read_text())
    feat=next(p['features'] for p in old['parts'] if p['id']=='05_motor_carrier')
    feat['slots']=[[12,27,8,3.2,0],[22,20,8,3.2,0]]
    return save('06_motor_carrier',o,2,'37D motor carrier with cable anchors, one each side',feat)


def board_plate(pid,label,w,h,holes,feet,window=None):
    o=rect(w,h,3,r=3)
    if window:o=o.cut(rect(*window,5,r=1).translate((0,0,-1)))
    allholes=list(holes)+list(feet)
    for x,y,d in allholes:o=bore(o,x,y,d,3)
    return save(pid,o,1,label,{'holes':allholes,'thickness':3},'mount')


def spacer(pid,label,od,di,h,qty):
    return save(pid,cq.Workplane('XY').circle(od/2).circle(di/2).extrude(h),qty,label,
        {'holes':[(0,0,di)],'thickness':h},'mount')


def hexpocket(o,x,y,af,depth,z0=0):
    """Hex nut pocket. af is the across-flats size; the polygon takes the across-corners diameter."""
    return o.cut(cq.Workplane('XY').workplane(offset=z0).center(x,y).polygon(6,af/math.cos(math.pi/6)).extrude(depth))


def servo_frame():
    """Servo frame between the ST3215 output face and the wall inner face.

    Local XY is the wall plane (X rearward, Y up = body Z). Local Z goes from the wall face (0) into the body.
    The output axis is at local (CX, CZ). The servo long axis points rearward (+X) from the output."""
    fr=LD['frame']; t=fr['thickness']; (x0,x1),(z0,z1)=fr['x'],fr['z']
    o=rect(x1-x0,z1-z0,t,x=(x0+x1)/2,y=(z0+z1)/2,r=4)
    # Body-side recess for the servo case outline, centred on the case, not on the output.
    bl,bw,_=SVO['body']; c=fr['recess_clearance']
    case_cx=CX-SVO['output_from_end']+bl/2
    o=o.cut(rect(bl+2*c,bw+2*c,fr['recess_depth']+1,x=case_cx,y=CZ,r=1).translate((0,0,t-fr['recess_depth'])))
    # Through window for the output disc and the hub.
    o=bore(o,CX,CZ,fr['hub_window_d'],t)
    # Connector window: from the raised block on the output face to the rear edge, open at the edge.
    hw=fr['window_half_width']; wx0=CX+fr['window_x_from_output']
    o=o.cut(rect(x1-wx0+2,2*hw,t+2,x=(wx0+x1+2)/2,y=CZ).translate((0,0,-1)))
    # Four M2 servo screws from the wall side, counterbored for the heads.
    cbd,cbh=fr['m2_counterbore']; screws=[]
    for dx in SVO['face_holes_x_from_output']:
        for s in (-1,1):
            x,y=CX+dx,CZ+s*SVO['face_holes_z']
            o=bore(o,x,y,F['m2'],t); o=bore(o,x,y,cbd,cbh,z=-1); screws.append((x,y,F['m2']))
    # Four M4 wall bolts with nut pockets on the body face.
    m4=[]
    for x,y in fr['m4_holes_xz']:
        o=bore(o,x,y,F['m4'],t); o=hexpocket(o,x,y,7.2,fr['nut_pocket_depth'],t-fr['nut_pocket_depth']); m4.append((x,y,F['m4']))
    return save('25_servo_frame',o,2,'ST3215 servo frame, one each side',{'holes':screws+m4,'thickness':t,
        'recess':[bl+2*c,bw+2*c,fr['recess_depth']],'hub_window_d':fr['hub_window_d'],'connector_window':[wx0,x1,2*hw],
        'servo_screw':fr['servo_screw'],'wall_bolt':fr['wall_bolt'],'nut_pocket_depth':fr['nut_pocket_depth']},'mount')


def crank_hub():
    """Hub on the servo output disc, through the wall bushing, with the crank. Local Z is the hub axis.
    Z = 0 is the face on the output disc. The crank arm points along local +X."""
    h=LD['hub']; L=h['crank_face_y']-h['face_y']; ct=h['crank_thickness']
    o=cq.Workplane('XY').circle(h['d']/2).extrude(L-ct)
    o=o.union(cq.Workplane('XY').workplane(offset=L-ct).circle(h['crank_boss_d']/2).extrude(ct))
    r=LD['crank_radius']; w=h['arm_width']
    arm=cq.Workplane('XY').workplane(offset=L-ct).center(r/2,0).rect(r,w).extrude(ct)
    arm=arm.union(cq.Workplane('XY').workplane(offset=L-ct).center(r,0).circle(w/2).extrude(ct))
    o=o.union(arm)
    # Four pins into the disc holes, on the disc face.
    for a in range(4):
        px,py=SVO['disc_hole_pitch']/2*math.cos(a*math.pi/2),SVO['disc_hole_pitch']/2*math.sin(a*math.pi/2)
        o=o.union(cq.Workplane('XY').workplane(offset=-h['pin_h']).center(px,py).circle(h['pin_d']/2).extrude(h['pin_h']+.5))
    o=o.translate((0,0,h['pin_h']))
    L2=L+h['pin_h']
    o=bore(o,0,0,h['centre_bore'],L2)
    cd,ch=h['head_counterbore']; o=o.cut(cq.Workplane('XY').workplane(offset=L2-ch).circle(cd/2).extrude(ch+1))
    o=bore(o,r,0,LD['stud_hole_d'],L2)
    # Print orientation: the crank face on the bed (Z = 0), the pins at the top.
    o=o.rotate((0,0,0),(1,0,0),180).translate((0,0,L2))
    return save('26_crank_hub',o,2,'Crank hub on the servo output disc, one each side',{'holes':[(0,0,h['centre_bore'])],
        'thickness':L2,'stud_hole':[r,0,LD['stud_hole_d']],'pins':[h['pin_d'],h['pin_h'],SVO['disc_hole_pitch']],
        'print_note':'The STL is in print orientation: the crank face on the bed, the pins at the top.'},'mount')


def wall_bushing():
    b=LD['bushing']; t=P['panel']['thickness']
    o=cq.Workplane('XY').circle(b['flange_d']/2).extrude(b['flange_t'])
    o=o.union(cq.Workplane('XY').workplane(offset=b['flange_t']).circle(b['od']/2).extrude(t))
    o=bore(o,0,0,b['id'],t+b['flange_t'])
    return save('27_wall_bushing',o,2,'Hub bushing in the wall bore, one each side',{'holes':[(0,0,b['id'])],
        'thickness':b['flange_t']+t,'wall_bore':b['wall_bore']},'mount')


def drill_jig(pid,label,mirror_x=False):
    """Drill guide for a printed R05 wall. Two M4 bolts in the hip holes locate it on the outer face."""
    j=LD['jig']; t=j['thickness']
    pts=[(HIP,0),(HIP,40),(CX,CZ)]+[tuple(p) for p in LD['frame']['m4_holes_xz']]
    xs=[p[0] for p in pts]; zs=[p[1] for p in pts]; m=8
    o=rect(max(xs)-min(xs)+2*m,max(zs)-min(zs)+2*m,t,x=(max(xs)+min(xs))/2,y=(max(zs)+min(zs))/2,r=5)
    holes=[(HIP,0,j['pin_hole_d']),(HIP,40,j['pin_hole_d']),(CX,CZ,j['pilot_d'])]+[(x,z,j['guide_d']) for x,z in LD['frame']['m4_holes_xz']]
    for x,y,d in holes:o=bore(o,x,y,d,t)
    o=o.cut(cq.Workplane('XY').workplane(offset=t-.5).center((max(xs)+min(xs))/2,max(zs)+m-4).text(label.split(',')[0].upper(),5,.7,font='Arial'))
    if mirror_x:
        o=o.mirror('YZ',((max(xs)+min(xs))/2,0,0)); holes=[(2*((max(xs)+min(xs))/2)-x,y,d) for x,y,d in holes]
    return save(pid,o,1,label,{'holes':holes,'thickness':t,'note':'Bolt to the hip holes from the outside. Drill the frame holes 4.5 mm and the pilot 3.2 mm, then open the bore to 24 mm with a step bit or a 15/16 in Forstner bit.'},'mount')


def upper_link_with_boss():
    """R03 link outline, 110 mm centres, with a pushrod boss at the leg-drive radius."""
    pts=[]
    for i in range(33):
        a=math.pi/2+math.pi*i/32; pts.append((8*math.cos(a),8*math.sin(a)))
    pts+=[(14,-4),(96,-4),(110,-8)]
    for i in range(1,33):
        a=-math.pi/2+math.pi*i/32; pts.append((110+8*math.cos(a),8*math.sin(a)))
    pts+=[(96,4),(14,4)]
    o=cq.Workplane('XY').polyline(pts).close().extrude(5)
    rb=LD['link_boss_from_hip']
    o=o.union(cq.Workplane('XY').center(rb,0).circle(LD['link_boss_d']/2).extrude(5))
    holes=[(0,0,F['m4']),(110,0,F['m4']),(rb,0,LD['stud_hole_d'])]
    for x,y,d in holes:o=bore(o,x,y,d,5)
    return save('08_upper_link',o,2,'Upper link with pushrod boss',{'holes':holes,'thickness':5,'datum':'Body pivot (0, 0)',
        'pivot_centers':110,'boss_radius':rb},'mount')


def battery_tray():
    t=P['tray']; L,W,T=t['plate']; fh=t['flange_height']
    o=rect(L,W,T,r=3)
    for y in (-1,1):o=o.union(rect(L-16,4,fh,y=y*(W/2-2)))
    # Strap slots for two straps around the pack, and drain/weight relief.
    slots=[]
    for x in (-30,25):
        for y in (-22,22):
            o=slot(o,x,y,14,4,T,90); slots.append([x,y,14,4,90])
    # Flange bolt holes, horizontal through the flanges, at the wall hole positions.
    holes=[]
    for x in t['bolt_x']:
        for y in (-1,1):
            o=o.cut(cq.Solid.makeCylinder(F['m4']/2,8,cq.Vector(x,y*(W/2)-4*y-2*y,t['bolt_z']-t['bottom_z']),cq.Vector(0,y,0)))
        holes.append([x,t['bolt_z']-t['bottom_z']])
    # Notch both flanges below the neutral lock nut at X = +18, Z = -20.8.
    n=t['lock_notch']
    for y in (-1,1):o=o.cut(rect(n['width'],8,fh,x=n['x'],y=y*(W/2-2)).translate((0,0,n['top_z_local'])))
    o=o.cut(cq.Workplane('XY').workplane(offset=T-.5).center(0,0).text('R05 TRAY',5,.7,font='Arial'))
    return save('24_battery_tray',o,1,'Battery tray with side flanges',{'flange_holes_xz':holes,'slots':slots,'thickness':T},'deck')


def coupon():
    o=rect(108,40,4,r=2)
    holes=[(-43,8,2.4),(-31,8,3.3),(-19,8,3.5),(-7,8,4.4),(5,8,4.6),(17,8,4.8),(37,8,12.4)]
    for x,y,d in holes:o=bore(o,x,y,d,4)
    o=slot(o,-35,-9,6.6,4.6,4,90)
    o=o.cut(rect(25.72,8,6,x=7,y=-9).translate((0,0,-1)))
    return save('19_fit_coupon',o,1,'Hole and case width coupon',{'holes':holes,'thickness':4},'mount')


def angle_pose(s,x,far_side,z,above=False):
    o=s.rotate((0,0,0),(1,1,1),120).rotate((0,0,0),(1,0,0),180)
    if far_side:o=o.rotate((0,0,0),(0,0,1),180)
    o=o.translate((x+(11 if far_side else -11),-135 if far_side else 0,z))
    if above:o=o.mirror('XY',(0,0,z+2))          # flip about the deck mid-plane: below -> above
    return o


def strut(pid,y,q,zz=0):
    # R04 struts point along +X before rotation. R05 struts slant forward: rotate by 90 + q.
    return side(PARTS[pid]['shape'],y).rotate((0,0,0),(0,1,0),90+q).translate((HIP,0,zz))


def moving(q):
    x=HIP-110*math.sin(math.radians(q)); z=-110*math.cos(math.radians(q))
    return {'lower_link':strut('07_lower_lock_link',13,q),'upper_link':strut('08_upper_link',23,q,40),
        'carrier':side(MOTOR,31,x,z),'gearbox':cyl(36.8,21.5,x+32,3.5,z),
        'motor':cyl(34.8,30.7,x+32,-27.2,z),'encoder':cyl(34,15.4,x+32,-42.6,z),
        'wheel':cyl(100,24,x+25,35.5,z).cut(cyl(22,24,x+25,35.5,z))}


SIDE=panel(); ANGLE=bracket()
interface_feet=grid(0,0,54,46,F['m3'])
DECK1=deck('03_power_deck','Lower power and driver deck',
    grid(0,-29,54,46,F['m3'])+grid(0,29,54,46,F['m3']),[(40,y,14,4,90) for y in (-22,22)],rear_x=REAR_LOWER_X)
DECK2=deck('04_interface_deck','Middle interface deck',
    grid(0,-29,54,46,F['m3'])+grid(0,29,54,46,F['m3']),[(42,y,14,4,90) for y in (-22,22)])
pico_feet=grid(0,0,56,30,F['m3']); imu_feet=grid(0,0,34,34,F['m3'])
DECK3=deck('05_control_deck','Upper control and sensor deck',
    [(x,y-30,d) for x,y,d in pico_feet]+[(x,y+26,d) for x,y,d in imu_feet],[(x,0,10,3.2,0) for x in (-36,36)])
MOTOR=carrier()
for pid,old,qty,label in [('07_lower_lock_link','04_lower_lock_link',2,'Lower lock link'),
    ('09_spacer_2mm','07_spacer_2mm',4,'Leg spacer 2 mm'),
    ('10_spacer_12mm','08_spacer_12mm',4,'Leg spacer 12 mm')]:
    oldm=json.loads((HERE/'legacy/manifest.json').read_text())
    feat=next(p['features'] for p in oldm['parts'] if p['id']==old)
    save(pid,cq.importers.importStep(str(HERE/'legacy'/(old+'.step'))),qty,label,feat,'mount',old)
pico_holes=grid(0,0,47,11.4,F['m2'])
PICO=board_plate('11_pico_plate','Pico 2 plate',66,40,pico_holes,pico_feet,(40,26))
imu_holes=grid(0,0,20.32,20.32,F['m3'])
IMU=board_plate('12_imu_plate','LSM6DSO rigid plate',44,44,imu_holes,imu_feet)
UPPER=upper_link_with_boss()
FRAME=servo_frame(); HUB=crank_hub(); BUSH=wall_bushing()
drill_jig('28_drill_jig_near','Near wall drill jig, R05 printed walls'); drill_jig('29_drill_jig_far','Far wall drill jig, R05 printed walls',True)
TRAY=battery_tray()
o=rect(62,54,3,r=3)
o=o.cut(rect(34,20,5,r=2).translate((0,0,-1)))
board_holes=grid(0,0,44,30,F['m3'])
for x,y,d in interface_feet+board_holes:o=bore(o,x,y,d,3)
for x in (-19,19):o=slot(o,x,0,16,3.2,3,90)
INTERFACE=save('15_interface_cassette',o,4,'Driver / power / bus interface cassette',
    {'holes':interface_feet+board_holes,'thickness':3,'board_blank':[52,38],'board_hole_pitch':[44,30]},'mount')
spacer('16_pico_standoff','Pico M2 standoff',3.2,2.2,10,4)
spacer('17_board_standoff','Board M3 standoff',6,3.5,8,16)
spacer('18_imu_standoff','IMU M3 standoff',6,3.5,8,4)
COUPON=coupon()
spacer('23_module_foot','Module clearance spacer',7,3.5,4,24)

# ---------------- Assembly ----------------
add('body_near',side(SIDE,6),'frame','01_body_side')
add('body_far',side(SIDE,-135),'frame','01_body_side')
for pid,s,z in [('03_power_deck',DECK1,60),('04_interface_deck',DECK2,120),('05_control_deck',DECK3,170)]:
    add(pid,s.translate((0,-67.5,z)),'deck',pid)
    for x in (-44,44):
        for fs in (False,True):
            xx=REAR_LOWER_X if (z==60 and x>0) else x
            add(f'angle_{z}_{xx}_{int(fs)}',angle_pose(ANGLE,xx,fs,z),'deck','02_open_deck_angle')
add('battery_tray',TRAY.translate((0,MID,P['tray']['bottom_z'])),'deck','24_battery_tray')
bx,by,bz=P['battery']['centre']; bl,bw,bh=P['battery']['size']
add('battery_envelope',rect(bl,bw,bh).val().translate((bx,by,bz-bh/2)),'pack',reference=True)
for name,s in moving(30).items():
    pid={'lower_link':'07_lower_lock_link','upper_link':'08_upper_link','carrier':'06_motor_carrier'}.get(name)
    color='mount' if 'link' in name else 'frame' if name=='carrier' else 'tire' if name=='wheel' else 'metal'
    add(name,s,color,pid,pid is None,'moving')
    add(name+'_far',far(s),color,pid,pid is None,'moving_far')
x=HIP-55;z=-110*math.cos(math.pi/6)
for name,xx,yy,zz,h in [('body_lower',HIP,8,0,2),('body_upper',HIP,18,40,12),('carrier_lower',x,25,z,12),('carrier_upper',x,25,z+40,2)]:
    pid='09_spacer_2mm' if h==2 else '10_spacer_12mm'
    s=side(PARTS[pid]['shape'],yy,xx,zz)
    g='joint' if name.startswith('body') else 'moving'
    add(name+'_spacer',s,'mount',pid,group=g); add(name+'_spacer_far',far(s),'mount',pid,group=g+('_far' if g=='moving' else ''))
# Leg drive: servo frames, servo envelopes, wall bushings, crank hubs and the pushrod at the 30 degree pose.
import leg_drive as KIN
near_frame=inward(FRAME,0,0,0)                                   # local XY = body XZ, local Z into the body
add('servo_frame_near',near_frame,'mount','25_servo_frame'); add('servo_frame_far',far(near_frame),'mount','25_servo_frame')
fr=LD['frame']; flange_y=-(fr['thickness']-fr['recess_depth'])  # servo output face
bl,bw,bh=SVO['body']; case_cx=CX-SVO['output_from_end']+bl/2
case=rect(bl,bw,bh,r=1).val()
case_near=inward(case,flange_y,case_cx,CZ)                       # body from the output face into the body
add('ST3215_body_near',case_near,'metal',reference=True); add('ST3215_body_far',far(case_near),'metal',reference=True)
disc_near=cyl(SVO['disc_d'],SVO['disc_proud'],CX,flange_y,CZ,(0,1,0))
add('ST3215_disc_near',disc_near,'metal',reference=True); add('ST3215_disc_far',far(disc_near),'metal',reference=True)
idler_near=cyl(SVO['disc_d'],SVO['idler_proud'],CX,flange_y-bh,CZ,(0,-1,0))
add('ST3215_idler_near',idler_near,'metal',reference=True); add('ST3215_idler_far',far(idler_near),'metal',reference=True)
cb=SVO['connector_block']; blk=rect(cb['x_from_output'][1]-cb['x_from_output'][0],2*cb['half_width'],cb['proud']).val()
blk_near=inward(blk,flange_y,CX+sum(cb['x_from_output'])/2,CZ).translate((0,cb['proud'],0))
add('ST3215_connector_block_near',blk_near,'metal',reference=True,group='keepout'); add('ST3215_connector_block_far',far(blk_near),'metal',reference=True,group='keepout')
bush=BUSH.rotate((0,0,0),(1,0,0),90).translate((CX,6+LD['bushing']['flange_t'],CZ))   # flange on the outer wall face
add('wall_bushing_near',bush,'mount','27_wall_bushing'); add('wall_bushing_far',far(bush),'mount','27_wall_bushing')
def hub_pose(q):
    """Hub with the crank at the angle for leg angle q. Local +Z becomes +Y, the arm starts along +X."""
    h=HUB.rotate((0,0,0),(1,0,0),90).translate((0,LD['hub']['crank_face_y'],0))   # local +Z (crank face to pins) becomes -Y
    h=h.rotate((0,0,0),(0,1,0),-KIN.crank_angle(q))
    return h.translate((CX,0,CZ))
def pushrod_pose(q,y=28):
    S=KIN.crank_tip(q); Pb=KIN.boss(q); d=(Pb[0]-S[0],Pb[1]-S[1]); n=math.hypot(*d)
    rod=cq.Solid.makeCylinder(1,n,cq.Vector(S[0],y,S[1]),cq.Vector(d[0],0,d[1]))
    for x,z in (S,Pb):rod=rod.fuse(cq.Solid.makeSphere(3).translate(cq.Vector(x,y,z)))
    return rod
hub30=hub_pose(30)
add('crank_hub',hub30,'mount','26_crank_hub',group='drive'); add('crank_hub_far',far(hub30),'mount','26_crank_hub',group='drive_far')
rod30=pushrod_pose(30)
add('pushrod',rod30,'metal',reference=True,group='drive'); add('pushrod_far',far(rod30),'metal',reference=True,group='drive_far')
# Component plates and PCB envelopes (unchanged from R04).
for pid,s,ccx,ccy,zz,holes,spid,pcb,sph in [
    ('11_pico_plate',PICO,0,-97.5,178,pico_holes,'16_pico_standoff',(51,21,1),10),
    ('12_imu_plate',IMU,0,-41.5,178,imu_holes,'18_imu_standoff',(25.4,25.4,1.6),8)]:
    add(pid,s.translate((ccx,ccy,zz)),'mount',pid)
    feet=pico_feet if 'pico' in pid else imu_feet
    for j,(xx,yy,d) in enumerate(feet):add(pid+'_foot_'+str(j),PARTS['23_module_foot']['shape'].translate((ccx+xx,ccy+yy,zz-4)),'mount','23_module_foot')
    for j,(xx,yy,d) in enumerate(holes):add(pid+'_spacer_'+str(j),PARTS[spid]['shape'].translate((ccx+xx,ccy+yy,zz+3)),'mount',spid)
    b=rect(*pcb)
    for xx,yy,d in holes:b=bore(b,xx,yy,2.1 if 'pico' in pid else 3.048,pcb[2])
    add(pid+'_PCB',b.val().translate((ccx,ccy,zz+3+sph)),'board',reference=True)
for yy in (-8.89,8.89):add('pico_header_'+str(yy),rect(49,3,8,x=0,y=yy).val().translate((0,-97.5,183)),'metal',reference=True,group='keepout')
add('pico_USB_access',rect(28,14,12,x=-40).val().translate((0,-97.5,187)),'board',reference=True,group='keepout')
for zz,ccy,label in [(68,-96.5,'DRV8874'),(68,-38.5,'power_cut_fuse'),(128,-96.5,'servo_bus_encoder'),(128,-38.5,'regulator_clamp')]:
    add(label+'_cassette',INTERFACE.translate((0,ccy,zz)),'mount','15_interface_cassette')
    for j,(xx,yy,d) in enumerate(interface_feet):add(label+'_foot_'+str(j),PARTS['23_module_foot']['shape'].translate((xx,ccy+yy,zz-4)),'mount','23_module_foot')
    for j,(xx,yy,d) in enumerate(board_holes):add(label+'_spacer_'+str(j),PARTS['17_board_standoff']['shape'].translate((xx,ccy+yy,zz+3)),'mount','17_board_standoff')
    pcb=rect(52,38,1.6)
    for xx,yy,d in board_holes:pcb=bore(pcb,xx,yy,3.2,1.6)
    add(label+'_insulating_board',pcb.val().translate((0,ccy,zz+11)),'board',reference=True)
    add(label+'_component_space',rect(36,24,22).val().translate((0,ccy,zz+12.6)),'board',reference=True,group='keepout')

assembly=cq.Assembly(name='HUX_R05_TWO_LEG_BODY')
for item in INSTANCES:assembly.add(item['shape'],name=item['name'],color=cq.Color(*item['color']))
assembly.save(str(HERE/'two-leg-body-r05.step'))
manifest={'revision':'R05','date':P['date'],'units':'mm','status':P['status'],
    'parts':[{k:v for k,v in p.items() if k!='shape'} for p in PARTS.values()],
    'assembly':[{k:v for k,v in i.items() if k!='shape'} for i in INSTANCES],
    'source_hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [HERE/'build.py',HERE/'parameters.json']}}
(HERE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(PARTS)} part types and {len(INSTANCES)} assembly instances.',flush=True)
