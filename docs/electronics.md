# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

**4S + regulated step-down** is a class rule, not a pack / BEC lock. **Servo vs stepper+belt TBD** for knee / hip swing. **Hip roll is in V1.** **FC stays TBD.**

Parent plan (classes, P0–P5, not a BOM): [`electronics-minimum.md`](electronics-minimum.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md). Decisions: [`decisions.md`](decisions.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md).

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| Powertrain | **Electric-only** | No ICE, no hybrid. Whole robot. |
| Battery class | **4S LiPo** (RC car / boat packs) | Nominal **~14.8 V** / full **~16.8 V**. Capacity and C-rating **TBD**. No pack SKU. |
| Pose / logic rails | **Controlled step-down** from 4S | BEC / regulator *class* to **5 V / 6 V / 7.4 V** as the actuator needs. SKU **TBD**. |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **In-wheel brushless FOC** + encoder | Motor at the rim (R6 / R30). Exact models TBD. Reaction-speed / torque-bandwidth class (R25). |
| Knee / hip swing | **Servo vs stepper+belt TBD** | Both open. Size either for one-leg (~2×) load (R36). **GIM8108-8** is a candidate — not ordered. No SKU. No lean. |
| Hip roll | **In V1.** **Dynamic** FOC BLDC / small QDD / fast servo | Not a stepper. Experimental — may not work. Still wire the axis and the modes. SKU TBD. |
| Companion | **Raspberry Pi** | Cameras + pathfinding inference. Not on the FC. Possible stepper brain if that class is chosen. |
| Wi‑Fi telem | **Pi first** | ESP32 only as an optional thin telemetry bridge. |

## Flight controller — TBD

**Do not lock an FC in this repo.** Steve 2026-09-20: leave it TBD. Prefer a Wing board *when* we lock. Mechanical work is not blocked.

Candidates already on hand:

- F765 Wing
- F722 Wing
- F722 drone FC
- Mamba F405

When one is actually on the bench and blinking, record it here, in [`parts-on-hand.md`](parts-on-hand.md), and in [`../NOTES.md`](../NOTES.md). Until then the line is **FC: TBD**.

## Battery — 4S preferred; step down for pose / logic (R11)

Steve 2026-09-20 follow-up. **4S LiPo stays the preferred pack class.** Serra's machine is 3S + Arduino — do not follow that bus. 4S holds voltage better under current spikes than 3S.

Wheel FOC on a two-wheel (and later one-wheel) balancer is a **high-draw** load. Pose actuators (servo *or* stepper) and logic must not share that sag.

**Rule:** 4S pack → **controlled step-down** (BEC / regulator *class*) for **5 V / 6 V / 7.4 V** servo or logic rails. Do not feed a 5–7.4 V servo bus from raw 4S. Do not hang pose actuators on the same unregulated tap as the wheel ESCs.

**Power bus (Tazer anti-pattern):** FOC stalls are high-current. Plan **dedicated power distribution** (PDB / harness *class*), not skinny traces and **not** the FC or a logic PCB as the motor bus. Tazer's 6-axis machine nearly blew a board used as a power plane. Hux 4S is lighter than his ~48 V stack and still needs a real bus. No PDB SKU. See [`research/tazer-lessons.md`](research/tazer-lessons.md).

| Item | Intent | Status |
| --- | --- | --- |
| Chemistry / cell count | 4S LiPo (preferred) | Class lean. Not a locked SKU. |
| Nominal / full | **~14.8 V** / **~16.8 V** | Use when thinking about ESC / servo / BEC *ranges*. |
| Capacity (mAh) / C-rating | TBD | No spend. Do not guess a pack into a BOM. |
| Wheel bus | 4S (via ESC) | High-draw FOC. Encoder on the wheel axis. |
| Pose / logic rails | **Step down** to 5 V / 6 V / 7.4 V | Separate enough that a wheel current spike does not brown out a planted knee / hip. |
| BEC / regulator / PDB | **Class only** | Box on the sketch. **No SKU.** |

Power rail sketch (not a harness):

```
4S LiPo (class, TBD pack)
        │
        ▼
   power bus TBD
        ├── wheel FOC / BLDC + encoder  (high draw; 4S)
        ├── hip-roll dynamic (PWM / CAN / FOC — TBD)
        ├── step-down (BEC/reg class, TBD) ──► 5V / 6V / 7.4V pose + logic
        │         └── knee / hip swing (servo *or* stepper — class TBD)
        └── FC (TBD) + RX + Pi  (via the regulated rail or a second tap — TBD)
```

When a real pack is on the bench, record cell count, measured resting voltage, connector, and who it actually feeds. Until then: **4S preferred, step-down for pose / logic, no BEC SKU.**

## Wheel drive class (R25) — no SKU

The wheel motor is a **balance actuator**. Hux has to catch a tip on one skinny rim. That is a torque-bandwidth / reaction-speed problem, not a continuous-watts problem. On the settled **6" / ~6 kg** example, a 30° one-leg catch is about **2.2 N·m** — target about **3 N·m peak**. On the step the shelf caps the catch at about ±6°. Math: [`research/leg-geometry.md`](research/leg-geometry.md).

| Criterion | Intent | Status |
| --- | --- | --- |
| What we optimize | **Reaction speed / torque bandwidth** for inverted-pendulum balance | Not max continuous power |
| Wheel | **6" OD × ~1–1.25"** real rubber, torsionally stiff. Size locked, not a buy. | 5" Zantle is a **bench donor**, not the foot. [`research/leg-geometry.md`](research/leg-geometry.md). |
| Placement | **In-wheel** (hub / coaxial) | R30 |
| Bus | **4S** (~14.8 V nom / ~16.8 V full) | Class lean (R11). Not a pack lock. |
| Mass | Two wheel motors + drivers must **leave room** for pose joints, structure, pack, FC, Pi | Mass budget **soft** (R24). |
| Control | **Reuse** an existing FOC / torque-mode stack (R18) | SimpleFOC / gimbal-class patterns. Do not invent Hux drive electronics. |
| FC | Still **TBD** | This class does not pick the FC. |

### Candidate classes (not buys)

| Class | Why it is on the list | Still TBD / not a lock |
| --- | --- | --- |
| **Lightweight:** gimbal BLDC **~2208–4108** + FOC driver + magnetic encoder | Fast torque, low mass. Scale reference: [StackForce mini](https://wiki.seeedstudio.com/stackforce_mini_wheeled_legged_robot/) ~**540 g** / **2208**. *Scale* only — **not a kit lock**. | Bare ~0.5 N·m arrests about 6° on the 6" / 6 kg example. Honest here **with reduction**, or on a much lighter machine. Stator, ratio, kV, FOC board, encoder all TBD. |
| **Mid:** small outrunner + planetary / cycloidal | Honest band for about **3 N·m peak** at the 6" contact. Still not a hoverboard hub. | Ratio, backlash, reflected inertia, packaging at the wheel |
| **Avoid as a default:** large ODrive **63xx** / hoverboard hub motors | SonicRobot-class hardware. Fine to *study* for IMU → PID → torque. Heavy for a maker Hux. Mass is soft now — still do not shop the SonicRobot README. | Do not treat upstream parts lists as a Hux BOM |

Prefer **reusing** a FOC / torque-mode stack that already exists ([SimpleFOC](https://simplefoc.com/) and gimbal-class patterns) over designing a Hux inverter (R18). **TBD which stack we adopt.**

## Leg drive classes

**Knee / hip swing: servo vs stepper+belt TBD** (R12). Both are open options. Size **whichever we pick** for one-leg standing load (~2×; R36). Wheels stay brushless FOC. Hip roll stays dynamic **in V1**.

| Joint | Working intent | Electronics implication |
| --- | --- | --- |
| **Wheels** | In-wheel brushless **FOC** (R6) | 2 FOC channels + encoders. Not steppers. |
| **Knee / hip swing** | **Servo vs stepper+belt TBD** | If steppers: 4 drivers + 4 motors; reduction required; **FC does not drive coils**. If servos: 4 servo channels on the regulated rail. **GIM8108-8** is a candidate (not ordered). |
| **Hip roll** | **In V1.** Dynamic FOC / small QDD / fast bus servo | **Not a stepper. Not V2.** Torque-mode / high-rate current loop. Ideally backdrivable. Include the driver channel even if the first loop is ugly. |

Do not put a stepper on hip roll to “match” the knees. Missed steps, resonance, and belt stretch / backlash hurt the CoG loop that pairs with wheel fore-aft.

**All-stepper is not the baseline** (R28). If later forced onto *roll*: closed-loop drivers, short low-backlash belts, and a written acceptance of **lower one-leg bandwidth**.

### Hold current, heat, 4S

A stepper often sits at **holding current** to keep a pose. Four pose joints is continuous draw and heat, even when Hux is standing still. That is **4S drain** — capacity / C still **TBD**. FOC / torque-mode can hold with less waste if springs take gravity (R7). Another reason roll should not be an open-loop stepper.

Do not invent a PDB / BEC / driver BOM. Do not recommend spend.

## Actuator I/O architecture (R29)

Count the axes before we pretend a Wing board can host everything.

| Count | Axis | Drive class |
| --- | --- | --- |
| 2 | Wheels (L / R) | Brushless FOC |
| 4 | L/R **knee** + L/R **hip swing** | Servo **or** stepper + reduction — **TBD** |
| 2 | Hip **roll** (L / R) | Dynamic FOC BLDC / small QDD / fast bus servo. **In V1.** Experimental. |
| **8** | **V1 total** | Not eight identical motors. |

### If steppers are chosen for pose

**The FC does not drive stepper coils.** Coil current belongs on **stepper driver board(s)** — **TMC-class** or other **multi-axis** driver *class* — sitting between a host (Pi **or** a dedicated stepper controller) and the four steppers. Step/dir (or a bus the driver already speaks) is the interface. GPIO-toggling phases from a flight controller is out.

| Host | Owns | Why |
| --- | --- | --- |
| **FC** (TBD) | IMU + attitude + **wheel FOC**. **Hip roll** too *if* the link is honest (**PWM / CAN** / equivalent). TBS Nano RX. | Balance loop and fast torque live here. |
| **Pi** *or* a **dedicated stepper controller** | The **four steppers**, via driver board(s), **step/dir** | Position / pose on knee + swing. Not a 1 kHz CoG loop. |

**Anti-pattern:** a Wing FC can spare pins; **drone firmware is a poor stepper host**. Do not bit-bang coils or fake steppers from a flight-stack mixer for V1. Spare pins are for RX, telem, and maybe roll PWM/CAN — not for becoming a CNC controller.

### If servos are chosen for pose

Servos sit on the **regulated** 5 / 6 / 7.4 V rail (R11). Still not raw 4S. FC or a servo bus adapter may command them; do not invent the bus here. Hip roll still stays on the **balance** side of the split.

## Split-brain sketch (intent)

```
TBS Nano RX ──► FC (TBD) ──► wheel FOC (2× in-wheel BLDC + encoder)
                    │            └──► hip roll (2× dynamic) if PWM/CAN
                    │
                    └── IMU / attitude / manual modes (PARKED / TWO_WHEEL / LEFT_ONLY / RIGHT_ONLY)

Pi ── cameras, pathfinding, Wi‑Fi telem (reports active mode)
  └── *if steppers:* ──► TMC-class / multi-axis driver(s) ──► 4× steppers step/dir
                         (L/R knee, L/R hip swing)

ESP32 (optional) ── thin Wi‑Fi/telem bridge if we keep the Pi busy
4S pack ──► wheel ESCs
         └──► step-down ──► pose / logic rails
```

This is a box diagram, not a harness. No SKU. **8 axes.** FC does **not** drive stepper coils.

## Bring-up order (no carpet)

See [`checklists/electronics-bringup.md`](checklists/electronics-bringup.md) and the P0–P5 plan in [`electronics-minimum.md`](electronics-minimum.md).

1. Pick an FC from the on-hand pile when ready — still not a lock until it survives blink (**P0**).
2. Blink an LED. Bind TBS Nano.
3. Restrained FOC wheel spin (tied down, not on carpet) (**P1**).
4. `PARKED` / `TWO_WHEEL` (**P2**).
5. Pose joints (**P3**) — servo *or* stepper path.
6. Hip roll + `LEFT_ONLY` / `RIGHT_ONLY` (**P4**).
7. Wi‑Fi telem / Pi / cameras (**P5**).

## Do not

- Do not buy a “better” FC, ESC, BEC, servo, stepper, Pi, LiPo, FOC board, or encoder for this scaffold.
- Do not recommend spend. Do not paste shopping links as “buy this.”
- Do not invent a finished PDB / BEC SKU or a pack size.
- Do not feed motor current through the FC or a delicate logic PCB (Tazer).
- Do not run pose actuators on raw 4S, or on the same unregulated tap as wheel FOC.
- Do not lock servo vs stepper+belt.
- Do not treat any FC candidate or actuator *SKU* as selected. Hip-roll *class* (dynamic, in V1) is locked.
- Do not put steppers on the wheels or on hip roll to make the BOM uniform.
- Do not omit the hip-roll driver channel from V1 “until V2.”
- Do not drive stepper **coils** from the FC. Do not host four steppers in drone firmware just because a Wing board has spare pins.
