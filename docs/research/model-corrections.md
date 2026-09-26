# Model corrections — 2026-09-23

Implemented after the [real-world audit](real-world-validation.md). These changes correct the software model and remove unsupported engineering claims. They do **not** complete a physical robot or a working stair gait.

## Implemented

| Problem | Correction |
| --- | --- |
| Side/front views implied different mechanisms | Shared spatial FK/IK in `spatial.js`, including hip roll, axle spacer, both links and joint limits. Requested targets remain visible alongside achievable positions and residuals, including manual wheel requests. |
| CoM was replaced by body translation in the roll view | Body, hips, knees and wheels contribute to whole-robot CoM. The top roll study also uses spatial links and weighted mass. |
| Tipping moment was treated as hip holding torque | Separate whole-robot contact moment and free-body gravity moment of the body plus opposite leg about the planted hip. These are static estimates, not inverse dynamics. |
| Impossible stair playback looked successful | Reach, travel, projected collision, strict unilateral/friction contacts and reference actuator limits feed an explicit rejected/unverified verdict. No result claims dynamically validated stairs. Historical planar loads and plots are labeled as such. |
| Tire was a 6-inch sphere | Rounded convex tire with 6 × 1.25-inch bounds; free-roll numerical error checked. |
| No mechanical stops or robot self-contact | Physical joint stops and self-contact enabled, with explicit joint-neighbor/mount exclusions. |
| Instantaneous drives and sensing | Adjustable outer-loop sample delay, first-order drive response and joint torque-speed limits. Defaults remain assumptions, and sensing remains ideal apart from delay. |
| Turn controller retained steady tracking error | Bounded yaw integral added, with wheel balance authority taking priority. |
| Requested one-wheel mode implied successful support | Actual support uses vertical wheel load and free-wheel clearance; sustained interval is measured separately. Load-transfer timeout no longer forces a handover, and failed gain calculation returns toward support. |
| Parking without a rest support turned balance off | Request refused, motion commanded to zero, active balance retained. With the proposed skid, `PARKED` is reported only when skid load and low body motion confirm rest. Emergency torque cut bypasses drive lag. |
| Documentation overstated motor and gait conclusions | Corrected hip sizing, capture-angle, 4S compatibility, tube-wall and parking statements; retired the planar pack-position and throw-window recommendations as design decisions. |

## Verification

```sh
npm --prefix tools/living-drawings test
node tools/living-drawings/assumption-audit.js
```

The regression suite includes 200 spatial FK/IK cases over both leg sides, 402 shared-projection frames, fixed link lengths, mass/torque translation invariance, unreachable target preservation, zero-load traction rejection, tire bounds, mechanical stops, collision exclusions, sensor age, immediate emergency torque cut, stationary load balance, floor driving/turning/shoves, and parking/return behavior.

Browser verification covered drawing startup and playback, the rejection verdict, simulator startup, and the unsupported-parking message while the robot remained in two-contact balance. No browser console errors were observed.

Saved outputs:

- [Corrected calculations](corrected-assumption-results.json). Historical independent side/front reach is explicitly reconstructed for comparison; `correctedModel` is the current verdict.
- [Corrected regression output](corrected-model-tests.txt).
- [Original baseline calculations](assumption-audit-results.json) and [original baseline tests](assumption-baseline-tests.txt), preserved unchanged.

The old kinematics self-test asserted that its own planar stair animation succeeded. It has been replaced by independent kinematic/Jacobian checks and physical-invariant regressions. The one-inch sill speed sweep remains intact, but records capabilities separately from invariant assertions. **Its 0.5 and 0.75 m/s trials now fail** with the narrower tire and finite drive response. Passing `npm test` does not mean those trials passed.

## Still unresolved

- **True one-wheel hold fails** in the experimental lift trial. The normal request remains a two-contact poise, not a one-wheel qualification.
- **The stair candidate is infeasible:** 197/201 geometry samples fail and the maximum axle-target miss is 4.11 inches. Historical reference peaks of 19.12 N·m knee and 4.03 N·m wheel exceed 12/3 N·m caps. Changing the displayed verdict cannot fix that trajectory.
- **No spatial inverse-dynamics stair planner, stair feedback controller or descent controller exists.** The old path must be replaced and verified against the same spatial mechanism and physical contacts.
- **Hardware validation is outstanding:** measured masses/inertias, exact actuators and reductions, thermal duty, 4S voltage/current/regen limits, tire behavior, mechanical strength, encoder calibration, physical state/load estimation, watchdog and supported-rest interlock.
- **Collision and tire models remain approximations.** The drawing’s circular side silhouette is conservative under camber; projected clearance is not CAD clearance. The tire hull retains about 3% artificial speed gain in the isolated roll trial. As of 2026-09-25 the crown, the mesh and the 2D projection share one profile (`tire.js`) and each tire is a tread ring on a carcass spring, so the flat-shoulder cylinder and the rigid contact are gone; the spring is isotropic and its stiffness is a guess (see [`sim-sandbox.md`](sim-sandbox.md)). The sandbox adds 0.12 kg of tubes to the drawing’s 6 kg lumps.

The next meaningful engineering milestone is a tethered, measured single-support demonstration and a feasible spatial trajectory. There is no evidence yet to approve fabrication from the stair animation or select motors from its historical load peaks.
