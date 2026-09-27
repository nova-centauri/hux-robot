/* Hux V1 spec — the decisions of 2026-09-27 as numbers (docs/decisions.md, docs/requirements.md
   R37–R40), plus the layout numbers the first 2D sheet is drawn to. One table, read by kin.js
   (hip roll axis, body CoM offset, leg plane), sheet.js (the drawing and its title block),
   sim.html / sim-view.js (top-speed default and cap) and validation-test.js (wheel torque
   margin at the top speed). Change a decision here and the pages follow. Inches for geometry,
   SI for speeds and torques. */
(function (root) {
  "use strict";
  const ACT = root.HuxActuators || require("./actuators.js");
  const IN = 0.0254;

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

    /* R39 — the knee. RS02 at the knee joint for V1, gravity spring in scope (~2.2 N·m at the
       two-leg stance), the hip-driven linkage parked as a V2 refinement, no five-bar leg
       (docs/research/knee-linkage.md, tools/living-drawings/studies/fivebar-check.py). */
    knee: { id: "R39", actuatorAt: "knee", spring: true, springNm: 2.2, linkage: "V2", fiveBar: false },

    /* R40 — what V1 controls have to handle. Rough ground is V3 / Phase E. */
    terrain: { id: "R40", sillIn: 1.0, slopeDeg: 20, rough: "V3 / Phase E" },

    /* Layout numbers for Sheet 1 (2026-09-27). The roll-axis offset is the 2026-09-26 requirement
       (planted hip roll hold 6.0 N·m at 3.0" vs RS02 rated 7). The body CoM offset is the
       stair-dynamics finding that restores the throw window with the real leg masses. The leg
       plane is where the tubes run: outboard of the roll actuator's housing, inboard of the tire. */
    layout: {
      hipRollAxisIn: 3.0,      /* lateral, from the body centreline, each side */
      legPlaneIn: 4.75,        /* lateral, the tube / joint plane, each side */
      bodyComForwardIn: 1.0,   /* body lump ahead of the hip roll axes */
      hipBandWidthIn: 2 * (3.0 + ACT.envIn.rollD / 2), /* two RS02 roll housings flanking the pack */
      packIn: { l: 150 / 25.4, w: 50 / 25.4, h: 60 / 25.4 }, /* 8S 3300 mAh, docs/electronics.md */
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
      band: { widthIn: 2 * (3.0 + ACT.envIn.rollD / 2), heightIn: ACT.envIn.rollD, lengthIn: ACT.envIn.rollL + 1.2 },
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
  spec.wheelAtSpeed = wheelAtSpeed;
  spec.speedWithReserve = speedWithReserve;

  if (typeof module !== "undefined" && module.exports) module.exports = spec;
  root.HuxSpec = spec;
})(typeof globalThis !== "undefined" ? globalThis : this);
