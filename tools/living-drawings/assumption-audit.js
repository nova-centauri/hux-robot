/* Independent engineering checks of the working drawing, not a hardware certification.
   Run: node tools/living-drawings/assumption-audit.js
   JSON to stdout; no dependencies beyond Node. Does not modify the model.
   Exit status verifies calculation consistency only; inspect designChecks for failures. */
"use strict";
const assert = require("node:assert/strict");
process.env.HUX_KIN_TEST = "0";
require("./kin.js");
const K = globalThis.HuxKin;
const { M } = K;
const IN = 0.0254;
const baseline = { ...K.P };
const climb = K.climb();
const stance = K.planted(M.balanceTheta, M.balancePhi);
const com = K.comOf(stance, stance);
const round = n => Number(n.toPrecision(9));
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// Independently verify FK/IK on reachable, nonsingular configurations and virtual work.
let maxIkErrorIn = 0;
let maxTorqueErrorNm = 0;
let cases = 0;
for (const th of [-30, 0, 23, 60, 95]) {
  for (const ph of [25, 46, 90, 140]) {
    const p = K.chain(th, ph);
    maxIkErrorIn = Math.max(maxIkErrorIn, K.ik(p.axle.x, p.axle.y).err);
    const F = { x: 17, y: 59 }, Fk = { x: -2, y: -3 }, couple = 0.8;
    const got = K.legTorques(th, ph, F, Fk, couple);
    const h = 1e-5; // radians
    const hd = h * 180 / Math.PI;
    for (const axis of ["hip", "knee"]) {
      const a = K.chain(th + (axis === "hip" ? hd : 0), ph + (axis === "knee" ? hd : 0));
      const b = K.chain(th - (axis === "hip" ? hd : 0), ph - (axis === "knee" ? hd : 0));
      const work = (F.x * (a.axle.x - b.axle.x) + F.y * (a.axle.y - b.axle.y)
        + Fk.x * (a.knee.x - b.knee.x) + Fk.y * (a.knee.y - b.knee.y)) * IN / (2 * h);
      const expect = -work + (axis === "hip" ? couple : -couple);
      maxTorqueErrorNm = Math.max(maxTorqueErrorNm, Math.abs(got[axis] - expect));
    }
    cases++;
  }
}
assert.ok(maxIkErrorIn < 1e-8);
assert.ok(maxTorqueErrorNm < 1e-6);
near(stance.hip.y, 16.8);
near(com.kg, M.exampleMassKg); /* 7.75 kg with the locked actuator set; was 6 */

// Combine the coordinates shown in the side and front drawings. Triangle inequality
// gives a generous necessary reach bound, even allowing the axle spacer to point any way.
const axleOffset = Math.abs(M.track / 2 - M.hipLateral);
const generousReachBound = 2 * M.link + axleOffset;
let maxReach = { requiredIn: 0 };
let framesOutsideReach = 0;
for (let i = 0; i <= 2000; i++) {
  const f = K.referenceClimbFrame(0, i / 2000);
  // Explicitly reconstruct the pre-correction independent front projection.
  const bodyLat = -f.latLeft * M.track / 2;
  const front = { hips: { left: bodyLat - M.hipLateral, right: bodyLat + M.hipLateral },
    wheels: { left: { lat: -M.track / 2 }, right: { lat: M.track / 2 } } };
  let outside = false;
  for (const side of ["left", "right"]) {
    const leg = f[side];
    const dx = leg.hip.x - leg.axle.x;
    const dy = leg.hip.y - leg.axle.y;
    const dz = front.hips[side] - front.wheels[side].lat;
    const required = Math.hypot(dx, dy, dz);
    if (required > maxReach.requiredIn) maxReach = {
      requiredIn: required, timeS: f.t, fraction: i / 2000,
      phase: f.phase, side, dxIn: dx, dyIn: dy, dzIn: dz
    };
    outside ||= required > generousReachBound;
  }
  if (outside) framesOutsideReach++;
}

const joints = {};
for (const key of ["aTh", "aPh", "bTh", "bPh"]) {
  let lo = Infinity, hi = -Infinity, rate = 0, withinPhaseRate = 0;
  climb.samples.forEach((s, i, rows) => {
    lo = Math.min(lo, s[key]); hi = Math.max(hi, s[key]);
    if (!i) return;
    const p = rows[i - 1];
    const speed = Math.abs(s[key] - p[key]) / (s.t - p.t);
    rate = Math.max(rate, speed);
    if (!s.seam && !p.seam) withinPhaseRate = Math.max(withinPhaseRate, speed);
  });
  joints[key] = { minDeg: lo, maxDeg: hi, maxDegPerSec: rate, awayFromSeamsDegPerSec: withinPhaseRate };
}

const totalMass = com.kg;
const weight = totalMass * M.g;
const R = M.wheelR * IN;
const h = com.y * IN;
const slot = M.slotRoom * IN;
const wheelOverCap = climb.samples.filter(s => !s.seam && s.tq.wheel > baseline.wheelTau + 1e-6);
const sensitivity = [];
// One parameter at a time. Never carry a changed parameter into the next case.
for (const [name, delta] of [
  ["baseline", {}], ["mass 6 kg (the 2026-09-22 picture)", { massScale: 6 / M.exampleMassKg }], ["mass 9 kg", { massScale: 9 / M.exampleMassKg }],
  ["mu 0.3", { mu: 0.3 }], ["mu 0.5", { mu: 0.5 }],
  ["body +1 inch, unchanged timing", { bodyCom: 1 }], ["body +2 inches, unchanged timing", { bodyCom: 2 }],
  ["landing +0.5 inch", { landErr: 0.5 }], ["landing -0.75 inch", { landErr: -0.75 }]
]) {
  const c = K.rebuild({ ...baseline, ...delta });
  sensitivity.push({ name, reducedModelFailure: c.flown.fail || null, behindIn: c.liftoffBehind,
    momentumWindow: c.window, kneeStaticNm: c.peaks.kneeStatic,
    kneeDynamicNm: Math.max(c.peaks.aKnee, c.peaks.bKnee), wheelNm: c.peaks.wheel,
    pushConeFailures: c.pushForceBad.length });
}
K.rebuild(baseline);

const tube = [12, 14].map(id => {
  const D = 0.016, d = id / 1000, L = M.link * IN, E = 100e9, endMass = 0.30;
  const I = Math.PI * (D ** 4 - d ** 4) / 64;
  return { odMm: 16, idMm: id, assumedEMpa: E / 1e6,
    secondMomentM4: I, cantileverTipMassHz: Math.sqrt(3 * E * I / (L ** 3 * endMass)) / (2 * Math.PI),
    nominalBendingStressAt10NmMpa: 10 * D / 2 / I / 1e6 };
});

const report = {
  scope: "Analytical cross-checks of unmeasured design assumptions; not physical validation. Model failures are data, not process exit failures.",
  inputs: { massKg: totalMass, linkIn: M.link, wheelOdIn: M.wheelOd, trackIn: M.track, riseIn: M.rise, goingIn: M.going },
  independentMath: { cases, maxIkErrorIn, maxTorqueErrorNm },
  geometry: { fullHeightIn: M.wheelR + 2 * M.link + M.bodyAboveHip,
    stanceHipIn: stance.hip.y, stanceKneeOffsetIn: stance.poke, stanceComIn: com,
    directSwingReachIn: Math.hypot(M.going, M.rise + M.wheelR - stance.hip.y),
    unusedPlanarReachIn: 2 * M.link - Math.hypot(M.going, M.rise + M.wheelR - stance.hip.y),
    generousSpatialReachBoundIn: generousReachBound, maxDrawnSpatialReach: maxReach,
    framesOutsideReach, sampledFrames: 2001 },
  loads: { centerlineTippingMomentNm: weight * M.track / 2 * IN,
    bodyOnlyHipRollMomentUprightNm: M.mass.body * M.g * M.hipLateral * IN,
    oneLegPointLoadKneeNm: weight * stance.poke * IN,
    twoLegPointLoadKneeNm: weight * stance.poke * IN / 2,
    stairKneeStaticNm: climb.peaks.kneeStatic,
    stairKneeDynamicNm: Math.max(climb.peaks.aKnee, climb.peaks.bKnee),
    stairHipDynamicNm: Math.max(climb.peaks.aHip, climb.peaks.bHip), stairWheelNm: climb.peaks.wheel,
    wheelOverCapSamplesAwayFromSeams: wheelOverCap.length,
    oneRiserPotentialEnergyJ: weight * M.rise * IN,
    drop25mmStoppedOver5mmAverageNormalN: weight * (1 + 0.025 / 0.005) },
  balance: { assumedComHeightM: h, pointPendulumOmega: Math.sqrt(M.g / h),
    unstableModeDoublingSec: Math.log(2) * Math.sqrt(h / M.g),
    captureVelocityWithCenteredComMps: Math.sqrt(M.g / h) * slot,
    positionOnlyLeanAtSlotEdgeDeg: Math.atan(slot / h) * 180 / Math.PI,
    frictionRequiredFor3NmAtFullWeight: 3 / (weight * R),
    frictionRequiredFor3NmAtHalfWeight: 3 / (weight * R / 2),
    frictionTorqueNm: [0.15, 0.3, 0.5, 0.7].map(mu => ({ mu, oneWheel: mu * weight * R, halfLoadWheel: mu * weight * R / 2 })),
    wheelRpm: [0.5, 1.5, 3].map(speed => ({ speedMps: speed, rpm: speed / (2 * Math.PI * R) * 60 })),
    sideSwayCubicPeakAccelerationMps2: 6 * M.track * IN / 0.85 ** 2,
    optimisticStaticLateralContactToleranceIn: M.wheelWidth / 2 },
  joints, tubes: tube, sensitivity,
  correctedModel: K.evaluateClimb(),
  designChecks: [
    { name: "Combined drawings inside generous spatial reach bound", pass: maxReach.requiredIn <= generousReachBound },
    { name: "Reported stair wheel peak within 3 Nm target", pass: climb.peaks.wheel <= 3 },
    { name: "Reported stair knee peak within 12 Nm sandbox cap", pass: Math.max(climb.peaks.aKnee, climb.peaks.bKnee) <= 12 },
    { name: "Drawn knee fold stays below sandbox 2.7 rad soft stop", pass: Math.max(joints.aPh.maxDeg, joints.bPh.maxDeg) <= 2.7 * 180 / Math.PI }
  ]
};
console.log(JSON.stringify(report, (key, value) => typeof value === "number" ? round(value) : value, 2));
