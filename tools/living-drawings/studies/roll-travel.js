/* Hip-roll travel: what physically stops each leg rolling, on Sheet 1's layout (2026-09-27).
   Steve asked for more hip travel. The ±0.6 rad (34.4°) stop in spatial.js was a drawing
   assumption; the RS02 turns continuously, so the real limit is the first part that hits
   something. This builds the parts as boxes / capsules from the same numbers the sheets use
   (spec.js layout, actuators.js envelopes, kin.js geometry), rolls each leg about its roll axis
   and reports the first interference:
     1. abduction (wheel outward) of one leg alone — the RS00 top rising into the head
     2. adduction (wheel inward) of one leg alone — the knee / wheel under the body
     3. the one-wheel stance: planted leg adducted to put the mass over its tire, then more
        (the planted hip's travel left), and the free leg rolled either way from hanging
   Frame: inches, x forward, y up, z to the right, origin midway between the roll axes.
   Legs: left z = −3.0, right z = +3.0. Adduction a > 0 swings a leg's wheel toward the centre.
   Run: node studies/roll-travel.js */
process.env.HUX_KIN_TEST = "0";
const log = require.main === module ? console.log : () => {};
const path = require("path");
const here = path.join(__dirname, "..");
const SPEC = require(path.join(here, "spec.js"));
const ACT = require(path.join(here, "actuators.js"));
require(path.join(here, "kin.js"));
const K = globalThis.HuxKin, M = K.M, L1 = SPEC.layout, E = ACT.envIn;
const D = Math.PI / 180;
const roll0 = L1.hipRollAxisIn, plane = L1.legPlaneIn - roll0;       /* 1.75" leg plane outboard of the roll axis */
const spacer = M.track / 2 - roll0;                                   /* wheel plane outboard of the roll axis */
const tubeR = SPEC.sheet2.tube.odMm / 25.4 / 2 + 0.25;               /* tube + fitting wall */
const CLEAR = 0.12;                                                   /* in, a working gap */

/* body boxes (axis-aligned): head, hip band */
const bandHalf = L1.hipBandWidthIn / 2, rollD = E.rollD;
/* The head's lower long edges carry a 45° chamfer (spec.js layout.headChamferIn): without it
   the RS00's top inner corner reaches the head at 40° of abduction; a 1" chamfer moves that to 56°. */
let CH = process.env.HEAD_CHAMFER !== undefined ? Number(process.env.HEAD_CHAMFER) : (L1.headChamferIn || 0);
let body = [];
function buildBody() { body = [
  { n: "head", x: [-4, 4], y: [rollD / 2, M.bodyAboveHip], z: [-M.bodyWidth / 2 + CH, M.bodyWidth / 2 - CH] },
  { n: "head", x: [-4, 4], y: [rollD / 2 + CH, M.bodyAboveHip], z: [-M.bodyWidth / 2, M.bodyWidth / 2] },
  /* the band ends at the roll RS02 output-flange face (the yoke bolts to it) and runs aft to the head's rear */
  { n: "hip band", x: [-4.0, -2.4 + E.rollL / 2], y: [-rollD / 2, rollD / 2], z: [-bandHalf, bandHalf] }
]; }
buildBody();

/* Leg parts in the leg frame: (x fwd, v down-positive from the hip axis... we use y up), o outboard
   of the roll axis. Sampled as point clouds. */
function legParts(theta, phi, lift) {
  const p = K.chain(theta, phi);             /* hip at origin; knee / axle in the sagittal plane */
  const pts = [];
  const add = (n, x, y, o) => pts.push({ n, x, y, o });
  const boxS = (n, cx, cy, co, sx, sy, so) => {
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) for (let k = 0; k <= 2; k++)
      add(n, cx + sx * (i / 4 - 0.5), cy + sy * (j / 4 - 0.5), co + so * (k / 2 - 0.5));
  };
  const caps = (n, a, b, o, r) => {
    for (let t = 0; t <= 12; t++) { const x = a.x + (b.x - a.x) * t / 12, y = a.y + (b.y - a.y) * t / 12;
      [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].forEach(([dx, dz]) => add(n, x + dx, y, o + dz)); }
  };
  const knee = p.knee, axle = { x: p.axle.x, y: p.axle.y + (lift || 0) };
  boxS("RS00", 0, 0, plane + E.swing.t / 2, E.swing.w, E.swing.h, E.swing.t);
  caps("upper tube", { x: 0, y: -1.3 }, knee, plane, tubeR);
  boxS("knee RS02", knee.x, knee.y, plane - E.knee.t / 2, E.knee.w, E.knee.h, E.knee.t);
  caps("lower tube", knee, axle, plane, tubeR);
  /* wheel: a disc of radius R at the wheel plane, 1.25" wide, plus the RS05 flush outboard */
  for (let a = 0; a < 360; a += 15) for (const rr of [M.wheelR, M.wheelR * 0.6]) for (const w of [-0.5, 0, 0.5])
    add("wheel", axle.x + rr * Math.cos(a * D), axle.y + rr * Math.sin(a * D), spacer + w * M.wheelWidth);
  return pts;
}
/* Place a leg: side s (−1 left, +1 right), adduction a (rad), body level. */
function place(pts, s, a) {
  return pts.map(q => {
    /* leg frame (o outboard, y up) → rotate about the roll axis; adduction swings points below the axis inward */
    const o = q.o, y = q.y;
    const oR = o * Math.cos(a) + y * Math.sin(a);      /* y < 0 below the axis: a > 0 pulls them inboard */
    const yR = -o * Math.sin(a) + y * Math.cos(a);
    return { n: q.n, x: q.x, y: yR, z: s * (roll0 + oR) };
  });
}
function inBox(q, b, c) { return q.x > b.x[0] - c && q.x < b.x[1] + c && q.y > b.y[0] - c && q.y < b.y[1] + c && q.z > b.z[0] - c && q.z < b.z[1] + c; }
function hitsBody(P) { for (const q of P) for (const b of body) if (inBox(q, b, CLEAR)) return q.n + " → " + b.n; return null; }
function hitsLeg(P, Q) {
  /* crude: any two points closer than 2 × CLEAR + a sample spacing, from different parts' surfaces */
  for (const p of P) for (const q of Q) if (Math.abs(p.x - q.x) < 0.45 && Math.abs(p.y - q.y) < 0.45 && Math.abs(p.z - q.z) < 0.45) return p.n + " ↔ " + q.n;
  return null;
}

const th = M.balanceTheta, ph = M.balancePhi;
const hipH = K.planted(th, ph).hip.y;
const legs = legParts(th, ph, 0);
/* 1 and 2: one leg alone (right leg), body level, both wheels notionally free */
function firstHit(fn, from, to, step) { for (let d = from; Math.abs(d) <= Math.abs(to); d += step) { const h = fn(d * D); if (h) return { deg: d, what: h }; } return null; }
const abd = firstHit(a => hitsBody(place(legs, 1, a)), 0, -90, -0.5);
const add = firstHit(a => hitsBody(place(legs, 1, a)), 0, 90, 0.5);
log("One leg alone, 92% stance, body level:");
log("  abduction (wheel out) first hit:", abd ? abd.deg.toFixed(1) + "° — " + abd.what : "none to 90°");
log("  adduction (wheel in) first hit, vs the body:", add ? add.deg.toFixed(1) + "° — " + add.what : "none to 90°");

/* 3: one-wheel stance. Planted = left. The shift angle is frontal.js's balanceRoll at this stance. */
const F = require(path.join(here, "frontal.js"));
const fr = F.robot({ M: M });
const gamma = -fr.balanceRoll(0);
const freeLegs = legParts(th, ph, 1.0);       /* free wheel lifted 1" by a little knee fold (drawing) */
log("\nOne-wheel stance (left planted), shift γ = " + (gamma / D).toFixed(1) + "°:");
const planted = a => place(legs, -1, a);
const freeAt = b => place(freeLegs, 1, b);
const pExtra = firstHit(a => hitsBody(planted(gamma + a)) || hitsLeg(planted(gamma + a), freeAt(0)), 0, 60, 0.5);
log("  planted hip, more adduction than γ, first hit:", pExtra ? "+" + pExtra.deg.toFixed(1) + "° (" + ((gamma / D) + pExtra.deg).toFixed(1) + "° total) — " + pExtra.what : "none");
const pBack = firstHit(a => hitsBody(planted(gamma - a)) || hitsLeg(planted(gamma - a), freeAt(0)), 0, 90, 0.5);
log("  planted hip, back toward abduction, first hit:", pBack ? "−" + pBack.deg.toFixed(1) + "° — " + pBack.what : "none to 90°");
const fIn = firstHit(b => hitsBody(freeAt(b)) || hitsLeg(freeAt(b), planted(gamma)), 0, 60, 0.5);
const fOut = firstHit(b => hitsBody(freeAt(b)) || hitsLeg(freeAt(b), planted(gamma)), 0, -90, -0.5);
log("  free hip, adduction from hanging, first hit:", fIn ? fIn.deg.toFixed(1) + "° — " + fIn.what : "none");
log("  free hip, abduction from hanging, first hit:", fOut ? fOut.deg.toFixed(1) + "° — " + fOut.what : "none");


/* The free leg does not have to hang in the planted leg's sagittal space: swing it fore or aft
   with the hip-swing RS00 (and lift the wheel a little more) and the lower tubes stop meeting. */
log("\nFree leg swung fore / aft of the planted leg (hip swing Δθ, wheel lifted 1\"):");
const variants = [];
for (const dth of [-30, -20, -10, 10, 20, 30]) {
  const fl = legParts(th + dth, ph, 1.0);
  const freeV = b => place(fl, 1, b);
  const pX = firstHit(a => hitsBody(planted(gamma + a)) || hitsLeg(planted(gamma + a), freeV(0)), 0, 60, 0.5);
  const fI = firstHit(b => hitsBody(freeV(b)) || hitsLeg(freeV(b), planted(gamma)), 0, 60, 0.5);
  const fO = firstHit(b => hitsBody(freeV(b)) || hitsLeg(freeV(b), planted(gamma)), 0, -90, -0.5);
  variants.push({ dth, pX, fI, fO });
  log("  Δθ " + (dth > 0 ? "+" : "") + dth + "° (" + (dth < 0 ? "forward" : "aft") + "): planted +" + (pX ? pX.deg.toFixed(1) + "° (" + pX.what + ")" : ">60°") +
    ", free in " + (fI ? fI.deg.toFixed(1) + "° (" + fI.what + ")" : ">60°") + ", free out " + (fO ? (-fO.deg).toFixed(1) + "° (" + fO.what + ")" : ">90°"));
}

/* Travel left at the one-wheel stance for a free-leg pose: planted hip toward more adduction
   (+) and back (−), free hip in (+) and out (−), each capped by a joint stop (deg). */
function rooms(o) {
  o = o || {};
  if (o.chamfer !== undefined && o.chamfer !== CH) { CH = o.chamfer; buildBody(); }
  const stop = o.stopDeg || 90;
  const fl = legParts(th + (o.dth || 0), ph, o.lift !== undefined ? o.lift : 1.0);
  const freeV = b => place(fl, 1, b);
  const g = o.gamma !== undefined ? o.gamma : gamma;
  const pl = a => place(legs, -1, a);
  const hit = (fn, to, step) => firstHit(fn, 0, to, step);
  const pA = hit(a => hitsBody(pl(g + a)) || hitsLeg(pl(g + a), freeV(0)), 90, 0.5);
  const pB = hit(a => hitsBody(pl(g + a)) || hitsLeg(pl(g + a), freeV(0)), -90, -0.5);
  const fI = hit(b => hitsBody(freeV(b)) || hitsLeg(freeV(b), pl(g)), 90, 0.5);
  const fO = hit(b => hitsBody(freeV(b)) || hitsLeg(freeV(b), pl(g)), -90, -0.5);
  const gd = g / D;
  return {
    gammaDeg: gd,
    plantedAdd: Math.min(pA ? pA.deg : 90, stop - gd), plantedAddWhat: pA && pA.deg < stop - gd ? pA.what : "joint stop",
    plantedAbd: Math.min(pB ? -pB.deg : 90, stop + gd),
    freeIn: Math.min(fI ? fI.deg : 90, stop), freeInWhat: fI && fI.deg < stop ? fI.what : "joint stop",
    freeOut: Math.min(fO ? -fO.deg : 90, stop), freeOutWhat: fO && -fO.deg < stop ? fO.what : "joint stop"
  };
}
module.exports = { gamma, abd, add, pExtra, fIn, fOut, variants, rooms };
