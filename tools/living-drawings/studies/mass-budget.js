/* Mass budget report and CoM uncertainty (2026-09-27). Prints the bottom-up budget from
   actuators.js massParts, the lumps the models read, and a Monte Carlo of the whole-robot CoM
   before anything is weighed: every part's mass uniform in its low–high range (left and right
   parts independently) and its position ±sd (body parts; leg parts ±0.1"). The lateral spread is
   what the one-wheel stand has to live with until the robot is weighed and its CoM found on a
   bench. Run: node studies/mass-budget.js */
process.env.HUX_KIN_TEST = "0";
const path = require("path");
const here = path.join(__dirname, "..");
const SPEC = require(path.join(here, "spec.js"));
const ACT = require(path.join(here, "actuators.js"));
require(path.join(here, "kin.js"));
const K = globalThis.HuxKin, M = K.M;
const P = ACT.massParts;
const IN = 25.4;
let rows = [], tot = 0, lo = 0, hi = 0;
P.forEach(p => { const n = p.qty; tot += n * p.g; lo += n * p.lo; hi += n * p.hi; rows.push([p.link.padEnd(9), String(n).padStart(2), (p.g + "").padStart(6), ("(" + p.lo + "–" + p.hi + ")").padEnd(12), p.name]); });
if (require.main === module) {
  console.log("Mass budget, grams (each) — " + (tot / 1000).toFixed(2) + " kg (" + (lo / 1000).toFixed(2) + "–" + (hi / 1000).toFixed(2) + ")\n");
  rows.forEach(r => console.log(r.join("  ")));
  const L = ACT.lumps;
  console.log("\nlumps: body " + L.body.toFixed(3) + ", hips " + L.hips.toFixed(3) + " (both), knee " + L.knee.toFixed(3) + ", wheel " + L.wheel.toFixed(3) + " (tread " + L.wheelTread.toFixed(3) + ") — legs are " + (100 * (1 - L.body / L.total)).toFixed(0) + " % of the robot");
  const b = SPEC.bodyLump();
  console.log("body CoM " + b.fwdIn.toFixed(2) + "\" fwd, " + b.upIn.toFixed(2) + "\" up of the hip axes; σ " + ["fwd", "up", "lat"].map(k => (b.sigmaIn[k] * IN).toFixed(1)).join(" / ") + " mm");
}
/* Monte Carlo of the whole-robot CoM at the 92 % stance (lateral from the centreline, height) */
function monteCarlo(nRuns) {
  const hipY = K.planted(M.balanceTheta, M.balancePhi).hip.y, kneeY = K.planted(M.balanceTheta, M.balancePhi).knee.y;
  const yOf = link => link === "hip" ? hipY : link === "knee" || link === "hipknee" ? (link === "knee" ? kneeY : (hipY + kneeY) / 2) : link === "kneewheel" ? (kneeY + M.wheelR) / 2 : M.wheelR;
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) / Math.sqrt(0.5); };
  const zs = [], ys = [];
  for (let r = 0; r < nRuns; r++) {
    let m = 0, mz = 0, my = 0;
    P.forEach(p => {
      const sides = p.link === "body" ? (p.mirror ? [1, -1] : [1]) : [1, -1];
      sides.forEach(sg => {
        const g = p.lo + (p.hi - p.lo) * rnd();
        let z, y;
        if (p.link === "body") {
          const pos = p.move === "pack" ? { lat: 0, up: SPEC.layout.pack.upIn } : (p.pos || { lat: 0, up: 0 });
          z = sg * (pos.lat || 0) + (p.sd || 0.3) * gauss();
          y = hipY + pos.up + (p.sd || 0.3) * gauss();
        } else { z = sg * p.lat + 0.1 * gauss(); y = yOf(p.link) + 0.1 * gauss(); }
        m += g; mz += g * z; my += g * y;
      });
    });
    zs.push(mz / m); ys.push(my / m);
  }
  const sd = a => { const mu = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / a.length); };
  return { latSigmaMm: sd(zs) * IN, heightSigmaMm: sd(ys) * IN };
}
if (require.main === module) {
  const mc = monteCarlo(4000);
  console.log("whole robot, before weighing (Monte Carlo): lateral CoM σ " + mc.latSigmaMm.toFixed(1) + " mm, height σ " + mc.heightSigmaMm.toFixed(1) + " mm");
}
module.exports = { monteCarlo };
