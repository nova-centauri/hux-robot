# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no new spend.

**Parts on hand** (owned / ordered — not a buy list): [`parts-on-hand.md`](parts-on-hand.md). **Minimum set** (classes, P0–P5, no SKU): [`electronics-minimum.md`](electronics-minimum.md). **Shop / proto** (tools, not parts): [`capabilities.md`](capabilities.md) — soldering and breadboards are welcome for bench bring-up.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless** (ESC + BLDC per wheel) | Exact motor/ESC models TBD. |
| Companion | **Raspberry Pi** | Cameras + pathfinding inference. Not on the FC. |
| Wi‑Fi telem | **Pi first** | ESP32 only as an optional thin telemetry bridge. |

## Flight controller — TBD

**Do not lock an FC in this repo.** Steve 2026-09-20: leave it TBD. Prefer a Wing board *when* we lock. Mechanical work is not blocked.

Candidates already on hand (owned, **not** reserved unless a row says so — [`parts-on-hand.md`](parts-on-hand.md)):

- F765 Wing
- F722 Wing
- F722 drone FC
- Mamba F405

When one is actually on the bench and blinking, record it here and in [`../NOTES.md`](../NOTES.md). Until then the line is **FC: TBD**.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► ESC/BLDC wheels
                    │            └──► leg actuators (TBD)
                    │
                    └── IMU / attitude
Raspberry Pi ── cameras, pathfinding, Wi‑Fi telem
ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
```

This is a box diagram, not a harness.

## Bring-up order (no carpet)

See [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md).

1. Pick an FC from the on-hand pile when ready — still not a lock until it survives blink.
2. Blink an LED.
3. Restrained wheel spin (prop-off equivalent: robot tied down, not free on carpet).
4. TBS stick into the FC.
5. Wi‑Fi telemetry from the Pi (or ESP32 bridge).

## Do not

- Do not buy a “better” FC, ESC, or Pi for this scaffold.
- Do not recommend spend. Wheels already ordered are documented on [`parts-on-hand.md`](parts-on-hand.md) only.
- Do not invent a finished PDB / BEC / battery stack.
- Do not treat any candidate as selected.
