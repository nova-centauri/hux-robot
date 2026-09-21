# Software

**Status:** TBD. No flight stack, no ROS distro, no inference model.

Prefer checklists and milestone order over a fake finished stack. Decisions: [`decisions.md`](decisions.md). Electronics that enable the modes: [`electronics-minimum.md`](electronics-minimum.md).

## Split brain (intent)

| Layer | Job | When |
| --- | --- | --- |
| FC firmware | IMU, attitude, **wheel FOC**, TBS RX, **manual mode select**. **Hip roll** if PWM/CAN. **Not** a stepper-coil host. | After an FC is on the bench. Stack **TBD** with the FC. |
| Pi companion *or* dedicated stepper controller (if steppers) | **Pose joints** via honest drivers (step/dir *or* servo bus). Pi also: cameras, later pathfinding, Wi‑Fi telem (report **active mode**). | Pose host **TBD**. After wheels blink. |
| ESP32 (optional) | Thin Wi‑Fi / telemetry bridge | Only if the Pi should not own that link. |

Do not pick Betaflight vs INAV vs ArduPilot vs custom here. That choice follows the FC, and the FC is TBD. **Do not** pick a drone stack *because* it might bit-bang steppers — that is a V1 anti-pattern (R29). See [`electronics.md`](electronics.md).

## Manual control modes

Steve, 2026-09-20. Four **manual** states, selected by a human, **before** any automated motion (R14).

Automation (open-loop step scripts, pathfinding, later stair gait) **waits** until a pilot can enter, hold, and leave each mode from RC. Do not write fake firmware here. Channel map and FC stack stay **TBD**.

### States

| Mode | Enum (intent) | What it is | Wheels / legs | Electronics phase |
| --- | --- | --- | --- | --- |
| **Parked** | `PARKED` | Safe idle. No balance loop driving the wheels. Wheels held or disabled as appropriate. Default and lost-link state. | Neither wheel driven by the balance loop | **P2** (FC + RX from **P0**) |
| **2-wheel balance** | `TWO_WHEEL` | Both wheels active for bipedal balance / teleop. Baseline stance. | Left + right planted and driven | **P2** |
| **Left wheel only** | `LEFT_ONLY` | Balance / drive on the **left** planted wheel. Right leg free for a step cycle. | Left planted; right free | **P4** (after hip-roll class) |
| **Right wheel only** | `RIGHT_ONLY` | Mirror of left. | Right planted; left free | **P4** |

`LEFT_ONLY` and `RIGHT_ONLY` are the one-leg-balance gates (R2 / R14). They are **not** an automatic step. Mode change does not lift, plant, or path-follow.

### State machine (intent)

```
                         lost RC / disarm / explicit Parked
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

- **Parked** is the default and the failsafe. Lost TBS link, disarm, or an explicit Parked switch dumps here from any mode.
- Enter **2-wheel** from Parked when the pilot arms / selects the stance mode.
- Enter **left-only** or **right-only** from **2-wheel** (not by jumping Parked → one-wheel on the bench until 2-wheel is proven).
- Return to **2-wheel** before flipping left ↔ right. Do not cross-switch through a one-wheel mode.
- The machine does **not** lift, plant, or path-follow because a mode changed. Mode select only enables which wheels the balance / teleop loop may drive.
- No autonomy process is allowed to command wheel or leg motion until these four modes work from RC.

### Mode select and telemetry

- **Switching:** RC on the **TBS Nano RX**, likely an aux switch / flight-modes style channel. Exact aux channel and PWM / CRSF ranges are **TBD** with the FC — do not invent a mixer here.
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

Do not write gains, a mixer, a channel map, or Hux firmware here. FC is **TBD**. This is the story, not a controller. Do not fake a CoG shift if the roll joint is unplugged — and do not unplug it to wait for V2.

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
| **FC attitude loops** | Roll / pitch / yaw PID the on-hand FCs already run | Follows the FC. FC is TBD. |
| **ODrive / SimpleFOC torque modes** | Current / torque command into a BLDC wheel or joint | Pattern, not a purchase. |

Phase A of [`research/study-plan.md`](research/study-plan.md) is where we extract how those loops actually work. Phase C is where Steve picks adapt vs rewrite. Until then: **no Hux-original balance firmware**, no fake mixer, no invented gains.

Tazer spent a long time on **LQR with a bad model**; a **PID cascade** is what actually balanced. That is R18 in someone else's blood. Do not start V1 on LQR. See [`research/tazer-lessons.md`](research/tazer-lessons.md).

If a pointer is copyleft (RobotX, SonicRobot), keep Hux MIT unless Steve decides. Watching and rewriting from understanding is the default.

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC. Electronics **P0**.
2. **Spin** — restrained brushless wheel, not on carpet. **P1**.
3. **Parked** — safe idle; telem says `PARKED`; wheels not driven by a balance loop. **P2**.
4. **2-wheel balance teleop** — TBS + telem reports `TWO_WHEEL`. **P2**.
5. **Left-only, then right-only** — V1 **best-effort** CoG shift: hip roll (experimental dynamic actuator) **and** planted-wheel fore/aft, using an **existing** pattern (R18). **P4**. May not work as hoped. Still expose the modes. Gate before stairs.
6. **Open-loop step** — toward a 9.5" riser fixture. No vision required. Not before the four modes work.
7. **Camera stream** — one teleop stream first. **P5**.
8. **Local pathfinding** — later, on the Pi, not on the FC. Pathfinding **motion** waits on the manual modes.

## Repo homes (empty)

- [`../firmware/`](../firmware/) — FC / embedded bring-up.
- [`../software/`](../software/) — Pi companion, cameras, later inference.

## Explicitly not started

- Closed-loop stair gait.
- Stereo / depth for stairs.
- Simulation (MuJoCo or otherwise).
- A requirements-complete autonomy stack.
- A **novel Hux V1 balance controller** (R18). Study existing patterns; do not invent one to fill `firmware/`.
- Firmware that implements the mode machine or the one-leg loop (FC is TBD; this page is the spec).
