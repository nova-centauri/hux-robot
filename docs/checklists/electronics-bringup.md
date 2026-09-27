# Checklist: electronics bring-up

**Status:** not started. RT MCU: **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers (picked 2026-09-26; order-now cart, not yet ordered). Bench board for P0–P1: F765-Wing (no CAN). No spend beyond [`../bom.md`](../bom.md).

Phased class list (not a BOM): [`../electronics-minimum.md`](../electronics-minimum.md). This page is the bench ticks. Later phases stay on that plan until the rows below are real. Manual modes: [`software-bringup.md`](software-bringup.md).

- [ ] **P0** — Bench board from the on-hand pile: F765-Wing (F722 Wing / F722 drone / Mamba F405 are spares). Bench only — none has CAN.
- [ ] **P0** — Power on the bench, nothing spinning. USB / safe rail is enough.
- [ ] **P0** — Blink an LED.
- [ ] **P0** — Bind **TBS Nano RX** and print CRSF channels on the bench board (later: CRSF into the Teensy).
- [ ] **P1** — Restrained **FOC / brushless wheel spin** (tied down, not on carpet). One channel, then two. Bench: one SimpleFOC wheel over UART on the Wing. Robot wheel: **RS05** (temporary lock, not ordered) needs CAN, so it spins on the Teensy.
- [ ] **First actuator** (not authorized yet): **one RS02 on the Teensy** — hold 7 N·m for 30 s with a thermocouple on the case, encoder readback at 1 kHz, confirm the 24 V floor. Then the other seven.
- [ ] Record which bench board blinked and spun in [`../electronics.md`](../electronics.md). Blink does not promote a bench board; the robot MCU is the Teensy 4.1.

After P0–P1 (not this pass until the rows above are real):

- [ ] **P2** — `PARKED` + `TWO_WHEEL` on the Teensy: both RS05 wheels on CAN bus A + IMU at 1 kHz. Modes: [`../software.md`](../software.md).
- [ ] **P3** — pose joints on CAN bus B: **RS02** knees + **RS00** hip swing (temporary lock, not ordered). Fallback only: servos on a regulated rail, or steppers behind a driver board; the MCU does **not** drive coils.
- [ ] **P4** — 2× **RS02** hip roll on CAN bus A into `LEFT_ONLY` / `RIGHT_ONLY`.
- [ ] **P5** — Wi‑Fi telemetry from the Pi (ESP32 bridge only if needed). Cameras / pathfinding later. Telem reports the active mode.

Do not write a fake harness, PDB, or battery architecture here. Class-level rails only: [`../electronics-minimum.md`](../electronics-minimum.md). **8S + step-down** is the power rule (2026-09-26) — no regulator SKU.
