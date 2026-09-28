"""Generate the review's simple dimensioned layout, landing page and budget table."""
import html
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def publish(c, r):
    h = c["head"]
    colors = ["#dfb876", "#8cb7a6", "#94b6d2", "#c4aad6", "#d5b2a4", "#d39da6"]
    svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="970" viewBox="0 0 1180 970">',
           '<rect width="1180" height="970" fill="#fff"/>',
           '<style>text{font-family:Arial,sans-serif;fill:#1d2936;font-size:14px}.title{font-size:25px;font-weight:bold}.small{font-size:12px}.dim{stroke:#b14328;fill:none;stroke-width:1}.shell{fill:none;stroke:#28435b;stroke-width:2}</style>']

    def text(x, y, label, cls="", anchor="start"):
        svg.append(f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{html.escape(label)}</text>')

    text(35, 42, "PARKED STAIR-V1 / H1 HEAD PACKAGING", "title")
    text(35, 69, f"{c['revision']} | millimetres | nominal allocations, NOT fabrication drawings")
    text(35, 93, "Candidate: 2.26 kg head; hip motors excluded. Stair architecture and actuator procurement remain HOLD.")
    s = 1.75
    views = [("FRONT: +Y left, +Z up", 295, 355, 1, 2, -1, -1),
             ("SIDE: +X forward, +Z up", 895, 355, 0, 2, 1, -1),
             ("PLAN: +X forward/up, +Y left", 295, 690, 1, 0, -1, -1)]
    for name, ox, oy, a, b, sa, sb in views:
        text(ox - 225, oy - (205 if a == 1 and b == 0 else 215), name)
        def rectangle(lo, hi, fill="none", stroke="#28435b", opacity=1):
            xa, xb = [ox + sa * q[a] * s for q in [lo, hi]]
            ya, yb = [oy + sb * q[b] * s for q in [lo, hi]]
            svg.append(f'<rect x="{min(xa,xb):.2f}" y="{min(ya,yb):.2f}" width="{abs(xb-xa):.2f}" height="{abs(yb-ya):.2f}" fill="{fill}" stroke="{stroke}" opacity="{opacity}"/>')
        for key in ["upper_box_mm", "lower_core_mm", "top_cap_mm"]:
            rectangle(h[key]["min"], h[key]["max"])
        band = h["hip_cassette_mm"]
        rectangle([band["x"][0], -band["half_width"], band["z"][0]], [band["x"][1], band["half_width"], band["z"][1]])
        for side in [-1, 1]:
            center = [h["roll_motor_center_x_mm"], side * c["leg"]["hip_half_spacing_mm"], 0]
            size = [45.5, 78.5, 78.5]
            rectangle([x-y/2 for x,y in zip(center,size)], [x+y/2 for x,y in zip(center,size)], "#e1e5e8")
        for i, zone in enumerate(h["zones"]):
            center, size = zone["center_mm"], zone["size_mm"]
            rectangle([x-y/2 for x,y in zip(center,size)], [x+y/2 for x,y in zip(center,size)], colors[i], opacity=0.65)
            text(ox + sa * center[a] * s, oy + sb * center[b] * s + 4, str(i+1), anchor="middle")
        svg.append(f'<path d="M{ox-7},{oy}h14 M{ox},{oy-7}v14" stroke="#b14328"/>')
        text(ox + 10, oy + 18, "O", "small")
    # Explicit dimension lines / values, positioned outside the projected geometry.
    left, right = 295 - band['half_width'] * s, 295 + band['half_width'] * s
    svg += [f'<path class="dim" d="M{left} 452H{right} M{left} 446v12 M{right} 446v12"/>',
            '<path class="dim" d="M718 452H1073 M718 446v12 M1073 446v12"/>',
            '<path class="dim" d="M1102 180V433.75 M1096 180h12 M1096 433.75h12"/>']
    text(295, 444, f"{2 * band['half_width']} lower cassette", anchor="middle")
    text(295, 164, "177.8 cap / 120 middle bay", anchor="middle")
    text(895, 444, "203.2 overall depth", anchor="middle")
    text(1110, 282, "145")
    text(690, 493, "H1 DESIGN ALLOCATIONS")
    for i, zone in enumerate(h["zones"]):
        y = 528 + i * 48
        svg.append(f'<rect x="690" y="{y-14}" width="16" height="16" fill="{colors[i]}"/>')
        text(720, y, f'{i+1}. {zone["id"].replace("_", " ")}')
        text(720, y + 18, " x ".join(str(v) for v in zone["size_mm"]) + " mm reservation", "small")
    text(690, 822, "Hip axes: Y +/-76.2, Z 0; fore-aft.")
    text(690, 847, "Top: +100. Cassette floor: -45.")
    text(690, 872, "Hip motors forward; rear leg sweep kept open.")
    text(35, 925, "Not shown: bearings, bolts, connector bends, spring paths, swept joints and validated cooling. These remain release gates.")
    text(35, 950, "Generated from tools/engineering/baseline.json. O = hip-center datum. Gray boxes = RS02 reference housings.")
    svg.append('</svg>')
    (ROOT / "cad/layouts/head-h1.svg").write_text("\n".join(svg) + "\n")

    bom = json.loads((ROOT / "tools/engineering/bom.json").read_text())
    low, high = [sum(row["qty"] * row["unit_usd"][i] for row in bom["rows"]) for i in [0, 1]]
    lines = ["# Bill of materials — procurement review, 2026-09-28", "",
             "**No Hux components purchased or ordered. No order is being placed.** Earlier order-now and free-inventory totals are superseded by Steve's clarification. Prior discussion of a cart was not evidence of purchase.", "",
             "**Actuator-set purchase: HOLD.** The current stair design fails single-support/geometry gates. Read [the head and leg review](head-and-leg-review.md) before selecting parts. Ten actuators below are a costed research candidate, not a recommendation to buy all ten.", "",
             f"Complete candidate allowance: **${low:,}–{high:,}**, before shipping/tax. These are **unverified planning prices**, not quotes. The old $1,140/$1,640 totals omitted or contradicted necessary items. All previously assumed shop stock, compute, receiver and charging equipment are included until ownership is confirmed.", "",
             "The eight-motor reference was $1,120 at its old point estimates; two reference ankle motors add $320. Extra motors alone do not solve the stair mechanism. Hip/knee transmissions or replacement actuators may increase this budget. Labor, machining services and test fixtures are excluded. Jetson and seven-camera coverage are excluded.", "",
             "| Qty | Item | Unit allowance | Line allowance | Stage / acceptance condition |", "| ---: | --- | ---: | ---: | --- |"]
    for row in bom["rows"]:
        a, b = row["unit_usd"]
        lines.append(f'| {row["qty"]} | {row["item"]} | ${a}–{b} | ${row["qty"]*a}–{row["qty"]*b} | **{row["stage"]}** — {row["gate"]} |')
    lines += [f"| | **Total** | | **${low:,}–{high:,}** | Not a released cart |", "",
              "## Sensible purchase sequence", "",
              "1. First resolve the load path and make a full-size cardboard/stock fixture of the head, joints, tire envelope and stair. No motor purchase is required to expose collisions or impossible reach.",
              "2. Once the mechanism closes, select one representative motor plus the controller/IMU/CAN/power bench harness. RS02 remains a useful test candidate, but its stationary 6 N·m fixture reference does not qualify the preferred candidate’s hip/knee loads; include the intended reduction or test a different candidate.",
              "3. Buy one real tire/contact assembly only after its diameter, actual contact spacing and rim/valve clearance are resolved. Two existing 1.25-inch treads do not fit the 80 mm candidate footprint with 60 mm contact-center spacing.",
              "4. Release the remaining axes and final battery only after mounted thermal tests, independent bearing design, a measured support footprint and full step geometry pass. Buy electronics needed for that bench, not perception hardware.", "",
              "## Sources and updates", "",
              "Canonical budget rows: [`tools/engineering/bom.json`](../tools/engineering/bom.json). Regenerate this table with `python3 tools/engineering/review.py --write`. Prices are allowances retained or introduced for budgeting; supplier stock and quotes must be checked at purchase. [Manufacturer engineering references](head-and-leg-review.md#evidence-and-reproducibility) support specifications, not these prices.", "",
              "Inventory confirmation lives in [parts-on-hand.md](parts-on-hand.md). Package masses and installed positions live separately in [`baseline.json`](../tools/engineering/baseline.json); budget rows must not be added again to the mass budget.", ""]
    # The stair publisher must never replace the active V1-PROOF budget.
    archive_bom = ROOT / "docs/archive/stair-v1/bom.md"
    def archive_link(match):
        url = match.group(1)
        if re.match(r"(?:[a-z]+:|#|/)", url):
            return match.group(0)
        path, separator, anchor = url.partition("#")
        resolved = (ROOT / "docs" / path).resolve()
        return "](" + os.path.relpath(resolved, archive_bom.parent) + (separator + anchor if separator else "") + ")"
    archived_text = re.sub(r"\]\(([^)]+)\)", archive_link, "\n".join(lines))
    archive_bom.parent.mkdir(parents=True, exist_ok=True)
    archive_bom.write_text("> **PARKED STAIR-V1.** [V1-PROOF](../../v1-proof.md) is active; this generated budget is historical.\n\n" + archived_text)
    comparison = [("24-inch / wide entry", r["stair_candidate"]),
                  ("24-inch / narrow entry", r["narrow_24inch_comparison"]),
                  ("25-inch / narrow entry", r["narrow_25inch_comparison"]),
                  ("26-inch / wide entry", r["taller_narrow_landing_comparison"]),
                  ("27-inch / wide entry", r["extended_candidate"]),
                  ("26-inch / narrow entry — preferred study", r["preferred_candidate"]),
                  ("26-inch narrow / +0.60 kg", r["preferred_high_mass_comparison"]),
                  ("27-inch / narrow entry", r["narrow_candidate"])]
    rows = "".join(f'<tr><td>{name}</td><td>{v["failed_frames"]} / {v["sample_count"]}</td><td>{v["clearance_flagged_frames"]}</td><td>{v["peak_abs_gravity_nm"]["roll"]:.2f} N·m</td><td>{v["max_lateral_span_mm"]:.0f} mm</td><td>HOLD</td></tr>' for name, v in comparison)
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hux engineering review</title><link rel="stylesheet" href="style.css"></head><body><main class="page">
<header class="mast"><div><p class="kicker">Hux / {c['revision']}</p><h1>Head and leg engineering review</h1><p>Keep the step objective. Reopen the legs before buying the actuator set.</p><nav class="pages"><a href="engineering.html" aria-current="page">Engineering review</a><a href="sheet.html">Legacy Sheet 1</a><a href="sheet2.html">Legacy Sheet 2</a><a href="sim.html">Legacy sandbox</a><a href="../../docs/head-and-leg-review.md">Full analysis</a><a href="../../docs/bom.md">BOM</a></nav></div></header>
<section class="block"><p class="callout"><b>No components purchased. Stair procurement is on hold.</b> A successful short hop does not establish controlled one-leg support or a full step. The ten-axis alternative below is a candidate, not a validated fix.</p><h2>Calculated screening results</h2><div class="table-wrap"><table><thead><tr><th>Case</th><th>Failed geometry samples</th><th>Clearance flags</th><th>Peak gravity hip roll</th><th>Modeled span</th><th>Release</th></tr></thead><tbody>{rows}</tbody></table></div><p>The wide-entry cases require a large sideways head excursion. The 26-inch narrow-entry candidate connects its poses and passes 810 interpolated reach/limited-clearance/width samples, with {r['preferred_candidate']['interpolation_screen']['max_com_error_mm']:.2f} mm maximum modeled COM residual. Its nominal {r['preferred_candidate']['max_lateral_span_mm']:.1f} mm span has almost no allowance below 14 inches; it is not a manufactured-envelope guarantee. The actual ankle mechanism, full solid collisions, timing, dynamics and mounted thermal duty remain unvalidated.</p></section>
<section class="block"><h2>H1 head allocation</h2><p>203.2 mm deep, 120 mm middle bay, 177.8 mm top-cap width, {r['head']['guarded_cassette_width_mm']:.0f} mm lower cassette. Top +100 mm and cassette floor −45 mm from the hips. Estimated head mass 2.26 kg; CoM ({r['head']['com_mm'][0]:.2f}, 0, +{r['head']['com_mm'][2]:.2f}) mm. Shortening the head permits longer legs, but the compact candidate still fails the step screen.</p><img src="../../cad/layouts/head-h1.svg" alt="Dimensioned front, side and plan views of candidate H1 head packaging" style="display:block;width:100%;height:auto"></section>
<section class="block"><h2>What changes before a purchase</h2><p>Establish finite lateral contact width and a torque-transmitting ankle, solve the real ankle orientation and linkage, time and validate the connected path with full collisions, then test mounted torque/temperature and actual contact behavior. A loose swivel and a wider tire do not by themselves solve balance.</p><p>Complete ten-axis candidate budget: <b>${low:,}–{high:,}</b> before shipping/tax. Includes charging, power, bearings, frame stock and harnesses. Prices are planning allowances.</p><p><a href="../../docs/head-and-leg-review.md">Full findings, equations, sources and release gates</a> · <a href="../../docs/research/head-leg-results.json">Machine-readable results</a> · <a href="../../docs/decisions.md">Decision log</a></p></section></main></body></html>'''
    page = page.replace("<body>", '<body><script src="engineering-status.js"></script>')
    page = page.replace("../../docs/bom.md", "../../docs/archive/stair-v1/bom.md")
    page = page.replace("<title>Hux engineering review</title>", "<title>Parked stair engineering review</title>")
    (ROOT / "tools/living-drawings/engineering.html").write_text(page + "\n")
