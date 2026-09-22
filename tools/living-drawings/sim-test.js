/* Headless check for the 3D sandbox. Run from the repo root:
     cd tools/living-drawings && npm install && node sim-test.js
   Checks the engine workarounds sim-core.js relies on, then drives the robot through the course
   and prints what it found. Assertions are for things that must stay true; findings are printed,
   not asserted, because they are about the design and may change when the design does. */
process.env.HUX_KIN_TEST = "0";
require("./kin.js");
const S = require("./sim-core.js");
const R = require("@dimforge/rapier3d-compat");
const M = globalThis.HuxKin.M;
const IN = S.IN;

function assert(ok, msg) { if (!ok) throw new Error(msg); }

/* ---------- engine checks ---------- */

/* Torque on a jointed link: impulse joints apply it exactly; multibody links get about a third. */
function torqueCheck(kind) {
  const world = new R.World({ x: 0, y: 0, z: 0 });
  world.timestep = 0.0005;
  const root = world.createRigidBody(R.RigidBodyDesc.dynamic().setAdditionalMassProperties(10, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 }));
  const link = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, -0.2, 0).setAdditionalMassProperties(0.35, { x: 0, y: 0, z: 0 }, { x: 0.001, y: 0.001, z: 0.002 }, { x: 0, y: 0, z: 0, w: 1 }));
  const jd = R.JointData.revolute({ x: 0, y: -0.2, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
  if (kind === "multibody") world.createMultibodyJoint(jd, root, link, true); else world.createImpulseJoint(jd, root, link, true);
  world.step();
  for (let i = 0; i < 100; i++) {
    root.resetTorques(false);
    link.resetTorques(false);
    link.addTorque({ x: 0, y: 0, z: 1 }, true);
    root.addTorque({ x: 0, y: 0, z: -1 }, true);
    world.step();
  }
  const got = link.angvel().z;
  world.free();
  return got / 25; /* 1 N·m for 0.05 s on 0.002 kg·m² */
}

/* Free-rolling speed after 3 s for a given wheel shape. */
function rollCheck(shape) {
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 0.0005;
  world.numSolverIterations = 8;
  const g = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0));
  world.createCollider(R.ColliderDesc.cuboid(20, 0.1, 20), g);
  const r = 3 * IN;
  const b = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, r, 0).setLinvel(0.5, 0, 0).setAngvel({ x: 0, y: 0, z: -0.5 / r })
    .setAdditionalMassProperties(3, { x: 0, y: 0, z: 0 }, { x: 0.01, y: 0.01, z: 0.0026 }, { x: 0, y: 0, z: 0, w: 1 }).enabledRotations(false, false, true));
  const q = { x: Math.sin(Math.PI / 4), y: 0, z: 0, w: Math.cos(Math.PI / 4) };
  const cd = shape === "ball" ? R.ColliderDesc.ball(r) : R.ColliderDesc.cylinder(0.0159, r).setRotation(q);
  world.createCollider(cd.setDensity(0).setFriction(0.7), b);
  let vmax = 0;
  for (let i = 0; i < 6000; i++) {
    world.step();
    vmax = Math.max(vmax, b.linvel().x);
  }
  world.free();
  return vmax;
}

/* ---------- robot runs ---------- */
function run(opts, plan) {
  const sim = new S.Sim(R, M, opts || {});
  const out = { sim: sim, peaks: { wheel: 0, knee: 0, hip: 0, roll: 0, theta: 0 }, fellAt: null, segments: [] };
  plan.forEach(function (seg) {
    if (seg.shove) sim.shove(seg.shove);
    const n = Math.round(seg.s * sim.s.knobs.rate);
    for (let i = 0; i < n; i++) {
      const o = sim.step(seg.cmd || {});
      const p = out.peaks;
      p.wheel = Math.max(p.wheel, Math.abs(o.wheels[0].tau), Math.abs(o.wheels[1].tau));
      p.knee = Math.max(p.knee, Math.abs(o.legs[0].knee.tau), Math.abs(o.legs[1].knee.tau));
      p.hip = Math.max(p.hip, Math.abs(o.legs[0].hip.tau), Math.abs(o.legs[1].hip.tau));
      p.roll = Math.max(p.roll, Math.abs(o.legs[0].roll.tau), Math.abs(o.legs[1].roll.tau));
      if (!o.fallen) p.theta = Math.max(p.theta, Math.abs(o.theta));
      if (o.fallen && out.fellAt === null) out.fellAt = sim.t;
    }
    const t = sim.robot.trunk.translation();
    out.segments.push({ name: seg.name, t: sim.t, x: t.x, y: t.y, z: t.z, o: Object.assign({}, sim.last) });
    /* the build starts with straight legs; the first bend into stance is not a design load */
    if (seg.name === "settle") out.peaks = { wheel: 0, knee: 0, hip: 0, roll: 0, theta: 0 };
  });
  return out;
}

(async function main() {
  await R.init();
  const found = {};

  const mb = torqueCheck("multibody");
  const ij = torqueCheck("impulse");
  assert(Math.abs(ij - 1) < 0.02, "impulse-joint torque should be exact, got " + ij.toFixed(3));
  found.multibodyTorqueShare = mb.toFixed(2);
  if (mb > 0.95) console.log("note: Rapier multibody links now take user torque correctly; sim-core.js could go back to multibody joints");

  const vBall = rollCheck("ball");
  const vCyl = rollCheck("cylinder");
  assert(vBall < 0.505, "sphere wheel gained speed free-rolling: " + vBall.toFixed(3));
  found.freeRoll = { sphere: vBall.toFixed(3), cylinder: vCyl.toFixed(3) };

  /* Stand still. Contact force must add up to the weight (checks the (n+1)/n correction). */
  const stand = run({}, [{ name: "settle", s: 1.5 }, { name: "stand", s: 2 }]);
  {
    const sim = stand.sim;
    let f = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      const o = sim.step({});
      f += o.contacts[0].force + o.contacts[1].force;
    }
    const weight = sim.s.totalKg * 9.81;
    assert(Math.abs(f / n - weight) / weight < 0.02, "wheel loads " + (f / n).toFixed(1) + " N vs weight " + weight.toFixed(1));
    const o = sim.last;
    const t = sim.robot.trunk.translation();
    assert(!o.fallen, "fell while standing");
    assert(Math.abs(o.theta) < 0.02, "standing lean " + o.theta);
    assert(Math.hypot(t.x, t.z) < 0.05, "drifted " + t.x + "," + t.z);
    const knee = (Math.abs(o.legs[0].knee.tau) + Math.abs(o.legs[1].knee.tau)) / 2;
    assert(knee > 1.4 && knee < 2.6, "stance knee torque " + knee.toFixed(2) + " (leg-geometry.md: ~2.2 two-leg at 6 kg)");
    found.stance = { kg: sim.s.totalKg.toFixed(2), kneeNm: knee.toFixed(2), hipHeightIn: ((t.y) / IN).toFixed(1) };
  }

  /* Drive, turn, reverse, shove, crouch, stand tall. */
  const drive = run({}, [
    { name: "settle", s: 1.5 },
    { name: "drive", s: 2.5, cmd: { v: 1 } },
    { name: "arc", s: 2, cmd: { v: 1, yaw: 1.5 } },
    { name: "stop", s: 1.5, cmd: {} },
    { name: "reverse", s: 2, cmd: { v: -0.8 } },
    { name: "stop2", s: 1.5, cmd: {} },
    { name: "shove fwd", s: 2, shove: { x: 2, y: 0, z: 0 } },
    { name: "shove back", s: 2, shove: { x: -2, y: 0, z: 0 } },
    { name: "shove side", s: 2, shove: { x: 0, y: 0, z: 2 } },
    { name: "crouch", s: 2, cmd: { height: 2 * M.link * IN * 0.55 } },
    { name: "tall", s: 2, cmd: { height: 2 * M.link * IN * 0.98 } }
  ]);
  assert(drive.fellAt === null, "fell during drive/shove/crouch at " + drive.fellAt);
  const seg = function (r, name) { return r.segments.filter(function (s) { return s.name === name; })[0]; };
  assert(Math.abs(seg(drive, "drive").o.speed - 1) < 0.1, "did not reach 1 m/s: " + seg(drive, "drive").o.speed);
  assert(Math.abs(seg(drive, "arc").o.yawRate - 1.5) < 0.2, "did not hold 1.5 rad/s turn: " + seg(drive, "arc").o.yawRate);
  const arc = seg(drive, "arc").o.contacts;
  found.drive = {
    peakLeanDeg: (drive.peaks.theta * 57.3).toFixed(1),
    peakWheelNm: drive.peaks.wheel.toFixed(2),
    peakKneeNm: drive.peaks.knee.toFixed(1),
    arcWheelLoadsN: arc.map(function (c) { return c.force.toFixed(0); }).join("/"),
    crouchKneeNm: Math.abs(seg(drive, "crouch").o.legs[0].knee.tau).toFixed(1)
  };

  /* Thresholds: 6" wheel, μ 0.7. Approach from the start heading −X. */
  function sill(v) {
    /* the 1" sill face is 0.8 m ahead; stop before the 2" curb at 4.3 m */
    const go = 0.5 + 1.05 / v;
    const r = run({ start: { x: -2.4, yaw: Math.PI } }, [{ name: "settle", s: 1.5 }, { name: "go", s: go, cmd: { v: v } }, { name: "stop", s: 2, cmd: {} }]);
    const x = seg(r, "stop").x;
    const fell = r.fellAt !== null;
    return v.toFixed(2) + " m/s: " + (fell ? "falls" : x < -3.3 ? "crosses" : "stops at it") + ", peak knee " + r.peaks.knee.toFixed(1) + " N·m";
  }
  const half = run({ start: { x: -1.2, yaw: Math.PI } }, [{ name: "settle", s: 1.5 }, { name: "go", s: 3, cmd: { v: 0.5 } }, { name: "stop", s: 1, cmd: {} }]);
  assert(half.fellAt === null && seg(half, "stop").x < -2.05, "did not cross the ½\" threshold at 0.5 m/s");
  found.sills = { half: "crosses at 0.5 m/s", one: [sill(0.3), sill(0.5), sill(0.75), sill(1.0), sill(1.5)] };

  /* PARKED: without the skid it has no rest pose; with the proposed skid it rests and stands back up. */
  const parkBare = run({}, [{ name: "settle", s: 1.5 }, { name: "park", s: 3.5, cmd: { mode: "PARKED" } }]);
  const parkSkid = run({ knobs: { skid: true } }, [{ name: "settle", s: 1.5 }, { name: "park", s: 3.5, cmd: { mode: "PARKED" } }, { name: "up", s: 4, cmd: { mode: "TWO_WHEEL" } }]);
  const bareY = seg(parkBare, "park").y;
  assert(parkSkid.fellAt === null, "fell parking on the skid");
  assert(Math.abs(seg(parkSkid, "up").o.theta) < 0.05, "did not stand back up from the skid");
  found.parked = {
    noSkid: bareY < 0.2 ? "rolls over backward (body at " + (bareY / IN).toFixed(1) + "\")" : "rests",
    skid: "rests at " + (seg(parkSkid, "park").o.theta * 57.3).toFixed(0) + "° and stands back up"
  };

  /* One wheel (experimental): report how long it holds. */
  const one = run({}, [{ name: "settle", s: 1.5 }, { name: "left", s: 8, cmd: { mode: "LEFT_ONLY" } }]);
  found.leftOnly = one.fellAt === null ? "held" : "fell " + (one.fellAt - 1.5).toFixed(1) + " s after the command";

  console.log("sim ok", JSON.stringify(found, null, 2));
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
