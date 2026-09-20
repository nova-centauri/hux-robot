# Hux requirements

Draft from Steve, 2026-09-20. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md) and [`electronics.md`](electronics.md).

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
| R8 | Local compute for **pathfinding inference** | Needs cameras; not on the FC. **Motion** from this stack waits on R14. |
| R9 | Cameras | At least one stream for teleop; stereo/depth later for stairs |
| R14 | Four **manual control modes** before any automated motion | Steve 2026-09-20. **Parked**, **2-wheel balance**, **left wheel only**, **right wheel only**. Pilot selects via RC (TBS Nano, likely aux / flight-modes style). Wi‑Fi telem reports the active mode. Autonomy, pathfinding motion, and open-loop step wait until these work. Spec: [`software.md`](software.md). |

IDs **R10–R13** are unused here so concurrent 2026-09-20 hardware notes can take them without renumbering this gate.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- No spend until Steve approves purchases. Prefer parts he already owns.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD)

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software.

Do not buy anything for this list. Do not lock the FC in this scaffold.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Size + print first wheel-leg for ~9.5" step (FC stays TBD).
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Manual modes from RC (R14): Parked → 2-wheel → left-only → right-only. Telem reports the mode. Automation waits.
5. Two-leg balance teleop (2-wheel mode; TBS + Wi‑Fi telem).
6. One-leg balance (left-only and right-only).
7. Open-loop step-up toward 9.5" riser fixture — not before R14.
8. Camera stream → local pathfinding later. Pathfinding motion waits on R14.
9. Lock FC into [`electronics.md`](electronics.md) when ready.
