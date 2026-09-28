/* V1-PROOF 3D sandbox: view, input and HUD. Physics and control are the study's own
 * tools/v1-proof/sim.js, wrapped by proof-sandbox-core.js; this file only draws the bodies
 * and turns keys into the same {speed, yaw} commands the study runner sends.
 * World and three.js share axes: +X forward, +Y left, +Z up, metres. */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const hudLeft = $("hudLeft"), hudRight = $("hudRight"), banner = $("banner");
const stage = $("stage"), canvas = $("view");

async function main() {
  let THREE, OrbitControls, CSS2DRenderer, CSS2DObject, RAPIER;
  try {
    THREE = await import("three");
    OrbitControls = (await import("three/addons/controls/OrbitControls.js")).OrbitControls;
    ({ CSS2DRenderer, CSS2DObject } = await import("three/addons/renderers/CSS2DRenderer.js"));
    RAPIER = (await import("https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.20.0/dist/rapier.mjs")).default;
    await RAPIER.init();
  } catch (err) {
    hudLeft.textContent = "Could not load three.js or Rapier from jsDelivr. The sandbox needs a network connection the first time. " + (err && err.message ? err.message : "");
    return;
  }

  const S = window.HuxProofSimFactory(RAPIER, window.HuxProof.model);
  const B = window.HuxProofSandbox(S);
  const M = B.model, G = M.geometry, DEG = Math.PI / 180;
  const R = B.RADIUS, TRACK = G.wheel_track_mm / 1000, WW = G.wheel_width_mm / 1000;
  const BODY = { d: G.body_depth_mm / 1000, w: G.body_width_mm / 1000, h: G.body_above_lower_pivot_mm / 1000 };
  const PIVOT_GAP = G.pivot_separation_mm / 1000;
  const fmtMm = v => `${v.toFixed(0)} mm`;

  /* ---------- dimension stamp ---------- */
  const tall = B.pose(B.LEG_MIN), low = B.pose(B.LEG_MAX);
  [["Height, upright", `${low.heightMm.toFixed(0)}–${tall.heightMm.toFixed(0)} mm`],
   ["Width over tires", `${B.WIDTH_MM} mm`],
   ["Wheels", `${G.wheel_diameter_mm} × ${G.wheel_width_mm} mm`],
   ["Mass, target", `${M.limits.mass_target_kg.toFixed(1)} kg · ${M.limits.mass_max_kg.toFixed(1)} max`]].forEach(([k, v]) => {
    const div = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = k; dd.textContent = v; div.append(dt, dd); $("stamp").append(div);
  });

  /* ---------- study knobs ---------- */
  const mm = v => `${(v * 1000).toFixed(1)} mm`, ms = v => `${(v * 1000).toFixed(0)} ms`;
  const KNOBS = [
    { key: "mass", label: "Total mass", min: 2.0, max: 3.2, step: 0.05, fmt: v => `${v.toFixed(2)} kg`, rebuild: true, note: "study 2.3–3.0" },
    { key: "comHeight", label: "CoM above axle at 30°", min: 0.11, max: 0.18, step: 0.005, fmt: mm, rebuild: true, note: "study 125–160" },
    { key: "comOffset", label: "CoM fore/aft offset", min: -0.006, max: 0.006, step: 0.0005, fmt: mm, rebuild: true, note: "build to ±2" },
    { key: "lateralCom", label: "CoM sideways offset", min: -0.006, max: 0.006, step: 0.0005, fmt: mm, rebuild: true },
    { key: "mu", label: "Tire friction μ", min: 0.3, max: 1.0, step: 0.05, fmt: v => v.toFixed(2), rebuild: true, note: "study 0.45–0.80" },
    { key: "voltage", label: "Battery, loaded", min: 9.9, max: 12.6, step: 0.1, fmt: v => `${v.toFixed(1)} V` },
    { key: "motorScale", label: "Motor torque ×", min: 0.6, max: 1.0, step: 0.05, fmt: v => v.toFixed(2), note: "study 0.8–1.0" },
    { key: "mismatch", label: "Left/right motor mismatch", min: -0.1, max: 0.1, step: 0.01, fmt: v => `${(v * 100).toFixed(0)} %` },
    { key: "delay", label: "Attitude delay", min: 0, max: 0.03, step: 0.001, fmt: ms, note: "study 2–6; 25 fails" },
    { key: "driveLag", label: "Drive response", min: 0.002, max: 0.02, step: 0.001, fmt: ms },
    { key: "deadTorque", label: "Motor deadband", min: 0, max: 0.03, step: 0.001, fmt: v => `${(v * 1000).toFixed(0)} mN·m` },
    { key: "backlash", label: "Gear lost motion", min: 0, max: 3 * DEG, step: 0.1 * DEG, fmt: v => `${(v / DEG).toFixed(1)}°`, note: "2° is a challenge" }
  ];
  const knobVals = {};
  const knobInputs = {};
  function knobLabel(k) { return `${k.fmt(knobVals[k.key])}`; }
  KNOBS.forEach(k => {
    knobVals[k.key] = B.DEFAULTS[k.key];
    const wrap = document.createElement("div"), label = document.createElement("label"), out = document.createElement("output"), input = document.createElement("input");
    input.type = "range"; input.min = k.min; input.max = k.max; input.step = k.step; input.value = knobVals[k.key]; input.id = "k_" + k.key;
    label.htmlFor = input.id;
    label.append(`${k.label} `, out);
    const tag = document.createElement("small"); tag.textContent = (k.rebuild ? "rebuild" : "live") + (k.note ? ` · ${k.note}` : ""); label.append(tag);
    out.textContent = knobLabel(k);
    input.addEventListener("input", () => {
      knobVals[k.key] = Number(input.value); out.textContent = knobLabel(k);
      if (k.rebuild) build(); else sb.sim.p[k.key] = knobVals[k.key];
    });
    knobInputs[k.key] = { input, out, k };
    wrap.append(label, input); $("knobs").append(wrap);
  });
  $("knobReset").addEventListener("click", () => {
    KNOBS.forEach(k => { knobVals[k.key] = B.DEFAULTS[k.key]; knobInputs[k.key].input.value = knobVals[k.key]; knobInputs[k.key].out.textContent = knobLabel(k); });
    build();
  });

  /* ---------- sandbox lifecycle ---------- */
  const laneSel = $("lane");
  B.LANES.forEach(l => { const o = document.createElement("option"); o.value = l.id; o.textContent = l.label; laneSel.append(o); });
  let lane = "open", sb = null, killed = false, paused = false, legHold = 0;
  const hist = { n: 500, pitch: [], curL: [], curR: [], speed: [], ref: [] };
  let lastSample = -1;
  function build() {
    const leg = sb ? sb.legTarget : B.LEG_NEUTRAL;
    if (sb) sb.free();
    sb = new B.Sandbox({ ...knobVals, legAngle: leg }, lane);
    sb.setKilled(killed);
    for (const k of ["pitch", "curL", "curR", "speed", "ref"]) hist[k].length = 0;
    lastSample = -1;
    snapCamera = true;
  }
  laneSel.addEventListener("change", () => { lane = laneSel.value; build(); stage.focus(); });

  /* ---------- renderer and scene ---------- */
  THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const labels = new CSS2DRenderer();
  labels.domElement.style.position = "absolute";
  labels.domElement.style.inset = "0";
  labels.domElement.style.pointerEvents = "none";
  stage.insertBefore(labels.domElement, hudLeft);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8ebe2);
  scene.fog = new THREE.Fog(0xe8ebe2, 5, 14);
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.01, 60);
  camera.position.set(-0.9, 0, 0.4);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.enabled = false;
  orbit.minDistance = 0.15;
  orbit.maxDistance = 8;

  scene.add(new THREE.HemisphereLight(0xfbfdf6, 0x7d8a78, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1.2, right: 1.2, top: 1.2, bottom: -1.2, near: 0.2, far: 8 });
  sun.shadow.bias = -0.0003;
  scene.add(sun, sun.target);

  const mat = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...(o || {}) });
  const MAT = {
    plywood: mat(0xd8b98a, { roughness: 0.85, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }),
    alu: mat(0xc3c9cc, { roughness: 0.4, metalness: 0.6 }),
    link: mat(0x2f6b56, { roughness: 0.45, metalness: 0.4 }),
    motor: mat(0x3a3f45, { roughness: 0.35, metalness: 0.7 }),
    servo: mat(0x1d2124, { roughness: 0.6 }),
    battery: mat(0x33475e, { roughness: 0.6 }),
    board: mat(0x1f6b3f, { roughness: 0.6 }),
    driver: mat(0x5b3f86, { roughness: 0.6 }),
    tire: mat(0x1f2522, { roughness: 0.95 }),
    hub: mat(0xc9d1c6, { roughness: 0.5, metalness: 0.3 }),
    pulley: mat(0xa65431, { roughness: 0.5, metalness: 0.3 }),
    belt: mat(0x292b2b, { roughness: 0.9 }),
    com: mat(0xf2c230, { roughness: 0.4, emissive: 0x6b4d00 }),
    dim: new THREE.MeshBasicMaterial({ color: 0xa65431 }),
    contact: new THREE.MeshBasicMaterial({ color: 0x265f4d })
  };
  const shadow = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const box = (sx, sy, sz, material) => shadow(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material));
  const cylY = (r, len, material, seg) => shadow(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 32), material)); // axis +Y (lateral)
  function label(text, cls) {
    const el = document.createElement("div");
    el.className = "label3d" + (cls ? " " + cls : "");
    el.textContent = text;
    return new CSS2DObject(el);
  }

  /* ---------- floor, markings, fixtures ---------- */
  (function floor() {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#eef0e8"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "#d3dacd"; g.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) { const p = i * 51.2; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.moveTo(0, p); g.lineTo(512, p); g.stroke(); }
    g.strokeStyle = "#aebaa9"; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(16, 16);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat(0xffffff, { map: tex, roughness: 0.92 }));
    f.receiveShadow = true;
    scene.add(f);
  })();
  const tape = (x, y, sx, sy, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), new THREE.MeshBasicMaterial({ color: color || 0x265f4d })); m.position.set(x, y, 0.0006); scene.add(m); return m; };
  const ring = (x, y, r, color) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.006, r + 0.006, 64), new THREE.MeshBasicMaterial({ color: color || 0xa65431 })); m.position.set(x, y, 0.0007); scene.add(m); };
  const laneLabels = new THREE.Group(); scene.add(laneLabels);
  for (const L of B.LANES) {
    tape(0, L.y, 0.015, 0.36);
    const lab = label(L.label, L.challenge ? "warn" : ""); lab.position.set(-0.28, L.y, 0.01); lab.center.set(1, 0.5); laneLabels.add(lab);
    if (L.surface) {
      const m = B.surfaceMesh(L);
      let geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(m.vertices, 3));
      geo.setIndex(Array.from(m.indices));
      geo = geo.toNonIndexed(); geo.computeVertexNormals();
      const color = { grade: 0xd6c7a4, cross: 0xcdbf9c, bump: 0xa8bca3, "one-wheel-bump": 0xa8bca3 }[L.id] || 0xcccccc;
      scene.add(shadow(new THREE.Mesh(geo, mat(color, { roughness: 0.85, side: THREE.DoubleSide }))));
    }
    if (L.box) {
      const b = L.box, m = box(b.x1 - b.x0, b.y1 - b.y0, b.h, mat(L.challenge ? 0xb86b45 : 0x98a396, { roughness: 0.8 }));
      m.position.set((b.x0 + b.x1) / 2, L.y + (b.y0 + b.y1) / 2, b.h / 2); scene.add(m);
    }
  }
  // Open lane: the protocol's 2 m marks and ±0.12 m endpoint circles.
  for (const x of [-2, -1, 1, 2]) {
    tape(x, 0, 0.012, 0.3, Math.abs(x) === 2 ? 0xa65431 : 0x7f9a86);
    const l = label(`${x > 0 ? "+" : "−"}${Math.abs(x)} m`); l.position.set(x, -0.2, 0.01); laneLabels.add(l);
  }
  ring(2, 0, 0.12); ring(-2, 0, 0.12); ring(0, 0, 0.12, 0x7f9a86);

  /* ---------- size references ---------- */
  const refs = new THREE.Group(); scene.add(refs);
  (function sizeRefs() {
    const can = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.122, 40), mat(0xb23a2e, { roughness: 0.35, metalness: 0.5 })));
    can.rotation.x = Math.PI / 2; can.position.set(0.5, 0.42, 0.061); refs.add(can);
    let l = label("12 oz can · 122 mm"); l.position.set(0.5, 0.42, 0.14); refs.add(l);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.279, 0.216), mat(0xfbfbf6, { roughness: 0.95 }));
    sheet.position.set(0.5, -0.42, 0.0009); sheet.receiveShadow = true; refs.add(sheet);
    l = label("US Letter sheet"); l.position.set(0.5, -0.42, 0.01); refs.add(l);
    // Parked STAIR-V1 envelope: 24" tall, 14" wide. Depth drawn at 8" body length.
    const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.203, 0.356, 0.610)),
      new THREE.LineDashedMaterial({ color: 0x5c6c63, dashSize: 0.02, gapSize: 0.012 }));
    ghost.computeLineDistances(); ghost.position.set(1.05, 0.45, 0.305); refs.add(ghost);
    l = label("Parked STAIR-V1 envelope · 610 × 356 mm"); l.position.set(1.05, 0.45, 0.64); refs.add(l);
  })();
  $("showRefs").addEventListener("change", e => { refs.visible = e.target.checked; });

  /* ---------- robot ----------
     `robot` follows the sprung body; its origin is the axle centre (sim.js body frame).
     `chassis` sits at the lower leg pivot, which moves relative to the axle with leg angle. */
  const robot = new THREE.Group(); scene.add(robot);
  const chassis = new THREE.Group(); robot.add(chassis);
  const cx = -(BODY.d - 0.005);  // body spans pivot-115 … pivot+5 mm, as in the 2D sheet
  const bodyCx = cx + BODY.d / 2;
  (function buildChassis() {
    for (const s of [1, -1]) { const p = box(BODY.d, 0.004, BODY.h, MAT.plywood); p.position.set(bodyCx, s * (BODY.w / 2 - 0.002), BODY.h / 2); p.castShadow = false; chassis.add(p); }
    for (const z of [0.0015, 0.1, BODY.h - 0.0015]) { const p = box(BODY.d, BODY.w - 0.008, 0.003, MAT.alu); p.position.set(bodyCx, 0, z); chassis.add(p); }
    const bat = box(0.106, 0.034, 0.026, MAT.battery); bat.position.set(bodyCx, 0, 0.003 + 0.013 + 0.001); chassis.add(bat);
    const pico = box(0.051, 0.021, 0.004, MAT.board); pico.position.set(bodyCx - 0.02, -0.018, 0.1035); chassis.add(pico);
    const imu = box(0.025, 0.018, 0.003, MAT.driver); imu.position.set(bodyCx - 0.005, 0.03, 0.103); imu.material = mat(0x2a3f86); chassis.add(imu);
    for (const s of [1, -1]) { const d = box(0.018, 0.015, 0.003, MAT.driver); d.position.set(bodyCx + 0.035, s * 0.02, 0.103); chassis.add(d); }
    for (const s of [1, -1]) {
      // ST3215 (45.2 × 24.7 × 35 mm) inside the side plate; output shaft lateral, 3:1 belt to the pivot pulley outside.
      const servo = box(0.0452, 0.0247, 0.035, MAT.servo); servo.position.set(-0.03, s * 0.0355, 0.045); chassis.add(servo);
      const small = cylY(0.008, 0.008, MAT.pulley); small.position.set(-0.04, s * 0.062, 0.04); chassis.add(small);
      const big = cylY(0.024, 0.008, MAT.pulley); big.position.set(0, s * 0.062, 0); chassis.add(big);
      chassis.add(beltLoop(s * 0.062, [0, 0, 0.0245], [-0.04, 0.04, 0.0085]));
      for (const z of [0, PIVOT_GAP]) { const sh = cylY(0.004, 0.04, MAT.alu, 16); sh.position.set(0, s * 0.071, z); chassis.add(sh); }
    }
  })();
  function beltLoop(y, a, b) {
    // Convex hull of two pulley circles in the XZ plane, drawn as a closed tube.
    const pts = [];
    for (const [x, z, r] of [a, b]) for (let i = 0; i < 48; i++) { const t = i / 48 * 2 * Math.PI; pts.push([x + r * Math.cos(t), z + r * Math.sin(t)]); }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    const lo = [], hi = [];
    for (const p of pts) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1)).map(([x, z]) => new THREE.Vector3(x, y, z));
    return shadow(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hull, true), 160, 0.0015, 6, true), MAT.belt));
  }
  // Parallel links (two per side) and wheel carriers with inboard gearmotors, in the axle frame.
  const links = [];
  for (const s of [1, -1]) for (const z of [0, PIVOT_GAP]) {
    const m = box(0.012, 0.005, B.L, MAT.link); robot.add(m); links.push({ m, y: s * 0.086, z });
  }
  for (const s of [1, -1]) {
    const plate = box(0.03, 0.004, 0.07, MAT.alu); plate.position.set(0, s * 0.092, 0.018); robot.add(plate);
    // Pololu 4752: 37 mm diameter; ~68 mm body length assumed from the part name. Check the PDF drawing for the encoder end.
    const motor = cylY(0.0185, 0.068, MAT.motor); motor.position.set(0, s * (0.09 - 0.034), 0); robot.add(motor);
  }
  const wheels = [0, 1].map(() => {
    const g = new THREE.Group(); scene.add(g);
    g.add(cylY(R, WW, MAT.tire, 56));
    const hub = cylY(0.03, WW + 0.002, MAT.hub, 40); g.add(hub);
    for (let i = 0; i < 5; i++) { const sp = box(0.006, WW + 0.004, 0.05, MAT.alu); sp.rotation.y = i * 2 * Math.PI / 5; sp.position.set(0.025 * Math.sin(i * 2 * Math.PI / 5), 0, 0.025 * Math.cos(i * 2 * Math.PI / 5)); g.add(sp); }
    return g;
  });
  const comMark = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.009, 20, 14), MAT.com)); robot.add(comMark);

  /* Dimensions & CoM overlay (world-space, yaw-only). */
  const dims = new THREE.Group(); scene.add(dims);
  const dimV = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 1), MAT.dim); dims.add(dimV);
  const dimTop = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.002, 0.002), MAT.dim); dims.add(dimTop);
  const dimW = new THREE.Mesh(new THREE.BoxGeometry(0.002, B.WIDTH_MM / 1000, 0.002), MAT.dim); dimW.position.set(-0.13, 0, 0.003); dims.add(dimW);
  for (const s of [1, -1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 0.03), MAT.dim); t.position.set(-0.13, s * B.WIDTH_MM / 2000, 0.015); dims.add(t); }
  const heightLabel = label("", "dim"); dims.add(heightLabel);
  const widthLabel = label(`${B.WIDTH_MM} mm over tires`, "dim"); widthLabel.position.set(-0.13, 0, 0); widthLabel.center.set(0.5, -0.4); dims.add(widthLabel);
  const comLine = new THREE.Mesh(new THREE.BoxGeometry(0.0015, 0.0015, 1), MAT.com); scene.add(comLine);
  const contactLine = new THREE.Mesh(new THREE.BoxGeometry(1, 0.004, 0.001), MAT.contact); scene.add(contactLine);
  const comLabel = label("CoM", ""); scene.add(comLabel);
  $("showDims").addEventListener("change", e => { dims.visible = comLine.visible = contactLine.visible = comMark.visible = comLabel.visible = e.target.checked; });

  /* ---------- per-frame pose sync ---------- */
  const tmpV = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpP = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  const corners = [];
  for (const x of [cx, cx + BODY.d]) for (const y of [-BODY.w / 2, BODY.w / 2]) corners.push(new THREE.Vector3(x, y, BODY.h));
  let bodyTopMm = 0;
  function syncVisuals() {
    const sim = sb.sim, pos = sim.body.translation(), q = sim.body.rotation();
    robot.position.set(pos.x, pos.y, pos.z);
    robot.quaternion.set(q.x, q.y, q.z, q.w);
    const qa = sb.legAngle * DEG, px = B.L * Math.sin(qa), pz = B.L * Math.cos(qa);
    chassis.position.set(px, 0, pz);
    for (const l of links) {
      tmpP.set(px, l.y, pz + l.z); tmpA.set(0, l.y, l.z);
      l.m.position.addVectors(tmpP, tmpA).multiplyScalar(0.5);
      l.m.quaternion.setFromUnitVectors(Z, tmpV.subVectors(tmpA, tmpP).normalize());
    }
    sim.wheels.forEach((w, i) => { const t = w.body.translation(), r = w.body.rotation(); wheels[i].position.set(t.x, t.y, t.z); wheels[i].quaternion.set(r.x, r.y, r.z, r.w); });
    comMark.position.set(sim.geomX + sim.p.comOffset, sim.p.lateralCom, sim.h);
    robot.updateMatrixWorld(true);
    // Live top of body, as balanced (pitch trim included).
    let top = 0;
    for (const c of corners) { tmpV.copy(c).applyMatrix4(chassis.matrixWorld); top = Math.max(top, tmpV.z); }
    bodyTopMm = top * 1000;
    const yaw = sim.state().yaw;
    dims.position.set(pos.x, pos.y, 0); dims.rotation.set(0, 0, yaw);
    dimV.position.set(0, -0.16, top / 2); dimV.scale.z = Math.max(0.001, top);
    dimTop.position.set(0, -0.16, top);
    heightLabel.position.set(0, -0.17, top / 2); heightLabel.center.set(1, 0.5);
    heightLabel.element.textContent = `${bodyTopMm.toFixed(0)} mm tall now`;
    const com = comMark.getWorldPosition(tmpV);
    comLine.position.set(com.x, com.y, com.z / 2); comLine.scale.z = Math.max(0.001, com.z);
    comLabel.position.set(com.x, com.y, com.z + 0.02);
    const a = wheels[0].position, b = wheels[1].position;
    contactLine.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 0.001 + Math.min(a.z, b.z) - R);
    contactLine.scale.x = Math.hypot(a.x - b.x, a.y - b.y) + WW;
    contactLine.rotation.set(0, 0, Math.atan2(b.y - a.y, b.x - a.x));
    sun.target.position.set(pos.x, pos.y, 0);
    sun.position.set(pos.x + 1.4, pos.y - 1.8, 3.2);
  }

  /* ---------- camera ---------- */
  const camSel = $("camera");
  let camMode = "chase", zoom = 1, snapCamera = true;
  const camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3(), look = new THREE.Vector3();
  camSel.addEventListener("change", () => setCamera(camSel.value));
  function setCamera(mode) {
    camMode = mode; camSel.value = mode;
    orbit.enabled = mode === "orbit";
    if (orbit.enabled) orbit.target.copy(look);
    snapCamera = mode !== "orbit";
  }
  function updateCamera(dt) {
    const p = robot.position, yaw = sb.sim.state().yaw, fx = Math.cos(yaw), fy = Math.sin(yaw);
    lookGoal.set(p.x, p.y, 0.13);
    if (camMode === "orbit") {
      tmpV.subVectors(lookGoal, orbit.target);
      orbit.target.add(tmpV); camera.position.add(tmpV);
      orbit.update(); look.copy(orbit.target); return;
    }
    const d = 0.95 * zoom;
    if (camMode === "chase") camGoal.set(p.x - fx * d, p.y - fy * d, 0.13 + 0.42 * zoom);
    else if (camMode === "side") camGoal.set(p.x - fy * d, p.y + fx * d, 0.16);
    else if (camMode === "front") camGoal.set(p.x + fx * d, p.y + fy * d, 0.2);
    else camGoal.set(p.x - fx * 0.02, p.y - fy * 0.02, 1.7 * zoom);
    const k = snapCamera ? 1 : 1 - Math.exp(-dt * 5);
    camera.position.lerp(camGoal, k); look.lerp(lookGoal, snapCamera ? 1 : 1 - Math.exp(-dt * 10));
    camera.lookAt(look); snapCamera = false;
  }
  canvas.addEventListener("wheel", e => {
    if (camMode === "orbit") return;
    e.preventDefault(); zoom = Math.min(4, Math.max(0.3, zoom * Math.exp(e.deltaY * 0.001)));
  }, { passive: false });

  /* ---------- input ---------- */
  const keys = new Set();
  const legBtns = [...document.querySelectorAll("[data-leg]")];
  const legSlider = $("leg"), speedSlider = $("speed");
  function setLeg(deg) { sb.setLegTarget(deg); legSlider.value = deg; }
  legBtns.forEach(b => b.addEventListener("click", () => { setLeg(Number(b.dataset.leg)); stage.focus(); }));
  legSlider.addEventListener("input", () => sb.setLegTarget(Number(legSlider.value)));
  speedSlider.addEventListener("input", () => { $("speedOut").value = `${Number(speedSlider.value).toFixed(2)} m/s${Number(speedSlider.value) > 0.25 ? " · unqualified" : ""}`; });
  speedSlider.dispatchEvent(new Event("input"));
  const SHOVES = { fore: [0.8, 0, 0.2, 0.2], back: [-0.8, 0, 0.2, 0.2], left: [0, 0.4, 0.2, 0.2], right: [0, -0.4, 0.2, 0.2], big: [4, 0, 0.1, 0.24] };
  const shove = k => { const s = SHOVES[k]; sb.shove(s[0], s[1], s[2], s[3]); };
  document.querySelectorAll("[data-shove]").forEach(b => b.addEventListener("click", () => { shove(b.dataset.shove); stage.focus(); }));
  const killBtn = $("btnKill"), pauseBtn = $("btnPause");
  function toggleKill() { killed = !killed; sb.setKilled(killed); killBtn.setAttribute("aria-pressed", String(killed)); killBtn.textContent = killed ? "Re-arm motors" : "Kill motors"; }
  function togglePause() { paused = !paused; pauseBtn.setAttribute("aria-pressed", String(paused)); pauseBtn.textContent = paused ? "Resume" : "Pause"; }
  killBtn.addEventListener("click", () => { toggleKill(); stage.focus(); });
  pauseBtn.addEventListener("click", () => { togglePause(); stage.focus(); });
  $("btnReset").addEventListener("click", () => { build(); stage.focus(); });
  const CAMS = ["chase", "orbit", "side", "front", "top"];
  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", KeyQ: "lower", KeyE: "raise" };
  function holdLeg(dir) {
    // Hold to move at the preview rate; release stops where the legs are.
    if (dir === legHold) return;
    legHold = dir;
    sb.setLegTarget(dir > 0 ? B.LEG_MAX : dir < 0 ? B.LEG_MIN : Math.round(sb.legAngle));
  }
  function keyChange(code, down, shift) {
    const k = KEYMAP[code];
    if (k) { if (down) keys.add(k); else keys.delete(k); if (k === "lower" || k === "raise") holdLeg(keys.has("lower") ? 1 : keys.has("raise") ? -1 : 0); return true; }
    if (code === "ShiftLeft" || code === "ShiftRight") { if (down) keys.add("fast"); else keys.delete("fast"); return true; }
    if (!down) return false;
    const act = {
      Digit1: () => setLeg(B.LEG_MIN), Digit2: () => setLeg(B.LEG_NEUTRAL), Digit3: () => setLeg(B.LEG_MAX),
      KeyF: () => shove("fore"), KeyB: () => shove("back"), KeyZ: () => shove("left"), KeyX: () => shove("right"),
      KeyR: build, KeyK: toggleKill, KeyP: togglePause,
      KeyC: () => setCamera(CAMS[(CAMS.indexOf(camMode) + 1) % CAMS.length])
    }[code];
    if (act) { act(); return true; }
    void shift; return false;
  }
  stage.addEventListener("keydown", e => { if (keyChange(e.code, true, e.shiftKey)) e.preventDefault(); });
  stage.addEventListener("keyup", e => { if (keyChange(e.code, false, e.shiftKey)) e.preventDefault(); });
  stage.addEventListener("blur", () => { keys.clear(); holdLeg(0); });
  stage.addEventListener("pointerdown", () => stage.focus());
  document.querySelectorAll("[data-hold]").forEach(b => {
    const k = b.dataset.hold;
    const on = e => { e.preventDefault(); keys.add(k); if (k === "lower" || k === "raise") holdLeg(k === "lower" ? 1 : -1); };
    const off = () => { keys.delete(k); if (k === "lower" || k === "raise") holdLeg(0); };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  });
  const padPrev = [false, false];
  function command() {
    let fwd = (keys.has("up") ? 1 : 0) - (keys.has("down") ? 1 : 0);
    let turn = (keys.has("left") ? 1 : 0) - (keys.has("right") ? 1 : 0);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && [...pads].find(p => p);
    if (gp) {
      const dz = v => Math.abs(v) < 0.12 ? 0 : v;
      fwd = fwd || -dz(gp.axes[1] || 0); turn = turn || -dz(gp.axes[0] || 0);
      const legAxis = dz(gp.axes[3] || 0);
      if (!keys.has("lower") && !keys.has("raise")) holdLeg(legAxis > 0.5 ? 1 : legAxis < -0.5 ? -1 : 0);
      const a = !!(gp.buttons[0] && gp.buttons[0].pressed), b = !!(gp.buttons[1] && gp.buttons[1].pressed);
      if (a && !padPrev[0]) shove("fore");
      if (b && !padPrev[1]) build();
      padPrev[0] = a; padPrev[1] = b;
    }
    const vmax = keys.has("fast") ? 0.5 : Number(speedSlider.value);
    // Protocol rates: 0.40 rad/s while travelling, 0.60 rad/s turning in place.
    return { speed: fwd * vmax, yaw: turn * (Math.abs(fwd) > 0.05 ? 0.4 : 0.6) };
  }

  /* ---------- HUD and charts ---------- */
  const row = (k, v) => `<div class="row"><span>${k}</span><span>${v}</span></div>`;
  function bar(name, value, limit, text, signed) {
    const frac = Math.min(1, Math.abs(value) / limit), cls = frac >= 0.999 ? "sat" : frac > 0.8 ? "hot" : "";
    const style = signed ? (value >= 0 ? `left:50%;width:${frac * 50}%` : `left:${50 - frac * 50}%;width:${frac * 50}%`) : `left:0;width:${frac * 100}%`;
    return `<div class="bar"><span>${name}</span><span class="track"><span class="fill ${cls}" style="${style}"></span>${signed ? '<span class="zero"></span>' : ""}</span><span>${text}</span></div>`;
  }
  let slow = false, hudTimer = 0;
  function updateHud(dt) {
    hudTimer += dt; if (hudTimer < 0.08) return; hudTimer = 0;
    const t = sb.telemetry(), p = sb.sim.p;
    let mode = "Balancing · legs pinned", cls = "";
    if (t.fallen) { mode = "Fell · drive off"; cls = "bad"; }
    else if (killed) { mode = "Motors killed"; cls = "bad"; }
    else if (t.legMoving) { mode = "Leg preview · unvalidated"; cls = "preview"; }
    else if (t.pushing) mode = "Shove in progress";
    const pinned = [B.LEG_MIN, B.LEG_NEUTRAL, B.LEG_MAX].includes(Math.round(t.legAngle * 1000) / 1000);
    hudLeft.innerHTML = `<div class="mode ${cls}">${mode}</div>` +
      row("Time", `${t.t.toFixed(1)} s${slow ? " (slow)" : ""}`) +
      row("Speed / cmd", `${t.speed.toFixed(2)} / ${t.speedRef.toFixed(2)} m/s`) +
      row("Heading", `${t.heading.toFixed(0)}°`) +
      row("Pitch from trim", `${t.pitchErr >= 0 ? "+" : ""}${t.pitchErr.toFixed(1)}°`) +
      row("Height now", `${bodyTopMm.toFixed(0)} mm`) +
      row("Leg angle", `${t.legAngle.toFixed(1)}°${pinned ? "" : " (between study poses)"}`) +
      row("Body trim", `${t.trim.toFixed(1)}°`) +
      row("Axle behind pivot", `${t.axleRearMm.toFixed(0)} mm`) +
      row("Servo hold, est.", `${t.servoNm.toFixed(2)} N·m`) +
      row("Odometer", `${t.odom.toFixed(2)} m`);
    const airMs = t.air.map(a => a * 1000);
    hudRight.innerHTML = "<h4>Motors (2.5 A peak limit)</h4>" +
      bar("Left", t.currents[0], 2.5, `${t.currents[0].toFixed(2)} A`) +
      bar("Right", t.currents[1], 2.5, `${t.currents[1].toFixed(2)} A`) +
      bar("Battery", t.voltage - 9, 12.6 - 9, `${t.voltage.toFixed(2)} V`) +
      "<h4>Attitude (study gates)</h4>" +
      bar("Pitch", t.pitchErr, 12, `${t.pitchErr.toFixed(1)}°`, true) +
      bar("Roll", t.roll, 10, `${t.roll.toFixed(1)}°`, true) +
      "<h4>Leg servo (0.75 N·m hold gate)</h4>" +
      bar("Hold", t.servoNm, 0.75, `${t.servoNm.toFixed(2)}`) +
      "<h4>Wheel contact</h4>" +
      row("Air L / R", `${airMs[0].toFixed(0)} / ${airMs[1].toFixed(0)} ms`) +
      row("μ · mass", `${p.mu.toFixed(2)} · ${p.mass.toFixed(2)} kg`);
    $("legOut").value = `${t.legAngle.toFixed(0)}° · ${B.pose(t.legAngle).heightMm.toFixed(0)} mm upright`;
    legBtns.forEach(b => b.classList.toggle("active", Number(b.dataset.leg) === sb.legTarget));
    if (t.fallen) { banner.hidden = false; banner.textContent = `Fell (${t.fallen}). Drive disabled, as a tilt fault would. Press R to reset.`; }
    else if (killed) { banner.hidden = false; banner.textContent = "Motors killed. Press K or Re-arm to restore drive."; }
    else banner.hidden = true;
  }
  function sampleCharts() {
    const t = sb.telemetry(), push = (k, v) => { hist[k].push(v); if (hist[k].length > hist.n) hist[k].shift(); };
    push("pitch", t.pitchErr); push("curL", t.currents[0]); push("curR", t.currents[1]); push("speed", t.speed); push("ref", t.speedRef);
  }
  function chart(id, series, lo, hi, gates) {
    const c = $(id), w = c.clientWidth, h = c.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const y = v => h - 6 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * (h - 12);
    g.lineWidth = 1; g.setLineDash([4, 4]); g.strokeStyle = "#c98a6a";
    for (const v of gates) { g.beginPath(); g.moveTo(0, y(v)); g.lineTo(w, y(v)); g.stroke(); }
    g.setLineDash([]); g.strokeStyle = "#d5ddd3";
    if (lo < 0 && hi > 0) { g.beginPath(); g.moveTo(0, y(0)); g.lineTo(w, y(0)); g.stroke(); }
    for (const s of series) {
      g.strokeStyle = s.color; g.lineWidth = s.width || 1.6; g.beginPath();
      s.data.forEach((v, i) => { const x = w - (s.data.length - 1 - i) * w / (hist.n - 1); if (i) g.lineTo(x, y(v)); else g.moveTo(x, y(v)); });
      g.stroke();
    }
    g.fillStyle = "#5c6c63"; g.font = "10px system-ui"; g.fillText(`${hi}`, 4, 11); g.fillText(`${lo}`, 4, h - 3);
  }
  function drawCharts() {
    chart("chartPitch", [{ data: hist.pitch, color: "#265f4d" }], -15, 15, [-12, 12]);
    chart("chartCurrent", [{ data: hist.curL, color: "#265f4d" }, { data: hist.curR, color: "#a65431" }], 0, 3, [2.5, 1.2]);
    chart("chartSpeed", [{ data: hist.ref, color: "#9eafa0", width: 1 }, { data: hist.speed, color: "#265f4d" }], -0.6, 0.6, [-0.25, 0.25]);
  }

  /* ---------- sizing ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); labels.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);

  /* ---------- main loop ---------- */
  build();
  setCamera("chase");
  const timeSel = $("timeScale");
  let acc = 0, last = performance.now(), chartTimer = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused) {
      acc += dt * Number(timeSel.value);
      const cmd = command();
      let n = 0;
      while (acc >= sb.dt && n < 80) {
        sb.step(cmd); acc -= sb.dt; n++;
        const k = Math.floor(sb.time * 50);
        if (k !== lastSample) { lastSample = k; sampleCharts(); }
      }
      slow = n >= 80; if (slow) acc = 0;
      if (sb.sim.trace.length > 250) sb.sim.trace.length = 0; // the study's 25 Hz trace is not needed here
    }
    syncVisuals();
    updateCamera(dt);
    updateHud(dt);
    chartTimer += dt; if (chartTimer > 0.1) { chartTimer = 0; drawCharts(); }
    renderer.render(scene, camera);
    labels.render(scene, camera);
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);
  stage.focus({ preventScroll: true });
}
main();
})();
