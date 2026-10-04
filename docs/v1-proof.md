# V1-PROOF

**A small, four-actuator wheeled robot for strictly less than $1,000**. Prove balance, manual drive and a small amount of leg motion. Use equipment that is already in the shop where practical. This is the active Hux plan. The [previous stair project](archive/stair-v1/README.md) is parked intact.

The user set the budget and scope reset on 2026-09-28. The later request adds reliable traversal, both turns, turns in place, bounded pushes/uneven terrain and component decisions. The [hardware baseline](v1-proof-hardware.md), [simulation evidence](v1-proof-simulation.md) and [physical protocol](v1-proof-validation.md) put that request into effect. They are not measured hardware capabilities.

## What we are building

Two rubber wheels. A small wheel gearmotor with an encoder drives each wheel. One compact leg servo on each side adjusts a simple parallel-link leg through a 3:1 reduction. Both wheels stay on the floor. A rigid, accessible body carries a battery, a controller and an IMU.

Use aluminum, plywood, suitable tube on hand, brackets and standard fasteners. There is no requirement for carbon or a styled shell.

Start with lock pins in both legs. The first real success is a two-motor balancer. Those same wheels, electronics and frame carry forward when we add the two leg servos. Pinned legs are the first milestone, not a claim that the complete four-actuator proof is complete.

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
| Control | Pico 2 + LSM6DSO SPI baseline; qualified reuse allowed; timed manual commands |
| Compute | Laptop logging initially; Pi optional off-robot, no new SBC requirement |

The [layout](../cad/layouts/v1-proof.svg) is an envelope sketch, not a fabrication release. The [sizing screen](v1-proof-sizing.md) shows the formulas and the omissions. A small size reduces the structural loads, but it also makes the robot fall faster. Low backlash and controller timing still matter.

## What the reset removes

Stairs, one-wheel balance, roll joints, independent hip and knee pitch axes, active ankles, hops, 1-inch sills, 20° slopes and walking-speed travel are out of scope. The earlier 24–26-inch head/leg package, 8S power system, CAN requirement and in-wheel BLDC requirement are parked too. So are the eight/ten-axis BOM, the ROS 2 companion, the camera suite and the digital-twin program. Their R1–R44 language is historical. The [PF requirements](requirements.md) govern this build.

Carry forward service access, a deliberate wire harness, real mass records, known licenses, current limits, fault response and measured results. Reuse the lessons and the software interfaces where useful. The old simulator is not evidence that the new robot balances. There is no requirement that the proof chassis ever climb stairs.

## Hardware route

**Wheel drives:** select **two Pololu 4752 12 V 30:1 encoder gearmotors** and **two Pololu 4035 DRV8874 H-bridges**. Keep the 100 mm rubber tires, the supported axles and the 230 mm track. Qualify the reversal/deadband, the current control and the torque near 96 rpm at the loaded battery minimum. The smaller driver replaces the G2 reference. The sleep/kill/watchdog behavior, the hardware current limit and the current sense are explicit bench gates. Refer to the [hardware details](v1-proof-hardware.md).

**Leg drives:** two selected ST3215 servos, the 12 V / 30 kg-cm variant. Each drives a bearing-supported pivot through a 3:1 belt reduction. The load goes through the bearings and the frame, not the servo spline.

In the preliminary model, the full mass at a 60/40 two-wheel load split produces approximately 0.54 N·m static demand. This is at the servo with the heavier load. A mounted test must qualify a 0.75 N·m hold for 10 minutes at the regulated 9 V rail at its lowest loaded output. The advertised stall torque alone does not qualify it. Keep the mechanical lock pins and the travel stops.

The parallel-link leg also moves the axle approximately 49 mm fore/aft across the height range. That changes the pitch trim that puts the whole center of mass over the wheel contact line. Height changes start slowly at zero travel command, with measured trim at each position. If the full range is impractical, reduce it or revise the linkage in the same cost/mass budget. Do not add another motor axis.

**Control and power:** use the received Pico 2 with the ordered LSM6DSO IMU on SPI, two encoder channels, current/fault feedback and pack voltage measurement. A confirmed equivalent board on hand can displace that purchase after pin/logic/timing qualification. Use 3S power with separate 9 V servo and 5 V logic branches and a measured regeneration path. **Zero onboard cameras**. Use external video on hand for the trials. The battery/charger inventory and the regulator/protection circuit details remain measured selections, not invented SKUs.

## Reuse and money

**2026-10-03 controller/IMU update:** one Pico 2 with pre-soldered headers is received, untested. Start the [USB/LED checks](checklists/2026-10-03-pico-bringup.md). The LSM6DSO IMU is also received, per the user. It replaces the earlier Adafruit LSM6DSOX selection. The sensor qualification remains open.

The combined controller/IMU order total is $30.58. This brings the recorded spend to **$173.70**, with **$726.30** remaining under the $900 plan. The individual prices and the charge breakdown are unshown. This supersedes the controller/IMU availability and the current spend in the older dated update below.

**2026-10-02 inventory update:** the user reports the **30:1 motor and DRV8874 drivers received, and parts 3D printed**, ready for the [first mechanical fit session](checklists/2026-10-02-mechanical-fit.md). Paid receipts cover **one Pololu 4752 motor, one Pololu 4035 driver and two ST3215 servos** (12 V variant confirmed by user). **$143.12 is recorded paid**. This total includes shipping/tax.

A second wheel gearmotor is still necessary. The total received driver count and the servo arrival remain to confirm. The printed revision, material and fit are unrecorded.

These purchased models lock the actuator baseline for V1-PROOF. [Order evidence](purchases.md). A bench supply is available, with its ratings not yet confirmed. Historical notes mention Pi 5, ESP32, TBS Nano RX and F722/F765/Mamba boards. They are not currently confirmed as available for Hux. The pack, charger, interfaces and remaining structural stock remain unconfirmed.

The [budget](bom.md) includes replacement allowances and takes **$0 in reuse credits**. Ordered actuators count toward new project spend. Refer to the [inventory](parts-on-hand.md) and the [single-leg bench plan](one-leg-bench.md).

Use confirmed equipment to lower the cash spend, not to fund new features. Shop tools on hand and the user's fabrication labor are outside the cash parts estimate. Any new tools, outsourced work, consumables or freight must fit the overall cap. If actual quotes plus reserves reach $1,000, stop the purchases and change the design. This plan itself places no orders.

## Finish line

Complete all of the items below at the final measured mass. Core drive trials start on a dry level floor. The separate disturbance fixtures extend them only after baseline success. A slack overhead catch or a perimeter frame can catch a fall but must not carry load during successful trials. The rest skids must be clear of the floor during balance.

1. **Balance:** hold two-wheel balance for 60 seconds without support contact in at least 9 of 10 starts. Log the angle, wheel speed, battery voltage, current and faults.
2. **Manual drive:** at 0.25 m/s, travel 2 m forward and reverse. Make 90° left/right arcs and full 360° rotations in both directions. Meet the endpoint/heading/settling limits and the repeated runs in the [physical protocol](v1-proof-validation.md), with five combined sequences included. 0.5 m/s stays unqualified.
3. **Leg motion:** with both wheels loaded and zero requested travel, complete 10 slow low-to-high-to-low cycles over the qualified range. Target at least 25 mm body-height change. No support contact, servo overload or loss of balance. Measure the actual body height. Upright linkage travel alone does not prove it.
4. **Faults:** in the catch fixture, make sure that manual kill, stale command (>250 ms), stale IMU/encoder, controller reset and low battery disable the drive. Each must need a deliberate rearm. The fixture/rest support catches the robot at power-off. Power-off does not promise an upright robot.
5. **Duty and budget:** complete a 10-minute mixed balance/drive/height session within the tested electrical/thermal limits, with no resets. Final mass ≤3.0 kg. New cash expenditure < $1,000 with shipping, tax and replacement parts included.

6. **Disturbances and uneven surfaces:** qualify the 0.8 N·s longitudinal and 0.4 N·s lateral pulses, both signs and durations. Also qualify 3° grades/cross-slopes, 5 mm smooth bumps and 3 mm seams under the [specified physical protocol](v1-proof-validation.md). Strong human shoves and rough terrain remain outside the promised envelope.

All physical acceptance boxes are currently open. The [checklists](checklists/README.md) give the staged work. The [model source](../tools/v1-proof/model.json) owns the numerical planning assumptions.
