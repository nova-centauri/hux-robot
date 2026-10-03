# V1-PROOF software checklist

**2026-10-03:** the Pico 2 is received, untested. Begin the [board-only USB/LED checklist](2026-10-03-pico-bringup.md). The received SparkFun LSM6DSO replaces the earlier LSM6DSOX selection; sensor firmware and qualification remain pending.

- [ ] Blink/log on the available board; identify exact firmware/toolchain and license choices.
- [ ] Calibrate and timestamp IMU; read signed wheel encoders and battery/current feedback.
- [ ] Measure 500 Hz control-loop timing under maximum intended logging and input load.
- [ ] Implement `DISARMED`, `BALANCE`, `DRIVE`, latched `FAULT` and deliberate rearm.
- [ ] Test stale commands (>250 ms), stale critical sensors, deadlines, reset and manual kill in the supported fixture.
- [ ] Adapt conventional balance control; verify polarity at low power before enabling closed loop.
- [ ] Tune pinned-leg balance, then bounded speed/yaw with saturation protection.
- [ ] Log physical trials and compare against the [finish line](../v1-proof.md#finish-line).
- [ ] Measure pose-dependent pitch trim, then add slow synchronized leg commands in `BALANCE`.
- [ ] Complete the ten-minute mixed session and retain faults/current/voltage/timing logs.

No firmware implementation or hardware pass is implied by the model's host-side tests.

## Revision B mobility gates

- [ ] Follow the [selected hardware and interface decisions](../v1-proof-hardware.md).
- [ ] Complete the [physical mobility/disturbance protocol](../v1-proof-validation.md), including reverse travel, both arcs, both pivots, pulses and uneven fixtures.
- [ ] Record measured CoM/inertia, motor response, current, latency, traction and backlash; rerun the simulation with those values.
- [ ] Retain failures and logs; simulated passes do not close physical acceptance boxes.
