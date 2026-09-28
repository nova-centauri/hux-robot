/* Pack placement sweep (2026-09-27). Steve: no reaction wheel; move the battery up to an optimal
   position. For each pack centre (fwd, up from the hip roll axes' midpoint) this rebuilds the body
   lump (spec.bodyLump) and reports what every model says:
     one wheel  — frontal.js: shift angle, planted hip hold, body / free-leg swing per 10 mm of CoM
                  error, and the capture region those swings leave inside the ±34.4° roll travel
     stair      — kin.js planar climb: the least liftoff momentum that crests with the catch, the most the
                  forward room absorbs, the window between them, and what the default shove gives
                  (historical planar solver; comparative only)
     two wheels — whole-robot CoM height at the 92% stance, the sagittal pendulum rate, the lateral
                  static tip angle, the lateral tip angle on a 20° cross-slope margin
   Run: node studies/pack-sweep.js */
process.env.HUX_KIN_TEST = "0";
const path = require("path");
const here = path.join(__dirname, "..");
const SPEC = require(path.join(here, "spec.js"));
require(path.join(here, "actuators.js"));
require(path.join(here, "kin.js"));
const F = require(path.join(here, "frontal.js"));
const K = globalThis.HuxKin, M = K.M, P = K.P;
const IN = 0.0254, deg = r => r * 180 / Math.PI, LIM = 0.6; /* rad, the sandbox / spatial roll stop */

const CAP = require(path.join(__dirname, "one-wheel-capture.js"));
function evaluate(pk, head) {
  const b = SPEC.bodyLump({ pack: pk, headFwdIn: head !== undefined ? head : SPEC.layout.headFwdIn });
  M.bodyComUp = b.upIn; M.bodyIpitch = b.Iz; M.bodyIroll = b.Ix; P.bodyCom = b.fwdIn;
  K.rebuild();
  const c = K.climb();
  const out = { pack: pk, body: b };
  /* the one-wheel capture region at the chosen stand configuration (both hips, ±50° stops, head
     chamfer, free leg 45° forward) and with the planted hip alone */
  const best = CAP.capture({ both: true, stopDeg: 50, chamfer: 1, dth: -45 });
  const plantedOnly = CAP.capture({ both: false, stopDeg: 50, chamfer: 1, dth: -45 });
  out.planted = { gammaDeg: best.gammaDeg, holdNm: best.hold, captureMm: plantedOnly.capMm };
  out.both = { captureMm: best.capMm };
  /* two wheels at 92%: whole-robot CoM height (sagittal plane, lumps at their heights) */
  const p = K.planted(M.balanceTheta, M.balancePhi);
  const mm = M.mass;
  const h = (mm.body * (p.hip.y + b.upIn) + mm.hips * p.hip.y + 2 * mm.knee * p.knee.y + 2 * mm.wheel * p.axle.y) / M.exampleMassKg;
  out.two = { comHeightIn: h, omega: Math.sqrt(9.81 / (h * IN)), tipDeg: deg(Math.atan((M.track / 2) / h)) };
  out.stair = { need: -c.LneedCatch, max: -c.Lmax, lift: -c.Llift, window: c.window };
  return out;
}

const rows = [];
const ups = [0, 2.5, 3.5, 4.3];
ups.forEach(u => rows.push(evaluate({ fwdIn: 1.0, upIn: u }, 0)));
[0.0, 2.0, 2.4].forEach(f => rows.push(evaluate({ fwdIn: f, upIn: 4.3 }, 0)));
[0.5, 1.0, 1.5].forEach(h => rows.push(evaluate({ fwdIn: 2.0, upIn: 4.3 }, h)));
rows.push(evaluate({ fwdIn: SPEC.layout.pack.fwdIn, upIn: SPEC.layout.pack.upIn }, SPEC.layout.headFwdIn)); /* the chosen placement (spec.js) */
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2);
console.log("pack (fwd, up) + head | body CoM (fwd, up) | γ | hold | capture planted / both hips | stair need–max (window), lift at tPush | 2-wheel CoM h, tip°");
rows.forEach(r => console.log([
  "(" + f1(r.pack.fwdIn) + ", " + f1(r.pack.upIn) + ") + " + f1(r.body.headFwdIn),
  "(" + f2(r.body.fwdIn) + ", " + f2(r.body.upIn) + ")",
  f1(r.planted.gammaDeg) + "°", f2(r.planted.holdNm) + " N·m",
  f1(r.planted.captureMm) + " / " + f1(r.both.captureMm) + " mm",
  f2(r.stair.need) + "–" + f2(r.stair.max) + " (" + f2(r.stair.window) + "), " + f2(r.stair.lift),
  f1(r.two.comHeightIn) + "\" " + f1(r.two.tipDeg) + "°"
].join(" | ")));
module.exports = { evaluate };
