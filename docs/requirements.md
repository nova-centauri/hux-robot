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
| R10 | **Electric-only** powertrain | Entire robot is electric. No ICE, no hybrid. |
| R11 | Battery class: **4S LiPo** (RC car/boat packs) | Nominal **~14.8V** / full **~16.8V**. Capacity and C-rating **TBD**. No spend. |
| R12 | **Hip rotation** and **knee rotation** actuators: powerful, fast, reliable | Class **TBD**. Open research — candidate *classes* only, not SKUs. |
| R13 | Wheels **~4–6"** skinny, sturdy, some rubber | Working hypothesis **~6"** for US stair dimensions; **4–5"** still in play. Diameter **TBD**. Brushless drive is already R6. |

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- Entire robot is **electric**. Battery lean is **4S LiPo**; pack capacity, C-rating, and the power bus (PDB / BEC / wiring) stay **TBD**. Do not invent a stack.
- Hip + knee actuators are undecided. Need **powerful, fast, reliable**. Research classes, not shopping lists: BLDC+gearbox/cycloidal, quasi-direct drive, linear+linkage+springs, high-torque servo class.
- Wheel diameter is undecided. Hypothesis **~6"** (maybe 4–5") for US stair *tread contact / reach*. The **~9.5"** riser is still a **leg-stroke** problem — a 6" wheel does not climb a 9.5" step by itself.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small. Hux V1 wheel lean is **skinny ~6"** for stairs, not a Hattori-size terrain wheel.
- No spend until Steve approves purchases. Prefer parts he already owns. Do not lock actuators.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD)
- Battery: 4S LiPo *class* (RC car/boat packs). No pack SKU. Capacity / C **TBD**.
- Hip / knee actuators: **TBD** (see R12). No SKU.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Battery:** **4S LiPo class** (Steve 2026-09-20). Capacity / C / pack SKU **TBD**. Power bus TBD. No spend.
- **Hip / knee actuators:** **TBD**. Need powerful, fast, reliable. Classes only — see [`mechanical.md`](mechanical.md). Do not lock.
- **Wheels:** brushless; diameter **TBD**, hypothesis **~6"** skinny rubber (4–5" fallback).
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software.

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
