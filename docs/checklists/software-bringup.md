# V1-PROOF software checklist

**2026-10-03:** the Pico 2 is received and untested. Start the [board-only USB/LED checklist](2026-10-03-pico-bringup.md). The received LSM6DSO IMU replaces the earlier LSM6DSOX selection. The sensor firmware and the qualification remain open.

- [ ] Blink/log on the available board. Identify the exact firmware/toolchain and the license choices.
- [ ] Calibrate and timestamp the IMU. Read the signed wheel encoders and the battery/current feedback.
- [ ] Measure the 500 Hz control-loop timing under the maximum intended log and input load.
- [ ] Implement `DISARMED`, `BALANCE`, `DRIVE`, latched `FAULT` and deliberate rearm.
- [ ] Do a test of stale commands (>250 ms), stale critical sensors, deadlines, reset and manual kill in the supported fixture.
- [ ] Adapt conventional balance control. Before you enable the closed loop, do a check of the polarity at low power.
- [ ] Tune the pinned-leg balance. Then tune the bounded speed/yaw with saturation protection.
- [ ] Log the physical trials. Compare them with the [finish line](../v1-proof.md#finish-line).
- [ ] Measure the pose-dependent pitch trim. Then add slow synchronized leg commands in `BALANCE`.
- [ ] Complete the ten-minute mixed session. Retain the faults/current/voltage/timing logs.

The host-side tests of the model are not evidence of a firmware implementation or a hardware pass.

## Revision B mobility gates

- [ ] Obey the [selected hardware and interface decisions](../v1-proof-hardware.md).
- [ ] Complete the [physical mobility/disturbance protocol](../v1-proof-validation.md). Include reverse travel, both arcs, both pivots, pulses and uneven fixtures.
- [ ] Record the measured CoM/inertia, motor response, current, latency, traction and backlash. Run the simulation again with those values.
- [ ] Retain the failures and the logs. Simulated passes do not close physical acceptance boxes.
