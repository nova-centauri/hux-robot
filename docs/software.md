# Software

**Status:** TBD. No flight stack, no ROS distro, no inference model.

Prefer checklists and milestone order over a fake finished stack.

## Split brain (intent)

| Layer | Job | When |
| --- | --- | --- |
| FC firmware | IMU, attitude, wheel (and likely leg) actuation, TBS RX, **manual mode select** | After an FC is on the bench. Stack **TBD** with the FC. |
| Pi companion | Camera stream, later pathfinding inference, Wi‑Fi telem (report **active mode**) | After two-leg teleop. |
| ESP32 (optional) | Thin Wi‑Fi / telemetry bridge | Only if the Pi should not own that link. |

Do not pick Betaflight vs INAV vs ArduPilot vs custom here. That choice follows the FC, and the FC is TBD.

## Manual control modes

Steve, 2026-09-20. Four **manual** states, selected by a human, **before** any automated motion.

Automation (open-loop step scripts, pathfinding, later stair gait) **waits** until a pilot can enter, hold, and leave each mode from RC. Do not write fake firmware here. Channel map and FC stack stay **TBD**.

### States

| Mode | Enum (intent) | What it is | Wheels / legs |
| --- | --- | --- | --- |
| **Parked** | `PARKED` | Safe idle. No balance loop driving the wheels. Wheels held or disabled, whichever is appropriate for the bench / failsafe. Default and lost-link state. | Neither wheel driven by the balance loop |
| **2-wheel balance** | `TWO_WHEEL` | Both wheels active for bipedal balance / teleop. Baseline stance. | Left + right planted and driven |
| **Left wheel only** | `LEFT_ONLY` | Balance / drive on the **left** planted wheel. Right leg free for a step cycle. | Left planted; right free |
| **Right wheel only** | `RIGHT_ONLY` | Mirror of left. Balance / drive on the **right** planted wheel. Left leg free. | Right planted; left free |

`LEFT_ONLY` and `RIGHT_ONLY` are the one-leg-balance gates (requirements R2 / R14). They are **not** an automatic step.

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

- **Switching:** RC on the **TBS Nano RX**, likely an aux switch / flight-modes style channel (same idea as airplane flight modes). Exact aux channel and PWM/CRSF ranges are **TBD** with the FC — do not invent a mixer here.
- **Telemetry:** Wi‑Fi telem (Pi first; ESP32 only as a thin bridge) **reports the active mode** as a name + the enum above, so the bench laptop matches what the FC thinks.
- Stick (pitch / roll / yaw / throttle semantics) still maps to tilt / speed / yaw **inside** the selected mode. Stick does not replace the mode switch.

Bring-up order for these modes: [`checklists/software-bringup.md`](checklists/software-bringup.md). Requirement: **R14** in [`requirements.md`](requirements.md).

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC.
2. **Spin** — restrained brushless wheel, not on carpet.
3. **Parked** — safe idle; telem says `PARKED`; wheels not driven by a balance loop.
4. **2-wheel balance teleop** — TBS + Wi‑Fi telem reports `TWO_WHEEL`.
5. **Left-only, then right-only** — one-leg gates. Telem matches the switch. Gate before stairs.
6. **Open-loop step** — toward a 9.5" riser fixture. No vision required. Not before the four modes work.
7. **Camera stream** — one teleop stream first.
8. **Local pathfinding** — later, on the Pi, not on the FC. Pathfinding **motion** waits on the manual modes.

## Repo homes (empty)

- [`../firmware/`](../firmware/) — FC / embedded bring-up.
- [`../software/`](../software/) — Pi companion, cameras, later inference.

## Explicitly not started

- Closed-loop stair gait.
- Stereo / depth for stairs.
- Simulation (MuJoCo or otherwise).
- A requirements-complete autonomy stack.
- Firmware that implements the mode machine (FC is TBD; this page is the spec).
