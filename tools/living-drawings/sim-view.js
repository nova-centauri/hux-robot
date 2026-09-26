/* Hux 3D sandbox: the view, the input and the HUD. The physics and the controller live in
   sim-core.js; this file only draws what the bodies are doing and turns keys into commands.
   three.js and Rapier load from jsDelivr so the page still opens straight from the file. */
(async function () {
  const hudLeft = document.getElementById("hudLeft");
  const hudRight = document.getElementById("hudRight");
  const banner = document.getElementById("banner");
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("view");

  let THREE;
  let OrbitControls;
  let CSS2DRenderer;
  let CSS2DObject;
  let RAPIER;
  try {
    THREE = await import("three");
    OrbitControls = (await import("three/addons/controls/OrbitControls.js")).OrbitControls;
    const css2d = await import("three/addons/renderers/CSS2DRenderer.js");
    CSS2DRenderer = css2d.CSS2DRenderer;
    CSS2DObject = css2d.CSS2DObject;
    RAPIER = (await import("https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.20.0/dist/rapier.mjs")).default;
    await RAPIER.init();
  } catch (err) {
    hudLeft.textContent = "Could not load three.js or Rapier from jsDelivr. The sandbox needs a network connection the first time. " + (err && err.message ? err.message : "");
    return;
  }

  const K = window.HuxKin;
  const S = window.HuxSim;
  const M = K.M;
  const IN = S.IN;
  const DEFAULT_KNOBS = Object.assign({}, S.KNOBS);

  const SPAWNS = {
    start: { x: 0, z: 0, yaw: 0 },
    stair: { x: 2.2, z: 0, yaw: 0 },
    sills: { x: -1.2, z: 0, yaw: Math.PI },
    ramp: { x: -1.7, z: -2.6, yaw: 0 },
    steep: { x: -1.2, z: 2.6, yaw: 0 },
    slick: { x: -3.2, z: -3.4, yaw: 0 }
  };

  /* ---------- simulation ---------- */
  const spawnSel = document.getElementById("spawn");
  let knobs = Object.assign({}, DEFAULT_KNOBS);
  const sim = new S.Sim(RAPIER, M, { start: SPAWNS.start, knobs: knobs });

  /* ---------- renderer and scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const labels = new CSS2DRenderer();
  labels.domElement.style.position = "absolute";
  labels.domElement.style.inset = "0";
  labels.domElement.style.pointerEvents = "none";
  stage.insertBefore(labels.domElement, hudLeft);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e3d6);
  scene.fog = new THREE.Fog(0xe9e3d6, 7, 18);
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.02, 60);
  camera.position.set(-1.3, 0.7, 0.4);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.enabled = false;

  scene.add(new THREE.HemisphereLight(0xfffdf5, 0x8a7f6a, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -2.5;
  sun.shadow.camera.right = 2.5;
  sun.shadow.camera.top = 2.5;
  sun.shadow.camera.bottom = -2.5;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 12;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.75, metalness: 0.05 }, opts || {}));
  }

  function gridTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#efe9dc";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#cfc5b1";
    g.lineWidth = 2;
    g.strokeRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  const COLORS = {
    step: 0xe4d9c4, tread: 0xd9c9aa, ramp: 0xd8d0bf, deck: 0xd8d0bf, sill: 0x8b6f47,
    curb: 0xb9b3a8, slick: 0x8fc0dc, crate: 0xc7955a, wall: 0xcfc6b5
  };
  const sceneryMeshes = [];
  let sceneryGroup = null;

  function buildScenery() {
    if (sceneryGroup) {
      scene.remove(sceneryGroup);
      sceneryGroup.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.element && o.element.remove) o.element.remove();
      });
    }
    sceneryGroup = new THREE.Group();
    sceneryMeshes.length = 0;
    sim.scenery.forEach(function (d) {
      const geo = new THREE.BoxGeometry(d.size.x, d.size.y, d.size.z);
      let m;
      if (d.kind === "floor") {
        const tex = gridTexture();
        tex.repeat.set(d.size.x / (12 * IN), d.size.z / (12 * IN));
        m = new THREE.Mesh(geo, mat(0xffffff, { map: tex, roughness: 0.9 }));
      } else if (d.kind === "slick") {
        m = new THREE.Mesh(geo, mat(COLORS.slick, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.75 }));
      } else {
        m = new THREE.Mesh(geo, mat(COLORS[d.kind] || 0xcccccc));
      }
      m.receiveShadow = true;
      m.castShadow = d.kind !== "floor" && d.kind !== "slick";
      if (d.kind === "step" || d.kind === "tread" || d.kind === "sill" || d.kind === "curb" || d.kind === "crate" || d.kind === "ramp" || d.kind === "deck") {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x8c806a }));
        m.add(edges);
      }
      if (d.label) {
        const el = document.createElement("div");
        el.className = "label3d";
        el.textContent = d.label;
        const lab = new CSS2DObject(el);
        lab.position.set(0, d.size.y / 2 + 0.12, 0);
        m.add(lab);
      }
      sceneryGroup.add(m);
      sceneryMeshes.push({ mesh: m, body: d.body });
    });
    scene.add(sceneryGroup);
    syncScenery(true);
  }

  function syncScenery(all) {
    sceneryMeshes.forEach(function (e) {
      if (!all && !e.body.isDynamic()) return;
      const t = e.body.translation();
      const q = e.body.rotation();
      e.mesh.position.set(t.x, t.y, t.z);
      e.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    });
  }

  /* ---------- robot meshes ---------- */
  const C = {
    body: 0xd5e0ea, motor: 0x4a5563, tube: 0x1f4e79, tire: 0x22282f, hub: 0x8a96a3,
    face: 0x1b2430, eye: 0x7fd3e6, cam: 0x0e1218, com: 0x9d2c2c, contact: 0x1d6b45, skid: 0x8a5a12
  };
  let robotMeshes = [];
  let robotGroup = null;
  let comMarker = null;
  let comLine = null;
  let contactDots = [];

  function add(parent, geo, material, pos, rotQ) {
    const m = new THREE.Mesh(geo, material);
    if (pos) m.position.set(pos.x, pos.y, pos.z);
    if (rotQ) m.quaternion.copy(rotQ);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const alongX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const alongZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

  function buildRobotMeshes() {
    if (robotGroup) {
      scene.remove(robotGroup);
      robotGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    }
    robotGroup = new THREE.Group();
    robotMeshes = [];
    const s = sim.s;
    const r = sim.robot;
    const byKind = {};
    r.parts.forEach(function (p) {
      const g = new THREE.Group();
      robotGroup.add(g);
      robotMeshes.push({ group: g, rb: p.rb });
      byKind[p.kind + (p.side || "")] = { g: g, side: p.side };
    });

    /* body / head */
    const b = byKind.body.g;
    const bodyH = s.bodyUp + s.bodyDown;
    add(b, new THREE.BoxGeometry(s.bodyLen, bodyH, s.bodyWid), mat(C.body, { roughness: 0.55 }), { x: 0, y: (s.bodyUp - s.bodyDown) / 2, z: 0 });
    /* Face and cameras placed as in the 2D drawings (app.js drawFaceSide / drawFaceTop). */
    const front = s.bodyLen / 2;
    const mid = s.bodyUp * 0.55;
    const camSize = M.cam * IN;
    add(b, new THREE.BoxGeometry(0.003, s.display.h, s.display.w), mat(C.face, { roughness: 0.3 }), { x: front + 0.0015, y: mid, z: 0 });
    function camera3(x, y, z) {
      add(b, new THREE.BoxGeometry(camSize, camSize, camSize), mat(C.cam, { roughness: 0.3 }), { x: x, y: y, z: z });
    }
    [-1, 1].forEach(function (k) {
      const ez = k * s.eyeGap / 2;
      const ey = mid - 1.2 * IN;
      add(b, new THREE.CylinderGeometry(s.eyeD / 2, s.eyeD / 2, 0.003, 24), mat(0x141820, { roughness: 0.3 }), { x: front + 0.0015, y: ey, z: ez }, alongX);
      add(b, new THREE.CylinderGeometry(s.eyeD * 0.28, s.eyeD * 0.28, 0.004, 24), mat(0xe8f7ff, { emissive: C.eye, emissiveIntensity: 0.5 }), { x: front + 0.002, y: ey, z: ez }, alongX);
      camera3(front + 0.28 * IN, mid - 2.15 * IN, k * M.stereoGap * IN / 2);
      camera3(-1.0 * IN, 3.4 * IN, k * (s.bodyWid / 2 + 0.15 * IN));
      /* hip roll motors, on the roll axis, behind the swing motor */
      add(b, new THREE.CylinderGeometry(s.motorRollD / 2, s.motorRollD / 2, s.motorRollL, 24), mat(C.motor),
        { x: -(s.motorSwing.w / 2 + s.motorRollL / 2), y: 0, z: k * s.hipLat }, alongX);
    });
    camera3(1.5 * IN, s.bodyUp + 0.28 * IN, 0);
    camera3(-front - 0.28 * IN, 4.2 * IN, 0);
    camera3(-1.6 * IN, -s.bodyDown - 0.2 * IN, 0);
    if (r.skid) {
      const a = new THREE.Vector3(r.skid.a.x, r.skid.a.y, 0);
      const c = new THREE.Vector3(r.skid.b.x, r.skid.b.y, 0);
      const d = c.clone().sub(a);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      add(b, new THREE.CapsuleGeometry(r.skid.r, d.length(), 4, 12), mat(C.skid), a.clone().add(c).multiplyScalar(0.5), q);
    }

    [-1, 1].forEach(function (side) {
      const y = byKind["yoke" + side].g;
      add(y, new THREE.BoxGeometry(s.motorSwing.w, s.motorSwing.h, s.motorSwing.t), mat(C.motor), { x: 0, y: 0, z: 0 });
      const u = byKind["upper" + side].g;
      add(u, new THREE.CylinderGeometry(s.tubeR, s.tubeR, s.L, 16), mat(C.tube, { roughness: 0.35, metalness: 0.2 }), { x: 0, y: -s.L / 2, z: 0 });
      add(u, new THREE.BoxGeometry(s.motorKnee.w, s.motorKnee.h, s.motorKnee.t), mat(C.motor), { x: 0, y: -s.L, z: 0 });
      const l = byKind["lower" + side].g;
      add(l, new THREE.CylinderGeometry(s.tubeR, s.tubeR, s.L, 16), mat(C.tube, { roughness: 0.35, metalness: 0.2 }), { x: 0, y: -s.L / 2, z: 0 });
      const dz = s.wheelLat - s.hipLat;
      add(l, new THREE.CylinderGeometry(0.006, 0.006, dz, 12), mat(C.hub), { x: 0, y: -s.L, z: side * dz / 2 }, alongZ);
      const w = byKind["wheel" + side].g;
      /* Visual only: flat cylinder shoulders. Collision is sim-core tireCollider (rounded convex), not a motorcycle crown. */
      add(w, new THREE.CylinderGeometry(s.R, s.R, s.wheelW, 48), mat(C.tire, { roughness: 0.95 }), null, alongZ);
      add(w, new THREE.CylinderGeometry(s.motorWheelD / 2, s.motorWheelD / 2, s.wheelW + 0.004, 32), mat(C.hub, { metalness: 0.3, roughness: 0.4 }), null, alongZ);
      add(w, new THREE.BoxGeometry(s.R * 1.7, 0.008, s.wheelW + 0.008), mat(C.body), null);
    });

    comMarker = add(robotGroup, new THREE.SphereGeometry(0.014, 16, 12), mat(C.com, { emissive: C.com, emissiveIntensity: 0.4 }), null);
    comMarker.castShadow = false;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    comLine = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: C.com, dashSize: 0.02, gapSize: 0.015 }));
    robotGroup.add(comLine);
    contactDots = [0, 1].map(function () {
      const m = add(robotGroup, new THREE.CircleGeometry(0.03, 24), new THREE.MeshBasicMaterial({ color: C.contact, transparent: true, opacity: 0.8 }), null);
      m.rotation.x = -Math.PI / 2;
      m.castShadow = false;
      return m;
    });
    scene.add(robotGroup);
    syncRobot();
  }

  function syncRobot() {
    robotMeshes.forEach(function (e) {
      const t = e.rb.translation();
      const q = e.rb.rotation();
      e.group.position.set(t.x, t.y, t.z);
      e.group.quaternion.set(q.x, q.y, q.z, q.w);
    });
    const o = sim.last;
    if (o && o.com) {
      comMarker.position.set(o.com.x, o.com.y, o.com.z);
      const pos = comLine.geometry.attributes.position;
      pos.setXYZ(0, o.com.x, o.com.y, o.com.z);
      pos.setXYZ(1, o.com.x, 0.002, o.com.z);
      pos.needsUpdate = true;
      comLine.computeLineDistances();
    }
    const weight = sim.s.totalKg * 9.81;
    sim.robot.legs.forEach(function (leg, i) {
      const t = leg.wheel.translation();
      const f = o && o.contacts ? o.contacts[i].force : 0;
      const dot = contactDots[i];
      dot.visible = f > 3;
      dot.position.set(t.x, t.y - sim.s.R + 0.002, t.z);
      const k = 0.5 + Math.min(1.5, f / (weight / 2));
      dot.scale.set(k, k, k);
    });
  }

  buildScenery();
  buildRobotMeshes();

  /* ---------- input ---------- */
  const keys = new Set();
  const pad = new Set();
  let pendingMode = null;
  let height = sim.s.hRide;
  let shift = 0;
  /* ride height: slider in % of the full leg, presets, and Q / E all move the same number */
  const rideEl = document.getElementById("ride");
  const rideOut = document.getElementById("rideOut");
  const rideButtons = document.querySelectorAll("[data-ride]");
  function syncRide() {
    const f = height / (2 * sim.s.L);
    rideEl.value = String(Math.round(f * 100));
    rideOut.textContent = (height / IN).toFixed(1) + "\" hip to axle · " + Math.round(f * 100) + "%";
    rideButtons.forEach(function (b) { b.classList.toggle("active", Math.abs(Number(b.dataset.ride) - f) < 0.02); });
  }
  function setRide(f) {
    height = Math.max(sim.s.hMin, Math.min(sim.s.hMax, f * 2 * sim.s.L));
    syncRide();
  }
  rideEl.addEventListener("input", function () { setRide(Number(rideEl.value) / 100); });
  rideButtons.forEach(function (b) { b.addEventListener("click", function () { setRide(Number(b.dataset.ride)); }); });
  syncRide();
  const vmax = document.getElementById("vmax");
  const vmaxOut = document.getElementById("vmaxOut");
  function syncVmax() { vmaxOut.textContent = Number(vmax.value).toFixed(1) + " m/s"; }
  vmax.addEventListener("input", syncVmax);
  syncVmax();

  function typing(e) {
    const t = e.target;
    return t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
  }
  const GAME_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyQ", "KeyE", "KeyZ", "KeyX", "ShiftLeft", "ShiftRight"];
  window.addEventListener("keydown", function (e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (GAME_KEYS.indexOf(e.code) >= 0) {
      keys.add(e.code);
      if (e.code.indexOf("Arrow") === 0) e.preventDefault();
      return;
    }
    if (e.repeat) return;
    switch (e.code) {
      case "Digit1": setMode("PARKED"); break;
      case "Digit2": setMode("TWO_WHEEL"); break;
      case "Digit3": setMode("LEFT_ONLY"); break;
      case "Digit4": setMode("RIGHT_ONLY"); break;
      case "Space": e.preventDefault(); shove(); break;
      case "KeyR": reset(); break;
      case "KeyK": kill(); break;
      case "KeyC": cycleCamera(); break;
      case "KeyP": togglePause(); break;
      default: return;
    }
  });
  window.addEventListener("keyup", function (e) { keys.delete(e.code); });
  window.addEventListener("blur", function () { keys.clear(); pad.clear(); });
  stage.addEventListener("pointerdown", function () { stage.focus({ preventScroll: true }); });
  document.querySelectorAll("#pad [data-hold]").forEach(function (btn) {
    const k = btn.dataset.hold;
    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); pad.add(k); btn.setPointerCapture(e.pointerId); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) {
      btn.addEventListener(ev, function () { pad.delete(k); });
    });
  });

  const modeButtons = document.querySelectorAll("[data-mode]");
  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { setMode(btn.dataset.mode); });
  });
  function setMode(m) {
    pendingMode = m;
    if (m === "TWO_WHEEL" && sim.ctrl.estop) kill();
  }

  const btnKill = document.getElementById("btnKill");
  const btnPause = document.getElementById("btnPause");
  document.getElementById("btnShove").addEventListener("click", shove);
  document.getElementById("btnReset").addEventListener("click", reset);
  btnKill.addEventListener("click", kill);
  btnPause.addEventListener("click", togglePause);

  let shoveFlash = 0;
  function shove() {
    const a = Math.random() * Math.PI * 2;
    const mag = 2.0;
    sim.shove({ x: Math.cos(a) * mag, y: 0, z: Math.sin(a) * mag });
    shoveFlash = 0.8;
  }
  function kill() {
    sim.ctrl.estop = !sim.ctrl.estop;
    btnKill.setAttribute("aria-pressed", sim.ctrl.estop ? "true" : "false");
  }
  let paused = false;
  function togglePause() {
    paused = !paused;
    btnPause.setAttribute("aria-pressed", paused ? "true" : "false");
    btnPause.textContent = paused ? "Resume" : "Pause";
  }
  function reset() {
    sim.opts.start = SPAWNS[spawnSel.value] || SPAWNS.start;
    sim.build(knobs);
    height = sim.s.hRide;
    syncRide();
    shift = 0;
    btnKill.setAttribute("aria-pressed", "false");
    trace.length = 0;
    buildScenery();
    buildRobotMeshes();
    snapCamera = true;
  }
  spawnSel.addEventListener("change", reset);

  /* gamepad */
  const padPrev = [];
  function readGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      const g = pads[i];
      if (!g) continue;
      function ax(n) { const a = g.axes[n] || 0; return Math.abs(a) < 0.12 ? 0 : a; }
      function pressed(n) {
        const now = !!(g.buttons[n] && g.buttons[n].pressed);
        const was = padPrev[n];
        padPrev[n] = now;
        return now && !was;
      }
      if (pressed(0)) shove();
      if (pressed(1)) reset();
      if (pressed(2)) setMode("PARKED");
      if (pressed(3)) setMode("TWO_WHEEL");
      if (pressed(4)) setMode("LEFT_ONLY");
      if (pressed(5)) setMode("RIGHT_ONLY");
      return { v: -ax(1), yaw: -ax(0), h: -ax(3), shift: ax(2) };
    }
    return null;
  }

  function command(dt) {
    const up = keys.has("KeyW") || keys.has("ArrowUp") || pad.has("up");
    const down = keys.has("KeyS") || keys.has("ArrowDown") || pad.has("down");
    const left = keys.has("KeyA") || keys.has("ArrowLeft") || pad.has("left");
    const right = keys.has("KeyD") || keys.has("ArrowRight") || pad.has("right");
    const boost = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 1.5 : 1;
    const vm = Number(vmax.value) * boost;
    let v = ((up ? 1 : 0) - (down ? 1 : 0)) * vm;
    let yaw = ((left ? 1 : 0) - (right ? 1 : 0)) * 1.6;
    let hRate = ((keys.has("KeyE") ? 1 : 0) - (keys.has("KeyQ") ? 1 : 0)) * 0.12;
    let shiftWant = ((keys.has("KeyX") ? 1 : 0) - (keys.has("KeyZ") ? 1 : 0)) * 0.45;
    const g = readGamepad();
    if (g) {
      if (g.v) v = g.v * vm;
      if (g.yaw) yaw = g.yaw * 1.6;
      if (g.h) hRate = g.h * 0.12;
      if (g.shift) shiftWant = g.shift * 0.45;
    }
    if (hRate) {
      height = Math.max(sim.s.hMin, Math.min(sim.s.hMax, height + hRate * dt));
      syncRide();
    }
    shift += Math.max(-0.6 * dt, Math.min(0.6 * dt, shiftWant - shift));
    const cmd = { v: v, yaw: yaw, height: height, shift: shift };
    if (pendingMode) cmd.mode = pendingMode;
    return cmd;
  }

  /* ---------- knobs ---------- */
  const KNOB_FMT = {
    tauWheel: function (x) { return x.toFixed(1) + " N·m"; },
    wheelNoLoad: function (x) { return x.toFixed(0) + " rad/s · " + (x * sim.s.R).toFixed(1) + " m/s"; },
    tauKnee: function (x) { return x.toFixed(1) + " N·m"; },
    tauHip: function (x) { return x.toFixed(1) + " N·m"; },
    tauRoll: function (x) { return x.toFixed(1) + " N·m"; },
    mu: function (x) { return x.toFixed(2); },
    massScale: function (x) { return (6 * x).toFixed(1) + " kg lumps"; },
    bodyCom: function (x) { return x.toFixed(1) + "\""; },
    legHz: function (x) { return x.toFixed(1) + " Hz"; },
    legZeta: function (x) { return x.toFixed(2); },
    sensorDelayMs: function (x) { return x.toFixed(0) + " ms"; },
    torqueLagMs: function (x) { return x.toFixed(1) + " ms"; },
    jointNoLoad: function (x) { return x.toFixed(0) + " rad/s"; }
  };
  const CHECKS = ["skid", "reflex", "legCatch", "oneLift"];
  const knobIds = Object.keys(KNOB_FMT);
  function readKnobs() {
    const k = Object.assign({}, knobs);
    knobIds.forEach(function (id) {
      const el = document.getElementById("k_" + id);
      k[id] = Number(el.value);
      document.getElementById("k_" + id + "Out").textContent = KNOB_FMT[id](k[id]);
    });
    CHECKS.forEach(function (id) { k[id] = document.getElementById("k_" + id).checked; });
    return k;
  }
  function applyKnobs() {
    const k = readKnobs();
    const rebuilt = sim.setKnobs(k);
    knobs = Object.assign({}, sim.s.knobs);
    if (rebuilt) {
      sim.opts.start = SPAWNS[spawnSel.value] || SPAWNS.start;
      sim.build(knobs);
      height = sim.s.hRide;
      syncRide();
      buildScenery();
      buildRobotMeshes();
      snapCamera = true;
    }
  }
  knobIds.forEach(function (id) {
    const el = document.getElementById("k_" + id);
    el.addEventListener("input", function () { readKnobs(); });
    el.addEventListener("change", applyKnobs);
  });
  CHECKS.forEach(function (id) { document.getElementById("k_" + id).addEventListener("change", applyKnobs); });
  document.getElementById("knobReset").addEventListener("click", function () {
    knobIds.forEach(function (id) { document.getElementById("k_" + id).value = String(DEFAULT_KNOBS[id]); });
    CHECKS.forEach(function (id) { document.getElementById("k_" + id).checked = !!DEFAULT_KNOBS[id]; });
    applyKnobs();
  });
  readKnobs();

  /* ---------- camera ---------- */
  const camSel = document.getElementById("camera");
  const CAMS = ["chase", "orbit", "side", "front", "top"];
  let snapCamera = true;
  let zoom = 1;
  const camTarget = new THREE.Vector3();
  function cycleCamera() {
    camSel.value = CAMS[(CAMS.indexOf(camSel.value) + 1) % CAMS.length];
    camSel.dispatchEvent(new Event("change"));
  }
  camSel.addEventListener("change", function () {
    orbit.enabled = camSel.value === "orbit";
    snapCamera = true;
  });
  canvas.addEventListener("wheel", function (e) {
    if (camSel.value === "orbit") return;
    e.preventDefault();
    zoom = Math.max(0.4, Math.min(4, zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
  }, { passive: false });

  function updateCamera(dt) {
    const t = sim.robot.trunk.translation();
    const want = new THREE.Vector3(t.x, Math.max(0.2, t.y - 0.05), t.z);
    const o = sim.last;
    const fwd = o && o.fwd ? new THREE.Vector3(o.fwd.x, 0, o.fwd.z) : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    const a = snapCamera ? 1 : 1 - Math.exp(-dt * 6);
    const prevTarget = camTarget.clone();
    camTarget.lerp(want, a);
    if (camSel.value === "orbit") {
      if (snapCamera) camera.position.copy(camTarget).add(new THREE.Vector3(-1.2, 0.6, 0.8));
      else camera.position.add(camTarget.clone().sub(prevTarget));
      orbit.target.copy(camTarget);
      orbit.update();
    } else {
      let offset;
      if (camSel.value === "chase") offset = fwd.clone().multiplyScalar(-1.25).add(new THREE.Vector3(0, 0.5, 0)).add(right.clone().multiplyScalar(0.25));
      else if (camSel.value === "side") offset = right.clone().multiplyScalar(1.3).add(new THREE.Vector3(0, 0.12, 0));
      else if (camSel.value === "front") offset = fwd.clone().multiplyScalar(1.2).add(new THREE.Vector3(0, 0.25, 0)).add(right.clone().multiplyScalar(0.3));
      else offset = new THREE.Vector3(0, 2.4, 0).add(fwd.clone().multiplyScalar(-0.35));
      const pos = camTarget.clone().add(offset.multiplyScalar(zoom));
      camera.position.lerp(pos, snapCamera ? 1 : 1 - Math.exp(-dt * 4));
      camera.lookAt(camTarget);
    }
    sun.position.copy(camTarget).add(new THREE.Vector3(2.5, 5, 1.8));
    sun.target.position.copy(camTarget);
    snapCamera = false;
  }

  /* ---------- HUD ---------- */
  function fmt(x, d) { return (x < 0 ? "−" : "") + Math.abs(x).toFixed(d === undefined ? 1 : d); }
  function deg(x) { return fmt(x * 180 / Math.PI, 1) + "°"; }
  function row(k, v) { return "<div class=\"row\"><span>" + k + "</span><span>" + v + "</span></div>"; }
  function bar(name, tau, cap) {
    const f = cap > 0 ? Math.min(1, Math.abs(tau) / cap) : 0;
    const cls = f > 0.99 ? "sat" : f > 0.85 ? "hot" : "";
    const left = tau >= 0 ? 50 : 50 - f * 50;
    return "<div class=\"bar\"><span>" + name + "</span><span class=\"track\"><span class=\"fill " + cls + "\" style=\"left:" + left + "%;width:" + (f * 50) + "%\"></span><span class=\"zero\"></span></span><span>" + fmt(tau, 1) + "</span></div>";
  }
  const PHASE = {
    sitting: "crouching", parked: "wheels braked", shift: "standing tall, shifting mass over the wheel",
    poise: "two-contact poise", edge: "easing on to the wheel", unload: "letting the free leg go",
    lift: "lifting the free wheel", hold: "attempting single support", lower: "putting the wheel down",
    catch: "catch step", load: "loading the free wheel", unshift: "centring"
  };
  let rtf = 1;
  function drawHud() {
    const o = sim.last;
    if (!o || !o.legs) return;
    const s = sim.s;
    const weight = s.totalKg * 9.81;
    const fL = o.contacts[0].force;
    const fR = o.contacts[1].force;
    const mode = o.mode.replace("_", " ");
    hudLeft.innerHTML =
      "<div class=\"mode\">" + mode + (o.phase ? " · " + PHASE[o.phase] : "") + "</div>" +
      row("Speed", fmt(o.speed, 2) + " m/s · " + fmt(o.speed * 2.237, 1) + " mph") +
      row("Turn", fmt(o.yawRate * 57.3, 0) + "°/s") +
      row("Mass lean", deg(o.theta)) +
      row("Body pitch / roll", deg(o.pitch) + " / " + deg(o.roll)) +
      row("Hip to axle", fmt(o.h / IN, 1) + "\" · " + (100 * o.h / (2 * s.L)).toFixed(0) + "%") +
      row("Leg travel L / R", fmt((o.legs[0].dWant - o.legs[0].d) / IN, 2) + " / " + fmt((o.legs[1].dWant - o.legs[1].d) / IN, 2) + "\"") +
      row("Hops / catches", ((o.reflex[0] ? o.reflex[0].hits : 0) + (o.reflex[1] ? o.reflex[1].hits : 0)) + " / " + (o.caught || 0)) +
      row("Hip roll", deg(shift)) +
      row("Wheel load L / R", fL.toFixed(0) + " / " + fR.toFixed(0) + " N") +
      row("", (100 * fL / weight).toFixed(0) + "% / " + (100 * fR / weight).toFixed(0) + "% of " + s.totalKg.toFixed(1) + " kg") +
      row("Mechanical power magnitude", o.power.toFixed(0) + " W") +
      row("Support", o.supportState + " · " + o.singleSupportSeconds.toFixed(2) + " s single") +
      row("Sensor age", o.sensorAgeMs.toFixed(1) + " ms") +
      row("Sim", sim.t.toFixed(1) + " s" + (rtf < 0.95 ? " · " + rtf.toFixed(2) + "× real" : ""));
    hudRight.innerHTML =
      "<h4>Torque vs limit (N·m)</h4>" +
      bar("Wheel L", o.wheels[0].tau, s.knobs.tauWheel) +
      bar("Wheel R", o.wheels[1].tau, s.knobs.tauWheel) +
      bar("Knee L", o.legs[0].knee.tau, s.knobs.tauKnee) +
      bar("Knee R", o.legs[1].knee.tau, s.knobs.tauKnee) +
      bar("Hip L", o.legs[0].hip.tau, s.knobs.tauHip) +
      bar("Hip R", o.legs[1].hip.tau, s.knobs.tauHip) +
      bar("Roll L", o.legs[0].roll.tau, s.knobs.tauRoll) +
      bar("Roll R", o.legs[1].roll.tau, s.knobs.tauRoll) +
      "<h4>Wheel speed vs assumed no-load</h4>" +
      bar("Rim L", o.wheels[0].w, s.knobs.wheelNoLoad) +
      bar("Rim R", o.wheels[1].w, s.knobs.wheelNoLoad);
    let msg = "";
    if (o.fallen) msg = "Fallen. Press R (or Reset) to stand it back up.";
    else if (o.estop) msg = "Motors off. Press K to turn them back on.";
    else if (o.modeRejected) msg = o.modeRejected;
    else if (o.requestedMode === "LEFT_ONLY" || o.requestedMode === "RIGHT_ONLY") msg =
      o.singleSupportValidated ? "Single support held for the 1.55 s reference swing interval in this simulation; hardware unvalidated." :
      "Requested " + o.requestedMode.replace("_", " ") + ". Actual support: " + o.supportState + ". Two-contact poise is not one-wheel balance.";
    banner.hidden = !msg;
    banner.textContent = msg;
    modeButtons.forEach(function (btn) {
      const on = btn.dataset.mode === o.mode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ---------- charts ---------- */
  const trace = [];
  const HIST_S = 10;
  let histClock = 0;
  function sample() {
    const o = sim.last;
    trace.push({
      t: sim.t,
      wL: o.wheels[0].tau, wR: o.wheels[1].tau,
      kL: o.legs[0].knee.tau, kR: o.legs[1].knee.tau,
      rL: o.legs[0].roll.tau, rR: o.legs[1].roll.tau,
      th: o.theta
    });
    while (trace.length && trace[0].t < sim.t - HIST_S) trace.shift();
  }
  function chart(id, series, limit, unit) {
    const c = document.getElementById(id);
    const w = c.clientWidth;
    const h = c.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const t1 = sim.t;
    const t0 = t1 - HIST_S;
    const ymax = limit * 1.15;
    function X(t) { return ((t - t0) / HIST_S) * w; }
    function Yv(y) { return h / 2 - (y / ymax) * (h / 2 - 6); }
    g.strokeStyle = "#e4dccb";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, h / 2);
    g.lineTo(w, h / 2);
    g.stroke();
    g.setLineDash([4, 3]);
    g.strokeStyle = "#9d2c2c";
    [limit, -limit].forEach(function (y) { g.beginPath(); g.moveTo(0, Yv(y)); g.lineTo(w, Yv(y)); g.stroke(); });
    g.setLineDash([]);
    series.forEach(function (sr) {
      g.strokeStyle = sr.color;
      g.lineWidth = 1.5;
      g.beginPath();
      trace.forEach(function (p, i) {
        const x = X(p.t);
        const y = Yv(Math.max(-ymax, Math.min(ymax, sr.get(p))));
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke();
    });
    g.fillStyle = "#5e6a78";
    g.font = "11px ui-monospace, monospace";
    g.fillText("±" + limit.toFixed(limit < 10 ? 1 : 0) + " " + unit, 6, 12);
    let lx = w - 6;
    g.textAlign = "right";
    series.slice().reverse().forEach(function (sr) {
      g.fillStyle = sr.color;
      g.fillText(sr.name, lx, 12);
      lx -= g.measureText(sr.name).width + 10;
    });
    g.textAlign = "left";
  }
  function drawCharts() {
    const k = sim.s.knobs;
    chart("chartWheel", [
      { name: "left", color: "#6d7f90", get: function (p) { return p.wL; } },
      { name: "right", color: "#1f4e79", get: function (p) { return p.wR; } }
    ], k.tauWheel, "N·m");
    chart("chartLeg", [
      { name: "knee L", color: "#6d7f90", get: function (p) { return p.kL; } },
      { name: "knee R", color: "#1f4e79", get: function (p) { return p.kR; } },
      { name: "roll L", color: "#c89a4a", get: function (p) { return p.rL; } },
      { name: "roll R", color: "#8a5a12", get: function (p) { return p.rR; } }
    ], Math.max(k.tauKnee, k.tauRoll), "N·m");
    chart("chartLean", [
      { name: "lean", color: "#9d2c2c", get: function (p) { return p.th * 180 / Math.PI; } }
    ], 20, "°");
  }

  /* ---------- loop ---------- */
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  const timeScale = document.getElementById("timeScale");
  let last = performance.now();
  let acc = 0;
  let hudClock = 0;
  function frame(now) {
    const wall = (now - last) / 1000;
    const real = Math.min(0.05, wall);
    last = now;
    const dt = sim.world.timestep;
    if (!paused) {
      const scale = Number(timeScale.value || 1);
      acc += real * scale;
      const cmd = command(real);
      const t0 = performance.now();
      const simBefore = sim.t;
      while (acc >= dt) {
        sim.step(cmd);
        if (cmd.mode) { delete cmd.mode; pendingMode = null; }
        acc -= dt;
        histClock += dt;
        if (histClock >= 0.02) { histClock = 0; sample(); }
        /* keep the page responsive: if physics falls behind, run slower than real time */
        if (performance.now() - t0 > 12) { acc = 0; break; }
      }
      if (wall > 0) rtf = 0.9 * rtf + 0.1 * Math.min(1, (sim.t - simBefore) / (wall * scale));
      syncScenery(false);
      syncRobot();
    }
    if (shoveFlash > 0) shoveFlash -= real;
    updateCamera(real);
    renderer.render(scene, camera);
    labels.render(scene, camera);
    hudClock += real;
    if (hudClock > 0.08) {
      hudClock = 0;
      drawHud();
      drawCharts();
    }
    requestAnimationFrame(frame);
  }
  hudLeft.textContent = "Ready.";
  stage.focus({ preventScroll: true });
  requestAnimationFrame(frame);
  window.HuxSandbox = { sim: sim, reset: reset, setMode: setMode };
})();
