# Tazer — learn from the mistakes

Steve 2026-09-21: watch [My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM) (Tazer) and **learn a lot from this guy's mistakes**. Inspiration + anti-patterns. **Not a Hux stack, BOM, or CAD source.** No spend. FC stays **TBD**.

This sits next to [inspiration.md](inspiration.md). It does not replace [XRobots](xrobots.md), Hattori, Serra, or [study-plan.md](study-plan.md) Phases A–D.

Index: [`inspiration.md`](inspiration.md). Actuator trade: [`actuators-legs.md`](actuators-legs.md). Shop: [`../capabilities.md`](../capabilities.md). Power: [`../electronics.md`](../electronics.md). Decisions: [`../decisions.md`](../decisions.md).

## What he built (relevant to Hux)

Maker-scale **wheeled biped**, about **0.7 m (~2 ft)** tall — same height class as Hux's **~24"** full-extension envelope (R35).

| Piece (theirs) | Hux take |
| --- | --- |
| Octagonal **carbon-fiber tube** legs | Confirms Hux **carbon-tube spars** (R34). Steal the *material*, not their section or CAD. Tube OD / wall still TBD. No SKU. |
| **6× GIM8108** QDD-class actuators (2 joints + 1 wheel per leg) | **GIM8108-8** is already a Hux *candidate* for knee / swing — **not ordered, not locked**. His wheel motors being the same family is a data point, not a Hux wheel SKU. Knee / hip swing stay **servo vs stepper+belt TBD** (R12). Wheels stay **in-wheel FOC** (R6 / R30). |
| **CAN** between actuators | Pattern, not a bus lock. Hux I/O is TBD with the class. |
| Teensy 4.1 + BNO055 IMU | **Not a Hux FC.** Hux FC stays **TBD** (on-hand Wing / drone pile). Steal “IMU on the balance brain,” not the MCU. |
| T8S RC | Hux RX is **TBS Nano**. Steal stick *semantics*, not the radio. |
| Dual **6S in series (~48 V)** for actuators, buck for logic | Hux prefers **4S + regulated step-down** (R11). His bus is heavier than we want. The lesson is **serious power distribution for FOC stalls**, not “copy 48 V.” |
| Silicone / real rubber tires (not TPU) | Real rubber stands. The **5" Zantle is a bench donor, not the foot.** Settled contact is **6" OD**, torsionally stiff ([`leg-geometry.md`](leg-geometry.md)). Do not print TPU treads. |
| Backdrivable **low-reduction** actuators for impacts | Matches hip-roll **dynamic / QDD / fast servo** lean (R16 / R27). Do not put a stiff stepper on roll. |

**Do not** vendor his files, copy his 48 V stack, lock GIM8108, or buy a Teensy “because Tazer.”

## Mistakes / lessons to steal

Focus of this note. Rewrite in Hux terms.

1. **Wrong motors the first time.** Bad advice → wrong actuator type → **~$600 wasted**. Verify the *class* (QDD / backdrivable vs stiff position vs hobby servo) **before** anyone spends. Hux already forbids spend until Steve asks and forbids SKU locks. Treat “a friend said buy X” as a research pointer, not a cart.
2. **TPU tires = zero traction.** Use **real rubber / silicone**. Hux: not a printed TPU tread. The 5" walker donors are bench rubber only. The settled contact is a torsionally stiff **6"** tire ([`leg-geometry.md`](leg-geometry.md)).
3. **Power path underspec’d.** His actuators were about **7 A nominal / 22 A stall each**. Six axes can demand huge current. A PCB used as the power bus nearly blew. **Plan dedicated power distribution**, not skinny traces. Hux 4S is lighter than his 48 V stack and still needs a real bus for two FOC wheels + pose + roll stalls.
4. **Don’t feed all motor power through a delicate logic PCB.** Separate power plane / harness from the FC / Pi / IMU board. The FC is TBD — still do not route wheel-ESC current across it.
5. **CAN termination gotchas.** Actuators may already have terminators. He burned **14 hours** on this. If Hux later uses CAN (roll / QDD path), treat termination as a first-class bring-up item, not a footnote.
6. **Broken / weak actuator in the set.** ~40% torque mismatch, false power readings, encoder fail, random sleep. **Keep spares** (later, when Steve buys). Measure torque on the bench. Do not trust one unit. Do not buy a set yet.
7. **LQR with a bad model wasted time.** A **PID cascade** is what actually got balance working. Start simple. This is Hux **R18** (reuse existing control — XRobots IMU → PID → wheel torque) in someone else's blood. Do not invent an LQR / model-based Hux stack for V1.
8. **Absolute encoder / homing.** Swapping motors lost absolute pose. Plan **startup / home** or **absolute encoders from day one** — especially if pose joints are steppers (open-loop lies after a missed step) or QDD modules with multi-turn assumptions.
9. **Mechanical assembly orientation error.** A link on the wrong side made the robot too wide. Hux V1 width is **~10"** (R15). Use a fixture / checklist for left vs right (already a 2D + serviceability habit).
10. **Carbon dust safety.** Respirator + **wet cut** when cutting carbon tube. Shop note: [`../capabilities.md`](../capabilities.md). Do not dry-bandsaw a cloud of carbon into the mill.
11. **Single-point reliability before demos.** The robot broke the day before graduation. Design for **serviceability** (R22 already) and bring-up margin. Do not schedule a demo on the first machine that balances.
12. **Torque / speed limits in software matter.** A runaway joint is an injury risk. When firmware exists: clamp pose rates and wheel torque. Not a reason to write firmware now.

## Hux takeaways

1. **GIM8108-class is a live candidate** for knee / swing (and a data point for wheels). Still **not ordered**. Knee / hip swing remain **TBD**. Hip roll stays **dynamic in V1**.
2. **Carbon tubes are the confirmed path** (R34). His ~2 ft machine is a scale rhyme with Hux ~24".
3. **4S may be lighter than his ~48 V stack** — keep 4S + step-down (R11). Still need **serious PDB / harness** for FOC stalls. Do not use the FC or a logic PCB as the power bus.
4. **Prefer simple balance first** (PID cascade / existing patterns). LQR-with-a-wrong-model is how you lose a month. R18.
5. **Rubber, not TPU.** Zantle 5" is ordered as a bench donor. The foot is real rubber at **6"** ([`leg-geometry.md`](leg-geometry.md)). Not a buy.
6. **Log this as inspiration + anti-patterns**, not as a shopping list.

## Cite

- **Tazer** — [My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM)

What we took: anti-patterns (wrong first motors, TPU tires, skinny power, logic-PCB bus, CAN termination, bad unit in a set, LQR-too-early, no homing, left/right assembly, carbon dust, demo-eve breakage, missing software limits). What we did **not** copy: 48 V, Teensy, T8S, a GIM8108 buy, geometry, firmware.

## Do not

- Spend, or treat his 6× GIM8108 / 48 V / Teensy bill as a Hux spec
- Lock GIM8108, CAN, or a 48 V pack
- Print TPU treads as the traction plan
- Route motor current through the FC or a proto logic board
- Start V1 on LQR / a novel model-based stack
- Skip carbon-dust PPE
- Vendor his CAD / code
