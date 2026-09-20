# Electronics

**Status:** TBD. No wiring diagram, no locked FC, no spend.

## Locked enough to write down

| Piece | Choice | Notes |
| --- | --- | --- |
| RC RX | **TBS Nano RX** | Bind to the FC (or a dedicated link into the FC). |
| Wheels | **Brushless** (ESC + BLDC per wheel) | Exact motor/ESC models **TBD**. Drive *class*: reaction-speed / torque-bandwidth FOC, not max continuous power. See below. |
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

## Wheel drive class (intent — no SKU)

Steve 2026-09-20. Wheels are already **brushless** (R6). This section is the *class*, not a buy. No locked motor, driver, or encoder. No shopping links.

The wheel motor is a **balance actuator**. Hux has to catch a tip on one skinny rim. That is a torque-bandwidth / reaction-speed problem, not a “how many continuous watts can we dump into a 6" wheel” problem.

| Criterion | Intent | Status |
| --- | --- | --- |
| What we optimize | **Reaction speed / torque bandwidth** for inverted-pendulum balance | Not max continuous power |
| Wheel | ~4–6" skinny rubber (working hypothesis ~6" when that note lands) | Diameter TBD. See [`mechanical.md`](mechanical.md). |
| Bus | **4S** (~14.8 V nom / ~16.8 V full) | Class lean with the 4S LiPo note (R11 when it lands). Not a pack lock. |
| Mass | Two wheel motors + drivers must **leave room** for hip/knee actuators, structure, 4S pack, FC, Pi | V1 total **under 6 lb**; aspirational 4–5 lb (~1.8–2.3 kg). R24. |
| Control | **Reuse** an existing FOC / torque-mode stack (R18) | SimpleFOC / gimbal-class patterns. Do not invent Hux drive electronics. |
| FC | Still **TBD** | This class does not pick the FC. |

### Candidate classes (not buys)

| Class | Why it is on the list | Still TBD / not a lock |
| --- | --- | --- |
| **Lightweight:** gimbal BLDC **~2208–4108** + FOC driver + magnetic encoder | Fast torque, low mass. Scale reference: [StackForce mini wheeled-legged](https://wiki.seeedstudio.com/stackforce_mini_wheeled_legged_robot/) is ~**540 g** and uses **2208** gimbal motors. That is a *mass / motor-size* reference, **not a kit lock**. | Stator size, Kv, which FOC board, which encoder. Not a SKU. |
| **Mid:** small outrunner + planetary / cycloidal | If a 6" rim + **one-leg** needs more torque than a gimbal can give at the shaft | Ratio, backlash, reflected inertia, packaging at the wheel |
| **Avoid for this mass:** large ODrive **63xx** / hoverboard hub motors | SonicRobot-class hardware. Fine to *study* for IMU → PID → torque. Too heavy for a 4–6 lb Hux. | Do not shop the SonicRobot README. |

Prefer the lightweight class until a sketch shows the mid class is required. Prefer **reusing** a FOC/torque-mode stack that already exists ([SimpleFOC](https://simplefoc.com/) and gimbal-class patterns) over designing a Hux inverter. That is R18 applied to the wheel drive — **TBD which stack we adopt.** Study, do not buy, do not invent.

### Rough physics (order-of-magnitude)

At ~**2 kg** and ~**0.25 m** CoG height, a ~**10°** tip needs on the order of **~0.8 Nm** restoring at the CoG (`m g h sinθ`). **One-leg** puts that on **one** wheel. Gearing multiplies motor torque but adds backlash and reflected inertia — a tradeoff, not a free lunch. Do not treat 0.8 Nm as a locked motor rating or a gain.

When a real motor is on the bench, record class, measured mass of motor+driver+encoder, bus voltage, and whether it is FOC torque-mode. Until then: **class TBD, no SKU.**

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

- Do not buy a “better” FC, ESC, Pi, gimbal motor, FOC board, or encoder for this scaffold.
- Do not recommend spend. Do not paste shopping links as “buy this.”
- Do not invent a finished PDB / BEC / battery stack.
- Do not treat any candidate (FC or wheel-drive class) as selected.
- Do not invent Hux drive electronics. Reuse FOC / torque-mode (R18).
- Do not pick ODrive 63xx / hoverboard hubs to “match SonicRobot.” That class blows the mass budget.
