# Stair climb dynamics — what the living drawings now model, and what it says

Written **2026-09-22** from a review of `tools/living-drawings/kin.js`. Steve asked for judgement calls on gravity, weight, CoM, momentum, inertia and motion in the stair animation, and for the tool to be improved. This note records the calls and the numbers. Nothing here is a decision; it is what the drawing-grade model says about the settled geometry (6" wheel, 7.5" + 7.5" tubes, 9.5" × 9.5" step, 14" stance, 6 kg example).

The tool: `tools/living-drawings/index.html`, "Side — both legs on the stair". `node tools/living-drawings/kin.js` runs the self-test and prints the summary.

## What was wrong with the previous model

The 2026-09-21 climb already had a real throw: angular momentum about the front contact, gravity eating it during the flight, a bisection for the minimum. Four things were missing or wrong.

1. **It crested on a knife edge.** The shove gave 0.78 kg·m²/s, the crest needed 0.77. Margin 0.6%. The self-test asserted only `margin > 0`. That is a tuned number, not a gait.
2. **It ignored the front wheel.** Once the rear wheel lifted, the model was a ballistic pendulum with gravity the only torque. The front wheel is a driven wheel on a shelf with ±1.75" of roll room. Rolling it back under the mass is worth exactly its distance in "behind", and at 3 N·m it can roll 1" and stop in about 0.12 s.
3. **Leftover momentum vanished.** At the crest the model zeroed velocity. Whatever forward momentum survives the crest has to be absorbed by the same front wheel, in the *forward* room of the slot. That is the other side of the knife edge and it was not there at all.
4. **No joint torques, no lateral.** The tool showed no hip or knee torque, and the climb was purely sagittal: no hip roll, no sway, no roll moment.

## What the model does now

- **Flight** is still the single-path pendulum (z is the pose progress, L the angular momentum about the front contact). The front wheel rolls back by up to `catchRoom` with a bang-bang move at `aCap = min(τ/(R·m), μ·g)`; the base acceleration enters the angular momentum as the fictitious torque `m · ry · a`. Net angular impulse of a roll-back-and-stop is zero; the gain is the displacement. Base authority is taken as the torque dragging the whole mass, which is conservative.
- **Catch**: at the crest the pose freezes and the front wheel balances the leftover as a wheeled inverted pendulum, full-state feedback clipped at `aCap`, hard stops at the slot edges, fall detection at ±3". Gains were tuned to be near the minimum-excursion bang-bang (about 6" of base travel per kg·m²/s of leftover).
- **Window**: for each build the tool finds the least liftoff momentum that crests (`need`, with and without the catch) and the most the forward room can absorb (`max`). The shove has to land between them.
- **Joint torques** for both legs every frame by virtual work (`τ = −Σ F·∂p/∂q`, plus the hub motor's reaction couple on the shin), from gravity alone ("holding") and with the drawn motion's accelerations (rough: the hand-drawn path has velocity kinks and the finite differences spike on them). The Jacobian reproduces the closed-form 4.4 N·m knee at the balance stance.
- **Lateral schedule**: the mass is over the planted wheel whenever the other is off; the 12.75" sway from the trailing wheel to the leading wheel happens during the gather, both wheels down, and never comes back because the leading foot is the next step's planted foot. A front view draws it. The roll moment is reported, including what the leading hip would have to hold if the trailing wheel lifted early.
- **Real time.** The scrubber is proportional to time; play runs at 1×, ½, ¼ or 1/10. Knobs rebuild the climb (about 100 ms): shove duration, wheel torque, roll-back room, landing error, body CoM forward of the hips, mass, μ.

## The numbers, settled geometry

| Item | Value |
| --- | ---: |
| Mass behind the front contact at liftoff | **2.71"** — set by the rear leg's reach, not by timing |
| Least liftoff momentum to crest, ballistic | 0.77 kg·m²/s |
| Least with the wheel rolling back 1.0" | 0.69 |
| Most the 1.75" of forward room can absorb | 0.78 |
| **Window the shove must land in** | **0.69 – 0.78, i.e. ±6% of the shove impulse** |
| Shove at 0.44 s gives | 0.74, inside the μ = 0.7 cone |
| Crest | 0.29 s after liftoff, 0.23 kg·m²/s left over, wheel rolls −1.0" then to +1.0", settles in 0.6 s |
| Knee torque, holding, peak | **10.6 N·m** at the throw/stand-up (front knee 6–7" behind the weight line), vs 4.4 at balance |
| Hip swing torque, holding, peak | 3.1 N·m |
| Wheel torque, peak | 3–4 N·m (the catch runs at the 3 N·m cap) |
| Hip roll if a wheel unloads with the mass centered | 9.5 N·m; 0 if the sway is done first |
| Cycle | 5.6 s per step |

## Judgement calls

**The step-to gait on this geometry is a precision throw, and that is physics, not tuning.** The rear leg is fully stretched when the hip is 2.7" short of the front contact. The slot gives 1.75" back and 1.75" forward. Every inch of "behind" that the wheel cannot roll back has to be thrown, and every bit of surplus has to be caught in the forward inch and three-quarters. The window is about 0.1 kg·m²/s wide whatever you do with the shove. Open-loop, a ±6% impulse tolerance will not repeat on a tire.

**A forward landing error kills the step; a rearward one helps.** Land the raised wheel ½" forward of slot center and no shove crests: the rear leg cannot push the hip far enough. Land it ¾" back and the need drops to 0.47. So the landing target is the **rear** of the slot, not the center, and the tolerance should be spent that way. The 2026-09-21 note said centered for tolerance; that is the wrong side.

**Body mass forward of the hip axis is the cheapest lever.** +1" (pack forward) takes "behind" to 2.0" and widens the window to ±13% with zero cone violations. +2" takes it to 1.4", which is under the roll-back room: the window becomes ±25% and a 1-second lean works instead of a 0.44-second shove. The lump picture puts the body on the hip axis; the real pack, FC and Pi placement decides this. **Recommend planning the body so its CoM sits 1–2" ahead of the hip roll axis.** That costs a little hip-swing torque at the balance stance (the hip has to sit behind the axle) and is worth it.

**The front wheel loop is the gait.** With the catch, the wheel does the crest and the arrest. Without it the throw needs 0.77 and has nowhere to put the surplus. The 3 N·m wheel target holds up: 0.5 N·m cannot roll the base back fast enough and cannot catch (the tool shows it). Do not size the wheel down.

**The knee is a 10 N·m joint, not a 4.4 N·m joint.** The 4.4 in leg-geometry.md is the balance stance. Standing up over the front wheel with the knee 6–7" behind the weight line is 10.6 N·m on one leg, held for most of a second, plus whatever the motion adds. The 2.2 N·m spring covers the two-leg crouch only. Size the knee actuator class and its reduction for ~10 N·m holding; that is what decides servo vs stepper-and-belt, not the stance.

**Hip roll: sway first, then lift.** The 9.5 N·m roll moment only exists if a wheel unloads with the mass centered. The schedule puts the mass over the planted wheel before the other lifts, so the roll joint holds near zero on one leg and the sway is a two-wheel move. The GIM8108 yardstick is fine for that. The hip roll needed to put the mass over one wheel is 18–22° depending on where the hip axis sits laterally; the top-view slider was capped at 20° and now goes to 30°.

**What is still crude.** One pendulum coordinate for the flight, with the rear-leg lift and the hip rise tied to it; a lumped mass picture, not a weighed robot; no tire compliance, no backlash, no sensor delay; the catch controller is a stand-in, not the FC loop; the two-wheel force split is a lever rule except during the shove. The numbers are for comparing options, not for ordering a motor.

## What to change in the plan

- Aim the landing at the rear of the next slot; treat forward error as the failure mode.
- Put the body CoM 1–2" ahead of the hip axes in the 2D layout. Re-run the tool when the lump masses are real.
- Size the knee for ~10 N·m holding on one leg; the hip swing for ~3–4 N·m; keep the wheel at ~3 N·m.
- The one-leg balance gate (NOTES) is also the front-wheel catch gate: the same wheel loop does both. Test the catch on the floor before the stair: lean back 1", let the wheel bring the base under.
