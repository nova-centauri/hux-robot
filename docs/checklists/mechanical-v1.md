# Checklist: first printable wheel-leg

**Status:** not started. FC is TBD and must not block this.

Target: one side only, printed **customs** on **COTS** structure, linkage + spring stub, stroke/clearance toward a **~9.5"** riser.

**Process gate:** several **2D sketch layouts** exist before any Blender / 3D CAD (R23). Do not skip to a `.blend`.

## Before Blender (R23)

- [ ] Measure a real riser / fixture (height, tread, nosing).
- [ ] **2D layouts done** — several views, not one doodle: side, front, top, plus linkage / stroke. Paper, tablet, or files; point at them from [`../../NOTES.md`](../../NOTES.md) or drop scans in [`../../cad/`](../../cad/).
- [ ] Wheel diameter vs. step vs. knee stroke is in that 2D set.
- [ ] **COTS structure chosen where possible** — carbon rod / metal stock / tube / fasteners for primary structure. Do not print the spar (R19).
- [ ] Printable envelope for one wheel-leg = **customs on that stock**, not a mono-body printed beam.
- [ ] **Draft on customs** — draft angles, avoid undercuts where possible, parting-line awareness, printable orientation (R20).
- [ ] **Wire ports** — openings / cable paths through links and body (R21).
- [ ] **Service access** — fasteners, battery, FC (TBD), actuators reachable; replaceable modules, not a sealed mono-body (R22).
- [ ] Linkage layout.
- [ ] Spring stub (gravity assist).
- [ ] Wheel hub / BLDC mount (motor model TBD — do not buy).

## Only after 2D exists

- [ ] First print + fit (customs, not a printed spar).
- [ ] Raised wheel can reach a 9.5" tread without self-collision.
- [ ] Only then: consider a second-leg copy.

Notes go in [`../../NOTES.md`](../../NOTES.md). CAD goes in [`../../cad/`](../../cad/). Rules: [`../mechanical.md`](../mechanical.md) · IDs R19–R23 in [`../requirements.md`](../requirements.md).
