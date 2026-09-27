/* Shared drawing primitives for the sheets (sheet.js, sheet2.js): the same look as app.js.
   Inches on the model side; frame() maps them to SVG pixels at S px per inch. */
(function (root) {
  "use strict";
  let S = 18; /* px per inch, the same scale as the working drawings; frame() may set another for a zoomed view */
  /* ---------- svg primitives (same look as app.js) ---------- */
  function el(name, attrs) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
    return n;
  }
  function frame(svg, x0, x1, y0, y1, scale) {
    S = scale || 18;
    const w = (x1 - x0) * S, h = (y1 - y0) * S;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.replaceChildren();
    return { X: x => (x - x0) * S, Y: y => (y1 - y) * S, w, h };
  }
  function line(svg, x1, y1, x2, y2, color, w, dash) {
    const a = { x1, y1, x2, y2, stroke: color || "#243044", "stroke-width": w || 1, fill: "none" };
    if (dash) a["stroke-dasharray"] = dash;
    svg.appendChild(el("line", a));
  }
  function rect(svg, x, y, w, h, fill, stroke, dash) {
    const a = { x, y, width: w, height: h, fill, stroke: stroke || "#1b2430", "stroke-width": 1.25 };
    if (dash) a["stroke-dasharray"] = dash;
    svg.appendChild(el("rect", a));
  }
  /* a box in model inches: centre (cx, cy), size w × h, on a frame */
  function box(svg, F, cx, cy, w, h, fill, stroke, dash) {
    rect(svg, F.X(cx - w / 2), F.Y(cy + h / 2), w * S, h * S, fill, stroke, dash);
  }
  function tube(svg, x1, y1, x2, y2, color, width) {
    svg.appendChild(el("line", { x1, y1, x2, y2, stroke: color || "#1f4e79", "stroke-width": width || 8, "stroke-linecap": "round" }));
  }
  function circle(svg, cx, cy, r, fill, stroke, w) {
    svg.appendChild(el("circle", { cx, cy, r, fill, stroke: stroke || "#1b2430", "stroke-width": w || 1.2 }));
  }
  function joint(svg, x, y) { circle(svg, x, y, 4.5, "#fbf8f1", "#1b2430", 1.5); }
  function cross(svg, x, y, color) {
    line(svg, x - 6, y, x + 6, y, color, 1.4); line(svg, x, y - 6, x, y + 6, color, 1.4);
    circle(svg, x, y, 3.5, "none", color, 1.2);
  }
  let FS = 1; /* per-view font scale: a view with a small viewBox is displayed larger, so its type shrinks */
  function text(svg, x, y, str, anchor, size, color) {
    const t = el("text", { x, y, fill: color || "#1b2430", "font-size": (size || 11) * FS, "font-family": "ui-monospace, Cascadia Code, monospace", "text-anchor": anchor || "start" });
    t.textContent = str; svg.appendChild(t);
  }
  function note(svg, x, y, str, color) { text(svg, x, y, str, "start", 10.5, color || "#5e6a78"); }
  const DIM = "#9d2c2c";
  function dimH(svg, x1, x2, y, label, above) {
    line(svg, x1, y, x2, y, DIM, 1);
    line(svg, x1, y - 4, x1, y + 4, DIM, 1); line(svg, x2, y - 4, x2, y + 4, DIM, 1);
    text(svg, (x1 + x2) / 2, above === false ? y + 13 : y - 5, label, "middle", 11, DIM);
  }
  function dimV(svg, x, y1, y2, label, left) {
    line(svg, x, y1, x, y2, DIM, 1);
    line(svg, x - 4, y1, x + 4, y1, DIM, 1); line(svg, x - 4, y2, x + 4, y2, DIM, 1);
    text(svg, left ? x - 6 : x + 6, (y1 + y2) / 2 + 4, label, left ? "end" : "start", 11, DIM);
  }
  function ext(svg, x1, y1, x2, y2) { line(svg, x1, y1, x2, y2, DIM, 0.6, "2 3"); }
  function centreline(svg, x1, y1, x2, y2) { line(svg, x1, y1, x2, y2, "#5e6a78", 0.8, "10 4 2 4"); }
  function wheelSide(svg, cx, cy, r) { circle(svg, cx, cy, r, "#f4f1ea", "#22282f", 3); }
  function motor(svg, F, cx, cy, w, h, label) {
    box(svg, F, cx, cy, w, h, "#4d5b55", "#1b2430");
    if (label) text(svg, F.X(cx), F.Y(cy - Math.min(0.55, h / 2 - 0.3)) + 4, label, "middle", 9.5, "#fbf8f1");
  }
  function leg(svg, F, p, color, width) {
    tube(svg, F.X(p.hip.x), F.Y(p.hip.y), F.X(p.knee.x), F.Y(p.knee.y), color, width);
    tube(svg, F.X(p.knee.x), F.Y(p.knee.y), F.X(p.axle.x), F.Y(p.axle.y), color, width);
  }
  const fmt = (v, d) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(d === undefined ? 1 : d);
  const inch = (v, d) => fmt(v, d) + "\"";
  const nm = v => fmt(v, 1) + " N·m";

  function fill(id, cells) {
    const host = document.getElementById(id);
    host.replaceChildren();
    cells.forEach(([k, v, kind]) => {
      const d = document.createElement("div");
      if (kind) d.className = kind;
      const s = document.createElement("strong"); s.textContent = k;
      d.appendChild(s); d.appendChild(document.createTextNode(v));
      host.appendChild(d);
    });
  }
  root.HuxDraw = { get S() { return S; }, el, frame, line, rect, box, tube, circle, joint, cross, text, note, dimH, dimV, ext, centreline, wheelSide, motor, leg, fill, fmt, inch, nm,
    setFS: v => { FS = v; }, DIM };
})(typeof window !== "undefined" ? window : globalThis);
