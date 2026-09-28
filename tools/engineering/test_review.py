"""Physical invariants and negative gates; no assertion that a robot works."""
import copy
import json
import math
import unittest

import review as r


class EngineeringChecks(unittest.TestCase):
    def setUp(self):
        self.c = json.loads(r.CONFIG.read_text())

    def test_mass_tensor_cube_and_translation(self):
        cube = [{"kg": 2, "center_mm": [0, 0, 0], "size_mm": [1000, 1000, 1000]}]
        a = r.mass_properties(cube)
        for i in range(3):
            self.assertAlmostEqual(a["inertia_com_kg_m2"][i][i], 1 / 3)
        shifted = copy.deepcopy(self.c["head"]["mass_items"])
        a = r.mass_properties(shifted)
        for item in shifted:
            item["center_mm"] = r.add(item["center_mm"], [57, -23, 80])
        b = r.mass_properties(shifted)
        for i in range(3):
            self.assertAlmostEqual(b["com_mm"][i] - a["com_mm"][i], [57, -23, 80][i])
            for j in range(3):
                self.assertAlmostEqual(a["inertia_com_kg_m2"][i][j], b["inertia_com_kg_m2"][i][j])

    def test_pack_translation_is_not_head_translation(self):
        items = copy.deepcopy(self.c["head"]["mass_items"])
        a = r.mass_properties(items)
        items[0]["center_mm"][0] += 25.4
        b = r.mass_properties(items)
        self.assertAlmostEqual(b["com_mm"][0] - a["com_mm"][0], 0.7 / a["mass_kg"] * 25.4)
        self.assertLess(b["com_mm"][0] - a["com_mm"][0], 10)

    def test_packaging_zones_do_not_overlap(self):
        self.assertEqual(r.head_report(self.c)["zone_overlaps"], [])
        self.assertEqual(r.head_report(self.c)["zones_outside_wall_allowance"], [])
        self.assertGreaterEqual(r.head_report(self.c)["outer_motor_to_inner_wall_mm"], self.c["head"]["assembly_clearance_mm"])
        for name in ["motor_axial_wall_clearance_mm", "motor_vertical_wall_clearance_mm"]:
            self.assertGreaterEqual(r.head_report(self.c)[name], self.c["head"]["assembly_clearance_mm"])
        bad = copy.deepcopy(self.c)
        bad["head"]["zones"][0]["center_mm"][1] = 50
        self.assertIn("battery", r.head_report(bad)["zones_outside_wall_allowance"])
        self.assertTrue(r.overlaps({"center_mm": [0, 0, 0], "size_mm": [2, 2, 2]},
                                   {"center_mm": [0.5, 0, 0], "size_mm": [1, 1, 1]}))

    def test_spatial_inverse_and_actual_link_lengths(self):
        l = self.c["leg"]
        L = l["link_mm"]
        track = l["neutral_wheel_outside_width_mm"] - l["wheel_assembly_width_mm"]
        body = [10, -20, 400]
        for side in [-1, 1]:
            for roll in [-0.8, -0.3, 0, 0.5, 0.8]:
                for pitch, knee in [(0.2, 0.6), (0.7, 1.3), (1.0, 2.0)]:
                    foot = r.add(r.add(body, [0, side * l["hip_half_spacing_mm"], 0]),
                                 r.rx([-L * (math.sin(pitch) + math.sin(pitch - knee)),
                                       side * (track / 2 - l["hip_half_spacing_mm"]),
                                       -L * (math.cos(pitch) + math.cos(pitch - knee))], roll))
                    p = r.leg_ik(self.c, body, foot, side)
                    self.assertLess(p["fk_error_mm"], 1e-8)
                    self.assertAlmostEqual(math.dist(p["pitch_origin"], p["knee"]), L)
                    self.assertAlmostEqual(math.dist(p["shin_end"], p["knee"]), L)
                    self.assertAlmostEqual(math.dist(p["hip"], p["pitch_origin"]), l["leg_plane_mm"] - l["hip_half_spacing_mm"])

    def test_unreachable_is_not_clamped_into_a_pass(self):
        p = r.leg_ik(self.c, [0, 0, 400], [1000, 150, 76.2], 1)
        self.assertIn("reach", p["violations"])
        self.assertGreater(p["fk_error_mm"], 500)

    def test_symmetric_stance_and_joint_virtual_work(self):
        l = self.c["leg"]
        y = (l["neutral_wheel_outside_width_mm"] - l["wheel_assembly_width_mm"]) / 2
        feet = [[0, y, l["wheel_radius_mm"]], [0, -y, l["wheel_radius_mm"]]]
        p = r.solve_com(self.c, feet, [0, 0], 400)
        self.assertLess(p["com_error_mm"], 0.01)
        self.assertAlmostEqual(p["mass_kg"], 7.02)
        t = r.gravity_torques(p, 0.5)
        self.assertAlmostEqual(sum(i["normal_n"] for i in t), p["mass_kg"] * r.G)
        self.assertAlmostEqual(t[0]["roll"], -t[1]["roll"])
        # Independent finite virtual-work displacement about the hip roll axis.
        leg = p["legs"][0]
        eps = 1e-6
        derivative = 0
        for item in leg["distal_mass_items"]:
            relative = r.sub(item["center_mm"], leg["hip"])
            dz = (r.rx(relative, eps)[2] - r.rx(relative, -eps)[2]) / (2 * eps * 1000)
            derivative += item["kg"] * r.G * dz
        relative = r.sub(leg["foot"], leg["hip"])
        dz = (r.rx(relative, eps)[2] - r.rx(relative, -eps)[2]) / (2 * eps * 1000)
        derivative -= t[0]["normal_n"] * dz
        self.assertAlmostEqual(derivative, t[0]["roll"], places=6)

    def test_clearance_rejects_wheel_in_riser(self):
        p = r.pose(self.c, [0, 0, 400], [[0, 140, 76.2], [-100, -140, 76.2]])
        self.assertIn("leg0:wheel/riser", r.clearance_screen(self.c, p))

    def test_lateral_mirror_preserves_mass_reach_and_loads(self):
        c = copy.deepcopy(self.c)
        c["leg"].update(c["studies"]["taller_leg_overrides"])
        c["leg"].update(c["studies"]["extended_leg_overrides"])
        body = [12, 95, 430]
        feet = [[-90, 137.8, 76.2], [90, -60, 317.5]]
        reflect = lambda p: [p[0], -p[1], p[2]]
        a = r.pose(c, body, feet)
        b = r.pose(c, reflect(body), [reflect(f) for f in reversed(feet)])
        for x, y in zip(reflect(a["com_mm"]), b["com_mm"]):
            self.assertAlmostEqual(x, y)
        ta, tb = r.gravity_torques(a, 0.8), r.gravity_torques(b, 0.2)
        for la, lb, aa, bb in zip(a["legs"], reversed(b["legs"]), ta, reversed(tb)):
            self.assertEqual(la["violations"], lb["violations"])
            self.assertAlmostEqual(la["angles_deg"][0], -lb["angles_deg"][0])
            for name in ["roll", "hip", "knee"]:
                self.assertAlmostEqual(abs(aa[name]), abs(bb[name]))

    def test_can_and_height_budgets(self):
        for b in self.c["can"]["buses"]:
            use = 2 * b["nodes"] * b["update_hz"] * 160 / 1e6 + 0.10
            self.assertLessEqual(use, 0.75)
        self.assertGreater(2 * 4 * 1000 * 160 / 1e6, 1.0)
        self.assertLessEqual(r.head_report(self.c)["maximum_extended_height_mm"], 609.6)

    def test_step_loads_are_never_assigned_to_an_airborne_foot(self):
        c = copy.deepcopy(self.c)
        c["leg"].update(c["studies"]["taller_leg_overrides"])
        c["leg"].update(c["studies"]["extended_leg_overrides"])
        c["leg"].update(c["studies"]["narrow_stance_overrides"])
        frames = list(r.sample_targets(c))
        radius, rise = c["leg"]["wheel_radius_mm"], c["leg"]["stair_mm"]["rise"]
        for _, feet, left in frames:
            for foot, load in zip(feet, [left, 1-left]):
                if load > 1e-8:
                    self.assertTrue(abs(foot[2]-radius) < 1e-6 or abs(foot[2]-radius-rise) < 1e-6)
        self.assertTrue(all(abs(f[2]-radius-rise) < 1e-6 for f in frames[-1][1]))

    def test_wheel_track_does_not_bound_the_moving_robot(self):
        p = r.pose(self.c, [0, 210, 420], [[-90, 137.8, 76.2], [-90, -137.8, 76.2]])
        self.assertGreater(r.lateral_span(self.c, p), 500)
        c = copy.deepcopy(self.c)
        c["leg"]["swept_width_limit_mm"] = 355.6
        self.assertIn("lateral-envelope/width-limit", r.clearance_screen(c, p))

    def test_continuous_segment_distance_finds_thin_intersections(self):
        lo, hi = [0, 0, 0], [1, 1, 1]
        self.assertEqual(r.segment_box_distance([-10, .5, .5], [10, .5, .5], lo, hi), 0)
        self.assertAlmostEqual(r.segment_box_distance([-1, -1, -1], [-1, -1, 2], lo, hi), math.sqrt(2))
        self.assertEqual(r.segment_box_distance([.5, .5, .5], [.5, .5, .5], lo, hi), 0)

    def test_rear_fold_needs_forward_hip_motor_package(self):
        c = copy.deepcopy(self.c)
        c["leg"].update(c["studies"]["taller_leg_overrides"])
        c["leg"].update(c["studies"]["extended_leg_overrides"])
        p = r.pose(c, [-90, 0, 350], [[-90, 60, 76.2], [-90, -60, 76.2]])
        self.assertEqual(r.clearance_screen(c, p), [])
        c["head"]["roll_motor_center_x_mm"] = -45
        c["head"]["hip_cassette_mm"]["x"] = [-74, -16]
        self.assertIn("leg0:tube/hip_cassette", r.clearance_screen(c, p))


if __name__ == "__main__":
    unittest.main()
