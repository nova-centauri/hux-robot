#!/usr/bin/env python3
"""V1-PROOF budget and preliminary sizing, standard library only. No dynamics claim."""
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("model.json")
G = 9.81


def geometry(c, angle_deg):
    g = c["geometry"]
    a = math.radians(angle_deg)
    drop = g["link_length_mm"] * math.cos(a)
    return {
        "angle_deg": angle_deg,
        "axle_rearward_mm": g["link_length_mm"] * math.sin(a),
        "pivot_above_axle_mm": drop,
        "overall_height_mm": g["wheel_diameter_mm"] / 2 + drop + g["body_above_lower_pivot_mm"],
        "servo_from_neutral_deg": (angle_deg - g["neutral_angle_deg"]) * g["leg_reduction"],
    }


def leg_torque(c, mass_kg, angle_deg, share):
    """Conservative vertical load: all robot mass is treated as sprung mass.

    q is link angle from downward vertical. tau = F * |dh/dq| / (ratio * eta).
    Omits acceleration, friction changes and joint/belt elasticity. Both wheels down.
    """
    g = c["geometry"]
    return mass_kg * G * share * g["link_length_mm"] / 1000 * math.sin(math.radians(angle_deg)) / (g["leg_reduction"] * g["transmission_efficiency_assumed"])


def wheel_screen(c, mass_kg, speed_ms):
    s = c["wheel_screen"]
    radius = c["geometry"]["wheel_diameter_mm"] / 2000
    rpm = abs(speed_ms) / radius * 60 / (2 * math.pi)
    voltage_fraction = c["power"]["screen_min_v"] / s["reference_v"]
    free_rpm = s["no_load_rpm"] * voltage_fraction
    # Linear DC approximation at minimum loaded voltage; not a measured torque curve.
    at_speed = max(0, s["stall_extrapolation_nm"] * voltage_fraction * (1 - rpm / free_rpm))
    nm_per_a = s["stall_extrapolation_nm"] / (s["stall_extrapolation_a"] - s["no_load_a"])
    at_current = max(0, nm_per_a * (s["proposed_peak_current_limit_a"] - s["no_load_a"]))
    acceleration = G * math.tan(math.radians(s["lean_screen_deg"]))
    demand = mass_kg * (acceleration + G * s["rolling_resistance_assumed"]) * radius / 2 * s["demand_multiplier"]
    available = min(at_speed, at_current)
    return {"rpm": rpm, "screen_voltage_v": c["power"]["screen_min_v"], "no_load_rpm": free_rpm,
            "demand_nm_per_wheel": demand, "available_peak_nm_estimate": available,
            "current_limited_nm_estimate": at_current, "passes_preliminary_screen": available >= demand,
            "hardware_validated": False}


def report(c):
    g, b = c["geometry"], c["budget"]
    poses = [geometry(c, a) for a in g["leg_angle_deg"]]
    parts = sum(row["qty"] * row["unit_cap_usd"] for row in b["rows"])
    # No speculative reuse discount is permitted in the conservative budget.
    total = parts + b["shipping_tax_usd"] + b["repair_contingency_usd"]
    mass = sum(row["kg"] for row in c["mass_items"])
    hold = leg_torque(c, c["limits"]["mass_max_kg"], max(g["leg_angle_deg"]), c["leg_screen"]["worst_two_wheel_load_share"])
    return {"name": c["name"], "revision": c["revision"], "actuator_count": sum(c["actuators"].values()),
            "parts_cap_usd": parts, "total_cap_usd": total,
            "headroom_usd": c["limits"]["budget_usd_exclusive"] - total,
            "under_budget": total < c["limits"]["budget_usd_exclusive"],
            "mass_allocation_kg": mass, "within_mass_limit": mass <= c["limits"]["mass_max_kg"],
            "overall_width_mm": g["wheel_track_mm"] + g["wheel_width_mm"],
            "poses": poses, "height_travel_mm": poses[0]["overall_height_mm"] - poses[1]["overall_height_mm"],
            "axle_fore_aft_travel_mm": poses[1]["axle_rearward_mm"] - poses[0]["axle_rearward_mm"],
            "worst_static_servo_nm": hold,
            "wheel_at_target_mass": wheel_screen(c, c["limits"]["mass_target_kg"], c["limits"]["speed_ms"]),
            "wheel_at_max_mass": wheel_screen(c, c["limits"]["mass_max_kg"], c["limits"]["speed_ms"]),
            "hardware_validated": False, "fabrication_ready": False}


def svg(c, r):
    g = c["geometry"]
    a = geometry(c, g["neutral_angle_deg"])
    radius = g["wheel_diameter_mm"] / 2
    # Each view is an orthographic envelope sketch, with common 1.1 px/mm scale.
    s = 1.1
    def side(x, angle, color, dash=""):
        p = geometry(c, angle)
        hip_z = radius + p["pivot_above_axle_mm"]
        ground = 435
        def z(v): return ground - v * s
        axle_x = x - p["axle_rearward_mm"] * s
        upper_z = hip_z + g["pivot_separation_mm"]
        carrier_top = radius + g["pivot_separation_mm"]
        return f'''<g stroke="{color}" fill="none" stroke-width="3" {dash}>
<rect x="{x-(g['body_depth_mm']-5)*s}" y="{z(hip_z+g['body_above_lower_pivot_mm'])}" width="{g['body_depth_mm']*s}" height="{g['body_above_lower_pivot_mm']*s}" rx="8"/>
<path d="M{x} {z(hip_z)} L{axle_x} {z(radius)} L{axle_x} {z(carrier_top)} L{x} {z(upper_z)} Z"/>
<circle cx="{axle_x}" cy="{z(radius)}" r="{radius*s}"/>
<circle cx="{x}" cy="{z(hip_z)}" r="5"/><circle cx="{x}" cy="{z(upper_z)}" r="5"/>
</g>'''
    width = r["overall_width_mm"]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="700" viewBox="0 0 1120 700" role="img" aria-labelledby="title desc">
<title id="title">Hux V1-PROOF envelope and linkage study</title><desc id="desc">Side, front and plan of a four actuator, flat floor proof robot. 110 millimetre parallel links provide 28.5 millimetres of nominal height adjustment. These are planning envelopes, not fabrication drawings.</desc>
<rect width="1120" height="700" fill="#f7f6f0"/>
<style>text{{font-family:Arial,sans-serif;fill:#21332f;font-size:15px}}.title{{font-size:27px;font-weight:bold}}.label{{font-size:12px;letter-spacing:1.5px}}.small{{font-size:13px}}</style>
<text x="35" y="45" class="title">V1-PROOF / FOUR ACTUATORS. FLAT FLOOR.</text>
<text x="35" y="72">{c['revision']} · millimetres · 2.5 kg target / 3.0 kg maximum · preliminary layout</text>
<text x="40" y="94" class="label">SIDE / EXTENDED &amp; LOW</text>
{side(242, 15, '#1f6558')}{side(242, 45, '#b87642', 'stroke-dasharray="7 5"')}
<path d="M35 435H360 M430 435H775" stroke="#62756d"/>
<text x="42" y="469">Height: {r['poses'][1]['overall_height_mm']:.0f}–{r['poses'][0]['overall_height_mm']:.0f}</text>
<text x="42" y="493">Two 110 links / 40 pivot spacing per side</text>
<text x="42" y="517">Leg angle 15–45° / servo reduction 3:1</text>
<text x="42" y="541">Height travel {r['height_travel_mm']:.1f}; axle sweep {r['axle_fore_aft_travel_mm']:.1f}</text>
<text x="42" y="565" class="small">Pitch trim must follow the axle sweep.</text>
<text x="452" y="94" class="label">FRONT / NEUTRAL</text>
<rect x="{602-g['body_width_mm']*s/2}" y="{435-a['overall_height_mm']*s}" width="{g['body_width_mm']*s}" height="{150*s}" rx="8" fill="#dfe9e1" stroke="#1f6558" stroke-width="2"/>
<path d="M542 260L475.5 335 M662 260L728.5 335" stroke="#1f6558" stroke-width="8"/>
<rect x="{602-(g['wheel_track_mm']+g['wheel_width_mm'])*s/2}" y="325" width="{g['wheel_width_mm']*s}" height="110" rx="8" fill="#21332f"/>
<rect x="{602+(g['wheel_track_mm']-g['wheel_width_mm'])*s/2}" y="325" width="{g['wheel_width_mm']*s}" height="110" rx="8" fill="#21332f"/>
<text x="452" y="469">{width:.0f} outside width / {g['wheel_track_mm']} axle track</text>
<text x="452" y="493">100 × 25 rubber wheels</text>
<text x="452" y="517">Body envelope 110 wide × 120 deep</text>
<text x="452" y="541" class="small">Two wheels remain loaded. No roll joints.</text>
<text x="830" y="94" class="label">PLAN / NEUTRAL</text>
<rect x="854" y="170" width="121" height="132" rx="8" fill="#dfe9e1" stroke="#1f6558" stroke-width="2"/>
<rect x="774.25" y="181" width="27.5" height="110" rx="8" fill="#21332f"/>
<rect x="1027.25" y="181" width="27.5" height="110" rx="8" fill="#21332f"/>
<path d="M802 236H854 M975 236H1027" stroke="#1f6558" stroke-width="6"/>
<text x="804" y="347" class="small">Motor and bearing packages</text>
<text x="804" y="368" class="small">still need measured fit.</text>
<path d="M35 598H1085" stroke="#bccbc0"/>
<text x="35" y="625">First assembly: pin both legs, balance with two wheel motors. Add powered height adjustment after that works.</text>
<text x="35" y="650" class="small">Belts, bearings, cable bends, motor envelopes and rest skids require detailed layout. Body shown upright for geometry only.</text>
<text x="35" y="674" class="small">No stairs, one-wheel stance, jumping or autonomy. This drawing does not establish balance, strength or clearance.</text>
</svg>\n'''


def outputs(c):
    r = report(c)
    b = c["budget"]
    sources = {s["id"]: s for s in c["sources"]}
    lines = ["# V1-PROOF budget", "", f"**${r['total_cap_usd']:,.0f} planned ceiling, including shipping, tax and repair contingency.** The hard limit is strictly under $1,000. No purchases made by this revision. The previous stair budget is [parked](archive/stair-v1/bom.md).", "",
             "These are maximum allocations, not a fully quoted cart. Known motor/driver/servo references fit their rows at the listed prices checked 2026-09-28; stock, delivery, import charges and all other rows still need quotes. Existing shop tools and unpaid fabrication labor are assumed; new tools or outsourced work must fit this same total or the design must change.", "",
             "**No free inventory is assumed.** Confirmed reuse credit is $0. Replace a row's cash cost only after the exact usable item is confirmed in [parts-on-hand.md](parts-on-hand.md); retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.", "",
             "| Qty | Item | Unit cap | Total cap | Stage |", "| ---: | --- | ---: | ---: | --- |"]
    for row in b["rows"]:
        item = row["item"]
        if "source" in row:
            item = f'[{item}]({sources[row["source"]]["url"]})'
        lines.append(f'| {row["qty"]} | {item} | ${row["unit_cap_usd"]:.2f} | ${row["qty"]*row["unit_cap_usd"]:.2f} | {row["stage"]} |')
    lines += [f"| | **Parts and fixture subtotal** | | **${r['parts_cap_usd']:.2f}** | |",
              f"| | Shipping, sales tax and any import charges | | ${b['shipping_tax_usd']:.2f} | Reserved |",
              f"| | Repairs, replacement parts and overrun reserve | | ${b['repair_contingency_usd']:.2f} | Reserved |",
              f"| | **Total** | | **${r['total_cap_usd']:.2f}** | |", "",
              f"The difference to $1,000 is ${r['headroom_usd']:.0f}; spending the entire difference would violate the strictly-under-$1,000 requirement. Prefer savings from reuse; do not turn them into added features.", "",
              "## Reference prices and scope", "",
              "- Pololu 4752: $60.95 each; two encoder motors fit the $125 allocation. A reference for sizing, not an order.",
              "- Pololu G2 18v17: $44.95 each; two fit the $100 driver allowance. Verify hardware current limiting at the intended low setting; the factory threshold does not protect these motors.",
              "- Waveshare ST3215 series: listed $16.99–21.99 depending on variant. Two 12 V class servos fit the $60 allocation. Continuous holding performance is unverified; budget includes a separate transmission row.",
              "- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.", "",
              "## Build sequence", "",
              "P0 inventories and qualifies existing controls. P1 builds the supported wheel rig and pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos/reductions. P4 runs the finish-line trials. These stages share one budget; do not add a second two-motor robot to the four-motor cost. Quotes exceeding an allocation consume the reserve or force a substitution before purchase.", "",
              "Source: [model.json](../tools/v1-proof/model.json). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).", ""]
    wheel = r["wheel_at_max_mass"]
    calc = ["# V1-PROOF sizing screen", "", f"Generated from [model.json](../tools/v1-proof/model.json), revision {c['revision']}. All masses and geometry are allocations. **Hardware validation and fabrication release remain false.**", "",
            "## Geometry and load assumptions", "",
            "One four-bar parallelogram per side: two equal parallel links, with vertical separation equal at body and wheel carrier. One bearing-supported driven pivot and a 3:1 belt reduction per side; the servo shaft does not carry the robot. Both wheel contacts stay on level ground. Positive link angle is rearward from downward vertical. Dimensions refer to an upright chassis; a balancing robot needs pose-dependent pitch trim.", "",
            "For link length L and angle q: axle rearward offset = L sin(q); pivot above axle = L cos(q); body top = wheel radius + L cos(q) + body allocation. Link angles 15–45 degrees avoid the straight-link toggle.", "",
            f"- Upright height {r['poses'][1]['overall_height_mm']:.1f}–{r['poses'][0]['overall_height_mm']:.1f} mm; outside wheel width {r['overall_width_mm']:.0f} mm.",
            f"- Nominal height travel {r['height_travel_mm']:.2f} mm; axle sweep {r['axle_fore_aft_travel_mm']:.2f} mm. Servo travel is 90 degrees through the 3:1 reduction.",
            "- The axle sweep changes the center of mass relative to the contact line. Moving both wheels does not by itself remove that static offset. Measure whole-robot CoM and set a pitch trim for each height; verify it remains within the balancing envelope. Begin with pinned legs. If trim is excessive, reduce travel or revise the linkage inside this budget.", "",
            "## Leg sizing", "",
            "Use all robot mass as sprung mass for a conservative vertical-load screen: servo torque = m g share L sin(q) / (reduction × efficiency). Efficiency is an assumed 0.85. A 60/40 load split is the worst planned two-wheel condition, not a single-support claim.", "",
            f"At 3.0 kg, 60% load on one side and 45 degrees: **{r['worst_static_servo_nm']:.3f} N·m** at the servo. Require **0.75 N·m mounted hold for 10 minutes**, plus a separately qualified 1.0 N·m short transient. No spring credit is used. Acceleration, horizontal forces, bearing friction and real efficiency require measurement. A 30 kg-cm (~2.94 N·m) advertised maximum is not a continuous rating.", "",
            "## Wheel sizing", "",
            "With a 100 mm wheel: rpm = speed / radius × 60 / (2 pi). Preliminary demand per wheel = m × [g tan(10 degrees) + 0.03 g] × radius / 2 × 2.5. The final multiplier provides preliminary allowance for omitted inertia and losses; it is not inverse dynamics or a stability proof.", "",
            f"At 3.0 kg and 0.5 m/s: **{wheel['rpm']:.1f} rpm**, **{wheel['demand_nm_per_wheel']:.3f} N·m** screening demand per wheel. A linear 12 V reference model evaluated at {wheel['screen_voltage_v']:.1f} V and a proposed 2.5 A current limit gives **{wheel['available_peak_nm_estimate']:.3f} N·m**. This is a feasibility estimate, not a usable continuous rating or a measured catch margin.", "",
            "Qualify at least 0.50 N·m short peak at 96 rpm and 0.15 N·m continuous in the actual installation, both at minimum operating voltage. Initially cap RMS motor current at 1.2 A and short peak at 2.5 A; bench measurements must establish safe pulse duration, temperature limits and controller gains. The 9.9 V value is a loaded-voltage sizing assumption; the selected pack determines its actual low-voltage threshold. Smaller robots fall faster, and gearbox friction/backlash can defeat otherwise adequate torque numbers.", "",
            "## Mass allocation", "", "| Item | kg |", "| --- | ---: |"]
    calc += [f'| {row["item"]} | {row["kg"]:.2f} |' for row in c["mass_items"]]
    calc += [f"| **Total including unallocated allowance** | **{r['mass_allocation_kg']:.2f}** |", "",
             "The 3.0 kg limit is a redesign threshold. Reweigh after each stage. Do not add a Pi, cosmetic shell or larger battery by quietly consuming control margin.", "",
             "## Evidence and limits", "",
             "Official references checked 2026-09-28:", ""]
    calc += [f'- [{src["title"]}]({src["url"]}): {src["note"]}' for src in c["sources"]]
    calc += ["", "The model does not validate full solid clearance, belt tooth engagement, bearing life, frame strength, CoM/inertia, contact friction, battery protection, control timing, thermal duty or closed-loop balance. Those checks are staged in the [build checklist](checklists/mechanical-v1.md). No simulated success or completed physical test is claimed.", ""]
    return {
        ROOT / "docs/bom.md": "\n".join(lines),
        ROOT / "docs/v1-proof-sizing.md": "\n".join(calc),
        ROOT / "tools/v1-proof/results.json": json.dumps(r, indent=2) + "\n",
        ROOT / "cad/layouts/v1-proof.svg": svg(c, r),
        ROOT / "tools/living-drawings/proof-data.js": "/* Generated by tools/v1-proof/review.py; edit model.json. */\nwindow.HuxProof = " + json.dumps({"model": c, "results": r}, indent=2) + ";\n",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    c = json.loads(CONFIG.read_text())
    if args.write or args.check:
        stale = []
        for path, content in outputs(c).items():
            if args.write:
                path.write_text(content)
            elif not path.exists() or path.read_text() != content:
                stale.append(str(path.relative_to(ROOT)))
        if stale:
            raise SystemExit("Stale generated outputs: " + ", ".join(stale))
    r = report(c)
    print(f"{r['name']}: ${r['total_cap_usd']:.0f} including reserves; {r['mass_allocation_kg']:.2f} kg allocated; {r['actuator_count']} actuators. Hardware unvalidated.")
    if not r["under_budget"] or not r["within_mass_limit"]:
        raise SystemExit("Planning limits exceeded; revise the model before proceeding.")


if __name__ == "__main__":
    main()
