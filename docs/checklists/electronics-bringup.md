# Checklist: electronics bring-up

**Status:** not started. **FC: TBD.** No spend.

- [ ] Choose a *bench* board from the on-hand pile (F765 Wing / F722 Wing / F722 drone / Mamba F405). This is not a lock.
- [ ] Power on the bench, nothing spinning. Prefer a **4S** class pack when one is on hand — do not buy one for this list.
- [ ] Blink an LED.
- [ ] Bind **TBS Nano RX** (or confirm it talks to the FC).
- [ ] Restrained **brushless wheel spin** (tied down, not on carpet).
- [ ] If pose actuators are on the bench: they sit on a **step-down** rail (5V / 6V / 7.4V), not raw 4S and not the unregulated wheel-ESC tap. BEC SKU TBD — do not buy one here.
- [ ] Wi‑Fi telemetry from the Pi (ESP32 bridge only if needed).
- [ ] Two-leg teleop later — not this checklist.
- [ ] Record the surviving FC in [`../electronics.md`](../electronics.md) only after blink + spin.

Do not write a fake harness or a finished PDB. Do not lock servo vs stepper. The 4S + step-down *rule* is in [`../electronics.md`](../electronics.md).
