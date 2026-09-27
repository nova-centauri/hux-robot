/* Sheet 1 — V1 layout. Drawn from kin.js (geometry, poses, torques), actuators.js (the locked
   set's housings and masses) and spec.js (the 2026-09-27 decisions and layout numbers). Nothing
   on this sheet is typed in by hand except the notes; change a number in those files and the
   sheet redraws. Inches; +x forward, +y up, +z to the robot's right. */
(function () {
  "use strict";
  const K = window.HuxKin, M = K.M, SPEC = window.HuxSpec, ACT = window.HuxActuators;
  const IN = 0.0254;
  const D = window.HuxDraw;
  const { el, frame, line, rect, box, tube, circle, joint, cross, text, note, dimH, dimV, ext, centreline, wheelSide, motor, leg, fill, fmt, inch, nm } = D;
  const L = SPEC.layout;
  const ENV = ACT.envIn;

  /* ---------- the poses this sheet is drawn at ---------- */
  const stance = K.planted(M.balanceTheta, M.balancePhi);           /* planted leg, hip over the axle */
  const hip = { x: stance.hip.x, y: stance.hip.y };
  const landX = M.going - 0.75;                                    /* rear of the next slot, 0.75" behind centre */
  const landY = M.rise + M.wheelR;
  const raisedIk = K.ik(landX - hip.x, landY - hip.y);
  const raised = K.atHip(raisedIk.theta, raisedIk.phi, hip);
  const crouch = K.planted(M.deepTheta, M.deepPhi);
  const straight = K.planted(0, 0);
  const shoveIk = K.ik(-7.0, -13.0);                               /* rear leg nearly straight: hip 7" ahead, 13" up */
  const shove = K.atHip(shoveIk.theta, shoveIk.phi, { x: 0, y: 0 });
  const standIk = K.ik(1.0, -9.0);                                 /* front leg standing up on the shelf */
  const stand = K.atHip(standIk.theta, standIk.phi, { x: 0, y: 0 });

  /* how far the raised leg's shin passes over the nosing of the next tread */
  function segDist(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
  }
  const shinClear = segDist({ x: M.going / 2, y: M.rise }, raised.knee, raised.axle);

  /* one-leg holding torques (gravity only, the whole lump picture on one leg) */
  const W = M.exampleMassKg * M.g;
  function hold(theta, phi) { return K.legTorques(theta, phi, { x: 0, y: W }, { x: 0, y: 0 }, 0); }
  const holdStance = hold(M.balanceTheta, M.balancePhi);
  const holdCrouch = hold(M.deepTheta, M.deepPhi);
  const holdStand = hold(standIk.theta, standIk.phi);

  /* lateral stations, inches from the centreline */
  const Z = {
    rollAxis: L.hipRollAxisIn,
    rollIn: L.hipRollAxisIn - ENV.rollD / 2, rollOut: L.hipRollAxisIn + ENV.rollD / 2,
    leg: L.legPlaneIn,
    kneeIn: L.legPlaneIn - ENV.knee.t, kneeOut: L.legPlaneIn,          /* knee RS02 inboard of the leg plane */
    swingIn: L.legPlaneIn, swingOut: L.legPlaneIn + ENV.swing.t,       /* hip swing RS00 outboard of it */
    axle: M.track / 2,
    tireIn: M.track / 2 - M.wheelWidth / 2, tireOut: M.track / 2 + M.wheelWidth / 2,
    hubIn: M.track / 2 - ENV.wheelW / 2, hubOut: M.track / 2 + ENV.wheelW / 2,
    head: M.bodyWidth / 2, env: M.envelopeWidth / 2,
    pack: L.packIn.w / 2
  };
  const ROLL_X = -2.4; /* the roll housing's centre, aft of the swing axis, so it clears the RS00 */
  const hubProud = Math.max(0, Z.hubOut - Z.tireOut);
  const rollProud = Math.max(0, Z.rollOut - Z.head);
  const spacer = Z.axle - Z.leg;

  /* ---------- 1. side elevation ---------- */
  function drawSide() {
    const svg = document.getElementById("s1");
    D.setFS(1);
    const F = frame(svg, -10, 19, -3.2, 26);
    const G = M.going, H = M.rise, R = M.wheelR, slot = M.slotRoom;
    /* stair: lower tread at y=0 from far left to the riser at x = G/2; upper tread at y = H */
    const riserX = G / 2;
    rect(svg, F.X(riserX), F.Y(H), (19 - riserX) * D.S, 1 * D.S, "#e7dcc6", "#c3b49a");
    line(svg, F.X(-10), F.Y(0), F.X(riserX), F.Y(0), "#8d8374", 1.5);
    line(svg, F.X(riserX), F.Y(0), F.X(riserX), F.Y(H - 1), "#8d8374", 1.5);
    rect(svg, F.X(riserX + G), F.Y(2 * H), (19 - riserX - G) * D.S, 1 * D.S, "#e7dcc6", "#c3b49a");
    line(svg, F.X(riserX + G), F.Y(H), F.X(riserX + G), F.Y(2 * H - 1), "#8d8374", 1.5);
    /* slot bands: rubber-to-nosing room each side of a centred tire */
    [[0, 0], [G, H]].forEach(([cx, cy]) => {
      line(svg, F.X(cx - R - slot), F.Y(cy), F.X(cx - R), F.Y(cy), "#c4a15a", 4);
      line(svg, F.X(cx + R), F.Y(cy), F.X(cx + R + slot), F.Y(cy), "#c4a15a", 4);
    });
    /* envelope */
    line(svg, F.X(-9), F.Y(M.envelopeHeight), F.X(9), F.Y(M.envelopeHeight), "#c8bfae", 1, "6 4");
    note(svg, F.X(-8.8), F.Y(M.envelopeHeight) - 4, "24\" envelope (R35)");

    /* body: shell 8" × 6" above the hip, hip band below it, pack 1" forward, CoM */
    const bodyTop = hip.y + M.bodyAboveHip;
    const bandBottom = hip.y - ENV.rollD / 2;
    /* shell: head above the hip axis, hip band around it (the roll housings' height) */
    rect(svg, F.X(hip.x - M.bodyLength / 2), F.Y(bodyTop), M.bodyLength * D.S, (bodyTop - bandBottom) * D.S, "#d5e0ea", "#1f4e79");
    /* pack, in the hip band, centred 1" ahead of the hip axes */
    box(svg, F, hip.x + L.bodyComForwardIn, hip.y, L.packIn.l, L.packIn.h, "#efe2b8", "#8a5a12");
    text(svg, F.X(hip.x + L.bodyComForwardIn + 1.2), F.Y(hip.y + 0.7), "8S pack", "middle", 9.5, "#5c3d0a");
    /* roll RS02 seen from the side: its length along x, its square height, on the roll axis behind the swing axis */
    motor(svg, F, hip.x + ROLL_X, hip.y, ENV.rollL, ENV.rollD, "roll");
    /* raised leg first (behind), then the planted leg */
    leg(svg, F, raised, "#8aa0b5", 7);
    motor(svg, F, raised.knee.x, raised.knee.y, ENV.knee.w, ENV.knee.h);
    wheelSide(svg, F.X(raised.axle.x), F.Y(raised.axle.y), R * D.S);
    box(svg, F, raised.axle.x, raised.axle.y, ENV.wheelD, ENV.wheelD, "#3e4c44", "#1b2430");
    leg(svg, F, stance);
    motor(svg, F, stance.knee.x, stance.knee.y, ENV.knee.w, ENV.knee.h, "RS02");
    motor(svg, F, hip.x, hip.y, ENV.swing.w, ENV.swing.h, "RS00");
    wheelSide(svg, F.X(stance.axle.x), F.Y(stance.axle.y), R * D.S);
    box(svg, F, stance.axle.x, stance.axle.y, ENV.wheelD, ENV.wheelD, "#3e4c44", "#1b2430");
    text(svg, F.X(stance.axle.x), F.Y(stance.axle.y) + 4, "RS05", "middle", 9, "#fbf8f1");
    joint(svg, F.X(hip.x), F.Y(hip.y)); joint(svg, F.X(stance.knee.x), F.Y(stance.knee.y)); joint(svg, F.X(raised.knee.x), F.Y(raised.knee.y));
    /* centre of mass of the lump picture at this pose, and gravity down to the tread */
    const mass = K.comReport(stance, raised);
    cross(svg, F.X(mass.com.x), F.Y(mass.com.y), "#9d2c2c");
    line(svg, F.X(mass.com.x), F.Y(mass.com.y), F.X(mass.com.x), F.Y(0), "#9d2c2c", 1, "3 3");
    note(svg, F.X(mass.com.x) + 6, F.Y(5.6), "CoM " + inch(mass.com.x) + " fwd of the contact", "#9d2c2c");
    /* slot target on the next tread, with a leader to keep the note clear of the wheel */
    cross(svg, F.X(G), F.Y(landY), "#8a5a12");
    line(svg, F.X(G), F.Y(landY), F.X(G + 1.2), F.Y(23.0), "#8a5a12", 0.8);
    note(svg, F.X(G + 1.4), F.Y(23.5), "slot centre (+)", "#8a5a12");
    note(svg, F.X(G + 1.4), F.Y(22.7), "landed " + inch(G - landX, 2) + " to the rear", "#8a5a12");
    /* air between the raised tire and the next tread's soffit */
    dimV(svg, F.X(G + R + 0.9), F.Y(landY + R), F.Y(2 * H - M.soffit), inch(H - M.soffit - M.wheelOd) + " air");

    /* dimensions */
    dimH(svg, F.X(riserX - G), F.X(riserX), F.Y(-1.9), inch(G) + " going", false);
    dimV(svg, F.X(17.6), F.Y(0), F.Y(H), inch(H) + " rise");
    ext(svg, F.X(riserX + G), F.Y(H), F.X(17.6), F.Y(H)); ext(svg, F.X(riserX), F.Y(0), F.X(17.6), F.Y(0));
    dimV(svg, F.X(-9.2), F.Y(0), F.Y(hip.y), "hip " + inch(hip.y));
    ext(svg, F.X(hip.x), F.Y(hip.y), F.X(-9.2), F.Y(hip.y));
    dimV(svg, F.X(-6.6), F.Y(hip.y), F.Y(bodyTop), inch(M.bodyAboveHip), true);
    dimH(svg, F.X(-slot - R), F.X(slot + R), F.Y(-0.5), "±" + inch(slot, 2) + " roll room in the slot", false);
    dimH(svg, F.X(hip.x), F.X(hip.x + L.bodyComForwardIn), F.Y(bodyTop + 0.6), "+" + inch(L.bodyComForwardIn) + " pack / CoM");
    ext(svg, F.X(hip.x), F.Y(hip.y), F.X(hip.x), F.Y(bodyTop + 0.6)); ext(svg, F.X(hip.x + 1), F.Y(bodyTop), F.X(hip.x + 1), F.Y(bodyTop + 0.6));
    note(svg, F.X(-8.9), F.Y(2.0), "knee " + inch(Math.abs(stance.knee.x)) + " aft");
    note(svg, F.X(-8.9), F.Y(1.2), "7.5\" + 7.5\" tubes");
    text(svg, F.X(-9.6), F.Y(25.4), "SIDE — planted at 92%, raised wheel on the next tread", "start", 12);

    fill("r1", [
      ["Planted leg", "θ " + fmt(M.balanceTheta) + "°, knee bend " + fmt(M.balancePhi) + "°, reach " + inch(stance.reach) + " of 15\"", ""],
      ["Raised leg", "θ " + fmt(raisedIk.theta) + "°, knee bend " + fmt(raisedIk.phi) + "°, reach " + inch(raised.reach) + " (" + inch(15 - raised.reach) + " spare)", raisedIk.err < 0.05 ? "good" : "bad"],
      ["Landing", inch(landX) + " forward, " + inch(landY - R) + " up — " + inch(G - landX, 2) + " rear of slot centre", "good"],
      ["Raised knee", "forward and down at tread height; the shin passes " + inch(shinClear, 2) + " over the nosing (tube axis)", shinClear > 0.6 ? "good" : "bad"],
      ["Knee holds, one leg at 92%", nm(Math.abs(holdStance.knee)) + " (spring covers ~" + nm(SPEC.knee.springNm) + " of the two-leg crouch)", ""],
      ["Knee holds, 75% crouch", nm(Math.abs(holdCrouch.knee)), ""],
      ["Knee holds, standing up on the shelf", nm(Math.abs(holdStand.knee)) + " vs RS02 " + ACT.rated.knee + " rated / " + ACT.peak.knee + " peak", Math.abs(holdStand.knee) > ACT.peak.knee ? "bad" : ""],
      ["Hip swing holds, one leg at 92%", nm(Math.abs(holdStance.hip)) + " vs RS00 " + ACT.rated.hip + " rated", ""],
      ["Lump picture", fmt(M.exampleMassKg, 2) + " kg, body " + fmt(M.mass.body, 2) + " with the pack " + inch(L.bodyComForwardIn) + " ahead of the hips", ""],
      ["Soffit", inch(H - M.soffit - M.wheelOd) + " of air under a 1\" soffit with a 6\" tire", "good"]
    ]);
  }

  /* ---------- 2. front elevation ---------- */
  function drawFront() {
    const svg = document.getElementById("s2");
    D.setFS(1);
    const F = frame(svg, -9.5, 9.5, -3.4, 26);
    const R = M.wheelR;
    line(svg, F.X(-9.5), F.Y(0), F.X(9.5), F.Y(0), "#8d8374", 1.5);
    centreline(svg, F.X(0), F.Y(-1), F.X(0), F.Y(25));
    /* envelope */
    line(svg, F.X(-Z.env), F.Y(-1), F.X(-Z.env), F.Y(25), "#c8bfae", 1, "6 4");
    line(svg, F.X(Z.env), F.Y(-1), F.X(Z.env), F.Y(25), "#c8bfae", 1, "6 4");
    text(svg, F.X(Z.env) - 4, F.Y(24.6), "14\" envelope (R15)", "end", 10.5, "#5e6a78");
    const bodyTop = hip.y + M.bodyAboveHip;
    const bandBottom = hip.y - ENV.rollD / 2, bandTop = hip.y + ENV.rollD / 2;
    /* head above the hip band; hip band (two roll housings + the pack between them) */
    rect(svg, F.X(-Z.head), F.Y(bodyTop), 2 * Z.head * D.S, (bodyTop - bandTop) * D.S, "#d5e0ea", "#1f4e79");
    [-1, 1].forEach(sg => {
      motor(svg, F, sg * Z.rollAxis, hip.y, ENV.rollD, ENV.rollD, "RS02 roll");
      circle(svg, F.X(sg * Z.rollAxis), F.Y(hip.y), 3, "#fbf8f1", "#1b2430", 1.2);
    });
    box(svg, F, 0, hip.y, L.packIn.w, L.packIn.h, "#efe2b8", "#8a5a12");
    text(svg, F.X(0), F.Y(hip.y) + 4, "pack", "middle", 9.5, "#5c3d0a");
    /* legs: at 92% the two tubes overlap in this view — one bar from the hip to the axle height,
       the knee RS02 inboard of the leg plane, the RS00 outboard at the hip */
    [-1, 1].forEach(sg => {
      const z = sg * Z.leg;
      const kneeY = stance.knee.y;
      tube(svg, F.X(z), F.Y(hip.y), F.X(z), F.Y(kneeY), "#1f4e79", 6);
      tube(svg, F.X(z), F.Y(kneeY), F.X(z), F.Y(R), "#1f4e79", 6);
      /* yoke: from the roll housing's outer face out to the leg plane */
      line(svg, F.X(sg * Z.rollOut), F.Y(hip.y), F.X(z), F.Y(hip.y), "#1b2430", 5);
      motor(svg, F, sg * (Z.leg + ENV.swing.t / 2), hip.y, ENV.swing.t, ENV.swing.w, "RS00");
      motor(svg, F, sg * (Z.leg - ENV.knee.t / 2), kneeY, ENV.knee.t, ENV.knee.w, "RS02");
      /* axle spacer, tire, in-wheel RS05 */
      line(svg, F.X(z), F.Y(R), F.X(sg * Z.axle), F.Y(R), "#1b2430", 4);
      rect(svg, F.X(sg * Z.axle - M.wheelWidth / 2), F.Y(2 * R), M.wheelWidth * D.S, 2 * R * D.S, "#f4f1ea", "#22282f");
      box(svg, F, sg * Z.axle, R, ENV.wheelW, ENV.wheelD, "#3e4c44", hubProud > 0 ? "#9d2c2c" : "#1b2430");
      joint(svg, F.X(z), F.Y(hip.y)); joint(svg, F.X(z), F.Y(kneeY));
    });
    /* dimensions */
    dimH(svg, F.X(-Z.axle), F.X(Z.axle), F.Y(-1.4), inch(M.track) + " track", false);
    dimH(svg, F.X(-Z.env), F.X(Z.env), F.Y(-2.4), inch(M.envelopeWidth) + " overall", false);
    dimH(svg, F.X(0), F.X(Z.rollAxis), F.Y(bandTop + 0.5), inch(Z.rollAxis, 2) + " roll axis");
    dimH(svg, F.X(0), F.X(-Z.leg), F.Y(bandTop + 1.4), inch(Z.leg, 2) + " leg plane");
    dimH(svg, F.X(-Z.rollOut), F.X(Z.rollOut), F.Y(bandBottom - 0.8), inch(2 * Z.rollOut) + " hip band", false);
    dimH(svg, F.X(-Z.head), F.X(Z.head), F.Y(bodyTop + 0.6), inch(M.bodyWidth) + " head");
    dimH(svg, F.X(Z.leg), F.X(Z.axle), F.Y(R - 1.2), inch(spacer, 2) + " spacer", false);
    dimV(svg, F.X(8.8), F.Y(0), F.Y(hip.y), "hip " + inch(hip.y), true);
    ext(svg, F.X(Z.swingOut), F.Y(hip.y), F.X(8.8), F.Y(hip.y));
    if (hubProud > 0) note(svg, F.X(-9.3), F.Y(-0.75), "RS05 " + inch(hubProud, 2) + " proud of the tire, each face", "#9d2c2c");
    if (rollProud > 0) note(svg, F.X(-9.3), F.Y(bandBottom - 2.1), "roll housings " + inch(rollProud, 2) + " proud of the head's faces", "#8a5a12");
    text(svg, F.X(-9.2), F.Y(25.4), "FRONT — hip band, roll axes, leg planes", "start", 12);

    /* frontal-plane closed form (frontal.js): the parallelogram roll that puts the mass over one
       crown contact, the planted hip's hold, and the leg-length difference that keeps the body
       level with the wheel planes this far outboard of the roll axes */
    const FR = window.HuxFrontal, fr = FR.robot({ M: M });
    const g92 = fr.balanceRoll(0), rollDeg = -g92 * 180 / Math.PI;
    const rollHold = fr.holdTorque([g92, -g92, 0]);
    const levelIn = 2 * (Z.axle - Z.rollAxis) * Math.sin(-g92);
    fill("r2", [
      ["Hip roll axes", inch(Z.rollAxis) + " from the centreline (requirement ≤ 3\", 2026-09-26)", Z.rollAxis <= 3 ? "good" : "bad"],
      ["Hip band", inch(2 * Z.rollOut) + " wide: two RS02 roll housings (" + inch(ENV.rollD) + " sq) flanking the " + inch(L.packIn.w) + " pack", ""],
      ["Head", inch(M.bodyWidth) + " wide above the band; the housings sit " + inch(rollProud, 2) + " proud of its faces", ""],
      ["Leg plane", inch(Z.leg) + " out — " + inch(Z.leg - Z.rollOut, 2) + " clear of the roll housing", Z.leg > Z.rollOut ? "good" : "bad"],
      ["Knee RS02", "inboard of the leg plane, " + inch(Z.kneeIn) + "–" + inch(Z.kneeOut) + " — clears the tire (" + inch(Z.tireIn) + " in) at every fold", ""],
      ["Hip swing RS00", "outboard, " + inch(Z.swingIn) + "–" + inch(Z.swingOut, 2) + " — " + inch(Z.env - Z.swingOut, 2) + " inside the 14\" envelope", Z.swingOut <= Z.env ? "good" : "bad"],
      ["Axle spacer", inch(spacer, 2) + " from the leg plane to the wheel centre", ""],
      ["RS05 hub", inch(ENV.wheelW, 2) + " long in a " + inch(M.wheelWidth) + " tire — " + inch(hubProud, 2) + " proud each face, " + inch(Z.hubOut - Z.env, 2) + " past the envelope", "bad"],
      ["Roll hold, one wheel up", nm(rollHold) + " at " + inch(Z.rollAxis) + " axes vs RS02 " + ACT.rated.roll + " rated (frontal model)", rollHold <= ACT.rated.roll ? "good" : "bad"],
      ["Shift", fmt(rollDeg) + "° of parallelogram roll puts the mass over one crown contact at 92%", ""],
      ["Levelling cost", "with the wheel planes " + inch(Z.axle - Z.rollAxis, 2) + " outboard of the roll axes, that roll needs " + inch(levelIn, 2) + " of leg-length difference to keep the body level (was 0.8\" at 5.4\" axes) — the legs take it up by plan", levelIn > 2 ? "open" : ""]
    ]);
  }

  /* ---------- 3. plan ---------- */
  function drawPlan() {
    const svg = document.getElementById("s3");
    D.setFS(0.62);
    const F = frame(svg, -9.5, 9.5, -8.6, 8); /* x forward is up the page; F.Y maps x, F.X maps z */
    const P = (x, z) => ({ px: F.X(z), py: F.Y(x) });
    const R = M.wheelR;
    centreline(svg, F.X(0), F.Y(-7.5), F.X(0), F.Y(7.5));
    centreline(svg, F.X(-9), F.Y(0), F.X(9), F.Y(0));
    line(svg, F.X(-Z.env), F.Y(-7.5), F.X(-Z.env), F.Y(7.5), "#c8bfae", 1, "6 4");
    line(svg, F.X(Z.env), F.Y(-7.5), F.X(Z.env), F.Y(7.5), "#c8bfae", 1, "6 4");
    /* legs first (they are below the hip band, so the band draws over them): tubes at the leg
       plane, the knee RS02 inboard and the RS05 hub — both far below the band — dashed */
    [-1, 1].forEach(sg => {
      const z = sg * Z.leg;
      tube(svg, F.X(z), F.Y(stance.hip.x), F.X(z), F.Y(stance.knee.x), "#1f4e79", 6);
      tube(svg, F.X(z), F.Y(stance.knee.x), F.X(z), F.Y(stance.axle.x), "#1f4e79", 6);
      rect(svg, F.X(sg > 0 ? Z.kneeIn : -Z.kneeOut), F.Y(stance.knee.x + ENV.knee.w / 2), ENV.knee.t * D.S, ENV.knee.w * D.S, "#e9ebe8", "#4d5b55", "4 3");
      text(svg, F.X(sg * (Z.leg - ENV.knee.t / 2)), F.Y(stance.knee.x - 0.9) + 4, "RS02 knee", "middle", 9, "#4d5b55");
      line(svg, F.X(z), F.Y(stance.axle.x), F.X(sg * Z.axle), F.Y(stance.axle.x), "#1b2430", 4);   /* axle spacer */
      svg.appendChild(el("rect", { x: F.X(sg * Z.axle - M.wheelWidth / 2), y: F.Y(stance.axle.x + R), width: M.wheelWidth * D.S, height: 2 * R * D.S, rx: 3, fill: "#f4f1ea", stroke: "#22282f", "stroke-width": 2 }));
      rect(svg, F.X(sg * Z.axle - ENV.wheelW / 2), F.Y(stance.axle.x + ENV.wheelD / 2), ENV.wheelW * D.S, ENV.wheelD * D.S, "none", hubProud > 0 ? "#9d2c2c" : "#1b2430", "4 3");
      joint(svg, F.X(z), F.Y(stance.knee.x));
    });
    /* head outline, hip band, pack, yokes and the RS00s on top */
    rect(svg, F.X(-Z.head), F.Y(hip.x + M.bodyLength / 2), 2 * Z.head * D.S, M.bodyLength * D.S, "none", "#1f4e79", "4 3");
    [-1, 1].forEach(sg => {
      rect(svg, F.X(sg * Z.rollAxis - ENV.rollD / 2), F.Y(hip.x + ROLL_X + ENV.rollL / 2), ENV.rollD * D.S, ENV.rollL * D.S, "#4d5b55", "#1b2430");
      text(svg, F.X(sg * Z.rollAxis), F.Y(hip.x + ROLL_X) + 3, "RS02 roll", "middle", 9.5, "#fbf8f1");
      line(svg, F.X(sg * Z.rollAxis), F.Y(hip.x - 3.5), F.X(sg * Z.rollAxis), F.Y(hip.x + 2.5), "#5e6a78", 0.8, "10 4 2 4");
    });
    rect(svg, F.X(-Z.pack), F.Y(hip.x + L.bodyComForwardIn + L.packIn.l / 2), 2 * Z.pack * D.S, L.packIn.l * D.S, "#efe2b8", "#8a5a12");
    text(svg, F.X(0), F.Y(hip.x + L.bodyComForwardIn) + 4, "8S pack", "middle", 9.5, "#5c3d0a");
    [-1, 1].forEach(sg => {
      const z = sg * Z.leg;
      line(svg, F.X(sg * Z.rollOut), F.Y(hip.x), F.X(z), F.Y(hip.x), "#1b2430", 5);           /* yoke */
      rect(svg, F.X(sg > 0 ? Z.leg : -Z.swingOut), F.Y(hip.x + ENV.swing.w / 2), ENV.swing.t * D.S, ENV.swing.w * D.S, "#4d5b55", "#1b2430");
      text(svg, F.X(sg * (Z.leg + ENV.swing.t / 2)), F.Y(hip.x - 0.7) + 4, "RS00", "middle", 9, "#fbf8f1");
      joint(svg, F.X(z), F.Y(hip.x));
    });
    /* dimensions */
    dimH(svg, F.X(-Z.env), F.X(Z.env), F.Y(-7.6), inch(M.envelopeWidth) + " overall", false);
    dimH(svg, F.X(-Z.axle), F.X(Z.axle), F.Y(-6.7), inch(M.track) + " track", false);
    dimH(svg, F.X(0), F.X(Z.rollAxis), F.Y(hip.x + 2.6), inch(Z.rollAxis, 2) + " roll axis");
    dimH(svg, F.X(0), F.X(-Z.leg), F.Y(hip.x + 3.3), inch(Z.leg, 2) + " leg plane");
    dimH(svg, F.X(-Z.head), F.X(Z.head), F.Y(hip.x + M.bodyLength / 2 + 0.6), inch(M.bodyWidth) + " × " + inch(M.bodyLength) + " head");
    text(svg, F.X(-9.2), F.Y(7.3), "PLAN — hip band, leg planes, knees aft at 92% · forward ↑", "start", 12);
    fill("r3", [
      ["Hip band", "RS02 roll housings on the roll axes, flanges forward into the yokes; the pack between them, " + inch(L.bodyComForwardIn) + " forward", ""],
      ["Yoke", "from the roll flange out to the leg plane at " + inch(Z.leg) + "; carries the RS00 outboard and the hip pivot", ""],
      ["Knee", inch(Math.abs(stance.knee.x)) + " aft of the hip and axle at 92%; the RS02 sits inboard of the tube plane", ""],
      ["Wire path (R21)", "RS05 lead: axle → inboard face of the lower tube → knee fitting → upper tube → yoke. No belt runs.", ""],
      ["Not drawn", "tube OD/wall and fittings, the knee spring, wire ports, the display and cameras — Sheet 2", "open"]
    ]);
  }

  /* ---------- 4. stroke ---------- */
  function drawStroke() {
    const svg = document.getElementById("s4");
    D.setFS(1);
    const F = frame(svg, -13, 15, -18.6, 4);
    const R = M.wheelR;
    const o = { x: 0, y: 0 };
    /* reach limits */
    const minReach = 2 * M.link * Math.cos(K.spatial.limits.knee[1] / 2);
    circle(svg, F.X(0), F.Y(0), 2 * M.link * D.S, "none", "#c8bfae", 1);
    circle(svg, F.X(0), F.Y(0), minReach * D.S, "none", "#c8bfae", 1);
    note(svg, F.X(-12.8), F.Y(-Math.sqrt(4 * M.link * M.link - 12.8 * 12.8) + 0.6), "15\" full reach");
    note(svg, F.X(0) + 4, F.Y(-minReach) + 12, inch(minReach) + " at the knee stop");
    centreline(svg, F.X(0), F.Y(3), F.X(0), F.Y(-17));
    /* the next-tread slot, relative to the hip at the 92% stance */
    const slotY = landY - hip.y;
    line(svg, F.X(M.going - R - M.slotRoom), F.Y(slotY - R), F.X(M.going + R + M.slotRoom), F.Y(slotY - R), "#c4a15a", 4);
    cross(svg, F.X(M.going), F.Y(slotY), "#8a5a12");
    text(svg, F.X(M.going + R + M.slotRoom), F.Y(slotY - R) + 14, "next slot ±" + inch(M.slotRoom, 2), "end", 10.5, "#5e6a78");
    /* poses, all with the hip at the origin */
    const poses = [
      { p: K.atHip(0, 0, o), c: "#c8bfae", w: 4, n: "straight", th: 0, ph: 0 },
      { p: K.atHip(M.deepTheta, M.deepPhi, o), c: "#8aa0b5", w: 5, n: "75% crouch", th: M.deepTheta, ph: M.deepPhi },
      { p: K.atHip(M.balanceTheta, M.balancePhi, o), c: "#1f4e79", w: 7, n: "92% stance", th: M.balanceTheta, ph: M.balancePhi },
      { p: raisedFromOrigin(), c: "#1d6b45", w: 6, n: "raised on the next tread", th: raisedIk.theta, ph: raisedIk.phi },
      { p: shove, c: "#8a5a12", w: 5, n: "shove (rear leg)", th: shoveIk.theta, ph: shoveIk.phi },
      { p: stand, c: "#9d2c2c", w: 5, n: "stand-up on the shelf", th: standIk.theta, ph: standIk.phi }
    ];
    function raisedFromOrigin() { return K.atHip(raisedIk.theta, raisedIk.phi, o); }
    poses.forEach(q => {
      leg(svg, F, q.p, q.c, q.w);
      circle(svg, F.X(q.p.axle.x), F.Y(q.p.axle.y), R * D.S, "none", q.c, 1.4);
      joint(svg, F.X(q.p.knee.x), F.Y(q.p.knee.y));
    });
    joint(svg, F.X(0), F.Y(0));
    text(svg, F.X(0) + 8, F.Y(0) - 6, "hip", "start", 10.5);
    /* legend */
    poses.forEach((q, i) => {
      const y = F.Y(-10.2) + 14 * (i + 1);
      line(svg, F.X(3.6), y - 4, F.X(4.6), y - 4, q.c, 4);
      text(svg, F.X(4.8), y, q.n, "start", 10.5);
    });
    dimH(svg, F.X(0), F.X(M.going), F.Y(slotY + R + 0.8), inch(M.going) + " forward");
    dimV(svg, F.X(14.3), F.Y(-2 * M.link * M.stanceFraction), F.Y(slotY), inch(slotY + 2 * M.link * M.stanceFraction) + " up", true);
    ext(svg, F.X(M.going + R), F.Y(slotY), F.X(14.3), F.Y(slotY)); ext(svg, F.X(0), F.Y(-2 * M.link * M.stanceFraction), F.X(14.3), F.Y(-2 * M.link * M.stanceFraction));
    text(svg, F.X(-12.8), F.Y(-17.1), "STROKE — every pose the step needs, hip fixed", "start", 12);
    const kneeMin = Math.min(...poses.map(q => q.ph)), kneeMax = Math.max(...poses.map(q => q.ph));
    const hipMin = Math.min(...poses.map(q => q.th)), hipMax = Math.max(...poses.map(q => q.th));
    fill("r4", [
      ["Poses (θ hip, knee bend, reach)", poses.map(q => q.n.split(" ")[0].replace(",", "") + " " + fmt(q.th, 0) + "° / " + fmt(q.ph, 0) + "° / " + inch(q.p.reach)).join(" · "), ""],
      ["Knee bend used", fmt(kneeMin, 0) + "° to " + fmt(kneeMax, 0) + "° (joint stop " + fmt(K.deg(K.spatial.limits.knee[1]), 0) + "°)", ""],
      ["Hip swing used", fmt(hipMin, 0) + "° to " + fmt(hipMax, 0) + "° (limits " + fmt(K.deg(K.spatial.limits.hip[0]), 0) + "° to " + fmt(K.deg(K.spatial.limits.hip[1]), 0) + "°)", ""],
      ["Shove reach", inch(shove.reach) + " of 15\" — the pose no five-bar in the envelope reaches (knee-linkage.md)", shoveIk.err < 0.05 ? "good" : "bad"],
      ["Raised wheel", inch(raised.reach) + " of 15\" used; " + inch(15 - raised.reach) + " spare at the rear-of-slot target", ""],
      ["Knee spring", "~" + nm(SPEC.knee.springNm) + " sized for the two-leg crouch; the actuator pays the rest on one leg (R7, R39)", ""],
      ["Knee actuator", "RS02 at the knee for V1; hip-driven linkage is V2 (R39)", "good"]
    ]);
  }

  /* ---------- title block and speed ---------- */
  function drawTitle() {
    const wheel = SPEC.wheelAtSpeed(SPEC.speed.topMs, M.wheelOd);
    const wheelCut = SPEC.wheelAtSpeed(SPEC.speed.topMs, M.wheelOd, ACT.bus.vCutoff);
    const vRes = SPEC.speedWithReserve(SPEC.speed.reserveNm, M.wheelOd);
    const vResCut = SPEC.speedWithReserve(SPEC.speed.reserveNm, M.wheelOd, ACT.bus.vCutoff);
    fill("r0", [
      ["Finish line (" + SPEC.finishLine.id + ")", SPEC.finishLine.text + "; a flight is " + SPEC.finishLine.flight, "good"],
      ["Speed (" + SPEC.speed.id + ")", fmt(SPEC.speed.topMs) + " m/s top, " + fmt(SPEC.speed.cruiseMs) + " cruise — " + fmt(wheel.rpm, 0) + " rpm at the " + inch(M.wheelOd, 0) + " wheel, " + nm(wheel.availNm) + " of catch left (" + nm(wheelCut.availNm) + " at cutoff)", wheel.availNm >= SPEC.speed.reserveNm ? "good" : "bad"],
      ["Speed with " + nm(SPEC.speed.reserveNm) + " in hand", fmt(vRes, 2) + " m/s nominal, " + fmt(vResCut, 2) + " at cutoff — the RS05 on 8S sets the ceiling, not the legs", ""],
      ["Knee (" + SPEC.knee.id + ")", "RS02 at the " + SPEC.knee.actuatorAt + ", spring " + nm(SPEC.knee.springNm) + ", linkage " + SPEC.knee.linkage + ", five-bar: no", "good"],
      ["Terrain (" + SPEC.terrain.id + ")", "flat + " + inch(SPEC.terrain.sillIn, 0) + " sills + " + SPEC.terrain.slopeDeg + "° slopes; rough ground " + SPEC.terrain.rough, "good"],
      ["Actuators", ACT.count + " RobStride (" + ACT.lockedOn + "): 4× RS02, 2× RS00, 2× RS05 — " + fmt(ACT.massKg, 2) + " kg", ""],
      ["Reference", SPEC.reference.name + ": " + SPEC.reference.massKg + " kg, " + SPEC.reference.strokeMm + " mm stroke, " + SPEC.reference.poseMotorsPerLeg + " pose motors per leg — scale and packaging only", ""],
      ["Drawn from", "kin.js · actuators.js · spec.js — as of " + SPEC.asOf, ""]
    ]);
  }


  drawTitle(); drawSide(); drawFront(); drawPlan(); drawStroke();
  window.HuxSheet = { hip, stance, raised, raisedIk, shoveIk, standIk, Z, holdStance, holdStand, hubProud, rollProud, spacer };
})();
