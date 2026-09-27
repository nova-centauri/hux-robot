# Hux requirements

Draft from Steve, 2026-09-20, plus scale / structure 2026-09-21, the stack 2026-09-26 and the V1 direction (R37–R40) 2026-09-27. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Decision log: [`decisions.md`](decisions.md). Architecture is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2), [XRobots](research/xrobots.md), and Steve's shares in [`research/inspiration.md`](research/inspiration.md) (Roadrunner, FrRonconi student balancer, Build Some Stuff / Serra). Steal ideas. Do not vendor.

## Hard requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R1 | Balance on **two** wheeled legs | Baseline stance / teleop |
| R2 | Balance on **one** wheeled leg | Gate before stair cycle. **Steve 2026-09-27: wants a static one-leg stand if possible — it matters for stairs later.** **Open (2026-09-26 study):** a *static* one-wheel stand is not available on this geometry (acrobot, 2–3 mm capture region); what the stair needs is a timed single support — poise at ~8 %, free wheel up ≤ 0.3 s, land. [`research/one-leg-stance.md`](research/one-leg-stance.md). A real stand needs a design change — reaction wheel, higher body CoM, or a measured tire patch (NOTES open call 21). |
| R3 | Step **up or down a 9.5" × 9.5" step** | Rise **and** going, nosing to nosing. Stroke owns the rise. The going is what the wheel has to sit in. [`research/leg-geometry.md`](research/leg-geometry.md). |
| R4 | Wi‑Fi telemetry | Companion or bridge |
| R5 | RC control via **TBS Nano RX** | CRSF into a full UART on the real-time MCU (**Teensy 4.1**). The on-hand FCs are P0–P1 bench boards. |
| R6 | **In-wheel brushless FOC** driven wheels | One integrated CAN actuator per wheel (driver + encoder on board): **RobStride 05, temporary lock** (2026-09-26). Motor **at the rim** (R30), outboard face flush with the tire (Sheet 2). Not steppers. |
| R7 | Legs via **strong linkages + springs** | Gravity compensation / energy return. **V1 (R39):** serial leg, RS02 at the knee, knee gravity spring on a pulley (Sheet 2); no belts. A hip-driven knee linkage is V2. |
| R8 | Local compute for **pathfinding inference** | Needs cameras; on the companion (Pi 5 now, Jetson at P5), never on the MCU |
| R9 | Cameras | At least one stream for teleop; stereo / depth later for stairs |
| R10 | **Electric-only** powertrain | Entire robot is electric. No ICE, no hybrid. |
| R11 | Battery: **8S LiPo** + **regulated step-down** | **33.6 V full / 29.6 V nominal / 26.4 V cutoff.** One 8S 3300 mAh 50–60C, XT90; XT90-S on the harness. Set by the RobStride 24 V floor (2026-09-26). Regulators ≥36 V in. [`research/actuator-shortlist.md`](research/actuator-shortlist.md). Actuators on the pack; **5 V** rail for MCU / RX / Pi, **12–19 V** rail for the companion slot. Superseded 4S on 2026-09-26. No pack / regulator SKU. |
| R12 | Knee + hip swing: **CAN QDD / FOC working class** (2026-09-26); servo vs stepper+belt is the **fallback** | **Temporary lock 2026-09-26: RS02 knee, RS00 hip swing** (`tools/living-drawings/actuators.js`). Not ordered. Size for one-leg plant load (R36): knee stand-up 12.4 N·m, 6.4 at the motor with the Sheet 2 spring. GIM8108-8 was the earlier yardstick. [`research/actuator-shortlist.md`](research/actuator-shortlist.md). |
| R13 | Wheels: **6" OD**, **~1–1.25" wide**, real rubber, torsionally stiff | **Locked.** A measured OD of **5.75–6.25"** still counts. Whole tire sits in the 9.5" going with ~±1.75" of roll. 5" Zantle is a bench donor, not the foot. Not a buy. No spokes. [`research/leg-geometry.md`](research/leg-geometry.md). |
| R14 | Four **manual** modes before autonomy | **`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`**. Spec: [`software.md`](software.md). Gate before open-loop step, pathfinding motion, stair scripts. |
| R15 | V1 overall width **~14"** | Outside-to-outside, wheels included. The head sits inside. Legs and wheels are outside the head. |
| R16 | **Hip roll is IN V1** | Dynamic FOC / QDD / fast servo (R27). Experimental — may not work as hoped. Still ship the joint and the one-leg modes. **Not a stepper. Not V2.** |
| R17 | One-leg balance is a **full loop** | (a) hip roll keeps weight over the planted wheel, **and** (b) that wheel drives fore/aft so the contact stays under the CoG. |
| R18 | **Reuse existing control** | Explicit non-goal: writing a novel Hux balance stack from scratch for V1. TBD which we adopt. |
| R19 | Prefer **cheap COTS stock** for primary structure | Carbon tubes / rods, metal stock, fasteners. Do not custom-print a spar when off-the-shelf will do. Printed / machined parts are joints, hubs, brackets. |
| R20 | Custom parts are **draft-friendly** | 3D print now, injection mold later. Avoid undercuts; parting-line awareness; printable orientation. |
| R21 | **Wire openings and ports** through links / body | Cable paths are designed in, not drilled later. |
| R22 | **Serviceable V1** | Access to fasteners, batteries, MCU, actuators. Replaceable modules over sealed mono-bodies. |
| R23 | **Several 2D sketch layouts** before any Blender / 3D CAD | Hard process gate. |
| R25 | Wheel motors sized for **reaction speed / torque bandwidth** | Balance actuator, not max continuous power. 8S bus, CAN. Two wheel motors + drivers must leave room for pose joints, structure, pack, FC, Pi. |
| R26 | Leg actuators **by axis role** | Jobs differ. Do not force one type on roll, swing, and knee. Trade: [`research/actuators-legs.md`](research/actuators-legs.md). |
| R27 | Hip-roll actuator = **dynamic** FOC BLDC / **small** QDD / fast bus servo | Working V1 class. High-rate torque; ideally backdrivable. Pairs with planted-wheel fore/aft (R17). **Temporary lock: RS02.** Roll axes at 3.0" (Sheet 1): one-wheel hold 6.3 N·m vs 7 rated. |
| R29 | **I/O:** **8 axes**; **the MCU does not drive stepper coils** | Working plan (2026-09-26): **eight CAN nodes on two classic 1 Mbit buses** from the Teensy 4.1 — A: 2 wheel + 2 hip roll, B: 2 knee + 2 hip swing. If the stepper fallback is ever used on knee / swing, its drivers sit behind CAN or step/dir, never the MCU's GPIO; drone firmware as a stepper host is an anti-pattern. Spec: [`electronics.md`](electronics.md). |
| R30 | Wheel **BLDC at the wheel** | Hub / coaxial at the rim. Not remote-driven from the hip. |
| R31 | **kV match** is a sizing goal | Answered by the RS05 lock: its torque-speed line on 8S at the 6" wheel sets R38 (1.5 / 1.0 m/s, `spec.js`). Revisit only if the wheel actuator changes. |
| R32 | Pose-actuator mass **high** | Stepper / belt **fallback only** — the working plan puts the RS02 at the knee and the RS00 at the hip (R39). Do not hang pose motors at the shin or wheel. |
| R33 | If belts: **one inside, one outside**; integrate pulley where possible | Fallback only — the working plan has no belts (Sheet 2). |
| R34 | Primary **upper + lower leg spars** are **carbon fiber tubes** | COTS (R19). Printed / machined **fittings at the ends** only (F1–F7 on Sheet 2). Do not print or mill the spar. **16 × 14 mm** for both links (Windcatcher, order-now cart); cuts ~191 / 196 mm, 40 mm bonded + pinned sockets. |
| R35 | V1 envelope up to **~24" tall at full extension** | Still must reach a **~9.5"** riser **with margin** (R3). Width is **~14"** (R15). |
| R36 | **One-wheel standing load** ≈ **2×** two-wheel stance | Plant-side knee, hip swing, and hip roll see roughly all the weight on one leg path. **Size for that case**, not average two-wheel load. Rule of thumb until we weigh a real Hux. The hip roll does not follow the ratio: it carries the body + free-leg cantilever (6.3 N·m at 3.0", `frontal.js`). |
| R37 | **V1 finish line: one 9.5" step, 9 of 10 attempts, from a standstill on the lower tread** | 2026-09-27. A full flight is V2 on the same hardware. North star (stairs) unchanged. Supersedes nothing; names the pass mark for R3. |
| R38 | **Flat-ground top speed 1.5 m/s, cruise 1.0 m/s** | 2026-09-27. Locked RS05 on 8S at the 6" wheel with ~2 N·m of catch torque in reserve (~1.3 m/s near cutoff). Not 2 m/s. |
| R39 | **Knee actuator at the knee in V1; knee gravity spring in scope; no parallel / five-bar leg** | 2026-09-27. Hip-driven knee linkage is a V2 refinement. [`research/knee-linkage.md`](research/knee-linkage.md). |
| R40 | **V1 terrain: flat + 1" sills + ~20° slopes** | 2026-09-27. Rough outdoor ground is V3 / Phase E (controls + perception), not a leg change. |

## Soft requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R24 | V1 mass **aspirational 4–5 lb** / **under 6 lb** — **historical soft preference only** | Steve 2026-09-21: budget is **explicitly blown / soft**. Capability and packaging over the old number. **Not a gate.** Sketch: [`mechanical.md`](mechanical.md). |
| R28 | All-stepper is **not** the baseline | Residual risk only. If later forced onto *roll*: closed-loop, minimal-backlash belts, accept lower one-leg bandwidth. Do not fake a CoG shift in software. Do not delete the V1 roll axis. Wheels stay FOC (R6). |

## Soft / architecture intent

- Four layers (2026-09-26): CAN actuators with their own FOC / PD → portable control core (C++ library) → CAN real-time MCU at 1 kHz (IMU, CRSF, watchdog) → ROS 2 Linux companion (Pi 5 now, Jetson at P5). ESP32 optional Wi‑Fi / telemetry bridge. [`software.md`](software.md).
- Entire robot is **electric**. **8S** one 3300 mAh LiPo (2026-09-26); the distribution board stays **TBD**. Pose / logic on **regulated** rails. Do not invent a stack.
- **Knee + hip swing:** CAN QDD working class, temporarily locked to RS02 / RS00 (2026-09-26); RS02 **at the knee** with a gravity spring (R39). Servo / stepper+belt is the fallback only. The 2026-09-20 "undecided" note is superseded.
- **Hip roll ships in V1** even if the first actuator is imperfect. One-leg CoG shift is a **best-effort** goal.
- V1 scale: **~24" tall at full extension** (R35), **~14" wide** (R15). The head is inside that width. Leg geometry still owns the **~9.5"** step (R3) with margin.
- Structure: **carbon tubes** for the long bits of upper and lower leg (R34). Shop fittings at the ends — print / mill / lathe; see [`capabilities.md`](capabilities.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md).
- Joint actuators sit at **hip / knee** with tube between (RS00 at the hip, RS02 at the knee). No belts in the working plan.
- Higher CoG: slower inverted-pendulum fall (helps) and more inertia / longer disturbance arms (hurts).
- Mass is **soft**. Old 4–5 lb / under 6 lb numbers stay as a preference, not a kill-switch.
- Fabrication: COTS first (R19), draft-friendly customs (R20), wire ports (R21), service access (R22), **2D before Blender** (R23).
- Hattori V2 lessons: extra leg DOF helps stairs / fall recovery; larger wheels help terrain; serial / linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small; **motors at the wheels**.
- Serra / Build Some Stuff lessons (packaging, not files): in-wheel BLDC + encoder; jointed legs keep CoG over contact as height changes; serviceable modular prints; wheel-under-CoG geometry. See [`research/inspiration.md`](research/inspiration.md).
- No **new** spend until Steve approves purchases. Prefer parts he already owns. 5" Zantle wheels already ordered — bench donor only. The 6" wheel is a locked size, not an order.

## Candidate hardware (on hand / ordered)

Inventory (owned / ordered, reserved TBD): [`parts-on-hand.md`](parts-on-hand.md). Shop tools (not parts): [`capabilities.md`](capabilities.md). Candidates that are **not owned**: same page, Candidates section (GIM8108-8).

- Bench FCs (no CAN): F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Wheels: **6" OD** locked. 5" Zantle **bench donor** ordered (not a BLDC hub, not the foot). [`research/leg-geometry.md`](research/leg-geometry.md).
- Motors: **temporary lock** — 2× RS05 wheel, 4× RS02 knee + roll, 2× RS00 swing. Not ordered.
- Battery: **8S 3300 mAh 50–60C LiPo, XT90.** Brand TBD.
- Knee / hip swing: RS02 / RS00 (temporary lock); servo / stepper+belt fallback.
- Hip roll: RS02 (temporary lock), roll axes 3.0".
- Structure: 16 × 14 mm carbon tube (R34), 2 × 1 m in the order-now cart.

## Recommended default (proposal)

- **Real-time MCU:** **Teensy 4.1** (picked 2026-09-26, order-now cart) + ICM-42688-P + 3× CAN transceivers. The on-hand FCs are bench boards for P0–P1; none has CAN. Architecture: [`software.md`](software.md).
- **Battery:** **8S 3300 mAh LiPo** + **controlled step-down** to 5 V and 12–19 V rails (≥36 V-in regulators). One pack. Regulator SKU **TBD**.
- **Wheels:** in-wheel brushless FOC. **6" OD × ~1–1.25"** real rubber, torsionally stiff. Locked size, not a buy. Zantle 5" is a bench donor. Geometry: [`research/leg-geometry.md`](research/leg-geometry.md).
- **Knee / hip swing:** RS02 knee (at the knee, spring) / RS00 swing, temporary lock; servo / stepper+belt fallback.
- **Hip roll:** **in V1**, RS02 temporary lock, roll axes 3.0", experimental / best-effort CoG shift.
- **Companion:** Pi 5 in containers on ROS 2 now; Jetson (Orin Nano Super kit class) at P5 for perception. Not a pose brain — pose joints are on CAN.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one wheel-leg — carbon-tube spars + printed / machined end fittings + knee pulley spring — sized toward a 9.5" step, inside a **~24" tall / ~14" wide** envelope. **2D first: Sheet 1 (layout) and Sheet 2 (make-up) are drawn**; CAD once Steve agrees both.
- **Mass:** soft. 4–5 lb / under 6 lb is historical preference, not a gate.

The only authorized spend is the [`bom.md`](bom.md) order-now cart (tires, tubes, carbon tube, Teensy kit, XT90-S, 8S pack). The actuator set is a temporary lock, not an order; the first buy, when Steve says so, is one RS02 on the Teensy.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Several **2D sketch layouts** (R23) — **Sheet 1 and Sheet 2 drawn 2026-09-27** — then size + fit first wheel-leg (carbon-tube spars, end fittings) for ~9.5" inside the ~24" envelope, including **one-wheel load**.
3. Blink LED on the bench board → restrained wheel spin (not on carpet); one RS02 on the Teensy as the first actuator test.
4. Manual modes: **`PARKED` → `TWO_WHEEL`** (TBS + telem).
5. **`LEFT_ONLY` / `RIGHT_ONLY`** — V1 best-effort CoG shift via hip roll + planted-wheel fore/aft.
6. Open-loop step-up toward 9.5" riser fixture. Not before the four modes work. **V1 finish line: one step, 9/10 (R37).**
7. Camera stream → local pathfinding later.
8. ~~Lock the MCU into [`electronics.md`](electronics.md)~~ — done 2026-09-26: Teensy 4.1.
