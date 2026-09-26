# Minimum electronics (V1)

**Status:** planning note, revised 2026-09-26 for **8S + CAN + a CAN-capable real-time MCU** ([`decisions.md`](decisions.md)). **Docs only.** **No new spend** beyond [`bom.md`](bom.md). No locked SKUs. The F765-Wing is a **P0–P1 bench board** (no CAN), not the robot's MCU.

This is the **smallest electronics set** that can meet Hux V1 goals: four **manual** modes first, then pose joints, then hip-roll experiments. Classes and on-hand parts only. Every pack, driver, and motor model stays **TBD** until Steve asks to buy or a real part is on the bench.

Parent: [`electronics.md`](electronics.md). Modes: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Tick real work in [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) and [`../NOTES.md`](../NOTES.md). Decisions: [`decisions.md`](decisions.md).

**Parts on hand** (owned / ordered — not a buy list): [`parts-on-hand.md`](parts-on-hand.md). Reserved-for-Hux is **TBD** unless a row there says otherwise. This page is classes and phases; that page is the inventory.

## Goals this set must enable (V1)

| Goal | Minimum electronics implication |
| --- | --- |
| Manual modes **before** autonomy: `PARKED`, `TWO_WHEEL`, `LEFT_ONLY`, `RIGHT_ONLY` | RT MCU + IMU + RC in + wheel torque over CAN. Hip roll later for one-wheel modes. Spec: [`software.md`](software.md). |
| 2× **in-wheel** brushless **FOC** | 2 FOC ESC / driver channels + 2 BLDC + encoders. Not steppers. |
| 2× knee + 2× hip-swing **pose** joints | **CAN QDD working class** — 4 more CAN nodes. Fallback: servo channels on a regulated rail, or steppers behind a CAN / step-dir driver board. **GIM8108-8** is a candidate (not ordered). |
| 2× hip-roll **dynamic** (FOC / QDD / fast servo) **in V1** | 2 actuators + their drivers (PWM / CAN / FOC — **TBD**). Not steppers. Not deferred to V2. |
| **TBS Nano RX** | CRSF into a UART on the RT MCU. On hand. |
| Wi‑Fi telem | MCU ↔ Pi over a framed serial / USB link. Pi is listen-only until `TWO_WHEEL` holds. |
| **8S** + **step-down** | 33.6 V full / 29.6 V nominal / 26.4 V cutoff. One 8S 3300 mAh 50–60C LiPo, XT90, XT90-S on the harness. Actuators on the pack; 5 V rail for MCU / RX / Pi; 12–19 V rail for a P5 companion slot; regulators rated ≥36 V in. |
| **RT MCU with CAN** | Teensy 4.1-class or H743-WING-class, picked with the actuators. F765-Wing is bench only. |
| Pi + cameras **later** | Not required for first balance (P0–P4). |
| Stepper coils **not** on the MCU | Only if the **fallback** stepper class is used for knee / swing: a driver board on CAN / step-dir between the MCU and the motors. |

## Minimum system block diagram (text)

Not a harness. Not a PCB. Rails and links are **classes**.

```
8S 3300 mAh LiPo (XT90 → XT90-S)
        │
        ▼
power distribution / BEC rails
        │
        ├──► CAN actuators (8S direct, high draw)
        ├──► hip-roll dynamic (PWM / CAN / FOC — TBD)
        ├──► step-down ──► 5V / 6V / 7.4V pose + logic
        │
        ├──► RT MCU (CAN) ── IMU, RC in, control core, modes, watchdog
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
        └──► telem: MCU ↔ Pi (framed serial / USB)
                    (Pi / cameras can wait until after TWO_WHEEL)
```

Rules for this box:

- The **MCU does not drive stepper coils** if the fallback class is chosen. A driver board on CAN / step-dir is the interface.
- Hip roll stays on the **balance** side of the split (with the wheels), even if the first loop is ugly. Do not park roll on leftover stepper channels.
- **RT MCU must have CAN.** F765 Wing / F722 Wing / F722 drone / Mamba F405 are bench boards; none has CAN.
- This is eight axes: 2 FOC wheels + 4 pose + 2 dynamic roll. Not eight identical motors.

## Phased minimum (buy / assemble order — classes only)

**No new spend until Steve asks.** Prefer the on-hand pile. A later phase is not a shopping list for today. Tick the matching rows in [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) only when the work is real.

### P0 — Bench

**Bench board (F765-Wing is fine) + USB/power + TBS Nano bind + LED blink.**

- Pick a *bench* board from the on-hand pile. Still not a lock.
- USB or a safe bench rail. Nothing spinning.
- Flash *something*. Blink an LED.
- Bind **TBS Nano RX** and print CRSF channels.
- Also in P0: the **layer-2 skeleton** builds and passes its tests on the host ([`software.md`](software.md)). No board needed for that.

### P1 — Wheel spin

**+ 8S + 1 then 2 wheel actuators (restrained).**

- 8S pack on the bench. Check every actuator's max against 33.6 V and its min against 26.4 V.
- One FOC wheel channel first, then the second. Robot **tied down**, not on carpet.
- Encoders on the wheel motors if the driver class needs them — class yes, SKU **TBD**.
- Still no balance loop required. Prop-off equivalent.

### P2 — `TWO_WHEEL` balance

**Both wheels + IMU loop + `PARKED` / `TWO_WHEEL` modes.**

- Both FOC wheels live.
- **CAN MCU first image**: IMU at 1 kHz, both wheels on CAN, blackbox to SD, live params, hardware torque cut proven. Then the reused PID cascade (R18) in the control core.
- Pilot selects **`PARKED`** (safe idle / failsafe) and **`TWO_WHEEL`** from TBS (likely aux / flight-modes style). Channel map **TBD**.
- Telem may be a USB / serial laptop at this phase. Wi‑Fi can wait.
- Do not start `LEFT_ONLY` / `RIGHT_ONLY` on the bench until `TWO_WHEEL` holds.

Mode spec: [`software.md`](software.md).

### P3 — Pose joints

**Knee + hip swing. Still teleop.** Class **TBD**.

- **Working class:** 4× CAN QDD on the same bus layout as the wheels. Position / torque mode from the MCU.
- **Fallback stepper:** a CAN / step-dir driver board between the MCU and the motors; the MCU never drives coils. Knee is not a bare stepper; swing belt (if used) **is** that joint's reduction.
- **Fallback servo:** 4 channels on a **regulated** pose rail (R11). Not raw pack.
- Pose is teleop / hold. No autonomy. Balance is still two-wheel.
- Size either class for one-leg (~2×) load (R36). **GIM8108-8** is a candidate, not an order.

### P4 — Hip roll

**2× dynamic roll actuators into `LEFT_ONLY` / `RIGHT_ONLY` experiments.**

- 2 hip-roll actuators + drivers. Class: FOC BLDC / small QDD / fast bus servo. **Not a stepper. In V1.** Experimental — may not work as hoped. Still wire the axes.
- Interface: **CAN**, same as the wheels. Not a stepper.
- One-leg modes: **`LEFT_ONLY`**, **`RIGHT_ONLY`**. Gate before any stair cycle. Mode change does not lift or plant.

### P5 — Pi / cameras / Wi‑Fi telem polish

**Pathfinding later.**

- Pi 5 (in containers) for cameras + later perception. **Not on the MCU.** Jetson decision lives here, not earlier.
- Wi‑Fi telem: Pi first; ESP32 only as a thin bridge if the Pi should stay busy. Telem reports the active mode.
- One teleop stream before stereo / depth. Pathfinding **motion** waits on the four manual modes.
- Not required for first balance. Do not block P0–P4 on a Pi image.

## Minimum parts list (classes, not SKUs)

No shopping links. No invented SKU. **On-hand?** is “known in the pile today,” not a promise the part is on the bench. Unknown stays **TBD**. Named inventory: [`parts-on-hand.md`](parts-on-hand.md).

| Function | Class | Qty | Notes | Phase | On-hand? |
| --- | --- | --- | --- | --- | --- |
| Battery | **8S 3300 mAh 50–60C LiPo, XT90** | 1 | 33.6 / 29.6 / 26.4 V. XT90-S on the harness. Fused. Brand TBD. | P1 | **Authorized 2026-09-26, not ordered** |
| Power distribution + torque cut | PDB / harness with a hardware kill; **5 V** buck (MCU, RX), **5 V / 5 A** buck (Pi), **12–19 V** buck (P5 companion slot) | 1 set | Box only. Actuators stay on the pack. | P0 (USB / bench OK) → P1 (pack rails) | **TBD** |
| Bench board | F765-Wing (or any on-hand FC) | 1 | **P0–P1 only.** Blink, CRSF, one SimpleFOC wheel over UART. No CAN. | P0–P1 | **Yes** — F765 Wing, F722 Wing, F722 drone FC, Mamba F405 |
| Real-time MCU | **CAN-capable** — Teensy 4.1-class (3× CAN FD) or H743-WING-class (1× CAN) | 1 | Runs the control core at 1 kHz. Picked with the actuators. ~$30–70. | P2 | **No** — not bought |
| RC receiver | **TBS Nano RX** | 1 | CRSF into a UART on the bench board, then the MCU. | P0 | **Yes** |
| Wheel actuators' drivers | On the actuator (CAN QDD / FOC) or a CAN-capable SimpleFOC board | 2 | One in P1, then both. 8S range (RS05 shortlisted). SKU **TBD**. | P1 | **TBD** |
| Wheel motors | **In-wheel BLDC + encoder** class | 2 | Brushless FOC (not steppers). Exact models **TBD**. About **3 N·m peak** at the settled 6" wheel — not a SKU. 5" Zantle is a bench donor, not the foot. | P1 | **TBD** (motors unknown). [`research/leg-geometry.md`](research/leg-geometry.md). |
| Pose brain | The same RT MCU, over CAN | — | No separate pose brain in the working plan. Fallback classes add a driver board, never MCU coil-driving. | P3 | — |
| Pose drivers | TMC-class / multi-axis **or** servo channels | 4 ch | Between brain and pose joints. No driver SKU. | P3 | **TBD** |
| Knee + hip-swing motors | **Servo *or* stepper + reduction** | 4 | Class **TBD**. Size for ~2× plant. **GIM8108-8** candidate (not ordered). | P3 | **TBD** |
| Hip-roll actuators | **Dynamic** FOC BLDC / small QDD / fast bus servo | 2 | **In V1.** Not a stepper. Experimental. SKU **TBD**. | P4 | **TBD** |
| Hip-roll drivers | On the actuator, CAN | 2 | Same bus as the wheels. | P4 | **TBD** |
| Wiring / interconnect | Servo / step-dir / power / XT-class leads | 1 set | Classes only. Connector and gauge **TBD**. No finished harness drawing. | P0–P4 as needed | **TBD** (shop wire unknown) |
| Companion compute | **Raspberry Pi** | 0–1 | Cameras + pathfinding later. Optional until P5. May be the P3 pose brain. | P5 (optional P3) | **Yes** |
| Telem bridge (optional) | **ESP32** | 0–1 | Thin Wi‑Fi / telem if the Pi should not own that link. | P5 (or earlier if no Pi yet) | **Yes** |
| Cameras | USB / CSI camera **class** | 0–n | Teleop stream first. Not required for first balance. | P5 | **TBD** |

USB cable, a bench LED if the board has no pad, and a **restraint** (tied-down stand — not carpet) are assumed bench tools, not a Hux BOM.

## Manual modes vs phases

Full state machine: [`software.md`](software.md). Electronics only **enables** the modes. A mode change does not lift, plant, or path-follow.

| Mode | Enum (intent) | What the electronics must already do | Phase |
| --- | --- | --- | --- |
| **Parked** | `PARKED` | MCU up, RX live, wheels not driven by the balance loop (held or disabled). Default + failsafe. | P2 (blink / bind from P0) |
| **2-wheel balance** | `TWO_WHEEL` | Both FOC wheels + IMU loop. Bipedal teleop. | P2 |
| **Left wheel only** | `LEFT_ONLY` | Left planted / driven; right free. Hip roll in the experiment. | P4 |
| **Right wheel only** | `RIGHT_ONLY` | Mirror. | P4 |

Pilot selects via **TBS Nano** (likely aux / flight-modes). Wi‑Fi telem reports the active mode when telem exists. Open-loop step, pathfinding motion, and stair scripts **wait**.

## Explicit non-goals for minimum

- **No autonomy compute required for P0–P4.** Pi + cameras + pathfinding are P5 (or later). First balance is MCU + wheels + IMU.
- **No invented custom PCBs** unless COTS driver / PDB / BEC *classes* fail on the bench. Do not draw a Hux board to look finished.
- **No new spend until Steve asks.** Prefer on-hand. Do not buy actuators, the CAN MCU, a pack, a Pi, a Jetson, or an encoder for this note; Steve authorizes cart lines in [`bom.md`](bom.md).
- **No locked SKUs.** Class + qty + phase only. Mark **TBD** instead of guessing a cart.
- **Do not build robot firmware on the F765-Wing.** Blink does not promote a bench board.
- **Do not lock servo vs stepper+belt.** Document both paths.
- **Do not drive stepper coils from the MCU.** Do not bridge UART→CAN on a torque axis to keep an old board.
- **Do not write a finished harness, PDB layout, or BEC shopping list.** Rails are a box in the diagram.
- **Do not feed motor current through the MCU or a logic PCB** (Tazer anti-pattern). Dedicated power distribution *class* only.
- **Do not treat this table as a BOM.** It is a phased class list.

## What to record when something is real

When a part is actually on the bench, write it in [`electronics.md`](electronics.md), [`parts-on-hand.md`](parts-on-hand.md), and [`../NOTES.md`](../NOTES.md):

- Which bench board blinked, and which CAN MCU ran `TWO_WHEEL`
- 8S pack: brand, measured resting voltage, connector, what it feeds
- Which FOC channel spun, restrained
- Which pose class (servo vs stepper) and which brain actually issued commands
- Hip-roll interface that talked (PWM / CAN / FOC)

Until then, every blank stays **TBD**.
