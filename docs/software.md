# Software

**Status:** TBD. No flight stack, no ROS distro, no inference model.

Prefer checklists and milestone order over a fake finished stack.

## Split brain (intent)

| Layer | Job | When |
| --- | --- | --- |
| FC firmware | IMU, attitude, wheel (and likely leg) actuation, TBS RX | After an FC is on the bench. Stack **TBD** with the FC. |
| Pi companion | Camera stream, later pathfinding inference, Wi‑Fi telem | After two-leg teleop. |
| ESP32 (optional) | Thin Wi‑Fi / telemetry bridge | Only if the Pi should not own that link. |

Do not pick Betaflight vs INAV vs ArduPilot vs custom here. That choice follows the FC, and the FC is TBD.

## One-leg balance (intent)

Steve 2026-09-20. One-leg balance is a **full control loop**, not a hip pose and not a wheel-only trick.

It lives in the four **manual** modes (pilot-selected from RC, before any automated motion). The mode machine itself is the concurrent manual-modes note (R14 when that lands). Names here are enough to hang the loop on:

| Mode | Enum (intent) | What this loop does |
| --- | --- | --- |
| **Parked** | `PARKED` | Off. No balance loop driving wheels or hips. |
| **2-wheel balance** | `TWO_WHEEL` | Both wheels planted. CoG can sit between two contacts. Classic two-wheel pitch/yaw teleop. |
| **Left wheel only** | `LEFT_ONLY` | Right leg free. Run the one-leg loop on the **left** contact. |
| **Right wheel only** | `RIGHT_ONLY` | Mirror: one-leg loop on the **right** contact. |

`LEFT_ONLY` / `RIGHT_ONLY` are the R2 gate. They do **not** lift, plant, or path-follow. Mode select only says which contact the loop may use.

### Coupled jobs (R17)

On one wheel the machine is an inverted pendulum with a **narrow** support. Two things have to stay true at once:

1. **Hip roll → CoG over the planted wheel.** Lean the body so the CoG projection sits on the planted contact. Without this (or an equivalent lateral shift), the free side falls. Mechanical DOF: [`mechanical.md`](mechanical.md). **TBD if V1 must have hip roll** (R16).
2. **Planted wheel → contact under the CoG.** Drive that wheel forward/back so the contact patch stays under the CoG in the pitch plane. Same class of problem as a Segway / two-wheel balancer, but on **one** rim.

Neither job is optional if we claim one-leg balance. Hip-roll-only is a lean that still tips fore/aft. Wheel-only is a Segway that still falls sideways.

Do not write gains, a mixer, a channel map, or Hux firmware here. FC is **TBD**. This is the story, not a controller.

### How the modes use the loop

- **Parked** — loops off. Failsafe / default.
- **TWO_WHEEL** — both wheels in the pitch/yaw balance. Hip roll is optional disturbance lean, not the one-leg gate.
- **LEFT_ONLY** — hip roll toward the left + left wheel fore/aft under CoG. Right wheel is not a support.
- **RIGHT_ONLY** — mirror.

Bring-up still goes Parked → 2-wheel → left-only → right-only. Do not jump Parked → one-wheel on the bench.

## Reuse, do not reinvent (R18)

**Explicit non-goal:** writing a novel Hux balance controller from scratch for V1.

Prefer existing excellent control systems / patterns. Cite them as **research pointers**, not a lock. **TBD which we adopt.** Study before we copy; licenses still apply ([`research/README.md`](research/README.md)).

| Pointer | Why it is on the list | Not a Hux lock |
| --- | --- | --- |
| XRobots **TallBalancer** `pos_hold` / `vel_hold` | Clean MPU6050 → PID → wheel-torque / encoder hold | MIT; still Phase C. Not an ODrive buy. |
| XRobots **SonicRobot** | Brushless + balance electronics; IMU → PID → ODrive torque/velocity | GPL-2.0. Study only until Steve says otherwise. |
| XRobots **RobotX** | Wheeled-biped lineage; IMU → wheel when a leg leaves the ground | GPL3 README. Do not vendor. |
| **Hattori STRIDE V2** | Contemporary wheeled-biped stairs / extra DOF / open-loop swing-leg | Blog lessons, not CAD or a stack. |
| **Mini-Cheetah-style** stacks | Known legged WBC / QP / joint-PD pattern (MIT Cheetah lineage) | Research pointer only. Hux is a wheeled biped, not a Mini-Cheetah port. |
| **FC attitude loops** | Roll/pitch/yaw PID the on-hand FCs already run | Follows the FC. FC is TBD. Do not pick Betaflight / INAV / ArduPilot / custom here. |
| **ODrive torque modes** | Current/torque command into a BLDC wheel or joint | Pattern, not a purchase. Do not treat SonicRobot's README as a Hux BOM. |

Phase A of [`research/study-plan.md`](research/study-plan.md) is where we extract how those loops actually work. Phase C is where Steve picks adapt vs rewrite. Until then: **no Hux-original balance firmware**, no fake mixer, no invented gains.

If a pointer is copyleft (RobotX, SonicRobot), keep Hux MIT unless Steve decides. Watching and rewriting from understanding is the default.

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC.
2. **Spin** — restrained brushless wheel, not on carpet.
3. **Two-leg balance teleop** — TBS + Wi‑Fi telem.
4. **One-leg balance** — `LEFT_ONLY` then `RIGHT_ONLY`. Hip-roll + planted-wheel pitch (R17), using an **existing** pattern (R18). Gate before stairs.
5. **Open-loop step** — toward a 9.5" riser fixture. No vision required.
6. **Camera stream** — one teleop stream first.
7. **Local pathfinding** — later, on the Pi, not on the FC.

## Repo homes (empty)

- [`../firmware/`](../firmware/) — FC / embedded bring-up.
- [`../software/`](../software/) — Pi companion, cameras, later inference.

## Explicitly not started

- Closed-loop stair gait.
- Stereo / depth for stairs.
- Simulation (MuJoCo or otherwise).
- A requirements-complete autonomy stack.
- A **novel Hux V1 balance controller** (R18). Study existing patterns; do not invent one to fill `firmware/`.
- Firmware that implements the one-leg loop or a mixer (FC is TBD; this page is the story).
