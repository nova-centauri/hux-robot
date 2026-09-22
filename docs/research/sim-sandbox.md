# 3D sandbox — first pass

Written **2026-09-22**. Steve asked for a new panel in the living drawings: a three.js 3D view of the robot with simple controls, "almost like a video game", but with real physics and kinematics, as a first pass to start fleshing out the design.

The tool: [`tools/living-drawings/sim.html`](../../tools/living-drawings/sim.html) (the "3D sandbox" tab). `cd tools/living-drawings && npm install && npm test` runs the 2D self-test and the sandbox self-test and prints the findings below.

**Nothing here is a decision.** It is the same working model as the 2D drawings, pushed through a rigid-body engine. The findings say where the design is thin. Steve decides what to do about them.

## Flags — where this rubs against what is on file

- **Simulation is not a V1 job** ([`../software.md`](../software.md), "Explicitly not started"; digital twin is a horizon in [`../decisions.md`](../decisions.md)). This sandbox is a design toy in the living drawings, the same class as the 2D climb. It is **not** the digital twin, not a training dojo, and not a V1 gate. The twin still waits for CAD (Stompy lesson).
- **2D before Blender (R23).** The 3D robot is not CAD. It is built only from the 2D numbers in `kin.js` (links, wheel, body box, motor envelopes). No new geometry was invented except the parking skid below, which is off by default and labelled a proposal.
- **The engine is game-grade.** Rapier is a good real-time engine, not MuJoCo. Fine for "where does it break". Not good enough to tune a real controller against. When the twin phase comes, export the same model to MJCF/URDF.

## What it models

| Piece | How |
| --- | --- |
| Robot | Body box 8" × 7" × (6" above, 1" below the hips), two hip yokes, four 7.5" carbon tubes, two 6" wheels. Same lumps as `kin.js`: body 4.0 kg, hip actuators 0.4 kg per side, knee actuator 0.25 kg at the knee, wheel 0.35 kg with J = 0.65 m R². Plus 30 g per tube. **6.12 kg.** |
| Joints | Hip roll (fore-aft axis, 5.4" off the centreline), hip swing, knee (folds to the rear), wheel. Revolute joints. |
| Actuators | Every joint is a torque with a peak limit, applied equal and opposite to the two bodies. Leg joints: position servo at 2 kHz (like a servo drive). Wheels: torque falls linearly to zero at the 4S no-load speed (default 40 rad/s ≈ 3 m/s). PARKED shorts the wheel phases: braking torque proportional to speed. |
| Balance | LQR on the lean of the mass over the axle (states: position, speed, lean, lean rate), rebuilt from the live lump positions as the legs change height, 500 Hz. Hip kept over the axle in the body frame. Leg length difference levels the body in roll. Yaw by differential torque, balance gets priority when a wheel saturates. |
| Sensing | Body attitude and rate, joint angles, wheel speed, plus the lump-mass model. Ground-truth values: no noise, no delay yet. |
| World | 9.5" × 9.5" stair with 1" nosing (four steps), 1:12 ramp, 12° ramp, ½" and 1" thresholds, 2" curb, wet tile (μ 0.15), loose crates. |

Engine workarounds, each checked by `sim-test.js` so a Rapier upgrade that fixes them is noticed:

- Rapier 0.20 **multibody** joints pass only **~37%** of a torque added to a link. The robot uses impulse joints, which pass it exactly.
- Rapier **cylinder** colliders gain speed when free-rolling (0.50 → 0.60 m/s in 3 s). The tire's contact shape is a 6" **sphere**, drawn as a tire. It rolls exactly and has the right profile for steps and nosings. Sideways it rocks on a 3" radius instead of a ~0.6" crown, which makes one-wheel balance somewhat easier than the real tire would.
- Rapier reports contact impulse inflated by **(n + 1)/n** for n solver iterations. Corrected; wheel loads now sum to the weight within 2%.

Not modelled yet: reflected rotor inertia through gearboxes, backlash, belt stretch, tube flex, spring legs, battery sag, sensor noise and latency. No stair-climb controller: the stair is there to drive up to.

## Findings, settled geometry, default knobs

| Check | Result |
| --- | --- |
| Stance knee torque, two legs | **1.9 N·m** per knee. [`leg-geometry.md`](leg-geometry.md) says ~2.2 at 6 kg; same number within the lump split. Good cross-check. |
| Drive at 1 m/s (1.2 m/s² ramp) | Peak lean **10.7°**, peak wheel torque **1.6 N·m** of 3. Flat-floor driving is not the wheel sizing case. |
| Corner, 1 m/s at 1.5 rad/s | Wheel loads **18 / 43 N** (30 / 70%). No lean into the turn yet; hip roll could do it. |
| Shoves, 2 N·s front, back, side | Recovers from all. |
| Crouch to 55% leg | Knee **4.1 N·m** per leg. |
| ½" threshold | Crosses at 0.5 m/s. |
| **1" threshold** | **Crosses only near 1 m/s.** 0.3–0.75 m/s: the tire spins on the edge, the lean runs away, it falls. 1.5 m/s: the hit saturates the 12 N·m knee and it falls. The knee saturates at every speed. |
| **PARKED, as designed** | **No rest pose.** Crouch, brake the wheels, tip back: the knee housings land with the mass right over them (hand check: both ~9" behind the axle at the 55% crouch), and it rolls onto its back. |
| PARKED with the rear skid (proposal) | Rests at 15° back on wheels and skid, and stands back up on TWO_WHEEL. |
| **LEFT_ONLY / RIGHT_ONLY** | Shifting the mass over one wheel with hip roll works (~27° of roll at stance height). Holding balance on one wheel does not yet: it falls ~0.6 s after the free wheel lifts. Holding torque on the planted hip roll is **~9 N·m**, matching the 9.5 N·m in `leg-geometry.md`. |

## Judgement calls

1. **The 1" threshold is a design problem, not a tuning problem.** A driven wheel of radius R climbs an edge of height h on traction alone only if μ ≥ tan α, with cos α = (R − h)/R. For the 6" wheel: ½" needs μ 0.66 (the tire has 0.7), 1" needs **μ 1.12**. So a 1" sill needs momentum, a stickier tire, or a lifted wheel. Momentum works in a narrow band here and then the knee saturates on the hit. That argues for **real compliance in the legs** (R7 springs, not stiff servos) and for treating sills as a small version of the stair skill: lift the wheel. Measure real door sills in the house before deciding how much this matters. Do not grow the wheel: 6" is settled for the stair slot.
2. **PARKED needs somewhere to sit.** R14 defines PARKED as no balance loop driving the wheels. Without a support the robot can only lie down, and the knee housings are not a support because the mass lands over them. Options: a rear skid or tail (what the sandbox tries: a strut to a point ~9.4" behind and ~9.1" below the hip axes, on the centreline), a fold-down kickstand, or a sit pose that brings the body down onto a pad. **Steve's call.** The skid is off by default.
3. **One-wheel balance: my controller, not a verdict.** The sandbox's sideways LQR (planted leg + body as a two-link model through the hip roll) matches the engine's accelerations but does not hold yet. Treat it as unsolved, not as "impossible". One real concern it surfaced: the body's mass sits *beside* the hip-roll axis, roughly level with it, not above it. Hip roll then moves the mass mostly up and down, and only moves it sideways by tipping the leg. Worth keeping in mind when the 2D layouts place the hip roll axis and the pack.
4. **Hip roll sizing holds up.** Two independent routes (the 2D climb and this sandbox) put the one-wheel holding torque at 9–9.5 N·m for 6 kg. GIM8108-class nominal (7.5) is under it, stall (22) is over it.

## Next, when Steve wants it

- Port the `kin.js` stair climb into the sandbox as joint trajectories plus the wheel catch, and see whether the ±6% throw window survives real contacts.
- Spring legs (a parallel spring on the knee) and see what the 1" sill does.
- Sensor noise and a few ms of latency on the balance loop.
- Reflected rotor inertia on the leg joints once an actuator class is picked.
- Keep working the one-wheel controller.
- When the twin phase comes: export the same model to MJCF/URDF for MuJoCo.
