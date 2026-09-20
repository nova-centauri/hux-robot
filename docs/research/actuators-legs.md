# Leg actuators — stepper + belt/gear trade study

Steve **2026-09-20** (later update). Honest trade study. **No spend. No locked SKU. FC stays TBD.**

This note is the working write-up for *very small stepper motors* on knees and hips, with **belt + gear** for precision and torque multiplication. It does not pick a part. It does not replace [`../requirements.md`](../requirements.md) or [`../mechanical.md`](../mechanical.md). Candidate *classes* for hip/knee may also land in those files from a concurrent electric / 4S / actuator note (R12 when that lands).

A dedicated `actuators-steppers.md` would only repeat the same per-DOF split. The useful question is **which joints get a stiff position machine**, not a stepper catalog. One file.

## Why this note exists

Two updates arrived the same day:

1. **Mass budget may be blown.** Under **6 lb** / aspirational **4–5 lb** is a **soft** target, not a hard gate. It is OK to exceed for capability (hip-roll bandwidth, closed-loop hardware, one-leg). If a concurrent note lands **R24** as a hard ceiling, **this update supersedes that hardness.** ID and wording: [`../requirements.md`](../requirements.md) R24 / R26–R28.
2. Steve is considering **very small steppers** for knees and hips, plus **belt + gear** reduction.

Wheels stay **FOC BLDC** (R6; reaction-speed / torque-bandwidth class when R25 lands). This note is about **leg** DOFs.

## DOF map (do not collapse these)

| DOF | Job on Hux | What the actuator must do |
| --- | --- | --- |
| **Hip rotation / swing** (hip *pitch*) | Lift and swing a wheeled leg for the stair cycle | Repeatable position. Hold a pose while the other side balances. Speed matters; it is not the CoG loop. |
| **Knee** | Fold / extend for stroke and ~9.5" clearance | Same class of problem as hip swing: position, hold, COTS reduction. |
| **Hip roll** (balance angling) | Shift body CoG over the **planted** wheel for one-leg (`LEFT_ONLY` / `RIGHT_ONLY`) | High-rate **torque** corrections. Ideally **backdrivable**. Pairs with planted-wheel fore/aft (inverted-pendulum pitch). Distinct from swing (R16 / R17 when those land). |
| **Wheels** | Contact, yaw, and pitch balance | Already brushless. Prefer FOC / torque-mode. Not a stepper problem. |

Hip swing and hip roll are **different joints**. A stepper that is fine on swing can still be the wrong machine on roll.

## Steppers + belt/gear — good for

**Hip rotation (swing) and knee position DOFs.**

- **Precise and cheap.** COTS **NEMA-class or smaller** steppers plus pulleys are a known hobby pattern. Belt reduction multiplies torque **and** position resolution (more motor steps per joint degree).
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

Not a winner board. Not a buy list. Same honesty as the concurrent hip/knee TBD note:

| Class | Where it is honest | Still TBD |
| --- | --- | --- |
| **Stepper + belt / gear** | Knee + hip **swing**. Pose hold. COTS pulleys. | Frame size, ratio, open- vs closed-loop, belt pitch, backlash budget |
| **FOC BLDC + gearbox / cycloidal** | Hip **roll** (and any joint that needs rate + torque). Same family as the wheel-drive lean. | Ratio, backdrive, packaging at a ~10" stance |
| **Quasi-direct drive (QDD)** | Hip **roll**. Fast, proprioceptive, shock-tolerant | Mass at the joint, whether anything on hand is in this class |
| **Fast bus servo class** | Hip **roll** if a strong, fast unit is already on the bench and the bus is honest | Speed, reliability, 4S-side voltage, whether it is actually backdrivable |
| **Linear + linkage + springs** | Matches R7. Can produce “rotation” at a joint | Stroke, force, whether it can do roll *and* swing |

Wheels: stay **FOC BLDC**. Do not put a stepper on the rim to “match the legs.”

No SKU. No shopping links. Prefer parts already on hand when a class is later filled.

## Recommendation (lean, TBD)

Not locked. Steve can flip this. Written so we do not pretend all four joints want the same motor.

1. **Allow steppers + belt/gear for knee + hip swing (rotation).** Precise, cheap, COTS, fine for position and pose. Closed-loop preferred if the part is on hand; open-loop is acceptable for early swing/knee fixtures if we treat missed steps as a known risk, not a surprise.
2. **Prefer FOC BLDC / QDD / fast bus servo for hip roll.** That joint is in the CoG loop with the planted wheel. It wants torque bandwidth and, ideally, backdrivability. Wheels stay FOC BLDC as already noted.
3. **If Steve insists all joints are steppers:** require **closed-loop** steppers (encoder that the driver actually uses), **minimal-backlash** belts (short spans, proper tension, no lazy idler stacks), and **accept lower one-leg balance bandwidth**. Document that as a **risk**, not a plan we will optimize away in firmware. Do not fake a CoG shift in software to cover a stiff roll joint.
4. **Mass does not veto (1) or (2).** A capable roll actuator that pushes V1 past 6 lb is allowed. A tiny stepper on roll that “saves” the budget and then misses steps is the worse trade.

**FC TBD.** This split does not pick a flight controller, a stepper driver IC, or a FOC board.

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

**Done when:** we can explain in our own words why swing/knee may be steppers and roll probably should not, with citations, without a SKU.

## Pointers

- Requirements: [`../requirements.md`](../requirements.md) — R24 mass (aspirational); R26–R28 class split
- Mechanical: [`../mechanical.md`](../mechanical.md) — DOF split, COTS belts, mass sketch
- Electronics: [`../electronics.md`](../electronics.md) — drivers as classes; hold current; wheels stay FOC
- Hip-roll / one-leg loop (when that note lands): [`../software.md`](../software.md), R16–R18
- Study plan: [`study-plan.md`](study-plan.md)
