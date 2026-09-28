# Checklist: software / manual-mode bring-up

**Status:** not started. Architecture: [`../software.md`](../software.md) (2026-09-26). No spend. No fake firmware in this repo.

Gate: prove Steve's four **manual** modes from RC **before** any automated motion (open-loop step, pathfinding, later stair gait). Spec: [`../software.md`](../software.md). Requirement: **R14**.

Electronics first: [`electronics-bringup.md`](electronics-bringup.md) (blink, bind TBS, restrained spin). Do not start this list to skip that.

## Order (do not skip)

- [ ] **Parked** — safe idle. Balance loop is not driving wheels (held or disabled as appropriate). Telem reports `PARKED`. Lost-link / disarm returns here.
- [ ] **2-wheel balance** — both wheels active; bipedal teleop on TBS Nano. Telem reports `TWO_WHEEL`.
- [ ] **Left wheel only** — balance / drive on the left planted wheel; right leg free. Hip roll in the experiment (V1, best-effort). Telem reports `LEFT_ONLY`.
- [ ] **Right wheel only** — mirror: right planted, left free. Telem reports `RIGHT_ONLY`.
- [ ] Mode switch via RC (likely aux / flight-modes style). Stick does not replace the mode switch. Exact channel **TBD** in the Teensy firmware.
- [ ] Telem (USB / serial first; Wi‑Fi later) shows the same mode the pilot selected, on every switch.
- [ ] Failsafe: pull the TX or disarm → **Parked**, from 2-wheel and from each one-wheel mode.
- [ ] `TWO_WHEEL` speed command clamps at **1.5 m/s**, cruise 1.0 (R38); crosses a **1" sill** at cruise and holds a **~20° slope** (R40).
- [ ] One-leg shift includes the **geometric levelling** term (leg-length difference 2 × 3.375" × tan γ ≈ 3.2" at 25.6°) — the sandbox's feed-forward, in the portable core.
- [ ] Only then: **open-loop step** toward a 9.5" riser fixture. No vision required.
- [ ] **V1 finish line (R37):** one 9.5" step, **9 of 10** attempts, from a standstill on the lower tread. A flight is V2.

## Do not

- Do not run an open-loop step, pathfinding motion, or stair script before the four modes work.
- Do not invent a Betaflight / INAV / ArduPilot mixer or a finished channel map. The controller is the portable control core on a CAN MCU ([`../software.md`](../software.md)); the channel map follows the MCU.
- Do not treat left-only / right-only as an automatic step cycle. They only free the swing leg.
- Do not fake a CoG shift if hip roll is unplugged — and do not unplug it to wait for V2.
- Do not buy a radio, another MCU, or a Pi for this checklist. The Teensy 4.1 kit is already an order-now line.

Notes go in [`../../NOTES.md`](../../NOTES.md).
