# V1-PROOF sizing screen

Generated from [model.json](../tools/v1-proof/model.json), revision 2026-09-28-A. All masses and geometry are allocations. **Hardware validation and fabrication release remain false.**

## Geometry and load assumptions

One four-bar parallelogram per side: two equal parallel links, with vertical separation equal at body and wheel carrier. One bearing-supported driven pivot and a 3:1 belt reduction per side; the servo shaft does not carry the robot. Both wheel contacts stay on level ground. Positive link angle is rearward from downward vertical. Dimensions refer to an upright chassis; a balancing robot needs pose-dependent pitch trim.

For link length L and angle q: axle rearward offset = L sin(q); pivot above axle = L cos(q); body top = wheel radius + L cos(q) + body allocation. Link angles 15–45 degrees avoid the straight-link toggle.

- Upright height 277.8–306.3 mm; outside wheel width 255 mm.
- Nominal height travel 28.47 mm; axle sweep 49.31 mm. Servo travel is 90 degrees through the 3:1 reduction.
- The axle sweep changes the center of mass relative to the contact line. Moving both wheels does not by itself remove that static offset. Measure whole-robot CoM and set a pitch trim for each height; verify it remains within the balancing envelope. Begin with pinned legs. If trim is excessive, reduce travel or revise the linkage inside this budget.

## Leg sizing

Use all robot mass as sprung mass for a conservative vertical-load screen: servo torque = m g share L sin(q) / (reduction × efficiency). Efficiency is an assumed 0.85. A 60/40 load split is the worst planned two-wheel condition, not a single-support claim.

At 3.0 kg, 60% load on one side and 45 degrees: **0.539 N·m** at the servo. Require **0.75 N·m mounted hold for 10 minutes**, plus a separately qualified 1.0 N·m short transient. No spring credit is used. Acceleration, horizontal forces, bearing friction and real efficiency require measurement. A 30 kg-cm (~2.94 N·m) advertised maximum is not a continuous rating.

## Wheel sizing

With a 100 mm wheel: rpm = speed / radius × 60 / (2 pi). Preliminary demand per wheel = m × [g tan(10 degrees) + 0.03 g] × radius / 2 × 2.5. The final multiplier provides preliminary allowance for omitted inertia and losses; it is not inverse dynamics or a stability proof.

At 3.0 kg and 0.5 m/s: **95.5 rpm**, **0.380 N·m** screening demand per wheel. A linear 12 V reference model evaluated at 9.9 V and a proposed 2.5 A current limit gives **0.596 N·m**. This is a feasibility estimate, not a usable continuous rating or a measured catch margin.

Qualify at least 0.50 N·m short peak at 96 rpm and 0.15 N·m continuous in the actual installation, both at minimum operating voltage. Initially cap RMS motor current at 1.2 A and short peak at 2.5 A; bench measurements must establish safe pulse duration, temperature limits and controller gains. The 9.9 V value is a loaded-voltage sizing assumption; the selected pack determines its actual low-voltage threshold. Smaller robots fall faster, and gearbox friction/backlash can defeat otherwise adequate torque numbers.

## Mass allocation

| Item | kg |
| --- | ---: |
| Two wheel gearmotors with encoders | 0.40 |
| Wheels, hubs and axle support bearings | 0.25 |
| Two leg servos | 0.14 |
| Links, pivots, belts and pulleys | 0.32 |
| Chassis and fasteners | 0.38 |
| Battery | 0.20 |
| MCU, IMU, receiver and drivers | 0.15 |
| Wiring, regulators and switches | 0.15 |
| Rest skids and bumpers | 0.12 |
| Unallocated mass allowance | 0.39 |
| **Total including unallocated allowance** | **2.50** |

The 3.0 kg limit is a redesign threshold. Reweigh after each stage. Do not add a Pi, cosmetic shell or larger battery by quietly consuming control margin.

## Evidence and limits

Official references checked 2026-09-28:

- [Pololu 4752 gearmotor](https://www.pololu.com/product/4752): Reference, not selected inventory. Stall torque/current are extrapolated, not continuous ratings.
- [Pololu G2 18v17 H-bridge](https://www.pololu.com/product/2991): Reference. Factory current limit is much too high; verify a lowered limit before motor operation.
- [Waveshare ST3215 series](https://www.waveshare.com/product/st3215-servo.htm): Select the 12 V variant when checking fit. 30 kg-cm is not a demonstrated continuous holding rating.
- [Waveshare ST3215 documentation](https://www.waveshare.com/wiki/ST3215_Servo): Current page specifies 6–12.6 V for the 12 V version. Confirm actual revision and protect against regenerative voltage rise.

The model does not validate full solid clearance, belt tooth engagement, bearing life, frame strength, CoM/inertia, contact friction, battery protection, control timing, thermal duty or closed-loop balance. Those checks are staged in the [build checklist](checklists/mechanical-v1.md). No simulated success or completed physical test is claimed.
