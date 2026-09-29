#!/usr/bin/env python3
"""Check the published plan's identities, evidence and repository-backed routes.

Run directly from any directory. A fresh isolated site build makes the route
checks independent of a stale dist/site and is removed when the suite finishes.
The checks deliberately allow progress, inventory and document counts to change.
"""

from __future__ import annotations

from datetime import date
import json
import math
from pathlib import Path, PurePosixPath
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

import build_site


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def mappings(value, location="plan"):
    """Yield every object with its location for useful failing assertions."""
    if isinstance(value, dict):
        yield location, value
        for key, item in value.items():
            yield from mappings(item, f"{location}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from mappings(item, f"{location}[{index}]")


def nonempty_evidence(value):
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(nonempty_evidence(item) for item in value)
    if isinstance(value, dict):
        return any(nonempty_evidence(item) for item in value.values())
    return False


class PlanDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((HERE / "plan-data.json").read_text())
        cls.temp = tempfile.TemporaryDirectory(prefix="hux-plan-test-")
        cls.addClassCleanup(cls.temp.cleanup)
        cls.output = Path(cls.temp.name) / "site"
        build_site.build(ROOT, cls.output)

    def reference_entries(self):
        for location, value in mappings(self.data):
            for key in ("sourcePaths", "evidencePaths"):
                if key not in value:
                    continue
                self.assertIsInstance(value[key], list, f"{location}.{key}")
                for index, source in enumerate(value[key]):
                    yield f"{location}.{key}[{index}]", source
            if "path" in value:
                yield f"{location}.path", value["path"]

    def checked_source(self, location, source):
        self.assertIsInstance(source, str, location)
        self.assertTrue(source.strip(), f"Empty reference: {location}")
        parsed = urlsplit(source)
        self.assertFalse(parsed.scheme or parsed.netloc, f"Use a repository source path: {location}")
        path = PurePosixPath(unquote(parsed.path))
        self.assertFalse(path.is_absolute(), f"Use a repository-relative source: {source}")
        self.assertNotIn("..", path.parts, f"Source escapes repository coordinates: {source}")
        self.assertNotIn("\\", str(path), f"Use portable source paths: {source}")
        self.assertTrue(parsed.path, f"Reference needs a source path: {source}")
        target = ROOT / path
        self.assertTrue(target.exists(), f"Missing source at {location}: {source}")
        return parsed, path, target

    def test_version_identity_and_roles(self):
        versions = self.data["versions"]
        self.assertIsInstance(versions, list)
        slugs = [version["slug"] for version in versions]
        self.assertEqual(len(slugs), len(set(slugs)), "Version slugs must be unique")
        for version in versions:
            self.assertRegex(version["slug"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        for role, slug in (("current", "v1-proof"), ("archive", "v0-genesis"), ("future", "next")):
            self.assertEqual([v["slug"] for v in versions if v["role"] == role], [slug], f"Incorrect {role} version routing")
        self.assertEqual(self.data["currentVersion"], "v1-proof")
        by_slug = {version["slug"]: version for version in versions}
        self.assertEqual(by_slug["v1-proof"]["id"], "V1-PROOF")
        self.assertEqual(by_slug["v0-genesis"]["id"], "V0-GENESIS")
        future = by_slug["next"]
        self.assertRegex(future["name"].lower(), r"\b(next|future|third)\b", "The future title should remain a placeholder")
        self.assertNotRegex(future["name"], r"(?i)\bV\d+(?:[-\s]|$)", "No numbered codename has been selected for the next version")
        self.assertFalse(future.get("codename"), "The third version has no selected codename")

    def test_all_source_and_document_references_exist(self):
        references = list(self.reference_entries())
        self.assertTrue(references, "The living plan needs repository-backed references")
        for location, source in references:
            with self.subTest(location=location, source=source):
                _, _, target = self.checked_source(location, source)
                if target.is_dir():
                    self.assertTrue((target / "README.md").is_file(), f"Dynamic directory links require README.md: {source}")

    def test_dynamic_references_resolve_to_published_pages_and_anchors(self):
        # Plan paths are already repository-relative. A root-level source file
        # makes the publisher resolve them in those same coordinates.
        source_context = PurePosixPath("README.md")
        for location, source in self.reference_entries():
            with self.subTest(location=location, source=source):
                parsed, path, source_target = self.checked_source(location, source)
                published = build_site.source_url(source, source_context, ROOT)
                routed = urlsplit(published)
                self.assertFalse(routed.scheme or routed.netloc)
                self.assertFalse(routed.path.lower().endswith(".md"), f"Raw Markdown route: {published}")
                target = (self.output / unquote(routed.path)).resolve()
                self.assertTrue(target.is_relative_to(self.output.resolve()), f"Route leaves the published site: {published}")
                self.assertTrue(target.is_file(), f"Missing published route for {source}: {published}")
                expected_source = path / "README.md" if source_target.is_dir() else path
                self.assertEqual(target, (self.output / build_site.site_path(expected_source)).resolve())
                self.assertEqual(routed.query, parsed.query, f"Lost query: {source}")
                self.assertEqual(routed.fragment, parsed.fragment, f"Lost fragment: {source}")
                if routed.fragment and target.suffix == ".html":
                    page = build_site.Links()
                    page.feed(target.read_text())
                    self.assertIn(unquote(routed.fragment), page.ids, f"Missing document heading: {source}")

    def test_work_item_ids_are_unique_within_each_version_and_kind(self):
        for version in self.data["versions"]:
            groups = {
                "actions": version.get("nextActions", []),
                "milestones": version.get("milestones", []),
                "bench stages": (version.get("bench") or {}).get("stages", []),
            }
            for kind, items in groups.items():
                with self.subTest(version=version["slug"], kind=kind):
                    ids = [item["id"] for item in items]
                    for item_id in ids:
                        self.assertIsInstance(item_id, str)
                        self.assertTrue(item_id.strip(), "Work items need stable nonempty IDs")
                    self.assertEqual(len(ids), len(set(ids)), f"Duplicate {kind} IDs in {version['slug']}")

    def test_passed_milestones_have_recorded_evidence(self):
        for version in self.data["versions"]:
            for milestone in version.get("milestones", []):
                with self.subTest(version=version["slug"], milestone=milestone["id"]):
                    if milestone.get("status", "").lower() not in {"passed", "complete", "completed"}:
                        continue
                    # sourcePaths usually points to a plan or checklist, which
                    # alone cannot prove a pass. Evidence must be explicit.
                    evidence = milestone.get("evidence")
                    evidence_paths = milestone.get("evidencePaths")
                    self.assertTrue(nonempty_evidence(evidence) or nonempty_evidence(evidence_paths), "A completed milestone needs measured evidence or an explicit evidencePaths reference")

    def test_inventory_quantities_and_costs_preserve_unknowns(self):
        for version in self.data["versions"]:
            for part in version.get("purchases", []):
                for field in ("plannedQuantity", "orderedQuantity", "actualCost"):
                    with self.subTest(version=version["slug"], part=part["id"], field=field):
                        self.assertIn(field, part, "Use null for an unknown quantity or cost")
                        value = part[field]
                        if value is None:
                            continue
                        self.assertIn(type(value), (int, float), "A recorded amount must be numeric; unknown amounts stay null")
                        self.assertTrue(math.isfinite(value), "Amounts must be finite")
                        self.assertGreaterEqual(value, 0, "Amounts cannot be negative")
                        if field.endswith("Quantity"):
                            self.assertEqual(value, int(value), "Part quantities must be whole numbers")
                confirmed = part.get("confirmedOn")
                if confirmed is not None:
                    self.assertRegex(confirmed, r"^\d{4}-\d{2}-\d{2}$")
                    self.assertEqual(date.fromisoformat(confirmed).isoformat(), confirmed)


if __name__ == "__main__":
    unittest.main()
