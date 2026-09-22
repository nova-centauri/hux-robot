/* Hux 3D sandbox: the robot, the world, and the controller. Meters, kilograms, seconds, radians.
   Geometry and lump masses come from kin.js (HuxKin.M), so this robot is the same one the 2D
   drawings show. Physics is Rapier: rigid bodies, revolute joints, Coulomb friction, real contacts. Every actuator is a torque with a limit, applied equal and opposite
   to the two bodies it joins. The controller only sees what the robot could sense (body attitude,
   joint angles and rates, wheel speed) plus the lump-mass model it was built with.
   Nothing here is a decision. Knobs are working assumptions and can be changed from the page. */
(function (root) {
  const IN = 0.0254;
  const G = 9.81;

  /* Working assumptions for the actuators. Not parts. */
  const KNOBS = {
    massScale: 1,      /* multiplies every lump */
    bodyCom: 0,        /* in, body lump forward (+) of the hip axes */
    mu: 0.7,           /* tire to floor friction */
    tauWheel: 3.0,     /* N·m peak per in-wheel motor (same as the stair-climb knob) */
    wheelNoLoad: 40,   /* rad/s where the in-wheel motor runs out of voltage on 4S (~3 m/s) */
    tauKnee: 12,       /* N·m peak; the stair climb says ~10.6 holding */
    tauHip: 12,        /* N·m peak, hip swing */
    tauRoll: 15,       /* N·m peak; GIM8108-class yardstick is 7.5 nominal / 22 stall */
    skid: false,       /* proposal: rear parking skid on the body centreline. Not in the docs. */
    rate: 2000,        /* Hz, physics and joint servo loops (servo drives close position at kHz) */
    balanceRate: 500   /* Hz, balance / drive loop on the flight controller */
  };

  /* ---------- small vector helpers ---------- */
  function v(x, y, z) { return { x: x, y: y, z: z }; }
  function add(a, b) { return v(a.x + b.x, a.y + b.y, a.z + b.z); }
  function sub(a, b) { return v(a.x - b.x, a.y - b.y, a.z - b.z); }
  function mul(a, s) { return v(a.x * s, a.y * s, a.z * s); }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function cross(a, b) { return v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function norm(a) { const l = len(a) || 1e-9; return mul(a, 1 / l); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function qRot(q, p) {
    /* rotate p by unit quaternion q */
    const ix = q.w * p.x + q.y * p.z - q.z * p.y;
    const iy = q.w * p.y + q.z * p.x - q.x * p.z;
    const iz = q.w * p.z + q.x * p.y - q.y * p.x;
    const iw = -q.x * p.x - q.y * p.y - q.z * p.z;
    return v(
      ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
      iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
      iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x
    );
  }
  function qAxis(axis, ang) {
    const s = Math.sin(ang / 2);
    return { x: axis.x * s, y: axis.y * s, z: axis.z * s, w: Math.cos(ang / 2) };
  }
  function qMul(a, b) {
    return {
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
      x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
      y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
      z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    };
  }
  function qConj(q) { return { x: -q.x, y: -q.y, z: -q.z, w: q.w }; }
  const X = v(1, 0, 0);
  const Y = v(0, 1, 0);
  const Z = v(0, 0, 1);

  /* ---------- the robot, in SI, from the 2D model ---------- */
  function spec(M, knobs) {
    const k = Object.assign({}, KNOBS, knobs || {});
    const ms = k.massScale;
    /* kin.js lumps: body 4.0, both hip actuators 0.8, each knee 0.25, each wheel 0.35.
       The sandbox adds the two carbon tubes per leg (~30 g each, 16 mm OD) the 2D lumps leave out. */
    const lump = { body: 4.0, hips: 0.8, knee: 0.25, wheel: 0.35 };
    const s = {
      knobs: k,
      L: M.link * IN,
      R: M.wheelR * IN,
      wheelW: M.wheelWidth * IN,
      hipLat: M.hipLateral * IN,
      wheelLat: (M.track / 2) * IN,
      bodyLen: M.bodyLength * IN,
      bodyWid: M.bodyWidth * IN,
      bodyUp: M.bodyAboveHip * IN,
      bodyDown: 1.0 * IN,
      comUp: 0.45 * M.bodyAboveHip * IN,
      comFwd: k.bodyCom * IN,
      tubeR: 0.008,
      mBody: lump.body * ms,
      mYoke: (lump.hips / 2) * ms,
      mKnee: lump.knee * ms,
      mTube: 0.03 * ms,
      mWheel: lump.wheel * ms,
      jWheel: 0.65, /* J = 0.65 m R², same estimate as leg-geometry.md */
      motorKnee: { w: M.motorKnee.w * IN, h: M.motorKnee.h * IN, t: M.motorKnee.t * IN },
      motorSwing: { w: M.motorSwing.w * IN, h: M.motorSwing.h * IN, t: M.motorSwing.t * IN },
      motorRollD: M.motorRollD * IN,
      motorRollL: M.motorRollL * IN,
      motorWheelD: M.motorWheelD * IN,
      display: { w: M.displayW * IN, h: M.displayH * IN },
      eyeD: M.eyeD * IN,
      eyeGap: M.eyeGap * IN,
      stance: M.stanceFraction,
      asOf: M.asOf
    };
    s.hMax = 2 * s.L * 0.98;
    s.hMin = 2 * s.L * 0.55;
    s.hStance = 2 * s.L * M.stanceFraction;
    s.totalKg = s.mBody + 2 * (s.mYoke + s.mKnee + 2 * s.mTube + s.mWheel);
    return s;
  }

  /** Two-link IK in the leg plane. Target axle (dx forward, dy up) from the hip.
      Knee always to the rear, as settled. Returns hip swing and knee angles about +Z,
      0 = hanging straight down, positive swings the foot forward. */
  function legIk(s, dx, dy) {
    const d = clamp(Math.hypot(dx, dy), 0.2 * s.L, 2 * s.L * 0.999);
    const th = Math.acos(d / (2 * s.L));
    const beta = Math.atan2(dx, -dy);
    return { qh: beta - th, qk: 2 * th };
  }

  /* ---------- world ---------- */
  const GROUP_WORLD = 0x0001;
  const GROUP_ROBOT = 0x0002;
  function groups(member, filter) { return (member << 16) | filter; }

  /** Build the floor and the course. Returns plain descriptors so the view can draw them. */
  function buildWorld(R, world, M) {
    const out = [];
    const rise = M.rise * IN;
    const going = M.going * IN;
    const nose = M.soffit * IN; /* 1" nosing / tread board thickness */

    function box(kind, size, pos, rot, opts) {
      const o = opts || {};
      const bd = o.dynamic ? R.RigidBodyDesc.dynamic() : R.RigidBodyDesc.fixed();
      bd.setTranslation(pos.x, pos.y, pos.z);
      if (rot) bd.setRotation(rot);
      const rb = world.createRigidBody(bd);
      const cd = R.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
        .setFriction(o.mu === undefined ? 1.0 : o.mu)
        .setFrictionCombineRule(R.CoefficientCombineRule.Min)
        .setCollisionGroups(groups(GROUP_WORLD, 0xffff));
      if (o.dynamic) cd.setMass(o.kg || 0.5);
      world.createCollider(cd, rb);
      out.push({ kind: kind, size: size, body: rb, dynamic: !!o.dynamic, label: o.label || "" });
      return rb;
    }
    function ramp(x0, x1, z, width, height, label) {
      const run = x1 - x0;
      const a = Math.atan2(height, run);
      const Lr = Math.hypot(run, height) + 0.1;
      const t = 0.08;
      const mid = v((x0 + x1) / 2, height / 2, z);
      const nrm = v(-Math.sin(a), Math.cos(a), 0);
      box("ramp", v(Lr, t, width), sub(mid, mul(nrm, t / 2)), qAxis(Z, a), { label: label });
    }

    /* Floor: 24 m square, top at y = 0. */
    box("floor", v(24, 0.2, 24), v(0, -0.1, 0), null);

    /* The design stair: 9.5" rise, 9.5" going, 1" nosing, four steps and a landing. */
    const sx = 3.0;
    const steps = 4;
    const width = 0.9;
    for (let i = 0; i < steps; i++) {
      const top = (i + 1) * rise;
      const x0 = sx + i * going;
      const depth = (steps - i) * going + 1.2;
      box("step", v(depth, top - nose, width), v(x0 + depth / 2, (top - nose) / 2, 0), null,
        { label: i === 0 ? "Design stair · 9.5\" × 9.5\"" : "" });
      /* tread board with the nosing overhang */
      box("tread", v(depth + nose, nose, width), v(x0 - nose + (depth + nose) / 2, top - nose / 2, 0), null);
    }

    /* 1:12 accessibility ramp (4.8°) up to a 12" deck, and a steeper 12° ramp. */
    const deck = 12 * IN;
    ramp(-1.0, -1.0 + deck * 12, -2.6, 1.1, deck, "1:12 ramp · 4.8°");
    box("deck", v(1.6, deck, 1.1), v(-1.0 + deck * 12 + 0.8, deck / 2, -2.6), null);
    const steep = Math.tan(12 * Math.PI / 180);
    ramp(-0.5, -0.5 + deck / steep, 2.6, 1.1, deck, "12° ramp");
    box("deck", v(1.6, deck, 1.1), v(-0.5 + deck / steep + 0.8, deck / 2, 2.6), null);

    /* Thresholds and a curb, across the path behind the start. */
    box("sill", v(0.05, 0.5 * IN, 1.6), v(-2.0, 0.25 * IN, 0), null, { label: "½\" threshold" });
    box("sill", v(0.05, 1.0 * IN, 1.6), v(-3.2, 0.5 * IN, 0), null, { label: "1\" threshold" });
    box("curb", v(0.6, 2.0 * IN, 1.6), v(-4.6, 1.0 * IN, 0), null, { label: "2\" curb" });

    /* Slick floor (wet tile, μ 0.15). */
    box("slick", v(2.0, 0.004, 2.0), v(-3.2, 0.002, -3.4), null, { mu: 0.15, label: "Wet tile · μ 0.15" });

    /* Loose crates to shove around, 20 cm, 0.4 kg. */
    const crates = [v(1.6, 0.1, 1.1), v(1.9, 0.1, 1.35), v(1.75, 0.3, 1.2), v(-1.4, 0.1, 3.6)];
    crates.forEach(function (p) { box("crate", v(0.2, 0.2, 0.2), p, null, { dynamic: true, kg: 0.4, mu: 0.6 }); });

    /* Low walls around a 16 m arena. */
    const W = 8;
    box("wall", v(2 * W, 0.3, 0.1), v(0, 0.15, W), null);
    box("wall", v(2 * W, 0.3, 0.1), v(0, 0.15, -W), null);
    box("wall", v(0.1, 0.3, 2 * W), v(W, 0.15, 0), null);
    box("wall", v(0.1, 0.3, 2 * W), v(-W, 0.15, 0), null);
    return out;
  }

  /* ---------- robot ---------- */
  function boxInertia(m, a, b, c) {
    return v(m * (b * b + c * c) / 12, m * (a * a + c * c) / 12, m * (a * a + b * b) / 12);
  }

  /** Build Hux at (x, z), facing +X, legs straight, wheels on the floor.
      Every joint starts at zero (legs hanging straight) and the controller bends it into stance. */
  function buildRobot(R, world, s, start) {
    const x0 = start.x || 0;
    const z0 = start.z || 0;
    const h = 2 * s.L;
    const yaw = start.yaw || 0;
    const qYaw = qAxis(Y, yaw);
    const hipY = s.R + h + (start.lift || 0);
    const base = v(x0, 0, z0);
    function W(p) { return add(base, qRot(qYaw, p)); }
    const robotGroups = groups(GROUP_ROBOT, 0xffff & ~GROUP_ROBOT);

    function body(pos, rot, mass, com, inertia) {
      const q = qMul(qYaw, rot || { x: 0, y: 0, z: 0, w: 1 });
      const wp = W(pos);
      const bd = R.RigidBodyDesc.dynamic()
        .setTranslation(wp.x, wp.y, wp.z)
        .setRotation(q)
        .setAdditionalMassProperties(mass, com, inertia, { x: 0, y: 0, z: 0, w: 1 })
        .setCanSleep(false);
      return world.createRigidBody(bd);
    }
    function collide(cd, rb, mu) {
      cd.setDensity(0).setCollisionGroups(robotGroups).setFriction(mu === undefined ? 0.5 : mu)
        .setFrictionCombineRule(R.CoefficientCombineRule.Min);
      return world.createCollider(cd, rb);
    }

    const parts = [];
    /* Body: the head / pack. Box from 1" below the hip axes to 6" above. */
    const bodyH = s.bodyUp + s.bodyDown;
    const trunk = body(v(0, hipY, 0), null, s.mBody, v(s.comFwd, s.comUp, 0),
      boxInertia(s.mBody, s.bodyLen, s.bodyUp, s.bodyWid));
    const trunkCol = collide(R.ColliderDesc.cuboid(s.bodyLen / 2, bodyH / 2, s.bodyWid / 2)
      .setTranslation(0, (s.bodyUp - s.bodyDown) / 2, 0), trunk);
    parts.push({ kind: "body", rb: trunk, ixx: boxInertia(s.mBody, s.bodyLen, s.bodyUp, s.bodyWid).x });
    /* Proposal only: a rear skid so PARKED has somewhere to rest (docs/research/sim-sandbox.md). */
    const skidA = v(-s.bodyLen / 2, -s.bodyDown, 0);
    const skidB = v(-0.24, -0.23, 0);
    let skid = null;
    if (s.knobs.skid) {
      const mid = mul(add(skidA, skidB), 0.5);
      const d = sub(skidB, skidA);
      const ang = Math.atan2(d.x, -d.y);
      skid = { a: skidA, b: skidB, r: 0.008 };
      collide(R.ColliderDesc.capsule(len(d) / 2, 0.008).setTranslation(mid.x, mid.y, 0)
        .setRotation(qAxis(Z, ang)), trunk);
    }

    const ik = { qh: 0, qk: 0 };
    const legs = [];
    [-1, 1].forEach(function (side) {
      const hip = v(0, hipY, side * s.hipLat);
      /* Yoke: carries the hip-swing motor, turns on the hip-roll axis. */
      const yoke = body(hip, null, s.mYoke, v(0, 0, 0), v(2e-4, 2e-4, 2e-4));
      collide(R.ColliderDesc.cuboid(s.motorSwing.w / 2, s.motorSwing.h / 2, s.motorSwing.t / 2), yoke);

      /* Upper tube with the knee actuator lumped at its lower end (as kin.js does). */
      const mU = s.mTube + s.mKnee;
      const cyU = -(s.mTube * s.L / 2 + s.mKnee * s.L) / mU;
      const dT = -s.L / 2 - cyU;
      const dK = -s.L - cyU;
      const iPerpU = s.mTube * s.L * s.L / 12 + s.mTube * dT * dT + s.mKnee * dK * dK + 1e-4;
      const upper = body(hip, qAxis(Z, ik.qh), mU, v(0, cyU, 0), v(iPerpU, 1e-4, iPerpU));
      collide(R.ColliderDesc.capsule(s.L / 2 - s.tubeR, s.tubeR).setTranslation(0, -s.L / 2, 0), upper);
      collide(R.ColliderDesc.cuboid(s.motorKnee.w / 2, s.motorKnee.h / 2, s.motorKnee.t / 2)
        .setTranslation(0, -s.L, 0), upper);

      const knee = add(hip, v(s.L * Math.sin(ik.qh), -s.L * Math.cos(ik.qh), 0));
      const qLow = ik.qh + ik.qk;
      const iPerpL = s.mTube * s.L * s.L / 12 + 1e-5;
      const lower = body(knee, qAxis(Z, qLow), s.mTube, v(0, -s.L / 2, 0), v(iPerpL, 1e-5, iPerpL));
      collide(R.ColliderDesc.capsule(s.L / 2 - s.tubeR, s.tubeR).setTranslation(0, -s.L / 2, 0), lower);

      const axle = add(knee, v(s.L * Math.sin(qLow), -s.L * Math.cos(qLow), 0));
      const dz = side * (s.wheelLat - s.hipLat);
      const wheelPos = add(axle, v(0, 0, dz));
      const iAx = s.jWheel * s.mWheel * s.R * s.R;
      const iTr = s.mWheel * (3 * s.R * s.R + s.wheelW * s.wheelW) / 12;
      const wheel = body(wheelPos, null, s.mWheel, v(0, 0, 0), v(iTr, iTr, iAx));
      /* Contact shape is a 6" sphere, drawn as a tire. Rapier's cylinder and round-cylinder
         colliders gain speed while free-rolling on a flat (0.50 → 0.62 m/s in 3 s, sim-test.js);
         a sphere rolls exactly and has the same profile in the direction of travel, so step and
         nosing contacts match. Sideways it rocks on a 3" radius instead of a ~0.6" tire crown,
         which makes one-wheel balance somewhat easier here than on the real tire. */
      const wheelCol = collide(R.ColliderDesc.ball(s.R), wheel, 1.0);
      wheelCol.setFriction(s.knobs.mu);

      /* Chain: body → yoke (roll, X) → upper (swing, Z) → lower (knee, Z) → wheel (Z).
         Impulse joints, not Rapier multibody: in rapier3d-compat 0.20 a torque added to a multibody
         link reaches the joint at about a third of its value (checked in sim-test.js). */
      const jRoll = world.createImpulseJoint(
        R.JointData.revolute(v(0, 0, side * s.hipLat), v(0, 0, 0), X), trunk, yoke, true);
      const jHip = world.createImpulseJoint(R.JointData.revolute(v(0, 0, 0), v(0, 0, 0), Z), yoke, upper, true);
      const jKnee = world.createImpulseJoint(R.JointData.revolute(v(0, -s.L, 0), v(0, 0, 0), Z), upper, lower, true);
      const jWheel = world.createImpulseJoint(R.JointData.revolute(v(0, -s.L, dz), v(0, 0, 0), Z), lower, wheel, true);
      [jRoll, jHip, jKnee, jWheel].forEach(function (j) { j.setContactsEnabled(false); });

      parts.push({ kind: "yoke", rb: yoke, side: side, ixx: 2e-4 });
      parts.push({ kind: "upper", rb: upper, side: side, ixx: iPerpU });
      parts.push({ kind: "lower", rb: lower, side: side, ixx: iPerpL });
      parts.push({ kind: "wheel", rb: wheel, side: side, ixx: iTr });
      legs.push({
        side: side,
        yoke: yoke, upper: upper, lower: lower, wheel: wheel, wheelCol: wheelCol,
        joints: {
          roll: { parent: trunk, child: yoke, axis: X },
          hip: { parent: yoke, child: upper, axis: Z },
          knee: { parent: upper, child: lower, axis: Z },
          wheel: { parent: lower, child: wheel, axis: Z }
        }
      });
    });
    return { s: s, trunk: trunk, trunkCol: trunkCol, legs: legs, parts: parts, skid: skid };
  }

  /* ---------- sensing ---------- */
  function rot(rb) { const r = rb.rotation(); return { x: r.x, y: r.y, z: r.z, w: r.w }; }
  function tr(rb) { const t = rb.translation(); return v(t.x, t.y, t.z); }
  function lv(rb) { const t = rb.linvel(); return v(t.x, t.y, t.z); }
  function av(rb) { const t = rb.angvel(); return v(t.x, t.y, t.z); }

  /** Joint angle about the parent's local axis, and the relative rate about it. */
  function jointState(j) {
    const qp = rot(j.parent);
    const qc = rot(j.child);
    const rel = qMul(qConj(qp), qc);
    const s = rel.x * j.axis.x + rel.y * j.axis.y + rel.z * j.axis.z;
    let q = 2 * Math.atan2(s, rel.w);
    if (q > Math.PI) q -= 2 * Math.PI;
    if (q < -Math.PI) q += 2 * Math.PI;
    const a = qRot(qp, j.axis);
    const rate = dot(sub(av(j.child), av(j.parent)), a);
    return { q: q, rate: rate, axisW: a };
  }

  function applyJointTorque(j, tau, axisW) {
    const t = mul(axisW, tau);
    j.child.addTorque(t, true);
    j.parent.addTorque(mul(t, -1), true);
  }

  /* ---------- LQR for the wheeled pendulum ---------- */
  /** Linear wheeled inverted pendulum, states [x, ẋ, θ, θ̇], input total wheel torque.
      m, l, I: everything above the axles. mw, Iw: the wheels on the ground. Discrete LQR by
      Riccati iteration. Rebuilt whenever the leg height (so l and I) changes. */
  function lqrGains(p, dt, Qd, Rw, P0) {
    const r = p.r;
    const a11 = p.mw + p.Iw / (r * r) + p.m;
    const a12 = p.m * p.l;
    const a22 = p.I + p.m * p.l * p.l;
    const det = a11 * a22 - a12 * a12;
    const gTh = p.m * G * p.l;
    const xddTh = (-a12 * gTh) / det;
    const thddTh = (a11 * gTh) / det;
    const xddU = (a22 / r + a12) / det;
    const thddU = -(a12 / r + a11) / det;
    const Ac = [[0, 1, 0, 0], [0, 0, xddTh, 0], [0, 0, 0, 1], [0, 0, thddTh, 0]];
    const Bc = [0, xddU, 0, thddU];
    const K = dlqr(Ac, Bc, dt, Qd, Rw, P0);
    lqrGains.lastP = dlqr.lastP;
    return K;
  }

  /** Discrete LQR for a 4-state, 1-input continuous model ẋ = Ac x + Bc u, sampled at dt. */
  function dlqr(Ac, Bc, dt, Qd, Rw, P0, maxIt) {
    const A = [];
    const B = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      A.push([0, 0, 0, 0]);
      for (let j = 0; j < 4; j++) {
        let a2 = 0;
        for (let k = 0; k < 4; k++) a2 += Ac[i][k] * Ac[k][j];
        A[i][j] = (i === j ? 1 : 0) + Ac[i][j] * dt + 0.5 * a2 * dt * dt;
      }
      let ab = 0;
      for (let k = 0; k < 4; k++) ab += Ac[i][k] * Bc[k];
      B[i] = Bc[i] * dt + 0.5 * ab * dt * dt;
    }
    /* Riccati iteration in Joseph form, which stays symmetric:
       K = (R + BᵀPB)⁻¹ BᵀPA,  P ← Q + KᵀRK + (A − BK)ᵀ P (A − BK). */
    /* Warm start from the last solution: the height moves slowly, so this converges in a few steps. */
    let P = P0 ? P0.map(function (row) { return row.slice(); })
      : [[Qd[0], 0, 0, 0], [0, Qd[1], 0, 0], [0, 0, Qd[2], 0], [0, 0, 0, Qd[3]]];
    let K = [0, 0, 0, 0];
    dlqr.converged = false;
    for (let it = 0; it < (maxIt || 40000); it++) {
      const PB = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) PB[i] += P[i][j] * B[j];
      let BPB = 0;
      for (let i = 0; i < 4; i++) BPB += B[i] * PB[i];
      const BPA = [0, 0, 0, 0];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) BPA[j] += PB[i] * A[i][j];
      K = BPA.map(function (x) { return x / (Rw + BPB); });
      const Acl = [];
      for (let i = 0; i < 4; i++) {
        Acl.push([]);
        for (let j = 0; j < 4; j++) Acl[i].push(A[i][j] - B[i] * K[j]);
      }
      const PA = [];
      for (let i = 0; i < 4; i++) {
        PA.push([0, 0, 0, 0]);
        for (let j = 0; j < 4; j++) for (let q = 0; q < 4; q++) PA[i][j] += P[i][q] * Acl[q][j];
      }
      const Pn = [];
      let delta = 0;
      for (let i = 0; i < 4; i++) {
        Pn.push([0, 0, 0, 0]);
        for (let j = 0; j < 4; j++) {
          let acc = (i === j ? Qd[i] : 0) + Rw * K[i] * K[j];
          for (let q = 0; q < 4; q++) acc += Acl[q][i] * PA[q][j];
          Pn[i][j] = acc;
        }
      }
      for (let i = 0; i < 4; i++) {
        for (let j = i; j < 4; j++) {
          const m = 0.5 * (Pn[i][j] + Pn[j][i]);
          delta = Math.max(delta, Math.abs(m - P[i][j]) / (Math.abs(m) + 1e-9));
          Pn[i][j] = Pn[j][i] = m;
        }
      }
      P = Pn;
      /* Stop on P, not K: the position gain creeps up by tiny steps for a long time. */
      dlqr.delta = delta;
      if (it > 2 && delta < 1e-10) { dlqr.converged = true; break; }
    }
    dlqr.lastP = P;
    return K;
  }

  /* ---------- controller ---------- */
  /* LQR weights: position 0.5 m, speed 0.7 m/s, lean 0.09 rad, lean rate 0.7 rad/s, torque 1 N·m. */
  const LQR_Q = [4, 2, 120, 2];
  const LQR_R = 1.0;
  /* Sideways (one wheel): leg roll 0.07 rad, its rate 1 rad/s, body-to-leg 0.45 rad, rate 3 rad/s, torque 2.2 N·m. */
  let LAT_Q = [200, 1, 5, 0.1];
  let LAT_R = 0.2;
  let KI_LAT = 4.0;
  const MODES = ["PARKED", "TWO_WHEEL", "LEFT_ONLY", "RIGHT_ONLY"];

  function Controller(robot) {
    this.robot = robot;
    this.s = robot.s;
    this.reset();
  }

  Controller.prototype.reset = function () {
    const s = this.s;
    this.mode = "TWO_WHEEL";
    this.xs = 0;
    this.xRef = 0;
    this.vRef = 0;
    this.h = 2 * s.L * 0.999; /* built straight; ramps down to the commanded height */
    this.shift = 0;
    this.gainAge = 1e9;
    this.tick = 0;
    this.plan = null;
    this.K = [0, 0, 0, 0];
    this.one = null;      /* one-leg state machine */
    this.fallen = false;
    this.estop = false;
    this.parkT = 0;
    this.rollI = 0;
    this.out = {};
  };

  /** Everything above the wheels: mass, CoM, velocity, pitch inertia about the CoM. */
  Controller.prototype.upperMass = function (fwd, up) {
    const r = this.robot;
    let m = 0;
    let c = v(0, 0, 0);
    let cv = v(0, 0, 0);
    const list = [];
    r.parts.forEach(function (p) {
      if (p.kind === "wheel") return;
      const mi = p.rb.mass();
      const wc = p.rb.worldCom();
      const pc = v(wc.x, wc.y, wc.z);
      list.push({ m: mi, p: pc, rb: p.rb });
      m += mi;
      c = add(c, mul(pc, mi));
      cv = add(cv, mul(lv(p.rb), mi));
    });
    c = mul(c, 1 / m);
    cv = mul(cv, 1 / m);
    let I = 0;
    list.forEach(function (e) {
      const d = sub(e.p, c);
      const df = dot(d, fwd);
      const du = dot(d, up);
      I += e.m * (df * df + du * du);
    });
    /* principal inertias about the lateral axis (bodies stay roughly aligned with it) */
    I += this.s.mBody * (this.s.bodyLen * this.s.bodyLen + this.s.bodyUp * this.s.bodyUp) / 12;
    return { m: m, c: c, cv: cv, I: I };
  };

  Controller.prototype.contacts = function (world) {
    const out = [];
    /* rapier3d-compat 0.20 reports the normal impulse inflated by (n + 1) / n for n solver
       iterations (checked against the robot's weight at n = 1, 4, 8 in sim-test.js). */
    const n = world.numSolverIterations;
    const dt = world.timestep * (n + 1) / n;
    this.robot.legs.forEach(function (leg) {
      let n = 0;
      let impulse = 0;
      world.contactPairsWith(leg.wheelCol, function (other) {
        world.contactPair(leg.wheelCol, other, function (manifold) {
          const k = manifold.numContacts();
          for (let i = 0; i < k; i++) {
            impulse += manifold.contactImpulse(i);
            n++;
          }
        });
      });
      out.push({ side: leg.side, n: n, force: impulse / dt });
    });
    return out;
  };

  /**
   * One physics tick. cmd: { v, yaw, height, shift, mode }.
   * v m/s forward, yaw rad/s (+ turns left), height m hip-to-axle, shift rad of hip roll.
   * The balance loop runs at balanceRate and holds its outputs; the joint servos and the wheel
   * torque limits run every tick, like a servo drive under a flight controller.
   */
  Controller.prototype.update = function (world, cmd, dt) {
    const k = this.s.knobs;
    const every = Math.max(1, Math.round(k.rate / k.balanceRate));
    /* a mode request is an event: take it on whatever tick it arrives */
    if (cmd.mode && cmd.mode !== this.mode && MODES.indexOf(cmd.mode) >= 0) this.setMode(cmd.mode);
    this.tick = (this.tick || 0) + 1;
    if (!this.plan || this.tick % every === 0) this.plan = this.balance(world, cmd, dt * every);
    return this.servo(this.plan, dt);
  };

  /** Flight-controller loop: attitude, CoM lean, LQR wheel torque, leg targets. */
  Controller.prototype.balance = function (world, cmd, dt) {
    const s = this.s;
    const r = this.robot;
    const o = this.out;

    /* Attitude from the body (IMU). */
    const qb = rot(r.trunk);
    const bx = qRot(qb, X);
    const by = qRot(qb, Y);
    const bz = qRot(qb, Z);
    const up = Y;
    let fwd = v(bx.x, 0, bx.z);
    if (len(fwd) < 0.2) fwd = v(-by.x, 0, -by.z);
    fwd = norm(fwd);
    const right = cross(fwd, up);
    const wb = av(r.trunk);
    const pitch = Math.atan2(bx.y, Math.hypot(bx.x, bx.z));
    const roll = Math.asin(clamp(-bz.y, -1, 1)); /* + = right side low */
    const tilt = Math.acos(clamp(by.y, -1, 1));

    const contacts = this.contacts(world);
    if (tilt > 1.0 && !this.parkDown) this.fallen = true;
    if (this.fallen && this.one) { this.one = null; this.mode = "TWO_WHEEL"; }

    /* Which wheels carry the balance loop. */
    const leftLeg = r.legs[0];
    const rightLeg = r.legs[1];
    let balanceOn = [leftLeg, rightLeg];
    if (this.one && this.one.phase !== "shift" && this.one.phase !== "unshift") balanceOn = [this.one.planted];

    /* Axle point and velocity. */
    let a = v(0, 0, 0);
    let va = v(0, 0, 0);
    balanceOn.forEach(function (leg) {
      a = add(a, tr(leg.wheel));
      va = add(va, lv(leg.wheel));
    });
    a = mul(a, 1 / balanceOn.length);
    va = mul(va, 1 / balanceOn.length);

    const um = this.upperMass(fwd, up);
    const rel = sub(um.c, a);
    const relF = dot(rel, fwd);
    const relU = rel.y;
    const relV = sub(um.cv, va);
    const theta = Math.atan2(relF, relU);
    const l = Math.hypot(relF, relU);
    const thetaDot = (relU * dot(relV, fwd) - relF * relV.y) / (l * l);
    const vFwd = dot(va, fwd);
    this.xs += vFwd * dt;

    /* Gains follow the leg height (l and I) and how many wheels are down. */
    this.gainAge += dt;
    const nW = balanceOn.length;
    const key = nW + ":" + Math.round(l * 200);
    if (this.gainAge > 0.25 || key !== this.gainKey) {
      this.K = lqrGains({
        m: um.m, l: l, I: um.I, r: s.R,
        mw: s.mWheel * nW, Iw: s.jWheel * s.mWheel * s.R * s.R * nW
      }, 0.01, LQR_Q, LQR_R, this.P && this.P[nW]); /* designed at 10 ms so the iteration converges */
      this.P = this.P || {};
      this.P[nW] = lqrGains.lastP;
      this.gainAge = 0;
      this.gainKey = key;
    }

    /* Drive reference: rate-limited speed, position hold, lean feed-forward. */
    const parked = this.mode === "PARKED";
    const vCmd = parked || this.one ? 0 : clamp(cmd.v || 0, -2.5, 2.5);
    const aMax = 1.2;
    const dv = clamp(vCmd - this.vRef, -aMax * dt, aMax * dt);
    const aRef = dv / dt;
    this.vRef += dv;
    /* Stall guard: never ask for more than 0.35 m/s beyond what the wheels are doing, so a
       wheel stopped against a curb does not wind the lean up until the robot falls. */
    if (vCmd > 0.05 && this.vRef > vFwd + 0.35) this.vRef = Math.max(0, vFwd + 0.35);
    if (vCmd < -0.05 && this.vRef < vFwd - 0.35) this.vRef = Math.min(0, vFwd - 0.35);
    this.xRef += this.vRef * dt;
    const xErr = clamp(this.xs - this.xRef, -0.25, 0.25);
    this.xRef = this.xs - xErr;
    let thRef = Math.atan(aRef / G);
    /* PARKED: once crouched, lean back so the robot kneels onto its knee housings when the
       wheels are cut. Leaving it balanced on free wheels would roll away on any slope. */
    if (parked && this.parkT > 0) thRef = -Math.min(0.1, this.parkT * 0.3);
    const st = [xErr, vFwd - this.vRef, theta - thRef, thetaDot];
    let tau = 0;
    for (let i = 0; i < 4; i++) tau -= this.K[i] * st[i];

    /* Yaw: differential torque. */
    const yawRate = dot(wb, up);
    const yawCmd = parked || this.one ? 0 : clamp(cmd.yaw || 0, -3, 3);
    const tauYaw = 0.35 * (yawCmd - yawRate);

    /* Height: rate limited. Roll levelling: leg length difference. */
    const hCmd = clamp(cmd.height || s.hStance, s.hMin, s.hMax);
    const hTarget = parked ? s.hMin : hCmd;
    this.h += clamp(hTarget - this.h, -0.25 * dt, 0.25 * dt);
    const rollRate = dot(wb, fwd);
    let dh = 0;
    const levelling = !parked && (!this.one || this.one.phase === "shift" || this.one.phase === "unshift");
    if (levelling) {
      /* Integral only: one metre of leg difference tilts the body ~6 rad, so any real
         proportional gain here fights the leg servos. ~0.2 s time constant. */
      this.rollI = clamp(this.rollI + (0.8 * roll + 0.02 * rollRate) * dt, -0.06, 0.06);
    } else {
      this.rollI *= 0.99;
    }
    dh = this.rollI;
    const shift = clamp(cmd.shift || 0, -0.6, 0.6);
    let legs = [{ h: this.h - dh, roll: shift }, { h: this.h + dh, roll: shift }];
    if (!this.one) this.shift = shift;

    /* One-leg modes (experimental). */
    if (this.one) {
      const res = this.oneLeg(um, fwd, right, dt, cmd, contacts);
      legs = res.legs;
      if (res.level) {
        legs[0].h -= dh;
        legs[1].h += dh;
      }
      if (res.done) this.one = null;
    }

    /* PARKED: crouch while still balancing, then cut the wheels and kneel back onto the knees. */
    let wheelsOff = false;
    if (parked) {
      if (Math.abs(this.h - s.hMin) < 0.005) this.parkT += dt;
      /* release as soon as the mass is a little behind the axles; gravity does the rest */
      if (this.parkT > 0 && theta < -0.035) this.parkDown = true;
      if (this.parkDown) wheelsOff = true;
    } else {
      this.parkT = 0;
      this.parkDown = false;
    }
    if (this.fallen || this.estop) wheelsOff = true;

    const tw = [0, 0];
    if (!wheelsOff) {
      if (nW === 2) {
        tw[0] = tau / 2 - tauYaw;
        tw[1] = tau / 2 + tauYaw;
      } else {
        tw[balanceOn[0] === leftLeg ? 0 : 1] = tau;
      }
    }

    o.mode = this.mode;
    o.phase = this.one ? this.one.phase : (parked ? (wheelsOff ? "parked" : "sitting") : "");
    o.fallen = this.fallen;
    o.estop = this.estop;
    o.theta = theta;
    o.thetaDot = thetaDot;
    o.pitch = pitch;
    o.roll = roll;
    o.speed = vFwd;
    o.vRef = this.vRef;
    o.yawRate = yawRate;
    o.h = this.h;
    o.l = l;
    o.com = um.c;
    o.axle = a;
    o.kg = um.m + 2 * s.mWheel;
    o.K = this.K.slice();
    o.contacts = contacts;
    o.fwd = fwd;
    o.oneErr = this.one ? this.one.e : 0;
    o.oneLift = this.one ? this.one.lift : 0;
    return {
      tw: tw,
      brake: parked && wheelsOff && !this.estop,
      yawShare: nW === 2 && !wheelsOff ? tauYaw : 0,
      tauBal: tau,
      legs: legs
    };
  };

  /** Servo-drive loop: joint PD and wheel torque limits, every physics tick. */
  Controller.prototype.servo = function (plan, dt) {
    const s = this.s;
    const k = s.knobs;
    const r = this.robot;
    const o = this.out;
    const sat = { wheel: false, roll: false, hip: false, knee: false };
    const lim = k.tauWheel;

    /* Balance has priority over yaw when a wheel saturates. */
    const tw = plan.tw.slice();
    if (plan.yawShare) {
      const half = plan.tauBal / 2;
      const room = Math.max(0, lim - Math.abs(half));
      const y = clamp(plan.yawShare, -room, room);
      tw[0] = half - y;
      tw[1] = half + y;
    }
    const wheelOut = [];
    r.legs.forEach(function (leg, i) {
      const js = jointState(leg.joints.wheel);
      const w = -js.rate; /* forward rolling is −Z */
      /* In-wheel motor torque-speed line: full torque at stall, none at the 4S no-load speed. */
      let cap = lim;
      /* PARKED brake: phases shorted, torque proportional to speed, no balance. */
      if (plan.brake) tw[i] = -1.0 * w;
      else if (tw[i] * w > 0) cap = lim * clamp(1 - Math.abs(w) / k.wheelNoLoad, 0, 1);
      if (Math.abs(tw[i]) > cap + 1e-6) sat.wheel = true;
      const t = clamp(tw[i], -cap, cap);
      applyJointTorque(leg.joints.wheel, -t, js.axisW);
      wheelOut.push({ tau: t, cap: cap, w: w, power: t * w });
    });

    const legOut = [];
    const limp = this.estop;
    const gains = { roll: [90, 1.5], hip: [120, 1.5], knee: [140, 1.5] };
    const caps = { roll: k.tauRoll, hip: k.tauHip, knee: k.tauKnee };
    r.legs.forEach(function (leg, i) {
      const lp = plan.legs[i];
      const ikp = legIk(s, 0, -lp.h);
      const want = { roll: lp.roll, hip: ikp.qh, knee: ikp.qk };
      const row = {};
      ["roll", "hip", "knee"].forEach(function (name) {
        const js = jointState(leg.joints[name]);
        const g = gains[name];
        let t = g[0] * (want[name] - js.q) - g[1] * js.rate;
        if (name === "roll" && lp.rollTau !== undefined) t = lp.rollTau;
        const cap = caps[name];
        if (Math.abs(t) > cap) sat[name] = true;
        t = clamp(t, -cap, cap);
        if (limp) t = 0;
        applyJointTorque(leg.joints[name], t, js.axisW);
        row[name] = { tau: t, cap: cap, q: js.q, want: want[name], power: t * js.rate };
      });
      legOut.push(row);
    });

    o.wheels = wheelOut;
    o.legs = legOut;
    o.sat = sat;
    o.power = wheelOut.reduce(function (acc, w) { return acc + Math.abs(w.power); }, 0) +
      legOut.reduce(function (acc, l) { return acc + Math.abs(l.roll.power) + Math.abs(l.hip.power) + Math.abs(l.knee.power); }, 0);
    return o;
  };

  Controller.prototype.setMode = function (m) {
    const r = this.robot;
    if (this.fallen) return;
    if (m === "LEFT_ONLY" || m === "RIGHT_ONLY") {
      if (this.one) return;
      const planted = m === "LEFT_ONLY" ? r.legs[0] : r.legs[1];
      const free = m === "LEFT_ONLY" ? r.legs[1] : r.legs[0];
      this.one = { phase: "shift", t: 0, planted: planted, free: free, gamma: this.shift || 0, lift: 0, mode: m, hold: 0, gI: 0 };
      this.mode = m;
      return;
    }
    if (this.one) {
      /* put the free wheel back down, then centre the body */
      if (this.one.phase !== "lower" && this.one.phase !== "unshift") this.one.phase = "lower";
      this.one.next = m;
      return;
    }
    this.mode = m;
  };

  /**
   * Frontal-plane model for one-wheel balance, rebuilt from where the lumps are right now.
   * Link 1 is the planted leg (wheel, lower, upper, yoke), pivoting on the tire. Link 2 is
   * everything hung from the planted hip-roll axis (body plus the free leg). q1 = planted leg
   * roll from where it is, q2 = body relative to that leg; + tips the top toward the right.
   * The tire rolls sideways as the leg tips (contact moves R·q1). Returns the linear model and
   * the gravity gradient, so the controller can find the balance point and its holding torque.
   */
  Controller.prototype.lateralModel = function (st, right) {
    const s = this.s;
    const r = this.robot;
    const wc = tr(st.planted.wheel);
    const hip = tr(st.planted.yoke);
    function proj(p, o) { const d = sub(p, o); return { z: dot(d, right), y: d.y }; }
    const byRb = new Map();
    r.parts.forEach(function (p) { byRb.set(p.rb, p); });
    const link1 = [st.planted.wheel, st.planted.lower, st.planted.upper, st.planted.yoke];
    const link2 = [r.trunk, st.free.yoke, st.free.upper, st.free.lower, st.free.wheel];
    const rh = proj(hip, wc);
    const M = [[0, 0], [0, 0]];
    const H = [[0, 0], [0, 0]];
    const gV = [0, 0];
    link1.forEach(function (rb) {
      const m = rb.mass();
      const c = proj(v(rb.worldCom().x, rb.worldCom().y, rb.worldCom().z), wc);
      const jz = s.R + c.y;
      const jy = -c.z;
      M[0][0] += m * (jz * jz + jy * jy) + byRb.get(rb).ixx;
      gV[0] += m * G * (-c.z);
      H[0][0] += m * G * (-c.y);
    });
    link2.forEach(function (rb) {
      const m = rb.mass();
      const c = proj(v(rb.worldCom().x, rb.worldCom().y, rb.worldCom().z), hip);
      const I = byRb.get(rb).ixx;
      const j1 = [s.R + rh.y + c.y, -rh.z - c.z];
      const j2 = [c.y, -c.z];
      M[0][0] += m * (j1[0] * j1[0] + j1[1] * j1[1]) + I;
      M[0][1] += m * (j1[0] * j2[0] + j1[1] * j2[1]) + I;
      M[1][1] += m * (j2[0] * j2[0] + j2[1] * j2[1]) + I;
      gV[0] += m * G * (-rh.z - c.z);
      gV[1] += m * G * (-c.z);
      H[0][0] += m * G * (-rh.y - c.y);
      H[0][1] += m * G * (-c.y);
      H[1][1] += m * G * (-c.y);
    });
    M[1][0] = M[0][1];
    H[1][0] = H[0][1];
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const Mi = [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]];
    const Aq = [
      [-(Mi[0][0] * H[0][0] + Mi[0][1] * H[1][0]), -(Mi[0][0] * H[0][1] + Mi[0][1] * H[1][1])],
      [-(Mi[1][0] * H[0][0] + Mi[1][1] * H[1][0]), -(Mi[1][0] * H[0][1] + Mi[1][1] * H[1][1])]
    ];
    return {
      Ac: [[0, 1, 0, 0], [Aq[0][0], 0, Aq[0][1], 0], [0, 0, 0, 1], [Aq[1][0], 0, Aq[1][1], 0]],
      Bc: [0, Mi[0][1], 0, Mi[1][1]],
      H: H,
      gV: gV
    };
  };

  /**
   * LEFT_ONLY / RIGHT_ONLY, best effort. Shift the mass over the planted wheel with both hip
   * rolls (both wheels down, body kept level), lift the free wheel, then balance sideways on the
   * planted tire through the planted hip roll with an LQR on the frontal-plane model. Pitch stays
   * on the planted wheel. The tire is 1.25" wide; that is all the sideways foot Hux has.
   */
  Controller.prototype.oneLeg = function (um, fwd, right, dt, cmd, contacts) {
    const st = this.one;
    st.t += dt;
    const pc = tr(st.planted.wheel);
    const e = dot(sub(um.c, pc), right);          /* + = mass right of the planted tire */
    const ev = dot(sub(um.cv, lv(st.planted.wheel)), right);
    const liftTarget = 0.06;
    const leftPlanted = st.planted === this.robot.legs[0];
    const freeLoad = contacts[leftPlanted ? 1 : 0].force;
    let hF = this.h - st.lift;
    let gP = st.gamma;
    let gF = st.gamma;
    let tauP;
    let done = false;
    const lateral = st.phase === "lift" || st.phase === "hold" || st.phase === "lower";

    if (st.phase === "shift") {
      /* + hip roll moves the wheels left under the body, so the body moves right */
      st.gamma = clamp(st.gamma - 2.0 * e * dt - 0.3 * ev * dt, -0.6, 0.6);
      gP = gF = st.gamma;
      if (Math.abs(e) < 0.012 && Math.abs(ev) < 0.05) st.hold += dt; else st.hold = 0;
      if (st.hold > 0.2) { st.phase = "lift"; st.t = 0; }
    } else if (lateral) {
      if (st.phase === "lift") {
        st.lift = Math.min(liftTarget, st.lift + 0.1 * dt);
        if (st.lift >= liftTarget) st.phase = "hold";
      } else if (st.phase === "lower") {
        st.lift = Math.max(-0.01, st.lift - 0.1 * dt);
        if (st.lift <= 0.005 && freeLoad > 8) st.phase = "unshift";
      }
      hF = this.h - st.lift;
      /* Sideways LQR through the planted hip roll, about a fixed balance point found at lift-off:
         leg roll q1 (absolute, from the tire to the hip), body-to-leg q2, and the holding torque. */
      const planted = st.planted.joints.roll;
      const js = jointState(planted);
      const wcP = tr(st.planted.wheel);
      const hipP = tr(st.planted.yoke);
      const q1 = Math.atan2(dot(sub(hipP, wcP), right), hipP.y - wcP.y);
      const q2 = -js.q;
      const q1d = dot(av(st.planted.upper), fwd);
      const q2d = -js.rate;
      st.lqrAge = (st.lqrAge || 1) + dt;
      if (!st.eq || st.lqrAge > 0.05) {
        const mdl = this.lateralModel(st, right);
        if (!st.eq) {
          const d1 = -mdl.gV[0] / mdl.H[0][0];
          st.eq = { q1: q1 + d1, q2: q2, u: mdl.gV[1] + mdl.H[1][0] * d1 };
          st.eI = 0;
        }
        const K = dlqr(mdl.Ac, mdl.Bc, 0.005, LAT_Q, LAT_R, st.P, st.K ? 3000 : 40000);
        /* keep the last good gains if the model went somewhere the solver cannot follow */
        if (K.every(isFinite) && (dlqr.converged || dlqr.delta < 1e-5)) {
          st.K = K;
          st.P = dlqr.lastP;
        }
        st.lqrAge = 0;
      }
      /* integral on the mass offset trims the model: mass right of the tire → tip the leg left */
      st.eI = clamp(st.eI + e * dt, -0.02, 0.02);
      const q1ref = st.eq.q1 - KI_LAT * st.eI;
      const x = [q1 - q1ref, q1d, q2 - st.eq.q2, q2d];
      let u = st.eq.u;
      for (let i = 0; i < 4; i++) u -= st.K[i] * x[i];
      tauP = -u; /* joint torque on the yoke is minus the torque on the body */
      st.d1 = q1 - q1ref;
    } else if (st.phase === "unshift") {
      const target = clamp(cmd.shift || 0, -0.6, 0.6);
      st.gamma += clamp(target - st.gamma, -0.4 * dt, 0.4 * dt);
      gP = gF = st.gamma;
      hF = this.h;
      if (Math.abs(st.gamma - target) < 1e-3) {
        done = true;
        this.mode = st.next || "TWO_WHEEL";
        this.shift = target;
      }
    }
    st.e = e;
    const planted = { h: this.h, roll: gP, rollTau: tauP };
    const free = { h: hF, roll: gF };
    return {
      legs: leftPlanted ? [planted, free] : [free, planted],
      level: !lateral,
      done: done
    };
  };

  /* ---------- the sandbox ---------- */
  function Sim(R, M, opts) {
    this.R = R;
    this.M = M;
    this.opts = opts || {};
    this.build(this.opts.knobs);
  }

  Sim.prototype.build = function (knobs) {
    const R = this.R;
    if (this.world) this.world.free();
    this.s = spec(this.M, Object.assign({}, this.s ? this.s.knobs : {}, knobs || {}));
    const world = new R.World(v(0, -G, 0));
    world.timestep = 1 / this.s.knobs.rate;
    world.numSolverIterations = 8;
    this.world = world;
    this.scenery = buildWorld(R, world, this.M);
    const at = this.opts.start || {};
    this.robot = buildRobot(R, world, this.s, { x: at.x || 0, z: at.z || 0, yaw: at.yaw || 0, lift: 0.001 });
    world.step(); /* settles mass properties before the first control tick */
    this.ctrl = new Controller(this.robot);
    this.t = 0;
    this.last = {};
  };

  /** Actuator limits can change live; geometry and mass rebuild the robot. */
  Sim.prototype.setKnobs = function (knobs) {
    const live = ["tauWheel", "wheelNoLoad", "tauKnee", "tauHip", "tauRoll"];
    const s = this.s;
    let rebuild = false;
    Object.keys(knobs).forEach(function (key) {
      if (s.knobs[key] === knobs[key]) return;
      if (live.indexOf(key) >= 0) s.knobs[key] = knobs[key];
      else rebuild = true;
    });
    if (knobs.mu !== undefined && !rebuild) {
      this.robot.legs.forEach(function (leg) { leg.wheelCol.setFriction(knobs.mu); });
      s.knobs.mu = knobs.mu;
    }
    if (rebuild) this.build(Object.assign({}, s.knobs, knobs));
    return rebuild;
  };

  Sim.prototype.step = function (cmd) {
    const dt = this.world.timestep;
    this.robot.parts.forEach(function (p) { p.rb.resetTorques(false); });
    this.last = this.ctrl.update(this.world, cmd || {}, dt);
    this.world.step();
    this.t += dt;
    return this.last;
  };

  /** Push the body: impulse in N·s, world frame. */
  Sim.prototype.shove = function (imp) {
    this.robot.trunk.applyImpulse(imp, true);
  };

  const api = {
    KNOBS: KNOBS,
    MODES: MODES,
    IN: IN,
    spec: spec,
    legIk: legIk,
    lqrGains: lqrGains,
    dlqr: dlqr,
    setLateralWeights: function (q, r, ki) { LAT_Q = q; LAT_R = r; if (ki !== undefined) KI_LAT = ki; },
    buildWorld: buildWorld,
    buildRobot: buildRobot,
    Controller: Controller,
    Sim: Sim,
    vec: { v: v, add: add, sub: sub, mul: mul, dot: dot, cross: cross, len: len, norm: norm, qRot: qRot, qAxis: qAxis }
  };
  root.HuxSim = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
