# Standing on one wheel — the frontal-plane mechanics, and what the sandbox says

Written **2026-09-26**. Steve: the one-leg stand needs much more work, the mechanics of the hip roll weight shift are unclear, and the one-leg action does not work in the simulation. This note works the frontal plane from first principles with the lumps and geometry in `kin.js` (6 kg picture, 7.5" + 7.5" tubes, 6 × 1.25" round-crown tire, hips 5.4" off the centreline, 12.75" track), checks it against the Rapier sandbox, and says what the numbers mean for the plan. Nothing here is a decision.

Tools: `tools/living-drawings/frontal.js` (closed form; `node frontal.js` prints the tables), `sim-core.js` (sandbox; `npm test` in that folder prints the one-wheel findings, including the hop rows below).

## 1. How the hip rolls shift the weight

Both hip roll axes run fore-aft, 10.8" apart, on the body. With **both wheels on the floor the two legs, the body and the floor are a four-bar**. The wheels cannot scrub sideways, so the two rolls are not independent: with equal leg lengths they must turn the **same** angle γ and the linkage is a parallelogram. The body translates sideways, stays level, and drops a little; both wheels camber by γ.

What sets the roll needed to put the mass over one tire:

- The body centre starts half a track (6.375") from the left contact and has to travel all of it. The lever is the whole leg from the crown contact to the hip, ~0.41 m at the 92% stance: the hip moves 0.41 sin γ.
- The **axle spacer** (0.975" outboard) works against you: the hip starts inboard of its wheel and has to end up 5.4" outboard of the contact.
- The **crown walk** works for you: a cambered wheel touches the floor (R − r_crown) sin γ = 2.4" × sin γ toward the side its bottom swings, which is toward the body. At 24° that is 0.96" (the 25 mm the 2026-09-25 tire fix measured).
- The leg and free-wheel masses move too; the closed form sums all the lumps.

Result: **24.7° of hip roll at the 92% stance, 29.5° at the 75% ride height** (the leg is the lever, so tall is cheaper). The sandbox measures the planted joint at 24.6° when its mass offset reads zero. The 2026-09-22 note's 18–22° was for the hub, not the crown contact, and without the spacer. The hip drops 39 mm during the shift at 92%. The roll joint limit is ±34°, so **9.7° of roll travel is left** once the mass is over the tire.

The 15% "poise" the sandbox holds (mass 53 mm inboard of the planted contact, free wheel carrying 15%) sits at about 19° of roll. That is a two-contact stance and it is statically stable: the poise has been working since 2026-09-23 and still does.

## 2. What the planted hip has to hold

The hip roll joint's torque is the moment of everything on the body side of it about its own axis. On one wheel that is the body (4 kg) hung 5.4" inboard of the axis plus the free leg (1.06 kg with its yoke) hung 10.8" inboard:

| Hips at | Leg roll | Planted hip roll hold |
| ---: | ---: | ---: |
| 5.4" (as drawn) | 24.7° | **8.3 N·m** |
| 4.5" | 21.1° | 7.0 |
| 4.0" | 19.1° | 6.2 |
| 3.5" | 17.2° | 5.4 |
| 3.0" | 15.2° | 4.7 |
| 2.0" | 11.3° | 3.1 |

The rule of thumb is (m_body + 2 m_leg) g × hip offset ≈ 60 N × offset. It is a **static, continuous** load the whole time the other wheel is off the floor, sway or no sway — the 2026-09-22 stair note's "0 if the sway is done first" was the tipping moment about the contact (which is zero when balanced), not the joint torque. `model-corrections.md` already separated the two; this is the number. At the 15% poise the free wheel carries part of the cantilever and the sandbox reads 4.3–6.6 N·m on the planted hip.

During the hop below the planted hip peaks at **12.5–13 N·m** (the 8.3 hold, the step of taking the whole cantilever as the free wheel leaves, and the landing). The 15 N·m knob is the cap. A GIM8108-class yardstick (7.5 N·m nominal, 22 stall) holds the poise and takes a step at peak; **it does not hold a one-wheel stand at nominal.** The only ways to cut the hold are hips closer to the centreline, a body that slides sideways on the hips (not in the design), or a lighter body. Tucking the free leg (knee folded, wheel up) does not help the hold and hurts the balance (§3). Adducting the free leg under the body (rolling it 34° toward the planted side, the wheel swung clear fore-aft) takes the hold to 7.3 N·m and the shift to 22°: a modest help, and it costs a little in §3.

## 3. Balancing on one wheel is an acrobot, and this acrobot is a poor one

Take the free wheel off the floor and the frontal plane is a **3-link inverted pendulum on a rolling point**: the planted leg pivots on the crown contact (unactuated; the crown's 16 mm rocker is negligible under a 0.4 m pendulum), the body hangs from the planted hip roll (actuated), the free leg hangs from the free hip roll (actuated). Neither the wheel motor nor anything else can push sideways on the floor. The **only** way to move the mass laterally is to rotate a link about a hip and take the reaction through the leg — the "hip strategy" of a human with no ankle, or a person on a stilt.

Two numbers decide whether that works:

- **Unstable pole 4.8 rad/s** (time constant 0.21 s). A CoM error grows by e·cosh(4.8 t): ×2.2 in 0.3 s, ×5.6 in 0.5 s.
- **Reaction ratio.** Rotating the body moves the CoM only through the body's lever about the hip axis. The body lump's CoM sits ~1" above the hip roll axis, and the free leg hanging below it pulls the combined link-2 CoM to ~21 mm above the axis: rotating the body barely moves the mass, it just spins a mass in place. The mass matrix from the lumps is M = [[1.02, 0.16], [0.16, 0.25]] kg·m²: the body has to swing **6.3° for every 1°** the leg is corrected.

Linear response to a **10 mm** CoM error (closed form, minimum-torque LQR, free hip held stiff as the sandbox holds it):

| Configuration | Body-to-leg swing | Free-leg swing | Dynamic torque on top of the hold |
| --- | ---: | ---: | ---: |
| As drawn, planted hip only | **40°** | — | 4.7 N·m |
| As drawn, both hips active | 9.3° | 52° | 3.0 / 1.8 N·m |
| Free leg tucked to 7", planted hip only | 52° | — | 7.9 |
| Body CoM 5" above the hips, planted hip only | 30° | — | 6.4 |
| Body CoM 5" above the hips, both hips | 6.1° | 56° | 2.9 / 1.6 |
| Hips at 3.5", planted hip only | 42° | — | 4.0 |
| Hips at 3.5", both hips | 13° | 51° | 3.2 / 1.4 |
| Mass ×1.5 (9 kg), planted hip only | 40° | — | 6.9 |

With 9.7° of roll travel left and a 40°-per-10-mm price, the **capture region on the planted hip alone is 2–3 mm of CoM error**. Using the free hip too cuts the body swing to 9° but asks the free leg for 52° per 10 mm, which its own ±34° limit does not have either. Raising the body CoM helps the reaction ratio (6.3 → 4.2 at 5") and moving the hips inboard cuts the hold and the shift angle, but neither changes the class of the problem: the movable masses are small next to the 6 kg on a 0.4 m stick. Where the sandbox's lump model puts the body CoM is also ±20 mm of real-world doubt on its own.

**The sandbox agrees.** With the servo sag fixed, clean rate signals, the balancer handed over while the free wheel still carries 8%, and even with the roll limits opened to ±1.5 rad, 40 N·m and zero sensor delay, the body swings 36–39° and the robot falls within 0.4 s of the wheel leaving the floor; in every as-built run the planted hip roll hits its −0.6 rad stop. The LQR gains are not the problem either: the cheap-control limit for this plant is ≈190 N·m/rad on the leg angle, whatever the weights, because both the leg and the body are gravity-unstable about their pivots.

So the failures Steve saw were not a tuning problem, and three of them were real physics worth knowing:

1. **Position-servo sag.** A 90 N·m/rad hip roll hold sags 0.1 rad under the 8–9 N·m cantilever the moment the free wheel unloads; that is 40 mm of uncommanded mass shift, which carried the mass over and past the contact. Any real hip-roll position loop needs integral action or a gravity feed-forward from the model — the FC knows the pose and the lumps.
2. **Two integrating position servos on a closed parallelogram fight each other.** With both wheels down and the legs not exactly equal, the two hip rolls cannot both hold the same target; the fight walked the mass toward the planted tire at 0.1 m/s. One stiff hip, one soft.
3. **Levelling by leg length is a mass-mover near one wheel.** 29 mm of leg difference is 5° of body roll and 35 mm of CoM travel; the levelling integrator wound up on the touchdown roll and tipped the robot over the planted tire. Level with the parallelogram, not the legs, while the mass is off centre.

## 4. Dynamic single support: what the stair actually needs

A stair step never asked for a static one-wheel stand. The trailing wheel lifts, the robot is on one tire for a while, the wheel lands on the next tread and the base is back. Steve's open question (5): is dynamic single support enough?

During the flight nothing balances laterally. Start the lift from a chosen inboard margin e₀ (the poise), and the robot tips toward the free side — **the side the next foothold is on** — at the 4.8 rad/s pole. The landing wheel catches it. Landing outboard is unrecoverable, so the margin must exceed the CoM estimate error and the tip is always inboard.

Closed form, flight time T, no balancing (pendulum about the planted contact):

| e₀ (free wheel load) | 0.2 s | 0.3 s | 0.4 s | 0.5 s | 0.75 s |
| --- | --- | --- | --- | --- | --- |
| 10 mm (~3%) | 15 mm, 0.05 m/s | 22, 0.10 | 35, 0.16 | 55, 0.26 | 182, 0.87 |
| 20 mm (~6%) | 30, 0.11 | 44, 0.19 | 69, 0.32 | 111, 0.52 | 364, 1.7 |
| 30 mm (8%) | 45, 0.16 | 67, 0.29 | 104, 0.48 | 166, 0.78 | 545, 2.6 |
| 53 mm (15%) | 79, 0.28 | 118, 0.50 | 184, 0.84 | 293, 1.4 | — |

(CoM offset from the planted contact at landing, and its lateral speed. The free wheel lands 324 mm inboard, so anything under ~200 mm is still inside the base; the speed is what the landing leg has to absorb.)

The sandbox flight matches the table: from an 8% poise, 0.2 s in the air tips 1.5° and lands at 42 mm; 0.3 s tips 2.8° at 63 mm; 0.4 s tips 7–9° at 92–114 mm; 0.5 s tips 14–19° at 145–182 mm. From the 15% poise 0.3 s already tips 12° and lands at 145–160 mm at 0.2–0.4 m/s.

Two ways to buy time: a **smaller margin** (needs a better CoM estimate than the ±20 mm the current poise shows), and a **one-shot hip swing** — the acrobot cannot hold, but a deliberate 10° body swing toward the free side moves the leg (and the mass) ~11 mm toward the planted tire, which is worth about 0.15 s at the pole. The free leg can do it once more.

**Budget:** with a ±20 mm CoM estimate, keep the free wheel in the air **≤ 0.3 s**; with ±5 mm, or with the one-shot swing, **≤ 0.5 s**. Beyond that the landing arrives at 0.5–1 m/s sideways with the body 15–30° over, which is a fall the second wheel catches by luck. The stair trajectory has to be planned with that clock: lift late, land early, and land the wheel where it lifted laterally.

**Landing.** In the sandbox a 0.2 s hop from the 8% poise now lifts, tips, lands, re-poises and returns to two wheels (`npm test` asserts it). The 0.3 s hop lands gently (2.8°, 63 mm, 0.05 m/s) but the return to two wheels still fails, for controller reasons (§3 items 2–3, and the two-wheel controller's sideways catch and levelling are designed for a centred robot). The flight is physics; the landing is controller work and is not done.

## 5. Judgement calls

- **A static one-wheel stand on this geometry is not a V1 capability, and no controller will make it one.** Capture region 2–3 mm on the planted hip, ~5 mm with both hips, both limited by the ±34° roll travel after the 24.7° shift. This does not contradict keeping hip roll in V1 (R16): the roll is what does the shift and the poise, and the poise is real. It does conflict with R17's framing of one-leg balance as a full-loop gate before any stair cycle — flagged in `decisions.md`, not changed here.
- **What the stair needs is a short flight from a known margin, not a stand.** The gate before a step should be: poise at ~8%, lift for 0.2–0.3 s, land, return — measured on the floor. That is a test with a clock, not a hold.
- **Size the hip roll for the hold, not the poise.** 8.3 N·m continuous whenever a wheel is up, 12–13 N·m peak through a step, at 5.4" hips. A GIM8108-class nominal (7.5 N·m) is under the hold; with the 2026-09-26 stack (CAN QDD actuators with their own PD) that is the continuous rating to check on the roll axis, and the cantilever becomes a torque feed-forward the control core sends alongside the PD setpoint. Either the class goes up or the hips come in: at 3.5" the hold is 5.4 N·m and the shift is 17°, with 17° of roll travel to spare. The 14" width was for the track; the head is 7" wide; how far in the roll actuators can live is a packaging question worth a 2D layout.
- **Do not tuck the free leg to make balance easier.** It makes the reaction ratio worse. If anything, the free leg is the better lateral actuator *because* it hangs below its joint.
- **The hip-roll rethink (2026-09-25).** (1) A lateral CoG path is needed: the 24.7° parallelogram shift is the cheapest one on this body. (2) Hip roll is the right DOF for the shift; it is the wrong DOF for a one-wheel *hold*, and so is everything else on this robot. (3) The old stair path asked for a hold it could not have; a path with ≤0.3 s flights does not.
- **Control-core requirements the sandbox surfaced** (for the portable core, not the actuator firmware): hip roll hold with a gravity feed-forward from the model (or an integral, on the planted side only — two integrating holds on the closed parallelogram fight); no leg-length levelling while the mass is off centre; the landing leg as a damper (an impedance the QDD class can do); never move a hip roll while a wheel is unloaded unless it is the deliberate one-shot swing.

## 6. What is still crude

Lump masses, not a weighed robot: ±20 mm on the CoM is the honest number until the parts are real. The closed form uses point lumps plus a box inertia for the trunk; the sandbox uses the same lumps as rigid bodies with a compliant tire whose stiffness is a guess. The sandbox's rate signals are ideal (delayed 4 ms), and its one-wheel controller reads the CoM from ground truth. No motor inertia through a reduction, no backlash, no tire hysteresis, no yaw drift on one wheel (the contact's spin friction is small and nothing here steers).

## Changes to the sandbox in this pass

`sim-core.js`: integral + stiffer position hold on the planted hip roll during the one-leg sequence (`ONE.rollKp`, `ONE.rollKi`), soft P on the free hip; gravity feed-forward of the cantilever during the hop; balancer handover at 8% free-wheel load instead of after unloading; leg-roll rate from the yoke's angular velocity (IMU − encoder) with a 15 ms filter instead of differencing the contact angle (which pumped the 13 Hz tire mode); levelling frozen after a landing; the shift servo only moves while both tires carry load; new `oneHop` / `hopKeep` knobs (also on `sim.html`). `frontal.js` is new. `sim-test.js` asserts the 0.2 s hop returns and that the closed form and the sandbox agree on the shift angle and hold torque.
