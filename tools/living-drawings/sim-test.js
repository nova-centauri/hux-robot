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
  const cd = shape === "tire" ? S.tireCollider(R, r, M.wheelWidth * IN) : shape === "ball" ? R.ColliderDesc.ball(r) : R.ColliderDesc.cylinder(0.0159, r).setRotation(q);
  world.createCollider(cd.setDensity(0).setFriction(0.7), b);
  let vmax = 0;
  for (let i = 0; i < 6000; i++) {
    world.step();
    vmax = Math.max(vmax, b.linvel().x);
  }
  world.free();
  return vmax;
}

/* A cambered crown must touch the floor on the crown, at the point the shared profile predicts,
   and carry the full load there: no edge catch, no lost contact. */
function camberCheck(gammaDeg) {
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 0.0005;
  const g = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0));
  world.createCollider(R.ColliderDesc.cuboid(2, 0.1, 2), g);
  const r = 3 * IN;
  const gamma = gammaDeg * Math.PI / 180;
  const q = { x: Math.sin(gamma / 2), y: 0, z: 0, w: Math.cos(gamma / 2) }; /* camber about +X: top leans toward +Z... */
  const b = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0, r + 0.002, 0).setRotation(q)
    .setAdditionalMassProperties(3, { x: 0, y: 0, z: 0 }, { x: 0.01, y: 0.01, z: 0.0026 }, { x: 0, y: 0, z: 0, w: 1 }).enabledRotations(false, false, false).setCanSleep(false));
  const col = world.createCollider(S.tireCollider(R, r, M.wheelWidth * IN).setDensity(0).setFriction(0.7), b);
  for (let i = 0; i < 3000; i++) world.step();
  let load = 0, px = 0, pz = 0, n = 0;
  world.contactPairsWith(col, function (other) {
    world.contactPair(col, other, function (manifold, flipped) {
      const up = manifold.normal().y * (flipped ? 1 : -1);
      for (let i = 0; i < manifold.numContacts(); i++) {
        const p = flipped ? manifold.localContactPoint2(i) : manifold.localContactPoint1(i);
        const wp = b.translation();
        const rp = { x: p.x, y: p.y, z: p.z };
        /* local → world (body rotation q) */
        const qq = b.rotation();
        const wq = rotate(qq, rp);
        load += manifold.contactImpulse(i) * Math.abs(up);
        px += wq.x; pz += wq.z; n++;
      }
    });
  });
  const dt = world.timestep * (world.numSolverIterations + 1) / world.numSolverIterations;
  const t = b.translation();
  world.free();
  const axisY = Math.sin(gamma);
  const sp = S.spec ? null : null;
  return { load: load / dt, n: n, zContact: n ? pz / n : NaN, y: t.y, axisY: axisY };
}
function rotate(q, p) {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const ix = w * p.x + y * p.z - z * p.y, iy = w * p.y + z * p.x - x * p.z, iz = w * p.z + x * p.y - y * p.x, iw = -x * p.x - y * p.y - z * p.z;
  return { x: ix * w + iw * -x + iy * -z - iz * -y, y: iy * w + iw * -y + iz * -x - ix * -z, z: iz * w + iw * -z + ix * -y - iy * -x };
}

/* ---------- robot runs ---------- */
function run(opts, plan) {
  const sim = new S.Sim(R, M, opts || {});
  const out = { sim: sim, peaks: { wheel: 0, knee: 0, hip: 0, roll: 0, theta: 0 }, fellAt: null, segments: [] };
  plan.forEach(function (seg) {
    if (seg.shove) sim.shove(seg.shove);
    const n = Math.round(seg.s * sim.s.knobs.rate);
    const tail = Math.min(n, Math.round(1.0 * sim.s.knobs.rate)); /* last second: means, for loops that hunt */
    const mean = { yawRate: 0, speed: 0, yawMin: Infinity, yawMax: -Infinity };
    for (let i = 0; i < n; i++) {
      const o = sim.step(seg.cmd || {});
      if (i >= n - tail) {
        mean.yawRate += o.yawRate / tail; mean.speed += o.speed / tail;
        mean.yawMin = Math.min(mean.yawMin, o.yawRate); mean.yawMax = Math.max(mean.yawMax, o.yawRate);
      }
      const p = out.peaks;
      p.wheel = Math.max(p.wheel, Math.abs(o.wheels[0].tau), Math.abs(o.wheels[1].tau));
      p.knee = Math.max(p.knee, Math.abs(o.legs[0].knee.tau), Math.abs(o.legs[1].knee.tau));
      p.hip = Math.max(p.hip, Math.abs(o.legs[0].hip.tau), Math.abs(o.legs[1].hip.tau));
      p.roll = Math.max(p.roll, Math.abs(o.legs[0].roll.tau), Math.abs(o.legs[1].roll.tau));
      if (!o.fallen) p.theta = Math.max(p.theta, Math.abs(o.theta));
      if (o.fallen && out.fellAt === null) out.fellAt = sim.t;
    }
    const t = sim.robot.trunk.translation();
    out.segments.push({ name: seg.name, t: sim.t, x: t.x, y: t.y, z: t.z, o: Object.assign({}, sim.last), mean: mean });
    /* the build starts with straight legs; the first bend into stance is not a design load */
    if (seg.name === "settle") out.peaks = { wheel: 0, knee: 0, hip: 0, roll: 0, theta: 0 };
  });
  return out;
}

(async function main() {
  await R.init();
  const found = {};

  // Physical bounds, joint stops, collision exclusions and delayed sensing.
  const probe = new S.Sim(R, M, { floorOnly: true });
  const mesh = S.tireVertices(probe.s.R, probe.s.wheelW);
  const bound = [0, 0, 0];
  mesh.points.forEach((n, i) => { bound[i % 3] = Math.max(bound[i % 3], Math.abs(n) + mesh.crown); });
  assert(Math.abs(2 * bound[0] / IN - 6) < 1e-5 && Math.abs(2 * bound[2] / IN - 1.25) < 1e-5, "tire bounds");
  let stopped = 0;
  probe.world.impulseJoints.forEach(j => { if (typeof j.limitsEnabled === "function" && j.limitsEnabled()) stopped++; });
  assert(stopped === 6, "both legs must have three physical joint stops");
  const robot = probe.robot, left = robot.legs[0];
  assert(robot.hooks.filterContactPair(0, 0, robot.trunk.handle, left.upper.handle) === null, "hip mounting overlap exclusion");
  assert(robot.hooks.filterContactPair(0, 0, robot.trunk.handle, left.tread.handle) === R.SolverFlags.COMPUTE_IMPULSE, "tire/body self-contact must be enabled");
  assert(robot.hooks.filterContactPair(0, 0, left.wheel.handle, left.tread.handle) === null, "hub/tread overlap exclusion");
  for (let i = 0; i < 4000; i++) probe.step({});
  assert(probe.last.sensorAgeMs >= 3.9 && probe.last.sensorAgeMs <= 6.1, "4 ms sample delay is not applied");
  /* Carcass: each tread ring squishes by load / k at rest, and the pad estimate follows. */
  {
    const w = probe.s.totalKg * 9.81;
    probe.last.tires.forEach(function (t, i) {
      const expect = probe.last.contacts[i].force / probe.s.knobs.tireK;
      assert(Math.abs(t.deflection - expect) < 0.25 * expect + 1e-4, "tire " + i + " deflection " + (t.deflection * 1000).toFixed(2) + " mm vs " + (expect * 1000).toFixed(2));
      assert(t.padLength > 0.015 && t.padWidth > 0.006 && t.padWidth < probe.s.wheelW, "pad estimate " + JSON.stringify(t));
    });
    found.tireSquishMm = (probe.last.tires[0].deflection * 1000).toFixed(2);
    found.padIn = (probe.last.tires[0].padLength / IN).toFixed(2) + " × " + (probe.last.tires[0].padWidth / IN).toFixed(2);
    assert(Math.abs(probe.last.contacts[0].force + probe.last.contacts[1].force - w) < 0.05 * w, "wheel loads should sum to the weight with the tread rings in the chain");
  }
  assert(probe.last.supportState === "TWO_CONTACT" && !probe.last.singleSupportValidated, "standing is not single support");
  probe.ctrl.estop = true;
  const killed = probe.step({ v: 1 });
  assert(killed.wheels.every(w => w.tau === 0), "emergency stop must bypass motor lag");
  assert(killed.legs.every(l => [l.roll, l.hip, l.knee].every(j => j.tau === 0)), "emergency stop must cut leg torque");
  probe.world.free();

  const mb = torqueCheck("multibody");
  const ij = torqueCheck("impulse");
  assert(Math.abs(ij - 1) < 0.02, "impulse-joint torque should be exact, got " + ij.toFixed(3));
  found.multibodyTorqueShare = mb.toFixed(2);
  if (mb > 0.95) console.log("note: Rapier multibody links now take user torque correctly; sim-core.js could go back to multibody joints");

  const vBall = rollCheck("ball");
  const vCyl = rollCheck("cylinder");
  assert(vBall < 0.505, "sphere wheel gained speed free-rolling: " + vBall.toFixed(3));
  const vTire = rollCheck("tire");
  assert(vTire >= 0.49 && vTire < 0.525, "tire gained more than 5% speed: " + vTire);
  {
    const tire = probe.s.tire;
    const camber = [];
    [0, 10, 20, 30].forEach(function (deg) {
      const c = camberCheck(deg);
      const sp = tire.supportFromAxisY(Math.sin(deg * Math.PI / 180));
      assert(c.n >= 1 && Math.abs(c.load - 3 * 9.81) < 0.1 * 3 * 9.81, "cambered crown at " + deg + "° lost its load: " + JSON.stringify(c));
      const err = Math.abs(Math.abs(c.zContact) - Math.abs(sp.z));
      assert(err < 0.0025, "contact at " + deg + "° camber is " + (c.zContact * 1000).toFixed(1) + " mm sideways, profile says " + (sp.z * 1000).toFixed(1));
      assert(Math.abs(c.y - sp.depth) < 0.004, "cambered wheel sits at " + (c.y * 1000).toFixed(1) + " mm, profile says " + (sp.depth * 1000).toFixed(1));
      camber.push(deg + "°: " + (Math.abs(c.zContact) * 1000).toFixed(1) + " mm in from the centre plane");
    });
    found.crownContact = camber;
  }
  found.freeRoll = { tire: vTire.toFixed(3), sphere: vBall.toFixed(3), cylinder: vCyl.toFixed(3) };

  /* Stand still. Contact force must add up to the weight (checks the (n+1)/n correction). */
  /* Cross-check against leg-geometry.md at the drawings' 92% stance, not the ride height. */
  const tall = { height: 2 * M.link * IN * M.stanceFraction };
  const stand = run({}, [{ name: "settle", s: 1.5, cmd: tall }, { name: "stand", s: 2, cmd: tall }]);
  {
    const sim = stand.sim;
    let f = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      const o = sim.step(tall);
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
    const kneeRef = 2.2 * M.exampleMassKg / 6; /* leg-geometry.md: ~2.2 N·m two-leg at 6 kg; scales with the lump picture */
    assert(knee > kneeRef * 0.64 && knee < kneeRef * 1.18, "stance knee torque " + knee.toFixed(2) + " vs ~" + kneeRef.toFixed(1) + " expected at " + M.exampleMassKg.toFixed(2) + " kg");
    found.stance = { kg: sim.s.totalKg.toFixed(2), kneeNm: knee.toFixed(2), hipHeightIn: ((t.y) / IN).toFixed(1) };
  }

  /* The default ride height (medium, 75%): lower hips, longer knee lever. */
  const ride = run({}, [{ name: "settle", s: 1.5 }, { name: "stand", s: 2 }]);
  {
    const o = ride.sim.last;
    const t = ride.sim.robot.trunk.translation();
    assert(!o.fallen && Math.abs(o.theta) < 0.02, "does not stand at the ride height");
    found.ride = {
      pct: (100 * ride.sim.s.hRide / (2 * ride.sim.s.L)).toFixed(0),
      hipHeightIn: (t.y / IN).toFixed(1),
      kneeNm: ((Math.abs(o.legs[0].knee.tau) + Math.abs(o.legs[1].knee.tau)) / 2).toFixed(2)
    };
  }

  /* Drive, turn, reverse, shove, crouch, stand tall. */
  const drive = run({ floorOnly: true }, [
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
  /* The sandbox yaw loop (P 0.35 + I 0.6 on yaw rate, clamped to the wheel torque room) hunts
     about ±0.25 rad/s around the command at 1 m/s, at 6 kg and at 7.75 kg alike; the 2026-09-23
     end-of-segment sample happened to land inside ±0.2. Assert the last-second mean, report the swing. */
  assert(Math.abs(seg(drive, "arc").mean.yawRate - 1.5) < 0.2, "did not hold 1.5 rad/s turn (1 s mean): " + seg(drive, "arc").mean.yawRate);
  const hops = drive.sim.last.reflex.reduce(function (a, r) { return a + r.hits; }, 0);
  assert(hops === 0, "impact reflex fired " + hops + " times on a flat floor");
  const arc = seg(drive, "arc").o.contacts;
  found.drive = {
    peakLeanDeg: (drive.peaks.theta * 57.3).toFixed(1),
    peakWheelNm: drive.peaks.wheel.toFixed(2),
    peakKneeNm: drive.peaks.knee.toFixed(1),
    arcWheelLoadsN: arc.map(function (c) { return c.force.toFixed(0); }).join("/"),
    crouchKneeNm: Math.abs(seg(drive, "crouch").o.legs[0].knee.tau).toFixed(1),
    arcYawRate: { mean: seg(drive, "arc").mean.yawRate.toFixed(2), swing: (seg(drive, "arc").mean.yawMax - seg(drive, "arc").mean.yawMin).toFixed(2), note: "sandbox yaw loop hunts; not a layer-2 controller" }
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
  /* Stumbles: the biggest shove it rides out, front and side. */
  function maxShove(dir, from, to, step) {
    let best = 0;
    for (let J = from; J <= to + 1e-9; J += step) {
      const r = run({}, [{ name: "settle", s: 1.5 }, { name: "after", s: 3, shove: { x: dir.x * J, y: 0, z: dir.z * J } }]);
      if (r.fellAt !== null) break;
      best = J;
    }
    return best;
  }
  const side = maxShove({ x: 0, z: 1 }, 3, 7, 0.5);
  assert(side >= 4.5, "side shove recovery fell to " + side + " N·s (stumble catch)");
  found.shoves = { forwardNs: maxShove({ x: 1, z: 0 }, 8, 14, 1), sideNs: side };

  const half = run({ start: { x: -1.2, yaw: Math.PI } }, [{ name: "settle", s: 1.5 }, { name: "go", s: 3, cmd: { v: 0.5 } }, { name: "stop", s: 1, cmd: {} }]);
  assert(half.fellAt === null && seg(half, "stop").x < -2.05, "did not cross the ½\" threshold at 0.5 m/s");
  const one = [sill(0.3), sill(0.5), sill(0.75), sill(1.0), sill(1.5)];
  // Capability trial: the narrower tire and finite drive response invalidate the old sphere result.
  // Keep every speed and outcome in the report; crossing is not a controller invariant.
  found.sills = { half: "crosses at 0.5 m/s", one: one };

  /* PARKED: without the skid it has no rest pose; with the proposed skid it rests and stands back up. */
  const parkBare = run({}, [{ name: "settle", s: 1.5 }, { name: "park", s: 3.5, cmd: { mode: "PARKED" } }]);
  const parkSkid = run({ knobs: { skid: true } }, [{ name: "settle", s: 1.5 }, { name: "park", s: 3.5, cmd: { mode: "PARKED" } }, { name: "up", s: 4, cmd: { mode: "TWO_WHEEL" } }]);
  assert(parkBare.fellAt === null && seg(parkBare, "park").o.mode === "TWO_WHEEL" && seg(parkBare, "park").o.modeRejected, "parking without a support must keep balancing and report refusal");
  assert(parkSkid.fellAt === null, "fell parking on the skid");
  assert(seg(parkSkid, "park").o.mode === "PARKED" && seg(parkSkid, "park").o.restSupportN > 0, "parked must mean verified skid support");
  assert(Math.abs(seg(parkSkid, "up").o.theta) < 0.05, "did not stand back up from the skid");
  found.parked = {
    noSkid: "request refused; active balance retained",
    skid: "rests at " + (seg(parkSkid, "park").o.theta * 57.3).toFixed(0) + "° and stands back up"
  };

  /* One wheel: the planned poise must settle on either side and come back. Mode is an event. */
  function poise(mode, knobs) {
    const sim = new S.Sim(R, M, { knobs: knobs || {} });
    const n = sim.s.knobs.rate;
    for (let i = 0; i < 1.5 * n; i++) sim.step({});
    let fell = false;
    let at = null;
    let lo = 1;
    let hi = 0;
    let rollTau = 0;
    const fi = mode === "LEFT_ONLY" ? 1 : 0;
    const w = sim.s.totalKg * 9.81;
    for (let i = 0; i < 12 * n; i++) {
      const o = sim.step(i === 0 ? { mode: mode } : i === 8 * n ? { mode: "TWO_WHEEL" } : {});
      if (o.phase === "poise") {
        if (at === null) at = i / n;
        lo = Math.min(lo, o.contacts[fi].force / w);
        hi = Math.max(hi, o.contacts[fi].force / w);
        rollTau = Math.max(rollTau, Math.abs(o.legs[1 - fi].roll.tau));
      }
      if (o.fallen) { fell = true; break; }
    }
    return { sim: sim, fell: fell, at: at, lo: lo, hi: hi, rollTau: rollTau };
  }
  ["LEFT_ONLY", "RIGHT_ONLY"].forEach(function (m) {
    const p = poise(m);
    assert(!p.fell && p.at !== null, m + " did not settle into the poise");
    assert(!p.sim.last.singleSupportValidated, "a two-contact poise must not validate single support");
    assert(p.sim.last.mode === "TWO_WHEEL" && !p.sim.ctrl.one, m + " did not come back to two wheels");
    if (m === "LEFT_ONLY") {
      found.oneWheel = {
        poiseAfterS: p.at.toFixed(1),
        freeWheelLoadPct: (100 * p.lo).toFixed(0) + "–" + (100 * p.hi).toFixed(0),
        plantedHipRollNm: p.rollTau.toFixed(1)
      };
    }
  });
  const lift = poise("LEFT_ONLY", { oneLift: true });
  found.oneWheel.experimentalLift = lift.fell ? "falls (an acrobot with a few mm of capture region on this geometry; docs/research/one-leg-stance.md)" : "survives, caught " + (lift.sim.last.caught || 0) + "×";

  /* Dynamic single support: from the poise, lift the free wheel for T with the hip rolls held
     stiff, tip toward the free side, land, and come back to two wheels. The 0.2 s hop must
     return; longer hops are reported (the flight is physics, the landing is controller work). */
  function hop(T, keep) {
    const sim = new S.Sim(R, M, { knobs: { oneHop: T, hopKeep: keep }, floorOnly: true });
    const n = sim.s.knobs.rate;
    for (let i = 0; i < 1.5 * n; i++) sim.step({});
    let hopAt = null, fell = false, back = false, h = null, backAt = null;
    for (let i = 0; i < 14 * n; i++) {
      const t = i / n;
      let cmd = i === 0 ? { mode: "LEFT_ONLY" } : {};
      if (hopAt !== null && t > hopAt + T + 2.0 && !back) { cmd = { mode: "TWO_WHEEL" }; back = true; }
      const o = sim.step(cmd);
      if (o.phase === "hop") { if (hopAt === null) hopAt = t; h = o.hop; }
      if (back && o.mode === "TWO_WHEEL" && !sim.ctrl.one && backAt === null) backAt = t;
      if (o.fallen) { fell = true; break; }
    }
    return { T: T, keep: keep, fell: fell, hopped: hopAt !== null, tipDeg: h ? +h.tipDeg.toFixed(1) : null,
      eEndMm: h ? +(h.eEnd * 1000).toFixed(0) : null, evEnd: h ? +h.ev.toFixed(2) : null, peakRollNm: h ? +h.peakTau.toFixed(1) : null, back: backAt !== null };
  }
  const hopRuns = [hop(0.2, 0.08), hop(0.3, 0.08), hop(0.3, 0.15)];
  assert(hopRuns[0].hopped && !hopRuns[0].fell && hopRuns[0].back, "the 0.2 s hop from an 8% poise did not land and return to two wheels");
  found.oneWheel.hops = hopRuns.map(function (x) {
    return x.T + " s hop, " + (100 * x.keep) + "% on the free tire: " + (x.hopped ? "tips " + x.tipDeg + "°, lands " + x.eEndMm + " mm inboard at " + x.evEnd + " m/s, planted hip roll " + x.peakRollNm + " N·m, " + (x.fell ? "falls on the return" : x.back ? "returns to two wheels" : "does not return") : "no hop");
  });

  /* Frontal-plane closed form (frontal.js) must agree with the sandbox on the shift geometry:
     the leg roll that puts the mass over one tire at the 92% stance, and the planted hip's
     cantilever torque. Both are what the one-leg decisions rest on. */
  const F = require("./frontal.js");
  const fr = F.robot({ M: M });
  const g92 = fr.balanceRoll(0);
  assert(Math.abs(-g92 * 180 / Math.PI - 24.7) < 1.0, "frontal.js balance roll moved: " + (-g92 * 180 / Math.PI).toFixed(1) + "°");
  const hold = fr.holdTorque([g92, -g92, 0]);
  /* ≈ (m_body + m_free yoke·2 + m_free leg·2) g × 5.4": 8.3 N·m with the 6 kg picture, 10.7 with the locked
     actuator set (actuators.js). Band scales with the lump picture. */
  const holdRef = 10.7 * M.exampleMassKg / 7.752;
  assert(hold > holdRef * 0.9 && hold < holdRef * 1.1, "frontal.js hold torque moved: " + hold.toFixed(2) + " vs ~" + holdRef.toFixed(1));
  const resp = fr.response(0, [2], 0.010, undefined, true);
  found.oneWheel.frontal = {
    legRollDeg: (-g92 * 180 / Math.PI).toFixed(1),
    plantedHipHoldNm: hold.toFixed(1),
    bodySwingPer10mmDeg: (resp.peak.q2 * 180 / Math.PI).toFixed(0),
    dynamicTorquePer10mmNm: resp.peak.u[0].toFixed(1)
  };

  console.log("sim ok", JSON.stringify(found, null, 2));
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
