/* JD-03 wheel drive mount. Design proposal R02. Geometry only, no measured result. Dimensions in millimetres. */
(function (root) {
  'use strict';
  // Pololu 4752: 37D 30:1 gearmotor with 64 CPR encoder. Source: Pololu 37D dimension diagram (10 January 2020) and the Pololu STEP model 37d-gearmotor-19-30-encoder.step.
  const MOTOR = Object.freeze({
    gearboxDiameter: 36.8, gearboxLength: 21.5, motorDiameter: 34.8, motorLength: 30.7, encoderDiameter: 34.0, encoderLength: 15.4, leadReach: 10,
    bossDiameter: 12.0, bossLength: 6.0, shaftDiameter: 6.0, shaftLength: 16.0, flatAcross: 5.4, flatLength: 12.0, shaftOffset: 7.0,
    boltCircle: 31.0, holeAnglesFromOffset: [30, 90, 150, 210, 270, 330], threadDepth: 3.0, leadExitFromOffsetDeg: 35, massG: [190, 210],
  });
  // Pololu 2674 scooter wheel adapter for a 6 mm shaft. Source: Pololu drawing dwa01a/dwa01b (1 July 2014).
  const ADAPTER = Object.freeze({ length: 12, seatDiameter: 22.0, seatLength: 5.5, throughDiameter: 18, plateDiameter: 21.9, plateThickness: 3, setScrewsFromInnerEnd: [3.25, 8.75], bore: 6.0 });
  // Pololu 3278 scooter wheel, 100 x 24 mm, 608 bearing seats. The seat depth is not published.
  const WHEEL = Object.freeze({ diameter: 100, width: 24, seatDepthAssumed: 7.0 });
  // R01 leg geometry and lateral stack. Source: cad/prints/v1-proof-r01/README.md.
  const LEG = Object.freeze({ linkMm: 110, pivotMm: 40, linkEndRadius: 8, hardwareRadius: 4.5, plateMm: 6, linkThicknessMm: 5, lowerSpacerMm: 2, upperSpacerMm: 12, minDeg: 15, maxDeg: 45, neutralDeg: 30 });
  const DEFAULTS = Object.freeze({ angleDeg: 30, axleOffsetMm: 25, offsetMode: 'rearward', spacerRingMm: 3, carrierMm: 6, minClearanceMm: 3, trackMm: 230, plateCoverMm: 23 });
  const MODES = Object.freeze({ rearward: 'Axle rearward of the lower pivot', down: 'Axle below the lower pivot', forward: 'Axle forward of the lower pivot (rejected)' });
  const f = (n) => Number(n.toFixed(2));
  const rad = (deg) => deg * Math.PI / 180;
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function settings(input = {}) {
    const p = { ...DEFAULTS, ...input };
    for (const key of ['angleDeg', 'axleOffsetMm', 'spacerRingMm', 'carrierMm', 'minClearanceMm', 'trackMm']) {
      p[key] = Number(p[key]);
      if (!Number.isFinite(p[key])) throw new Error(`${key} must be a number.`);
    }
    if (p.angleDeg < LEG.minDeg || p.angleDeg > LEG.maxDeg) throw new Error('Angle is outside the 15–45° design range.');
    if (p.axleOffsetMm < 0 || p.axleOffsetMm > 60) throw new Error('Axle offset is outside 0–60 mm.');
    if (!Object.hasOwn(MODES, p.offsetMode)) throw new Error('Unknown offset mode.');
    return p;
  }

  // Side view. x rearward, y up, origin at the lower carrier pivot. The links go forward and up from the carrier.
  function sideGeometry(input) {
    const p = settings(input);
    const e = p.axleOffsetMm, off = MOTOR.shaftOffset;
    const axle = p.offsetMode === 'rearward' ? { x: e, y: 0 } : p.offsetMode === 'down' ? { x: 0, y: -e } : { x: -e, y: 0 };
    const away = p.offsetMode === 'rearward' ? { x: 1, y: 0 } : p.offsetMode === 'down' ? { x: 0, y: -1 } : { x: -1, y: 0 };
    const center = { x: axle.x + off * away.x, y: axle.y + off * away.y };
    const offsetDeg = Math.atan2(-away.y, -away.x) * 180 / Math.PI; // direction from the gearbox axis to the shaft
    const holes = MOTOR.holeAnglesFromOffset.map((k) => ({ angle: f(offsetDeg + k), x: f(center.x + MOTOR.boltCircle / 2 * Math.cos(rad(offsetDeg + k))), y: f(center.y + MOTOR.boltCircle / 2 * Math.sin(rad(offsetDeg + k))) }));
    const R = MOTOR.gearboxDiameter / 2;
    const lower = { x: 0, y: 0 }, upper = { x: 0, y: LEG.pivotMm };
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const linkClearance = (deg, pivot) => {
      const u = { x: -Math.sin(rad(deg)), y: Math.cos(rad(deg)) };
      const t = Math.max(0, Math.min(LEG.linkMm, (center.x - pivot.x) * u.x + (center.y - pivot.y) * u.y));
      return dist(center, { x: pivot.x + t * u.x, y: pivot.y + t * u.y }) - R - LEG.linkEndRadius;
    };
    let worstLink = Infinity, worstAngle = p.angleDeg;
    for (let deg = LEG.minDeg; deg <= LEG.maxDeg; deg += 1) {
      const c = Math.min(linkClearance(deg, lower), linkClearance(deg, upper));
      if (c < worstLink) { worstLink = c; worstAngle = deg; }
    }
    const clearances = {
      lowerLinkEnd: f(dist(center, lower) - R - LEG.linkEndRadius),
      lowerHardware: f(dist(center, lower) - R - LEG.hardwareRadius),
      upperLinkEnd: f(dist(center, upper) - R - LEG.linkEndRadius),
      linkAtAngle: f(Math.min(linkClearance(p.angleDeg, lower), linkClearance(p.angleDeg, upper))),
      linkWorst: f(worstLink), linkWorstAngle: worstAngle,
      groundUnderMotor: f(WHEEL.diameter / 2 - (axle.y - center.y + R)),
      pilotToPivot: f(dist(axle, lower) - MOTOR.bossDiameter / 2 - 0.2 - LEG.hardwareRadius),
    };
    const pose = { x: f(LEG.linkMm * Math.sin(rad(p.angleDeg))), y: f(LEG.linkMm * Math.cos(rad(p.angleDeg))) };
    const pass = ['lowerLinkEnd', 'lowerHardware', 'upperLinkEnd', 'linkWorst'].every((key) => clearances[key] >= p.minClearanceMm) && clearances.groundUnderMotor >= 20;
    return { params: p, axle, center, holes, lower, upper, pose, clearances, pass,
      axleRearwardOfBodyPivot: f(pose.x + axle.x), axleBelowBodyPivot: f(pose.y - axle.y), bodyRise: f(-axle.y),
      wheelTopToBodyPivotAtLow: f(WHEEL.diameter / 2 + LEG.linkMm * Math.cos(rad(LEG.maxDeg)) - axle.y - WHEEL.diameter) };
  }

  // Lateral stack. Depth y outward from the inboard face of the body plate, in the R01 convention.
  function stack(input) {
    const p = settings(input);
    const plate = [0, LEG.plateMm];
    const lowerLink = [plate[1] + LEG.lowerSpacerMm, plate[1] + LEG.lowerSpacerMm + LEG.linkThicknessMm];
    const upperLink = [plate[1] + LEG.upperSpacerMm, plate[1] + LEG.upperSpacerMm + LEG.linkThicknessMm];
    const carrierIn = upperLink[1] + LEG.lowerSpacerMm, carrierOut = carrierIn + p.carrierMm;
    const gearboxFace = carrierIn;
    const shaftRoot = gearboxFace + MOTOR.bossLength, shaftTip = gearboxFace + MOTOR.bossLength + MOTOR.shaftLength;
    const flatStart = shaftTip - MOTOR.flatLength;
    const ringStart = Math.max(shaftRoot, carrierOut), ringEnd = ringStart + p.spacerRingMm;
    const adapterIn = ringEnd, adapterOut = adapterIn + ADAPTER.length;
    const setScrews = ADAPTER.setScrewsFromInnerEnd.map((s) => f(adapterIn + s));
    const wheelIn = adapterIn + (WHEEL.seatDepthAssumed - ADAPTER.seatLength), wheelMid = wheelIn + WHEEL.width / 2, wheelOut = wheelIn + WHEEL.width;
    const gearboxBack = gearboxFace - MOTOR.gearboxLength, motorBack = gearboxBack - MOTOR.motorLength, encoderBack = motorBack - MOTOR.encoderLength, leadEnd = encoderBack - MOTOR.leadReach;
    const oppositePlate = p.trackMm - 2 * wheelMid; // inboard face of the other body plate, in this frame
    const checks = {
      setScrewsOnFlat: setScrews.every((s) => s >= flatStart && s <= shaftTip),
      adapterOnShaft: adapterOut <= shaftTip + 0.001 && adapterIn >= shaftRoot - 0.001,
      wheelClearsCarrier: wheelIn - carrierOut,
      encoderGap: f(oppositePlate + 2 * encoderBack),
      leadGap: f(oppositePlate + 2 * leadEnd),
    };
    return { params: p, plate, lowerLink, upperLink, carrier: [carrierIn, carrierOut], gearboxFace, boss: [gearboxFace, shaftRoot], shaft: [shaftRoot, shaftTip], flat: [flatStart, shaftTip],
      ring: [ringStart, ringEnd], adapter: [adapterIn, adapterOut], setScrews, wheel: [f(wheelIn), f(wheelOut)], wheelMid: f(wheelMid),
      gearbox: [gearboxBack, gearboxFace], motor: [motorBack, gearboxBack], encoder: [encoderBack, motorBack], leadEnd: f(leadEnd),
      cantilever: f(wheelMid - gearboxFace), cantileverRange: [f(wheelMid - gearboxFace), f(wheelMid - gearboxFace + 1.75)],
      oppositePlate: f(oppositePlate), innerBodyWidth: f(oppositePlate), outsideWidth: f(p.trackMm + WHEEL.width), checks };
  }

  function loads(massKg = 3.0, split = 0.6, input) {
    const s = stack(input), F = massKg * 9.81 * split, M = F * s.cantilever / 1000;
    const Z = Math.PI * Math.pow(MOTOR.shaftDiameter / 1000, 3) / 32;
    return { radialN: f(F), momentNm: f(M), stressMPa: f(M / Z / 1e6), stressWithShockMPa: f(3 * M / Z / 1e6), continuousDemandKgMm: f(0.15 / 9.81 * 1000), peakDemandKgMm: f(0.50 / 9.81 * 1000), gearboxContinuousKgMm: 100, gearboxInstantKgMm: 250 };
  }

  // Convex hull of three circles: the two pivot ends and the motor pad. This is the R02 carrier outline.
  function carrierOutline(side) {
    const pts = [];
    const circles = [[side.lower, LEG.linkEndRadius], [side.upper, LEG.linkEndRadius], [side.center, side.params.plateCoverMm]];
    for (const [c, r] of circles) for (let i = 0; i < 72; i++) pts.push({ x: c.x + r * Math.cos(rad(i * 5)), y: c.y + r * Math.sin(rad(i * 5)) });
    pts.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [], upper = [];
    for (const q of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (const q of pts.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    return lower.slice(0, -1).concat(upper.slice(0, -1)).map((q) => ({ x: f(q.x), y: f(q.y) }));
  }

  const STYLE = `<style>.jd text{font-family:system-ui,-apple-system,sans-serif;fill:#203830;font-size:13px}.jd .kicker{font:10px ui-monospace,monospace;letter-spacing:1.4px;fill:#5c6c63}.jd .label{font-size:13px;font-weight:650}.jd .small{font-size:11px;fill:#5c6c63}.jd .plate{fill:#e4e9e0;stroke:#819486;stroke-width:1.2}.jd .carrier{fill:#dfe8dc;stroke:#365b48;stroke-width:1.4}.jd .motor{fill:#d9dfe6;stroke:#4a5c6a;stroke-width:1.3}.jd .wheel{fill:#e5ece0;fill-opacity:.35;stroke:#9aac9a;stroke-width:1.4;stroke-dasharray:6 5}.jd .lower-fill{fill:#357457}.jd .upper-fill{fill:#b57a41}.jd .spacer{fill:#d4dcca;stroke:#819486;stroke-width:1}.jd .axis{stroke:#819486;stroke-width:1;stroke-dasharray:4 5;fill:none}.jd .ghost{stroke:#b3c0b2;stroke-width:1.5;stroke-dasharray:4 5;fill:none}.jd .dim{stroke:#5c6c63;stroke-width:1;fill:none}.jd .leader{stroke:#819486;stroke-width:1;fill:none}.jd .hole{fill:#fffefa;stroke:#203830;stroke-width:1}.jd .fail{fill:#a65431}.jd .ok{fill:#265f4d}.jd .ground{stroke:#5c6c63;stroke-width:1.5}.jd .shaft{fill:#b8bec4;stroke:#4a5c6a;stroke-width:1}.jd .adapter{fill:#c9d0d6;stroke:#4a5c6a;stroke-width:1}.jd .tire{fill:#cfd6cc;stroke:#5c6c63;stroke-width:1.2}</style>`;

  function sideSVG(input) {
    const g = sideGeometry(input), s = 1.9, ox = 340, oy = 336;
    const X = (x) => f(ox + x * s), Y = (y) => f(oy - y * s);
    const q = g.params.angleDeg, u = { x: -Math.sin(rad(q)), y: Math.cos(rad(q)) };
    const body0 = { x: LEG.linkMm * u.x, y: LEG.linkMm * u.y }, body1 = { x: body0.x, y: body0.y + LEG.pivotMm };
    const R = MOTOR.gearboxDiameter / 2, W = WHEEL.diameter / 2;
    const outline = carrierOutline(g).map((p, i) => `${i ? 'L' : 'M'}${X(p.x)} ${Y(p.y)}`).join('') + 'Z';
    const ghosts = [LEG.minDeg, LEG.maxDeg].filter((d) => d !== q).map((d) => {
      const v = { x: -Math.sin(rad(d)), y: Math.cos(rad(d)) };
      return `<path d="M${X(0)} ${Y(0)}L${X(LEG.linkMm * v.x)} ${Y(LEG.linkMm * v.y)}M${X(0)} ${Y(LEG.pivotMm)}L${X(LEG.linkMm * v.x)} ${Y(LEG.linkMm * v.y + LEG.pivotMm)}" class="ghost"/>`;
    }).join('');
    const holes = g.holes.map((h) => `<circle cx="${X(h.x)}" cy="${Y(h.y)}" r="${f(1.7 * s)}" class="hole"/><circle cx="${X(h.x)}" cy="${Y(h.y)}" r="${f(3.25 * s)}" fill="none" stroke="#819486" stroke-width=".8" stroke-dasharray="2 2"/>`).join('');
    const groundY = Y(g.axle.y - W);
    const c = g.clearances, pass = g.pass, ok = c.lowerLinkEnd >= g.params.minClearanceMm;
    const len = Math.hypot(g.center.x, g.center.y) || 1, d = { x: g.center.x / len, y: g.center.y / len };
    const near = { x: g.center.x - R * d.x, y: g.center.y - R * d.y }, nearLink = { x: LEG.linkEndRadius * d.x, y: LEG.linkEndRadius * d.y };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 560" role="img" aria-labelledby="jd3-side-title jd3-side-desc" class="jd side-sheet">
      <title id="jd3-side-title">JD-03 side view at ${q} degrees, ${MODES[g.params.offsetMode].toLowerCase()} by ${g.params.axleOffsetMm} millimetres</title>
      <desc id="jd3-side-desc">The carrier plate carries the two link pivots ${LEG.pivotMm} millimetres apart and the Pololu 4752 gearmotor. The axle is ${g.params.axleOffsetMm} millimetres from the lower pivot. The gearbox axis is ${MOTOR.shaftOffset} millimetres further from the pivots. The nearest clearance between the gearbox and a link end is ${c.linkWorst} millimetres at ${c.linkWorstAngle} degrees. Ground clearance under the motor is ${c.groundUnderMotor} millimetres.</desc>
      <defs>${STYLE}<pattern id="jd3-grid" width="${f(10 * s)}" height="${f(10 * s)}" patternUnits="userSpaceOnUse"><path d="M${f(10 * s)} 0H0V${f(10 * s)}" fill="none" stroke="#d5ddd3" stroke-width=".6"/></pattern></defs>
      <rect width="760" height="560" fill="#fffefa"/><rect x="20" y="40" width="720" height="400" fill="url(#jd3-grid)" opacity=".5"/>
      <text x="30" y="28" class="kicker">JD-03 / SIDE VIEW FROM THE RIGHT / CARRIER R02 WITH MOTOR AND WHEEL</text>
      <text x="640" y="28" class="small">Rearward →</text><path d="M712 24H736" stroke="#5c6c63" stroke-width="1.2"/>
      <line x1="40" y1="${groundY}" x2="720" y2="${groundY}" class="ground"/><text x="44" y="${f(groundY + 15)}" class="small">Floor</text>
      <circle cx="${X(g.axle.x)}" cy="${Y(g.axle.y)}" r="${f(W * s)}" class="wheel"/>
      ${ghosts}
      <rect x="${X(body0.x - 35)}" y="${Y(body0.y + 55)}" width="${f(70 * s)}" height="${f(70 * s)}" rx="8" class="plate" opacity=".6"/><text x="${X(body0.x - 33)}" y="${Y(body0.y + 47)}" class="small">Body plate (R01)</text>
      <path d="${outline}" class="carrier"/>
      <circle cx="${X(g.center.x)}" cy="${Y(g.center.y)}" r="${f(R * s)}" class="motor"/>
      <circle cx="${X(g.center.x)}" cy="${Y(g.center.y)}" r="${f(MOTOR.boltCircle / 2 * s)}" fill="none" stroke="#4a5c6a" stroke-width=".8" stroke-dasharray="3 3"/>
      ${holes}
      <circle cx="${X(g.axle.x)}" cy="${Y(g.axle.y)}" r="${f(MOTOR.bossDiameter / 2 * s)}" class="hole"/><circle cx="${X(g.axle.x)}" cy="${Y(g.axle.y)}" r="${f(MOTOR.shaftDiameter / 2 * s)}" fill="#b8bec4" stroke="#203830" stroke-width="1"/>
      <circle cx="${X(g.center.x)}" cy="${Y(g.center.y)}" r="2.5" fill="#4a5c6a"/>
      <path d="M${X(0)} ${Y(LEG.pivotMm)}L${X(body1.x)} ${Y(body1.y)}" stroke="#b57a41" stroke-width="${f(16 * s)}" stroke-linecap="round" opacity=".9"/>
      <path d="M${X(0)} ${Y(0)}L${X(body0.x)} ${Y(body0.y)}" stroke="#357457" stroke-width="${f(16 * s)}" stroke-linecap="round" opacity=".9"/>
      ${[[0, 0], [0, LEG.pivotMm], [body0.x, body0.y], [body1.x, body1.y]].map(([x, y], i) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${f(LEG.hardwareRadius * s)}" fill="${i % 2 ? '#b57a41' : '#357457'}" stroke="#fffefa" stroke-width="1"/><circle cx="${X(x)}" cy="${Y(y)}" r="${f(2.25 * s)}" class="hole"/>`).join('')}
      <path d="M${X(near.x)} ${Y(near.y)}L${X(nearLink.x)} ${Y(nearLink.y)}" stroke="${ok ? '#265f4d' : '#a65431'}" stroke-width="3" stroke-linecap="round"/>
      <text x="${X((near.x + nearLink.x) / 2)}" y="${Y((near.y + nearLink.y) / 2) - 8}" text-anchor="middle" class="label" fill="${ok ? '#265f4d' : '#a65431'}">${c.lowerLinkEnd} mm</text>
      <text x="${X(g.axle.x + W + 4)}" y="${Y(g.axle.y - 4)}" class="small">Ø${WHEEL.diameter} wheel</text><text x="${X(g.axle.x + W + 4)}" y="${Y(g.axle.y - 11)}" class="small">outboard of the carrier</text>
      <text x="${X(g.center.x)}" y="${Y(g.center.y - R - 10)}" text-anchor="middle" class="label">Pololu 4752 · Ø${MOTOR.gearboxDiameter} gearbox</text>
      <text x="${X(g.center.x)}" y="${Y(g.center.y - R - 18)}" text-anchor="middle" class="small">6 × M3 on Ø${MOTOR.boltCircle} · shaft ${MOTOR.shaftOffset} mm off the axis</text>
      <text x="${X(-12)}" y="${Y(-9)}" text-anchor="end" class="small">Lower pivot</text><text x="${X(10)}" y="${Y(LEG.pivotMm + 12)}" class="small">Upper pivot</text>
      <text x="${X(-12)}" y="${Y(-20)}" text-anchor="end" class="label">Carrier R02</text>
      <g font-size="12">
      <text x="30" y="478" class="label">Axle ${g.params.axleOffsetMm} mm ${g.params.offsetMode} of the lower pivot · gearbox axis ${MOTOR.shaftOffset} mm further</text>
      <text x="30" y="498" class="small">Gearbox to the lower link end ${c.lowerLinkEnd} mm · to the pivot hardware ${c.lowerHardware} mm · to the upper link end ${c.upperLinkEnd} mm</text>
      <text x="30" y="516" class="small">Nearest link clearance in 15–45°: ${c.linkWorst} mm at ${c.linkWorstAngle}° · floor to the motor body ${c.groundUnderMotor} mm · axle ${g.axleRearwardOfBodyPivot} mm behind the body pivot</text>
      <text x="30" y="540" class="${pass ? 'ok' : 'fail'}" font-weight="650">${pass ? 'All clearances pass the ' + g.params.minClearanceMm + ' mm minimum. This is geometry, not a measured fit.' : 'A clearance is below the ' + g.params.minClearanceMm + ' mm minimum. Do not build this arrangement.'}</text>
      </g>
      <text x="560" y="540" class="kicker">DIMENSIONS IN MILLIMETRES</text>
    </svg>`;
  }

  function stackSVG(input) {
    const st = stack(input), s = 2.6, ox = 120, oy = 272, mid = st.wheelMid, T = st.params.trackMm;
    const Z = (y) => mid - y, Zr = (y) => T - mid + y; // robot lateral position of a left-side depth y, and of a right-side depth y
    const X = (z) => f(ox + (z + 13) * s), H = (d) => f(d * s);
    const box = (z0, z1, top, height, cls, extra = '') => `<rect x="${X(Math.min(z0, z1))}" y="${f(oy - top * s)}" width="${H(Math.abs(z1 - z0))}" height="${H(height)}" class="${cls}"${extra}/>`;
    const dia = (z0, z1, d, cls, extra = '') => box(z0, z1, d / 2, d, cls, extra);
    const side = (D, cls = '', mirror = false) => {
      const P = mirror ? Zr : Z, o = mirror ? ' opacity=".5"' : '';
      return `${dia(P(st.encoder[0]), P(st.encoder[1]), MOTOR.encoderDiameter, 'motor', o)}${dia(P(st.motor[0]), P(st.motor[1]), MOTOR.motorDiameter, 'motor', o)}${dia(P(st.gearbox[0]), P(st.gearbox[1]), MOTOR.gearboxDiameter, 'motor', o)}
      <path d="M${X(P(st.leadEnd))} ${f(oy + 12 * s)}H${X(P(st.encoder[0]))}" stroke="#a65431" stroke-width="2"${o}/>
      ${box(P(st.plate[0]), P(st.plate[1]), 62, 36, 'plate', o)}${box(P(st.lowerLink[0]), P(st.lowerLink[1]), 62, 24, 'lower-fill', o)}${box(P(st.upperLink[0]), P(st.upperLink[1]), 62, 24, 'upper-fill', o)}
      ${box(P(st.carrier[0]), P(st.carrier[1]), 48, 71, 'carrier', o)}
      ${dia(P(st.boss[0]), P(st.boss[1]), MOTOR.bossDiameter, 'shaft', o)}${dia(P(st.shaft[0]), P(st.shaft[1]), MOTOR.shaftDiameter, 'shaft', o)}
      ${dia(P(st.ring[0]), P(st.ring[1]), MOTOR.bossDiameter, 'spacer', o)}${dia(P(st.adapter[0]), P(st.adapter[0] + ADAPTER.seatLength), ADAPTER.seatDiameter, 'adapter', o)}${dia(P(st.adapter[0] + ADAPTER.seatLength), P(st.adapter[1]), ADAPTER.throughDiameter, 'adapter', o)}
      ${dia(P(st.wheel[0]), P(st.wheel[1]), WHEEL.diameter, 'tire', o)}${dia(P(st.wheel[0]), P(st.wheel[1]), 30, 'plate', o)}
      ${dia(P(st.wheel[1] - ADAPTER.plateThickness - 1.5), P(st.wheel[1] - 1.5), ADAPTER.plateDiameter, 'adapter', o)}
      ${st.setScrews.map((y) => `<path d="M${X(P(y))} ${f(oy - 11 * s)}V${f(oy - 3 * s)}" stroke="#203830" stroke-width="2.2"${o}/>`).join('')}
      <path d="M${X(P(st.flat[0]))} ${f(oy - MOTOR.shaftDiameter / 2 * s)}H${X(P(st.flat[1]))}" stroke="#203830" stroke-width="2"${o}/>
      <path d="M${X(P(mid))} ${f(oy - 56 * s)}V${f(oy + 56 * s)}" class="axis"${o}/>`;
    };
    const dim = (z0, z1, y, label, cls = 'small', anchor = 'middle') => `<path d="M${X(z0)} ${y}H${X(z1)}" class="dim"/><path d="M${X(z0)} ${y - 4}V${y + 4}M${X(z1)} ${y - 4}V${y + 4}" class="dim"/><text x="${anchor === 'middle' ? f((X(z0) + X(z1)) / 2) : X(Math.max(z0, z1)) + 6}" y="${y - 5}" text-anchor="${anchor}" class="${cls}">${label}</text>`;
    const top = f(oy - 66 * s);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" role="img" aria-labelledby="jd3-stack-title jd3-stack-desc" class="jd stack-sheet">
      <title id="jd3-stack-title">JD-03 section through both axles, seen from the rear</title>
      <desc id="jd3-stack-desc">Outward from the inboard face of the body plate: plate 0 to ${LEG.plateMm}, lower link ${st.lowerLink.join(' to ')}, upper link ${st.upperLink.join(' to ')}, carrier ${st.carrier.join(' to ')}, boss, ${st.params.spacerRingMm} millimetre ring, adapter ${st.adapter.join(' to ')}, wheel ${st.wheel.join(' to ')}. The motor body reaches inboard to ${st.encoder[0]}. The two lead ends are ${st.checks.leadGap} millimetres apart at a ${T} millimetre track.</desc>
      <defs>${STYLE}</defs><rect width="1000" height="500" fill="#fffefa"/>
      <text x="30" y="28" class="kicker">JD-03 / SECTION THROUGH THE AXLES / FROM THE REAR / LEFT WHEEL AT LEFT</text>
      <line x1="${X(-13)}" y1="${oy}" x2="${X(T + 13)}" y2="${oy}" class="axis"/>
      ${side(st, '', true)}${side(st)}
      ${dim(Z(st.plate[0]), Z(mid), top - 44, `Body plate to the wheel midplane ${mid} mm`, 'label')}
      ${dim(Z(st.plate[0]), Zr(st.plate[0]), top - 44, `Between the body plates ${st.innerBodyWidth} mm`)}
      ${dim(Z(st.gearboxFace), Z(mid), top - 22, `Cantilever ${st.cantilever} mm`)}
      ${dim(Z(st.gearboxFace), Z(st.encoder[0]), top - 22, `Motor ${f(st.gearboxFace - st.encoder[0])} mm inboard of the gearbox face`, 'small', 'start')}
      ${dim(Z(st.carrier[1]), Z(st.wheel[0]), top, `${f(st.checks.wheelClearsCarrier)} mm carrier to wheel`, 'small', 'start')}
      ${dim(Z(st.leadEnd), Zr(st.leadEnd), top, `Between the lead ends ${st.checks.leadGap} mm`)}
      ${dim(Z(mid), Zr(mid), f(oy + 58 * s), `Track ${T} mm · ${st.outsideWidth} mm across the tires`, 'label')}
      <text x="${X(Z(st.plate[1])) + 4}" y="${f(oy - 30 * s)}" class="small">Body plate · links</text>
      <text x="${X(Z(st.carrier[1])) - 4}" y="${f(oy - 50 * s)}" text-anchor="end" class="small">Carrier R02</text>
      <text x="${X(Z(st.wheel[1]))}" y="${f(oy + 54 * s)}" class="small">Wheel 3278</text>
      <text x="${X(Z(st.adapter[1])) - 4}" y="${f(oy + 20 * s)}" text-anchor="end" class="small">Adapter 2674 · ring ${st.params.spacerRingMm}</text>
      <text x="${X(Z(st.motor[1]))}" y="${f(oy + 24 * s)}" class="small">Pololu 4752 · leads exit at the encoder end</text>
      <text x="30" y="462" class="small">Set screws at ${st.setScrews.join(' and ')} mm sit on the ${MOTOR.flatLength} mm flat (${st.flat.join('–')} mm): ${st.checks.setScrewsOnFlat ? 'yes' : 'NO'} · adapter inside the shaft length: ${st.checks.adapterOnShaft ? 'yes' : 'NO'}</text>
      <text x="30" y="482" class="small">The wheel seat depth is an assumption of ${WHEEL.seatDepthAssumed} mm. Measure it. The cantilever is then ${st.cantileverRange[0]}–${st.cantileverRange[1]} mm.</text>
      <text x="800" y="482" class="kicker">DIMENSIONS IN MILLIMETRES</text>
    </svg>`;
  }

  // 1:1 paper template of the carrier plate. 1 user unit = 1 mm.
  function sheetSVG(input) {
    const g = sideGeometry(input), W = 210, Hh = 160, ox = 60, oy = 95;
    const X = (x) => f(ox + x), Y = (y) => f(oy - y);
    const outline = carrierOutline(g).map((p, i) => `${i ? 'L' : 'M'}${X(p.x)} ${Y(p.y)}`).join('') + 'Z';
    const cross = (x, y, r) => `<path d="M${X(x) - r} ${Y(y)}H${X(x) + r}M${X(x)} ${Y(y) - r}V${Y(y) + r}" stroke="#203830" stroke-width=".25"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${Hh}mm" viewBox="0 0 ${W} ${Hh}" role="img" aria-labelledby="jd3-sheet-title">
      <title id="jd3-sheet-title">Carrier R02 at 1:1 scale, JD-03, design proposal</title>
      <rect width="${W}" height="${Hh}" fill="#fff"/>
      <text x="8" y="10" font-family="system-ui,sans-serif" font-size="4.2" font-weight="700" fill="#203830">HUX V1-PROOF · JD-03 · Carrier R02 · 1:1 · print at 100 %</text>
      <text x="8" y="16" font-family="system-ui,sans-serif" font-size="3" fill="#5c6c63">Design proposal. Pivots ${LEG.pivotMm} mm apart. Axle ${g.params.axleOffsetMm} mm ${g.params.offsetMode} of the lower pivot. Gearbox axis ${MOTOR.shaftOffset} mm further from the pivots.</text>
      <text x="8" y="21" font-family="system-ui,sans-serif" font-size="3" fill="#5c6c63">Holes: 2 × Ø4.5 pivots, Ø12.4 pilot, 6 × Ø3.4 on Ø${MOTOR.boltCircle} with Ø6.5 × 4.0 counterbores on the wheel side.</text>
      <text x="8" y="26" font-family="system-ui,sans-serif" font-size="3" fill="#5c6c63">Right carrier, wheel side toward you. Mirror it for the left leg.</text>
      <path d="M8 33H108" stroke="#203830" stroke-width=".4"/><path d="M8 31V35M58 31V35M108 31V35" stroke="#203830" stroke-width=".4"/><text x="8" y="39" font-family="system-ui,sans-serif" font-size="3" fill="#5c6c63">Scale check: 0 – 50 – 100 mm</text>
      <path d="${outline}" fill="none" stroke="#203830" stroke-width=".4"/>
      <circle cx="${X(0)}" cy="${Y(0)}" r="2.25" fill="none" stroke="#203830" stroke-width=".3"/><circle cx="${X(0)}" cy="${Y(LEG.pivotMm)}" r="2.25" fill="none" stroke="#203830" stroke-width=".3"/>
      <circle cx="${X(g.axle.x)}" cy="${Y(g.axle.y)}" r="6.2" fill="none" stroke="#203830" stroke-width=".3"/>
      <circle cx="${X(g.center.x)}" cy="${Y(g.center.y)}" r="${MOTOR.boltCircle / 2}" fill="none" stroke="#819486" stroke-width=".2" stroke-dasharray="1 1"/>
      <circle cx="${X(g.center.x)}" cy="${Y(g.center.y)}" r="${MOTOR.gearboxDiameter / 2}" fill="none" stroke="#819486" stroke-width=".2" stroke-dasharray="2 1"/>
      ${g.holes.map((h) => `<circle cx="${X(h.x)}" cy="${Y(h.y)}" r="1.7" fill="none" stroke="#203830" stroke-width=".3"/><circle cx="${X(h.x)}" cy="${Y(h.y)}" r="3.25" fill="none" stroke="#819486" stroke-width=".2"/>${cross(h.x, h.y, 2.5)}`).join('')}
      ${cross(0, 0, 4)}${cross(0, LEG.pivotMm, 4)}${cross(g.axle.x, g.axle.y, 8)}${cross(g.center.x, g.center.y, 3)}
      <text x="${X(0) - 12}" y="${Y(LEG.pivotMm) + 1}" font-family="system-ui,sans-serif" font-size="3" fill="#203830" text-anchor="end">Upper pivot</text>
      <text x="${X(0) - 12}" y="${Y(0) + 1}" font-family="system-ui,sans-serif" font-size="3" fill="#203830" text-anchor="end">Lower pivot</text>
      <text x="${X(g.axle.x)}" y="${Y(g.axle.y) + 28}" font-family="system-ui,sans-serif" font-size="3" fill="#203830" text-anchor="middle">Axle · Ø12.4 boss pilot</text>
      <text x="${X(g.center.x)}" y="${Y(g.center.y) - 22}" font-family="system-ui,sans-serif" font-size="3" fill="#203830" text-anchor="middle">Gearbox axis</text>
      <text x="8" y="${Hh - 6}" font-family="system-ui,sans-serif" font-size="3" fill="#5c6c63">x rearward, y up. Generated by tools/living-drawings/wheel-mount.js. Not a measured drawing.</text>
    </svg>`;
  }

  const api = { MOTOR, ADAPTER, WHEEL, LEG, DEFAULTS, MODES, settings, sideGeometry, stack, loads, carrierOutline, sideSVG, stackSVG, sheetSVG, escape };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (typeof require !== 'undefined' && require.main === module) {
      const args = process.argv.slice(2), at = args.indexOf('--sheet');
      if (at >= 0 && args[at + 1]) { require('node:fs').writeFileSync(args[at + 1], sheetSVG() + '\n'); console.log(`Wrote ${args[at + 1]}`); }
      else console.log(JSON.stringify({ side: sideGeometry(), stack: stack(), loads: loads() }, null, 2));
    }
  }
  if (typeof document === 'undefined') return;
  const byId = (id) => document.getElementById(id);
  function current() {
    return { angleDeg: byId('jd3-angle').value, axleOffsetMm: byId('jd3-offset').value, offsetMode: document.querySelector('input[name="jd3-mode"]:checked')?.value || 'rearward', spacerRingMm: byId('jd3-ring').value };
  }
  function draw() {
    let p;
    try { p = settings(current()); } catch (error) { byId('jd3-message').textContent = error.message; return; }
    const g = sideGeometry(p), st = stack(p), l = loads(3.0, 0.6, p), c = g.clearances;
    byId('jd3-side').innerHTML = sideSVG(p); byId('jd3-stack').innerHTML = stackSVG(p);
    byId('jd3-angle-value').textContent = `${p.angleDeg}°`; byId('jd3-offset-value').textContent = `${p.axleOffsetMm} mm`; byId('jd3-ring-value').textContent = `${p.spacerRingMm} mm`;
    const row = (label, value, ok) => `<div class="${ok === undefined ? '' : ok ? 'is-ok' : 'is-fail'}"><dt>${label}</dt><dd>${value}</dd></div>`;
    byId('jd3-readings').innerHTML = [
      row('Gearbox to lower link end', `${c.lowerLinkEnd} mm`, c.lowerLinkEnd >= p.minClearanceMm),
      row('Gearbox to pivot hardware', `${c.lowerHardware} mm`, c.lowerHardware >= p.minClearanceMm),
      row(`Nearest link, 15–45° (at ${c.linkWorstAngle}°)`, `${c.linkWorst} mm`, c.linkWorst >= p.minClearanceMm),
      row('Floor to motor body', `${c.groundUnderMotor} mm`, c.groundUnderMotor >= 20),
      row('Axle rearward of the body pivot', `${g.axleRearwardOfBodyPivot} mm`),
      row('Axle below the body pivot', `${g.axleBelowBodyPivot} mm`),
      row('Body plate to wheel midplane', `${st.wheelMid} mm`),
      row('Cantilever from the gearbox face', `${st.cantilever} mm`),
      row('Carrier face to wheel face', `${st.checks.wheelClearsCarrier.toFixed(2)} mm`, st.checks.wheelClearsCarrier >= 3),
      row('Both set screws on the flat', st.checks.setScrewsOnFlat ? 'yes' : 'no', st.checks.setScrewsOnFlat),
      row('Between the two lead ends', `${st.checks.leadGap} mm`, st.checks.leadGap >= 15),
      row('Static shaft moment at 3.0 kg', `${l.momentNm} N·m`),
    ].join('');
    byId('jd3-message').textContent = g.pass && st.checks.setScrewsOnFlat && st.checks.adapterOnShaft ? 'This arrangement passes the geometric checks. It is not a measured fit.' : 'This arrangement fails a geometric check. Keep the baseline values.';
    byId('jd3-message').classList.toggle('is-error', !(g.pass && st.checks.setScrewsOnFlat && st.checks.adapterOnShaft));
    byId('jd3-holes').innerHTML = g.holes.map((h, i) => `<tr><td>H${i + 1}</td><td>${h.x.toFixed(2)}</td><td>${h.y.toFixed(2)}</td><td>${h.angle.toFixed(0)}°</td></tr>`).join('') + `<tr><td>Axle / pilot</td><td>${g.axle.x.toFixed(2)}</td><td>${g.axle.y.toFixed(2)}</td><td>—</td></tr><tr><td>Gearbox axis</td><td>${g.center.x.toFixed(2)}</td><td>${g.center.y.toFixed(2)}</td><td>—</td></tr>`;
    document.querySelectorAll('[data-jd3-angle]').forEach((b) => b.classList.toggle('is-selected', Number(b.dataset.jd3Angle) === p.angleDeg));
  }
  function boot() {
    ['jd3-angle', 'jd3-offset', 'jd3-ring'].forEach((id) => byId(id).addEventListener('input', draw));
    document.querySelectorAll('input[name="jd3-mode"]').forEach((r) => r.addEventListener('change', draw));
    document.querySelectorAll('[data-jd3-angle]').forEach((b) => b.addEventListener('click', () => { byId('jd3-angle').value = b.dataset.jd3Angle; draw(); }));
    byId('jd3-reset').addEventListener('click', () => { byId('jd3-angle').value = DEFAULTS.angleDeg; byId('jd3-offset').value = DEFAULTS.axleOffsetMm; byId('jd3-ring').value = DEFAULTS.spacerRingMm; document.querySelector('input[name="jd3-mode"][value="rearward"]').checked = true; draw(); });
    draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
