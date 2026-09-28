# Hux requirements

Draft from Steve, 2026-09-20, plus scale / structure 2026-09-21. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Decision log: [`decisions.md`](decisions.md). Architecture is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

**2026-09-28 governing update:** no components purchased; stair architecture reopened. [Head and leg review](head-and-leg-review.md) supersedes earlier sizing claims. R2/R3/R17 remain requirements, not demonstrated capabilities.

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2), [XRobots](research/xrobots.md), and Steve's shares in [`research/inspiration.md`](research/inspiration.md) (Roadrunner, FrRonconi student balancer, Build Some Stuff / Serra). Steal ideas. Do not vendor.

## Hard requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R1 | Balance on **two** wheeled legs | Baseline stance / teleop |
| R2 | Balance on **one** wheeled leg | Gate before stair cycle |
| R3 | Step **up or down a 9.5" × 9.5" step** | Rise **and** going, nosing to nosing. Stroke owns the rise. The going is what the wheel has to sit in. [`research/leg-geometry.md`](research/leg-geometry.md). |
| R4 | Wi‑Fi telemetry | Companion or bridge |
| R5 | RC control via **TBS Nano RX** | Bind to FC (or dedicated link into FC) |
| R6 | **In-wheel brushless FOC** driven wheels | ESC + BLDC + encoder per wheel. Motor **at the rim** (R30). Not steppers. SKU TBD. |
| R7 | Legs via **strong linkages + springs** | Gravity compensation / energy return. Prefer linkage over *pure* serial belts. A belt, if present, is reduction — not a replacement linkage. |
| R8 | Local compute for **pathfinding inference** | Needs cameras; not on the FC |
| R9 | Cameras | At least one stream for teleop; stereo / depth later for stairs |
| R10 | **Electric-only** powertrain | Entire robot is electric. No ICE, no hybrid. |
| R11 | Battery: **8S LiPo**, regulated logic rails | Retain 33.6 V full / 29.6 V nominal / 26.4 V planning cutoff; exact pack/revision and under-load limits require validation. 2.7–3.3 Ah packaging study, no SKU. **60-V-input-rated regulator class**, with transient/regen design. Vendor 15/24 V minimum conflict is recorded in [review](head-and-leg-review.md). |
| R12 | Knee + hip swing: **CAN QDD / FOC working class** (2026-09-26); servo vs stepper+belt is the **fallback** | No SKU. Size whichever we pick for one-leg plant load (R36). Powerful / fast / reliable still required. **GIM8108-8** is a *candidate* for these axes — not ordered, not locked. See [`research/actuators-legs.md`](research/actuators-legs.md). |
| R13 | Approximately **6-inch OD** real-rubber wheels | **Width/contact profile reopened 2026-09-28** to fix single support. 80 mm dual-contact wheel-foot is an unsourced study allocation. Tire width is not a measured support polygon. No Zantle purchase or wheel SKU. |
| R14 | Four **manual** modes before autonomy | **`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`**. Spec: [`software.md`](software.md). Gate before open-loop step, pathfinding motion, stair scripts. |
| R15 | V1 overall width **~14"** | Outside-to-outside, wheels included. The head sits inside. Legs and wheels are outside the head. |
| R16 | **Hip roll remains in the research baseline** | Joint travel, leverage and ankle support are reopened. Do not buy or ship an inadequate joint merely to preserve the old eight-axis drawing. |
| R17 | **Controlled one-leg support and return** before stairs | Lateral support moment and fore-aft balance must both be real. A 0.2-second hop is not a substitute. Proposed bench gate: 10-second support, ±10 mm CoM uncertainty and controlled return on both legs. |
| R18 | **Reuse existing control** | Explicit non-goal: writing a novel Hux balance stack from scratch for V1. TBD which we adopt. |
| R19 | Prefer **cheap COTS stock** for primary structure | Carbon tubes / rods, metal stock, fasteners. Do not custom-print a spar when off-the-shelf will do. Printed / machined parts are joints, hubs, brackets. |
| R20 | Custom parts are **draft-friendly** | 3D print now, injection mold later. Avoid undercuts; parting-line awareness; printable orientation. |
| R21 | **Wire openings and ports** through links / body | Cable paths are designed in, not drilled later. |
| R22 | **Serviceable V1** | Access to fasteners, batteries, FC, actuators. Replaceable modules over sealed mono-bodies. |
| R23 | **Several 2D sketch layouts** before any Blender / 3D CAD | Hard process gate. |
| R25 | Wheel motors sized for **reaction speed / torque bandwidth** | Balance actuator, not max continuous power. 8S bus, CAN. Two wheel motors + drivers must leave room for pose joints, structure, pack, FC, Pi. |
| R26 | Leg actuators **by axis role** | Jobs differ. Do not force one type on roll, swing, and knee. Trade: [`research/actuators-legs.md`](research/actuators-legs.md). |
| R27 | Hip-roll actuator = **dynamic** FOC BLDC / **small** QDD / fast bus servo | Working V1 class. High-rate torque; ideally backdrivable. Pairs with planted-wheel fore/aft (R17). |
| R29 | Axis count follows validated mechanism; MCU does not drive coils | Eight-axis old model is rejected for stair procurement. Ten-axis hip/ankle candidate under study. Three classic-CAN buses with a verified mixed-rate schedule; do not budget all nodes at 1 kHz. |
| R30 | Wheel **BLDC at the wheel** | Hub / coaxial at the rim. Not remote-driven from the hip. |
| R31 | **kV match** is a sizing goal | 8S + wheel diameter + balance bandwidth. TBD — no invented number. |
| R32 | Prefer **proximal actuator mass** | Keep any stepper pose motors above the knee. The active ankle-roll candidate explicitly trades added distal mass for a ground-moment load path; account for its mass and inertia before accepting it. |
| R33 | If belts: **one inside, one outside**; integrate pulley where possible | Clearance / service / no rub. Face assignment TBD on the 2D set. Draft-friendly printed tooth form (R20) or COTS pulley fallback. |
| R34 | Primary **upper + lower leg spars** are **carbon fiber tubes** | COTS (R19). Printed / machined **fittings at the ends** only (hubs, belt mounts, joint flanges). Do not print or mill the spar. Tube OD / wall TBD. |
| R35 | V1 envelope up to **~24" tall at full extension** | Still must reach a **~9.5"** riser **with margin** (R3). Width is **~14"** (R15). |
| R36 | Size for **single-support loads and complete duty cycle** | Full load-path/inverse-dynamics calculation, contact margin, mounted thermal limits and transients; ~2× average is only a preliminary heuristic. Peak torque is not a continuous holding allowance. |
| R37 | **V1 finish line: one 9.5" step, 9 of 10 attempts, from a standstill on the lower tread** | 2026-09-27. A full flight is V2 on the same hardware. North star (stairs) unchanged. Supersedes nothing; names the pass mark for R3. |
| R38 | **1.5 m/s top, 1.0 m/s cruise** remains the flat-ground target | Battery-dependent torque-speed reserve is unverified on hardware. The legacy straight-line motor curve is a scenario, not qualification. |
| R39 | **Knee actuator at the knee in V1; knee gravity spring in scope; no parallel / five-bar leg** | 2026-09-27. Hip-driven knee linkage is a V2 refinement. [`research/knee-linkage.md`](research/knee-linkage.md). |
| R40 | **V1 terrain: flat + 1" sills + ~20° slopes** | 2026-09-27. Rough outdoor ground is V3 / Phase E (controls + perception), not a leg change. |

## Soft requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R24 | V1 mass **aspirational 4–5 lb** / **under 6 lb** — **historical soft preference only** | Steve 2026-09-21: budget is **explicitly blown / soft**. Capability and packaging over the old number. **Not a gate.** Sketch: [`mechanical.md`](mechanical.md). |
| R28 | All-stepper is **not** the baseline | Residual risk only. If later forced onto *roll*: closed-loop, minimal-backlash belts, accept lower one-leg bandwidth. Do not fake a CoG shift in software. Do not delete the V1 roll axis. Wheels stay FOC (R6). |

## Current architecture and milestones

- Four layers remain: CAN actuators → portable control core → real-time MCU → ROS 2 companion. A 1 kHz estimator does not require every CAN node to update at 1 kHz.
- No Hux components are purchased/ordered. Historical personal electronics are unverified reuse possibilities, not free BOM inventory. [parts-on-hand.md](parts-on-hand.md).
- Keep 24-inch height / 14-inch width as the compact target. The approximately 26-inch candidate and different landing track are explicit alternatives requiring a decision, not silent requirement changes.
- H1 head, link lengths, wider contacts, ankle mechanism and actuator reductions remain candidates. [head-and-leg-review.md](head-and-leg-review.md).
- Choose the support mechanism; find a continuous full-step path with real joint centers and swept clearances; mock up packages; test one representative axis and contact assembly; validate single support; only then buy the remaining set.
- Existing modes precede autonomous motion. Supported `PARKED` requires a rest support; power loss is not a guaranteed safe park.
- V1 one-step success is 9/10 (R37). Neither a floor hop nor individually reachable poses passes it. Both feet must finish on the upper tread.

## 2026-09-28 engineering gates

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| R41 | Fix single support and full stair geometry before full-set procurement | Continuous, collision-free complete step plus controlled support/return; no hidden extra joint or clamped reach |
| R42 | Itemized head mass properties and explicit coordinate transforms | Mass, CoM, inertia, units, status and revision; pack position is not whole-head CoM |
| R43 | Firm decisions cascade as one revision | CAD joint centers, contact geometry, BOM, dynamics and firmware joint map agree; historical models labeled |
| R44 | Stationary thermal and bus-load budgets are real | Mounted duty test; timestamped joint data, bus utilization/deadline measurements, transient/regen validation |

Working milestones: [NOTES.md](../NOTES.md). All proposed changes are logged in [decisions.md](decisions.md).
