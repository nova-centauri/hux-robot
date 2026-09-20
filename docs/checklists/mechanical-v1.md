# Checklist: first printable wheel-leg

**Status:** not started. FC is TBD and must not block this.

Target: one side only, linkage + spring stub, stroke/clearance toward a **~9.5"** riser.

**Layout (Steve 2026-09-20):** motor **at the wheel**; knee + hip-swing steppers **above the knee**; **one belt inside, one outside**. Rules: [`../mechanical.md`](../mechanical.md). IDs R30–R33 in [`../requirements.md`](../requirements.md).

- [ ] Measure a real riser / fixture (height, tread, nosing).
- [ ] **2D layouts** (side / front / top + linkage) show **motor-at-wheel** and **inside/outside belt runs**. No Blender until this is real (R23 when that lands).
- [ ] Wheel diameter vs. step vs. knee stroke is in that 2D set.
- [ ] Printable envelope for one wheel-leg.
- [ ] Wheel hub / coaxial BLDC — motor **at the rim**, not hip-remote (R30). Motor model TBD. **kV match is a goal** (R31) — do not invent a number or SKU.
- [ ] Knee + hip-swing steppers **above the knee** (mass high / hip region). Belts to both pivots; **one inside, one outside** (R32).
- [ ] Integrated toothed pulley / gear in the printed custom where it stays draft-friendly (R33 / R20). COTS pulley fallback is fine.
- [ ] **Wire ports along the belt path** (R21). Leads do not occupy the belt run.
- [ ] **Service access** to belts / tension (R22). Not a sealed mono-leg.
- [ ] Linkage layout.
- [ ] Spring stub (gravity assist).
- [ ] Hip-roll axis in V1 (dynamic class). Placement TBD — do not drop CoG with a heavy roll pack if avoidable.
- [ ] First print + fit.
- [ ] Raised wheel can reach a 9.5" tread without self-collision. Belts do not rub.
- [ ] Only then: consider a second-leg copy.

Notes go in [`../../NOTES.md`](../../NOTES.md). CAD goes in [`../../cad/`](../../cad/).
