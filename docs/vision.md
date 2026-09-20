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

See [`electronics.md`](electronics.md), [`electronics-minimum.md`](electronics-minimum.md) (P0–P5 classes), and [`software.md`](software.md) (manual modes).

## Lessons to steal (Hattori STRIDE V2)

Inspiration: [Alex Hattori — wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

- Extra leg DOF helps stairs and fall recovery.
- Larger wheels help terrain.
- Serial / linkage knees beat “knees on both sides” parallel for stairs.
- Springs for gravity assist if actuators are small (Hattori V1 used torsion springs; V2 dropped them because actuators were not the limit).

V1 Hux prefers **strong linkages + springs** over pure serial belts for simplicity. That is a starting bias, not a locked CAD package.

## Explicitly TBD

- Flight controller choice (candidates only; see requirements).
- Exact wheel BLDC / ESC models.
- Full body CAD, second-leg copy, and stair gait software.
- Spend. No purchases until Steve approves. Prefer parts already on hand.

Mechanical V1 is one printable wheel-leg sized toward 9.5", not a finished robot.
