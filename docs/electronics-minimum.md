# Minimum electronics (V1)

**Status:** planning note, revised 2026-09-26 for **8S + CAN + a CAN real-time MCU**, and 2026-09-27 for the picks: RT MCU **Teensy 4.1** (2026-09-26), actuators = RobStride set under a **temporary lock** (not ordered) ([`decisions.md`](decisions.md)). **Docs only.** **No new spend** beyond [`bom.md`](bom.md). The F765-Wing is a **P0–P1 bench board** (no CAN), not the robot's MCU.

This is the **smallest electronics set** that can meet Hux V1 goals: four **manual** modes first, then pose joints, then hip-roll experiments. The pack (8S 3300), the RT MCU (Teensy 4.1) and the actuator set (temporary lock) are named in [`decisions.md`](decisions.md). Everything else stays a class and **TBD** until Steve asks to buy or a real part is on the bench.

Parent: [`electronics.md`](electronics.md). Modes: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Tick real work in [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) and [`../NOTES.md`](../NOTES.md). Decisions: [`decisions.md`](decisions.md).

**Parts on hand** (owned / ordered — not a buy list): [`parts-on-hand.md`](parts-on-hand.md). Reserved-for-Hux is **TBD** unless a row there says otherwise. This page is classes and phases; that page is the inventory.

## Goals this set must enable (V1)

| Goal | Minimum electronics implication |
| --- | --- |
| Manual modes **before** autonomy: `PARKED`, `TWO_WHEEL`, `LEFT_ONLY`, `RIGHT_ONLY` | RT MCU + IMU + RC in + wheel torque over CAN. Hip roll later for one-wheel modes. Spec: [`software.md`](software.md). |
| 2× **in-wheel** brushless **FOC** | 2× **RS05** (driver + encoders on the actuator) on CAN bus A. Not steppers. |
| 2× knee + 2× hip-swing **pose** joints | **CAN QDD working class**: 2× **RS02** knee + 2× **RS00** swing on CAN bus B (temporary lock, not ordered). Fallback only: servo channels on a regulated rail, or steppers behind a CAN / step-dir driver board. |
| 2× hip-roll **dynamic** **in V1** | 2× **RS02** on CAN bus A (driver on the actuator). Not steppers. Not deferred to V2. |
| **TBS Nano RX** | CRSF into a UART on the RT MCU. On hand. |
| Wi‑Fi telem | MCU ↔ Pi over a framed serial / USB link. Pi is listen-only until `TWO_WHEEL` holds. |
| **8S** + **step-down** | 33.6 V full / 29.6 V nominal / 26.4 V cutoff. One 8S 3300 mAh 50–60C LiPo, XT90, XT90-S on the harness. Actuators on the pack; 5 V rail for MCU / RX / Pi; 12–19 V rail for a P5 companion slot; regulators rated ≥36 V in. |
| **RT MCU with CAN** | **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers (picked 2026-09-26). Two classic CAN 1 Mbit buses: A = wheels + hip roll, B = knees + hip swing. H743-WING was the alternative, not chosen. F765-Wing is bench only. |
| Pi + cameras **later** | Not required for first balance (P0–P4). |
| Stepper coils **not** on the MCU | Only if the **fallback** stepper class is used for knee / swing: a driver board on CAN / step-dir between the MCU and the motors. |

## Minimum system block diagram (text)

Not a harness. Not a PCB. Rails and links are **classes**.

```
8S 3300 mAh LiPo (XT90 → XT90-S)
        │
        ▼
power distribution + hardware torque cut
        │
        ├──► CAN actuators, 8S direct (high draw)
        │       bus A: 2× RS05 wheel + 2× RS02 hip roll
        │       bus B: 2× RS02 knee  + 2× RS00 hip swing
        │
        ├──► step-down ──► 5 V logic (MCU, RX) + 5 V / 5 A (Pi 5)
        ├──► step-down ──► 12–19 V companion slot (P5)
        │
        ├──► RT MCU: Teensy 4.1 ── ICM-42688-P, RC in, control core, modes, watchdog
        │         ▲         └── CAN bus A, CAN bus B (classic, 1 Mbit)
        │         └── TBS Nano RX (CRSF)
        │
        └──► telem: MCU ↔ Pi (framed serial / USB)
                    (Pi / cameras can wait until after TWO_WHEEL)

Fallback only (servo or stepper+belt on knee / swing): a regulated pose
rail, or a CAN / step-dir driver board between the MCU and those four joints.
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
- Encoders: on the RS05 (dual). The bench SimpleFOC wheel needs its own encoder — class yes, SKU **TBD**.
- Still no balance loop required. Prop-off equivalent.
- The RS05 wheel and every RobStride joint need CAN, so robot-actuator spins run on the Teensy, not the Wing.
- First actuator buy (not authorized yet): **one RS02 on the Teensy** — hold 7 N·m for 30 s with a thermocouple, encoder readback at 1 kHz, confirm the 24 V floor — before the other seven.

### P2 — `TWO_WHEEL` balance

**Both wheels + IMU loop + `PARKED` / `TWO_WHEEL` modes.**

- Both FOC wheels live.
- **CAN MCU first image**: IMU at 1 kHz, both wheels on CAN, blackbox to SD, live params, hardware torque cut proven. Then the reused PID cascade (R18) in the control core.
- Pilot selects **`PARKED`** (safe idle / failsafe) and **`TWO_WHEEL`** from TBS (likely aux / flight-modes style). Channel map **TBD**.
- Telem may be a USB / serial laptop at this phase. Wi‑Fi can wait.
- Do not start `LEFT_ONLY` / `RIGHT_ONLY` on the bench until `TWO_WHEEL` holds.

Mode spec: [`software.md`](software.md).

### P3 — Pose joints

**Knee + hip swing. Still teleop.** RS02 knee + RS00 swing (temporary lock).

- **Working class:** 4× CAN QDD on bus B. Position / torque mode from the MCU.
- **Fallback stepper:** a CAN / step-dir driver board between the MCU and the motors; the MCU never drives coils. Knee is not a bare stepper; swing belt (if used) **is** that joint's reduction.
- **Fallback servo:** 4 channels on a **regulated** pose rail (R11). Not raw pack.
- Pose is teleop / hold. No autonomy. Balance is still two-wheel.
- Size for one-leg (~2×) load (R36). Knee stand-up hold is **12.4 N·m**, **6.4 N·m** at the motor with the Sheet 2 spring (RS02: 7 rated / 17 peak). GIM8108-8 was the earlier yardstick.

### P4 — Hip roll

**2× dynamic roll actuators into `LEFT_ONLY` / `RIGHT_ONLY` experiments.**

- 2× **RS02** hip roll at 3.0" roll axes: **6.3 N·m** hold with one wheel up vs 7 rated. **Not a stepper. In V1.** Experimental — may not work as hoped. Still wire the axes.
- Interface: **CAN bus A**, same as the wheels.
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
| Real-time MCU | **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers | 1 kit | Runs the control core at 1 kHz. Picked 2026-09-26. ~$54 kit. | P2 | **Authorized 2026-09-26, not ordered** |
| RC receiver | **TBS Nano RX** | 1 | CRSF into a UART on the bench board, then the MCU. | P0 | **Yes** |
| Wheel actuators' drivers | On the RS05 (FOC + CAN) | 2 | One in P1, then both. | P1 | **No** — not ordered |
| Wheel motors | **RobStride 05** (temporary lock) | 2 | 1.7 rated / 5.5 peak N·m, in the hub flush outboard (Sheet 2). 1.5 m/s top = 188 rpm with ~2 N·m catch left (R38). 5" Zantle is a bench donor, not the foot. | P1 | **No** — not ordered, not authorized |
| Pose brain | The same RT MCU, over CAN | — | No separate pose brain in the working plan. Fallback classes add a driver board, never MCU coil-driving. | P3 | — |
| Pose drivers | Fallback only: TMC-class / step-dir board **or** servo channels | 0 (4 ch if fallback) | The RobStride joints carry their own drivers. | P3 | — |
| Knee + hip-swing motors | **RS02** knee ×2, **RS00** swing ×2 (temporary lock) | 4 | Size for ~2× plant. Servo / stepper+belt fallback. | P3 | **No** — not ordered, not authorized |
| Hip-roll actuators | **RS02** (temporary lock) | 2 | **In V1.** Not a stepper. Experimental. | P4 | **No** — not ordered, not authorized |
| Hip-roll drivers | On the RS02, CAN | 2 | Bus A, with the wheels. | P4 | **No** — not ordered |
| Wiring / interconnect | CAN / power / XT-class leads; wires inside the tubes (Sheet 2) | 1 set | Classes only. Connector and gauge **TBD**. No finished harness drawing. | P0–P4 as needed | **TBD** (shop wire unknown) |
| Companion compute | **Raspberry Pi 5** | 0–1 | ROS 2 in containers; telemetry, cameras, pathfinding later. Optional until P5. Not a pose brain. Jetson-class at P5 is a perception buy. | P5 | **Yes** |
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
- **No new spend until Steve asks.** Prefer on-hand. The Teensy kit and the 8S pack are already order-now lines in [`bom.md`](bom.md). Do not buy actuators, a Pi, a Jetson, or an encoder for this note; Steve authorizes cart lines.
- **No SKUs beyond the locks in [`decisions.md`](decisions.md)** (8S 3300 pack, Teensy 4.1, RobStride temporary lock). Everything else is class + qty + phase. Mark **TBD** instead of guessing a cart.
- **Do not build robot firmware on the F765-Wing.** Blink does not promote a bench board.
- **Servo vs stepper+belt is the fallback** for knee / swing only; CAN QDD is the working class. Keep the fallback documented, unlocked.
- **Do not drive stepper coils from the MCU.** Do not bridge UART→CAN on a torque axis to keep an old board.
- **Do not write a finished harness, PDB layout, or BEC shopping list.** Rails are a box in the diagram.
- **Do not feed motor current through the MCU or a logic PCB** (Tazer anti-pattern). Dedicated power distribution *class* only.
- **Do not treat this table as a BOM.** It is a phased class list.

## What to record when something is real

When a part is actually on the bench, write it in [`electronics.md`](electronics.md), [`parts-on-hand.md`](parts-on-hand.md), and [`../NOTES.md`](../NOTES.md):

- Which bench board blinked, and which CAN MCU ran `TWO_WHEEL`
- 8S pack: brand, measured resting voltage, connector, what it feeds
- Which FOC channel spun, restrained
- Which pose actuators (RS02 / RS00, or the fallback) moved on CAN bus B
- Hip-roll RS02s talking on CAN bus A

Until then, every blank stays **TBD**.
