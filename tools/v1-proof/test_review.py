"""Independent load/geometry invariants and budget rejection checks."""
import importlib.util
import json
import math
from pathlib import Path
import tempfile
import unittest

import review as r


class ProofChecks(unittest.TestCase):
    def setUp(self):
        self.c = json.loads(r.CONFIG.read_text())

    def test_strict_budget_rejects_1000_and_ignores_unconfirmed_reuse(self):
        result = r.report(self.c)
        self.assertEqual(result["total_cap_usd"], 940)
        self.c["budget"]["shipping_tax_usd"] += 60
        self.c["budget"]["confirmed_reuse_credit_usd"] = 900
        self.assertFalse(r.report(self.c)["under_budget"])

    def test_link_length_and_parallelogram_remain_constant(self):
        g = self.c["geometry"]
        for q in range(15, 46):
            p = r.geometry(self.c, q)
            x, z = p["axle_rearward_mm"], p["pivot_above_axle_mm"]
            self.assertAlmostEqual(math.hypot(x, z), g["link_length_mm"])
            self.assertAlmostEqual(math.dist((0, g["pivot_separation_mm"]), (x, g["pivot_separation_mm"] - z)), g["link_length_mm"])

    def test_leg_torque_matches_gravitational_virtual_work(self):
        eps = 1e-5
        g = self.c["geometry"]
        for angle in [15, 30, 45]:
            dh = (r.geometry(self.c, angle + math.degrees(eps))["pivot_above_axle_mm"] - r.geometry(self.c, angle - math.degrees(eps))["pivot_above_axle_mm"]) / (2 * eps * 1000)
            independently = abs(3 * r.G * 0.6 * dh) / (g["leg_reduction"] * g["transmission_efficiency_assumed"])
            self.assertAlmostEqual(r.leg_torque(self.c, 3, angle, 0.6), independently, places=8)

    def test_mass_and_voltage_changes_reduce_margin(self):
        light = r.wheel_screen(self.c, 2.5, 0.5)
        heavy = r.wheel_screen(self.c, 3, 0.5)
        self.assertGreater(heavy["demand_nm_per_wheel"], light["demand_nm_per_wheel"])
        self.assertTrue(heavy["passes_preliminary_screen"])
        self.c["power"]["screen_min_v"] = 4
        self.assertFalse(r.wheel_screen(self.c, 3, 0.5)["passes_preliminary_screen"])
        self.c["mass_items"].append({"item": "too much payload", "kg": 1})
        self.assertFalse(r.report(self.c)["within_mass_limit"])

    def test_excess_speed_and_missing_current_cannot_pass(self):
        self.assertFalse(r.wheel_screen(self.c, 3, 2)["passes_preliminary_screen"])
        self.c["wheel_screen"]["proposed_peak_current_limit_a"] = 0.1
        self.assertEqual(r.wheel_screen(self.c, 3, 0.5)["available_peak_nm_estimate"], 0)

    def test_screen_does_not_release_hardware(self):
        result = r.report(self.c)
        self.assertFalse(result["hardware_validated"])
        self.assertFalse(result["fabrication_ready"])
        self.assertEqual(result["actuator_count"], 4)

    def test_parked_publisher_cannot_overwrite_active_budget(self):
        spec = importlib.util.spec_from_file_location("stair_publish", r.ROOT / "tools/engineering/publish.py")
        publisher = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(publisher)
        candidate = json.loads((r.ROOT / "tools/engineering/baseline.json").read_text())
        saved_results = json.loads((r.ROOT / "docs/research/head-leg-results.json").read_text())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for folder in ["docs", "cad/layouts", "tools/engineering", "tools/living-drawings"]:
                (root / folder).mkdir(parents=True, exist_ok=True)
            (root / "docs/bom.md").write_text("ACTIVE PROOF BUDGET")
            (root / "tools/engineering/bom.json").write_text((r.ROOT / "tools/engineering/bom.json").read_text())
            publisher.ROOT = root
            publisher.publish(candidate, saved_results)
            self.assertEqual((root / "docs/bom.md").read_text(), "ACTIVE PROOF BUDGET")
            self.assertTrue((root / "docs/archive/stair-v1/bom.md").read_text().startswith("> **PARKED STAIR-V1."))
            self.assertIn("engineering-status.js", (root / "tools/living-drawings/engineering.html").read_text())


if __name__ == "__main__":
    unittest.main()
