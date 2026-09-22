# Checklist: first wheel-leg

**Status:** not started. FC is TBD and must not block this.

Target: one side only — **carbon-tube spars** + printed / machined **end fittings**, linkage + spring stub, stroke / clearance toward a **~9.5"** riser, inside **~24" tall / ~14" wide**.

**Layout (Steve 2026-09-20 / 09-21):** motor **at the wheel**; pose actuators **high**; **one belt inside, one outside** *if* belts; hip roll **in V1**. Rules: [`../mechanical.md`](../mechanical.md). Shop: [`../capabilities.md`](../capabilities.md). Parts: [`../parts-on-hand.md`](../parts-on-hand.md).

- [ ] Measure a real riser / fixture (height, tread, nosing).
- [ ] **Several 2D layouts** (side / front / top + linkage) show **motor-at-wheel**, **~24" / ~14"** envelope, and **inside/outside belt runs** if belts. **No Blender until this is real** (R23).
- [ ] Wheel vs. step vs. knee stroke is in that 2D set. **6" OD** tire centered in the **9.5" × 9.5"** slot, **7.5" + 7.5"** tubes, **~6"** above the hip ([`../research/leg-geometry.md`](../research/leg-geometry.md)). Zantle 5" is a bench donor, not the foot. Stroke owns the rise.
- [ ] **COTS carbon tubes** for upper + lower main lengths. Printed / machined **end fittings** only (hubs, belt mounts, joint flanges). Do not print or mill the spar (R34 / R19).
- [ ] Customs have **draft**, no lazy undercuts, printable orientation (R20). Machined / bent / welded customs are welcome.
- [ ] **Wire ports / cable paths** through links and body (R21). Leads do not occupy a belt run.
- [ ] **Service access** to fasteners, battery, FC (TBD), actuators, belts / tension (R22). Not a sealed mono-leg. Threaded inserts; independently removable parts.
- [ ] Envelope: one wheel-leg that can share a **~14"** overall width and stay **≤ ~24"** tall at full extension.
- [ ] Wheel hub / coaxial BLDC — motor **at the rim**, not hip-remote (R30). Motor model TBD. **kV match is a goal** (R31) — do not invent a number or SKU. Lathe / mill welcome (donor Zantle rubber).
- [ ] Pose actuators **above the knee** (mass high / hip region) (R32). If belts: to both pivots; **one inside, one outside** (R33). Integrated toothed pulley where draft-friendly; COTS fallback is fine.
- [ ] Linkage layout + spring stub (gravity assist). Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Plant-side joints (knee / hip swing / hip roll) sized for **one-wheel standing load (~2×)** (R36).
- [ ] Actuator class on the sketch: knee / swing **servo vs stepper+belt TBD** (both open). **GIM8108-8** is a candidate, not an order. Hip roll **in V1** (dynamic). No SKU.
- [ ] Hip-roll axis in V1. Placement TBD — do not drop CoG with a heavy roll pack if avoidable.
- [ ] First print / machine + fit.
- [ ] Raised wheel can reach a 9.5" tread **with margin**, without self-collision. Belts (if any) do not rub.
- [ ] Only then: consider a second-leg copy.

Notes go in [`../../NOTES.md`](../../NOTES.md). CAD goes in [`../../cad/`](../../cad/) — **after** 2D.
