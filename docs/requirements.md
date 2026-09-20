# Hux requirements

Draft from Steve, 2026-09-20. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) and similar platforms.

## Hard requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R1 | Balance on **two** wheeled legs | Baseline stance / teleop |
| R2 | Balance on **one** wheeled leg | Gate before stair cycle |
| R3 | Step **up or down ~9.5"** | Nominal residential riser target; design leg stroke/clearance around this |
| R4 | Wi‑Fi telemetry | Companion or bridge |
| R5 | RC control via **TBS Nano RX** | Bind to FC (or dedicated link into FC) |
| R6 | **Brushless** driven wheels | ESC + BLDC per wheel |
| R7 | Legs via **strong linkages + springs** | Gravity compensation / energy return; prefer linkage over pure serial belts for V1 simplicity |
| R8 | Local compute for **pathfinding inference** | Needs cameras; not on the FC |
| R9 | Cameras | At least one stream for teleop; stereo/depth later for stairs |
| R24 | V1 total mass **under 6 lb** | Hard ceiling. Aspirational **4–5 lb** (~1.8–2.3 kg). Mass-budget lines are TBD — see [`mechanical.md`](mechanical.md). |
| R25 | Wheel motors sized for **reaction speed / torque bandwidth** (balance), not max continuous power | ~4–6" skinny rubber wheels (R13 when that lands); **4S** bus (R11 when that lands). Two wheel motors + drivers must leave mass room for hip/knee actuators, structure, 4S pack, FC, Pi. Classes only — [`electronics.md`](electronics.md). |

IDs **R10–R23** are unused here so concurrent 2026-09-20 hardware, modes, hip-roll / reuse-control, and fabrication notes can take them without renumbering this packet. **R18** (reuse existing control) is assumed from that concurrent note — this page applies it to wheel *drive*: prefer FOC / torque-mode stacks over inventing electronics.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- V1 mass lean is **under 6 lb**, aiming **4–5 lb**. Every wheel-motor class has to leave room for hip/knee, structure, pack, FC, and Pi. Do not pick a drive that eats the budget.
- Wheel motors are a **balance actuator**, not a traction motor. Select for how fast they can put torque on a skinny 4–6" rim (torque bandwidth), not peak continuous watts.
- **Reuse existing control** (R18): FOC / torque-mode stacks already in the world (SimpleFOC, gimbal-class patterns). Do not invent Hux drive electronics for V1.
- Candidate *classes* only, not buys: lightweight gimbal BLDC ~2208–4108 + FOC driver + magnetic encoder; mid = small outrunner + planetary/cycloidal if 6" + one-leg needs more torque. **Avoid** large ODrive 63xx / hoverboard hubs (SonicRobot class — too heavy for a 4–6 lb Hux).
- Rough physics (order-of-magnitude, not a gain): at ~2 kg and ~0.25 m CoG, a ~10° tip needs ~**0.8 Nm** restoring at the CoG. One-leg puts that on **one** wheel. Reduction multiplies motor torque but adds backlash / reflected inertia.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- No spend until Steve approves purchases. Prefer parts he already owns. No locked wheel-motor SKU.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD). Drive *class* TBD — see R25 / [`electronics.md`](electronics.md). No SKU.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Mass:** V1 **under 6 lb**; aspirational **4–5 lb** (~1.8–2.3 kg). Budget lines TBD.
- **Wheel drive class:** reaction-speed / torque-bandwidth FOC stack on a 4S bus, sized for ~4–6" skinny rubber. Lightweight: gimbal ~2208–4108 + FOC + mag encoder. Mid: small outrunner + reduction if one-leg on 6" needs it. Not ODrive 63xx / hoverboard. No SKU. Reuse FOC/torque-mode (R18) — do not invent the drive.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software. Whole robot still has to come in **under 6 lb**.

Do not buy anything for this list. Do not lock the FC or a wheel motor in this scaffold.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Size + print first wheel-leg for ~9.5" step (FC stays TBD).
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
