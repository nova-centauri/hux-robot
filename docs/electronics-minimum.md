# Minimum electronics (V1)

**Status:** planning note. **Docs only.** **FC: TBD.** **No new spend.** No locked SKUs.

This is the **smallest electronics set** that can meet Hux V1 goals: four **manual** modes first, then pose joints, then hip-roll experiments. Classes and on-hand parts only. Every pack, driver, and motor model stays **TBD** until Steve asks to buy or a real part is on the bench.

Parent: [`electronics.md`](electronics.md). Modes: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Tick real work in [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) and [`../NOTES.md`](../NOTES.md). Decisions: [`decisions.md`](decisions.md).

**Parts on hand** (owned / ordered — not a buy list): [`parts-on-hand.md`](parts-on-hand.md). Reserved-for-Hux is **TBD** unless a row there says otherwise. This page is classes and phases; that page is the inventory.

## Goals this set must enable (V1)

| Goal | Minimum electronics implication |
| --- | --- |
| Manual modes **before** autonomy: `PARKED`, `TWO_WHEEL`, `LEFT_ONLY`, `RIGHT_ONLY` | FC + IMU + RC in + wheel torque. Hip roll later for one-wheel modes. Spec: [`software.md`](software.md). |
| 2× **in-wheel** brushless **FOC** | 2 FOC ESC / driver channels + 2 BLDC + encoders. Not steppers. |
| 2× knee + 2× hip-swing **pose** joints | **Servo vs stepper+belt TBD.** If steppers: 4 drivers + 4 steppers; reduction required. If servos: 4 servo channels on the regulated rail. **GIM8108-8** is a candidate (not ordered). |
| 2× hip-roll **dynamic** (FOC / QDD / fast servo) **in V1** | 2 actuators + their drivers (PWM / CAN / FOC — **TBD**). Not steppers. Not deferred to V2. |
| **TBS Nano RX** | Bind into the FC (or a dedicated link into the FC). On hand. |
| Wi‑Fi telem | FC ↔ Pi **or** ESP32 bridge. Pi can wait until after 2-wheel works. |
| **4S LiPo** class + **step-down** | Nominal ~14.8 V / full ~16.8 V. Pose / logic on regulated 5 / 6 / 7.4 V. Pack SKU, capacity, C **TBD**. |
| **FC TBD** | On-hand wing / drone pile only. Do not lock. |
| Pi + cameras **later** | Not required for first balance (P0–P4). |
| Stepper coils **not** on the FC | **If** steppers are chosen: driver board(s) between a stepper brain and the four steppers. |

## Minimum system block diagram (text)

Not a harness. Not a PCB. Rails and links are **classes**.

```
4S LiPo (class, pack TBD)
        │
        ▼
power distribution / BEC rails
        │
        ├──► wheel FOC (4S, high draw)
        ├──► hip-roll dynamic (PWM / CAN / FOC — TBD)
        ├──► step-down ──► 5V / 6V / 7.4V pose + logic
        │
        ├──► FC (TBD) ── IMU, RC in, balance loops, modes
        │         ▲
        │         └── TBS Nano RX
        │
        ├──► 2× FOC / BLDC wheel drivers ──► 2× in-wheel BLDC + encoders
        │
        ├──► 2× hip-roll actuators + drivers (PWM / CAN / FOC — TBD)
        │
        ├──► pose brain (Pi  OR  dedicated MCU  OR  servo bus — TBD)
        │         │
        │         └──► 4× pose joints (servo *or* stepper+reduction)
        │                   (L/R knee, L/R hip swing)
        │
        └──► telem: FC ↔ Pi   or   FC ↔ ESP32 bridge
                    (Pi / cameras can wait until after TWO_WHEEL)
```

Rules for this box:

- The **FC does not drive stepper coils** if that class is chosen. Step/dir (or a bus the driver already speaks) is the interface. GPIO-toggling phases from a flight-stack mixer is out.
- Hip roll stays on the **balance** side of the split (with the wheels), even if the first loop is ugly. Do not park roll on leftover stepper channels.
- **FC: TBD.** Prefer a Wing board *when* we lock. Candidates on hand: F765 Wing, F722 Wing, F722 drone FC, Mamba F405.
- This is eight axes: 2 FOC wheels + 4 pose + 2 dynamic roll. Not eight identical motors.

## Phased minimum (buy / assemble order — classes only)

**No new spend until Steve asks.** Prefer the on-hand pile. A later phase is not a shopping list for today. Tick the matching rows in [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) only when the work is real.

### P0 — Bench

**FC + USB/power + TBS Nano bind + LED blink.**

- Pick a *bench* board from the on-hand pile. Still not a lock.
- USB or a safe bench rail. Nothing spinning.
- Flash *something*. Blink an LED.
- Bind **TBS Nano RX** (or prove it talks to the FC).
- Record the surviving blink in [`electronics.md`](electronics.md) only after it is real. The line stays **FC: TBD** until then.

### P1 — Wheel spin

**+ 4S + 1 then 2 FOC wheel channels (restrained).**

- 4S LiPo *class* on the bench (pack TBD; do not buy a “better” pack to start).
- One FOC wheel channel first, then the second. Robot **tied down**, not on carpet.
- Encoders on the wheel motors if the driver class needs them — class yes, SKU **TBD**.
- Still no balance loop required. Prop-off equivalent.

### P2 — `TWO_WHEEL` balance

**Both wheels + IMU loop + `PARKED` / `TWO_WHEEL` modes.**

- Both FOC wheels live.
- FC IMU / attitude into a wheel-torque (or wheel-speed) balance loop. Stack **TBD** with the FC.
- Pilot selects **`PARKED`** (safe idle / failsafe) and **`TWO_WHEEL`** from TBS (likely aux / flight-modes style). Channel map **TBD**.
- Telem may be a USB / serial laptop at this phase. Wi‑Fi can wait.
- Do not start `LEFT_ONLY` / `RIGHT_ONLY` on the bench until `TWO_WHEEL` holds.

Mode spec: [`software.md`](software.md).

### P3 — Pose joints

**Knee + hip swing. Still teleop.** Class **TBD**.

- **If steppers:** stepper brain is **Pi early or a dedicated MCU** — **TBD** which. Not the FC coil-driving. 4× stepper **drivers** (TMC-class / multi-axis *class*) between the brain and the motors. Knee is not a bare stepper; swing belt (if used) **is** that joint's reduction.
- **If servos:** 4 channels on the **regulated** rail (R11). Bus TBD. Do not run them on raw 4S.
- Pose is teleop / hold. No autonomy. Balance is still two-wheel.
- Size either class for one-leg (~2×) load (R36). **GIM8108-8** is a candidate, not an order.

### P4 — Hip roll

**2× dynamic roll actuators into `LEFT_ONLY` / `RIGHT_ONLY` experiments.**

- 2 hip-roll actuators + drivers. Class: FOC BLDC / small QDD / fast bus servo. **Not a stepper. In V1.** Experimental — may not work as hoped. Still wire the axes.
- Interface **TBD**: PWM / CAN / FOC. Prefer something the FC can command honestly. If not PWM/CAN-friendly, treat like the wheels (external FOC / servo bus). Still not a stepper.
- One-leg modes: **`LEFT_ONLY`**, **`RIGHT_ONLY`**. Gate before any stair cycle. Mode change does not lift or plant.

### P5 — Pi / cameras / Wi‑Fi telem polish

**Pathfinding later.**

- Raspberry Pi for cameras + later pathfinding inference. **Not on the FC.**
- Wi‑Fi telem: Pi first; ESP32 only as a thin bridge if the Pi should stay busy. Telem reports the active mode.
- One teleop stream before stereo / depth. Pathfinding **motion** waits on the four manual modes.
- Not required for first balance. Do not block P0–P4 on a Pi image.

## Minimum parts list (classes, not SKUs)

No shopping links. No invented SKU. **On-hand?** is “known in the pile today,” not a promise the part is on the bench. Unknown stays **TBD**. Named inventory: [`parts-on-hand.md`](parts-on-hand.md).

| Function | Class | Qty | Notes | Phase | On-hand? |
| --- | --- | --- | --- | --- | --- |
| Battery | **4S LiPo** (RC car / boat pack class) | 1 | Nominal ~14.8 V / full ~16.8 V. Capacity, C, connector **TBD**. No pack SKU. | P1 | **TBD** (class lean; pack unknown) |
| Power distribution / BEC | PDB **or** regulated rails, **5 V / 6 V / 7.4 V** step-down (other rails **TBD**) | 1 set | Box only. Feed FC, RX, drivers, brain as each phase needs. Wheel FOC stays on 4S. | P0 (USB / bench OK) → P1 (4S rails) | **TBD** |
| Flight controller | Wing / drone FC **class** | 1 | **FC: TBD.** Prefer Wing *when* we lock. Do not treat a blink as a lock. | P0 | **Yes — candidates:** F765 Wing, F722 Wing, F722 drone FC, Mamba F405 |
| RC receiver | **TBS Nano RX** | 1 | Bind to the FC (or a dedicated link into the FC). | P0 | **Yes** |
| Wheel drivers | **FOC ESC / BLDC driver** class | 2 | One channel in P1, then both. Current / voltage range follows 4S. SKU **TBD**. | P1 | **TBD** |
| Wheel motors | **In-wheel BLDC + encoder** class | 2 | Brushless FOC (not steppers). Exact models **TBD**. 5" rubber already ordered — that is a **wheel**, not a motor. | P1 | **TBD** (motors unknown). Rubber: [`parts-on-hand.md`](parts-on-hand.md) |
| Pose brain | **Pi** *or* dedicated MCU *or* servo bus | 1 | **TBD** with the class. FC does **not** bit-bang stepper coils. | P3 | Pi: **yes** (companion pile). Dedicated MCU: **TBD** |
| Pose drivers | TMC-class / multi-axis **or** servo channels | 4 ch | Between brain and pose joints. No driver SKU. | P3 | **TBD** |
| Knee + hip-swing motors | **Servo *or* stepper + reduction** | 4 | Class **TBD**. Size for ~2× plant. **GIM8108-8** candidate (not ordered). | P3 | **TBD** |
| Hip-roll actuators | **Dynamic** FOC BLDC / small QDD / fast bus servo | 2 | **In V1.** Not a stepper. Experimental. SKU **TBD**. | P4 | **TBD** |
| Hip-roll drivers | PWM / CAN / FOC **as TBD** | 2 | Honest link into the FC if possible; else external FOC / servo bus like the wheels. | P4 | **TBD** |
| Wiring / interconnect | Servo / step-dir / power / XT-class leads | 1 set | Classes only. Connector and gauge **TBD**. No finished harness drawing. | P0–P4 as needed | **TBD** (shop wire unknown) |
| Companion compute | **Raspberry Pi** | 0–1 | Cameras + pathfinding later. Optional until P5. May be the P3 pose brain. | P5 (optional P3) | **Yes** |
| Telem bridge (optional) | **ESP32** | 0–1 | Thin Wi‑Fi / telem if the Pi should not own that link. | P5 (or earlier if no Pi yet) | **Yes** |
| Cameras | USB / CSI camera **class** | 0–n | Teleop stream first. Not required for first balance. | P5 | **TBD** |

USB cable, a bench LED if the FC has no pad, and a **restraint** (tied-down stand — not carpet) are assumed bench tools, not a Hux BOM.

## Manual modes vs phases

Full state machine: [`software.md`](software.md). Electronics only **enables** the modes. A mode change does not lift, plant, or path-follow.

| Mode | Enum (intent) | What the electronics must already do | Phase |
| --- | --- | --- | --- |
| **Parked** | `PARKED` | FC up, RX live, wheels not driven by the balance loop (held or disabled). Default + failsafe. | P2 (blink / bind from P0) |
| **2-wheel balance** | `TWO_WHEEL` | Both FOC wheels + IMU loop. Bipedal teleop. | P2 |
| **Left wheel only** | `LEFT_ONLY` | Left planted / driven; right free. Hip roll in the experiment. | P4 |
| **Right wheel only** | `RIGHT_ONLY` | Mirror. | P4 |

Pilot selects via **TBS Nano** (likely aux / flight-modes). Wi‑Fi telem reports the active mode when telem exists. Open-loop step, pathfinding motion, and stair scripts **wait**.

## Explicit non-goals for minimum

- **No autonomy compute required for P0–P4.** Pi + cameras + pathfinding are P5 (or later). First balance is FC + wheels + IMU.
- **No invented custom PCBs** unless COTS driver / PDB / BEC *classes* fail on the bench. Do not draw a Hux board to look finished.
- **No new spend until Steve asks.** Prefer on-hand. Do not buy a “better” FC, ESC, Pi, LiPo, stepper, servo, FOC board, or encoder for this note.
- **No locked SKUs.** Class + qty + phase only. Mark **TBD** instead of guessing a cart.
- **Do not lock the FC.** Candidates stay a pile. Blink does not rename the repo around one board.
- **Do not lock servo vs stepper+belt.** Document both paths.
- **Do not drive stepper coils from the FC.** Do not host four steppers in drone firmware because a Wing board has spare pins.
- **Do not write a finished harness, PDB layout, or BEC shopping list.** Rails are a box in the diagram.
- **Do not feed motor current through the FC or a logic PCB** (Tazer anti-pattern). Dedicated power distribution *class* only.
- **Do not treat this table as a BOM.** It is a phased class list.

## What to record when something is real

When a part is actually on the bench, write it in [`electronics.md`](electronics.md), [`parts-on-hand.md`](parts-on-hand.md), and [`../NOTES.md`](../NOTES.md):

- Which bench FC blinked (still not a lock until Steve says so)
- 4S pack: cell count, resting voltage, connector, what it feeds
- Which FOC channel spun, restrained
- Which pose class (servo vs stepper) and which brain actually issued commands
- Hip-roll interface that talked (PWM / CAN / FOC)

Until then, every blank stays **TBD**.
