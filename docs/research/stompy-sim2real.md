# Stompy — CAD → sim → real

Steve 2026-09-21: analyze [I Trained a Robot in Simulation. Then I Made It Walk.](https://www.youtube.com/watch?v=gEjg179fvmc) (Kayden Knapik — **Stompy**). Especially **simulations and matching CAD to reality**.

Stompy is a **week-build RL walking biped**. Hux is a **wheeled** biped. Walking challenges differ. **Still learn** the CAD / home-pose / geometry lessons. **Do not require RL walking for Hux V1.** Keep **reuse simple balance control** (R18).

Inspiration only. **Not a Hux stack, BOM, or CAD source.** No spend. FC stays **TBD**.

Index: [`inspiration.md`](inspiration.md). Study plan: [`study-plan.md`](study-plan.md). Decisions: [`../decisions.md`](../decisions.md). Reuse-control: [`../software.md`](../software.md).

## What it is

Maker-scale **6-DOF 3D-printed walker** built in a living room in **under a week** (CAD + print + train + deploy; walking by **day two**, outdoor by **day three**). Silhouette inspired by what Kayden calls **Fauna Robotics Walker** (LinkedIn repeats that line) — three joints per leg (**hip pitch, hip roll, knee pitch**). No ankle. Author names it **Stompy** at the end of the clip (one slip says “Stumpy”).

| Piece (theirs) | Hux take |
| --- | --- |
| Fully 3D-printed structure; handle on the torso | Maker path rhyme. Hux V1 is **carbon-tube spars** + printed / machined fittings (R34), not an all-print walker. |
| **6× Robstride O2** QDD (~17 N·m, ~400 g, **dual encoders**) | Data point that cheap QDD + dual encoders make a home pose stick. **Not a Hux SKU.** Knee / hip swing stay **servo vs stepper+belt TBD**. Hip roll stays **dynamic in V1**. |
| **NVIDIA Jetson Orin Nano** runs the **same** trained policy | **Not a Hux FC or companion lock.** Hux path is XRobots + **TBD FC** + Pi later. Do not buy a Jetson to train a walker. |
| MPU9250 IMU (USB-C Amazon board) | Steal “IMU on the motion brain,” not the part. |
| **40 V** power-tool pack → motors; step-down **~19 V** to the Jetson | Hux prefers **4S + regulated step-down** (R11). Steal “serious bus + a real step-down,” not 40 V. |
| Robstride CAN hub (several CAN buses over USB-C) | Pattern, not a bus lock. |
| Logitech gamepad | Hux RX is **TBS Nano**. Steal stick *semantics* later, not the radio. |
| TPU / flexible foot pads; later **angled** soles | Hux plants **wheels** (5" Zantle rubber). Foot-pad SKUs are irrelevant. The **geometry-biases-gait** lesson is not. |
| ~**$1,000–$1,300** (video vs LinkedIn) | Not a Hux budget. No spend. |

**Do not** vendor his CAD / policy, copy the 40 V / Jetson / Robstride bill, or treat Fauna Walker as Hux geometry.

## Walking ≠ Hux (still learn)

Stompy has to **swing a foot, land it, and not fall**. Hux **rolls** on driven wheels and later **lifts one wheel** onto a **~9.5"** riser. Different contact, different first controller.

| Stompy | Hux |
| --- | --- |
| Footed 6-DOF walker; no ankles | Wheeled biped; wheels **are** the contact |
| Learned swing / stance / knee direction | Teleop **TWO_WHEEL**, then **LEFT_ONLY** / **RIGHT_ONLY** |
| RL policy trained in massively parallel sim | **Reuse existing** IMU → PID → wheel-torque (R18). No V1 policy trainer |
| Day-two walking is the demo | Day-one job is **balance on wheels**, not a gait |
| Outdoor walk = domain gap (trained on flat) | Later: fixture stairs, then real risers. Same *idea*, different machine |

What transfers is **identity between the CAD pose, the fixture, the firmware zero, and (later) any sim**. What does **not** transfer is “train a walker.”

## Shared zero — physical stand matches CAD; dual encoders zeroed there

This is the clip’s most stealable bring-up move.

He built a **stand** that does two jobs:

1. Holds the robot upright when it is **powered off** (so it does not collapse onto its end-stops).
2. **Fixtures the legs and feet into the exact CAD pose** so the **real-world zero equals the CAD zero**.

The Robstride O2s are **dual-encoder**. Once he zeros them on that stand, they **remember** the pose across power cycles unless something breaks. He says this out loud: set the robot’s zero to **the same position it is in CAD**; after that, do not re-zero unless the machine is damaged.

He also had to **renumber motor IDs** (everything shipped as the same ID) before any move command. Separate lesson: identity of axes before identity of pose.

**Hux rewrite:** a **home / fixture pose** that is the same object in CAD, in the stand, and in firmware. Dual / absolute encoders (or an honest home routine) get zeroed **there**, not at whatever angle the robot slumped to on the bench. Tazer already flagged “no homing” as a mistake ([tazer-lessons.md](tazer-lessons.md) #8). Stompy is the positive example.

## CAD → URDF → sim — a foot change forced a full update + retrain

Pipeline he actually used (LinkedIn one-liner: *CAD → Simulation → Sim2Real → Walking*; trainer named there as Kevin Zakka’s **mjlab** — not spoken in the video):

1. CAD the robot (day one).
2. Export / write a **URDF** (or equivalent) so the sim is that CAD, not a cousin.
3. Train thousands of parallel agents.
4. Run **that same policy** on the Jetson.

The first policy walked. Then he changed the **feet**. That was not a reprint-and-go. He lists the chain he had to redo:

> change the hardware → update the foot geometry → update the **CAD and URDF** → update the **simulation** → print → install → **start training again**

One geometry edit that is not pushed through CAD **and** the sim model is a **different robot**. The policy will happily exploit the old shape.

**Hux rewrite:** if we later stand up a model (Phase B geometry / 9.5" cycle, not day-one balance), a linkage or wheel-diameter change is a **full update**: CAD, exported model, and whatever controller or script assumed the old numbers. Do not “just reprint the foot” and keep yesterday’s URDF.

## Resting geometry biases the learned gait

First walking policy used **inverted knees** — a biped that wanted to walk like a **quadruped**. He did not like it.

Fauna’s Walker foot is **not flat**. It is **angled**. There is **no ankle motor**, so that wedge sets the **resting pose**: knees bent **forward**. His first feet were flat, so the cheap / rewarded pose was knees **back**.

He printed angled feet. Default configuration became **knees-forward**. Retrained. Gait matched the new rest pose on the first deploy of that policy.

**Hux rewrite:** the pose the mechanism **falls into** (end-stops, spring preload, wheel-under-CoG, hip-roll center) is the pose a controller will treat as easy. Put **default joint angles in CAD and in firmware** so they are the same number. Do not CAD a straight-leg rest and then firmware a crouched home. Hux is not learning a knee-direction gait — the same bias still shows up as “the balancer fights the linkage.”

## RL: massively parallel sim → same policy on the Jetson

How he avoided writing trajectories (his words: boring, and he did not have time):

- Reward: go forward, stay upright. Penalize falls and going the wrong way.
- **Thousands** of virtual robots at once. Early training is “falling over in thousands of ways.”
- The thing that learns is a **policy**: look at pose / rates / joints → motor commands, every step.
- **Same policy file** moves from the trainer to the **Jetson** inside the robot.

First hardware deploy:

- **Safety belt** so a fall does not mean reprint-the-leg.
- Before the policy: **stiff gains** just to stand (a useful check that the zero and the IDs are not nonsense).
- Policy on: stand, then walk. Day two: forward, sideways, backwards (scuffed). Cannot turn in place with 3-DOF legs; **can** turn while walking. Light push: recovers.

Outdoor / “real world”:

- Policy was **only trained on flat ground**.
- Uneven slabs, a rock, a step — **domain gap**. Sideways still looked good; forward got worse. He says this while it is happening.

**Hux rewrite:** the steal is **tether first** and **expect the lab policy / lab PID to shrink outdoors** — not “stand up Isaac / mjlab and train Hux to walk.” Parallel sim is how *he* skipped analytic walking. Hux V1 still **reuses simple balance**. Sim, if we use it, is for **checking geometry and later stair clearance**, not for inventing a day-one wheel controller.

## Hux steal table

Rewrite in Hux terms. Ideas only.

| Steal | What Stompy showed | Hux application |
| --- | --- | --- |
| **Fixture / home pose** | Stand holds the **CAD pose** while powered off and while zeroing | A jig / strap / block that parks Hux in the **documented home**. Bring-up and encoder zero happen there — not in a heap on the bench. |
| **Measure vs CAD** | Dual encoders zeroed so real angles **are** the CAD angles | After the first wheel-leg exists: **measure** as-built vs the 2D / CAD numbers (R23). Fix the model or the part. Do not assume the print is the drawing. |
| **Tether** | Belt on first policy so a fall is not a rebuild | Hoist / belt / boom for first `TWO_WHEEL` and first `LEFT_ONLY`. Same habit as restrained spin (not on carpet). |
| **Default angles in CAD + firmware** | Angled foot set the rest pose; firmware zero matched that pose | One published home: hip roll, knee, swing, wheel index. CAD sketch and firmware constants **share the numbers**. |
| **Sim later — geometry / stairs, not day-one wheel balance** | Foot change forced CAD + URDF + sim + **retrain** | When (later) we model stroke, 9.5" clearance, or one-leg kinematics, keep that chain honest. **Do not** start V1 by training a walking policy or a sim balancer. Day-one balance stays **simple reused control**. |

## Explicit: no RL walking for Hux V1

Stompy is existence proof that a maker can CAD → URDF → parallel RL → Jetson in a week **for a footed walker**. That is **his** path.

Hux V1:

- **Does not** require a learned walking policy.
- **Does not** require a GPU trainer, mjlab, Isaac, or a Jetson inference box.
- **Does** reuse existing balance patterns — IMU → PID → wheel torque / hold (R18). XRobots, Hattori, FC attitude loops. Serra’s wheel-under-CoG geometry. Not a novel Hux stack. Not LQR-on-a-bad-model ([tazer-lessons.md](tazer-lessons.md)).
- Roadrunner is also RL, and also **not** our stack ([roadrunner.md](roadrunner.md)). Stompy does not change that.

If someone later wants a policy on a companion computer, that is a **Steve decision** after two-leg and one-leg teleop exist. It is not a Phase A–D gate.

## Cite

When a later note is informed by this clip, record:

- **Stompy** — Kayden Knapik, [I Trained a Robot in Simulation. Then I Made It Walk.](https://www.youtube.com/watch?v=gEjg179fvmc) (`gEjg179fvmc`)
- Channel: [youtube.com/@kaydenknapik](https://www.youtube.com/@kaydenknapik)
- Author post (pipeline named): [LinkedIn — CAD → Simulation → Sim2Real → Walking](https://www.linkedin.com/posts/kaydenknapik_stompy-is-a-3d-printed-6-dof-bipedal-robot-activity-7500882648563662848-tZav) (mjlab / Kevin Zakka; ~$1,300)
- Silhouette he copied the *idea* from: Fauna Robotics **Walker** (his words; 6-DOF, no ankle). Not a Hux vendor. Do not treat current Fauna **Sprout** pages as that machine.
- License: video + Patreon “CAD / code later”; promised open source. **No tree in this repo.** Study in place. Do not vendor.

What we took: shared CAD/hardware zero; fixture stand; CAD→URDF→sim lockstep; resting geometry biases behavior; tether; outdoor domain gap; “stiff stand before the fancy controller.” What we did **not** copy: policy, URDF, Jetson stack, 40 V pack, Robstride SKU, TPU feet, gamepad, or a requirement to walk.

Do not confuse this Stompy with **KScale / Zeroth** “Stompy” humanoid packages. Different machine.

## Do not

- Require **RL walking** (or any learned gait) for Hux V1
- Replace R18 with a policy trainer, mjlab, Isaac, or a Jetson buy
- Spend, or treat Robstride O2 / 40 V / Jetson / MPU9250 as a Hux spec
- Vendor his CAD, URDF, or weights — or Fauna’s
- Skip a home fixture because “the encoders are absolute”
- Change a part and leave the model / firmware defaults stale
- Use day-one wheel balance as the reason to stand up a sim
- Relicense anyone’s files into MIT Hux
