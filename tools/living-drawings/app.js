(function () {
  const K = window.HuxKin;
  const M = K.M;
  const side = document.getElementById("side");
  const top = document.getElementById("top");
  const hip = document.getElementById("hip");
  const knee = document.getElementById("knee");
  const roll = document.getElementById("roll");
  const mode = document.getElementById("mode");
  const pairSvg = document.getElementById("pair");
  const rHip = document.getElementById("rHip");
  const rKnee = document.getElementById("rKnee");
  const lHip = document.getElementById("lHip");
  const lKnee = document.getElementById("lKnee");
  const headX = document.getElementById("headX");
  const headY = document.getElementById("headY");
  const hipLean = document.getElementById("hipLean");
  const wheelX = document.getElementById("wheelX");
  const wheelY = document.getElementById("wheelY");
  const pairDrive = document.getElementById("pairDrive");
  const rWheelX = document.getElementById("rWheelX");
  const rWheelY = document.getElementById("rWheelY");
  const lWheelX = document.getElementById("lWheelX");
  const lWheelY = document.getElementById("lWheelY");
  const climb = document.getElementById("climb");
  const pairPlay = document.getElementById("pairPlay");
  const poses = document.querySelectorAll("[data-pose]");
  const PERIOD = 8000;
  let playing = false;
  let playTimer = 0;
  let playBase = 0;
  let playT0 = 0;
  let held = null;
  let writingScrub = false;

  let hipX = 0;
  const stanceHip = K.planted(M.balanceTheta, M.balancePhi).hip.y;
  const placeIk = K.ik(M.going - 4, (M.rise + M.wheelR) - stanceHip);

  const presets = {
    straight: { theta: 0, phi: 0, mode: "planted", hipX: 0 },
    balance: { theta: M.balanceTheta, phi: M.balancePhi, mode: "planted", hipX: 0 },
    crouch: { theta: M.deepTheta, phi: M.deepPhi, mode: "planted", hipX: 0 },
    place: { theta: placeIk.theta, phi: placeIk.phi, mode: "swing", hipX: 4 }
  };

  function applyPose(name) {
    const p = presets[name];
    if (!p) return;
    hip.value = String(p.theta);
    knee.value = String(p.phi);
    mode.value = p.mode;
    hipX = p.hipX || 0;
    poses.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.pose === name);
      btn.setAttribute("aria-pressed", btn.dataset.pose === name ? "true" : "false");
    });
    if (history.replaceState) history.replaceState(null, "", "#" + name);
    draw();
  }

  hip.addEventListener("input", function () { clearPose(); draw(); });
  knee.addEventListener("input", function () { clearPose(); draw(); });
  roll.addEventListener("input", draw);
  mode.addEventListener("change", function () {
    clearPose();
    const asking = mode.value === "wheel";
    document.getElementById("jointAsk").hidden = asking;
    document.getElementById("wheelAsk").hidden = !asking;
    draw();
  });
  [hipLean, wheelX, wheelY].forEach(function (el) {
    el.addEventListener("input", function () { clearPose(); draw(); });
  });
  poses.forEach(function (btn) {
    btn.addEventListener("click", function () { applyPose(btn.dataset.pose); });
  });

  function clearPose() {
    poses.forEach(function (btn) {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });
  }

  function num(el) { return Number(el.value); }

  function current() {
    if (mode.value === "wheel") {
      const hipPt = { x: num(hipLean), y: stanceHip };
      const sol = K.ik(num(wheelX) - hipPt.x, num(wheelY) - hipPt.y);
      return {
        theta: sol.theta,
        phi: sol.phi,
        pose: K.atHip(sol.theta, sol.phi, hipPt),
        err: sol.err,
        wheel: true
      };
    }
    const theta = num(hip);
    const phi = num(knee);
    const pose = mode.value === "swing" ? K.swing(theta, phi, hipX) : K.planted(theta, phi);
    return { theta: theta, phi: phi, pose: pose, err: 0, wheel: false };
  }

  function draw() {
    const c = current();
    document.getElementById("hipOut").textContent = c.theta.toFixed(1) + "°";
    document.getElementById("kneeOut").textContent = c.phi.toFixed(1) + "°";
    document.getElementById("hipLeanOut").textContent = num(hipLean).toFixed(1) + "\"";
    document.getElementById("wheelXOut").textContent = num(wheelX).toFixed(1) + "\"";
    document.getElementById("wheelYOut").textContent = num(wheelY).toFixed(1) + "\"";
    document.getElementById("rollOut").textContent = num(roll).toFixed(1) + "°";
    const frame = pairState();
    const showSolved = frame.climbing || pairDrive.value === "wheels";
    if (frame.climbing) {
      writeAngle(rHip, frame.rightTheta);
      writeAngle(rKnee, frame.rightPhi);
      writeAngle(lHip, frame.leftTheta);
      writeAngle(lKnee, frame.leftPhi);
      writeAngle(headX, frame.left.hip.x);
      writeAngle(headY, frame.left.hip.y);
    } else if (pairDrive.value === "wheels") {
      writeAngle(rHip, frame.rightTheta);
      writeAngle(rKnee, frame.rightPhi);
      writeAngle(lHip, frame.leftTheta);
      writeAngle(lKnee, frame.leftPhi);
    }
    document.getElementById("rHipOut").textContent = (showSolved ? frame.rightTheta : num(rHip)).toFixed(1) + "°";
    document.getElementById("rKneeOut").textContent = (showSolved ? frame.rightPhi : num(rKnee)).toFixed(1) + "°";
    document.getElementById("lHipOut").textContent = (showSolved ? frame.leftTheta : num(lHip)).toFixed(1) + "°";
    document.getElementById("lKneeOut").textContent = (showSolved ? frame.leftPhi : num(lKnee)).toFixed(1) + "°";
    document.getElementById("headXOut").textContent = (frame.climbing ? frame.left.hip.x : num(headX)).toFixed(1) + "\"";
    document.getElementById("headYOut").textContent = (frame.climbing ? frame.left.hip.y : num(headY)).toFixed(1) + "\"";
    document.getElementById("rWheelXOut").textContent = frame.right.axle.x.toFixed(1) + "\"";
    document.getElementById("rWheelYOut").textContent = frame.right.axle.y.toFixed(1) + "\"";
    document.getElementById("lWheelXOut").textContent = frame.left.axle.x.toFixed(1) + "\"";
    document.getElementById("lWheelYOut").textContent = frame.left.axle.y.toFixed(1) + "\"";
    if (playing) {
      const p = playBase + (performance.now() - playT0) / PERIOD;
      if (p > Number(climb.max) - 0.25) climb.max = String(Number(climb.max) + 4);
      writingScrub = true;
      climb.value = String(p);
      writingScrub = false;
    }
    const shown = playing ? playBase + (performance.now() - playT0) / PERIOD : (held ? held.p : Number(climb.value));
    document.getElementById("climbOut").textContent = frame.climbing
      ? "step " + frame.step + " · " + frame.phase
      : "step " + Math.floor(shown);
    drawSide(c);
    drawTop(c);
    drawPair(frame);
  }

  function svgEl(name, attrs) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function drawSide(c) {
    const S = 18;
    const x0 = -8;
    const x1 = 18;
    const y0 = -2;
    const y1 = 26;
    const W = (x1 - x0) * S;
    const H = (y1 - y0) * S;
    side.setAttribute("viewBox", "0 0 " + W + " " + H);
    side.replaceChildren();
    const X = function (x) { return (x - x0) * S; };
    const Y = function (y) { return (y1 - y) * S; };
    const g = going();
    const p = c.pose;

    drawStair(side, X, Y, S);

    let other = p;
    if (mode.value === "swing" && hipX) {
      const ghostIk = K.ik(-hipX, M.wheelR - stanceHip);
      const ghost = K.swing(ghostIk.theta, ghostIk.phi, hipX);
      other = ghost;
      tube(side, X(ghost.hip.x), Y(ghost.hip.y), X(ghost.knee.x), Y(ghost.knee.y), "#b7c3d0", 6);
      tube(side, X(ghost.knee.x), Y(ghost.knee.y), X(ghost.axle.x), Y(ghost.axle.y), "#b7c3d0", 6);
      wheel(side, X(ghost.axle.x), Y(ghost.axle.y), M.wheelR * S, "#d9d3c7");
    }
    tube(side, X(p.hip.x), Y(p.hip.y), X(p.knee.x), Y(p.knee.y));
    tube(side, X(p.knee.x), Y(p.knee.y), X(p.axle.x), Y(p.axle.y));
    motorBox(side, p.knee.x, p.knee.y, M.motorKnee.w, M.motorKnee.h, X, Y, S);
    const bodyX = p.hip.x - M.bodyLength / 2;
    const bodyTop = p.hip.y + M.bodyAboveHip;
    rect(side, X(bodyX), Y(bodyTop), M.bodyLength * S, M.bodyAboveHip * S, "#d5e0ea", "#1f4e79");
    drawFaceSide(side, p.hip, X, Y, S);
    motorBox(side, p.hip.x - 1.3, p.hip.y + 0.95, M.motorSwing.w, M.motorSwing.h, X, Y, S);
    circle(side, X(p.hip.x + 1.45), Y(p.hip.y + 1.5), (M.motorRollD / 2) * S, "#3e4c44", "#1b2430");

    wheel(side, X(p.axle.x), Y(p.axle.y), M.wheelR * S);
    circle(side, X(p.axle.x), Y(p.axle.y), (M.motorWheelD / 2) * S, "#3e4c44", "#1b2430");
    joint(side, X(p.hip.x), Y(p.hip.y));
    joint(side, X(p.knee.x), Y(p.knee.y));
    const mass = K.comReport(p, other);
    drawGravity(side, mass.com, X, Y);
    cross(side, X(g.x), Y(g.y), "#9d2c2c");
    text(side, X(g.x + M.wheelR) + 10, Y(g.y) - 8, "next axle", "start");

    const foot = K.axleStatus(p.axle);
    const onNext = Math.abs(p.contact.y - M.rise) < 0.2 && Math.abs(p.axle.x - M.going) < 0.4;
    const cells = [
      ["Extension", (p.extension * 100).toFixed(0) + "%", ""],
      ["Hip above contact", p.hipHeight.toFixed(1) + "\"", ""],
      ["Knee", kneeWord(p), p.knee.x < p.hip.x + 1.5 ? "good" : ""],
      ["To next axle", p.miss.toFixed(1) + "\"", onNext ? "good" : ""],
      ["Air under 1\" soffit", M.rise - M.soffit - M.wheelOd + "\"", "good"],
      ["Stair", foot.where, foot.kind],
      ["Center of mass", mass.com.x.toFixed(1) + "\" forward, " + mass.com.y.toFixed(1) + "\" up", ""],
      ["Balance", mass.where + ", " + mass.moment.toFixed(1) + " N·m", mass.where.indexOf("Over") === 0 ? "good" : ""],
      ["Motor bulk", "hub Ø2\" · knee 1.6×1.5 · swing 1.8×1.6 · roll Ø1.6", ""]
    ];
    if (c.wheel && c.err > 0.15) cells.push(["Reach", "That wheel is " + c.err.toFixed(1) + "\" past the leg", "bad"]);
    fillRead("sideRead", cells);
  }

  function drawTop(c) {
    const S = 22;
    const x0 = -9.5;
    const x1 = 9.5;
    const y0 = -8;
    const y1 = 14;
    const W = (x1 - x0) * S;
    const H = (y1 - y0) * S;
    top.setAttribute("viewBox", "0 0 " + W + " " + H);
    top.replaceChildren();
    const X = function (x) { return (x - x0) * S; };
    const Y = function (y) { return (y1 - y) * S; };
    const half = M.envelopeWidth / 2;
    line(top, X(-half), Y(-6), X(-half), Y(12), "#c8bfae", 1, "5 4");
    line(top, X(half), Y(-6), X(half), Y(12), "#c8bfae", 1, "5 4");
    text(top, X(0), Y(12.4), M.envelopeWidth + "\" outside", "middle");

    const track = M.track;
    const left = -track / 2;
    const right = track / 2;
    const stance = K.planted(M.balanceTheta, M.balancePhi);
    const leftPose = mode.value === "swing" && hipX
      ? K.swing(K.ik(-hipX, M.wheelR - stanceHip).theta, K.ik(-hipX, M.wheelR - stanceHip).phi, hipX)
      : (mode.value === "swing" ? stance : c.pose);
    const rightPose = c.pose;
    drawLegPlan(top, left, leftPose, X, Y, S, true);
    drawLegPlan(top, right, rightPose, X, Y, S, false);

    const hipH = K.planted(c.theta, c.phi).hip.y;
    const shift = hipH * Math.sin(K.rad(num(roll)));
    const bw = M.bodyWidth;
    const bl = M.bodyLength;
    const hipFwd = mode.value === "swing" ? hipX : c.pose.hip.x;
    rect(top, X(shift - bw / 2), Y(hipFwd + bl / 2), bw * S, bl * S, "#d5e0ea", "#1f4e79");
    drawFaceTop(top, shift, hipFwd, X, Y, S);
    [-1, 1].forEach(function (sgn) {
      circle(top, X(shift + sgn * (bw / 2 - 0.95)), Y(hipFwd + 1.1), (M.motorRollD / 2) * S, "#3e4c44", "#1b2430");
    });
    cross(top, X(shift), Y(hipFwd), "#9d2c2c");

    dim(top, X(left), Y(-6.4), X(right), Y(-6.4), track.toFixed(2) + "\" track");

    const toLeft = shift - left;
    const toRight = right - shift;
    const overLeft = Math.abs(toLeft) <= M.wheelWidth / 2;
    const overRight = Math.abs(toRight) <= M.wheelWidth / 2;
    let where = "Between the wheels";
    if (overLeft) where = "Over the left wheel";
    else if (overRight) where = "Over the right wheel";
    const moment = K.rollMomentNm(Math.min(Math.abs(toLeft), Math.abs(toRight)));
    fillRead("topRead", [
      ["CoG offset", (shift >= 0 ? "+" : "") + shift.toFixed(2) + "\"", ""],
      ["Where the mass sits", where, overLeft || overRight ? "good" : ""],
      ["Moment at nearer wheel", moment.toFixed(1) + " N·m", ""],
      ["Example mass", M.exampleMassKg + " kg", ""],
      ["Roll angle", num(roll).toFixed(1) + "°", ""],
      ["Hip height used", hipH.toFixed(1) + "\"", ""]
    ]);
  }

  function climbNow() {
    if (playing) {
      const p = playBase + (performance.now() - playT0) / PERIOD;
      return { step: Math.floor(p), f: p - Math.floor(p), p: p };
    }
    if (held) return held;
    if (pairDrive.value === "climb") {
      const p = Number(climb.value) || 0;
      return { step: Math.floor(p), f: p - Math.floor(p), p: p };
    }
    return null;
  }

  function pairState() {
    const now = climbNow();
    if (now) {
      const frame = K.climbFrame(now.step, now.f);
      frame.climbing = true;
      frame.step = now.step;
      return frame;
    }
    const hipPt = { x: num(headX), y: num(headY) };
    let left;
    let right;
    let leftTheta = num(lHip);
    let leftPhi = num(lKnee);
    let rightTheta = num(rHip);
    let rightPhi = num(rKnee);
    let aErr = 0;
    let bErr = 0;
    if (pairDrive.value === "wheels") {
      const ls = K.ik(num(lWheelX) - hipPt.x, num(lWheelY) - hipPt.y);
      const rs = K.ik(num(rWheelX) - hipPt.x, num(rWheelY) - hipPt.y);
      left = K.atHip(ls.theta, ls.phi, hipPt);
      right = K.atHip(rs.theta, rs.phi, hipPt);
      leftTheta = ls.theta;
      leftPhi = ls.phi;
      rightTheta = rs.theta;
      rightPhi = rs.phi;
      aErr = ls.err;
      bErr = rs.err;
    } else {
      left = K.atHip(leftTheta, leftPhi, hipPt);
      right = K.atHip(rightTheta, rightPhi, hipPt);
    }
    return {
      phase: "",
      left: left,
      right: right,
      com: K.comOf(left, right),
      hit: K.poseHits(left, right),
      aErr: aErr,
      bErr: bErr,
      leftTheta: leftTheta,
      leftPhi: leftPhi,
      rightTheta: rightTheta,
      rightPhi: rightPhi,
      climbing: false,
      step: 0
    };
  }

  function drawPair(frame) {
    const S = 16;
    const head = frame.left.hip;
    const x0 = head.x - 12;
    const x1 = head.x + 16;
    const y0 = head.y - 20;
    const y1 = head.y + 8;
    pairSvg.setAttribute("viewBox", "0 0 " + ((x1 - x0) * S) + " " + ((y1 - y0) * S));
    pairSvg.replaceChildren();
    const X = function (x) { return (x - x0) * S; };
    const Y = function (y) { return (y1 - y) * S; };
    drawStairs(pairSvg, X, Y, S, x0, x1, y0, y1, head);
    drawOneLeg(pairSvg, frame.left, "#8aa0b5", 6, X, Y, S, "L");
    drawOneLeg(pairSvg, frame.right, "#1f4e79", 8, X, Y, S, "R");
    const bodyX = head.x - M.bodyLength / 2;
    rect(pairSvg, X(bodyX), Y(head.y + M.bodyAboveHip), M.bodyLength * S, M.bodyAboveHip * S, "#d5e0ea", "#1f4e79");
    drawFaceSide(pairSvg, head, X, Y, S);
    motorBox(pairSvg, head.x - 1.3, head.y + 0.95, M.motorSwing.w, M.motorSwing.h, X, Y, S);
    circle(pairSvg, X(head.x + 1.45), Y(head.y + 1.5), (M.motorRollD / 2) * S, "#3e4c44", "#1b2430");
    cross(pairSvg, X(head.x), Y(head.y), "#9d2c2c");
    drawGravity(pairSvg, frame.com, X, Y);
    if (frame.dyn && frame.dyn.speed > 4) {
      const scale = 0.12;
      const x2 = frame.com.x + frame.dyn.vx * scale;
      const y2 = frame.com.y + frame.dyn.vy * scale;
      line(pairSvg, X(frame.com.x), Y(frame.com.y), X(x2), Y(y2), "#9d2c2c", 2.4);
    }
    const right = frame.right;
    const left = frame.left;
    const rs = K.axleStatus(right.axle);
    const ls = K.axleStatus(left.axle);
    const mass = K.comReport(left, right);
    const cells = [
      ["Phase", frame.climbing ? "Step " + frame.step + " · " + frame.phase : "Holding the controls", ""],
      ["Center of mass", mass.com.x.toFixed(1) + "\" forward, " + mass.com.y.toFixed(1) + "\" up", ""],
      ["Balance", frame.dyn && frame.dyn.behind > 0.4 ? "Behind the front contact" : mass.where,
        frame.dyn && frame.dyn.behind > 0.4 ? "" : (mass.where.indexOf("Over") === 0 ? "good" : "")],
      ["Moment about the near foot", mass.moment.toFixed(1) + " N·m at " + mass.com.kg.toFixed(1) + " kg", ""],
      ["Right foot", rs.where, rs.kind],
      ["Left foot", ls.where, ls.kind],
      ["Right knee", kneeWord(right), right.knee.x < right.hip.x + 1.5 ? "good" : ""],
      ["Left knee", kneeWord(left), left.knee.x < left.hip.x + 1.5 ? "good" : ""],
      ["Stairs", frame.hit ? frame.hit + " hits a step" : "Clear", frame.hit ? "bad" : "good"]
    ];
    if (frame.dyn) {
      const d = frame.dyn;
      const gap = d.behind > 0.2
        ? d.behind.toFixed(1) + "\" behind the front contact"
        : d.behind < -0.2
          ? (-d.behind).toFixed(1) + "\" ahead of the front contact"
          : "Over the front contact";
      cells.push(["Front contact", gap, d.behind <= 0.2 ? "good" : ""]);
      if (d.throwing) {
        cells.push(["Angular momentum", d.forwardL.toFixed(2) + " kg·m²/s forward about the front contact", ""]);
        cells.push(["Inertia", d.inertia.toFixed(2) + " kg·m² about that contact", ""]);
        if (d.speed > 1) cells.push(["Center of mass speed", d.speed.toFixed(0) + " in/s at full speed", ""]);
        if (d.rearN !== null) cells.push(["Rear contact", d.rearN.toFixed(0) + " N upward", ""]);
      }
      if (d.note) cells.push(["Throw", d.note, d.ok ? "good" : ""]);
    }
    if (frame.aErr > 0.15 || frame.bErr > 0.15) {
      cells.push(["Reach", "A wheel is " + Math.max(frame.aErr, frame.bErr).toFixed(1) + "\" past the 15\" leg", "bad"]);
    }
    fillRead("pairRead", cells);
  }

  function drawStairs(svg, X, Y, S, x0, x1, y0, y1, head) {
    const G = M.going;
    const H = M.rise;
    const floorR = G / 2;
    if (y0 <= 0 && y1 >= 0) line(svg, X(x0), Y(0), X(Math.min(x1, floorR)), Y(0), "#8d8374", 1.5);
    K.stairBoards(x0 - G, x1 + G).forEach(function (b) {
      if (b.x1 < x0 || b.x0 > x1 || b.y1 < y0 || b.y0 > y1) return;
      rect(svg, X(b.x0), Y(b.y1), (b.x1 - b.x0) * S, (b.y1 - b.y0) * S, "#e7dcc6", "#c3b49a");
      line(svg, X(b.x0), Y(b.y1 - H), X(b.x0), Y(b.y0), "#8d8374", 1.5);
    });
    const slot = G / 2 - M.wheelR;
    const i0 = Math.max(0, Math.floor(x0 / G) - 1);
    const i1 = Math.ceil(x1 / G) + 1;
    for (let i = i0; i <= i1; i++) {
      const y = i * H;
      if (y < y0 || y > y1) continue;
      const park = i * G;
      band(svg, X(park - slot), Y(y), X(park + slot), Y(y));
    }
    const step = Math.max(0, Math.floor((head.x + G / 2) / G));
    const tread = step * H;
    const xL = step === 0 ? -G / 2 : (step - 0.5) * G;
    const xR = (step + 0.5) * G;
    if (tread - 1.2 > y0) dim(svg, X(xL), Y(tread - 1.15), X(xR), Y(tread - 1.15), "9.5\" going");
    if (step >= 1) dimV(svg, X(xR + 1.3), Y(tread - H), Y(tread), "9.5\" rise");
  }

  function drawGravity(svg, com, X, Y) {
    const gy = K.groundY(com.x);
    line(svg, X(com.x), Y(com.y), X(com.x), Y(gy), "#9d2c2c", 1.25, "4 3");
    circle(svg, X(com.x), Y(com.y), 5.5, "#9d2c2c", "#fbf8f1");
    text(svg, X(com.x) + 8, Y(com.y) - 8, "CoM", "start");
  }

  function drawOneLeg(svg, pose, color, width, X, Y, S, name) {
    tube(svg, X(pose.hip.x), Y(pose.hip.y), X(pose.knee.x), Y(pose.knee.y), color, width);
    tube(svg, X(pose.knee.x), Y(pose.knee.y), X(pose.axle.x), Y(pose.axle.y), color, width);
    motorBox(svg, pose.knee.x, pose.knee.y, M.motorKnee.w, M.motorKnee.h, X, Y, S);
    wheel(svg, X(pose.axle.x), Y(pose.axle.y), M.wheelR * S, name === "L" ? "#e4ded2" : "#f4f1ea");
    circle(svg, X(pose.axle.x), Y(pose.axle.y), (M.motorWheelD / 2) * S, "#3e4c44", "#1b2430");
    joint(svg, X(pose.hip.x), Y(pose.hip.y));
    joint(svg, X(pose.knee.x), Y(pose.knee.y));
    text(svg, X(pose.knee.x) - 10, Y(pose.knee.y) - 8, name, "end");
  }

  function kneeWord(pose) {
    const ahead = pose.knee.x - pose.hip.x;
    let dir = "rear";
    if (ahead > 1.5) dir = "ahead";
    else if (ahead > -0.15) dir = "under the hip";
    return pose.poke.toFixed(1) + "\" " + dir;
  }

  function drawStair(svg, X, Y, S) {
    rect(svg, X(4.75), Y(9.5), (14.25 - 4.75) * S, 1 * S, "#e7dcc6", "#c3b49a");
    line(svg, X(-8), Y(0), X(4.75), Y(0), "#8d8374", 1.5);
    line(svg, X(4.75), Y(0), X(4.75), Y(8.5), "#8d8374", 1.5);
    band(svg, X(-4.75), Y(0), X(-3), Y(0));
    band(svg, X(3), Y(0), X(4.75), Y(0));
    band(svg, X(6.5), Y(9.5), X(4.75), Y(9.5));
    band(svg, X(12.5), Y(9.5), X(14.25), Y(9.5));
    dim(svg, X(-4.75), Y(-1.2), X(4.75), Y(-1.2), "9.5\" going");
    dimV(svg, X(16.2), Y(0), Y(9.5), "9.5\" rise");
    line(svg, X(-6), Y(24), X(6), Y(24), "#c8bfae", 1, "6 4");
    text(svg, X(-5.8), Y(24) - 4, "24\" envelope", "start");
  }

  function going() { return { x: M.going, y: M.rise + M.wheelR }; }

  function line(svg, x1, y1, x2, y2, color, w, dash) {
    const a = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": w, fill: "none" };
    if (dash) a["stroke-dasharray"] = dash;
    svg.appendChild(svgEl("line", a));
  }
  function rect(svg, x, y, w, h, fill, stroke) {
    svg.appendChild(svgEl("rect", { x: x, y: y, width: w, height: h, fill: fill, stroke: stroke, "stroke-width": 1.25 }));
  }
  function tube(svg, x1, y1, x2, y2, color, width) {
    svg.appendChild(svgEl("line", {
      x1: x1, y1: y1, x2: x2, y2: y2,
      stroke: color || "#1f4e79", "stroke-width": width || 8, "stroke-linecap": "round"
    }));
  }
  function wheel(svg, cx, cy, r, fill) {
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: r, fill: fill || "#f4f1ea", stroke: "#22282f", "stroke-width": 3 }));
  }
  function circle(svg, cx, cy, r, fill, stroke) {
    svg.appendChild(svgEl("circle", { cx: cx, cy: cy, r: r, fill: fill, stroke: stroke || "#1b2430", "stroke-width": 1.2 }));
  }
  function motorBox(svg, cx, cy, w, h, X, Y, S) {
    rect(svg, X(cx - w / 2), Y(cy + h / 2), w * S, h * S, "#4d5b55", "#1b2430");
  }
  function camMark(svg, cx, cy, X, Y, S) {
    const s = M.cam;
    rect(svg, X(cx - s / 2), Y(cy + s / 2), s * S, s * S, "#1b2430", "#1b2430");
    circle(svg, X(cx), Y(cy), 2.2, "#d7dee8", "#d7dee8");
  }
  function eyeMark(svg, cx, cy, X, Y, S) {
    const r = (M.eyeD / 2) * S;
    circle(svg, X(cx), Y(cy), r, "#141820", "#141820");
    circle(svg, X(cx), Y(cy), r * 0.55, "#e8f7ff", "#7fd0ff");
    circle(svg, X(cx - r * 0.18), Y(cy), r * 0.22, "#ff5a7a", "#ff5a7a");
    circle(svg, X(cx + r * 0.16), Y(cy + r * 0.08), r * 0.16, "#7dff9a", "#7dff9a");
  }
  function drawFaceSide(svg, hip, X, Y, S) {
    const front = hip.x + M.bodyLength / 2;
    const rear = hip.x - M.bodyLength / 2;
    const top = hip.y + M.bodyAboveHip;
    const mid = hip.y + M.bodyAboveHip * 0.55;
    rect(svg, X(front - 0.08), Y(mid + M.displayH / 2), 0.18 * S, M.displayH * S, "#101820", "#101820");
    eyeMark(svg, front - 0.2, mid - 1.2, X, Y, S);
    camMark(svg, front + 0.28, mid - 2.15, X, Y, S);
    camMark(svg, front + 0.28, mid - 2.7, X, Y, S);
    camMark(svg, hip.x + 1.6, top + 0.28, X, Y, S);
    camMark(svg, hip.x - 1.6, hip.y - 0.32, X, Y, S);
    camMark(svg, rear - 0.28, hip.y + 4.2, X, Y, S);
    camMark(svg, hip.x - 2.4, hip.y + 3.4, X, Y, S);
  }
  function drawLegPlan(svg, lateral, pose, X, Y, S, quiet) {
    const col = quiet ? "#8aa0b5" : "#1f4e79";
    line(svg, X(lateral), Y(pose.hip.x), X(lateral), Y(pose.knee.x), col, quiet ? 3 : 5);
    line(svg, X(lateral), Y(pose.knee.x), X(lateral), Y(pose.axle.x), col, quiet ? 3 : 5);
    wheelTop(svg, X(lateral), Y(pose.axle.x), S);
    rect(svg,
      X(lateral - M.motorWheelW / 2), Y(pose.axle.x + M.motorWheelD / 2),
      M.motorWheelW * S, M.motorWheelD * S, "#3e4c44", "#1b2430");
    rect(svg,
      X(lateral - M.motorKnee.t / 2), Y(pose.knee.x + M.motorKnee.w / 2),
      M.motorKnee.t * S, M.motorKnee.w * S, "#4d5b55", "#1b2430");
  }
  function drawFaceTop(svg, shift, hipFwd, X, Y, S) {
    const front = hipFwd + M.bodyLength / 2;
    const rear = hipFwd - M.bodyLength / 2;
    const hw = M.displayW / 2;
    rect(svg, X(shift - hw), Y(front - 0.08), M.displayW * S, 0.22 * S, "#101820", "#101820");
    [-1, 1].forEach(function (sgn) {
      eyeMark(svg, shift + sgn * (M.eyeGap / 2), front - 0.85, X, Y, S);
      camMark(svg, shift + sgn * (M.stereoGap / 2), front + 0.28, X, Y, S);
      camMark(svg, shift + sgn * (M.bodyWidth / 2 + 0.15), hipFwd, X, Y, S);
    });
    camMark(svg, shift, rear - 0.28, X, Y, S);
    camMark(svg, shift, hipFwd + 1.35, X, Y, S);
  }
  function wheelTop(svg, cx, cy, S) {
    const w = M.wheelWidth * S;
    const h = M.wheelOd * S;
    svg.appendChild(svgEl("rect", {
      x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 3,
      fill: "#f4f1ea", stroke: "#22282f", "stroke-width": 2
    }));
  }
  function joint(svg, x, y) {
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4.5, fill: "#fbf8f1", stroke: "#1b2430", "stroke-width": 1.5 }));
  }
  function cross(svg, x, y, color) {
    line(svg, x - 5, y, x + 5, y, color, 1.4);
    line(svg, x, y - 5, x, y + 5, color, 1.4);
  }
  function text(svg, x, y, str, anchor) {
    const t = svgEl("text", {
      x: x, y: y, fill: "#1b2430", "font-size": 11,
      "font-family": "ui-monospace, Cascadia Code, monospace",
      "text-anchor": anchor || "start"
    });
    t.textContent = str;
    svg.appendChild(t);
  }
  function band(svg, x1, y1, x2, y2) {
    line(svg, x1, y1, x2, y2, "#c4a15a", 4);
  }
  function dim(svg, x1, y, x2, y2, label) {
    line(svg, x1, y, x2, y2, "#9d2c2c", 1);
    line(svg, x1, y - 4, x1, y + 4, "#9d2c2c", 1);
    line(svg, x2, y2 - 4, x2, y2 + 4, "#9d2c2c", 1);
    text(svg, (x1 + x2) / 2, y - 6, label, "middle");
  }
  function dimV(svg, x, y1, y2, label) {
    line(svg, x, y1, x, y2, "#9d2c2c", 1);
    line(svg, x - 4, y1, x + 4, y1, "#9d2c2c", 1);
    line(svg, x - 4, y2, x + 4, y2, "#9d2c2c", 1);
    text(svg, x + 6, (y1 + y2) / 2, label, "start");
  }
  function fillRead(id, cells) {
    const box = document.getElementById(id);
    box.replaceChildren();
    cells.forEach(function (c) {
      const d = document.createElement("div");
      if (c[2]) d.className = c[2];
      const s = document.createElement("span");
      s.textContent = c[0];
      const b = document.createElement("strong");
      b.textContent = c[1];
      d.appendChild(s);
      d.appendChild(b);
      box.appendChild(d);
    });
  }

  function lockSliders(on) {
    [rHip, rKnee, lHip, lKnee, headX, headY, rWheelX, rWheelY, lWheelX, lWheelY].forEach(function (el) {
      el.disabled = on;
    });
  }

  function syncDrive() {
    document.getElementById("wheelDrive").hidden = pairDrive.value !== "wheels";
    const jointsOff = playing || pairDrive.value !== "joints";
    [rHip, rKnee, lHip, lKnee].forEach(function (el) { el.disabled = jointsOff; });
    [headX, headY, rWheelX, rWheelY, lWheelX, lWheelY].forEach(function (el) { el.disabled = playing; });
  }

  function stopPlay() {
    if (!playing) return;
    const p = playBase + (performance.now() - playT0) / PERIOD;
    held = { step: Math.floor(p), f: p - Math.floor(p), p: p };
    climb.value = String(p);
    playing = false;
    clearInterval(playTimer);
    pairPlay.textContent = "Play the climb";
    pairPlay.setAttribute("aria-pressed", "false");
    syncDrive();
  }

  function writeAngle(input, value) {
    if (value >= Number(input.min) && value <= Number(input.max)) input.value = String(value);
  }

  function setPair(right, left, hx, hy) {
    stopPlay();
    held = null;
    pairDrive.value = "joints";
    syncDrive();
    rHip.value = String(right.theta);
    rKnee.value = String(right.phi);
    lHip.value = String(left.theta);
    lKnee.value = String(left.phi);
    headX.value = String(hx);
    headY.value = String(hy);
  }
  const stepLeft = K.ik(-4, M.wheelR - stanceHip);
  document.getElementById("pairBalance").addEventListener("click", function () {
    setPair(
      { theta: M.balanceTheta, phi: M.balancePhi },
      { theta: M.balanceTheta, phi: M.balancePhi },
      0, stanceHip
    );
    draw();
  });
  document.getElementById("pairStep").addEventListener("click", function () {
    setPair(
      { theta: placeIk.theta, phi: placeIk.phi },
      { theta: stepLeft.theta, phi: stepLeft.phi },
      4, stanceHip
    );
    draw();
  });
  document.getElementById("pairCopy").addEventListener("click", function () {
    stopPlay();
    held = null;
    pairDrive.value = "joints";
    syncDrive();
    lHip.value = rHip.value;
    lKnee.value = rKnee.value;
    draw();
  });
  [rHip, rKnee, lHip, lKnee, headX, headY].forEach(function (el) {
    el.addEventListener("input", function () {
      if (playing || held || pairDrive.value === "climb") {
        if (playing) {
          playing = false;
          clearInterval(playTimer);
          pairPlay.textContent = "Play the climb";
          pairPlay.setAttribute("aria-pressed", "false");
        }
        held = null;
        pairDrive.value = "joints";
        syncDrive();
      }
      draw();
    });
  });
  [rWheelX, rWheelY, lWheelX, lWheelY].forEach(function (el) {
    el.addEventListener("input", function () {
      if (playing) {
        playing = false;
        clearInterval(playTimer);
        pairPlay.textContent = "Play the climb";
        pairPlay.setAttribute("aria-pressed", "false");
      }
      held = null;
      pairDrive.value = "wheels";
      syncDrive();
      draw();
    });
  });
  pairDrive.addEventListener("change", function () {
    if (pairDrive.value === "wheels") {
      const now = climbNow();
      stopPlay();
      held = null;
      const hipPt = { x: num(headX), y: num(headY) };
      const right = now ? K.climbFrame(now.step, now.f).right : K.atHip(num(rHip), num(rKnee), hipPt);
      const left = now ? K.climbFrame(now.step, now.f).left : K.atHip(num(lHip), num(lKnee), hipPt);
      if (now) {
        writeAngle(headX, right.hip.x);
        writeAngle(headY, right.hip.y);
      }
      rWheelX.value = String(right.axle.x);
      rWheelY.value = String(right.axle.y);
      lWheelX.value = String(left.axle.x);
      lWheelY.value = String(left.axle.y);
    } else if (pairDrive.value === "joints") {
      const now = climbNow();
      stopPlay();
      if (now) {
        const frame = K.climbFrame(now.step, now.f);
        writeAngle(rHip, frame.rightTheta);
        writeAngle(rKnee, frame.rightPhi);
        writeAngle(lHip, frame.leftTheta);
        writeAngle(lKnee, frame.leftPhi);
        writeAngle(headX, frame.left.hip.x);
        writeAngle(headY, frame.left.hip.y);
      }
      held = null;
    } else {
      stopPlay();
      const p = Number(climb.value) || 0;
      held = { step: Math.floor(p), f: p - Math.floor(p), p: p };
    }
    syncDrive();
    draw();
  });
  climb.addEventListener("input", function () {
    if (writingScrub) return;
    if (playing) {
      playing = false;
      clearInterval(playTimer);
      pairPlay.textContent = "Play the climb";
      pairPlay.setAttribute("aria-pressed", "false");
    }
    const p = Number(climb.value) || 0;
    held = { step: Math.floor(p), f: p - Math.floor(p), p: p };
    pairDrive.value = "climb";
    syncDrive();
    draw();
  });
  pairPlay.addEventListener("click", function () {
    if (playing) {
      stopPlay();
      pairDrive.value = "climb";
      syncDrive();
      draw();
      return;
    }
    const start = held ? held.p : Number(climb.value) || 0;
    playBase = start;
    playT0 = performance.now();
    playing = true;
    held = { step: Math.floor(start), f: start - Math.floor(start), p: start };
    pairDrive.value = "climb";
    pairPlay.textContent = "Stop";
    pairPlay.setAttribute("aria-pressed", "true");
    syncDrive();
    clearInterval(playTimer);
    playTimer = setInterval(function () {
      if (!playing) return;
      draw();
    }, 32);
  });
  setPair(
    { theta: M.balanceTheta, phi: M.balancePhi },
    { theta: M.balanceTheta, phi: M.balancePhi },
    0, stanceHip
  );

  const start = (location.hash || "#balance").slice(1);
  if (presets[start]) applyPose(start);
  else applyPose("balance");
  if (start === "step") {
    setPair(
      { theta: placeIk.theta, phi: placeIk.phi },
      { theta: stepLeft.theta, phi: stepLeft.phi },
      4, stanceHip
    );
    draw();
  }
  const climbHash = /^climb(?:=(\d+(?:\.\d+)?))?$/.exec(start);
  if (climbHash) {
    if (climbHash[1]) {
      const p = Number(climbHash[1]);
      climb.max = String(Math.max(4, Math.ceil(p + 1)));
      climb.value = String(p);
      held = { step: Math.floor(p), f: p - Math.floor(p), p: p };
      pairDrive.value = "climb";
      syncDrive();
      draw();
    } else {
      pairPlay.click();
    }
  }
  if (start === "wheel") {
    mode.value = "wheel";
    document.getElementById("jointAsk").hidden = true;
    document.getElementById("wheelAsk").hidden = false;
    hipLean.value = "4";
    wheelX.value = String(M.going);
    wheelY.value = String(M.rise + M.wheelR);
    draw();
  }
  if (start === "wheels") {
    stopPlay();
    held = null;
    pairDrive.value = "wheels";
    headX.value = "4";
    headY.value = String(stanceHip);
    rWheelX.value = String(M.going);
    rWheelY.value = String(M.rise + M.wheelR);
    lWheelX.value = "0";
    lWheelY.value = String(M.wheelR);
    syncDrive();
    draw();
  }
})();
