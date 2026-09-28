# Electronics

**Status:** architecture decided 2026-09-26 ([`decisions.md`](decisions.md)). **Teensy 4.1** picked; actuators **temporarily locked** to the RobStride set (not ordered). No wiring diagram, no new spend beyond the [`bom.md`](bom.md) order-now cart.

**8S + regulated step-down** is the power class (2026-09-26: 4S → 6S → 8S, set by the actuators' 24 V floor). **Actuator bus is CAN.** **Hip roll is in V1.** **The real-time MCU must have CAN — the F765-Wing does not, so it is a bench board.**

Parent plan (classes, P0–P5, not a BOM): [`electronics-minimum.md`](electronics-minimum.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md). Software layers: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Review behind this page: [`research/compute-stack-review.md`](research/compute-stack-review.md).

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| Powertrain | **Electric-only** | No ICE, no hybrid. Whole robot. |
| Battery | **One 8S 3300 mAh 50–60C LiPo, XT90** (pack) + **XT90-S anti-spark** (harness) — Steve 2026-09-26 | **33.6 V full / 29.6 V nominal / 26.4 V cutoff** (3.3 V/cell). ~98 Wh, ~620 g (550–700). Every shortlisted actuator (RobStride 24–60 V) runs through the whole discharge. Steve's first pick was 6S 5200; the RobStride 00/01/02 floor is 24 V, so 8S. [`research/actuator-shortlist.md`](research/actuator-shortlist.md) §3–4. |
| Rails | **Regulated step-down** from 8S, every regulator rated **≥36 V in** | **5 V** (MCU, RX, Pi 5 at 5 A), **12–19 V** (companion slot — a Jetson kit takes 9–19 V), pose rail only if the fallback servo class is used. SKUs **TBD**. |
| Actuator bus | **CAN** — two classic 1 Mbit buses | **A:** 2× RS05 wheel + 2× RS02 hip roll. **B:** 2× RS02 knee + 2× RS00 hip swing. RobStride's CAN protocol per the vendor manuals (`cad/vendor/`, local only). 120 Ω at each bus end. |
| Wheels | **In-wheel brushless FOC** + encoder, on CAN | **RS05** (temporary lock): 1.7 rated / 5.5 peak N·m, driver + encoders on board. Motor at the rim (R6 / R30), flush in the hub (Sheet 2). |
| Knee / hip swing | **CAN QDD / FOC working class**; servo or stepper+belt is the **fallback** | **RS02 knee / RS00 swing** (temporary lock). Knee holds 8.2 N·m standing up over the front wheel, 4.7 at the motor with the Sheet 2 spring (RS02 7 rated / 17 peak). GIM8108-8 was the earlier yardstick. |
| Hip roll | **In V1.** CAN QDD / FOC | **RS02** (temporary lock). Not a stepper. One-wheel hold 5.2 N·m at the 3.0" roll axes. Experimental — may not work. Still wire the axis and the modes. |
| Real-time MCU | **Teensy 4.1** + ICM-42688-P breakout + 3× CAN transceivers (Steve 2026-09-26: "add the CAN MCU") | 3× CAN ports (CAN1/CAN2 classic, CAN3 FD-capable), built-in microSD for blackbox, 600 MHz. Eight classic-CAN nodes need ≥2 buses at 1 kHz, which rules out a one-CAN Wing board. In [`bom.md`](bom.md) order-now. |
| Bench board | **F765-Wing** (on hand) | P0–P1 only: blink, CRSF, one SimpleFOC wheel over UART. No CAN. Nothing written for it is expected to survive. |
| RC RX | **TBS Nano RX** | CRSF into a full UART on the MCU. |
| Companion | **Pi 5** now, in containers | Cameras, telemetry, ROS 2. **Jetson (Orin Nano Super kit class) at P5** for perception. Head has a slot sized for it with a 12–19 V feed. |
| Wi‑Fi telem | **Pi first** | ESP32 only as an optional thin telemetry bridge. |

## Real-time MCU — CAN decides it

The 2026-09-25 bench plan put the F765-Wing at the centre. The F765-Wing has **7 UARTs, 12 PWM, a microSD slot and no CAN**. Every torque-mode actuator on the candidate list speaks CAN. A UART→CAN bridge on the highest-bandwidth axis in the machine is a hack, and per-axis UARTs to four torque actuators is a wiring mess with jitter. So:

- **F765-Wing = P0–P1 bench board.** Blink, bind the Nano, learn CRSF, spin one SimpleFOC wheel over UART or PWM. Then it goes back in the pile.
- **P2+ MCU must have CAN.** The two classes weighed were **Teensy 4.1** (600 MHz, **3× CAN** — CAN3 is FD-capable — mature FlexCAN library, needs an external IMU breakout and a 5 V buck) and **Matek H743-WING-class** (480 MHz, dual IMU, **1× CAN**). One classic bus for eight actuators at 1 kHz has no headroom, so **two buses: Teensy 4.1, picked 2026-09-26** with the actuator shortlist.
- The MCU does **not** drive stepper coils, ever. If the fallback stepper class is used for knee / swing, its drivers hang off CAN or step/dir from a driver board, not from the MCU's GPIO.

When the Teensy runs `TWO_WHEEL`, record it here, in [`parts-on-hand.md`](parts-on-hand.md), and tick it in [`../NOTES.md`](../NOTES.md).

## Battery — 8S; step down for logic and companion (R11, revised 2026-09-26)

Steve 2026-09-26: **4S → 6S** ("large pack or two in parallel, LiPo or similar"), then a 6S 5200 pick, then — after the actuator voltage check — **"8S yes."** One pack.

Why: the shortlisted CAN QDD actuators (RobStride 00/01/02) specify **24–60 V**. 4S never reached it; 6S is under it for most of the discharge (19.8 V cutoff); 8S is above it at cutoff (26.4 V) with the 48 V ceiling far away. 8S also halves the current of 4S for the same power, which is kinder to the bus and the FOC stalls (Tazer anti-pattern).

| Item | Intent | Status |
| --- | --- | --- |
| Pack | **One 8S 3300 mAh 50–60C LiPo, XT90.** | **Decided 2026-09-26.** Brand / store is Steve's cart line in [`bom.md`](bom.md). 2700 mAh is the smaller alternative if 3300 will not package. |
| Full / nominal / cutoff | **33.6 V / 29.6 V / 26.4 V** | Check every actuator's **max** against 33.6 V and **min** against 26.4 V. Every regulator ≥36 V in. |
| One pack vs two | **One.** If a second is ever added in parallel: same cell count, chemistry and age, matched to within ~0.1 V before connecting, a fuse per pack. | Decided 2026-09-26. |
| Capacity / C | **3300 mAh / 50–60C → ~98 Wh.** Budget 40–80 W typical → **1–2 h**. | Measure real draw at P2 and log it; re-size then. |
| Connector | **XT90** on the pack. **XT90-S** (anti-spark) on the harness side, or a precharge resistor / soft-start on the distribution board. | A bare XT90 into FOC bulk capacitance arcs at 25 V and pits the contacts. |
| Mass / volume | **~620 g (550–700), envelope 150 × 45 × 56 mm** (the numbers `spec.js` and the sheets draw) | Measure the real pack; brands vary (real 8S 3300 packs run ~139–143 × 43–44 × 42–56 mm). A row of the [mass budget](research/mass-budget.md). **At the top of the head**, long axis lateral, 2.2" forward, 4.3" above the roll axes (2026-09-27); leads run down to the XT90-S in the hip band. |
| Charger | 8S-capable balance charger | Bench tool, not BOM. Many hobby chargers stop at 6S — check before the pack arrives. |
| Motor bus | **8S direct** via a real distribution board / harness | High-draw FOC. Not through the MCU or any logic PCB. |
| 5 V rail | MCU, RX, **Pi 5 (5 V / 5 A, USB-PD-class connector)** | A 25 W buck, not a servo BEC. |
| 12–19 V rail | Companion slot (Jetson kit 9–19 V), any 12 V accessories | Only populated when a Jetson is fitted. |
| Pose rail | Only if the fallback servo class is chosen | 6 / 7.4 V class. Not raw pack. |
| Regulators / PDB | **Class only** | Box on the sketch. **No SKU.** |

**Power bus (Tazer anti-pattern):** FOC stalls are high-current. Plan **dedicated power distribution** (PDB / harness *class*) with a **hardware torque cut** on it — a contactor / MOSFET kill independent of the MCU. Not skinny traces, not the MCU or a logic PCB as the motor plane. See [`research/tazer-lessons.md`](research/tazer-lessons.md).

Power rail sketch (not a harness):

```
8S 3300 mAh LiPo — XT90 ─► XT90-S (anti-spark) ─► fuse
        │
        ▼
   distribution + hardware torque cut
        ├── CAN actuators: 2× wheel, 2× hip roll, 4× knee / swing   (8S direct)
        ├── 5 V buck  ──► RT MCU + IMU, TBS Nano RX
        ├── 5 V / 5 A buck ──► Pi 5 (USB-PD-class)
        └── 12–19 V buck ──► companion slot (Jetson, P5) — unpopulated in V1
```

When a real pack is on the bench, record cell count, chemistry, measured resting voltage, connector, and who it feeds.

## Wheel drive class (R25) — RS05, temporary lock

The wheel motor is a **balance actuator**. Hux has to catch a tip on one skinny rim. That is a torque-bandwidth / reaction-speed problem, not a continuous-watts problem. On the 5.67 kg mass budget a 30° lean-equilibrium is about **2.1 N·m** (2.9 at the old 7.75 kg picture); the RS05's 5.5 N·m peak is above the ~3.0 N·m traction limit, so the catch is grip-limited. At 1.5 m/s it has 2.0 N·m left — about a 28° lean. On the step the shelf caps the catch at about ±6°. Math: [`research/leg-geometry.md`](research/leg-geometry.md).

| Criterion | Intent | Status |
| --- | --- | --- |
| What we optimize | **Reaction speed / torque bandwidth** for inverted-pendulum balance | Not max continuous power |
| Speed (R38, 2026-09-27) | **1.5 m/s top, 1.0 cruise.** RS05 no-load on 8S ≈ 296 rpm nominal / 264 at cutoff = 2.4 / 2.1 m/s at the 6" wheel with nothing left; 1.5 m/s is 188 rpm with ~2.0 N·m of catch in hand (1.6 at cutoff). | 2 m/s would need another wheel actuator or ratio; not wanted. `tools/living-drawings/spec.js`. |
| Wheel | **6" OD × ~1–1.25"** real rubber, torsionally stiff. Size locked, not a buy. | 5" Zantle is a **bench donor**, not the foot. |
| Placement | **In-wheel** (hub / coaxial) | R30 |
| Bus | **8S**, **CAN** | The wheel actuator's own FOC + encoder; torque mode; encoder counts back on the bus for the estimator. |
| Mass | Two wheel motors must **leave room** for pose joints, structure, pack, MCU, companion | Mass budget **soft** (R24). |
| Control | **Reuse** an existing FOC / torque-mode stack (R18) | SimpleFOC on the bench; a CAN actuator's own firmware on the robot. Do not invent Hux drive electronics. |

### Candidate classes (not buys)

| Class | Why it is on the list | Still TBD / not a lock |
| --- | --- | --- |
| **Small CAN QDD / FOC actuator at the hub** (GIM-class outrunner + driver, ODrive-S1-class driver + gimbal motor, integrated hub actuators) | Torque mode, encoder, CAN — the honest answer on 8S. **RobStride 05 is the temporary lock.** | Packaging solved on Sheet 2 (flush outboard); output-bearing rating under the cantilevered rim still open. |
| **Lightweight:** gimbal BLDC ~2208–4108 + SimpleFOC board + magnetic encoder | Bench spin and the first `TWO_WHEEL` if actuators are late. | Bare ~0.5 N·m arrests about 6°; honest only with reduction. Needs a CAN-capable SimpleFOC board to stay on the bus. |
| **Avoid as a default:** large ODrive **63xx** / hoverboard hubs | SonicRobot-class hardware. Study for IMU → PID → torque. Heavy for a maker Hux. | Do not treat upstream parts lists as a Hux BOM. |

## Leg drive classes

**Working class for every joint is a CAN QDD / FOC actuator** (2026-09-26). Servo or stepper+belt remains the documented **fallback** for knee / hip swing only. Size every plant-side joint for one-leg standing load (~2×; R36). Hip roll is dynamic **in V1**.

| Joint | Working class | Fallback | Electronics implication |
| --- | --- | --- | --- |
| **Wheels** | In-wheel FOC on CAN | — | 2 CAN nodes. Not steppers. |
| **Knee / hip swing** | CAN QDD: RS02 knee (7.75:1), RS00 swing (10:1) | Servo on a regulated rail, or stepper + belt behind a CAN / step-dir driver board | 4 CAN nodes (bus B). Knee stand-up 8.2 N·m; the Sheet 2 knee spring brings it to 4.7 at the motor (R7). |
| **Hip roll** | CAN QDD / FOC, backdrivable: RS02 | none — **not a stepper** | 2 CAN nodes (bus A). Torque-mode / high-rate current loop. 5.2 N·m one-wheel hold at 3.0". |

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

Eight nodes at 1 kHz: classic CAN at 1 Mbit/s is ~50–60% loaded with a lean protocol and has no headroom for encoder telemetry; **two buses** (A and B above) is the layout. This is why the Teensy 4.1 was picked.

**Anti-pattern:** a Wing FC can spare pins; drone firmware is a poor host for anything on this page. Spare UARTs are for the RX and the companion link, not for becoming an actuator bus.

## Four-layer sketch (intent)

```
TBS Nano RX ──CRSF──► RT MCU (CAN, 1 kHz)  ──CAN A──► 2× wheel + 2× hip roll
                       │  IMU · control core       └CAN B──► 4× knee / hip swing
                       │  watchdog · torque cut · SD blackbox
                       └──framed serial/USB──► companion (Pi 5 → Jetson at P5)
                                                 ROS 2 · params · MCAP · cameras · Wi‑Fi telem
8S pack ──► XT90-S ──► distribution + hardware kill ──► actuators (direct)
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

- Do not buy anything beyond the [`bom.md`](bom.md) order-now cart (which already holds the Teensy kit, XT90-S and the 8S pack). Actuators, regulators, a Jetson: Steve authorizes cart lines.
- Do not build robot firmware on the F765-Wing. Bench only.
- Do not invent a finished PDB / regulator SKU.
- Do not feed motor current through the MCU or a logic PCB (Tazer).
- Do not run anything on raw pack voltage except the actuators and the distribution board.
- Do not check an actuator against 29.6 V and forget 33.6 V full — or 26.4 V at cutoff against its floor.
- Do not put steppers on the wheels or on hip roll. Do not treat the fallback as the plan.
- Do not omit the hip-roll nodes from V1 “until V2.”
- Do not bridge UART→CAN on a torque axis to keep an old board.
