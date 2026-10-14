#!/usr/bin/env python3
"""R04 matched frame and removable component mounts. CadQuery 2.6.1, mm.
No printed thread or case screw is used to retain a purchased actuator.
The inherited passive leg is not a powered servo transmission.
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
COLORS = {'frame': (.16,.35,.30), 'deck': (.55,.68,.60), 'mount': (.85,.47,.20),
          'board': (.12,.38,.52), 'metal': (.50,.53,.56), 'tire': (.08,.09,.09), 'wood': (.65,.51,.34)}


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


def outward(s,y,x=0,z=0):
    # Reflect the local thickness into +Y; local +v is global +Z.
    return s.mirror('XY').rotate((0,0,0),(1,0,0),90).translate((x,y,z))


def cyl(d,h,x,y,z,axis=(0,1,0)):
    return cq.Solid.makeCylinder(d/2,h,cq.Vector(x,y,z),cq.Vector(*axis))


def add(name,s,color,part=None,reference=False,group='fixed'):
    cq.exporters.export(s,str(HERE/'reference'/(name+'.stl')),tolerance=.04,angularTolerance=.10)
    # STEP instances permit an independent assembly interference check.
    cq.exporters.export(s,str(HERE/'reference'/(name+'.step')))
    INSTANCES.append({'name':name,'shape':s,'color':COLORS[color], 'part_id':part,
        'reference_only':reference,'group':group,'file':'reference/'+name+'.stl'})


def panel():
    p=P['panel']; t=p['thickness']
    o=rect(p['width'],p['top']-p['bottom'],t,y=(p['top']+p['bottom'])/2,r=5)
    # Service access and shaft relief behind the external servo cradle.
    o=o.cut(rect(27,47,t+2,y=P['servo']['center_z'],r=2).translate((0,0,-1)))
    holes=[(0,0,4.5),(0,40,4.5),(12,-24*math.cos(math.pi/6),4.5)]
    holes += [(x,z-18,F['m4']) for x in (-44,44) for z in P['frame']['deck_z']]
    holes += [(-43,z,F['m4']) for z in (10,80)]
    holes += [(x,P['servo']['center_z']+v,7.0) for x in (-21,21) for v in (4,17)]
    holes += [(x,P['servo']['center_z']+v,F['m4']) for x in (-27,27) for v in (-20,20)]
    for x,y,d in holes:o=bore(o,x,y,d,t)
    o=o.cut(cq.Workplane('XY').workplane(offset=t-.5).center(0,160).text('R04 SIDE',5,.7,font='Arial'))
    return save('01_body_side',o,2,'Matched body side',{'holes':holes,'thickness':t,'servo_window':[27,47,94]})


def bracket():
    L,w,t,g=B['leg'],B['width'],B['wall'],B['gusset']
    o=cq.Workplane('XY').polyline([(0,0),(L,0),(0,L)]).close().extrude(g)
    o=o.union(rect(L,t,w,L/2,t/2)).union(rect(t,L,w,t/2,L/2))
    o=o.cut(cq.Solid.makeCylinder(F['m4']/2,t+2,cq.Vector(18,-1,11),cq.Vector(0,1,0)))
    o=o.cut(cq.Solid.makeCylinder(F['m4']/2,t+2,cq.Vector(-1,18,11),cq.Vector(1,0,0)))
    return save('02_open_deck_angle',o,12,'Open deck angle',{'leg':L,'wall':t,'width':w,
        'hole_offset':18,'hole_axis_height':11,'bore':F['m4']},'deck')


def deck(pid,label,mount_holes,tie_slots=()):
    f=P['frame']; t=f['deck_thickness']
    o=rect(f['deck_depth'],f['deck_width'],t,r=3)
    slots=[]
    for x in (-44,44):
        for y in (-49.5,49.5):
            o=slot(o,x,y,F['deck_slot_length'],F['m4'],t,90)
            slots.append([x,y,F['deck_slot_length'],F['m4'],90])
    for x,y,d in mount_holes:o=bore(o,x,y,d,t)
    # Two open cable exits on the forward edge; wires do not pass through a closed frame.
    for y in (-27,27):o=o.cut(rect(12,16,t+2,x=-58,y=y,r=2).translate((0,0,-1)))
    for x,y,length,width,angle in tie_slots:
        o=slot(o,x,y,length,width,t,angle);slots.append([x,y,length,width,angle])
    code={'03_power_deck':'R04 PWR','04_interface_deck':'R04 BUS','05_control_deck':'R04 CTRL'}[pid]
    o=o.cut(cq.Workplane('XY').workplane(offset=t-.5).center(0,58).text(code,5,.7,font='Arial'))
    return save(pid,o,1,label,{'holes':mount_holes,'slots':slots,'thickness':t},'deck')


def grid(cx,cy,px,py,d):
    return [(cx+x*px/2,cy+y*py/2,d) for x in (-1,1) for y in (-1,1)]


def carrier():
    # Preserve the source-checked JD-03 motor pattern and the R03 lateral stack.
    src=HERE/'legacy/05_motor_carrier.step'
    o=cq.importers.importStep(str(src))
    # Cable anchor above the motor face, clear of six motor screws.
    for x,y in ((12,27),(22,20)):o=slot(o,x,y,8,3.2,6,0)
    old=json.loads((HERE/'legacy/manifest.json').read_text())
    feat=next(p['features'] for p in old['parts'] if p['id']=='05_motor_carrier')
    feat['slots']=[[12,27,8,3.2,0],[22,20,8,3.2,0]]
    return save('06_motor_carrier',o,1,'37D motor carrier with cable anchors',feat)


def board_plate(pid,label,w,h,holes,feet,window=None):
    o=rect(w,h,3,r=3)
    if window:o=o.cut(rect(*window,5,r=1).translate((0,0,-1)))
    allholes=list(holes)+list(feet)
    for x,y,d in allholes:o=bore(o,x,y,d,3)
    return save(pid,o,1,label,{'holes':allholes,'thickness':3},'mount')


def spacer(pid,label,od,di,h,qty):
    return save(pid,cq.Workplane('XY').circle(od/2).circle(di/2).extrude(h),qty,label,
        {'holes':[(0,0,di)],'thickness':h},'mount')


def servo_cradle():
    p=P['servo']; cw,cl,_=p['case']; c=p['case_clearance_per_side']
    o=rect(68,64,4,r=3)
    # Rear horn and shaft have a true through relief. The servo rests on its fixed case edges.
    o=o.cut(rect(19,38,6,r=2).translate((0,0,-1)))
    o=bore(o,0,p['shaft_offset'],22,4)
    # Open end windows preserve connector access. Side rails capture the case in X.
    for x in (-1,1):
        o=o.union(rect(4,cl+2*c,40.5,x=x*(cw/2+c+2)))
    # Two end stops at corners; leave a 16 mm central cable opening at each end.
    for x in (-10.5,10.5):
        for y in (-1,1):o=o.union(rect(5,3,14,x=x,y=y*(cl/2+c+1.5)))
    # Two independent cap bars, each with two through bolts and accessible rear nuts.
    clamp_holes=[]
    for v in (4,17):
        for x in (-21,21):
            o=o.union(rect(8,8,40.5,x=x,y=v))
            # Bridge each pillar to its side rail along the full height.
            o=o.union(rect(6,6,40.5,x=(1 if x>0 else -1)*17.5,y=v))
            clamp_holes.append((x,v,F['m3']))
    mount_holes=grid(0,0,54,40,F['m4'])
    for x,y,d in clamp_holes+mount_holes:o=bore(o,x,y,d,40)
    for x,y,d in clamp_holes:
        o=o.cut(cq.Workplane('XY').center(x,y).polygon(6,6.7).extrude(3.2))
    return save('13_servo_cradle',o,1,'ST3215 open case cradle',{'holes':clamp_holes+mount_holes,
        'thickness':4,'case_pocket':[cw+2*c,cl+2*c],'cap_seat_z':40.5,'shaft_relief':[0,p['shaft_offset'],22]},'mount')


def cap_bar():
    o=rect(50,8,4,r=2)
    holes=[(-21,0,F['m3']),(21,0,F['m3'])]
    for x,y,d in holes:o=bore(o,x,y,d,4)
    return save('14_servo_cap_bar',o,2,'ST3215 cap bar',{'holes':holes,'thickness':4},'mount')


def coupon():
    o=rect(108,40,4,r=2)
    holes=[(-43,8,2.4),(-31,8,3.3),(-19,8,3.5),(-7,8,4.4),(5,8,4.6),(17,8,4.8),(37,8,12.4)]
    for x,y,d in holes:o=bore(o,x,y,d,4)
    # M4 deck adjustment slot and M3 spacer fit.
    o=slot(o,-35,-9,6.6,4.6,4,90)
    o=o.cut(rect(25.72,8,6,x=7,y=-9).translate((0,0,-1)))
    return save('19_fit_coupon',o,1,'Hole and case width coupon',{'holes':holes,'thickness':4},'mount')


def angle_pose(s,x,far,z):
    o=s.rotate((0,0,0),(1,1,1),120).rotate((0,0,0),(1,0,0),180)
    if far:o=o.rotate((0,0,0),(0,0,1),180)
    return o.translate((x+(11 if far else -11),-135 if far else 0,z))


def moving(q):
    x=110*math.sin(math.radians(q)); z=-110*math.cos(math.radians(q))
    def link(pid,y,zz=0):return side(PARTS[pid]['shape'],y).rotate((0,0,0),(0,1,0),90-q).translate((0,0,zz))
    return {'lower_link':link('07_lower_lock_link',13),'upper_link':link('08_upper_link',23,40),
        'carrier':side(MOTOR,31,x,z),'gearbox':cyl(36.8,21.5,x+32,3.5,z),
        'motor':cyl(34.8,30.7,x+32,-27.2,z),'encoder':cyl(34,15.4,x+32,-42.6,z),
        'wheel':cyl(100,24,x+25,35.5,z).cut(cyl(22,24,x+25,35.5,z))}


SIDE=panel(); ANGLE=bracket()
# Lower: two identical interface cassettes, each on four M3 screws.
interface_feet=grid(0,0,54,46,F['m3'])
DECK1=deck('03_power_deck','Lower power and driver deck',
    grid(0,-29,54,46,F['m3'])+grid(0,29,54,46,F['m3']),
    [(42,y,14,4,90) for y in (-22,22)])
# Middle: two configurable cassettes for servo bus / level conversion and power conversion / protection.
DECK2=deck('04_interface_deck','Middle interface deck',
    grid(0,-29,54,46,F['m3'])+grid(0,29,54,46,F['m3']),
    [(42,y,14,4,90) for y in (-22,22)])
# Upper: removable Pico and IMU plates, with independent cable anchors.
pico_feet=grid(0,0,56,30,F['m3']); imu_feet=grid(0,0,34,34,F['m3'])
DECK3=deck('05_control_deck','Upper control and sensor deck',
    [(x,y-30,d) for x,y,d in pico_feet]+[(x,y+26,d) for x,y,d in imu_feet],
    [(x,0,10,3.2,0) for x in (-36,36)])
MOTOR=carrier()
for pid,old,qty,label in [('07_lower_lock_link','04_lower_lock_link',1,'Lower lock link'),
    ('08_upper_link','06_upper_link',1,'Upper link'),('09_spacer_2mm','07_spacer_2mm',2,'Leg spacer 2 mm'),
    ('10_spacer_12mm','08_spacer_12mm',2,'Leg spacer 12 mm')]:
    oldm=json.loads((HERE/'legacy/manifest.json').read_text())
    feat=next(p['features'] for p in oldm['parts'] if p['id']==old)
    save(pid,cq.importers.importStep(str(HERE/'legacy'/(old+'.step'))),qty,label,feat,'mount',old)
pico_holes=grid(0,0,47,11.4,F['m2'])
PICO=board_plate('11_pico_plate','Pico 2 plate',66,40,pico_holes,pico_feet,(40,26))
imu_holes=grid(0,0,20.32,20.32,F['m3'])
IMU=board_plate('12_imu_plate','LSM6DSO rigid plate',44,44,imu_holes,imu_feet)
SERVO=servo_cradle(); CAP=cap_bar()
# Interface cassettes use a standard user-drilled insulating board. No fictional driver holes.
o=rect(62,54,3,r=3)
o=o.cut(rect(34,20,5,r=2).translate((0,0,-1)))
board_holes=grid(0,0,44,30,F['m3'])
for x,y,d in interface_feet+board_holes:o=bore(o,x,y,d,3)
# Separate cassette feet and board supports preserve nut and driver access.
for x in (-19,19):o=slot(o,x,0,16,3.2,3,90)
INTERFACE=save('15_interface_cassette',o,4,'Driver / power / bus interface cassette',
    {'holes':interface_feet+board_holes,'thickness':3,'board_blank':[52,38],'board_hole_pitch':[44,30]},'mount')
spacer('16_pico_standoff','Pico M2 standoff',3.2,2.2,10,4)
spacer('17_board_standoff','Board M3 standoff',6,3.5,8,16)
spacer('18_imu_standoff','IMU M3 standoff',6,3.5,8,4)
COUPON=coupon()
spacer('20_fixture_standoff','Fixture clearance spacer',12,4.6,10,4)
# Side and deck samples make a full corner trial possible without a full wall/deck print.
o=rect(32,36,6)
o=bore(o,0,0,F['m4'],6)
save('21_side_joint_sample',o,1,'Side joint sample',{'holes':[(0,0,F['m4'])],'thickness':6},'deck')
o=rect(32,36,4);o=slot(o,0,0,6.6,4.6,4,90)
save('22_deck_joint_sample',o,1,'Deck joint sample',{'slots':[(0,0,6.6,4.6,90)],'thickness':4},'deck')

spacer('23_module_foot','Module clearance spacer',7,3.5,4,24)

add('body_near',side(SIDE,6),'frame','01_body_side')
add('body_far',side(SIDE,-135),'frame','01_body_side')
for pid,s,z in [('03_power_deck',DECK1,60),('04_interface_deck',DECK2,120),('05_control_deck',DECK3,170)]:
    add(pid,s.translate((0,-67.5,z)),'deck',pid)
    for x in (-44,44):
        for far in (False,True):add(f'angle_{z}_{x}_{int(far)}',angle_pose(ANGLE,x,far,z),'deck','02_open_deck_angle')
for name,s in moving(30).items():
    pid={'lower_link':'07_lower_lock_link','upper_link':'08_upper_link','carrier':'06_motor_carrier'}.get(name)
    add(name,s,'mount' if 'link' in name else 'frame' if name=='carrier' else 'tire' if name=='wheel' else 'metal',pid,pid is None,'moving')
x=55;z=-110*math.cos(math.pi/6)
for name,xx,yy,zz,h in [('body_lower',0,8,0,2),('body_upper',0,18,40,12),('carrier_lower',55,25,z,12),('carrier_upper',55,25,z+40,2)]:
    pid='09_spacer_2mm' if h==2 else '10_spacer_12mm'
    add(name+'_spacer',side(PARTS[pid]['shape'],yy,xx,zz),'mount',pid,group='joint')
add('motor_pilot',cyl(12,6,80,25,z),'metal',reference=True,group='moving')
add('shaft',cyl(6,16,80,31,z),'metal',reference=True,group='moving')
add('hub',cyl(18,12,80,34,z).cut(cyl(6,12,80,34,z)),'metal',reference=True,group='moving')
# The servo is external to the body and above the leg sweep. No torque path to the M4 leg pivots.
add('servo_cradle',outward(SERVO,6,z=94),'mount','13_servo_cradle')
for v in (4,17):add('servo_bar_'+str(v),outward(CAP,46.5,z=94+v),'mount','14_servo_cap_bar')
# Conservative case envelope. Trim the rear rotating horn relief to preserve the two case bearing edges.
servo_case=rect(24.72,45.22,36,r=1).val()
add('ST3215_case_envelope',outward(servo_case,10,z=94),'metal',reference=True)
add('ST3215_output_envelope',cyl(19.2,4,0,46,81.5),'metal',reference=True)
# Component plates and PCB envelopes, with all structural standoffs visible.
for pid,s,cx,cy,zz,holes,spid,pcb,spheight in [
    ('11_pico_plate',PICO,0,-97.5,178,pico_holes,'16_pico_standoff',(51,21,1),10),
    ('12_imu_plate',IMU,0,-41.5,178,imu_holes,'18_imu_standoff',(25.4,25.4,1.6),8)]:
    add(pid,s.translate((cx,cy,zz)),'mount',pid)
    feet=pico_feet if 'pico' in pid else imu_feet
    for j,(xx,yy,d) in enumerate(feet):add(pid+'_foot_'+str(j),PARTS['23_module_foot']['shape'].translate((cx+xx,cy+yy,zz-4)),'mount','23_module_foot')
    for j,(xx,yy,d) in enumerate(holes):add(pid+'_spacer_'+str(j),PARTS[spid]['shape'].translate((cx+xx,cy+yy,zz+3)),'mount',spid)
    b=rect(*pcb)
    for xx,yy,d in holes:b=bore(b,xx,yy,2.1 if 'pico' in pid else 3.048,pcb[2])
    add(pid+'_PCB',b.val().translate((cx,cy,zz+3+spheight)),'board',reference=True)
# Pico pin keepouts and USB insertion path are separate references, checked against printed solids.
for yy in (-8.89,8.89):add('pico_header_'+str(yy),rect(49,3,8,x=0,y=yy).val().translate((0,-97.5,183)),'metal',reference=True,group='keepout')
add('pico_USB_access',rect(28,14,12,x=-40).val().translate((0,-97.5,187)),'board',reference=True,group='keepout')
for i,(zz,cy,label) in enumerate([(68,-96.5,'DRV8874'),(68,-38.5,'power_cut_fuse'),(128,-96.5,'servo_bus_encoder'),(128,-38.5,'regulator_clamp')]):
    add(label+'_cassette',INTERFACE.translate((0,cy,zz)),'mount','15_interface_cassette')
    for j,(xx,yy,d) in enumerate(interface_feet):add(label+'_foot_'+str(j),PARTS['23_module_foot']['shape'].translate((xx,cy+yy,zz-4)),'mount','23_module_foot')
    for j,(xx,yy,d) in enumerate(board_holes):add(label+'_spacer_'+str(j),PARTS['17_board_standoff']['shape'].translate((xx,cy+yy,zz+3)),'mount','17_board_standoff')
    pcb=rect(52,38,1.6)
    for xx,yy,d in board_holes:pcb=bore(pcb,xx,yy,3.2,1.6)
    add(label+'_insulating_board',pcb.val().translate((0,cy,zz+11)),'board',reference=True)
    # This reservation includes sockets, upright components and terminals.
    add(label+'_component_space',rect(36,24,22).val().translate((0,cy,zz+12.6)),'board',reference=True,group='keepout')
# Body is independent of the wheel. The 10 mm stand-offs clear frame bolt heads behind the uprights.
add('fixture_base',rect(280,250,18,x=40,y=-67.5).val().translate((0,0,-218)),'wood',reference=True)
for label,face,woodface in [('near',16,34),('far',-141,-151)]:
    upright=rect(54,340,18,x=-53,y=-30)
    for z0 in (10,80):upright=bore(upright,-43,z0,4.6,18)
    add('fixture_upright_'+label,side(upright.val(),woodface),'wood',reference=True)
    for zz in (10,80):add('fixture_spacer_'+label+str(zz),side(PARTS['20_fixture_standoff']['shape'],face,-43,zz),'mount','20_fixture_standoff')

assembly=cq.Assembly(name='HUX_R04_THREE_DECK_BODY')
for item in INSTANCES:assembly.add(item['shape'],name=item['name'],color=cq.Color(*item['color']))
assembly.save(str(HERE/'one-leg-body-r04.step'))
manifest={'revision':'R04','date':P['date'],'units':'mm','status':P['status'],
    'parts':[{k:v for k,v in p.items() if k!='shape'} for p in PARTS.values()],
    'assembly':[{k:v for k,v in i.items() if k!='shape'} for i in INSTANCES],
    'source_hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [HERE/'build.py',HERE/'parameters.json']}}
(HERE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(PARTS)} part types and {len(INSTANCES)} assembly instances.',flush=True)
