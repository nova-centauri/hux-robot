# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless FOC** (ESC + BLDC per wheel) | Working V1 baseline. Exact motor/ESC models TBD. Not steppers. |
| Knee / hip swing | **Stepper + reduction** | Knee: belt/gear (not bare). Swing: belt **is** the reducer — not a second actuator. SKU TBD. |
| Hip roll | **In V1.** **Dynamic** FOC BLDC / small QDD / fast servo | Not a stepper. Experimental — may not work. Still wire the axis and the modes. SKU TBD. |
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
| **Hip roll** | **In V1.** **Dynamic:** FOC BLDC / **small** QDD / fast bus servo | **Not a stepper. Not V2.** Experimental. Torque-mode / high-rate current loop. Ideally backdrivable. Include the driver channel even if the first loop is ugly. |
| **Wheels** | **Brushless FOC** (R6) | Already the baseline. Not steppers. |

Do not put a stepper on hip roll to “match” the knees. Missed steps, resonance, and belt stretch/backlash hurt the CoG loop that pairs with wheel fore-aft.

**All-stepper is not the baseline.** If later forced: closed-loop drivers that actually use the encoder, short low-backlash belts, and a written acceptance of **lower one-leg bandwidth** (R28). Do not invent a Hux stepper stack to paper over that.

### Hold current, heat, 4S

A stepper often sits at **holding current** to keep a pose. Two knees + two hip swings (and worse, two roll axes) is continuous draw and heat in printed housings, even when Hux is standing still. That is **4S drain** (battery class lean when R11 lands) — capacity / C still **TBD**, not a pack lock.

FOC / torque-mode can hold with less waste if springs take gravity (R7). Another reason roll should not be an open-loop stepper.

Do not invent a PDB / BEC / stepper-driver BOM. Do not recommend spend.

## Actuator I/O architecture (8 axes)

Steve 2026-09-20. **Class locked. SKU not. FC still TBD.** Count the axes before we pretend a Wing board can host everything.

| Count | Axis | Drive class |
| --- | --- | --- |
| 2 | Wheels (L / R) | Brushless FOC |
| 4 | Steppers: L/R **knee** + L/R **hip swing** | Stepper + reduction (R26) |
| 2 | Hip **roll** (L / R) | Dynamic FOC BLDC / small QDD / fast bus servo (R16 / R27). Experimental. |
| **8** | **V1 total** | Not eight identical motors. |

**The FC does not drive stepper coils.** Coil current belongs on **stepper driver board(s)** — **TMC-class** or other **multi-axis** driver *class* — sitting between a host (FC **or** Pi **or** a dedicated stepper controller) and the four steppers. Step/dir (or a bus the driver already speaks) is the interface. GPIO-toggling phases from a flight controller is out.

No driver SKU. “TMC-class / multi-axis” is a family, not a cart.

### Preferred split (V1)

| Host | Owns | Why |
| --- | --- | --- |
| **FC** (TBD) | IMU + attitude + **wheel FOC**. **Hip roll** too *if* the link is honest (**PWM / CAN** / equivalent). TBS Nano RX. | Balance loop and fast torque live here. Roll is in that loop (best-effort). |
| **Pi** *or* a **dedicated stepper controller** | The **four steppers**, via driver board(s), **step/dir** | Position / pose on knee + swing. Not a 1 kHz CoG loop. |

The Pi already owns cameras / pathfinding / Wi‑Fi telem. Adding step/dir for four slow position axes is honest. A dedicated stepper controller is the same class of idea if the Pi should stay busy. **TBD which of those two hosts the step/dir.** Not a buy.

Hip-roll **if not** PWM/CAN-friendly on the chosen FC: treat it like the wheels (external FOC / servo bus), still **not** a stepper, still on the balance side of the split. Do not move roll onto the stepper controller to “use leftover channels.”

### Anti-pattern — drone firmware as stepper host

A **Wing** FC can **spare pins**. That does not make **drone firmware** (Betaflight / INAV / similar) a stepper host.

V1 anti-pattern:

- Bit-bang step/dir (or worse, coil phases) from a flight-stack mixer / resource map
- Steal DShot / motor outputs as fake steppers
- “The F765 has UART and timers, so we can run four TMC chips in the INAV task”

Even if the silicon can toggle pins, the firmware is a poor stepper host: timing, blocking, and no honest current loop. **Do not do this for V1.** Spare pins are for RX, telem, and maybe roll PWM/CAN — not for becoming a CNC controller.

FC lock is still **TBD**. This paragraph does not pick Wing vs drone FC. It forbids using whichever we pick as a coil driver.

### Mass is not a driver veto

V1 mass is **aspirational 4–5 lb / under 6 lb** (R24). Soft. A capable roll driver + motor that pushes past 6 lb is allowed. A tiny stepper driver that “saves” grams and then misses steps on roll is the worse trade.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► wheel FOC (2× BLDC)
                    │            └──► hip roll (2× dynamic) if PWM/CAN
                    │
                    └── IMU / attitude

Pi ── cameras, pathfinding, Wi‑Fi telem
  └── *or dedicated stepper controller* ──► TMC-class / multi-axis driver(s)
                                              └──► 4× steppers step/dir
                                                  (L/R knee, L/R hip swing)

ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
```

**8 axes.** FC does **not** drive stepper coils. This is a box diagram, not a harness. No SKU.

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
- Do not omit the hip-roll driver channel from V1 “until V2.”
- Do not drive stepper **coils** from the FC. Do not host four steppers in drone firmware just because a Wing board has spare pins.
