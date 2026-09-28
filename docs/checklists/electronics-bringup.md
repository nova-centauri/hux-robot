# V1-PROOF electronics checklist

- [ ] Confirm board/IMU, radio plus transmitter or alternative manual link, pack and charger.
- [ ] Map available pins/timers for encoders, drivers, IMU, manual input and later servos.
- [ ] Verify logic levels, encoder scaling and default-disabled wheel drivers.
- [ ] Fuse and restrain one wheel; verify direction, encoder sign and fault inputs.
- [ ] Measure the lowered hardware current limit; qualify 2.5 A short peak / 1.2 A RMS starting limits and actual thermal behavior.
- [ ] Verify kill, watchdog, reset and stale-input drive disable before adding the second wheel.
- [ ] Test full/low battery voltage, braking transients and logic brownout margin.
- [ ] Test both wheel channels with pinned legs in a catch frame.
- [ ] Add the correct servo variant, suitable protected rail and half-duplex/PWM interface; verify simultaneous demand and no MCU resets.
- [ ] Confirm manual kill works without laptop/companion software.

Follow [electronics](../electronics.md); all purchases remain inside the [shared budget](../bom.md).
