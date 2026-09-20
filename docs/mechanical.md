# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Mass is **aspirational 4–5 lb / under 6 lb** — soft, OK to exceed for capability. Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- V1 mass lean is **aspirational 4–5 lb / under 6 lb**. Not a hard ceiling. OK to exceed for a capable hip-roll joint.
- **Knee + hip swing** may be **stepper + belt/gear**. **Hip roll** prefers FOC BLDC / QDD / fast bus servo. Trade: [`research/actuators-legs.md`](research/actuators-legs.md).

## Mass (aspirational, not a gate)

Steve 2026-09-20 (later update). **4–5 lb** is the aim. **Under 6 lb** is nice. Neither is a kill-switch. If a concurrent mass note lands **R24** as a hard ceiling, this update supersedes that hardness.

Exceeding 6 lb is allowed when it buys capability (hip-roll torque bandwidth, closed-loop hardware, one-leg). Record why when a real weigh-in exists. Do not reject a roll class to protect a spreadsheet. Do not spend the extra mass on a stepper that cannot do roll.

Budget *lines* stay TBD until something is weighed. A concurrent note may add a table; empty TBD is correct. This page does not invent grams.

## Hip / knee / roll — class split (TBD)

Do not lock a part. Hip **swing** (rotation / pitch) and hip **roll** (CoG angling) are different joints.

| DOF | Lean (TBD) | Why |
| --- | --- | --- |
| Knee; hip **swing** | **Stepper + belt/gear** allowed | Position + pose hold. Cheap. COTS NEMA-class or smaller. Belt reduction = torque + resolution. Fits pulleys / belts / rod on COTS stock (R19 when that lands). |
| Hip **roll** | Prefer **FOC BLDC / QDD / fast bus servo** | High-rate torque, ideally backdrivable. In the CoG loop with the planted wheel. Steppers miss steps under impact, resonate, and add belt stretch/backlash. |
| Wheels | FOC BLDC (already R6) | Balance actuator. Not a stepper. |

If Steve insists **all** joints are steppers: closed-loop, minimal-backlash belts, and **accept lower one-leg bandwidth**. That is a risk (R28), not something firmware will erase.

R7 (linkages + springs) still stands. A stepper on swing/knee can drive a linkage; springs still assist gravity. Belt-on-the-joint is reduction, not “pure serial belts instead of a linkage.”

No SKU. No spend. Full honesty: [`research/actuators-legs.md`](research/actuators-legs.md).

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke.
- [ ] Pick a printable wheel-leg envelope (one side only).
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Leg actuator *class* split: stepper+belt allowed on knee / hip swing; hip roll prefers FOC BLDC / QDD / fast bus servo. No SKU, no buy. See [`research/actuators-legs.md`](research/actuators-legs.md).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.
- [ ] Running mass check vs **aspirational** 4–5 lb / under 6 lb. Overrun is allowed if it buys capability — write down why.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. No stepper, pulley, or FOC-board purchase either.
- Locking an FC mount before the FC is chosen.
- Locking a NEMA size, belt pitch, or hip-roll SKU.
- Treating under 6 lb as a hard gate that kills a capable roll actuator.

CAD drops in [`../cad/`](../cad/).
