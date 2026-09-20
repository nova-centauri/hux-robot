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
| R19 | Prefer **cheap COTS stock** for primary structure | Carbon rods, metal stock, tube, fasteners, etc. Do **not** custom-print primary structure when off-the-shelf will do. Printed parts are joints, hubs, brackets — not spars. Spec: [`mechanical.md`](mechanical.md). |
| R20 | Custom parts are **draft-friendly** | Design for **3D print now** and **injection mold later**: draft in mind, avoid undercuts where possible, parting-line awareness, printable orientation. |
| R21 | **Wire openings and ports** through links / body | Include cable paths whenever possible. Do not seal a link and drill later as an afterthought. |
| R22 | **Serviceable** V1 | Access to fasteners, batteries, FC, and actuators. Replaceable modules preferred over sealed mono-bodies. |
| R23 | **Several 2D sketch layouts** before any Blender / 3D CAD | Hard process gate (Steve 2026-09-20). 2D layouts must exist before Blender work starts. |

IDs **R10–R18** are unused here so concurrent 2026-09-20 hardware, manual-mode, and hip-roll notes can take them without renumbering this packet.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- Fabrication (Steve 2026-09-20): **COTS structure first** (R19). Customs are draft-friendly (R20) with **wire ports** (R21) and **service access** (R22). **Several 2D layouts before Blender** (R23) — that is a gate, not a suggestion.
- V1 “printable wheel-leg” means a fit-check of **printed customs on COTS stock**, not a mono-body printed spar.
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
- **V1 mechanical target:** one wheel-leg (printed **customs** on **COTS** structure) with linkage+spring stub sized toward 9.5" step, before full stair gait software. **Several 2D layouts before any Blender.**

Do not buy anything for this list. Do not lock the FC in this scaffold. Do not open Blender before R23.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Several **2D sketch layouts** (R23), then size + print first wheel-leg for ~9.5" step — COTS structure, draft-friendly customs, wire ports, service access (R19–R22). FC stays TBD. No Blender before the 2D gate.
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
