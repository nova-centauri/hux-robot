import math, itertools
H=(30.0,0.0)                      # lower hip, body coords (X rearward, Z up)
def lever(q,rL,phi):              # point on the lower link lever, phi>0 rotates lever forward of the link
    a=math.radians(q+phi); return (H[0]-rL*math.sin(a), H[1]-rL*math.cos(a))
def crank_angle(C,S):  return math.degrees(math.atan2(S[1]-C[1],S[0]-C[0]))
def solve(C,rs,P,L,branch):
    # crank tip S on circle (C,rs) with |S-P|=L. two solutions; branch picks.
    dx,dy=P[0]-C[0],P[1]-C[1]; d=math.hypot(dx,dy)
    if d>rs+L or d<abs(rs-L): return None
    a=(rs*rs-L*L+d*d)/(2*d); h=math.sqrt(max(rs*rs-a*a,0))
    mx,my=C[0]+a*dx/d,C[1]+a*dy/d
    return (mx+branch*h*dy/d, my-branch*h*dx/d)
def evaluate(C,rs,rL,phi,L,branch,qs=range(15,41)):
    out=[]
    for q in qs:
        P=lever(q,rL,phi); S=solve(C,rs,P,L,branch)
        if S is None: return None
        # transmission angle at lever: angle between pushrod and lever arm; at crank likewise
        def ang(u,v):
            c=(u[0]*v[0]+u[1]*v[1])/(math.hypot(*u)*math.hypot(*v)); return math.degrees(math.acos(max(-1,min(1,c))))
        rod=(S[0]-P[0],S[1]-P[1]); arm=(P[0]-H[0],P[1]-H[1]); crk=(S[0]-C[0],S[1]-C[1])
        tL=ang(rod,arm); tC=ang(rod,crk)
        out.append((q,P,S,crank_angle(C,S),tL,tC))
    return out
def summarize(res):
    ca=[r[3] for r in res]; sweep=max(ca)-min(ca)
    tL=[min(r[4],180-r[4]) for r in res]; tC=[min(r[5],180-r[5]) for r in res]
    # local ratio d(crank)/d(leg)
    ratios=[abs(ca[i+1]-ca[i]) for i in range(len(ca)-1)]
    return sweep,min(tL),min(tC),min(ratios),max(ratios)
if __name__=='__main__':
    best=[]
    for cx in [-24,-21,-18,-15]:
      for cz in [-4,-1,2,5]:
        for rs in [10,11,12,13,14]:
          for rL in [30,33,36,39,42]:
            for phi in [0,10,20,30,40]:
              for L in range(30,75,2):
                for br in (1,-1):
                  res=evaluate((cx,cz),rs,rL,phi,L,br)
                  if not res: continue
                  sweep,mL,mC,rmin,rmax=summarize(res)
                  if mL<50 or mC<50: continue
                  # crank tip must stay forward of cx+2 (clear the upper link) and above the tray flange band
                  if max(r[2][0] for r in res)>cx+2: continue
                  if min(r[2][1] for r in res)<-19: continue
                  best.append((abs(sweep-90)+ (rmax/rmin-1)*40, sweep,mL,mC,rmin,rmax,cx,cz,rs,rL,phi,L,br))
    best.sort()
    print('score sweep minTL minTC rmin rmax | cx cz rs rL phi L br')
    for b in best[:25]: print(' '.join(f'{v:7.1f}' if isinstance(v,float) else f'{v:4}' for v in b))
