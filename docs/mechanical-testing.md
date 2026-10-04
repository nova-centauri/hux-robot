# Mechanical testing — layout and dated results

Open the [living mechanical test page](../tools/living-drawings/mechanical-tests.html) for the movable linkage diagram, the R01 print render, the test steps and the chronological record. Start with the [first passive fit session](checklists/2026-10-02-mechanical-fit.md). The record shows the receipt and the 3D printing of the parts on October 2, 2026. There is no reported measured test result.

## Read the layout

The diagram uses the R01 parallelogram: two 110 mm links, 40 mm fixed/carrier pivot separation, a 30° neutral and a 15–45° design range. Move the angle control to compare the axle positions. The end view shows 2 mm lower-link and 12 mm upper-link spacers at both ends of their respective links. Confirm the printed revision before you use that stack.

The 100 mm circle is a wheel envelope. The motor placement, hubs, bearings and powered mounts still need measurements and detail design.

The current Blender render shows a passive assembly at neutral. It is a design render, not a photograph of completed hardware. Use it to understand the arrangement. The actual fastener stacks and printed fits remain to record. [Canonical R01 assembly guide](../cad/prints/v1-proof-r01/README.md).

## Record each session

1. Select a step and enter the actual session date/time, measurements, outcome, observations and photo/log references. Keep failed trials. A passed trial needs both measurements and evidence. It does not close the whole stage or qualify balance.
2. The notes save in this browser on this device and appear in the dated timeline as **device drafts**. Export a JSON copy to keep or transfer them. The backup offers both a file download and selectable text. Import merges the records that match and does not replace the entries that conflict. Keep the exported file with the photos/logs that it refers to. The form does not upload results or photographs to the public site.
3. To make results part of the **shared project history**, bring the session measurements and evidence back to this chat. Record the reviewed trial in a dated repository session. Then append a `kind: test` event to `tools/living-drawings/mechanical-tests-data.json` with its `stepId`, `outcome`, `measurements`, `notes` and `sourcePaths` that point to that evidence. Keep the user’s actual test date separate from the date of the record.
4. Update the shared step status and `plan-data.json` only when the step meets its whole evidence gate. A local passed trial is not a published milestone pass. Rebuild, check and publish with the [existing site workflow](site-maintenance.md).

The shared timeline starts with the preparation and the user’s report of the arrival and the printed parts. Planned tests have no invented completion dates. Device drafts appear next to the shared records with explicit labels and never change the published gates.

## Progression

Inspect and measure → passive assembly → hand sweep → motor/wheel packaging → repeatability. These checks use disconnected power and the passive mockup. Restrained wheel tests, supported driven-leg commissioning and measured load/duty work obey the [bench plan](one-leg-bench.md), its supported mounts and its electrical/fault gates. The prints alone have no applied-load qualification.

[Neutral layout sheet](../cad/layouts/mechanical-test-bench.svg) · [Full session template](checklists/one-leg-bench-session.md) · [Physical acceptance checklist](checklists/mechanical-v1.md).
