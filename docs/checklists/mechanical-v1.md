# V1-PROOF mechanical and acceptance checklist

## P0 — inventory and layout

- [ ] Record reusable parts, exact variants and quantities in [inventory](../parts-on-hand.md).
- [ ] Quote the missing items. Keep the all-in total less than $1,000. Keep the repair allowance.
- [ ] Compare the mass allocations with the 2.5 kg target / 3.0 kg maximum.
- [ ] Make a mock-up of the full wheel/motor/bearing/battery envelopes, the body, the pivots and the cable sweep.
- [ ] Detail both the pinned structure and one reduced-servo parallelogram before you machine the parts.

## P1–P2 — two driven wheels, pinned legs

- [ ] Secure the wheels to supported axles. Route the wires. Fit the rest skids/catch fixture.
- [ ] Pin both legs at neutral. Measure the assembled CoM and the wheel/encoder polarity.
- [ ] Qualify wheel torque/reversal/thermal behavior at low operating voltage.
- [ ] Complete 60-second balance in 9/10 starts without support contact.
- [ ] Complete five forward/stop/reverse/turn sequences at 0.25 m/s.

## P3 — one then two powered legs

- [ ] Do a check of the bearing-supported driven pivots, 3:1 reductions, belt engagement, mechanical stops and lock pins.
- [ ] Hold 0.75 N·m at the mounted servo for 10 minutes at the lowest actual rail voltage. Stay in the documented thermal limits. Qualify a 1.0 N·m short transient separately.
- [ ] Measure backlash, friction and full swept clearances under load.
- [ ] Measure the CoM and the required pitch trim at the low/mid/high poses. Keep both wheels loaded.
- [ ] Add synchronized slow height motion. Complete ten low/high/low cycles with a measured body-height change of ≥25 mm and no support contact.

## P4 — full proof

- [ ] Run the fault tests in the fixture. Make sure that the rearm is deliberate.
- [ ] Run a ten-minute mixed session without resets, overloads or falls.
- [ ] Record the final mass, the actual spend with freight/tax/repairs, the videos and the logs.
- [ ] Close every [finish-line](../v1-proof.md#finish-line) criterion. Do not substitute calculated screens for physical tests.

## Revision B mobility gates

- [ ] Obey the [selected hardware and interface decisions](../v1-proof-hardware.md).
- [ ] Complete the [physical mobility/disturbance protocol](../v1-proof-validation.md). Include reverse travel, both arcs, both pivots, pulses and uneven fixtures.
- [ ] Record the measured CoM/inertia, motor response, current, latency, traction and backlash. Run the simulation again with those values.
- [ ] Retain the failures and the logs. Simulated passes do not close physical acceptance boxes.
