# Checklist: first wheel-leg

**Status:** Sheets 1 and 2 drawn (2026-09-27); waiting on Steve's agreement before CAD. Nothing built. The MCU (Teensy 4.1) is picked and does not block this.

Target: one side only — **carbon-tube spars** + printed / machined **end fittings** (F1–F7), knee spring, stroke / clearance toward a **9.5"** riser, inside **~24" tall / ~14" wide**.

**Layout (Steve 2026-09-20 / 09-21; as drawn on Sheet 1, 2026-09-27):** motor **at the wheel**; hip swing RS00 **high**, at the hip; knee RS02 **at the knee** (R39); **no belts** in the working plan (R32 / R33 apply only to the fallback); hip roll **in V1**. Rules: [`../mechanical.md`](../mechanical.md). Shop: [`../capabilities.md`](../capabilities.md). Parts: [`../parts-on-hand.md`](../parts-on-hand.md).

- [ ] Measure a real riser / fixture (height, tread, nosing).
- [x] **Sheet 1 — V1 layout** (2026-09-27): side / front / plan / stroke drawn from the model files, on the site at [`tools/living-drawings/sheet.html`](../../tools/living-drawings/sheet.html). Roll axes 3.0", hip band 9.1", leg plane 4.75", knee RS02 inboard at the knee, RS00 outboard at the hip, axle spacer 1.63". Belts: none. Pack moved to the top of the head 2026-09-27 (1" fwd, 4.3" up).
- [x] **Sheet 2 — tubes, fittings, spring, hub, wires** (2026-09-27): [`tools/living-drawings/sheet2.html`](../../tools/living-drawings/sheet2.html). 16 × 14 carbon, 40 mm sockets, cuts 191 / 196 mm; knee pulley-spring (~1.8 kN/m, Ø2.5" pulley) that brings the stand-up hold under the RS02 rating; RS05 flush outboard on a turned 3.75"-bead rim; 9.1" hip-band shell; wires inside the tubes with ports in F2 / F3 / F5. Open: RS05 output bearing rating; bolt patterns from the STEP files.
- [ ] Agree Sheets 1 and 2, then CAD the leg and the band from them; Blender for the head's styling (R23 met for the leg and band).
- [ ] Wheel vs. step vs. knee stroke is in that 2D set. **6" OD** tire in the **9.5" × 9.5"** slot (landing aimed 0.75" rear of centre, Sheet 1), **7.5" + 7.5"** tubes, **~6"** above the hip ([`../research/leg-geometry.md`](../research/leg-geometry.md)). Zantle 5" is a bench donor, not the foot. Stroke owns the rise.
- [ ] **COTS carbon tubes** for upper + lower main lengths: **16 × 14 mm** (Windcatcher, order-now cart), cuts ~191 / 196 mm, 40 mm bonded + cross-pinned sockets (Sheet 2). Printed / machined **end fittings** only (F1 / F5 / F6 machined; F2–F4 / F7 printed with inserts). Do not print or mill the spar (R34 / R19).
- [ ] Customs have **draft**, no lazy undercuts, printable orientation (R20). Machined / bent / welded customs are welcome.
- [ ] **Wire ports / cable paths** through links and body (R21): wires inside the tubes, ports in F2 / F3 / F5, service loops at knee and hip (Sheet 2).
- [ ] **Service access** to fasteners, battery, Teensy, actuators (R22). Not a sealed mono-leg. Threaded inserts; independently removable parts.
- [ ] Envelope: one wheel-leg that can share a **~14"** overall width and stay **≤ ~24"** tall at full extension.
- [ ] Wheel hub — motor **at the rim**, not hip-remote (R30): **RS05** (temporary lock, not ordered) flush with the tire's outboard face, stator on axle fitting F5, disc web to a turned 3.75"-bead rim (Sheet 2). Nothing proud of the 14" envelope. Open: RS05 output-bearing rating under the cantilevered rim (open call 14). Lathe / mill welcome.
- [ ] Knee **RS02 at the knee joint** for V1; hip-driven linkage is V2; no five-bar (R39, Sheet 1). R32 / R33 belt rules apply only to the fallback.
- [ ] Knee gravity spring (Sheet 2): extension spring along the upper tube, cable over a Ø2.5" pulley on the knee arm, **1.81 N·m/rad + 0.23 N·m preload** (~1.8 kN/m (10 lbf/in), 7 N preload, 3.4" travel, ~160 N at the stop). Takes the stand-up hold from **8.2 to 4.7 N·m** at the motor. Spring part still open (call 15). Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Plant-side joints (knee / hip swing / hip roll) sized for **one-wheel standing load (~2×)** (R36).
- [ ] Actuators on the sketch: RobStride set, **temporary lock** 2026-09-26 — RS02 knee + hip roll, RS00 hip swing, RS05 wheel. Not ordered. Servo / stepper+belt is the fallback for knee / swing only. GIM8108-8 was the earlier yardstick.
- [ ] Hip-roll axes in V1 at **3.0"** from the centreline (Sheet 1): RS02 roll housings in a 9.1" hip band under the 7" head, the Teensy / step-down / XT90-S between them; the pack at the top of the head. The band ends at the roll RS02 output-flange face (as first drawn it hit the RS00 at 4.5°); 1" chamfer on the head's lower long edges; roll stops ±50°. Hold 5.2 N·m with one wheel up vs 7 rated; the shift needs 3.2" of leg-length difference to stay level (axles 2.9" apart) (a controls term, `software.md`).
- [ ] First print / machine + fit.
- [ ] Raised wheel can reach a 9.5" tread **with margin**, without self-collision. Service loops at knee and hip do not snag.
- [ ] Only then: consider a second-leg copy.

Notes go in [`../../NOTES.md`](../../NOTES.md). CAD goes in [`../../cad/`](../../cad/) — **after** 2D.
