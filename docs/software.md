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

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC.
2. **Spin** — restrained brushless wheel, not on carpet.
3. **Two-leg balance teleop** — TBS + Wi‑Fi telem.
4. **One-leg balance** — gate before stairs.
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
