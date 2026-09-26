# Compute and software-stack review — 2026-09-26

Steve asked for a review of the software stack that will run on the hardware, and whether a "high-power NVIDIA single-board computer, about $400–600" fits Hux. **Docs only. No lock changed. No spend.** This is the advisory read (decisions 2026-09-22: advisory / adversarial), not a plan rewrite.

Reviewed: [`../software.md`](../software.md), [`../electronics.md`](../electronics.md), [`../electronics-minimum.md`](../electronics-minimum.md), [`../parts-on-hand.md`](../parts-on-hand.md), the living-drawings **Software / Data flow / Hardware** pages (the 2026-09-25 F765-Wing + Pi 5 bench plan), and the Matek F765-WING spec sheet.

## The stack as it actually stands

| Layer | What the bench plan says | Rate |
| --- | --- | --- |
| **F765-Wing** (STM32F765, 216 MHz, MPU6000 + ICM20602 on SPI, 7 UARTs, 12 PWM, microSD, **no CAN**) | Bare metal, PlatformIO + STM32 Arduino core. 1 kHz timer: read gyros, parse CRSF, hold the mode, stream text to the Pi. PID joins the same timer after the balance study. ArduPilot comes off (GPL-3 vs MIT; plane/rover assumptions). | 1 kHz |
| **Wheel driver** (not chosen) | SimpleFOC on the driver's own MCU. Takes a torque number from the Wing. | 10–40 kHz |
| **Pi 5** | Raspberry Pi OS Lite (Trixie). One Python process, listen-only. Cameras, face, pathfinding later. No RT kernel, no ROS. | 10–50 Hz |
| **TBS Nano RX** | CRSF into a full Wing UART. | — |
| **ESP32** | Unused. | — |

That is a sensible V1 split and it matches the Diablo / Mini-Cheetah / Stompy pattern: a small real-time MCU owns the IMU and the loop; smart drivers own current; a Linux box owns eyes and Wi-Fi. The pieces below are where it is thin or wrong.

## Findings

### 1. The F765-Wing has no CAN, and that decides more than the docs admit

Every torque-mode actuator on the candidate list speaks **CAN**: GIM8108-class (MIT mini-cheetah protocol), Robstride, CubeMars, ODrive. Hux wants **four** torque-mode axes in V1 (2 wheels + 2 hip roll), plus 4 pose joints. The Wing can command wheels over UART or PWM to a SimpleFOC board, and that is fine for **P0–P2** (`TWO_WHEEL`). It cannot talk to a GIM8108 without an SPI/UART→CAN bridge, which is a hack on the highest-bandwidth axis in the machine.

**Consequence:** the F765-Wing is a **P0–P2 bench board**, not the 8-axis brain, unless every actuator ends up UART/PWM. The docs treat "FC TBD" and "actuator class TBD" as independent. They are not. **The actuator bus picks the MCU.** Decide the bus (CAN is the industry answer for QDD-class) before P3, then pick the board that has it (Matek F765-WSE / H743-WING class with CAN, or a Teensy 4.1-class MCU with three CAN FD and an external IMU). Do not buy anything for this yet; the Wing gets you to `TWO_WHEEL` for $0.

### 2. "A few more lines in the same timer" undersells the firmware

R18 forbids a novel balance *controller*; the bench plan nevertheless writes a brand-new bare-metal *firmware*: startup, two SPI gyro drivers, CRSF parser, mode machine, actuator protocol, telemetry. The PID cascade is the easy part. What makes balance tuning survivable, and is missing from the plan:

| Missing | Why it matters | Cheapest honest version |
| --- | --- | --- |
| **Blackbox logging** | You cannot tune a 1 kHz loop from a 50 Hz text stream. | The Wing has a **microSD (SDIO)** slot. Log the loop state at 1 kHz from the first flash. |
| **Live parameters** | Reflashing to change a gain is how tuning sessions die. | Set/get params over the Pi link; persist to flash. |
| **Framed binary link** FC ↔ Pi | Text is fine to *listen*. The moment setpoints go **down**, an unframed line is a safety hole. | COBS-framed binary with CRC and a sequence number, before P3. |
| **Hardware torque cut** | Firmware watchdog is not an e-stop. | A physical kill on the actuator enable line / motor bus, independent of the F7. Plus the IWDG so a hung loop drops torque. |
| **Wheel odometry in the estimator** | IMU-only balance drifts; every reused pattern (TallBalancer `vel_hold`) fuses encoder velocity. | Encoder counts come back from the driver in the same frame as the torque ack. |

None of this changes the architecture. It changes what "first image" means: not blink-and-print, but blink, print, **log, and param**.

### 3. PlatformIO + STM32 Arduino core is a P0–P2 base, not the robot's base

The F765 has headroom for two SPI gyros + CRSF + PID + UART at 1 kHz. The Arduino core is fine for that. It is a poor base once the board needs CAN, DMA'd multi-UART, and deterministic timing across 8 axes. When the bus is decided (finding 1), decide the firmware base with it: STM32Cube HAL, Zephyr, or a Teensy-class core with mature CAN. Do not port twice; accept that the P0–P2 image is throwaway.

### 4. The Pi 5 is right for V1 and wrong for the seven-camera plan

Pi 5: two 4-lane CSI ports, no NPU, ~5–8 W. The drawings call for **seven** cameras (front stereo pair + back, sides, top, bottom) and stereo depth for stairs. Five USB cameras through a Pi 5's USB, plus stereo depth on the CPU, is a bandwidth and CPU wall. That is a **P5** problem and the docs already place it there. It is the one place a Jetson earns its keep on Hux.

Pi 5 power: the plan correctly says the Wing's 5 V / 2 A BEC does not feed it. A Pi 5 with cameras wants a real 5 V / 5 A buck off 4S and a proper USB-PD-class connector, not a servo lead.

### 5. The Pi should be allowed to reflash the Wing

The plan says flashing happens from the bench computer over USB using the boot button. Keep that for the bench, but the Pi can do `dfu-util` over the same USB cable; on a robot with the Wing buried in a body, that is how you will actually update it. Wire the boot pin to a Pi GPIO if the board exposes it.

### 6. Docs vs website: stop calling the bench board TBD

Decisions 2026-09-25 flagged that the living-drawings pages look more locked than the docs. The fix is the other way round. Six files say "FC TBD" while a concrete F765 plan exists and is right for P0–P2. Name it: **"P0–P2 bench board: F765-Wing (no CAN; not the 8-axis brain unless actuators are UART/PWM)."** TBD-everywhere is now costing clarity, not protecting a decision.

## The NVIDIA board

**Which board.** "About $400–600, high power" was the **Jetson Orin NX** (8 GB module $399, 16 GB module $599) or an Orin NX dev kit from Seeed / Waveshare. **Those prices are gone.** On 2026-07-22 NVIDIA repriced Jetson: Orin Nano Super dev kit $249 → **$399**; Orin NX 8 GB module $399 → **$649**; Orin NX 16 GB module $599 → **$999**; AGX Orin dev kit $1,999 → $3,499; AGX Thor dev kit $3,499 → $5,499. Modules need a carrier (+$100–250). So the board Steve remembers is now **$750–1,250** assembled, and the only Jetson in the $400–600 band is the **Orin Nano Super developer kit at $399** (67 INT8 TOPS, 8 GB LPDDR5, 6× A78AE, 7–25 W, DC barrel 9–19 V, 2× CSI, M.2 NVMe). Mid-range Thor modules (T2000 16 GB / T3000 32 GB, 400 / 865 FP4 TFLOPS) were announced for **Q1 2027**, prices unannounced.

**Is it "perfect for our application"?** Not for V1, and not yet.

| Question | Answer |
| --- | --- |
| Does V1 (P0–P4) need it? | **No.** The balance loop lives on the MCU. The Pi's V1 job is a serial listener. A Jetson adds ~200–300 g, a fan, and 7–25 W of 4S drain for nothing until cameras exist. |
| Does the RL / dojo horizon need it? | **No.** A trained policy is a small MLP; it runs on a Pi 5 or, at a few hundred Hz, on the F765 itself. Stompy's Orin Nano was convenience, not necessity. The Jetson is for **perception**, not policy. |
| Where does it earn its keep? | **P5 stair perception**: stereo depth + step-edge / nosing detection at frame rate (CUDA / VPI), more CSI lanes and USB bandwidth for a multi-camera head, and the Isaac ROS depth / VSLAM stack if Hux goes ROS 2 then. |
| Which Jetson, when the time comes? | **Orin Nano Super dev kit ($399)** first. 8 GB is enough for depth + a detector. The NX 16 GB at ~$1,000 + carrier is a poor trade at this stage. Re-check the lineup at P5 — T2000-class parts and prices will exist by then. |
| Cheaper middle step? | **Pi 5 + Hailo AI HAT+** (~$70–130, 13–40 TOPS) runs a detector; it does **not** help stereo depth or camera bandwidth. Try it only if the P5 job turns out to be "one detector on one camera." |
| Power / mounting if it happens | The dev kit's 9–19 V barrel input accepts **4S directly** (12.6–16.8 V) — no step-down. Dev kit is ~100 × 79 × 21 mm plus fan; it fits the ~7" head. Plan the head as a **swappable companion slot** (R22) with a 12–20 V feed path and airflow, so Pi 5 → Jetson is a bolt-in, not a redesign. |

**Contradiction flag.** Steve's own decisions, in six files (`decisions.md`, `software.md`, `study-plan.md`, `spdrbot.md`, `stompy-sim2real.md`, `NOTES.md`), say: do not buy a Jetson before `TWO_WHEEL`. "Might be perfect" is a different position. Recommendation: **keep the lock, reserve the slot.** Revisit at P5 with a measured perception job in hand. If Steve wants the lock changed, that is a `decisions.md` entry, not a cart line.

## What to change in the plan (docs only)

1. `electronics.md` / `software.md`: replace "FC TBD" with "P0–P2 bench board: F765-Wing (no CAN)" and add the rule **the actuator bus picks the P3+ MCU**.
2. `software.md` first image: add blackbox to microSD, live params, framed binary link before setpoints, hardware torque cut + IWDG, encoder velocity in the estimator.
3. `mechanical.md` head: a companion **slot** sized for an Orin Nano dev kit (100 × 79 × 21 mm + fan) with a 12–20 V feed path; Pi 5 occupies it in V1.
4. `bom.md` class estimates: the companion line stays $0 (Pi on hand); note the Jetson decision point is P5 and the board of record for that estimate is the Orin Nano Super dev kit at $399 (post-2026-07-22 pricing), not an Orin NX.
5. `study-plan.md` Phase E: "buy a Jetson because Stompy" stays a don't; add "perception, not policy, is the Jetson job."

## Postscript — same day

Steve's reply: nothing is locked; the Pi 5 and F765 are on hand but need not be used; a stepping stone is fine if the logic carries, otherwise start on the better board; he wants a real project. He approved **4S → 6S** (one large pack or two in parallel; LiPo or similar).

Outcome, logged in [`../decisions.md`](../decisions.md) (2026-09-26): the Jetson does not replace the F765, it replaces the Pi — and the Pi carries forward for free if the companion runs in containers with no Pi-specific libraries. The rewrite risk was all on the F765 side, so the F765 is now a P0–P1 bench board and the robot gets a **CAN real-time MCU** picked with the actuators. The **control core becomes a portable C++ library** that links into the MCU, the companion and the twin — that is the carry-forward guarantee. **ROS 2 on the companion**; the "no ROS" line is withdrawn there. **Power moved to 6S, then 8S the same day** once the actuator check found the RobStride 24 V floor — which puts CAN QDD actuators in their working band and makes the actuator bus the plan rather than a class. The Jetson stays a P5 perception buy; the head gets a slot for it, and at 8S it needs a 12–19 V rail rather than pack-direct. Canonical pages updated: `software.md`, `electronics.md`, `electronics-minimum.md`, `requirements.md`, `bom.md`, `parts-on-hand.md`, `mechanical.md`, `NOTES.md`, `README.md`, and the living-drawings Software / Data flow / Hardware pages.

## Sources

- Matek F765-WING specification — http://www.mateksys.com/?portfolio=f765-wing (7 UARTs, 12 PWM, microSD SDIO, no CAN, 5 V 2 A BEC)
- CNX Software, 2026-07-22, "NVIDIA increases the price of Jetson modules and devkits by up to 101%" — https://www.cnx-software.com/2026/07/22/nvidia-increases-the-price-of-jetson-modules-and-devkits-by-up-to-101/
- NVIDIA Jetson Orin Nano Super Developer Kit — https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/
- ServeTheHome, Jetson Thor T2000 / T3000 announcement — https://www.servethehome.com/nvidia-announces-expanded-jetson-thor-lineup-with-mid-range-t3000-and-t2000-modules/
