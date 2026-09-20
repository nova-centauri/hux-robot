# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless FOC** (ESC + BLDC per wheel) | Working V1 baseline. Exact motor/ESC models TBD. Not steppers. |
| Knee / hip swing | **Stepper + reduction** | Knee: belt/gear (not bare). Swing: belt **is** the reducer — not a second actuator. SKU TBD. |
| Hip roll | **Dynamic** FOC / QDD / fast servo | Not a stepper. Required for CoG shift unless explicitly deferred. SKU TBD. |
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

## Leg drive classes — working V1 baseline (no SKU)

Steve 2026-09-20 (confirmed). **FC still TBD.** Class is locked. Driver BOM is not. No locked stepper, FOC board, bus servo, or encoder. No shopping links. Trade: [`research/actuators-legs.md`](research/actuators-legs.md).

| Joint | Working baseline | Electronics implication |
| --- | --- | --- |
| **Knee** | **Stepper with belt/gear reduction** | Not a bare stepper. Stepper driver *class* later. Open-loop or closed-loop + encoder. Holding a pose is the job. |
| **Hip swing** | **Stepper + belt** | Belt **is** the reduction — not a second actuator, not a second driver channel for a second motor. |
| **Hip roll** | **Dynamic:** FOC BLDC / QDD / fast bus servo | **Not a stepper.** Required for CoG shift unless explicitly deferred. Torque-mode / high-rate current loop. Ideally backdrivable. |
| **Wheels** | **Brushless FOC** (R6) | Already the baseline. Not steppers. |

Do not put a stepper on hip roll to “match” the knees. Missed steps, resonance, and belt stretch/backlash hurt the CoG loop that pairs with wheel fore-aft.

**All-stepper is not the baseline.** If later forced: closed-loop drivers that actually use the encoder, short low-backlash belts, and a written acceptance of **lower one-leg bandwidth** (R28). Do not invent a Hux stepper stack to paper over that.

### Hold current, heat, 4S

A stepper often sits at **holding current** to keep a pose. Two knees + two hip swings (and worse, two roll axes) is continuous draw and heat in printed housings, even when Hux is standing still. That is **4S drain** (battery class lean when R11 lands) — capacity / C still **TBD**, not a pack lock.

FOC / torque-mode can hold with less waste if springs take gravity (R7). Another reason roll should not be an open-loop stepper.

Do not invent a PDB / BEC / stepper-driver BOM. Do not recommend spend.

### Mass is not a driver veto

V1 mass is **aspirational 4–5 lb / under 6 lb** (R24). Soft. A capable roll driver + motor that pushes past 6 lb is allowed. A tiny stepper driver that “saves” grams and then misses steps on roll is the worse trade.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► ESC/BLDC wheels (brushless FOC)
                    │            └──► knee: stepper + belt/gear reduction
                    │            └──► hip swing: stepper + belt (belt = reducer)
                    │            └──► hip roll: FOC / QDD / fast servo (or explicit deferral)
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

- Do not buy a “better” FC, ESC, Pi, stepper, pulley set, FOC board, or encoder for this scaffold.
- Do not recommend spend. Do not paste shopping links as “buy this.”
- Do not invent a finished PDB / BEC / battery / stepper-driver stack.
- Do not treat any FC candidate or actuator *SKU* as selected. The actuator *class* baseline is locked.
- Do not put steppers on the wheels or on hip roll to make the BOM uniform.
