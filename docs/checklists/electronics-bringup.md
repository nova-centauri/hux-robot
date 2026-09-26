# Checklist: electronics bring-up

**Status:** not started. **FC: TBD.** No spend.

Phased class list (not a BOM): [`../electronics-minimum.md`](../electronics-minimum.md). This page is the bench ticks. Later phases stay on that plan until the rows below are real. Manual modes: [`software-bringup.md`](software-bringup.md).

- [ ] **P0** — Choose a *bench* board from the on-hand pile (F765 Wing / F722 Wing / F722 drone / Mamba F405). This is not a lock.
- [ ] **P0** — Power on the bench, nothing spinning. USB / safe rail is enough.
- [ ] **P0** — Blink an LED.
- [ ] **P0** — Bind **TBS Nano RX** (or confirm it talks to the FC).
- [ ] **P1** — Restrained **FOC / brushless wheel spin** (tied down, not on carpet). One channel, then two. In-wheel class; motor model TBD.
- [ ] Record the surviving FC in [`../electronics.md`](../electronics.md) only after blink + spin. Line stays **FC: TBD** until Steve locks.

After P0–P1 (not this pass until the rows above are real):

- [ ] **P2** — `PARKED` + `TWO_WHEEL` on both wheels + IMU. Modes: [`../software.md`](../software.md).
- [ ] **P3** — pose joints (knee + hip swing) on **CAN QDD**. Fallback: servos on a regulated rail, or steppers behind a driver board; the MCU does **not** drive coils.
- [ ] **P4** — 2× hip-roll dynamic actuators into `LEFT_ONLY` / `RIGHT_ONLY`.
- [ ] **P5** — Wi‑Fi telemetry from the Pi (ESP32 bridge only if needed). Cameras / pathfinding later. Telem reports the active mode.

Do not write a fake harness, PDB, or battery architecture here. Class-level rails only: [`../electronics-minimum.md`](../electronics-minimum.md). **8S + step-down** is the power rule (2026-09-26) — no regulator SKU.
