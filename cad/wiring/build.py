#!/usr/bin/env python3
"""Rebuild the source-checked V1-PROOF wiring sheets (standard library only).

Functional blocks are not invented connector layouts. Only Pico, SparkFun IMU
and Pololu carrier pad arrangements are presented as component-side views.
"""
from pathlib import Path
from html import escape
import json

HERE = Path(__file__).resolve().parent
W, H = 1680, 1120
C = dict(ink='#20343e', muted='#647780', line='#ced8d7', paper='#f7f5ee',
         red='#db5a4a', orange='#c77822', purple='#8260a9', cyan='#218ca0',
         blue='#437fb4', yellow='#bd9221', ground='#52676d', green='#387b65', white='#fffef9')
PIN = {0:1,1:2,2:4,3:5,4:6,5:7,6:9,7:10,8:11,9:12,10:14,11:15,
       12:16,13:17,14:19,15:20,16:21,17:22,18:24,19:25,20:26,21:27,
       22:29,26:31,27:32,28:34}
FUNCTION = {0:'Manual TX (optional)',1:'Manual RX (optional)',2:'Left encoder A',3:'Left encoder B',
            4:'Right encoder A',5:'Right encoder B',6:'Left EN / PWM',7:'Left PH / direction',
            8:'Right EN / PWM',9:'Right PH / direction',10:'Wheel enable request',11:'Left FAULT',
            12:'SPI1 MISO',13:'SPI1 chip select',14:'SPI1 clock',15:'SPI1 MOSI',16:'IMU INT1 / DRDY',
            17:'Servo bus direction',18:'Right FAULT',19:'Deliberate arm input',20:'UART1 servo TX',
            21:'UART1 servo RX',22:'Watchdog heartbeat',26:'Left CS via conditioning',
            27:'Right CS via conditioning',28:'Pack voltage via divider'}

class Sheet:
    def __init__(self, number, name, subtitle, width=W, height=H):
        self.number, self.name = number, name
        self.width,self.height=width,height
        self.p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
                  f'<title id="title">Hux V1-PROOF {escape(name)}</title><desc id="desc">{escape(subtitle)} Source-checked planning drawing; proposed harnesses and unresolved interfaces require physical verification.</desc>',
                  '<defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r=".7" fill="#c9d5d1"/></pattern></defs>']
        self.rect(0,0,width,height,C['paper'])
        self.p.append(f'<rect x="32" y="32" width="{width-64}" height="{height-64}" fill="url(#grid)" stroke="{C["line"]}"/>')
        self.text(64,72,'HUX  /  V1-PROOF  /  ELECTRICAL',13,C['green'],700,spacing=2)
        self.text(64,119,name,38,C['ink'],700)
        self.text(64,150,subtitle,16,C['muted'])
        self.rect(width-330,58,266,58,'#ece7d7',8)
        self.text(width-197,82,'SOURCE-CHECKED PLAN',12,C['ink'],700,'middle',1)
        self.text(width-197,103,'HARNESS / BENCH RELEASE OPEN',10,C['muted'],500,'middle',1)
        self.line([(64,174),(width-64,174)],C['line'],1)
        self.line([(64,height-90),(width-64,height-90)],C['line'],1)
        self.text(64,height-60,'Rev B  |  04 OCT 2026  |  Vendor pinouts + proposed Hux circuits',12,C['muted'])
        self.text(64,height-38,'See docs/wiring-atlas.md and the wire register for sources and open circuit decisions.',11,C['muted'])
        self.text(width-66,height-56,number,25,C['green'],700,'end')
    def rect(self,x,y,w,h,fill=None,r=0,stroke=None,dash=False):
        self.p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill or C["white"]}" stroke="{stroke or C["line"]}" stroke-width="1.4"'+(' stroke-dasharray="7 5"' if dash else '')+'/>')
    def text(self,x,y,t,size=16,color=None,weight=400,anchor='start',spacing=0):
        self.p.append(f'<text x="{x}" y="{y}" font-family="Arial,Helvetica,sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" letter-spacing="{spacing}" fill="{color or C["ink"]}">{escape(str(t))}</text>')
    def line(self,points,color=None,width=3,dash=False):
        self.p.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="none" stroke="{color or C["cyan"]}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"'+(' stroke-dasharray="7 5"' if dash else '')+'/>')
    def dot(self,x,y,color=None,r=4):
        self.p.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color or C["cyan"]}"/>')
    def port(self,x,y,color):
        self.p.append(f'<circle cx="{x}" cy="{y}" r="5" fill="{C["white"]}" stroke="{color}" stroke-width="2.5"/>')
    def label(self,x,y,t,color=None,size=13):
        self.rect(x-6,y-size-2,len(t)*size*.55+12,size+9,C['paper'],3,C['paper'])
        self.text(x,y,t,size,color or C['muted'],600)
    def card(self,x,y,w,h,kicker,title,lines=(),color=None,pending=False):
        color=color or C['green']
        self.rect(x,y,w,h,C['white'],10,C['line'],pending)
        self.rect(x,y,6,h,color,3,color)
        self.text(x+22,y+26,kicker,11,color,700,spacing=1)
        self.text(x+22,y+56,title,22,C['ink'],700)
        for i,t in enumerate(lines): self.text(x+22,y+82+i*23,t,14,C['muted'])
    def ground(self,x,y):
        self.line([(x,y),(x,y+14)],C['ground'],2.5)
        for yy,ww in [(14,20),(20,13),(26,5)]: self.line([(x-ww/2,y+yy),(x+ww/2,y+yy)],C['ground'],2.5)
    def note(self,x,y,w,kicker,lines,color=None):
        self.card(x,y,w,58+len(lines)*23,kicker, '',[],color or C['orange'])
        for i,t in enumerate(lines): self.text(x+22,y+55+i*23,t,14,C['muted'])
    def save(self,stem):
        path=HERE/f'{stem}.svg'
        path.write_text('\n'.join(self.p)+ '\n</svg>\n')
        return path

def overview():
    s=Sheet('EL-01','Wiring overview','A four-actuator architecture with separate power, sensing and hardware enable paths.')
    s.card(64,207,410,113,'POWER / PROPOSED PACK','3S battery', ['Up to 12.6 V charged; pack / charger TBD'],C['red'],True)
    s.card(64,357,410,94,'PROTECTION / VALUES TBD','Main fuse + distribution',[],C['red'],True)
    s.card(64,508,410,113,'PHYSICAL CUT / CIRCUIT TBD','Actuator power cut',['Opens wheel + servo positive supply'],C['red'],True)
    s.card(64,693,410,126,'LOGIC BRANCH / CIRCUIT TBD','5 V regulator + power ORing',['Feeds Pico VSYS and both encoders','USB / external-power isolation required'],C['orange'],True)
    s.card(64,878,410,123,'SERVO BRANCH / CIRCUIT TBD','Regulated + protected 9 V',['About 6 A short-peak sizing target','Return-energy handling to be qualified'],C['purple'],True)
    s.card(642,207,420,120,'RECEIVED / UNTESTED','SparkFun LSM6DSO',['3.3 V • main SPI • INT1 data-ready','Open address jumper for SPI  [EL-02]'])
    s.card(642,407,420,220,'RECEIVED / UNTESTED','Raspberry Pi Pico 2',[
        '3.3 V GPIO; proposed allocation [EL-02]','SPI1 sensor / encoder feedback',
        'PWM + direction / current + fault inputs','USB commands + logs; 250 ms deadman',
        'Balance firmware remains unimplemented'])
    s.card(642,702,420,103,'HARDWARE ENABLE / CIRCUIT TBD','Watchdog + kill gate',['GP10 request AND healthy watchdog / cut'],C['red'],True)
    s.card(642,878,420,123,'SERVO INTERFACE / PART TBD','Half-duplex TTL interface',['UART1 TX / RX + GP17 direction','3.3 V MCU side; verify bus logic levels'],C['cyan'],True)
    for y,side,pins in [(207,'Left','GP6 / 7 • FAULT GP11 • CS GP26'),(475,'Right','GP8 / 9 • FAULT GP18 • CS GP27')]:
        s.card(1210,y,406,194,'WHEEL CHANNEL / EL-03',side+' DRV8874 → 4752',[
            pins,'Motor red → OUT1; black → OUT2',
            '5 V encoder → level shift → Pico',
            'Left GP2 / 3; right GP4 / 5'],C['blue'])
    s.card(1210,878,406,123,'LEG ACTUATORS / EL-04','2 × ST3215, 12 V variant',[
        'Qualify holding performance at 9 V','Unique bus IDs; arrival unreported'],C['purple'])
    # Rails. Each junction dot represents an actual branch; line crossings do not.
    s.line([(270,320),(270,357)],C['red'],5)
    s.line([(270,451),(270,508)],C['red'],5)
    s.line([(474,402),(517,402),(517,748),(474,748)],C['orange'],4)
    s.dot(474,402,C['red'])
    s.line([(474,563),(563,563),(563,372),(1180,372),(1180,294),(1210,294)],C['red'],5)
    s.line([(1180,372),(1180,565),(1210,565)],C['red'],5);s.dot(1180,372,C['red'])
    s.line([(563,563),(563,937),(474,937)],C['red'],5);s.dot(563,563,C['red'])
    s.label(599,365,'SWITCHED ACTUATOR BUS',C['red'])
    s.line([(474,787),(605,787),(605,563),(642,563)],C['orange'],4)
    s.label(526,670,'VSYS p39',C['orange'],12)
    s.line([(852,327),(852,407)],C['cyan'],4);s.label(866,365,'SPI + INT1',C['cyan'])
    s.line([(1062,472),(1104,472),(1104,254),(1210,254)],C['cyan'],3)
    s.line([(1104,472),(1104,522),(1210,522)],C['cyan'],3);s.dot(1104,472)
    s.label(1077,433,'I/O',C['cyan'])
    s.line([(830,627),(830,702)],C['red'],3);s.label(847,668,'GP10 / GP22',C['red'])
    s.line([(1062,754),(1144,754),(1144,333),(1210,333)],C['red'],3,True)
    s.line([(1144,603),(1210,603)],C['red'],3,True);s.dot(1144,603,C['red'])
    s.label(1108,686,'SLEEP',C['red'])
    # UART originates at the Pico. Offset path avoids the enable gate.
    s.line([(1062,610),(1090,610),(1090,749)],C['cyan'],3)
    s.line([(1090,759),(1090,851),(1027,851),(1027,878)],C['cyan'],3)
    s.label(863,848,'UART1 / GP17',C['cyan'])
    s.line([(1062,928),(1210,928)],C['cyan'],3);s.label(1078,916,'TTL DATA',C['cyan'],12)
    s.line([(474,975),(593,975),(593,1010),(1178,1010),(1178,972),(1210,972)],C['purple'],4)
    s.label(783,1001,'PROTECTED 9 V SERVO POWER',C['purple'])
    s.note(1210,714,406,'READING THE SHEET',[
        'Links marked I/O bundle multiple wires.',
        'All GND returns share a common reference.',
        'Dots join wires; crossings do not.',
        'Dashed blocks need a selected circuit.'])
    return s.save('v1-proof-el-01-overview')

def pico_imu():
    s=Sheet('EL-02','Pico 2 + IMU connections','Component-side views, USB at the top of the Pico. Physical pins and GPIO numbers are distinct.')
    # Actual 40-pin Pico top view. Left p1->20, right p40->21.
    s.rect(220,246,290,704,'#2e6756',13,'#245445')
    s.rect(328,228,74,47,'#bac8c7',5,'#7f9391')
    s.text(365,294,'USB',13,'#f6f9ec',700,'middle')
    s.rect(303,548,123,92,'#26343d',6,'#26343d')
    s.text(365,589,'RP2350',16,'#f6f9ec',700,'middle')
    s.text(365,617,'PICO 2',12,'#c6d5d0',600,'middle')
    s.text(365,912,'TOP VIEW',12,'#d7e4d8',600,'middle',1)
    left=[0,1,'GND',2,3,4,5,'GND',6,7,8,9,'GND',10,11,12,13,'GND',14,15]
    right=['VBUS','VSYS','GND','3V3_EN','3V3(OUT)','ADC_VREF',28,'AGND',27,26,'RUN',22,'GND',21,20,19,18,'GND',17,16]
    for bank,items in [('L',left),('R',right)]:
        for i,item in enumerate(items):
            y=264+i*35;num=i+1 if bank=='L' else 40-i
            gp=isinstance(item,int);name=f'GP{item}' if gp else item
            col=C['cyan'] if gp else C['ground']
            if item in ['3V3(OUT)']:col=C['purple']
            if item=='VSYS':col=C['orange']
            x=237.5 if bank=='L' else 492.5
            s.rect(x-6,y-7,12,14,'#dbc577',2,'#e8d895')
            s.dot(x,y,C['ink'],2)
            s.text(257 if bank=='L' else 473,y+4,num,11,'#f5f7e8',600,'start' if bank=='L' else 'end')
            s.text(207 if bank=='L' else 531,y+5,name,14,col,700,'end' if bank=='L' else 'start')
    s.text(64,217,'PHYSICAL PIN MAP',12,C['green'],700,spacing=1)
    s.text(64,990,'p1 is upper left; p40 is upper right.',14,C['muted'])
    s.text(642,217,'SEVEN-WIRE SENSOR HARNESS',12,C['green'],700,spacing=1)
    # Main IMU pads in a correct 90-degree clockwise top view.
    s.rect(1240,300,360,360,'#bb343e',8,'#9d2932')
    s.rect(1374,282,92,38,'#e5dfd4',4,'#b4aca1');s.rect(1374,641,92,38,'#e5dfd4',4,'#b4aca1')
    s.text(1420,308,'QWIIC',10,'#3a4141',700,'middle');s.text(1420,666,'QWIIC',10,'#3a4141',700,'middle')
    s.rect(1373,443,94,82,'#26343d',5,'#26343d')
    s.text(1420,473,'LSM6',13,'#f5f5ed',700,'middle');s.text(1420,495,'DSO',13,'#f5f5ed',700,'middle')
    s.text(1420,618,'SEN-18020',14,'#fff6e9',700,'middle')
    main=['GND','3V3','SDA / SDI','SCL','SDO','CS']
    aux=['INT2','INT1','OCS','SCX','SDIX','SDOX']
    rows=[('GND p18','GND',C['ground']),('3V3(OUT) p36','3V3',C['purple']),
          ('GP15 p20 · MOSI','SDA / SDI',C['cyan']),('GP14 p19 · SCK','SCL',C['blue']),
          ('GP12 p16 · MISO','SDO',C['green']),('GP13 p17 · CS','CS',C['orange'])]
    for i,(pico,imu,col) in enumerate(rows):
        y=390+i*36
        s.rect(650,y-16,402,31,C['white'],5)
        s.text(670,y+5,pico,17,C['ink'],600)
        s.line([(1052,y),(1258,y)],col,4);s.port(1052,y,col)
        s.rect(1252,y-6,12,12,'#ebc976',2,'#ebc976');s.dot(1258,y,C['ink'],2)
        s.text(1270,y+5,main[i],13,'#fff6e9',600)
        s.rect(1576,y-6,12,12,'#ebc976',2,'#ebc976');s.dot(1582,y,C['ink'],2)
        s.text(1563,y+5,aux[i],12,'#fff6e9',600,'end')
    s.rect(650,709,402,43,C['white'],5);s.text(670,737,'GP16 p21 · INT1 / DRDY',17,C['ink'],600)
    s.line([(1052,731),(1620,731),(1620,426),(1582,426)],C['yellow'],4)
    s.port(1052,731,C['yellow']);s.port(1582,426,C['yellow'])
    s.text(1240,259,'SPARKFUN / COMPONENT SIDE',12,C['green'],700,spacing=1)
    s.text(1240,282,'Rotated 90° clockwise from vendor view',13,C['muted'])
    s.note(642,805,974,'SPI JUMPER SETUP / CHECK RECEIVED BOARD',[
        'Open the 0x6B / 0x6A address jumper so SDO can drive MISO.',
        'Recommended: open both I2C pull-up traces. Keep SCX / SDIX ground jumpers intact.',
        'Qwiic sockets carry I2C and are unused here. Wire the main SPI pads, not SCX / SDIX.',
        'Power and signal logic are 3.3 V. Inspect board revision and check sensor identity before use.'])
    return s.save('v1-proof-el-02-pico-imu')

def wheel():
    s=Sheet('EL-03','Wheel motor + encoder harness','One channel shown; repeat for the other wheel using the assignment table. Colors match the motor leads.')
    s.card(64,212,434,114,'PICO / PROPOSED OUTPUTS','3.3 V command signals',['Use the left / right GPIO table below.'],C['cyan'])
    # Precise physical top view of the 4035 carrier.
    s.rect(663,246,292,337,'#254d78',8,'#254d78')
    s.text(809,222,'POLOLU 4035 / TOP VIEW',12,C['blue'],700,'middle',1)
    s.rect(778,354,65,102,'#253442',3,'#253442')
    s.text(811,393,'DRV',11,'#e5edf2',700,'middle');s.text(811,413,'8874',11,'#e5edf2',700,'middle')
    left=['VM','GND','EN / IN1','PH / IN2','PMODE','SLEEP','VREF']
    right=['VIN','GND','OUT1','OUT2','IMODE','FAULT','CS']
    for i in range(7):
        y=279+i*44
        for x,label,anchor,tx in [(678,left[i],'start',693),(940,right[i],'end',925)]:
            s.rect(x-5,y-6,10,12,'#dfce85',2,'#dfce85')
            s.text(tx,y+4,label,12,'#f0f4ee',600,anchor)
    for y,label in [(367,'EN / PWM'),(411,'PH / direction'),(499,'Gated SLEEP')]:
        s.text(86,y+5,label,17,C['cyan'],600)
        s.line([(296,y),(678,y)],C['red'] if 'SLEEP' in label else C['cyan'],3)
        s.port(296,y,C['red'] if 'SLEEP' in label else C['cyan'])
    s.text(521,263,'VM: leave unused',12,C['muted'])
    s.line([(678,279),(570,279)],C['muted'],2)
    for x,y in [(678,323),(940,323)]:s.line([(x,y),(634 if x==678 else 984,y)],C['ground'],3);s.ground(634 if x==678 else 984,y)
    s.line([(678,455),(598,455)],C['ground'],3);s.ground(598,455)
    s.line([(940,455),(1024,455)],C['ground'],3);s.ground(1024,455)
    s.text(503,608,'PMODE + IMODE directly to GND',14,C['ground'],700)
    s.line([(940,279),(1123,279),(1123,221)],C['red'],5)
    s.label(1137,247,'Switched bus +',C['red'])
    s.card(1232,320,384,163,'POLOLU 4752 / MOTOR LEADS','12 V, 30:1 gearmotor',[
        'RED lead  →  OUT1','BLACK lead  →  OUT2','Both motor leads are switched.'],C['blue'])
    s.line([(940,367),(1232,367)],C['red'],5)
    s.line([(940,411),(1232,411)],C['ink'],5)
    s.label(1038,355,'RED',C['red']);s.label(1038,399,'BLACK ≠ GND',C['ink'])
    s.line([(940,499),(1086,499),(1086,610),(1232,610)],C['yellow'],3)
    s.card(1232,533,384,135,'FAULT / CURRENT INPUTS','Return to Pico via protection',[
        'FAULT → GP11 / GP18; 3.3 V pull-ups','CS → GP26 / GP27 via protection TBD','Latch faults; deliberate rearm required.'],C['yellow'],True)
    s.line([(940,543),(1062,543),(1062,644),(1232,644)],C['blue'],3)
    s.line([(678,543),(542,543),(542,638)],C['orange'],3)
    s.rect(498,638,463,38,C['white'],5,C['orange'],True)
    s.text(518,662,'VREF network TBD: set + measure 2.5 A peak',13,C['orange'],600)
    # Separate encoder sub-harness, functional wire order; not a connector view.
    s.card(1232,715,384,228,'4752 / ENCODER LEADS','Four-wire feedback harness',[
        'GREEN  →  common GND','BLUE  →  regulated 5 V',
        'YELLOW  →  channel A','WHITE  →  channel B',
        'Connector orientation: verify by color.'],C['green'])
    s.card(649,731,414,196,'REQUIRED INTERFACE / PART TBD','5 V → 3.3 V level conversion',[
        'Four input channels for both wheels','Use a translator suitable for push-pull',
        'quadrature outputs; check power-off state.','No direct 5 V signals into Pico GPIO.'],C['green'],True)
    s.line([(1090,797),(1232,797)],C['green'],3);s.port(1090,797,C['green'])
    s.label(1092,785,'GND / GREEN',C['green'],12)
    s.line([(1090,820),(1232,820)],C['blue'],3);s.port(1090,820,C['blue'])
    s.label(1092,811,'5 V / BLUE',C['blue'],12)
    for y,label,col in [(851,'A / YELLOW',C['yellow']),(891,'B / WHITE',C['ground'])]:
        s.line([(1232,y),(1063,y)],col,5 if 'WHITE' in label else 3)
        if 'WHITE' in label:s.line([(1232,y),(1063,y)],C['white'],2.7)
        s.label(1092,y-10,label,col,12)
    s.line([(649,799),(498,799)],C['cyan'],3);s.line([(649,834),(498,834)],C['cyan'],3)
    s.card(64,684,434,283,'PICO / LEFT AND RIGHT CHANNELS','Proposed pin assignments',[],C['cyan'])
    s.text(86,779,'Function',14,C['muted'],600);s.text(256,779,'Left',14,C['muted'],600);s.text(369,779,'Right',14,C['muted'],600)
    rows=[('Encoder A',2,4),('Encoder B',3,5),('EN / PH',6,8),('FAULT',11,18),('CS / ADC',26,27)]
    for i,(name,l,r) in enumerate(rows):
        y=810+i*29
        s.text(86,y,name,14)
        lv=f'{l}/{l+1}' if name=='EN / PH' else str(l)
        rv=f'{r}/{r+1}' if name=='EN / PH' else str(r)
        s.text(256,y,'GP'+lv,14,C['cyan'],600);s.text(369,y,'GP'+rv,14,C['cyan'],600)
    s.text(649,979,'EN low = brake. SLEEP low = outputs off / coast.',15,C['red'],700)
    s.text(649,1002,'2.5 A peak / 1.2 A RMS are Hux qualification targets, not tested settings.',13,C['muted'])
    return s.save('v1-proof-el-03-wheel-harness')

def power_servo():
    s=Sheet('EL-04','Power distribution + servo bus','Functional interface drawing: regulator, clamp, fuse, enable-gate and bus-adapter circuits remain to select.')
    # Compact top power chain with branch nodes and common return.
    s.card(64,216,290,108,'BATTERY / UNCONFIRMED','3S pack',['Up to 12.6 V charged'],C['red'],True)
    s.card(416,216,285,108,'PROTECTION / TBD','Main fuse',['Fuse / wire / connector sizing'],C['red'],True)
    s.card(833,216,360,108,'PHYSICAL CUT / TBD','Actuator power cut',['Opens positive feed to all actuators'],C['red'],True)
    s.card(1281,216,335,108,'WHEELS / ×2','DRV8874 VIN',['Use VIN; VM is protected bus access'],C['red'])
    for a,b in [(354,416),(701,833),(1193,1281)]:s.line([(a,270),(b,270)],C['red'],5)
    s.dot(756,270,C['red']);s.dot(1234,270,C['red'])
    s.card(64,400,440,125,'UNSWITCHED LOGIC BRANCH / TBD','Protected 5 V regulator',[
        'Branch protection + return-energy handling','Feeds both encoder BLUE leads at 5 V'],C['orange'],True)
    s.line([(756,270),(756,367),(284,367),(284,400)],C['orange'],4)
    s.card(64,605,440,127,'USB + EXTERNAL POWER / TBD','Schottky diode / power ORing',[
        'External 5 V → isolation → VSYS p39','Check loaded voltage and USB backfeed'],C['orange'],True)
    s.line([(284,525),(284,605)],C['orange'],4)
    s.card(644,605,447,127,'CONTROLLER / LOGIC ONLY','Pico 2 power + ADC',[
        '3V3(OUT) p36 → IMU + interface logic','GP28 p34 ← protected pack divider'],C['cyan'])
    s.line([(504,669),(644,669)],C['orange'],4);s.label(531,654,'VSYS p39',C['orange'],12)
    s.card(1281,400,335,148,'SWITCHED SERVO BRANCH / TBD','9 V regulator + protection',[
        'About 6 A short-peak sizing target','Define an energy sink / clamp','Qualify voltage / heat at load.'],C['purple'],True)
    s.line([(1234,270),(1234,365),(1448,365),(1448,400)],C['red'],4)
    s.card(1281,638,335,217,'TWO ST3215 / 12 V VARIANT','Shared half-duplex bus',[
        'Supply: protected regulated 9 V','GND: common return','DATA: single TTL bus',
        'Assign different servo IDs.','Confirm cable contact order.'],C['purple'])
    s.line([(1448,548),(1448,638)],C['purple'],4);s.label(1462,590,'9 V',C['purple'])
    s.card(644,803,447,144,'SERVO INTERFACE / ADAPTER TBD','3.3 V-compatible transceiver',[
        'GP20 p26 TX → interface TX input','GP21 p27 RX ← interface RX output','GP17 p22 → direction (if supported)'],C['cyan'],True)
    s.line([(868,732),(868,803)],C['cyan'],3)
    s.line([(1091,876),(1188,876),(1188,755),(1281,755)],C['cyan'],3)
    s.label(1120,909,'TTL DATA',C['cyan'])
    s.note(64,803,440,'ENABLE + WATCHDOG BOUNDARY',[
        'GP10 p14 + GP22 p29 → hardware gate',
        'Gate output → BOTH wheel SLEEP pins.',
        'Servo torque-cut circuit: proposed in EL-01.',
        'Physical cut must remove wheel + servo power.'],C['red'])
    # Common reference drawn as a functional bus, with distinct return branches.
    s.line([(84,988),(1594,988)],C['ground'],4)
    for x,y in [(310,324),(1594,324),(483,525),(1080,732),(1594,855),(1080,947)]:
        s.ground(x,y)
    s.label(1177,982,'COMMON GND / RETURNS',C['ground'],13)
    s.text(64,1012,'All GND symbols join this reference. Route high-current returns away from sensor / MCU wiring.',13,C['muted'])
    s.note(833,391,360,'MEASUREMENT INTERFACES / TBD',[
        'Pack divider + ADC protection → GP28.',
        'Both CS inputs need ADC protection.',
        'Check input range and power-off injection.'])
    return s.save('v1-proof-el-04-power-servo')

def netlist():
    # Every GPIO endpoint is allocated once. Physical pin labels derive from PIN.
    endpoints = [dict(gpio=g,physical_pin=PIN[g],function=f) for g,f in FUNCTION.items()]
    assert len({x['physical_pin'] for x in endpoints})==len(endpoints)
    assert [PIN[x] for x in (12,13,14,15,16)]==[16,17,19,20,21]
    assert [PIN[x] for x in (20,21,26,27,28)]==[26,27,31,32,34]
    data=dict(revision='B',source_checked='2026-10-04',status='build-planning; physical verification pending',
              pico_endpoints=endpoints,
              imu=[dict(pico='GND p18',pad='GND'),dict(pico='3V3(OUT) p36',pad='3V3'),
                   *[dict(gpio=g,physical_pin=PIN[g],pad=p) for g,p in [(15,'SDA/SDI'),(14,'SCL'),(12,'SDO'),(13,'CS'),(16,'INT1')]]],
              motor_leads={'red':'DRV8874 OUT1','black':'DRV8874 OUT2 (switched, not GND)',
                           'green':'common GND','blue':'regulated 5 V','yellow':'encoder A via 5 V to 3.3 V conversion','white':'encoder B via 5 V to 3.3 V conversion'},
              unresolved=['Regulators and return-energy protection','Fuse and conductor sizing','Encoder translator',
                          'Servo bus interface and cable pinout','Hardware watchdog / kill implementation',
                          'ADC conditioning and protection','Received component revisions and harness orientation'])
    (HERE/'v1-proof-netlist.json').write_text(json.dumps(data,indent=2)+'\n')

if __name__=='__main__':
    netlist()
    pico_imu();wheel();power_servo()
    from complete import full_system, both_wheels, register
    master=full_system()
    both_wheels()
    register(master)
    print('Built five SVG sheets and the complete conductor register.')
