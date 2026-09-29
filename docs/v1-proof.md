# V1-PROOF

**A small, four-actuator wheeled robot for strictly less than $1,000.** Prove balance, manual driving and a small amount of leg motion using equipment already around the shop where practical. This is the active Hux plan; the [previous stair project](archive/stair-v1/README.md) is parked intact.

The user set the budget and scope reset on 2026-09-28. The later request adds reliable traversal, both turns, turning in place, bounded pushes/uneven terrain and component decisions. The [hardware baseline](v1-proof-hardware.md), [simulation evidence](v1-proof-simulation.md) and [physical protocol](v1-proof-validation.md) implement that request; they are not measured hardware capabilities.

## What we are building

Two rubber wheels, each driven by a small encoder gearmotor. One compact servo on each side adjusts a simple parallel-link leg through a 3:1 reduction. Both wheels stay on the floor. A rigid, accessible body carries a battery, controller and IMU. Use aluminum, plywood, suitable existing tube, brackets and standard fasteners; no carbon or styled shell requirement.

Start with lock pins in both legs. The first real success is a two-motor balancer. Those same wheels, electronics and frame carry forward when the two leg servos are added. Pinned legs are the first milestone, not a claim that the complete four-actuator proof is finished.

| Item | Proposed baseline |
| --- | --- |
| All-in new cash | $900 ceiling: $675 parts/fixture + $100 shipping/tax + $125 repairs/overruns |
| Hard spend limit | Strictly below $1,000 across all stages and replacements |
| Mass | 2.5 kg target, 3.0 kg maximum with battery |
| Overall envelope | About 278–306 mm upright height, 255 mm outside wheel width |
| Wheel diameter / track | 100 mm / 230 mm center to center |
| Leg adjustment | 110 mm parallel links, 15–45° from vertical, 3:1 reduction; 28.5 mm nominal height travel |
| Powered axes | Left wheel, right wheel, left leg adjustment, right leg adjustment |
| Ground | Dry indoor floor plus defined 3° / 5 mm bump / 3 mm seam test fixtures |
| Speed | 0.25 m/s cruise; 0.15 m/s on uneven fixtures; 0.5 m/s remains unqualified |
| Power | Compatible 3S pack, approximately 2.2 Ah; actual reused pack governs interfaces |
| Control | Pico 2 + LSM6DSOX SPI baseline; qualified reuse allowed; timed manual commands |
| Compute | Laptop logging initially; Pi optional off-robot, no new SBC requirement |

The [layout](../cad/layouts/v1-proof.svg) is an envelope sketch, not a fabrication release. The [sizing screen](v1-proof-sizing.md) exposes formulas and omissions. Small size reduces structural loads, but also makes the robot fall faster; low backlash and controller timing still matter.

## What the reset removes

Stairs, one-wheel balancing, roll joints, independent hip and knee pitch axes, active ankles, hopping, 1-inch sills, 20° slopes and walking-speed travel are out of scope. The earlier 24–26-inch head/leg package, 8S power system, CAN requirement, in-wheel BLDC requirement, eight/ten-axis BOM, ROS 2 companion, camera suite and digital-twin program are parked too. Their R1–R44 language is historical; [PF requirements](requirements.md) govern this build.

Carry forward service access, deliberate wiring, real mass accounting, known licenses, current limiting, fault handling and measured results. Reuse learning and software interfaces where useful. The old simulator is not evidence that the new robot balances, and the proof chassis need not ever climb stairs.

## Hardware route

**Wheel drives:** select **two Pololu 4752 12 V 30:1 encoder gearmotors** and **two Pololu 4035 DRV8874 H-bridges**. Keep 100 mm rubber tires, supported axles and 230 mm track. Qualify reversal/deadband, current control and torque near 96 rpm at loaded battery minimum. The smaller driver replaces the G2 reference; sleep/kill/watchdog behavior, hardware current limiting and current sensing are explicit bench gates. See [hardware details](v1-proof-hardware.md).

**Leg drives:** two selected Waveshare ST3215 servos, the 12 V / 30 kg-cm variant, each driving a bearing-supported pivot through a 3:1 belt reduction. The load goes through bearings and frame, not the servo spline. Full mass at a 60/40 two-wheel load split produces about 0.54 N·m static demand at the more heavily loaded servo in the preliminary model. Mounted testing must qualify 0.75 N·m hold for 10 minutes at the regulated 9 V rail at its lowest loaded output; advertised stall torque alone does not qualify it. Keep mechanical lock pins and travel stops.

The parallel-link leg also moves the axle about 49 mm fore/aft across the height range. That changes the pitch trim required to put the whole center of mass over the wheel contact line. Height changes begin slowly at zero travel command, with measured trim at each position. If the full range is impractical, reduce it or revise the linkage inside the same cost/mass budget; do not add another motor axis.

**Control and power:** select Pico 2 with a SPI LSM6DSOX IMU, two encoder channels, current/fault feedback and pack voltage measurement. A confirmed equivalent existing board can displace that purchase after pin/logic/timing qualification. Use 3S power with separate 9 V servo and 5 V logic branches and a measured regeneration path. **Zero onboard cameras**; use existing external video for trials. Battery/charger inventory and regulator/protection circuit details remain measured selections, not invented SKUs.

## Reuse and money

**2026-09-29 inventory update:** Pololu 4752 wheel motors and ST3215 12 V servos are ordered for V1-PROOF; delivery, ordered quantities and actual costs remain to record. A bench supply is available, with ratings pending. Historical notes mention Pi 5, ESP32, TBS Nano RX and F722/F765/Mamba boards, but they are not currently confirmed as available for Hux. Pack, charger, interfaces and structural stock remain unconfirmed. The [budget](bom.md) includes replacement allowances and takes **$0 in reuse credits**. Ordered actuators count toward new project spend. See the [inventory](parts-on-hand.md) and [single-leg bench plan](one-leg-bench.md).

Use confirmed equipment to lower cash spend, not to fund new features. Existing shop tools and the user's fabrication labor are outside the cash parts estimate; any new tooling, outsourcing, consumables or freight must fit the overall cap. If actual quotes plus reserves reach $1,000, stop buying and change the design. This plan itself places no orders.

## Finish line

Complete all of the following at the final measured mass. Core driving starts on dry level flooring; the separate disturbance fixtures extend it only after baseline success. A slack overhead catch or perimeter frame may catch a fall but must not carry load during successful trials. Rest skids must be clear of the floor while balancing.

1. **Balance:** hold two-wheel balance for 60 seconds without support contact in at least 9 of 10 starts. Log angle, wheel speed, battery voltage, current and faults.
2. **Manual drive:** at 0.25 m/s, travel 2 m forward and reverse; make 90° left/right arcs and full 360° rotations in both directions. Meet the endpoint/heading/settling limits and repeated runs in the [physical protocol](v1-proof-validation.md), including five combined sequences. 0.5 m/s stays unqualified.
3. **Leg motion:** with both wheels loaded and zero requested travel, complete 10 slow low-to-high-to-low cycles over the qualified range, targeting at least 25 mm body-height change. No support contact, servo overload or loss of balance. Measure actual body height; upright linkage travel alone does not prove it.
4. **Faults:** in the catch fixture, verify manual kill, stale command (>250 ms), stale IMU/encoder, controller reset and low battery disable drive and require deliberate rearming. Power-off is caught by the fixture/rest support; it does not promise an upright robot.
5. **Duty and budget:** complete a 10-minute mixed balance/drive/height session within tested electrical/thermal limits, with no resets. Final mass ≤3.0 kg, new cash expenditure < $1,000 including shipping, tax and replacement parts.

6. **Disturbances and uneven surfaces:** qualify the 0.8 N·s longitudinal and 0.4 N·s lateral pulses, both signs and durations, plus 3° grades/cross-slopes, 5 mm smooth bumps and 3 mm seams under the [specified physical protocol](v1-proof-validation.md). Strong human shoves and rough terrain remain outside the promised envelope.

All physical acceptance boxes are currently open. The [checklists](checklists/README.md) provide the staged work; the [model source](../tools/v1-proof/model.json) owns numerical planning assumptions.
