/* Hux tire profile. One definition of the tread cross-section, shared by the 2D projection
   (spatial.js), the Rapier collision hull and the compliant tread ring (sim-core.js), and the
   Three.js mesh (sim-view.js). Unit-agnostic: pass every length in the same unit.

   Cross-section in the (u, r) plane: u along the axle, r radial from the axle.
     tread arc:   circle of radius `crown` centred at (0, R - crown). With crown = width / 2 the
                  tread is a full round (motorcycle / scooter profile) and the equator is the
                  widest point of the tire. A larger crown radius is a flatter dome, clipped at
                  |u| = width / 2 and blended into the sidewall by a `shoulder` round.
     sidewall:    from the equator down to the bead.

   Contact: a rigid crown touches the ground at one point that walks around the crown as the
   wheel cambers, so the contact stays on rubber instead of catching an edge. The pad a real
   carcass makes comes from compliance, modelled in sim-core.js as a tread ring on a spring;
   pad() estimates its size from the deflection for the readouts. */
(function (root) {
  "use strict";

  function create(opt) {
    const R = opt.R;
    const width = opt.width;
    const crown = Math.min(opt.crown || width / 2, 50 * width);
    const shoulder = Math.min(opt.shoulder || Math.min(crown, width / 2) * 0.25, width / 2);
    const bead = opt.bead || R * 0.62;
    const full = crown <= width / 2 + 1e-9; /* round profile: the arc reaches the equator */
    const halfTread = full ? crown : width / 2;

    /* Radial height of the tread arc at axial position u (|u| <= halfTread). */
    function domeR(u) {
      const c = Math.max(0, crown * crown - u * u);
      return (R - crown) + Math.sqrt(c);
    }

    /* Outer profile as a polyline of {u, r}, equator to equator over the top, plus the
       sidewall down to the bead on each side. n points across the tread. */
    function profile(n) {
      n = n || 33;
      const pts = [];
      if (full) {
        /* round: arc from -125° to +125° about the tube centre, then straight to the bead */
        const a0 = 125 * Math.PI / 180;
        const uMax = crown * Math.sin(Math.min(a0, Math.PI / 2));
        pts.push({ u: -Math.min(uMax, width / 2) * 0.9, r: bead });
        for (let i = 0; i <= n; i++) {
          const a = -a0 + 2 * a0 * i / n;
          pts.push({ u: crown * Math.sin(a), r: (R - crown) + crown * Math.cos(a) });
        }
        pts.push({ u: Math.min(uMax, width / 2) * 0.9, r: bead });
      } else {
        /* dome clipped at the width, rounded shoulders of radius `shoulder`, then sidewall */
        const uS = width / 2 - shoulder; /* where the shoulder round starts */
        const rS = domeR(uS);
        pts.push({ u: -(width / 2) * 0.85, r: bead });
        pts.push({ u: -width / 2, r: rS - shoulder });
        for (let i = 0; i <= 8; i++) { /* left shoulder quarter-round */
          const a = Math.PI + (Math.PI / 2) * i / 8;
          pts.push({ u: -uS + shoulder * Math.cos(a), r: rS - shoulder + shoulder * Math.sin(a) });
        }
        for (let i = 1; i < n; i++) {
          const u = -uS + 2 * uS * i / n;
          pts.push({ u: u, r: domeR(u) });
        }
        for (let i = 0; i <= 8; i++) {
          const a = Math.PI / 2 - (Math.PI / 2) * i / 8;
          pts.push({ u: uS + shoulder * Math.cos(a), r: rS - shoulder + shoulder * Math.sin(a) });
        }
        pts.push({ u: width / 2, r: rS - shoulder });
        pts.push({ u: (width / 2) * 0.85, r: bead });
      }
      return pts;
    }

    /* Convex-hull core rings plus one rounding radius, for a rounded convex collider. The
       hull offset outward by `round` reproduces the tread arc and shoulders. */
    function hull(core) {
      core = core || 0.001 * (opt.unit === "in" ? 1 / 0.0254 : 1);
      const rings = [];
      let round;
      if (full) {
        /* two rings 2·core apart, rounded by crown − core: outer radius R, width 2·crown */
        round = crown - core;
        rings.push({ u: -core, r: R - round }, { u: core, r: R - round });
      } else {
        round = shoulder;
        const uS = width / 2 - shoulder;
        const k = 6;
        for (let i = 0; i <= k; i++) {
          const u = -uS + 2 * uS * i / k;
          rings.push({ u: u, r: domeR(u) - shoulder });
        }
      }
      return { rings: rings, round: round };
    }

    /* Rigid contact for a wheel cambered by gamma (rad, + leans the top toward +z).
       Returns the lowest tread point relative to the axle centre: depth below the centre and
       lateral offset along +z. Numeric over the profile, so it is right for any shape. */
    function support(gamma) {
      const c = Math.cos(gamma), s = Math.sin(gamma);
      const pts = profile(48);
      let best = null;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.r < R - crown - 1e-9 && !full) continue;
        const depth = p.r * c + p.u * s;
        if (!best || depth > best.depth) best = { depth: depth, z: p.u * c - p.r * s, u: p.u, r: p.r };
      }
      return best;
    }
    /* Same, from the y component of the wheel's axle direction (sin of the camber). */
    function supportFromAxisY(axisY) {
      return support(Math.asin(Math.max(-1, Math.min(1, axisY))));
    }

    /* Contact pad estimate for a compliant carcass: deflection under `load` on stiffness `k`
       (same length unit as R; k in force per length). Ellipse from the two curvatures. */
    function pad(load, k, gamma) {
      const d = Math.max(0, load / k);
      const sp = support(gamma || 0);
      const rTread = R;                 /* rolling curvature at the contact */
      const rCross = full ? crown : (Math.abs(sp.u) < width / 2 - shoulder - 1e-9 ? crown : shoulder);
      return {
        deflection: d,
        length: 2 * Math.sqrt(Math.max(0, 2 * rTread * d - d * d)),
        width: Math.min(width, 2 * Math.sqrt(Math.max(0, 2 * rCross * d - d * d))),
        crossRadius: rCross
      };
    }

    return {
      R: R, width: width, crown: crown, shoulder: shoulder, bead: bead, full: full, halfTread: halfTread,
      profile: profile, hull: hull, support: support, supportFromAxisY: supportFromAxisY, pad: pad, domeR: domeR
    };
  }

  const api = { create: create };
  root.HuxTire = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
