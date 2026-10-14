#!/usr/bin/env python3
"""Four vector assembly/fit sheets; section contours come from the exported STL files."""
from pathlib import Path
import json
import numpy as np
import trimesh
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'manifest.json').read_text());PARTS={p['id']:p for p in M['parts']}
W,H=431.8,279.4
C=canvas.Canvas(str(HERE/'one-leg-body-r04-drawings.pdf'),pagesize=(W*mm,H*mm))
C.setTitle('Hux R04 - matched body, component mounts and fit checks')
INK=HexColor('#233f36'); PAPER=HexColor('#fcfcf7'); FILL=HexColor('#dce7df')
def text(x,y,t,size=3.1,bold=False):
    C.setFillColor(INK);C.setFont('Helvetica-Bold' if bold else 'Helvetica',size);C.drawString(x,y,str(t))
def lines(x,y,seq,leading=5.2,size=3.1):
    for n,t in enumerate(seq):text(x,y-n*leading,t,size)
def frame(n,title,sub):
    C.saveState();C.scale(mm,mm);C.setFillColor(PAPER);C.rect(0,0,W,H,fill=1,stroke=0)
    text(12,265,'HUX / V1-PROOF / R04',3.5,True);text(12,253,title,6,True);text(12,244,sub)
    C.setStrokeColor(INK);C.setLineWidth(.25);C.line(12,239,420,239);C.line(12,26,420,26)
    text(12,18,'FIT CANDIDATE / mm / 2026-10-13 / 17 x 11 inches',3,True)
    text(12,11,'Read README.md. Physical fit, strength and powered qualification remain open.',2.8)
    text(362,18,f'ME-04 / {n} OF 4',3.5,True)
def end():C.restoreState();C.showPage()
def section(pid,cx,cy,s=1,z=None):
    p=PARTS[pid];m=trimesh.load_mesh(HERE/'stl'/(pid+'.stl'))
    z=p['features'].get('thickness',4)/2 if z is None else z
    sec=m.section(plane_origin=[0,0,z],plane_normal=[0,0,1])
    loops=sec.discrete
    def area(v):return abs(np.sum(v[:-1,0]*v[1:,1]-v[1:,0]*v[:-1,1]))/2
    ordered=sorted(loops,key=area,reverse=True)
    def contains(poly,point):
        x,y=point; inside=False
        for a,b in zip(poly[:-1],poly[1:]):
            if (a[1]>y)!=(b[1]>y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
        return inside
    for k,v in enumerate(ordered):
        path=C.beginPath();path.moveTo(cx+v[0,0]*s,cy+v[0,1]*s)
        for xx,yy,_ in v[1:]:path.lineTo(cx+xx*s,cy+yy*s)
        path.close();C.setFillColor(FILL if sum(contains(other,v[0,:2]) for other in ordered[:k])%2==0 else PAPER);C.drawPath(path,fill=1,stroke=1)
def table(x,y,widths,rows,dy=6):
    for i,row in enumerate(rows):
        if i==0:C.setFillColor(FILL);C.rect(x,y-2,sum(widths),dy,fill=1,stroke=0)
        xx=x
        for w,t in zip(widths,row):text(xx+1,y,t,2.8,i==0);xx+=w
        y-=dy

def dim(x1,y1,x2,y2,label):
    C.line(x1,y1,x2,y2)
    if y1==y2:
        for x in (x1,x2):C.line(x,y1-2,x,y1+2)
        text((x1+x2)/2-len(label)*.8,y1+2,label,2.8)
    else:
        for y in (y1,y2):C.line(x1-2,y,x1+2,y)
        C.saveState();C.translate(x1-2,(y1+y2)/2);C.rotate(90);text(-len(label)*.8,0,label,2.8);C.restoreState()

frame(1,'Matched body and removable mounts','Two identical walls / three marked decks / one supported leg / external bench power')
C.drawImage(str(HERE/'equipment.png'),12,33,width=222,height=194.25,mask='auto')
text(14,29.5,'CUTAWAY: near wall and fixture omitted. Blue blocks include reserved service space.',2.6)
rows=[['ID','PRINTED PART','QTY']]+[[p['id'][:2],p['label'],str(p['quantity'])] for p in M['parts']]
table(244,229,[12,139,17],rows,dy=6.3)
lines(245,67,['Replace the walls, all decks and all frame angles.',
    'Reuse checked R03 links and leg spacers.', 'The old motor carrier remains usable if its fit agrees.',
    'Parts 19, 21 and 22 are test pieces.', 'The cradle is a servo mount. The leg drive remains open.'],size=2.9)
end()
frame(2,'Body and deck interfaces','Contour sections from exported STL / dimensions govern / wall 0.9:1 / decks 0.65:1')
section('01_body_side',82,71.5,.9);dim(28,35,136,35,'120');dim(20,40,20,233.5,'215')
text(29,235.5,'01 / TWO IDENTICAL WALLS',2.8,True)
for x,y,d in PARTS['01_body_side']['features']['holes']:
    if x==44:text(143,71.5+y*.9+(2 if y==42 else -1),f'Z {y:g}',2.7)
text(141,70,'PIVOT 0',2.7);text(147,103,'PIVOT 40',2.7)
for pid,x,y,title in [('03_power_deck',226,179,'03 / POWER'),('04_interface_deck',349,179,'04 / INTERFACES'),('05_control_deck',226,74,'05 / CONTROLS')]:
    section(pid,x,y,.65);text(x-39,y+47,title,3.2,True)
lines(294,116,['FRAME DATUMS', '', 'Near wall: depth 0 to 6', 'Far wall: depth -141 to -135',
    'Deck center: depth -67.5', 'Decks: 120 x 133.8 x 4', 'Side clearance: 0.6 each side',
    'Angle X: -44 and +44', 'Deck slot depth: -18 and -117', 'Side bolt Z: deck underside -18',
    '', 'Deck undersides: 60 / 120 / 170', 'Keep all frame bolts loose until square.'],size=3)
end()
frame(3,'Electronics and servo attachment','Actual PCB hole patterns / all dimensions in mm / contours at 1:1 unless stated')
section('11_pico_plate',58,196);text(21,225,'11 / PICO 2',3.8,True)
lines(100,212,['4 x M2, 47 x 11.4 centers','10 high, 3.2 OD standoffs','USB and headers remain accessible.','Use 4 mm feet below this plate.'])
section('12_imu_plate',256,196);text(232,225,'12 / LSM6DSO',3.8,True)
lines(290,212,['4 x M3, 20.32 square centers','8 mm insulating standoffs','Keep the sensor mount rigid.','Record its axis directions.'])
section('15_interface_cassette',58,115);text(21,155,'15 / FOUR INTERFACE CASSETTES',3.8,True)
lines(100,141,['Carrier feet: 54 x 46 centers','Board supports: 44 x 30 centers',
    'Board blank: 52 x 38 x 1.6','4 mm feet + 8 mm board standoffs',
    'DRV8874: soldered headers or sockets','Do not drill the driver PCB.','Other board models remain unselected.'])
section('13_servo_cradle',259,104,z=3.6);text(225,155,'13 / ST3215 CASE CRADLE',3.8,True)
lines(302,136,['Wall bolts: M4, 54 x 40 centers','Case pocket: 25.72 x 46.22',
    'Two cap bars, four M3 x 45 bolts','Rear captive nuts and wall access holes',
    '1 mm resilient pads under bars','Check both output faces and connector.',
    'No powered leg transmission is supplied.'],size=2.9)
section('14_servo_cap_bar',259,55);text(225,43,'14 / CAP BAR / PRINT TWO',3.0,True)
lines(21, 61,['Module nuts sit in the 4 mm gap above each deck.',
    'Fit board screws before the module-to-deck screws.',
    'Check actual headers, terminals, cable loops and tool access.'],size=3.1)
end()
frame(4,'First fit and assembly checks','Print one corner before full walls / no print or physical qualification was completed in this session')
section('02_open_deck_angle',24,171,z=11);text(20,221,'02 / ANGLE CROSS SECTION / 1:1',3.6,True)
# Hardware paths show the two perpendicular bolt axes.
C.setDash(1,1);C.line(18,189,65,189);C.line(42,165,42,212);C.setDash()
dim(24,164,42,164,'18');dim(16,171,16,189,'18')
lines(75,211,['M4 x 16 for each frame connection', 'Plain 3.2 mm nuts; two 0.5 mm washers per bolt',
    '12 mm OD socket passes the open cavity.', 'Longer bolts need a new interference check.'])
section('21_side_joint_sample',263,193);section('22_deck_joint_sample',314,193)
text(244,220,'21 / SIDE',3.4,True);text(297,220,'22 / DECK',3.4,True)
lines(345,205,['Print these two samples','and one angle first.','Check both fasteners','with the actual tool.'],size=3)
section('19_fit_coupon', 77,119);text(21,147,'19 / FIRST FIT COUPON / 1:1',3.6,True)
lines(143,134,['Hole row, left to right:', '2.4 / 3.3 / 3.5 / 4.4 / 4.6 / 4.8 / 12.4',
    'Lower slot: 6.6 x 4.6', 'Lower rectangle: 25.72 wide servo case trial'])
table(21, 80,[88,61,130],[['ASSEMBLY','FASTENER START POINT','CHECK'],
    ['Frame angles','24 x M4 x 16','Both nuts and the tool fit together'],
    ['Modules to decks','24 x M3 x 16','4 mm feet leave room for board nuts'],
    ['Interface boards / IMU','20 x M3 x 16','8 mm insulating standoffs'],
    ['Pico 2','4 x M2 x 18','10 mm standoffs; inspect header clearance'],
    ['Motor carrier','6 x M3 x 8','Measure 2 to 3 mm engagement; never exceed 3'],
    ['Servo bars','4 x M3 x 45','Use pads; do not distort the case']],dy=6.5)
lines(316, 80,['BUILD ORDER','Corner trial, then wall/deck trial.','Matched frame, then electronics.','Independent fixture and catch strap.',
    'Passive leg and neutral lock.','Motor and harness clearance.','Servo arrival and case fit.'],size=3)
end();C.save()
print('Wrote four R04 engineering sheets.')
