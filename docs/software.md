# V1-PROOF software

Use a conventional two-wheel balance controller on the selected Pico 2 in C/C++, or a qualified equivalent reused MCU. First pin both legs. Adapt a known, license-compatible controller pattern: IMU attitude estimate, inner pitch stabilization, slower wheel-speed/position correction, and limited differential steering. The host-side simulation uses a fixed four-state LQR, bounded position reference and differential yaw feedback; it is not installed firmware. No ROS, pathfinding, camera stack or gait controller is required. [Previous stack](archive/stair-v1/software.md) is parked.

## Minimal control contract

- Initial target: 500 Hz measured estimator/control loop, IMU SPI/data-ready acquisition at 833 Hz, measured sensor/estimator age ≤6 ms and effective drive lag ≤10 ms; slower telemetry and manual input. Establish timing on the actual board instead of treating a requested frequency as measured performance.
- Inputs: timestamped pitch/rate, both signed encoder speeds, battery voltage, motor current/faults and manual commands. Leg angle feedback is added for powered height motion.
- Outputs: bounded wheel PWM/direction with driver enable and hardware current limiting; bounded servo positions/rates later. PWM command is not measured motor torque.
- Give pitch recovery priority over yaw and forward speed. Use saturation handling, rate limits, integrator limits, measured deadband compensation and conservative gains.
- Log pitch, wheel speeds, commands, currents, voltage, active mode, loop timing and fault reasons to an existing laptop. Onboard storage/Wi-Fi is optional.

## Modes

| Mode | Meaning |
| --- | --- |
| `DISARMED` | Wheel drive disabled; robot on rest support or in catch fixture |
| `BALANCE` | Two-wheel pitch balance; zero travel command; pinned or qualified fixed leg pose |
| `DRIVE` | Same balance loop with bounded manual speed/yaw |
| `FAULT` | Drive inhibited, reason latched, deliberate rearm required |

A stale manual command (>250 ms), stale critical sensor, missed control deadlines, low battery, excessive tilt/current or manual kill must invoke the tested fault response. Test cut behavior in the catch frame: removing drive cannot keep an inverted pendulum upright. Do not automatically rearm after link recovery or reboot. Define sensor-age and angle/current limits during supported bench qualification.

## Height changes later

Start height adjustment only in `BALANCE`, at zero travel command. Command both legs together slowly and ramp gains/trim against measured height and CoM. The linkage moves the axles fore/aft as well as vertically; chassis pitch setpoint will change. Wheel rotation alone does not remove the static CoM offset. Verify range and thermal behavior before enabling repeated height cycles. No `LEFT_ONLY`, `RIGHT_ONLY`, stair mode or autonomous motion.

Keep the estimator/controller code independent of the hardware adapter when practical, but do not build an unused four-layer framework first. Existing PID code needs license review before copying. This revision adds host-side 3D simulation and controller tests; no MCU firmware has been implemented. The simulated pitch input is a delayed/bias/noise attitude estimate, not a raw-IMU fusion implementation. Confirm filtering and acceleration rejection on the real IMU before using simulated gains. [Bring-up checklist](checklists/software-bringup.md).

## Mobility contract and next-version interface

Use 0.25 m/s cruise, 0.15 m/s on qualified uneven fixtures, 0.35 m/s² speed ramps, 0.4 rad/s arc and 0.6 rad/s pivot commands, with 1.2 rad/s² yaw ramps. Pitch correction retains torque priority; catch speed may reach 0.65 m/s in the clear fixture. The 0.5 m/s manual setting remains unqualified. Never clamp the balance torque merely to obey a comfort speed limit without a tested fault transition.

The first synthetic sweep exposed drift from millimeter-scale CoM error. Stronger position feedback was checked against the same quantitative endpoint gates. Retain actual position/heading errors and failures, not only upright-time counters. See [simulation report](v1-proof-simulation.md) and [physical protocol](v1-proof-validation.md).

Define versioned SI-unit commands and telemetry with sequence numbers, monotonic timestamps, sensor age, attitude/rates, signed encoder counts, voltage/current, leg feedback, saturation and fault reason. A later companion/camera stack may send bounded commands; it cannot own balance, hard kill or watchdog. Measured actuator/estimator models and retained regression cases are the useful carryover to V2.
