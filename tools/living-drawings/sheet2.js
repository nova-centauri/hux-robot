/* Sheet 2 — tubes, fittings, spring, hub, wire path. Drawn from kin.js (poses, torques),
   actuators.js (housings), spec.js (Sheet 1 layout + the Sheet 2 proposals) and sheet-draw.js.
   Everything numeric is computed here; nothing is typed in from another sheet. Inches; mm where
   a part is bought in mm. */
(function () {
  "use strict";
  const K = window.HuxKin, M = K.M, SPEC = window.HuxSpec, ACT = window.HuxActuators;
  const D = window.HuxDraw;
  const { el, frame, line, rect, box, tube, circle, joint, cross, text, note, dimH, dimV, ext, centreline, motor, leg, fill, fmt, inch, nm } = D;
  const IN = 0.0254, MM = 1 / 25.4;
  const L1 = SPEC.layout, S2 = SPEC.sheet2, ENV = ACT.envIn;

  /* ---------- tubes: section, cuts, stress, first mode ---------- */
  const T = S2.tube;
  const I = Math.PI * (Math.pow(T.odMm, 4) - Math.pow(T.idMm, 4)) / 64;      /* mm^4 */
  const Zs = I / (T.odMm / 2);                                                /* mm^3 */
  const J = 2 * I;
  const area = Math.PI * (Math.pow(T.odMm / 2, 2) - Math.pow(T.idMm / 2, 2)); /* mm^2 */
  const gPerMm = area * T.densityGcc / 1000;                                   /* g per mm */
  const linkMm = M.link * 25.4;
  const cuts = {
    upper: { exposed: linkMm - S2.reachMm.hip - S2.reachMm.knee, cut: linkMm - S2.reachMm.hip - S2.reachMm.knee + 2 * T.socketMm },
    lower: { exposed: linkMm - S2.reachMm.knee - S2.reachMm.axle, cut: linkMm - S2.reachMm.knee - S2.reachMm.axle + 2 * T.socketMm }
  };
  const W = M.exampleMassKg * M.g;
  function hold(theta, phi, share) { return K.legTorques(theta, phi, { x: 0, y: W * (share || 1) }, { x: 0, y: 0 }, 0); }
  const standIk = K.ik(1.0, -9.0);
  const kneeStand = Math.abs(hold(standIk.theta, standIk.phi).knee);
  const sigmaStand = kneeStand * 1000 / Zs, sigmaPeak = ACT.peak.knee * 1000 / Zs;     /* MPa */
  const spacerMm = (M.track / 2 - L1.legPlaneIn) * 25.4;
  const offsetBend = W * spacerMm / 1000;                                               /* N·m, the one-leg vertical load on the hub offset */
  const torsion = (ACT.peak.wheel / (M.wheelR * IN)) * spacerMm / 1000;                 /* N·m, peak drive force on the offset */
  const tauTorsion = torsion * 1000 * (T.odMm / 2) / J;
  const mEnd = M.mass.wheel;                                                             /* kg at the end of the lower tube */
  const kCant = 3 * T.eGPa * 1e9 * I * 1e-12 / Math.pow(cuts.lower.exposed / 1000, 3); /* N/m */
  const fCant = Math.sqrt(kCant / mEnd) / (2 * Math.PI);
  const kCantFull = 3 * T.eGPa * 1e9 * I * 1e-12 / Math.pow(M.link * IN, 3);
  const fCantFull = Math.sqrt(kCantFull / mEnd) / (2 * Math.PI);

  /* ---------- the knee spring: an extension spring along the upper link, a cable over a pulley
     on the knee arm. A two-anchor spring across the joint cannot stay on the outside of a bend
     past ~2·atan(offset/anchor) of fold (its line crosses the knee axis and the torque reverses),
     so the tendon wraps a pulley: torque = F · Rp, cable pay-out = Rp · φ, and with a linear
     spring the torque is linear in the bend. Fitted to the two-leg gravity torque at the 92% and
     75% stances. Zero preload would leave the straight leg free; the fit decides. ---------- */
  const Rp = S2.spring.pulleyIn;                                            /* in */
  const a = 1.5; /* drawing only: where the knee detail cuts its links */
  const RpM = Rp * IN;
  const two92 = Math.abs(hold(M.balanceTheta, M.balancePhi, 0.5).knee);
  const two75 = Math.abs(hold(M.deepTheta, M.deepPhi, 0.5).knee);
  const phi92 = M.balancePhi * Math.PI / 180, phi75 = M.deepPhi * Math.PI / 180;
  const kEff = (two75 - two92) / (phi75 - phi92);                           /* N·m per rad of bend */
  const T0 = Math.max(0, two92 - kEff * phi92);                              /* preload torque at the straight leg */
  const kSpring = kEff / (RpM * RpM);                                        /* N/m */
  const preloadN = T0 / RpM;
  const springTorque = phiDeg => kEff * phiDeg * Math.PI / 180 + T0;
  const springForce = phiDeg => kSpring * RpM * phiDeg * Math.PI / 180 + preloadN;
  const phiStop = K.deg(K.spatial.limits.knee[1]);
  const travelIn = Rp * K.spatial.limits.knee[1];
  const poses = [
    { n: "straight", th: 0, ph: 0 },
    { n: "92% stance", th: M.balanceTheta, ph: M.balancePhi },
    { n: "75% crouch", th: M.deepTheta, ph: M.deepPhi },
    { n: "raised (swing leg)", th: K.ik(9.5 - 0.75, -4.3).theta, ph: K.ik(9.5 - 0.75, -4.3).phi, swing: true },
    { n: "stand-up on the shelf", th: standIk.theta, ph: standIk.phi },
    { n: "shove (rear leg)", th: K.ik(-7, -13).theta, ph: K.ik(-7, -13).phi }
  ].map(q => {
    const spring = springTorque(q.ph);
    const grav1 = Math.abs(hold(q.th, q.ph).knee), grav2 = Math.abs(hold(q.th, q.ph, 0.5).knee);
    /* the swing leg carries no ground load: the spring is what the motor holds against */
    const motorOne = q.swing ? spring : Math.max(0, grav1 - spring);
    return { ...q, spring, grav1, grav2, motorOne, force: springForce(q.ph) };
  });

  /* ---------- hub stack (inches, lateral z) ---------- */
  const H = {
    leg: L1.legPlaneIn, tubeIn: L1.legPlaneIn - T.odMm * MM / 2, tubeOut: L1.legPlaneIn + T.odMm * MM / 2,
    axle: M.track / 2, tireIn: M.track / 2 - M.wheelWidth / 2, tireOut: M.track / 2 + M.wheelWidth / 2,
    rs05Out: M.track / 2 + M.wheelWidth / 2, rs05In: M.track / 2 + M.wheelWidth / 2 - ENV.wheelW,
    bead: S2.hub.beadIn, env: M.envelopeWidth / 2
  };
  H.mount = H.rs05In;               /* the stator mounts to the axle fitting on its inboard face */
  H.fitClear = H.mount - H.tubeOut; /* room between the tube's outer wall and the stator face */
  const rs05Diag = Math.hypot(ENV.wheelD, ENV.wheelD);
  const radialStatic = W / 2, radialOne = W, radialLand = 3 * W;

  /* ---------- 1. leg assembly with the wire path ---------- */
  function drawLeg() {
    const svg = document.getElementById("t1");
    D.setFS(1);
    const F = frame(svg, -9, 9, -1, 19.5);
    const p = K.planted(M.balanceTheta, M.balancePhi);
    const hip = p.hip, knee = p.knee, axle = p.axle;
    const R = M.wheelR;
    /* ground and wheel */
    line(svg, F.X(-9), F.Y(0), F.X(9), F.Y(0), "#8d8374", 1.5);
    circle(svg, F.X(axle.x), F.Y(axle.y), R * D.S, "#f4f1ea", "#22282f", 3);
    /* the tubes: exposed length only, fittings as blocks at each end */
    function seg(A, B, t0, t1) { /* point along A→B at inches t from A */
      const d = Math.hypot(B.x - A.x, B.y - A.y), ux = (B.x - A.x) / d, uy = (B.y - A.y) / d;
      return [{ x: A.x + ux * t0, y: A.y + uy * t0 }, { x: A.x + ux * t1, y: A.y + uy * t1 }];
    }
    const upperT = seg(hip, knee, S2.reachMm.hip * MM, M.link - S2.reachMm.knee * MM);
    const lowerT = seg(knee, axle, S2.reachMm.knee * MM, M.link - S2.reachMm.axle * MM);
    /* fittings: hip end, knee upper, knee arm, axle */
    function fitting(A, B, t0, t1, w, label) {
      const [a0, a1] = seg(A, B, t0, t1);
      const ang = Math.atan2(a1.y - a0.y, a1.x - a0.x) * 180 / Math.PI;
      const cx = (a0.x + a1.x) / 2, cy = (a0.y + a1.y) / 2, len = Math.hypot(a1.x - a0.x, a1.y - a0.y);
      const g = el("g", { transform: `translate(${F.X(cx)} ${F.Y(cy)}) rotate(${-ang})` });
      g.appendChild(el("rect", { x: -len / 2 * D.S, y: -w / 2 * D.S, width: len * D.S, height: w * D.S, fill: "#c9c3b4", stroke: "#1b2430", "stroke-width": 1.2, rx: 2 }));
      svg.appendChild(g);
      if (label) text(svg, F.X(cx), F.Y(cy) + 4, label, "middle", 9.5, "#1b2430");
    }
    /* sockets overlap the tube ends: draw the tube first, fittings over its ends */
    tube(svg, F.X(upperT[0].x), F.Y(upperT[0].y), F.X(upperT[1].x), F.Y(upperT[1].y), "#1f4e79", T.odMm * MM * D.S);
    tube(svg, F.X(lowerT[0].x), F.Y(lowerT[0].y), F.X(lowerT[1].x), F.Y(lowerT[1].y), "#1f4e79", T.odMm * MM * D.S);
    /* sockets (hatched look: a lighter overlay) */
    const sk = T.socketMm * MM;
    fitting(hip, knee, S2.reachMm.hip * MM - 0.2, S2.reachMm.hip * MM + sk, 1.0, "F2");
    fitting(hip, knee, M.link - S2.reachMm.knee * MM - sk, M.link - S2.reachMm.knee * MM + 0.2, 1.0, "F3");
    fitting(knee, axle, S2.reachMm.knee * MM - 0.2, S2.reachMm.knee * MM + sk, 1.0, "F4");
    fitting(knee, axle, M.link - S2.reachMm.axle * MM - sk, M.link - S2.reachMm.axle * MM + 0.2, 1.0, "F5");
    /* motors */
    motor(svg, F, knee.x, knee.y, ENV.knee.w, ENV.knee.h, "RS02");
    motor(svg, F, hip.x, hip.y, ENV.swing.w, ENV.swing.h, "RS00");
    box(svg, F, axle.x, axle.y, ENV.wheelD, ENV.wheelD, "#3e4c44", "#1b2430");
    text(svg, F.X(axle.x), F.Y(axle.y) + 4, "RS05", "middle", 9, "#fbf8f1");
    /* yoke stub toward the body */
    rect(svg, F.X(hip.x - 3.4), F.Y(hip.y + 0.5), 2.0 * D.S, 1.0 * D.S, "#c9c3b4", "#1b2430");
    text(svg, F.X(hip.x - 2.4), F.Y(hip.y) + 4, "F1 yoke", "middle", 9.5);
    /* the knee spring: a pulley on the knee arm (outboard of the housing face), a cable leaving it
       at the rear tangent, running up the rear of the upper tube to an extension spring on F2 */
    circle(svg, F.X(knee.x), F.Y(knee.y), Rp * D.S, "none", "#8a5a12", 1.6);
    const ux = (hip.x - knee.x) / M.link, uy = (hip.y - knee.y) / M.link;      /* up the upper link */
    let rx = -uy, ry = ux; if ((knee.x - 3 - knee.x) * rx + 0 * ry < 0) { rx = -rx; ry = -ry; }      /* rear normal */
    const tang = { x: knee.x + rx * Rp, y: knee.y + ry * Rp };
    const sprA = { x: tang.x + ux * 2.2, y: tang.y + uy * 2.2 }, sprB = { x: tang.x + ux * 5.2, y: tang.y + uy * 5.2 };
    line(svg, F.X(tang.x), F.Y(tang.y), F.X(sprA.x), F.Y(sprA.y), "#8a5a12", 1.4);
    const n = 9, dx = (sprB.x - sprA.x) / n, dy = (sprB.y - sprA.y) / n, pxx = -dy, pyy = dx, pl = Math.hypot(pxx, pyy) || 1;
    let path = `M ${F.X(sprA.x)} ${F.Y(sprA.y)}`;
    for (let i = 1; i < n; i++) { const sgn = i % 2 ? 1 : -1; path += ` L ${F.X(sprA.x + dx * i + sgn * 0.16 * pxx / pl)} ${F.Y(sprA.y + dy * i + sgn * 0.16 * pyy / pl)}`; }
    path += ` L ${F.X(sprB.x)} ${F.Y(sprB.y)}`;
    svg.appendChild(el("path", { d: path, fill: "none", stroke: "#8a5a12", "stroke-width": 1.6 }));
    circle(svg, F.X(sprB.x), F.Y(sprB.y), 3, "#8a5a12", "#8a5a12"); circle(svg, F.X(tang.x), F.Y(tang.y), 2.5, "#8a5a12", "#8a5a12");
    note(svg, F.X(sprA.x) - 8, F.Y(sprA.y) + 14, "knee spring + cable", "#8a5a12");
    note(svg, F.X(knee.x) - Rp * D.S - 6, F.Y(knee.y) + 22, "pulley Ø" + inch(2 * Rp), "#8a5a12");
    /* wire path: inside the tubes, ports at the fittings, service loops at the joints */
    const wp = `M ${F.X(axle.x + 0.3)} ${F.Y(axle.y + 0.6)} L ${F.X(lowerT[1].x)} ${F.Y(lowerT[1].y)} L ${F.X(lowerT[0].x)} ${F.Y(lowerT[0].y)} Q ${F.X(knee.x + 1.4)} ${F.Y(knee.y - 1.0)} ${F.X(knee.x + 1.6)} ${F.Y(knee.y + 0.4)} Q ${F.X(knee.x + 1.4)} ${F.Y(knee.y + 1.4)} ${F.X(upperT[1].x)} ${F.Y(upperT[1].y)} L ${F.X(upperT[0].x)} ${F.Y(upperT[0].y)} Q ${F.X(hip.x + 1.4)} ${F.Y(hip.y - 0.6)} ${F.X(hip.x - 2.6)} ${F.Y(hip.y + 0.2)}`;
    svg.appendChild(el("path", { d: wp, fill: "none", stroke: "#d0342c", "stroke-width": 1.6, "stroke-dasharray": "5 3" }));
    note(svg, F.X(knee.x + 1.9), F.Y(knee.y + 0.9), "port + service loop", "#d0342c");
    note(svg, F.X(hip.x + 1.6), F.Y(hip.y - 0.9), "port + loop", "#d0342c");
    note(svg, F.X(axle.x + 0.6), F.Y(axle.y + 1.4), "RS05 lead in", "#d0342c");
    joint(svg, F.X(hip.x), F.Y(hip.y)); joint(svg, F.X(knee.x), F.Y(knee.y));
    /* dimensions */
    const mid = (A, B) => ({ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
    const mu = mid(upperT[0], upperT[1]), ml = mid(lowerT[0], lowerT[1]);
    note(svg, F.X(mu.x) + 14, F.Y(mu.y) + 4, "upper: " + fmt(cuts.upper.exposed, 0) + " mm exposed, cut " + fmt(cuts.upper.cut, 0) + " mm");
    note(svg, F.X(ml.x) + 14, F.Y(ml.y) + 4, "lower: " + fmt(cuts.lower.exposed, 0) + " mm exposed, cut " + fmt(cuts.lower.cut, 0) + " mm");
    note(svg, F.X(-8.8), F.Y(18.6), T.odMm + " × " + T.idMm + " mm carbon tube, " + T.socketMm + " mm sockets, bonded + cross-pinned");
    note(svg, F.X(-8.8), F.Y(17.8), "fittings F1–F5: joint axis → tube end " + S2.reachMm.hip + " / " + S2.reachMm.knee + " / " + S2.reachMm.axle + " mm");
    dimV(svg, F.X(5.2), F.Y(axle.y), F.Y(hip.y), inch(hip.y - axle.y) + " hip–axle");
    ext(svg, F.X(hip.x), F.Y(hip.y), F.X(5.2), F.Y(hip.y)); ext(svg, F.X(axle.x), F.Y(axle.y), F.X(5.2), F.Y(axle.y));
    text(svg, F.X(-8.8), F.Y(-0.7), "LEG — tubes, fittings, spring, wire path (92% stance)", "start", 12);
    fill("u1", [
      ["Tube", T.odMm + " × " + T.idMm + " mm carbon (" + T.source + "): I " + fmt(I, 0) + " mm⁴, Z " + fmt(Zs, 0) + " mm³, " + fmt(gPerMm * 1000, 0) + " g/m", ""],
      ["Cuts", "upper " + fmt(cuts.upper.cut, 0) + " mm, lower " + fmt(cuts.lower.cut, 0) + " mm, ×2 each = " + fmt(2 * (cuts.upper.cut + cuts.lower.cut) / 1000, 2) + " m of the 2 m on order", "good"],
      ["Bending at the knee", nm(kneeStand) + " stand-up hold → " + fmt(sigmaStand, 0) + " MPa; " + nm(ACT.peak.knee) + " peak → " + fmt(sigmaPeak, 0) + " MPa vs ~" + T.flexMPa + " MPa flexural (assumed) — the bonded socket, not the tube, is the limit", sigmaPeak < T.flexMPa / 2 ? "good" : "bad"],
      ["Hub offset loads", "one-leg vertical load on the " + fmt(spacerMm, 0) + " mm offset: " + nm(offsetBend) + " bending (×3 on a landing); peak drive force: " + nm(torsion) + " torsion → " + fmt(tauTorsion, 0) + " MPa", ""],
      ["First mode, wheel on the lower tube", fmt(fCant, 0) + " Hz at the " + fmt(cuts.lower.exposed, 0) + " mm exposed length (E " + T.eGPa + " GPa, " + fmt(mEnd, 2) + " kg); " + fmt(fCantFull, 0) + " Hz if the whole 7.5\" were tube. Fittings and bonds will lower it.", ""],
      ["Wires", S2.wires.rs05 + " conductors from the RS05 + " + S2.wires.rs02 + " from the knee RS02 up the upper tube (~" + S2.wires.bundleMm + " mm bundle in a " + T.idMm + " mm bore); " + S2.wires.route, "good"]
    ]);
  }

  /* ---------- 2. knee detail + spring curve ---------- */
  function drawKnee() {
    const svg = document.getElementById("t2");
    D.setFS(0.62);
    const F = frame(svg, -6.5, 6.5, -4.6, 5.6);
    /* knee at the origin in its own frame: upper link straight up, lower link folded by phi to the front */
    const phi = M.balancePhi;
    const up = { x: 0, y: a + 3.2 }, lo = { x: Math.sin(phi * Math.PI / 180) * (a + 2.4), y: -Math.cos(phi * Math.PI / 180) * (a + 2.4) };
    tube(svg, F.X(0), F.Y(0), F.X(up.x), F.Y(up.y), "#1f4e79", T.odMm * MM * D.S);
    tube(svg, F.X(0), F.Y(0), F.X(lo.x), F.Y(lo.y), "#1f4e79", T.odMm * MM * D.S);
    motor(svg, F, 0, 0, ENV.knee.w, ENV.knee.h, "RS02 " + fmt(ENV.knee.w) + "\" sq");
    joint(svg, F.X(0), F.Y(0));
    /* pulley on the knee arm, cable off its rear tangent up the upper link to the spring */
    circle(svg, F.X(0), F.Y(0), Rp * D.S, "none", "#8a5a12", 2);
    line(svg, F.X(-Rp), F.Y(0), F.X(-Rp), F.Y(a + 3.2), "#8a5a12", 1.6);
    const zz = 8, y0z = 1.4, y1z = a + 2.8; let pz = `M ${F.X(-Rp)} ${F.Y(y0z)}`;
    for (let i = 1; i < zz; i++) { const sgn = i % 2 ? 1 : -1; pz += ` L ${F.X(-Rp + sgn * 0.18)} ${F.Y(y0z + (y1z - y0z) * i / zz)}`; }
    pz += ` L ${F.X(-Rp)} ${F.Y(y1z)}`;
    svg.appendChild(el("path", { d: pz, fill: "none", stroke: "#8a5a12", "stroke-width": 1.8 }));
    circle(svg, F.X(-Rp), F.Y(0), 3, "#8a5a12", "#8a5a12");
    line(svg, F.X(0), F.Y(0), F.X(-Rp), F.Y(0), "#8a5a12", 0.8, "3 3");
    note(svg, F.X(-5.8), F.Y(-2.4), "pulley Rp " + inch(Rp) + " on the knee arm;", "#8a5a12");
    note(svg, F.X(-5.8), F.Y(-3.0), "the cable pays out Rp · φ", "#8a5a12");
    note(svg, F.X(-5.8), F.Y(-3.6), "spring on F2 / F3, rear of the upper tube", "#8a5a12");
    text(svg, F.X(-6.3), F.Y(5.1), "KNEE — 92% stance, bend " + fmt(phi, 0) + "°, rear to the left", "start", 12);
    /* the torque curves get their own strip below the sketch */
    const svg2 = document.getElementById("t2b");
    D.setFS(0.85);
    const G = frame(svg2, 0, 26, 0, 9.5);
    const cx0 = 1.6, cy0 = 1.3, cw = 16.5, ch = 7.4, maxT = 14, maxPhi = 150;
    rect(svg2, G.X(cx0), G.Y(cy0 + ch), cw * D.S, ch * D.S, "#fffdf8", "#c8bfae");
    const cx = v => cx0 + cw * v / maxPhi, cy = v => cy0 + ch * v / maxT;
    for (let t = 0; t <= maxT; t += 2) { line(svg2, G.X(cx0), G.Y(cy(t)), G.X(cx0 + cw), G.Y(cy(t)), "#eee8dc", 0.8); note(svg2, G.X(cx0) - 16, G.Y(cy(t)) + 3, String(t)); }
    for (let d = 0; d <= maxPhi; d += 30) { line(svg2, G.X(cx(d)), G.Y(cy0), G.X(cx(d)), G.Y(cy0 + ch), "#eee8dc", 0.8); note(svg2, G.X(cx(d)) - 8, G.Y(cy0) + 13, d + "°"); }
    function curve(fn, color, w, dash) {
      let dd = "";
      for (let d = 0; d <= maxPhi; d += 2) { const v = Math.min(maxT, fn(d)); dd += (dd ? " L " : "M ") + G.X(cx(d)) + " " + G.Y(cy(v)); }
      const at = { d: dd, fill: "none", stroke: color, "stroke-width": w };
      if (dash) at["stroke-dasharray"] = dash;
      svg2.appendChild(el("path", at));
    }
    /* gravity torque at the knee for a symmetric stance with knee bend d: theta = d/2, one leg and two */
    curve(d => Math.abs(hold(d / 2, d, 0.5).knee), "#5e6a78", 1.6, "5 3");
    curve(d => Math.abs(hold(d / 2, d).knee), "#1b2430", 1.6);
    curve(d => springTorque(d), "#8a5a12", 2.2);
    curve(d => Math.max(0, Math.abs(hold(d / 2, d).knee) - springTorque(d)), "#1d6b45", 2.2);
    line(svg2, G.X(cx0), G.Y(cy(ACT.rated.knee)), G.X(cx0 + cw), G.Y(cy(ACT.rated.knee)), "#9d2c2c", 1, "2 3");
    note(svg2, G.X(cx0 + cw) - 70, G.Y(cy(ACT.rated.knee)) - 3, "RS02 rated " + ACT.rated.knee, "#9d2c2c");
    [[M.balancePhi, "92%"], [M.deepPhi, "75%"], [standIk.phi, "stand-up"], [K.ik(9.5 - 0.75, -4.3).phi, "raised"]].forEach(([d, l], i) => { line(svg2, G.X(cx(d)), G.Y(cy0), G.X(cx(d)), G.Y(cy0 + ch), "#c8bfae", 0.8, "2 3"); note(svg2, G.X(cx(d)) + 2, G.Y(cy0 + 0.35 + 0.5 * (i % 2)), l); });
    const lx = cx0 + cw + 0.6;
    [["#1b2430", "one-leg gravity", false], ["#5e6a78", "two-leg gravity", true], ["#8a5a12", "spring (pulley + cable)", false], ["#1d6b45", "motor, one leg", false], ["#9d2c2c", "RS02 rated", true]].forEach(([c, t, dash], i) => {
      const y = cy0 + ch - 0.6 - 0.75 * i;
      line(svg2, G.X(lx), G.Y(y), G.X(lx + 0.6), G.Y(y), c, 2.2, dash ? "4 3" : null); note(svg2, G.X(lx + 0.75), G.Y(y) + 3, t);
    });
    text(svg2, G.X(cx0), G.Y(cy0 + ch + 0.35), "Knee torque (N·m) vs knee bend, symmetric stance", "start", 11, "#1b2430");
    fill("u2", [
      ["Spring sized at", S2.spring.sizedAt + ": " + nm(two92) + " at " + fmt(M.balancePhi, 0) + "° and " + nm(two75) + " at " + fmt(M.deepPhi, 0) + "° (half the " + fmt(M.exampleMassKg, 2) + " kg on each knee)", ""],
      ["Result", "torque = " + fmt(kEff, 2) + " N·m/rad × bend + " + nm(T0) + " preload; pulley Ø" + inch(2 * Rp) + " on the knee arm → extension spring " + fmt(kSpring / 1000, 2) + " kN/m (" + fmt(kSpring * IN, 1) + " N/in, " + fmt(kSpring * IN / 4.448, 1) + " lbf/in), preload " + fmt(preloadN, 0) + " N, travel " + inch(travelIn) + " to the " + fmt(phiStop, 0) + "° stop, " + fmt(springForce(phiStop), 0) + " N there", kEff > 0 ? "good" : "bad"],
      ...poses.map(q => [q.n, "bend " + fmt(q.ph, 0) + "°: spring " + nm(q.spring) + " · gravity one-leg " + nm(q.grav1) + " · motor " + nm(q.motorOne) + " · cable " + fmt(q.force, 0) + " N" + (q.swing ? " (no ground load: the motor holds the spring)" : ""), q.motorOne <= ACT.rated.knee ? "good" : (q.motorOne <= ACT.peak.knee ? "" : "bad")]),
      ["Why a pulley", "two anchors across the joint stop working past ~2·atan(offset / anchor) of fold — the spring line crosses the knee axis and the torque reverses; a cable over a knee pulley keeps a constant lever through the whole 0–" + fmt(phiStop, 0) + "°", ""],
      ["Alternatives", "a torsion spring coaxial on the knee arm's boss (same curve, no cable), or a gas spring for a flatter curve; all sized on the bench", ""]
    ]);
  }

  /* ---------- 3. hub section ---------- */
  function drawHub() {
    const svg = document.getElementById("t3");
    D.setFS(0.45);
    const F = frame(svg, 2.9, 8.7, -0.7, 6.7, 60);   /* lateral z on the page x, height on y, one wheel; zoomed 60 px/in */
    const R = M.wheelR, cy = R;
    line(svg, F.X(2.9), F.Y(0), F.X(8.7), F.Y(0), "#8d8374", 1.5);
    line(svg, F.X(H.env), F.Y(-0.4), F.X(H.env), F.Y(6.8), "#c8bfae", 1, "6 4");
    note(svg, F.X(H.env) - 4, F.Y(6.6), "14\" envelope", "#5e6a78");
    /* tire section: round crown, both sides of the axle */
    const tw = M.wheelWidth, crown = M.tireCrown;
    function tireHalf(sign) {
      const top = cy + R, bot = cy - R;
      const zc = H.axle;
      const d = `M ${F.X(zc - tw / 2)} ${F.Y(top - crown)} A ${crown * D.S} ${crown * D.S} 0 0 1 ${F.X(zc + tw / 2)} ${F.Y(top - crown)} L ${F.X(zc + tw / 2)} ${F.Y(top - 1.0)} L ${F.X(zc - tw / 2)} ${F.Y(top - 1.0)} Z`;
      svg.appendChild(el("path", { d, fill: "#e9e4d8", stroke: "#22282f", "stroke-width": 1.4 }));
      const d2 = `M ${F.X(zc - tw / 2)} ${F.Y(bot + crown)} A ${crown * D.S} ${crown * D.S} 0 0 0 ${F.X(zc + tw / 2)} ${F.Y(bot + crown)} L ${F.X(zc + tw / 2)} ${F.Y(bot + 1.0)} L ${F.X(zc - tw / 2)} ${F.Y(bot + 1.0)} Z`;
      svg.appendChild(el("path", { d: d2, fill: "#e9e4d8", stroke: "#22282f", "stroke-width": 1.4 }));
    }
    tireHalf(1);
    /* rim: bead diameter, width = tire width; drawn as two flanges + a well */
    const beadR = H.bead / 2;
    rect(svg, F.X(H.axle - tw / 2), F.Y(cy + beadR + 0.35), tw * D.S, 0.35 * D.S, "#b8b2a4", "#1b2430");
    rect(svg, F.X(H.axle - tw / 2), F.Y(cy - beadR), tw * D.S, 0.35 * D.S, "#b8b2a4", "#1b2430");
    /* outboard rim flange → disc web → RS05 output flange */
    rect(svg, F.X(H.rs05Out - S2.hub.webMm * MM), F.Y(cy + beadR + 0.35), S2.hub.webMm * MM * D.S, (2 * beadR + 0.35) * D.S, "#b8b2a4", "#1b2430");
    /* RS05 housing, inboard face on the axle fitting */
    rect(svg, F.X(H.rs05In), F.Y(cy + ENV.wheelD / 2), ENV.wheelW * D.S, ENV.wheelD * D.S, "#4d5b55", "#1b2430");
    text(svg, F.X(H.rs05In + ENV.wheelW / 2), F.Y(cy) + 4, "RS05", "middle", 9.5, "#fbf8f1");
    /* axle fitting (F5): from the tube to the stator face */
    rect(svg, F.X(H.tubeIn - 0.15), F.Y(cy + 1.1), (H.mount - H.tubeIn + 0.15) * D.S, 2.2 * D.S, "#c9c3b4", "#1b2430");
    text(svg, F.X((H.tubeIn + H.mount) / 2), F.Y(cy + 0.4) + 4, "F5", "middle", 9.5);
    /* lower tube coming down into F5 (seen end-on: a circle) */
    circle(svg, F.X(H.leg), F.Y(cy + 2.4), T.odMm * MM / 2 * D.S, "#1f4e79", "#1b2430");
    line(svg, F.X(H.leg), F.Y(cy + 2.4), F.X(H.leg), F.Y(6.6), "#1f4e79", T.odMm * MM * D.S);
    note(svg, F.X(H.leg) - 6 - 60, F.Y(5.9), "lower tube, leg plane " + inch(H.leg, 2));
    /* axle centreline */
    centreline(svg, F.X(3.0), F.Y(cy), F.X(8.6), F.Y(cy));
    /* dims */
    dimH(svg, F.X(H.tireIn), F.X(H.tireOut), F.Y(-0.25), inch(tw) + " tire", false);
    dimH(svg, F.X(H.rs05In), F.X(H.rs05Out), F.Y(cy - ENV.wheelD / 2 - 0.45), inch(ENV.wheelW, 2) + " RS05, flush outboard", false);
    dimH(svg, F.X(H.leg), F.X(H.mount), F.Y(cy + 3.35), inch(H.mount - H.leg, 2) + " leg plane → stator");
    dimV(svg, F.X(8.35), F.Y(cy - beadR), F.Y(cy + beadR), inch(H.bead) + " bead", true);
    dimV(svg, F.X(3.3), F.Y(0), F.Y(2 * R), inch(M.wheelOd, 0) + " OD");
    note(svg, F.X(3.0), F.Y(6.55), "HUB — section on the axle, one wheel, looking forward");
    fill("u3", [
      ["Stack (lateral, from the centreline)", "leg plane " + inch(H.leg, 2) + " · stator face " + inch(H.mount, 2) + " · tire " + inch(H.tireIn, 2) + "–" + inch(H.tireOut, 2) + " · RS05 " + inch(H.rs05In, 2) + "–" + inch(H.rs05Out, 2) + " · envelope " + inch(H.env), H.rs05Out <= H.env ? "good" : "bad"],
      ["What changed from Sheet 1", "the RS05 is pushed inboard so its outboard face is flush with the tire (was centred on the tire and 0.24\" proud on both faces): nothing is proud, nothing leaves the envelope", "good"],
      ["Fit inside the rim", "46 mm square RS05 (" + fmt(rs05Diag / MM, 0) + " mm on the diagonal) inside the " + inch(H.bead) + " (" + fmt(H.bead / MM, 0) + " mm) bead — " + fmt((H.bead / MM - rs05Diag / MM) / 2, 0) + " mm radial for the rim wall and the web", ""],
      ["Rim", "turned, " + inch(H.bead) + " bead seat × " + inch(tw) + ", " + S2.hub.webMm + " mm disc web from the outboard flange to the RS05 output flange; the stator bolts to F5 on the inboard side", ""],
      ["Bearing", "the rim rides on the RS05's own output bearing, cantilevered: " + fmt(radialStatic, 0) + " N two-wheel, " + fmt(radialOne, 0) + " N one-leg, ~" + fmt(radialLand, 0) + " N on a landing. Its radial / moment rating is not in the spec table — confirm from the manual, else a stub axle through the actuator and an outboard bearing.", "open"],
      ["Clearance", "tube outer wall to the stator face " + inch(H.fitClear, 2) + ": the axle fitting F5 is that space", H.fitClear > 0.15 ? "good" : "bad"]
    ]);
  }

  /* ---------- 4. hip band / head section and the wire route in ---------- */
  function drawBand() {
    const svg = document.getElementById("t4");
    D.setFS(0.72);
    const F = frame(svg, -9, 9, 11.6, 24.6);
    const p = K.planted(M.balanceTheta, M.balancePhi), hip = p.hip;
    const bandH = S2.band.heightIn, bandW = S2.band.widthIn, bottom = hip.y - bandH / 2, top = hip.y + bandH / 2, head = hip.y + M.bodyAboveHip;
    centreline(svg, F.X(0), F.Y(12.2), F.X(0), F.Y(24.2));
    line(svg, F.X(-M.envelopeWidth / 2), F.Y(12.2), F.X(-M.envelopeWidth / 2), F.Y(24.2), "#c8bfae", 1, "6 4");
    line(svg, F.X(M.envelopeWidth / 2), F.Y(12.2), F.X(M.envelopeWidth / 2), F.Y(24.2), "#c8bfae", 1, "6 4");
    /* shell: band (wide) with a chamfer up to the head (narrow) */
    const chamfer = 0.8;
    const shell = `M ${F.X(-bandW / 2)} ${F.Y(bottom)} L ${F.X(bandW / 2)} ${F.Y(bottom)} L ${F.X(bandW / 2)} ${F.Y(top)} L ${F.X(M.bodyWidth / 2)} ${F.Y(top + chamfer)} L ${F.X(M.bodyWidth / 2)} ${F.Y(head)} L ${F.X(-M.bodyWidth / 2)} ${F.Y(head)} L ${F.X(-M.bodyWidth / 2)} ${F.Y(top + chamfer)} L ${F.X(-bandW / 2)} ${F.Y(top)} Z`;
    svg.appendChild(el("path", { d: shell, fill: "#d5e0ea", stroke: "#1f4e79", "stroke-width": 1.4 }));
    [-1, 1].forEach(sg => {
      motor(svg, F, sg * L1.hipRollAxisIn, hip.y, ENV.rollD, ENV.rollD, "RS02 roll");
      circle(svg, F.X(sg * L1.hipRollAxisIn), F.Y(hip.y), 3, "#fbf8f1", "#1b2430", 1.2);
      /* yoke outside the shell, from the flange face to the leg plane */
      line(svg, F.X(sg * bandW / 2), F.Y(hip.y), F.X(sg * L1.legPlaneIn), F.Y(hip.y), "#1b2430", 5);
      motor(svg, F, sg * (L1.legPlaneIn + ENV.swing.t / 2), hip.y, ENV.swing.t, ENV.swing.w, "RS00");
      joint(svg, F.X(sg * L1.legPlaneIn), F.Y(hip.y));
      /* wire route: from the yoke, a loop into the band's front face beside the roll housing */
      const wp = `M ${F.X(sg * (L1.legPlaneIn - 0.2))} ${F.Y(hip.y - 0.5)} Q ${F.X(sg * (bandW / 2 + 0.6))} ${F.Y(hip.y - 1.9)} ${F.X(sg * (bandW / 2 - 0.3))} ${F.Y(bottom + 0.5)} L ${F.X(sg * (L1.hipRollAxisIn - ENV.rollD / 2 - 0.15))} ${F.Y(bottom + 0.5)}`;
      svg.appendChild(el("path", { d: wp, fill: "none", stroke: "#d0342c", "stroke-width": 1.6, "stroke-dasharray": "5 3" }));
    });
    box(svg, F, 0, hip.y, L1.packIn.w, L1.packIn.h, "#efe2b8", "#8a5a12");
    text(svg, F.X(0), F.Y(hip.y) + 4, "8S pack", "middle", 9.5, "#5c3d0a");
    /* Teensy above the pack, in the head */
    box(svg, F, 0, top + 1.6, 2.4, 0.4, "#2d6a4f", "#1b2430");
    note(svg, F.X(1.4), F.Y(top + 1.5), "Teensy 4.1 + IMU");
    note(svg, F.X(-8.8), F.Y(head + 1.4), "yokes roll ±" + fmt(K.deg(K.spatial.limits.roll[1]), 0) + "° outside the shell, on the roll flanges", "#5e6a78");
    note(svg, F.X(-8.8), F.Y(bottom - 1.6), "wire loops enter the band's lower front face beside each roll housing", "#d0342c");
    dimH(svg, F.X(-bandW / 2), F.X(bandW / 2), F.Y(bottom - 0.6), inch(bandW) + " band", false);
    dimH(svg, F.X(-M.bodyWidth / 2), F.X(M.bodyWidth / 2), F.Y(head + 0.5), inch(M.bodyWidth) + " head");
    dimV(svg, F.X(8.4), F.Y(bottom), F.Y(top), inch(bandH) + " band", true);
    dimV(svg, F.X(8.4), F.Y(top), F.Y(head), inch(head - top) + " head", true);
    ext(svg, F.X(bandW / 2), F.Y(bottom), F.X(8.4), F.Y(bottom)); ext(svg, F.X(bandW / 2), F.Y(top), F.X(8.4), F.Y(top)); ext(svg, F.X(M.bodyWidth / 2), F.Y(head), F.X(8.4), F.Y(head));
    text(svg, F.X(-8.8), F.Y(24.3), "HIP BAND — front section: a wider lower shell, not pods", "start", 12);
    fill("u4", [
      ["Shell", "lower band " + inch(bandW) + " wide × " + inch(bandH) + " tall (the roll housings' square) × ~" + inch(S2.band.lengthIn) + " long, chamfered up to the " + inch(M.bodyWidth) + " head. One printed shell in two halves; the roll flanges are its side faces.", ""],
      ["Why not pods", "the band is 3.1\" tall by 3\" long: at that size two pods and a bridge weigh more than one wider shell and leave the pack unsupported; the band also gives the pack a floor and the Teensy a ceiling", ""],
      ["Inside the band", "pack between the roll housings (" + inch(L1.packIn.w) + " × " + inch(L1.packIn.h) + " × " + inch(L1.packIn.l) + ", " + inch(L1.bodyComForwardIn) + " forward), XT90-D.S and the step-down on the band floor; Teensy + IMU above, at the hip axis height + " + inch(top + 1.6 - hip.y), ""],
      ["Wire entry", "each leg's bundle (RS05 + knee RS02 + swing RS00 + roll RS02 = 4 actuators, 2 CAN buses + power) enters the band's lower front face beside the roll housing with a loop for the ±" + fmt(K.deg(K.spatial.limits.roll[1]), 0) + "° roll; nothing passes through an actuator", "good"],
      ["Width check", "band " + inch(bandW) + " + yokes + RS00s: outer faces at ±" + inch(L1.legPlaneIn + ENV.swing.t, 2) + " inside the " + inch(M.envelopeWidth) + " envelope", L1.legPlaneIn + ENV.swing.t <= M.envelopeWidth / 2 ? "good" : "bad"]
    ]);
  }

  function drawTitle() {
    fill("u0", [
      ["Sheet", "2 — tubes, fittings, spring, hub, wire path · rev " + SPEC.asOf + " · follows Sheet 1 (layout)", ""],
      ["Drawn to", "16 × 14 mm carbon tube, 6 × 1.25 tire on a 3.75\" bead, the RobStride set — all already on the order-now list or the temporary lock; nothing new to buy", "good"],
      ["Fittings", "F1 hip yoke · F2 upper tube, hip end (RS00 output) · F3 upper tube, knee end (RS02 stator) · F4 knee output arm (RS02 flange → tube, spring anchor) · F5 axle fitting (tube → RS05 stator, cable port) · F6 rim + web · F7 hip band shell", ""],
      ["Process", "F1, F5, F6 machined (mill / lathe, 6061); F2–F4 printed with inserts, draft-friendly (R20), machined later if a bond fails; F7 printed in two halves", ""],
      ["Not on this sheet", "bolt patterns (from the STEP files in cad/vendor), the RS05 bearing rating, the tire's real crown, the display and cameras", "open"]
    ]);
  }

  drawTitle(); drawLeg(); drawKnee(); drawHub(); drawBand();
  window.HuxSheet2 = { cuts, I, Zs, sigmaStand, fCant, kEff, T0, kSpring, preloadN, poses, H, two92, two75 };
})();
