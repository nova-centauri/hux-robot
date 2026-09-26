# Software

**Status:** architecture decided 2026-09-26 ([`decisions.md`](decisions.md)); no code on `main` yet. No RL, no inference model.

Prefer checklists and milestone order over a fake finished stack. Electronics that enable the modes: [`electronics-minimum.md`](electronics-minimum.md). Review that produced this shape: [`research/compute-stack-review.md`](research/compute-stack-review.md).

## Four layers (decided 2026-09-26)

The pattern Diablo, Mini-Cheetah, Unitree and Stompy converge on. Hux adopts the shape, not anyone's code.

| Layer | What runs there | Rate | Hux choice |
| --- | --- | --- | --- |
| **1. Actuators** | FOC current loop and joint PD **on the actuator**. Takes torque / position / velocity setpoints over **CAN**. | 10–40 kHz FOC, 1 kHz setpoints | CAN QDD / FOC actuators on **8S**. Wheels, hip roll, knee, hip swing. SKUs TBD ([`electronics.md`](electronics.md)). |
| **2. Control core** | Estimator (IMU + wheel odometry), mode machine, balance controller, one-leg loop, safety limits. **Plain C++ library, no hardware calls, unit-tested.** | — | `firmware/hux_control/` (name TBD). The **same source** links into layer 3, layer 4 and the digital twin. |
| **3. Real-time MCU** | Runs layer 2 at **1 kHz**: reads the IMU, parses CRSF, is CAN master, holds the mode, enforces the hardware watchdog and torque cut, logs blackbox. | 1 kHz | **MCU with CAN** — Teensy 4.1-class or H743-WING-class, picked with the actuators. **Not the F765-Wing** (no CAN; P0–P1 bench only). |
| **4. Linux companion** | **ROS 2.** Teleop, telemetry, live parameters, MCAP logging, cameras, face, later perception and the trained policy. Talks to layer 3 over a framed binary serial / USB link. | 50–500 Hz | **Pi 5 now**, in containers, no Pi-specific libraries. **Jetson (Orin Nano Super kit class) at P5** for stereo depth and a multi-camera head. Same containers. |

Rules that fall out of this:

- **The actuator bus picks the MCU.** CAN is decided; the exact MCU follows the actuator choice (how many buses, FD or classic, which CAN protocol the actuators speak).
- **Layer 2 never includes a HAL call.** If it needs the time, it takes a timestamp argument. If it needs an IMU sample, it takes a struct. That is what makes it run unchanged on the MCU, on the Pi, on a Jetson and inside the twin — the carry-forward Steve asked for.
- **Layer 3 is thin.** Drivers, timing, CAN framing, safety. It does not own gains or logic; those are layer 2 and are set as parameters from layer 4.
- **Layer 4 is not real-time and never in the torque path.** A hung companion means the MCU keeps balancing or drops to `PARKED`, never a fall.
- **ROS 2 on the companion only.** The MCU speaks a small framed protocol (micro-ROS is optional later). The reason for ROS 2 is what plugs into it: Isaac ROS on a Jetson, MuJoCo / Isaac bridges for the twin, rosbag / MCAP, Foxglove, PlotJuggler.
- **Containers on the companion from day one.** arm64 images run on the Pi 5 and on a Jetson (JetPack 6 is Ubuntu 22.04; the Pi is on Trixie — the container makes that irrelevant). Cameras through V4L2 / GStreamer, not `picamera2`. No Pi GPIO in the stack.
- **Licensing:** Hux is MIT. Layer 2 is clean-room from understanding (R18 pointers below). ROS 2 is Apache-2.0, SimpleFOC MIT, CAN actuator SDKs vary — cite each.

### The F765-Wing and Pi 5 on the table

The 2026-09-25 bench plan (F765-Wing bare metal + Pi 5 listener, [`../tools/living-drawings/software.html`](../tools/living-drawings/software.html)) is **bench learning, P0–P1**: blink, bind the Nano, learn CRSF, spin one SimpleFOC wheel over UART. Nothing written for it is expected to survive except what lands in layer 2. The Pi 5 **is** the layer-4 board for V1 and its code does carry, as long as it stays in containers.

## Manual control modes

Steve, 2026-09-20. Four **manual** states, selected by a human, **before** any automated motion (R14).

Automation (open-loop step scripts, pathfinding, later stair gait) **waits** until a pilot can enter, hold, and leave each mode from RC. Do not write fake firmware here. Channel map is **TBD** with the MCU; the stack is the four layers above.

### States

| Mode | Enum (intent) | What it is | Wheels / legs | Electronics phase |
| --- | --- | --- | --- | --- |
| **Parked** | `PARKED` | Supported idle, entered only after a verified rest support takes the load. Lost link first requests zero motion while retaining balance. | Neither wheel driven by the balance loop | **P2** (MCU + RX from **P0**) |
| **2-wheel balance** | `TWO_WHEEL` | Both wheels active for bipedal balance / teleop. Baseline stance. | Left + right planted and driven | **P2** |
| **Left wheel only** | `LEFT_ONLY` | Balance / drive on the **left** planted wheel. Right leg free for a step cycle. | Left planted; right free | **P4** (after hip-roll class) |
| **Right wheel only** | `RIGHT_ONLY` | Mirror of left. | Right planted; left free | **P4** |

`LEFT_ONLY` and `RIGHT_ONLY` are the one-leg-balance gates (R2 / R14). They are **not** an automatic step. Mode change does not lift, plant, or path-follow.

### State machine (intent)

```
                         rest support verified / explicit supported Parked
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
              ┌──────────┐                                     │
              │  PARKED  │  safe idle; no balance-loop drive   │
              └────┬─────┘                                     │
                   │ RC → 2-wheel                              │
                   ▼                                           │
           ┌───────────────┐                                   │
           │  TWO_WHEEL    │  both wheels; teleop baseline     │
           └──┬─────────┬──┘                                   │
              │         │                                      │
     RC left-only    RC right-only                             │
              │         │                                      │
              ▼         ▼                                      │
     ┌────────────┐  ┌─────────────┐                           │
     │ LEFT_ONLY  │  │ RIGHT_ONLY  │                           │
     │ right free │  │ left free   │                           │
     └─────┬──────┘  └──────┬──────┘                           │
           │                │                                  │
           └──► TWO_WHEEL ◄─┘   (RC back to 2-wheel)           │
                    │                                          │
                    └──────────────────────────────────────────┘
```

Rules (intent, not firmware):

- **Controlled stop precedes parking.** Lost TBS link or a Parked request commands zero translation/yaw while retaining balance. Enter unpowered `PARKED` only after verifying a mechanically supported rest pose. The sandbox refuses parking when its proposed skid is absent. Disarm/emergency torque cut is a separate action that can cause a fall; it is not a balanced idle. The hardware support and lost-link watchdog remain to be implemented.
- Enter **2-wheel** from Parked when the pilot arms / selects the stance mode.
- Enter **left-only** or **right-only** from **2-wheel** (not by jumping Parked → one-wheel on the bench until 2-wheel is proven).
- Return to **2-wheel** before flipping left ↔ right. Do not cross-switch through a one-wheel mode.
- The machine does **not** lift, plant, or path-follow because a mode changed. Mode select only enables which wheels the balance / teleop loop may drive.
- No autonomy process is allowed to command wheel or leg motion until these four modes work from RC.

### Mode select and telemetry

- **Switching:** RC on the **TBS Nano RX**, likely an aux switch / flight-modes style channel. Exact aux channel and CRSF ranges are **TBD** with the MCU — do not invent a mixer here.
- **Telemetry:** Wi‑Fi telem (Pi first; ESP32 only as a thin bridge) **reports the active mode** as a name + the enum above. USB / serial is enough for P2; Wi‑Fi can wait until P5.
- Stick (pitch / roll / yaw / throttle semantics) still maps to tilt / speed / yaw **inside** the selected mode. Stick does not replace the mode switch.

Bring-up order for these modes: [`checklists/software-bringup.md`](checklists/software-bringup.md).

## One-leg balance (intent)

Steve 2026-09-20 / confirmed. One-leg balance is a **full control loop**, not a hip pose and not a wheel-only trick (R17).

**Hip roll is in V1** (R16). One-leg CoG shift is a **best-effort** goal, not a promise. It may not work as hoped. Keep the axis and the modes anyway so we can learn.

### Coupled jobs (R17)

On one wheel the machine is an inverted pendulum with a **narrow** support. Two things have to stay true at once:

1. **Hip roll → CoG over the planted wheel.** Lean the body so the CoG projection sits on the planted contact. Without this (or an equivalent lateral shift), the free side falls. Mechanical DOF: [`mechanical.md`](mechanical.md). The roll actuator is **dynamic** (FOC BLDC / small QDD / fast bus servo) — **not a stepper**.
2. **Planted wheel → contact under the CoG.** Drive that wheel forward / back so the contact patch stays under the CoG in the pitch plane. Same class of problem as a Segway / two-wheel balancer, but on **one** rim. Serra's teaching loop is a simple P; Hux still studies XRobots PID.

Neither job is optional if we claim one-leg balance. Hip-roll-only is a lean that still tips fore/aft. Wheel-only is a Segway that still falls sideways.

Do not write gains, a mixer, or a channel map here. This is the story, not a controller; the controller is layer 2. Do not fake a CoG shift if the roll joint is unplugged — and do not unplug it to wait for V2.

### How the modes use the loop

- **Parked** — loops off. Failsafe / default.
- **TWO_WHEEL** — both wheels in the pitch / yaw balance. Hip roll is optional disturbance lean, not the one-leg gate.
- **LEFT_ONLY** — hip roll toward the left + left wheel fore/aft under CoG. Right wheel is not a support.
- **RIGHT_ONLY** — mirror.

Bring-up still goes Parked → 2-wheel → left-only → right-only.

## Reuse, do not reinvent (R18)

**Explicit non-goal:** writing a novel Hux balance controller from scratch for V1.

Prefer existing excellent control systems / patterns. Cite them as **research pointers**, not a lock. **TBD which we adopt.** Study before we copy; licenses still apply ([`research/README.md`](research/README.md)).

| Pointer | Why it is on the list | Not a Hux lock |
| --- | --- | --- |
| XRobots **TallBalancer** `pos_hold` / `vel_hold` | Clean MPU6050 → PID → wheel-torque / encoder hold | MIT; still Phase C. Not an ODrive buy. |
| XRobots **SonicRobot** | Brushless + balance electronics; IMU → PID → ODrive torque / velocity | GPL-2.0. Study only until Steve says otherwise. |
| XRobots **RobotX** | Wheeled-biped lineage; IMU → wheel when a leg leaves the ground | GPL3 README. Do not vendor. |
| **Hattori STRIDE V2** | Contemporary wheeled-biped stairs / extra DOF / open-loop swing-leg | Blog lessons, not CAD or a stack. |
| **Build Some Stuff / Serra** | Wheel-under-CoG geometry; in-wheel encoder packaging | Teaching P loop. Not the Hux controller. Do not flash their sketch. |
| **Mini-Cheetah-style** stacks | Known legged WBC / QP / joint-PD pattern (MIT Cheetah lineage) | Research pointer only. Hux is a wheeled biped, not a Mini-Cheetah port. |
| **FC attitude loops** | Roll / pitch / yaw PID the on-hand flight controllers already run | Pattern for the estimator + rate loop; the boards themselves are bench-only. |
| **ODrive / SimpleFOC torque modes** | Current / torque command into a BLDC wheel or joint | Pattern, not a purchase. |

Phase A of [`research/study-plan.md`](research/study-plan.md) is where we extract how those loops actually work. Phase C is where Steve picks adapt vs rewrite. Until then: **no Hux-original balance firmware**, no fake mixer, no invented gains.

Tazer spent a long time on **LQR with a bad model**; a **PID cascade** is what actually balanced. That is R18 in someone else's blood. Do not start V1 on LQR. See [`research/tazer-lessons.md`](research/tazer-lessons.md).

Stompy is a week-build **RL walker** — CAD/reality match, not a Hux V1 stack. **Do not require RL walking.** Keep this reuse list. See [`research/stompy-sim2real.md`](research/stompy-sim2real.md). Diablo and Tazer say the same order: **LQR / PID before RL**. A later twin / dojo does **not** replace this section.

If a pointer is copyleft (RobotX, SonicRobot), keep Hux MIT unless Steve decides. Watching and rewriting from understanding is the default.

**Motion control (class, not a vendor):** wheels and hip roll want **high-bandwidth FOC / QDD / model-based** loops. That is the plant we want, not a SKU. Knee / hip swing: **CAN QDD is the working class** on 8S; servo or stepper+belt is the fallback (2026-09-26).

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md). Bring-up list: [`checklists/software-bringup.md`](checklists/software-bringup.md).

0. **Layer 2 skeleton with tests** — mode machine, a stub estimator, a stub controller, parameter table, all as a library that builds on the host and runs its tests with no hardware. Before any board is flashed.
1. **Blink + CRSF** — bench board (F765 is fine here). Bind the Nano, print sticks and the mode. Electronics **P0**.
2. **Spin** — one restrained CAN actuator (or a SimpleFOC wheel over UART on the F765 if actuators are not here yet). Not on carpet. **P1**.
3. **First real image on the CAN MCU** — layer 2 linked in; IMU at 1 kHz; CAN to both wheels; **blackbox to SD**; **live parameters** over the framed link; **hardware torque cut + IWDG** proven by pulling the plug. Telem says `PARKED` only after support is verified. **P2**.
4. **Companion listener** — ROS 2 node in a container on the Pi 5: parses the framed stream, publishes state, records MCAP, sets parameters. Listen-only until step 5 holds.
5. **`TWO_WHEEL` balance teleop** — the studied PID cascade (R18) in layer 2, tuned from blackbox + live params, TBS in, telem reports `TWO_WHEEL`. **P2**.
6. **Pose joints from the stick** — knee + hip swing on CAN, position mode, teleop hold. **P3**.
7. **`LEFT_ONLY`, then `RIGHT_ONLY`** — hip roll + planted-wheel fore/aft, best-effort. **P4**. May not work as hoped; still expose the modes. Gate before stairs.
8. **Open-loop step** toward a 9.5" riser fixture. Not before the four modes work.
9. **Camera stream** — one teleop stream through the companion. **P5**.
10. **Perception** — stereo depth and nosing detection; this is where the companion becomes a Jetson if the Pi 5 cannot hold the rate. **P5**.
11. **Twin** — layer 2 compiled into the simulator, same parameters, same estimator inputs. Pipeline TBD ([`decisions.md`](decisions.md)); the contract comes first.

## Phased roadmap

Steve, 2026-09-22. Three phases. Do **not** invert them. R14 and R18 stay.

| Phase | What | Not |
| --- | --- | --- |
| **V1 — classical balance + modes** | Layer-2 skeleton → blink → spin → `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY` from TBS on the **CAN MCU**. Reuse an existing simple balance pattern (R18). CAN QDD / FOC actuators on 8S. Open-loop 9.5" fixture after the four modes work. | An RL gate. A novel Hux V1 controller. A sim trainer before the robot stands. Firmware that only runs on the F765. |
| **Later — CAD / URDF twin lockstep** | When CAD exists: CAD, exported model, and firmware zeros stay the **same robot** (Stompy lesson). Geometry edits flow through all three. **Lock the contract first** (CAD→URDF/USD or MJCF, observation parity, motorcycle-crown tire contact, firmware zeros, stack willingness). **Layer 2 is the controller in the twin** — no re-implementation. Pipeline (Isaac / MuJoCo / mjlab / other) stays **TBD** — 2026-09-25. | A day-one wheel-balance task. A mjlab / Isaac lock. Standing up a dojo before `TWO_WHEEL`. |
| **Horizon — sim dojo / RL** | Identical digital twin + domain-randomized dojo so a policy trained in sim runs on the companion (a small MLP needs no GPU; the Jetson is for perception). Later terrains: stairs, rubble, dirt, fall leaves, wet mud. | A replacement for R18. A V1 blocker. A reason to skip modes. Buying a 4090 or locking Isaac Lab. |

V1 may / should stand and balance with classical / reused control **before** any of the later two. The twin and the dojo are the cool long-term goal, not the next firmware folder.

## Repo homes (empty)

- [`../firmware/`](../firmware/) — layer 2 (`hux_control`, portable library + tests) and layer 3 (per-board firmware that links it). Bench sketches for the F765 live in a clearly named throwaway folder.
- [`../software/`](../software/) — layer 4: ROS 2 workspace, container definitions, camera and telemetry nodes.

## Explicitly not started

- Closed-loop stair gait.
- Stereo / depth for stairs (P5; the Jetson question lives there).
- Simulation (MuJoCo or otherwise) as a **V1** job. The twin / dojo is a **horizon**, not this folder today. The **pipeline is TBD** — do not lock Isaac / MuJoCo / mjlab, and do not stand up Isaac Lab or buy a 4090 before `TWO_WHEEL`. The living-drawings 3D sandbox ([`../tools/living-drawings/sim.html`](../tools/living-drawings/sim.html), [`research/sim-sandbox.md`](research/sim-sandbox.md)) is a design toy with a game-grade engine and its own JS LQR — not the twin and not layer 2 (R18). Tires are a shared round-crown profile with a carcass spring since 2026-09-25 (`tools/living-drawings/tire.js`); the stiffness is a guess until a tire is measured.
- A requirements-complete autonomy stack.
- A **novel Hux V1 balance controller** (R18). Study existing patterns; do not invent one to fill layer 2.
- micro-ROS on the MCU. Optional later; the framed protocol comes first.
- Any code that only runs on the F765-Wing.
