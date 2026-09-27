# Vision

**Status:** early R&D. Nothing here is a finished design.

Hux is a wheeled biped: two legs that end in driven wheels. The near-term north star is stairs — climb and descend a nominal **~9.5"** residential riser — not a polished indoor rover. **V1 finish line (2026-09-27): one 9.5" step, 9 of 10 from a standstill; a full flight is V2 on the same hardware.** Flat-ground pace is a brisk walk (1.5 m/s top, 1.0 cruise), not a jog; V1 terrain is flat + 1" sills + ~20° slopes. AgileX T-REX 2.0 is the scale / packaging reference, not the leg reference ([`decisions.md`](decisions.md)). The long-term twin / dojo sits after that; it does not replace stairs.

Decision log: [`decisions.md`](decisions.md).

## Stair cycle (intent)

1. Stand and balance on **two** wheeled legs (teleop baseline — `TWO_WHEEL`).
2. Prove **one-leg** balance (`LEFT_ONLY` / `RIGHT_ONLY`) — gate before any stair attempt.
3. Lift one wheeled leg.
4. Balance on the planted wheel (hip roll + planted-wheel fore/aft) — a timed single support (≤ 0.3 s from a ~8% poise), not a static one-wheel stand, which is not a V1 capability ([`research/one-leg-stance.md`](research/one-leg-stance.md)).
5. Rotate / place the raised wheel onto the next tread.
6. Plant. Repeat up or down.

Open-loop step onto a 9.5" fixture comes before a closed-loop stair gait. Cameras and pathfinding come after the four **manual** modes work.

## Near-term vs long-term

**Near-term:** stand upright, the four **manual** modes, then a **9.5"** stair cycle. Classical / reused balance first (R18) — not an RL gate. The envelope on `main` is already **~24" × ~14"**, **6" foot**, carbon-tube spars; living drawings and [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md) are the current draw, not the old ~10" / soft-5" era.

**Long-term north star:** an **identical digital twin** plus a **training dojo** (ML/RL) so a policy trained in sim can run locally on the robot. Eventually train stairs, rubble, dirt, fall leaves, wet mud. That is a **horizon**, not a V1 blocker. The **pipeline** (Isaac / MuJoCo / mjlab / other) is **TBD** — lock the contract first; do not stand up a dojo before `TWO_WHEEL`. The living-drawings 3D sandbox framed capabilities; it is a design toy, not the twin. Phasing: [`software.md`](software.md). Decision log: [`decisions.md`](decisions.md) (2026-09-25).

**Inventory does not drive design.** [`parts-on-hand.md`](parts-on-hand.md) informs options. The project needs what it needs — prefer the correct actuators and wheels over the shelf. The Zantle 5" is a bench donor, already documented.

**Motion control:** high-bandwidth **FOC / QDD / model-based** loops where they matter (wheels, hip roll). The vendor set is the RobStride **temporary lock** (2026-09-26), not an order.

## Split brain (intent, not implemented)

| Role | Where | Notes |
| --- | --- | --- |
| IMU, estimator, modes, balance loop at 1 kHz | CAN real-time MCU running the portable control core | **Teensy 4.1** (picked 2026-09-26). F765 is bench only. Do not block mechanical work. **Not** a stepper-coil host. |
| Pose joints (knee / hip swing) | The same MCU over CAN: RS02 knee, RS00 swing (temporary lock) | Servo / stepper+belt is the fallback. If steppers: the MCU does not drive coils. |
| Cameras, pathfinding inference | Pi 5 now (ROS 2, containers); Jetson-class at P5 | Not on the MCU. |
| Wi‑Fi telemetry | Pi first | Reports active mode. ESP32 only if we want a thin bridge off the Pi. |
| Pilot stick | TBS Nano RX | CRSF into the Teensy. |

See [`electronics.md`](electronics.md) and [`software.md`](software.md).

## Lessons to steal (Hattori STRIDE V2)

Inspiration: [Alex Hattori — wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

- Extra leg DOF helps stairs and fall recovery. Hux **hip roll is in V1**.
- Larger wheels help open terrain. Hux settles at **6" OD × ~1–1.25"** so the tire sits in a **9.5" × 9.5"** step with room to pivot and place the other wheel. [`research/leg-geometry.md`](research/leg-geometry.md).
- Serial / linkage knees beat “knees on both sides” parallel for stairs.
- Springs for gravity assist if actuators are small (Hattori V1 used torsion springs; V2 dropped them because actuators were not the limit).
- Wheel motors **at the wheel**.

V1 Hux: knee RS02 **at the knee** with a gravity spring (Sheet 2), no belts, no five-bar (R39). The hip-driven knee linkage is V2 backlog.

## Lessons to steal (X-share inspirations)

Notes: [`research/inspiration.md`](research/inspiration.md). **Watch. Do not vendor. Not a Hux stack.**

- **RAI Roadrunner** — lab wheeled biped. Validates one-wheel balance as a gate, drive-vs-step as a mode choice, knee symmetry for up / down. **Lab RL ≠ Hux.**
- **FrRonconi student balancer** — maker-scale two-leg/wheel first prototype. Closer early-R&D *vibe* than Roadrunner. Still research first (Phases A–C).

## Lessons to steal (Build Some Stuff / Serra)

Inspiration: [I built a self-balancing robot from scratch](https://www.youtube.com/watch?v=K1lzzVGCzAQ) — notes in [`research/inspiration.md`](research/inspiration.md). **Steal packaging and loop geometry. Do not vendor files.**

- **In-wheel BLDC + encoder** — motor at the wheel for the balance actuator.
- **Jointed legs keep CoG over wheel contact** as height changes.
- **Serviceable modular prints** — threaded inserts; independently removable parts.
- **Wheel-under-CoG** correction: rotate the planted wheel back under the mass. Their loop is a simple P; Hux still studies XRobots PID.

Their stack is 3S + Arduino + 40 kg-class servos and **no stair / one-leg plant**. Hux runs **8S + step-down**, a CAN real-time MCU + Linux companion, and sizes plant-side joints for **~2×** one-wheel load. Knee / hip swing class is **CAN QDD** — RS02 knee, RS00 swing under a temporary lock; servo / stepper+belt is the fallback.

## Envelope (locked enough to write down)

- **~9.5"** riser (stroke owns this)
- **~24"** tall at full extension
- **~14"** wide, head inside, wheels and legs outside the head
- Carbon-tube spars; printed / machined end fittings
- Mass budget **soft / blown**; the current picture is **7.75 kg** with the locked actuators

## Explicitly TBD

- Actuator purchase: the RobStride set is a **temporary lock**, not ordered. First buy is one RS02 on the Teensy.
- BEC / regulator SKU (≥36 V in).
- RS05 output-bearing rating under the cantilevered rim; knee spring part (open calls 14, 15).
- Full body CAD (after Steve agrees Sheets 1 and 2), second-leg copy, a validated stair trajectory (none exists yet), and stair gait software.
- Spend. No **new** purchases until Steve approves. Authorized cart stays the [`bom.md`](bom.md) order-now list. Inventory is a reference, not a design driver.

Mechanical V1 is one wheel-leg (carbon-tube spars + end fittings) sized toward 9.5", not a finished robot.
