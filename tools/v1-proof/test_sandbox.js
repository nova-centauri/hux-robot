"use strict";
// Headless checks for the 3D sandbox wrapper (tools/living-drawings/proof-sandbox-core.js).
// The sandbox must drive the study's own plant/controller, keep its fixtures real contacts,
// and not hide falls. It adds no evidence to the saved study.
const assert = require("node:assert/strict");
const S = require("./sim");
const B = require("../living-drawings/proof-sandbox-core")(S);

function drive(lane, seconds, command, events = {}) {
  const sb = new B.Sandbox({}, lane);
  let maxPitch = 0, maxRoll = 0;
  const n = Math.round(seconds / sb.dt);
  for (let i = 0; i < n; i++) {
    if (events[i]) events[i](sb);
    sb.step(command(i * sb.dt));
    const t = sb.telemetry();
    maxPitch = Math.max(maxPitch, Math.abs(t.pitchErr)); maxRoll = Math.max(maxRoll, Math.abs(t.roll));
  }
  const out = { ...sb.telemetry(), maxPitch, maxRoll, ground: sb.sim.ground.length };
  sb.free();
  return out;
}
const at = s => Math.round(s * 1000);

(async () => {
  await S.R.init();
  // The wrapper uses the study's Simulation class and adds fixtures as ground colliders.
  const probe = new B.Sandbox({}, "open");
  assert(probe.sim instanceof S.Simulation);
  assert.equal(probe.sim.ground.length, 1 + B.LANES.filter(l => l.surface || l.box).length);
  probe.free();

  // Same pose numbers as review.py: 278–306 mm tall, 255 mm wide.
  assert(Math.abs(B.pose(45).heightMm - 277.8) < 0.1 && Math.abs(B.pose(15).heightMm - 306.3) < 0.1);
  assert.equal(B.WIDTH_MM, 255);

  // Every lane is drivable at the uneven-fixture speed, except the 20 mm challenge, which must stop the robot.
  const go = t => ({ speed: t > 1 && t < 22 ? 0.15 : 0, yaw: 0 });
  for (const lane of B.LANES) {
    const r = drive(lane.id, 26, go);
    if (lane.challenge) { assert(r.x < 1.1, `${lane.id} should block the robot`); continue; }
    assert(!r.fallen, `${lane.id}: ${r.fallen}`);
    assert(r.x > 2.9, `${lane.id}: stopped at x=${r.x.toFixed(2)}`);
    assert(Math.abs(r.y - lane.y) < 0.12, `${lane.id}: lateral drift`);
    assert(r.maxPitch < 12 && r.maxRoll < 10, `${lane.id}: pitch ${r.maxPitch.toFixed(1)} roll ${r.maxRoll.toFixed(1)}`);
    if (lane.id === "cross") assert(r.maxRoll > 1, "cross-slope really rolls the robot");
  }

  // Leg preview: tall -> low -> neutral while standing, without leaving the ±12° pitch gate.
  const legs = drive("open", 12, () => ({ speed: 0, yaw: 0 }),
    { [at(1)]: sb => sb.setLegTarget(15), [at(4)]: sb => sb.setLegTarget(45), [at(8)]: sb => sb.setLegTarget(30) });
  assert(!legs.fallen && legs.maxPitch < 12 && legs.legAngle === 30);
  assert(Math.hypot(legs.x, legs.y) < 0.12, "stays on its spot through the height change");

  // Robot-frame shoves: protocol impulses recover, the 4 N·s challenge falls and the fall is reported.
  const small = drive("open", 8, () => ({ speed: 0, yaw: 0 }), { [at(2)]: sb => sb.shove(0.8, 0, 0.05) });
  assert(!small.fallen && small.maxPitch < 12);
  const big = drive("open", 8, () => ({ speed: 0, yaw: 0 }), { [at(2)]: sb => sb.shove(4, 0, 0.1, 0.24) });
  assert(big.fallen && !big.enabled, "large shove falls and drive is disabled");
  const off = drive("open", 5, () => ({ speed: 0, yaw: 0 }), { [at(1)]: sb => sb.setKilled(true) });
  assert(off.fallen, "killing the motors drops the robot");

  // Turning in place from a lane start counts heading from that start.
  const pivot = drive("grade", 5, t => ({ speed: 0, yaw: t < 3 ? 0.6 : 0 }));
  assert(pivot.heading > 60 && !pivot.fallen);
  console.log("Sandbox checks: study plant reused, fixtures drivable, 20 mm stop, leg preview, shoves, falls and kill passed.");
})().catch(e => { console.error(e); process.exitCode = 1; });
