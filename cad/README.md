# CAD

No released Hux CAD parts. [H1 dimensioned packaging study](layouts/head-h1.svg) is a nominal allocation, not a fabrication drawing. [Engineering review](../docs/head-and-leg-review.md) governs the redesigned head and legs; old Sheets 1/2 do not release redesigned hardware.

**Vendor geometry lives in [`vendor/`](vendor/README.md)** (2026-09-26): RobStride RS00 / RS02 / RS05 and the Teensy 4.1 as the vendors' STEP files plus full-resolution GLBs, with orientation notes and the converter that makes the light copies the 3D sandbox draws. Those are candidate component references, not purchased parts; the 2D gate below is about ours.

**Gate:** several **2D sketch layouts** (side / front / top + linkage) must exist **before** Blender or other 3D CAD (R23). A `.blend` with no preceding 2D is a process miss.

V1 expected: one wheel-leg — **carbon-tube spars** + printed / machined **end fittings**, sized toward a ~9.5" step inside **~24" tall / ~14" wide** (see [`../docs/mechanical.md`](../docs/mechanical.md) and [`../docs/checklists/mechanical-v1.md`](../docs/checklists/mechanical-v1.md)).

2D scans / exports can live here too. Keep intentional exports (`.stl`, `.3mf`, `.step`). Scratch backups are gitignored.
