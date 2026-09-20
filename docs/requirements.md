# Hux requirements

Draft from Steve, 2026-09-20. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md). Leg-actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md).

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
| R26 | **Knee** and **hip swing** (rotation / pitch) may use **stepper + belt/gear** | Precise, cheap, COTS NEMA-class or smaller. Belt reduction = torque + resolution. Pose hold (open-loop or closed-loop + encoder). Class **TBD**. No SKU. Trade: [`research/actuators-legs.md`](research/actuators-legs.md). |
| R27 | **Hip roll** (balance angling) prefers **FOC BLDC / QDD / fast bus servo**, not a stiff stepper | High-rate torque + ideally backdrivable. Pairs with planted-wheel fore/aft (R17 when that lands). Steppers are the wrong machine class here. |
| R28 | If **all joints** are steppers: **closed-loop**, **minimal-backlash** belts, and **accept lower one-leg bandwidth** | Risk, not a firmware workaround. Do not fake a CoG shift in software. Wheels stay FOC BLDC (R6; R25 when that lands). |

IDs **R10–R23** and **R25** are unused here so concurrent 2026-09-20 hardware, modes, hip-roll / reuse-control, fabrication, and wheel-drive-class notes can take them without renumbering this packet.

## Soft requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R24 | V1 mass **aspirational 4–5 lb** / **under 6 lb** | **Not a hard gate.** OK to exceed for capability (hip-roll bandwidth, closed-loop hardware, one-leg). If a concurrent note treated under 6 lb as a hard ceiling in the table above, this 2026-09-20 update **supersedes that hardness** — keep the ID, drop the kill-switch. Sketch: [`mechanical.md`](mechanical.md). |

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- V1 mass lean is **aspirational 4–5 lb** / **under 6 lb**. Not a kill-switch. Exceeding 6 lb is allowed if it buys capability. Do not reject a hip-roll class to protect a spreadsheet.
- Leg actuators are **not one class**. Allow **stepper + belt/gear** on **knee + hip swing**. Prefer **FOC BLDC / QDD / fast bus servo** on **hip roll**. Wheels stay FOC BLDC. All-stepper is a documented risk (R28), not the lean.
- Hip swing and hip roll are different DOFs. A stepper that is fine on swing can still be wrong on roll (missed steps, resonance, belt stretch/backlash, no useful backdrive). Trade study: [`research/actuators-legs.md`](research/actuators-legs.md).
- Stepper **hold current** is heat and **4S** drain (R11 when that lands). Not free just because the robot is standing.
- Belt/pulley/rod reduction on swing/knee fits **COTS structure** (R19 when that lands). Printed parts stay joints / tensioners / hubs.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- No spend until Steve approves purchases. Prefer parts he already owns. No locked actuator SKU.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD). Drive *class* TBD. No SKU.
- Hip / knee / hip-roll actuators: **class TBD** per R26–R28. No SKU. Steppers allowed on swing/knee only as a lean, not a buy.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Mass:** aspirational **4–5 lb** / **under 6 lb**. Soft. OK to exceed for capability (R24).
- **Leg actuators:** stepper + belt/gear **allowed** on knee + hip swing (R26). Hip roll prefers FOC BLDC / QDD / fast bus servo (R27). All-stepper only with closed-loop + low backlash + accepted bandwidth loss (R28). No SKU.
- **Wheels:** brushless, FOC / torque-mode lean. Not steppers.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software. Mass is a lean, not a gate that kills a capable roll joint.

Do not buy anything for this list. Do not lock the FC or the actuators in this scaffold.

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
