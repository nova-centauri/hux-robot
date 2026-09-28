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
       on the sheet2.spring pulley (3.05 N·m/rad + 0.38 N·m at 7.75 kg). The old fixed
       "~2.2 N·m" was the 6 kg picture. */
    knee: { id: "R39", actuatorAt: "knee", spring: true, linkage: "V2", fiveBar: false },

    /* R40 — what V1 controls have to handle. Rough ground is V3 / Phase E. */
    terrain: { id: "R40", sillIn: 1.0, slopeDeg: 20, rough: "V3 / Phase E" },

    /* Layout numbers for Sheet 1 (2026-09-27). The roll-axis offset is the 2026-09-26 requirement
       (≤ 3" so the planted hip roll hold stays under the RS02's 7 rated: 6.3 N·m at 3.0" with
       Sheet 1's geometry, frontal.js; the 6.0 of 2026-09-26 predates it). The body CoM offset is the
       stair-dynamics finding that restores the throw window with the real leg masses. The leg
       plane is where the tubes run: outboard of the roll actuator's housing, inboard of the tire. */
    layout: {
      hipRollAxisIn: ROLL_AXIS_IN, /* lateral, from the body centreline, each side */
      legPlaneIn: 4.75,        /* lateral, the tube / joint plane, each side */
      hipBandWidthIn: 2 * (ROLL_AXIS_IN + ACT.envIn.rollD / 2), /* two RS02 roll housings */
      packIn: { l: 150 / 25.4, w: 60 / 25.4, h: 50 / 25.4 }, /* 8S 3300 mAh (~150 × 60 × 50 mm), docs/electronics.md, as it lies in the head: l lateral, w fore-aft, h vertical */
      /* The body lump (actuators.js lumps.body, 4.35 kg) split into the pack and everything else
         (head and band shells, electronics, harness, display, cameras). Positions are the part's
         centre from the midpoint of the hip roll axes: fwd + ahead, up + above. bodyRest is the lump
         picture as it stood before the pack was placed (the whole body at +1.0" / +2.7", with the
         pack at the hip axes) — a picture, not a weighed shell. The pack is placed on purpose
         (below). bodyComForwardIn / bodyComUpIn below are computed, never typed. */
      /* Steve 2026-09-27: no reaction wheel; move the battery up to an optimal position. The sweep
         (studies/pack-sweep.js) puts it at the top of the head, long axis lateral, 1" forward:
         the one-wheel capture region peaks with the pack 3.5–4.3" up (higher only grows the
         free-leg swing); height is neutral for the stair (need 0.79 → 0.80 kg·m²/s, window 0.15),
         but the same shove throws a higher body harder, so the shove re-times gentler (kin.js
         tPush); the throw window is widest with the body CoM at +1.0", which the pack at 1"
         forward keeps. 4.3" up leaves ~0.6" over the pack for the top wall and the balance lead;
         1" forward leaves ~1.8" of head in front of it for the display, eyes and stereo pair.
         The pack is 9 % of the mass: this buys about a third more capture region, not a static
         stand. Was in the hip band between the roll housings, at the roll-axis height (fwd 1.0, up 0.0). */
      pack: { kg: 0.70, fwdIn: 1.0, upIn: 4.3, where: "top of the head, long axis lateral, 1\" forward (2026-09-27)" },
      bodyRest: { fwdIn: 1.0, upIn: (ACT.lumps.body * 2.7 - 0.70 * 0.0) / (ACT.lumps.body - 0.70) },
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
      band: { widthIn: 2 * (ROLL_AXIS_IN + ACT.envIn.rollD / 2), heightIn: ACT.envIn.rollD, lengthIn: ACT.envIn.rollL + 1.2 },
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
  /* The body lump's CoM and principal inertias (kg·m², about its own CoM; x fore-aft (roll),
     y vertical (yaw), z lateral (pitch)) from the rest (a uniform box the size of the shell,
     8" × 7" × 7.55" from the band floor to the head top) plus the pack as a box at its position.
     Pass a pack override { fwdIn, upIn } to evaluate another placement. */
  function bodyLump(packOverride) {
    const L = spec.layout, pk = Object.assign({}, L.pack, packOverride || {});
    const mB = ACT.lumps.body, mP = pk.kg, mR = mB - mP;
    const fwd = (mR * L.bodyRest.fwdIn + mP * pk.fwdIn) / mB;
    const up = (mR * L.bodyRest.upIn + mP * pk.upIn) / mB;
    const box = (m, a, b) => m * ((a * IN) ** 2 + (b * IN) ** 2) / 12;
    const len = 8, wid = 7, ht = 7.55, D = L.packIn;
    const dR = { x: (L.bodyRest.fwdIn - fwd) * IN, y: (L.bodyRest.upIn - up) * IN };
    const dP = { x: (pk.fwdIn - fwd) * IN, y: (pk.upIn - up) * IN };
    const Ix = box(mR, wid, ht) + mR * dR.y ** 2 + box(mP, D.l, D.h) + mP * dP.y ** 2;
    const Iz = box(mR, len, ht) + mR * (dR.x ** 2 + dR.y ** 2) + box(mP, D.w, D.h) + mP * (dP.x ** 2 + dP.y ** 2);
    const Iy = box(mR, len, wid) + mR * dR.x ** 2 + box(mP, D.l, D.w) + mP * dP.x ** 2;
    return { kg: mB, fwdIn: fwd, upIn: up, Ix: Ix, Iy: Iy, Iz: Iz, pack: pk };
  }
  spec.bodyLump = bodyLump;
  Object.defineProperty(spec.layout, "bodyComForwardIn", { enumerable: true, get: () => bodyLump().fwdIn });
  Object.defineProperty(spec.layout, "bodyComUpIn", { enumerable: true, get: () => bodyLump().upIn });

  spec.wheelAtSpeed = wheelAtSpeed;
  spec.speedWithReserve = speedWithReserve;

  if (typeof module !== "undefined" && module.exports) module.exports = spec;
  root.HuxSpec = spec;
})(typeof globalThis !== "undefined" ? globalThis : this);
