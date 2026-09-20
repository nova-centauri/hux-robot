# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend. **4S + step-down** is a class rule, not a pack/BEC lock. **Servo vs stepper+belt TBD.**

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| Powertrain | **Electric-only** | No ICE, no hybrid. |
| Battery class | **4S LiPo** (preferred) | Nominal **~14.8V** / full **~16.8V**. Capacity and C-rating **TBD**. No pack SKU. |
| Pose / logic rails | **Controlled step-down** from 4S | BEC / regulator *class* to **5V / 6V / 7.4V** as the actuator needs. SKU **TBD**. |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless** (ESC + BLDC + encoder per wheel) | Motor-at-wheel. Exact models TBD. |
| Knee / hip swing | **Servo vs stepper+belt TBD** | Both open. Size either for one-leg (~2×) load. No SKU. No lean. |
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

## Battery — 4S preferred; step down for pose / logic

Steve 2026-09-20 follow-up. **4S LiPo stays the preferred pack class.** Serra's machine is 3S + Arduino — do not follow that bus. 4S holds voltage better under current spikes than 3S.

Wheel FOC on a two-wheel (and later one-wheel) balancer is a **high-draw** load. Pose actuators (servo *or* stepper) and logic must not share that sag.

**Rule:** 4S pack → **controlled step-down** (BEC / regulator *class*) for **5V / 6V / 7.4V** servo or logic rails. Do not feed a 5–7.4V servo bus from raw 4S. Do not hang pose actuators on the same unregulated tap as the wheel ESCs.

| Item | Intent | Status |
| --- | --- | --- |
| Chemistry / cell count | 4S LiPo (preferred) | Class lean. Not a locked SKU. |
| Nominal / full | **~14.8V** / **~16.8V** | Use when thinking about ESC / servo / BEC *ranges*. |
| Capacity (mAh) / C-rating | TBD | No spend. Do not guess a pack into a BOM. |
| Wheel bus | 4S (via ESC) | High-draw FOC. Encoder on the wheel axis. |
| Pose / logic rails | **Step down** to 5V / 6V / 7.4V | Separate enough that a wheel current spike does not brown out a planted knee/hip. |
| BEC / regulator / PDB | **Class only** | Box on the sketch. **No SKU.** Do not invent a finished distribution board. |

Power rail sketch (not a harness):

```
4S LiPo (class, TBD pack)
        │
        ▼
   power bus TBD
        ├── wheel ESC / BLDC + encoder  (high draw; 4S)
        ├── step-down (BEC/reg class, TBD) ──► 5V / 6V / 7.4V pose + logic
        │         └── knee / hip (servo *or* stepper — class TBD)
        └── FC (TBD) + RX + Pi  (via the regulated rail or a second tap — TBD)
```

When a real pack is on the bench, record cell count, measured resting voltage, connector, and who it actually feeds. Until then: **4S preferred, step-down for pose/logic, no BEC SKU.**

## Leg drive class — undecided

**Servo vs stepper+belt is TBD.** Do not lock either. Both are open options for knee and hip swing. Size **whichever we pick** for one-leg standing load (~2×; R14). Wheels stay brushless. See [`mechanical.md`](mechanical.md) and [`research/inspiration.md`](research/inspiration.md).

Do not pick a servo voltage (6V vs 7.4V vs 8.4V) or a stepper driver SKU here. The rail *exists* so whichever class we pick does not brown out when the wheels snap the CoG back.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► ESC/BLDC wheels (+ encoders)
                    │            └──► leg actuators (servo *or* stepper+belt — TBD)
                    │
                    └── IMU / attitude
Raspberry Pi ── cameras, pathfinding, Wi‑Fi telem
ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
4S pack ──► wheel ESCs
         └──► step-down ──► pose / logic rails
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

- Do not buy a “better” FC, ESC, BEC, servo, stepper, or Pi for this scaffold.
- Do not recommend spend.
- Do not invent a finished PDB / BEC SKU or a pack size.
- Do not run pose actuators on raw 4S, or on the same unregulated tap as wheel FOC.
- Do not lock servo vs stepper+belt.
- Do not treat any FC candidate as selected.
