"use strict";
const assert=require('node:assert/strict');
const {R,Simulation,motorLimit,allocate,DEFAULTS}=require('./sim');
const {scenarios,run}=require('./run_sim');
(async()=>{
  await R.init();
  // A fallen controller must not be hidden by kinematic clamps or invisible supports.
  const off=run({id:'off',duration:4,active:0,speed:0,yaw:0},{enabled:false,startPitch:3});
  assert.equal(off.pass,false);assert(off.metrics.maxPitchDeg>40);
  // Equal/opposite motor reaction is required for a wheeled inverted pendulum.
  const s=new Simulation({noise:0,rolling:0,deadTorque:0});
  s.step(); // Rapier updates additional mass properties on its first step.
  assert(Math.abs(s.body.mass()+s.wheels.reduce((a,w)=>a+w.body.mass(),0)-2.5)<1e-5);
  for(let i=0;i<1000;i++)s.step();
  assert(s.metrics.maxAir<.01,'settled flat floor is a real contact');s.free();
  // Fresh narrow-phase distances must see a mesh as well as the underlying floor.
  const bump=run(scenarios().find(c=>c.id==='one-wheel-bump-5mm'));
  assert(bump.pass,JSON.stringify(bump.reasons));
  assert(bump.metrics.maxRollDeg>0.5,'asymmetric bump actually excites roll');
  // Voltage/speed/current bounds; impossible speed must not receive free torque.
  assert(motorLimit(100,9.9,DEFAULTS)===0);
  assert(motorLimit(15,7,DEFAULTS)<motorLimit(15,11,DEFAULTS));
  for(const common of [-1,-.2,0,.2,1])for(const yaw of [-2,0,2]){
    const a=allocate(common,yaw,[.4,.3]);
    assert(Math.abs(a[0])<=.4000001&&Math.abs(a[1])<=.3000001);
    assert(Math.abs((a[0]+a[1])/2-Math.max(-.3,Math.min(.3,common)))<1e-10,'yaw may not consume balance torque');
  }
  const forward=run(scenarios().find(c=>c.id==='forward-2m'));
  const reverse=run(scenarios().find(c=>c.id==='reverse-2m'));
  assert(forward.pass&&reverse.pass);assert(forward.final.x>1.9&&reverse.final.x< -1.9);
  for(const id of ['left-90','right-90','pivot-left-360','pivot-right-360']){
    const r=run(scenarios().find(c=>c.id===id));assert(r.pass,`${id}: ${r.reasons}`);
    assert(Math.sign(r.final.headingDeg)===(id.includes('left')?1:-1));
  }
  const a=run({id:'repeat',duration:3,active:0,speed:0,yaw:0},{seed:37});
  const b=run({id:'repeat',duration:3,active:0,speed:0,yaw:0},{seed:37});
  assert.deepEqual(a,b,'seeded simulation must reproduce');
  console.log('Simulation checks: gravity, mass, contact, motor envelope, steering allocation, signed maneuvers and determinism passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
