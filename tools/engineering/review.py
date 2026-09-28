#!/usr/bin/env python3
"""Reproducible PRELIMINARY engineering screen, Python standard library only.

This is quasi-static FK/IK and gravity, NOT contact dynamics or a released gait.
Coordinates: mm, X forward, Y left, Z up. Torques/inertias: SI.
Run: python3 tools/engineering/review.py --write
"""
import argparse
import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("baseline.json")
G = 9.81


def add(a, b):
    return [x + y for x, y in zip(a, b)]


def sub(a, b):
    return [x - y for x, y in zip(a, b)]


def mid(a, b):
    return [(x + y) / 2 for x, y in zip(a, b)]


def rx(p, r):
    c, s = math.cos(r), math.sin(r)
    return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]


def wrap(a):
    return math.atan2(math.sin(a), math.cos(a))


def mass_properties(items):
    mass = sum(i["kg"] for i in items)
    com = [sum(i["kg"] * i["center_mm"][j] for i in items) / mass for j in range(3)]
    inertia = [[0.0] * 3 for _ in range(3)]
    for i in items:
        d = [v / 1000 for v in sub(i["center_mm"], com)]
        size = [v / 1000 for v in i.get("size_mm", [0, 0, 0])]
        for j in range(3):
            for k in range(3):
                inertia[j][k] += i["kg"] * ((sum(v * v for v in d) if j == k else 0) - d[j] * d[k])
            inertia[j][j] += i["kg"] * (sum(v * v for v in size) - size[j] ** 2) / 12
    return {"mass_kg": mass, "com_mm": com, "inertia_com_kg_m2": inertia}


def bounds(zone):
    return [[c - s / 2, c + s / 2] for c, s in zip(zone["center_mm"], zone["size_mm"])]


def overlaps(a, b, clearance=0):
    return all(min(hi, hj) - max(lo, lj) > -clearance for (lo, hi), (lj, hj) in zip(bounds(a), bounds(b)))


def segment_box_distance(a, b, lo, hi):
    """Exact distance from a segment to an axis-aligned box (infinite faces OK).

    Squared distance is quadratic between the parameters where the segment
    crosses a box face. Minimize every interval, including its endpoints.
    """
    d = sub(b, a)
    cuts = {0.0, 1.0}
    for i in range(3):
        if abs(d[i]) > 1e-12:
            for bound in [lo[i], hi[i]]:
                t = (bound - a[i]) / d[i]
                if 0 < t < 1:
                    cuts.add(t)
    cuts = sorted(cuts)
    best = float("inf")
    for t0, t1 in zip(cuts, cuts[1:]):
        center = (t0 + t1) / 2
        terms = []
        for i in range(3):
            value = a[i] + center * d[i]
            if value < lo[i]:
                terms.append((-d[i], lo[i] - a[i]))
            elif value > hi[i]:
                terms.append((d[i], a[i] - hi[i]))
        aa = sum(x*x for x, y in terms)
        ab = sum(x*y for x, y in terms)
        minimum = max(t0, min(t1, -ab/aa)) if aa else center
        best = min(best, *(sum((x*t+y)**2 for x, y in terms) for t in [t0, t1, minimum]))
    return math.sqrt(best)


def head_report(c):
    h = c["head"]
    zones = h["zones"]
    conflicts = [[a["id"], b["id"]] for i, a in enumerate(zones) for b in zones[i + 1:] if overlaps(a, b)]
    # Open connection between the narrow lower bay and upper enclosure. Check
    # every cell cut by enclosure faces, rather than just eight zone corners.
    wall = h["wall_mm"]
    upper, lower = h["upper_box_mm"], h["lower_core_mm"]
    cavities = [
        [[upper["min"][i] + wall, upper["max"][i] - wall] for i in range(3)],
        [[lower["min"][i] + wall, lower["max"][i] - wall] for i in range(2)]
        + [[lower["min"][2] + wall, upper["max"][2] - wall]]
    ]
    if "top_cap_mm" in h:
        cap = h["top_cap_mm"]
        cavities.append([[cap["min"][i] + wall, cap["max"][i] - wall] for i in range(3)])
    outside = []
    for zone in zones:
        axes = []
        for i, (lo, hi) in enumerate(bounds(zone)):
            cuts = sorted({lo, hi} | {v for cavity in cavities for v in cavity[i] if lo < v < hi})
            axes.append([(a + b) / 2 for a, b in zip(cuts, cuts[1:])])
        if any(not any(all(cavity[i][0] <= p[i] <= cavity[i][1] for i in range(3)) for cavity in cavities)
               for x in axes[0] for y in axes[1] for z in axes[2] for p in [[x, y, z]]):
            outside.append(zone["id"])
    props = mass_properties(h["mass_items"])
    pack = h["pack"]
    old_shift = 0.7 / 4.35 * 25.4
    return dict(props, zone_overlaps=conflicts, zones_outside_wall_allowance=outside,
                pack_trim_changes_head_com_mm=pack["mass_kg"] / props["mass_kg"] * (pack["trim_x_mm"][1] - pack["trim_x_mm"][0]),
                old_25_4_mm_pack_move_changes_4_35_kg_head_com_mm=old_shift,
                roll_motor_inner_gap_mm=2 * c["leg"]["hip_half_spacing_mm"] - 78.5,
                pack_zone_side_clearance_mm=(2 * c["leg"]["hip_half_spacing_mm"] - 78.5 - zones[0]["size_mm"][1]) / 2,
                motor_envelope_width_mm=2 * c["leg"]["hip_half_spacing_mm"] + 78.5,
                guarded_cassette_width_mm=2 * h["hip_cassette_mm"]["half_width"],
                outer_motor_to_inner_wall_mm=h["hip_cassette_mm"]["half_width"] - wall - c["leg"]["hip_half_spacing_mm"] - 78.5 / 2,
                motor_axial_wall_clearance_mm=min(h["roll_motor_center_x_mm"]-45.5/2-h["hip_cassette_mm"]["x"][0]-wall, h["hip_cassette_mm"]["x"][1]-wall-h["roll_motor_center_x_mm"]-45.5/2),
                motor_vertical_wall_clearance_mm=min(-h["hip_cassette_mm"]["z"][0],h["hip_cassette_mm"]["z"][1])-wall-78.5/2,
                maximum_extended_height_mm=2 * c["leg"]["link_mm"] + c["leg"]["wheel_radius_mm"] + h["upper_box_mm"]["max"][2])


def leg_ik(c, body, foot, side):
    """Exact inverse for two pitch links rolled at hip, with split yoke/axle offsets.

    Ankle axis is assumed kept fore-aft by a passive pitch-level carrier. A motor
    bolted directly to the shin does NOT meet this assumption (see report).
    """
    l = c["leg"]
    L = l["link_mm"]
    track = l["neutral_wheel_outside_width_mm"] - l["wheel_assembly_width_mm"]
    offset = side * (track / 2 - l["hip_half_spacing_mm"])
    yoke = side * (l["leg_plane_mm"] - l["hip_half_spacing_mm"])
    hip = add(body, [0, side * l["hip_half_spacing_mm"], 0])
    dx, dy, dz = sub(foot, hip)
    down2 = dy * dy + dz * dz - offset * offset
    down = math.sqrt(max(0, down2))
    reach = math.hypot(dx, down)
    half = math.acos(max(-1, min(1, reach / (2 * L))))
    roll = wrap(math.atan2(dz, dy) - math.atan2(-down, offset))
    sign = l.get("knee_direction", 1)
    pitch = wrap(math.atan2(-dx, down) + sign * half)
    knee = sign * 2 * half
    pitch_origin = add(hip, rx([0, yoke, 0], roll))
    k = add(pitch_origin, rx([-L * math.sin(pitch), 0, -L * math.cos(pitch)], roll))
    shin_end = add(k, rx([-L * math.sin(pitch - knee), 0, -L * math.cos(pitch - knee)], roll))
    ankle = add(shin_end, rx([0, offset - yoke, 0], roll))
    q = [math.degrees(v) for v in [roll, pitch, knee, -roll]]
    limits = [[-l["hip_roll_limit_deg"], l["hip_roll_limit_deg"]], l["hip_pitch_limits_deg"], l["knee_limits_deg"], [-l["ankle_roll_limit_deg"], l["ankle_roll_limit_deg"]]]
    checked_q = [q[0], sign * q[1], sign * q[2], q[3]]
    violations = [name for name, v, (lo, hi) in zip(["hip_roll", "hip_pitch", "knee", "ankle_roll"], checked_q, limits) if v < lo - 1e-7 or v > hi + 1e-7]
    if down2 < 0 or reach > 2 * L + 1e-7:
        violations.append("reach")
    return {"hip": hip, "pitch_origin": pitch_origin, "knee": k, "shin_end": shin_end, "ankle": ankle, "foot": foot,
            "angles_deg": q, "reach_mm": reach, "fk_error_mm": math.dist(ankle, foot), "violations": violations}


def pose(c, body, feet):
    items = [dict(i, center_mm=add(body, i["center_mm"])) for i in c["head"]["mass_items"]]
    legs = []
    m = c["leg"]["mass_kg"]
    for side, foot in zip([1, -1], feet):
        leg = leg_ik(c, body, foot, side)
        # Fixed roll stator belongs to trunk. Swing motor/yoke belongs to rolled leg.
        items.append({"kg": 0.38, "center_mm": add(leg["hip"], [c["head"]["roll_motor_center_x_mm"], 0, 0])})
        distal = [
            {"kg": m["hip_pair_per_side"] - 0.38, "center_mm": leg["pitch_origin"]},
            {"kg": m["knee"], "center_mm": leg["knee"]},
            {"kg": m["upper_tube"], "center_mm": mid(leg["pitch_origin"], leg["knee"])},
            {"kg": m["lower_tube"], "center_mm": mid(leg["knee"], leg["shin_end"])},
            {"kg": m["pitch_level_linkage"], "center_mm": mid(leg["knee"], leg["foot"])},
            {"kg": m["foot_including_ankle"], "center_mm": leg["foot"]}
        ]
        items.extend(distal)
        leg["distal_mass_items"] = distal
        legs.append(leg)
    total = sum(i["kg"] for i in items)
    com = [sum(i["kg"] * i["center_mm"][j] for i in items) / total for j in range(3)]
    return {"body_mm": body, "feet_mm": feet, "legs": legs, "mass_kg": total, "com_mm": com}


def solve_com(c, feet, target_xy, z):
    body = [target_xy[0], target_xy[1], z]
    for _ in range(25):
        p = pose(c, body, feet)
        error = [target_xy[i] - p["com_mm"][i] for i in [0, 1]]
        if math.hypot(*error) < 0.001:
            break
        # Newton's method with finite-difference 2x2 Jacobian, bounded steps.
        cols = []
        for j in [0, 1]:
            b = body.copy()
            b[j] += 0.01
            q = pose(c, b, feet)
            cols.append([(q["com_mm"][i] - p["com_mm"][i]) / 0.01 for i in [0, 1]])
        a, cc = cols[0]
        b, d = cols[1]
        det = a * d - b * cc
        if abs(det) < 1e-8:
            break
        steps = [(d * error[0] - b * error[1]) / det, (-cc * error[0] + a * error[1]) / det]
        for j in [0, 1]:
            body[j] += max(-30, min(30, steps[j]))
    p = pose(c, body, feet)
    p["com_error_mm"] = math.hypot(*(p["com_mm"][i] - target_xy[i] for i in [0, 1]))
    return p


def lateral_span(c, p):
    """Conservative modeled bounds, not a full CAD swept-volume calculation."""
    half = c["head"]["hip_cassette_mm"]["half_width"]
    ys = [p["body_mm"][1] - half, p["body_mm"][1] + half]
    for leg in p["legs"]:
        roll = math.radians(leg["angles_deg"][0])
        # RS00 hip-pitch reference housing: 51-mm axial, 57-mm radial.
        pitch_half = 25.5 * abs(math.cos(roll)) + 28.5 * abs(math.sin(roll))
        for key, radius in [("pitch_origin", pitch_half), ("knee", 60),
                            ("shin_end", 8), ("foot", c["leg"]["wheel_assembly_width_mm"] / 2)]:
            ys.extend([leg[key][1] - radius, leg[key][1] + radius])
    return max(ys) - min(ys)


def clearance_screen(c, p):
    """Conservative wheel cylinders vs occupied head boxes and riser.

    Solid cylinders overestimate dual-tread material; intersections are blockers
    to investigate, not proof actual rubber occupies the entire cylinder.
    Link points check a single riser, not an entire stair flight.
    """
    h, l = c["head"], c["leg"]
    boxes = []
    for key in [key for key in ["upper_box_mm", "lower_core_mm", "top_cap_mm"] if key in h]:
        boxes.append((key, [add(h[key]["min"], p["body_mm"]), add(h[key]["max"], p["body_mm"])]))
    b = h["hip_cassette_mm"]
    boxes.append(("hip_cassette", [add([b["x"][0], -b["half_width"], b["z"][0]], p["body_mm"]),
                                  add([b["x"][1], b["half_width"], b["z"][1]], p["body_mm"])]))
    issues = []
    if lateral_span(c, p) > l.get("swept_width_limit_mm", float("inf")) + 1e-7:
        issues.append("lateral-envelope/width-limit")
    R, rise = l["wheel_radius_mm"], l["stair_mm"]["rise"]
    for j, leg in enumerate(p["legs"]):
        f = leg["foot"]
        for name, (lo, hi) in boxes:
            if f[1] + l["wheel_assembly_width_mm"] / 2 < lo[1] or f[1] - l["wheel_assembly_width_mm"] / 2 > hi[1]:
                continue
            dx, dz = [max(lo[i] - f[i], 0, f[i] - hi[i]) for i in [0, 2]]
            if math.hypot(dx, dz) < R:
                issues.append(f"leg{j}:wheel/{name}")
        # Distance of wheel centre to the solid step quadrant x>=0, z<=rise.
        if math.hypot(max(0, -f[0]), max(0, f[2] - rise)) < R - 1e-6:
            issues.append(f"leg{j}:wheel/riser")
        for a, b in [(leg["pitch_origin"], leg["knee"]), (leg["knee"], leg["shin_end"]), (leg["shin_end"], leg["ankle"])]:
            if segment_box_distance(a, b, [0, -math.inf, -math.inf], [math.inf, math.inf, rise]) < 8:
                issues.append(f"leg{j}:tube/riser")
        k = leg["knee"]
        # Bounding sphere around RS02: deliberately conservative, ~60-mm radius.
        if math.hypot(max(0, -k[0]), max(0, k[2] - rise)) < 60:
            issues.append(f"leg{j}:knee-envelope/riser")
        for name, (lo, hi) in boxes:
            def distance(point):
                return math.sqrt(sum(max(lo[i] - point[i], 0, point[i] - hi[i]) ** 2 for i in range(3)))
            if distance(k) < 60:
                issues.append(f"leg{j}:knee-envelope/{name}")
            # Conservative AABB of the RS00 hip-pitch stator after hip roll.
            # Intended shaft/yoke attachment is outside these head boxes.
            roll = math.radians(leg["angles_deg"][0])
            size = [57, 51*abs(math.cos(roll))+57*abs(math.sin(roll)),
                    51*abs(math.sin(roll))+57*abs(math.cos(roll))]
            if all(min(leg["pitch_origin"][i]+size[i]/2, hi[i]) > max(leg["pitch_origin"][i]-size[i]/2, lo[i]) for i in range(3)):
                issues.append(f"leg{j}:hip-pitch-envelope/{name}")
            for a, b in [(leg["pitch_origin"], k), (k, leg["shin_end"]), (leg["shin_end"], leg["ankle"])]:
                if segment_box_distance(a, b, lo, hi) < 8:
                    issues.append(f"leg{j}:tube/{name}")
    f, g = p["feet_mm"]
    if abs(f[1] - g[1]) < l["wheel_assembly_width_mm"] and math.hypot(f[0] - g[0], f[2] - g[2]) < 2 * R:
        issues.append("wheel/wheel")
    return sorted(set(issues))


def gravity_torques(p, load_left, inboard_cop_mm=0):
    """J^T F via free-body moments, gravity only, pure vertical ground reactions.
    Foot loads are specified by the COM target on the segment between contacts.
    Values are output-shaft torque, with no spring assistance or dynamic reserve.
    """
    out = []
    for side, leg, fraction in zip([1, -1], p["legs"], [load_left, 1 - load_left]):
        N = p["mass_kg"] * G * fraction
        d = leg["distal_mass_items"]
        h, hp, k, f = [leg[s] for s in ["hip", "pitch_origin", "knee", "foot"]]
        roll = math.radians(leg["angles_deg"][0])
        cop_y = f[1] - side * inboard_cop_mm
        tr = (sum(i["kg"] * G * (i["center_mm"][1] - h[1]) for i in d) - N * (cop_y - h[1])) / 1000
        th = math.cos(roll) * (N * (f[0] - hp[0]) - sum(i["kg"] * G * (i["center_mm"][0] - hp[0]) for i in d)) / 1000
        tk = math.cos(roll) * (N * (f[0] - k[0]) - sum(i["kg"] * G * (i["center_mm"][0] - k[0]) for i in d[3:])) / 1000
        out.append({"roll": tr, "hip": th, "knee": tk, "ankle": N * (cop_y - f[1]) / 1000, "normal_n": N})
    return out


def sample_targets(c):
    """One stationary 241.3-mm step: shift, lift vertically, advance, lower,
    transfer, lift trailing, advance, lower, centre. No ballistic catch credit.
    Left starts planted; right leads. Wheels use center positions, not contacts.
    """
    l = c["leg"]
    R, rise = l["wheel_radius_mm"], l["stair_mm"]["rise"]
    lift = rise + l["stair_mm"]["wheel_clearance"]
    y = l.get("stance_half_track_mm", (l["neutral_wheel_outside_width_mm"] - l["wheel_assembly_width_mm"]) / 2)
    rear, front = l["foot_x_mm"]
    land_y = l.get("landing_half_track_mm", y)
    poses = [
        ("shift", [[rear, y, R], [rear, -y, R]], 0.5),
        ("unload_leading", [[rear, y, R], [rear, -y, R]], 1),
        ("lift_leading", [[rear, y, R], [rear, -y, R + lift]], 1),
        ("advance_leading", [[rear, y, R], [front, -land_y, R + lift]], 1),
        ("land_leading", [[rear, y, R], [front, -land_y, R + rise]], 1),
        ("transfer", [[rear, y, R], [front, -land_y, R + rise]], 0),
        ("lift_trailing", [[rear, y, R + lift], [front, -land_y, R + rise]], 0),
        ("advance_trailing", [[front, land_y, R + lift], [front, -land_y, R + rise]], 0),
        ("land_trailing", [[front, land_y, R + rise], [front, -land_y, R + rise]], 0),
        ("centre", [[front, land_y, R + rise], [front, -land_y, R + rise]], 0.5)
    ]
    yield poses[0]
    for prev, nxt in zip(poses, poses[1:]):
        for j in range(1, 11):
            u = j / 10
            feet = [[a + (b - a) * u for a, b in zip(fa, fb)] for fa, fb in zip(prev[1], nxt[1])]
            yield nxt[0], feet, prev[2] + (nxt[2] - prev[2]) * u


def stair_screen(c):
    frames = []
    layers = []
    targets = []
    for phase, feet, load in sample_targets(c):
        targets.append((phase, feet, load))
        target = [load * feet[0][i] + (1 - load) * feet[1][i] for i in [0, 1]]
        target[1] += (1 - 2 * load) * c["leg"].get("inboard_cop_mm", 0)
        candidates = []
        lo, hi, step = c["leg"]["body_z_search_mm"]
        # Height is relative to the lower of the two current axle positions.
        shift = min(f[2] for f in feet) - c["leg"]["wheel_radius_mm"]
        for z in range(lo, hi + 1, step):
            p = solve_com(c, feet, target, z + shift)
            violations = [v for leg in p["legs"] for v in leg["violations"]]
            bad = len(violations) + (p["com_error_mm"] > 0.1)
            t = gravity_torques(p, load, c["leg"].get("inboard_cop_mm", 0))
            peak = max(abs(x[k]) for x in t for k in ["roll", "hip", "knee"])
            # Lexicographic: first valid kinematics, then lowest peak gravity demand.
            collisions = clearance_screen(c, p)
            candidates.append(((bad, len(collisions), peak), p, t, violations))
        layers.append(candidates)
        _, p, t, violations = min(candidates, key=lambda x: x[0])
        frames.append({"phase": phase, "load_left": load, "body_mm": p["body_mm"], "feet_mm": feet,
                       "com_mm": p["com_mm"], "com_error_mm": p["com_error_mm"],
                       "angles_deg": [leg["angles_deg"] for leg in p["legs"]],
                       "fk_error_mm": max(leg["fk_error_mm"] for leg in p["legs"]),
                       "clearance_flags": clearance_screen(c, p),
                       "lateral_span_mm": lateral_span(c, p),
                       "violations": violations, "gravity_nm": t,
                       "knee_mm": [leg["knee"] for leg in p["legs"]]})
    # Connect collision-clear, reachable samples instead of silently jumping
    # between independently optimized heights. No timing/dynamic claim is made.
    feasible = [[entry for entry in layer if entry[0][0] == 0 and entry[0][1] == 0] for layer in layers]
    connected = False
    if all(feasible):
        costs = [[entry[0][2] ** 2 for entry in feasible[0]]]
        parents = [[]]
        for i in range(1, len(feasible)):
            next_cost, next_parent = [], []
            for entry in feasible[i]:
                pos = entry[1]["body_mm"]
                options = []
                for k, before in enumerate(feasible[i - 1]):
                    distance = math.dist(pos, before[1]["body_mm"])
                    if distance <= 60 and math.isfinite(costs[-1][k]):
                        options.append((costs[-1][k] + distance ** 2 + 0.05 * entry[0][2] ** 2, k))
                value, parent = min(options) if options else (float("inf"), -1)
                next_cost.append(value)
                next_parent.append(parent)
            costs.append(next_cost)
            parents.append(next_parent)
        if min(costs[-1]) < float("inf"):
            connected = True
            k = min(range(len(costs[-1])), key=lambda j: costs[-1][j])
            picks = [k]
            for i in range(len(feasible) - 1, 0, -1):
                k = parents[i][k]
                picks.append(k)
            for i, k in enumerate(reversed(picks)):
                _, p, t, violations = feasible[i][k]
                f = frames[i]
                f.update(body_mm=p["body_mm"], com_mm=p["com_mm"], com_error_mm=p["com_error_mm"],
                         angles_deg=[leg["angles_deg"] for leg in p["legs"]],
                         fk_error_mm=max(leg["fk_error_mm"] for leg in p["legs"]),
                         violations=violations, gravity_nm=t, clearance_flags=clearance_screen(c, p),
                         lateral_span_mm=lateral_span(c, p),
                         knee_mm=[leg["knee"] for leg in p["legs"]])
    interpolation = {"tested_samples": 0, "kinematic_failures": 0, "clearance_flags": 0, "max_com_error_mm": 0, "max_lateral_span_mm": 0}
    if connected:
        for a, b in zip(frames, frames[1:]):
            for n in range(1, 10):
                u = n / 10
                body = [x + u * (y - x) for x, y in zip(a["body_mm"], b["body_mm"])]
                feet = [[x + u * (y - x) for x, y in zip(aa, bb)] for aa, bb in zip(a["feet_mm"], b["feet_mm"])]
                load = a["load_left"] + u * (b["load_left"] - a["load_left"])
                p = pose(c, body, feet)
                target = [load * feet[0][j] + (1 - load) * feet[1][j] for j in [0, 1]]
                target[1] += (1 - 2 * load) * c["leg"].get("inboard_cop_mm", 0)
                interpolation["tested_samples"] += 1
                interpolation["kinematic_failures"] += bool(any(leg["violations"] for leg in p["legs"]))
                interpolation["clearance_flags"] += bool(clearance_screen(c, p))
                interpolation["max_com_error_mm"] = max(interpolation["max_com_error_mm"], math.dist(target, p["com_mm"][:2]))
                interpolation["max_lateral_span_mm"] = max(interpolation["max_lateral_span_mm"], lateral_span(c, p))
    return {"sample_count": len(frames), "failed_frames": sum(bool(f["violations"]) or f["com_error_mm"] > 0.1 for f in frames),
            "clearance_flagged_frames": sum(bool(f["clearance_flags"]) for f in frames),
            "connected_static_samples": connected, "interpolation_screen": interpolation,
            "max_lateral_span_mm": max(f["lateral_span_mm"] for f in frames),
            "peak_abs_gravity_nm": {k: max(abs(t[k]) for f in frames for t in f["gravity_nm"]) for k in ["roll", "hip", "knee"]},
            "max_joint_deg": {name: max(abs(q[i]) for f in frames for q in f["angles_deg"]) for i, name in enumerate(["hip_roll", "hip_pitch", "knee", "ankle_roll"])},
            "max_frame_height_jump_mm": max(abs(a["body_mm"][2] - b["body_mm"][2]) for a, b in zip(frames, frames[1:])),
            "frames": frames,
            "release": False,
            "limitations": ["static samples/linear interpolation, not a timed smooth dynamic trajectory", "pitch-level ankle carrier assumed, not designed", "no full swept-solid self-collision pass; conservative limited envelope checks only", "isolated riser; next riser, nosing and descent dynamics not modeled", "no actuator dynamics, thermal duty, tire compliance or horizontal acceleration", "head pitch and roll held level; differential leg IK supplies the shift"]}


def analyze(c):
    h = head_report(c)
    m = h["mass_kg"] + 2 * sum(c["leg"]["mass_kg"].values())
    contact = c["leg"]["effective_contact_half_width_mm"]
    power = c["power"]
    wh = power["cells"] * power["nominal_cell_v"] * power["ah"]
    usable = wh * power["usable_fraction"] * power["distribution_efficiency"]
    # Extended 8-byte classic CAN frames: 131 bits incl. intermission, up to
    # 29 inserted bits in 118 stuffable bits => conservative 160-bit budget.
    can = [{**b, "utilization": 2 * b["nodes"] * b["update_hz"] * c["can"]["frame_bits_budget"] / c["can"]["bitrate"] + c["can"]["telemetry_reserve_fraction"]} for b in c["can"]["buses"]]
    candidate = stair_screen(c)
    old = copy.deepcopy(c)
    old["leg"]["link_mm"] = old["leg"]["legacy_link_mm"]
    short = stair_screen(old)
    high = copy.deepcopy(c)
    high["head"]["mass_items"].append({"kg": c["head"]["high_mass_extra_kg"], "center_mm": [0, 0, 50]})
    heavy = stair_screen(high)
    taller = copy.deepcopy(c)
    taller["leg"].update(c["studies"]["taller_leg_overrides"])
    tall_screen = stair_screen(taller)
    extended = copy.deepcopy(taller)
    extended["leg"].update(c["studies"]["extended_leg_overrides"])
    extended_screen = stair_screen(extended)
    extended_high = copy.deepcopy(extended)
    extended_high["head"]["mass_items"].append({"kg": c["head"]["high_mass_extra_kg"], "center_mm": [0, 0, 50]})
    extended_high_screen = stair_screen(extended_high)
    narrow = copy.deepcopy(extended)
    narrow["leg"].update(c["studies"]["narrow_stance_overrides"])
    narrow_screen = stair_screen(narrow)
    narrow_high = copy.deepcopy(narrow)
    narrow_high["head"]["mass_items"].append({"kg": c["head"]["high_mass_extra_kg"], "center_mm": [0, 0, 50]})
    narrow_high_screen = stair_screen(narrow_high)
    narrow_short = copy.deepcopy(narrow)
    narrow_short["leg"]["link_mm"] = taller["leg"]["link_mm"]
    narrow_short_screen = stair_screen(narrow_short)
    preferred_high = copy.deepcopy(narrow_short)
    preferred_high["head"]["mass_items"].append({"kg": c["head"]["high_mass_extra_kg"], "center_mm": [0, 0, 50]})
    preferred_high_screen = stair_screen(preferred_high)
    smaller = {}
    for key, overrides in c["studies"]["small_narrow_overrides"].items():
        comparison = copy.deepcopy(narrow)
        comparison["leg"].update(overrides)
        result = stair_screen(comparison)
        smaller[key] = {k: v for k, v in result.items() if k != "frames"}
    # Historical tube size, deliberately only a mechanics reference. Equivalent
    # isotropic E does not qualify a laminate, drilled fitting, joint or bond.
    tube = c["structure_screen"]
    do, di = tube["tube_od_mm"] / 1000, tube["tube_id_mm"] / 1000
    area = math.pi * (do ** 2 - di ** 2) / 4
    second_moment = math.pi * (do ** 4 - di ** 4) / 64
    length = extended["leg"]["link_mm"] / 1000
    E = tube["assumed_axial_E_GPa"] * 1e9
    force = m * G
    tube_results = {"assumptions": tube, "link_reference_mm": length * 1000,
                    "area_mm2": area * 1e6, "second_moment_mm4": second_moment * 1e12,
                    "single_robot_weight_n": force,
                    "cantilever_tip_moment_nm": force * length,
                    "cantilever_bending_stress_mpa": force * length * do / 2 / second_moment / 1e6,
                    "cantilever_tip_deflection_mm": force * length ** 3 / (3 * E * second_moment) * 1000,
                    "ideal_pin_pin_euler_n": math.pi ** 2 * E * second_moment / length ** 2,
                    "release": False}
    a = c["actuator_screen"]
    eight_cost = 4 * a["rs02"]["planning_usd"] + 2 * a["rs00"]["planning_usd"] + 2 * a["rs05"]["planning_usd"]
    return {"revision": c["revision"], "head": h, "robot_nominal_kg": m,
            "robot_high_kg": m + c["head"]["high_mass_extra_kg"],
            "lateral_support": {"effective_half_width_mm": contact, "assumed_com_error_mm": 10,
                                "remaining_static_margin_mm": contact - 10,
                                "ankle_torque_at_10mm_nm": m * G * 0.010,
                                "ankle_torque_at_support_edge_nm": m * G * contact / 1000,
                                "note": "finite support requires two loaded lateral contacts AND a torque-transmitting ankle, not a free swivel"},
            "can": can, "energy_wh": wh, "usable_load_energy_wh": usable,
            "runtime_h": {str(w): usable / w for w in [40, 80, 120]},
            "slope_20deg_wheel_nm_each": m * G * math.sin(math.radians(20)) * c["leg"]["wheel_radius_mm"] / 2000,
            "stair_potential_energy_j": m * G * c["leg"]["stair_mm"]["rise"] / 1000,
            "tube_reference_screen": tube_results,
            "eight_motor_budget_usd": eight_cost,
            "ten_motor_budget_usd": eight_cost + 2 * a["rs00"]["planning_usd"],
            "stair_candidate": candidate,
            "short_link_comparison": {k: v for k, v in short.items() if k != "frames"},
            "high_mass_comparison": {k: v for k, v in heavy.items() if k != "frames"},
            "taller_narrow_landing_comparison": {k: v for k, v in tall_screen.items() if k != "frames"},
            "taller_candidate_height_mm": head_report(taller)["maximum_extended_height_mm"],
            "extended_candidate": extended_screen,
            "narrow_candidate": narrow_screen,
            "narrow_candidate_parameters": narrow["leg"],
            "narrow_high_mass_comparison": {k: v for k, v in narrow_high_screen.items() if k != "frames"},
            "preferred_candidate": narrow_short_screen,
            "preferred_candidate_parameters": narrow_short["leg"],
            "preferred_candidate_height_mm": head_report(narrow_short)["maximum_extended_height_mm"],
            "preferred_high_mass_comparison": {k: v for k, v in preferred_high_screen.items() if k != "frames"},
            **smaller,
            "extended_high_mass_comparison": {k: v for k, v in extended_high_screen.items() if k != "frames"},
            "extended_candidate_parameters": extended["leg"],
            "extended_candidate_height_mm": head_report(extended)["maximum_extended_height_mm"],
            "extended_tread_wheel_projection_margin_mm": min(extended["leg"]["foot_x_mm"][1] - c["leg"]["wheel_radius_mm"], c["leg"]["stair_mm"]["going"] - extended["leg"]["foot_x_mm"][1] - c["leg"]["wheel_radius_mm"])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    c = json.loads(CONFIG.read_text())
    report = analyze(c)
    if args.write:
        (ROOT / "docs/research/head-leg-results.json").write_text(json.dumps(report, indent=2) + "\n")
        from publish import publish
        publish(c, report)
    small = copy.deepcopy(report)
    for value in small.values():
        if isinstance(value, dict):
            value.pop("frames", None)
    print(json.dumps(small, indent=2))


if __name__ == "__main__":
    main()
