# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

**Minimum set (classes, phases, no SKU):** [`electronics-minimum.md`](electronics-minimum.md). That page is the P0–P5 buy/assemble order and the 8-axis box. This page stays the lock language + FC pile.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless FOC** (ESC + BLDC per wheel) | Exact motor/ESC models TBD. Not steppers. |
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
TBS Nano RX ──► FC (TBD) ──► FOC / BLDC wheels
                    │            └──► hip roll (dynamic, V1) + pose steppers via drivers
                    │
                    └── IMU / attitude
Raspberry Pi ── cameras, pathfinding, Wi‑Fi telem (P5; optional P3 stepper brain)
ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
```

This is a box diagram, not a harness. Full 8-axis + rails: [`electronics-minimum.md`](electronics-minimum.md). FC does **not** drive stepper coils.

## Bring-up order (no carpet)

See [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md). Phased class list: [`electronics-minimum.md`](electronics-minimum.md) (P0 bench → P5 Pi).

1. Pick an FC from the on-hand pile when ready — still not a lock until it survives blink. **P0.**
2. Blink an LED. **P0.**
3. Restrained wheel spin (prop-off equivalent: robot tied down, not free on carpet). **P1.**
4. TBS stick into the FC. **P0** (bind) → **P2** (modes).
5. `PARKED` / `TWO_WHEEL` on both FOC wheels. **P2.** Modes: [`software.md`](software.md).
6. Wi‑Fi telemetry from the Pi (or ESP32 bridge). **P5** — not required for first balance.

## Do not

- Do not buy a “better” FC, ESC, or Pi for this scaffold.
- Do not recommend spend.
- Do not invent a finished PDB / BEC / battery stack or a pack SKU. Class-level rails live in [`electronics-minimum.md`](electronics-minimum.md).
- Do not treat any candidate as selected. **FC stays TBD.**
