/* Regression checks for physical invariants, not an assertion that Hux climbs stairs. */
"use strict";
const assert = require("node:assert/strict");
process.env.HUX_KIN_TEST = "0";
require("./kin.js");
const K = globalThis.HuxKin, M = K.M, S = K.spatial;
const distance = globalThis.HuxSpatial.distance;
const near = (a, b, e = 1e-8) => assert.ok(Math.abs(a - b) < e, `${a} != ${b}`);
let cases = 0;
for (const side of [-1, 1]) for (const roll of [-0.6, -0.25, 0, 0.4, 0.6]) {
  for (const hip of [-0.65, 0, 0.4, 1.2, 2.9]) for (const knee of [0.2, 0.8, 1.6, 2.7]) {
    const p = S.fk({ x: 3, y: 16, z: side * M.hipLateral }, side, { roll, hip, knee });
    near(distance(p.hip, p.knee), M.link);
    near(distance(p.knee, p.ankle), M.link);
    near(distance(p.ankle, p.axle), S.offset);
    near(S.ik(p.hip, p.axle, side).err, 0);
    cases++;
  }
}
const far = S.ik({ x: 0, y: 0, z: 0 }, { x: 30, y: -30, z: 30 }, 1);
assert.ok(far.err > 20 && far.violations.includes("leg reach"));
near(distance(far.hip, far.knee), M.link);
near(distance(far.knee, far.ankle), M.link);
near(S.tireSupport(0).y, -M.wheelR);
near(S.tireSupport(0.4).y, S.tireSupport(-0.4).y);
near(S.tireSupport(0.4).z, -S.tireSupport(-0.4).z);

// CoM is a weighted sum; translating the entire robot must translate it equally.
const reference = K.referenceClimbFrame(0, 0);
reference.latLeft = 0;
const a = K.projectFrame(reference);
near(a.com.kg, 6);
near(a.com.z, 0);
assert.ok(Math.abs(a.spatial.rollHoldingNm.left) > 5);
assert.ok(Math.abs(a.spatial.rollHoldingNm.left - a.spatial.tippingNm.left) > 0.5);
const b = structuredClone(a.spatial);
for (const axis of ["x", "y", "z"]) {
  b.body[axis] += 7;
  Object.values(b.legs).forEach(leg => ["hip", "knee", "ankle", "axle", "contact"].forEach(key => { leg[key][axis] += 7; }));
}
S.measure(b, K.P);
for (const axis of ["x", "y", "z"]) near(b.com[axis], a.com[axis] + 7);
near(b.rollHoldingNm.left, a.spatial.rollHoldingNm.left);
near(b.tippingNm.left, a.spatial.tippingNm.left);

// Projections must share exactly the same chain at every phase, on both step parities.
for (let step = 0; step < 2; step++) for (let i = 0; i <= 200; i++) {
  const f = K.climbFrame(step, i / 200), front = K.frontView(f);
  for (const name of ["left", "right"]) {
    const p = f[name];
    near(distance(p.hip, p.knee), M.link);
    near(distance(p.knee, p.ankle), M.link);
    near(front.wheels[name].lat, p.axle.z);
    near(front.wheels[name].y, p.axle.y);
    if (f[name + "Down"]) assert.ok(Math.abs(p.contactError) < 0.02);
    for (const key of ["roll", "hip", "knee"]) assert.ok(p.q[key] >= S.limits[key][0] && p.q[key] <= S.limits[key][1]);
  }
  near(front.comLat, f.com.z);
}
assert.equal(K.contactFeasible(1, 0, 0.7, 3), false);
assert.equal(K.contactFeasible(0, -1, 0.7, 3), false);
assert.equal(K.contactFeasible(31, 30, 0.7, 3), false);
assert.equal(K.contactFeasible(40, 100, 0.7, 3), false);
assert.equal(K.contactFeasible(20, 30, 0.7, 3), true);
const manual = structuredClone(reference);
manual.left.requestedAxle = { x: 100, y: 3 };
assert.ok(K.projectFrame(manual).aErr > 50, "manual wheel requests must preserve unreachable targets");
const verdict = K.evaluateClimb();
assert.equal(verdict.status, "rejected");
assert.equal(verdict.dynamicsValidated, false);
assert.ok(verdict.maxTargetErrorIn > 1 && verdict.unreachableFrames > 0);
assert.ok(verdict.kneePeak > S.limits.tauKnee);
console.log(`validation ok: ${cases} spatial FK/IK cases, 402 projection frames, mass invariance, strict contacts and rejected stair candidate`);
