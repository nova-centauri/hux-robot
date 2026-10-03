"""Independent load/geometry invariants and budget rejection checks."""
import importlib.util
import json
import math
from decimal import Decimal
from pathlib import Path
import tempfile
import unittest

import review as r


class ProofChecks(unittest.TestCase):
    def setUp(self):
        self.c = json.loads(r.CONFIG.read_text())

    def test_strict_budget_rejects_1000_and_ignores_unconfirmed_reuse(self):
        result = r.report(self.c)
        self.assertEqual(result["total_cap_usd"], 900)
        self.c["budget"]["shipping_tax_usd"] += 100
        self.c["budget"]["confirmed_reuse_credit_usd"] = 900
        self.assertFalse(r.report(self.c)["under_budget"])

    def test_receipts_reconcile_to_paid_spend_and_remaining_allocations(self):
        plan = json.loads(r.PLAN.read_text())
        purchases = r.purchase_report(self.c, plan)
        self.assertEqual(purchases["totals"]["paidTotal"], Decimal("173.70"))
        self.assertIsNone(purchases["totals"]["merchandiseCost"])
        self.assertIsNone(purchases["remaining"]["parts"])
        self.assertIsNone(purchases["remaining"]["shippingTax"])
        self.assertEqual(purchases["remaining"]["total"], Decimal("726.30"))
        ordered = {item["partId"]: item["quantity"] for order in purchases["orders"] for item in order["items"]}
        self.assertEqual(ordered, {"pololu-4752": 1, "pololu-4035": 1, "st3215": 2, "pico2": 1, "lsm6dso": 1})
        budget = r.outputs(self.c, plan)[r.ROOT / "docs/bom.md"]
        self.assertIn("**$173.70**", budget)
        self.assertIn("**$726.30**", budget)
        self.assertIn("**$900.00**", budget)
        self.assertIn("Amazon / 2026-10-02 (ordered)", budget)
        self.assertIn("SparkFun LSM6DSO Qwiic IMU | 1 | Not recorded | Not recorded | Received; untested", budget)
        self.assertIn("Pico 2 with yellow pre-soldered headers | 1 | Not recorded | Not recorded | Received; untested", budget)

    def test_receipt_mismatch_and_duplicate_order_are_rejected(self):
        for mutation in ("quantity", "charges", "duplicate"):
            with self.subTest(mutation=mutation):
                plan = json.loads(r.PLAN.read_text())
                orders = next(v for v in plan["versions"] if v["id"] == "V1-PROOF")["orders"]
                if mutation == "quantity":
                    orders[0]["items"][0]["quantity"] += 1
                elif mutation == "charges":
                    orders[0]["shippingCost"] += 1
                else:
                    orders.append(orders[0])
                with self.assertRaises(ValueError):
                    r.purchase_report(self.c, plan)

    def test_unknown_receipt_amount_is_not_zero_or_an_available_balance(self):
        plan = json.loads(r.PLAN.read_text())
        orders = next(v for v in plan["versions"] if v["id"] == "V1-PROOF")["orders"]
        orders[0]["paidTotal"] = None
        orders[0]["shippingCost"] = None
        purchases = r.purchase_report(self.c, plan)
        self.assertIsNone(purchases["totals"]["paidTotal"])
        self.assertIsNone(purchases["remaining"]["total"])
        self.assertIsNone(purchases["remaining"]["shippingTax"])
        self.assertEqual(r.money(None), "Not recorded")
        self.assertEqual(r.money(0), "$0.00")
        budget = r.outputs(self.c, plan)[r.ROOT / "docs/bom.md"]
        self.assertIn("Recorded spend: Not recorded", budget)
        self.assertNotIn("$726.30", budget)

    def test_second_wheel_order_updates_coverage_without_stale_first_channel_claims(self):
        plan = json.loads(r.PLAN.read_text())
        version = next(v for v in plan["versions"] if v["id"] == "V1-PROOF")
        first = r.purchase_report(self.c, plan)["quantities"]
        self.assertEqual(first["pololu-4752"]["missing"], 1)
        self.assertEqual(first["pololu-4035"]["missing"], 1)
        self.assertEqual(first["st3215"]["missing"], 0)
        self.assertEqual(next(item for item in r.remaining_shopping_list(version) if item.get("partId") == "pololu-4752")["need"], "1 more motor")
        # A later receipt is enough; purchase-card snapshots may not yet be updated.
        second = json.loads(json.dumps(version["orders"][0]))
        second["id"] = "second-wheel-channel"
        version["orders"].append(second)
        result = r.purchase_report(self.c, plan)
        self.assertEqual(result["quantities"]["pololu-4752"]["ordered"], 2)
        self.assertEqual(result["quantities"]["pololu-4035"]["missing"], 0)
        self.assertFalse(any(item.get("partId") == "pololu-4752" for item in r.remaining_shopping_list(version)))
        budget = r.outputs(self.c, plan)[r.ROOT / "docs/bom.md"]
        self.assertIn("The full wheel motor/driver pair is ordered", budget)
        self.assertIn("Not covered by recorded orders: 0 motors and 0 drivers", budget)
        for stale in ("Only one wheel", "first restrained bench channel", "second remains to buy", "second and passives"):
            self.assertNotIn(stale, budget)

    def test_unknown_order_or_planned_quantity_cannot_claim_complete_coverage(self):
        plan = json.loads(r.PLAN.read_text())
        version = next(v for v in plan["versions"] if v["id"] == "V1-PROOF")
        version["orders"][0]["items"][0]["quantity"] = None
        next(p for p in version["purchases"] if p["id"] == "st3215")["plannedQuantity"] = None
        counts = r.purchase_report(self.c, plan)["quantities"]
        self.assertIsNone(counts["pololu-4752"]["ordered"])
        self.assertIsNone(counts["pololu-4752"]["missing"])
        self.assertEqual(counts["st3215"]["ordered"], 2)
        self.assertIsNone(counts["st3215"]["missing"])
        budget = r.outputs(self.c, plan)[r.ROOT / "docs/bom.md"]
        self.assertIn("motor count not recorded", budget)
        self.assertIn("Not recorded still needed", budget)
        self.assertNotIn("The full wheel motor/driver pair is ordered", budget)
        self.assertNotIn("first restrained bench channel", budget)

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
