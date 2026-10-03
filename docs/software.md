# V1-PROOF software

Use a conventional two-wheel balance controller on the selected Pico 2 in C/C++, or a qualified equivalent reused MCU. First pin both legs. Adapt a known, license-compatible controller pattern: IMU attitude estimate, inner pitch stabilization, slower wheel-speed/position correction, and limited differential steering. The host-side simulation uses a fixed four-state LQR, bounded position reference and differential yaw feedback; it is not installed firmware. No ROS, pathfinding, camera stack or gait controller is required. [Previous stack](archive/stair-v1/software.md) is parked.

## How the intelligence works

**V1-PROOF's onboard brain is the selected Pico 2 running a fast feedback controller.** It will continually measure which way Hux is falling and roll the wheels underneath the body to recover balance. A human supplies the requested speed and turn. The first proof depends on reliable sensing, timing and fault handling; conversational AI, vision and autonomous navigation are future additions.

| Job | Planned owner | What it does |
| --- | --- | --- |
| Sense and estimate | Pico + LSM6DSO + wheel encoders | Combine gyro/accelerometer measurements into pitch/rate; use signed wheel counts for travel and speed. Calibrate biases and reject acceleration artifacts. |
| Balance and drive | Pico control loop | Correct pitch, then track bounded travel/turn requests. Feed the two wheel drivers with PWM/direction while reserving authority for balance. |
| Move the legs | Pico + ST3215 internal controllers | After pinned-leg balance passes, send slow, coordinated position requests and read back servo feedback through the TTL bus. |
| Supervise operation | Pico + independent hardware kill/watchdog | Require deliberate arming; check command age, sensor age, loop timing, tilt, supply and current; latch a fault when limits are violated. |
| Operator and evidence | Existing laptop/gamepad, later qualified RC link | Request motion, show/log telemetry and record tests. A laptop connection supplies commands and logs; the fast balance loop runs onboard. |
| Future perception/AI | Companion computer, not selected for V1-PROOF | Interpret cameras or higher-level goals and send bounded speed/yaw requests through the same command contract. The MCU keeps final authority over motion limits and faults. |

At the initial **500 Hz target**, about every 2 ms the Pico will read the latest timestamped sensors, estimate state, calculate a correction, check limits and update both wheel commands. Leaning forward calls for a controlled wheel response to recover the body; differential left/right commands turn it. Sensor freshness and the real motor response matter as much as the requested loop frequency. The 833 Hz IMU output setting and ≤6 ms estimator-age/≤10 ms drive-lag targets remain measurements to prove on hardware.

```text
Human speed / turn request -> bounded command + deadman
                                       |
IMU + encoders -> state estimate -> Pico balance / drive controller
                                       |
                             PWM + direction -> DRV8874 -> wheels
                                       |
                       slow height request -> TTL interface -> ST3215

Voltage / current / faults / timestamps -> supervisor -> drive permission
Physical kill + hardware watchdog ------------------> actuator disable
```

**Implemented today:** host-side dynamics simulation, controller experiments, regression checks and the living documentation. **Still to build:** embedded firmware, real IMU fusion/calibration, encoder acquisition, device drivers, operator protocol, fault supervision and physical tuning. [The firmware directory](../firmware/README.md) currently records this absence. Simulation gains and successful simulated trials are starting evidence, not flashed code or measured robot performance.

The purchase locks the control interfaces to Pololu 4752 encoder wheel motors, Pololu 4035 wheel drivers and ST3215 12 V bus servos. One wheel motor and drivers are received, with total driver count pending; both leg servos are ordered and the second wheel motor is still required. The Pico 2 is received, untested. The SparkFun LSM6DSO is received, untested, replacing the earlier LSM6DSOX selection; sensor qualification and the TTL interface remain open. Start with [USB/LED checks](checklists/2026-10-03-pico-bringup.md), readback and small supported bench motions, then both legs pinned, then balance and manual travel, and finally qualified height adjustment. See [electrical connections](electronics.md) and the [ordered hardware baseline](v1-proof-hardware.md).

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

On the freely balancing robot, start height adjustment only in `BALANCE`, at zero travel command. Command both legs together slowly and ramp gains/trim against measured height and CoM. The linkage moves the axles fore/aft as well as vertically; chassis pitch setpoint will change. Wheel rotation alone does not remove the static CoM offset. Verify range and thermal behavior before enabling repeated height cycles. No `LEFT_ONLY`, `RIGHT_ONLY`, stair mode or autonomous motion.

Keep the estimator/controller code independent of the hardware adapter when practical, but do not build an unused four-layer framework first. Existing PID code needs license review before copying. This revision adds host-side 3D simulation and controller tests; no MCU firmware has been implemented. The simulated pitch input is a delayed/bias/noise attitude estimate, not a raw-IMU fusion implementation. Confirm filtering and acceleration rejection on the real IMU before using simulated gains. [Bring-up checklist](checklists/software-bringup.md).

## Supported bench controls

Before balance, a dedicated `BENCH_ARMED` state may operate one leg and one lifted wheel on a rigid fixture. The [bench plan](one-leg-bench.md) defines small motion bounds, zero/sign calibration, command expiry, independent actuator arming, logs and fault tests. It needs no balance loop or IMU. This is a proposed implementation, not working firmware.

Distinguish healthy software stop from torque disable. In DRV8874 PH/EN mode, `EN=0` brakes while `SLEEP=0` makes outputs high impedance. Loss of servo communications must invoke the verified actuator-power cut; a silent bus does not guarantee torque off. The fixture must support the leg after power loss. All reconnects and resets require deliberate rearm.

## Mobility contract and next-version interface

Use 0.25 m/s cruise, 0.15 m/s on qualified uneven fixtures, 0.35 m/s² speed ramps, 0.4 rad/s arc and 0.6 rad/s pivot commands, with 1.2 rad/s² yaw ramps. Pitch correction retains torque priority; catch speed may reach 0.65 m/s in the clear fixture. The 0.5 m/s manual setting remains unqualified. Never clamp the balance torque merely to obey a comfort speed limit without a tested fault transition.

The first synthetic sweep exposed drift from millimeter-scale CoM error. Stronger position feedback was checked against the same quantitative endpoint gates. Retain actual position/heading errors and failures, not only upright-time counters. See [simulation report](v1-proof-simulation.md) and [physical protocol](v1-proof-validation.md).

Define versioned SI-unit commands and telemetry with sequence numbers, monotonic timestamps, sensor age, attitude/rates, signed encoder counts, voltage/current, leg feedback, saturation and fault reason. A later companion/camera stack may send bounded commands; it cannot own balance, hard kill or watchdog. Measured actuator/estimator models and retained regression cases are the useful carryover to V2.
