# Software

**Status:** TBD. No flight stack, no ROS distro, no inference model.

Prefer checklists and milestone order over a fake finished stack.

## Split brain (intent)

| Layer | Job | When |
| --- | --- | --- |
| FC firmware | IMU, attitude, **wheel FOC**, TBS RX. **Hip roll** if PWM/CAN. | After an FC is on the bench. Stack **TBD** with the FC. **Not** a stepper-coil host. |
| Pi companion *or* dedicated stepper controller | **4× steppers** (knee + swing) via TMC-class / multi-axis driver(s), **step/dir**. Pi also: cameras, later pathfinding, Wi‑Fi telem. | Stepper host **TBD** (Pi vs dedicated). After wheels blink. |
| ESP32 (optional) | Thin Wi‑Fi / telemetry bridge | Only if the Pi should not own that link. |

Do not pick Betaflight vs INAV vs ArduPilot vs custom here. That choice follows the FC, and the FC is TBD. **Do not** pick a drone stack *because* it might bit-bang steppers — that is a V1 anti-pattern (R29). See [`electronics.md`](electronics.md).

## One-leg / hip roll (V1, experimental)

Steve: start somewhere. **Hip roll is in V1.** One-leg CoG shift is a **best-effort** goal, not a promise.

- Modes (when the concurrent modes note lands): Parked, `TWO_WHEEL`, `LEFT_ONLY`, `RIGHT_ONLY`. Roll is for the one-leg pair.
- Job: lean CoG over the planted wheel **and** drive that wheel fore/aft. Not roll alone, not wheel-only.
- The roll actuator is **dynamic** (FOC BLDC / small QDD / fast bus servo) — **not a stepper**. Class locked; SKU not. See [`research/actuators-legs.md`](research/actuators-legs.md).
- It may not work as hoped. Keep the axis and the modes anyway so we can learn.
- Do not invent a novel Hux balance stack (R18 when that lands). Do not fake a CoG shift if the joint is absent — and do not make it absent.

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC.
2. **Spin** — restrained brushless wheel, not on carpet.
3. **Two-leg balance teleop** — TBS + Wi‑Fi telem.
4. **One-leg balance** — V1 **best-effort** CoG shift: hip roll (experimental dynamic actuator) **and** planted-wheel fore/aft. May not work as hoped. Still expose `LEFT_ONLY` / `RIGHT_ONLY` so we can learn. Gate before stairs. Do not fake a CoG shift in firmware if the roll joint is unplugged — and do not unplug it to wait for V2.
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
