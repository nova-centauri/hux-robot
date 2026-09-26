/* Hux working model. Inches and degrees for geometry, SI for forces and momentum.
   Source: docs/research/leg-geometry.md and docs/research/stair-climb-dynamics.md
   Body length, body width, and the lateral hip offset are drawing assumptions. They are not settled. */
(function (root) {
  const M = {
    asOf: "2026-09-22",
    wheelOd: 6,
    wheelWidth: 1.25,
    /* Tread cross-section radius. width/2 is a full round (scooter / motorcycle profile), which is
       what a 6×1.25 pneumatic on a narrow rim looks like. Larger = flatter dome. See tire.js. */
    tireCrown: 0.625,
    link: 7.5,
    bodyAboveHip: 6,
    bodyLength: 8,
    bodyWidth: 7,
    envelopeWidth: 14,
    envelopeHeight: 24,
    rise: 9.5,
    going: 9.5,
    soffit: 1,
    stanceFraction: 0.92,
    exampleMassKg: 6,
    g: 9.81,
    /* Lateral distance from the body centerline to each hip roll axis. Drawing assumption:
       the head is ~7" wide and the legs sit just outside it. */
    hipLateral: 5.4,
    /* Rough envelopes so the views show bulk. Not parts, not a buy. */
    motorWheelD: 2.0,
    motorWheelW: 1.1,
    motorKnee: { w: 1.6, h: 1.5, t: 1.15 },
    motorSwing: { w: 1.8, h: 1.6, t: 1.4 },
    motorRollD: 1.6,
    motorRollL: 1.5,
    displayW: 2.2,
    displayH: 1.0,
    eyeD: 0.7,
    eyeGap: 2.2,
    cam: 0.45,
    stereoGap: 2.6
  };
  M.wheelR = M.wheelOd / 2;
  M.track = M.envelopeWidth - M.wheelWidth;
  M.slotRoom = M.going / 2 - M.wheelR; /* rubber-to-nosing gap each side of a centered tire: 1.75" */
  M.balanceTheta = Math.acos(M.stanceFraction) * 180 / Math.PI;
  M.balancePhi = M.balanceTheta * 2;
  M.deepTheta = Math.acos(0.75) * 180 / Math.PI;
  M.deepPhi = M.deepTheta * 2;

  /* Design knobs for the climb. Everything here can be changed from the page and the
     climb is rebuilt. Defaults are the working assumptions, not decisions. */
  const Spatial = root.HuxSpatial || require("./spatial.js");
  const spatial = Spatial.create(M);

  const P = {
    tPush: 0.44,      /* s, duration of the rear-leg shove with both wheels down */
    wheelTau: 3.0,    /* N·m, peak torque the front wheel can put on the tread */
    catchRoom: 1.0,   /* in, how far the front wheel may roll back in its slot during the catch */
    landErr: 0,       /* in, where the front wheel actually lands relative to slot center (+ = forward) */
    massScale: 1,     /* multiplies the 6 kg lump picture */
    bodyCom: 0,       /* in, body lump forward (+) of the hip axis. 0 = pack centered on the hips */
    mu: 0.7           /* tire-to-tread friction used for every cone check */
  };

  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /** Hip at origin, +x forward, +y up.
      θ from straight down, positive puts the knee to the REAR.
      φ folds the lower tube forward under the hip. 0 keeps the leg straight. */
  function chain(thetaDeg, phiDeg) {
    const th = rad(thetaDeg);
    const psi = rad(thetaDeg - phiDeg);
    const L = M.link;
    const knee = { x: -L * Math.sin(th), y: -L * Math.cos(th) };
    const axle = {
      x: knee.x - L * Math.sin(psi),
      y: knee.y - L * Math.cos(psi)
    };
    return { knee: knee, axle: axle, reach: dist({ x: 0, y: 0 }, axle) };
  }

  function ikChoices(tx, ty) {
    const L = M.link;
    const d = Math.hypot(tx, ty);
    const cosA = clamp(d / (2 * L), -1, 1);
    const A = Math.acos(cosA);
    const down = Math.atan2(-tx, -ty);
    const tries = [down + A, down - A];
    const out = [];
    for (let i = 0; i < tries.length; i++) {
      const theta = tries[i];
      const knee = { x: -L * Math.sin(theta), y: -L * Math.cos(theta) };
      const vx = tx - knee.x;
      const vy = ty - knee.y;
      const psi = Math.atan2(-vx, -vy);
      const phi = theta - psi;
      const got = chain(deg(theta), deg(phi));
      out.push({
        theta: deg(theta),
        phi: deg(phi),
        err: Math.hypot(got.axle.x - tx, got.axle.y - ty),
        rear: knee.x < -0.3 && knee.y < -0.4,
        knee: knee
      });
    }
    return out;
  }

  function ik(tx, ty) {
    const opts = ikChoices(tx, ty);
    let best = opts[0];
    for (let i = 1; i < opts.length; i++) {
      const o = opts[i];
      const better = o.err < best.err - 1e-4 || (Math.abs(o.err - best.err) <= 1e-4 && o.rear && !best.rear);
      if (better) best = o;
    }
    return best;
  }

  /** Axle planted at x=0 on the ground. Returns world points, y up. */
  function planted(thetaDeg, phiDeg) {
    const c = chain(thetaDeg, phiDeg);
    const hip = { x: -c.axle.x, y: M.wheelR - c.axle.y };
    const knee = { x: hip.x + c.knee.x, y: hip.y + c.knee.y };
    const axle = { x: 0, y: M.wheelR };
    return pose(hip, knee, axle, c.reach);
  }

  /** Both joints on one shared hip. Used by the two-leg stair view. */
  function atHip(thetaDeg, phiDeg, hip) {
    const c = chain(thetaDeg, phiDeg);
    const knee = { x: hip.x + c.knee.x, y: hip.y + c.knee.y };
    const axle = { x: hip.x + c.axle.x, y: hip.y + c.axle.y };
    return pose({ x: hip.x, y: hip.y }, knee, axle, c.reach);
  }

  /** Hip fixed. hipX leans the body forward of the balance axle. Wheel is free. */
  function swing(thetaDeg, phiDeg, hipX) {
    const stance = planted(M.balanceTheta, M.balancePhi);
    const c = chain(thetaDeg, phiDeg);
    const hip = { x: hipX || 0, y: stance.hip.y };
    const knee = { x: hip.x + c.knee.x, y: hip.y + c.knee.y };
    const axle = { x: hip.x + c.axle.x, y: hip.y + c.axle.y };
    return pose(hip, knee, axle, c.reach);
  }

  function pose(hip, knee, axle, reach) {
    const full = M.link * 2;
    const line = dist(hip, axle) || 1e-9;
    const poke = Math.abs((axle.x - hip.x) * (hip.y - knee.y) - (hip.x - knee.x) * (axle.y - hip.y)) / line;
    const next = { x: M.going, y: M.rise + M.wheelR };
    return {
      hip: hip,
      knee: knee,
      axle: axle,
      contact: { x: axle.x, y: axle.y - M.wheelR },
      reach: reach,
      extension: reach / full,
      poke: poke,
      hipHeight: hip.y - (axle.y - M.wheelR),
      nextAxle: next,
      miss: dist(axle, next),
      airUnderSoffit: M.rise - M.soffit - M.wheelOd
    };
  }

  function rollMomentNm(offsetIn) {
    return M.exampleMassKg * M.g * Math.abs(offsetIn) * 0.0254;
  }

  /* Lumped mass, kilograms. Estimate so the picture has a weight, not a measured robot.
     Body 4.0 at mid-body, both hip actuators 0.8 at the hip, each knee 0.25, each wheel 0.35.
     Total 6.0 kg, the example used everywhere else. massScale multiplies all of it. */
  const MASS0 = { body: 4.0, hips: 0.8, knee: 0.25, wheel: 0.35 };
  M.mass = { body: 4.0, hips: 0.8, knee: 0.25, wheel: 0.35 };
  function setMass(scale) {
    M.mass.body = MASS0.body * scale;
    M.mass.hips = MASS0.hips * scale;
    M.mass.knee = MASS0.knee * scale;
    M.mass.wheel = MASS0.wheel * scale;
    M.exampleMassKg = 6 * scale;
  }

  function comOf(left, right) {
    const hip = left.hip;
    const parts = [
      [M.mass.body, hip.x + P.bodyCom, hip.y + M.bodyAboveHip * 0.45],
      [M.mass.hips, hip.x, hip.y],
      [M.mass.knee, left.knee.x, left.knee.y],
      [M.mass.knee, right.knee.x, right.knee.y],
      [M.mass.wheel, left.axle.x, left.axle.y],
      [M.mass.wheel, right.axle.x, right.axle.y]
    ];
    let mx = 0;
    let my = 0;
    let m = 0;
    for (let i = 0; i < parts.length; i++) {
      mx += parts[i][0] * parts[i][1];
      my += parts[i][0] * parts[i][2];
      m += parts[i][0];
    }
    return { x: mx / m, y: my / m, kg: m };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function parkAxle(step) {
    return { x: step * M.going, y: step * M.rise + M.wheelR };
  }

  function groundY(x) {
    const i = Math.floor((x + M.going / 2) / M.going);
    return Math.max(0, i) * M.rise;
  }

  function stairBoards(xMin, xMax) {
    const G = M.going;
    const H = M.rise;
    const i1 = Math.ceil(xMax / G) + 1;
    const boards = [];
    for (let i = 1; i <= i1; i++) {
      boards.push({
        x0: (i - 0.5) * G,
        x1: (i + 0.5) * G,
        y0: i * H - M.soffit,
        y1: i * H
      });
    }
    return boards;
  }

  function circleHitsBoard(cx, cy, r, b) {
    const x = Math.max(b.x0, Math.min(cx, b.x1));
    const y = Math.max(b.y0, Math.min(cy, b.y1));
    return Math.hypot(cx - x, cy - y) < r - 0.08;
  }

  function rectHitsBoard(box, b) {
    return box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0;
  }

  /* 16 mm tube, plus a little air. The knee motor is checked separately. */
  const tubeR = 0.35;

  function segmentHitsRect(a, b, r) {
    let t0 = 0;
    let t1 = 1;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const p = [-dx, dx, -dy, dy];
    const q = [a.x - r.x0, r.x1 - a.x, a.y - r.y0, r.y1 - a.y];
    for (let i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-9) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }
    return t0 <= t1;
  }

  function segmentHitsBoard(a, b, board) {
    return segmentHitsRect(a, b, {
      x0: board.x0 - tubeR,
      x1: board.x1 + tubeR,
      y0: board.y0 - tubeR,
      y1: board.y1 + tubeR
    });
  }

  function stairRisers(xMax) {
    const G = M.going;
    const H = M.rise;
    const i1 = Math.ceil(xMax / G) + 1;
    const risers = [];
    for (let i = 1; i <= i1; i++) {
      risers.push({
        x0: (i - 0.5) * G - 0.06,
        x1: (i - 0.5) * G + 0.06,
        y0: (i - 1) * H,
        y1: i * H - M.soffit
      });
    }
    return risers;
  }

  function poseHits(left, right) {
    const xMax = Math.max(left.axle.x, right.axle.x, left.knee.x, right.knee.x, left.hip.x) + M.bodyLength / 2;
    const boards = stairBoards(
      Math.min(left.axle.x, right.axle.x, left.knee.x, right.knee.x, left.hip.x) - 2,
      xMax
    ).concat(stairRisers(xMax));
    const body = {
      x0: left.hip.x - M.bodyLength / 2,
      x1: left.hip.x + M.bodyLength / 2,
      y0: left.hip.y,
      y1: left.hip.y + M.bodyAboveHip
    };
    const parts = [
      ["left wheel", left.axle, M.wheelR],
      ["right wheel", right.axle, M.wheelR],
      ["left knee", left.knee, 0.9],
      ["right knee", right.knee, 0.9]
    ];
    for (let i = 0; i < boards.length; i++) {
      const b = boards[i];
      for (let k = 0; k < parts.length; k++) {
        const part = parts[k];
        if (circleHitsBoard(part[1].x, part[1].y, part[2], b)) return part[0];
      }
      if (segmentHitsBoard(left.hip, left.knee, b)) return "left upper tube";
      if (segmentHitsBoard(left.knee, left.axle, b)) return "left lower tube";
      if (segmentHitsBoard(right.hip, right.knee, b)) return "right upper tube";
      if (segmentHitsBoard(right.knee, right.axle, b)) return "right lower tube";
      if (rectHitsBoard(body, b)) return "body";
    }
    if (left.contact.y < -0.2 || right.contact.y < -0.2) return "floor";
    return "";
  }

  function onTread(p) {
    return Math.abs(p.contact.y - groundY(p.axle.x)) < 0.35 && p.contact.y >= -0.05;
  }

  /** Which planted foot the mass is over, and the moment about the nearer one. */
  function comReport(left, right) {
    const com = comOf(left, right);
    const feet = [];
    if (onTread(left)) feet.push({ name: "left", x: left.axle.x });
    if (onTread(right)) feet.push({ name: "right", x: right.axle.x });
    const over = [];
    for (let i = 0; i < feet.length; i++) {
      if (Math.abs(com.x - feet[i].x) <= 0.02) over.push(feet[i]);
    }
    let where = "Offset from contact line — active balance required";
    if (!feet.length) where = "Both feet are in the air";
    else if (over.length === 2 || (feet.length === 2 && Math.abs(feet[0].x - feet[1].x) < 1 && over.length >= 1)) {
      where = "Aligned with both contact lines";
    } else if (over.length === 1) {
      where = over[0].name === "left" ? "Aligned with left contact line" : "Aligned with right contact line";
    }
    const pool = feet.length ? feet : [{ x: left.axle.x }, { x: right.axle.x }];
    let ref = pool[0];
    for (let i = 1; i < pool.length; i++) {
      if (Math.abs(com.x - pool[i].x) < Math.abs(com.x - ref.x)) ref = pool[i];
    }
    const offset = com.x - ref.x;
    return {
      com: com,
      where: where,
      offset: offset,
      moment: rollMomentNm(offset),
      supportX: ref.x
    };
  }

  function axleStatus(axle) {
    const contactY = axle.y - M.wheelR;
    const ground = groundY(axle.x);
    const boards = stairBoards(axle.x - M.wheelR, axle.x + M.wheelR).concat(stairRisers(axle.x + M.wheelR));
    let clips = false;
    for (let i = 0; i < boards.length; i++) {
      if (circleHitsBoard(axle.x, axle.y, M.wheelR, boards[i])) clips = true;
    }
    if (contactY < -0.2) return { where: "Through the floor", kind: "bad" };
    if (clips) return { where: "Clips the stair", kind: "bad" };
    const step = Math.max(0, Math.floor((axle.x + M.going / 2) / M.going));
    const on = Math.abs(contactY - ground) < 0.35;
    const slot = M.going / 2 - M.wheelR;
    const inSlot = Math.abs(axle.x - step * M.going) <= slot + 0.08;
    if (on && inSlot) {
      return { where: step === 0 ? "On the lower tread" : "On step " + step, kind: "good" };
    }
    if (on) return { where: "On a tread, near a nosing", kind: "" };
    return { where: "In the air", kind: "" };
  }

  /* ------------------------------------------------------------------------------------
     Stair climb.

     The shin cannot put the mass over the front contact while the rear wheel is still
     down. Two things get it there. The rear leg shoves the body forward so the mass
     leaves the rear wheel with forward angular momentum about the front contact. And
     the front wheel, which is a driven wheel on a shelf, rolls BACK under the mass while
     it is in the air. Rolling the contact back is worth exactly its distance in
     "behind", and at 3 N·m it is a stronger righting effect than gravity's pull-back.
     Only after the mass is over the front contact does the body stand up.

     A is the trailing foot. B leads. Right leads on even steps.
     ------------------------------------------------------------------------------------ */
  const INCH = 0.0254;

  function angDist(a, b) {
    let d = a - b;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return Math.abs(d);
  }

  function legOptions(tx, ty) {
    const L = M.link;
    const d = Math.hypot(tx, ty);
    const cosA = clamp(d / (2 * L), -1, 1);
    const A = Math.acos(cosA);
    const down = Math.atan2(-tx, -ty);
    const out = [];
    for (let k = 0; k < 2; k++) {
      const theta = k === 0 ? down + A : down - A;
      const knee = { x: -L * Math.sin(theta), y: -L * Math.cos(theta) };
      const phi = theta - Math.atan2(-(tx - knee.x), -(ty - knee.y));
      const psi = theta - phi;
      const axle = { x: knee.x - L * Math.sin(psi), y: knee.y - L * Math.cos(psi) };
      out.push({
        theta: deg(theta),
        phi: deg(phi),
        err: Math.hypot(axle.x - tx, axle.y - ty),
        knee: knee
      });
    }
    return out;
  }

  function solveLegs(hx, hy, ax, ay, bx, by, hint) {
    const hip = { x: hx, y: hy };
    const ao = legOptions(ax - hx, ay - hy);
    const bo = legOptions(bx - hx, by - hy);
    let best = null;
    for (let i = 0; i < ao.length; i++) {
      for (let j = 0; j < bo.length; j++) {
        const a = ao[i];
        const b = bo[j];
        const pA = atHip(a.theta, a.phi, hip);
        const pB = atHip(b.theta, b.phi, hip);
        const hit = poseHits(pA, pB);
        let score = (hit ? 200 : 0) + (a.err + b.err) * 30;
        if (hint) {
          score += 0.02 * (
            angDist(a.theta, hint.aTh) + angDist(a.phi, hint.aPh) +
            angDist(b.theta, hint.bTh) + angDist(b.phi, hint.bPh)
          );
        }
        if (!best || score < best.score) {
          best = { score: score, a: a, b: b, pA: pA, pB: pB, hit: hit, com: comOf(pA, pB) };
        }
      }
    }
    return best;
  }

  function holdCom(ax, ay, bx, by, hipY, comX, hint) {
    let hx = comX;
    let sol = null;
    for (let n = 0; n < 6; n++) {
      sol = solveLegs(hx, hipY, ax, ay, bx, by, hint);
      hx += comX - sol.com.x;
    }
    sol = solveLegs(hx, hipY, ax, ay, bx, by, hint);
    sol.hx = hx;
    sol.hy = hipY;
    return sol;
  }

  /* Lump order: body, hips, kneeA, kneeB, wheelA, wheelB. Positions in inches. */
  function lumpsOf(sol) {
    const hip = sol.pA.hip;
    return [
      [M.mass.body, hip.x + P.bodyCom, hip.y + M.bodyAboveHip * 0.45],
      [M.mass.hips, hip.x, hip.y],
      [M.mass.knee, sol.pA.knee.x, sol.pA.knee.y],
      [M.mass.knee, sol.pB.knee.x, sol.pB.knee.y],
      [M.mass.wheel, sol.pA.axle.x, sol.pA.axle.y],
      [M.mass.wheel, sol.pB.axle.x, sol.pB.axle.y]
    ];
  }

  function bodyInertia() {
    return M.mass.body * ((M.bodyLength * INCH) ** 2 + (M.bodyAboveHip * INCH) ** 2) / 12;
  }

  function angMom(sol0, sol1, dt, cx, cy) {
    const p0 = lumpsOf(sol0);
    const p1 = lumpsOf(sol1);
    let L = 0;
    for (let i = 0; i < p0.length; i++) {
      const rx = (p0[i][1] - cx) * INCH;
      const ry = (p0[i][2] - cy) * INCH;
      const vx = (p1[i][1] - p0[i][1]) / dt * INCH;
      const vy = (p1[i][2] - p0[i][2]) / dt * INCH;
      L += p0[i][0] * (rx * vy - ry * vx);
    }
    return L;
  }

  function inertiaAbout(sol, cx, cy) {
    const p = lumpsOf(sol);
    let I = bodyInertia();
    for (let i = 0; i < p.length; i++) {
      const rx = (p[i][1] - cx) * INCH;
      const ry = (p[i][2] - cy) * INCH;
      I += p[i][0] * (rx * rx + ry * ry);
    }
    return I;
  }

  /* Feasible rear/front contact split for a known motion. Returns null when no
     friction cone works. Rear contact under the rear axle on the lower tread, front
     contact under the leading axle. */
  function contactFeasible(fx, normal, mu, torqueLimit) {
    return Number.isFinite(fx) && Number.isFinite(normal) && normal >= 0
      && Math.abs(fx) <= mu * normal + 1e-9
      && Math.abs(fx) * M.wheelR * INCH <= torqueLimit + 1e-9;
  }

  function contactSplit(sol0, cx, cy, ax, ay, dLdt) {
    const m = sol0.com.kg;
    const rxr = (sol0.pA.axle.x - cx) * INCH;
    const Hm = (cy - (sol0.pA.axle.y - M.wheelR)) * INCH;
    const rx = (sol0.com.x - cx) * INCH;
    const tauG = -m * M.g * rx;
    const tauNeed = dLdt - tauG;
    const FyTot = m * (ay + M.g);
    const FxTot = m * ax;
    let ok = null;
    const mu = P.mu;
    const steps = 28;
    for (let k = 0; k <= steps; k++) {
      const Fy = Math.max(0, FyTot) * k / steps;
      const Fx = (tauNeed - rxr * Fy) / Hm;
      const Fyf = FyTot - Fy;
      const Fxf = FxTot - Fx;
      const rearOk = contactFeasible(Fx, Fy, mu, P.wheelTau);
      const frontOk = contactFeasible(Fxf, Fyf, mu, P.wheelTau);
      if (rearOk && frontOk) {
        const tr = Math.abs(Fx) * M.wheelR * INCH;
        const tf = Math.abs(Fxf) * M.wheelR * INCH;
        const score = Math.max(tr, tf);
        if (!ok || score < ok.score) ok = { Fy: Fy, Fx: Fx, Fyf: Fyf, Fxf: Fxf, tr: tr, tf: tf, score: score };
      }
    }
    return ok;
  }

  /* ---- Joint torques -----------------------------------------------------------------
     Virtual work on the two-link leg. q = (θ, φ). τ_q = −Σ F·∂p/∂q for every external
     force F applied at point p on that leg. A couple C on the shin (the hub motor's
     reaction) adds −C to the knee and +C to the hip. Metres and newtons in, N·m out.
     Sign: positive knee torque drives φ open (folds the shin forward under the hip);
     positive hip torque drives θ positive (knee to the rear). */
  function legJac(thetaDeg, phiDeg) {
    const th = rad(thetaDeg);
    const psi = rad(thetaDeg - phiDeg);
    const L = M.link * INCH;
    return {
      knee: { dth: { x: -L * Math.cos(th), y: L * Math.sin(th) } },
      axle: {
        dth: { x: -L * Math.cos(th) - L * Math.cos(psi), y: L * Math.sin(th) + L * Math.sin(psi) },
        dph: { x: L * Math.cos(psi), y: -L * Math.sin(psi) }
      }
    };
  }

  function legTorques(thetaDeg, phiDeg, Faxle, Fknee, shinCouple) {
    const J = legJac(thetaDeg, phiDeg);
    const hip = -(J.axle.dth.x * Faxle.x + J.axle.dth.y * Faxle.y)
      - (J.knee.dth.x * Fknee.x + J.knee.dth.y * Fknee.y) + shinCouple;
    const knee = -(J.axle.dph.x * Faxle.x + J.axle.dph.y * Faxle.y) - shinCouple;
    return { hip: hip, knee: knee };
  }

  function buildClimb() {
    const R = M.wheelR;
    const G = M.going;
    const H = M.rise;
    const g = M.g;
    const hipHold = R + 2 * M.link * M.stanceFraction;
    const clearY = H + R + 2;
    const home = { x: 0, y: R };
    const dest = { x: G + P.landErr, y: R + H };
    const cx = dest.x; /* front contact, x */
    const cy = H;      /* front contact, y (the upper tread) */
    const roomBack = clamp(M.slotRoom + P.landErr, 0, 2 * M.slotRoom);
    const roomFwd = clamp(M.slotRoom - P.landErr, 0, 2 * M.slotRoom);
    const catchRoom = Math.min(P.catchRoom, roomBack);
    const hint0 = { aTh: M.balanceTheta, aPh: M.balancePhi, bTh: M.balanceTheta, bPh: M.balancePhi };
    const samples = [];
    let hint = hint0;
    let clock = 0;
    const mTot = M.mass.body + M.mass.hips + 2 * M.mass.knee + 2 * M.mass.wheel;
    /* Base acceleration the front wheel can command. Conservative: the torque dragging
       the whole mass, and never past the friction cone. */
    const aCap = Math.min(P.wheelTau / (R * INCH * mTot), P.mu * g);

    function pushSample(dt, phase, sol, extra) {
      clock += dt;
      const row = {
        t: clock,
        phase: phase,
        aTh: sol.a.theta,
        aPh: sol.a.phi,
        bTh: sol.b.theta,
        bPh: sol.b.phi,
        sol: sol,
        hit: sol.hit || "",
        err: Math.max(sol.a.err, sol.b.err),
        supportX: extra && extra.supportX !== undefined ? extra.supportX : sol.com.x,
        base: extra && extra.base !== undefined ? extra.base : 0,
        baseV: extra && extra.baseV !== undefined ? extra.baseV : 0,
        baseA: extra && extra.baseA !== undefined ? extra.baseA : 0,
        lat: extra && extra.lat !== undefined ? extra.lat : 1,
        split: extra && extra.split ? extra.split : null,
        dyn: extra && extra.dyn ? extra.dyn : null
      };
      samples.push(row);
      hint = { aTh: sol.a.theta, aPh: sol.a.phi, bTh: sol.b.theta, bPh: sol.b.phi };
      return row;
    }

    /* 1. Balance on the trailing foot. The mass is already over it laterally, left
       there by the previous cycle. */
    const nBal = 16;
    for (let i = 0; i <= nBal; i++) {
      if (i === 0 && samples.length) continue;
      const sol = holdCom(home.x, home.y, home.x, home.y, hipHold, 0, hint);
      pushSample(i === 0 ? 0 : 0.45 / nBal, "Balance on one foot", sol, { supportX: 0, lat: 1 });
    }

    /* 2. Raise the other foot. */
    const nRaise = 24;
    for (let i = 1; i <= nRaise; i++) {
      const u = i / nRaise;
      const y = lerp(home.y, clearY, smooth(u));
      const sol = holdCom(home.x, home.y, home.x, y, hipHold, 0, hint);
      pushSample(0.60 / nRaise, "Raise the other foot", sol, { supportX: 0, lat: 1 });
    }

    /* 3. Carry it forward and set it down in the next slot. */
    const nPlace = 36;
    for (let i = 1; i <= nPlace; i++) {
      const u = i / nPlace;
      const carry = smooth(Math.min(1, u / 0.62));
      const lower = smooth(Math.max(0, (u - 0.62) / 0.38));
      const bx = lerp(home.x, dest.x, carry);
      const by = lerp(clearY, dest.y, lower);
      const sol = holdCom(home.x, home.y, bx, by, hipHold, 0, hint);
      pushSample(0.95 / nPlace, "Place the raised foot on the next step", sol, { supportX: 0, lat: 1 });
    }

    /* 4. Gather. Both wheels down. Roll the rear wheel to the front of its slot, ease
       the hip forward, and sway the mass across from the trailing wheel to the leading
       wheel. The sway happens here because it is the only long stretch with both wheels
       loaded. It never has to come back: the leading foot is next cycle's planted foot. */
    const gatherFrom = { x: samples[samples.length - 1].sol.hx, y: hipHold };
    const setHip = { x: 3.74, y: 16.65 };
    const coastHip = { x: 7.40, y: 16.55 };
    const rearPark = 1.65;
    const nGather = 40;
    const tGather = 0.85;
    for (let i = 1; i <= nGather; i++) {
      const u = i / nGather;
      const roll = smooth(Math.min(1, u / 0.45));
      const slide = smooth(clamp((u - 0.30) / 0.70, 0, 1));
      const ax = lerp(0, rearPark, roll);
      const hx = lerp(gatherFrom.x, setHip.x, slide);
      const hy = lerp(gatherFrom.y, setHip.y, slide);
      const sol = solveLegs(hx, hy, ax, R, dest.x, dest.y, hint);
      sol.hx = hx;
      sol.hy = hy;
      pushSample(tGather / nGather, "Roll the rear wheel forward", sol, { supportX: sol.com.x, lat: lerp(1, -1, smooth(u)) });
    }

    /* 5. Shove. p = (t/T)^3 over tPush seconds: gentle start, hardest at liftoff. */
    const Tpush = P.tPush;
    function shoveTime(p) { return Tpush * Math.pow(p, 1 / 3); }
    const nPush = 64;
    const pushSol = [];
    for (let i = 0; i <= nPush; i++) {
      const p = i / nPush;
      const hx = lerp(setHip.x, coastHip.x, p);
      const hy = lerp(setHip.y, coastHip.y, p);
      const sol = solveLegs(hx, hy, rearPark, R, dest.x, dest.y, hint);
      sol.hx = hx;
      sol.hy = hy;
      pushSol.push(sol);
      hint = { aTh: sol.a.theta, aPh: sol.a.phi, bTh: sol.b.theta, bPh: sol.b.phi };
    }
    const pushForceBad = [];
    let prevL = 0;
    let prevV = null;
    let peakShoveTau = 0;
    for (let i = 1; i <= nPush; i++) {
      const p = i / nPush;
      const p0 = (i - 1) / nPush;
      const dt = Math.max(1e-4, shoveTime(p) - shoveTime(p0));
      const L = angMom(pushSol[i - 1], pushSol[i], dt, cx, cy);
      const dL = (L - prevL) / dt;
      const cvx = (pushSol[i].com.x - pushSol[i - 1].com.x) / dt;
      const cvy = (pushSol[i].com.y - pushSol[i - 1].com.y) / dt;
      let split = null;
      if (prevV && p0 > 0.12) {
        const axm = (cvx - prevV.x) / dt * INCH;
        const aym = (cvy - prevV.y) / dt * INCH;
        split = contactSplit(pushSol[i - 1], cx, cy, axm, aym, dL);
        if (!split) pushForceBad.push({ p: p0, ax: axm, dL: dL, com: pushSol[i - 1].com.x });
        else peakShoveTau = Math.max(peakShoveTau, split.tr, split.tf);
      }
      const behind = cx - pushSol[i].com.x;
      const dyn = {
        throwing: true,
        behind: behind,
        vx: cvx,
        vy: cvy,
        speed: Math.hypot(cvx, cvy),
        forwardL: -L,
        inertia: inertiaAbout(pushSol[i], cx, cy),
        need: null,
        margin: null,
        rearN: split ? split.Fy : null,
        wheelTau: split ? Math.max(split.tr, split.tf) : null,
        ok: !!split || p0 <= 0.12,
        note: "Both wheels are down. The rear leg is shoving the body forward. The mass is still " +
          behind.toFixed(1) + " in behind the front contact." + (split || p0 <= 0.12 ? "" : " No friction cone carries this instant.")
      };
      pushSample(dt, "Shove off the rear wheel", pushSol[i], { dyn: dyn, supportX: pushSol[i].com.x, lat: -1, split: split });
      prevL = L;
      prevV = { x: cvx, y: cvy };
    }
    const Llift = prevL;
    const liftV = prevV;

    /* 6. Coast path. The rear foot rises as the hip continues, so the rear leg does not
       have to stretch past 15 in. Positions here are relative to the front contact; the
       whole picture rides on the front wheel as it rolls in its slot. */
    const nCoast = 80;
    const coast = [];
    for (let i = 0; i <= nCoast; i++) {
      /* The flight path is the pendulum coordinate. The hip has to rise about 2.3" before
         it can pass x ≈ 10.25, or the body's nose hits the tread above; that rise is
         spread over most of the flight so it does not ride on the pendulum's final rush. */
      const z = i / nCoast;
      const late = smooth((z - 0.35) / 0.65);
      const hy = Math.min(19.55, coastHip.y + 1.05 * z + 2.3 * late);
      let hx = Math.min(10.02 + P.landErr, coastHip.x + 3.5 * z);
      if (hy >= 19.25) hx = Math.min(11.1 + P.landErr, 10.02 + P.landErr + (hy - 19.25) * 3.6);
      const ay = Math.min(14.6, R + 10 * z);
      const ax = ay < 12 ? rearPark - 0.3 * z : lerp(rearPark, 5.2, smooth((ay - 12) / 2.6));
      const sol = solveLegs(hx, hy, ax, ay, dest.x, dest.y, hint);
      sol.hx = hx;
      sol.hy = hy;
      coast.push(sol);
      hint = { aTh: sol.a.theta, aPh: sol.a.phi, bTh: sol.b.theta, bPh: sol.b.phi };
    }
    function Jat(i) {
      const i1 = Math.min(nCoast, i + 1);
      const i0 = Math.max(0, i1 - 1);
      const dz = (i1 - i0) / nCoast || 1e-4;
      return angMom(coast[i0], coast[i1], dz, cx, cy);
    }
    function comAt(z) {
      const i = Math.min(nCoast, Math.max(0, Math.round(z * nCoast)));
      return coast[i].com;
    }
    function comSlope(z) {
      const i = Math.min(nCoast - 1, Math.max(0, Math.floor(z * nCoast)));
      return (coast[i + 1].com.x - coast[i].com.x) * nCoast * INCH; /* m per unit z */
    }

    /* Integrate the flight. State: z (pose progress), L (angular momentum about the
       front contact, positive = backward), s (front contact displacement, m, + forward),
       sv. Only gravity and the base's own acceleration change L. The wheel plan: roll
       back `catchRoom` and stop (bang-bang at aCap) before the crest; after the crest,
       hold the contact under the mass with a clipped PD. */
    /* Wheel command once the mass is over the contact: full-state feedback on the
       linear wheeled-inverted-pendulum (mass offset, its rate, base offset from slot
       center, base speed), clipped at aCap, and a hard stop at either slot edge. The
       positive base-position gains are the usual cart-pole result: to bring the base
       back it first leans the mass. */
    const backLimit = roomBack * INCH;
    const fwdLimitM = roomFwd * INCH;
    function baseCmd(rx, vrel, s, sv) {
      let a = clamp(800 * rx + 150 * vrel + 80 * sv, -aCap, aCap);
      const stopF = s + (sv > 0 ? sv * sv / (2 * aCap) : 0);
      const stopB = s - (sv < 0 ? sv * sv / (2 * aCap) : 0);
      if (stopF >= fwdLimitM) a = -aCap;
      else if (stopB <= -backLimit) a = aCap;
      if (s >= fwdLimitM - 1e-6 && sv <= 0 && a > 0) a = 0;
      if (s <= -backLimit + 1e-6 && sv >= 0 && a < 0) a = 0;
      return a;
    }
    function runCoast(L0, useCatch, init) {
      let z = init ? init.z : 0;
      let L = L0;
      let s = init ? init.s : 0;
      let sv = init ? init.sv : 0;
      let held = init ? !!init.held : false;
      let t = 0;
      const dt = 0.001;
      const trail = [];
      let crest = null;
      let sMin = s;
      let sMax = s;
      let aPeak = 0;
      const room = useCatch ? catchRoom * INCH : 0;
      /* Flight: z is the pendulum coordinate, the base rolls back under the mass. */
      for (let n = 0; n < 3000; n++) {
        const i = Math.min(nCoast - 1, Math.floor(z * nCoast));
        const J = Jat(i);
        if (!J || Math.abs(J) < 1e-5) return { fail: "J", z: z, t: t, L: L, trail: trail, sMin: sMin, sMax: sMax };
        let zdot = L / J;
        if (n > 3 && zdot <= 0.03) {
          return { fail: "reversed", z: z, t: t, L: L, com: comAt(z).x, trail: trail, sMin: sMin, sMax: sMax };
        }
        const com = comAt(z);
        const rx = (com.x - cx) * INCH;
        const ry = (com.y - cy) * INCH;
        let a = 0;
        if (useCatch && room > 0 && !held) {
          const stop = sv * sv / (2 * aCap);
          if (s - stop <= -room) {
            a = aCap;
            if (sv >= -1e-3) { a = 0; sv = 0; s = Math.max(s, -room); held = true; }
          } else {
            a = -aCap;
          }
        }
        L += (-mTot * g * rx + mTot * ry * a) * dt;
        zdot = L / J;
        z = Math.min(0.999, z + zdot * dt);
        sv += a * dt;
        s += sv * dt;
        t += dt;
        sMin = Math.min(sMin, s);
        sMax = Math.max(sMax, s);
        aPeak = Math.max(aPeak, Math.abs(a));
        if (n % 2 === 0) trail.push({ z: z, L: L, t: t, s: s, sv: sv, a: a });
        if (comAt(z).x >= cx - 0.02) {
          crest = { t: t, L: L, z: z, s: s, sv: sv };
          break;
        }
        if (z >= 0.998) break;
      }
      if (!crest) return { fail: "short", z: z, t: t, L: L, com: comAt(z).x, trail: trail, sMin: sMin, sMax: sMax };
      /* Catch: the pose freezes at the crest and the front wheel balances what is
         left. Rigid pendulum about the contact, base acceleration limited to aCap,
         hard stops at the slot edges. */
      crest.crested = true;
      const iz = Math.min(nCoast, Math.round(crest.z * nCoast));
      const cpose = coast[iz];
      const Ic = inertiaAbout(cpose, cx, cy);
      let rx = (cpose.com.x - cx) * INCH;
      let ry = (cpose.com.y - cy) * INCH;
      let tSettle = 0;
      const settle = [];
      let settled = false;
      const leftover = -crest.L + mTot * ry * crest.sv; /* forward momentum once the base is still */
      for (let n = 0; n < 1000; n++) {
        const w = -L / Ic; /* forward pitch rate */
        const vrel = ry * w;
        if (rx > 0.08) return { fail: "overshoot", crested: true, z: crest.z, t: t + tSettle, L: L, com: cx + rx / INCH, trail: trail, settle: settle, sMax: sMax, sMin: sMin, crest: crest, leftover: leftover };
        if (rx < -0.08) return { fail: "fell back", crested: true, z: crest.z, t: t + tSettle, L: L, com: cx + rx / INCH, trail: trail, settle: settle, sMax: sMax, sMin: sMin, crest: crest, leftover: leftover };
        const a = useCatch ? baseCmd(rx, vrel, s, sv) : 0;
        L += (-mTot * g * rx + mTot * ry * a) * dt;
        const w2 = -L / Ic;
        const nrx = rx + ry * w2 * dt;
        const nry = ry - rx * w2 * dt;
        rx = nrx;
        ry = nry;
        sv += a * dt;
        s += sv * dt;
        tSettle += dt;
        sMin = Math.min(sMin, s);
        sMax = Math.max(sMax, s);
        aPeak = Math.max(aPeak, Math.abs(a));
        if (n % 4 === 0) settle.push({ t: tSettle, s: s, sv: sv, a: a, rx: rx, L: L });
        if (Math.abs(sv) < 0.03 && Math.abs(L) < 0.02 && Math.abs(rx) < 0.004) { settled = true; break; }
      }
      if (!settled) return { fail: "never settled", crested: true, z: crest.z, t: t + tSettle, L: L, com: cx + rx / INCH, trail: trail, settle: settle, sMax: sMax, sMin: sMin, crest: crest, leftover: leftover };
      return {
        fail: "",
        crested: true,
        crest: crest,
        leftover: leftover,
        z: crest.z,
        t: t,
        L: L,
        s: s,
        sv: sv,
        trail: trail,
        settle: settle,
        settleT: tSettle,
        sEnd: s,
        sMin: sMin,
        sMax: sMax,
        aPeak: aPeak
      };
    }

    /* Least forward momentum at liftoff that still crests: ballistic, and with the catch. */
    function crests(L0, useCatch, init) { return !!runCoast(L0, useCatch, init).crested; }
    function needFor(useCatch) {
      if (crests(0, useCatch)) return 0;
      let lo = 0;
      let hi = -3.0;
      if (!crests(hi, useCatch)) return hi;
      for (let k = 0; k < 16; k++) {
        const mid = (lo + hi) / 2;
        if (!crests(mid, useCatch)) lo = mid;
        else hi = mid;
      }
      return hi;
    }
    const LneedBallistic = needFor(false);
    const LneedCatch = needFor(true);
    /* Most forward momentum the slot can still absorb after the crest. Above this the
       front wheel runs out of forward room and the mass goes over. */
    function maxFor() {
      let lo = LneedCatch;
      let hi = -3.0;
      if (!runCoast(hi, true).fail) return hi;
      if (runCoast(lo, true).fail) return lo;
      for (let k = 0; k < 16; k++) {
        const mid = (lo + hi) / 2;
        if (runCoast(mid, true).fail) hi = mid;
        else lo = mid;
      }
      return lo;
    }
    const Lmax = maxFor();
    const flown = runCoast(Llift, true);
    const ballistic = runCoast(Llift, false);

    const coastT = [{ z: 0, t: 0, L: Llift, s: 0, sv: 0, a: 0 }];
    if (flown.trail) {
      for (let i = 0; i < flown.trail.length; i++) coastT.push(flown.trail[i]);
    }
    function coastState(z) {
      let a = coastT[0];
      let b = coastT[coastT.length - 1];
      for (let i = 1; i < coastT.length; i++) {
        if (coastT[i].z >= z) { b = coastT[i]; a = coastT[i - 1]; break; }
      }
      const span = b.z - a.z || 1;
      const u = clamp((z - a.z) / span, 0, 1);
      return { t: lerp(a.t, b.t, u), L: lerp(a.L, b.L, u), s: lerp(a.s, b.s, u), sv: lerp(a.sv, b.sv, u), a: u < 0.5 ? a.a : b.a };
    }
    /* Minimum momentum still required at this z, given where the base already is. */
    const needAt = [];
    for (let i = 0; i <= 8; i++) {
      const z0 = i / 8 * 0.9;
      const st = coastState(z0);
      const init = { z: z0, s: st.s, sv: st.sv, held: st.s <= -catchRoom * INCH + 1e-4 && Math.abs(st.sv) < 0.02 };
      let val = 0;
      if (!crests(0, true, init)) {
        let nlo = 0;
        let nhi = -2.6;
        for (let k = 0; k < 12; k++) {
          const mid = (nlo + nhi) / 2;
          if (!crests(mid, true, init)) nlo = mid;
          else nhi = mid;
        }
        val = nhi;
      }
      needAt.push({ z: z0, L: val });
    }
    function needL(z) {
      let a = needAt[0];
      let b = needAt[needAt.length - 1];
      for (let i = 1; i < needAt.length; i++) {
        if (needAt[i].z >= z) { b = needAt[i]; a = needAt[i - 1]; break; }
      }
      const u = clamp((z - a.z) / ((b.z - a.z) || 1), 0, 1);
      return lerp(a.L, b.L, u);
    }

    const crestZ = flown.fail ? 1 : flown.crest.z;
    const failed = !!flown.fail;
    /* 7a. Flight, sampled by time from the trail so the animation runs at the real rate. */
    const tFlight = failed ? (flown.t || 0.3) : flown.crest.t;
    const nFlight = 40;
    let prevZ = 0;
    for (let i = 1; i <= nFlight; i++) {
      const tt = tFlight * i / nFlight;
      /* trail lookup by time */
      let a = coastT[0];
      let b = coastT[coastT.length - 1];
      for (let k = 1; k < coastT.length; k++) {
        if (coastT[k].t >= tt) { b = coastT[k]; a = coastT[k - 1]; break; }
      }
      const u = b.t === a.t ? 1 : clamp((tt - a.t) / (b.t - a.t), 0, 1);
      const st = { z: lerp(a.z, b.z, u), L: lerp(a.L, b.L, u), s: lerp(a.s, b.s, u), sv: lerp(a.sv, b.sv, u), a: u < 0.5 ? a.a : b.a };
      const z = i === nFlight && !failed ? crestZ : Math.max(prevZ, Math.min(st.z, 0.999));
      const iz = Math.min(nCoast - 1, Math.floor(z * nCoast));
      const c0 = coast[iz];
      const c1 = coast[Math.min(nCoast, iz + 1)];
      const uz = z * nCoast - iz;
      /* pose at fractional z: interpolate joint angles between path samples */
      const hx = lerp(c0.hx, c1.hx, uz);
      const hy = lerp(c0.hy, c1.hy, uz);
      const solZ = solveLegs(hx, hy,
        lerp(c0.pA.axle.x, c1.pA.axle.x, uz), lerp(c0.pA.axle.y, c1.pA.axle.y, uz),
        dest.x, dest.y, { aTh: c0.a.theta, aPh: c0.a.phi, bTh: c0.b.theta, bPh: c0.b.phi });
      solZ.hx = hx;
      solZ.hy = hy;
      const J = Jat(iz);
      const zdot = J ? st.L / J : 0;
      const cvx = (c1.com.x - c0.com.x) * nCoast * zdot;
      const cvy = (c1.com.y - c0.com.y) * nCoast * zdot;
      const behind = cx - solZ.com.x;
      const need = -needL(z);
      const have = -st.L;
      const margin = have - need;
      const sIn = st.s / INCH;
      const dyn = {
        throwing: true,
        behind: behind,
        vx: cvx,
        vy: cvy,
        speed: Math.hypot(cvx, cvy),
        forwardL: have,
        inertia: inertiaAbout(solZ, cx, cy),
        need: need,
        margin: margin,
        rearN: 0,
        wheelTau: Math.abs(st.a) * mTot * R * INCH,
        ok: margin > -0.005,
        note: "Rear wheel is off. Forward angular momentum " + have.toFixed(2) + " kg·m²/s; " +
          Math.max(0, need).toFixed(2) + " still needed from here" +
          (sIn < -0.05 ? " with the front wheel rolled back " + (-sIn).toFixed(2) + " in." : ".") +
          " Margin " + margin.toFixed(2) + "."
      };
      pushSample(tFlight / nFlight, "Throw the mass over the front wheel", solZ, { dyn: dyn, supportX: cx, base: sIn, baseV: st.sv, baseA: st.a, lat: -1 });
      prevZ = z;
    }
    /* 7b. Catch. Pose frozen at the crest; the front wheel balances the leftover. */
    const izc = Math.min(nCoast, Math.round(crestZ * nCoast));
    const crestPose = coast[izc];
    let sAfterCatch = failed ? 0 : flown.crest.s;
    if (!failed && flown.settle.length) {
      const settle = flown.settle;
      const nCatch = Math.max(4, Math.round(flown.settleT / 0.02));
      let tPrev = 0;
      for (let i = 1; i <= nCatch; i++) {
        const tt = flown.settleT * i / nCatch;
        let pt = settle[settle.length - 1];
        for (let k = 0; k < settle.length; k++) { if (settle[k].t >= tt) { pt = settle[k]; break; } }
        const have = -pt.L;
        const dyn = {
          throwing: true,
          behind: -pt.rx / INCH,
          vx: 0,
          vy: 0,
          speed: 0,
          forwardL: have,
          inertia: inertiaAbout(crestPose, cx, cy),
          need: 0,
          margin: have,
          rearN: 0,
          wheelTau: Math.abs(pt.a) * mTot * R * INCH,
          ok: true,
          note: "Over the front contact. " + flown.leftover.toFixed(2) + " kg·m²/s arrived; the front wheel is rolling to absorb it. " +
            (pt.s >= 0 ? "+" : "") + (pt.s / INCH).toFixed(2) + " in from where it landed."
        };
        pushSample(tt - tPrev, "Catch on the front wheel", crestPose, { dyn: dyn, supportX: cx, base: pt.s / INCH, baseV: pt.sv, baseA: pt.a, lat: -1 });
        tPrev = tt;
      }
      sAfterCatch = settle[settle.length - 1].s;
    }
    /* 7c. Walk the body forward and up, and swing the trailing foot forward, from the
       crest pose to the stand-up start. Actuator work on its own clock; the wheel holds. */
    const nWalk = 16;
    const tWalk = 0.35;
    const walkTo = { hx: 11.1 + P.landErr, hy: 19.55, ax: 5.2, ay: 14.6 };
    let solWalk = null;
    for (let i = 1; i <= nWalk; i++) {
      const u = i / nWalk;
      /* Rise first: the body's nose clears the tread above only once the hip is past ~19". */
      const hy = lerp(crestPose.hy, walkTo.hy, smooth(Math.min(1, u / 0.6)));
      const hx = lerp(crestPose.hx, walkTo.hx, smooth(Math.max(0, (u - 0.55) / 0.45)));
      const ax = lerp(crestPose.pA.axle.x, walkTo.ax, smooth(u));
      const ay = lerp(crestPose.pA.axle.y, walkTo.ay, smooth(u));
      const solZ = solveLegs(hx, hy, ax, ay, dest.x, dest.y, hint);
      solZ.hx = hx;
      solZ.hy = hy;
      solWalk = solZ;
      const behind = cx - solZ.com.x;
      const dyn = {
        throwing: false,
        behind: behind,
        vx: 0,
        vy: 0,
        speed: 0,
        forwardL: 0,
        inertia: inertiaAbout(solZ, cx, cy),
        need: 0,
        margin: null,
        rearN: 0,
        wheelTau: null,
        ok: Math.abs(behind) < 0.6,
        note: "Caught. The hip and knee walk the body forward over the wheel; " +
          (behind < -0.15 ? "the mass leans " + (-behind).toFixed(1) + " in ahead, which the wheel holds." : "the mass stays over the contact.")
      };
      pushSample(tWalk / nWalk, "Mass is over the front wheel", solZ, { dyn: dyn, supportX: cx, base: sAfterCatch / INCH, baseV: 0, baseA: 0, lat: -1 });
    }

    const liftoffBehind = cx - coast[0].com.x;
    const standFrom = solWalk || coast[nCoast];
    const footFrom = { x: standFrom.pA.axle.x, y: standFrom.pA.axle.y };
    const nStand = 36;
    const tStand = 0.75;
    const tSettle = 0.35;
    /* The front wheel drifts back to slot center over the stand-up and settle. */
    function baseDuring(tLocal) {
      const u = smooth(tLocal / (tStand + tSettle));
      return { s: lerp(sAfterCatch / INCH, 0, u), sv: 0, a: 0 };
    }
    for (let i = 1; i <= nStand; i++) {
      const q = i / nStand;
      const hy = lerp(standFrom.hy, hipHold + H, smooth(q));
      let ax;
      let ay;
      if (q < 0.5) {
        const u = smooth(q / 0.5);
        ax = lerp(footFrom.x, dest.x, u);
        ay = lerp(footFrom.y, Math.max(footFrom.y, R + H + 5.5), u);
      } else {
        const u = smooth((q - 0.5) / 0.5);
        ax = dest.x;
        ay = lerp(Math.max(footFrom.y, R + H + 5.5), dest.y, u);
      }
      let sol = holdCom(ax, ay, dest.x, dest.y, hy, cx, hint);
      if (hy < 19.3 && sol.hx > 10.02 + P.landErr) {
        sol = solveLegs(10.02 + P.landErr, hy, ax, ay, dest.x, dest.y, hint);
        sol.hx = 10.02 + P.landErr;
        sol.hy = hy;
      }
      const behind = cx - sol.com.x;
      const b = baseDuring(q * tStand);
      const dyn = {
        throwing: false,
        behind: behind,
        vx: 0,
        vy: 0,
        speed: 0,
        forwardL: 0,
        inertia: inertiaAbout(sol, cx, cy),
        need: 0,
        margin: null,
        rearN: null,
        wheelTau: Math.abs(b.a) * mTot * R * INCH,
        ok: Math.abs(behind) < 0.6,
        note: "The mass is over the front wheel, so the body can stand up and the trailing foot can come up."
      };
      pushSample(tStand / nStand, q < 0.55 ? "Stand up over the front wheel" : "Bring the trailing foot up", sol, {
        dyn: dyn,
        supportX: cx,
        base: b.s,
        baseV: b.sv,
        baseA: b.a,
        lat: -1
      });
    }

    /* Land on the exact balance pose, one step up, so the next cycle starts clean. The
       front wheel is back at slot center by the end. */
    const endSol = holdCom(dest.x, dest.y, dest.x, dest.y, hipHold + H, cx, hint);
    const nSettle = 12;
    const prev = samples[samples.length - 1].sol;
    for (let i = 1; i <= nSettle; i++) {
      const u = smooth(i / nSettle);
      const hy = lerp(prev.hy, endSol.hy, u);
      const sol = holdCom(dest.x, dest.y, dest.x, dest.y, hy, cx, hint);
      const b = baseDuring(tStand + (i / nSettle) * tSettle);
      pushSample(tSettle / nSettle, "Stand on the next step", sol, { supportX: cx, base: i === nSettle ? 0 : b.s, lat: -1 });
    }

    /* Time-proportional scrub fraction. */
    const T = samples[samples.length - 1].t;
    for (let i = 0; i < samples.length; i++) samples[i].f = samples[i].t / T;
    samples[samples.length - 1].f = 1;

    /* ---- Post-pass: lump velocities, accelerations, contact forces, joint torques. ---- */
    function worldLumps(row) {
      const p = lumpsOf(row.sol);
      const out = [];
      for (let i = 0; i < p.length; i++) out.push({ m: p[i][0], x: (p[i][1] + row.base) * INCH, y: p[i][2] * INCH });
      return out;
    }
    const W = samples.map(worldLumps);
    const n = samples.length;
    const V = [];
    for (let k = 0; k < n; k++) {
      const k0 = Math.max(0, k - 1);
      const k1 = Math.min(n - 1, k + 1);
      const dt = (samples[k1].t - samples[k0].t) || 1e-3;
      V.push(W[k].map(function (l, i) {
        return { x: (W[k1][i].x - W[k0][i].x) / dt, y: (W[k1][i].y - W[k0][i].y) / dt };
      }));
    }
    const A = [];
    for (let k = 0; k < n; k++) {
      const k0 = Math.max(0, k - 1);
      const k1 = Math.min(n - 1, k + 1);
      const dt = (samples[k1].t - samples[k0].t) || 1e-3;
      A.push(V[k].map(function (v, i) {
        return { x: (V[k1][i].x - V[k0][i].x) / dt, y: (V[k1][i].y - V[k0][i].y) / dt };
      }));
    }
    /* Light smoothing so seam spikes read as bumps, not as spec numbers. */
    const As = A.map(function (row, k) {
      return row.map(function (a, i) {
        let sx = 0;
        let sy = 0;
        let c = 0;
        for (let d = -5; d <= 5; d++) {
          const kk = k + d;
          if (kk < 0 || kk >= n) continue;
          sx += A[kk][i].x;
          sy += A[kk][i].y;
          c++;
        }
        return { x: sx / c, y: sy / c };
      });
    });
    const peaks = { aHip: 0, aKnee: 0, bHip: 0, bKnee: 0, wheel: 0, hipStatic: 0, kneeStatic: 0, roll: 0 };
    for (let k = 0; k < n; k++) {
      const row = samples[k];
      const sol = row.sol;
      const lumps = As[k];
      /* Ground must supply Σ m (a + g). */
      let Fx = 0;
      let Fy = 0;
      let Fy0 = 0;
      for (let i = 0; i < lumps.length; i++) {
        Fx += W[k][i].m * lumps[i].x;
        Fy += W[k][i].m * (lumps[i].y + g);
        Fy0 += W[k][i].m * g;
      }
      const aDown = onTread(sol.pA);
      const bDown = onTread(sol.pB);
      let FA = { x: 0, y: 0 };
      let FB = { x: 0, y: 0 };
      let FA0 = { x: 0, y: 0 };
      let FB0 = { x: 0, y: 0 };
      if (aDown && bDown) {
        if (row.split) {
          FA = { x: row.split.Fx, y: row.split.Fy };
          FB = { x: row.split.Fxf, y: row.split.Fyf };
        } else {
          const xa = sol.pA.axle.x;
          const xb = sol.pB.axle.x;
          const span = xb - xa;
          let wA = Math.abs(span) < 0.5 ? 0.5 : clamp((xb - sol.com.x) / span, 0, 1);
          FA = { x: Fx * wA, y: Fy * wA };
          FB = { x: Fx * (1 - wA), y: Fy * (1 - wA) };
        }
        const xa = sol.pA.axle.x;
        const xb = sol.pB.axle.x;
        const span = xb - xa;
        const wA0 = Math.abs(span) < 0.5 ? 0.5 : clamp((xb - sol.com.x) / span, 0, 1);
        FA0 = { x: 0, y: Fy0 * wA0 };
        FB0 = { x: 0, y: Fy0 * (1 - wA0) };
      } else if (aDown) {
        FA = { x: Fx, y: Fy };
        FA0 = { x: 0, y: Fy0 };
      } else if (bDown) {
        FB = { x: Fx, y: Fy };
        FB0 = { x: 0, y: Fy0 };
      }
      function legLoad(pose, th, ph, F, F0, kneeIdx, wheelIdx) {
        const ak = lumps[kneeIdx];
        const aw = lumps[wheelIdx];
        const Fk = { x: -M.mass.knee * ak.x, y: -M.mass.knee * (ak.y + g) };
        const Fw = { x: -M.mass.wheel * aw.x, y: -M.mass.wheel * (aw.y + g) };
        const couple = F.x * R * INCH; /* hub motor reaction on the shin */
        const dynT = legTorques(th, ph, { x: F.x + Fw.x, y: F.y + Fw.y }, Fk, couple);
        const statT = legTorques(th, ph, { x: F0.x, y: F0.y - M.mass.wheel * g }, { x: 0, y: -M.mass.knee * g }, 0);
        return { hip: dynT.hip, knee: dynT.knee, hip0: statT.hip, knee0: statT.knee, wheel: Math.abs(F.x) * R * INCH };
      }
      const tA = legLoad(sol.pA, row.aTh, row.aPh, FA, FA0, 2, 4);
      const tB = legLoad(sol.pB, row.bTh, row.bPh, FB, FB0, 3, 5);
      const baseTau = Math.abs(row.baseA) * mTot * R * INCH;
      row.tq = {
        aHip: tA.hip, aKnee: tA.knee, bHip: tB.hip, bKnee: tB.knee,
        aHip0: tA.hip0, aKnee0: tA.knee0, bHip0: tB.hip0, bKnee0: tB.knee0,
        wheel: Math.max(tA.wheel, tB.wheel, baseTau),
        FA: FA, FB: FB, aDown: aDown, bDown: bDown
      };
      /* Lateral: mass position between the wheels, and the roll moment the planted hip holds. */
      const half = M.track / 2;
      const latIn = row.lat * half; /* + toward foot A */
      let rollNm = 0;
      let rollNote = "";
      let rollIfLift = 0;
      if (aDown && !bDown) { rollNm = mTot * g * Math.abs(latIn - half) * INCH; rollNote = "held by the trailing hip"; }
      else if (bDown && !aDown) { rollNm = mTot * g * Math.abs(latIn + half) * INCH; rollNote = "held by the leading hip"; }
      else if (aDown && bDown) {
        rollNote = "both wheels down";
        /* what the leading hip would have to hold if the trailing wheel unloaded now */
        rollIfLift = mTot * g * Math.abs(latIn + half) * INCH;
        if (row.phase === "Balance on one foot" || row.phase === "Stand on the next step") rollIfLift = mTot * g * Math.abs(latIn - (row.lat >= 0 ? half : -half)) * INCH;
      }
      row.lateral = { in: latIn, rollNm: rollNm, rollIfLift: rollIfLift, note: rollNote };
      /* Peaks skip the two samples either side of a phase seam: the hand-drawn path
         has velocity kinks there and the finite differences spike on them. */
      let seam = false;
      for (let d = -2; d <= 2; d++) {
        const kk = k + d;
        if (kk >= 0 && kk < n && samples[kk].phase !== row.phase) seam = true;
      }
      row.seam = seam;
      if (!seam) {
        peaks.aHip = Math.max(peaks.aHip, Math.abs(tA.hip));
        peaks.aKnee = Math.max(peaks.aKnee, Math.abs(tA.knee));
        peaks.bHip = Math.max(peaks.bHip, Math.abs(tB.hip));
        peaks.bKnee = Math.max(peaks.bKnee, Math.abs(tB.knee));
        peaks.wheel = Math.max(peaks.wheel, row.tq.wheel);
      }
      peaks.hipStatic = Math.max(peaks.hipStatic, Math.abs(tA.hip0), Math.abs(tB.hip0));
      peaks.kneeStatic = Math.max(peaks.kneeStatic, Math.abs(tA.knee0), Math.abs(tB.knee0));
      peaks.roll = Math.max(peaks.roll, rollNm);
    }
    /* Where in the cycle each peak happens. */
    function peakWhereStatic(key) {
      let best = null;
      for (let k = 0; k < n; k++) {
        const v = Math.max(Math.abs(samples[k].tq["a" + key + "0"]), Math.abs(samples[k].tq["b" + key + "0"]));
        if (!best || v > best.v) best = { v: v, phase: samples[k].phase, t: samples[k].t };
      }
      return best;
    }
    function peakWhere(key) {
      let best = null;
      for (let k = 0; k < n; k++) {
        if (samples[k].seam) continue;
        const v = Math.abs(samples[k].tq[key]);
        if (!best || v > best.v) best = { v: v, phase: samples[k].phase, t: samples[k].t };
      }
      return best;
    }

    return {
      samples: samples,
      T: T,
      Llift: Llift,
      liftV: liftV,
      LneedBallistic: LneedBallistic,
      LneedCatch: LneedCatch,
      flown: flown,
      ballistic: ballistic,
      liftoffBehind: liftoffBehind,
      pushForceBad: pushForceBad,
      peakShoveTau: peakShoveTau,
      Lmax: Lmax,
      marginBallistic: (-Llift) - (-LneedBallistic),
      marginCatch: (-Llift) - (-LneedCatch),
      window: (-Lmax) - (-LneedCatch),
      headroom: (-Lmax) - (-Llift),
      aCap: aCap,
      catchRoom: catchRoom,
      roomBack: roomBack,
      roomFwd: roomFwd,
      mTot: mTot,
      peaks: peaks,
      peakWhere: { aHip: peakWhere("aHip"), aKnee: peakWhere("aKnee"), bHip: peakWhere("bHip"), bKnee: peakWhere("bKnee"),
        kneeStatic: peakWhereStatic("Knee"), hipStatic: peakWhereStatic("Hip") },
      P: { tPush: P.tPush, wheelTau: P.wheelTau, catchRoom: P.catchRoom, landErr: P.landErr, massScale: P.massScale, bodyCom: P.bodyCom, mu: P.mu }
    };
  }

  let CLIMB = buildClimb();

  function rebuild(knobs) {
    if (knobs) {
      Object.keys(knobs).forEach(function (k) {
        if (k in P && isFinite(Number(knobs[k]))) P[k] = Number(knobs[k]);
      });
    }
    setMass(P.massScale);
    CLIMB = buildClimb();
    return CLIMB;
  }

  function lerpNull(a, b, u) {
    if (a === null || a === undefined || b === null || b === undefined) return a === null || a === undefined ? b : a;
    return lerp(a, b, u);
  }

  function referenceClimbFrame(stepIndex, f) {
    f = clamp(f, 0, 1);
    const rows = CLIMB.samples;
    let hi = rows.length - 1;
    let lo = 0;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (rows[mid].f < f) lo = mid;
      else hi = mid;
    }
    const a = rows[lo];
    const b = rows[hi];
    const u = a.f === b.f ? 0 : clamp((f - a.f) / (b.f - a.f), 0, 1);
    const base = lerp(a.base, b.base, u);
    const hip = {
      x: lerp(a.sol.pA.hip.x, b.sol.pA.hip.x, u) + base,
      y: lerp(a.sol.pA.hip.y, b.sol.pA.hip.y, u)
    };
    const aTh = lerp(a.aTh, b.aTh, u);
    const aPh = lerp(a.aPh, b.aPh, u);
    const bTh = lerp(a.bTh, b.bTh, u);
    const bPh = lerp(a.bPh, b.bPh, u);
    const poseA = atHip(aTh, aPh, hip);
    const poseB = atHip(bTh, bPh, hip);
    const swingIsRight = stepIndex % 2 === 0;
    let left = swingIsRight ? poseA : poseB;
    let right = swingIsRight ? poseB : poseA;
    const ox = stepIndex * M.going;
    const oy = stepIndex * M.rise;
    function shiftPose(p) {
      return pose(
        { x: p.hip.x + ox, y: p.hip.y + oy },
        { x: p.knee.x + ox, y: p.knee.y + oy },
        { x: p.axle.x + ox, y: p.axle.y + oy },
        p.reach
      );
    }
    left = shiftPose(left);
    right = shiftPose(right);
    const com = comOf(left, right);
    const dynA = a.dyn;
    const dynB = b.dyn;
    let dyn = null;
    if (dynA || dynB) {
      const d0 = dynA || dynB;
      const d1 = dynB || dynA;
      dyn = {
        throwing: u < 0.5 ? d0.throwing : d1.throwing,
        behind: lerp(d0.behind, d1.behind, u),
        vx: lerp(d0.vx, d1.vx, u),
        vy: lerp(d0.vy, d1.vy, u),
        speed: lerp(d0.speed, d1.speed, u),
        forwardL: lerp(d0.forwardL || 0, d1.forwardL || 0, u),
        inertia: lerp(d0.inertia || 0, d1.inertia || 0, u),
        need: lerp(d0.need || 0, d1.need || 0, u),
        margin: lerpNull(d0.margin, d1.margin, u),
        rearN: lerpNull(d0.rearN, d1.rearN, u),
        wheelTau: lerpNull(d0.wheelTau, d1.wheelTau, u),
        ok: (u < 0.5 ? d0.ok : d1.ok),
        note: u < 0.5 ? d0.note : d1.note
      };
    }
    const tq = {};
    Object.keys(a.tq).forEach(function (k) {
      if (typeof a.tq[k] === "number") tq[k] = lerp(a.tq[k], b.tq[k], u);
      else tq[k] = u < 0.5 ? a.tq[k] : b.tq[k];
    });
    const latA = lerp(a.lat, b.lat, u);
    const latLeft = swingIsRight ? latA : -latA; /* +1 = fully over the left wheel */
    const phase = u < 0.5 ? a.phase : b.phase;
    return {
      phase: phase,
      t: lerp(a.t, b.t, u),
      T: CLIMB.T,
      left: left,
      right: right,
      com: com,
      supportX: lerp(a.supportX, b.supportX, u) + ox + base,
      base: base,
      baseV: lerp(a.baseV, b.baseV, u),
      baseA: lerp(a.baseA, b.baseA, u),
      landX: CLIMB.P.landErr + M.going + ox, /* where the leading wheel was set down */
      leadIsRight: swingIsRight,
      aErr: lerp(a.err, b.err, u),
      bErr: lerp(a.err, b.err, u),
      hit: poseHits(left, right),
      dyn: dyn,
      tq: tq,
      latLeft: latLeft,
      lateral: {
        rollNm: lerp(a.lateral.rollNm, b.lateral.rollNm, u),
        rollIfLift: lerp(a.lateral.rollIfLift, b.lateral.rollIfLift, u),
        note: u < 0.5 ? a.lateral.note : b.lateral.note
      },
      seam: u < 0.5 ? a.seam : b.seam,
      sample: u < 0.5 ? a : b,
      leftDown: swingIsRight ? tq.aDown : tq.bDown,
      rightDown: swingIsRight ? tq.bDown : tq.aDown,
      leftHipTau: swingIsRight ? tq.aHip : tq.bHip,
      leftKneeTau: swingIsRight ? tq.aKnee : tq.bKnee,
      rightHipTau: swingIsRight ? tq.bHip : tq.aHip,
      rightKneeTau: swingIsRight ? tq.bKnee : tq.aKnee,
      climb: CLIMB,
      leftTheta: swingIsRight ? aTh : bTh,
      leftPhi: swingIsRight ? aPh : bPh,
      rightTheta: swingIsRight ? bTh : aTh,
      rightPhi: swingIsRight ? bPh : aPh
    };
  }

  function climbFrame(stepIndex, f) {
    return projectFrame(referenceClimbFrame(stepIndex, f));
  }

  function projectFrame(reference) {
    const space = spatial.project(reference, P);
    const frame = Object.assign({}, reference, {
      reference: reference, spatial: space, left: space.legs.left, right: space.legs.right,
      com: space.com, aErr: space.legs.left.err, bErr: space.legs.right.err,
      leftTheta: deg(space.legs.left.q.hip), leftPhi: deg(space.legs.left.q.knee),
      rightTheta: deg(space.legs.right.q.hip), rightPhi: deg(space.legs.right.q.knee)
    });
    frame.hit = poseHits(frame.left, frame.right);
    if (frame.hit) space.issues.push(frame.hit + " intersects terrain in projection");
    space.valid = space.issues.length === 0;
    frame.leftDown = reference.leftDown && Math.abs(frame.left.contactError) < 0.02;
    frame.rightDown = reference.rightDown && Math.abs(frame.right.contactError) < 0.02;
    return frame;
  }

  function frontView(frame) {
    const space = frame.spatial || spatial.project(frame, P);
    const l = space.legs.left, r = space.legs.right;
    return {
      bodyLat: space.body.z, comLat: space.com.z, hipY: space.body.y,
      wheels: { left: { lat: l.axle.z, y: l.axle.y, down: frame.leftDown },
        right: { lat: r.axle.z, y: r.axle.y, down: frame.rightDown } },
      hips: { left: l.hip.z, right: r.hip.z },
      lean: { left: deg(l.q.roll), right: deg(r.q.roll) },
      overLeft: Math.abs(space.com.z - l.contact.z) <= 0.02,
      overRight: Math.abs(space.com.z - r.contact.z) <= 0.02,
      spatial: space
    };
  }

  function evaluateClimb() {
    const issues = new Set();
    let unreachableFrames = 0, maxTargetErrorIn = 0;
    for (let i = 0; i <= 200; i++) {
      const frame = climbFrame(0, i / 200);
      if (!frame.spatial.valid) unreachableFrames++;
      maxTargetErrorIn = Math.max(maxTargetErrorIn, frame.aErr, frame.bErr);
    }
    if (unreachableFrames) issues.add("Spatial reach, joint travel or terrain clearance fails");
    let wheelPeak = 0, kneePeak = 0, hipPeak = 0, contactFailures = 0;
    // Include phase seams: discontinuities are failures to fix, not loads to hide.
    CLIMB.samples.forEach(row => {
      wheelPeak = Math.max(wheelPeak, row.tq.wheel);
      kneePeak = Math.max(kneePeak, Math.abs(row.tq.aKnee), Math.abs(row.tq.bKnee));
      hipPeak = Math.max(hipPeak, Math.abs(row.tq.aHip), Math.abs(row.tq.bHip));
      for (const F of [row.tq.FA, row.tq.FB]) {
        if (F.y < -1e-8 || Math.abs(F.x) > P.mu * Math.max(0, F.y) + 1e-8) contactFailures++;
      }
    });
    if (wheelPeak > P.wheelTau) issues.add("Reference wheel demand exceeds torque limit");
    if (kneePeak > spatial.limits.tauKnee) issues.add("Reference knee demand exceeds torque limit");
    if (hipPeak > spatial.limits.tauHip) issues.add("Reference hip demand exceeds torque limit");
    if (contactFailures || CLIMB.pushForceBad.length) issues.add("Reference contact forces violate friction or unilateral contact");
    if (CLIMB.flown.fail) issues.add("Reduced momentum model fails: " + CLIMB.flown.fail);
    return { status: issues.size ? "rejected" : "unverified", issues: Array.from(issues),
      unreachableFrames, sampledFrames: 201, maxTargetErrorIn, wheelPeak, kneePeak, hipPeak, contactFailures,
      dynamicsValidated: false, note: "Spatial corrections invalidate the old planar load and momentum estimates. No validated stair controller or descent model." };
  }

  const api = {
    contactFeasible: contactFeasible,
    spatial: spatial,
    projectFrame: projectFrame,
    referenceClimbFrame: referenceClimbFrame,
    evaluateClimb: evaluateClimb,
    M: M,
    P: P,
    rad: rad,
    deg: deg,
    chain: chain,
    ik: ik,
    planted: planted,
    swing: swing,
    atHip: atHip,
    rollMomentNm: rollMomentNm,
    comOf: comOf,
    comReport: comReport,
    climbFrame: climbFrame,
    frontView: frontView,
    rebuild: rebuild,
    legTorques: legTorques,
    climb: function () { return CLIMB; },
    groundY: groundY,
    poseHits: poseHits,
    parkAxle: parkAxle,
    axleStatus: axleStatus,
    stairBoards: stairBoards
  };
  root.HuxKin = api;

  if (typeof window === "undefined" && process.env.HUX_KIN_TEST !== "0") {
    const b = planted(M.balanceTheta, M.balancePhi);
    if (Math.abs(b.hip.y - 16.8) > 1e-8) throw new Error("stance geometry");
    const report = evaluateClimb();
    console.log("kinematics loaded; stair candidate " + report.status, report);
  }
})(typeof window !== "undefined" ? window : globalThis);
