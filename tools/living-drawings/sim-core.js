/* Hux 3D sandbox: the robot, the world, and the controller. Meters, kilograms, seconds, radians.
   Geometry and lump masses come from kin.js (HuxKin.M), so this robot is the same one the 2D
   drawings show. Physics is Rapier: rigid bodies, revolute joints, Coulomb friction, real contacts. Every actuator is a torque with a limit, applied equal and opposite
   to the two bodies it joins. The controller uses delayed ideal body/joint state and ground-truth contact loads.
   A physical estimator, tire compliance, backlash and electrical/thermal models are absent.
   Nothing here is a decision. Knobs are working assumptions and can be changed from the page. */
(function (root) {
  const IN = 0.0254;
  const G = 9.81;
  const SHARED = (root.HuxSpatial || require("./spatial.js")).limits;
  const Tire = root.HuxTire || require("./tire.js");
  const ACT = root.HuxActuators || require("./actuators.js");

  /* Working assumptions for the actuators. Not parts. */
  const KNOBS = {
    massScale: 1,      /* multiplies every lump */
    bodyCom: 0,        /* in, body lump forward (+) of the hip axes */
    mu: 0.7,           /* tire to floor friction */
    tireK: 40000,      /* N/m, carcass stiffness of a 6×1.25 high-pressure pneumatic. Unmeasured; 25–60 kN/m is the plausible band */
    tireZeta: 0.2,     /* damping ratio of the tread ring on that stiffness. Pneumatics are lightly damped */
    tireCompliance: true, /* false = the rigid crown hull on the hub, as before 2026-09-25 */
    /* Actuator caps and torque-speed lines are the locked set's vendor numbers on the 8S bus
       (actuators.js, 2026-09-26): RS05 wheels 5.5 N·m peak / 1.7 rated / 31 rad/s no-load;
       RS02 knee + roll 17 / 7 / 26.5; RS00 hip swing 14 / 5 / 20. Peak is the cap; rated is
       reported next to every torque so a hold above it shows. Nothing measured yet. */
    tauWheel: SHARED.tauWheel,     /* N·m peak per in-wheel actuator */
    wheelNoLoad: ACT.noLoad.wheel, /* rad/s output no-load at 29.6 V */
    tauKnee: SHARED.tauKnee,       /* N·m peak; the stair climb says ~10.6 holding at 6 kg, more now */
    tauHip: SHARED.tauHip,         /* N·m peak, hip swing */
    tauRoll: SHARED.tauRoll,       /* N·m peak, hip roll (same part as the knee) */
    jointNoLoad: ACT.noLoad.knee,  /* rad/s output, used where a joint has no entry in noLoadOf */
    noLoadOf: { roll: ACT.noLoad.roll, hip: ACT.noLoad.hip, knee: ACT.noLoad.knee },
    ratedOf: { wheel: ACT.rated.wheel, roll: ACT.rated.roll, hip: ACT.rated.hip, knee: ACT.rated.knee },
    torqueLagMs: 2,    /* first-order drive response, unmeasured assumption */
    sensorDelayMs: 4,  /* outer-loop sample delay, unmeasured assumption */
    skid: false,       /* proposal: rear parking skid on the body centreline. Not in the docs. */
    ride: 0.75,        /* default ride height, hip to axle as a fraction of the full leg (medium) */
    legHz: 3.5,        /* Hz, virtual leg spring: bounce frequency of the body on its legs */
    legZeta: 0.6,      /* damping ratio of that spring */
    reflex: true,      /* lift a leg that takes a sharp hit (impact reflex) */
    legCatch: true,    /* swing the legs under a stumble (capture-point catch) */
    oneLift: false,    /* experimental: from the one-wheel poise, try to lift the free wheel clear and balance on it */
    oneHop: 0,         /* s; > 0: from the poise, lift the free wheel for this long with the hip rolls held stiff
                          (no one-wheel balance), let the robot tip toward the free side, and put the wheel back
                          down. Dynamic single support: what a stair step needs, without a static one-wheel stand. */
    hopKeep: 0.15,     /* fraction of the weight left on the free wheel at the moment it lifts (sets the inboard
                          margin the tip starts from; 0.15 is the poise) */
    rate: 3000,        /* Hz, physics and joint servo loops (servo drives close position at kHz). 2 kHz until
                          2026-09-26: with the locked actuator set's heavier hub (RS05, 0.29 kg) on the 0.2 kg
                          tread ring, the ring/hub/ground stack chattered at 2 kHz (contact-force bursts of
                          +45% over the weight, none of it physical); 3 kHz resolves it, 16 solver iterations
                          only halved it. A solver artefact, not a tire finding. */
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
    /* kin.js lumps come from the locked actuator set (actuators.js): body 4.35, both hips 1.50,
       each knee 0.46, each wheel 0.49 — 7.75 kg. The sandbox adds the two carbon tubes per leg
       (~30 g each, 16 mm OD) the 2D lumps leave out. */
    const lump = (M.mass && M.mass.body) ? { body: M.mass.body, hips: M.mass.hips, knee: M.mass.knee, wheel: M.mass.wheel }
      : { body: ACT.lumps.body, hips: ACT.lumps.hips, knee: ACT.lumps.knee, wheel: ACT.lumps.wheel };
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
      /* The wheel lump split into the tread ring (tire + tube + rim band, what moves on the
         carcass) and the hub (RS05 + bearings + axle). A picture, not weighed parts. */
      mTread: ACT.lumps.wheelTread * ms,
      mHub: (lump.wheel - ACT.lumps.wheelTread) * ms,
      jWheel: 0.65, /* J = 0.65 m R², same estimate as leg-geometry.md */
      tire: Tire.create({ R: M.wheelR * IN, width: M.wheelWidth * IN, crown: (M.tireCrown || M.wheelWidth / 2) * IN }),
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
    s.hStance = 2 * s.L * M.stanceFraction; /* the drawings' 92% balance stance */
    s.hRide = 2 * s.L * clamp(k.ride, 0.55, 0.98);
    s.totalKg = s.mBody + 2 * (s.mYoke + s.mKnee + 2 * s.mTube + s.mWheel);
    return s;
  }

  /** Two-link IK in the leg plane. Target axle (dx forward, dy up) from the hip.
      Knee always to the rear, as settled. Returns hip swing and knee angles about +Z,
      0 = hanging straight down, positive swings the foot forward. */
  function legIk(s, dx, dy) {
    const d = clamp(Math.hypot(dx, dy), 0.2 * s.L, 2 * s.L * 0.999);
    const th = clamp(Math.acos(d / (2 * s.L)), SHARED.knee[0] / 2, SHARED.knee[1] / 2);
    const beta = Math.atan2(dx, -dy);
    return { qh: clamp(beta - th, -SHARED.hip[1], -SHARED.hip[0]), qk: 2 * th };
  }

  /** The same leg seen as a telescope: length d hip to axle, angle b from straight down in the
      yoke frame (+ foot forward), and their rates. The knee angle alone sets the length. */
  function legPolar(s, qh, qk, rh, rk) {
    const half = qk / 2;
    return {
      d: 2 * s.L * Math.cos(half),
      dd: -s.L * Math.sin(half) * rk,
      b: qh + half,
      bd: rh + rk / 2,
      lever: -s.L * Math.sin(half) /* ∂d/∂qk: knee torque per newton of leg force */
    };
  }

  /** Smooth 0 → 1 over u in [0, 1] (minimum jerk). */
  function minJerk(u) {
    const x = clamp(u, 0, 1);
    return x * x * x * (10 - 15 * x + 6 * x * x);
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

  /* Collision hull from the shared tire profile (tire.js): core rings plus one rounding
     radius. With the default full-round crown this is a torus-like rounded disk — the
     contact point walks around the crown as the wheel cambers instead of catching an edge.
     Carcass compliance is the tread ring's spring in buildRobot, not the hull. */
  function tireVertices(radius, width, crown) {
    const tire = Tire.create({ R: radius, width: width, crown: crown || width / 2 });
    const hull = tire.hull(0.001);
    const points = [];
    hull.rings.forEach(function (ring) {
      for (let i = 0; i < 256; i++) {
        const a = 2 * Math.PI * i / 256;
        points.push(ring.r * Math.cos(a), ring.r * Math.sin(a), ring.u);
      }
    });
    return { points: new Float32Array(points), crown: hull.round, tire: tire };
  }
  function tireCollider(R, radius, width, crown) {
    const mesh = tireVertices(radius, width, crown);
    const shape = R.ColliderDesc.roundConvexHull(mesh.points, mesh.crown);
    if (!shape) throw new Error("Invalid tire hull");
    return shape;
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
    const robotGroups = groups(GROUP_ROBOT, 0xffff);

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
        .setFrictionCombineRule(R.CoefficientCombineRule.Min)
        .setActiveHooks(R.ActiveHooks.FILTER_CONTACT_PAIRS);
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
      skid.collider = collide(R.ColliderDesc.capsule(len(d) / 2, 0.008).setTranslation(mid.x, mid.y, 0)
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
      const iAxAll = s.jWheel * s.mWheel * s.R * s.R;
      const iTrAll = s.mWheel * (3 * s.R * s.R + s.wheelW * s.wheelW) / 12;
      const compliant = s.knobs.tireCompliance !== false;
      /* Hub: the in-wheel motor. Tread: tire, tube and rim band on the carcass spring.
         Without compliance the hub carries the whole lump and the crown hull. */
      const mHub = compliant ? s.mHub : s.mWheel;
      const mTread = compliant ? s.mTread : 0;
      const iAxTread = mTread * s.R * s.R;
      const iAxHub = Math.max(1e-5, iAxAll - iAxTread);
      const iTrTread = mTread * s.R * s.R / 2;
      const iTrHub = Math.max(1e-5, iTrAll - iTrTread);
      const wheel = body(wheelPos, null, mHub, v(0, 0, 0), v(iTrHub, iTrHub, iAxHub));
      let tread = wheel;
      let wheelCol;
      let jTread = null;
      let jSpring = null;
      if (compliant) {
        tread = body(wheelPos, null, mTread, v(0, 0, 0), v(iTrTread, iTrTread, iAxTread));
        wheelCol = collide(tireCollider(R, s.R, s.wheelW, s.tire.crown), tread, s.knobs.mu);
        /* Ring rides with the hub in rotation (torque transfers, torsionally stiff carcass)
           and floats in translation on an isotropic spring: radial give makes the pad, lateral
           give is the sidewall. Real tires are softer sideways than radially; one stiffness is
           the honest first cut. Damping is set from the ring mass so the ring itself is calm. */
        const lock = R.JointAxesMask.AngX | R.JointAxesMask.AngY | R.JointAxesMask.AngZ;
        jTread = world.createImpulseJoint(R.JointData.generic(v(0, 0, 0), v(0, 0, 0), Z, lock), wheel, tread, true);
        const c = 2 * s.knobs.tireZeta * Math.sqrt(s.knobs.tireK * mTread);
        jSpring = world.createImpulseJoint(R.JointData.spring(0, s.knobs.tireK, c, v(0, 0, 0), v(0, 0, 0)), wheel, tread, true);
        jTread.setContactsEnabled(false);
        jSpring.setContactsEnabled(false);
      } else {
        wheelCol = collide(tireCollider(R, s.R, s.wheelW, s.tire.crown), wheel, s.knobs.mu);
      }
      wheelCol.setFriction(s.knobs.mu);

      /* Chain: body → yoke (roll, X) → upper (swing, Z) → lower (knee, Z) → wheel (Z).
         Impulse joints, not Rapier multibody: in rapier3d-compat 0.20 a torque added to a multibody
         link reaches the joint at about a third of its value (checked in sim-test.js). */
      const jRoll = world.createImpulseJoint(
        R.JointData.revolute(v(0, 0, side * s.hipLat), v(0, 0, 0), X), trunk, yoke, true);
      const jHip = world.createImpulseJoint(R.JointData.revolute(v(0, 0, 0), v(0, 0, 0), Z), yoke, upper, true);
      const jKnee = world.createImpulseJoint(R.JointData.revolute(v(0, -s.L, 0), v(0, 0, 0), Z), upper, lower, true);
      const jWheel = world.createImpulseJoint(R.JointData.revolute(v(0, -s.L, dz), v(0, 0, 0), Z), lower, wheel, true);
      jRoll.setLimits(SHARED.roll[0], SHARED.roll[1]);
      jHip.setLimits(-SHARED.hip[1], -SHARED.hip[0]);
      jKnee.setLimits(0, SHARED.knee[1]); // zero allowed at startup; servo avoids straight
      [jRoll, jHip, jKnee, jWheel].forEach(function (j) { j.setContactsEnabled(false); });

      parts.push({ kind: "yoke", rb: yoke, side: side, ixx: 2e-4 });
      parts.push({ kind: "upper", rb: upper, side: side, ixx: iPerpU });
      parts.push({ kind: "lower", rb: lower, side: side, ixx: iPerpL });
      parts.push({ kind: "wheel", rb: wheel, side: side, ixx: iTrHub });
      if (compliant) parts.push({ kind: "tread", rb: tread, side: side, ixx: iTrTread });
      legs.push({
        side: side,
        yoke: yoke, upper: upper, lower: lower, wheel: wheel, tread: tread, wheelCol: wheelCol,
        compliant: compliant,
        joints: {
          roll: { parent: trunk, child: yoke, axis: X },
          hip: { parent: yoke, child: upper, axis: Z },
          knee: { parent: upper, child: lower, axis: Z },
          wheel: { parent: lower, child: wheel, axis: Z }
        }
      });
    });
    // Connected joint housings overlap by construction. All other robot pairs collide.
    const adjacency = new Set();
    function exclude(a, b) { adjacency.add([a.handle, b.handle].sort((x, y) => x - y).join(":")); }
    legs.forEach(l => { exclude(trunk, l.yoke); exclude(trunk, l.upper);
      exclude(l.yoke, l.upper); exclude(l.upper, l.lower); exclude(l.lower, l.wheel);
      if (l.tread !== l.wheel) { exclude(l.lower, l.tread); exclude(l.wheel, l.tread); } });
    const hooks = {
      filterContactPair: function (a, b, ba, bb) {
        return adjacency.has([ba, bb].sort((x, y) => x - y).join(":")) ? null : R.SolverFlags.COMPUTE_IMPULSE;
      }, filterIntersectionPair: function () { return true; }
    };
    return { R: R, hooks: hooks, s: s, trunk: trunk, trunkCol: trunkCol, legs: legs, parts: parts, skid: skid };
  }

  /* ---------- sensing ---------- */
  let sensed = null;
  function read(rb, key, get) { const p = sensed && sensed.get(rb.handle); return p ? p[key] : get(); }
  function rot(rb) { return read(rb, "q", () => rb.rotation()); }
  function tr(rb) { return read(rb, "p", () => rb.translation()); }
  function lv(rb) { return read(rb, "v", () => rb.linvel()); }
  function av(rb) { return read(rb, "w", () => rb.angvel()); }
  function wc(rb) { return read(rb, "c", () => rb.worldCom()); }
  /** Where a crowned tire actually touches the floor: the tread ring's centre, down by the
      profile's depth and sideways by its camber walk. A cambered wheel's contact is not under
      its hub — at 24° of lean it is about an inch off — and the one-leg pivot has to be here. */
  function contactOf(leg, tire) {
    const a = qRot(rot(leg.wheel), Z);
    const ah = Math.hypot(a.x, a.z);
    const sp = tire.support(Math.asin(Math.min(1, Math.abs(a.y))));
    const c = tr(leg.tread);
    const lateral = ah > 1e-6 ? mul(v(a.x / ah, 0, a.z / ah), -sp.z * Math.sign(a.y || 1)) : v(0, 0, 0);
    return v(c.x + lateral.x, c.y - sp.depth, c.z + lateral.z);
  }
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
  /* Sideways (one wheel): leg roll 0.1 rad, its rate 0.7 rad/s, body-to-leg 0.1 rad, its rate 0.7 rad/s,
     torque 0.35 N·m. Swept 2026-09-23: the old weights (body-to-leg 0.45 rad, torque 2.2 N·m) let the
     body roll off the leg and chattered the hip roll against its limit. */
  let LAT_Q = [100, 2, 100, 2];
  let LAT_R = 8;
  /* trim rates: rad/s per unit of free-wheel load over weight, rad/s per metre of mass offset */
  const LAT_TRIM = { load: 4, e: 6 };
  const MODES = ["PARKED", "TWO_WHEEL", "LEFT_ONLY", "RIGHT_ONLY"];
  const ONE_WHEEL = ["unload", "lift", "hold", "lower", "catch", "hop"];

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
    this.yawI = 0;
    this.sensorHistory = [];
    this.singleSupportSeconds = 0;
    this.modeRequest = "TWO_WHEEL";
    this.modeRejected = "";
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
      const center = wc(p.rb);
      const pc = v(center.x, center.y, center.z);
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
    if (this.sensedContacts) return this.sensedContacts;
    const out = [];
    /* rapier3d-compat 0.20 reports the normal impulse inflated by (n + 1) / n for n solver
       iterations (checked against the robot's weight at n = 1, 4, 8 in sim-test.js). */
    const n = world.numSolverIterations;
    const dt = world.timestep * (n + 1) / n;
    this.robot.legs.forEach(function (leg) {
      let n = 0;
      let impulse = 0;
      world.contactPairsWith(leg.wheelCol, function (other) {
        if ((other.collisionGroups() >>> 16) & GROUP_ROBOT) return;
        world.contactPair(leg.wheelCol, other, function (manifold, flipped) {
          const up = Math.max(0, manifold.normal().y * (flipped ? 1 : -1));
          const k = manifold.numContacts();
          for (let i = 0; i < k; i++) {
            impulse += manifold.contactImpulse(i) * up;
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
    if (cmd.mode && cmd.mode !== this.modeRequest && MODES.indexOf(cmd.mode) >= 0) this.setMode(cmd.mode);
    this.tick = (this.tick || 0) + 1;
    if (!this.plan || this.tick % every === 0) {
      const now = this.tick * dt;
      const snapshot = new Map();
      this.robot.parts.forEach(p => {
        const b = p.rb;
        snapshot.set(b.handle, { q: { ...b.rotation() }, p: { ...b.translation() },
          v: { ...b.linvel() }, w: { ...b.angvel() }, c: { ...b.worldCom() } });
      });
      this.sensorHistory.push({ t: now, state: snapshot, contacts: this.contacts(world) });
      const target = now - k.sensorDelayMs / 1000;
      while (this.sensorHistory.length > 1 && this.sensorHistory[1].t <= target) this.sensorHistory.shift();
      const sample = this.sensorHistory[0];
      sensed = sample.state;
      this.sensedContacts = sample.contacts;
      try { this.plan = this.balance(world, cmd, dt * every); }
      finally { sensed = null; this.sensedContacts = null; }
      this.out.sensorAgeMs = (now - sample.t) * 1000;
    }
    return this.servo(this.plan, dt);
  };

  /** Flight-controller loop: attitude, CoM lean, LQR wheel torque, leg targets. */
  Controller.prototype.balance = function (world, cmd, dt) {
    const s = this.s;
    const k = s.knobs;
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
    if (this.one && ONE_WHEEL.indexOf(this.one.phase) >= 0) balanceOn = [this.one.planted];

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
    const vCmd = parked || this.one || this.modeRequest === "PARKED" ? 0 : clamp(cmd.v || 0, -2.5, 2.5);
    const aMax = 1.2;
    const dv = clamp(vCmd - this.vRef, -aMax * dt, aMax * dt);
    const aRef = dv / dt;
    this.vRef += dv;
    /* Stall guard: never ask for more than 0.35 m/s beyond what the wheels are doing, so a
       wheel stopped against a curb does not wind the lean up until the robot falls. */
    let guard = false;
    if (vCmd > 0.05 && this.vRef > vFwd + 0.35) { this.vRef = Math.max(0, vFwd + 0.35); guard = true; }
    if (vCmd < -0.05 && this.vRef < vFwd - 0.35) { this.vRef = Math.min(0, vFwd - 0.35); guard = true; }
    /* A stall is speed that collapsed after it had been tracking the reference. Pulling away
       does not count: the wheels roll back first to tip the mass forward. */
    const tracking = Math.abs(this.vRef) > 0.15 && vFwd * this.vRef > 0.6 * this.vRef * this.vRef;
    this.sinceMoving = tracking ? 0 : (this.sinceMoving || 0) + dt;
    const stalled = Math.abs(this.vRef) > 0.15 && Math.abs(vFwd) < 0.1 && this.sinceMoving < 0.3;
    this.stallT = stalled || (guard && Math.abs(vFwd) < 0.1) ? (this.stallT || 0) + dt : 0;
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
    const yawCmd = parked || this.one || this.modeRequest === "PARKED" ? 0 : clamp(cmd.yaw || 0, -3, 3);
    const yawError = yawCmd - yawRate;
    const yawRoom = Math.max(0, k.tauWheel - Math.abs(tau) / 2);
    this.yawI = !parked && !this.one && yawRoom > 0.1
      ? clamp((this.yawI || 0) + 0.6 * yawError * dt, -0.5, 0.5) : 0;
    const tauYaw = clamp(0.35 * yawError + this.yawI, -yawRoom, yawRoom);

    /* Height: rate limited, default is the ride height. Roll levelling: leg length difference. */
    const hCmd = clamp(cmd.height || s.hRide, s.hMin, s.hMax);
    /* one wheel is planned at the tall stance: longer legs reach further sideways per degree of
       hip roll, so the mass gets over the planted tire without running out of roll */
    const hTarget = parked ? s.hMin : this.one ? Math.max(hCmd, s.hStance) : hCmd;
    const hRate = clamp(hTarget - this.h, -0.25 * dt, 0.25 * dt);
    this.h += hRate;
    const rollRate = dot(wb, fwd);
    let dh = 0;
    /* Levelling by leg length is a mass-mover near one wheel: 29 mm of leg difference is 5° of
       body roll and 35 mm of CoM travel. After a landing the integrator wound up on the touchdown
       roll and walked the mass out over the planted tire, so it stays frozen until the unshift. */
    /* 2026-09-26: with the locked actuator masses the levelling integrator and the shift servo
       fell into a 2 Hz limit cycle during the shift itself (free-wheel load 3 ↔ 21 N, knees ±1°,
       mass ±5 mm), so the poise never settled. Level with the parallelogram, not the legs, for
       the whole one-leg sequence: equal leg lengths keep the body level by geometry. */
    const levelling = !parked && !this.one;
    if (levelling) {
      /* Integral only: one metre of leg difference tilts the body ~6 rad, so any real
         proportional gain here fights the leg springs. ~0.2 s time constant. */
      this.rollI = clamp(this.rollI + (0.8 * roll + 0.02 * rollRate) * dt, -0.06, 0.06);
    } else if (!this.one) {
      this.rollI *= 0.99;
    } /* on one wheel the levelling freezes: unwinding it would change both leg lengths at once */
    dh = this.rollI;
    const shift = clamp(cmd.shift || 0, -0.6, 0.6);
    if (!this.one) this.shift = shift;

    /* Suspension. Each leg is a spring-damper tuned for legHz with its share of the mass on it,
       plus a gravity feed-forward from where the mass sits between the wheels, so it rides at
       the commanded height instead of sagging. Active roll damping pushes harder on the side
       that is going down. */
    const zc = [dot(sub(um.c, tr(leftLeg.wheel)), right), dot(sub(um.c, tr(rightLeg.wheel)), right)];
    const span = zc[0] - zc[1] || 1e-3;
    const shareR = clamp(zc[0] / span, 0.05, 0.95);
    const wn = 2 * Math.PI * k.legHz;
    const legs = [0, 1].map(function (i) {
      const sh = i === 1 ? shareR : 1 - shareR;
      const ms = Math.max(0.5, um.m * 0.5);
      const kk = ms * wn * wn;
      return {
        h: this.h + (i === 1 ? dh : -dh),
        hd: hRate / dt,
        ff: um.m * G * sh + (i === 1 ? 1 : -1) * 15 * rollRate,
        k: kk,
        c: 2 * k.legZeta * Math.sqrt(kk * ms),
        beta: 0,
        kb: 120,
        cb: 1.5,
        roll: shift
      };
    }, this);

    /* Stumble catch: when the capture point (where the mass would come to rest over) runs
       ahead of or behind the axle by more than the wheels can fix, swing both legs to put the
       axles under it. Fast in, slow out, so the wheel loop has time to take over. */
    const w0 = Math.sqrt(G / Math.max(0.1, l));
    const xi = relF + dot(relV, fwd) / w0 - l * Math.sin(thRef);
    let bWant = 0;
    if (k.legCatch && !parked && !this.one && !this.fallen) {
      const dead = 0.03;
      const over = Math.abs(xi) > dead ? xi - Math.sign(xi) * dead : 0;
      bWant = clamp(1.2 * over / Math.max(0.1, this.h), -0.4, 0.4);
    }
    const bRate = Math.abs(bWant) > Math.abs(this.catchB || 0) ? 12 : 1.2;
    this.catchB = (this.catchB || 0) + clamp(bWant - (this.catchB || 0), -bRate * dt, bRate * dt);
    legs.forEach(function (lg) { lg.beta = this.catchB; }, this);

    /* Sideways, two wheels are a static base until the mass heads past a tire. Then both hip
       rolls step the wheels out under it (+ hip roll moves the wheels left) and the leg on the
       side it is falling toward pushes long, which rolls the body back. */
    const mid = mul(add(tr(leftLeg.wheel), tr(rightLeg.wheel)), 0.5);
    const zMid = dot(sub(um.c, mid), right);
    const vz = dot(sub(um.cv, mul(add(lv(leftLeg.wheel), lv(rightLeg.wheel)), 0.5)), right);
    const xiZ = zMid + vz / w0;
    const halfT = s.wheelLat;
    let gWant = 0;
    if (k.legCatch && !parked && !this.one && !this.fallen) {
      const edge = 0.35 * halfT;
      const over = Math.abs(xiZ) > edge ? xiZ - Math.sign(xiZ) * edge : 0;
      gWant = clamp(-6 * over, -0.45, 0.45);
    }
    const gRate = Math.abs(gWant) > Math.abs(this.catchG || 0) ? 6 : 0.8;
    this.catchG = (this.catchG || 0) + clamp(gWant - (this.catchG || 0), -gRate * dt, gRate * dt);
    if (this.catchG) {
      const push = clamp(Math.abs(this.catchG) / 0.35, 0, 1) * 0.04;
      const low = this.catchG < 0 ? 1 : 0; /* wheels going right: the mass is falling right */
      legs.forEach(function (lg, i) {
        lg.roll += this.catchG;
        if (i === low) lg.h += push;
      }, this);
    }

    /* Impact reflex and stall hop: a leg that is hit hard, or a wheel stopped dead by an edge,
       hops its wheel up for a moment so it rides over instead of stopping. */
    this.reflex(legs, dt);

    /* One-leg modes (experimental). */
    if (this.one) {
      const res = this.oneLeg(um, fwd, right, dt, cmd, contacts, legs);
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

    const support = contacts.map(c => c.force > s.totalKg * G * 0.05);
    const clear = r.legs.map(leg => {
      const axisY = qRot(rot(leg.wheel), Z).y;
      const depth = s.tire.supportFromAxisY(axisY).depth;
      const hit = world.castRay(new r.R.Ray(tr(leg.tread), v(0, -1, 0)), 2, true, undefined, groups(GROUP_WORLD, GROUP_WORLD));
      return hit ? hit.timeOfImpact - depth : Infinity;
    });
    const leftOnly = support[0] && contacts[1].force < s.totalKg * G * 0.02 && clear[1] > 0.01;
    const rightOnly = support[1] && contacts[0].force < s.totalKg * G * 0.02 && clear[0] > 0.01;
    const single = this.one && (this.one.mode === "LEFT_ONLY" ? leftOnly : rightOnly);
    this.singleSupportSeconds = single ? this.singleSupportSeconds + dt : 0;
    o.requestedMode = this.modeRequest;
    o.modeRejected = this.modeRejected;
    o.supportState = leftOnly ? "LEFT_SUPPORT" : rightOnly ? "RIGHT_SUPPORT" : support.every(Boolean) ? "TWO_CONTACT" : "TRANSITION";
    o.clearance = clear;
    o.singleSupportSeconds = this.singleSupportSeconds;
    o.singleSupportValidated = this.singleSupportSeconds >= 1.55;
    let restImpulse = 0;
    if (parked && r.skid) world.contactPairsWith(r.skid.collider, other => {
      if ((other.collisionGroups() >>> 16) & GROUP_ROBOT) return;
      world.contactPair(r.skid.collider, other, (manifold, flipped) => {
        const upward = Math.max(0, manifold.normal().y * (flipped ? 1 : -1));
        for (let i = 0; i < manifold.numContacts(); i++) restImpulse += upward * manifold.contactImpulse(i);
      });
    });
    const restForce = restImpulse / (world.timestep * (world.numSolverIterations + 1) / world.numSolverIterations);
    const resting = parked && wheelsOff && restForce > s.totalKg * G * 0.1 && len(lv(r.trunk)) < 0.1 && len(av(r.trunk)) < 0.2;
    o.restSupportN = restForce;
    o.mode = resting ? "PARKED" : leftOnly ? "LEFT_ONLY" : rightOnly ? "RIGHT_ONLY" : "TWO_WHEEL";
    o.phase = this.one ? this.one.phase : (parked ? (resting ? "parked" : "sitting") : "");
    o.fallen = this.fallen;
    o.estop = this.estop;
    o.theta = theta;
    o.thetaDot = thetaDot;
    o.pitch = pitch;
    o.roll = roll;
    o.rollRate = rollRate;
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
    /* Carcass state: tread ring offset from the hub (radial in the wheel plane, lateral along
       the axle) and the pad that deflection implies. Estimates for the readouts, not a contact
       patch the solver resolves — Rapier still touches the ground at points. */
    o.tires = r.legs.map(function (leg, i) {
      if (!leg.compliant) return { deflection: 0, lateral: 0, padLength: 0, padWidth: 0, camber: 0 };
      const d = sub(tr(leg.tread), tr(leg.wheel));
      const axis = qRot(rot(leg.wheel), Z);
      const lateral = dot(d, axis);
      const radial = len(sub(d, mul(axis, lateral)));
      const camber = Math.asin(Math.max(-1, Math.min(1, axis.y)));
      const pad = s.tire.pad(Math.max(0, contacts[i].force), s.knobs.tireK, camber);
      return { deflection: radial, lateral: lateral, padLength: pad.length, padWidth: pad.width, camber: camber };
    });
    o.fwd = fwd;
    o.oneErr = this.one ? this.one.e : 0;
    o.oneLoad = this.one ? this.one.freeLoad : 0;
    o.caught = this.caught || 0;
    o.hop = this.one && this.one.hop ? this.one.hop : null;
    o.catchB = this.catchB || 0;
    o.reflex = this.rx ? this.rx.map(function (x) { return { f: x.f || 0, hits: x.hits || 0, comp: x.comp || 0 }; }) : [];
    return {
      tw: tw,
      brake: parked && wheelsOff && !this.estop,
      brakeLeg: this.one && this.one.brakeFree ? (this.one.planted === leftLeg ? 1 : 0) : -1,
      yawShare: nW === 2 && !wheelsOff ? tauYaw : 0,
      tauBal: tau,
      legs: legs
    };
  };

  /* Impact reflex timing, s, and how far it pulls the wheel up, m. */
  const RX = { rise: 0.05, hold: 0.07, back: 0.3, cool: 0.6, lift: 0.045, trip: 0.35, stall: 0.02, pull: 15 };

  /** Impact reflex and stall hop, on the balance loop. Sensing is encoders only.
      Reflex: a loaded leg that shortens faster than it was told to (RX.trip m/s) took a hit.
      That is only separable from normal driving at speed (~0.75 m/s and up on a 1" edge).
      Stall hop: slower than that an edge just stops the wheel. Asked to go, wheels stopped for
      RX.stall s: hop the loaded legs whose wheel is stopped, so the tire lands on top of the edge. */
  Controller.prototype.reflex = function (legs, dt) {
    const k = this.s.knobs;
    const lo = this.out.legs;
    if (!this.rx) this.rx = [{ t: 9, cool: 0 }, { t: 9, cool: 0 }];
    const self = this;
    legs.forEach(function (lg, i) {
      const st = self.rx[i];
      st.t += dt;
      st.cool -= dt;
      const comp = lo ? -(lo[i].dd - lg.hd) : 0;
      st.comp = comp;
      const loaded = lo && lo[i].F > 0.3 * self.s.totalKg * G * 0.5;
      const wo = self.out.wheels;
      const stuck = loaded && wo && Math.abs(wo[i].w * self.s.R) < 0.1 && (self.stallT || 0) > RX.stall;
      const air = self.one && self.one.free === self.robot.legs[i] && self.one.phase !== "shift";
      if (k.reflex && !air && !self.fallen && self.mode !== "PARKED" && st.cool <= 0 && ((loaded && comp > RX.trip && Math.abs(self.out.speed || 0) > 0.4) || stuck)) {
        st.t = 0;
        st.cool = RX.cool;
        st.hits = (st.hits || 0) + 1;
      }
      let f = 0;
      if (st.t < RX.rise) f = minJerk(st.t / RX.rise);
      else if (st.t < RX.rise + RX.hold) f = 1;
      else if (st.t < RX.rise + RX.hold + RX.back) f = 1 - minJerk((st.t - RX.rise - RX.hold) / RX.back);
      st.f = f;
      if (f > 0) {
        /* A hop, not a flinch: a wheel wedged on an edge only comes up if the leg pulls it up
           (negative leg force) for a few tens of ms, with the body briefly unsupported. Then the
           spring comes back and catches the body. */
        const pull = st.t < RX.rise + RX.hold ? 1 : f;
        lg.h -= RX.lift * f;
        lg.hd = 0;
        lg.ff = lg.ff * (1 - pull) - RX.pull * pull;
        lg.k = lg.k * (1 - pull) + 1500 * pull;
        lg.c = lg.c * (1 - pull) + 25 * pull;
      }
    });
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
      /* In-wheel motor torque-speed line: full torque at stall, none at the 8S no-load speed. */
      let cap = lim;
      /* PARKED brake: phases shorted, torque proportional to speed, no balance. */
      if (plan.brake) tw[i] = -1.0 * w;
      else if (plan.brakeLeg === i) tw[i] = -0.05 * w;
      else if (tw[i] * w > 0) cap = lim * clamp(1 - Math.abs(w) / k.wheelNoLoad, 0, 1);
      if (Math.abs(tw[i]) > cap + 1e-6) sat.wheel = true;
      const asked = clamp(tw[i], -cap, cap);
      const alpha = k.torqueLagMs > 0 ? 1 - Math.exp(-dt / (k.torqueLagMs / 1000)) : 1;
      let t = clamp((leg.wheelTorque || 0) + alpha * (asked - (leg.wheelTorque || 0)), -cap, cap);
      if (this.estop || this.fallen) t = 0;
      leg.wheelTorque = t;
      applyJointTorque(leg.joints.wheel, -t, js.axisW);
      wheelOut.push({ tau: t, cap: cap, rated: (k.ratedOf && k.ratedOf.wheel) || null, w: w, power: t * w });
    }, this);

    /* Legs: a virtual spring-damper along the hip-to-axle line (the suspension), a stiff hold on
       the leg angle, mapped to hip and knee torque through the leg Jacobian. This needs
       torque-controlled, backdrivable joints (FOC / QDD class) or real springs; a position servo
       or a stepper cannot do it. Hip roll stays a stiff position hold unless balance takes it. */
    const legOut = [];
    const limp = this.estop;
    const caps = { roll: k.tauRoll, hip: k.tauHip, knee: k.tauKnee };
    r.legs.forEach(function (leg, i) {
      const lp = plan.legs[i];
      const jr = jointState(leg.joints.roll);
      const jh = jointState(leg.joints.hip);
      const jk = jointState(leg.joints.knee);
      const p = legPolar(s, jh.q, jk.q, jh.rate, jk.rate);
      const F = lp.ff + lp.k * (lp.h - p.d) - lp.c * (p.dd - (lp.hd || 0));
      const Tb = lp.kb * ((lp.beta || 0) - p.b) - lp.cb * p.bd;
      let tk = p.lever * F + Tb / 2;
      /* soft stops: never through straight, never folded flat */
      if (jk.q < 0.2) tk += 80 * (0.2 - jk.q) - 2 * jk.rate;
      if (jk.q > 2.7) tk -= 80 * (jk.q - 2.7) + 2 * jk.rate;
      const ikp = legIk(s, (lp.beta || 0) * lp.h, -lp.h);
      /* Hip roll position hold. With a gravity load on the joint a pure P hold sags
         (9 N·m of one-leg cantilever on 90 N·m/rad is 0.1 rad, 40 mm of mass shift): the
         one-leg sequence asks for integral action (lp.rollKi) so the joint tracks its target
         and the sag does not move the mass on its own. Any real position loop has this. */
      if (lp.rollKi) leg.rollI = clamp((leg.rollI || 0) + lp.rollKi * (lp.roll - jr.q) * dt, -k.tauRoll, k.tauRoll);
      else leg.rollI = (leg.rollI || 0) * (1 - dt / 0.5);
      const kp = lp.rollKp || 90;
      const cmdT = {
        roll: lp.rollTau !== undefined ? lp.rollTau : kp * (lp.roll - jr.q) - 1.5 * jr.rate + leg.rollI + (lp.rollFf || 0),
        hip: Tb,
        knee: tk
      };
      const js = { roll: jr, hip: jh, knee: jk };
      const want = { roll: lp.roll, hip: ikp.qh, knee: ikp.qk };
      const row = { d: p.d, dd: p.dd, dWant: lp.h, F: F, b: p.b, bd: p.bd };
      ["roll", "hip", "knee"].forEach(function (name) {
        let t = cmdT[name];
        const nl = (k.noLoadOf && k.noLoadOf[name]) || k.jointNoLoad;
        const cap = caps[name] * (t * js[name].rate > 0 ? clamp(1 - Math.abs(js[name].rate) / nl, 0, 1) : 1);
        if (Math.abs(t) > cap) sat[name] = true;
        const alpha = k.torqueLagMs > 0 ? 1 - Math.exp(-dt / (k.torqueLagMs / 1000)) : 1;
        leg.driveTorque = leg.driveTorque || {};
        const old = leg.driveTorque[name] || 0;
        t = clamp(old + alpha * (clamp(t, -cap, cap) - old), -cap, cap);
        if (limp) t = 0;
        leg.driveTorque[name] = t;
        applyJointTorque(leg.joints[name], t, js[name].axisW);
        row[name] = { tau: t, cap: cap, rated: (k.ratedOf && k.ratedOf[name]) || null, q: js[name].q, want: want[name], power: t * js[name].rate };
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
    this.modeRequest = m;
    this.modeRejected = "";
    if (m === "PARKED" && !r.skid) {
      this.modeRejected = "Parking requires a rest support. Stopping under active balance.";
      this.vRef = 0;
      return;
    }
    if ((m === "LEFT_ONLY" || m === "RIGHT_ONLY") && this.mode === "PARKED") {
      this.modeRejected = "Return to two-wheel balance before requesting single support.";
      return;
    }
    if (m === "LEFT_ONLY" || m === "RIGHT_ONLY") {
      if (this.one) return;
      const planted = m === "LEFT_ONLY" ? r.legs[0] : r.legs[1];
      const free = m === "LEFT_ONLY" ? r.legs[1] : r.legs[0];
      this.one = { phase: "shift", t: 0, planted: planted, free: free, gamma: this.shift || 0, mode: m, hold: 0 };
      this.mode = m;
      return;
    }
    if (this.one) {
      /* put the free wheel back down, then centre the body */
      const ph = this.one.phase;
      if (ph === "shift" || ph === "poise" || ph === "edge") this.one.phase = "unshift";
      else if (ph === "unload") this.one.phase = "load";
      else if (ph === "lift" || ph === "hold") this.one.phase = "lower";
      if (ph !== this.one.phase) this.one.t = 0;
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
    const pivot = contactOf(st.planted, s.tire); /* the crown's contact, not the hub */
    const hip = tr(st.planted.yoke);
    function proj(p, o) { const d = sub(p, o); return { z: dot(d, right), y: d.y }; }
    const byRb = new Map();
    r.parts.forEach(function (p) { byRb.set(p.rb, p); });
    const link1 = [st.planted.wheel, st.planted.lower, st.planted.upper, st.planted.yoke];
    const link2 = [r.trunk, st.free.yoke, st.free.upper, st.free.lower, st.free.wheel];
    const rh = proj(hip, pivot);
    const M = [[0, 0], [0, 0]];
    const H = [[0, 0], [0, 0]];
    const gV = [0, 0];
    link1.forEach(function (rb) {
      const m = rb.mass();
      const c = proj(wc(rb), pivot);
      const jz = c.y;
      const jy = -c.z;
      M[0][0] += m * (jz * jz + jy * jy) + byRb.get(rb).ixx;
      gV[0] += m * G * (-c.z);
      H[0][0] += m * G * (-c.y);
    });
    link2.forEach(function (rb) {
      const m = rb.mass();
      const c = proj(wc(rb), hip);
      const I = byRb.get(rb).ixx;
      const j1 = [rh.y + c.y, -rh.z - c.z];
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
   * LEFT_ONLY / RIGHT_ONLY as a planned sequence rather than a switch. Every phase moves on
   * minimum-jerk or rate-limited paths; nothing jumps.
   *   shift   stand tall (92%), stiffen both legs, and let both hip rolls slide the wheels under
   *           the body until the mass is over the planted wheel with ONE.keep of the weight left
   *           on the free one
   *   poise   hold there: a two-point stance that is statically stable, like a kickstand. A shove
   *           that takes the free wheel out of its load band bails out to two wheels (fast unshift)
   *   unshift both hip rolls come back to the pilot's setting, legs soften, ride height returns
   * Experimental, behind knobs.oneLift (off): taking the free wheel off the floor.
   *   edge    servo shift until the free wheel carries little more than its own leg
   *   unload  hand the planted hip roll to the sideways LQR bumplessly, let the free leg go limp
   *   lift    free wheel up on a minimum-jerk path to a clearance above the floor, braked
   *   hold    one wheel
   *   lower   minimum-jerk back down until the tire reports load
   *   load    the free leg's spring ramps back in, the planted hip roll hands back to its servo
   *   catch   if the mass runs away sideways, or the body rolls onto the free side, the free wheel
   *           goes straight down (a catch step), then load and back to the poise
   * The balancer does not hold the lift, and docs/research/one-leg-stance.md says why: on this
   * geometry the one-wheel stand is an acrobot with a few millimetres of capture region.
   * Behind knobs.oneHop (seconds): dynamic single support instead of a stand.
   *   hop     from the poise (knobs.hopKeep on the free wheel), the free wheel comes up with both
   *           hip rolls held stiff and the cantilever fed forward, the robot tips toward the free
   *           side at its own pace, and the wheel goes straight back down after oneHop seconds;
   *           then load and back to the poise. What a stair step needs.
   * Pitch rides on the planted wheel from unload to load. The tire is 1.25" wide; that
   * is all the sideways foot Hux has.
   */
  const ONE = { keep: 0.15, unload: 0.8, lift: 0.6, lower: 0.6, load: 0.4, clear: 0.05, catchE: 0.035, catchRoll: 0.14,
    edgeE: 0.02, handLoad: 0.08, rollKi: 200, rateTau: 0.015, hopUp: 0.15, hopDown: 0.15, rollKp: 250, freeKp: 90, landC: 250 };
  Controller.prototype.oneLeg = function (um, fwd, right, dt, cmd, contacts, legs) {
    const st = this.one;
    st.t += dt;
    const s = this.s;
    const pc = contactOf(st.planted, s.tire);   /* the crown's contact walks with camber */
    /* whole robot, wheels included: the free wheel alone moves the balance point ~17 mm */
    const mw = s.mWheel;
    const mt = um.m + 2 * mw;
    const cAll = mul(add(add(mul(um.c, um.m), mul(tr(st.planted.wheel), mw)), mul(tr(st.free.wheel), mw)), 1 / mt);
    const vAll = mul(add(add(mul(um.cv, um.m), mul(lv(st.planted.wheel), mw)), mul(lv(st.free.wheel), mw)), 1 / mt);
    const e = dot(sub(cAll, pc), right);          /* + = mass right of the planted tire's contact */
    const ev = dot(sub(vAll, lv(st.planted.wheel)), right);
    const leftPlanted = st.planted === this.robot.legs[0];
    const iP = leftPlanted ? 0 : 1;
    const iF = 1 - iP;
    const weight = um.m * G;
    const freeLoad = contacts[iF].force;
    /* a limp free leg still rests its own lower tube and wheel on the floor: that is "unloaded" */
    const own = (s.mTube + s.mWheel) * G * 1.5;
    const lo = this.out.legs;
    const P = legs[iP];
    const F = legs[iF];
    let done = false;
    /* the planted leg carries everything once the free one lets go */
    function carry(u) {
      const ff = F.ff * (1 - u);
      P.ff += F.ff - ff;
      F.ff = ff;
      F.k *= 1 - u;
      F.c *= 1 - 0.7 * u;
    }
    function airLeg(h) {
      F.h = h;
      F.hd = 0;
      F.ff = 0;
      F.k = 2500;
      F.c = 30;
    }

    /* + hip roll moves the wheels left under the body, so the body moves right. The poise
       target keeps ONE.keep of the weight on the free wheel: e sits that fraction of the track
       inboard of the planted tire. A model error of a centimetre is then a few percent of load,
       not a fall. Rate limited. */
    const side = leftPlanted ? 1 : -1; /* inboard is toward +right for a left plant */
    const ePoise = side * (s.knobs.oneHop > 0 ? s.knobs.hopKeep : ONE.keep) * 2 * s.wheelLat;
    function shiftToward(eGoal, rate) {
      const dg = clamp(-3.0 * (e - eGoal) - 0.6 * ev, -rate, rate);
      st.gamma = clamp(st.gamma + dg * dt, -0.6, 0.6);
    }
    /* The suspension's gravity feed-forward follows the measured mass position, which is right
       for a level, centred stance but leaves the leg springs with no roll stiffness near one
       wheel: as the mass drifts toward the planted tire the feed-forward follows it and the
       springs never push back. After a landing, split the weight by the planned poise instead,
       so the legs are passive springs (2 k D² of roll stiffness) until the shift servo has it. */
    if (st.hopped && (st.phase === "load" || st.phase === "shift" || st.phase === "poise")) {
      const tot = P.ff + F.ff;
      const keep = s.knobs.hopKeep;
      const uL = st.phase === "load" ? minJerk(st.t / ONE.load) : 1;
      F.ff = tot * keep * uL + F.ff * (1 - uL);
      P.ff = tot - F.ff;
    }
    if (st.phase === "shift" || st.phase === "poise") {
      /* with a wheel in the air a hip roll change is the acrobot swing, not a shift: it moves
         the mass the wrong way. Hold until both tires carry something. */
      /* after a landing the robot is still rocking on the planted tire; re-poise gently or the
         shift servo walks the mass over the tire (seen at 7.75 kg: 0.2 rad/s fell, 0.08 returns) */
      if (freeLoad > 0.03 * weight && contacts[iP].force > 0.03 * weight) shiftToward(ePoise, st.hopped ? 0.08 : 0.2);
      /* Gravity feed-forward on the planted hip for the whole shift / poise, not only in the air:
         the lump model's cantilever, scaled by the share of the weight the free wheel is not
         carrying. With the locked actuator masses (2026-09-26) the cantilever is 10.7 N·m at the
         drawn hips and the P+I hold alone sagged 1–3° into it after a landing, which walked the
         mass over the planted tire before the shift servo could act. A real controller has the
         same model and the same feed-forward (one-leg-stance.md, §5). */
      const mdlS = this.lateralModel(st, right);
      P.rollFf = -mdlS.gV[1] * (1 - clamp(freeLoad / weight, 0, 1));
      const tall = Math.abs(this.h - Math.max(cmd.height || s.hRide, s.hStance)) < 0.005;
      const settled = tall && Math.abs(e - ePoise) < 0.006 && Math.abs(ev) < 0.03;
      st.hold = settled ? st.hold + dt : 0;
      if (st.phase === "shift" && st.hold > 0.25) { st.phase = "poise"; st.t = 0; }
      /* Bail out: shoved while poised, the free wheel goes light (mass heading out over the
         planted tire) or takes most of the weight (heading in). Centre fast, both wheels down. */
      const fl = freeLoad / weight;
      st.off = st.phase === "poise" && (fl < 0.04 || fl > 0.45) ? (st.off || 0) + dt : 0;
      if (st.off > 0.03) { st.phase = "unshift"; st.t = 0; st.fast = true; this.caught = (this.caught || 0) + 1; }
      /* Experimental: from the poise, try to take the free wheel off the floor. Hand over to the
         sideways balancer first, bumplessly: the pose now is its balance point and the servo's
         torque its holding torque. (Solving for the balance point from the lump model was ~4°
         off; that kick is what flung the free leg out.) */
      if (st.phase === "poise" && s.knobs.oneLift && !st.caught && st.hold > 0.5) {
        st.phase = "edge";
        st.t = 0;
      }
      /* Dynamic single support: no balancer at all. The hip rolls hold the pose they have, the
         free wheel comes up fast, the robot tips toward the free side under its own inboard
         margin, and the wheel goes back down after knobs.oneHop seconds. */
      if (st.phase === "poise" && s.knobs.oneHop > 0 && !st.hopped && st.hold > 0.5) {
        st.phase = "hop";
        st.t = 0;
        st.hopped = true;
        st.e0 = e;
        st.roll0 = this.out.roll || 0;
        st.dFree = lo ? lo[iF].d : F.h;
        st.hop = { peakTau: 0, tipDeg: 0, eEnd: 0, air: 0, ev: 0 };
      }
    } else if (st.phase === "edge") {
      /* ease the mass on to the planted tire with the servo shift, both wheels still down,
         until the free wheel carries only a few percent. Hand over while it still carries
         something: with the free wheel unloaded there is no static stability left and the
         servo shift cannot pull the mass back. The shift itself moves the mass at a few
         cm/s, so the settle test is on the goal, not on the speed alone. */
      shiftToward(side * ONE.edgeE, 0.08);
      const ready = freeLoad < ONE.handLoad * weight && Math.abs(e - side * ONE.edgeE) < 0.008 && Math.abs(ev) < 0.03;
      st.hold = ready ? st.hold + dt : 0;
      if (st.hold > 0.1) {
        st.phase = "unload";
        st.t = 0;
        st.tauHold = lo ? lo[iP].roll.tau : 0;
        st.roll0 = this.out.roll || 0;
        st.e0 = e;
        st.eq = null;
        st.K = null;
      } else if (st.t > 4) {
        st.phase = "unshift"; st.t = 0; st.next = "TWO_WHEEL";
        this.modeRejected = "Single-support request aborted: load transfer did not settle.";
      }
    } else if (st.phase === "unload") {
      carry(minJerk(st.t / ONE.unload));
      if (st.t >= ONE.unload && freeLoad < own) {
        st.phase = "lift";
        st.t = 0;
        st.dFree = lo ? lo[iF].d : F.h;
        st.eAir = undefined;
      } else if (st.t > 2.0) {
        st.phase = "load"; /* could not unload it: put the weight back and centre */
        st.t = 0;
      }
    }

    /* After a catch the balancer is what failed: the planted hip roll goes straight back to its
       stiff hold and the robot rides down onto the free wheel as one piece. */
    const oneWheel = !st.caught && (st.phase === "unload" || st.phase === "lift" || st.phase === "hold" ||
      st.phase === "lower" || (st.phase === "load" && st.t < ONE.load));
    let tauP;
    if (oneWheel) {
      /* Sideways LQR through the planted hip roll about the handover pose: leg roll q1 (tire to
         hip), body-to-leg q2, and the holding torque. An integral on the mass offset trims it. */
      const planted = st.planted.joints.roll;
      const js = jointState(planted);
      const wcP = contactOf(st.planted, s.tire);
      const hipP = tr(st.planted.yoke);
      const q1 = Math.atan2(dot(sub(hipP, wcP), right), hipP.y - wcP.y);
      const q2 = -js.q;
      /* Rates the real robot would have: the leg's roll rate is the yoke's angular velocity
         about the fore-aft axis (IMU rate minus the hip-roll encoder rate), the joint rate is
         the encoder. Differencing the contact-derived angle instead put the tire carcass
         mode (13 Hz on a 40 kN/m ring) and contact-point jumps straight into the loop and the
         hip roll pumped the planted tire at that frequency. A 15 ms filter on both rates
         costs 13° of phase at the unstable pole and gain-stabilises the tire mode. */
      const q1raw = dot(av(st.planted.yoke), fwd);
      const q2raw = -js.rate;
      const fr = Math.min(1, dt / ONE.rateTau);
      st.q1d = st.q1d === undefined ? q1raw : st.q1d + (q1raw - st.q1d) * fr;
      st.q2d = st.q2d === undefined ? q2raw : st.q2d + (q2raw - st.q2d) * fr;
      const q1d = st.q1d;
      const q2d = st.q2d;
      st.lqrAge = (st.lqrAge || 1) + dt;
      if (!st.eq) { st.eq = { q1: q1, q2: q2, u: -(st.tauHold || 0) }; st.eI = 0; }
      if (!st.K || st.lqrAge > 0.05) {
        const mdl = this.lateralModel(st, right);
        const K = dlqr(mdl.Ac, mdl.Bc, 0.005, LAT_Q, LAT_R, st.P, st.K ? 3000 : 40000);
        /* keep the last good gains if the model went somewhere the solver cannot follow */
        if (K.every(isFinite) && (dlqr.converged || dlqr.delta < 1e-5)) {
          st.K = K;
          st.P = dlqr.lastP;
        }
        st.lqrAge = 0;
      }
      /* Where to balance. The lump model's balance point is a few mm off, so trim the leg-roll
         target (+ tips the top right) from what the robot can measure:
         - while the free wheel still carries more than its own leg, lean away from it in
           proportion to that load (the one thing measured directly);
         - once it is off the floor, hold the mass where it was at that moment. */
      st.fl = st.fl === undefined ? freeLoad : st.fl + (freeLoad - st.fl) * Math.min(1, dt / 0.05);
      const excess = clamp((st.fl - 0.7 * own) / weight, -0.1, 0.1);
      const airborne = contacts[iF].n === 0 && freeLoad < 0.02 * mt * G && st.phase !== "unload";
      if (airborne && st.eAir === undefined) st.eAir = e;
      if (!airborne && st.phase !== "hold") st.eAir = undefined;
      let rate = 0;
      if (st.eAir !== undefined) rate = -LAT_TRIM.e * (e - st.eAir);
      else if (st.t > 0.3 * ONE.unload || st.phase !== "unload") rate = -side * LAT_TRIM.load * excess;
      st.trim = clamp((st.trim || 0) + rate * dt, -0.15, 0.15);
      const q1ref = st.eq.q1 + st.trim;
      const x = [q1 - q1ref, q1d, q2 - st.eq.q2, q2d];
      st.x = x;
      let u = st.eq.u;
      if (!st.K) {
        st.phase = "catch"; st.t = 0; st.caught = true;
        this.modeRejected = "Single-support controller has no converged gains; returning the wheel.";
      } else for (let i = 0; i < 4; i++) u -= st.K[i] * x[i];
      st.u = u;
      tauP = -u; /* joint torque on the yoke is minus the torque on the body */
    }

    /* Free leg length that puts its wheel `clear` above the floor the planted tire is on, along
       the leg's current line. A real robot gets the same from the planted leg's kinematics and
       the IMU; a fixed retract in the body frame is eaten by the body rolling toward that side. */
    const hipF = tr(st.free.yoke);
    const legF = sub(tr(st.free.wheel), hipF);
    const cosF = clamp(-legF.y / Math.max(0.05, len(legF)), 0.5, 1);
    const floorY = tr(st.planted.wheel).y;
    function dClear(clear) { return clamp((hipF.y - floorY - clear) / cosF, s.hMin * 0.8, s.hMax); }
    if (st.phase === "hop") {
      /* wheel up in ONE.hopUp, held clear until knobs.oneHop, then straight down */
      const T = s.knobs.oneHop;
      const up = st.t < ONE.hopUp ? minJerk(st.t / ONE.hopUp) : st.t < T ? 1 : 1 - minJerk((st.t - T) / ONE.hopDown);
      airLeg(Math.min(st.dFree, dClear(ONE.clear * up - 0.02 * Math.max(0, 1 - up) * (st.t > T ? 1 : 0))));
      const airborne = contacts[iF].n === 0 && freeLoad < 0.02 * mt * G;
      if (airborne) st.hop.air += dt;
      /* the planted hip must carry the whole cantilever the moment the free wheel leaves:
         feed the lump model's gravity moment forward instead of waiting for the servo to sag
         into it (a 90 N·m/rad hold sags 4° under the 8 N·m step, which is a 30 mm mass shift) */
      const mdl = this.lateralModel(st, right);
      st.hopFf = -mdl.gV[1] * minJerk(st.t / ONE.hopUp);
      P.rollFf = st.hopFf;
      st.hop.peakTau = Math.max(st.hop.peakTau, Math.abs(lo ? lo[iP].roll.tau : 0));
      st.hop.tipDeg = Math.max(st.hop.tipDeg, Math.abs(((this.out.roll || 0) - st.roll0) * 180 / Math.PI));
      st.hop.eEnd = e; st.hop.ev = ev;
      if (st.t > T + ONE.hopDown && (freeLoad > own || st.t > T + ONE.hopDown + 0.5)) {
        /* back through the poise (its shift servo regulates the mass offset again; an
           open-loop unshift from a landing drifts the mass outboard and tips it) */
        st.phase = "load"; st.t = 0; st.caught = true;
      }
    } else if (st.phase === "lift" || st.phase === "hold") {
      const up = st.phase === "lift" ? minJerk(st.t / ONE.lift) : 1;
      airLeg(Math.min(st.dFree, dClear(ONE.clear * up)));
      if (st.phase === "lift" && st.t >= ONE.lift) { st.phase = "hold"; st.t = 0; }
      /* runaway sideways, or the body rolled onto the free wheel: catch */
      const rollOff = (this.out.roll || 0) - st.roll0;
      const bad = Math.abs(e - (st.eAir === undefined ? st.e0 : st.eAir)) > ONE.catchE || Math.abs(rollOff) > ONE.catchRoll || (st.phase === "hold" && freeLoad > own);
      st.bad = bad ? (st.bad || 0) + dt : 0;
      if (st.bad > 0.03) {
        st.phase = "catch";
        st.t = 0;
        st.caught = true;
        st.gammaP = jointState(st.planted.joints.roll).q; /* hold where it is, do not yank */
        this.caught = (this.caught || 0) + 1;
      }
    } else if (st.phase === "lower") {
      const up = 1 - minJerk(st.t / ONE.lower);
      airLeg(dClear(ONE.clear * up - 0.015 * (1 - up)));
      if (freeLoad > own || st.t > ONE.lower + 0.5) { st.phase = "load"; st.t = 0; }
    } else if (st.phase === "catch") {
      /* straight down, fast, a little past where the floor was */
      airLeg(dClear(-0.03 * minJerk(st.t / 0.12)));
      if (freeLoad > own || st.t > 0.4) { st.phase = "load"; st.t = 0; }
    } else if (st.phase === "load") {
      const u = minJerk(st.t / ONE.load);
      carry(1 - u);
      if (st.hopFf) {
        const mdlL = this.lateralModel(st, right);
        P.rollFf = st.hopFf * (1 - u) + u * (-mdlL.gV[1] * (1 - clamp(freeLoad / weight, 0, 1)));
      }
      /* a landing leg is a damper first: the robot arrives rocking about the planted tire and
         a stiff, lightly damped leg just rocks it back over that tire */
      if (st.hopped) { F.c = Math.max(F.c, ONE.landC); P.c = Math.max(P.c, ONE.landC); }
      /* hand the planted hip roll back to its servo */
      if (tauP !== undefined && lo) {
        const js = jointState(st.planted.joints.roll);
        const servo = (ONE.rollKp || 90) * (st.gamma - js.q) - 1.5 * js.rate + (st.planted.rollI || 0);
        tauP = (1 - u) * tauP + u * servo;
      }
      /* after a catch, fall back to the poise (known good) and do not retry the lift */
      if (st.t >= ONE.load) { st.phase = st.caught && !st.next ? "shift" : "unshift"; st.t = 0; st.hold = 0; }
    } else if (st.phase === "unshift") {
      const target = clamp(cmd.shift || 0, -0.6, 0.6);
      const r = st.fast ? 1.2 : 0.2;
      st.gamma += clamp(target - st.gamma, -r * dt, r * dt);
      if (Math.abs(st.gamma - target) < 1e-3) {
        done = true;
        this.mode = st.next || "TWO_WHEEL";
        this.shift = target;
      }
    }

    /* Standing still does not want suspension: both legs stiffen as the sequence starts and
       soften again as it ends. Soft legs let the shift and the body levelling (two integrators)
       ring through the springs, and the sideways model is a rigid leg. */
    st.stiff = clamp((st.stiff || 0) + (st.phase === "unshift" ? -dt : dt) / 0.4, 0, 1);
    const sf = minJerk(st.stiff);
    P.k *= 1 + 3 * sf;
    P.c *= 1 + sf;
    if (F.k < 2000) { F.k *= 1 + 3 * sf; F.c *= 1 + sf; }
    st.e = e;
    st.freeLoad = freeLoad;
    /* after a catch the planted hip roll eases back from where it was caught to the plan */
    if (st.gammaP !== undefined) {
      st.gammaP += clamp(st.gamma - st.gammaP, -0.3 * dt, 0.3 * dt);
      if (Math.abs(st.gammaP - st.gamma) < 1e-3) st.gammaP = undefined;
    }
    P.roll = st.gammaP !== undefined ? st.gammaP : st.gamma;
    F.roll = st.gamma;
    /* Only the planted hip gets the stiff, integrating hold. Two integrating position servos
       on a closed parallelogram (both wheels down) wind up against each other and the fight
       walks the mass toward the planted tire. The free hip stays a soft P hold. */
    P.rollKi = ONE.rollKi;
    F.rollKi = 0;
    P.rollKp = ONE.rollKp;
    F.rollKp = ONE.freeKp;

    if (tauP !== undefined) P.rollTau = tauP;
    /* the lifted wheel stops spinning */
    st.brakeFree = (oneWheel || st.phase === "hop") && st.phase !== "load";
    return { done: done };
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
    if (this.opts.floorOnly) {
      this.scenery.filter(o => o.kind !== "floor").forEach(o => world.removeRigidBody(o.body));
      this.scenery = this.scenery.filter(o => o.kind === "floor");
    }
    const at = this.opts.start || {};
    this.robot = buildRobot(R, world, this.s, { x: at.x || 0, z: at.z || 0, yaw: at.yaw || 0, lift: 0.001 });
    world.step(undefined, this.robot.hooks); /* settles mass properties before the first control tick */
    this.ctrl = new Controller(this.robot);
    this.t = 0;
    this.last = {};
  };

  /** Actuator limits can change live; geometry and mass rebuild the robot. */
  Sim.prototype.setKnobs = function (knobs) {
    const live = ["tauWheel", "wheelNoLoad", "tauKnee", "tauHip", "tauRoll", "ride", "legHz", "legZeta", "reflex", "legCatch", "oneLift", "oneHop", "hopKeep", "jointNoLoad", "torqueLagMs", "sensorDelayMs"];
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
    this.world.step(undefined, this.robot.hooks);
    this.t += dt;
    return this.last;
  };

  /** Push the body: impulse in N·s, world frame. */
  Sim.prototype.shove = function (imp) {
    this.robot.trunk.applyImpulse(imp, true);
  };

  const api = {
    tireCollider: tireCollider,
    tireVertices: tireVertices,
    KNOBS: KNOBS,
    RX: RX,
    LAT_TRIM: LAT_TRIM,
    ONE: ONE,
    MODES: MODES,
    IN: IN,
    spec: spec,
    legIk: legIk,
    lqrGains: lqrGains,
    dlqr: dlqr,
    setLateralWeights: function (q, r) { LAT_Q = q; LAT_R = r; },
    buildWorld: buildWorld,
    buildRobot: buildRobot,
    Controller: Controller,
    Sim: Sim,
    vec: { v: v, add: add, sub: sub, mul: mul, dot: dot, cross: cross, len: len, norm: norm, qRot: qRot, qAxis: qAxis }
  };
  root.HuxSim = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
