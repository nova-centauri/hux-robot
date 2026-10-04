# V1-PROOF electronics checklist

**2026-10-03:** one Pico 2 is received. The LSM6DSO IMU is also received and untested. Start the [USB board check](2026-10-03-pico-bringup.md). Confirm the IMU and the remaining power/interfaces separately.

- [ ] Confirm the board/IMU, the radio plus transmitter or alternative manual link, the pack and the charger.
- [ ] Map the available pins/timers for the encoders, drivers, IMU, manual input and later servos.
- [ ] Do a check of the logic levels, the encoder scaling and the default-disabled wheel drivers.
- [ ] Add a fuse to one wheel. Restrain that wheel. Do a check of the direction, the encoder sign and the fault inputs.
- [ ] Measure the lowered hardware current limit. Qualify the 2.5 A short peak / 1.2 A RMS initial limits. Qualify the actual thermal behavior.
- [ ] Before you add the second wheel, do a check of the kill, watchdog, reset and stale-input drive disable.
- [ ] Do a test of the full/low battery voltage, the braking transients and the logic brownout margin.
- [ ] Do a test of both wheel channels with pinned legs in a catch frame.
- [ ] Add the correct servo variant, a suitable protected rail and the half-duplex/PWM interface. Make sure that simultaneous demand causes no MCU resets.
- [ ] Confirm that the manual kill works without laptop/companion software.

Obey [electronics](../electronics.md). All purchases remain inside the [shared budget](../bom.md).

## Revision B mobility gates

- [ ] Obey the [selected hardware and interface decisions](../v1-proof-hardware.md).
- [ ] Complete the [physical mobility/disturbance protocol](../v1-proof-validation.md). Include reverse travel, both arcs, both pivots, pulses and uneven fixtures.
- [ ] Record the measured CoM/inertia, motor response, current, latency, traction and backlash. Run the simulation again with those values.
- [ ] Retain the failures and the logs. Simulated passes do not close physical acceptance boxes.
