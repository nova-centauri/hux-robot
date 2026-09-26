# Vision

**Status:** early R&D. Nothing here is a finished design.

Hux is a wheeled biped: two legs that end in driven wheels. The near-term north star is stairs — climb and descend a nominal **~9.5"** residential riser — not a polished indoor rover. The long-term twin / dojo sits after that; it does not replace stairs.

Decision log: [`decisions.md`](decisions.md).

## Stair cycle (intent)

1. Stand and balance on **two** wheeled legs (teleop baseline — `TWO_WHEEL`).
2. Prove **one-leg** balance (`LEFT_ONLY` / `RIGHT_ONLY`) — gate before any stair attempt.
3. Lift one wheeled leg.
4. Balance on the planted wheel (hip roll + planted-wheel fore/aft).
5. Rotate / place the raised wheel onto the next tread.
6. Plant. Repeat up or down.

Open-loop step onto a 9.5" fixture comes before a closed-loop stair gait. Cameras and pathfinding come after the four **manual** modes work.

## Near-term vs long-term

**Near-term:** stand upright, the four **manual** modes, then a **9.5"** stair cycle. Classical / reused balance first (R18) — not an RL gate. The envelope on `main` is already **~24" × ~14"**, **6" foot**, carbon-tube spars; living drawings and [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md) are the current draw, not the old ~10" / soft-5" era.

**Long-term north star:** an **identical digital twin** plus a **training dojo** (ML/RL) so a policy trained in sim can run locally on the robot. Eventually train stairs, rubble, dirt, fall leaves, wet mud. That is a **horizon**, not a V1 blocker. The **pipeline** (Isaac / MuJoCo / mjlab / other) is **TBD** — lock the contract first; do not stand up a dojo before `TWO_WHEEL`. The living-drawings 3D sandbox framed capabilities; it is a design toy, not the twin. Phasing: [`software.md`](software.md). Decision log: [`decisions.md`](decisions.md) (2026-09-25).

**Inventory does not drive design.** [`parts-on-hand.md`](parts-on-hand.md) informs options. The project needs what it needs — prefer the correct actuators and wheels over the shelf. The Zantle 5" is a bench donor, already documented.

**Motion control:** high-bandwidth **FOC / QDD / model-based** loops where they matter (wheels, hip roll). Class only. No vendor lock.

## Split brain (intent, not implemented)

| Role | Where | Notes |
| --- | --- | --- |
| IMU, attitude, wheel FOC, manual modes | Flight controller | **FC is TBD.** Hip roll if PWM/CAN. Do not block mechanical work. **Not** a stepper-coil host. |
| Pose joints (knee / hip swing) | Servo bus **or** stepper drivers / Pi | **Class TBD.** If steppers: FC does not drive coils. |
| Cameras, pathfinding inference | Raspberry Pi | Not on the FC. |
| Wi‑Fi telemetry | Pi first | Reports active mode. ESP32 only if we want a thin bridge off the Pi. |
| Pilot stick | TBS Nano RX | Bind to the FC (or a dedicated link into the FC). |

See [`electronics.md`](electronics.md) and [`software.md`](software.md).

## Lessons to steal (Hattori STRIDE V2)

Inspiration: [Alex Hattori — wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

- Extra leg DOF helps stairs and fall recovery. Hux **hip roll is in V1**.
- Larger wheels help open terrain. Hux settles at **6" OD × ~1–1.25"** so the tire sits in a **9.5" × 9.5"** step with room to pivot and place the other wheel. [`research/leg-geometry.md`](research/leg-geometry.md).
- Serial / linkage knees beat “knees on both sides” parallel for stairs.
- Springs for gravity assist if actuators are small (Hattori V1 used torsion springs; V2 dropped them because actuators were not the limit).
- Wheel motors **at the wheel**.

V1 Hux prefers **strong linkages + springs** over pure serial belts for simplicity. That is a starting bias, not a locked CAD package.

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

Their stack is 3S + Arduino + 40 kg-class servos and **no stair / one-leg plant**. Hux prefers **4S + step-down**, FC / Pi, and sizes plant-side joints for **~2×** one-wheel load. Knee / hip swing class is **servo vs stepper+belt TBD** — both open, no lean.

## Envelope (locked enough to write down)

- **~9.5"** riser (stroke owns this)
- **~24"** tall at full extension
- **~14"** wide, head inside, wheels and legs outside the head
- Carbon-tube spars; printed / machined end fittings
- Mass budget **soft / blown**

## Explicitly TBD

- Flight controller choice (candidates only; see requirements).
- Exact wheel BLDC / ESC / encoder models.
- Knee / hip swing: **servo vs stepper+belt TBD** (both open, no lean). GIM8108-8 is a candidate, not an order.
- BEC / regulator SKU and pack capacity.
- Tube OD / wall, belt pitch, hip-roll SKU.
- Full body CAD, second-leg copy, and stair gait software.
- Spend. No **new** purchases until Steve approves. Authorized cart stays the [`bom.md`](bom.md) order-now list. Inventory is a reference, not a design driver.

Mechanical V1 is one wheel-leg (carbon-tube spars + end fittings) sized toward 9.5", not a finished robot.
