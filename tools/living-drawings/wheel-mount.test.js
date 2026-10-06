const test = require('node:test');
const assert = require('node:assert/strict');
const { MOTOR, LEG, DEFAULTS, sideGeometry, stack, loads, carrierOutline, sideSVG, stackSVG, sheetSVG } = require('./wheel-mount.js');

test('the six M3 holes sit on the 31 mm circle around the gearbox axis, 15.5 mm apart, with the shaft 7 mm off that axis', () => {
  const g = sideGeometry();
  assert.equal(g.holes.length, 6);
  for (const h of g.holes) assert.ok(Math.abs(Math.hypot(h.x - g.center.x, h.y - g.center.y) - MOTOR.boltCircle / 2) < 0.01);
  for (let i = 0; i < 6; i++) {
    const a = g.holes[i], b = g.holes[(i + 1) % 6];
    assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 15.5) < 0.01);
  }
  assert.ok(Math.abs(Math.hypot(g.axle.x - g.center.x, g.axle.y - g.center.y) - MOTOR.shaftOffset) < 0.001);
  // No hole lies on the line from the gearbox axis to the shaft (the STEP model shows holes at ±30°, ±90°, ±150° from that line).
  assert.ok(g.holes.every((h) => Math.abs(((h.angle - 180) % 360 + 360) % 360) > 1));
});

test('the baseline keeps every clearance above the minimum through the whole 15–45° sweep', () => {
  const g = sideGeometry();
  assert.equal(g.params.axleOffsetMm, DEFAULTS.axleOffsetMm);
  assert.ok(g.pass);
  assert.ok(g.clearances.lowerLinkEnd >= 5);
  assert.ok(g.clearances.linkWorst >= 5);
  assert.ok(g.clearances.groundUnderMotor >= 30);
  assert.equal(g.bodyRise, 0);
  for (const q of [15, 30, 45]) assert.ok(sideGeometry({ angleDeg: q }).clearances.linkAtAngle >= 5);
  assert.ok(Math.abs(sideGeometry({ angleDeg: 30 }).axleRearwardOfBodyPivot - (55 + DEFAULTS.axleOffsetMm)) < 0.01);
});

test('the check tool rejects the arrangements that collide', () => {
  const forward = sideGeometry({ offsetMode: 'forward' });
  assert.ok(!forward.pass);
  assert.ok(forward.clearances.linkWorst < 0);
  assert.equal(forward.clearances.linkWorstAngle, 45);
  const tight = sideGeometry({ axleOffsetMm: 20 });
  assert.ok(!tight.pass);
  assert.ok(sideGeometry({ offsetMode: 'down' }).pass);
  assert.throws(() => sideGeometry({ angleDeg: 50 }), /outside/);
  assert.throws(() => sideGeometry({ offsetMode: 'sideways' }), /mode/);
});

test('the lateral stack keeps the R01 link planes, puts the wheel next to the carrier and both set screws on the flat', () => {
  const s = stack();
  assert.deepEqual(s.lowerLink, [8, 13]);
  assert.deepEqual(s.upperLink, [18, 23]);
  assert.deepEqual(s.carrier, [25, 31]);
  assert.deepEqual(s.shaft, [31, 47]);
  assert.deepEqual(s.flat, [35, 47]);
  assert.ok(s.checks.setScrewsOnFlat);
  assert.ok(s.checks.adapterOnShaft);
  assert.equal(s.wheelMid, 47.5);
  assert.equal(s.cantilever, 22.5);
  assert.equal(s.innerBodyWidth, 135);
  assert.ok(Math.abs(s.checks.leadGap - 29.8) < 0.01);
  assert.ok(s.checks.wheelClearsCarrier >= 4);
  assert.ok(!stack({ spacerRingMm: 0 }).checks.setScrewsOnFlat);
  assert.ok(!stack({ spacerRingMm: 5 }).checks.adapterOnShaft);
});

test('the static load screen stays far below the shaft and gearbox limits', () => {
  const l = loads();
  assert.ok(Math.abs(l.radialN - 17.66) < 0.01);
  assert.ok(l.momentNm < 0.5);
  assert.ok(l.stressWithShockMPa < 100);
  assert.ok(l.continuousDemandKgMm < l.gearboxContinuousKgMm);
  assert.ok(l.peakDemandKgMm < l.gearboxInstantKgMm);
});

test('the drawings and the 1:1 template render with their titles and the carrier outline encloses every hole', () => {
  const g = sideGeometry();
  const outline = carrierOutline(g);
  assert.ok(outline.length > 20);
  const inside = (p) => {
    let hit = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i], b = outline[j];
      if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
  };
  for (const h of [...g.holes, g.axle, g.lower, g.upper]) assert.ok(inside(h));
  assert.match(sideSVG(), /JD-03 side view at 30 degrees/);
  assert.match(stackSVG(), /section through both axles/);
  assert.match(sheetSVG(), /width="210mm"/);
  assert.match(sheetSVG(), /Carrier R02 at 1:1 scale/);
  assert.equal(LEG.pivotMm, 40);
});
