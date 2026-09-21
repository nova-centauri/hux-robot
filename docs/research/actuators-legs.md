# Leg actuators — axis roles + V1 intent

Steve **2026-09-20** (axis jobs + I/O) and follow-up (servo vs stepper TBD), plus **2026-09-21** (GIM8108-class candidate, soft mass). **No spend. No locked SKU. FC stays TBD.**

This note does not pick a part. It does not replace [`../requirements.md`](../requirements.md) or [`../mechanical.md`](../mechanical.md). Decision log: [`../decisions.md`](../decisions.md).

## Working V1 intent (latest wins)

Architecture is locked where the table says so. Parts are not. Mass stays **soft**.

| DOF | Working intent | Clarify |
| --- | --- | --- |
| **Wheels** | **In-wheel brushless FOC** | Already R6 / R30. Torque-mode / reaction-speed class (R25). Not a stepper. |
| **Knee** | **Servo vs stepper+belt TBD** | Both open. **No lean.** Size for ~2× one-leg plant load (R36). If steppers: **not a bare stepper** — belt / gear reduction is required. **GIM8108-8** is a *candidate* (not ordered). |
| **Hip swing** (rotation / pitch) | **Servo vs stepper+belt TBD** | Same as knee. If steppers: the **belt is the reduction for that joint** — not a second actuator. |
| **Hip roll** (balance angling) | **In V1.** **Dynamic:** FOC BLDC / **small** QDD / fast bus servo | **Not a stepper. Not deferred to V2.** Experimental — may not work as hoped. Still ship the joint and the control modes so we can learn. Best-effort one-leg CoG shift. |

A earlier packet (#10) locked knee + hip swing to stepper+belt. **#14 lifts that lock.** Do not write a servo lean in its place. Do not put a stepper on hip roll to match the knees. Do not put a stepper on the rim. Do not drop hip roll from V1 CAD or modes to wait for a better actuator.

IDs: R6 / R12 / R16 / R26 / R27 / R36. All-stepper (R28) is a residual risk path, **not** this baseline.

### V1 implication — start somewhere

One-leg (`LEFT_ONLY` / `RIGHT_ONLY`) **CoG shift is a V1 goal (best-effort)**. Hip roll ships in V1 even if the first actuator is imperfect. Pair it with planted-wheel fore/aft. It **may not work as hoped**. That is acceptable. What is not acceptable: omitting the joint, omitting the modes, or waiting for V2. Leave room in the ~10" stance and in the harness.

## DOF map (do not collapse these)

| DOF | Job on Hux | What the actuator must do |
| --- | --- | --- |
| **Hip rotation / swing** (hip *pitch*) | Lift and swing a wheeled leg for the stair cycle | Repeatable position. Hold a pose while the other side balances. Speed matters; it is not the CoG loop. |
| **Knee** | Fold / extend for stroke and ~9.5" clearance | Same class of problem as hip swing: position, hold, COTS reduction if steppers. Highest gravity + step torque. Springs / linkage gravity compensation strongly recommended (Hattori). |
| **Hip roll** (balance angling) | Shift body CoG over the **planted** wheel for one-leg (`LEFT_ONLY` / `RIGHT_ONLY`) | **V1 goal (best-effort).** High-rate **torque** corrections. Ideally **backdrivable**. Pairs with planted-wheel fore/aft. Distinct from swing. Experimental — include the axis even if the first loop is ugly. |
| **Wheels** | Contact, yaw, and pitch balance | **In-wheel brushless FOC** (baseline). Not a stepper problem. |

Hip swing and hip roll are **different joints**. A stepper that is fine on swing can still be the wrong machine on roll.

## Steppers + belt/gear — good for (if that class is chosen)

**Hip rotation (swing) and knee position DOFs** — *if* we pick steppers. Not a lock.

- **Precise and cheap.** COTS **NEMA-class or smaller** steppers plus pulleys are a known hobby pattern. Belt (or belt + gear) reduction multiplies torque **and** position resolution. A **bare** stepper is not acceptable: the reduction is the point.
- **One reducer per joint.** On hip swing the **belt is the reduction**, not a duplicate actuator.
- **Holding a pose.** Open-loop is enough for a parked or slowly moved swing / knee if the load stays inside holding torque. Closed-loop recovers missed steps without inventing a new controller family.
- **Fits fabrication rules.** Pulleys, belts, and rod / shafting are **cheap COTS stock** (R19). Printed parts stay joints, tensioners, and housings — not a custom spar. Matches draft-friendly customs, wire ports, and serviceable modules (R20–R22).
- **Does not fight V1 linkage + spring bias (R7).** A rotary stepper at the hip or knee can still drive a linkage; springs still assist gravity.
- **4S is a usable class of supply** (R11) if the driver is chosen for that bus later. Pose still sits behind **regulated step-down**.

Good here means: *position DOFs that can be slow-ish, hold, and be built from stock.* Not: *every joint on the robot.*

## Steppers + belt/gear — weak for

**Hip roll / balance angling.** Always. This is why roll is not a stepper.

One-leg balance is a **full loop**: hip roll keeps weight over the planted wheel, **and** that wheel drives fore/aft so the contact stays under the CoG. The roll half of that loop needs **high-rate torque corrections**. Steppers are **stiff position machines**.

Failure modes that hurt that loop:

- **Missed steps under impact.** A tip, a nosing hit, or a belt snatch looks like a disturbance the controller already used its current on. Open-loop then lies about joint angle.
- **Resonance.** Stepper + belt + a long (~24") carbon-tube leg is a spring-mass. Microstepping and mid-band resonance eat the bandwidth you wanted for balance.
- **Belt stretch and backlash.** Reduction that is a gift on a knee becomes phase lag and a deadband on a CoG loop. The wheel can only correct *pitch*. Roll error that the belt ate is not something the rim can undo.
- **Not backdrivable in a useful way.** QDD and many FOC BLDC + low-ratio stages can be backdriven and used as a torque / impedance source. A stepper holding against a belt is a brick.

**Continuous current while holding = heat / 4S drain.** A stepper (especially open-loop) often sits at holding current to keep a pose. Two hips + two knees, times a non-trivial hold current, is pack heat and a shorter 4S run even when the robot is standing still.

Do not “fix” roll weakness by stacking more belt ratio or a bigger NEMA. That is mass at the hip on the wrong machine class.

## Servos — honest for pose, not a lean

Serra's 40 kg-class servos are a **data point** that high-torque servos can pose jointed legs — **not** a Hux SKU and **not** a preference. Size either class for R36. Run servos on the **regulated** rail (R11), not raw 4S.

**GIM8108-8** is a noted *candidate* for knee / swing (not ordered). Treat it as a family data point next to “hobby servo” and “stepper + belt,” not a lock. See [`../parts-on-hand.md`](../parts-on-hand.md) Candidates.

## Other classes still on the table

Not a buy list.

| Class | Where it is honest | Still TBD |
| --- | --- | --- |
| **Stepper + belt / gear** | Open option for knee + hip **swing**. Pose hold. COTS pulleys. | Frame size, ratio, open- vs closed-loop, belt pitch, backlash budget |
| **High-torque servo class** | Open option for knee + hip **swing**. Simple integration if something on hand is strong enough. | Speed, reliability, regulated-rail voltage, whether it holds ~2× plant |
| **GIM8108-class** (or similar integrated BLDC + reduction) | Candidate for knee / swing. Not ordered. | Whether it is the honest pose class vs servo / stepper |
| **FOC BLDC + gearbox / cycloidal** | Hip **roll** (and any joint that needs rate + torque). Same family as the wheel-drive lean. | Ratio, backdrive, packaging at a ~10" stance |
| **Quasi-direct drive (QDD)** | Hip **roll** (prefer **small** QDD if this class is filled). Fast, proprioceptive, shock-tolerant | Mass at the joint, whether anything on hand is in this class |
| **Fast bus servo class** | Hip **roll** if a strong, fast unit is already on the bench and the bus is honest | Speed, reliability, whether it is actually backdrivable |
| **Linear + linkage + springs** | Matches R7. Can produce “rotation” at a joint | Stroke, force, whether it can do roll *and* swing |

Wheels: stay **FOC BLDC**. Do not put a stepper on the rim to “match the legs.”

No SKU. No shopping links. Prefer parts already on hand when a class is later filled.

## Recommendation — current working intent

1. **Knee + hip swing = servo vs stepper+belt TBD.** Both open, no lean. Size either for one-leg (~2×) load. GIM8108-8 is a candidate only.
2. **Hip roll is in V1.** Dynamic class: FOC BLDC / **small** QDD / fast bus servo. **Not a stepper. Not V2.** Experimental — it may not work as hoped. Still include the joint mechanically and in `LEFT_ONLY` / `RIGHT_ONLY`. One-leg CoG shift is a **V1 goal (best-effort)**, paired with planted-wheel fore/aft.
3. **Wheels = in-wheel brushless FOC.** Already R6 / R30. Not steppers.
4. **If someone later insists all joints are steppers (not the baseline):** require **closed-loop** steppers, **minimal-backlash** belts, and **accept even lower one-leg balance bandwidth**. That is R28 — a **risk**, not the plan.
5. **Mass does not veto (1)–(3).** A capable (even imperfect) roll actuator that blows the old 4–5 lb spreadsheet is allowed. A tiny stepper on roll that “saves” the budget and then misses steps is the worse trade. Skipping roll “until V2” is also not the baseline.

**FC TBD.** This note does not pick a flight controller, a stepper driver IC, a FOC board, a NEMA size, a servo SKU, or a belt pitch.

**I/O (R29):** 8 axes (2 wheel FOC + 4 pose + 2 hip-roll dynamic). If pose joints are steppers, the FC does **not** drive stepper coils — TMC-class / multi-axis driver board(s) sit in between. Preferred: FC = IMU + wheel FOC (+ roll if PWM/CAN); Pi or a dedicated stepper controller = 4× step/dir. Drone firmware as stepper host is a V1 anti-pattern. See [`../electronics.md`](../electronics.md).

## Mass (soft)

| Target | Status |
| --- | --- |
| **4–5 lb** (~1.8–2.3 kg) | Historical aspiration only |
| **Under 6 lb** | Historical soft preference. **Not a gate** (#15). |
| **Over 6 lb** | Allowed if it buys capability (roll bandwidth, closed-loop, one-leg, carbon-tube packaging). Record why. |

Do not reject a hip-roll class because it blows a spreadsheet. Do not spend mass on a stepper that cannot do the roll job. Fill budget lines when something is weighed — see [`../mechanical.md`](../mechanical.md).

## Heat, bus, and hold

- Battery lean is **4S LiPo class** (nominal ~14.8 V / full ~16.8 V) + **regulated step-down** for pose / logic (R11). Capacity / C **TBD**. Not a pack lock.
- Stepper **hold current** on four pose joints is a first-class 4S drain and a thermal path through printed housings — *if* that class is chosen.
- FOC BLDC / QDD can hold with less waste if the controller is in current / torque mode and the linkage + springs (R7) take gravity. That is one reason roll should not be an open-loop stepper.
- Do not invent a PDB / BEC / driver BOM here.

## Fabrication fit (COTS)

Belt + gear on swing / knee (if chosen) is aligned with **cheap COTS stock**: pulleys, belts, rod, shafting, bearings, fasteners. Printed: clamps, tensioners, pulley hubs, motor plates. That is the same rule as “do not print a spar.”

Belt on **roll** is still COTS — the objection is control physics, not printability.

Longer **~24"** carbon tubes mean longer belt runs if a belt is the reducer. Plan tension and service along the spar.

## What this note does not do

- Lock servo vs stepper+belt for knee / swing
- Lock a NEMA size, servo SKU, GIM8108 buy, tooth count, belt pitch, or gearbox ratio
- Paste buy links or treat a vendor page as a Hux BOM
- Pick an FC, a stepper driver, or a FOC stack
- Relicense or vendor XRobots / Hattori / Serra hardware
- Claim one-leg balance is solved because a stepper can hold a lean on the bench
- Spend

## Extract later (Phase A / B)

Write real notes here or in [`../../NOTES.md`](../../NOTES.md) when watched, not now:

- [ ] Which upstream machines use steppers vs BLDC vs servos on **swing** vs **roll** (do not assume they named the axes the way we do).
- [ ] How much belt backlash they tolerated on a balance joint vs a position joint.
- [ ] Whether their one-leg / lean axis is torque-mode or position-mode.
- [ ] Hold-current vs spring-assist: who lets the spring take gravity so the motor can drop current.

**Done when:** we can explain in our own words why V1 puts an experimental dynamic actuator on roll, leaves swing / knee class open, and sizes plant-side joints for ~2×, with citations, without a SKU.

## Pointers

- Requirements: [`../requirements.md`](../requirements.md) — R12 TBD class; R16 / R27 roll in V1; R24 mass soft; R26 axis roles; R29 I/O; R36 ~2×
- Mechanical: [`../mechanical.md`](../mechanical.md) — DOF split, COTS tubes, layout, mass sketch
- Electronics: [`../electronics.md`](../electronics.md) — 8-axis I/O, TMC-class drivers *if* steppers, preferred host split; 4S + step-down
- Hip-roll / one-leg loop: [`../software.md`](../software.md), R16–R18
- Inventory / candidates: [`../parts-on-hand.md`](../parts-on-hand.md)
- Study plan: [`study-plan.md`](study-plan.md)
