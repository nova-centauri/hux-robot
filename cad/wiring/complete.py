"""Individual-conductor drawings. Electrical terminal symbols are functional
views, not invented connector face views. Every harness wire has two recorded
endpoints; power rails and junctions are explicit graph nodes.

Rev C (2026-10-17): EL-01 places each board where it mounts in the R05 body
(rear elevation, robot LEFT = near wall at the left of the sheet). Ports are
connector positions from harness.py. EL-06 and EL-07 give the run lengths and
the connector loading. The kill chain follows docs/kill-chain.md and
firmware/bench/src/pins.h. The servo branch is out of V1-PROOF.
"""
import json
import xml.etree.ElementTree as ET
from html import escape
from build import Sheet, C, PIN, HERE
import harness as HX

def intersections(a,b,c,d):
    """Closed-segment intersections for orthogonal conductors."""
    horizontal=a[1]==b[1];other_horizontal=c[1]==d[1]
    if horizontal != other_horizontal:
        h1,h2,v1,v2=(a,b,c,d) if horizontal else (c,d,a,b)
        p=(v1[0],h1[1])
        return [p] if min(h1[0],h2[0])<=p[0]<=max(h1[0],h2[0]) and min(v1[1],v2[1])<=p[1]<=max(v1[1],v2[1]) else []
    axis=0 if horizontal else 1;fixed=1-axis
    if a[fixed]!=c[fixed]:return []
    lo=max(min(a[axis],b[axis]),min(c[axis],d[axis]));hi=min(max(a[axis],b[axis]),max(c[axis],d[axis]))
    if lo>hi:return []
    return [(lo,a[1]),(hi,a[1])] if horizontal else [(a[0],lo),(a[0],hi)]

class Circuit:
    def __init__(self,number,title,subtitle,width=3200,height=2400,show_ids=True):
        self.s=Sheet(number,title,subtitle,width,height,tabloid=True)
        self.header=list(self.s.p); self.s.p=[]
        self.parts={};self.ports={};self.wires=[];self.nodes={};self.show_ids=show_ids;self.nc=set()
    def zone(self,x,y,w,h,fill,label=None,color=None,sub=None):
        """Background band: a mount location, not a component. Header items
        are not reflowed, so the band takes the reflowed coordinates here."""
        Y=self.s.layout_y;y1=Y(y);y2=Y(y+h)
        self.header.append(f'<rect x="{x}" y="{y1}" width="{w}" height="{round(y2-y1,3)}" rx="6" fill="{fill}" stroke="none"/>')
        if label:self.header.append(f'<text x="{x+14}" y="{Y(y+20)}" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="700" letter-spacing="1" fill="{color or C["muted"]}">{escape(label)}</text>')
        if sub:self.header.append(f'<text x="{x+14}" y="{Y(y+44)}" font-family="Arial,Helvetica,sans-serif" font-size="15" fill="{C["muted"]}">{escape(sub)}</text>')
    def box(self,ref,x,y,w,h,title,sub='',pending=False,color=None,header=True,sub_bottom=False,lines=(),line_y=None,line_x=None,line_size=16):
        self.parts[ref]=dict(ref=ref,title=title,rect=[x,y,w,h],pending=pending)
        self.s.rect(x,y,w,h,C['white'],8,color or C['line'],pending)
        if header:
            heading=ref+' / '+title
            compact=h<=180
            font=min(22 if not compact else 20,(w-36)/(len(heading)*.55))
            self.s.text(x+18,y+(20 if compact else 30),heading,font,color or C['ink'],700)
            if sub:self.s.text(x+18,y+(h-15 if compact else h-25 if sub_bottom else 57),sub,min(18,(w-36)/(len(sub)*.51)),C['muted'])
        for i,t in enumerate(lines):self.s.text(line_x or x+18,(line_y or y+90)+i*(line_size+8),t,line_size,C['muted'])
    def port(self,ref,pin,x,y,label=None,side='left',color=None,gpio=None,label_offset=6,nc=False,size=20):
        key=ref+'.'+pin
        assert key not in self.ports,key
        self.ports[key]=dict(component=ref,pin=pin,position=[x,y],label=label or pin)
        if gpio is not None:self.ports[key].update(gpio=gpio,physical_pin=PIN[gpio])
        if nc:self.nc.add(key);self.ports[key]['nc']=True
        col=color or (C['line'] if nc else C['cyan'])
        self.s.port(x,y,col)
        tcol=C['muted'] if nc else (color or C['ink'])
        if side=='left':self.s.text(x+14,y+label_offset,label or pin,size,tcol,600)
        elif side=='right':self.s.text(x-14,y+label_offset,label or pin,size,tcol,600,'end')
        elif side=='top':self.s.text(x+12,y-12,label or pin,min(size,17),tcol,600)
        elif side=='bottom':self.s.text(x-12,y+24,label or pin,min(size,17),tcol,600,'end')
        return key
    def node(self,key,x,y,net):
        if key in self.ports:assert self.ports[key]['position']==[x,y]
        else:self.ports[key]=dict(component='Junction',pin=key,position=[x,y],label=key,net=net)
        self.nodes[key]=net
        return key
    def wire(self,a,b,net,via=(),color=None,label=True,awg=None,bundle=None):
        assert a in self.ports and b in self.ports,(a,b)
        pts=[self.ports[a]['position'],*[list(p) for p in via],self.ports[b]['position']]
        pts=[p for i,p in enumerate(pts) if not i or p!=pts[i-1]]
        assert all(x1==x2 or y1==y2 for (x1,y1),(x2,y2) in zip(pts,pts[1:])),(a,b,pts)
        wid=f'W{len(self.wires)+1:03d}'
        self.wires.append(dict(id=wid,source=a,destination=b,net=net,color=color or C['cyan'],route=pts,show_id=label,awg=awg,bundle=bundle))
        return wid
    def resistor(self,ref,x,y,value,vertical=True,pending=False,label_side='right',label_offsets=(22,49)):
        self.parts[ref]=dict(ref=ref,title=value,rect=[x-8,y,16,46],pending=pending)
        self.s.rect(x-8,y,16,46,C['white'],0,C['ink'],pending)
        label_x=x-15 if label_side=='left' else x+15
        anchor='end' if label_side=='left' else 'start'
        self.s.text(label_x,y+label_offsets[0],ref,17,C['ink'],600,anchor)
        self.s.text(label_x,y+label_offsets[1],value,15,C['muted'],400,anchor)
        self.ports[ref+'.1']=dict(component=ref,pin='1',position=[x,y],label=value)
        self.ports[ref+'.2']=dict(component=ref,pin='2',position=[x,y+46],label=value)
    def finish(self,stem):
        self.validate_geometry(connected=self.show_ids)
        body=list(self.s.p);self.s.p=[]
        # Reserve space around terminal and component text for conductor IDs.
        text_bounds=[]
        for element in ET.fromstring('<g>'+''.join(body)+'</g>').iter('text'):
            size=max(18,float(element.attrib['font-size']))
            width=len(element.text or '')*size*.62
            x=float(element.attrib['x']);y=self.s.layout_y(float(element.attrib['y']))
            anchor=element.attrib.get('text-anchor','start')
            left=x-width if anchor=='end' else x-width/2 if anchor=='middle' else x
            text_bounds.append((left,y-size,left+width,y+size*.25))
        # Crossings on different nets have a visible break. Junction nodes have
        # filled dots. Break horizontal segments; never infer a junction by color.
        segments=[]
        for w in self.wires:
            for a,b in zip(w['route'],w['route'][1:]):segments.append((w,a,b))
        id_labels=[]
        for w,a,b in segments:
            x1,y1=a;x2,y2=b
            if y1==y2:
                lo,hi=sorted((x1,x2));cuts=[]
                for other,c,d in segments:
                    if other['net']==w['net'] or c[0]!=d[0]:continue
                    if lo+6<c[0]<hi-6 and min(c[1],d[1])+2<y1<max(c[1],d[1])-2:cuts.append(c[0])
                cur=lo
                for cross in sorted(set(cuts)):
                    if cross-5>cur:self.draw_line([(cur,y1),(cross-5,y1)],w)
                    cur=max(cur,cross+5)
                if cur<hi:self.draw_line([(cur,y1),(hi,y1)],w)
            else:self.draw_line([a,b],w)
        for w in self.wires:
            points=w['route'];best=max(zip(points,points[1:]),key=lambda q:abs(q[1][0]-q[0][0]))
            a,b=best
            if self.show_ids and w['show_id'] and abs(a[0]-b[0])>=105:
                x=int((a[0]+b[0])/2);y=a[1]-9
                blocked=False
                for part in self.parts.values():
                    px,py,pw,ph=part['rect']
                    if pw==16:pw+=105
                    if x+24>px-5 and x-24<px+pw+5 and y>py-5 and y-17<py+ph+5:blocked=True;break
                label_y=self.s.layout_y(y)
                if any(x+25>left-3 and x-25<right+3 and label_y+5>top-3 and label_y-18<bottom+3 for left,top,right,bottom in text_bounds):blocked=True
                if not blocked:id_labels.append((x,y,w['id'],C['ground'] if w['color']=='white' else w['color']))
        self.s.p=self.header+self.s.p+body
        junctions={(tuple(self.ports[key]['position']),net) for key,net in self.nodes.items()}
        terminal_positions={tuple(p['position']) for p in self.ports.values() if p['component']!='Junction'}
        for i,(w,a,b) in enumerate(segments):
            for other,c,e in segments[i+1:]:
                if w['id']==other['id'] or w['net']!=other['net']:continue
                for point in intersections(a,b,c,e):
                    if point not in terminal_positions:junctions.add((point,w['net']))
        for (x,y),net in sorted(junctions,key=lambda item:(item[0][1],item[0][0],item[1])):self.s.dot(x,y,C['ground'] if net=='GND' else C['ink'],4)
        for x,y,label,col in id_labels:self.s.label(x-22,y,label,col,15)
        self.s.p=self.header+[self.s.layout_body('\n'.join(self.s.p[len(self.header):]))]
        return self.s.save(stem)
    def validate_geometry(self,connected=False):
        """Check the actual drawn paths, including branch taps within a rail."""
        segments=[(i,w,a,b) for i,w in enumerate(self.wires) for a,b in zip(w['route'],w['route'][1:])]
        parent=list(range(len(self.wires)))
        def root(i):
            while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
            return i
        def join(i,j):parent[root(i)]=root(j)
        for k,(i,w,a,b) in enumerate(segments):
            for j,v,c,e in segments[k+1:]:
                points=intersections(a,b,c,e)
                if not points:continue
                if w['net']==v['net']:join(i,j);continue
                assert len(set(points))==1,(w['id'],v['id'],'different-net collinear overlap',points)
                p=list(points[0])
                assert p not in [w['route'][0],w['route'][-1],v['route'][0],v['route'][-1]],(w['id'],v['id'],'different-net endpoint touch',p)
        for w in self.wires:
            for ref,part in self.parts.items():
                x,y,width,height=part['rect']
                for a,b in zip(w['route'],w['route'][1:]):
                    crosses=(x+1<a[0]<x+width-1 and max(min(a[1],b[1]),y+1)<min(max(a[1],b[1]),y+height-1)) if a[0]==b[0] else (y+1<a[1]<y+height-1 and max(min(a[0],b[0]),x+1)<min(max(a[0],b[0]),x+width-1))
                    assert not crosses,(w['id'],'wire hidden inside component',ref)
        if connected:
            # Grounds join on the boards, not through extra external wires.
            board_ground={k for k,p in self.ports.items() if p['component']!='Junction' and p['pin'].split('.')[-1] in ('GND','AGND','USB_GND') or (p['component']!='Junction' and self.ports[k].get('net')=='GND')}
            internal=[i for i,w in enumerate(self.wires) if w['net']=='GND']
            for i in internal[1:]:join(internal[0],i)
            nets={}
            for i,w in enumerate(self.wires):nets.setdefault(w['net'],set()).add(root(i))
            bad=[(net,v) for net,v in nets.items() if len(v)>1 and net not in self.board_joined()]
            assert not bad,('disconnected drawn net',bad)
    def board_joined(self):
        """Nets that continue through a board (one board, two connectors)."""
        return {'3V3','5V','BUS','RAIL','PACK_FUSED','L_MOTOR_OUT1','L_MOTOR_OUT2','R_MOTOR_OUT1','R_MOTOR_OUT2','VSYS'}
    def draw_line(self,pts,w):
        self.s.p.append(f'<g data-wire="{w["id"]}"><title>{escape((w["id"]+": " if self.show_ids else "")+w["source"]+" → "+w["destination"]+" / "+w["net"])}</title>')
        if w['color']=='white':
            self.s.line(pts,C['ground'],5);self.s.line(pts,C['white'],2.8)
        else:self.s.line(pts,w['color'],4 if w['net'] in ['GND','5V','RAIL','BUS','PACK','PACK_FUSED'] else 2.7)
        self.s.p.append('</g>')

NETCOL={'GND':C['ground'],'AGND':C['ground'],'3V3':C['purple'],'5V':C['orange'],'VSYS':C['orange'],'BUS':C['red'],'RAIL':C['red'],'PACK':C['red'],'PACK_FUSED':C['red'],
        'L_MOTOR_OUT1':C['red'],'R_MOTOR_OUT1':C['red'],'L_MOTOR_OUT2':C['ink'],'R_MOTOR_OUT2':C['ink'],
        'L_ENC_A5':C['yellow'],'R_ENC_A5':C['yellow'],'L_ENC_B5':'white','R_ENC_B5':'white','L_ENC_A':C['yellow'],'R_ENC_A':C['yellow'],'L_ENC_B':C['green'],'R_ENC_B':C['green'],
        'HB':C['red'],'RAIL_ADC':C['orange'],'nSLEEP':C['red'],'L_FAULT':C['yellow'],'R_FAULT':C['yellow'],'L_CS':C['blue'],'R_CS':C['blue'],
        'SPI_SDO':C['green'],'SPI_CS':C['orange'],'SPI_SCL':C['blue'],'SPI_SDI':C['cyan'],'IMU_INT1':C['yellow'],'KILL_A':C['red'],'KILL_B':C['red'],'ARM_A':C['green'],'ARM_B':C['green']}

def hx_port(d,conn,pos,x,y,side,**kw):
    """Draw a connector position from the harness model. Label: 'J.n / pin'."""
    c=HX.CONNECTORS[conn];pin,net=c['load'][pos]
    short=conn.split('.',1)[1]
    label=kw.pop('label',f'{short}.{pos} / {pin}')
    gpio=None
    if pin.startswith('GP') and pin[2:].isdigit():gpio=int(pin[2:])
    color=kw.pop('color',None) or (NETCOL.get(net) if net else None)
    if color=='white':color=C['ground']
    key=d.port(conn.split('.')[0],short+'.'+str(pos),x,y,label,side,color,gpio=gpio,nc=net is None,**kw)
    d.ports[key]['connector']=conn;d.ports[key]['position_index']=pos;d.ports[key]['net']=net;d.ports[key]['pin']=pin
    return key

def hkey(end):
    """Map a harness endpoint 'BOARD.J.n' or splice to the drawing port key."""
    if end in HX.SPLICES:return end
    board,rest=end.split('.',1)
    return board+'.'+rest

def full_system():
    d=Circuit('EL-01','Complete system wiring by location','Rear elevation of the R05 body. Robot LEFT (near wall) is at the left. Each board sits where it mounts. Ports are connector positions. Every harness conductor is drawn.')
    s=d.s
    # Mount zones: decks, walls and tray as background bands. Boxes start 60 px below a band top.
    d.zone(640,240,1820,910,'#eef2ee','CTRL DECK  ·  Z +170  ·  near half: IMU  ·  far half: Pico 2',C['green'])
    d.zone(640,1180,1820,260,'#eef1f3','BUS DECK  ·  Z +120  ·  near half: power distribution  ·  far half: spare cassette position',C['blue'])
    d.zone(640,1580,1820,380,'#f3eeea','PWR DECK  ·  Z +60  ·  near half: kill chain  ·  far half: driver board',C['red'])
    d.zone(640,2050,1820,250,'#f1efe8','UNDER THE DECKS  ·  leg junction board under the PWR deck  ·  3S pack on the tray at Z −35',C['orange'])
    d.zone(64,240,536,2060,'#f4f4f1','LEFT LEG  ·  NEAR WALL SIDE',C['ink'],'fixture buttons, pack lead, left gearmotor')
    d.zone(2780,240,356,2060,'#f4f4f1','RIGHT LEG  ·  FAR WALL',C['ink'],'USB cable, right gearmotor')
    for x,t in [(622,'NEAR WALL · LEFT'),(2462,'FAR WALL · RIGHT')]:
        d.header.append(f'<rect x="{x}" y="{s.layout_y(240)}" width="16" height="{round(s.layout_y(2300)-s.layout_y(240),3)}" fill="#9fb3ad"/>')
        d.header.append(f'<text transform="translate({x+12} {s.layout_y(1270)}) rotate(-90)" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="#f7f5ee" text-anchor="middle">{t}</text>')
    s.text(2605,458,'RIGHT HARNESS TRUNK',12,C['muted'],700,'middle',1);s.text(2605,476,'down the front face of the body',12,C['muted'],400,'middle')
    s.text(1560,1300,'SPARE CASSETTE POSITION',14,C['muted'],700,spacing=1)
    s.text(1560,1323,'Was the servo bus and the encoder conversion. No board in V1-PROOF.',14,C['muted'])
    s.text(1560,1346,'The encoder dividers sit on JLEG.',14,C['muted'])
    # Legend, in the free upper part of the left lane.
    for i,(t,col,w) in enumerate([('READING THE SHEET',C['green'],700),('Wire IDs → searchable conductor register.',C['muted'],400),('Bundle cut lengths → EL-06 and the harness register.',C['muted'],400),('Port labels: connector position / pin.',C['muted'],400),('Dots connect. Gaps at crossings do not.',C['muted'],400),('Dashed boards need part selection and bench checks.',C['muted'],400),('BLACK wheel lead is switched OUT2, not ground.',C['ink'],700),('XH = JST XH 2.50 mm. XT30 = 12 V power path.',C['muted'],400),('1x6 0.1 in = the Pololu pigtail housing.',C['muted'],400)]):
        s.text(84,330+i*26,t,14 if i else 12,col,w,spacing=1 if not i else 0)

    # ---- Pico 2 ----
    d.box('P1',1560,300,860,830,'Pico 2','RP2350 · 3.3 V GPIO · eight XH headers in contiguous pin groups · GP25 LED onboard',color=C['green'],
          lines=['Headers: PH-A p4–p7, PH-A2 p8–p10, PH-B p11–p15, PH-C p16–p21,','PH-D p24–p29, PH-E p31–p34, PH-F p36–p39, PH-G p1–p3.','Desolder the pre-soldered pins, then solder the XH headers to the board (2026-10-17).','NC: ADC_VREF p35, RUN p30, 3V3_EN p37, GP17 p22, GP19–GP21.','EL-02 shows the physical board and the IMU pins.'],line_y=1000)
    s.text(1990,520,'P1 / Pico 2',30,C['green'],700,'middle')
    for pos,y in zip(range(1,7),range(380,620,40)):hx_port(d,'P1.PH-C',pos,1560,y,'left')
    for pos,y in zip(range(1,5),range(680,840,40)):hx_port(d,'P1.PH-F',pos,1560,y,'left')
    for pos,y in zip(range(1,4),range(880,1000,40)):hx_port(d,'P1.PH-G',pos,1560,y,'left')
    for pos,y in zip(range(1,5),range(345,445,25)):hx_port(d,'P1.USB',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,5),range(490,610,30)):hx_port(d,'P1.PH-A',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,4),range(610,700,30)):hx_port(d,'P1.PH-A2',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,6),range(710,860,30)):hx_port(d,'P1.PH-B',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,7),range(870,1020,25)):hx_port(d,'P1.PH-D',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,5),range(1030,1130,25)):hx_port(d,'P1.PH-E',pos,2420,y,'right',size=18)
    # ---- IMU ----
    d.box('U1',740,300,600,460,'SparkFun LSM6DSO','3.3 V · main SPI pads · open the ADDR jumper for SPI · EL-02',color=C['green'],
          lines=['JMAIN: B6B-XH-A on the six main pads.','JINT: B2B-XH-A on INT2 / INT1.','INT2 stays empty.','Ports are in cable order; the position','number gives the pad.'],line_y=600)
    for pos,y in [(5,380),(6,420),(1,460),(4,500),(3,540)]:hx_port(d,'U1.JMAIN',pos,1340,y,'right')
    hx_port(d,'U1.JINT',2,1340,580,'right');hx_port(d,'U1.JINT',1,1340,620,'right')
    hx_port(d,'U1.JMAIN',2,1340,680,'right')
    d.node('SP1',1470,680,'3V3')
    s.text(1470,712,'SP1 splice',15,C['purple'],700,'middle')
    # ---- Power distribution board ----
    d.box('PDB',740,1240,600,160,'Power distribution','5 V regulator · part TBD',True,C['orange'],
          lines=['From the unswitched fused bus. D5 Schottky → VSYS.','Logic stays on through a kill. 5 V to JLEG.'],line_y=1325)
    hx_port(d,'PDB.JPICO',1,1100,1240,'top');hx_port(d,'PDB.JPICO',2,1240,1240,'top')
    hx_port(d,'PDB.JIN',1,780,1400,'bottom');hx_port(d,'PDB.JIN',2,940,1400,'bottom')
    hx_port(d,'PDB.J5V',1,1340,1300,'right');hx_port(d,'PDB.J5V',2,1340,1340,'right')
    # ---- Kill chain board ----
    d.box('KC',700,1640,640,300,'Kill chain','',True,C['red'],
          lines=['Pololu 2813 + 74HC14 · EL-04','XPACK: fused pack in.','XRAIL: 2813 VOUT = the switched rail.','LD1117V33 gate logic from the bus.','100k / 22k rail divider → RAIL_ADC.','KILL → OFF. ARM → ON via 4.7k,','clamped by HB_OK.','Not ordered or tested. K0–K6 open.'],line_y=1700,line_x=920,line_size=14)
    hx_port(d,'KC.JBUS',1,780,1640,'top');hx_port(d,'KC.JBUS',2,940,1640,'top')
    hx_port(d,'KC.JHB',1,1340,1680,'right');hx_port(d,'KC.JHB',2,1340,1710,'right');hx_port(d,'KC.JHB',3,1340,1740,'right')
    hx_port(d,'KC.XRAIL',1,1340,1820,'right');hx_port(d,'KC.XRAIL',2,1340,1860,'right')
    hx_port(d,'KC.JKILL',1,700,1690,'left');hx_port(d,'KC.JKILL',2,700,1720,'left')
    hx_port(d,'KC.JARM',1,700,1795,'left');hx_port(d,'KC.JARM',2,700,1825,'left')
    hx_port(d,'KC.XPACK',1,700,1895,'left');hx_port(d,'KC.XPACK',2,700,1925,'left')
    # ---- Driver board ----
    d.box('DB',1500,1640,920,300,'Driver board','DL, DR: Pololu 4035 / DRV8874 carriers on one 52 x 38 mm board · EL-03, EL-05',color=C['blue'],
          lines=['10 kΩ nFAULT pull-ups to 3V3. 1 kΩ CS series.','VREF divider ≈ 2.8 V (≈ 2.5 A). PMODE, IMODE to GND. VM NC.','nSLEEP from GP10 to both carriers.','EN low = brake. nSLEEP low = outputs off.','OUT1 / OUT2 go to JLEG, not to the motor directly.'],line_y=1715,line_x=1660)
    hx_port(d,'DB.JCTL',1,1540,1640,'top');hx_port(d,'DB.JCTL',2,1700,1640,'top')
    hx_port(d,'DB.XRAIL',1,1500,1820,'left');hx_port(d,'DB.XRAIL',2,1500,1860,'left')
    for pos,y in zip(range(1,6),range(1670,1820,30)):hx_port(d,'DB.JSIG-L',pos,2420,y,'right',size=18)
    for pos,y in zip(range(1,6),range(1820,1970,30)):hx_port(d,'DB.JSIG-R',pos,2420,y,'right',size=18)
    hx_port(d,'DB.JML',1,1660,1940,'bottom');hx_port(d,'DB.JML',2,1800,1940,'bottom')
    hx_port(d,'DB.JMR',1,1960,1940,'bottom');hx_port(d,'DB.JMR',2,2100,1940,'bottom')
    # ---- Leg junction board ----
    d.box('JLEG',1260,2090,1140,210,'Leg junction','',True,C['green'],
          lines=['Accepted 2026-10-17 · under the PWR deck · 1x6 pigtail headers · 2.2 kΩ / 3.3 kΩ dividers','Motor leads pass to JPL / JPR. Encoder A / B 5 V → 3.0 V → JENC.','Board layout, mount detail and the service loop for later leg motion remain open.'],line_y=2170,line_x=1480)
    hx_port(d,'JLEG.J5V',1,1300,2090,'top');hx_port(d,'JLEG.J5V',2,1440,2090,'top')
    hx_port(d,'JLEG.JPL',1,1660,2090,'top');hx_port(d,'JLEG.JPL',2,1800,2090,'top')
    hx_port(d,'JLEG.JPR',1,1960,2090,'top');hx_port(d,'JLEG.JPR',2,2100,2090,'top')
    for pos,x in zip(range(1,6),range(2170,2420,60)):hx_port(d,'JLEG.JENC',pos,x,2090,'top',label=f'JENC.{pos}',size=15)
    for pos,y in zip(range(1,7),range(2140,2320,30)):hx_port(d,'JLEG.JML_IN',pos,1260,y,'left',size=16)
    for pos,y in zip(range(1,7),range(2140,2320,30)):hx_port(d,'JLEG.JMR_IN',pos,2400,y,'right',size=16)
    # ---- Motors ----
    for ref,conn,x,edge,px in [('ML','ML.PIGTAIL',100,'right',560),('MR','MR.PIGTAIL',2780,'left',2780)]:
        d.box(ref,x,2090,460 if ref=='ML' else 356,210,'Pololu 4752 · '+('LEFT WHEEL' if ref=='ML' else 'RIGHT WHEEL'),'',color=C['blue'],header=True)
        cx=x+(120 if ref=='ML' else 236)
        s.p.append(f'<circle cx="{cx}" cy="{2215}" r="40" fill="{C["white"]}" stroke="{C["ink"]}" stroke-width="4"/>')
        s.text(cx,2225,ref,28,C['ink'],700,'middle')
        s.text(cx,2285,'12 V · 30:1 · encoder',12,C['muted'],600,'middle')
        for pos,y in zip(range(1,7),range(2140,2320,30)):hx_port(d,conn,pos,px,y,edge,size=16)
    # ---- Fixture buttons, pack, fuse, USB ----
    d.box('SWK',100,1660,300,100,'KILL','red mushroom · momentary NO · fixture',False,C['red'])
    hx_port(d,'SWK.LEADS',1,400,1690,'right');hx_port(d,'SWK.LEADS',2,400,1720,'right')
    d.box('SWA',100,1770,300,90,'ARM','green · momentary NO · fixture',False,C['green'])
    hx_port(d,'SWA.LEADS',1,400,1795,'right');hx_port(d,'SWA.LEADS',2,400,1825,'right')
    d.box('BAT',100,1870,260,90,'3S pack','on the tray · XT30 · TBD',True,C['red'])
    hx_port(d,'BAT.LEADS',1,360,1895,'right');hx_port(d,'BAT.LEADS',2,360,1925,'right')
    d.box('F1',440,1877,120,36,'Fuse','',True,C['red'])
    hx_port(d,'F1.INLINE',1,440,1895,'left',label='');hx_port(d,'F1.INLINE',2,560,1895,'right',label='')
    s.text(445,1933,'inline holder · value TBD',12,C['muted'])
    s.text(100,1980,'The pack sits on the tray at the bottom of the body. It is drawn',13,C['muted'])
    s.text(100,2000,'here so that its lead to the kill chain is clear.',13,C['muted'])
    s.text(100,2030,'Both buttons are on the bench fixture, not on the robot.',13,C['muted'])
    d.box('JUSB',2780,300,356,140,'Laptop USB','',color=C['cyan'])
    s.text(2798,460,'Micro-USB cable to the front of the Pico 2.',13,C['muted'])
    for pos,y in zip(range(1,5),range(345,445,25)):hx_port(d,'JUSB.CABLE',pos,2780,y,'left',size=18)

    # ---- Wires ----
    def W(src,dst,net,via=(),label=True):
        b=next(b for b in HX.BUNDLES for s_,d_,n in b['wires'] if (s_,d_)==(src,dst))
        return d.wire(hkey(src),hkey(dst),net,via,NETCOL.get(net,C['cyan']),label,awg=b['awg'],bundle=b['id'])
    for pos,dst in [(1,'U1.JMAIN.5'),(2,'U1.JMAIN.6'),(3,'U1.JMAIN.1'),(4,'U1.JMAIN.4'),(5,'U1.JMAIN.3'),(6,'U1.JINT.2')]:
        net=HX.CONNECTORS['P1.PH-C']['load'][pos][1];W(f'P1.PH-C.{pos}',dst,net)
    W('P1.PH-F.1','SP1','3V3');W('SP1','U1.JMAIN.2','3V3')
    W('SP1','DB.JCTL.2','3V3',[(1470,1560),(1700,1560)])
    W('PDB.JPICO.1','P1.PH-F.4','VSYS',[(1100,1160),(1520,1160),(1520,800)])
    W('PDB.JPICO.2','P1.PH-F.3','GND',[(1240,1140),(1500,1140),(1500,760)])
    W('KC.JBUS.1','PDB.JIN.1','BUS');W('KC.JBUS.2','PDB.JIN.2','GND')
    W('KC.XRAIL.1','DB.XRAIL.1','RAIL');W('KC.XRAIL.2','DB.XRAIL.2','GND')
    W('PDB.J5V.1','JLEG.J5V.1','5V',[(1420,1300),(1420,2050),(1300,2050)])
    W('PDB.J5V.2','JLEG.J5V.2','GND',[(1440,1340)])
    W('DB.JML.1','JLEG.JPL.1','L_MOTOR_OUT1');W('DB.JML.2','JLEG.JPL.2','L_MOTOR_OUT2')
    W('DB.JMR.1','JLEG.JPR.1','R_MOTOR_OUT1');W('DB.JMR.2','JLEG.JPR.2','R_MOTOR_OUT2')
    for i,net in enumerate(['L_MOTOR_OUT1','L_MOTOR_OUT2','GND','5V','L_ENC_A5','L_ENC_B5'],1):W(f'ML.PIGTAIL.{i}',f'JLEG.JML_IN.{i}',net)
    for i,net in enumerate(['R_MOTOR_OUT1','R_MOTOR_OUT2','GND','5V','R_ENC_A5','R_ENC_B5'],1):W(f'MR.PIGTAIL.{i}',f'JLEG.JMR_IN.{i}',net)
    W('BAT.LEADS.1','F1.INLINE.1','PACK');W('F1.INLINE.2','KC.XPACK.1','PACK_FUSED');W('BAT.LEADS.2','KC.XPACK.2','GND')
    W('SWK.LEADS.1','KC.JKILL.1','KILL_A');W('SWK.LEADS.2','KC.JKILL.2','KILL_B')
    W('SWA.LEADS.1','KC.JARM.1','ARM_A');W('SWA.LEADS.2','KC.JARM.2','ARM_B')
    for i,net in enumerate(['USB_VBUS','USB_D+','USB_D-','GND'],1):W(f'JUSB.CABLE.{i}',f'P1.USB.{i}',net)
    # Right trunk: every Pico right-edge wire goes down the front face of the
    # body. Lanes are ordered by destination depth so destination runs do not cross.
    P=lambda k:d.ports[k]['position']
    trunk=[
        ('P1.PH-B.4','DB.JCTL.1','nSLEEP',1455,1540),
        ('P1.PH-D.6','KC.JHB.1','HB',1470,1360),
        ('P1.PH-E.4','KC.JHB.2','RAIL_ADC',1485,1375),
        ('P1.PH-E.3','KC.JHB.3','AGND',1500,1390),
        ('P1.PH-A2.2','DB.JSIG-L.1','L_EN',None,None),('P1.PH-A2.3','DB.JSIG-L.2','L_PH',None,None),
        ('P1.PH-B.5','DB.JSIG-L.3','L_FAULT',None,None),('P1.PH-E.1','DB.JSIG-L.4','L_CS',None,None),('P1.PH-B.3','DB.JSIG-L.5','GND',None,None),
        ('P1.PH-B.1','DB.JSIG-R.1','R_EN',None,None),('P1.PH-B.2','DB.JSIG-R.2','R_PH',None,None),
        ('P1.PH-D.1','DB.JSIG-R.3','R_FAULT',None,None),('P1.PH-E.2','DB.JSIG-R.4','R_CS',None,None),('P1.PH-D.5','DB.JSIG-R.5','GND',None,None),
        ('P1.PH-A.1','JLEG.JENC.1','L_ENC_A',1975,2170),('P1.PH-A.2','JLEG.JENC.2','L_ENC_B',1990,2230),
        ('P1.PH-A.3','JLEG.JENC.3','R_ENC_A',2005,2290),('P1.PH-A.4','JLEG.JENC.4','R_ENC_B',2020,2350),('P1.PH-A2.1','JLEG.JENC.5','GND',2035,2410)]
    for i,(src,dst,net,lane,tx) in enumerate(trunk):
        x=2470+i*15
        sy=P(hkey(src))[1];dy=P(hkey(dst))[1]
        if lane is None:W(src,dst,net,[(x,sy),(x,dy)])
        elif tx<1500:W(src,dst,net,[(x,sy),(x,lane),(tx,lane),(tx,dy)])
        else:W(src,dst,net,[(x,sy),(x,lane),(tx,lane)])
    d.finish('v1-proof-el-01-overview')
    check_against_harness(d)
    return d

def check_against_harness(d):
    """EL-01 must draw exactly the harness wires, with matching nets."""
    drawn={(w['source'],w['destination']):w['net'] for w in d.wires}
    model={(hkey(s),hkey(t)):n for b in HX.BUNDLES for s,t,n in b['wires']}
    assert drawn==model,('EL-01 differs from harness.py',set(drawn.items())^set(model.items()))
    for k,p in d.ports.items():
        if p['component']=='Junction' or k in HX.SPLICES:continue
        assert 'connector' in p,('port not from the harness model',k)

def both_wheels():
    """A spacious conductor-level detail, two complete channels, no 'repeat'."""
    d=Circuit('EL-05','Both wheel motors — every wire','Two complete channels through the leg junction board. Rails and nSLEEP come from EL-01. Use terminal names here. EL-01 has the conductor register IDs.',3200,2000,show_ids=False)
    s=d.s
    for side,ybase,gps in [('L',220,[6,7,11,26,2,3]),('R',1080,[8,9,18,27,4,5])]:
        m='M'+side;drv='D'+side;jl='J'+side
        d.box('P'+side,80,ybase+120,450,540,'Pico 2 / '+('LEFT' if side=='L' else 'RIGHT'),'GPIO terminals on PH-A, PH-B, PH-D, PH-E',False,C['green'])
        d.box(drv,1080,ybase+120,480,370,'DRV8874 / '+side,'Pololu 4035 carrier on the driver board',False,C['blue'])
        d.box(m,2600,ybase+120,520,600,'4752 / '+side+' wheel motor','12 V / 30:1 / encoder fitted / 200 mm pigtail',False,C['blue'])
        s.p.append(f'<circle cx="2875" cy="{ybase+310}" r="66" fill="{C["white"]}" stroke="{C["ink"]}" stroke-width="4"/>');s.text(2875,ybase+323,m,34,C['ink'],700,'middle')
        s.rect(2805,ybase+470,140,108,'#e8eeea',4);s.text(2875,ybase+532,'ENCODER',19,C['green'],700,'middle')
        for gp,pin,y in zip(gps[:4],['EN','PH','nFAULT','CS'],[ybase+240,ybase+300,ybase+360,ybase+420]):
            d.port('P'+side,'GP'+str(gp),530,y,f'GP{gp} / p{PIN[gp]}','right',gpio=gp)
            d.port(drv,pin,1080,y,pin,'left')
            if pin=='CS':
                d.resistor('RC'+side,780,y-23,'1 kΩ series',label_side='left',label_offsets=(-8,70))
                d.wire(drv+'.CS','RC'+side+'.2',side+'_CS',[(780,y+23)] if False else [(960,y),(960,y+23),(780,y+23)]);d.wire('RC'+side+'.1','P'+side+'.GP'+str(gp),side+'_CS',[(780,y-23),(600,y-23),(600,y)])
            else:d.wire('P'+side+'.GP'+str(gp),drv+'.'+pin,side+'_'+pin)
        d.port(drv,'OUT1',1560,ybase+240,'OUT1','right',C['red']);d.port(drv,'OUT2',1560,ybase+300,'OUT2','right',C['ink'])
        # Leg junction board: pass-through for the motor leads, dividers for A / B.
        d.box(jl,1740,ybase+120,620,600,'JLEG / '+side+' channel','1x6 0.1 in header for the pigtail · dividers 2.2 kΩ / 3.3 kΩ',True,C['green'])
        for pin,y,col in [('OUT1_IN',ybase+240,C['red']),('OUT2_IN',ybase+300,C['ink']),('A_OUT',ybase+550,C['yellow']),('B_OUT',ybase+610,C['green'])]:d.port(jl,pin,1740,y,pin,'left',col)
        for pin,y,col in [('RED',ybase+240,C['red']),('BLACK',ybase+300,C['ink']),('GREEN',ybase+430,C['green']),('BLUE',ybase+490,C['blue']),('YELLOW',ybase+550,C['yellow']),('WHITE',ybase+610,C['ground'])]:
            d.port(jl,pin,2360,y,pin,'right',col);d.port(m,pin,2600,y,pin,'left',col)
            net={'RED':side+'_MOTOR_OUT1','BLACK':side+'_MOTOR_OUT2','GREEN':'GND','BLUE':'5V','YELLOW':side+'_ENC_A5','WHITE':side+'_ENC_B5'}[pin]
            d.wire(jl+'.'+pin,m+'.'+pin,net,color='white' if pin=='WHITE' else col)
        d.wire(drv+'.OUT1',jl+'.OUT1_IN',side+'_MOTOR_OUT1',color=C['red']);d.wire(drv+'.OUT2',jl+'.OUT2_IN',side+'_MOTOR_OUT2',color=C['ink'])
        s.text(2050,ybase+360,'OUT1 → RED, OUT2 → BLACK pass through on the board.',16,C['muted'],400,'middle')
        s.text(2050,ybase+385,'A, B: 2.2 kΩ series, 3.3 kΩ to GND → 3.0 V high level.',16,C['muted'],400,'middle')
        s.text(2050,ybase+410,'GREEN → GND, BLUE → 5 V on the board rails.',16,C['muted'],400,'middle')
        for gp,pin,y in zip(gps[4:],['A_OUT','B_OUT'],[ybase+550,ybase+610]):d.port('P'+side,'GP'+str(gp),530,y,f'GP{gp} / p{PIN[gp]}','right',gpio=gp);d.wire(jl+'.'+pin,'P'+side+'.GP'+str(gp),side+'_ENC_'+pin[0],[(1660,y),(1660,y+30),(600,y+30),(600,y)] if False else [])
        rails=[('3V3',ybase+80,C['purple']),('RAIL',ybase+40,C['red']),('5V',ybase+740,C['orange']),('GND',ybase+785,C['ground'])]
        for net,y,col in rails:
            a=d.node(side+net+'a',640,y,net);b=d.node(side+net+'b',2500,y,net);d.wire(a,b,net,color=col,label=False);s.label(650,y-10,net+' / EL-01',col,20)
        for ref,pin,x,y,rail,col in [(drv,'VIN',1480,ybase+120,'RAIL',C['red']),(drv,'GND',1160,ybase+490,'GND',C['ground']),(drv,'PMODE',1260,ybase+490,'GND',C['ground']),(drv,'IMODE',1360,ybase+490,'GND',C['ground']),(jl,'5V',2160,ybase+720,'5V',C['orange']),(jl,'GND',2050,ybase+720,'GND',C['ground'])]:
            d.port(ref,pin,x,y,pin,'top' if rail in ['3V3','RAIL'] else 'bottom',col)
            ny=next(yy for n,yy,c in rails if n==rail);node=d.node(side+ref+pin,x,ny,rail)
            d.wire(ref+'.'+pin,node,rail,[],col)
        d.port(drv,'nSLEEP',1080,ybase+205,'nSLEEP','left',C['red']);n=d.node('EN'+side,640,ybase+205,'nSLEEP');d.wire(n,drv+'.nSLEEP','nSLEEP',color=C['red']);s.label(650,ybase+195,'nSLEEP / GP10 / EL-01',C['red'],20)
        d.resistor('RF'+side,990,ybase+310,'10 kΩ pull-up',label_side='left');d.node('F'+side,990,ybase+360,side+'_nFAULT');d.node('RF'+side+'3',990,ybase+80,'3V3')
        d.wire('RF'+side+'.1','RF'+side+'3','3V3',color=C['purple']);d.wire('RF'+side+'.2','F'+side,side+'_nFAULT')
        d.port(drv,'VREF',1480,ybase+490,'VREF','bottom',C['orange']);d.resistor('RV'+side,1480,ybase+645,'divider ≈ 2.8 V',pending=True);d.node('RV'+side+'g',1480,ybase+785,'GND')
        d.wire(drv+'.VREF','RV'+side+'.1',side+'_VREF',color=C['orange'],label=False);d.wire('RV'+side+'.2','RV'+side+'g','GND',color=C['ground'])
        s.text(1320,ybase+458,'VM: NC',18,C['muted'],600,'middle')
        s.text(2700,ybase+695,'BLACK is a switched motor lead.',18,C['ink'],700)
    d.finish('v1-proof-el-05-both-wheels')
    return d

def harness_runs():
    """EL-06: the route map and the bundle cut-length table."""
    H=HX.data()
    s=Sheet('EL-06','Harness bundles and run lengths','Route model on the R05 body, cut length for each bundle, connector hardware. Lengths are estimates: cut long, route on the frame, trim, record.',3200,2000,tabloid=True)
    # Left: a front elevation (Y-Z) of the body with the boards and the trunk.
    ox,oz=560,1230;SC=4.2   # scale: 1 mm = 4.2 px; Y = -135..0 maps right to left
    def X(y):return ox+(-y)*SC
    def Z(z):return oz-z*SC
    s.text(64,217,'ROUTE MODEL / FRONT ELEVATION',12,C['green'],700,spacing=1)
    s.text(64,240,'Boards at their R05 centres. Harness runs follow the front cable notches of each deck lane.',14,C['muted'])
    # walls, decks, tray
    for y0 in (0,-135):s.rect(X(y0)-(0 if y0==0 else 6*SC),Z(180),6*SC,(180+35)*SC,'#9fb3ad',2,'#9fb3ad')
    for name,z in HX.DECK_Z.items():
        s.rect(X(0),Z(z)-4*SC,135*SC,4*SC,'#d7e0dc',1,'#c3cfc9');s.text(X(0)+135*SC+12,Z(z),f'{name} Z +{z}',14,C['muted'],600)
    s.rect(X(0),Z(-31),135*SC,4*SC,'#d7e0dc',1,'#c3cfc9');s.text(X(0)+135*SC+12,Z(-35)+6,'TRAY Z −35',14,C['muted'],600)
    s.rect(X(-67.5)-17.5*SC,Z(-5),35*SC,25*SC,'#f3dad3',3,C['red'],True);s.text(X(-67.5),Z(-17.5)+5,'BAT',14,C['red'],700,'middle')
    s.text(X(0)+6,Z(185),'NEAR WALL · LEFT',12,C['muted'],700,'end');s.text(X(-135)-6,Z(185),'FAR WALL · RIGHT',12,C['muted'],700)
    for lane,y in HX.LANE_Y.items():
        s.line([(X(y),Z(175)),(X(y),Z(55))],C['muted'],2,True);s.text(X(y),Z(178)-6,f'{lane} notch',12,C['muted'],600,'middle')
    boards=[('P1',38,16,C['green']),('U1',24,10,C['green']),('PDB',36,20,C['orange']),('KC',36,20,C['red']),('DB',36,20,C['blue']),('JLEG',52,10,C['green'])]
    for ref,w,h,col in boards:
        x,y,z=HX.LOCATIONS[ref]['xyz'];s.rect(X(y)-w*SC/2,Z(z)-h*SC/2,w*SC,h*SC,'#fffef9',3,col);s.text(X(y),Z(z)+5,ref,15,col,700,'middle')
    for ref,col in [('ML',C['blue']),('MR',C['blue'])]:
        x,y,z=HX.LOCATIONS[ref]['xyz'];s.rect(X(y)-7*SC,Z(z)-17*SC,30*SC if ref=='MR' else 30*SC,34*SC,'#e4ebf3',4,col) if False else None
        cx=X(y)+(-10 if ref=='ML' else 10)*SC
        s.rect(cx-17*SC,Z(z)-17*SC,34*SC,34*SC,'#e8eef4',4,col);s.text(cx,Z(z)+5,ref,15,col,700,'middle')
        s.rect(X(y)+(-67 if ref=='ML' else 40)*SC,Z(z)-50*SC,24*SC,100*SC,'#2b2f33',6,'#2b2f33')
    s.text(X(-67.5),Z(-150),'wheels and gearmotors hang under the body; pigtails rise to JLEG',13,C['muted'],400,'middle')
    # draw the modelled paths
    for r in H['bundles']:
        if not r.get('path'):continue
        raw=[(X(y),Z(z)) for x,y,z in r['path']]
        # Orthogonal drawing of the Manhattan model: vertical first, then across.
        pts=[raw[0]]
        for (x1,y1),(x2,y2) in zip(raw,raw[1:]):
            if x1!=x2 and y1!=y2:pts.append((x1,y2))
            pts.append((x2,y2))
        s.line(pts,C['cyan'],2)
        s.dot(*pts[0],C['cyan'],3);s.dot(*pts[-1],C['cyan'],3)
    # Right: table
    tx=1300;ty=260
    s.text(tx,217,'BUNDLES / CUT LENGTHS',12,C['green'],700,spacing=1)
    cols=[(0,'Bundle'),(90,'Name'),(560,'From → to'),(820,'Wires'),(920,'AWG'),(1030,'Model path'),(1200,'Cut length'),(1400,'Connectors')]
    for dx,t in cols:s.text(tx+dx,ty,t,14,C['muted'],700)
    s.line([(tx,ty+10),(tx+1800,ty+10)],C['line'],1)
    bconn={}
    for b in HX.BUNDLES:
        ends=set()
        for a,c,n in b['wires']:
            for e in (a,c):
                if e in HX.SPLICES:ends.add(e)
                else:ends.add(e.rsplit('.',1)[0])
        bconn[b['id']]=' · '.join(sorted(ends))
    for i,r in enumerate(H['bundles']):
        y=ty+40+i*34
        cut='—' if r['cut_mm'] is None else f"{r['cut_mm']} mm"+(' fixed' if r['fixed'] else '')
        path='—' if r['path_mm'] is None else f"{r['path_mm']} mm"
        for dx,t,w_ in [(0,r['id'],700),(90,r['name'],600),(560,' → '.join(r['ends']),400),(820,str(r['conductors']),400),(920,str(r['awg']),400),(1030,path,400),(1200,cut,700),(1400,bconn[r['id']],400)]:
            s.text(tx+dx,y,t,15 if dx!=1400 else 13,C['ink'] if w_==700 else C['muted'],w_)
    yb=ty+40+len(H['bundles'])*34+20
    s.line([(tx,yb-24),(tx+1800,yb-24)],C['line'],1)
    s.text(tx,yb,'Length rule: ' + H['length_model']['rule'],14,C['muted'])
    s.text(tx,yb+24,'Totals: '+', '.join(f'{kk} {v} mm' for kk,v in H['bom']['wire_mm_by_awg'].items())+'. Buy about 1.5 m of each.',14,C['muted'])
    s.text(tx,yb+48,'Pigtail reach check: left motor exit to JLEG = 179 mm Manhattan, pigtail 200 mm. The left pigtail cannot reach the driver board (216 mm). JLEG accepted 2026-10-17.',14,C['muted'])
    # Standard
    sy=yb+100
    s.text(tx,sy,'CONNECTOR STANDARD',12,C['green'],700,spacing=1)
    for i,(kk,v) in enumerate(H['standard'].items()):s.text(tx,sy+28+i*24,f'{kk}: {v}',14 if len(v)<120 else 12,C['ink'] if i==0 else C['red'] if kk=='pico_end' else C['muted'],600 if i==0 or kk=='pico_end' else 400)
    hy=sy+28+5*24+16
    s.text(tx,hy,'HARDWARE COUNT (V1-PROOF harness)',12,C['green'],700,spacing=1)
    items=[f'{kk} × {v}' for kk,v in H['bom']['xh_housings'].items()]+[f'{kk} × {v}' for kk,v in H['bom']['xh_headers'].items()]
    s.text(tx,hy+28,'Housings: '+'  '.join(items[:6]),14,C['muted']);s.text(tx,hy+52,'Headers: '+'  '.join(items[6:]),14,C['muted'])
    s.text(tx,hy+76,f"Contacts SXH-001T-P0.6: {H['bom']['xh_contacts']} used, buy {H['bom']['xh_contacts_with_spares']}. XT30 pairs: 2. 1x6 0.1 in male headers: 2. Crimp tool: IWISS SN-01BM or Engineer PA-09.",14,C['muted'])
    s.text(64,Z(-200),'Left: robot LEFT = near wall. The pack lead exit is an assumption; measure the pack. Button leads are fixture runs (600 mm).',14,C['muted'])
    return s.save('v1-proof-el-06-harness-runs')

def connectors():
    """EL-07: connector loading tables, one small table per connector."""
    H=HX.data()
    s=Sheet('EL-07','Connector loading','Every harness connector with its positions. XH = JST XH 2.50 mm. Position 1 is the header pin nearest the triangle mark on the housing; mark pin 1 on each board.',3200,2000,tabloid=True)
    keys=[k for k in H['connectors'] if k not in ('BAT.LEADS','F1.INLINE','JUSB.CABLE')]
    col_w=760;x0=64;y0=230;col=0;y=y0
    for key in keys:
        c=H['connectors'][key];n=c['positions'];h=46+n*22+8
        if y+h>1880:col+=1;y=y0
        x=x0+col*col_w
        s.rect(x,y,col_w-40,h,C['white'],6)
        fam=c['family']
        s.rect(x,y,6,h,C['green'] if fam=='XH' else C['red'] if fam=='XT30' else C['blue'],3,C['green'] if fam=='XH' else C['red'] if fam=='XT30' else C['blue'])
        s.text(x+20,y+22,key,17,C['ink'],700);s.text(x+20,y+40,f'{fam} · {n} positions · {c["pins"]} · {c["title"]}',12,C['muted'])
        for pos,(pin,net) in sorted(c['load'].items()):
            yy=y+62+(pos-1)*22
            s.text(x+24,yy,str(pos),13,C['ink'],700);s.text(x+56,yy,pin,13,C['ink'],600)
            s.text(x+300,yy,net or 'empty',13,NETCOL.get(net,C['muted']) if net else C['line'],600)
            # mate
            mates=[w for w in H['wires'] if w['source'].rsplit('.',1)[0]==key and int(w['source'].rsplit('.',1)[1])==pos or w['destination'].rsplit('.',1)[0]==key and int(w['destination'].rsplit('.',1)[1])==pos]
            if mates:
                w=mates[0];other=w['destination'] if w['source'].startswith(key+'.') else w['source']
                s.text(x+520,yy,f"{w['id']} → {other}  ({w['bundle']})",13,C['muted'])
        y+=h+14
    s.text(64,1920,'Pack leads, the inline fuse and the laptop USB cable are not listed; they are not harness connectors. The three empty Pico positions in PH-D keep GP19–GP21 free for a later revision.',14,C['muted'])
    return s.save('v1-proof-el-07-connectors')

def register(master):
    p=HERE/'v1-proof-netlist.json';data=json.loads(p.read_text())
    components={key:{**part,'rect':[part['rect'][0],master.s.layout_y(part['rect'][1]),part['rect'][2],round(master.s.layout_y(part['rect'][1]+part['rect'][3])-master.s.layout_y(part['rect'][1]),3)]} for key,part in master.parts.items()}
    ports={key:{**port,'position':master.s.layout_point(port['position'])} for key,port in master.ports.items()}
    connections=[{**wire,'route':[master.s.layout_point(point) for point in wire['route']]} for wire in master.wires]
    data.update(revision='C',source_checked='2026-10-17',components=components,ports=ports,connections=connections,
                drawing_layout=dict(view_box=[3200,2000],paper_inches=[17,11],margin_inches=0.5,layout_date='2026-10-17',arrangement='rear elevation of the R05 body; robot LEFT = near wall'),
                external_nc=['P1.ADC_VREF p35','P1.3V3_EN p37','P1.RUN p30','P1.GP17 p22','P1.GP19 p25','P1.GP20 p26','P1.GP21 p27','P1.PH-G p1-p3 (optional UART0, no cable)','U1.JINT.1 INT2','U1.auxiliary SPI','U1.Qwiic','DL.VM','DR.VM'])
    nets={}
    for w in master.wires:
        for end in [w['source'],w['destination']]:nets.setdefault(end,set()).add(w['net'])
    assert all(len(v)==1 for v in nets.values()),[(k,v) for k,v in nets.items() if len(v)>1]
    gpio_used=[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,22,26,27,28]
    assert all(any(p.get('gpio')==g and k in nets for k,p in master.ports.items()) for g in gpio_used),gpio_used
    for side in ['L','R']:
        assert all(f'M{side}.PIGTAIL.{i}' in nets for i in range(1,7))
    unused=set(master.ports)-set(nets)-master.nc
    assert not unused,unused
    data['internal_connections']=[dict(component='P1',net='GND',terminals=['PH-A.5','PH-B.3','PH-C.3','PH-D.5','PH-E.3 AGND','PH-F.3','USB.4'],reason='Common return on the Pico PCB'),
                                  dict(component='JLEG',net='pass-through',terminals=['JML_IN.1-2 → JPL','JMR_IN.1-2 → JPR','JML_IN.3 / JMR_IN.3 → J5V.2 GND','JML_IN.4 / JMR_IN.4 → J5V.1 5V'],reason='Motor leads and the encoder supply pass across the junction board'),
                                  dict(component='DB',net='3V3 / GND / RAIL',terminals=['JCTL.2 3V3 → pull-ups','XRAIL → both VIN','JSIG-L.5 / JSIG-R.5 → GND'],reason='Board rails'),
                                  dict(component='KC',net='BUS / RAIL / GND',terminals=['XPACK → fuse → 2813 VIN and JBUS','2813 VOUT → XRAIL'],reason='Kill-chain board rails')]
    data['validation']=dict(gpio_count=len(gpio_used),wheel_motor_leads=12,servo_leads=0,net_count=len({w['net'] for w in master.wires}),external_conductors=len(master.wires),all_drawn_ports_connected=True,no_endpoint_net_conflicts=True,
                            all_drawn_nets_connected=True,no_different_net_collinear_overlaps=True,no_different_net_endpoint_touches=True,no_wires_hidden_inside_components=True,matches_harness_model=True)
    p.write_text(json.dumps(data,indent=2)+'\n')
    rows=[]
    for w in master.wires:
        a=master.ports[w['source']];b=master.ports[w['destination']]
        rows.append('<tr>'+''.join('<td>'+escape(str(t))+'</td>' for t in [w['id'],w['source']+' / '+a['label'],w['destination']+' / '+b['label'],w['net'],w.get('bundle') or '',w.get('awg') or ''])+'</tr>')
    html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hux Rev C conductor register</title><style>body{margin:0;background:#f7f5ee;color:#20343e;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:32px}h1{font-size:36px;line-height:1.15}a{color:#387b65}input{font:inherit;width:100%;padding:12px;box-sizing:border-box;border:1px solid #647780;background:#fffef9}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ced8d7}th{background:#e8eeea}.scroll{overflow:auto}small{color:#647780}input:focus-visible,a:focus-visible{outline:3px solid #218ca0;outline-offset:3px}</style></head><body><main><p>HUX / V1-PROOF / EL-01 / REV C</p><h1>Every harness conductor and its endpoints</h1><p>17 October 2026. The register follows the full system schematic by location. Each endpoint is a connector position. Bundle IDs and cut lengths are in the <a href="v1-proof-harness.html">harness register</a>. Circuit values and wire sizes remain to select and test.</p><p><a href="../../tools/living-drawings/electrical.html">Electrical page</a> · <a href="v1-proof-el-01-overview.svg">Full schematic</a> · <a href="v1-proof-netlist.json">JSON connection data</a></p><label for="search">Find a wire, connector, GPIO, bundle or net</label><input id="search" type="search" placeholder="For example: PH-A, JLEG, GP6, nSLEEP, B3 or W001"><p id="count" aria-live="polite"></p><div class="scroll"><table><thead><tr><th>Wire</th><th>From terminal</th><th>To terminal</th><th>Electrical net</th><th>Bundle</th><th>AWG</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table></div><p><small>Junction terminals and splices are drawn connection points. One register row is one conductor between named connector positions. USB rows are cable conductors.</small></p></main><script>const q=document.getElementById('search'),rows=[...document.querySelectorAll('tbody tr')],count=document.getElementById('count');function filter(){const term=q.value.toLowerCase().trim();let n=0;for(const row of rows){row.hidden=!row.textContent.toLowerCase().includes(term);if(!row.hidden)n++;}count.textContent=n+' of '+rows.length+' conductors';}q.addEventListener('input',filter);filter();</script></body></html>'''
    (HERE/'v1-proof-wire-register.html').write_text(html)
