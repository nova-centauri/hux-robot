"""Individual-conductor drawings. Electrical terminal symbols are functional
views, not invented connector face views. Every external wire has two recorded
endpoints; power rails and junctions are explicit graph nodes.
"""
import json
import xml.etree.ElementTree as ET
from html import escape
from build import Sheet, C, PIN, HERE

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
        self.parts={};self.ports={};self.wires=[];self.nodes={};self.show_ids=show_ids
    def box(self,ref,x,y,w,h,title,sub='',pending=False,color=None,header=True,sub_bottom=False):
        self.parts[ref]=dict(ref=ref,title=title,rect=[x,y,w,h],pending=pending)
        self.s.rect(x,y,w,h,C['white'],8,color or C['line'],pending)
        if header:
            heading=ref+' / '+title
            compact=h<=180
            font=min(22 if not compact else 20,(w-36)/(len(heading)*.55))
            self.s.text(x+18,y+(20 if compact else 30),heading,font,color or C['ink'],700)
            if sub:self.s.text(x+18,y+(h-15 if compact else h-25 if sub_bottom else 57),sub,min(18,(w-36)/(len(sub)*.51)),C['muted'])
    def port(self,ref,pin,x,y,label=None,side='left',color=None,gpio=None,label_offset=6):
        key=ref+'.'+pin
        assert key not in self.ports
        self.ports[key]=dict(component=ref,pin=pin,position=[x,y],label=label or pin)
        if gpio is not None:self.ports[key].update(gpio=gpio,physical_pin=PIN[gpio])
        self.s.port(x,y,color or C['cyan'])
        if side=='left':self.s.text(x+14,y+label_offset,label or pin,20,color or C['ink'],600)
        elif side=='right':self.s.text(x-14,y+label_offset,label or pin,20,color or C['ink'],600,'end')
        elif side=='top':self.s.text(x+12,y-12,label or pin,17,color or C['ink'],600)
        elif side=='bottom':
            self.s.text(x-12,y+24,label or pin,17,color or C['ink'],600,'end')
        return key
    def node(self,key,x,y,net):
        if key in self.ports:assert self.ports[key]['position']==[x,y]
        else:self.ports[key]=dict(component='Junction',pin=key,position=[x,y],label=key,net=net)
        self.nodes[key]=net
        return key
    def wire(self,a,b,net,via=(),color=None,label=True):
        assert a in self.ports and b in self.ports,(a,b)
        pts=[self.ports[a]['position'],*[list(p) for p in via],self.ports[b]['position']]
        pts=[p for i,p in enumerate(pts) if not i or p!=pts[i-1]]
        assert all(x1==x2 or y1==y2 for (x1,y1),(x2,y2) in zip(pts,pts[1:])),(a,b,pts)
        wid=f'W{len(self.wires)+1:03d}'
        self.wires.append(dict(id=wid,source=a,destination=b,net=net,color=color or C['cyan'],route=pts,show_id=label))
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
        # Conservative font bounds keep this standard-library build portable.
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
        # Hover text remains useful in the vector original. IDs locate all ends
        # in the searchable HTML register without a bundle hiding conductors.
        for w in self.wires:
            points=w['route'];best=max(zip(points,points[1:]),key=lambda q:abs(q[1][0]-q[0][0]))
            a,b=best
            if self.show_ids and w['show_id'] and abs(a[0]-b[0])>=105:
                x=int((a[0]+b[0])/2);y=a[1]-9
                # Keep IDs out of component headers and resistor value text.
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
                # A gap may cross a continuous wire, but no terminal or junction
                # of a different net may touch it.
                p=list(points[0])
                assert p not in [w['route'][0],w['route'][-1],v['route'][0],v['route'][-1]],(w['id'],v['id'],'different-net endpoint touch',p)
        for w in self.wires:
            for ref,part in self.parts.items():
                x,y,width,height=part['rect']
                for a,b in zip(w['route'],w['route'][1:]):
                    crosses=(x+1<a[0]<x+width-1 and max(min(a[1],b[1]),y+1)<min(max(a[1],b[1]),y+height-1)) if a[0]==b[0] else (y+1<a[1]<y+height-1 and max(min(a[0],b[0]),x+1)<min(max(a[0],b[0]),x+width-1))
                    assert not crosses,(w['id'],'wire hidden inside component',ref)
        if connected:
            # These grounds join inside the Pico PCB. They are not invented
            # extra external wires. USB D1 also remains inside the Pico.
            pico_ground={'P1.GND','P1.AGND','P1.USB_GND'}
            internal=[i for i,w in enumerate(self.wires) if {w['source'],w['destination']}&pico_ground]
            for i in internal[1:]:join(internal[0],i)
            nets={}
            for i,w in enumerate(self.wires):nets.setdefault(w['net'],set()).add(root(i))
            assert all(len(v)==1 for v in nets.values()),('disconnected drawn net',[(net,v) for net,v in nets.items() if len(v)>1])
    def draw_line(self,pts,w):
        self.s.p.append(f'<g data-wire="{w["id"]}"><title>{escape((w["id"]+": " if self.show_ids else "")+w["source"]+" → "+w["destination"]+" / "+w["net"])}</title>')
        if w['color']=='white':
            self.s.line(pts,C['ground'],5);self.s.line(pts,C['white'],2.8)
        else:self.s.line(pts,w['color'],4 if w['net'] in ['GND','5V','ACT_BUS','9V','PACK_FUSED'] else 2.7)
        self.s.p.append('</g>')

def full_system():
    d=Circuit('EL-01','Complete system wiring','Every external conductor is drawn. Both wheel motors, both encoders and both leg servos have separate terminals.')
    s=d.s
    d.box('P1',1410,450,380,1130,'Pico 2',color=C['green'],header=False)
    s.text(1600,560,'P1 / Pico 2',28,C['green'],700,'middle')
    s.text(1600,594,'Functional GPIO groups',18,C['muted'],400,'middle')
    s.text(1600,1010,'RP2350',40,C['green'],700,'middle')
    s.text(1600,1050,'3.3 V GPIO',24,C['muted'],600,'middle')
    s.text(1600,1090,'ADC_VREF p35: external NC',18,C['muted'],400,'middle')
    s.text(1600,1120,'USB D1 → VSYS is onboard',18,C['muted'],400,'middle')
    s.text(1600,1150,'EL-02 shows the physical board.',16,C['muted'],400,'middle')
    for side,gps in [('left',[(6,650),(7,710),(11,830),(26,890),(2,1170),(3,1230),(10,1280),(22,1320),(0,1380),(1,1420),(19,1480)]),('right',[(8,650),(9,710),(18,830),(27,890),(4,1170),(5,1230),(20,1270),(21,1310),(17,1350),(28,1550)])]:
        for gp,y in gps:d.port('P1','GP'+str(gp),1410 if side=='left' else 1790,y,f'GP{gp} / p{PIN[gp]}',side,gpio=gp)
    for pin,y,col in [('VSYS',1390,C['orange']),('3V3',1430,C['purple']),('GND',1470,C['ground']),('AGND',1510,C['ground'])]:
        d.port('P1',pin,1790,y,{'VSYS':'VSYS / p39','3V3':'3V3 OUT / p36','GND':'GND / p38','AGND':'AGND / p33'}[pin],'right',col)
    d.box('U1',1420,210,360,190,'SparkFun LSM6DSO','3.3 V / open ADDR jumper for SPI',color=C['green'])
    for i,(gp,pad) in enumerate([(12,'SDO'),(13,'CS'),(14,'SCL'),(15,'SDI'),(16,'INT1')]):
        x=1470+i*60
        d.port('U1',pad,x,400,pad,'none');s.text(x,383,pad,17,C['ink'],600,'middle')
        d.port('P1','GP'+str(gp),x,450,f'GP{gp} / p{PIN[gp]}','none',gpio=gp)
        s.text(x,480,f'GP{gp}',17,C['ink'],600,'middle');s.text(x,504,f'pin {PIN[gp]}',14,C['muted'],400,'middle')
        d.wire('U1.'+pad,'P1.GP'+str(gp),'SPI_'+pad,color=[C['green'],C['orange'],C['blue'],C['cyan'],C['yellow']][i],label=False)
    d.port('U1','3V3',1420,280,'3V3','left',C['purple'],label_offset=15);d.port('U1','GND',1780,280,'GND','right',C['ground'],label_offset=15)
    d.box('JUSB',64,210,390,180,'Laptop USB cable','Micro-USB cable; connector signals',color=C['cyan'])
    d.box('PUSB',740,210,300,180,'Pico 2 USB','Onboard P1 connector',color=C['green'],header=False)
    s.text(1020,235,'P1 USB',22,C['green'],700,'end');s.text(1020,380,'Onboard connector',17,C['muted'],400,'end')
    for i,pin in enumerate(['VBUS','D+','D-','GND']):
        y=245+i*36
        d.port('JUSB',pin,454,y,pin,'right');d.port('P1','USB_'+pin,740,y,pin,'left')
        d.wire('JUSB.'+pin,'P1.USB_'+pin,'GND' if pin=='GND' else 'USB_'+pin,color=C['ground'] if pin=='GND' else C['cyan'])
    # Named rail nodes are actual branch points, not missing endpoint labels.
    for key,x,y,net in [('G_L',490,1460,'GND'),('G_R',2710,1460,'GND'),('GL1',770,1460,'GND'),('GL2',1370,1460,'GND'),('GR1',1830,1460,'GND'),('GR2',2430,1460,'GND'),('G0',64,2300,'GND'),('G1',3136,2300,'GND'),('3L',610,330,'3V3'),('3M',1390,330,'3V3'),('3R',1810,330,'3V3'),('3E',2500,330,'3V3'),('5L',550,2020,'5V'),('5R',2650,2020,'5V'),('9L',520,2090,'9V'),('9R',2670,2090,'9V'),('ACT_L',780,420,'ACT_BUS'),('ACT_R',2525,420,'ACT_BUS'),('ACT_LOW',2525,2060,'ACT_BUS'),('FUSED',580,2150,'PACK_FUSED')]:d.node(key,x,y,net)
    for a,b,net,col in [('G0','G1','GND',C['ground']),('GL1','GL2','GND',C['ground']),('GR1','GR2','GND',C['ground']),('3R','3E','3V3',C['purple']),('5L','5R','5V',C['orange']),('9L','9R','9V',C['purple']),('ACT_L','ACT_R','ACT_BUS',C['red']),('ACT_R','ACT_LOW','ACT_BUS',C['red'])]:d.wire(a,b,net,color=col,label=False)
    d.wire('3L','3M','3V3',[(710,330),(710,400),(1100,400),(1100,330)],C['purple'],False)
    d.wire('3M','3R','3V3',[(1390,190),(1810,190)],C['purple'],False)
    d.wire('G_L','GL1','GND',color=C['ground'],label=False);d.wire('GR2','G_R','GND',color=C['ground'],label=False)
    for side,x,bottom in [('L',490,565),('R',2710,3125)]:
        d.node('Gbottom_'+side,bottom,2300,'GND');d.wire('G_'+side,'Gbottom_'+side,'GND',[(x,2080),(bottom,2080)],C['ground'],False)
    d.wire('P1.3V3','3R','3V3',[(1810,1430)],C['purple'])
    d.wire('U1.3V3','3M','3V3',[(1380,280),(1380,330)],C['purple'])
    d.node('Gimu',3136,2300,'GND');d.wire('U1.GND','Gimu','GND',[(3136,280)],C['ground'])
    d.node('Gpi',1875,1460,'GND');d.wire('P1.GND','Gpi','GND',[(1875,1470)],C['ground'])
    # Mirrored wheel channels. All six motor leads and both converters exist.
    for side,mirror,gps in [('L',False,[6,7,11,26,2,3]),('R',True,[8,9,18,27,4,5])]:
        X=lambda x:3200-x if mirror else x
        edge='left' if mirror else 'right';inside='right' if mirror else 'left'
        m='M'+side;drv='D'+side;buf='B'+side;adc='A'+side
        d.box(m,X(454) if mirror else 64,440,390,640,'Pololu 4752 wheel motor','12 V / 30:1 / encoder fitted',color=C['blue'])
        cx=X(210)
        s.p.append(f'<circle cx="{cx}" cy="610" r="68" fill="{C["white"]}" stroke="{C["ink"]}" stroke-width="4"/>')
        s.text(cx,623,m,36,C['ink'],700,'middle');s.text(cx,713,'BRUSHED DC MOTOR',18,C['muted'],600,'middle')
        s.rect(cx-65,790,130,110,'#e8eeea',5);s.text(cx,853,'ENCODER',19,C['green'],700,'middle')
        leads=[('RED',540,'OUT1',C['red']),('BLACK',600,'OUT2',C['ink']),('GREEN',760,'GND',C['green']),('BLUE',820,'5V',C['blue']),('YELLOW',880,'A',C['yellow']),('WHITE',940,'B',C['ground'])]
        for lead,y,name,col in leads:d.port(m,lead,X(454),y,lead+' / '+name,edge,col)
        d.box(drv,X(1210) if mirror else 820,440,390,570,'Pololu 4035 / DRV8874','Functional module terminals',color=C['blue'])
        for pin,y in [('OUT1',540),('OUT2',600)]:d.port(drv,pin,X(820),y,pin,inside,C['red'] if pin=='OUT1' else C['ink'])
        for pin,y in [('EN',650),('PH',710),('SLEEP',770),('FAULT',830),('CS',890)]:d.port(drv,pin,X(1210),y,pin,edge)
        d.port(drv,'VIN',X(880),440,'VIN','top',C['red'])
        for pin,x in [('GND',880),('PMODE',990),('IMODE',1070),('VREF',1150)]:d.port(drv,pin,X(x),1010,pin,'bottom',C['ground'] if pin!='VREF' else C['orange'])
        s.text(X(1015),925,'VM: NC',18,C['muted'],600,'middle')
        s.text(X(1015),955,'Onboard: SLEEP → 10k → VREF',16,C['muted'],400,'middle')
        s.text(X(1015),981,'Onboard: CS → 2.49k → GND',16,C['muted'],400,'middle')
        d.node('VIN_'+side,X(880),420,'ACT_BUS');d.wire(drv+'.VIN','VIN_'+side,'ACT_BUS',color=C['red'])
        for lead,pin,col in [('RED','OUT1',C['red']),('BLACK','OUT2',C['ink'])]:d.wire(drv+'.'+pin,m+'.'+lead,side+'_MOTOR_'+pin,color=col)
        for gp,pin in zip(gps[:3],['EN','PH','FAULT']):d.wire('P1.GP'+str(gp),drv+'.'+pin,side+'_'+pin)
        d.box(adc,X(1370) if mirror else 1240,860,130,170,'ADC','TBD',True,C['yellow'])
        d.port(adc,'IN',X(1240),940,'IN',inside);d.port(adc,'OUT',X(1370),940,'OUT',edge)
        d.port(adc,'REF',X(1310),860,'3V3 ref','top',C['purple']);d.port(adc,'GND',X(1310),1030,'GND','bottom',C['ground'])
        d.wire(drv+'.CS',adc+'.IN',side+'_CS',[(X(1235),890),(X(1235),940)])
        d.wire(adc+'.OUT','P1.GP'+str(gps[3]),side+'_ADC_SAFE',[(X(1380),940),(X(1380),890)])
        d.node('ADCref_'+side,X(1310),330,'3V3');d.wire(adc+'.REF','ADCref_'+side,'3V3',color=C['purple'])
        d.node('ADCg_'+side,X(1310),1460,'GND');d.wire(adc+'.GND','ADCg_'+side,'GND',color=C['ground'])
        d.resistor('RF'+side,X(1290),735,'pull-up TBD',pending=True,label_side='left' if mirror else 'right')
        d.node('FAULT_'+side,X(1290),830,side+'_FAULT');d.node('RF3_'+side,X(1290),330,'3V3')
        d.wire('RF'+side+'.1','RF3_'+side,'3V3',color=C['purple']);d.wire('RF'+side+'.2','FAULT_'+side,side+'_FAULT')
        d.node('DG_'+side,X(770),1080,'GND');d.node('DGend_'+side,X(1150),1080,'GND')
        d.wire('DG_'+side,'DGend_'+side,'GND',color=C['ground'],label=False)
        for pin,x in [('GND',880),('PMODE',990),('IMODE',1070)]:
            d.node('DG'+pin+'_'+side,X(x),1080,'GND');d.wire(drv+'.'+pin,'DG'+pin+'_'+side,'GND',color=C['ground'],label=False)
        d.resistor('RV'+side,X(1150),1024,'TBD: calibrate',pending=True,label_side='left' if mirror else 'right',label_offsets=(35,61))
        d.wire(drv+'.VREF','RV'+side+'.1',side+'_VREF',color=C['orange'],label=False);d.wire('RV'+side+'.2','DGend_'+side,'GND',color=C['ground'],label=False)
        d.wire('DG_'+side,'GL1' if side=='L' else 'GR2','GND',color=C['ground'],label=False)
        d.wire(m+'.GREEN','G_'+side,'GND',[(X(490),760)],C['green'])
        d.wire(m+'.BLUE','5L' if side=='L' else '5R','5V',[(X(550),820)],C['blue'])
        d.box(buf,X(1210) if mirror else 820,1100,390,260,'Encoder input buffer','5 V-tolerant inputs / 3.3 V outputs',True,C['green'])
        for pin,y in [('A_IN',1170),('B_IN',1230)]:d.port(buf,pin,X(820),y,pin,inside,label_offset=15 if y==1170 else 6)
        for pin,y in [('A_OUT',1170),('B_OUT',1230)]:d.port(buf,pin,X(1210),y,pin,edge,label_offset=15 if y==1170 else 6)
        d.port(buf,'3V3',X(1060),1100,'3V3','top',C['purple']);d.port(buf,'GND',X(1000),1360,'GND','bottom',C['ground'])
        s.text(X(1015),1325,'Non-inverting / enable defined in circuit',16,C['muted'],400,'middle')
        d.wire(m+'.YELLOW',buf+'.A_IN',side+'_ENC_A5',[(X(600),880),(X(600),1170)],C['yellow'])
        d.wire(m+'.WHITE',buf+'.B_IN',side+'_ENC_B5',[(X(640),940),(X(640),1230)],'white')
        for gp,pin in zip(gps[4:],['A_OUT','B_OUT']):d.wire(buf+'.'+pin,'P1.GP'+str(gp),side+'_ENC_'+pin)
        d.node('B3_'+side,X(1230),330,'3V3');d.wire(buf+'.3V3','B3_'+side,'3V3',[(X(1060),1090),(X(1230),1090)],C['purple'])
        d.node('BG_'+side,X(1000),1460,'GND');d.wire(buf+'.GND','BG_'+side,'GND',color=C['ground'])
    # Optional command connector; no unknown receiver cable colors are invented.
    d.box('J7',64,1260,390,310,'Optional UART0 port','3.3 V compatible external bridge only',True,C['cyan'])
    for pin,y in [('TX',1340),('RX',1400),('GND',1460),('3V3',1520)]:d.port('J7',pin,454,y,pin,'right')
    d.wire('P1.GP0','J7.RX','UART0_TX',[(580,1380),(580,1400)])
    d.wire('J7.TX','P1.GP1','UART0_RX',[(560,1340),(560,1390),(1380,1390),(1380,1420)])
    d.wire('J7.GND','G_L','GND',color=C['ground']);d.node('J7V',610,1520,'3V3');d.wire('J7.3V3','J7V','3V3',color=C['purple'])
    # Momentary deliberate-arm input, active low with a proposed external bias.
    d.node('ARM',1300,1480,'ARM_N');d.resistor('RA',1300,1408,'10k proposed')
    d.wire('P1.GP19','ARM','ARM_N');d.wire('RA.2','ARM','ARM_N',label=False)
    d.node('RA3',1390,330,'3V3');d.wire('RA.1','RA3','3V3',[(1390,1408)],C['purple'])
    d.box('SW2',1180,1515,180,90,'ARM','momentary / NO',False,C['cyan'])
    d.port('SW2','IN',1300,1515,'IN','top');d.port('SW2','GND',1260,1605,'GND','bottom',C['ground'])
    d.wire('ARM','SW2.IN','ARM_N',label=False);d.node('SWG',1260,1460,'GND');d.wire('SW2.GND','SWG','GND',[(1160,1605),(1160,1460)],C['ground'])
    # Independent watchdog + fail-low enable gate.
    d.box('WD',640,1670,330,250,'Hardware watchdog','No heartbeat → unhealthy',True,C['red'])
    d.box('G1',1080,1670,280,250,'Latching gate','Request + health + cut OK',True,C['red'])
    s.text(1100,1900,'Fault latch / deliberate rearm',16,C['red'],700)
    for ref,pin,x,y,side in [('WD','HB',970,1740,'right'),('WD','HEALTH',970,1800,'right'),('WD','3V3',800,1670,'top'),('WD','GND',900,1920,'bottom'),('G1','REQUEST',1360,1740,'right'),('G1','HEALTH',1080,1800,'left'),('G1','KILL_OK',1080,1850,'left'),('G1','3V3',1150,1670,'top'),('G1','OUT',1210,1670,'top'),('G1','GND',1260,1920,'bottom')]:d.port(ref,pin,x,y,pin,side,label_offset=15 if pin=='REQUEST' else 6)
    d.wire('P1.GP10','G1.REQUEST','ENABLE_REQUEST',[(1375,1280),(1375,1740)])
    d.wire('P1.GP22','WD.HB','HEARTBEAT',[(1400,1320),(1400,1638),(1010,1638),(1010,1740)])
    d.wire('WD.HEALTH','G1.HEALTH','WD_HEALTH')
    d.node('CTRL3',610,1600,'3V3');d.wire('3L','CTRL3','3V3',color=C['purple'],label=False)
    d.wire('CTRL3','WD.3V3','3V3',[(800,1600)],C['purple']);d.wire('CTRL3','G1.3V3','3V3',[(1150,1600)],C['purple'])
    d.node('GWD',1020,2300,'GND');d.wire('WD.GND','GWD','GND',[(900,1960),(1020,1960)],C['ground'])
    d.node('GG',1560,2300,'GND');d.wire('G1.GND','GG','GND',[(1260,1950),(1560,1950)],C['ground'])
    d.node('EN',1385,1630,'HW_ENABLE');d.wire('G1.OUT','EN','HW_ENABLE',[(1210,1630)],C['red'])
    d.wire('EN','DL.SLEEP','HW_ENABLE',[(1385,790),(1225,790),(1225,770)],C['red'])
    d.node('ENR',1975,1630,'HW_ENABLE');d.wire('EN','ENR','HW_ENABLE',color=C['red'],label=False);d.wire('ENR','DR.SLEEP','HW_ENABLE',[(1975,770)],C['red'])
    # Logic power diode. Anode from external 5 V; cathode to VSYS.
    d.box('D5',1530,1645,140,70,'Diode','Schottky TBD',True,C['orange'])
    d.port('D5','K',1600,1645,'K → VSYS','top',C['orange']);d.port('D5','A',1600,1715,'A ← 5V','bottom',C['orange'])
    d.node('5D',1600,2020,'5V');d.wire('D5.A','5D','5V',color=C['orange'])
    d.wire('D5.K','P1.VSYS','VSYS',[(1800,1645),(1800,1390)],C['orange'])
    # Three-wire UART into a half-duplex interface; one bus branches to EACH servo.
    d.box('T1',2000,1700,390,250,'TTL half-duplex interface','3.3 V logic / verify bus level',True,C['cyan'])
    for pin,y in [('TX_IN',1780),('RX_OUT',1830),('DIR',1880)]:d.port('T1',pin,2000,y,pin,'left')
    d.port('T1','DATA',2390,1830,'DATA','right');d.port('T1','3V3',2180,1700,'3V3','top',C['purple']);d.port('T1','GND',2180,1950,'GND','bottom',C['ground'])
    for gp,pin,y,x in [(20,'TX_IN',1780,1820),(21,'RX_OUT',1830,1850),(17,'DIR',1880,1880)]:d.wire('P1.GP'+str(gp),'T1.'+pin,'SERVO_'+pin,[(x,{20:1270,21:1310,17:1350}[gp]),(x,y)])
    d.node('T3',2500,1620,'3V3');d.wire('3E','T3','3V3',color=C['purple'],label=False);d.wire('T3','T1.3V3','3V3',[(2180,1620)],C['purple'])
    d.node('TG',2050,2300,'GND');d.wire('T1.GND','TG','GND',[(2180,2010),(2050,2010)],C['ground'])
    d.node('DATA',2590,1980,'SERVO_DATA');d.wire('T1.DATA','DATA','SERVO_DATA',[(2590,1830)])
    for side,x,edge in [('L',64,'right'),('R',2746,'left')]:
        ref='S'+side;xp=x+390 if side=='L' else x
        d.box(ref,x,1780,390,260,'ST3215 leg servo','12 V variant / test at 9 V',False,C['purple'],sub_bottom=True)
        s.p.append(f'<circle cx="{x+180}" cy="1920" r="46" fill="#eeebf5" stroke="{C["purple"]}" stroke-width="3"/>');s.text(x+180,1931,ref,26,C['purple'],700,'middle')
        for pin,y,col in [('V+',1840,C['purple']),('DATA',1900,C['cyan']),('GND',1960,C['ground'])]:d.port(ref,pin,xp,y,pin,edge,col)
        d.wire(ref+'.V+','9L' if side=='L' else '9R','9V',[(520 if side=='L' else 2670,1840)],C['purple'])
        d.wire(ref+'.DATA','DATA','SERVO_DATA',[(560,1900),(560,1980)] if side=='L' else [(2590,1900)])
        d.node('SG_'+side,490 if side=='L' else 2710,1960,'GND');d.wire(ref+'.GND','SG_'+side,'GND',color=C['ground'])
    # Explicit pack, fuse, physical cut, converter in/out returns and servo cut.
    for ref,x,w,title,sub in [('BAT',64,240,'3S pack','12.6 V max / TBD'),('F1',380,160,'Fuse','rating TBD'),('V5',630,350,'5 V regulator','Protection / circuit TBD'),('SW1',1100,400,'Physical actuator cut','Positive power pole + logic AUX contact'),('AP',1640,380,'Pack ADC network','Divider / filter / power-off protection TBD'),('V9',2140,350,'9 V regulator','Return-energy protection TBD'),('QS',2580,530,'Servo torque-cut switch','PROPOSED / fail off / circuit + discharge TBD')]:d.box(ref,x,2110,w,125,title,sub,True,C['red'] if ref in ['BAT','F1','SW1'] else C['purple'] if ref in ['V9','QS'] else C['orange'])
    for ref,pin,x,y,side in [('BAT','+',304,2150,'right'),('BAT','-',184,2235,'bottom'),('F1','IN',380,2150,'left'),('F1','OUT',540,2150,'right'),('V5','IN+',630,2150,'left'),('V5','OUT+',800,2110,'top'),('V5','IN-',700,2235,'bottom'),('V5','OUT-',910,2235,'bottom'),('SW1','IN+',1100,2150,'left'),('SW1','OUT+',1500,2150,'right'),('SW1','AUX_IN',1200,2110,'top'),('SW1','AUX_OUT',1390,2110,'top'),('AP','IN',1640,2150,'left'),('AP','OUT',1970,2110,'top'),('AP','AGND',1840,2110,'top'),('AP','REF',1720,2110,'top'),('AP','GND',1840,2235,'bottom'),('V9','IN+',2140,2150,'left'),('V9','OUT+',2390,2110,'top'),('V9','IN-',2200,2235,'bottom'),('V9','OUT-',2450,2235,'bottom'),('QS','IN+',2580,2150,'left'),('QS','OUT+',2990,2110,'top'),('QS','ENABLE',2730,2110,'top'),('QS','3V3',2850,2110,'top'),('QS','GND',3090,2235,'bottom')]:d.port(ref,pin,x,y,pin,side)
    d.wire('BAT.+','F1.IN','PACK',color=C['red']);d.wire('F1.OUT','FUSED','PACK_FUSED',color=C['red']);d.wire('FUSED','V5.IN+','PACK_FUSED',color=C['red'])
    d.wire('FUSED','SW1.IN+','PACK_FUSED',[(580,2060),(1080,2060),(1080,2150)],C['red'])
    d.wire('FUSED','AP.IN','PACK_FUSED',[(580,2080),(1600,2080),(1600,2150)],C['red'])
    d.wire('SW1.OUT+','ACT_LOW','ACT_BUS',[(1540,2150),(1540,2060)],C['red'])
    d.wire('ACT_LOW','V9.IN+','ACT_BUS',[(2100,2060),(2100,2150)],C['red'])
    d.node('5REG',800,2020,'5V');d.wire('V5.OUT+','5REG','5V',color=C['orange'])
    d.wire('V9.OUT+','QS.IN+','9V_RAW',[(2390,2050),(2540,2050),(2540,2150)],C['purple'])
    d.wire('QS.OUT+','9R','9V',[(2990,2090)],C['purple'])
    d.wire('ENR','QS.ENABLE','HW_ENABLE',[(2485,1630),(2485,2055),(2730,2055)],C['red'])
    d.wire('T3','QS.3V3','3V3',[(2500,2070),(2850,2070)],C['purple'])
    d.node('APREF',1810,1430,'3V3');d.wire('AP.REF','APREF','3V3',[(1720,2070),(1810,2070)],C['purple'])
    d.wire('P1.AGND','AP.AGND','GND',[(1840,1510)],C['ground'])
    d.wire('AP.OUT','P1.GP28','PACK_ADC_SAFE',[(1970,2010),(1950,2010),(1950,1550)])
    d.wire('CTRL3','SW1.AUX_IN','3V3',[(610,2040),(1200,2040)],C['purple'])
    d.node('KILL',1030,1850,'KILL_OK');d.wire('SW1.AUX_OUT','KILL','KILL_OK',[(1390,2000),(1005,2000),(1005,1850)]);d.wire('KILL','G1.KILL_OK','KILL_OK')
    d.resistor('RK',1030,1880,'pull-down TBD',pending=True);d.wire('KILL','RK.1','KILL_OK',label=False);d.node('RKG',1020,1960,'GND');d.wire('RK.2','RKG','GND',[(1030,1960)],C['ground'],False)
    for ref,pin,x in [('BAT','-',184),('V5','IN-',700),('V5','OUT-',910),('AP','GND',1840),('V9','IN-',2200),('V9','OUT-',2450),('QS','GND',3090)]:
        d.node(ref+pin+'G',x,2300,'GND');d.wire(ref+'.'+pin,ref+pin+'G','GND',color=C['ground'],label=False)
    # Rail names do not replace any drawn conductor.
    for x,y,t,col in [(615,318,'3.3 V',C['purple']),(1900,408,'SWITCHED ACTUATOR BUS',C['red']),(1770,2009,'REGULATED 5 V',C['orange']),(70,2079,'PROTECTED + SWITCHED 9 V',C['purple']),(70,2288,'COMMON RETURN / GND',C['ground'])]:s.label(x,y,t,col,20)
    s.text(65,1645,'WIRE IDs → searchable conductor register',22,C['green'],700)
    s.text(65,1675,'Dots connect. Gaps at crossings do not connect.',18,C['muted'])
    s.text(65,1703,'BLACK wheel lead is switched OUT2, not ground.',18,C['ink'],700)
    s.text(65,1731,'Dashed circuits need part selection and bench checks.',18,C['muted'])
    d.finish('v1-proof-el-01-overview')
    return d

def both_wheels():
    """A spacious conductor-level detail, two complete channels, no 'repeat'."""
    d=Circuit('EL-05','Both wheel motors — every wire','Two complete channels. Rails and enable come from EL-01. Use terminal names here. EL-01 has the conductor register IDs.',3200,2000,show_ids=False)
    s=d.s
    for side,ybase,gps in [('L',220,[6,7,11,26,2,3]),('R',1080,[8,9,18,27,4,5])]:
        m='M'+side;drv='D'+side;buf='B'+side;adc='A'+side
        d.box('P'+side,80,ybase+120,450,540,'Pico 2 / '+('LEFT' if side=='L' else 'RIGHT'),'Individual GPIO terminals',False,C['green'])
        d.box(drv,1080,ybase+120,480,370,'DRV8874 / '+side,'Pololu 4035 carrier',False,C['blue'])
        d.box(m,2600,ybase+120,520,600,'4752 / '+side+' wheel motor','12 V / 30:1 / encoder fitted',False,C['blue'])
        s.p.append(f'<circle cx="2875" cy="{ybase+310}" r="66" fill="{C["white"]}" stroke="{C["ink"]}" stroke-width="4"/>');s.text(2875,ybase+323,m,34,C['ink'],700,'middle')
        s.rect(2805,ybase+470,140,108,'#e8eeea',4);s.text(2875,ybase+532,'ENCODER',19,C['green'],700,'middle')
        for gp,pin,y in zip(gps[:4],['EN','PH','FAULT','CS'],[ybase+240,ybase+300,ybase+360,ybase+420]):
            d.port('P'+side,'GP'+str(gp),530,y,f'GP{gp} / p{PIN[gp]}','right',gpio=gp)
            d.port(drv,pin,1080,y,pin,'left')
            if pin=='CS':
                d.box(adc,700,ybase+390,220,135,'ADC protection','TBD / high impedance',True,C['yellow']);d.port(adc,'IN',920,ybase+450,'IN','right');d.port(adc,'OUT',700,ybase+450,'OUT','left')
                d.wire(drv+'.CS',adc+'.IN',side+'_CS',[(960,y),(960,ybase+450)]);d.wire(adc+'.OUT','P'+side+'.GP'+str(gp),side+'_CS_SAFE',[(600,ybase+450),(600,y)])
            else:d.wire('P'+side+'.GP'+str(gp),drv+'.'+pin,side+'_'+pin)
        d.port(drv,'OUT1',1560,ybase+240,'OUT1','right',C['red']);d.port(drv,'OUT2',1560,ybase+300,'OUT2','right',C['ink'])
        for pin,y,col in [('RED',ybase+240,C['red']),('BLACK',ybase+300,C['ink']),('GREEN',ybase+430,C['green']),('BLUE',ybase+490,C['blue']),('YELLOW',ybase+550,C['yellow']),('WHITE',ybase+610,C['ground'])]:d.port(m,pin,2600,y,pin,'left',col)
        d.wire(drv+'.OUT1',m+'.RED',side+'_MOTOR_OUT1',color=C['red']);d.wire(drv+'.OUT2',m+'.BLACK',side+'_MOTOR_OUT2',color=C['ink'])
        d.box(buf,1740,ybase+475,470,205,'5 V-tolerant buffer','3.3 V / non-inverting / part TBD',True,C['green'])
        for pin,y,x,edge in [('A_IN',ybase+550,2210,'right'),('B_IN',ybase+610,2210,'right'),('A_OUT',ybase+550,1740,'left'),('B_OUT',ybase+610,1740,'left')]:d.port(buf,pin,x,y,pin,edge)
        for gp,pin,y in zip(gps[4:],['A_OUT','B_OUT'],[ybase+550,ybase+610]):d.port('P'+side,'GP'+str(gp),530,y,f'GP{gp} / p{PIN[gp]}','right',gpio=gp);d.wire(buf+'.'+pin,'P'+side+'.GP'+str(gp),side+'_ENC_'+pin)
        d.wire(m+'.YELLOW',buf+'.A_IN',side+'_ENC_A5',color=C['yellow']);d.wire(m+'.WHITE',buf+'.B_IN',side+'_ENC_B5',color='white')
        # Four visible rails, each fed from a labeled EL-01 terminal.
        rails=[('3V3',ybase+80,C['purple']),('ACT_BUS',ybase+40,C['red']),('5V',ybase+740,C['orange']),('GND',ybase+785,C['ground'])]
        for net,y,col in rails:
            a=d.node(side+net+'a',640,y,net);b=d.node(side+net+'b',2500,y,net);d.wire(a,b,net,color=col,label=False);s.label(650,y-10,net+' / EL-01',col,20)
        for ref,pin,x,y,rail,col in [(drv,'VIN',1480,ybase+120,'ACT_BUS',C['red']),(drv,'GND',1160,ybase+490,'GND',C['ground']),(drv,'PMODE',1260,ybase+490,'GND',C['ground']),(drv,'IMODE',1360,ybase+490,'GND',C['ground']),(buf,'3V3',2080,ybase+475,'3V3',C['purple']),(buf,'GND',2000,ybase+680,'GND',C['ground']),(adc,'GND',820,ybase+525,'GND',C['ground']),(adc,'REF',820,ybase+390,'3V3',C['purple'])]:
            d.port(ref,pin,x,y,pin,'top' if rail in ['3V3','ACT_BUS'] else 'bottom',col)
            # Supplies to the buffer route beside its body, not through the driver.
            rx=1690 if ref==buf and rail=='3V3' else x
            ny=next(yy for n,yy,c in rails if n==rail);node=d.node(side+ref+pin,rx,ny,rail)
            via=[(x,y-25),(rx,y-25)] if rx!=x else []
            d.wire(ref+'.'+pin,node,rail,via,col)
        for lead,net,x,col in [('GREEN','GND',2460,C['green']),('BLUE','5V',2500,C['blue'])]:
            yy=next(y for n,y,c in rails if n==net);node=d.node(side+lead,x,yy,net);d.wire(m+'.'+lead,node,net,[(x,d.ports[m+'.'+lead]['position'][1])],col)
        # Enable is a distinct conductor, never a direct Pico GPIO-to-SLEEP wire.
        d.port(drv,'SLEEP',1080,ybase+205,'SLEEP','left',C['red']);n=d.node('EN'+side,640,ybase+205,'HW_ENABLE');d.wire(n,drv+'.SLEEP','HW_ENABLE',color=C['red']);s.label(650,ybase+195,'HW_ENABLE / EL-01',C['red'],20)
        d.resistor('RF'+side,990,ybase+310,'pull-up TBD',pending=True,label_side='left');d.node('F'+side,990,ybase+360,side+'_FAULT');d.node('RF'+side+'3',990,ybase+80,'3V3')
        d.wire('RF'+side+'.1','RF'+side+'3','3V3',color=C['purple']);d.wire('RF'+side+'.2','F'+side,side+'_FAULT')
        d.port(drv,'VREF',1480,ybase+490,'VREF','bottom',C['orange']);d.resistor('RV'+side,1480,ybase+645,'limit TBD',pending=True);d.node('RV'+side+'g',1480,ybase+785,'GND')
        d.wire(drv+'.VREF','RV'+side+'.1',side+'_VREF',color=C['orange'],label=False);d.wire('RV'+side+'.2','RV'+side+'g','GND',color=C['ground'])
        s.text(1320,ybase+458,'VM: NC',18,C['muted'],600,'middle')
        s.text(2700,ybase+695,'BLACK is a switched motor lead.',18,C['ink'],700)
    d.finish('v1-proof-el-05-both-wheels')
    return d

def register(master):
    p=HERE/'v1-proof-netlist.json';data=json.loads(p.read_text())
    components={key:{**part,'rect':[part['rect'][0],master.s.layout_y(part['rect'][1]),part['rect'][2],round(master.s.layout_y(part['rect'][1]+part['rect'][3])-master.s.layout_y(part['rect'][1]),3)]} for key,part in master.parts.items()}
    ports={key:{**port,'position':master.s.layout_point(port['position'])} for key,port in master.ports.items()}
    connections=[{**wire,'route':[master.s.layout_point(point) for point in wire['route']]} for wire in master.wires]
    data.update(revision='B',source_checked='2026-10-04',components=components,ports=ports,connections=connections,
                drawing_layout=dict(view_box=[3200,2000],paper_inches=[17,11],margin_inches=0.5,layout_date='2026-10-05'),
                external_nc=['P1.ADC_VREF p35','P1.3V3_EN p37','P1.RUN p30','DL.VM','DR.VM','U1.INT2','U1.auxiliary SPI','U1.Qwiic'])
    # A graph check catches omitted GPIO wires and accidental shorts, independent
    # of the visual layout. Wire intersections are not graph connections.
    nets={}
    for w in master.wires:
        for end in [w['source'],w['destination']]:nets.setdefault(end,set()).add(w['net'])
    assert all(len(v)==1 for v in nets.values()),[(k,v) for k,v in nets.items() if len(v)>1]
    assert all('P1.GP'+str(g) in nets for g in [*range(23),26,27,28])
    for side in ['L','R']:
        assert all('M'+side+'.'+lead in nets for lead in ['RED','BLACK','GREEN','BLUE','YELLOW','WHITE'])
        assert all('S'+side+'.'+lead in nets for lead in ['V+','DATA','GND'])
    unused=set(master.ports)-set(nets)
    assert not unused,unused
    data['internal_connections']=[dict(component='P1',net='GND',terminals=['P1.GND','P1.AGND','P1.USB_GND'],reason='Common return on the Pico PCB')]
    data['validation']=dict(gpio_count=26,wheel_motor_leads=12,servo_leads=6,net_count=len({w['net'] for w in master.wires}),external_conductors=len(master.wires),all_drawn_ports_connected=True,no_endpoint_net_conflicts=True,
                            all_drawn_nets_connected=True,no_different_net_collinear_overlaps=True,no_different_net_endpoint_touches=True,no_wires_hidden_inside_components=True)
    p.write_text(json.dumps(data,indent=2)+'\n')
    rows=[]
    for w in master.wires:
        a=master.ports[w['source']];b=master.ports[w['destination']]
        rows.append('<tr>'+''.join('<td>'+escape(str(t))+'</td>' for t in [w['id'],w['source']+' / '+a['label'],w['destination']+' / '+b['label'],w['net']])+'</tr>')
    html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hux Rev B conductor register</title><style>body{margin:0;background:#f7f5ee;color:#20343e;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:32px}h1{font-size:36px;line-height:1.15}a{color:#387b65}input{font:inherit;width:100%;padding:12px;box-sizing:border-box;border:1px solid #647780;background:#fffef9}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ced8d7}th{background:#e8eeea}.scroll{overflow:auto}small{color:#647780}input:focus-visible,a:focus-visible{outline:3px solid #218ca0;outline-offset:3px}</style></head><body><main><p>HUX / V1-PROOF / EL-01 / REV B</p><h1>Every conductor and its endpoints</h1><p>04 October 2026. The register follows the full system schematic. Circuit values, connector face views and wire sizes remain to select and test.</p><p><a href="../../tools/living-drawings/electrical.html">Electrical page</a> · <a href="v1-proof-el-01-overview.svg">Full schematic</a> · <a href="v1-proof-netlist.json">JSON connection data</a></p><label for="search">Find a wire, component, GPIO or net</label><input id="search" type="search" placeholder="For example: ML.BLUE, GP6, SLEEP or W001"><p id="count" aria-live="polite"></p><div class="scroll"><table><thead><tr><th>Wire</th><th>From terminal</th><th>To terminal</th><th>Electrical net</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table></div><p><small>Junction terminals and rails are drawn connection points. One register row is one conductor segment between named endpoints. USB rows are cable conductors, not bare GPIO connections.</small></p></main><script>const q=document.getElementById('search'),rows=[...document.querySelectorAll('tbody tr')],count=document.getElementById('count');function filter(){const term=q.value.toLowerCase().trim();let n=0;for(const row of rows){row.hidden=!row.textContent.toLowerCase().includes(term);if(!row.hidden)n++;}count.textContent=n+' of '+rows.length+' conductors';}q.addEventListener('input',filter);filter();</script></body></html>'''
    (HERE/'v1-proof-wire-register.html').write_text(html)
