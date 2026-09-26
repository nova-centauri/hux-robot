# Stair candidate — corrected feasibility status

The 9.5-inch rise × 9.5-inch going remains a design target. **The current candidate is rejected.** The earlier planar momentum window did not establish a working stair gait. See the [sourced audit](real-world-validation.md) and [correction record](model-corrections.md).

## Geometry and balance

`spatial.js` now supplies a single chain for both stair projections: body → hip roll → hip pitch → knee → axle spacer → wheel. It preserves both 7.5-inch links, the 0.975-inch outboard axle offset and joint travel limits. Inverse kinematics returns an achievable pose plus the requested target and its residual. The drawings show misses instead of stretching the links or independently moving the front view.

Whole-robot CoM includes body, hip assemblies, knees and wheels. Gravity moment about a contact and gravity holding demand at a hip are separate quantities. Aligning CoM over the tire does not make hip holding torque zero. The rigid tire support point changes with camber; being within the tire's drawn width is not proof of balance.

At the default settings, 197 of 201 sampled frames fail spatial reach, travel or projected terrain clearance. Maximum axle-target error is about 4.11 inches. The preliminary 2D collision check can reject a pose; passing it does not certify 3D clearance.

## Historical planar reference

The original sagittal path, timing, Jacobian loads and reduced momentum simulation remain available as `referenceClimbFrame`. They help explain why the old candidate fails, but their loads are **not** the loads of the corrected spatial poses.

| Reference result | Implication |
| --- | --- |
| Knee static peak 10.56 N·m; dynamic peak 19.12 N·m | A 12 N·m cap cannot reproduce the requested motion. |
| Hip pitch dynamic peak 6.74 N·m | Requires a verified torque-speed and thermal envelope, not just a peak rating. |
| Wheel peak 4.03 N·m | Exceeds the 3 N·m working cap. |
| 32 rejected shove samples with strict contact checks | The old small-normal-force exception concealed infeasible force allocation. |
| 5.64-second playback cycle | This is requested timing, not demonstrated climb speed. |

Contact feasibility requires nonnegative normal force, `abs(F_tangent) <= μ F_normal`, and available wheel torque. At zero normal force, there is no tangential traction. All reference phases and seams are inspected; the verdict cannot turn green merely because the reduced momentum calculation crests.

Previous recommendations to put the pack 1–2 inches forward, aim toward the rear of the tread, or accept a ±6% throw window are **unvalidated sensitivity studies**. Do not fix the mass layout or buy motors from those results. Increasing torque or friction cannot repair an unreachable mechanism pose.

## Required next design result

A replacement gait must solve both legs together, with body translation/orientation, contact states and finite tire support. Constrain joint travel, 3D self/terrain collision, unilateral contacts, traction, torque-speed, joint velocity, and acceleration continuously, including phase boundaries. Then calculate inverse dynamics for that same trajectory and test feedback recovery under uncertainty.

Before stair trials, demonstrate repeated entry, hold and exit from true single support on a tether. Require the free tire to be clear and unloaded; the current two-contact poise does not pass that gate. Test tread landings and capture from measured position **and velocity** errors. Descent needs its own trajectory, impact and regeneration analysis; ascent does not validate it.

No spatial stair controller or descent controller has been implemented. The sandbox continues to expose experimental behaviors, and reports observed support separately from requested mode.

## Hip-roll rethink (open — R16 still IN V1)

Steve, 2026-09-25: he does **not** like the hip-pivot unload that puts the robot onto one foot. It seems to work poorly. **Do not lift hip roll from V1** (R16). Log the dislike and keep the rethink open.

Bad feel may be the wrong stair trajectory, the two-contact poise, or sim contact, not proof the DOF is useless. One concrete piece of it was found and fixed on 2026-09-25: the one-leg controller pivoted on the hub, and a crowned tire cambered 24° touches the floor an inch from under its hub, so the poise was sitting on its own bail-out threshold ([`sim-sandbox.md`](sim-sandbox.md)). Separate:

1. Need some lateral CoG path to unload a wheel.
2. Is hip roll the cheapest DOF for that path.
3. Is the current stair path asking an infeasible throw — this candidate is already **rejected** above and in [`model-corrections.md`](model-corrections.md).

Worked on 2026-09-26 in [`one-leg-stance.md`](one-leg-stance.md): (1) the lateral path is the parallelogram hip-roll shift, 24.7° at the 92% stance; (2) hip roll is the right DOF for the shift and the poise, and no DOF on this robot gives a static one-wheel *hold* (an acrobot with 2–3 mm of capture region); (3) the stair needs a short flight (≤ 0.3 s from a ±20 mm CoM estimate) from a known inboard margin, not a hold. The planted hip roll holds ~8.3 N·m whenever a wheel is up — the "0 if the sway is done first" above was the tipping moment, not the joint torque.

Decision log: [`../decisions.md`](../decisions.md). Mechanical lock language is unchanged: [`../mechanical.md`](../mechanical.md).
