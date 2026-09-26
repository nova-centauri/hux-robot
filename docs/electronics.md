# Electronics

**Status:** architecture decided 2026-09-26 ([`decisions.md`](decisions.md)). No wiring diagram, no actuator SKU, no new spend beyond [`bom.md`](bom.md).

**6S + regulated step-down** is the power class (superseded 4S on 2026-09-26). **Actuator bus is CAN.** **Hip roll is in V1.** **The real-time MCU must have CAN — the F765-Wing does not, so it is a bench board.**

Parent plan (classes, P0–P5, not a BOM): [`electronics-minimum.md`](electronics-minimum.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md). Software layers: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Review behind this page: [`research/compute-stack-review.md`](research/compute-stack-review.md).

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| Powertrain | **Electric-only** | No ICE, no hybrid. Whole robot. |
| Battery class | **6S** — LiPo preferred; high-drain Li-ion 21700 acceptable | **~22.2 V nominal / 25.2 V full**, cutoff ~19.8 V. One large pack **or two in parallel** (matched voltage before paralleling, a fuse per pack). Capacity / C / connector **TBD**. No pack SKU. |
| Rails | **Regulated step-down** from 6S | **5 V** (MCU, RX, Pi 5 at 5 A), **12–19 V** (companion slot — a Jetson kit takes 9–19 V; 6S full is 25.2 V, so it is *not* direct), pose rail only if the fallback servo class is used. SKUs **TBD**. |
| Actuator bus | **CAN** | One or two buses. Classic vs FD, and the protocol (MIT mini-cheetah style, Robstride, CubeMars, ODrive…) follow the actuator choice. |
| Wheels | **In-wheel brushless FOC** + encoder, on CAN | Motor at the rim (R6 / R30). ~3 N·m peak at the 6" wheel. Exact models TBD. |
| Knee / hip swing | **CAN QDD / FOC working class**; servo or stepper+belt is the **fallback** | Size for one-leg (~2×) load (R36). ~10 N·m holding at the knee standing up over the front wheel ([`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md)). **GIM8108-8** stays a candidate; on 6S it is honest, on 4S it was not. |
| Hip roll | **In V1.** CAN QDD / FOC | Not a stepper. Experimental — may not work. Still wire the axis and the modes. SKU TBD. |
| Real-time MCU | **CAN-capable** — Teensy 4.1-class or H743-WING-class | Runs the control core at 1 kHz, IMU, CRSF, watchdog, torque cut, blackbox. **Picked with the actuators.** Not bought. |
| Bench board | **F765-Wing** (on hand) | P0–P1 only: blink, CRSF, one SimpleFOC wheel over UART. No CAN. Nothing written for it is expected to survive. |
| RC RX | **TBS Nano RX** | CRSF into a full UART on the MCU. |
| Companion | **Pi 5** now, in containers | Cameras, telemetry, ROS 2. **Jetson (Orin Nano Super kit class) at P5** for perception. Head has a slot sized for it with a 12–19 V feed. |
| Wi‑Fi telem | **Pi first** | ESP32 only as an optional thin telemetry bridge. |

## Real-time MCU — CAN decides it

The 2026-09-25 bench plan put the F765-Wing at the centre. The F765-Wing has **7 UARTs, 12 PWM, a microSD slot and no CAN**. Every torque-mode actuator on the candidate list speaks CAN. A UART→CAN bridge on the highest-bandwidth axis in the machine is a hack, and per-axis UARTs to four torque actuators is a wiring mess with jitter. So:

- **F765-Wing = P0–P1 bench board.** Blink, bind the Nano, learn CRSF, spin one SimpleFOC wheel over UART or PWM. Then it goes back in the pile.
- **P2+ MCU must have CAN.** Two honest classes: **Teensy 4.1** (600 MHz, **3× CAN FD**, mature FlexCAN library, needs an external IMU breakout and a 5 V BEC) or **Matek H743-WING-class** (480 MHz, dual IMU, **1× CAN**, SD, BECs, CRSF-ready, same lineage Steve already knows). One CAN bus is enough for eight actuators at 1 kHz on classic CAN only if the protocol is lean; two buses or CAN FD are the safe answer. **Pick the MCU with the actuators, not before.**
- The MCU does **not** drive stepper coils, ever. If the fallback stepper class is used for knee / swing, its drivers hang off CAN or step/dir from a driver board, not from the MCU's GPIO.

Record the board that actually runs `TWO_WHEEL` here, in [`parts-on-hand.md`](parts-on-hand.md), and in [`../NOTES.md`](../NOTES.md).

## Battery — 6S; step down for logic and companion (R11, revised 2026-09-26)

Steve 2026-09-26: **4S → 6S**. Large pack or two in parallel. LiPo or similar.

Why: CAN QDD / FOC actuators are specified at 24–48 V. At 14.8 V they give up a large share of speed and torque headroom; at 22.2 V nominal they are in their working band. 6S also halves the current for the same wheel power, which is kinder to the bus and the FOC stalls (Tazer anti-pattern).

| Item | Intent | Status |
| --- | --- | --- |
| Chemistry / cell count | **6S**. LiPo preferred (C-rating for balance spikes). High-drain Li-ion 21700 (Molicel P45B-class) acceptable for energy density if the pack's continuous / peak current is proven. | Class lean. Not a locked SKU. |
| Nominal / full / cutoff | **~22.2 V / 25.2 V / ~19.8 V** | Use when thinking about actuator, regulator and companion ranges. Check every actuator's **max** against 25.2 V, not 22.2. |
| One pack vs two | Either. Two in parallel: same cell count and chemistry, matched to within ~0.1 V before connecting, a **fuse per pack**, a parallel harness, one BMS / balance plan. | Steve's call per build. |
| Capacity (mAh) / C-rating | TBD | No spend. Do not guess a pack into a BOM. |
| Motor bus | **6S direct** via a real distribution board / harness | High-draw FOC. Not through the MCU or any logic PCB. |
| 5 V rail | MCU, RX, **Pi 5 (5 V / 5 A, USB-PD-class connector)** | A 25 W buck, not a servo BEC. |
| 12–19 V rail | Companion slot (Jetson kit 9–19 V), any 12 V accessories | Only populated when a Jetson is fitted. |
| Pose rail | Only if the fallback servo class is chosen | 6 / 7.4 V class. Not raw pack. |
| Regulators / PDB | **Class only** | Box on the sketch. **No SKU.** |

**Power bus (Tazer anti-pattern):** FOC stalls are high-current. Plan **dedicated power distribution** (PDB / harness *class*) with a **hardware torque cut** on it — a contactor / MOSFET kill independent of the MCU. Not skinny traces, not the MCU or a logic PCB as the motor plane. See [`research/tazer-lessons.md`](research/tazer-lessons.md).

Power rail sketch (not a harness):

```
6S pack (or 2× in parallel, fused)
        │
        ▼
   distribution + hardware torque cut
        ├── CAN actuators: 2× wheel, 2× hip roll, 4× knee / swing   (6S direct)
        ├── 5 V buck  ──► RT MCU + IMU, TBS Nano RX
        ├── 5 V / 5 A buck ──► Pi 5 (USB-PD-class)
        └── 12–19 V buck ──► companion slot (Jetson, P5) — unpopulated in V1
```

When a real pack is on the bench, record cell count, chemistry, measured resting voltage, connector, and who it feeds.

## Wheel drive class (R25) — no SKU

The wheel motor is a **balance actuator**. Hux has to catch a tip on one skinny rim. That is a torque-bandwidth / reaction-speed problem, not a continuous-watts problem. On the settled **6" / ~6 kg** example, a 30° one-leg catch is about **2.2 N·m** — target about **3 N·m peak**. On the step the shelf caps the catch at about ±6°. Math: [`research/leg-geometry.md`](research/leg-geometry.md).

| Criterion | Intent | Status |
| --- | --- | --- |
| What we optimize | **Reaction speed / torque bandwidth** for inverted-pendulum balance | Not max continuous power |
| Wheel | **6" OD × ~1–1.25"** real rubber, torsionally stiff. Size locked, not a buy. | 5" Zantle is a **bench donor**, not the foot. |
| Placement | **In-wheel** (hub / coaxial) | R30 |
| Bus | **6S**, **CAN** | The wheel actuator's own FOC + encoder; torque mode; encoder counts back on the bus for the estimator. |
| Mass | Two wheel motors must **leave room** for pose joints, structure, pack, MCU, companion | Mass budget **soft** (R24). |
| Control | **Reuse** an existing FOC / torque-mode stack (R18) | SimpleFOC on the bench; a CAN actuator's own firmware on the robot. Do not invent Hux drive electronics. |

### Candidate classes (not buys)

| Class | Why it is on the list | Still TBD / not a lock |
| --- | --- | --- |
| **Small CAN QDD / FOC actuator at the hub** (GIM-class outrunner + driver, ODrive-S1-class driver + gimbal motor, integrated hub actuators) | 3 N·m peak, torque mode, encoder, CAN — the honest answer on 6S. | Stator, ratio (if any), kV, encoder, packaging inside a 6" rim. Kelton Serra's in-wheel packaging is the picture. |
| **Lightweight:** gimbal BLDC ~2208–4108 + SimpleFOC board + magnetic encoder | Bench spin and the first `TWO_WHEEL` if actuators are late. | Bare ~0.5 N·m arrests about 6°; honest only with reduction. Needs a CAN-capable SimpleFOC board to stay on the bus. |
| **Avoid as a default:** large ODrive **63xx** / hoverboard hubs | SonicRobot-class hardware. Study for IMU → PID → torque. Heavy for a maker Hux. | Do not treat upstream parts lists as a Hux BOM. |

## Leg drive classes

**Working class for every joint is a CAN QDD / FOC actuator** (2026-09-26). Servo or stepper+belt remains the documented **fallback** for knee / hip swing only. Size every plant-side joint for one-leg standing load (~2×; R36). Hip roll is dynamic **in V1**.

| Joint | Working class | Fallback | Electronics implication |
| --- | --- | --- | --- |
| **Wheels** | In-wheel FOC on CAN | — | 2 CAN nodes. Not steppers. |
| **Knee / hip swing** | CAN QDD (GIM8108-class ~8:1) | Servo on a regulated rail, or stepper + belt behind a CAN / step-dir driver board | 4 CAN nodes. ~10 N·m knee holding. Springs still recommended for the two-leg crouch (R7). |
| **Hip roll** | CAN QDD / FOC, backdrivable | none — **not a stepper** | 2 CAN nodes. Torque-mode / high-rate current loop. |

Do not put a stepper on hip roll to “match” the knees. Missed steps, resonance, and belt stretch / backlash hurt the CoG loop that pairs with wheel fore-aft. If the fallback stepper class is ever used on knee / swing: closed-loop drivers, short low-backlash belts, mounted high (R32), and a written acceptance of lower bandwidth.

### Hold current, heat

A stepper sits at holding current to keep a pose; four of them is continuous draw and heat even standing still. QDD / torque-mode can hold with less waste if springs take gravity (R7). One more reason the fallback is the fallback.

## Actuator I/O architecture (R29, revised)

| Count | Axis | Drive class |
| --- | --- | --- |
| 2 | Wheels (L / R) | CAN FOC, torque mode |
| 4 | L/R **knee** + L/R **hip swing** | CAN QDD, position / torque (fallback: servo or stepper behind a driver) |
| 2 | Hip **roll** (L / R) | CAN QDD / FOC, torque mode. **In V1.** |
| **8** | **V1 total** | **Eight CAN nodes** in the working plan. Not eight identical motors. |

Eight nodes at 1 kHz: classic CAN at 1 Mbit/s is ~50–60% loaded with a lean protocol and has no headroom for encoder telemetry; **two buses or CAN FD** is the safe layout. This is the concrete reason the MCU follows the actuators.

**Anti-pattern:** a Wing FC can spare pins; drone firmware is a poor host for anything on this page. Spare UARTs are for the RX and the companion link, not for becoming an actuator bus.

## Four-layer sketch (intent)

```
TBS Nano RX ──CRSF──► RT MCU (CAN, 1 kHz)  ──CAN A──► 2× wheel + 2× hip roll
                       │  IMU · control core       └CAN B──► 4× knee / hip swing
                       │  watchdog · torque cut · SD blackbox
                       └──framed serial/USB──► companion (Pi 5 → Jetson at P5)
                                                 ROS 2 · params · MCAP · cameras · Wi‑Fi telem
6S pack ──► distribution + hardware kill ──► actuators (direct)
                                          └──► 5 V (MCU, RX, Pi) · 12–19 V (companion slot)
```

Box diagram, not a harness. No SKU. Layers: [`software.md`](software.md).

## Bring-up order (no carpet)

See [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) and the P0–P5 plan in [`electronics-minimum.md`](electronics-minimum.md).

1. F765 bench: blink, bind TBS Nano, print CRSF (**P0**).
2. One restrained wheel: SimpleFOC over UART on the F765, or the first CAN actuator when it arrives (**P1**).
3. CAN MCU first image: IMU, both wheels on CAN, blackbox, live params, torque cut proven. `PARKED` / `TWO_WHEEL` (**P2**).
4. Pose joints on CAN (**P3**).
5. Hip roll + `LEFT_ONLY` / `RIGHT_ONLY` (**P4**).
6. Companion cameras / Wi‑Fi telem / perception; Jetson decision (**P5**).

## Do not

- Do not buy actuators, the CAN MCU, a pack, a regulator, a Jetson or an encoder for this page. Steve authorizes cart lines in [`bom.md`](bom.md).
- Do not build robot firmware on the F765-Wing. Bench only.
- Do not invent a finished PDB / regulator SKU or a pack size.
- Do not feed motor current through the MCU or a logic PCB (Tazer).
- Do not run anything on raw pack voltage except the actuators and the distribution board.
- Do not check an actuator against 22.2 V and forget 25.2 V full.
- Do not put steppers on the wheels or on hip roll. Do not treat the fallback as the plan.
- Do not omit the hip-roll nodes from V1 “until V2.”
- Do not bridge UART→CAN on a torque axis to keep an old board.
