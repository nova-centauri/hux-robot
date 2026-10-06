#!/usr/bin/env python3
"""Four 17 x 11 inch vector sheets. Coordinates and dimensions are millimeters."""
from pathlib import Path
import json
import math
import numpy as np
import trimesh
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor

HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'manifest.json').read_text())
PART={p['id']:p for p in M['parts']}
W,H=431.8,279.4
C=canvas.Canvas(str(HERE/'one-leg-body-r03-drawings.pdf'),pagesize=(W*mm,H*mm))
C.setTitle('HUX one-leg body R03 - assembly and part drawings')
C.setAuthor('Hux project')
INK=HexColor('#203b34'); GREEN=HexColor('#dce7df'); ORANGE=HexColor('#b56c36')


def text(x,y,value,size=3.0,bold=False,color=INK):
    C.setFillColor(color); C.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
    C.drawString(x,y,str(value))


def lines(x,y,items,size=3.0,leading=5):
    for i,item in enumerate(items): text(x,y-i*leading,item,size)


def stroke(): C.setStrokeColor(INK); C.setLineWidth(.25)


def frame(number,title,subtitle):
    C.saveState(); C.scale(mm,mm); stroke()
    C.setFillColor(HexColor('#fcfcf8')); C.rect(0,0,W,H,fill=1,stroke=0)
    text(12,264,'HUX / V1-PROOF',3.2,True)
    text(12,253,title,6.5,True)
    text(12,245,subtitle,3.1)
    C.line(12,239,420,239)
    C.rect(12,10,408,18,fill=0,stroke=1)
    for x in (256,319,374): C.line(x,10,x,28)
    text(16,21,'ONE-LEG BODY / SUPPORTED BENCH ASSEMBLY',3.1,True)
    text(16,14,'FIT CANDIDATE - physical fits and strength remain unverified',2.9)
    text(260,21,'UNITS: mm',3,True); text(260,14,'2026-10-06',3)
    text(323,21,'REVISION R03',3,True); text(323,14,'17 x 11 inches',3)
    text(378,21,'ME-03 / '+str(number),3,True); text(378,14,'SHEET '+str(number)+' OF 4',3)


def finish(): C.restoreState(); C.showPage()


def dim(x1,y1,x2,y2,label):
    stroke(); C.line(x1,y1,x2,y2)
    dx=x2-x1; dy=y2-y1; length=math.hypot(dx,dy); ux,uy=dx/length,dy/length
    for x,y,sign in [(x1,y1,1),(x2,y2,-1)]:
        C.line(x,y,x+sign*2*ux+uy,y+sign*2*uy-ux)
        C.line(x,y,x+sign*2*ux-uy,y+sign*2*uy+ux)
    if abs(dy)<.01:
        C.setFillColor(HexColor('#fcfcf8')); C.rect((x1+x2)/2-len(label)*.86,(y1+y2)/2+1,len(label)*1.75,4,fill=1,stroke=0)
        text((x1+x2)/2-len(label)*.8,y1+2,label,3)
    else:
        C.saveState(); C.translate(x1-2,(y1+y2)/2); C.rotate(90)
        text(-len(label)*.8,0,label,3); C.restoreState()


def holes(part,ox,oy,scale=1):
    stroke(); C.setFillColor(HexColor('#fcfcf8'))
    for x,y,d in part['features'].get('holes',[]):
        C.circle(ox+x*scale,oy+y*scale,d/2*scale,fill=1,stroke=1)
        C.setLineWidth(.12)
        C.line(ox+(x-d*.75)*scale,oy+y*scale,ox+(x+d*.75)*scale,oy+y*scale)
        C.line(ox+x*scale,oy+(y-d*.75)*scale,ox+x*scale,oy+(y+d*.75)*scale)
        C.setLineWidth(.25)


def table(x,y,widths,rows,line_height=6):
    for row_index,row in enumerate(rows):
        xx=x
        if row_index==0:
            C.setFillColor(GREEN); C.rect(x,y-2,sum(widths),line_height,fill=1,stroke=0)
        for width,value in zip(widths,row):
            text(xx+1,y,value,2.8,row_index==0); xx+=width
        y-=line_height


def side_shape(ox,oy,s=1):
    stroke(); C.setFillColor(GREEN)
    C.roundRect(ox-60*s,oy-35*s,120*s,185*s,5*s,fill=1,stroke=1)
    C.setFillColor(HexColor('#fcfcf8')); C.roundRect(ox-36*s,oy+70*s,72*s,66*s,5*s,fill=1,stroke=1)
    holes(PART['01_body_side'],ox,oy,s)


frame(1,'A body for the next bench build','Fixed leg first / one suspended wheel / removable decks / bench power')
C.drawImage(str(HERE/'assembly.png'),12,36,width=220,height=192.5,mask='auto')
text(239,229,'BUILD SCOPE',3.5,True)
lines(239,220,[
 'The frame keeps the 110 mm links and 40 mm pivot spacing.',
 'A removable M4 fastener locks the lower link at 30 degrees.',
 'Two slotted decks accept removable board carriers and straps.',
 'The bench fixture holds the body and keeps the wheel clear.',
 'Motor, hub, tire and wood are reference envelopes in the model.',
 'Fit checks precede the first low-speed wheel trial.'
])
table(239,182,[18,102,18],[['PART','PRINTED COMPONENT','QTY'],
 ['01','Body side, 120 x 185 x 6','2'],['02','Equipment deck, 120 x 135 x 4','2'],
 ['03','Deck angle, 26 x 26 x 18','8'],['04','Lower link with neutral lock','1'],
 ['05','Motor carrier, 63 x 71 x 6','1'],['06','Upper link, R01 geometry','1'],
 ['07','2 mm spacer','2'],['08','12 mm spacer','2'],['09','Interface coupon, first print','1']])
text(239,115,'REUSE AND NEXT INTERFACE',3.5,True)
lines(239,106,[
 'Reuse the R01 upper link and spacers if their dimensions agree.',
 'Replace the lower link with part 04 for the neutral lock.',
 'The ST3215 mount, 3:1 belt drive and shaft bearings remain open.',
 'Do not apply servo torque to the printed M4 pivot arrangement.',
 'R03 does not establish a floor-load rating for the motor shaft.',
 'No physical load, power or balance pass follows from these files.'
])
text(239,68,'FRAME ENVELOPE',3.5,True)
lines(239,59,['120 deep x 147 wide x 185 high. Inside width: 135.',
 'Deck top surfaces: 64 and 144 above the lower body pivot.',
 'Solid PLA estimate: '+str(M['solid_pla_mass_g_for_printed_assembly'])+' g, without the coupon or purchased parts.',
 'This is a volume calculation. Use the slicer estimate and weigh the build.'],2.9,5)
finish()

frame(2,'Body sides and equipment decks','Scale 1:1 at 100% print size / no fit-to-page / all holes are through holes')
side_shape(86,80)
text(28,232,'01 / BODY SIDE / QTY 2 / THICKNESS 6',3.3,True)
dim(26,37,146,37,'120'); dim(17,45,17,230,'185')
dim(156,80,156,120,'40')
text(93,82,'DATUM',2.5); text(94,64,'LOCK',2.5)
ox,oy=262,149
C.setFillColor(GREEN); stroke(); C.roundRect(ox-60,oy-67.5,120,135,4,fill=1,stroke=1)
holes(PART['02_equipment_deck'],ox,oy)
for x,y,length,width in PART['02_equipment_deck']['features']['slots']:
    C.setFillColor(HexColor('#fcfcf8')); C.roundRect(ox+x-length/2,oy+y-width/2,length,width,width/2,fill=1,stroke=1)
text(202,232,'02 / EQUIPMENT DECK / QTY 2 / THICKNESS 4',3.3,True)
dim(202,224,322,224,'120'); dim(331,81.5,331,216.5,'135')
dim(219,72,305,72,'86'); dim(342,94.5,342,203.5,'109')
lines(352,225,['SIDE HOLE CENTERS','Datum: lower body pivot','All bores: 4.5 nominal'],2.8,5)
table(351,205,[26,34],[['X','Z'],['0','0, 40'],['12','-20.785'],['-43','10, 47, 80, 127'],['43','47, 127']],6)
lines(352,163,['SIDE WINDOW','72 x 66, radius 5','Center: (0, 103)','Outer corners: radius 5',
 '', 'DECK HOLE CENTERS','X: -43, +43','Y: -54.5, +54.5','All bores: 4.5 nominal',
 '', 'DECK SLOTS','20 x 18 long x 4.5 wide','X: -44, -22, 0, 22, 44','Y: -36, -12, 12, 36','Deck corners: radius 4'],2.8,5)
lines(202,59,['The deck datum is its center. X is the 120 mm direction.',
 'Slot length includes both round ends. Use insulating board supports.',
 'Print both parts flat. Do not scale the part to adjust a hole fit.'],2.9,5)
dim(304,35,404,35,'100 mm scale check')
finish()

frame(3,'Link, motor carrier and small parts','Scale 1:1 at 100% / nominal holes require a printed fit check')
text(25,230,'05 / MOTOR CARRIER / QTY 1 / THICKNESS 6',3.4,True)
ox,oy=56,167
outline=PART['05_motor_carrier']['features']['outline']
path=C.beginPath(); path.moveTo(ox+outline[0][0],oy+outline[0][1])
for x,y in outline[1:]: path.lineTo(ox+x,oy+y)
path.close(); C.setFillColor(GREEN); stroke(); C.drawPath(path,fill=1,stroke=1)
holes(PART['05_motor_carrier'],ox,oy)
dim(43,167,43,207,'40'); dim(56,132,81,132,'25'); dim(119,144,119,215,'71')
text(139,225,'CARRIER DATUM: LOWER PIVOT',3,True)
table(138,217,[15,23,23,19],[['HOLE','X','Z','DIA'],['A','0','0','4.5'],['B','0','40','4.5'],['P','25','0','12.4']]+
 [[str(i+1),f'{x:.3f}',f'{y:.3f}',str(d)] for i,(x,y,d) in enumerate(PART['05_motor_carrier']['features']['holes'][3:])],6)
lines(139,151,['Motor axis: (32, 0). Bolt circle: 31.',
 'Six M3 screws. Maximum motor engagement: 3.',
 'Outline: convex hull of R8 pivot ends and R23 motor pad.',
 'Verify the motor pilot and hole pattern on the received motor.'],2.65,5)

def link_drawing(part,ox,oy):
    mesh=trimesh.load_mesh(HERE/'stl'/(part['id']+'.stl'))
    section=mesh.section(plane_origin=[0,0,2.5],plane_normal=[0,0,1])
    def area(loop): return abs(np.dot(loop[:,0],np.roll(loop[:,1],1))-np.dot(loop[:,1],np.roll(loop[:,0],1)))
    outline=max(section.discrete,key=area)
    path=C.beginPath(); path.moveTo(ox+outline[0,0],oy+outline[0,1])
    for x,y,_ in outline[1:]: path.lineTo(ox+x,oy+y)
    path.close(); C.setFillColor(GREEN); stroke(); C.drawPath(path,fill=1,stroke=1)
    holes(part,ox,oy)

text(249,230,'04 / LOWER LOCK LINK / QTY 1 / THICKNESS 5',3.3,True)
link_drawing(PART['04_lower_lock_link'],256,207)
dim(256,222,366,222,'110'); dim(256,192,280,192,'24')
text(249,180,'06 / UPPER LINK / QTY 1 / THICKNESS 5',3.3,True)
link_drawing(PART['06_upper_link'],256,162)
lines(249,144,['End bosses: diameter 16. Neck: width 8.',
 'All three lower-link holes: diameter 4.5.',
 'The lock bore sits 24 from the body pivot.',
 'Use the STEP/STL outline for the tapered shoulders.'],2.9,5)

text(25,116,'03 / DECK ANGLE / QTY 8',3.3,True)
stroke(); C.setFillColor(GREEN)
path=C.beginPath(); path.moveTo(28,54);path.lineTo(54,54);path.lineTo(28,80);path.close();C.drawPath(path,fill=1,stroke=1)
C.rect(28,54,26,5,fill=0,stroke=1);C.rect(28,54,5,26,fill=0,stroke=1)
dim(28,47,54,47,'26');dim(20,54,20,80,'26')
C.setFillColor(GREEN);C.rect(90,54,26,18,fill=1,stroke=1);C.circle(103,63,2.25,fill=0,stroke=1)
dim(90,47,116,47,'26');dim(124,54,124,72,'18')
lines(28,103,['Two 5 mm walls. One 3 mm gusset.',
 'Each bore: diameter 4.5, 13 from the corner.',
 'Bore centers: 9 across the 18 mm width.',
 'Print with the triangular gusset on the bed.'],2.9,5)
lines(140,106,['07 / SPACER: OD 9, ID 4.5, HEIGHT 2 / QTY 2',
 '08 / SPACER: OD 9, ID 4.5, HEIGHT 12 / QTY 2',
 'Spacers set the lateral positions. They are not bearings.',
 'Use washers and smooth pivot surfaces. Check free play.'],2.9,5)
text(249,116,'09 / INTERFACE COUPON / QTY 1 / THICKNESS 4',3.3,True)
C.setFillColor(GREEN);stroke();C.roundRect(256,59,86,30,3,fill=1,stroke=1)
holes(PART['09_interface_coupon'],299,74)
for x,y,d in PART['09_interface_coupon']['features']['holes']: text(299+x-3,66,str(d),2.6)
lines(249,51,['Hole X: -30, -15, 0, 15, 30. Hole Y: +6.',
 'Verify the 12.4 bore with the motor pilot.'],2.9,5)
text(25,35,'Motor source: pololu.com/product/4752. R03 carrier follows the JD-03 R02 interface.',2.8)
finish()

frame(4,'Assembly stack and bench support','Side view scale 1:2 / lateral stack schematic / read the assembly notes before power')
text(20,236,'BENCH SUPPORT / SIDE VIEW',3.0,True)
ox,oy,s=85,159,.5
side_shape(ox,oy,s)
C.setFillColor(HexColor('#ead9bc')); stroke()
C.rect(ox-80*s,oy-200*s,54*s,300*s,fill=1,stroke=1)
for z in (10,80): C.circle(ox-43*s,oy+z*s,2.25*s,fill=0,stroke=1)
C.rect(ox-100*s,oy-218*s,280*s,18*s,fill=1,stroke=1)
ax=ox+55*s; az=oy-95.2628*s
C.setStrokeColor(ORANGE);C.setLineWidth(2.5)
C.line(ox,oy,ax,az);C.line(ox,oy+40*s,ax,az+40*s)
stroke();C.line(ax,az,ax,az+40*s); C.circle(ax+25*s,az,50*s,fill=0,stroke=1)
dim(27,oy-200*s,27,oy,'200');dim(ox-43*s-8,oy+10*s,ox-43*s-8,oy+80*s,'70')
text(128,218,'Body on two uprights',2.9)
text(128,210,'Bolt through the side holes.',2.9)
text(128,202,'Near upright: depth 6 to 24.',2.9)
text(128,194,'Far upright: depth -159 to -141.',2.9)
lines(20,43,['Fixture: base 280 x 230 x 18, two uprights 54 x 300 x 18.',
 'Use rigid wood cleats at both upright feet. Clamp the base to the bench.'],2.9,5)

text(222,228,'LATERAL STACK / OUTWARD FROM THE NEAR BODY',3.4,True)
table(221,217,[62,32,102],[['ITEM','DEPTH','ASSEMBLY NOTE'],
 ['Body side','0 to 6','Lower and upper fixed pivots'],
 ['Lower body spacer','6 to 8','2 mm'],['Lower link','8 to 13','New lock link'],
 ['Upper body spacer','6 to 18','12 mm'],['Upper link','18 to 23','R01 geometry'],
 ['Lower carrier spacer','13 to 25','12 mm'],['Upper carrier spacer','23 to 25','2 mm'],
 ['Carrier','25 to 31','Motor face at 25'],['Motor pilot','25 to 31','6 mm projection'],
 ['Shaft','31 to 47','6 mm nominal diameter'],['Adapter envelope','34 to 46','Pololu 2674, metal part'],
 ['Wheel envelope','35.5 to 59.5','100 x 24. Seat depth unmeasured.']],6)
text(222,132,'FASTENER AND FIT CONDITIONS',3.4,True)
lines(222,123,[
 'Use 16 M4 bolts, washers and nuts for the eight deck angles.',
 'Use M4 x 16, 3.2 mm plain nuts and 0.5 mm washers. Check both bolt paths.',
 'Use four M4 body-to-upright bolts. M4 x 35 is a draft length.',
 'Use four M4 pivots and one removable M4 neutral lock fastener.',
 'Select pivot lengths against the assembled stack and retained hardware.',
 'Keep lower body pivot and lock hardware below depth 18.',
 'Put low-profile carrier bolt heads outboard. Target at least 1 mm tire clearance.',
 'Fit motor screws for 2 to 3 mm thread engagement. Never exceed 3 mm.',
 'Keep the wheel above the base. Do not apply body weight to the motor shaft.',
 'The 3 mm adapter offset is an axial gap, not a printed thrust spacer.',
 'Add a loose catch strap to the carrier before the neutral lock is removed.',
 'Check wires, fasteners and the actual tire through the complete hand sweep.',
 'The bench supply replaces the battery for this stage.',
 'Verify the return-energy path before powered deceleration or load trials.'
],2.9,5.4)
text(222,40,'Read README.md for print order, assembly steps and open interfaces.',3,True)
finish(); C.save()
print('Created four 17 x 11 inch drawing sheets.')
