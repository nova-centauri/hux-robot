# Checklist: first wheel-leg

**Status:** not started. The MCU is picked with the actuators and must not block this.

Target: one side only — **carbon-tube spars** + printed / machined **end fittings**, linkage + spring stub, stroke / clearance toward a **~9.5"** riser, inside **~24" tall / ~14" wide**.

**Layout (Steve 2026-09-20 / 09-21):** motor **at the wheel**; pose actuators **high**; **one belt inside, one outside** *if* belts; hip roll **in V1**. Rules: [`../mechanical.md`](../mechanical.md). Shop: [`../capabilities.md`](../capabilities.md). Parts: [`../parts-on-hand.md`](../parts-on-hand.md).

- [ ] Measure a real riser / fixture (height, tread, nosing).
- [x] **Sheet 1 — V1 layout** (2026-09-27): side / front / plan / stroke drawn from the model files, on the site at [`tools/living-drawings/sheet.html`](../../tools/living-drawings/sheet.html). Roll axes 3.0", hip band 9.1", leg plane 4.75", knee RS02 inboard at the knee, RS00 outboard at the hip, pack 1" forward, axle spacer 1.63". Belts: none.
- [x] **Sheet 2 — tubes, fittings, spring, hub, wires** (2026-09-27): [`tools/living-drawings/sheet2.html`](../../tools/living-drawings/sheet2.html). 16 × 14 carbon, 40 mm sockets, cuts 191 / 196 mm; knee pulley-spring (3.0 kN/m, Ø2.5" pulley) that brings the stand-up hold under the RS02 rating; RS05 flush outboard on a turned 3.75"-bead rim; 9.1" hip-band shell; wires inside the tubes with ports in F2 / F3 / F5. Open: RS05 output bearing rating; bolt patterns from the STEP files.
- [ ] Agree Sheets 1 and 2, then CAD the leg and the band from them; Blender for the head's styling (R23 met for the leg and band).
- [ ] Wheel vs. step vs. knee stroke is in that 2D set. **6" OD** tire centered in the **9.5" × 9.5"** slot, **7.5" + 7.5"** tubes, **~6"** above the hip ([`../research/leg-geometry.md`](../research/leg-geometry.md)). Zantle 5" is a bench donor, not the foot. Stroke owns the rise.
- [ ] **COTS carbon tubes** for upper + lower main lengths. Printed / machined **end fittings** only (hubs, belt mounts, joint flanges). Do not print or mill the spar (R34 / R19).
- [ ] Customs have **draft**, no lazy undercuts, printable orientation (R20). Machined / bent / welded customs are welcome.
- [ ] **Wire ports / cable paths** through links and body (R21). Leads do not occupy a belt run.
- [ ] **Service access** to fasteners, battery, FC (TBD), actuators, belts / tension (R22). Not a sealed mono-leg. Threaded inserts; independently removable parts.
- [ ] Envelope: one wheel-leg that can share a **~14"** overall width and stay **≤ ~24"** tall at full extension.
- [ ] Wheel hub / coaxial BLDC — motor **at the rim**, not hip-remote (R30). Motor model TBD. **kV match is a goal** (R31) — do not invent a number or SKU. Lathe / mill welcome (donor Zantle rubber).
- [ ] Knee **RS02 at the knee joint** for V1, gravity spring ~2.2 N·m in scope; hip-driven linkage is V2; no five-bar (R39, Sheet 1). R32 / R33 belt rules apply only to the fallback.
- [ ] Linkage layout + spring stub (gravity assist). Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Plant-side joints (knee / hip swing / hip roll) sized for **one-wheel standing load (~2×)** (R36).
- [ ] Actuator class on the sketch: knee / swing **CAN QDD** working class (servo / stepper+belt fallback). **GIM8108-8** is a candidate, not an order. Hip roll **in V1** (dynamic). No SKU.
- [ ] Hip-roll axes in V1 at **3.0"** from the centreline (Sheet 1): RS02 roll housings flank the pack in a 9.1" hip band under the 7" head. Hold 6.3 N·m with one wheel up vs 7 rated; the shift needs 2.8" of leg-length difference to stay level (a controls term, `software.md`).
- [ ] First print / machine + fit.
- [ ] Raised wheel can reach a 9.5" tread **with margin**, without self-collision. Belts (if any) do not rub.
- [ ] Only then: consider a second-leg copy.

Notes go in [`../../NOTES.md`](../../NOTES.md). CAD goes in [`../../cad/`](../../cad/) — **after** 2D.
