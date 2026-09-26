/* Hux actuator set — the temporary decision lock of 2026-09-26 (docs/decisions.md).
   One table, read by spatial.js (torque limits), kin.js (lumps, motor envelopes), sim-core.js
   (torque caps, torque-speed lines, masses) and frontal.js (lumps). Change the set here and
   every model follows. Vendor numbers are from the RobStride spec tables and US retailer pages
   on 2026-09-26; nothing here is measured on a bench yet. SI unless the key says otherwise. */
(function (root) {
  "use strict";
  const IN = 0.0254;

  /* Bus: one 8S LiPo. Speeds below are the vendor no-load figures at their 48 V rating,
     scaled linearly to the bus. */
  const bus = { cells: 8, vFull: 33.6, vNominal: 29.6, vCutoff: 26.4, vRated: 48 };

  const parts = {
    rs02: {
      name: "RobStride 02", role: "knee, hip roll",
      massKg: 0.39,          /* 380 g (spec table) – 405 g (retailer); the mean */
      ratedNm: 7, peakNm: 17,  /* spec table; one retailer lists 6 rated — margins below use 7 */
      ratio: 7.75, noLoadRpmAt48V: 410,
      vMin: 24, vMax: 60, encoders: 2,
      env: { w: 78.5e-3, h: 78.5e-3, t: 45.5e-3 }, /* square housing, axial length */
      usd: 145
    },
    rs00: {
      name: "RobStride 00", role: "hip swing",
      massKg: 0.31, ratedNm: 5, peakNm: 14, ratio: 10, noLoadRpmAt48V: 315,
      vMin: 24, vMax: 60, encoders: 2,
      env: { w: 57e-3, h: 57e-3, t: 51e-3 },
      usd: 160
    },
    rs05: {
      name: "RobStride 05", role: "wheel",
      massKg: 0.191, ratedNm: 1.7, peakNm: 5.5, ratio: 7.75, noLoadRpmAt48V: 480,
      vMin: 15, vMax: 60, encoders: 2,
      env: { w: 46e-3, h: 46e-3, t: 44e-3 },
      usd: 110
    }
  };

  /* Which part sits on which axis. */
  const axes = { knee: parts.rs02, roll: parts.rs02, hip: parts.rs00, wheel: parts.rs05 };

  function noLoadRadS(part, volts) {
    return part.noLoadRpmAt48V * ((volts || bus.vNominal) / bus.vRated) * 2 * Math.PI / 60;
  }
  /* Vendor no-load speeds are at the output. Reflected rotor inertia is not published; left out. */

  /* Lumped masses for the 2D picture, kilograms. The 2026-09-22 picture was body 4.0 (4S pack),
     both hip actuators 0.8, each knee 0.25, each wheel 0.35 = 6.0 kg. With the locked set:
       body  4.35  = the old 4.0 + 0.35 for the 8S 3300 pack over a 4S pack (~0.7 kg total pack)
       hips  2 × (roll RS02 + swing RS00 + 0.05 yoke)      = 1.50
       knee  RS02 + 0.07 fitting                           = 0.46 each
       wheel RS05 + 0.30 tire/tube/rim/hub/bearings        = 0.49 each   (tread ring 0.20, hub 0.29)
     Total 7.75 kg, plus the sandbox's tubes. Still a picture, not a weighed robot. */
  const lumps = {
    body: 4.35,
    hips: 2 * (parts.rs02.massKg + parts.rs00.massKg + 0.05),
    knee: parts.rs02.massKg + 0.07,
    wheel: parts.rs05.massKg + 0.30,
    wheelTread: 0.20
  };
  lumps.total = lumps.body + lumps.hips + 2 * lumps.knee + 2 * lumps.wheel;

  const set = {
    lockedOn: "2026-09-26 (temporary decision lock; validate before buying one)",
    bus, parts, axes, lumps, noLoadRadS,
    peak: { wheel: axes.wheel.peakNm, knee: axes.knee.peakNm, hip: axes.hip.peakNm, roll: axes.roll.peakNm },
    rated: { wheel: axes.wheel.ratedNm, knee: axes.knee.ratedNm, hip: axes.hip.ratedNm, roll: axes.roll.ratedNm },
    noLoad: {
      wheel: noLoadRadS(axes.wheel), knee: noLoadRadS(axes.knee), hip: noLoadRadS(axes.hip), roll: noLoadRadS(axes.roll)
    },
    /* inches, for the drawings' bulk */
    envIn: {
      knee: { w: axes.knee.env.w / IN, h: axes.knee.env.h / IN, t: axes.knee.env.t / IN },
      swing: { w: axes.hip.env.w / IN, h: axes.hip.env.h / IN, t: axes.hip.env.t / IN },
      rollD: axes.roll.env.w / IN, rollL: axes.roll.env.t / IN,
      wheelD: axes.wheel.env.w / IN, wheelW: axes.wheel.env.t / IN
    },
    count: 8,
    massKg: 4 * parts.rs02.massKg + 2 * parts.rs00.massKg + 2 * parts.rs05.massKg,
    usd: 4 * parts.rs02.usd + 2 * parts.rs00.usd + 2 * parts.rs05.usd
  };

  if (typeof module !== "undefined" && module.exports) module.exports = set;
  root.HuxActuators = set;
})(typeof globalThis !== "undefined" ? globalThis : this);
