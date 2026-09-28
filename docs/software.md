# V1-PROOF software

Use a conventional two-wheel balance controller on the available suitable MCU. First pin both legs. Adapt a known, license-compatible controller pattern: IMU attitude estimate, inner pitch stabilization, slower wheel-speed/position correction, and limited differential steering. No ROS, pathfinding, camera stack, novel gait controller or digital twin is required. [Previous stack](archive/stair-v1/software.md) is parked.

## Minimal control contract

- Initial target: 500 Hz measured IMU/control loop; slower telemetry and manual input. Establish timing on the actual board instead of treating a requested frequency as measured performance.
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

Keep the estimator/controller code independent of the hardware adapter when practical, but do not build an unused four-layer framework first. Existing PID code needs license review before copying. This revision adds planning/calculation code only; no MCU firmware has been implemented. [Bring-up checklist](checklists/software-bringup.md).
