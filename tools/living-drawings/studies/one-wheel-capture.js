/* One-wheel stand: how big a CoM error can Hux recover from, and what each lever buys
   (2026-09-27). Steve: balance with both hips, more hip travel, calculate the weight better,
   estimate the tire footprint. Combines:
     - the bottom-up mass budget (actuators.js massParts → lumps, spec.js bodyLump)
     - frontal.js (three-link frontal model, cheap-control LQR, 10 mm CoM error, linear)
     - studies/roll-travel.js (what each hip can roll before a part hits, at the stance)
     - the contact patch roll stiffness (tire.js patchRollK, frontal.js opts.patch)
   Capture region: the largest CoM error, either sign, whose linear response keeps the planted
   hip and the free hip inside the travel they have (signed: adduction and abduction rooms
   differ). Run: node studies/one-wheel-capture.js */
process.env.HUX_KIN_TEST = "0";
const path = require("path");
const here = path.join(__dirname, "..");
const SPEC = require(path.join(here, "spec.js"));
const ACT = require(path.join(here, "actuators.js"));
require(path.join(here, "kin.js"));
const F = require(path.join(here, "frontal.js"));
const RT = require(path.join(__dirname, "roll-travel.js"));
const K = globalThis.HuxKin, M = K.M;
const D = Math.PI / 180, deg = r => r / D;

/* frontal-plane length of the free leg when it is swung dth fore / aft of hanging (hip swing) */
function freeDrop(dth) {
  const p = K.chain(M.balanceTheta + dth, M.balancePhi);
  return -p.axle.y;                                   /* inches below the hip */
}
function capture(o) {
  o = o || {};
  const r = F.robot({ M: M, freeLen: freeDrop(o.dth || 0), patch: !!o.patch });
  const inputs = o.both ? [2, 3] : [2];
  const res = r.response(0, inputs, 0.010, o.weights, !o.both);
  const pk = res.peak, g = deg(-res.lin.q[0]);
  const room = RT.rooms({ dth: o.dth || 0, chamfer: o.chamfer, stopDeg: o.stopDeg, gamma: -res.lin.q[0] });
  /* excursions per 10 mm, deg; +q2 = more planted adduction, +q3 = free leg in */
  const q2p = deg(pk.q2p), q2n = -deg(pk.q2n), q3p = deg(pk.q3p), q3n = -deg(pk.q3n);
  const lim = (x, room) => x > 1e-6 ? room / x : Infinity;
  const plus = Math.min(lim(q2p, room.plantedAdd), lim(q2n, room.plantedAbd), o.both ? Math.min(lim(q3p, room.freeIn), lim(q3n, room.freeOut)) : Infinity);
  const minus = Math.min(lim(q2n, room.plantedAdd), lim(q2p, room.plantedAbd), o.both ? Math.min(lim(q3n, room.freeIn), lim(q3p, room.freeOut)) : Infinity);
  return { capMm: 10 * Math.min(plus, minus), gammaDeg: g, hold: res.lin.hold, room, q2: [q2p, q2n], q3: [q3p, q3n], tau: pk.u, poles: res.unstablePoles };
}
function row(label, o) {
  const c = capture(o);
  console.log(label.padEnd(58), ("capture " + c.capMm.toFixed(1) + " mm").padEnd(16), ("γ " + c.gammaDeg.toFixed(1) + "°").padEnd(9),
    ("hold " + c.hold.toFixed(1)).padEnd(9), ("rooms p+" + c.room.plantedAdd.toFixed(0) + " f" + c.room.freeIn.toFixed(0) + "/" + c.room.freeOut.toFixed(0)).padEnd(18),
    "τ " + c.tau.map(u => u.toFixed(1)).join("/"));
  return c;
}
if (require.main === module) {
  const b = SPEC.bodyLump();
  console.log("Mass budget " + ACT.lumps.total.toFixed(2) + " kg (" + ACT.lumps.range.lo.toFixed(2) + "–" + ACT.lumps.range.hi.toFixed(2) + "), body " + b.kg.toFixed(2) + " kg at " +
    b.fwdIn.toFixed(2) + "\" fwd / " + b.upIn.toFixed(2) + "\" up; pack " + SPEC.layout.pack.fwdIn + "\" / " + SPEC.layout.pack.upIn + "\", head " + SPEC.layout.headFwdIn + "\" fwd\n");
  row("old stops ±34°, planted hip only, free leg hanging", { stopDeg: 34.4, chamfer: 0 });
  row("old stops ±34°, both hips, free leg hanging", { both: true, stopDeg: 34.4, chamfer: 0 });
  row("stops ±50°, head chamfer 1\", both hips, free leg hanging", { both: true, stopDeg: 50, chamfer: 1 });
  row("stops ±50°, chamfer, both hips, free leg 30° forward", { both: true, stopDeg: 50, chamfer: 1, dth: -30 });
  const best = row("stops ±50°, chamfer, both hips, free leg 45° forward", { both: true, stopDeg: 50, chamfer: 1, dth: -45 });
  row("  … planted hip only", { both: false, stopDeg: 50, chamfer: 1, dth: -45 });
  row("  … plus the contact patch (k = F·rc/2)", { both: true, stopDeg: 50, chamfer: 1, dth: -45, patch: true });
  row("  … heavier free-hip use (Q on the planted hip ×4)", { both: true, stopDeg: 50, chamfer: 1, dth: -45, weights: { Q: [100, 2, 400, 2, 100, 2], R: 1000 } });
  console.log("\nexcursions per 10 mm (best row): planted +" + best.q2[0].toFixed(1) + "° / −" + best.q2[1].toFixed(1) + "°, free +" + best.q3[0].toFixed(1) + "° / −" + best.q3[1].toFixed(1) + "°");
}
module.exports = { capture, freeDrop };
