# 3D sandbox — corrected model and measured simulation results

The sandbox is a design investigation, not firmware or hardware validation. Run `cd tools/living-drawings && npm test`. The [correction record](model-corrections.md) explains the changes; the [original audit](real-world-validation.md) records the earlier baseline.

## Current model

- Rapier 0.20.0, impulse revolute joints, 2 kHz physics/joint updates and 500 Hz outer balance loop.
- Shared geometry and working joint/torque limits. Physical stops on roll, pitch and knee; zero knee angle is allowed for initial assembly, while the servo avoids straight-leg operation.
- Rounded convex tire collision hull with **6-inch diameter × 1.25-inch width**, replacing the 6-inch sphere. Its 256-sided core limits the cylinder solver's artificial rolling acceleration. The free-roll regression permits less than 5% gain over 3 seconds; measured peak is 0.515 m/s from 0.500. This numerical error remains material for precision trajectories.
- Self-contact between separate robot parts enabled. Direct joint neighbors and overlapping trunk/hip mount geometry are excluded. This is an approximate assembly, not a CAD interference check.
- Delayed ideal outer-loop state/contact samples (4 ms default), first-order torque response (2 ms default), and joint output torque-speed roll-off (20 rad/s default). All are adjustable **unmeasured assumptions**. The inner servo still uses ideal current joint state.
- Tire load reports upward normal impulse, ignoring robot self-contact. Contact load and ground-clearance rays are still simulator ground truth; a physical estimator is absent.
- Requested mode is separate from observed support. Single support requires >5% weight on the plant tire, <2% on the free tire, >10 mm free-tire clearance, and 1.55 seconds sustained before the interval indicator qualifies it. This indicator is not a hardware qualification.
- Parking without the proposed skid is refused; translation/yaw commands go to zero and balance stays on. With a skid, the existing experimental crouch/rest sequence remains available. The HUD declares `PARKED` only after a load-bearing skid contact and low body motion are observed. The settling maneuver and contact measurement remain simulated, not a hardware interlock.
- Yaw PI control compensates steady turning resistance with a bounded integral; pitch balance retains priority at wheel saturation.

The mass is 6.12 kg: the 6.00 kg drawing lumps plus four 0.03 kg tubes. These are estimates, not measured mass properties. Tire compliance, backlash, electrical power, battery limits, temperature, contact estimator noise and hardware watchdog behavior remain unmodeled. Displayed motor power is mechanical `torque × speed`, not battery draw.

## Corrected default results, 2026-09-23

| Test | Observed result |
| --- | --- |
| Stationary 92% stance | 1.85 N·m per knee; 16.8-inch hip height; wheel loads sum to weight within 2%. |
| Default 75% ride height | 3.17 N·m per knee; 14.3-inch hip height. |
| Floor drive, turn, reverse, shoves and height changes | Completes; peak lean 10.7°, wheel torque 1.39 N·m, knee torque 6.9 N·m. |
| Floor shove sweep | Recovers through tested 8 N·s forward and 5 N·s sideways; larger tested impulses fail. |
| Half-inch threshold at 0.5 m/s | Crosses. |
| One-inch threshold | Falls at 0.3, 0.5, 0.75 and 1.5 m/s; crosses at 1.0 m/s. Knee demand reaches the 12 N·m cap. |
| Park without skid | Refused, remains balancing. |
| Park with proposed skid | Rests near −17° and stands back up. |
| Left/right poise request | Enters and returns to two-wheel mode without falling. The sampled free-wheel load ranges 3–24% in the left trial, so this is not single support. |
| Experimental full lift | Falls. |
| 9.5-inch stairs / descent | No working controller; not passed. |

The floor-driving regression now removes course fixtures. Previously it approached the stair during a supposed flat-floor arc; differences in forward speed changed whether it hit the fixture. Obstacle trials retain the course and report every outcome separately.

## Interpretation

Passing the regression suite means the model preserves its stated invariants and baseline floor functions. It does not mean every capability trial passed. In particular, the historical sphere model's successful 0.5/0.75 m/s one-inch sill crossings have **regressed under the corrected physical assumptions**. The code reports those failures instead of asserting the old capability.

The full-lift controller remains experimental and off by default. A two-contact poise cannot establish sustained hip-roll torque, tire stability or controllability on one wheel. Select no actuator from a transient peak or a stall rating. Match the exact motor, driver, reduction and 4S bus, including thermal duty, regeneration and low-voltage behavior, then replace the assumed drive limits with measurements.
