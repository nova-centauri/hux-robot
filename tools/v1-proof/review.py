#!/usr/bin/env python3
"""V1-PROOF budget and preliminary sizing, standard library only. No dynamics claim."""
import argparse
import json
import math
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("model.json")
PLAN = ROOT / "tools/living-drawings/plan-data.json"
G = 9.81


def money(value):
    """Keep missing receipt amounts distinct from a recorded zero charge."""
    return "Not recorded" if value is None else f"${value:,.2f}"


def purchase_quantities(version):
    """Count recorded order items, without treating unknown quantities as zero."""
    counts = {}
    orders = version.get("orders")
    for part_id in ("pololu-4752", "pololu-4035", "st3215"):
        part = next((p for p in version.get("purchases", []) if p["id"] == part_id), {})
        planned = part.get("plannedQuantity")
        quantities = [item.get("quantity") for order in orders or []
                      for item in order["items"] if item["partId"] == part_id]
        known = isinstance(orders, list) and all(type(q) is int and q >= 0 for q in quantities)
        ordered = sum(quantities) if known else None
        if type(planned) is not int or planned < 0:
            planned = None
        missing = None if planned is None or ordered is None else max(0, planned - ordered)
        counts[part_id] = {"planned": planned, "ordered": ordered, "missing": missing}
    return counts


def quantity_summary(counts):
    motor, driver, servo = (counts[key] for key in ("pololu-4752", "pololu-4035", "st3215"))
    show = lambda value: "Not recorded" if value is None else str(value)
    units = lambda value, name: f"{name} count not recorded" if value is None else f"{value} {name}{'' if value == 1 else 's'}"
    coverage = (f"Recorded wheel orders cover {show(motor['ordered'])} of {show(motor['planned'])} motors and "
                f"{show(driver['ordered'])} of {show(driver['planned'])} drivers. "
                f"Not covered by recorded orders: {units(motor['missing'], 'motor')} and {units(driver['missing'], 'driver')}.")
    if motor["missing"] == 0 and driver["missing"] == 0 and motor["planned"] == driver["planned"] == 2:
        wheel = "The full wheel motor/driver pair is ordered. Delivery and qualification remain separate gates."
    elif motor["ordered"] == driver["ordered"] == 1 and motor["planned"] == driver["planned"] == 2:
        wheel = "The first restrained bench channel is ordered. The second wheel channel is still required."
    else:
        wheel = "Recorded quantities do not yet establish a complete wheel motor/driver pair."
    legs = (f"Recorded leg orders cover {show(servo['ordered'])} of {show(servo['planned'])} ST3215 servos, "
            f"with {show(servo['missing'])} still needed.")
    return [f"**{coverage}** {wheel} Confirm the total received driver count before you buy another driver.", "", legs]


def purchase_report(c, plan):
    version = next(version for version in plan["versions"] if version["id"] == "V1-PROOF")
    orders = version["orders"]
    ids = [order["id"] for order in orders]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate purchase order would double-count spend")

    def amount(value):
        return None if value is None else Decimal(str(value))

    def total(values):
        values = list(values)
        return None if not values or any(v is None for v in values) else sum(values, Decimal(0))

    for order in orders:
        if order["currency"] != "USD":
            raise ValueError("V1-PROOF budget requires a recorded USD cost")
        items = total(None if item.get("unitCost") is None or item.get("quantity") is None else
                      amount(item["unitCost"]) * item["quantity"] for item in order["items"])
        goods = amount(order.get("merchandiseCost"))
        charges = total(amount(order.get(key)) for key in ("merchandiseCost", "shippingCost", "taxCost"))
        paid = amount(order.get("paidTotal"))
        if items is not None and goods is not None and items != goods:
            raise ValueError(f"Item costs do not reconcile for {order['id']}")
        if charges is not None and paid is not None and charges != paid:
            raise ValueError(f"Order charges do not reconcile for {order['id']}")
    totals = {key: total(amount(order.get(key)) for order in orders)
              for key in ("merchandiseCost", "shippingCost", "taxCost", "paidTotal")}
    freight_tax = total([totals["shippingCost"], totals["taxCost"]])
    original = report(c)
    remaining = {
        "parts": None if totals["merchandiseCost"] is None else amount(original["parts_cap_usd"]) - totals["merchandiseCost"],
        "shippingTax": None if freight_tax is None else amount(c["budget"]["shipping_tax_usd"]) - freight_tax,
        "total": None if totals["paidTotal"] is None else amount(original["total_cap_usd"]) - totals["paidTotal"],
    }
    return {"orders": orders, "totals": totals, "remaining": remaining,
            "quantities": purchase_quantities(version)}


def remaining_shopping_list(version):
    counts = purchase_quantities(version)
    items = []
    for item in version.get("shoppingList", []):
        part = counts.get(item.get("partId"))
        if part is None:
            items.append(item)
            continue
        missing = part["missing"]
        if missing == 0:
            continue
        need = "Confirm remaining quantity" if missing is None else f"{missing} more {item['unit']}{'' if missing == 1 else 's'}"
        items.append({**item, "need": need, "status": "check-stock" if missing is None else item["status"]})
    return items


def purchase_lines(c, plan):
    p = purchase_report(c, plan)
    t, remaining = p["totals"], p["remaining"]
    lines = [f"**Recorded spend: {money(t['paidTotal'])}. Remaining against the planning ceiling: {money(remaining['total'])}.** The remaining money includes all unfinished purchases and the reserves. It is not a quote for completion.", "",
             "## Ordered parts and delivery", "", "| Vendor / ordered part | Ordered quantity | Unit paid | Goods total | Order status |", "| --- | ---: | ---: | ---: | --- |"]
    for order in p["orders"]:
        for item in order["items"]:
            qty, unit = item.get("quantity"), item.get("unitCost")
            cost = None if qty is None or unit is None else Decimal(str(unit)) * qty
            delivery = item.get("status", order["status"])
            status = {"shipped": "Shipped", "ordered": "Paid; awaiting shipment", "received": "Received; untested", "awaiting-arrival": "Awaiting arrival"}.get(delivery, delivery)
            lines.append(f"| {order['vendor']} {item['name']} | {qty if qty is not None else 'Not recorded'} | {money(unit)} | {money(cost)} | {status} |")
    lines += [""]
    lines += [f"- **{order['vendor']}:** {order['deliveryNote']}" for order in p["orders"]]
    lines += [""] + quantity_summary(p["quantities"])
    lines[-1] += " When the servos arrive, make sure that the labels say 12 V. The receipt names the ST3215 series. The user confirmed the voltage variant. [Motor connections and controls](v1-proof-hardware.md)."
    lines += ["",
              "## Recorded order totals", "", "| Vendor / recorded date | Goods | Shipping / handling | Tax | Order total |", "| --- | ---: | ---: | ---: | ---: |"]
    for order in p["orders"]:
        tax = money(order.get("taxCost"))
        if order.get("taxCost") == 0:
            tax += " separately charged"
        order_date = f"{order['paidOn']} (paid)" if order.get("paidOn") else (f"{order['orderedOn']} (ordered)" if order.get("orderedOn") else "Not recorded")
        lines.append(f"| {order['vendor']} / {order_date} | {money(order.get('merchandiseCost'))} | {money(order.get('shippingCost'))} | {tax} | **{money(order.get('paidTotal'))}** |")
    lines += [f"| **Recorded spend** | **{money(t['merchandiseCost'])}** | **{money(t['shippingCost'])}** | **{money(t['taxCost'])}** | **{money(t['paidTotal'])}** |", "",
              "Recorded order totals count each purchase one time. The reference prices below are historical. A payment-service confirmation confirms its vendor order, and we do not count it again. An order-placement date does not establish the payment date. Missing amounts stay unrecorded, never zero. An order total without itemized charges can establish the overall spend while the separate goods and shipping/tax balances remain unknown.", "",
              "Refer to the [purchase evidence](purchases.md) and the [inventory](parts-on-hand.md) for the delivery and qualification gates.", "",
              "## Remaining planning allocations", "", "| Allocation | Not yet spent |", "| --- | ---: |",
              f"| Parts and fixture allowance | {money(remaining['parts'])} |",
              f"| Shipping, tax and import-charge allowance | {money(remaining['shippingTax'])} |",
              f"| Repair and overrun reserve retained | {money(c['budget']['repair_contingency_usd'])} |",
              f"| **Remaining against the planning ceiling** | **{money(remaining['total'])}** |", "",
              "Refer to the inventory for the controller and IMU receipt status. The servo interface, encoder level conversion, current-limit passives, wheels/hubs, protected power and wire harness still need confirmation. Bench-supply ratings remain unconfirmed. Historical carts and unassigned V0-GENESIS parts are not recorded V1-PROOF spend.", ""]
    version = next(version for version in plan["versions"] if version["id"] == "V1-PROOF")
    if version.get("shoppingList"):
        lines += ["## Remaining shopping list", "", version["shoppingSummary"], "",
                  "| Part / assembly | What remains | Next step |", "| --- | --- | --- |"]
        for item in remaining_shopping_list(version):
            status = plan["statusLabels"].get(item["status"], item["status"])
            lines.append(f"| {item['name']} | {item['need']}. {item['note']} | {status} |")
        lines += ["", "The original planning caps below cover the full build allocations. The allocations include parts already bought. Missing parts still need quotes or confirmed reuse.", ""]
    return lines


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


def outputs(c, plan=None):
    r = report(c)
    b = c["budget"]
    sources = {s["id"]: s for s in c["sources"]}
    if plan is None:
        plan = json.loads(PLAN.read_text())
    lines = ["# V1-PROOF budget", "", f"**${r['total_cap_usd']:,.0f} planned ceiling. The ceiling includes shipping, tax and the repair contingency.** The hard limit is strictly under $1,000. The recorded orders below are committed V1-PROOF spend. The previous stair budget is [parked](archive/stair-v1/bom.md).", ""]
    lines += purchase_lines(c, plan)
    lines += ["## Original planning caps", "",
             "We keep these maximum allocations for comparison with the actual spend. They are not a fully quoted remaining cart. Delivery, import charges and unpurchased rows need current quotes. The plan assumes the shop tools on hand and unpaid fabrication labor. New tools or outsourced work must fit this same total, or the design must change. Refer to the [hardware decisions](v1-proof-hardware.md).", "",
             "**The plan assumes no free inventory.** The confirmed reuse credit is $0. The quantities below are planned build quantities, not ordered quantities. Paid purchases already consume these allocations. Do not add their cost to the $900 ceiling, and do not subtract them again as free reuse.", "",
             "Give credit for qualified equipment on hand only when it displaces a purchase. Retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.", "",
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
              f"The difference to $1,000 is ${r['headroom_usd']:.0f}. If you spend the full difference, you violate the strictly-under-$1,000 requirement. Prefer savings from reuse. Do not change savings into added features.", "",
              "## Historical reference prices and scope", "",
              "We checked the price and availability observations that follow on **2026-09-28**. They are not current stock checks or evidence of more purchases. The receipt table above controls the actual spend.", "",
              "- Pololu 4752 gearmotor: the reference price is $60.95 each. Two of the selected encoder motors fit the $125 allocation. The report above calculates the current purchased quantities and the remaining needs.",
              "- DRV8874 driver (Pololu 4035): the reference price is $11.94 each. Two carriers plus the current-limit passives fit the $40 allowance. The current-limit passives still need confirmation. Measure the 2.5 A limit. The historical stock page permitted backorders. This driver replaces the oversized G2 reference.",
              "- ST3215 servo (Waveshare ST3215 series): the reference price is $16.99–21.99 as a function of the variant. The receipt prices are recorded above. Qualify the hold performance on the regulated 9 V rail. The $60 allocation remains the original cap, with a separate transmission row.",
              "- The original allocation for the Pico 2, the Adafruit LSM6DSOX 4438 and the half-duplex adapter was $40. The IMU reference price on September 28 was $11.95. The October 2 controller/IMU order instead names the SparkFun LSM6DSO IMU. That order has a $30.58 combined total and no itemized charges. The servo interface remains unconfirmed. Keep the original cap and record the remaining costs separately.",
              "- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.", "",
              "## Build sequence", "",
              "P0 makes an inventory of the controls on hand and qualifies them. P1 builds the supported wheel rig and the pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos and their reductions. P4 runs the finish-line trials.", "",
              "These stages share one budget. Do not add a second two-motor robot to the four-motor cost. A quote that exceeds an allocation consumes the reserve or forces a substitution before purchase.", "",
              "Sources: the planning caps are in [model.json](../tools/v1-proof/model.json). The paid orders are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. Refer to the [receipt provenance](purchases.md). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).", ""]
    wheel = r["wheel_at_max_mass"]
    calc = ["# V1-PROOF sizing screen", "", f"The source of this screen is [model.json](../tools/v1-proof/model.json), revision {c['revision']}. All masses and geometry are allocations. **Hardware validation and fabrication release remain false.**", "",
            "## Geometry and load assumptions", "",
            "Each side has one four-bar parallelogram with two equal parallel links. The vertical separation of the links is the same at the body and at the wheel carrier. Each side has one bearing-supported driven pivot and a 3:1 belt reduction. The servo shaft does not carry the robot. Both wheel contacts stay on level ground. The positive link angle is rearward from the downward vertical.", "",
            "The dimensions refer to an upright chassis. A robot that balances needs a pitch trim that changes with the pose.", "",
            "For link length L and angle q: the axle rearward offset = L sin(q). The pivot above the axle = L cos(q). The body top = wheel radius + L cos(q) + body allocation. Link angles of 15–45 degrees stay clear of the straight-link toggle.", "",
            f"- The upright height is {r['poses'][1]['overall_height_mm']:.1f}–{r['poses'][0]['overall_height_mm']:.1f} mm. The outside wheel width is {r['overall_width_mm']:.0f} mm.",
            f"- The nominal height travel is {r['height_travel_mm']:.2f} mm. The axle sweep is {r['axle_fore_aft_travel_mm']:.2f} mm. The servo travel is 90 degrees through the 3:1 reduction.",
            "- The axle sweep changes the center of mass relative to the contact line. Movement of both wheels alone does not remove that static offset. Measure the whole-robot CoM and set a pitch trim for each height. Make sure that the trim stays in the balance envelope. Start with pinned legs. If the trim is excessive, reduce the travel or revise the linkage inside this budget.", "",
            "## Leg sizing", "",
            "Use all robot mass as sprung mass for a conservative vertical-load screen: servo torque = m g share L sin(q) / (reduction × efficiency). The assumed efficiency is 0.85. A 60/40 load split is the worst planned two-wheel condition, not a single-support claim.", "",
            f"At 3.0 kg, 60% load on one side and 45 degrees: **{r['worst_static_servo_nm']:.3f} N·m** at the servo. The requirement is a **0.75 N·m mounted hold for 10 minutes**, plus a separately qualified 1.0 N·m short transient. The screen uses no spring credit. We must measure acceleration, horizontal forces, bearing friction and real efficiency. A 30 kg-cm (~2.94 N·m) advertised maximum is not a continuous rating.", "",
            "## Wheel sizing", "",
            "With a 100 mm wheel: rpm = speed / radius × 60 / (2 pi). Preliminary demand per wheel = m × [g tan(10 degrees) + 0.03 g] × radius / 2 × 2.5. The final multiplier gives a preliminary allowance for omitted inertia and losses. It is not inverse dynamics or a stability proof.", "",
            f"At 3.0 kg and 0.5 m/s: **{wheel['rpm']:.1f} rpm**, **{wheel['demand_nm_per_wheel']:.3f} N·m** screen demand per wheel. A linear 12 V reference model evaluated at {wheel['screen_voltage_v']:.1f} V and a proposed 2.5 A current limit gives **{wheel['available_peak_nm_estimate']:.3f} N·m**. This is a feasibility estimate, not a usable continuous rating or a measured catch margin.", "",
            "Qualify at least a 0.50 N·m short peak at 96 rpm in the actual installation. Also qualify 0.15 N·m continuous in the actual installation. Do both at the minimum operating voltage. At the start, limit the RMS motor current to 1.2 A and the short peak to 2.5 A. Bench measurements must set the safe pulse duration, the temperature limits and the controller gains.", "",
            "The 9.9 V value is a loaded-voltage assumption of this sizing screen. The selected pack sets its actual low-voltage threshold. Smaller robots fall faster, and gearbox friction/backlash can defeat otherwise adequate torque numbers.", "",
            "## Mass allocation", "", "| Item | kg |", "| --- | ---: |"]
    calc += [f'| {row["item"]} | {row["kg"]:.2f} |' for row in c["mass_items"]]
    calc += [f"| **Total including unallocated allowance** | **{r['mass_allocation_kg']:.2f}** |", "",
             "The 3.0 kg limit is a redesign threshold. Reweigh after each stage. Do not add a Pi, a cosmetic shell or a larger battery and quietly consume the control margin.", "",
             "## Evidence and limits", "",
             "We checked these official references on 2026-09-28:", ""]
    calc += [f'- [{src["title"]}]({src["url"]}): {src["note"]}' for src in c["sources"]]
    calc += ["", "This sizing screen does not validate full solid clearance, belt engagement, bearing life, strength, measured CoM/inertia, contact friction, battery protection, control timing or thermal duty. The separate [closed-loop simulation report](v1-proof-simulation.md) covers pinned-leg maneuver and disturbance trials with explicit limitations. Powered height motion and all physical acceptance tests remain open. Refer to the [build checklist](checklists/mechanical-v1.md).", ""]
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
