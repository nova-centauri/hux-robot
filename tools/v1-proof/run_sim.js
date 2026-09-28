#!/usr/bin/env node
"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {R,model,DEFAULTS,Simulation,random}=require('./sim');
const ROOT=path.resolve(__dirname,'../..');
const DEG=180/Math.PI;

function scenarios() {
  const cases=[{id:'balance-60s',duration:60,speed:0,yaw:0,active:0}];
  for(const sign of [1,-1]) {
    cases.push({id:sign===1?'forward-2m':'reverse-2m',speed:sign*.25,yaw:0,active:8,duration:15});
    cases.push({id:sign===1?'left-90':'right-90',speed:.2,yaw:sign*.4,active:Math.PI/2/.4,duration:11});
    cases.push({id:sign===1?'pivot-left-360':'pivot-right-360',speed:0,yaw:sign*.6,active:Math.PI*2/.6,duration:18});
    for(const direction of ['fore','side']) for(const pulse of [.2,.05]) {
      const impulse=direction==='fore'?.8:.4;
      cases.push({id:`${direction}-${sign>0?'positive':'negative'}-${pulse}s`,duration:11,speed:0,yaw:0,active:0,
        push:{start:4,duration:pulse,height:.20,[direction==='fore'?'x':'y']:sign*impulse/pulse},impulse});
    }
    cases.push({id:`grade-${sign*3}deg`,speed:sign*.15,yaw:0,active:8,duration:15,terrain:{type:'slope',degrees:3},pathTolerance:.15});
    cases.push({id:`cross-slope-${sign*3}deg`,speed:.15,yaw:0,active:8,duration:15,terrain:{type:'cross-slope',degrees:sign*3}});
  }
  for(const type of ['bump','one-wheel-bump','step'])cases.push({id:`${type}-${type==='step'?3:5}mm`,speed:.15,yaw:0,active:8,duration:15,
    terrain:{type,height:type==='step'?.003:.005,length:.3}});
  cases.push({id:'drive-with-push',speed:.25,yaw:0,active:8,duration:15,push:{start:5,duration:.2,x:4,height:.2},impulse:.8,pathTolerance:.2});
  return cases;
}

function run(c,params={},saveTrace=false) {
  const sim=new Simulation(params,c.terrain), dt=sim.dt;
  let ideal={x:0,y:0,heading:0},maxTravel=0, maxCross=0;
  let recoverStart=null,recovery=null,continuousGood=0,finalGood=0,cruiseSquared=0,cruiseSamples=0;
  const pushEnd=c.push?c.push.start+c.push.duration:0;
  for(let i=0;i<Math.round(c.duration/dt);i++) {
    const t=i*dt, active=t>=2&&t<2+c.active;
    const pulse=c.push&&t>=c.push.start&&t<pushEnd?c.push:null;
    const s=sim.step({speed:active?c.speed:0,yaw:active?c.yaw:0},pulse);
    ideal.heading+=sim.yawRef*dt;
    ideal.x+=sim.speedRef*Math.cos(ideal.heading)*dt;ideal.y+=sim.speedRef*Math.sin(ideal.heading)*dt;
    maxTravel=Math.max(maxTravel,Math.hypot(s.x,s.y));maxCross=Math.max(maxCross,Math.abs(s.y));
    const settled=Math.abs(s.pitch-sim.trim)<3/DEG&&Math.abs(s.speed)<.06&&Math.abs(s.yawRate)<.12;
    finalGood=settled?finalGood+dt:0;
    if(c.push&&t>=pushEnd&&!active) {
      continuousGood=settled?continuousGood+dt:0;
      if(continuousGood>=1&&recovery===null) {recoverStart=t-continuousGood;recovery=Math.max(0,recoverStart-pushEnd);}
    }
    if(active&&t>=3.5) {cruiseSquared+=(s.speed-c.speed)**2;cruiseSamples++;}
    if(sim.metrics.bodyContact || sim.metrics.maxPitch>45 || sim.metrics.maxRoll>45) break;
  }
  const m=sim.finish(), final=m.final;
  const pathError=Math.hypot(final.x-ideal.x,final.y-ideal.y), headingError=Math.abs(final.heading-ideal.heading)*DEG;
  const reasons=[];
  if(m.bodyContact)reasons.push('body contact');
  if(m.duration<c.duration-.01)reasons.push('fell / stopped early');
  if(m.maxPitch>12)reasons.push('pitch excursion >12 deg');
  if(m.maxRoll>10)reasons.push('roll excursion >10 deg');
  if(m.maxAir>.08)reasons.push('contact separation >80 ms');
  if(Math.max(...m.rmsCurrent)>1.2)reasons.push('RMS current >1.2 A');
  if(m.maxCurrent>2.51)reasons.push('peak current >2.5 A');
  if(m.maxSpeed>.65)reasons.push('recovery speed >0.65 m/s');
  if(pathError>(c.pathTolerance||.12))reasons.push('endpoint error');
  if(headingError>5)reasons.push('heading error >5 deg');
  if(finalGood<1)reasons.push('did not settle for final 1 s');
  if(c.push&&!c.active&&(recovery===null||recovery>3))reasons.push('push recovery >3 s');
  if(!c.active&&maxTravel>.35)reasons.push('catch travel >0.35 m');
  const row={id:c.id,parameters:{...DEFAULTS,...params},terrain:c.terrain||{type:'flat'},push:c.push||null,
    pass:reasons.length===0,reasons,metrics:{maxPitchDeg:m.maxPitch,maxRollDeg:m.maxRoll,maxSpeedMs:m.maxSpeed,
      peakCurrentA:m.maxCurrent,rmsCurrentA:m.rmsCurrent,minVoltageV:m.minVoltage,saturationSeconds:m.saturation,
      contactSeparationSeconds:m.maxAir,bodyContact:m.bodyContact,durationS:m.duration,pathErrorM:pathError,
      headingErrorDeg:headingError,maxTravelM:maxTravel,maxCrossM:maxCross,settledSeconds:finalGood,recoverySeconds:recovery,
      cruiseRmseMs:cruiseSamples?Math.sqrt(cruiseSquared/cruiseSamples):null},final:{x:final.x,y:final.y,headingDeg:final.heading*DEG},expected:{...ideal,headingDeg:ideal.heading*DEG}};
  if(saveTrace)row.trace=sim.trace;
  sim.free();return row;
}

function matrix(full=true) {
  const cases=scenarios();
  const nominal=cases.map(c=>run(c,{},true));
  const variations=[];
  if(full) {
    const rng=random(9282026);
    // Stratified endpoint cases plus seeded uniform draws. Same fixed controller for every run.
    for(let i=0;i<12;i++) {
      const p={seed:100+i,mass:2.3+.7*rng(),comHeight:.125+.035*rng(),comOffset:(rng()-.5)*.008,
        lateralCom:(rng()-.5)*.008,inertiaScale:.8+.4*rng(),mu:.45+.35*rng(),voltage:9.9+2.7*rng(),
        motorScale:.8+.2*rng(),mismatch:.05*(2*rng()-1),driveLag:.004+.006*rng(),delay:.002+.004*rng(),
        deadTorque:.005+.015*rng(),pitchBias:(rng()-.5)*.3/DEG,gyroBias:(rng()-.5)*.1/DEG,
        wheelInertia:.00015+.0002*rng(),rolling:.01+.02*rng(),backlash:rng()*.15/DEG};
      // Include every maneuver and disturbance in every draw; stand duration remains 60 seconds.
      for(const c of cases) variations.push(run(c,p));
    }
    const corners=[{mass:3,voltage:9.9,motorScale:.8,mu:.45,delay:.006,driveLag:.01},
      {legAngle:15},{legAngle:45},{mass:3,comHeight:.16,comOffset:.004,lateralCom:.004}];
    for(const p of corners)for(const c of cases)variations.push(run(c,p));
  }
  const challenge=[
    {c:{id:'large-forward-shove',duration:12,active:0,speed:0,yaw:0,push:{start:4,duration:.1,x:40,height:.24}},p:{}},
    {c:{id:'large-side-shove',duration:12,active:0,speed:0,yaw:0,push:{start:4,duration:.1,y:40,height:.24}},p:{}},
    {c:{id:'20mm-square-obstacle',duration:15,active:8,speed:.15,yaw:0,terrain:{type:'step',height:.02}},p:{}},
    {c:{...cases.find(c=>c.id==='forward-2m'),id:'25ms-sensor-delay'},p:{delay:.025}},
    {c:{...cases.find(c=>c.id==='pivot-left-360'),id:'2deg-gear-lost-motion'},p:{backlash:2/DEG}},
    {c:{id:'controller-off',duration:5,active:0,speed:0,yaw:0},p:{enabled:false,startPitch:3}},
  ].map(x=>run(x.c,x.p,true));
  const convergence=[];
  for(const id of ['forward-2m','pivot-left-360','one-wheel-bump-5mm','fore-positive-0.05s','side-positive-0.05s']) {
    const c=cases.find(c=>c.id===id), fine=run(c,{rate:2000}),coarse=nominal.find(r=>r.id===id);
    convergence.push({id,finePass:fine.pass,coarsePass:coarse.pass,pathDeltaM:Math.abs(fine.metrics.pathErrorM-coarse.metrics.pathErrorM),
      headingDeltaDeg:Math.abs(fine.final.headingDeg-coarse.final.headingDeg),pitchDeltaDeg:Math.abs(fine.metrics.maxPitchDeg-coarse.metrics.maxPitchDeg)});
  }
  const all=[...nominal,...variations];
  // Manufacturing/assembly mitigation, evaluated separately without erasing ±4 mm failures.
  const mitigation=[];
  if(full) {
    const original=variations.find(r=>r.parameters.seed===102).parameters;
    for(const offset of [-.002,.002])for(const id of ['grade-3deg','grade--3deg','fore-positive-0.2s']) {
      mitigation.push(run({...cases.find(c=>c.id===id),id:`${id}-CoM-${offset*1000}mm`},{...original,comOffset:offset},true));
    }
  }
  const groups=cases.map(c=>{const rows=all.filter(r=>r.id===c.id);return {id:c.id,passed:rows.filter(r=>r.pass).length,total:rows.length,
    worstPathErrorM:Math.max(...rows.map(r=>r.metrics.pathErrorM)),worstHeadingErrorDeg:Math.max(...rows.map(r=>r.metrics.headingErrorDeg)),
    worstPitchDeg:Math.max(...rows.map(r=>r.metrics.maxPitchDeg)),worstCurrentA:Math.max(...rows.map(r=>r.metrics.peakCurrentA)),
    failureReasons:[...new Set(rows.flatMap(r=>r.reasons))]};});
  const inputs=['model.json','sim.js','run_sim.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,f))).digest('hex')]);
  return {schemaVersion:1,modelRevision:model.revision,engine:'Rapier 0.20.0',seed:9282026,
    inputHashes:Object.fromEntries(inputs),hardwareValidated:false,poweredLegDynamicsValidated:false,
    summary:{passed:all.filter(r=>r.pass).length,total:all.length,groups,challengePasses:challenge.filter(r=>r.pass).length,
      convergencePass:convergence.every(r=>r.finePass===r.coarsePass&&r.pathDeltaM<.04&&r.headingDeltaDeg<3&&r.pitchDeltaDeg<2)},
    nominal,variations,challenge,convergence,mitigation};
}

async function main() {
  await R.init();
  const quick=process.argv.includes('--quick');
  if(quick&&process.argv.includes('--write'))throw Error('Use a full run to publish evidence; --quick cannot overwrite the full matrix.');
  if(process.argv.includes('--check')) {
    const saved=JSON.parse(fs.readFileSync(path.join(__dirname,'sim-results.json'),'utf8'));
    for(const [f,hash] of Object.entries(saved.inputHashes))if(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,f))).digest('hex')!==hash)throw Error(`Stale simulation: ${f}; rerun npm run simulate`);
    if(saved.summary.total!==391||saved.nominal.length!==23||saved.challenge.length!==6)throw Error('Incomplete simulation artifact');
    const brief={...saved,variations:undefined};
    const browser='/* Generated by run_sim.js. */\nwindow.HuxProofSimulation = '+JSON.stringify(brief)+';\n';
    if(fs.readFileSync(path.join(ROOT,'tools/living-drawings/proof-sim-data.js'),'utf8')!==browser)throw Error('Stale browser simulation data');
    console.log(`Simulation artifact current: ${saved.summary.passed}/${saved.summary.total}; physical validation remains open.`);return;
  }
  const result=matrix(!quick);
  if(process.argv.includes('--write')) {
    fs.writeFileSync(path.join(__dirname,'sim-results.json'),JSON.stringify(result,null,2)+'\n');
    const brief={...result,variations:undefined};
    fs.writeFileSync(path.join(ROOT,'tools/living-drawings/proof-sim-data.js'),'/* Generated by run_sim.js. */\nwindow.HuxProofSimulation = '+JSON.stringify(brief)+';\n');
  }
  console.log(JSON.stringify(result.summary,null,2));
  console.log('Challenge cases:',result.challenge.map(r=>`${r.id}: ${r.pass?'PASS':r.reasons.join(', ')}`).join('\n'));
  console.log('Convergence:',JSON.stringify(result.convergence));
}
module.exports={run,scenarios,matrix};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
