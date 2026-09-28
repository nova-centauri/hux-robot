/* Hux V1 spec — the decisions of 2026-09-27 as numbers (docs/decisions.md, docs/requirements.md
   R37–R40), plus the layout numbers the first 2D sheet is drawn to. One table, read by kin.js
   (hip roll axis, body CoM offset, leg plane, the knee spring's pulley), sheet.js / sheet2.js
   (the drawings and their title blocks), sim-core.js (the speed-command cap; its body CoM
   stays at 0 until the one-wheel sequence is re-tuned — NOTES open call 17), sim-view.js (the top-speed slider) and validation-test.js (wheel torque
   margin at the top speed). Change a decision here and the pages follow. Inches for geometry,
   SI for speeds and torques. */
(function (root) {
  "use strict";
  const ACT = root.HuxActuators || require("./actuators.js");
  const IN = 0.0254;
  const ROLL_AXIS_IN = 3.0; /* spec.layout.hipRollAxisIn; named here because the hip band is sized from it */

  const spec = {
    asOf: "2026-09-27",

    /* R37 — what "done" means for V1. The north star is still stairs; a flight is V2 on the same
       hardware (the same cycle repeated with the landing error held inside the slot every time). */
    finishLine: {
      id: "R37",
      text: "one 9.5\" step, 9 of 10 attempts, from a standstill on the lower tread",
      attempts: 10, passes: 9,
      flight: "V2, same hardware"
    },

    /* R38 — flat-ground pace. Set by the locked RS05 on the 8S bus at the 6" wheel, keeping
       `reserveNm` of catch torque in hand at the top speed (see wheelAtSpeed below). */
    speed: { id: "R38", topMs: 1.5, cruiseMs: 1.0, reserveNm: 2.0 },

    /* R39 — the knee. RS02 at the knee joint for V1, gravity spring in scope, the hip-driven
       linkage parked as a V2 refinement, no five-bar leg (docs/research/knee-linkage.md,
       tools/living-drawings/studies/fivebar-check.py). The spring's rate and preload are not a
       number here: kin.js kneeSpring() fits them to the two-leg gravity torque at 92% and 75%
       on the sheet2.spring pulley (1.81 N·m/rad + 0.23 N·m on the 5.67 kg mass budget, 2026-09-27;
       3.05 + 0.38 on the 7.75 kg picture). The old fixed
       "~2.2 N·m" was the 6 kg picture. */
    knee: { id: "R39", actuatorAt: "knee", spring: true, linkage: "V2", fiveBar: false },

    /* R40 — what V1 controls have to handle. Rough ground is V3 / Phase E. */
    terrain: { id: "R40", sillIn: 1.0, slopeDeg: 20, rough: "V3 / Phase E" },

    /* Layout numbers for Sheet 1 (2026-09-27). The roll-axis offset is the 2026-09-26 requirement
       (≤ 3" so the planted hip roll hold stays under the RS02's 7 rated: 5.2 N·m at 3.0" on the 5.67 kg mass
       budget, frontal.js, 2026-09-27; 6.3 on the 7.75 kg picture, 6.0 on 2026-09-26). The body CoM is computed
       from the mass budget (bodyLump below); the stair throw wants it ≥ +2.5" forward and the
       budget puts it at −0.55" (NOTES open call 16). The leg
       plane is where the tubes run: outboard of the roll actuator's housing, inboard of the tire. */
    layout: {
      hipRollAxisIn: ROLL_AXIS_IN, /* lateral, from the body centreline, each side */
      legPlaneIn: 4.75,        /* lateral, the tube / joint plane, each side */
      hipBandWidthIn: 2 * (ROLL_AXIS_IN + ACT.envIn.rollD / 2), /* two RS02 roll housings */
      packIn: { l: 150 / 25.4, w: 45 / 25.4, h: 56 / 25.4 }, /* 8S 3300 mAh envelope as it lies in the head (l lateral, w fore-aft, h vertical): real packs are ~139–143 × 43–44 × 42–56 mm (docs/research/mass-budget.md) */
      /* The body lump is summed from the body rows of the mass budget (actuators.js massParts):
         the pack, the two roll RS02s and the band electronics in the hip band, the head shell and
         everything in it. bodyLump() below returns its CoM, inertias and CoM uncertainty; the
         pack's position and the head's fore-aft offset are the two layout choices that move it.
         bodyComForwardIn / bodyComUpIn are computed, never typed.
         Pack (Steve 2026-09-27: move the battery up; studies/pack-sweep.js, re-run on the mass
         budget): top of the head, long axis lateral. Height: the both-hip capture region grows
         from 4.6 mm (in the band) to 7.3 mm at 4.3" up; above that there is no room under the
         lid. Fore-aft does not touch the one-wheel numbers; forward helps the stair (the body
         CoM sits 0.6" behind the hip-swing axis with the roll RS02s and the band aft), so the
         pack goes as far forward as the display and stereo pair allow: 2.2". */
      pack: { fwdIn: 2.2, upIn: 4.3, where: "top of the head, long axis lateral, forward (2026-09-27)" },
      headFwdIn: 0.0,          /* the head shell and its contents, fore-aft offset from the hip axes */
      /* 45° chamfer on the head's lower long edges (2026-09-27, studies/roll-travel.js): without it
         the RS00's top inner corner meets the head at 40° of abduction; with 1" it is 56°. */
      headChamferIn: 1.0,
      /* Hip-roll joint stops (2026-09-27; were ±0.6 rad = 34.4°, a drawing assumption). The RS02
         turns continuously; the parts set the travel: abduction 56° (RS00 → head, with the
         chamfer), adduction 71° alone (knee RS02 → band). ±50° keeps 6° of margin. At the
         one-wheel stance the legs meet each other first unless the free leg swings forward. */
      rollStopDeg: 50,
      /* The one-wheel stand pose (2026-09-27, studies/one-wheel-capture.js): both hips balance
         (the free leg is a counter-pendulum), the free leg swung 45° forward by its hip swing so
         it clears the planted leg across the whole ±50°, its wheel lifted ~1". */
      stand: { bothHips: true, freeSwingDeg: -45, freeLiftIn: 1.0 },
      landing: "rear of the next slot; a forward landing error is the failure mode"
    },

    /* Sheet 2 — tubes, fittings, spring, hub, wire path (2026-09-27). Proposals drawn to the
       order-now parts (docs/bom.md): 16 × 14 mm carbon tube, 6 × 1.25 tire on a 3.75" bead. */
    sheet2: {
      tube: { odMm: 16, idMm: 14, eGPa: 100, densityGcc: 1.6, flexMPa: 500, socketMm: 40, source: "Windcatcher 16×14×1000 (bom.md)" },
      /* joint axis → tube end, per fitting: half the housing plus the fitting wall */
      reachMm: { hip: 35, knee: 45, axle: 30 },
      spring: { where: "extension spring along the upper link, cable over a pulley on the knee arm", pulleyIn: 1.25, sizedAt: "two-leg stance (92% and 75%)" },
      hub: { beadIn: 3.75, flushOutboard: true, webMm: 3, stator: "RS05 stator to the axle fitting, inboard; output flange outboard, disc web to the rim" },
      /* the band ends at the roll RS02 output-flange face (the yoke bolts to it; a longer band put its
         front corner in the RS00's path at 4.5° of roll — studies/roll-travel.js) and runs aft to the head's rear */
      band: { widthIn: 2 * (ROLL_AXIS_IN + ACT.envIn.rollD / 2), heightIn: ACT.envIn.rollD, lengthIn: 4.0 - (2.4 - ACT.envIn.rollL / 2), frontIn: -2.4 + ACT.envIn.rollL / 2 },
      wires: { rs05: 4, rs02: 4, bundleMm: 6, route: "inside the tubes; ports in every fitting; service loops at the knee and the hip" }
    },

    /* The reference machine — scale and packaging only, never the leg. */
    reference: {
      name: "AgileX T-REX 2.0", massKg: 5.8, wheelMm: 125, trackMm: 291,
      heightMm: [215, 363], strokeMm: 148, jumpMm: 100, obstacleMm: 50, poseMotorsPerLeg: 2
    }
  };

  /* Wheel actuator at a ground speed: output rpm, the fraction of the bus no-load speed it uses,
     and the torque still available on the linear torque-speed line the sandbox also uses
     (full peak at stall, nothing at no-load). Volts default to the nominal 8S bus. */
  function wheelAtSpeed(vMs, wheelOdIn, volts) {
    const R = (wheelOdIn / 2) * IN;
    const w = vMs / R;                                  /* rad/s at the output */
    const w0 = ACT.noLoadRadS(ACT.axes.wheel, volts);   /* rad/s no-load on the bus */
    const frac = w / w0;
    const availNm = Math.max(0, ACT.peak.wheel * (1 - frac));
    return { radS: w, rpm: w * 60 / (2 * Math.PI), noLoadRadS: w0, fraction: frac, availNm: availNm };
  }
  /* The speed at which `reserveNm` is what is left. */
  function speedWithReserve(reserveNm, wheelOdIn, volts) {
    const R = (wheelOdIn / 2) * IN;
    const w0 = ACT.noLoadRadS(ACT.axes.wheel, volts);
    return w0 * (1 - reserveNm / ACT.peak.wheel) * R;
  }
  /* The body lump's CoM, principal inertias (kg·m², about its own CoM; x fore-aft (roll),
     y vertical (yaw), z lateral (pitch)) and CoM uncertainty, summed from the body rows of the
     mass budget (actuators.js massParts). Shells are boxes, the pack a box, the rest points; the
     roll RS02s are boxes on their axes. `over` may override { pack: { fwdIn, upIn }, headFwdIn,
     kg: { id: grams } } to evaluate another placement or a part's low / high figure.
     Uncertainty: each part's mass as ±(hi − lo)/4 (the range ≈ ±2σ) and its position as ±sd
     inches, propagated to the lump CoM (σ in inches). */
  function bodyLump(over) {
    over = over || {};
    const L = spec.layout, pk = Object.assign({}, L.pack, over.pack || {});
    const head = over.headFwdIn !== undefined ? over.headFwdIn : L.headFwdIn;
    const pts = [];
    ACT.massParts.filter(p => p.link === "body").forEach(p => {
      const g = (over.kg && over.kg[p.id] !== undefined) ? over.kg[p.id] : p.g;
      let pos = p.pos ? Object.assign({}, p.pos) : { fwd: 0, up: 0, lat: 0 };
      let box = p.box || null;
      if (p.move === "pack") { pos = { fwd: pk.fwdIn + head, up: pk.upIn, lat: 0 }; box = { l: L.packIn.l, w: L.packIn.w, h: L.packIn.h }; }
      else if (p.move === "head") pos.fwd += head;
      if (p.id === "rollRS02") box = { l: ACT.envIn.rollL, w: ACT.envIn.rollD, h: ACT.envIn.rollD };
      const sides = p.mirror ? [1, -1] : [1];
      sides.forEach(sg => pts.push({ id: p.id, m: g / 1000, x: pos.fwd, y: pos.up, z: sg * (pos.lat || 0), box: box, sm: (p.hi - p.lo) / 4000, sd: p.sd || 0.3 }));
    });
    const M = pts.reduce((a, q) => a + q.m, 0);
    const c = { x: 0, y: 0, z: 0 };
    pts.forEach(q => { c.x += q.m * q.x / M; c.y += q.m * q.y / M; c.z += q.m * q.z / M; });
    let Ix = 0, Iy = 0, Iz = 0;
    const sq = v => (v * IN) ** 2;
    pts.forEach(q => {
      const dx = q.x - c.x, dy = q.y - c.y, dz = q.z - c.z;
      /* box l lateral, w fore-aft, h vertical */
      const b = q.box ? { x: q.m * (sq(q.box.l) + sq(q.box.h)) / 12, y: q.m * (sq(q.box.l) + sq(q.box.w)) / 12, z: q.m * (sq(q.box.w) + sq(q.box.h)) / 12 } : { x: 0, y: 0, z: 0 };
      Ix += b.x + q.m * (sq(dy) + sq(dz));
      Iy += b.y + q.m * (sq(dx) + sq(dz));
      Iz += b.z + q.m * (sq(dx) + sq(dy));
    });
    const sig = { x: 0, y: 0, z: 0 };
    pts.forEach(q => {
      ["x", "y", "z"].forEach(k => { sig[k] += (q.sm * (q[k] - c[k]) / M) ** 2 + (q.m * q.sd / M) ** 2; });
    });
    return { kg: M, fwdIn: c.x, upIn: c.y, latIn: c.z, Ix: Ix, Iy: Iy, Iz: Iz, pack: pk, headFwdIn: head,
      sigmaIn: { fwd: Math.sqrt(sig.x), up: Math.sqrt(sig.y), lat: Math.sqrt(sig.z) }, parts: pts };
  }
  spec.bodyLump = bodyLump;
  Object.defineProperty(spec.layout, "bodyComForwardIn", { enumerable: true, get: () => bodyLump().fwdIn });
  Object.defineProperty(spec.layout, "bodyComUpIn", { enumerable: true, get: () => bodyLump().upIn });

  spec.wheelAtSpeed = wheelAtSpeed;
  spec.speedWithReserve = speedWithReserve;

  if (typeof module !== "undefined" && module.exports) module.exports = spec;
  root.HuxSpec = spec;
})(typeof globalThis !== "undefined" ? globalThis : this);
