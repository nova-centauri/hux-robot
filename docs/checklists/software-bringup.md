# Checklist: software / manual-mode bring-up

**Status:** not started. **FC: TBD.** No spend. No fake firmware in this repo.

Gate: prove Steve's four **manual** modes from RC **before** any automated motion (open-loop step, pathfinding, later stair gait). Spec: [`../software.md`](../software.md). Requirement: **R14**.

Electronics first: [`electronics-bringup.md`](electronics-bringup.md) (blink, bind TBS, restrained spin). Do not start this list to skip that.

## Order (do not skip)

- [ ] **Parked** — safe idle. Balance loop is not driving wheels (held or disabled as appropriate). Wi‑Fi telem reports `PARKED`. Lost-link / disarm returns here.
- [ ] **2-wheel balance** — both wheels active; bipedal teleop on TBS Nano. Telem reports `TWO_WHEEL`.
- [ ] **Left wheel only** — balance / drive on the left planted wheel; right leg free. Telem reports `LEFT_ONLY`.
- [ ] **Right wheel only** — mirror: right planted, left free. Telem reports `RIGHT_ONLY`.
- [ ] Mode switch via RC (likely aux / flight-modes style). Stick does not replace the mode switch. Exact channel **TBD** with the FC.
- [ ] Wi‑Fi telem (Pi first) shows the same mode the pilot selected, on every switch.
- [ ] Failsafe: pull the TX or disarm → **Parked**, from 2-wheel and from each one-wheel mode.
- [ ] Only then: **open-loop step** toward a 9.5" riser fixture. No vision required.

## Do not

- Do not run an open-loop step, pathfinding motion, or stair script before the four modes work.
- Do not invent a Betaflight / INAV / ArduPilot / custom mixer or a finished channel map. FC is TBD.
- Do not treat left-only / right-only as an automatic step cycle. They only free the swing leg.
- Do not buy a radio, FC, or Pi for this checklist.

Notes go in [`../../NOTES.md`](../../NOTES.md).
