# Vision

**Status:** early R&D. Nothing here is a finished design.

Hux is a wheeled biped: two legs that end in driven wheels. The north star is stairs — climb and descend a nominal **~9.5"** residential riser — not a polished indoor rover.

## Stair cycle (intent)

1. Stand and balance on **two** wheeled legs (teleop baseline).
2. Prove **one-leg** balance (gate before any stair attempt).
3. Lift one wheeled leg.
4. Balance on the planted wheel.
5. Rotate / place the raised wheel onto the next tread.
6. Plant. Repeat up or down.

Open-loop step onto a 9.5" fixture comes before a closed-loop stair gait. Cameras and pathfinding come after that.

## Split brain (intent, not implemented)

| Role | Where | Notes |
| --- | --- | --- |
| IMU, attitude, wheel (and likely leg) actuation | Flight controller | **FC is TBD.** Do not block mechanical work on this. |
| Cameras, pathfinding inference | Raspberry Pi | Not on the FC. |
| Wi‑Fi telemetry | Pi first | ESP32 only if we want a thin bridge off the Pi. |
| Pilot stick | TBS Nano RX | Bind to the FC (or a dedicated link into the FC). |

See [`electronics.md`](electronics.md) and [`software.md`](software.md).

## Lessons to steal (Hattori STRIDE V2)

Inspiration: [Alex Hattori — wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

- Extra leg DOF helps stairs and fall recovery.
- Larger wheels help terrain.
- Serial / linkage knees beat “knees on both sides” parallel for stairs.
- Springs for gravity assist if actuators are small (Hattori V1 used torsion springs; V2 dropped them because actuators were not the limit).

V1 Hux prefers **strong linkages + springs** over pure serial belts for simplicity. That is a starting bias, not a locked CAD package.

## Lessons to steal (Build Some Stuff / Serra)

Inspiration: [I built a self-balancing robot from scratch](https://www.youtube.com/watch?v=K1lzzVGCzAQ) — notes in [`research/inspiration.md`](research/inspiration.md). **Steal packaging and loop geometry. Do not vendor files.**

- **In-wheel BLDC + encoder** — motor at the wheel for the balance actuator.
- **Jointed legs keep CoG over wheel contact** as height changes.
- **Serviceable modular prints** — threaded inserts; independently removable parts.
- **Wheel-under-CoG** correction: rotate the planted wheel back under the mass. Their loop is a simple P; Hux still studies XRobots PID.

Their stack is 3S + Arduino + 40 kg-class servos and **no stair / one-leg plant**. Hux prefers **4S + step-down**, FC/Pi, and sizes plant-side joints for **~2×** one-wheel load. Leg class is **servo vs stepper+belt TBD** (lean servos if that load demands it).

## Explicitly TBD

- Flight controller choice (candidates only; see requirements).
- Exact wheel BLDC / ESC / encoder models.
- Knee / hip class: **servo vs stepper+belt** (not locked).
- BEC / regulator SKU and pack capacity.
- Full body CAD, second-leg copy, and stair gait software.
- Spend. No purchases until Steve approves. Prefer parts already on hand.

Mechanical V1 is one printable wheel-leg sized toward 9.5", not a finished robot.
