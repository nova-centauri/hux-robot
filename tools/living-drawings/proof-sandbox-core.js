/* V1-PROOF 3D sandbox core. Wraps the study simulator (tools/v1-proof/sim.js) without
 * changing its plant or controller: adds the physical test fixtures as fixed colliders,
 * spawn points, shoves in the robot's own frame, fall detection and a slow leg-height
 * preview. SI units; +X forward, +Y left, +Z up (same as sim.js).
 *
 * Leg-height preview: sim.js has pinned legs. Here the leg angle can be moved slowly at
 * run time by re-placing the sprung CoM and the pitch trim for the new pose, exactly as
 * sim.js does for a pinned pose at construction. Leg inertia, servo torque/reaction and
 * the servo's own dynamics are NOT modelled. Pinned poses of 15°, 30° and 45° are inside
 * the saved study; the motion between them is not.
 *
 * Node: require('./proof-sandbox-core')(require('../v1-proof/sim')).
 * Browser: HuxProofSandbox(HuxProofSimFactory(RAPIER, HuxProof.model)).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.HuxProofSandbox = factory;
})(typeof self !== "undefined" ? self : this, function (S) {
  "use strict";
  const { R, model, DEFAULTS, Simulation, clamp } = S;
  const g = model.geometry;
  const L = g.link_length_mm / 1000, RADIUS = g.wheel_diameter_mm / 2000, DEG = Math.PI / 180;
  const LEG_MIN = g.leg_angle_deg[0], LEG_MAX = g.leg_angle_deg[1], LEG_NEUTRAL = g.neutral_angle_deg;
  const LEG_RATE_DEG_S = 10;     // assumed slow preview rate; full 15–45° range in 3 s
  const FALL_DEG = 45;           // same tilt limit the study runner uses to stop a run
  const GROUND_GROUPS = 0x00010002;

  /* Upright pose numbers, same formulas as review.py / proof.js. */
  function pose(deg, massKg) {
    const q = deg * DEG, m = massKg || model.limits.mass_target_kg;
    const drop = L * Math.cos(q), rear = L * Math.sin(q);
    return {
      angle: deg,
      pivotX: rear, pivotZ: drop,                                  // body-frame, from the axle
      heightMm: g.wheel_diameter_mm / 2 + drop * 1000 + g.body_above_lower_pivot_mm,
      axleRearMm: rear * 1000,
      servoNm: m * 9.81 * model.leg_screen.worst_two_wheel_load_share * rear /
        (g.leg_reduction * g.transmission_efficiency_assumed),
      servoTravelDeg: (deg - LEG_NEUTRAL) * g.leg_reduction
    };
  }
  const WIDTH_MM = g.wheel_track_mm + g.wheel_width_mm;

  /* ---------- course: the physical protocol's fixtures, laid out as parallel lanes ----------
     Every lane starts at x = 0 facing +X. Heights and lengths come from v1-proof-validation.md. */
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const T3 = Math.tan(3 * DEG);
  const LANES = [
    { id: "open", y: 0, label: "Open floor · 2 m marks, pivot circle", spawn: true },
    { id: "grade", y: 1.1, label: "3° grade · up, 0.8 m top, down", spawn: true,
      surface: { x0: 0.6, x1: 3.4, y0: -0.4, y1: 0.4, nx: 56, ny: 2,
        z: x => { const u = x - 0.6; return T3 * Math.max(0, Math.min(u, 1.0, 2.8 - u)); } } },
    { id: "cross", y: 2.0, label: "3° cross-slope · left side high", spawn: true,
      surface: { x0: 0.6, x1: 3.4, y0: -0.25, y1: 0.25, nx: 56, ny: 10,
        z: (x, y) => { const u = x - 0.6; return T3 * (y + 0.25) * smooth(u / 0.8) * smooth((2.8 - u) / 0.8); } } },
    { id: "bump", y: -1.0, label: "5 mm smooth bump · 300 mm long", spawn: true,
      surface: { x0: 1.0, x1: 1.3, y0: -0.4, y1: 0.4, nx: 40, ny: 1,
        z: x => 0.005 * (1 - Math.cos(2 * Math.PI * (x - 1.0) / 0.3)) / 2 } },
    { id: "one-wheel-bump", y: -1.8, label: "5 mm bump under the left wheel only", spawn: true,
      surface: { x0: 1.0, x1: 1.3, y0: 0.06, y1: 0.3, nx: 40, ny: 1,
        z: x => 0.005 * (1 - Math.cos(2 * Math.PI * (x - 1.0) / 0.3)) / 2 } },
    { id: "seam", y: -2.6, label: "3 mm square seam · 1.2 m strip", spawn: true,
      box: { x0: 1.0, x1: 2.2, y0: -0.4, y1: 0.4, h: 0.003 } },
    { id: "obstacle", y: -3.4, label: "20 mm threshold · outside the study envelope", spawn: true, challenge: true,
      box: { x0: 1.0, x1: 2.2, y0: -0.4, y1: 0.4, h: 0.020 } }
  ];

  /* Surface as a closed-sided triangle mesh: top grid plus vertical skirts down to z = 0,
     so a wheel that rolls off an edge meets a face rather than a gap. Same arrays drive the view. */
  function surfaceMesh(lane) {
    const s = lane.surface, verts = [], ids = [];
    const vx = i => s.x0 + (s.x1 - s.x0) * i / s.nx, vy = j => s.y0 + (s.y1 - s.y0) * j / s.ny;
    const top = (i, j) => i * (s.ny + 1) + j;
    for (let i = 0; i <= s.nx; i++) for (let j = 0; j <= s.ny; j++) verts.push(vx(i), lane.y + vy(j), s.z(vx(i), vy(j)));
    for (let i = 0; i < s.nx; i++) for (let j = 0; j < s.ny; j++) {
      const a = top(i, j), b = top(i + 1, j), c = top(i + 1, j + 1), d = top(i, j + 1);
      ids.push(a, b, c, a, c, d);
    }
    const edge = [];
    for (let i = 0; i <= s.nx; i++) edge.push(top(i, 0));
    for (let j = 1; j <= s.ny; j++) edge.push(top(s.nx, j));
    for (let i = s.nx - 1; i >= 0; i--) edge.push(top(i, s.ny));
    for (let j = s.ny - 1; j >= 1; j--) edge.push(top(0, j));
    const base = verts.length / 3;
    edge.forEach(k => verts.push(verts[3 * k], verts[3 * k + 1], 0));
    for (let e = 0; e < edge.length; e++) {
      const n = (e + 1) % edge.length, a = edge[e], b = edge[n];
      if (Math.abs(verts[3 * a + 2]) < 1e-7 && Math.abs(verts[3 * b + 2]) < 1e-7) continue;
      ids.push(a, base + e, base + n, a, base + n, b);
    }
    return { vertices: new Float32Array(verts), indices: new Uint32Array(ids) };
  }

  function addCourse(sim) {
    const mu = sim.p.mu, add = desc => sim.ground.push(sim.world.createCollider(
      desc.setFriction(mu).setRestitution(0).setCollisionGroups(GROUND_GROUPS)));
    for (const lane of LANES) {
      if (lane.surface) { const m = surfaceMesh(lane); add(R.ColliderDesc.trimesh(m.vertices, m.indices)); }
      if (lane.box) {
        const b = lane.box;
        add(R.ColliderDesc.cuboid((b.x1 - b.x0) / 2, (b.y1 - b.y0) / 2, b.h / 2)
          .setTranslation((b.x0 + b.x1) / 2, lane.y + (b.y0 + b.y1) / 2, b.h / 2));
      }
    }
  }

  const quatYaw = yaw => ({ x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) });
  const quatMul = (a, b) => ({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
  });

  /* Move the freshly built robot to a lane start. Only valid before the first step. */
  function place(sim, x, y, yaw) {
    const c = Math.cos(yaw), s = Math.sin(yaw), z = sim.body.translation().z;
    sim.body.setTranslation({ x, y, z }, true);
    sim.body.setRotation(quatMul(quatYaw(yaw), sim.body.rotation()), true);
    sim.wheels.forEach((w, i) => {
      const side = i === 0 ? 1 : -1, oy = side * sim.track / 2;
      w.body.setTranslation({ x: x - s * oy, y: y + c * oy, z }, true);
      w.body.setRotation(quatYaw(yaw), true);
    });
    sim.lastYaw = yaw; // heading counts turns from the spawn direction
  }

  /* Re-place the sprung CoM, body collider and pitch trim for a new pinned pose,
     mirroring the Simulation constructor. */
  function applyLegAngle(sim, deg) {
    const p = sim.p, q = deg * DEG;
    sim.geomX = L * (Math.sin(q) - Math.sin(Math.PI / 6));
    sim.h = p.comHeight + L * (Math.cos(q) - Math.cos(Math.PI / 6));
    sim.trim = -Math.atan2(sim.geomX, sim.h);
    const I = sim.sprung * (0.12 ** 2 + 0.18 ** 2) / 12 * p.inertiaScale;
    sim.body.setAdditionalMassProperties(sim.sprung,
      { x: sim.geomX + p.comOffset, y: p.lateralCom, z: sim.h }, { x: I, y: I, z: I * 0.65 },
      { x: 0, y: 0, z: 0, w: 1 }, true);
    sim.bodyCol.setTranslationWrtParent({ x: sim.geomX, y: 0, z: sim.h + 0.02 });
    p.legAngle = deg;
  }

  class Sandbox {
    constructor(params = {}, laneId = "open") {
      this.params = { ...params };
      this.sim = new Simulation(this.params);
      addCourse(this.sim);
      const lane = LANES.find(l => l.id === laneId) || LANES[0];
      this.lane = lane.id;
      place(this.sim, 0, lane.y, 0);
      this.legAngle = this.legTarget = this.sim.p.legAngle;
      this.legMoving = false;
      this.fallen = null;
      this.push = null;     // {until, fx, fy, height} in robot frame
      this.time = 0;
      this.killed = false;
    }
    get dt() { return this.sim.dt; }
    get trim() { return this.sim.trim; }
    setLegTarget(deg) { this.legTarget = clamp(deg, LEG_MIN, LEG_MAX); }
    setKilled(off) { this.killed = off; this.sim.p.enabled = !off && !this.fallen; }
    /* Impulse [N·s] over `duration` [s] at `height` [m], fore (+ forward) and side (+ left) of the robot. */
    shove(fore, side, duration, height) {
      this.push = { until: this.time + duration, fx: fore / duration, fy: side / duration, height: height || 0.20 };
    }
    step(command) {
      const sim = this.sim, dt = sim.dt;
      if (this.legAngle !== this.legTarget) {
        const d = clamp(this.legTarget - this.legAngle, -LEG_RATE_DEG_S * dt, LEG_RATE_DEG_S * dt);
        this.legAngle += d;
        if (Math.abs(this.legTarget - this.legAngle) < 1e-9) this.legAngle = this.legTarget;
        applyLegAngle(sim, this.legAngle);
        this.legMoving = true;
      } else this.legMoving = false;
      let push = null;
      if (this.push && this.time < this.push.until) {
        const yaw = sim.state().yaw, c = Math.cos(yaw), s = Math.sin(yaw);
        push = { x: this.push.fx * c - this.push.fy * s, y: this.push.fx * s + this.push.fy * c, height: this.push.height };
      } else this.push = null;
      const out = sim.step(this.fallen ? { speed: 0, yaw: 0 } : command, push);
      this.time += dt;
      if (!this.fallen && this.time > 0.3) {
        const tilt = Math.abs(out.pitch - sim.trim) / DEG, roll = Math.abs(out.roll) / DEG;
        if (sim.metrics.bodyContact) this.fallen = "body touched the ground";
        else if (tilt > FALL_DEG) this.fallen = "tipped past 45° in pitch";
        else if (roll > FALL_DEG) this.fallen = "tipped past 45° in roll";
        if (this.fallen) sim.p.enabled = false; // tilt fault: drive off, as the firmware should
      }
      return out;
    }
    /* Everything the HUD needs, in display units. */
    telemetry() {
      const sim = this.sim, o = sim.out, p = sim.p, pz = pose(this.legAngle, p.mass);
      const currents = o.currents || [0, 0];
      return {
        t: this.time, x: o.x, y: o.y, speed: o.speed || 0, heading: (o.heading || 0) / DEG,
        pitchErr: ((o.pitch || 0) - sim.trim) / DEG, trim: sim.trim / DEG, roll: (o.roll || 0) / DEG,
        currents, torques: o.torques || [0, 0],
        voltage: p.voltage - p.batteryResistance * (currents[0] + currents[1]),
        odom: sim.odom, speedRef: sim.speedRef, yawRef: sim.yawRef,
        legAngle: this.legAngle, legMoving: this.legMoving,
        heightMm: pz.heightMm, axleRearMm: pz.axleRearMm, servoNm: pz.servoNm,
        air: sim.air.slice(), enabled: p.enabled, fallen: this.fallen, pushing: !!this.push
      };
    }
    free() { this.sim.free(); }
  }

  return { Sandbox, LANES, surfaceMesh, pose, applyLegAngle, place, WIDTH_MM, RADIUS, L,
    LEG_MIN, LEG_MAX, LEG_NEUTRAL, LEG_RATE_DEG_S, DEFAULTS, model };
});
