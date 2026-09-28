/* V1-PROOF pinned-leg rigid-body simulation. SI units; +X forward, +Y left, +Z up.
 * Rapier supplies unconstrained 3D rigid bodies, wheel joints and ground contact.
 * No pose animation, planar lock, support force or simulator velocity feedback.
 */
"use strict";
const R = require("../living-drawings/node_modules/@dimforge/rapier3d-compat");
const model = require("./model.json");
const G = 9.81, TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const v = (x=0, y=0, z=0) => ({x,y,z});
const add = (a,b) => v(a.x+b.x,a.y+b.y,a.z+b.z);
const scale = (a,s) => v(a.x*s,a.y*s,a.z*s);
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const axis = (a,t) => ({...scale(a, Math.sin(t/2)), w:Math.cos(t/2)});
function rotate(q,p) {
  const t = scale(v(q.y*p.z-q.z*p.y,q.z*p.x-q.x*p.z,q.x*p.y-q.y*p.x),2);
  return add(p,add(scale(t,q.w),v(q.y*t.z-q.z*t.y,q.z*t.x-q.x*t.z,q.x*t.y-q.y*t.x)));
}
const angleDiff = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
function random(seed) { return () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; }; }

// Generic four-state discrete LQR, second-order discretization and Riccati iteration.
// Plant [distance, speed, pitch, pitch-rate]; input is SUM of wheel torques.
function gains(m,mw,h,I,Iw,r,dt) {
  const a=m+mw+Iw/r**2, b=m*h, d=I+m*h*h, det=a*d-b*b;
  const Ac=[[0,1,0,0],[0,0,-b*m*G*h/det,0],[0,0,0,1],[0,0,a*m*G*h/det,0]];
  const Bc=[0,(d/r+b)/det,0,-(b/r+a)/det];
  const A=Ac.map((row,i)=>row.map((x,j)=>(i===j?1:0)+x*dt+Ac[i].reduce((s,x,k)=>s+x*Ac[k][j],0)*dt*dt/2));
  const B=Bc.map((x,i)=>x*dt+Ac[i].reduce((s,x,j)=>s+x*Bc[j],0)*dt*dt/2);
  const Q=[64,12,120,2], cost=3;
  let P=Q.map((x,i)=>Q.map((_,j)=>i===j?x:0)), K;
  for(let it=0;it<25000;it++) {
    const PB=P.map(row=>dot4(row,B)), denom=cost+dot4(B,PB);
    K=B.map((_,j)=>PB.reduce((s,x,i)=>s+x*A[i][j],0)/denom);
    const C=A.map((row,i)=>row.map((x,j)=>x-B[i]*K[j]));
    const PC=P.map(row=>B.map((_,j)=>row.reduce((s,x,k)=>s+x*C[k][j],0)));
    const next=P.map((row,i)=>row.map((_,j)=>(i===j?Q[i]:0)+cost*K[i]*K[j]+C.reduce((s,row,k)=>s+row[i]*PC[k][j],0)));
    const delta=Math.max(...next.flatMap((row,i)=>row.map((x,j)=>Math.abs(x-P[i][j]))));
    P=next;
    if(delta<1e-9) return K;
  }
  throw new Error("LQR did not converge");
}
const dot4=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);

const DEFAULTS = {
  mass:2.5, comHeight:0.14, comOffset:0, lateralCom:0, inertiaScale:1,
  legAngle:30, mu:0.65, voltage:11.1, batteryResistance:0.12,
  motorScale:1, mismatch:0, driveLag:0.006, deadTorque:0.012,
  delay:0.004, pitchBias:0, gyroBias:0, noise:0.03, seed:1,
  wheelInertia:0.00022, rolling:0.015, rate:1000, controlRate:500,
  enabled:true, backlash:0, // output-side lost travel at each reversal, radians
};

function motorLimit(speed, voltage, p=DEFAULTS) {
  const s=model.wheel_screen, w0=s.no_load_rpm*TAU/60;
  const current=s.stall_extrapolation_nm/(s.stall_extrapolation_a-s.no_load_a)*(s.proposed_peak_current_limit_a-s.no_load_a);
  // Conservative symmetric motoring envelope, also applied to braking.
  return Math.max(0,Math.min(current,s.stall_extrapolation_nm*(voltage/s.reference_v-Math.abs(speed)/w0)))*p.motorScale;
}
function allocate(common,yaw,limits) {
  const c=clamp(common,-Math.min(...limits),Math.min(...limits));
  const lo=Math.max(-limits[0]-c,c-limits[1]);
  const hi=Math.min(limits[0]-c,c+limits[1]);
  const y=clamp(yaw,lo,hi);
  return [c+y,c-y]; // left faster -> yaw right (negative)
}

class Simulation {
  constructor(params={}, terrain={}) {
    this.p={...DEFAULTS,...params}; const p=this.p, g=model.geometry;
    this.r=g.wheel_diameter_mm/2000; this.track=g.wheel_track_mm/1000;
    this.dt=1/p.rate; this.tick=0; this.rng=random(p.seed);
    this.world=new R.World(v(0,0,-G)); this.world.timestep=this.dt;
    this.world.numSolverIterations=12;
    this.world.integrationParameters.normalizedAllowedLinearError=0.0001;
    this.ground=[];
    const floor=(desc)=>this.ground.push(this.world.createCollider(desc.setFriction(p.mu).setRestitution(0).setCollisionGroups(0x00010002)));
    floor(R.ColliderDesc.cuboid(20,20,0.1).setTranslation(0,0,-0.1));
    if(terrain.type==='bump' || terrain.type==='one-wheel-bump') {
      // Smooth half-cosine raised strip, fixed world location, actual triangle contacts.
      const verts=[], ids=[], n=40, width=terrain.length||0.3, start=terrain.start||0.55;
      const sides=terrain.type==='one-wheel-bump'?[0.06,0.3]:[-2,2];
      for(let i=0;i<=n;i++) { const x=start+width*i/n,z=terrain.height*(1-Math.cos(TAU*i/n))/2;
        sides.forEach(y=>verts.push(x,y,z));
        if(i<n){const k=2*i;ids.push(k,k+2,k+1,k+1,k+2,k+3);}
      }
      floor(R.ColliderDesc.trimesh(new Float32Array(verts),new Uint32Array(ids)));
    }
    if(terrain.type==='step') floor(R.ColliderDesc.cuboid(0.6,2,terrain.height/2).setTranslation(1.15,0,terrain.height/2));
    if(terrain.type==='slope' || terrain.type==='cross-slope') {
      // Whole floor tilts; spawn height chosen from local surface at each wheel.
      const q=axis(terrain.type==='slope'?v(0,1,0):v(1,0,0),-terrain.degrees*Math.PI/180);
      this.world.removeCollider(this.ground.pop(),true);
      floor(R.ColliderDesc.cuboid(20,20,0.1).setTranslation(0,0,-0.1).setRotation(q));
    }
    const qLeg=p.legAngle*Math.PI/180, L=g.link_length_mm/1000;
    this.geomX=L*(Math.sin(qLeg)-Math.sin(Math.PI/6));
    this.h=p.comHeight+L*(Math.cos(qLeg)-Math.cos(Math.PI/6));
    this.trim=-Math.atan2(this.geomX,this.h);
    const pitch=this.trim+(params.startPitch||0)*Math.PI/180;
    const rot=axis(v(0,1,0),pitch), wheelMass=0.125;
    this.sprung=p.mass-2*wheelMass;
    const I=this.sprung*(0.12**2+0.18**2)/12*p.inertiaScale;
    const rollStart=terrain.type==='cross-slope'?-terrain.degrees*Math.PI/180:0;
    const startZ=this.r+0.002+(terrain.type==='cross-slope'?Math.abs(this.track/2*Math.sin(rollStart)):0);
    this.body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,0,startZ).setRotation(rot)
      .setAdditionalMassProperties(this.sprung,v(this.geomX+p.comOffset,p.lateralCom,this.h),v(I,I,I*0.65),{x:0,y:0,z:0,w:1}).setCanSleep(false));
    this.bodyCol=this.world.createCollider(R.ColliderDesc.cuboid(0.06,0.055,0.075).setTranslation(this.geomX,0,this.h+0.02)
      .setDensity(0).setCollisionGroups(0x00020001),this.body);
    this.wheels=[1,-1].map(side=>{
      const body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,side*this.track/2,startZ)
        .setAdditionalMassProperties(wheelMass,v(),v(0.00012,p.wheelInertia,0.00012),{x:0,y:0,z:0,w:1}).setCanSleep(false));
      const col=this.world.createCollider(R.ColliderDesc.roundCylinder(g.wheel_width_mm/2000-0.002,this.r-0.002,0.002)
        .setDensity(0).setFriction(p.mu).setFrictionCombineRule(R.CoefficientCombineRule.Min).setCollisionGroups(0x00020001),body);
      this.world.createImpulseJoint(R.JointData.revolute(v(0,side*this.track/2,0),v(),v(0,1,0)),this.body,body,true).setContactsEnabled(false);
      return {body,col,torque:0,angle:0,counts:0,lastSign:0,lost:0,current:0};
    });
    // Controller uses nominal mass/inertia/CoM; parameter sweeps do not secretly retune it.
    const nominalM=DEFAULTS.mass-2*wheelMass;
    this.K=gains(nominalM,2*wheelMass,DEFAULTS.comHeight,nominalM*(0.12**2+0.18**2)/12,2*DEFAULTS.wheelInertia,this.r,1/p.controlRate);
    this.history=[];this.odom=0;this.vFilt=0;this.reference=0;this.speedRef=0;this.yawRef=0;this.yawAngle=0;
    this.request=[0,0];this.out={};this.lastYaw=0;this.heading=0;this.yawEst=0;
    this.metrics={maxPitch:0,maxRoll:0,maxSpeed:0,maxCurrent:0,currentSq:[0,0],saturation:0,bodyContact:false,maxAir:0,minVoltage:100};
    this.air=[0,0];this.trace=[];
  }
  state() {
    const q=this.body.rotation(), up=rotate(q,v(0,0,1)), forward=rotate(q,v(1,0,0)), lateral=rotate(q,v(0,1,0));
    const av=this.body.angvel(), pos=this.body.translation();
    const pitch=Math.atan2(forward.z*-1,Math.hypot(forward.x,forward.y));
    const roll=Math.atan2(-lateral.z,up.z), yaw=Math.atan2(forward.y,forward.x);
    return {pitch,roll,yaw,pitchRate:dot(av,lateral),yawRate:av.z,x:pos.x,y:pos.y,z:pos.z,
      speed:dot(this.body.linvel(),v(Math.cos(yaw),Math.sin(yaw),0)),lateral};
  }
  step(command={speed:0,yaw:0}, push=null) {
    const p=this.p,dt=this.dt,t=this.tick*dt,s=this.state();
    const stride=p.rate/p.controlRate;
    if(!Number.isInteger(stride)) throw Error('Physics rate must be a multiple of control rate');
    if(this.tick%stride===0) {
      const cd=1/p.controlRate;
      const speeds=this.wheels.map(w=>{
        const counts=Math.round(w.angle/TAU*1920), speed=(counts-w.counts)/1920*TAU*this.r/cd;
        w.counts=counts; return speed;
      });
      this.vFilt+=0.18*((speeds[0]+speeds[1])/2-this.vFilt);
      this.odom+=this.vFilt*cd;
      this.yawEst+=(s.yawRate+p.gyroBias+(this.rng()-0.5)*p.noise)*cd;
      this.history.push({pitch:s.pitch+p.pitchBias+(this.rng()-0.5)*p.noise*Math.PI/180,
        rate:s.pitchRate+(this.rng()-0.5)*p.noise,vel:this.vFilt,distance:this.odom,yawRate:s.yawRate+p.gyroBias,yaw:this.yawEst});
      const n=Math.ceil(p.delay/cd)+1;
      if(this.history.length>n) this.history.shift();
      const measured=this.history[0];
      this.speedRef+=clamp(command.speed-this.speedRef,-0.35*cd,0.35*cd);
      this.yawRef+=clamp(command.yaw-this.yawRef,-1.2*cd,1.2*cd);
      this.reference+=this.speedRef*cd;this.yawAngle+=this.yawRef*cd;
      // Bounded position reference prevents speed/yaw integrator wind-up during a shove.
      this.reference=clamp(this.reference,measured.distance-0.20,measured.distance+0.20);
      this.yawAngle=clamp(this.yawAngle,measured.yaw-0.35,measured.yaw+0.35);
      const error=[measured.distance-this.reference,measured.vel-this.speedRef,measured.pitch-this.trim,measured.rate];
      const common=-dot4(this.K,error)/2;
      const steer=-0.18*(this.yawRef-measured.yawRate)-0.65*(this.yawAngle-measured.yaw);
      const voltage=p.voltage-p.batteryResistance*this.wheels.reduce((sum,w)=>sum+w.current,0);
      const limits=this.wheels.map((w,i)=>motorLimit(dot(w.body.angvel(),s.lateral)-s.pitchRate,voltage,p)*(1+(i===0?1:-1)*p.mismatch));
      this.request=p.enabled?allocate(common,steer,limits):[0,0];
      if(Math.abs(common)>Math.min(...limits) || Math.abs(steer)>Math.min(...limits)-Math.abs(common)) this.metrics.saturation+=cd;
      this.metrics.minVoltage=Math.min(this.metrics.minVoltage,voltage);
    }
    this.body.resetTorques(false);this.body.resetForces(false);
    for(let i=0;i<2;i++) {
      const w=this.wheels[i],rel=dot(w.body.angvel(),s.lateral)-s.pitchRate;
      w.angle+=rel*dt;
      w.body.resetTorques(false);
      const sign=Math.sign(this.request[i]);
      if(sign && sign!==w.lastSign) {w.lost=p.backlash;w.lastSign=sign;}
      w.lost=Math.max(0,w.lost-Math.max(0.3,Math.abs(rel))*dt);
      const desired=w.lost>0?0:Math.sign(this.request[i])*Math.max(0,Math.abs(this.request[i])-p.deadTorque);
      w.torque+=(desired-w.torque)*(1-Math.exp(-dt/Math.max(dt/10,p.driveLag)));
      const roll=-p.rolling*p.mass*G*this.r/2*Math.tanh(rel/0.2);
      w.body.addTorque(scale(s.lateral,w.torque+roll),true);
      this.body.addTorque(scale(s.lateral,-w.torque),true);
      w.current=Math.abs(w.torque)/(model.wheel_screen.stall_extrapolation_nm/(5.5-0.2)*p.motorScale*(1+(i===0?1:-1)*p.mismatch))+0.2;
      this.metrics.currentSq[i]+=w.current**2*dt;
      this.metrics.maxCurrent=Math.max(this.metrics.maxCurrent,w.current);
    }
    if(push) this.body.addForceAtPoint(v(push.x||0,push.y||0,0),add(this.body.translation(),v(push.offsetX||0,0,(push.height||0.20)-this.r)),true);
    this.world.step();
    const after=this.state();
    this.heading+=angleDiff(after.yaw,this.lastYaw);this.lastYaw=after.yaw;
    this.metrics.maxPitch=Math.max(this.metrics.maxPitch,Math.abs(after.pitch-this.trim)*180/Math.PI);
    this.metrics.maxRoll=Math.max(this.metrics.maxRoll,Math.abs(after.roll)*180/Math.PI);
    this.metrics.maxSpeed=Math.max(this.metrics.maxSpeed,Math.abs(after.speed));
    this.world.contactPairsWith(this.bodyCol,c=>this.world.contactPair(this.bodyCol,c,m=>{
      for(let i=0;i<m.numContacts();i++) if(m.contactImpulse(i)>1e-6) this.metrics.bodyContact=true;
    }));
    this.wheels.forEach((w,i)=>{
      // Fresh shape distance avoids cached manifold distances/mesh impulses.
      // This is geometric contact separation, NOT a wheel-load measurement.
      let distance=Infinity;
      for(const ground of this.ground) {
        const contact=w.col.contactCollider(ground,0.002);
        if(contact) distance=Math.min(distance,contact.distance);
      }
      this.air[i]=distance<0.0008?0:this.air[i]+dt;
      if(t>0.5)this.metrics.maxAir=Math.max(this.metrics.maxAir,this.air[i]);
    });
    this.out={t:t+dt,...after,heading:this.heading,torques:this.wheels.map(w=>w.torque),currents:this.wheels.map(w=>w.current),odom:this.odom};
    if(this.tick%Math.round(p.rate/25)===0) this.trace.push({t:+t.toFixed(3),x:after.x,y:after.y,pitch:after.pitch*180/Math.PI,roll:after.roll*180/Math.PI,heading:this.heading*180/Math.PI,speed:after.speed,current:Math.max(...this.out.currents)});
    this.tick++;
    return this.out;
  }
  finish() { const duration=this.tick*this.dt; const out={...this.metrics,rmsCurrent:this.metrics.currentSq.map(x=>Math.sqrt(x/duration)),duration,final:this.out};delete out.currentSq;return out; }
  free(){this.world.free();}
}
module.exports={R,model,DEFAULTS,Simulation,motorLimit,allocate,gains,random,clamp};
