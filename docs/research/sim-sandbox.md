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
| Actuators | Every joint is a torque with a peak limit, applied equal and opposite to the two bodies. Leg joints: position servo at 2 kHz (like a servo drive); since the second pass, a virtual spring-damper along each leg (below). Wheels: torque falls linearly to zero at the 4S no-load speed (default 40 rad/s ≈ 3 m/s). PARKED shorts the wheel phases: braking torque proportional to speed. |
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

## Second pass — ride height, suspension, stumbles, one wheel (2026-09-23)

Steve, after driving it: the sandbox rides too tall; he wants control of ride height and a **medium stance by default** for a lower CoG; more forgiveness on small bumps, with **leg suspension** and an **active lift on impact** if the loop is fast enough; **better stumble recovery**; and one-leg standing **planned and coordinated**, because the free leg kicked out wildly as it lifted.

### Flags — where this rubs against what is on file

- **Medium ride vs the 92% stance.** [`leg-geometry.md`](leg-geometry.md) and the stair climb use a **92%** balance stance (hip 16.8" off the floor). The sandbox now **drives at 75%** by default (14.3"). This is a sandbox driving default, not a geometry change: `kin.js`, the drawings, the stair climb and the one-wheel poise still use 92%. If Steve wants 75% as the robot's design driving stance, that is a decision to log. Cost: the knee lever grows, so two-leg knee holding goes **1.8 → 3.2 N·m** (one leg at 75% would be ~6.3, still under the ~10.6 stair number).
- **Suspension picks a side of "servo vs stepper TBD".** The legs are now a virtual spring-damper made by torque control through the leg Jacobian. A real Hux can only do that with **torque-controlled, backdrivable joints** (FOC / QDD class) or with **real springs** (R7). A hobby position servo or a stepper+belt cannot. The impact hop needs the same, plus bandwidth. This is not a decision, but it is the first hard requirement the sandbox has put on the knee and hip-swing actuator class. **Steve's call.**
- **Is the loop fast enough?** Yes, easily. A 1" edge at 1 m/s is in contact for ~57 ms; the 500 Hz balance loop sees ~28 samples and the 2 kHz joint loop ~110. The limit is the actuator and gearbox, not the loop.

### What changed

| Piece | Now |
| --- | --- |
| Ride height | Default **75%** (medium). Low 62 / Medium 75 / High 92 presets, a slider, and Q / E. |
| Legs | Virtual spring-damper along hip-to-axle, **3.5 Hz, ζ 0.6**, with a gravity feed-forward from where the mass sits between the wheels (no sag), and active roll damping. Leg angle held stiff. Knobs on the page. |
| Impact reflex | A loaded leg that shortens faster than asked (> 0.35 m/s) at speed (> 0.4 m/s) **hops**: pulls the wheel up ~1.8" for ~0.1 s with the leg briefly pulling, then the spring catches the body. Encoders only. |
| Stall hop | At walking pace an edge just stops the wheel. Speed that collapses after tracking the reference, for 20 ms, hops the stopped, loaded wheel. |
| Stumble catch | Fore-aft: when the capture point runs past the axle by more than 3 cm, both legs swing the axles under it (fast in, slow out). Sideways: both hip rolls step the wheels out under the fall and the leg on that side pushes long. |
| One wheel | Planned sequence: **stand tall and stiffen → shift the mass over the planted wheel → poise** with ~15% left on the other wheel → centre. All paths minimum-jerk or rate limited. A shove that pushes the free-wheel load out of band bails out to two wheels. Full lift is behind an experimental switch, off. |

### Findings (`npm test`, default knobs)

| Check | Before (first pass) | Now |
| --- | --- | --- |
| Hip height, standing | 16.8" (92%) | **14.3"** (75%) |
| Knee holding, two legs | 1.9 N·m | **3.2 N·m** (longer lever) |
| Wheel loads, 1 m/s at 1.5 rad/s | 18 / 43 N | **23 / 37 N** (lower CoG) |
| Biggest shove ridden out, forward / back | 10 / 9 N·s | **11 / 11 N·s** |
| Biggest shove ridden out, sideways | 3 N·s | **5.5 N·s** at 75% (5 at 92%). Without the catch: 3.75 at 75%, 3.25 at 92% |
| **1" threshold** | crosses only at **1.0 m/s** | crosses at **0.5, 0.75, 1.0 m/s** |
| 1" threshold at 0.3 / 1.5 m/s | falls | still falls (see below) |
| 2" curb | falls | still falls |
| False hops, hard driving (±2.5 m/s, 3 rad/s turns) | — | none on a flat floor; one real hop landing after a wheel left the floor in a 3 rad/s turn |
| One wheel | lifts, then kicks and falls | **poise**: settles in ~4 s, free wheel 15–18% of weight, body roll ~0.1°, planted hip roll **3.3 N·m**; left, right, ±30% mass, CoM −1" to +2", 10 N·m roll limit all pass and come back to two wheels |
| One wheel, shoved | — | forward 3 N·s ok; inward 2 N·s ok (bails out); **outward over 1 N·s falls** |
| One wheel, free wheel fully off the floor | falls ~0.6 s after lift | **still not held**; experimental switch, usually falls |

### Judgement calls

1. **The wild kick was a bug, not the design.** The sideways balancer solved for its balance point from the lump model and was **~4° off**. On its first tick it slammed the planted hip roll to −15 N·m, which drove the free wheel into the floor (138 N spike) and flung the body and free leg over. Fixes: a bumpless handover (the pose at handover is the balance point, the servo's torque is the holding torque), a planned sequence, and a leg-roll rate taken from the same measurement as the leg-roll angle.
2. **Lower is better sideways, not free fore-aft.** At 75% the side-shove margin and turn load transfer both improve, as Steve expected. Fore-aft, a shorter pendulum falls faster (`ω ≈ √(g/l)`), so the wheel loop has less time. The LQR absorbs it here (fore-aft margin did not drop), but a real motor with less bandwidth would feel it first. 75% is a good default for driving; stairs and one-wheel work want the tall stance, and the sequence goes tall on its own.
3. **Suspension plus a hop is the right answer to small sills, within limits.** A driven 6" wheel cannot climb a 1" edge on traction (needs μ ≈ 1.1). Soft legs let the body keep going; the hop lifts the wheel onto the edge. It works from 0.5 to 1.0 m/s. At 0.3 m/s the hop lifts the tire high enough but the robot has too little momentum to carry it forward, and swinging the leg forward only pitches the body back. At 1.5 m/s the robot is still accelerating (9° lean) when it hits and the extra lean takes it over. 2" is past what a 1.8" hop clears.
4. **Encoder-only impact sensing only works at speed.** At walking pace a sill hit looks the same as pulling away or crouching (leg compression ~0.26 m/s either way, leg whip ~1.3 rad/s). Above ~0.75 m/s a hit is clearly separable (0.6+ m/s vs 0.27). The stall hop covers the slow case. A load cell or motor-current sensing in the knee would do better; not modelled.
5. **Body pitch is not controlled.** The legs are held at an angle *to the body*, and the body's own pitch is whatever falls out. It showed up twice: the slow-sill step and the leg catch both pitch the body instead of moving the wheel. A wheeled biped usually closes a loop on body pitch through the hip (Ascento / Diablo do). That is the next controller change worth making, before the stair port.
6. **One wheel with the free wheel off the floor is still the open item**, and now it is a well-defined one. With both wheels down the poise is solid. Once the free wheel leaves the floor, the only actuator for sideways balance is the planted hip roll, and the body's mass sits beside that axis, not above it. As the free leg comes up, the body rolls toward the free side and the free wheel comes back down. This is an underactuated (acrobot-like) problem with a small margin. Options, none decided: use the **free leg as a counterweight** (a second actuator for sideways balance; this is what people do on one foot); put the pack's CoM **above** the hip-roll axis rather than beside it; a wider or flatter tire crown; or treat single support as **dynamic** (a short phase while rolling, as in the stair climb) rather than a static stand. For the stairs, the question to answer first is whether static one-leg standing is needed at all.
7. **Hip roll sizing still holds**, with better numbers: the poise needs ~3.3 N·m on the planted hip roll, and the previous ~9 N·m one-wheel figure was for the full lift. GIM8108-class nominal (7.5) covers the poise, not the full lift.

## Next, when Steve wants it

- Port the `kin.js` stair climb into the sandbox as joint trajectories plus the wheel catch, and see whether the ±6% throw window survives real contacts.
- Close a loop on body pitch through the hip swing (judgement call 5), then revisit the slow sill and the leg catch.
- Free leg as a sideways counterweight for the one-wheel lift (judgement call 6).
- Sensor noise and a few ms of latency on the balance loop.
- Reflected rotor inertia on the leg joints once an actuator class is picked.
- When the twin phase comes: export the same model to MJCF/URDF for MuJoCo.
