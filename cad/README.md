# Hux CAD and layouts

**Current: R05.** The [R05 two-leg body](prints/two-leg-body-r05/README.md) of 2026-10-14 moves the hips to the rear and puts the servos and the battery inside. Five PLA plates hold one set. Follow the [R05 assembly guide](../docs/r05-assembly.md). Plates 1–3 are printed and the frame is assembled, per the user. The servo transmission and the measured fits remain open.

## Superseded kits

R05 replaces these kits. Keep them for the history. Do not print or assemble from them.

**2026-10-13:** the [R04 matched body](prints/one-leg-body-r04/README.md) replaces the body interfaces after a reported fit problem. It supplies three decks, component mounts and a servo cradle. Its hips are on the centre line, so the two-leg layout does not balance.

**2026-10-06:** the [R03 one-leg body kit](prints/one-leg-body-r03/README.md) adds the supported body, neutral lock and suspended wheel carrier. It contains nine STL/STEP part types, a STEP/Blender assembly and four engineering sheets. The user reported satisfactory leg travel. Its walls and decks did not fit together.

**2026-10-02:** the [V1-PROOF R01 passive kit](prints/v1-proof-r01/README.md), drafted on September 29, has eight STL part types and a Blender project. It tests the 110 mm link and 40 mm pivot geometry. Refer to the [first mechanical fit session](../docs/checklists/2026-10-02-mechanical-fit.md).

## Layouts

Planning layout: [V1-PROOF envelope sketch](layouts/v1-proof.svg), generated from [model.json](../tools/v1-proof/model.json). It shows side, front and plan envelopes plus the simple parallel-link leg. It is not a fabrication drawing or a clearance validation. It shows the original rearward strut slant. The [anatomy page](../tools/living-drawings/anatomy.html) shows the R05 layout.

For bench geometry checks, use the [1:1 single-leg geometry template](layouts/one-leg-bench-template.svg) with the [bench plan](../docs/one-leg-bench.md). Print at actual size and make sure that the 100 mm scale is correct. The template marks pivot centers for a paper/scrap mockup. Shaft holes, structural sections, lateral offsets and purchased-part mounts are not released.

Next: install the struts, the carriers and the gearmotors with both legs locked at 30°. V1-PROOF has no powered hips. The 3:1 servo drive to the hips is for the next version. Suitable scrap/COTS stock is welcome. There is no carbon or custom in-wheel motor requirement.

[H1](layouts/head-h1.svg), the [stair engineering review](../docs/head-and-leg-review.md), old sheets and downloaded vendor geometry are parked references. Vendor files in `vendor/` remain untouched and do not establish ownership. No released Hux custom parts exist.
