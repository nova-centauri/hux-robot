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
| R30 | Wheel motor **at the wheel** (hub / coaxial at the rim) | **Not** remote-driven from the hip. Hattori V2 lesson. Motor/hub **TBD**. No SKU. Spec: [`mechanical.md`](mechanical.md). |
| R31 | Match wheel-motor **kV** to **4S** + wheel diameter + balance bandwidth | **Sizing goal**, not a picked kV. 4S / ~4–6" / bandwidth IDs land in concurrent notes (R11 / R13 / R25). Do not invent a number. |
| R32 | Knee + hip-swing **steppers mount above the knee**; **belts** to the pivots; **one belt inside, one outside** | Mass stays **high** (toward hip / body) for balance. Opposite faces = clearance / service / no rub. Which face is which is TBD on the 2D set. |
| R33 | Integrate the **toothed pulley / gear** into the printed leg custom where possible | Fewer discrete pieces. Still **draft-friendly** (R20 when that lands). COTS fallback if the tooth form prints weak. No pulley SKU. |

IDs **R10–R29** are unused here so concurrent 2026-09-20 hardware, modes, hip-roll, fabrication (R19–R23), mass, **actuator baseline**, and **electronics-minimum** notes can take them without renumbering this packet. This note **applies** R20 (draft), R21 (wire ports along the belt path), R22 (service belts / tension), and R23 (2D must show motor-at-wheel + inside/outside belt runs) when those land.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small; **motors at the wheels** (R30).
- Mechanical layout (Steve 2026-09-20): motor **at the rim** (R30); kV match is a **goal** (R31); knee + hip-swing steppers **high**, belts to the pivots, **one inside / one outside** (R32); integrated pulley where the print can be the gear (R33). Hip roll stays the V1 **dynamic** actuator — placement TBD; do not drop CoG with heavy roll actuators if avoidable.
- R7 (linkages + springs) still stands. Belts are **transmission / reduction** from high-mounted steppers, not “pure serial belts instead of a linkage.” Actuator *classes* are the concurrent baseline (wheels FOC, knee stepper+reduction, swing stepper+belt, roll dynamic in V1). Minimum electronics classes: [`electronics-minimum.md`](electronics-minimum.md) when that lands.
- No spend until Steve approves purchases. Prefer parts he already owns.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD) — sit **at the wheel** (R30). Knee / hip-swing steppers: **high** (R32). No SKU.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software. Layout: motor-at-wheel, steppers high, belts in/out. **Several 2D layouts before any Blender** — those sketches must show the hub motor and both belt runs (R23 when that lands).

Do not buy anything for this list. Do not lock the FC in this scaffold. Do not invent a kV or pulley SKU.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Several **2D sketch layouts** that show **motor-at-wheel** and **inside/outside belt runs**, then size + print first wheel-leg for ~9.5" step (FC stays TBD). No Blender before that 2D set.
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
