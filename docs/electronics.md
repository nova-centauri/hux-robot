# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

## Locked enough to write down

Electric-only is a lock. **4S LiPo is a class lean**, not a pack lock.

| Piece | Choice | Notes |
| --- | --- | --- |
| Powertrain | **Electric-only** | No ICE, no hybrid. Whole robot. |
| Battery class | **4S LiPo** (RC car/boat packs) | Nominal **~14.8V** / full **~16.8V**. Capacity and C-rating **TBD**. No pack SKU. |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless** (ESC + BLDC per wheel) | Exact motor/ESC models TBD. Diameter / tire: see [`mechanical.md`](mechanical.md). |
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

## Battery — 4S LiPo class (intent)

Steve 2026-09-20: the robot is **electric**. Lean is **4S LiPo** as used in RC cars/boats. That is a *class*, not a pack.

| Item | Intent | Status |
| --- | --- | --- |
| Chemistry / cell count | 4S LiPo | Class lean. Not a locked SKU. |
| Nominal / full | **~14.8V** / **~16.8V** | Use these when thinking about ESC / servo / BEC *ranges*. Do not invent a sag curve. |
| Capacity (mAh) | TBD | No spend. Do not guess a pack size into a BOM. |
| C-rating / max current | TBD | Follows actuators + wheel ESCs once those exist. |
| Power bus / PDB / BEC | **TBD** | Box only. Do not invent a finished distribution board or a BEC shopping list. |
| Charging / balance lead / connector | TBD | Not this document. |

Power rail sketch (not a harness):

```
4S LiPo (class, TBD pack)
        │
        ▼
   power bus TBD  ──► wheel ESC / BLDC
        │         ──► hip + knee actuators (TBD class)
        │         ──► FC (TBD) + RX + companion (via BEC/UBEC/PDB — all TBD)
        └── do not draw a finished PDB here
```

When a real pack is on the bench, record cell count, measured resting voltage, connector, and who it actually feeds. Until then: **4S LiPo class, power bus TBD**.

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

- Do not buy a “better” FC, ESC, Pi, or LiPo for this scaffold.
- Do not recommend spend.
- Do not invent a finished PDB / BEC / battery stack or a pack SKU.
- Do not treat 4S as a locked pack, and do not treat any FC candidate as selected.
- Do not lock hip / knee actuators here. Those are mechanical research (see [`mechanical.md`](mechanical.md)).
