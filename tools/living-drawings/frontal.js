/* Frontal-plane mechanics of standing on one wheel. Closed form, from the same lumps and
   geometry as kin.js (HuxKin.M), independent of the Rapier sandbox so the two can be checked
   against each other. SI inside; the API takes inches where the drawings do.

   The picture (looking from the front, planted wheel on the left, its contact at the origin):
     link 1  the planted leg: crown contact → axle (+ outboard spacer) → hip roll axis. Rigid in
             roll; pivots on the crown contact. Absolute roll q1 (+ tips the hip to the right).
     link 2  the trunk plus the free yoke, hung from the planted hip roll axis. q2 = body roll
             relative to the leg (+ right), driven by the planted hip roll torque τ2.
     link 3  the free leg, hung from the free hip roll axis. q3 = its roll relative to the body,
             driven by the free hip roll torque τ3. Its length d3 is the knee's business.
   Standing on one wheel is a 3-link inverted pendulum on a rolling point: q1 is unactuated, the
   two hip rolls are the only inputs. Nothing here is a decision; it is what the lumps imply.

   node frontal.js prints the study tables. */
(function (root) {
  "use strict";
  const IN = 0.0254;
  const G = 9.81;

  /* ---------- tiny dense linear algebra (n ≤ 8) ---------- */
  function zeros(n, m) { return Array.from({ length: n }, () => new Array(m).fill(0)); }
  function eye(n) { const I = zeros(n, n); for (let i = 0; i < n; i++) I[i][i] = 1; return I; }
  function mmul(A, B) {
    const n = A.length, m = B[0].length, k = B.length;
    const C = zeros(n, m);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { let s = 0; for (let q = 0; q < k; q++) s += A[i][q] * B[q][j]; C[i][j] = s; }
    return C;
  }
  function madd(A, B, s) { return A.map((r, i) => r.map((x, j) => x + (s === undefined ? 1 : s) * B[i][j])); }
  function tr(A) { return A[0].map((_, j) => A.map(r => r[j])); }
  function inv(A) {
    const n = A.length;
    const M = A.map((r, i) => r.concat(eye(n)[i]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c];
      if (Math.abs(d) < 1e-14) throw new Error("singular");
      for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
    }
    return M.map(r => r.slice(n));
  }

  /** Discrete LQR by Riccati iteration for ẋ = A x + B u sampled at dt (2nd-order hold on A). */
  function lqr(A, B, dt, Qd, Rd, maxIt) {
    const n = A.length, m = B[0].length;
    const A2 = mmul(A, A);
    const Ad = madd(madd(eye(n), A, dt), A2, 0.5 * dt * dt);
    const Bd = madd(B.map(r => r.map(x => x * dt)), mmul(A, B), 0.5 * dt * dt);
    const Q = zeros(n, n); Qd.forEach((q, i) => { Q[i][i] = q; });
    const Rm = zeros(m, m); Rd.forEach((r, i) => { Rm[i][i] = r; });
    let P = Q.map(r => r.slice());
    let K = zeros(m, n);
    let conv = false;
    for (let it = 0; it < (maxIt || 100000); it++) {
      const BtP = mmul(tr(Bd), P);
      const S = inv(madd(Rm, mmul(BtP, Bd)));
      K = mmul(S, mmul(BtP, Ad));
      const Acl = madd(Ad, mmul(Bd, K), -1);
      const Pn = madd(madd(Q, mmul(tr(K), mmul(Rm, K))), mmul(tr(Acl), mmul(P, Acl)));
      let delta = 0;
      for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
        const v = 0.5 * (Pn[i][j] + Pn[j][i]);
        delta = Math.max(delta, Math.abs(v - P[i][j]) / (Math.abs(v) + 1e-9));
        Pn[i][j] = Pn[j][i] = v;
      }
      P = Pn;
      if (it > 2 && delta < 1e-10) { conv = true; break; }
    }
    return { K: K, P: P, converged: conv };
  }

  /** Eigenvalues of a real matrix by unshifted QR iteration with Hessenberg-free brute force
      (n ≤ 8, we only want the poles roughly). Returns [{re, im}]. */
  function eig(A) {
    const n = A.length;
    let M = A.map(r => r.slice());
    for (let it = 0; it < 500; it++) {
      /* Gram–Schmidt QR */
      const Qm = zeros(n, n), Rm = zeros(n, n);
      for (let j = 0; j < n; j++) {
        let v = M.map(r => r[j]);
        for (let i = 0; i < j; i++) {
          const qi = Qm.map(r => r[i]);
          const d = v.reduce((s, x, k) => s + x * qi[k], 0);
          Rm[i][j] = d;
          v = v.map((x, k) => x - d * qi[k]);
        }
        const nv = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1e-12;
        Rm[j][j] = nv;
        for (let k = 0; k < n; k++) Qm[k][j] = v[k] / nv;
      }
      M = mmul(Rm, Qm);
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      if (i + 1 < n && Math.abs(M[i + 1][i]) > 1e-6) {
        const a = M[i][i], b = M[i][i + 1], c = M[i + 1][i], d = M[i + 1][i + 1];
        const t = (a + d) / 2, det = a * d - b * c, disc = t * t - det;
        if (disc < 0) { out.push({ re: t, im: Math.sqrt(-disc) }, { re: t, im: -Math.sqrt(-disc) }); i++; continue; }
      }
      out.push({ re: M[i][i], im: 0 });
    }
    return out;
  }

  /* ---------- the robot in the frontal plane ---------- */
  /**
   * opts (inches unless noted):
   *   M          HuxKin.M (geometry + lumps)
   *   extension  hip-to-axle as a fraction of the full leg (0.92 = the drawings' stance)
   *   hipLateral override, in
   *   comUp      body lump height above the hip axes, in (kin.js: 0.45 × bodyAboveHip)
   *   freeLen    free leg hip-to-axle, in (default: same as the planted leg)
   *   freeRoll   free leg roll relative to the body, rad (+ swings its wheel toward the planted side)
   *   massScale
   */
  function robot(opts) {
    const M = opts.M;
    const ms = opts.massScale || 1;
    const hipLat = (opts.hipLateral !== undefined ? opts.hipLateral : M.hipLateral) * IN;
    const spacer = (M.track / 2 - M.hipLateral) * IN;   /* the axle's outboard offset from the leg plane */
    const R = M.wheelR * IN;
    const rc = (M.tireCrown || M.wheelWidth / 2) * IN;
    const L = M.link * IN;
    const d = 2 * L * (opts.extension || M.stanceFraction);
    const d3 = (opts.freeLen !== undefined ? opts.freeLen * IN : d);
    const comUp = (opts.comUp !== undefined ? opts.comUp : 0.45 * M.bodyAboveHip) * IN;
    const lump = { body: 4.0 * ms, yoke: 0.4 * ms, knee: 0.25 * ms, tube: 0.03 * ms, wheel: 0.35 * ms };
    /* Each mass as a function of q = [q1, q2, q3]. Frame: contact at the origin, +z right
       (inboard for a left plant), +y up. rot(p, a) rotates p by a about the fore-aft axis
       (+ tips the top to the right). */
    function rot(p, a) { const c = Math.cos(a), s = Math.sin(a); return { z: c * p.z + s * p.y, y: -s * p.z + c * p.y }; }
    function add(a, b) { return { z: a.z + b.z, y: a.y + b.y }; }
    function points(q) {
      const q1 = q[0], q2 = q[1], q3 = q[2] !== undefined ? q[2] : (opts.freeRoll || 0);
      const out = [];
      /* link 1: the planted leg. The crown pivots about its tube centre, rc above the contact.
         Leg-frame (before rolling): axle at (spacer outboard = −z for a left plant, R − rc up)
         relative to the crown centre, hip at d above the axle, knee halfway, tubes between. */
      const pivot = { z: 0, y: rc };
      /* unrolled: the axle sits straight above its contact; the leg plane (knee, hip) is
         inboard of the wheel by the spacer, so the hip starts inboard of the contact and has
         to travel the whole half-track outboard to put the body over the wheel */
      const axleL = { z: 0, y: R - rc };
      const legZ = spacer;
      const hipL = { z: legZ, y: R - rc + d };
      const kneeL = { z: legZ, y: R - rc + d / 2 };
      function L1(p, m, name) { out.push({ m: m, p: add(pivot, rot(p, q1)), link: 1, name: name }); }
      L1(axleL, lump.wheel, "wheel");
      L1({ z: legZ, y: R - rc + d / 4 }, lump.tube, "lower tube");
      L1(kneeL, lump.knee, "knee");
      L1({ z: legZ, y: R - rc + 3 * d / 4 }, lump.tube, "upper tube");
      L1(hipL, lump.yoke, "yoke");
      const hip = add(pivot, rot(hipL, q1));
      /* link 2: trunk and the free yoke, hung from the planted hip; body roll q1 + q2 */
      const b = q1 + q2;
      const bodyC = { z: hipLat, y: comUp };
      const freeHipB = { z: 2 * hipLat, y: 0 };
      out.push({ m: lump.body, p: add(hip, rot(bodyC, b)), link: 2, name: "body" });
      out.push({ m: lump.yoke, p: add(hip, rot(freeHipB, b)), link: 2, name: "free yoke" });
      const freeHip = add(hip, rot(freeHipB, b));
      /* link 3: the free leg hanging from its hip; absolute roll q1 + q2 + q3 */
      const f = b + q3;
      function L3(p, m, name) { out.push({ m: m, p: add(freeHip, rot(p, f)), link: 3, name: name }); }
      L3({ z: 0, y: -d3 / 4 }, lump.tube, "free upper tube");
      L3({ z: 0, y: -d3 / 2 }, lump.knee, "free knee");
      L3({ z: 0, y: -3 * d3 / 4 }, lump.tube, "free lower tube");
      L3({ z: spacer, y: -d3 }, lump.wheel, "free wheel");
      return { pts: out, hip: hip, freeHip: freeHip };
    }
    function com(q) {
      const P = points(q);
      let m = 0, z = 0, y = 0;
      P.pts.forEach(e => { m += e.m; z += e.m * e.p.z; y += e.m * e.p.y; });
      return { m: m, z: z / m, y: y / m };
    }
    /** Static hold torque at the planted hip roll: the moment of links 2 + 3 about the hip
        axis (+ = the joint pushes the body up on the right). */
    function holdTorque(q) {
      const P = points(q);
      let t = 0;
      P.pts.forEach(e => { if (e.link >= 2) t += e.m * G * (e.p.z - P.hip.z); });
      return t;
    }
    /** Leg roll q1 that puts the whole-robot CoM over the contact with the body level
        (q2 = −q1) and the free leg at freeRoll relative to the body. */
    function balanceRoll(freeRoll) {
      let lo = -1.2, hi = 0.0;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const c = com([mid, -mid, freeRoll || 0]);
        if (c.z > 0) hi = mid; else lo = mid;
      }
      return (lo + hi) / 2;
    }
    /** Generalized mass matrix, gravity torque vector and its gradient at q, by finite
        differences of the point masses (each point's Jacobian ∂p/∂q). */
    function dynamics(q) {
      const n = 3;
      const h = 1e-5;
      const base = points(q).pts;
      const Jz = base.map(() => [0, 0, 0]), Jy = base.map(() => [0, 0, 0]);
      for (let k = 0; k < n; k++) {
        const qp = q.slice(); qp[k] += h;
        const qm = q.slice(); qm[k] -= h;
        const Pp = points(qp).pts, Pm = points(qm).pts;
        base.forEach((e, i) => { Jz[i][k] = (Pp[i].p.z - Pm[i].p.z) / (2 * h); Jy[i][k] = (Pp[i].p.y - Pm[i].p.y) / (2 * h); });
      }
      const Mm = zeros(n, n);
      base.forEach((e, i) => { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) Mm[a][b] += e.m * (Jz[i][a] * Jz[i][b] + Jy[i][a] * Jy[i][b]); });
      /* a little own inertia for the trunk (box) so the body is not a point */
      const Ibody = 4.0 * (opts.massScale || 1) * (Math.pow(M.bodyWidth * IN, 2) + Math.pow(M.bodyAboveHip * IN, 2)) / 12;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) Mm[a][b] += Ibody;
      /* gravity torque g(q) = ∂V/∂q, V = Σ m g y */
      function gvec(qq) {
        const gq = [0, 0, 0];
        for (let k = 0; k < n; k++) {
          const qp = qq.slice(); qp[k] += h;
          const qm = qq.slice(); qm[k] -= h;
          const Pp = points(qp).pts, Pm = points(qm).pts;
          let s = 0;
          Pp.forEach((e, i) => { s += e.m * G * (e.p.y - Pm[i].p.y) / (2 * h); });
          gq[k] = s;
        }
        return gq;
      }
      const g0 = gvec(q);
      const Hm = zeros(n, n);
      for (let k = 0; k < n; k++) {
        const qp = q.slice(); qp[k] += h;
        const qm = q.slice(); qm[k] -= h;
        const gp = gvec(qp), gm = gvec(qm);
        for (let a = 0; a < n; a++) Hm[a][k] = (gp[a] - gm[a]) / (2 * h);
      }
      return { M: Mm, g: g0, H: Hm };
    }
    /**
     * Linear model about a balanced stance. inputs: [2] planted hip only, [2, 3] both hips.
     * States [q1, q1̇, q2, q2̇, q3, q3̇]; M q̈ = −H δq + S u, where S maps joint torques to
     * generalized forces (a joint torque acts on its relative coordinate only).
     */
    function linear(freeRoll, inputs, lockFree) {
      const q1 = balanceRoll(freeRoll);
      const q = [q1, -q1, freeRoll || 0];
      const dyn = dynamics(q);
      /* lockFree: the free hip roll is a stiff position hold (as the sandbox servo is), so the
         free leg is rigid with the body and q3 drops out */
      const n = lockFree ? 2 : 3;
      const Mq = dyn.M.slice(0, n).map(r => r.slice(0, n));
      const Hq = dyn.H.slice(0, n).map(r => r.slice(0, n));
      const Mi = inv(Mq);
      const A = zeros(2 * n, 2 * n);
      const ins = (inputs || [2]).filter(j => j <= n);
      const B = zeros(2 * n, ins.length);
      const Aq = mmul(Mi, Hq).map(r => r.map(x => -x));
      for (let i = 0; i < n; i++) {
        A[2 * i][2 * i + 1] = 1;
        for (let j = 0; j < n; j++) A[2 * i + 1][2 * j] = Aq[i][j];
        ins.forEach((jn, k) => { B[2 * i + 1][k] = Mi[i][jn - 1]; });
      }
      return { q: q, A: A, B: B, dyn: dyn, M: Mq, H: Hq, hold: holdTorque(q), com: com(q), inputs: ins, n: n };
    }
    /** Cheap-control LQR (the least torque that stabilises) and the linear response to a CoM
        error of `err` metres: peak joint swings and torques. */
    function response(freeRoll, inputs, err, weights, lockFree) {
      const lin = linear(freeRoll, inputs, lockFree);
      const n = lin.A.length;
      const w = weights || { Q: [100, 2, 100, 2, 100, 2].slice(0, n), R: 1000 };
      const Rd = lin.inputs.map(() => w.R);
      const K = lqr(lin.A, lin.B, 0.002, w.Q, Rd, 200000);
      const Acl = madd(lin.A, mmul(lin.B, K.K), -1);
      /* an error of `err` at the CoM height is a leg lean of err / y_com */
      let x = new Array(n).fill(0);
      x[0] = err / lin.com.y;
      const dt = 0.0005;
      const peak = { q1: 0, q2: 0, q3: 0, u: lin.inputs.map(() => 0), settle: null };
      for (let t = 0; t < 4; t += dt) {
        const u = K.K.map(r => -r.reduce((s, k, j) => s + k * x[j], 0));
        u.forEach((v, i) => { peak.u[i] = Math.max(peak.u[i], Math.abs(v)); });
        const xd = lin.A.map((r, i) => r.reduce((s, a, j) => s + a * x[j], 0) + lin.B[i].reduce((s, b, j) => s + b * u[j], 0));
        x = x.map((v, i) => v + xd[i] * dt);
        peak.q1 = Math.max(peak.q1, Math.abs(x[0]));
        peak.q2 = Math.max(peak.q2, Math.abs(x[2]));
        peak.q3 = Math.max(peak.q3, Math.abs(x[4] || 0));
        if (peak.settle === null && t > 0.2 && Math.abs(x[0]) < 0.1 * err / lin.com.y && Math.abs(x[1]) < 0.02) peak.settle = t;
      }
      /* unstable poles: sqrt of the positive eigenvalues of −M⁻¹H (real: M⁻¹H is similar to a
         symmetric matrix), which the plain QR handles */
      const Aq = mmul(inv(lin.M), lin.H).map(r => r.map(x => -x));
      const poles = eig(Aq).filter(p => p.re > 1e-6).map(p => Math.sqrt(p.re)).sort((a, b) => b - a);
      return { lin: lin, K: K.K, converged: K.converged, peak: peak, unstablePoles: poles };
    }
    return { points: points, com: com, holdTorque: holdTorque, balanceRoll: balanceRoll, dynamics: dynamics, linear: linear, response: response,
      geometry: { hipLat: hipLat, spacer: spacer, R: R, rc: rc, d: d, d3: d3, comUp: comUp } };
  }

  const api = { robot: robot, lqr: lqr, eig: eig, inv: inv, IN: IN };
  root.HuxFrontal = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof require !== "undefined" && require.main === module) {
    process.env.HUX_KIN_TEST = "0";
    require("./kin.js");
    const M = globalThis.HuxKin.M;
    const deg = r => (r * 180 / Math.PI).toFixed(1);
    function row(label, o) {
      const r = robot(Object.assign({ M: M }, o.opts || {}));
      const res = r.response(o.freeRoll || 0, o.inputs || [2], 0.010, o.weights, o.lock);
      const lin = res.lin;
      console.log([label.padEnd(44),
        ("γ " + deg(-lin.q[0]) + "°").padEnd(9),
        ("hold " + lin.hold.toFixed(1) + " N·m").padEnd(14),
        ("poles " + res.unstablePoles.map(p => p.toFixed(1)).join("/")).padEnd(16),
        ("body swing " + deg(res.peak.q2) + "°").padEnd(18),
        ("free swing " + deg(res.peak.q3) + "°").padEnd(18),
        ("τ dyn " + res.peak.u.map(u => u.toFixed(1)).join("/") + " N·m").padEnd(20),
        "settle " + (res.peak.settle === null ? ">4 s" : res.peak.settle.toFixed(2) + " s")].join(" "));
      return res;
    }
    console.log("Frontal-plane one-wheel stance, linear response to a 10 mm CoM error (cheap-control LQR)\n");
    const A = row("as drawn, planted hip only, free hip locked", { lock: true });
    console.log("   M", JSON.stringify(A.lin.M.map(r => r.map(x => +x.toFixed(3)))), "H", JSON.stringify(A.lin.H.map(r => r.map(x => +x.toFixed(2)))), "reaction ratio M00/M01", (A.lin.M[0][0] / A.lin.M[0][1]).toFixed(1));
    row("as drawn, both hips active", { inputs: [2, 3] });
    row("free leg tucked to 7\" (knee folded), locked", { lock: true, opts: { freeLen: 7 } });
    row("free leg tucked to 7\", both hips", { inputs: [2, 3], opts: { freeLen: 7 } });
    const Bc = row("body CoM 5\" above hips, locked", { lock: true, opts: { comUp: 5 } });
    console.log("   reaction ratio M00/M01", (Bc.lin.M[0][0] / Bc.lin.M[0][1]).toFixed(1));
    row("body CoM 5\" above hips, both hips", { inputs: [2, 3], opts: { comUp: 5 } });
    row("hips at 3.5\", locked", { lock: true, opts: { hipLateral: 3.5 } });
    row("hips at 3.5\", both hips", { inputs: [2, 3], opts: { hipLateral: 3.5 } });
    row("hips 3.5\" + CoM 5\" + tuck, both hips", { inputs: [2, 3], opts: { hipLateral: 3.5, comUp: 5, freeLen: 7 } });
    row("75% ride height, locked", { lock: true, opts: { extension: 0.75 } });
    row("mass ×1.5 (9 kg), locked", { lock: true, opts: { massScale: 1.5 } });
    console.log("\nStatic shift geometry (body level, free leg hanging), as drawn:");
    const r0 = robot({ M: M });
    [0.75, 0.85, 0.92].forEach(ext => {
      const r = robot({ M: M, extension: ext });
      const g = r.balanceRoll(0);
      const q = [g, -g, 0];
      const c = r.com(q);
      console.log(`  extension ${ext}: leg roll ${deg(-g)}°, hip ${(c.y * 1000).toFixed(0)} mm CoM height, hold ${r.holdTorque(q).toFixed(2)} N·m, hip drops ${((r.geometry.d + r.geometry.R) * (1 - Math.cos(g)) * 1000).toFixed(0)} mm vs upright`);
    });
    console.log("\nHold torque vs hip lateral offset (92% stance, free leg hanging):");
    [2, 3, 3.5, 4, 4.5, 5.4].forEach(hl => {
      const r = robot({ M: M, hipLateral: hl });
      const g = r.balanceRoll(0);
      console.log(`  hips at ${hl}": leg roll ${deg(-g)}°, hold ${r.holdTorque([g, -g, 0]).toFixed(2)} N·m`);
    });
    console.log("\nFree leg adducted (rolled toward the planted side, wheel swung clear fore/aft), as drawn:");
    [0, 0.3, 0.6].forEach(fr => {
      const g = r0.balanceRoll(fr);
      console.log(`  free roll ${deg(fr)}°: leg roll ${deg(-g)}°, hold ${r0.holdTorque([g, -g, fr]).toFixed(2)} N·m`);
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
