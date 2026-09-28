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
      massKg: 0.40,          /* 380 g (spec table) – 405 g (retailers, 405 ± 5); the budget uses 400 */
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

  /* Bottom-up mass budget (2026-09-27; replaces the 7.75 kg lump picture, which was the 6 kg
     picture of 2026-09-22 with the actuators swapped in). Every part: grams best / low / high,
     where it sits, and where the number comes from. Sources are the retailer / maker pages
     researched 2026-09-27 (docs/research/mass-budget.md); "est" rows are sized from the sheets
     (volume × density: 6061 2.70 g/cc; printed shells ~1.2, printed fittings ~0.75 effective).
     Nothing here is weighed yet — weigh each part as it arrives and replace its row.
     Links: body (rides with the trunk: head, band, and the roll RS02s, whose stators are in the
     band), hip (per side: the yoke and the hip-swing RS00, turning with the leg's roll), knee (per
     side, at the knee joint), wheel (per side, at the axle; `tread` rows are the tire + tube ring).
     Body positions are inches from the midpoint of the hip roll axes: fwd + ahead of the hip-swing
     axis, up + above it, lat + to the right. move: "pack" / "head" rows follow spec.js
     layout.pack / layout.headFwdIn; posIn is their position before that offset. `mirror` rows are
     one per side at ±lat. Tubes and leg wires are split half to each end's lump. */
  const G = (g, lo, hi) => ({ g: g, lo: lo, hi: hi });
  const massParts = [
    /* body */
    { id: "pack", name: "8S 3300 mAh 50–60C LiPo, XT90", link: "body", qty: 1, ...G(620, 550, 700), move: "pack", sd: 0.10, src: "GNB 8S 3300 549 g; Ovonic 8S 3500 688 g; 2× Zeee 4S 3300 696 g" },
    { id: "rollRS02", name: "RobStride 02, hip roll (stator in the band)", link: "body", qty: 2, mirror: true, ...G(400, 380, 410), pos: { fwd: -2.4, up: 0, lat: 3.0 }, sd: 0.05, src: "retailers 405 ± 5 g; spec table 380 g" },
    { id: "bandShell", name: "F7 hip-band shell, printed, 3 mm walls + roll-flange bosses", link: "body", qty: 1, ...G(300, 200, 420), pos: { fwd: -2.4, up: 0, lat: 0 }, box: { l: 9.1, w: 3.0, h: 3.1 }, sd: 0.25, src: "est: 9.1 × 3.1 × 3.0\" shell, ~215 cm³ × 1.2 + bosses" },
    { id: "headShell", name: "Head shell, printed, 2 mm walls, open bottom, ribs", link: "body", qty: 1, ...G(350, 250, 500), move: "head", pos: { fwd: 0, up: 4.0, lat: 0 }, box: { l: 7.0, w: 8.0, h: 4.45 }, sd: 0.3, src: "est: 8 × 7 × 4.45\" box, ~245 cm³ × 1.2 + 20 % ribs" },
    { id: "headHw", name: "Head inserts, fasteners, mounts, lid", link: "body", qty: 1, ...G(60, 35, 100), move: "head", pos: { fwd: 0, up: 3.5, lat: 0 }, sd: 0.5, src: "est" },
    { id: "rtStack", name: "Teensy 4.1 + ICM-42688-P + 3× CAN transceiver + carrier", link: "body", qty: 1, ...G(35, 25, 50), pos: { fwd: -2.4, up: 0.4, lat: 0 }, sd: 0.3, src: "Teensy 6–9 g, IMU ~2 g, SN65HVD230 3 g each; carrier est" },
    { id: "power", name: "5 V buck (≥36 V in), distribution + torque-cut board, fuse, XT90-S", link: "body", qty: 1, ...G(50, 35, 80), pos: { fwd: -2.4, up: -0.6, lat: 0 }, sd: 0.3, src: "Pololu D36V50F5 7 g; XT90-S pair 15 g; board est" },
    { id: "bodyHarness", name: "Body harness: 12 AWG pack leads, CAN + signal, connectors", link: "body", qty: 1, ...G(45, 30, 80), pos: { fwd: -1.0, up: 1.5, lat: 0 }, sd: 0.8, src: "12 AWG silicone 47 g/m × 0.6 m + signal + connectors" },
    { id: "companion", name: "Raspberry Pi 5 + Active Cooler + standoffs", link: "body", qty: 1, ...G(81, 70, 95), move: "head", pos: { fwd: 1.0, up: 2.4, lat: 0 }, sd: 0.3, src: "Pi 5 ~46 g, Active Cooler 25–29 g" },
    { id: "rx", name: "TBS Crossfire Nano RX + antenna", link: "body", qty: 1, ...G(2, 1, 3), move: "head", pos: { fwd: -2.0, up: 1.0, lat: 0 }, sd: 0.5, src: "0.5 g board, ~2 g with antenna" },
    { id: "display", name: "Front display, ~2\" IPS", link: "body", qty: 1, ...G(13.5, 9, 15), move: "head", pos: { fwd: 3.8, up: 4.0, lat: 0 }, sd: 0.2, src: "Adafruit 2.0\" 320×240 IPS 13.5 g" },
    { id: "stereo", name: "Front stereo pair (USB board) + lead", link: "body", qty: 1, ...G(25, 15, 45), move: "head", pos: { fwd: 3.9, up: 3.0, lat: 0 }, sd: 0.3, src: "ELP 960P2CAM class, est" },
    { id: "cams", name: "Cameras back / left / right / top / bottom (5, BOM later list)", link: "body", qty: 1, ...G(40, 25, 65), move: "head", pos: { fwd: -0.8, up: 2.8, lat: 0 }, sd: 0.8, src: "Pi Camera Module 3 class, 5 g + ribbon each" },
    { id: "eyes", name: "RGB eyes (2)", link: "body", qty: 1, ...G(2, 1, 5), move: "head", pos: { fwd: 3.9, up: 4.5, lat: 0 }, sd: 0.3, src: "WS2812 small boards" },
    /* hip, per side */
    { id: "swingRS00", name: "RobStride 00, hip swing, outboard of the leg plane", link: "hip", qty: 2, ...G(310, 300, 320), lat: 5.75, src: "310 ± 10 g (manual table)" },
    { id: "F1", name: "F1 hip yoke, milled 6061", link: "hip", qty: 2, ...G(70, 45, 110), lat: 3.9, src: "est: ~30 cm³ pocketed 6061" },
    { id: "F2", name: "F2 upper-tube hip fitting, printed + inserts", link: "hip", qty: 2, ...G(26, 18, 40), lat: 4.75, src: "est: ~30 cm³ × 0.75 + inserts" },
    { id: "hipHw", name: "Hip fasteners, pins", link: "hip", qty: 2, ...G(15, 8, 25), lat: 4.5, src: "est" },
    /* knee, per side */
    { id: "kneeRS02", name: "RobStride 02, knee", link: "knee", qty: 2, ...G(400, 380, 410), lat: 4.0, src: "retailers 405 ± 5 g; spec table 380 g" },
    { id: "F3", name: "F3 upper-tube knee fitting + RS02 stator mount, printed", link: "knee", qty: 2, ...G(43, 30, 60), lat: 4.4, src: "est: ~50 cm³ × 0.75 + inserts" },
    { id: "F4", name: "F4 knee output arm, printed (machine if it flexes)", link: "knee", qty: 2, ...G(45, 30, 70), lat: 4.4, src: "est: ~50 cm³ × 0.8 + inserts" },
    { id: "pulley", name: "Ø2.5\" knee pulley (printed) + cable + crimps", link: "knee", qty: 2, ...G(20, 13, 33), lat: 4.75, src: "est" },
    { id: "spring", name: "Knee extension spring ~1.8 kN/m (mass kept at the 3.0 kN/m estimate), 3.4\" travel (half at each end)", link: "hipknee", qty: 2, ...G(90, 60, 130), lat: 4.75, src: "est from spring design: music wire 2.5–3.0 mm, 16–20 mm coil" },
    { id: "upperTube", name: "Upper carbon tube 16 × 14, ~191 mm + leg wires inside", link: "hipknee", qty: 2, ...G(32, 26, 40), lat: 4.75, src: "Easy Composites 16/14 74.2 g/m; wires est 18 g" },
    { id: "lowerTube", name: "Lower carbon tube 16 × 14, ~196 mm + RS05 lead inside", link: "kneewheel", qty: 2, ...G(26.5, 21, 33), lat: 4.75, src: "74.2 g/m; wire est 12 g" },
    { id: "legHw", name: "Leg fasteners, cross pins, inserts", link: "knee", qty: 2, ...G(20, 10, 35), lat: 4.6, src: "est" },
    /* wheel, per side */
    { id: "wheelRS05", name: "RobStride 05, wheel", link: "wheel", qty: 2, ...G(191, 181, 201), lat: 6.64, src: "191 ± 10 g" },
    { id: "F5", name: "F5 axle fitting, milled 6061", link: "wheel", qty: 2, ...G(39, 28, 55), lat: 5.0, src: "est: ~18 cm³ pocketed 6061" },
    { id: "F6", name: "F6 rim + disc web, turned 6061", link: "wheel", qty: 2, ...G(89, 65, 120), lat: 6.375, src: "est: rim ~24 cm³ + lightened web ~9 cm³" },
    { id: "tire", name: "6×1.25 ribbed pneumatic tire", link: "tread", qty: 2, ...G(160, 110, 230), lat: 6.375, src: "est: listings give shipping weights (113–227 g)" },
    { id: "tube", name: "6×1.25 inner tube, bent Schrader", link: "tread", qty: 2, ...G(48, 35, 70), lat: 6.375, src: "est: ~34 cm³ butyl + stem" }
  ];
  function perSide(link, key) {
    let kg = 0;
    massParts.forEach(p => {
      const g = p[key || "g"] / 1000 * (p.mirror ? 1 : 1);
      const n = p.link === "body" ? 0 : 1;
      if (!n) return;
      if (p.link === link) kg += g;
      else if (p.link === "hipknee" && (link === "hip" || link === "knee")) kg += g / 2;
      else if (p.link === "kneewheel" && (link === "knee" || link === "wheel")) kg += g / 2;
      else if (p.link === "tread" && link === "wheel") kg += g;
    });
    return kg;
  }
  const bodyKg = key => massParts.filter(p => p.link === "body").reduce((s, p) => s + p[key || "g"] * p.qty / 1000, 0);
  /* Lumps the models read (kg). hips is both sides together (the kin.js convention). The sandbox
     and frontal.js give each tube a token 5 g rigid body; the real tube mass is in the lumps. */
  const lumps = {
    body: bodyKg(),
    hips: 2 * perSide("hip"),
    knee: perSide("knee"),
    wheel: perSide("wheel"),
    wheelTread: massParts.filter(p => p.link === "tread").reduce((s, p) => s + p.g / 1000, 0),
    tube: 0.005
  };
  lumps.total = lumps.body + lumps.hips + 2 * lumps.knee + 2 * lumps.wheel;
  /* Lateral centroid of each per-side lump, inches from the centreline (frontal.js uses these:
     the RS00 sits outboard of the leg plane, the knee RS02 inboard of it, the RS05 flush with
     the tire's outboard face). */
  function latOf(link) {
    let m = 0, mz = 0;
    massParts.forEach(p => {
      let w = 0;
      if (p.link === link) w = 1;
      else if (p.link === "hipknee" && (link === "hip" || link === "knee")) w = 0.5;
      else if (p.link === "kneewheel" && (link === "knee" || link === "wheel")) w = 0.5;
      else if (p.link === "tread" && link === "wheel") w = 1;
      if (w) { m += w * p.g; mz += w * p.g * p.lat; }
    });
    return mz / m;
  }
  lumps.latIn = { hip: latOf("hip"), knee: latOf("knee"), wheel: latOf("wheel") };
  /* The same budget at every part's low and high figure: the honest range until parts are weighed. */
  lumps.range = {
    lo: bodyKg("lo") + 2 * (perSide("hip", "lo") + perSide("knee", "lo") + perSide("wheel", "lo")),
    hi: bodyKg("hi") + 2 * (perSide("hip", "hi") + perSide("knee", "hi") + perSide("wheel", "hi"))
  };
  /* The retired picture, for the record: body 4.35, hips 1.50, knee 0.46, wheel 0.49 = 7.75 kg. */
  lumps.picture2026_09_26 = { body: 4.35, hips: 1.50, knee: 0.46, wheel: 0.49, total: 7.75 };

  const set = {
    lockedOn: "2026-09-26 (temporary decision lock; validate before buying one)",
    bus, parts, axes, lumps, massParts, noLoadRadS,
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
