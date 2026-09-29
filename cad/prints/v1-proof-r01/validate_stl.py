#!/usr/bin/env python3
"""Independently inspect exported R01 binary STLs using only Python's stdlib.

Run after build.py has finished writing manifest.json:
    python3 cad/prints/v1-proof-r01/validate_stl.py

This reads float32 STL triangles, not Blender's meshes or topology audit. The
expected dimensions and quantities below are the R01 passive-kit specification.
STL is unitless: dimensional agreement and the manifest establish mm intent;
the slicer must still import at 100% in millimetres. No print, fit, strength,
collision, hardware interface, or powered-motion qualification is implied.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import itertools
import json
import math
from pathlib import Path
import struct
import sys

HERE = Path(__file__).resolve().parent
WELD_MM = 0.00001
BOUND_TOLERANCE_MM = 0.02
HOLE_TOLERANCE_MM = 0.02
BED_MM = (256, 256, 256)

# Independent nominal requirements; do not derive these from build.py's audit.
EXPECTED = {
    "01_layout_deck": {"bounds": (120, 110, 4), "quantity": 1, "holes": []},
    "02_fixed_pivot_plate": {"bounds": (70, 70, 6), "quantity": 1, "holes": [(0, -20, 4.5), (0, 20, 4.5)], "spacing": 40},
    "03_link_110": {"bounds": (126, 16, 5), "quantity": 2, "holes": [(0, 0, 4.5), (110, 0, 4.5)], "spacing": 110},
    "04_carrier_40": {"bounds": (56, 16, 6), "quantity": 1, "holes": [(0, 0, 4.5), (40, 0, 4.5)], "spacing": 40},
    "05_spacer_2mm": {"bounds": (9, 9, 2), "quantity": 2, "holes": [(0, 0, 4.5)]},
    "06_spacer_12mm": {"bounds": (9, 9, 12), "quantity": 2, "holes": [(0, 0, 4.5)]},
    "07_hole_fit_coupon": {"bounds": (82, 26, 4), "quantity": 1, "holes": [(x, 3, d) for x, d in zip((-28, -14, 0, 14, 28), (4.1, 4.3, 4.5, 4.7, 4.9))]},
    "08_wheel_envelope_100": {"bounds": (100, 100, 2), "quantity": 1, "holes": [(0, 0, 4.5)], "optional": True},
}


def subtract(a, b):
    return tuple(x - y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross2(a, b):
    return a[0] * b[1] - a[1] * b[0]


class VertexWeld:
    """Spatial-hash weld with neighbor checks, avoiding rounding-bin artifacts."""

    def __init__(self, tolerance=WELD_MM):
        self.tolerance = tolerance
        self.cells = defaultdict(list)
        self.vertices = []

    def add(self, point):
        cell = tuple(math.floor(value / self.tolerance) for value in point)
        for offset in itertools.product((-1, 0, 1), repeat=3):
            neighbor = tuple(a + b for a, b in zip(cell, offset))
            for index in self.cells.get(neighbor, ()):
                if math.dist(point, self.vertices[index]) <= self.tolerance:
                    return index
        index = len(self.vertices)
        self.vertices.append(point)
        self.cells[cell].append(index)
        return index


def read_binary_stl(path):
    raw = path.read_bytes()
    if len(raw) < 84:
        raise ValueError("STL is shorter than the binary header.")
    count = struct.unpack_from("<I", raw, 80)[0]
    if count == 0 or len(raw) != 84 + count * 50:
        raise ValueError(f"Invalid binary STL length/count: {len(raw)} bytes, {count} triangles.")
    triangles, normals = [], []
    for offset in range(84, len(raw), 50):
        values = struct.unpack_from("<12fH", raw, offset)
        if not all(math.isfinite(value) for value in values[:12]):
            raise ValueError(f"Nonfinite coordinate or normal at triangle {(offset - 84) // 50}.")
        normals.append(values[:3])
        triangles.append((values[3:6], values[6:9], values[9:12]))
    return triangles, normals, hashlib.sha256(raw).hexdigest()


def horizontal_section(triangles, z):
    """Intersect exported triangle surfaces with a horizontal interior plane."""
    segments = []
    for triangle in triangles:
        points = []
        for a, b in zip(triangle, triangle[1:] + triangle[:1]):
            da, db = a[2] - z, b[2] - z
            if abs(da) < 1e-10:
                points.append(a[:2])
            if da * db < 0:
                fraction = da / (da - db)
                points.append((a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1])))
        unique = []
        for point in points:
            if not any(math.dist(point, other) < 1e-8 for other in unique):
                unique.append(point)
        if len(unique) == 2 and math.dist(*unique) > 1e-9:
            segments.append(tuple(unique))
    return segments


def ray_distances(origin, direction, segments):
    distances = []
    for a, b in segments:
        edge = subtract(b, a)
        denominator = cross2(direction, edge)
        if abs(denominator) < 1e-12:
            continue
        relative = subtract(a, origin)
        distance = cross2(relative, edge) / denominator
        along = cross2(relative, direction) / denominator
        if distance > 1e-8 and -1e-9 <= along <= 1 + 1e-9:
            distances.append(distance)
    distances.sort()
    unique = []
    for distance in distances:
        if not unique or abs(distance - unique[-1]) > 1e-5:
            unique.append(distance)
    return unique


def inspect_hole(segments, x, y, diameter):
    radial, counts = [], []
    for step in range(64):
        angle = step * 2 * math.pi / 64
        distances = ray_distances((x, y), (math.cos(angle), math.sin(angle)), segments)
        if not distances:
            return {"expected_center_mm": [x, y], "nominal_diameter_mm": diameter, "passed": False, "error": "A section ray does not reach an enclosing surface."}
        radial.append(distances[0])
        counts.append(len(distances))
    measured_center = (x + (radial[0] - radial[32]) / 2, y + (radial[16] - radial[48]) / 2)
    diameters = [radial[i] + radial[i + 32] for i in range(32)]
    # Circle faceting makes the minimum chord slightly smaller than nominal.
    # 0.02 mm permits this discretization while rejecting shrinkage/scaling or
    # the wrong clearance diameter. These are mesh measurements, not print fits.
    maximum_error = max(abs(2 * radius - diameter) for radius in radial)
    air_at_center = all(count % 2 == 0 for count in counts)
    return {
        "expected_center_mm": [x, y],
        "measured_center_mm": [round(value, 6) for value in measured_center],
        "nominal_diameter_mm": diameter,
        "section_diameter_min_mm": round(min(diameters), 6),
        "section_diameter_max_mm": round(max(diameters), 6),
        "maximum_diameter_error_mm": round(maximum_error, 6),
        "center_in_void": air_at_center,
        "ray_count": 64,
        "passed": air_at_center and maximum_error <= HOLE_TOLERANCE_MM and math.dist((x, y), measured_center) <= HOLE_TOLERANCE_MM,
    }


def inspect_mesh(path, expected):
    triangles, normals, digest = read_binary_stl(path)
    welded = VertexWeld()
    edges = defaultdict(list)
    adjacency = defaultdict(set)
    zero_area, collapsed, reversed_normals = [], [], []
    volumes, areas = [], []
    for number, (triangle, normal) in enumerate(zip(triangles, normals)):
        a, b, c = triangle
        area_vector = cross(subtract(b, a), subtract(c, a))
        twice_area = math.sqrt(dot(area_vector, area_vector))
        area = twice_area / 2
        areas.append(area)
        if area <= 1e-12:
            zero_area.append(number)
        if dot(area_vector, normal) <= 0:
            reversed_normals.append(number)
        volumes.append(dot(a, cross(b, c)) / 6)
        indices = [welded.add(vertex) for vertex in triangle]
        if len(set(indices)) < 3:
            collapsed.append(number)
        for start, end in zip(indices, indices[1:] + indices[:1]):
            key = (min(start, end), max(start, end))
            edges[key].append(1 if start < end else -1)
            adjacency[start].add(end)
            adjacency[end].add(start)
    boundary = [edge for edge, directions in edges.items() if len(directions) == 1]
    nonmanifold = [edge for edge, directions in edges.items() if len(directions) > 2]
    inconsistent = [edge for edge, directions in edges.items() if len(directions) == 2 and sum(directions) != 0]
    unseen = set(range(len(welded.vertices)))
    components = []
    while unseen:
        stack = [unseen.pop()]
        count = 0
        while stack:
            vertex = stack.pop()
            count += 1
            for other in adjacency[vertex]:
                if other in unseen:
                    unseen.remove(other)
                    stack.append(other)
        components.append(count)
    low = [min(point[axis] for triangle in triangles for point in triangle) for axis in range(3)]
    high = [max(point[axis] for triangle in triangles for point in triangle) for axis in range(3)]
    dimensions = [b - a for a, b in zip(low, high)]
    volume = math.fsum(volumes)
    holes = []
    slice_z = (low[2] + high[2]) / 2
    if expected["holes"]:
        section = horizontal_section(triangles, slice_z)
        holes = [inspect_hole(section, *hole) for hole in expected["holes"]]
    checks = {
        "finite_coordinates_and_normals": True,
        "nonzero_triangle_areas": not zero_area,
        "no_collapsed_triangles_after_weld": not collapsed,
        "all_mesh_edges_paired": not boundary and not nonmanifold,
        "consistent_triangle_winding": not inconsistent,
        "stored_normals_agree_with_triangles": not reversed_normals,
        "one_connected_solid": len(components) == 1,
        "positive_signed_volume": volume > 0,
        "nominal_dimensions_mm": all(abs(actual - wanted) <= BOUND_TOLERANCE_MM for actual, wanted in zip(dimensions, expected["bounds"])),
        "sits_on_z_zero": abs(low[2]) <= BOUND_TOLERANCE_MM,
        "fits_x1c_individually": all(actual <= bed for actual, bed in zip(dimensions, BED_MM)),
        "nominal_bores_in_mid_height_section": all(hole["passed"] for hole in holes),
    }
    spacing = None
    if "spacing" in expected:
        if all("measured_center_mm" in hole for hole in holes[:2]):
            spacing = math.dist(holes[0]["measured_center_mm"], holes[1]["measured_center_mm"])
        checks["pivot_center_spacing"] = spacing is not None and abs(spacing - expected["spacing"]) <= HOLE_TOLERANCE_MM
    result = {
        "file": path.name, "sha256": digest, "passed": all(checks.values()), "checks": checks,
        "triangles": len(triangles), "welded_vertices": len(welded.vertices), "edges": len(edges),
        "boundary_edges": len(boundary), "nonmanifold_edges": len(nonmanifold), "inconsistently_oriented_edges": len(inconsistent),
        "zero_area_triangles": len(zero_area), "collapsed_triangles_after_weld": len(collapsed), "opposed_or_zero_stored_normals": len(reversed_normals),
        "connected_components": len(components), "component_vertex_counts": components,
        "signed_volume_mm3": round(volume, 6), "surface_area_mm2": round(math.fsum(areas), 6),
        "bounds_mm": [round(value, 6) for value in dimensions], "expected_bounds_mm": list(expected["bounds"]),
        "minimum_mm": [round(value, 6) for value in low], "maximum_mm": [round(value, 6) for value in high],
        "hole_section_z_mm": round(slice_z, 6), "hole_sections": holes,
    }
    if "spacing" in expected:
        result["measured_pivot_spacing_mm"] = round(spacing, 6) if spacing is not None else None
        result["expected_pivot_spacing_mm"] = expected["spacing"]
    if not result["passed"]:
        result["failure_samples"] = {
            "boundary_edges": boundary[:8], "nonmanifold_edges": nonmanifold[:8],
            "inconsistent_edges": inconsistent[:8], "zero_area_triangles": zero_area[:8],
            "collapsed_triangles": collapsed[:8], "opposed_normal_triangles": reversed_normals[:8],
        }
    return result


def validate(directory):
    manifest_path = directory / "manifest.json"
    if not manifest_path.is_file():
        raise ValueError("manifest.json is not present; wait for the complete export before validation.")
    raw_manifest = manifest_path.read_bytes()
    manifest = json.loads(raw_manifest)
    parts = manifest.get("parts", [])
    by_id = {part["id"]: part for part in parts}
    files = {path.name for path in (directory / "stl").glob("*.stl")}
    expected_files = {key + ".stl" for key in EXPECTED}
    checks = {
        "manifest_units_mm": manifest.get("units") == "mm",
        "manifest_printer_x1c": manifest.get("printer") == "Bambu X1C",
        "manifest_material_pla": manifest.get("material") == "PLA",
        "exactly_the_specified_unique_parts": len(parts) == len(by_id) == len(EXPECTED) and set(by_id) == set(EXPECTED),
        "all_and_only_expected_stl_files": files == expected_files,
        "specified_quantities": all(by_id.get(key, {}).get("quantity") == spec["quantity"] for key, spec in EXPECTED.items()),
        "manifest_paths_match_part_ids": all(by_id.get(key, {}).get("file") == "stl/" + key + ".stl" for key in EXPECTED),
    }
    results = {}
    for key, specification in EXPECTED.items():
        try:
            results[key] = inspect_mesh(directory / "stl" / (key + ".stl"), specification)
            results[key]["manifest_quantity"] = by_id.get(key, {}).get("quantity")
            results[key]["optional"] = specification.get("optional", False)
        except (OSError, ValueError, KeyError, struct.error) as error:
            results[key] = {"passed": False, "error": str(error)}
    return {
        "schema_version": 1,
        "validator": "validate_stl.py; independent Python stdlib binary-STL inspection",
        "manifest_sha256": hashlib.sha256(raw_manifest).hexdigest(),
        "revision": manifest.get("revision"),
        "passed": all(checks.values()) and all(part["passed"] for part in results.values()),
        "scope": "Exported mesh topology, nominal dimensions, individual bed fit, and mid-height bores only. No physical print, fit, strength, assembly collision or powered-motion validation.",
        "units": "mm; STL carries no unit metadata, import at 100% in millimetres",
        "tolerances_mm": {"vertex_weld": WELD_MM, "bounds": BOUND_TOLERANCE_MM, "hole_diameter_and_center": HOLE_TOLERANCE_MM},
        "checks": checks,
        "required_printed_pieces": sum(spec["quantity"] for spec in EXPECTED.values() if not spec.get("optional")),
        "optional_printed_pieces": sum(spec["quantity"] for spec in EXPECTED.values() if spec.get("optional")),
        "parts": results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=HERE)
    args = parser.parse_args()
    try:
        result = validate(args.directory)
    except (OSError, ValueError, KeyError) as error:
        print(f"STL validation not run: {error}", file=sys.stderr)
        return 2
    output = args.directory / "stl-validation.json"
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    for part_id, part in result["parts"].items():
        failed = [name for name, passed in part.get("checks", {}).items() if not passed]
        print(f"{'PASS' if part['passed'] else 'FAIL'} {part_id}" + (": " + ", ".join(failed) if failed else "") + (": " + part["error"] if "error" in part else ""))
    print(f"{'PASS' if result['passed'] else 'FAIL'} exported kit; report: {output}")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
