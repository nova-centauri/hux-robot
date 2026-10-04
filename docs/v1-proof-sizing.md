# V1-PROOF sizing screen

The source of this screen is [model.json](../tools/v1-proof/model.json), revision 2026-09-28-B. All masses and geometry are allocations. **Hardware validation and fabrication release remain false.**

## Geometry and load assumptions

Each side has one four-bar parallelogram with two equal parallel links. The vertical separation of the links is the same at the body and at the wheel carrier. Each side has one bearing-supported driven pivot and a 3:1 belt reduction. The servo shaft does not carry the robot. Both wheel contacts stay on level ground. The positive link angle is rearward from the downward vertical.

The dimensions refer to an upright chassis. A robot that balances needs a pitch trim that changes with the pose.

For link length L and angle q: the axle rearward offset = L sin(q). The pivot above the axle = L cos(q). The body top = wheel radius + L cos(q) + body allocation. Link angles of 15–45 degrees stay clear of the straight-link toggle.

- The upright height is 277.8–306.3 mm. The outside wheel width is 255 mm.
- The nominal height travel is 28.47 mm. The axle sweep is 49.31 mm. The servo travel is 90 degrees through the 3:1 reduction.
- The axle sweep changes the center of mass relative to the contact line. Movement of both wheels alone does not remove that static offset. Measure the whole-robot CoM and set a pitch trim for each height. Make sure that the trim stays in the balance envelope. Start with pinned legs. If the trim is excessive, reduce the travel or revise the linkage inside this budget.

## Leg sizing

Use all robot mass as sprung mass for a conservative vertical-load screen: servo torque = m g share L sin(q) / (reduction × efficiency). The assumed efficiency is 0.85. A 60/40 load split is the worst planned two-wheel condition, not a single-support claim.

At 3.0 kg, 60% load on one side and 45 degrees: **0.539 N·m** at the servo. The requirement is a **0.75 N·m mounted hold for 10 minutes**, plus a separately qualified 1.0 N·m short transient. The screen uses no spring credit. We must measure acceleration, horizontal forces, bearing friction and real efficiency. A 30 kg-cm (~2.94 N·m) advertised maximum is not a continuous rating.

## Wheel sizing

With a 100 mm wheel: rpm = speed / radius × 60 / (2 pi). Preliminary demand per wheel = m × [g tan(10 degrees) + 0.03 g] × radius / 2 × 2.5. The final multiplier gives a preliminary allowance for omitted inertia and losses. It is not inverse dynamics or a stability proof.

At 3.0 kg and 0.5 m/s: **95.5 rpm**, **0.380 N·m** screen demand per wheel. A linear 12 V reference model evaluated at 9.9 V and a proposed 2.5 A current limit gives **0.596 N·m**. This is a feasibility estimate, not a usable continuous rating or a measured catch margin.

Qualify at least a 0.50 N·m short peak at 96 rpm in the actual installation. Also qualify 0.15 N·m continuous in the actual installation. Do both at the minimum operating voltage. At the start, limit the RMS motor current to 1.2 A and the short peak to 2.5 A. Bench measurements must set the safe pulse duration, the temperature limits and the controller gains.

The 9.9 V value is a loaded-voltage assumption of this sizing screen. The selected pack sets its actual low-voltage threshold. Smaller robots fall faster, and gearbox friction/backlash can defeat otherwise adequate torque numbers.

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

The 3.0 kg limit is a redesign threshold. Reweigh after each stage. Do not add a Pi, a cosmetic shell or a larger battery and quietly consume the control margin.

## Evidence and limits

We checked these official references on 2026-09-28:

- [Pololu 4752 gearmotor](https://www.pololu.com/product/4752): Selected baseline. 200 g each, 1920 quadrature counts/output revolution. Stall values are extrapolations.
- [Pololu 4035 DRV8874 carrier](https://www.pololu.com/product/4035): Selected baseline. 2.1 A carrier continuous rating in open-air tests. Adjustable limit and default sleep. The product page listed backorders at the review.
- [Waveshare ST3215 series](https://www.waveshare.com/product/st3215-servo.htm): Selected 12 V variant, powered from a regulated 9 V branch. 12 V advertised stall torque does not qualify 9 V hold duty.
- [Waveshare ST3215 documentation](https://www.waveshare.com/wiki/ST3215_Servo): The current page specifies 6–12.6 V for the 12 V version. Confirm the actual revision and protect against regenerative voltage rise.
- [Raspberry Pi Pico 2](https://www.raspberrypi.com/products/raspberry-pi-pico-2/): RP2350, C/C++ SDK, PIO encoders, SPI IMU, USB logs. The board timing is still not measured.
- [SparkFun LSM6DSO Qwiic SEN-18020](https://www.sparkfun.com/sparkfun-6-degrees-of-freedom-breakout-lsm6dso-qwiic.html): Received with the Pico 2, per user confirmation on October 3. The individual price in the $30.58 combined order is unconfirmed. Main SPI/I2C, exposed interrupts, 3.3 V supply/logic. It replaces the earlier Adafruit LSM6DSOX selection. Qualify readback and timing.
- [TI DRV8874 datasheet](https://www.ti.com/lit/ds/symlink/drv8874.pdf): Use the datasheet tolerances for current regulation and IPROPI sampling. Do a bench test of the braking and current-chopping behavior.

This sizing screen does not validate full solid clearance, belt engagement, bearing life, strength, measured CoM/inertia, contact friction, battery protection, control timing or thermal duty. The separate [closed-loop simulation report](v1-proof-simulation.md) covers pinned-leg maneuver and disturbance trials with explicit limitations. Powered height motion and all physical acceptance tests remain open. Refer to the [build checklist](checklists/mechanical-v1.md).
