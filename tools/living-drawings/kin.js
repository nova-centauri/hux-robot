/* Hux working model. Inches and degrees. Source: docs/research/leg-geometry.md
   Body length and the exact body width are drawing assumptions. They are not settled. */
(function (root) {
  const M = {
    asOf: "2026-09-21",
    wheelOd: 6,
    wheelWidth: 1.25,
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
  M.balanceTheta = Math.acos(M.stanceFraction) * 180 / Math.PI;
  M.balancePhi = M.balanceTheta * 2;
  M.deepTheta = Math.acos(0.75) * 180 / Math.PI;
  M.deepPhi = M.deepTheta * 2;

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
     Total 6.0 kg, the example used everywhere else. */
  M.mass = { body: 4.0, hips: 0.8, knee: 0.25, wheel: 0.35 };

  function comOf(left, right) {
    const hip = left.hip;
    const parts = [
      [M.mass.body, hip.x, hip.y + M.bodyAboveHip * 0.45],
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
      if (Math.abs(com.x - feet[i].x) <= M.wheelR) over.push(feet[i]);
    }
    let where = "Not over a foot";
    if (!feet.length) where = "Both feet are in the air";
    else if (over.length === 2 || (feet.length === 2 && Math.abs(feet[0].x - feet[1].x) < 1 && over.length >= 1)) {
      where = "Over both feet";
    } else if (over.length === 1) {
      where = over[0].name === "left" ? "Over the left foot" : "Over the right foot";
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

  /* Stair climb. The shin cannot put the mass over the front contact while the
     rear wheel is still down. The rear leg shoves the body forward, the rear
     wheel leaves with the mass still behind that contact, and the angular
     momentum about the contact carries the mass across before the body stands up.
     A is the trailing foot. B leads. Right leads on even steps. */
  const INCH = 0.0254;
  const IBODY = M.mass.body * ((M.bodyLength * INCH) ** 2 + (M.bodyAboveHip * INCH) ** 2) / 12;

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

  function lumpsOf(sol) {
    const hip = sol.pA.hip;
    return [
      [M.mass.body, hip.x, hip.y + M.bodyAboveHip * 0.45],
      [M.mass.hips, hip.x, hip.y],
      [M.mass.knee, sol.pA.knee.x, sol.pA.knee.y],
      [M.mass.knee, sol.pB.knee.x, sol.pB.knee.y],
      [M.mass.wheel, sol.pA.axle.x, sol.pA.axle.y],
      [M.mass.wheel, sol.pB.axle.x, sol.pB.axle.y]
    ];
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
    let I = IBODY;
    for (let i = 0; i < p.length; i++) {
      const rx = (p[i][1] - cx) * INCH;
      const ry = (p[i][2] - cy) * INCH;
      I += p[i][0] * (rx * rx + ry * ry);
    }
    return I;
  }

  /* Feasible rear/front contact split for a known motion. Rear contact is
     (0-ish, 0), front contact is (G, H). Returns null when no friction cone works. */
  function contactSplit(sol0, sol1, dt, dLdt) {
    const m = sol0.com.kg;
    /* Rear contact is under that axle, on the lower tread. Front contact is
       under the leading axle. A vertical rear force pitches the body forward
       about the front contact. */
    const rxr = (sol0.pA.axle.x - M.going) * INCH;
    const Hm = M.rise * INCH;
    const rx = (sol0.com.x - M.going) * INCH;
    const tauG = -m * M.g * rx;
    const tauNeed = dLdt - tauG;
    const FyTot = m * (contactSplit.ay + M.g);
    const FxTot = m * contactSplit.ax;
    let ok = null;
    const mu = 0.7;
    const steps = 28;
    for (let k = 0; k <= steps; k++) {
      const Fy = Math.max(0, FyTot) * k / steps;
      const Fx = (tauNeed - rxr * Fy) / Hm;
      const Fyf = FyTot - Fy;
      const Fxf = FxTot - Fx;
      const rearOk = Fy <= 1.2 ? Math.abs(Fx) < 2.5 : Math.abs(Fx) <= mu * Fy + 0.8;
      const frontOk = Fyf <= 1.2 ? Math.abs(Fxf) < 2.5 : Math.abs(Fxf) <= mu * Fyf + 0.8;
      if (Fyf >= -1 && rearOk && frontOk) {
        const tr = Math.abs(Fx) * M.wheelR * INCH;
        const tf = Math.abs(Fxf) * M.wheelR * INCH;
        const score = Math.max(tr, tf);
        if (!ok || score < ok.score) ok = { Fy: Fy, Fx: Fx, Fyf: Fyf, Fxf: Fxf, tr: tr, tf: tf, score: score };
      }
    }
    return ok;
  }

  function buildClimb() {
    const R = M.wheelR;
    const G = M.going;
    const H = M.rise;
    const hipHold = R + 2 * M.link * M.stanceFraction;
    const clearY = H + R + 2;
    const home = { x: 0, y: R };
    const dest = { x: G, y: R + H };
    const hint0 = { aTh: M.balanceTheta, aPh: M.balancePhi, bTh: M.balanceTheta, bPh: M.balancePhi };
    const samples = [];
    let hint = hint0;
    let clock = 0;

    function pushSample(f, dt, phase, sol, extra) {
      clock += dt;
      const row = {
        f: f,
        t: clock,
        phase: phase,
        aTh: sol.a.theta,
        aPh: sol.a.phi,
        bTh: sol.b.theta,
        bPh: sol.b.phi,
        sol: sol,
        hit: sol.hit || "",
        err: Math.max(sol.a.err, sol.b.err),
        supportX: extra && extra.supportX !== undefined ? extra.supportX : sol.com.x
      };
      if (extra) {
        row.dyn = extra.dyn || null;
      }
      samples.push(row);
      hint = { aTh: sol.a.theta, aPh: sol.a.phi, bTh: sol.b.theta, bPh: sol.b.phi };
      return row;
    }

    function plant(f0, f1, n, dur, phase, footB, comX) {
      for (let i = 0; i <= n; i++) {
        if (i === 0 && samples.length) continue;
        const u = i / n;
        const sol = holdCom(home.x, home.y, footB.x, footB.y, hipHold, comX, hint);
        pushSample(lerp(f0, f1, u), dur / n, phase, sol, { supportX: comX });
      }
    }

    plant(0, 0.07, 16, 0.45, "Balance on one foot", home, 0);
    const nRaise = 24;
    for (let i = 1; i <= nRaise; i++) {
      const u = i / nRaise;
      const y = lerp(home.y, clearY, smooth(u));
      const sol = holdCom(home.x, home.y, home.x, y, hipHold, 0, hint);
      pushSample(lerp(0.07, 0.17, u), 0.60 / nRaise, "Raise the other foot", sol, { supportX: 0 });
    }
    const nPlace = 36;
    for (let i = 1; i <= nPlace; i++) {
      const u = i / nPlace;
      const carry = smooth(Math.min(1, u / 0.62));
      const lower = smooth(Math.max(0, (u - 0.62) / 0.38));
      const bx = lerp(home.x, dest.x, carry);
      const by = lerp(clearY, dest.y, lower);
      const sol = holdCom(home.x, home.y, bx, by, hipHold, 0, hint);
      pushSample(lerp(0.17, 0.34, u), 0.95 / nPlace, "Place the raised foot on the next step", sol, { supportX: 0 });
    }

    /* Gather: roll the rear wheel to the front of its slot, then ease the hip
       forward. Both wheels stay down, so this part can be slow. */
    const gatherFrom = { x: samples[samples.length - 1].sol.hx, y: hipHold };
    const setHip = { x: 3.74, y: 16.65 };
    const coastHip = { x: 7.40, y: 16.55 };
    const rearPark = 1.65;
    const nGather = 40;
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
      pushSample(lerp(0.34, 0.48, u), 0.85 / nGather, "Roll the rear wheel forward", sol, { supportX: sol.com.x });
    }

    /* p = (t/T)^3 over 0.42 s. That is as quick as both contact cones allow,
       and it is just enough angular momentum to crest. */
    const Tpush = 0.42;
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
    for (let i = 1; i <= nPush; i++) {
      const p = i / nPush;
      const p0 = (i - 1) / nPush;
      const dt = Math.max(1e-4, shoveTime(p) - shoveTime(p0));
      const L = angMom(pushSol[i - 1], pushSol[i], dt, G, H);
      const dL = (L - prevL) / dt;
      const cvx = (pushSol[i].com.x - pushSol[i - 1].com.x) / dt;
      const cvy = (pushSol[i].com.y - pushSol[i - 1].com.y) / dt;
      let split = null;
      if (prevV && p0 > 0.12) {
        contactSplit.ax = (cvx - prevV.x) / dt * INCH;
        contactSplit.ay = (cvy - prevV.y) / dt * INCH;
        split = contactSplit(pushSol[i - 1], pushSol[i], dt, dL);
        if (!split) pushForceBad.push({ p: p0, ax: contactSplit.ax, dL: dL, com: pushSol[i - 1].com.x });
      }
      const behind = G - pushSol[i].com.x;
      const dyn = {
        throwing: true,
        behind: behind,
        vx: cvx,
        vy: cvy,
        speed: Math.hypot(cvx, cvy),
        forwardL: -L,
        inertia: inertiaAbout(pushSol[i], G, H),
        need: null,
        margin: null,
        rearN: split ? split.Fy : null,
        wheelTau: split ? Math.max(split.tr, split.tf) : null,
        ok: true,
        note: "Both wheels are down. The rear leg is shoving the body forward. The mass is still " +
          behind.toFixed(1) + " in behind the front contact."
      };
      pushSample(lerp(0.48, 0.60, p), dt, "Shove off the rear wheel", pushSol[i], { dyn: dyn, supportX: pushSol[i].com.x });
      prevL = L;
      prevV = { x: cvx, y: cvy };
    }
    const Llift = prevL;

    /* Coast. The foot rises as the hip continues, so the rear leg does not
       have to stretch past 15 in. Time comes from angular momentum about the
       front contact: only gravity changes it once the rear wheel is off. */
    const nCoast = 80;
    const coast = [];
    for (let i = 0; i <= nCoast; i++) {
      const z = i / nCoast;
      const late = clamp((z - 0.62) / 0.38, 0, 1);
      const hy = Math.min(19.55, coastHip.y + 1.05 * z + 2.3 * late);
      let hx = Math.min(10.02, coastHip.x + 3.5 * z);
      if (hy >= 19.25) hx = Math.min(11.1, 10.02 + (hy - 19.25) * 3.6);
      const ay = Math.min(14.6, R + 10 * z);
      const ax = ay < 12 ? rearPark - 0.3 * z : lerp(rearPark, 5.2, Math.min(1, (ay - 12) / 2.6));
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
      return angMom(coast[i0], coast[i1], dz, G, H);
    }
    function coastRun(L0) {
      let z = 0;
      let L = L0;
      let t = 0;
      const dt = 0.002;
      const trail = [];
      for (let n = 0; n < 5000 && z < 0.998; n++) {
        const i = Math.min(nCoast - 1, Math.round(z * nCoast));
        const J = Jat(i);
        if (!J || Math.abs(J) < 1e-5) return { fail: "J", z: z, t: t, L: L, trail: trail };
        const zdot = L / J;
        if (n > 3 && zdot <= 0.03) {
          return { fail: "reversed", z: z, t: t, L: L, com: coast[i].com.x, trail: trail };
        }
        const i0 = Math.round(z * nCoast);
        const rx = (coast[i0].com.x - G) * INCH;
        L += (-coast[i0].com.kg * M.g * rx) * dt;
        z = Math.min(0.999, z + zdot * dt);
        t += dt;
        if (n % 2 === 0) trail.push({ z: z, L: L, t: t });
        if (coast[Math.round(z * nCoast)].com.x >= G - 0.02) {
          return { fail: "", z: z, t: t, L: L, trail: trail };
        }
      }
      return { fail: "short", z: z, t: t, L: L, com: coast[Math.round(z * nCoast)].com.x, trail: trail };
    }
    let lo = -0.15;
    let hi = -2.8;
    let edge = coastRun(hi);
    if (edge.fail) edge = { fail: edge.fail, t: 0, L: hi, trail: [] };
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2;
      const r = coastRun(mid);
      if (r.fail) lo = mid;
      else hi = mid;
    }
    const Lneed0 = hi;
    const flown = coastRun(Llift);
    const coastT = [];
    coastT.push({ z: 0, t: 0, L: Llift });
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
      return { t: lerp(a.t, b.t, u), L: lerp(a.L, b.L, u) };
    }
    /* Minimum momentum still required at this z: rerun from a grid. */
    const needAt = [];
    for (let i = 0; i <= 8; i++) {
      const z0 = i / 8 * 0.9;
      const i0 = Math.round(z0 * nCoast);
      let nlo = -0.05;
      let nhi = -2.4;
      for (let k = 0; k < 10; k++) {
        const mid = (nlo + nhi) / 2;
        /* Integrate from z0 with L=mid using the same J. */
        let z = z0;
        let L = mid;
        let fail = false;
        for (let n = 0; n < 4000 && z < 0.998; n++) {
          const ii = Math.min(nCoast - 1, Math.round(z * nCoast));
          const J = Jat(ii);
          const zdot = L / J;
          if (n > 2 && zdot <= 0.03) { fail = true; break; }
          const rx = (coast[Math.round(z * nCoast)].com.x - G) * INCH;
          L += (-coast[Math.round(z * nCoast)].com.kg * M.g * rx) * 0.002;
          z = Math.min(0.999, z + zdot * 0.002);
          if (coast[Math.round(z * nCoast)].com.x >= G - 0.02) { fail = false; break; }
        }
        if (fail || coast[Math.round(Math.min(0.999, z) * nCoast)].com.x < G - 0.05) nlo = mid;
        else nhi = mid;
      }
      needAt.push({ z: z0, L: nhi });
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

    for (let i = 1; i <= nCoast; i++) {
      const z = i / nCoast;
      const st = coastState(z);
      const c0 = coast[i - 1];
      const c1 = coast[i];
      const dz = 1 / nCoast;
      const J = Jat(Math.max(0, i - 1));
      const zdot = J ? st.L / J : 0;
      const dt = Math.abs(zdot) > 1e-3 ? dz / Math.abs(zdot) : 0.02;
      const cvx = (c1.com.x - c0.com.x) / dz * zdot;
      const cvy = (c1.com.y - c0.com.y) / dz * zdot;
      const behind = G - c1.com.x;
      const need = -needL(z);
      const have = -st.L;
      const margin = have - need;
      const over = behind <= 0.05;
      const dyn = {
        throwing: true,
        behind: behind,
        vx: cvx,
        vy: cvy,
        speed: Math.hypot(cvx, cvy),
        forwardL: have,
        inertia: inertiaAbout(c1, G, H),
        need: over ? 0 : need,
        margin: over ? have : margin,
        rearN: 0,
        wheelTau: null,
        ok: over || margin > -0.005,
        note: over
          ? "The mass is over the front contact, with " + have.toFixed(2) + " kg·m²/s of forward angular momentum left. The body can stand up."
          : "Rear wheel is off. Forward angular momentum is " + have.toFixed(2) +
            " kg·m²/s. Reaching the contact takes " + Math.max(0, need).toFixed(2) +
            ". Margin " + margin.toFixed(3) + "."
      };
      const phase = over ? "Mass is over the front wheel" : "Throw the mass over the front wheel";
      pushSample(lerp(0.60, 0.78, z), dt, phase, c1, { dyn: dyn, supportX: G });
    }

    const liftoffBehind = G - coast[0].com.x;
    const standFrom = coast[nCoast];
    const footFrom = { x: standFrom.pA.axle.x, y: standFrom.pA.axle.y };
    const nStand = 36;
    for (let i = 1; i <= nStand; i++) {
      const q = i / nStand;
      const hy = lerp(standFrom.hy, hipHold + H, smooth(q));
      let ax;
      let ay;
      if (q < 0.5) {
        const u = smooth(q / 0.5);
        ax = lerp(footFrom.x, G, u);
        ay = lerp(footFrom.y, Math.max(footFrom.y, R + H + 5.5), u);
      } else {
        const u = smooth((q - 0.5) / 0.5);
        ax = G;
        ay = lerp(Math.max(footFrom.y, R + H + 5.5), dest.y, u);
      }
      let sol = holdCom(ax, ay, dest.x, dest.y, hy, G, hint);
      if (hy < 19.3 && sol.hx > 10.02) {
        sol = solveLegs(10.02, hy, ax, ay, dest.x, dest.y, hint);
        sol.hx = 10.02;
        sol.hy = hy;
      }
      const behind = G - sol.com.x;
      const dyn = {
        throwing: false,
        behind: behind,
        vx: 0,
        vy: 0,
        speed: 0,
        forwardL: 0,
        inertia: inertiaAbout(sol, G, H),
        need: 0,
        margin: null,
        rearN: null,
        wheelTau: null,
        ok: Math.abs(behind) < 0.6,
        note: "The mass is over the front wheel, so the body can stand up and the trailing foot can come up."
      };
      pushSample(lerp(0.78, 0.94, q), 0.75 / nStand, q < 0.55 ? "Stand up over the front wheel" : "Bring the trailing foot up", sol, {
        dyn: dyn,
        supportX: G
      });
    }

    /* Land on the exact balance pose, one step up, so the next cycle starts clean. */
    const endSol = holdCom(dest.x, dest.y, dest.x, dest.y, hipHold + H, G, hint);
    const nSettle = 12;
    const prev = samples[samples.length - 1].sol;
    for (let i = 1; i <= nSettle; i++) {
      const u = smooth(i / nSettle);
      const hx = lerp(prev.hx, endSol.hx, u);
      const hy = lerp(prev.hy, endSol.hy, u);
      const sol = holdCom(dest.x, dest.y, dest.x, dest.y, hy, G, hint);
      const phase = i === nSettle ? "Stand on the next step" : "Stand on the next step";
      pushSample(lerp(0.94, 1, i / nSettle), 0.35 / nSettle, phase, sol, { supportX: G });
    }
    samples[samples.length - 1].f = 1;

    return {
      samples: samples,
      Llift: Llift,
      Lneed: Lneed0,
      flown: flown,
      liftoffBehind: liftoffBehind,
      pushForceBad: pushForceBad,
      margin: (-Llift) - (-Lneed0)
    };
  }

  const CLIMB = buildClimb();

  function climbFrame(stepIndex, f) {
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
    const hip = {
      x: lerp(a.sol.pA.hip.x, b.sol.pA.hip.x, u),
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
        margin: (d0.margin === null || d1.margin === null) ? null : lerp(d0.margin, d1.margin, u),
        rearN: d0.rearN === null || d1.rearN === null ? null : lerp(d0.rearN, d1.rearN, u),
        wheelTau: d0.wheelTau === null || d1.wheelTau === null ? null : lerp(d0.wheelTau, d1.wheelTau, u),
        ok: (u < 0.5 ? d0.ok : d1.ok),
        note: u < 0.5 ? d0.note : d1.note,
        t: lerp(a.t, b.t, u)
      };
    }
    const phase = u < 0.5 ? a.phase : b.phase;
    return {
      phase: phase,
      left: left,
      right: right,
      com: com,
      supportX: lerp(a.supportX, b.supportX, u) + ox,
      aErr: lerp(a.err, b.err, u),
      bErr: lerp(a.err, b.err, u),
      hit: poseHits(left, right),
      dyn: dyn,
      climb: CLIMB,
      leftTheta: swingIsRight ? aTh : bTh,
      leftPhi: swingIsRight ? aPh : bPh,
      rightTheta: swingIsRight ? bTh : aTh,
      rightPhi: swingIsRight ? bPh : aPh
    };
  }

  const api = {
    M: M,
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
    groundY: groundY,
    poseHits: poseHits,
    parkAxle: parkAxle,
    axleStatus: axleStatus,
    stairBoards: stairBoards
  };
  root.HuxKin = api;

  if (typeof window === "undefined" && process.env.HUX_KIN_TEST !== "0") {
    const b = planted(M.balanceTheta, M.balancePhi);
    const expectHip = M.wheelR + 2 * M.link * M.stanceFraction;
    if (Math.abs(b.axle.x) > 1e-6) throw new Error("balance axle x " + b.axle.x);
    if (Math.abs(b.hip.y - expectHip) > 0.02) {
      throw new Error("hip height " + b.hip.y);
    }
    if (Math.abs(b.poke - 2.94) > 0.08) throw new Error("poke " + b.poke);
    if (b.knee.x >= b.hip.x) throw new Error("knee should be rear of the hip");
    const sol = ik(M.going - 4, (M.rise + M.wheelR) - b.hip.y);
    if (sol.err > 0.02) throw new Error("ik err " + sol.err);
    if (sol.knee.x >= -0.3) throw new Error("reach knee should stay rear " + sol.knee.x);
    const sw = swing(sol.theta, sol.phi, 4);
    if (Math.abs(sw.axle.x - M.going) > 0.05 || Math.abs(sw.axle.y - (M.rise + M.wheelR)) > 0.05) {
      throw new Error("reach " + sw.axle.x + "," + sw.axle.y);
    }
    if (sw.knee.x >= sw.hip.x) throw new Error("swing knee not rear");
    const both = atHip(M.balanceTheta, M.balancePhi, { x: 1, y: 16 });
    if (Math.abs(both.knee.x - (1 + b.knee.x)) > 0.02) throw new Error("atHip knee");
    const report = comReport(b, b);
    if (report.where !== "Over both feet") throw new Error("balance com " + report.where);
    if (report.moment > 1.2) throw new Error("balance moment " + report.moment);
    let worst = "";
    let maxKnee = 0;
    for (let step = 0; step < 3; step++) {
      let prev = null;
      for (let i = 0; i <= 80; i++) {
        const frame = climbFrame(step, i / 80);
        if (frame.aErr > 0.08 || frame.bErr > 0.08 || frame.hit) {
          const L = frame.left;
          const R = frame.right;
          worst = "step " + step + " f " + (i / 80).toFixed(3) + " " + frame.phase +
            " err " + frame.aErr.toFixed(3) + "/" + frame.bErr.toFixed(3) + " hit " + frame.hit +
            " hip " + L.hip.x.toFixed(1) + "," + L.hip.y.toFixed(1) +
            " Lk " + L.knee.x.toFixed(1) + "," + L.knee.y.toFixed(1) +
            " Rk " + R.knee.x.toFixed(1) + "," + R.knee.y.toFixed(1) +
            " La " + L.axle.x.toFixed(1) + "," + L.axle.y.toFixed(1) +
            " Ra " + R.axle.x.toFixed(1) + "," + R.axle.y.toFixed(1);
          break;
        }
        const planted = frame.phase === "Balance on one foot" || frame.phase === "Stand on the next step";
        if (planted && Math.abs(frame.com.x - frame.supportX) > 0.45) {
          worst = "com drift " + frame.com.x.toFixed(2) + " vs " + frame.supportX.toFixed(2) + " at " + frame.phase;
          break;
        }
        if (prev) {
          const jumps = [
            dist(prev.left.knee, frame.left.knee),
            dist(prev.right.knee, frame.right.knee),
            dist(prev.left.axle, frame.left.axle),
            dist(prev.right.axle, frame.right.axle)
          ];
          for (let j = 0; j < jumps.length; j++) maxKnee = Math.max(maxKnee, jumps[j]);
          if (jumps[0] > 4 || jumps[1] > 4) {
            worst = "knee pop step " + step + " f " + (i / 80).toFixed(3) + " " + frame.phase +
              " " + jumps[0].toFixed(2) + "/" + jumps[1].toFixed(2);
            break;
          }
        }
        prev = frame;
      }
      if (worst) break;
    }
    if (worst) throw new Error(worst);
    const end0 = climbFrame(0, 1);
    const start1 = climbFrame(1, 0);
    if (Math.abs(end0.left.axle.x - start1.left.axle.x) > 0.15) throw new Error("cycle seam x");
    if (Math.abs(end0.right.axle.x - start1.right.axle.x) > 0.15) throw new Error("cycle seam right");
    if (Math.abs(end0.left.hip.y - start1.left.hip.y) > 0.2) throw new Error("cycle seam hip");
    if (Math.abs(end0.left.knee.x - start1.left.knee.x) > 0.25) throw new Error("cycle seam knee");
    if (Math.abs(end0.com.y - start1.com.y) > 0.4) throw new Error("cycle seam com");
    if (end0.hit || start1.hit) throw new Error("seam hit");
    const info = CLIMB;
    if (info.flown.fail) {
      throw new Error("throw " + info.flown.fail + " L " + info.Llift.toFixed(3) +
        " z " + (info.flown.z || 0).toFixed(2) + " com " + (info.flown.com || 0).toFixed(2));
    }
    if (!(info.liftoffBehind > 1.2)) throw new Error("liftoff already over " + info.liftoffBehind.toFixed(2));
    if (!(info.margin > 0)) {
      throw new Error("throw margin " + info.margin.toFixed(3) + " have " + (-info.Llift).toFixed(3) + " need " + (-info.Lneed).toFixed(3));
    }
    if (info.pushForceBad.length > 16) throw new Error("shove forces " + JSON.stringify(info.pushForceBad[0]) + " n " + info.pushForceBad.length);
    let sawBehind = false;
    let sawOver = false;
    let stoodEarly = false;
    for (let i = 0; i <= 160; i++) {
      const frame = climbFrame(0, i / 160);
      const rear = frame.left;
      const lead = frame.right;
      if (frame.phase === "Throw the mass over the front wheel" && frame.dyn) {
        if (frame.dyn.behind > 1 && rear.axle.y > M.wheelR + 0.8 && frame.dyn.margin > 0) sawBehind = true;
        if (!(frame.dyn.margin > -0.02)) throw new Error("coast margin " + frame.dyn.margin + " at " + (i / 160).toFixed(3));
      }
      if (frame.phase === "Mass is over the front wheel" && frame.dyn && frame.dyn.behind < 0.15) sawOver = true;
      if (frame.phase === "Stand up over the front wheel" && frame.dyn && frame.dyn.behind > 0.7) stoodEarly = true;
      if (frame.phase === "Shove off the rear wheel") {
        if (rear.axle.y > M.wheelR + 0.35) throw new Error("rear wheel left during the shove");
        if (lead.contact.y < M.rise - 0.4) throw new Error("front wheel left the step");
      }
    }
    if (!sawBehind) throw new Error("never threw while behind");
    if (!sawOver) throw new Error("mass never crossed");
    if (stoodEarly) throw new Error("stood up while the mass was behind");
    console.log("kin ok", {
      maxStep: maxKnee.toFixed(2),
      com: report.where,
      balanceHip: b.hip.y.toFixed(2),
      poke: b.poke.toFixed(2),
      reachTheta: sol.theta.toFixed(1),
      reachPhi: sol.phi.toFixed(1),
      miss: sw.miss.toFixed(3),
      behind: info.liftoffBehind.toFixed(2),
      momentum: (-info.Llift).toFixed(2),
      need: (-info.Lneed).toFixed(2),
      margin: info.margin.toFixed(3),
      cone: info.pushForceBad.length,
      coast: info.flown.t.toFixed(3)
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
