# Hux requirements

Draft from Steve, 2026-09-20. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) and [Build Some Stuff / Kelton Serra](research/inspiration.md) (steal packaging; do not vendor).

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
| R11 | Battery class: **4S LiPo** (preferred) + **controlled step-down** | Nominal **~14.8V** / full **~16.8V**. Capacity and C-rating **TBD**. Step down to **5V / 6V / 7.4V** servo or logic rails so high-draw wheel FOC does not brown out pose actuators. 4S holds voltage under spikes better than 3S. No pack / BEC SKU. |
| R12 | Hip / knee (and hip roll) class: **servo vs stepper+belt TBD** | **Not locked to steppers.** Lean **high-torque servos** if one-leg load (R14) demands it. Serra used 40 kg-class servos per leg — evidence, not a Hux SKU. Powerful / fast / reliable still required. No spend. |
| R14 | **One-wheel standing load** ≈ **2×** two-wheel stance | Plant-side knee, hip, and hip roll see roughly all the weight on one leg path. **Size for that case**, not average two-wheel load. Design rule — not a measured number yet. |

R13 is reserved for a concurrent wheel-diameter note (~4–6"). Do not invent a diameter here.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- **4S preferred.** Wheel FOC on the pack; pose / logic on **regulated** rails (BEC / regulator *class*, not a SKU). Do not run 5–7.4V servos straight off raw 4S.
- **Leg actuators reopened** (Steve 2026-09-20). A concurrent packet locked knee/hip-swing to stepper+belt — **that lock is lifted.** Servo vs stepper+belt is **TBD**. Lean servos when R14 says the plant-side joint cannot hold on a stepper. Wheels stay brushless (R6).
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- Build Some Stuff lessons to **steal** (packaging, not files): in-wheel BLDC+encoder; jointed legs keep CoG over contact as height changes; serviceable modular prints (inserts, independently removable parts); wheel-under-CoG balance geometry. See [`research/inspiration.md`](research/inspiration.md).
- No spend until Steve approves purchases. Prefer parts he already owns. Do not lock actuator or BEC SKUs.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD)
- Battery: 4S LiPo *class* (preferred). No pack SKU. Capacity / C **TBD**.
- Leg actuators: **servo vs stepper+belt TBD** (R12). No SKU.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Battery:** **4S LiPo class** (preferred). Capacity / C / pack SKU **TBD**. **Controlled step-down** to servo/logic rails. Power bus / BEC SKU TBD. No spend.
- **Hip / knee / hip-roll:** **servo vs stepper+belt TBD.** Lean servos if one-leg (~2×) load demands it. No SKU.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software. Size that leg for **one-wheel standing load** (R14).

Do not buy anything for this list. Do not lock the FC or the leg-actuator class in this scaffold.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Size + print first wheel-leg for ~9.5" step, including **one-wheel (~2×) load** (FC stays TBD; servo vs stepper TBD).
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
