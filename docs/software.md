# V1-PROOF software

Use a conventional two-wheel balance controller on the selected Pico 2 in C/C++, or a qualified equivalent reused MCU. First pin both legs. Adapt a known, license-compatible controller pattern: IMU attitude estimate, inner pitch stabilization, slower wheel-speed/position correction, and limited differential steering. The host-side simulation uses a fixed four-state LQR, a bounded position reference and differential yaw feedback. It is not installed firmware.

No ROS, pathfinding, camera stack or gait controller is necessary. The [Previous stack](archive/stair-v1/software.md) is parked.

## How the intelligence works

**The onboard brain of V1-PROOF is the selected Pico 2 with a fast feedback controller**. The controller will continually measure the direction in which Hux falls. Then it will roll the wheels under the body to recover the balance. A human supplies the requested speed and turn. The first proof depends on reliable sensor data, timing and fault response. Conversational AI, vision and autonomous navigation are future additions.

| Job | Planned owner | What it does |
| --- | --- | --- |
| Sense and estimate | Pico 2 + LSM6DSO IMU + wheel encoders | Combine gyro/accelerometer measurements into pitch/rate; use signed wheel counts for travel and speed. Calibrate biases and reject acceleration artifacts. |
| Balance and drive | Pico 2 control loop | Correct pitch, then track bounded travel/turn requests. Feed the two wheel drivers with PWM/direction while reserving authority for balance. |
| Move the legs | Pico 2 + ST3215 internal controllers | After pinned-leg balance passes, send slow, coordinated position requests and read back servo feedback through the TTL bus. |
| Supervise operation | Pico 2 + independent hardware kill/watchdog | Require deliberate arming; check command age, sensor age, loop timing, tilt, supply and current; latch a fault when limits are violated. |
| Operator and evidence | Existing laptop/gamepad, later qualified RC link | Request motion, show/log telemetry and record tests. A laptop connection supplies commands and logs; the fast balance loop runs onboard. |
| Future perception/AI | Companion computer, not selected for V1-PROOF | Interpret cameras or higher-level goals and send bounded speed/yaw requests through the same command contract. The MCU keeps final authority over motion limits and faults. |

At the initial **500 Hz target**, the Pico 2 will do these steps approximately every 2 ms: read the latest timestamped sensors, estimate the state, calculate a correction, check the limits and update both wheel commands. A forward lean calls for a controlled wheel response to recover the body. Differential left/right commands turn it. Sensor freshness and the real motor response matter as much as the requested loop frequency. The 833 Hz IMU output rate and the ≤6 ms estimator-age/≤10 ms drive-lag targets remain measurements to prove on hardware.

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

**Implemented today:** host-side dynamics simulation, controller experiments, regression checks and the living drawings. **Still to build:** embedded firmware, real IMU fusion/calibration, encoder acquisition, device drivers, operator protocol, fault supervision and physical tuning. [The firmware directory](../firmware/README.md) currently records this absence. Simulation gains and successful simulated trials are initial evidence, not flashed code or measured robot performance.

The purchase locks the control interfaces to the Pololu 4752 gearmotors, the DRV8874 drivers (Pololu 4035) and the ST3215 servos on the 12 V bus. One wheel gearmotor and the drivers are received. The total driver count is not yet confirmed. Both leg servos are ordered, and the second wheel gearmotor is still necessary. The Pico 2 is received, untested. The LSM6DSO IMU is received, untested.

The LSM6DSO IMU replaces the earlier LSM6DSOX selection. The sensor qualification and the TTL interface remain open. Start with [USB/LED checks](checklists/2026-10-03-pico-bringup.md), readback and small supported bench motions. Then pin both legs, then do balance and manual travel, and finally qualified height adjustment. Refer to [electrical connections](electronics.md) and the [ordered hardware baseline](v1-proof-hardware.md).

## Minimal control contract

- Initial target: a 500 Hz measured estimator/control loop, IMU SPI/data-ready acquisition at 833 Hz, a measured sensor/estimator age ≤6 ms and an effective drive lag ≤10 ms. Telemetry and manual input are slower. Establish the timing on the actual board. Do not treat a requested frequency as measured performance.
- Inputs: timestamped pitch/rate, both signed encoder speeds, battery voltage, motor current/faults and manual commands. We add leg angle feedback for powered height motion.
- Outputs: bounded wheel PWM/direction with driver enable and hardware current limit. Bounded servo positions/rates come later. A PWM command is not measured motor torque.
- Give pitch recovery priority over yaw and forward speed. Use saturation management, rate limits, integrator limits, measured deadband compensation and conservative gains.
- Log pitch, wheel speeds, commands, currents, voltage, active mode, loop timing and fault reasons to a laptop on hand. Onboard storage/Wi-Fi is optional.

## Modes

| Mode | Meaning |
| --- | --- |
| `DISARMED` | Wheel drive disabled; robot on rest support or in catch fixture |
| `BALANCE` | Two-wheel pitch balance; zero travel command; pinned or qualified fixed leg pose |
| `DRIVE` | Same balance loop with bounded manual speed/yaw |
| `FAULT` | Drive inhibited, reason latched, deliberate rearm required |

These conditions must start the tested fault response: a stale manual command (>250 ms), a stale critical sensor, missed control deadlines, a low battery, excessive tilt/current or a manual kill. Do a test of the cut behavior in the catch frame. Removal of the drive cannot keep an inverted pendulum upright. Do not automatically rearm after link recovery or reboot. Define the sensor-age and angle/current limits during supported bench qualification.

## Height changes later

On the robot that balances freely, start height adjustment only in `BALANCE`, at zero travel command. Command both legs together slowly and ramp the gains/trim against the measured height and CoM. The linkage moves the axles fore/aft as well as vertically. The chassis pitch setpoint will change.

Wheel rotation alone does not remove the static CoM offset. Confirm the range and the thermal behavior before you enable repeated height cycles. No `LEFT_ONLY`, `RIGHT_ONLY`, stair mode or autonomous motion.

Keep the estimator/controller code independent of the hardware adapter when practical, but do not build an unused four-layer framework first. PID code that exists needs a license review before you copy it. This revision adds host-side 3D simulation and controller tests. We implemented no MCU firmware.

The simulated pitch input is a delayed/bias/noise attitude estimate, not a raw-IMU fusion implementation. Confirm the filter and the acceleration rejection on the real IMU before you use the simulated gains. [Bring-up checklist](checklists/software-bringup.md).

## Supported bench controls

Before balance, a dedicated `BENCH_ARMED` state can operate one leg and one lifted wheel on a rigid fixture. The [bench plan](one-leg-bench.md) defines small motion bounds, zero/sign calibration, command expiry, independent actuator arming, logs and fault tests. It needs no balance loop or IMU. This is a proposed implementation, not firmware that works.

Distinguish a healthy software stop from a torque disable. In the DRV8874 PH/EN mode, `EN=0` brakes while `SLEEP=0` makes the outputs high impedance. A loss of servo communication must start the verified actuator-power cut. A silent bus does not guarantee that the torque is off. The fixture must support the leg after a power loss. All reconnects and resets need a deliberate rearm.

## Mobility contract and next-version interface

Use 0.25 m/s cruise and 0.15 m/s on qualified uneven fixtures. Use 0.35 m/s² speed ramps, 0.4 rad/s arc and 0.6 rad/s pivot commands, with 1.2 rad/s² yaw ramps. Pitch correction keeps torque priority. The catch speed can reach 0.65 m/s in the clear fixture. The 0.5 m/s manual speed remains unqualified. Never clamp the balance torque only to obey a comfort speed limit without a tested fault transition.

The first synthetic sweep exposed drift from millimeter-scale CoM error. We checked stronger position feedback against the same quantitative endpoint gates. Keep the actual position/heading errors and failures, not only the upright-time counters. Refer to the [simulation report](v1-proof-simulation.md) and the [physical protocol](v1-proof-validation.md).

Define versioned SI-unit commands and telemetry with sequence numbers, monotonic timestamps, sensor age, attitude/rates, signed encoder counts, voltage/current, leg feedback, saturation and fault reason. A later companion/camera stack can send bounded commands. It cannot own balance, hard kill or watchdog. Measured actuator/estimator models and retained regression cases are the useful carryover to V2.
