# Hux requirements

Draft from Steve, 2026-09-20, plus scale / structure 2026-09-21. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Decision log: [`decisions.md`](decisions.md). Architecture is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

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
| R11 | Battery: **6S** class (LiPo preferred; high-drain Li-ion acceptable) + **regulated step-down** | **~22.2 V nominal / 25.2 V full.** Pack on hold 6S vs **8S** (recommended — RobStride 24 V floor); XT90-S on the harness. [`research/actuator-shortlist.md`](research/actuator-shortlist.md). Actuators on the pack; **5 V** rail for MCU / RX / Pi, **12–19 V** rail for the companion slot. Superseded 4S on 2026-09-26. No pack / regulator SKU. |
| R12 | Knee + hip swing: **CAN QDD / FOC working class** (2026-09-26); servo vs stepper+belt is the **fallback** | No SKU. Size whichever we pick for one-leg plant load (R36). Powerful / fast / reliable still required. **GIM8108-8** is a *candidate* for these axes — not ordered, not locked. See [`research/actuators-legs.md`](research/actuators-legs.md). |
| R13 | Wheels: **6" OD**, **~1–1.25" wide**, real rubber, torsionally stiff | **Locked.** A measured OD of **5.75–6.25"** still counts. Whole tire sits in the 9.5" going with ~±1.75" of roll. 5" Zantle is a bench donor, not the foot. Not a buy. No spokes. [`research/leg-geometry.md`](research/leg-geometry.md). |
| R14 | Four **manual** modes before autonomy | **`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`**. Spec: [`software.md`](software.md). Gate before open-loop step, pathfinding motion, stair scripts. |
| R15 | V1 overall width **~14"** | Outside-to-outside, wheels included. The head sits inside. Legs and wheels are outside the head. |
| R16 | **Hip roll is IN V1** | Dynamic FOC / QDD / fast servo (R27). Experimental — may not work as hoped. Still ship the joint and the one-leg modes. **Not a stepper. Not V2.** |
| R17 | One-leg balance is a **full loop** | (a) hip roll keeps weight over the planted wheel, **and** (b) that wheel drives fore/aft so the contact stays under the CoG. |
| R18 | **Reuse existing control** | Explicit non-goal: writing a novel Hux balance stack from scratch for V1. TBD which we adopt. |
| R19 | Prefer **cheap COTS stock** for primary structure | Carbon tubes / rods, metal stock, fasteners. Do not custom-print a spar when off-the-shelf will do. Printed / machined parts are joints, hubs, brackets. |
| R20 | Custom parts are **draft-friendly** | 3D print now, injection mold later. Avoid undercuts; parting-line awareness; printable orientation. |
| R21 | **Wire openings and ports** through links / body | Cable paths are designed in, not drilled later. |
| R22 | **Serviceable V1** | Access to fasteners, batteries, FC, actuators. Replaceable modules over sealed mono-bodies. |
| R23 | **Several 2D sketch layouts** before any Blender / 3D CAD | Hard process gate. |
| R25 | Wheel motors sized for **reaction speed / torque bandwidth** | Balance actuator, not max continuous power. 6S bus, CAN. Two wheel motors + drivers must leave room for pose joints, structure, pack, FC, Pi. |
| R26 | Leg actuators **by axis role** | Jobs differ. Do not force one type on roll, swing, and knee. Trade: [`research/actuators-legs.md`](research/actuators-legs.md). |
| R27 | Hip-roll actuator = **dynamic** FOC BLDC / **small** QDD / fast bus servo | Working V1 class. High-rate torque; ideally backdrivable. Pairs with planted-wheel fore/aft (R17). |
| R29 | **I/O:** up to **8 axes**; **FC does not drive stepper coils** | If pose joints are steppers: 2 wheel BLDC + 4 steppers + 2 hip-roll dynamic. Driver board(s) between host and steppers. Preferred: FC = IMU + wheel FOC (+ roll if PWM/CAN); **Pi or dedicated stepper controller** = pose step/dir. Drone firmware as stepper host is a V1 anti-pattern. If servos are chosen instead, still 8 axes — different drivers. Spec: [`electronics.md`](electronics.md). |
| R30 | Wheel **BLDC at the wheel** | Hub / coaxial at the rim. Not remote-driven from the hip. |
| R31 | **kV match** is a sizing goal | 6S + wheel diameter + balance bandwidth. TBD — no invented number. |
| R32 | Pose-actuator mass **high** | If steppers: mount **above the knee**; belts to the pivots. Do not hang pose motors at the shin or wheel. |
| R33 | If belts: **one inside, one outside**; integrate pulley where possible | Clearance / service / no rub. Face assignment TBD on the 2D set. Draft-friendly printed tooth form (R20) or COTS pulley fallback. |
| R34 | Primary **upper + lower leg spars** are **carbon fiber tubes** | COTS (R19). Printed / machined **fittings at the ends** only (hubs, belt mounts, joint flanges). Do not print or mill the spar. Tube OD / wall TBD. |
| R35 | V1 envelope up to **~24" tall at full extension** | Still must reach a **~9.5"** riser **with margin** (R3). Width is **~14"** (R15). |
| R36 | **One-wheel standing load** ≈ **2×** two-wheel stance | Plant-side knee, hip swing, and hip roll see roughly all the weight on one leg path. **Size for that case**, not average two-wheel load. Rule of thumb until we weigh a real Hux. |

## Soft requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R24 | V1 mass **aspirational 4–5 lb** / **under 6 lb** — **historical soft preference only** | Steve 2026-09-21: budget is **explicitly blown / soft**. Capability and packaging over the old number. **Not a gate.** Sketch: [`mechanical.md`](mechanical.md). |
| R28 | All-stepper is **not** the baseline | Residual risk only. If later forced onto *roll*: closed-loop, minimal-backlash belts, accept lower one-leg bandwidth. Do not fake a CoG shift in software. Do not delete the V1 roll axis. Wheels stay FOC (R6). |

## Soft / architecture intent

- Four layers (2026-09-26): CAN actuators with their own FOC / PD → portable control core (C++ library) → CAN real-time MCU at 1 kHz (IMU, CRSF, watchdog) → ROS 2 Linux companion (Pi 5 now, Jetson at P5). ESP32 optional Wi‑Fi / telemetry bridge. [`software.md`](software.md).
- Entire robot is **electric**. **6S** (LiPo preferred; 2026-09-26); pack capacity / C and the power bus stay **TBD**. Pose / logic on **regulated** rails. Do not invent a stack.
- **Knee + hip swing undecided** (Steve 2026-09-20 follow-up). Document both servo and stepper+belt. Do not prefer one in the baseline. Size either for R36. **GIM8108-8** is a candidate, not an order.
- **Hip roll ships in V1** even if the first actuator is imperfect. One-leg CoG shift is a **best-effort** goal.
- V1 scale: **~24" tall at full extension** (R35), **~14" wide** (R15). The head is inside that width. Leg geometry still owns the **~9.5"** step (R3) with margin.
- Structure: **carbon tubes** for the long bits of upper and lower leg (R34). Shop fittings at the ends — print / mill / lathe; see [`capabilities.md`](capabilities.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md).
- Longer tubes → **longer belt runs** if a belt is the joint reducer. Joint actuators sit at **hip / knee** with tube between.
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
- Motors: in-wheel brushless FOC (exact models TBD)
- Battery: **6S** *class*. No pack SKU. Capacity / C **TBD**.
- Knee / hip swing: **CAN QDD** working class; servo / stepper+belt fallback. GIM8108-8 candidate (not ordered).
- Hip roll: dynamic class (R27). SKU TBD.
- Structure: carbon-tube spars **class** (R34). No tube SKU.

## Recommended default (proposal)

- **Real-time MCU:** **CAN-capable** (Teensy 4.1-class or H743-WING-class), picked with the actuators (2026-09-26). The on-hand FCs are bench boards for P0–P1; none has CAN. Architecture: [`software.md`](software.md).
- **Battery:** **6S class** + **controlled step-down** to 5 V and 12–19 V rails. One pack or two in parallel. Capacity / C / pack / regulator SKU **TBD**.
- **Wheels:** in-wheel brushless FOC. **6" OD × ~1–1.25"** real rubber, torsionally stiff. Locked size, not a buy. Zantle 5" is a bench donor. Geometry: [`research/leg-geometry.md`](research/leg-geometry.md).
- **Knee / hip swing:** **CAN QDD** working class on 6S; servo / stepper+belt fallback. Size for one-leg (~2×) load. GIM8108-8 is a candidate only.
- **Hip roll:** **in V1**, dynamic class, experimental / best-effort CoG shift.
- **Companion:** Pi 5 in containers on ROS 2 now; Jetson (Orin Nano Super kit class) at P5 for perception. Not a pose brain — pose joints are on CAN.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one wheel-leg — carbon-tube spars + printed / machined end fittings + linkage / spring stub — sized toward a 9.5" step, inside a **~24" tall / ~14" wide** envelope, **2D layouts first**.
- **Mass:** soft. 4–5 lb / under 6 lb is historical preference, not a gate.

Do not buy anything for this list. Wheels already ordered stay on [`parts-on-hand.md`](parts-on-hand.md) only. Do not lock the FC, a tube, or a joint SKU.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Several **2D sketch layouts** (R23), then size + fit first wheel-leg (carbon-tube spars, end fittings) for ~9.5" inside the ~24" envelope, including **one-wheel (~2×) load**. FC stays TBD. Servo vs stepper TBD.
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Manual modes: **`PARKED` → `TWO_WHEEL`** (TBS + telem).
5. **`LEFT_ONLY` / `RIGHT_ONLY`** — V1 best-effort CoG shift via hip roll + planted-wheel fore/aft.
6. Open-loop step-up toward 9.5" riser fixture. Not before the four modes work.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
