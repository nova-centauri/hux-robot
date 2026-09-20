# Checklist: electronics bring-up

**Status:** not started. **FC: TBD.** No spend.

- [ ] Choose a *bench* board from the on-hand pile (F765 Wing / F722 Wing / F722 drone / Mamba F405). This is not a lock.
- [ ] Power on the bench, nothing spinning.
- [ ] Blink an LED.
- [ ] Bind **TBS Nano RX** (or confirm it talks to the FC).
- [ ] Restrained **brushless wheel spin** (tied down, not on carpet).
- [ ] Wi‑Fi telemetry from the Pi (ESP32 bridge only if needed).
- [ ] Two-leg teleop later — not this checklist.
- [ ] Record the surviving FC in [`../electronics.md`](../electronics.md) only after blink + spin.
- [ ] Stepper path later, not this checklist: TMC-class / multi-axis driver(s) + Pi or dedicated controller, **step/dir**. Do not bit-bang coils from the bench FC.

Do not write a fake harness, PDB, or battery architecture here. Do not treat drone firmware as a stepper host (R29).
