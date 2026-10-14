/* Hux V1-PROOF anatomy: animated orthographic views and electronics x-ray.
 * Geometry: R04 reference instances (anatomy-mesh.js), in body coordinates (mm):
 * X rearward, Y outward from the near wall, Z up, origin at the lower body pivot.
 * The far leg is the near R04 leg stack mirrored about the body mid-plane (Y = -67.5).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MESH = window.HuxAnatomyMesh;
const PROOF = window.HuxProof && window.HuxProof.model;
const DEG = Math.PI / 180;
const $ = (id) => document.getElementById(id);

/* ---------------- Geometry constants (R04 parameters.json, JD-03) ---------------- */
const LINK = 110, SPACING = 40, Q_MIN = 15, Q_MAX = 45, Q_NEU = 30, REDUCTION = 3;
const AXLE_OFS = 25, MOTOR_OFS = 32;            // rearward of the lower carrier pivot
const WHEEL_R = 50, WHEEL_W = 24, WHEEL_Y = 47.5;
const MID_Y = -67.5;                              // body mid-plane between the walls
const TOP_Z = 192;                                // Pico 2 PCB top, highest fixed body point
const WALL_BOTTOM = -35;
const NEU = neutral();

const LAYOUTS = {
  // dir +1: the strut slants rearward from the hip. dir -1: the strut slants forward from a rear hip.
  r04: { id: 'r04', name: 'R04 as drawn', pivotX: 0, dir: 1, drivers: 1, battery: null, servoInside: false },
  r05: { id: 'r05', name: 'R05 proposal', pivotX: 50, dir: -1, drivers: 2, servoInside: true,
         battery: { x: -5, y: MID_Y, z: -17.5, dx: 106, dy: 35, dz: 25 } },
};

/* Mass list from tools/v1-proof/model.json. Positions are assumptions for the estimate. */
const MASS_FALLBACK = [
  ['Two wheel gearmotors with encoders', 0.4], ['Wheels, hubs and axle support bearings', 0.25],
  ['Two leg servos', 0.14], ['Links, pivots, belts and pulleys', 0.32], ['Chassis and fasteners', 0.38],
  ['Battery', 0.2], ['MCU, IMU, receiver and drivers', 0.15], ['Wiring, regulators and switches', 0.15],
  ['Rest skids and bumpers', 0.12], ['Unallocated mass allowance', 0.39]];
const MASS = (PROOF && PROOF.mass_items ? PROOF.mass_items.map((m) => [m.item, m.kg]) : MASS_FALLBACK);

/* Internal servo (R05): ST3215 case 45.2 long (X), 35 deep (Y), 24.7 high (Z), output 12.5 mm from case centre.
 * The output is 45 mm forward of the hip and 12 mm above the lower hip. A 3:1 belt drives the lower hip. */
function servoInside(lay) {
  const ox = lay.pivotX - 45, oz = 12;
  return { ox, oz, cx: ox - 12.5, cz: oz, yIn: -1, depth: 35 };
}
function neutral() { const r = Q_NEU * DEG; return { cx: LINK * Math.sin(r), cz: -LINK * Math.cos(r) }; }

function legPose(q, lay) {
  const r = q * DEG, px = lay.pivotX, d = lay.dir;
  const cx = px + d * LINK * Math.sin(r), cz = -LINK * Math.cos(r);
  // The JD-03 carrier puts the axle and motor on the far side of the strut end, away from the hip.
  // axleAtStrut: study case with the axle on the strut end (the planned layout before JD-03).
  const ofs = lay.axleAtStrut ? 0 : AXLE_OFS;
  return { q, px, cx, cz, ax: cx + d * ofs, az: cz, mx: cx + d * (ofs + MOTOR_OFS - AXLE_OFS) };
}

function massPoint(name, p, lay) {
  const n = name.toLowerCase();
  if (n.includes('gearmotor')) return [p.mx, p.cz];
  if (n.includes('wheels')) return [p.ax, p.az];
  if (n.includes('servo')) return lay.servoInside ? [servoInside(lay).cx, servoInside(lay).cz] : [0, 94];
  if (n.includes('links')) return [(p.px + p.cx) / 2, 20 + p.cz / 2];
  if (n.includes('battery')) return lay.battery ? [lay.battery.x, lay.battery.z] : [0, 72.5];
  if (n.includes('mcu')) return [0, 125];
  if (n.includes('wiring')) return [0, 100];
  if (n.includes('skids')) return [0, WALL_BOTTOM];
  return [0, 72.5];
}

function com(p, lay) {
  let m = 0, x = 0, z = 0;
  for (const [name, kg] of MASS) { const [px, pz] = massPoint(name, p, lay); m += kg; x += kg * px; z += kg * pz; }
  return { x: x / m, z: z / m, m };
}

/* Static balance: rotate the robot about the axle until the CoM is above the axle.
 * Positive = top of the body leans rearward. */
function trimDeg(p, lay) { const c = com(p, lay); return Math.atan2(-(c.x - p.ax), c.z - p.az) / DEG; }

/* ---------------- State and timeline ---------------- */
const CHAPTERS = [
  { id: 'legs', label: 'Leg kinematics', t0: 0, t1: 10 },
  { id: 'drive', label: 'Drive and balance', t0: 10, t1: 18 },
  { id: 'xray', label: 'Electronics x-ray', t0: 18, t1: 36 },
];
const T_END = 36;
const state = {
  t: 0, playing: true, speed: 1, layout: LAYOUTS.r04, balanced: true,
  manualQ: null, manualXray: null, flows: true, labels: true,
};
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) state.playing = false;

const smooth = (a, b, t) => { const s = Math.min(1, Math.max(0, (t - a) / (b - a))); return s * s * (3 - 2 * s); };

function timeline(t) {
  let q = Q_NEU, x = 0, accel = 0, xray = 0, flow = { power: 0, control: 0, feedback: 0 }, labels = 0;
  if (t < 10) {
    q = Q_NEU + 15 * Math.sin(2 * Math.PI * t / 5);
  } else if (t < 18) {
    const s = (t - 10) / 8, A = 320;                // forward 320 mm, then back to the start
    x = -A * Math.sin(Math.PI * s) ** 2;
    accel = -A * 2 * Math.PI * Math.PI * Math.cos(2 * Math.PI * s) / 64;  // mm/s^2
  } else {
    const u = t - 18;
    q = Q_NEU + 12 * Math.sin(2 * Math.PI * Math.max(0, u - 2) / 7) * smooth(1, 3, u) * (1 - smooth(14, 16, u));
    xray = smooth(0, 2, u) * (1 - smooth(15.5, 17.5, u));
    flow.power = smooth(2.5, 3.5, u) * (1 - smooth(15, 16.5, u));
    flow.control = smooth(5.5, 6.5, u) * (1 - smooth(15, 16.5, u));
    flow.feedback = smooth(8.5, 9.5, u) * (1 - smooth(15, 16.5, u));
    labels = smooth(1.5, 2.5, u) * (1 - smooth(15, 16, u));
  }
  return { q, x, accel, xray, flow, labels };
}

/* ---------------- Theme ---------------- */
function readTheme() {
  const cs = getComputedStyle(document.body);
  const v = (k, d) => (cs.getPropertyValue(k).trim() || d);
  return {
    paper: v('--view-bg', '#f4f4ef'), paper3d: v('--view-bg-3d', '#e9ece7'), ink: v('--view-ink', '#243239'),
    grid: v('--view-grid', '#d9ddd7'), gridMajor: v('--view-grid-major', '#bfc7c1'), dim: v('--view-dim', '#b65330'),
    muted: v('--view-muted', '#647078'), accent: v('--view-accent', '#ce633b'),
  };
}
let THEME = readTheme();

/* ---------------- Three.js setup ---------------- */
const stage = $('stage');
const canvas = $('gl');
const overlay = $('overlay');
const octx = overlay.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f86, 1.25));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-400, 900, -600); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.55); fill.position.set(700, 300, 800); scene.add(fill);

/* CAD frame -> three frame: (X, Y, Z) -> (X, Z, -Y). */
const cad = new THREE.Group(); cad.rotation.x = -Math.PI / 2; scene.add(cad);
const drive = new THREE.Group(); cad.add(drive);            // ground translation, X
const pitch = new THREE.Group(); drive.add(pitch);          // at the axle, pitch about Y
const body = new THREE.Group(); pitch.add(body);            // body frame

/* Layers: 0 shared, 1 side grid, 2 front grid, 3 top grid, 4 3D floor. */
const L_SIDE = 1, L_FRONT = 2, L_TOP = 3, L_3D = 4;

/* ---------------- Materials ---------------- */
const PAL = {
  wall: 0x2b5a4f, deck: 0x9db3a6, angle: 0x7f9a8c, mount: 0xd9783a, hardware: 0xc9b9a3,
  link: 0xd9783a, carrier: 0x2b5a4f, drive: 0x8d949b, motor: 0x5d646b, encoder: 0x3b4248,
  pcb: 0x1e7f4f, imu: 0xc0392b, board: 0xd8c78a, servo: 0x24282b, header: 0x2e2e2e,
};
const HOUSING = new Set(['wall', 'deck', 'angle', 'mount', 'hardware']);
const materials = {};
const edgeMats = {};
function mat(kind) {
  if (!materials[kind]) {
    const metal = ['drive', 'motor', 'encoder'].includes(kind);
    materials[kind] = new THREE.MeshStandardMaterial({
      color: PAL[kind] ?? 0x999999, roughness: metal ? 0.38 : 0.72, metalness: metal ? 0.55 : 0.02,
      side: THREE.DoubleSide, transparent: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    materials[kind].userData.kind = kind;
  }
  return materials[kind];
}
function edgeMat(kind) {
  if (!edgeMats[kind]) edgeMats[kind] = new THREE.LineBasicMaterial({ color: THEME.ink, transparent: true, opacity: 0.55 });
  return edgeMats[kind];
}
function applyTheme() {
  THEME = readTheme();
  for (const m of Object.values(edgeMats)) m.color.set(THEME.ink);
  makeGrids();
}

function classify(n) {
  if (n === 'body_near' || n === 'body_far') return 'wall';
  if (/_deck$/.test(n)) return 'deck';
  if (/^angle_/.test(n)) return 'angle';
  if (n === 'lower_link' || n === 'upper_link') return 'link';
  if (n === 'carrier') return 'carrier';
  if (n === 'gearbox' || n === 'motor_pilot' || n === 'shaft' || n === 'hub') return 'drive';
  if (n === 'motor') return 'motor';
  if (n === 'encoder') return 'encoder';
  if (n === '11_pico_plate_PCB') return 'pcb';
  if (n === '12_imu_plate_PCB') return 'imu';
  if (/insulating_board/.test(n)) return 'board';
  if (/pico_header/.test(n)) return 'header';
  if (/^ST3215/.test(n)) return 'servo';
  if (/spacer|foot/.test(n)) return 'hardware';
  return 'mount';
}

function decode(part) {
  const pb = Uint8Array.from(atob(part.p), (c) => c.charCodeAt(0));
  const ib = Uint8Array.from(atob(part.i), (c) => c.charCodeAt(0));
  const pos16 = new Int16Array(pb.buffer);
  const pos = new Float32Array(pos16.length);
  for (let k = 0; k < pos16.length; k++) pos[k] = pos16[k] * MESH.quantum_mm;
  const idx = part.w === 2 ? new Uint16Array(ib.buffer) : new Uint32Array(ib.buffer);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  const edges = new THREE.EdgesGeometry(g, 28);
  const flat = g.toNonIndexed(); flat.computeVertexNormals(); g.dispose();
  return { geo: flat, edges };
}

/* Parts that belong to the near side and receive a mirrored far-side copy. */
const NEAR_FIXED = new Set(['servo_cradle', 'servo_bar_4', 'servo_bar_17', 'ST3215_case_envelope',
  'ST3215_output_envelope', 'body_lower_spacer', 'body_upper_spacer']);

const housingObjects = [];      // meshes + edges that fade
const solidKinds = new Set();

function meshObject(geo, edges, kind) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat(kind)); g.add(m);
  const e = new THREE.LineSegments(edges, edgeMat(HOUSING.has(kind) ? 'housing' : 'solid')); g.add(e);
  g.userData.kind = kind;
  return g;
}

/* Leg rig: one per side. The far rig is mirrored about Y = MID_Y. */
function makeLegRig() {
  const rig = new THREE.Group();                // shifted by pivotX
  const lower = new THREE.Group();              // rotates about Y through (0,0,0)
  const upperPivot = new THREE.Group(); upperPivot.position.set(0, 0, SPACING);
  const upper = new THREE.Group(); upper.position.set(0, 0, -SPACING); upperPivot.add(upper);
  const carrier = new THREE.Group();            // translates
  const wheelSpin = new THREE.Group();          // at the neutral axle, spins about Y
  wheelSpin.position.set(NEU.cx + AXLE_OFS, WHEEL_Y, NEU.cz);
  carrier.add(wheelSpin);
  const fixed = new THREE.Group();
  rig.add(lower, upperPivot, carrier, fixed);
  return { rig, lower, upper, upperPivot, carrier, wheelSpin, fixed };
}
const legs = [makeLegRig(), makeLegRig()];
// Far side: the same rig under a group that mirrors about Y = MID_Y (y' = -135 - y).
const farMirror = new THREE.Group(); farMirror.position.y = 2 * MID_Y; farMirror.scale.y = -1;
body.add(legs[0].rig);
body.add(farMirror);
farMirror.add(legs[1].rig);

const servoSides = [new THREE.Group(), new THREE.Group()];
body.add(servoSides[0]); farMirror.add(servoSides[1]);

function buildFromMesh() {
  for (const part of MESH.parts) {
    const kind = classify(part.n);
    const { geo, edges } = decode(part);
    const place = (holder) => {
      const o = meshObject(geo, edges, kind); holder.add(o);
      if (HOUSING.has(kind)) housingObjects.push(o); else solidKinds.add(kind);
      return o;
    };
    if (part.r === 'lower_link') { legs.forEach((s) => place(s.lower)); continue; }
    if (part.r === 'upper_link') { legs.forEach((s) => place(s.upper)); continue; }
    if (part.r === 'carrier') { legs.forEach((s) => place(s.carrier)); continue; }
    if (part.n === 'body_lower_spacer' || part.n === 'body_upper_spacer') { legs.forEach((s) => place(s.fixed)); continue; }
    if (NEAR_FIXED.has(part.n)) { servoSides.forEach((h) => place(h)); continue; }
    if (part.n === 'angle_60_44_0' || part.n === 'angle_60_44_1') { place(rearLowerAngles); continue; }
    place(body);
  }
}

/* ---------------- Added detail: wheels, electronics, battery ---------------- */
function box(w, d, h, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, d, h),
    new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.6, metalness: opts.metal ?? 0.05 }));
  m.position.set(x, y, z); return m;
}
function cylY(r, len, color, x, y, z, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.2 }));
  m.position.set(x, y, z); return m;  // three cylinder axis is local Y = CAD Y here
}

function makeWheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1c1f20, roughness: 0.92, side: THREE.DoubleSide }));
  g.add(tire);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x2a2e30, roughness: 0.85, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(11, WHEEL_R, 64), sideMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = s * WHEEL_W / 2; g.add(ring);
  }
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, WHEEL_W + 1, 48),
    new THREE.MeshStandardMaterial({ color: 0xc9cdd0, roughness: 0.4, metalness: 0.5 }));
  g.add(rim);
  // Spokes and a tread mark make the rotation visible in all views.
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x3b4248, roughness: 0.5 });
  for (let k = 0; k < 5; k++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(6, WHEEL_W + 2, 24), spokeMat);
    const a = k * 2 * Math.PI / 5; sp.position.set(17 * Math.cos(a), 0, 17 * Math.sin(a)); sp.rotation.y = -a; g.add(sp);
  }
  const lugMat = new THREE.MeshStandardMaterial({ color: 0x0f1112, roughness: 1 });
  for (let k = 0; k < 24; k++) {
    const a = k * 2 * Math.PI / 24;
    const lug = new THREE.Mesh(new THREE.BoxGeometry(3, WHEEL_W - 4, 2.4), lugMat);
    lug.position.set((WHEEL_R + 0.6) * Math.cos(a), 0, (WHEEL_R + 0.6) * Math.sin(a)); lug.rotation.y = -a; g.add(lug);
  }
  const mark = new THREE.Mesh(new THREE.BoxGeometry(5, WHEEL_W + 1.5, 10), new THREE.MeshStandardMaterial({ color: 0xce633b }));
  mark.position.set(0, 0, WHEEL_R - 4); g.add(mark);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 48), 20),
    edgeMat('solid')); g.add(edges);
  return g;
}
legs.forEach((s) => s.wheelSpin.add(makeWheel()));

/* Encoder caps (the R04 reference uses a plain cylinder). */
legs.forEach((s) => {
  const cap = cylY(16.5, 1.6, 0x1e7f4f, NEU.cx + MOTOR_OFS, -43.4, NEU.cz);
  s.carrier.add(cap);
  const magnet = cylY(6, 3, 0x9aa3a8, NEU.cx + MOTOR_OFS, -45.5, NEU.cz); s.carrier.add(magnet);
});

/* Electronics detail on the reference boards. Positions in body mm. */
const elec = new THREE.Group(); body.add(elec);
const PICO = { x: 0, y: -97.5, z: 192 }, IMU = { x: 0, y: -41.5, z: 190.6 };
elec.add(box(7, 7, 1, 0x1a1a1a, PICO.x + 2, PICO.y, PICO.z + 0.5));                    // RP2350
elec.add(box(7.5, 8, 3, 0xb9bec2, PICO.x - 23, PICO.y, PICO.z + 1.5, { metal: 0.7, rough: 0.3 })); // USB
elec.add(box(3.5, 4.5, 1.6, 0xf4f4f4, PICO.x - 13, PICO.y + 5, PICO.z + 0.8));          // BOOTSEL
elec.add(box(3, 3, 1, 0x111111, IMU.x, IMU.y, IMU.z + 0.5));                              // LSM6DSO
elec.add(box(5, 6, 3, 0xd9d9d9, IMU.x - 9, IMU.y, IMU.z + 1.5));                          // Qwiic
// Lower deck, power cut and fuse cassette (Y -38.5).
elec.add(box(13, 19, 12, 0x1f1f1f, -9, -38.5, 86.6));                                     // switch
elec.add(box(4, 8, 6, 0xd13a2f, -9, -38.5, 95));                                          // rocker
elec.add(box(9, 20, 9, 0x3d3d3d, 9, -38.5, 85.1));                                        // fuse holder
elec.add(box(4, 6, 6, 0xe0b02e, 9, -38.5, 90));                                           // blade fuse
// Middle deck, regulators (Y -38.5) and servo bus + encoder conversion (Y -96.5).
for (const [x, c] of [[-9, 0x2c5aa0], [9, 0x2c5aa0]]) {
  elec.add(box(15, 22, 1.6, c, x, -38.5, 141.4));
  elec.add(box(8, 8, 5, 0x333333, x, -38.5 + 4, 144.7));                                  // inductor
  elec.add(cylY(2.5, 6, 0x222222, x + 3, -38.5 - 6, 145.2, 16));                          // capacitor
}
elec.add(box(20, 15, 1.6, 0x6b3fa0, -9, -96.5, 141.4)); elec.add(box(6, 5, 1.2, 0x111111, -9, -96.5, 142.8));
elec.add(box(12, 13, 1.6, 0x1f6fb2, 10, -102, 141.4)); elec.add(box(12, 13, 1.6, 0x1f6fb2, 10, -89, 141.4));

/* DRV8874 carriers on the lower driver cassette. R04 shows one. The R05 proposal shows two. */
const drivers = [];
for (const x of [0, -8.8, 8.8]) {
  const g = new THREE.Group();
  g.add(box(15.2, 17.8, 1.6, 0x1f8a4c, 0, 0, 0));
  g.add(box(3, 4, 0.9, 0x111111, 0, 1.5, 1.2));
  g.add(box(2.2, 17.8, 2.5, 0x222222, -6.5, 0, -2));
  g.add(box(2.2, 17.8, 2.5, 0x222222, 6.5, 0, -2));
  g.position.set(x, -96.5, 85); elec.add(g); drivers.push(g);
}

/* Battery bay proposal, below the lower deck. */
const batteryGroup = new THREE.Group(); body.add(batteryGroup);
{
  const b = LAYOUTS.r05.battery;
  const pack = box(b.dx, b.dy, b.dz, 0x2f6fa8, b.x, b.y, b.z, { rough: 0.45 });
  batteryGroup.add(pack);
  batteryGroup.add(box(b.dx + 0.2, 40, b.dz + 0.2, 0xe8e4d8, b.x, b.y, b.z));              // label band
  const tray = box(118, 133.8, 4, PAL.deck, 0, MID_Y, -32);
  tray.userData.kind = 'deck'; batteryGroup.add(tray);
  housingObjects.push(tray);
  tray.material.transparent = true;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pack.geometry), edgeMat('solid'));
  edges.position.copy(pack.position); batteryGroup.add(edges);
}
/* New pivot holes for the R05 proposal, marked on both walls. */
const pivotMarks = new THREE.Group(); body.add(pivotMarks);
for (const y of [6.2, -141.2]) for (const z of [0, SPACING]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.8, 8, 24), new THREE.MeshBasicMaterial({ color: 0xce633b }));
  ring.rotation.x = Math.PI / 2; ring.position.set(LAYOUTS.r05.pivotX, y, z); pivotMarks.add(ring);
}

/* R05 internal servos, pulleys and hip shafts (near side; the far side is mirrored). */
const innerServos = [new THREE.Group(), new THREE.Group()];
body.add(innerServos[0]); farMirror.add(innerServos[1]);
{
  const s = servoInside(LAYOUTS.r05), hip = LAYOUTS.r05.pivotX, yBelt = -42;
  for (const g of innerServos) {
    const caseMesh = box(45.2, 35, 24.7, 0x24282b, s.cx, -1 - 17.5, s.cz, { rough: 0.5 });
    g.add(caseMesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(caseMesh.geometry), edgeMat('solid')).translateX(s.cx).translateY(-18.5).translateZ(s.cz));
    g.add(box(10, 2, 8, 0xd8d8d8, s.cx - 14, -1 - 17.5 - 17.6, s.cz + 6));                  // label patch
    g.add(cylY(4, 4, 0xb9bec2, s.ox, -38, s.oz, 20));                                          // output spline / horn
    g.add(cylY(3.8, 7, 0xce633b, s.ox, yBelt, s.oz, 24));                                      // 12T pulley
    g.add(cylY(11.5, 7, 0xce633b, hip, yBelt, 0, 40));                                         // 36T pulley
    g.add(cylY(4, 52, 0x9aa3a8, hip, -20, 0, 16));                                             // supported hip shaft
    g.add(cylY(6.5, 6, 0x555b60, hip, 3, 0, 24));                                              // wall bearing
  }
}
/* The two rear lower-deck angles move above the deck in R05, clear of the upper hip nut. */
const rearLowerAngles = new THREE.Group(); body.add(rearLowerAngles);
{
}

/* Concept 3:1 belt from the servo output (0, 81.5) to the upper body pivot. Not designed. */
const beltGroups = [new THREE.Group(), new THREE.Group()];
body.add(beltGroups[0]); farMirror.add(beltGroups[1]);
const beltMat = new THREE.LineDashedMaterial({ color: 0xce633b, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.95 });
function rebuildBelts(lay) {
  const px = lay.pivotX, inside = lay.servoInside, s = servoInside(lay);
  for (const g of beltGroups) {
    g.clear();
    const a = inside ? new THREE.Vector2(s.ox, s.oz) : new THREE.Vector2(0, 81.5);
    const b = inside ? new THREE.Vector2(px, 0) : new THREE.Vector2(px, SPACING);
    const ra = 3.8, rb = 11.5, y = inside ? -42 : 52;
    const circle = (c, r) => {
      const pts = []; for (let k = 0; k <= 48; k++) { const t = k / 48 * 2 * Math.PI; pts.push(new THREE.Vector3(c.x + r * Math.cos(t), y, c.y + r * Math.sin(t))); }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), beltMat); l.computeLineDistances(); return l;
    };
    g.add(circle(a, ra), circle(b, rb));
    // Outer tangents of two circles.
    const d = b.clone().sub(a), L = d.length(), ang = Math.atan2(d.y, d.x), off = Math.acos((ra - rb) / L);
    for (const s of [1, -1]) {
      const t = ang + s * off;
      const p1 = new THREE.Vector3(a.x + ra * Math.cos(t), y, a.y + ra * Math.sin(t));
      const p2 = new THREE.Vector3(b.x + rb * Math.cos(t), y, b.y + rb * Math.sin(t));
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), beltMat); l.computeLineDistances(); g.add(l);
    }
    if (!inside) {
      const shaft = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px, 23, SPACING), new THREE.Vector3(px, y + 3, SPACING)]), beltMat);
      shaft.computeLineDistances(); g.add(shaft);
    }
  }
}

/* ---------------- Harness (net classes from cad/wiring/v1-proof-netlist.json) ---------------- */
const NET = {
  pack: { color: 0xe5484d, label: 'Pack and actuator power', group: 'power' },
  rail: { color: 0xf5a524, label: 'Regulated 5 V and 9 V', group: 'power' },
  motor: { color: 0xd6409f, label: 'Motor OUT1 / OUT2', group: 'control' },
  logic: { color: 0x3e93de, label: 'Pico 2 control and SPI', group: 'control' },
  bus: { color: 0x8e4ec6, label: 'Servo bus (9 V + data)', group: 'control' },
  enc: { color: 0x30a46c, label: 'Encoder and fault feedback', group: 'feedback' },
};
const EXIT_A = -94.5, EXIT_B = -40.5, FX = -58;   // forward cable exits in each deck
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* side: 0 near, 1 far. Moving endpoints use the carrier pose. */
function motorTail(side, p) {
  const y = side === 0 ? -44 : 2 * MID_Y + 44;
  return [V(p.mx, y, p.cz + 12), V(p.mx + 10 * Math.sign(p.px - p.mx || 1), y + (side === 0 ? -6 : 6), p.cz + 30)];
}
function routes(p, lay) {
  const R = [];
  const src = lay.battery ? [V(lay.battery.x - 52, MID_Y, -10), V(-62, -55, 10)] : [V(190, MID_Y + 40, 40), V(70, -45, 40)];
  R.push({ id: 'pack-in', net: 'pack', pts: [...src, V(-40, -45, 30), V(FX, EXIT_B, 50), V(FX, EXIT_B, 70), V(-18, -38.5, 86)] });
  R.push({ id: 'act-drv', net: 'pack', pts: [V(-18, -38.5, 86), V(-24, -60, 92), V(-24, -80, 92), V(-12, -96.5, 87)] });
  R.push({ id: 'act-reg', net: 'pack', pts: [V(-12, -38.5, 90), V(FX, EXIT_B, 96), V(FX, EXIT_B, 130), V(-18, -38.5, 146)] });
  R.push({ id: 'v5-pico', net: 'rail', pts: [V(-6, -38.5, 147), V(FX, EXIT_B, 152), V(FX, EXIT_B, 182), V(-22, -88.6, 193)] });
  R.push({ id: 'v9-bus', net: 'rail', pts: [V(12, -38.5, 147), V(16, -60, 152), V(16, -80, 152), V(10, -92, 143)] });
  R.push({ id: 'spi', net: 'logic', pts: [V(12, -88.6, 193), V(12, -70, 197), V(2, -50, 196), V(-11, -41.5, 191.5)] });
  R.push({ id: 'drv-ctrl', net: 'logic', pts: [V(-6, -106.4, 193), V(FX, EXIT_A, 182), V(FX, EXIT_A, 120), V(FX, EXIT_A, 70), V(-14, -100, 88)] });
  R.push({ id: 'pico-bus', net: 'logic', pts: [V(6, -106.4, 193), V(FX, EXIT_A, 178), V(FX, EXIT_A, 135), V(-14, -96.5, 143)] });
  if (lay.servoInside) {
    const s = servoInside(lay);
    R.push({ id: 'servo-near', net: 'bus', pts: [V(16, -96.5, 145), V(FX + 2, EXIT_B - 3, 130), V(FX + 2, EXIT_B - 3, 66), V(-50, -25, 40), V(s.cx - 20, -20, s.cz + 13)] });
    R.push({ id: 'servo-far', net: 'bus', pts: [V(16, -96.5, 145), V(FX + 2, EXIT_A + 3, 130), V(FX + 2, EXIT_A + 3, 66), V(-50, -110, 40), V(s.cx - 20, -115, s.cz + 13)] });
  } else {
    R.push({ id: 'servo-near', net: 'bus', pts: [V(16, -96.5, 145), V(16, -60, 150), V(8, -10, 112), V(0, 3, 104), V(0, 12, 110)] });
    R.push({ id: 'servo-far', net: 'bus', pts: [V(16, -96.5, 145), V(16, -115, 150), V(8, -125, 112), V(0, -138, 104), V(0, -147, 110)] });
  }
  for (const side of [0, 1]) {
    const tail = motorTail(side, p);
    const yIn = side === 0 ? -30 : 2 * MID_Y + 30, exit = side === 0 ? EXIT_B : EXIT_A;
    const run = [...tail, V(45, yIn, -42), V(-30, yIn, -10), V(FX, exit, 40), V(FX, exit, 66)];
    R.push({ id: 'motor-' + side, net: 'motor', pts: [...run, V(10, -96.5 + (side ? 4 : -4), 88)] });
    R.push({ id: 'enc-' + side, net: 'enc', reverse: true,
      pts: [...run.map((v) => v.clone().add(V(2, 3, 0))), V(FX + 2, exit + 3, 130), V(10, -96.5 + (side ? 6 : -6), 143)] });
  }
  R.push({ id: 'enc-pico', net: 'enc', reverse: true, pts: [V(10, -89, 143), V(FX, EXIT_A + 4, 150), V(FX, EXIT_A + 4, 180), V(16, -106.4, 193)] });
  return R;
}

const harness = new THREE.Group(); body.add(harness);
const wires = new Map();
const beadGeo = new THREE.SphereGeometry(1.9, 12, 8);
function wireObject(r) {
  const mat = new THREE.MeshStandardMaterial({ color: NET[r.net].color, roughness: 0.45, emissive: NET[r.net].color, emissiveIntensity: 0.15, transparent: true });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  const beads = [];
  const bmat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(beadGeo, bmat); harness.add(b); beads.push(b); }
  harness.add(mesh);
  return { mesh, mat, beads, bmat, curve: null, sig: '' };
}
function updateWires(p, lay, tl, time) {
  for (const r of routes(p, lay)) {
    let w = wires.get(r.id); if (!w) { w = wireObject(r); wires.set(r.id, w); }
    const sig = r.pts.map((v) => v.x.toFixed(1) + v.y.toFixed(1) + v.z.toFixed(1)).join();
    if (sig !== w.sig) {
      w.curve = new THREE.CatmullRomCurve3(r.pts, false, 'centripetal', 0.5);
      w.mesh.geometry.dispose();
      w.mesh.geometry = new THREE.TubeGeometry(w.curve, 64, r.net === 'pack' || r.net === 'motor' ? 1.5 : 1.0, 6, false);
      w.sig = sig;
    }
    const vis = Math.max(0.12, tl.xray);
    w.mat.opacity = vis; w.mesh.visible = tl.xray > 0.02 || state.manualXray > 0.02;
    const level = state.flows ? tl.flow[NET[r.net].group] : 0;
    w.mat.emissiveIntensity = 0.15 + 0.6 * level;
    w.beads.forEach((b, k) => {
      b.visible = level > 0.02 && w.mesh.visible;
      if (!b.visible) return;
      let u = ((time * (r.net === 'logic' || r.net === 'enc' ? 0.35 : 0.22)) + k / w.beads.length) % 1;
      if (r.reverse) u = 1 - u;
      b.position.copy(w.curve.getPointAt(u));
      b.scale.setScalar(0.6 + 0.6 * level);
    });
    w.bmat.opacity = 0.95;
  }
}

/* ---------------- Ground and grids ---------------- */
function grid(size, step, color, opacity) {
  const pts = [];
  for (let v = -size; v <= size; v += step) { pts.push(-size, v, 0, size, v, 0, v, -size, 0, v, size, 0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}
const grids = [];
function makeGrids() {
  for (const gobj of grids) cad.remove(gobj); grids.length = 0;
  const add = (obj, layer, setup) => { setup(obj); obj.traverse((o) => o.layers.set(layer)); cad.add(obj); grids.push(obj); };
  const minor = THEME.grid, major = THEME.gridMajor;
  // Floor grids (CAD XY plane at Z=0) for top and 3D.
  for (const [layer, op] of [[L_TOP, 0.9], [L_3D, 0.7]]) {
    add(grid(3000, 10, minor, op * 0.45), layer, (o) => { o.position.z = -0.4; });
    add(grid(3000, 50, major, op), layer, (o) => { o.position.z = -0.2; });
  }
  // Vertical grids behind the side (XZ plane) and front (YZ plane) views.
  add(grid(3000, 10, minor, 0.45), L_SIDE, (o) => { o.rotation.x = Math.PI / 2; o.position.y = -600; });
  add(grid(3000, 50, major, 0.9), L_SIDE, (o) => { o.rotation.x = Math.PI / 2; o.position.y = -599; });
  add(grid(3000, 10, minor, 0.45), L_FRONT, (o) => { o.rotation.y = Math.PI / 2; o.position.x = 900; });
  add(grid(3000, 50, major, 0.9), L_FRONT, (o) => { o.rotation.y = Math.PI / 2; o.position.x = 899; });
  // Floor slab, 3D view only.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: THEME.paper3d, roughness: 1 }));
  add(floor, L_3D, (o) => { o.position.z = -1; });
}

/* ---------------- Cameras ---------------- */
const views = {
  top: { el: $('v-top'), cam: new THREE.OrthographicCamera(), layer: L_TOP },
  side: { el: $('v-side'), cam: new THREE.OrthographicCamera(), layer: L_SIDE },
  front: { el: $('v-front'), cam: new THREE.OrthographicCamera(), layer: L_FRONT },
  iso: { el: $('v-iso'), cam: new THREE.PerspectiveCamera(30, 1, 10, 20000), layer: L_3D },
};
for (const v of Object.values(views)) { v.cam.layers.enable(0); v.cam.layers.enable(v.layer); }
views.iso.cam.position.set(-620, 520, -760);
const controls = new OrbitControls(views.iso.cam, views.iso.el);
controls.target.set(0, 150, 67.5); controls.enableDamping = true; controls.minDistance = 250; controls.maxDistance = 3000;
let userOrbit = false;   // after the user turns the 3D view, the script stops moving the camera
controls.addEventListener('start', () => { userOrbit = true; $('reset-view').hidden = false; });
/* Scripted 3D camera: slow turntable, closer during the x-ray. Angles about the vertical axis. */
function scriptedCamera(t, xray) {
  const az = -2.35 + 0.5 * Math.sin(2 * Math.PI * t / T_END);          // front quarter, near side
  const dist = 1080 - 240 * xray, el = 0.34 - 0.04 * xray;
  const c = new THREE.Vector3(0, MID_Y, 15 + 35 * xray); body.localToWorld(c);
  const tg = controls.target; tg.y = c.y; tg.z = c.z;
  views.iso.cam.position.set(tg.x + dist * Math.cos(el) * Math.cos(az), tg.y + dist * Math.sin(el) + 40,
    tg.z + dist * Math.cos(el) * Math.sin(az));
  views.iso.cam.lookAt(tg);
}
let zoom = 1;

/* World (three) coordinates of a CAD point: (X, Z, -Y). */
function placeOrtho(cx, rects) {
  // One scale for all three orthographic views, so they are true projections at one scale.
  const spanX = 480, spanZ = 470, spanY = 340;
  const r = rects;
  const mmPerPx = Math.max(spanY / r.top.h, spanX / r.top.w, spanX / r.side.w, spanZ / r.side.h, spanY / r.front.w, spanZ / r.front.h) / zoom;
  const zc = 175, yc = 67.5;  // ground sits near the lower edge, room for dimensions // three y (height) centre and three z (= -CAD Y) centre
  const set = (cam, w, h, pos, look, up) => {
    cam.left = -w * mmPerPx / 2; cam.right = w * mmPerPx / 2; cam.top = h * mmPerPx / 2; cam.bottom = -h * mmPerPx / 2;
    cam.near = 1; cam.far = 6000; cam.position.copy(pos); cam.up.copy(up); cam.lookAt(look); cam.updateProjectionMatrix();
  };
  set(views.side.cam, r.side.w, r.side.h, new THREE.Vector3(cx, zc, -2000), new THREE.Vector3(cx, zc, 0), new THREE.Vector3(0, 1, 0));
  set(views.front.cam, r.front.w, r.front.h, new THREE.Vector3(cx - 2000, zc, yc), new THREE.Vector3(cx, zc, yc), new THREE.Vector3(0, 1, 0));
  set(views.top.cam, r.top.w, r.top.h, new THREE.Vector3(cx, 2000, yc), new THREE.Vector3(cx, 0, yc), new THREE.Vector3(0, 0, 1));
  return mmPerPx;
}

/* ---------------- Pose application ---------------- */
let wheelAngle = 0, lastX = 0;
function applyPose(q, x, accel, lay, balanced) {
  const p = legPose(q, lay);
  for (const s of legs) {
    s.rig.position.x = lay.pivotX; s.rig.scale.x = lay.dir;
    s.lower.rotation.y = (Q_NEU - q) * DEG;
    s.upperPivot.rotation.y = (Q_NEU - q) * DEG;
    s.carrier.position.set(LINK * Math.sin(q * DEG) - NEU.cx, 0, p.cz - NEU.cz);
  }
  // Rolling without slip: forward (-X) motion turns the wheel top forward.
  wheelAngle += (x - lastX) / WHEEL_R; lastX = x;
  for (const s of legs) s.wheelSpin.rotation.y = wheelAngle * lay.dir;
  const trim = balanced ? trimDeg(p, lay) : 0;
  const lean = balanced ? Math.atan2(accel, 9810) / DEG : 0; // lean into the acceleration
  const theta = (trim + lean) * DEG;
  drive.position.set(x, 0, 0);
  pitch.position.set(0, 0, WHEEL_R);
  pitch.rotation.y = theta;
  body.position.set(-p.ax, 0, -p.az);
  return { p, trim, lean, theta };
}

function setLayout(lay) {
  state.layout = lay;
  batteryGroup.visible = !!lay.battery;
  pivotMarks.visible = lay.id === 'r05';
  drivers[0].visible = lay.drivers === 1; drivers[1].visible = drivers[2].visible = lay.drivers === 2;
  rebuildBelts(lay);
  servoSides.forEach((g) => { g.visible = !lay.servoInside; });
  innerServos.forEach((g) => { g.visible = lay.servoInside; });
  rearLowerAngles.scale.z = lay.id === 'r05' ? -1 : 1;           // reflect about Z = 62: below -> above the deck
  rearLowerAngles.position.z = lay.id === 'r05' ? 124 : 0;
  wires.forEach((w) => { w.sig = ''; });
  document.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === lay.id)));
  renderFindings();
}

function setXray(v) {
  const o = 1 - 0.9 * v;
  for (const kind of HOUSING) {
    const m = materials[kind]; if (!m) continue;
    m.transparent = v > 0.001; m.opacity = o; m.depthWrite = v < 0.5;
  }
  for (const obj of housingObjects) {
    obj.traverse((c) => {
      if (c.isMesh && c.material !== materials[obj.userData.kind]) { c.material.transparent = true; c.material.opacity = o; c.material.depthWrite = v < 0.5; }
    });
  }
  if (edgeMats.housing) edgeMats.housing.opacity = 0.55 * (1 - 0.75 * v);
  elec.traverse((c) => { if (c.isMesh) { c.material.emissive?.setHex(0x203040); c.material.emissiveIntensity = 0.6 * v; } });
}

/* ---------------- Labels ---------------- */
const LABELS = [
  { id: 'pico', text: 'Pico 2 · balance loop', at: () => [-10, -97.5, 196] },
  { id: 'imu', text: 'LSM6DSO IMU', at: () => [0, -41.5, 194] },
  { id: 'bus', text: 'Servo bus and encoder conversion', at: () => [0, -96.5, 150] },
  { id: 'reg', text: 'Regulators 5 V / 9 V', at: () => [0, -38.5, 150] },
  { id: 'drv', text: () => state.layout.drivers === 2 ? 'DRV8874 drivers ×2' : 'DRV8874 driver', at: () => [0, -96.5, 90] },
  { id: 'cut', text: 'Power cut and fuse', at: () => [0, -38.5, 100] },
  { id: 'servo', text: () => state.layout.servoInside ? 'ST3215 servo, inside, 3:1 belt' : 'ST3215 servo, outside wall', at: () => state.layout.servoInside ? [servoInside(state.layout).cx, -20, 26] : [0, 30, 118] },
  { id: 'motor', text: 'Pololu 4752 gearmotor', at: (p) => [p.mx, -40, p.cz + 20], leg: true },
  { id: 'batt', text: () => state.layout.battery ? 'Battery bay (proposal)' : 'Bench supply lead (no battery position)', at: () => state.layout.battery ? [state.layout.battery.x - 30, MID_Y, -5] : [150, -30, 40] },
];
const labelLayer = $('labels');
for (const l of LABELS) { const d = document.createElement('div'); d.className = 'tag'; labelLayer.appendChild(d); l.el = d; }

/* ---------------- Overlay drawing ---------------- */
const tmp = new THREE.Vector3();
function toScreen(cadPt, cam, rect) {
  tmp.set(cadPt[0], cadPt[1], cadPt[2]);
  body.localToWorld(tmp);
  tmp.project(cam);
  return [rect.x + (tmp.x + 1) / 2 * rect.w, rect.y + (1 - tmp.y) / 2 * rect.h, tmp.z];
}
function worldToScreen(w, cam, rect) {
  tmp.copy(w).project(cam); return [rect.x + (tmp.x + 1) / 2 * rect.w, rect.y + (1 - tmp.y) / 2 * rect.h];
}
function cadWorld(X, Y, Z) { const v = new THREE.Vector3(X, Y, Z); cad.localToWorld(v); return v; }

function arrowLine(ctx, a, b, color) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  for (const [p, q] of [[a, b], [b, a]]) {
    const ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] - 7 * Math.cos(ang - 0.35), p[1] - 7 * Math.sin(ang - 0.35));
    ctx.lineTo(p[0] - 7 * Math.cos(ang + 0.35), p[1] - 7 * Math.sin(ang + 0.35)); ctx.closePath(); ctx.fill();
  }
}
function tagText(ctx, txt, x, y, color, align = 'left', bg = true) {
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Consolas, monospace';
  const w = ctx.measureText(txt).width;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (bg) { ctx.fillStyle = THEME.paper; ctx.globalAlpha = 0.85; ctx.fillRect(x0 - 3, y - 11, w + 6, 15); ctx.globalAlpha = 1; }
  ctx.fillStyle = color; ctx.fillText(txt, x0, y);
}
function comMark(ctx, x, y) {
  const r = 7; ctx.lineWidth = 1.2; ctx.strokeStyle = THEME.ink;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.stroke();
  ctx.fillStyle = THEME.ink;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
}

function drawOverlay(rects, info, mmPerPx) {
  const dpr = renderer.getPixelRatio();
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.clearRect(0, 0, overlay.width, overlay.height);
  const { p, trim } = info, lay = state.layout;
  const groundY = (rect, cam) => worldToScreen(cadWorld(drive.position.x, 0, 0), cam, rect)[1];

  /* SIDE */
  {
    const r = rects.side, cam = views.side.cam, ctx = octx;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    const gy = groundY(r, cam);
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, gy); ctx.lineTo(r.x + r.w, gy); ctx.stroke();
    ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    const off = ((drive.position.x / mmPerPx) % 12 + 12) % 12;
    for (let x = r.x - 12 - off; x < r.x + r.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, gy + 10); ctx.lineTo(x + 10, gy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // Axle, pivots and CoM.
    const ax = toScreen([p.ax, 6, p.az], cam, r);
    const lp = toScreen([p.px, 6, 0], cam, r), up = toScreen([p.px, 6, SPACING], cam, r);
    const c = com(p, lay), cm = toScreen([c.x, 6, c.z], cam, r);
    ctx.strokeStyle = THEME.dim; ctx.setLineDash([5, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax[0], gy); ctx.lineTo(ax[0], r.y + 18); ctx.stroke();      // gravity line through the axle
    // Body vertical axis through the lower pivot.
    const bTop = toScreen([p.px, 6, 230], cam, r), bBot = toScreen([p.px, 6, -40], cam, r);
    ctx.strokeStyle = THEME.muted; ctx.beginPath(); ctx.moveTo(bBot[0], bBot[1]); ctx.lineTo(bTop[0], bTop[1]); ctx.stroke();
    ctx.setLineDash([]);
    comMark(ctx, cm[0], cm[1]);
    tagText(ctx, 'CoM', cm[0] - 12, cm[1] + 4, THEME.ink, 'right');
    for (const s of [lp, up]) { ctx.fillStyle = THEME.paper; ctx.strokeStyle = THEME.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s[0], s[1], 4, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = THEME.accent; ctx.beginPath(); ctx.arc(ax[0], ax[1], 3, 0, 7); ctx.fill();
    // Leg angle arc at the lower pivot (relative to the body vertical).
    const legEnd = toScreen([p.cx, 6, p.cz], cam, r);
    const a0 = Math.atan2(bBot[1] - lp[1], bBot[0] - lp[0]), a1 = Math.atan2(legEnd[1] - lp[1], legEnd[0] - lp[0]);
    ctx.strokeStyle = THEME.accent; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(lp[0], lp[1], 30, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
    // Trim arc at the axle: world vertical to the body vertical.
    if (Math.abs(trim) > 0.3 && state.balanced) {
      const R = 90, base = -Math.PI / 2, bodyAng = -Math.PI / 2 - info.theta;
      ctx.strokeStyle = THEME.dim; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.arc(ax[0], ax[1], R, Math.min(base, bodyAng), Math.max(base, bodyAng)); ctx.stroke();
    }
    // Readout block.
    const lines = [[`q ${p.q.toFixed(1)}°`, THEME.accent], [state.balanced ? `lean ${Math.abs(trim).toFixed(1)}° ${trim >= 0 ? 'back' : 'fwd'}` : 'lean off (upright)', THEME.dim]];
    lines.forEach(([t, c], k) => tagText(ctx, t, r.x + 12, r.y + 46 + k * 18, c));
    // Overall height dimension, placed just to the right of the robot.
    const topPts = [[-60, 6, 180], [60, 6, 180], [-25.5, -97.5, TOP_Z], [25.5, -97.5, TOP_Z]].map((q) => toScreen(q, cam, r));
    const extent = [...topPts, toScreen([p.ax + WHEEL_R, 6, p.az], cam, r), toScreen([60, 6, -35], cam, r), toScreen([-60, 6, -35], cam, r)];
    const topY = Math.min(...topPts.map((s) => s[1]));
    const hmm = (gy - topY) * mmPerPx;
    const dx = Math.min(r.x + r.w - 30, Math.max(...extent.map((s) => s[0])) + 36);
    const topX = topPts.reduce((a, s) => (s[1] < a[1] ? s : a))[0];
    ctx.strokeStyle = THEME.muted; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(dx + 8, topY); ctx.stroke(); ctx.setLineDash([]);
    arrowLine(ctx, [dx, topY], [dx, gy], THEME.dim);
    ctx.save(); ctx.translate(dx + 14, (topY + gy) / 2); ctx.rotate(-Math.PI / 2); tagText(ctx, `${hmm.toFixed(0)} mm`, 0, 0, THEME.dim, 'center'); ctx.restore();
    // Axle offset from body centre (body frame X).
    tagText(ctx, `axle ${Math.abs(p.ax).toFixed(0)} mm ${p.ax >= 0 ? 'rear' : 'forward'} of body centre`, Math.min(r.x + r.w - 250, Math.max(r.x + 130, ax[0] - 120)), gy + 20, THEME.ink);
    ctx.restore();
  }
  /* FRONT */
  {
    const r = rects.front, cam = views.front.cam, ctx = octx;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    const gy = groundY(r, cam);
    ctx.strokeStyle = THEME.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, gy); ctx.lineTo(r.x + r.w, gy); ctx.stroke();
    ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let x = r.x; x < r.x + r.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, gy + 10); ctx.lineTo(x + 10, gy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const wl = toScreen([p.ax, WHEEL_Y, p.az], cam, r), wr = toScreen([p.ax, 2 * MID_Y - WHEEL_Y, p.az], cam, r);
    const y0 = gy + 22;
    arrowLine(ctx, [wl[0], y0], [wr[0], y0], THEME.dim);
    tagText(ctx, `track ${(2 * (WHEEL_Y - MID_Y)).toFixed(0)} mm`, (wl[0] + wr[0]) / 2, y0 - 5, THEME.dim, 'center');
    const ol = toScreen([p.ax, WHEEL_Y + WHEEL_W / 2, p.az], cam, r), or = toScreen([p.ax, 2 * MID_Y - WHEEL_Y - WHEEL_W / 2, p.az], cam, r);
    arrowLine(ctx, [ol[0], y0 + 22], [or[0], y0 + 22], THEME.muted);
    tagText(ctx, `overall ${(2 * (WHEEL_Y + WHEEL_W / 2 - MID_Y)).toFixed(0)} mm`, (ol[0] + or[0]) / 2, y0 + 17, THEME.muted, 'center');
    // Motor tips gap.
    const g1 = toScreen([p.mx, -42.6, p.cz], cam, r), g2 = toScreen([p.mx, 2 * MID_Y + 42.6, p.cz], cam, r);
    const gyM = Math.min(g1[1], g2[1]) - 34;
    arrowLine(ctx, [g1[0], gyM], [g2[0], gyM], THEME.ink);
    tagText(ctx, `motor gap ${(-2 * (MID_Y + 42.6)).toFixed(0)} mm`, (g1[0] + g2[0]) / 2, gyM - 6, THEME.ink, 'center');
    ctx.restore();
  }
  /* TOP */
  {
    const r = rects.top, cam = views.top.cam, ctx = octx;
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    const a = toScreen([p.ax, 75, p.az], cam, r), b = toScreen([p.ax, 2 * MID_Y - 75, p.az], cam, r);
    ctx.strokeStyle = THEME.dim; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    tagText(ctx, 'axle line', a[0] + 6, a[1] + 4, THEME.dim);
    const c = com(p, lay), cm = toScreen([c.x, MID_Y, c.z], cam, r);
    comMark(ctx, cm[0], cm[1]);
    // Forward arrow.
    const f0 = [r.x + r.w - 110, r.y + r.h - 22];
    arrowLine(ctx, f0, [f0[0] + 70, f0[1]], THEME.ink);
    tagText(ctx, 'FORWARD', f0[0], f0[1] - 8, THEME.ink);
    ctx.restore();
  }
  /* Scale bars on the orthographic views */
  for (const k of ['top', 'side', 'front']) {
    const r = rects[k], len = 100 / mmPerPx, x = r.x + 12, y = r.y + r.h - 14;
    octx.fillStyle = THEME.ink; octx.fillRect(x, y, len / 2, 4); octx.strokeStyle = THEME.ink; octx.strokeRect(x, y, len, 4);
    tagText(octx, '100 mm', x + len + 6, y + 5, THEME.muted, 'left', false);
  }
  /* 3D labels: two columns at the view edges, with leader lines to each anchor. */
  const r3 = rects.iso, show = Math.max(info.tl.labels, state.manualXray ?? 0) * (state.labels ? 1 : 0);
  const items = [];
  for (const l of LABELS) {
    l.el.textContent = typeof l.text === 'function' ? l.text() : l.text;
    const s = toScreen(l.at(p), views.iso.cam, r3);
    const inside = s[0] > r3.x + 4 && s[0] < r3.x + r3.w - 4 && s[1] > r3.y + 30 && s[1] < r3.y + r3.h - 4 && s[2] < 1;
    l.el.style.opacity = inside ? show : 0;
    if (inside && show > 0.01) items.push({ l, s, left: s[0] < r3.x + r3.w / 2, w: l.el.offsetWidth || 120 });
    else l.el.style.transform = `translate(${s[0]}px, ${s[1]}px)`;
  }
  for (const left of [true, false]) {
    const col = items.filter((i) => i.left === left).sort((a, b) => a.s[1] - b.s[1]);
    let y = r3.y + 34;
    for (const i of col) { i.y = Math.max(y, i.s[1] - 9); y = i.y + 24; }
    const over = y - (r3.y + r3.h - 8);
    if (over > 0) for (const i of col) i.y -= over;
    for (const i of col) {
      const x = left ? r3.x + 14 : r3.x + r3.w - 14 - i.w;
      i.l.el.style.transform = `translate(${x}px, ${i.y}px)`;
      const ex = left ? x + i.w : x, ey = i.y + 9;
      octx.globalAlpha = show; octx.strokeStyle = THEME.ink; octx.lineWidth = 1;
      octx.beginPath(); octx.moveTo(ex, ey); octx.lineTo(i.s[0], i.s[1]); octx.stroke();
      octx.fillStyle = THEME.accent; octx.beginPath(); octx.arc(i.s[0], i.s[1], 3.5, 0, 7); octx.fill();
      octx.globalAlpha = 1;
    }
  }
}

/* ---------------- Layout of the four views ---------------- */
function viewRects() {
  const base = stage.getBoundingClientRect();
  const out = {};
  for (const [k, v] of Object.entries(views)) {
    const b = v.el.getBoundingClientRect();
    out[k] = { x: b.left - base.left, y: b.top - base.top, w: b.width, h: b.height };
  }
  return out;
}
function resize() {
  const b = stage.getBoundingClientRect();
  renderer.setSize(b.width, b.height, false);
  canvas.style.width = b.width + 'px'; canvas.style.height = b.height + 'px';
  const dpr = renderer.getPixelRatio();
  overlay.width = Math.round(b.width * dpr); overlay.height = Math.round(b.height * dpr);
  overlay.style.width = b.width + 'px'; overlay.style.height = b.height + 'px';
}
new ResizeObserver(resize).observe(stage);

/* ---------------- Readouts and findings ---------------- */
function fmt(n, d = 0) { return (Math.round(n * 10 ** d) / 10 ** d).toFixed(d); }
let lastReadout = 0;
function readouts(info, now) {
  if (now - lastReadout < 90) return; lastReadout = now;
  const { p, trim } = info, lay = state.layout;
  const upright = TOP_Z - p.cz + WHEEL_R;
  const c = com(p, lay);
  const set = (id, v) => { const el = $(id); if (el && el.textContent !== v) el.textContent = v; };
  set('r-q', fmt(p.q, 1) + '°');
  set('r-servo', (p.q - Q_NEU >= 0 ? '+' : '') + fmt((p.q - Q_NEU) * REDUCTION, 1) + '°');
  set('r-drop', fmt(-p.cz, 1) + ' mm');
  set('r-axle', fmt(Math.abs(p.ax), 1) + (p.ax >= 0 ? ' mm rear' : ' mm fwd'));
  set('r-height', fmt(upright, 0) + ' mm');
  set('r-trim', state.balanced ? fmt(Math.abs(trim), 1) + (trim >= 0 ? '° back' : '° fwd') : 'upright (off)');
  set('r-com', `${fmt(c.x - p.ax, 0)} / ${fmt(c.z - p.az, 0)} mm`);
  set('r-gap', fmt(WALL_BOTTOM - (p.cz + 18.4), 1) + ' mm');
  const tl = info.tl;
  const ch = CHAPTERS.find((c) => state.t >= c.t0 && state.t < c.t1) || CHAPTERS[0];
  set('chapter-name', ch.label);
  document.querySelectorAll('[data-chapter]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.chapter === ch.id)));
  const scrub = $('scrub'); if (document.activeElement !== scrub) scrub.value = String(state.t);
  if (document.activeElement !== $('leg') && state.manualQ == null) $('leg').value = String(p.q);
  if (document.activeElement !== $('xray') && state.manualXray == null) $('xray').value = String(tl.xray);
}

function sweepTrim(lay) {
  const t = [Q_MIN, Q_NEU, Q_MAX].map((q) => trimDeg(legPose(q, lay), lay));
  return t;
}
function renderFindings() {
  const r04 = sweepTrim(LAYOUTS.r04), r05 = sweepTrim(LAYOUTS.r05);
  const h = (q) => TOP_Z + LINK * Math.cos(q * DEG) + WHEEL_R;
  const lean = (t) => `${fmt(Math.abs(t), 0)}° ${t >= 0 ? 'back' : 'fwd'}`;
  $('f-trim-r04').textContent = r04.map(lean).join(' / ');
  $('f-trim-r05').textContent = r05.map(lean).join(' / ');
  const r05s = sweepTrim({ ...LAYOUTS.r05, axleAtStrut: true });
  if ($('f-trim-strut')) $('f-trim-strut').textContent = r05s.map(lean).join(' / ');
  $('f-height').textContent = `${fmt(h(Q_MAX), 0)}–${fmt(h(Q_MIN), 0)} mm`;
}

/* ---------------- Controls ---------------- */
$('play').addEventListener('click', () => { state.playing = !state.playing; syncPlay(); });
function syncPlay() { $('play').textContent = state.playing ? 'Pause' : 'Play'; $('play').setAttribute('aria-pressed', String(!state.playing)); }
syncPlay();
$('scrub').max = String(T_END);
$('scrub').addEventListener('input', (e) => { state.t = +e.target.value; });
document.querySelectorAll('[data-chapter]').forEach((b) => b.addEventListener('click', () => {
  const c = CHAPTERS.find((c) => c.id === b.dataset.chapter); state.t = c.t0; state.manualQ = null; state.manualXray = null; $('resume').hidden = true;
  state.playing = true; syncPlay();
}));
document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(LAYOUTS[b.dataset.layout])));
$('leg').addEventListener('input', (e) => { state.manualQ = +e.target.value; $('resume').hidden = false; });
$('xray').addEventListener('input', (e) => { state.manualXray = +e.target.value; $('resume').hidden = false; });
$('resume').addEventListener('click', () => { state.manualQ = null; state.manualXray = null; $('resume').hidden = true; });
$('balanced').addEventListener('change', (e) => { state.balanced = e.target.checked; });
$('flows').addEventListener('change', (e) => { state.flows = e.target.checked; });
$('labels-on').addEventListener('change', (e) => { state.labels = e.target.checked; });
$('zoom').addEventListener('input', (e) => { zoom = +e.target.value; });
$('reset-view').addEventListener('click', () => { userOrbit = false; $('reset-view').hidden = true; });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ---------------- Main loop ---------------- */
let prev = performance.now();
let camX = 0, camOff = null;
function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  if (state.playing) { state.t += dt * state.speed; if (state.t >= T_END) state.t -= T_END; }
  const tl = timeline(state.t);
  if (state.manualXray != null) {
    tl.xray = state.manualXray; const f = state.manualXray > 0.3 ? 1 : 0;
    tl.flow = { power: f, control: f, feedback: f }; tl.labels = state.manualXray;
  }
  const q = state.manualQ ?? tl.q;
  const info = applyPose(q, tl.x, tl.accel, state.layout, state.balanced);
  info.tl = tl;
  setXray(tl.xray);
  updateWires(info.p, state.layout, tl, state.t);
  scene.updateMatrixWorld(true);

  const rects = viewRects();
  // Follow the robot: centre the orthographic views on its current fore/aft extent.
  let lo = Infinity, hi = -Infinity;
  for (const pt of [[-60, MID_Y, -35], [-60, MID_Y, TOP_Z], [60, MID_Y, -35], [60, MID_Y, TOP_Z],
    [info.p.ax - WHEEL_R, MID_Y, info.p.az], [info.p.ax + WHEEL_R, MID_Y, info.p.az]]) {
    tmp.set(pt[0], pt[1], pt[2]); body.localToWorld(tmp); lo = Math.min(lo, tmp.x); hi = Math.max(hi, tmp.x);
  }
  // The view moves rigidly with the axle. Only the offset from the axle is smoothed.
  const axleX = cadWorld(drive.position.x, 0, 0).x, off = (lo + hi) / 2 - axleX;
  camOff = camOff == null ? off : camOff + (off - camOff) * Math.min(1, dt * 3);
  camX = axleX + camOff;
  const mmPerPx = placeOrtho(camX, rects);
  const shift = camX - controls.target.x;
  controls.target.x += shift; views.iso.cam.position.x += shift;
  if (!userOrbit) scriptedCamera(state.t, tl.xray);
  else controls.update();
  const H = canvas.clientHeight;
  for (const [k, v] of Object.entries(views)) {
    const r = rects[k]; if (r.w < 2 || r.h < 2) continue;
    if (k === 'iso') { v.cam.aspect = r.w / r.h; v.cam.updateProjectionMatrix(); }
    renderer.setViewport(r.x, H - r.y - r.h, r.w, r.h);
    renderer.setScissor(r.x, H - r.y - r.h, r.w, r.h);
    renderer.setClearColor(k === 'iso' ? THEME.paper3d : THEME.paper, 1);
    renderer.clear();
    renderer.render(scene, v.cam);
  }
  drawOverlay(rects, info, mmPerPx);
  readouts(info, now);
  requestAnimationFrame(frame);
}

/* ---------------- Start ---------------- */
function start() {
  if (!MESH) { $('status').textContent = 'The geometry file did not load.'; return; }
  buildFromMesh();
  makeGrids();
  setLayout(LAYOUTS.r04);
  resize();
  $('status').hidden = true;
  stage.classList.add('ready');
  requestAnimationFrame(frame);
}
start();
window.HuxAnatomy = { state, legPose, trimDeg, com, LAYOUTS, timeline };
