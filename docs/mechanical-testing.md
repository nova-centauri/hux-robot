# Mechanical testing — layout and dated results

Open the [living mechanical test page](../tools/living-drawings/mechanical-tests.html) for the movable linkage diagram, R01 print rendering, test steps and chronological record. Begin with the [first passive fit session](checklists/2026-10-02-mechanical-fit.md). Receipt and printing are recorded October 2, 2026; no measured test result has been reported.

## Read the layout

The diagram uses the R01 parallelogram: two 110 mm links, 40 mm fixed/carrier pivot spacing, a 30° neutral and a 15–45° design range. Move the angle control to compare axle positions. The end view shows 2 mm lower-link and 12 mm upper-link spacers at both ends of their respective links. Confirm the printed revision before following that stack. The 100 mm circle is a wheel envelope; motor placement, hubs, bearings and powered mounts still need measurements and detailing.

The existing Blender rendering depicts a passive assembly at neutral. It is a design rendering, not a photograph of completed hardware. Use it to understand the arrangement; actual fastener stacks and printed fits remain to record. [Canonical R01 assembly guide](../cad/prints/v1-proof-r01/README.md).

## Record each session

1. Choose a step and enter the actual session date/time, measurements, outcome, observations and photo/log references. Keep failed trials. A passed trial needs both measurements and evidence; it does not close the whole stage or qualify balance.
2. Notes save in this browser on this device and appear in the dated timeline as **device drafts**. Export a JSON copy to preserve or transfer them; the backup offers both a file download and selectable text. Import merges matching records without replacing conflicting entries. Keep the exported file with the photos/logs it references. The form does not upload results or photographs to the public site.
3. To make results part of the **shared project history**, bring the session measurements and evidence back to this chat. Record the reviewed trial in a dated repository session, then append a `kind: test` event to `tools/living-drawings/mechanical-tests-data.json` with its `stepId`, `outcome`, `measurements`, `notes` and `sourcePaths` pointing to that evidence. Keep the user’s actual test date separate from the date it was recorded.
4. Update the shared step status and `plan-data.json` only when its whole evidence gate is met. A local passed trial is not a published milestone pass. Rebuild, check and publish using the [existing site workflow](site-maintenance.md).

The shared timeline starts with preparation and the user’s arrival/printing report. Planned tests have no invented completion dates. Device drafts appear alongside shared records with explicit labels and never change the published gates.

## Progression

Inspect and measure → passive assembly → hand sweep → motor/wheel packaging → repeatability. These checks use disconnected power and the passive mockup. Restrained wheel testing, supported driven-leg commissioning and measured load/duty work follow the [bench plan](one-leg-bench.md), supported mounts and its electrical/fault gates. The prints alone have no applied-load qualification.

[Neutral layout sheet](../cad/layouts/mechanical-test-bench.svg) · [Full session template](checklists/one-leg-bench-session.md) · [Physical acceptance checklist](checklists/mechanical-v1.md).
