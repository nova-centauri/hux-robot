# Leg actuators — V1 baseline + stepper + belt/gear trade

Steve **2026-09-20** (confirmed). Working **V1 actuator baseline**, then the trade that justifies it. **No spend. No locked SKU. FC stays TBD.**

This note does not pick a part. It does not replace [`../requirements.md`](../requirements.md) or [`../mechanical.md`](../mechanical.md). A dedicated `actuators-steppers.md` would only repeat the same per-DOF split. One file.

## Working V1 actuator baseline (Steve confirmed)

Architecture is locked. Parts are not. Mass stays **soft**.

| DOF | Working baseline | Clarify |
| --- | --- | --- |
| **Wheels** | **Brushless FOC** | Already R6. Torque-mode / reaction-speed class when R25 lands. Not a stepper. |
| **Knee** | **Stepper with belt/gear reduction** | Not a bare stepper. The reduction is required for torque and resolution. |
| **Hip swing** (rotation / pitch) | **Stepper + belt** | The **belt is the reduction for that joint** — not a second actuator, not a second motor. |
| **Hip roll** (balance angling) | **In V1.** **Dynamic:** FOC BLDC / **small** QDD / fast bus servo | **Not a stepper. Not deferred to V2.** Experimental — may not work as hoped. Still ship the joint and the control modes so we can learn. Best-effort one-leg CoG shift. |

Do not put a bare stepper on the knee. Do not add a second hip-swing actuator “plus a belt.” Do not put a stepper on hip roll to match the knees. Do not put a stepper on the rim. Do not drop hip roll from V1 CAD or modes to wait for a better actuator.

IDs: R6 / R16 / R26 / R27. All-stepper (R28) is a residual risk path, **not** this baseline.

### V1 implication — start somewhere

One-leg (`LEFT_ONLY` / `RIGHT_ONLY`) **CoG shift is a V1 goal (best-effort)**. Hip roll ships in V1 even if the first actuator is imperfect. Pair it with planted-wheel fore/aft. It **may not work as hoped**. That is acceptable. What is not acceptable: omitting the joint, omitting the modes, or waiting for V2. Leave room in the ~10" stance (when that note lands) and in the harness.

## DOF map (do not collapse these)

| DOF | Job on Hux | What the actuator must do |
| --- | --- | --- |
| **Hip rotation / swing** (hip *pitch*) | Lift and swing a wheeled leg for the stair cycle | Repeatable position. Hold a pose while the other side balances. Speed matters; it is not the CoG loop. |
| **Knee** | Fold / extend for stroke and ~9.5" clearance | Same class of problem as hip swing: position, hold, COTS reduction. |
| **Hip roll** (balance angling) | Shift body CoG over the **planted** wheel for one-leg (`LEFT_ONLY` / `RIGHT_ONLY`) | **V1 goal (best-effort).** High-rate **torque** corrections. Ideally **backdrivable**. Pairs with planted-wheel fore/aft. Distinct from swing. Experimental — include the axis even if the first loop is ugly. |
| **Wheels** | Contact, yaw, and pitch balance | **Brushless FOC** (baseline). Not a stepper problem. |

Hip swing and hip roll are **different joints**. A stepper that is fine on swing can still be the wrong machine on roll.

## Steppers + belt/gear — good for

**Hip rotation (swing) and knee position DOFs** — the joints on the working baseline.

- **Precise and cheap.** COTS **NEMA-class or smaller** steppers plus pulleys are a known hobby pattern. Belt (or belt + gear) reduction multiplies torque **and** position resolution (more motor steps per joint degree). A **bare** stepper is not the baseline: the reduction is the point.
- **One reducer per joint.** On hip swing the **belt is the reduction**, not a duplicate actuator. Knee is the same idea with belt and/or gear — still one motor per joint.
- **Holding a pose.** Open-loop is enough for a parked or slowly moved swing/knee if the load stays inside holding torque. Closed-loop (encoder on the motor or the joint) recovers missed steps without inventing a new controller family.
- **Fits fabrication rules.** Pulleys, belts, and rod/shafting are **cheap COTS stock** (R19 when that lands). Printed parts stay joints, tensioners, and housings — not a custom spar. Matches draft-friendly customs, wire ports, and serviceable modules (R20–R22).
- **Does not fight V1 linkage + spring bias (R7).** A rotary stepper at the hip or knee can still drive a linkage; springs still assist gravity. Belt-on-the-joint is reduction, not “pure serial belts instead of a linkage.”
- **4S is a usable class of supply** (R11 when that lands) if the driver is chosen for that bus later. That is a class note, not a driver SKU.

Good here means: *position DOFs that can be slow-ish, hold, and be built from stock.* Not: *every joint on the robot.*

## Steppers + belt/gear — weak for

**Hip roll / balance angling.**

One-leg balance is a **full loop**: hip roll keeps weight over the planted wheel, **and** that wheel drives fore/aft so the contact stays under the CoG. The roll half of that loop needs **high-rate torque corrections**. Steppers are **stiff position machines**.

Failure modes that hurt that loop:

- **Missed steps under impact.** A tip, a nosing hit, or a belt snatch looks like a disturbance the controller already used its current on. Open-loop then lies about joint angle. The CoG projection walks off the planted patch.
- **Resonance.** Stepper + belt + a long leg is a spring-mass. Microstepping and mid-band resonance eat the bandwidth you wanted for balance.
- **Belt stretch and backlash.** Reduction that is a gift on a knee becomes phase lag and a deadband on a CoG loop. The wheel can only correct *pitch*. Roll error that the belt ate is not something the rim can undo.
- **Not backdrivable in a useful way.** Quasi-direct drive and many FOC BLDC + low-ratio stages can be backdriven and used as a torque/impedance source. A stepper holding against a belt is a brick. That is the opposite of a joint that should eat a hit and keep the body over the wheel.

**Continuous current while holding = heat / 4S drain.** A stepper (especially open-loop) often sits at holding current to keep a pose. Two hips + two knees, times a non-trivial hold current, is pack heat and a shorter 4S run even when the robot is standing still. Closed-loop and current-decay modes help; they do not make holding free. Hip roll that *must* hold a lean while the wheel fights pitch is the worst of both: current *and* missed-step risk.

Do not “fix” roll weakness by stacking more belt ratio. That adds inertia and stretch. Do not “fix” it by a bigger NEMA. That is mass at the hip on the wrong machine class.

## Other classes still on the table

Not a buy list. The **baseline is already chosen** (table at the top). This is leftover honesty for hip-roll *which* dynamic class, and for anyone who wants to reopen swing/knee later:

| Class | Where it is honest | Still TBD |
| --- | --- | --- |
| **Stepper + belt / gear** | **Baseline** for knee + hip **swing**. Pose hold. COTS pulleys. Knee needs the reduction (not bare). Swing belt = that joint's reducer. | Frame size, ratio, open- vs closed-loop, belt pitch, backlash budget |
| **FOC BLDC + gearbox / cycloidal** | Hip **roll** (and any joint that needs rate + torque). Same family as the wheel-drive lean. | Ratio, backdrive, packaging at a ~10" stance |
| **Quasi-direct drive (QDD)** | Hip **roll** (prefer **small** QDD if this class is filled). Fast, proprioceptive, shock-tolerant | Mass at the joint, whether anything on hand is in this class |
| **Fast bus servo class** | Hip **roll** if a strong, fast unit is already on the bench and the bus is honest | Speed, reliability, 4S-side voltage, whether it is actually backdrivable |
| **Linear + linkage + springs** | Matches R7. Can produce “rotation” at a joint | Stroke, force, whether it can do roll *and* swing |

Wheels: stay **FOC BLDC**. Do not put a stepper on the rim to “match the legs.”

No SKU. No shopping links. Prefer parts already on hand when a class is later filled.

## Recommendation — now the working baseline

Steve confirmed the split. This is no longer a maybe.

1. **Knee = stepper with belt/gear reduction.** Not a bare stepper. Reduction is required.
2. **Hip swing = stepper + belt.** The belt *is* the reduction for that joint — one motor, not a second actuator.
3. **Hip roll is in V1.** Dynamic class: FOC BLDC / **small** QDD / fast bus servo. **Not a stepper. Not V2.** Experimental — it may not work as hoped. Still include the joint mechanically and in `LEFT_ONLY` / `RIGHT_ONLY` so we can learn. One-leg CoG shift is a **V1 goal (best-effort)**, paired with planted-wheel fore/aft. Start somewhere.
4. **Wheels = brushless FOC.** Already R6. Not steppers.
5. **If someone later insists all joints are steppers (not the baseline):** require **closed-loop** steppers, **minimal-backlash** belts, and **accept even lower one-leg balance bandwidth**. That is R28 — a **risk**, not the plan. Do not fake a CoG shift in software to cover a stiff roll joint, and do not delete the V1 roll axis to avoid embarrassment.
6. **Mass does not veto (1)–(4).** A capable (even imperfect) roll actuator that pushes V1 past 6 lb is allowed. A tiny stepper on roll that “saves” the budget and then misses steps is the worse trade. Skipping roll “until V2” is also not the baseline.

**FC TBD.** The baseline does not pick a flight controller, a stepper driver IC, a FOC board, a NEMA size, or a belt pitch.

## Mass (aspirational)

| Target | Status |
| --- | --- |
| **4–5 lb** (~1.8–2.3 kg) | Aspiration |
| **Under 6 lb** | Soft. Nice if we make it. |
| **Over 6 lb** | Allowed if it buys capability (roll bandwidth, closed-loop, one-leg). Record why. |

Do not reject a hip-roll class because it blows a spreadsheet. Do not spend mass on a stepper that cannot do the roll job. Fill budget lines when something is weighed — see [`../mechanical.md`](../mechanical.md).

## Heat, bus, and hold

- Battery lean is **4S LiPo class** when that note lands (nominal ~14.8 V / full ~16.8 V). Capacity / C **TBD**. Not a pack lock.
- Stepper **hold current** on four (or six) joints is a first-class 4S drain and a thermal path through printed housings. Design for heat even if V1 never walks far.
- FOC BLDC / QDD can hold with less waste if the controller is in current/torque mode and the linkage + springs (R7) take gravity. That is one reason roll should not be an open-loop stepper.
- Do not invent a PDB / BEC / driver BOM here.

## Fabrication fit (COTS)

Belt + gear on swing/knee is aligned with **cheap COTS stock**: pulleys, belts, rod, shafting, bearings, fasteners. Printed: clamps, tensioners, pulley hubs, motor plates. That is the same rule as “do not print a spar.”

Belt on **roll** is still COTS — the objection is control physics, not printability.

## What this note does not do

- Lock a NEMA size, tooth count, belt pitch, or gearbox ratio
- Paste buy links or treat a vendor page as a Hux BOM
- Pick an FC, a stepper driver, or a FOC stack
- Relicense or vendor XRobots / Hattori hardware
- Claim one-leg balance is solved because a stepper can hold a lean on the bench
- Spend

## Extract later (Phase A / B)

Write real notes here or in [`../../NOTES.md`](../../NOTES.md) when watched, not now:

- [ ] Which upstream machines use steppers vs BLDC on **swing** vs **roll** (do not assume they named the axes the way we do).
- [ ] How much belt backlash they tolerated on a balance joint vs a position joint.
- [ ] Whether their one-leg / lean axis is torque-mode or position-mode.
- [ ] Hold-current vs spring-assist: who lets the spring take gravity so the motor can drop current.

**Done when:** we can explain in our own words why V1 puts reduction steppers on swing/knee and an experimental dynamic actuator on roll, with citations, without a SKU.

## Pointers

- Requirements: [`../requirements.md`](../requirements.md) — R24 mass (aspirational); R6 / R16 / R26 / R27 baseline; R28 residual risk
- Mechanical: [`../mechanical.md`](../mechanical.md) — DOF split, COTS belts, mass sketch
- Electronics: [`../electronics.md`](../electronics.md) — drivers as classes; hold current; wheels FOC
- Hip-roll / one-leg loop: [`../software.md`](../software.md), R16–R18
- Study plan: [`study-plan.md`](study-plan.md)
