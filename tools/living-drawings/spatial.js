/* Shared spatial leg geometry. Inches, radians, kilograms; +X forward, +Y up,
   +Z right. Hip roll rotates the pitch/knee plane and the outboard axle spacer.
   IK returns an achievable pose AND its target residual; it never stretches links. */
(function (root) {
  "use strict";
  /* Torque limits are the locked actuator set's PEAK numbers (actuators.js, 2026-09-26).
     Rated (continuous) numbers live there too; the models report both. */
  const ACT = root.HuxActuators || require("./actuators.js");
  const limits = {
    roll: [-0.6, 0.6], hip: [-40 * Math.PI / 180, 170 * Math.PI / 180],
    knee: [0.2, 2.7],
    tauWheel: ACT.peak.wheel, tauHip: ACT.peak.hip, tauKnee: ACT.peak.knee, tauRoll: ACT.peak.roll,
    ratedWheel: ACT.rated.wheel, ratedHip: ACT.rated.hip, ratedKnee: ACT.rated.knee, ratedRoll: ACT.rated.roll
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const Tire = root.HuxTire || require("./tire.js");
  function create(M) {
    const offset = M.track / 2 - M.hipLateral;
    // Shared tire cross-section (tire.js): round crown by default. The sandbox collision hull
    // and mesh come from the same profile, so 2D and 3D agree on where the rubber touches.
    const tire = Tire.create({ R: M.wheelR, width: M.wheelWidth, crown: M.tireCrown, unit: "in" });
    function tireSupport(roll) {
      // Hip roll + leans the top of the leg toward +z; the contact walks the other way.
      const sp = tire.support(roll);
      return { y: -sp.depth, z: sp.z };
    }
    function fk(hip, side, q) {
      const c = Math.cos(q.roll), s = Math.sin(q.roll), L = M.link;
      function point(x, y, z) {
        return { x: hip.x + x, y: hip.y + c * y - s * z, z: hip.z + s * y + c * z };
      }
      const kx = -L * Math.sin(q.hip), ky = -L * Math.cos(q.hip);
      const ax = kx - L * Math.sin(q.hip - q.knee);
      const ay = ky - L * Math.cos(q.hip - q.knee);
      const knee = point(kx, ky, 0), ankle = point(ax, ay, 0), axle = point(ax, ay, side * offset);
      const support = tireSupport(q.roll);
      const contact = { x: axle.x, y: axle.y + support.y, z: axle.z + support.z };
      const reach = Math.hypot(ax, ay);
      return { hip: { ...hip }, knee, ankle, axle, contact, q: { ...q }, reach,
        extension: reach / (2 * L), hipHeight: hip.y - contact.y,
        poke: reach > 1e-8 ? Math.abs(ax * ky - ay * kx) / reach : 0 };
    }
    function ik(hip, target, side) {
      const dx = target.x - hip.x, dy = target.y - hip.y, dz = target.z - hip.z;
      const rho2 = dy * dy + dz * dz;
      const magnitude = Math.sqrt(Math.max(0, rho2 - offset * offset));
      // Both sagittal half-planes matter when a folded wheel rises above its hip.
      const candidates = [magnitude, -magnitude].map(down => {
        const roll = wrap(Math.atan2(dz, dy) - Math.atan2(side * offset, -down));
        const d = Math.hypot(dx, down);
        const half = Math.acos(clamp(d / (2 * M.link), -1, 1));
        const asked = { roll, hip: wrap(Math.atan2(-dx, down) + half), knee: 2 * half };
        const q = {}, violations = [];
        if (rho2 < offset * offset) violations.push("axle-offset reach");
        if (d > 2 * M.link + 1e-8) violations.push("leg reach");
        for (const key of ["roll", "hip", "knee"]) {
          q[key] = clamp(asked[key], limits[key][0], limits[key][1]);
          if (Math.abs(q[key] - asked[key]) > 1e-8) violations.push(key + " travel");
        }
        const got = fk(hip, side, q);
        return Object.assign(got, { target: { ...target }, requested: asked,
          err: distance(got.axle, target), violations });
      });
      candidates.sort((a, b) => a.err - b.err || a.violations.length - b.violations.length);
      return candidates[0];
    }

    function project(frame, P) {
      const body = { x: frame.left.hip.x, y: frame.left.hip.y, z: -(frame.latLeft || 0) * M.track / 2 };
      const result = { body, legs: {}, issues: [] };
      for (const [name, side] of [["left", -1], ["right", 1]]) {
        const raw = frame[name];
        const hip = { x: body.x, y: body.y, z: body.z + side * M.hipLateral };
        const requestedAxle = raw.requestedAxle || raw.axle;
        const target = { x: requestedAxle.x, y: requestedAxle.y, z: side * M.track / 2 };
        let leg = ik(hip, target, side);
        // Preserve requested tread contact height as the tire cambers.
        const wantsContact = frame[name + "Down"] === true;
        if (wantsContact) {
          for (let n = 0; n < 8; n++) {
            target.y = raw.contact.y - tireSupport(leg.q.roll).y;
            leg = ik(hip, target, side);
          }
        }
        leg.wantsContact = wantsContact;
        leg.contactError = wantsContact ? leg.contact.y - raw.contact.y : null;
        result.legs[name] = leg;
        if (leg.err > 0.02) result.issues.push(name + " target missed by " + leg.err.toFixed(2) + " in");
        leg.violations.forEach(v => result.issues.push(name + " " + v));
      }
      return measure(result, P);
    }
    function measure(result, P) {
      const body = result.body;
      const left = result.legs.left, right = result.legs.right;
      const lumps = [
        { m: M.mass.body, p: { x: body.x + P.bodyCom, y: body.y + M.bodyAboveHip * 0.45, z: body.z }, owner: "body" },
        ...["left", "right"].flatMap(name => {
          const leg = result.legs[name];
          return [{ m: M.mass.hips / 2, p: leg.hip, owner: name },
            { m: M.mass.knee, p: leg.knee, owner: name }, { m: M.mass.wheel, p: leg.axle, owner: name }];
        })
      ];
      const kg = lumps.reduce((s, a) => s + a.m, 0);
      result.com = { kg, x: 0, y: 0, z: 0 };
      lumps.forEach(a => ["x", "y", "z"].forEach(k => { result.com[k] += a.m * a.p[k] / kg; }));
      // Free-body moment of body plus opposite leg about the planted hip.
      // This is the gravity holding demand IF the opposite foot is unsupported.
      result.rollHoldingNm = {};
      for (const name of ["left", "right"]) {
        const axis = result.legs[name].hip;
        result.rollHoldingNm[name] = lumps.filter(a => a.owner !== name)
          .reduce((t, a) => t + a.m * M.g * (a.p.z - axis.z) * 0.0254, 0);
      }
      result.tippingNm = {
        left: kg * M.g * (result.com.z - left.contact.z) * 0.0254,
        right: kg * M.g * (result.com.z - right.contact.z) * 0.0254
      };
      result.valid = result.issues.length === 0;
      return result;
    }
    return { fk, ik, project, measure, tireSupport, tire, offset, crown: tire.crown, limits };
  }
  const api = { create, limits, distance };
  root.HuxSpatial = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
