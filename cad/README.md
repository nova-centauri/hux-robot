# Hux CAD and layouts

Active: [V1-PROOF envelope sketch](layouts/v1-proof.svg), generated from [model.json](../tools/v1-proof/model.json). It shows side, front and plan envelopes plus the simple parallel-link leg. It is not a fabrication drawing or a clearance validation.

For bench geometry checks, use the [1:1 single-leg geometry template](layouts/one-leg-bench-template.svg) with the [bench plan](../docs/one-leg-bench.md). Print at actual size and make sure that the 100 mm scale is correct. The template marks pivot centers for a paper/scrap mockup. Shaft holes, structural sections, lateral offsets and purchased-part mounts are not released.

**2026-10-02 — parts printed and motor/drivers received per the user:** start the [first mechanical fit session](../docs/checklists/2026-10-02-mechanical-fit.md). The [V1-PROOF R01 passive kit](prints/v1-proof-r01/README.md), drafted on September 29 for the Bambu X1C and PLA, has eight STL part types. The kit also has a Blender project that uses the 110 mm link / 40 mm pivot geometry. Confirm the printed revision and material, measure the fit coupon if it is printed, and check the actual M4 fits. Printed sections and mounts remain provisional. No fit, load test or bench milestone is complete.

Next: measure the available parts, mock up the pinned-leg chassis, then detail bearings, pivots, reductions and cables for one leg. Keep 2D layouts before detailed 3D work. Suitable scrap/COTS stock is welcome. There is no carbon or custom in-wheel motor requirement.

[H1](layouts/head-h1.svg), the [stair engineering review](../docs/head-and-leg-review.md), old sheets and downloaded vendor geometry are parked references. Vendor files in `vendor/` remain untouched and do not establish ownership. No released Hux custom parts exist.
