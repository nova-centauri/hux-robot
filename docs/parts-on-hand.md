# V1-PROOF parts and reuse inventory

**2026-10-03 controller/IMU arrival:** the user reports that one **Pico 2 with yellow pre-soldered headers and one LSM6DSO IMU are received**. The inspection, USB and sensor tests are not yet done. The October 2 Amazon order of the user has a **$30.58 combined total**. This brings the recorded project spend to **$173.70** and leaves **$726.30** under the $900 plan. This report supersedes the screenshot arrival estimate.

The item prices, the shipping/tax breakdown and the payment date remain unshown. The LSM6DSO IMU replaces the earlier Adafruit LSM6DSOX selection, subject to sensor qualification. Start the [Pico/IMU bring-up](checklists/2026-10-03-pico-bringup.md). [Remaining shopping list](bom.md#remaining-shopping-list).

**2026-10-02 arrival and 3D-print update:** the user reports that the **30:1 metal gearmotor and the DRV8874 DC motor drivers are received**. The user also reports that the **parts are 3D printed** and ready for the start of the mechanical tests. This changes the Pololu 4752 / 4035 bench baseline to received, untested. The receipt documents one motor and one driver. The total received driver count remains to confirm. The printed revision, material, quantities, dimensions and condition are unrecorded.

The ST3215 servo arrival is not reported. Start the [first mechanical fit session](checklists/2026-10-02-mechanical-fit.md). No fit, load or powered test is recorded yet. The recorded paid spend remains **$143.12**. We infer no more cost and no reuse credit.

**2026-10-01 motor inventory:** the user reports **one servo and two steppers**. The photos identify the servo as **Panasonic MSMD042G1A**. One photographed stepper has the label Astrosyn 610-024. The second label is unverified. These are untested bench/future reuse candidates, with no V1-PROOF substitution or reuse credit. [Photo evidence, specifications and fit assessment](#motor-stock-recorded-2026-10-01).

**2026-09-29 receipt reconciliation:** **one Pololu 4752 gearmotor and one DRV8874 driver are shipped**. **Two ST3215 servos are paid, and the latest vendor record says that they wait for shipment.** The recorded V1-PROOF spend is **$143.12**. This total includes shipping/tax.

The user confirmed the servo 12 V variant. Examine the labels on arrival. A bench supply is available, with ratings unconfirmed. [Paid orders and delivery evidence](purchases.md) · [Single-leg bench preparation](one-leg-bench.md).

**RobStride belongs to the future full-size Hux**, not to the current V1-PROOF build. The clarification of the user resolves the earlier ambiguity from the vendor-CAD notes. It does not confirm a RobStride order. The receipt establishes one purchased DRV8874 driver. The planned two-wheel robot still needs a second Pololu 4752 gearmotor. Confirm the received driver count and any more purchases before you decide if another driver is necessary.

Purchased parts count as new cash spend. We infer no reuse credit.

| Part / candidate reuse | Availability / condition | V1-PROOF use | Reuse credit currently counted |
| --- | --- | --- | ---: |
| F765-Wing, F722 boards, Mamba board | Historical mentions; verify exact board | MCU + built-in IMU if pins/timing work | $0 |
| ESP32 | Historical mention; revision/IMU unknown | Alternative controller or manual-link bridge | $0 |
| TBS Nano RX and compatible transmitter | Receiver mentioned historically; full link unconfirmed | Manual input | $0 |
| Pi 5 / existing laptop | Historical Pi mention; availability unconfirmed | Off-robot logging; no onboard Pi required | $0 |
| Pico 2 with yellow pre-soldered headers | 1 received per user and screenshot 2026-10-03; untested; individual price unshown within $30.58 controller/IMU order | USB/LED bring-up, then C/C++ controller qualification | $0 |
| SparkFun LSM6DSO Qwiic IMU | 1 received per user 2026-10-03; untested; individual price unshown within the $30.58 controller/IMU order | Main SPI and data-ready sensing; replaces the earlier LSM6DSOX choice after qualification | $0 |
| Pololu 4752 encoder gearmotors | 1 received per user 2026-10-02, untested; $60.95 goods, part of the $88.34 paid Pololu order; second motor still required | Dry-fit the received motor, then qualify one restrained wheel channel | $0 |
| ST3215 12 V servos | 2 paid; $42.38 goods + $12.40 shipping = $54.78; awaiting shipment in latest receipt; 12 V variant confirmed by user | Supported single-leg bench now; robot height adjustment after pinned-leg balance | $0 |
| Pololu 4035 DRV8874 drivers | Received per user 2026-10-02, untested; total delivered count pending; receipt covers 1 at $11.94 goods | H-bridge and current limiting for each wheel motor; confirm coverage of both channels | $0 |
| 3D-printed mechanical parts | Printed per user 2026-10-02; revision, material, quantities and fit unrecorded | Passive geometry and packaging checks; powered mounts and load capacity remain unqualified | $0 |
| Servo interface / adapter | Purchase/availability unconfirmed | Half-duplex TTL commands and feedback | $0 |
| Bench supply | Available per user 2026-09-29; model, voltage/current range and reverse-energy behavior pending | Sequential single-actuator tests after rating/interface checks | $0 |
| Panasonic MSMD042G1A industrial servo | 1 on hand per the user 2026-10-01; two photo views; untested, drive/harness/supply unknown | Bench/future mechanism candidate; 200 V-class drive and mass conflict with current proof | $0 |
| Stepper motors; one labeled Astrosyn 610-024 | 2 on hand per the user 2026-10-01; only one label verified; ratings and condition unknown | Positioning/fixture candidates after identification; no current axis assigned | $0 |
| Battery and balance charger | Cell count, condition and models unknown | Compatible 3S-class system or deliberate requalification | $0 |
| Wheels, hubs, bearings, belts, fasteners | None reserved | Approximately 100 mm wheel package and simple legs | $0 |
| Aluminum, plywood, tube, wire, connectors | Shop stock not inventoried | Frame, fixture and harness | $0 |

For each confirmed item, record the date, exact variant, quantity, condition, electrical limits and measured mass/envelope. Also record if the item is available for Hux. A vendor CAD file is not owned hardware. The presence of a board does not establish spare pins or compatible logic levels. A receiver needs a usable transmitter/link.

The [budget](bom.md) separates the **$173.70 recorded spend** from the **$900 planning ceiling**. Refer to the [order ledger](purchases.md) for the two itemized paid orders and the controller/IMU order with an unshown charge breakdown. New ordered components count one time as project spend. They are not zero-cost reuse. The remaining $726.30 includes unpurchased parts and reserves. The unknown breakdown of the new order prevents exact remaining allocations for parts and for freight/tax.

Give credit for equipment on hand only when it displaces a purchase. Do not count the same item two times, and do not spend the savings on new features. Keep the reserve. [Shop capabilities](capabilities.md) describes tools, not component stock.

The control baseline is [Pico 2 + SPI SparkFun LSM6DSO, Pololu 4035 wheel drivers and a compatible ST3215 interface](v1-proof-hardware.md). The Pico 2 and IMU receipt are confirmed. The servo interface and all electrical qualification remain open. The historical reuse candidates above get credit only after qualification.

## Motor stock recorded 2026-10-01

**Availability:** the user reports **one specialty servo and two stepper motors** on hand as reuse candidates. These are three physical motors, not three models. The two Panasonic photographs show opposite sides of the same servo. One stepper label is photographed. The identity of the second stepper is unverified.

No functional test results are recorded for Hux. The purchase prices, service history and storage location are unknown. **The V1-PROOF reuse credit remains $0.**

### Photo evidence

We retrieved the original JPEG bytes from Library and visually inspected them on 2026-10-01. The copies below keep their original filenames. We record the Library identity explicitly, so that you can trace a photo outside Library.

| Original photo | Library ID | What the pixels establish |
| --- | --- | --- |
| [IMG_9982.jpeg](assets/motor-inventory/2026-10-01/IMG_9982.jpeg) | `libfile_1ce799a09ee881918d8e30e7bddfccfa` | Panasonic model and main electrical/speed nameplate |
| [IMG_9981.jpeg](assets/motor-inventory/2026-10-01/IMG_9981.jpeg) | `libfile_c8ba5fc86b088191903ae1f0f1a11db9` | Opposite side of the servo; continuous torque, duty and enclosure label |
| [IMG_9983.jpeg](assets/motor-inventory/2026-10-01/IMG_9983.jpeg) | `libfile_c11fb44b4dbc8191b21fdada1d236742` | One Astrosyn motor marked 610-024, with wire leads |

### Panasonic MSMD042G1A — quantity 1

**Directly legible on the photos:** Panasonic AC servo motor, model **MSMD042G1A**. The input is **3-phase AC 106 V, 2.6 A**. The rated output is **0.4 kW**, the rated frequency is **200 Hz** and the rated speed is **3000 r/min**. The continuous torque is **1.3 N·m**, the duty is **S1** and the enclosure is **IP65**.

Cable sections are visible, but their ends, completeness, pinout and condition are not established. Exterior marks and shaft residue are visible. These do not establish the mechanical or electrical health. The availability of a drive for this motor, a complete power/encoder harness, a supply and a gearbox is unknown.

**Manufacturer specifications, checked for this exact suffix on 2026-10-01:** Panasonic identifies this motor as a discontinued MINAS A5, low-inertia motor. It has a nominal mass of **1.2 kg**, a **60 mm square flange**, a round shaft, no oil seal and **no holding brake**. The encoder is **20-bit incremental** (1,048,576 positions/revolution). The rated torque/speed are 1.3 N·m / 3000 rpm. The momentary peak torque is **3.8 N·m**, and the maximum speed is **5000 rpm**.

These maxima are separate limits, not a continuous operation point. The IP65 rating does not include the shaft portion that turns and the lead-wire ends. The actual mass, shaft dimensions, mount fit and condition remain unmeasured. [Panasonic MSMD042G1A specification and applicable-drive table](https://industry.panasonic.com/global/en/products/motor/fa-motor/ac-servo/number/msmd042g1a).

**Drive and voltage constraint:** the 106 V motor rating on the nameplate is not a supply-selection instruction. Panasonic lists 200 V-class compatible drives. One listed example, **MBDHT2510**, takes **200–240 VAC** main/control input and uses analog/pulse commands. It supports the 20-bit **5-wire serial** feedback of the motor. That drive is nominally **1.0 kg** and has no built-in regenerative resistor.

It is an example to identify equipment on hand, not a purchase recommendation. Other listed drive variants have different command interfaces, and RTEX is one of them. The motor model alone does not establish the installed control protocol. The USB on this example drive is for parameter settings and status readout. [Panasonic MBDHT2510 specifications](https://industry.panasonic.com/global/en/products/motor/fa-motor/ac-servo_driver/number/mbdht2510).

**Hux assessment — engineering inference:** keep this motor as bench/future-project stock. A geared position axis, a transmission experiment or a restrained actuator test fixture is possible after drive qualification. It is a poor fit for the active V1-PROOF. The bare motor is 40% of the 3.0 kg maximum of the robot, before the drive, supply and transmission. Its drive requirements do not match the 3S / 9 V architecture or the ST3215 TTL interface. One motor cannot supply a matched two-wheel pair.

Continuous 1.3 N·m is useful, but a 3000 rpm motor needs an application-specific reduction for slow joints/wheels. Examine the torque against speed, duty, transmission efficiency/backlash, reflected inertia, shaft loads and total mass. Peak torque is not sustained joint torque. The motor has no holding brake. Thus a gravity-loaded mechanism needs a qualified restraint or hold device when the power is removed. This motor does not establish a full-size Hux actuator choice, and it does not displace the future RobStride work.

### Stepper stock — quantity 2 total

**Direct photo evidence:** one motor has the marks **ASTROSYN**, **610-024** and `www.astrosyn.com`. Wire leads and surface wear are visible. No current, voltage, step angle or torque rating is legible. This view does not establish the complete lead count, the winding connections or the lead condition. The statement of the user establishes two steppers on hand. **Do not give both the label 610-024 until you examine the other unit.**

**Manufacturer verification:** we found no exact 610-024 datasheet in the [Astrosyn technical-data index](https://www.astrosyn.com/technical-data-sheets) or in exact-model searches on 2026-10-01. Thus the model-specific phase current, voltage, resistance/inductance, winding scheme, step angle, torque-speed curve, frame size, mass and shaft dimensions remain **unknown**. “024” is not evidence of a 24 V rating. A custom/OEM status is possible but unconfirmed. We do not substitute the specifications of a similar model.

**Hux assessment — engineering inference:** the steppers can be useful for a slow position fixture, a small linear stage or a mechanism prototype. First we must identify and measure them. No axis is assigned. Neither stepper is qualified to replace the encoder wheel motors or the feedback leg servos of V1-PROOF. The usable torque in motion, thermal duty, position feedback and response to lost steps are not established.

Make sure of the complete winding arrangement and the rated phase current before you select a compatible current-regulated stepper driver. Its supply voltage and current value must agree with the documented motor/driver configuration.

Winding voltage and driver bus voltage are different constraints. The driver, cables/connectors, power supply, encoder, gearbox and tested condition are all unknown. Measure the mass and the mount/shaft geometry. Compare the torque in motion at the necessary speed and reduction, not only the holding torque. The Astrosyn [drive-selection guide](https://www.astrosyn.com/wp-content/uploads/2015/10/Guide-to-Stepper-Motor-Drive-Selection.pdf) and [motor-selection guide](https://www.astrosyn.com/wp-content/uploads/2015/10/Guide-to-Stepper-Motor-Selection.pdf) give general selection principles, not ratings for 610-024.

### Evidence needed before reuse

1. Record the label of the second stepper and all other rating/wire labels on both steppers, or their original machine documentation. If no other label exists, get the exact-model winding/current specifications from Astrosyn.
2. Make an inventory of each Panasonic drive by its full model label, plus both cable ends/connectors and each external brake/gearbox. Make sure of the exact motor/encoder/drive combination and the command interface in its manual.
3. Record the measured mass, envelope, shaft/mount dimensions and unpowered condition for each unit. Before you plan a restrained powered test, resolve the intended load, reduction, supply, current/thermal limits, fault response and return-energy behavior.

**Disposition:** inventory only. Do not energize unknown wires, and do not buy a driver or a supply until those details are verified. The [locked V1-PROOF hardware](v1-proof-hardware.md), the [mass/power scope](v1-proof.md) and the current purchase totals remain the basis for the current robot.
