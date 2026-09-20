# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless** (ESC + BLDC per wheel) | Exact motor/ESC models TBD. |
| Companion | **Raspberry Pi** | Cameras + pathfinding inference. Not on the FC. |
| Wi‑Fi telem | **Pi first** | ESP32 only as an optional thin telemetry bridge. |

## Flight controller — TBD

**Do not lock an FC in this repo.** Steve 2026-09-20: leave it TBD. Prefer a Wing board *when* we lock. Mechanical work is not blocked.

Candidates already on hand:

- F765 Wing
- F722 Wing
- F722 drone FC
- Mamba F405

When one is actually on the bench and blinking, record it here and in [`../NOTES.md`](../NOTES.md). Until then the line is **FC: TBD**.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► ESC/BLDC wheels
                    │            └──► leg actuators (TBD **by axis** — see below)
                    │
                    └── IMU / attitude
Raspberry Pi ── cameras, pathfinding, Wi‑Fi telem
ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
```

This is a box diagram, not a harness.

## Leg actuators — TBD by axis role

Do not treat “leg actuators” as one part. Hip **roll**, hip **swing**, and **knee** are different jobs. Decision note: [`research/actuators-legs.md`](research/actuators-legs.md) (R26).

| Axis | Electronics lean (TBD, not locked) |
| --- | --- |
| Hip roll | Highest bandwidth, continuous small corrections, prefer backdrivable. Small QDD / FOC BLDC + low reduction, **or** a fast digital bus servo. Two of them — mass-critical. |
| Hip swing | Position + speed, intermittent. **Share the hip-roll family** (same serial bus **or** same CAN/FOC QDD) for drivers and spares. |
| Knee | Highest gravity + 9.5" step torque. One size up in that family, **or** linear + linkage + spring. Heaviest pair. |

Reuse **position / torque modes the existing drivers already expose** (R18). Do not invent a Hux joint controller. Avoid 63xx / hoverboard as *leg* actuators. No SKU. No spend.

## Bring-up order (no carpet)

See [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md).

1. Pick an FC from the on-hand pile when ready — still not a lock until it survives blink.
2. Blink an LED.
3. Restrained wheel spin (prop-off equivalent: robot tied down, not free on carpet).
4. TBS stick into the FC.
5. Wi‑Fi telemetry from the Pi (or ESP32 bridge).

## Do not

- Do not buy a “better” FC, ESC, or Pi for this scaffold.
- Do not recommend spend.
- Do not invent a finished PDB / BEC / battery stack.
- Do not treat any candidate as selected.
- Do not lock a leg-actuator SKU or force one type onto hip roll, hip swing, and knee. Classes by axis: [`research/actuators-legs.md`](research/actuators-legs.md).
