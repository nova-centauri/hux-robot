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

## Manual control modes (intent)

Steve 2026-09-20. Four **manual** states, selected by a human, **before** any automated motion. Electronics that enable them: [`electronics-minimum.md`](electronics-minimum.md). Do not write fake firmware here. Channel map and FC stack stay **TBD**.

| Mode | Enum (intent) | What it is | Electronics phase |
| --- | --- | --- | --- |
| **Parked** | `PARKED` | Safe idle. No balance loop driving the wheels. Default and lost-link. | **P2** (FC + RX from **P0**) |
| **2-wheel balance** | `TWO_WHEEL` | Both wheels active for bipedal teleop. Baseline stance. | **P2** |
| **Left wheel only** | `LEFT_ONLY` | Balance / drive on the **left** planted wheel. Right leg free. | **P4** (after hip-roll class) |
| **Right wheel only** | `RIGHT_ONLY` | Mirror of left. | **P4** |

`LEFT_ONLY` and `RIGHT_ONLY` are the one-leg-balance gates. They are **not** an automatic step. Mode change does not lift, plant, or path-follow.

Pilot selects via **TBS Nano RX** (likely aux / flight-modes style). Wi‑Fi telem reports the active mode when telem exists (**P5**; USB/serial is enough for P2). Open-loop step and pathfinding motion **wait**.

## First software, in order

Tracked in [`../NOTES.md`](../NOTES.md).

1. **Blink** — prove we can flash *something* on the bench FC. Electronics **P0**.
2. **Spin** — restrained brushless wheel, not on carpet. **P1**.
3. **Parked + 2-wheel balance teleop** — TBS; telem reports `PARKED` / `TWO_WHEEL`. **P2**.
4. **Left-only, then right-only** — one-leg gates after hip-roll class (**P4**). Gate before stairs.
5. **Open-loop step** — toward a 9.5" riser fixture. No vision required. Not before the four modes work.
6. **Camera stream** — one teleop stream first. **P5**.
7. **Local pathfinding** — later, on the Pi, not on the FC. Pathfinding **motion** waits on the manual modes.

## Repo homes (empty)

- [`../firmware/`](../firmware/) — FC / embedded bring-up.
- [`../software/`](../software/) — Pi companion, cameras, later inference.

## Explicitly not started

- Closed-loop stair gait.
- Stereo / depth for stairs.
- Simulation (MuJoCo or otherwise).
- A requirements-complete autonomy stack.
- Firmware that implements the mode machine (FC is TBD; this page is the spec).
