# Checklist: electronics bring-up

**Status:** not started. **FC: TBD.** No spend.

- [ ] Choose a *bench* board from the on-hand pile (F765 Wing / F722 Wing / F722 drone / Mamba F405). This is not a lock.
- [ ] Power on the bench, nothing spinning.
- [ ] Blink an LED.
- [ ] Bind **TBS Nano RX** (or confirm it talks to the FC).
- [ ] Restrained **brushless wheel spin** (tied down, not on carpet).
- [ ] Wi‑Fi telemetry from the Pi (ESP32 bridge only if needed).
- [ ] Record the surviving FC in [`../electronics.md`](../electronics.md) only after blink + spin.

After blink + spin, **software** modes (not this pass until the rows above are real):

- [ ] **Parked** → **2-wheel** → **left-only** → **right-only** from RC, before any open-loop step. Full list: [`software-bringup.md`](software-bringup.md).

Do not write a fake harness, PDB, or battery architecture here.

