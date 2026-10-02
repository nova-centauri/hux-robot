# V1-PROOF parts and reuse inventory

**2026-10-02 arrival and printing update:** the user reports the **30:1 metal gearmotor and DRV8874 DC motor drivers received**, and the **parts 3D printed**, ready to begin mechanical testing. This updates the existing Pololu 4752 / 4035 bench baseline to received, untested. The receipt documents one motor and one driver; the total received driver count remains to confirm. Printed revision, material, quantities, dimensions and condition are unrecorded. ST3215 arrival is not reported. Begin the [first mechanical fit session](checklists/2026-10-02-mechanical-fit.md); no fit, load or powered test is recorded yet. Recorded paid spend remains **$143.12**; no additional cost or reuse credit is inferred.

**2026-10-01 motor inventory:** Steve reports **one servo and two steppers**; the photos identify the servo as **Panasonic MSMD042G1A**. One photographed stepper is labeled Astrosyn 610-024; the second label is unverified. These are untested bench/future reuse candidates, with no V1-PROOF substitution or reuse credit. [Photo evidence, specifications and fit assessment](#motor-stock-recorded-2026-10-01).

**2026-09-29 receipt reconciliation:** **one Pololu 4752 wheel motor and one Pololu 4035 DRV8874 driver are shipped; two ST3215 servos are paid and awaiting shipment in the latest vendor record.** Recorded V1-PROOF spend is **$143.12**, including shipping/tax. The user confirmed the servo 12 V variant; verify labels on arrival. A bench supply is available, with ratings unconfirmed. [Paid orders and delivery evidence](purchases.md) · [Single-leg bench preparation](one-leg-bench.md).

**RobStride belongs to the future full-size Hux**, not the current V1-PROOF build. The user's clarification resolves the earlier ambiguity from vendor-CAD notes; it does not confirm a RobStride order. The receipt establishes one purchased Pololu 4035 DRV8874 wheel driver. The planned two-wheel robot still needs a second 4752 motor; confirm received driver count and any additional purchase before deciding whether another driver is needed. Purchased parts count as new cash spend; no reuse credit is inferred.

| Part / candidate reuse | Availability / condition | V1-PROOF use | Reuse credit currently counted |
| --- | --- | --- | ---: |
| F765-Wing, F722 boards, Mamba board | Historical mentions; verify exact board | MCU + built-in IMU if pins/timing work | $0 |
| ESP32 | Historical mention; revision/IMU unknown | Alternative controller or manual-link bridge | $0 |
| TBS Nano RX and compatible transmitter | Receiver mentioned historically; full link unconfirmed | Manual input | $0 |
| Pi 5 / existing laptop | Historical Pi mention; availability unconfirmed | Off-robot logging; no onboard Pi required | $0 |
| Pololu 4752 encoder gearmotors | 1 received per user 2026-10-02, untested; $60.95 goods, part of the $88.34 paid Pololu order; second motor still required | Dry-fit the received motor, then qualify one restrained wheel channel | $0 |
| ST3215 12 V servos | 2 paid; $42.38 goods + $12.40 shipping = $54.78; awaiting shipment in latest receipt; 12 V variant confirmed by user | Supported single-leg bench now; robot height adjustment after pinned-leg balance | $0 |
| Pololu 4035 DRV8874 drivers | Received per user 2026-10-02, untested; total delivered count pending; receipt covers 1 at $11.94 goods | H-bridge and current limiting for each wheel motor; confirm coverage of both channels | $0 |
| 3D-printed mechanical parts | Printed per user 2026-10-02; revision, material, quantities and fit unrecorded | Passive geometry and packaging checks; powered mounts and load capacity remain unqualified | $0 |
| Servo interface / adapter | Purchase/availability unconfirmed | Half-duplex TTL commands and feedback | $0 |
| Bench supply | Available per user 2026-09-29; model, voltage/current range and reverse-energy behavior pending | Sequential single-actuator tests after rating/interface checks | $0 |
| Panasonic MSMD042G1A industrial servo | 1 on hand per Steve 2026-10-01; two photo views; untested, drive/harness/supply unknown | Bench/future mechanism candidate; 200 V-class drive and mass conflict with current proof | $0 |
| Stepper motors; one labeled Astrosyn 610-024 | 2 on hand per Steve 2026-10-01; only one label verified; ratings and condition unknown | Positioning/fixture candidates after identification; no current axis assigned | $0 |
| Battery and balance charger | Cell count, condition and models unknown | Compatible 3S-class system or deliberate requalification | $0 |
| Wheels, hubs, bearings, belts, fasteners | None reserved | Approximately 100 mm wheel package and simple legs | $0 |
| Aluminum, plywood, tube, wire, connectors | Shop stock not inventoried | Frame, fixture and harness | $0 |

For each confirmed item record date, exact variant, quantity, condition, electrical limits, measured mass/envelope and whether it is available for Hux. A vendor CAD file is not owned hardware. A board's presence does not establish spare pins or compatible logic levels. A receiver needs a usable transmitter/link.

The [budget](bom.md) now separates **$143.12 paid** from the **$900 planning ceiling**. See the [two paid orders](purchases.md) for shipping/tax and goods totals. Newly ordered components count once as project spend; they are not zero-cost reuse. The remaining $756.88 includes unpurchased parts and reserves. Credit existing equipment only when it actually displaces a purchase; do not count the same item twice or spend the savings on new features. Keep the reserve. [Shop capabilities](capabilities.md) describes tools, not component stock.

The control baseline remains [Pico 2 + SPI LSM6DSOX, Pololu 4035 wheel drivers and a compatible ST3215 interface](v1-proof-hardware.md). Controller, IMU and servo interface ownership are not established by these receipts. Historical reuse candidates above earn credit only after qualification.

## Motor stock recorded 2026-10-01

**Availability:** Steve reports **one specialty servo and two stepper motors** on hand for reuse consideration. These are three physical motors, not three models: the two Panasonic photographs show opposite sides of the same servo. One stepper label is photographed; the second stepper's identity is unverified. No functional test results are recorded for Hux. Purchase prices, service history and storage location are unknown; **V1-PROOF reuse credit remains $0**.

### Photo evidence

The original JPEG bytes were retrieved from Library and visually inspected on 2026-10-01. Copies below retain their original filenames. Library identity is recorded explicitly so a photo can be traced even outside Library.

| Original photo | Library ID | What the pixels establish |
| --- | --- | --- |
| [IMG_9982.jpeg](assets/motor-inventory/2026-10-01/IMG_9982.jpeg) | `libfile_1ce799a09ee881918d8e30e7bddfccfa` | Panasonic model and main electrical/speed nameplate |
| [IMG_9981.jpeg](assets/motor-inventory/2026-10-01/IMG_9981.jpeg) | `libfile_c8ba5fc86b088191903ae1f0f1a11db9` | Opposite side of the servo; continuous torque, duty and enclosure label |
| [IMG_9983.jpeg](assets/motor-inventory/2026-10-01/IMG_9983.jpeg) | `libfile_c11fb44b4dbc8191b21fdada1d236742` | One Astrosyn motor marked 610-024, with wire leads |

### Panasonic MSMD042G1A — quantity 1

**Directly legible on the photos:** Panasonic AC servo motor, model **MSMD042G1A**; input **3-phase AC 106 V, 2.6 A**; rated output **0.4 kW**; rated frequency **200 Hz**; rated speed **3000 r/min**; continuous torque **1.3 N·m**; duty **S1**; **IP65**. Cable sections are visible, but their ends, completeness, pinout and condition are not established. Exterior marks and shaft residue are visible; these do not establish mechanical or electrical health. Matching drive, complete power/encoder harness, supply and gearbox availability are unknown.

**Manufacturer specifications, checked for this exact suffix on 2026-10-01:** Panasonic identifies this as a discontinued MINAS A5, low-inertia motor. Nominal mass **1.2 kg**, **60 mm square flange**, round shaft, no oil seal and **no holding brake**. The encoder is **20-bit incremental** (1,048,576 positions/revolution). Rated torque/speed are 1.3 N·m / 3000 rpm; momentary peak torque is **3.8 N·m**, maximum speed **5000 rpm**. These maxima are separate limits, not a continuous operating point. The IP65 rating excludes the rotating shaft portion and lead-wire ends. Actual mass, shaft dimensions, mounting fit and condition remain unmeasured. [Panasonic MSMD042G1A specification and applicable-drive table](https://industry.panasonic.com/global/en/products/motor/fa-motor/ac-servo/number/msmd042g1a).

**Drive and voltage constraint:** The nameplate's 106 V motor rating is not a supply-selection instruction. Panasonic lists 200 V-class compatible drives. One listed example, **MBDHT2510**, takes **200–240 VAC** main/control input, uses analog/pulse commands and supports the motor's 20-bit **5-wire serial** feedback. That drive is nominally **1.0 kg** and has no built-in regenerative resistor. It is an example to identify existing equipment, not a purchase recommendation. Other listed drive variants have different command interfaces, including RTEX; the motor model alone does not establish the installed control protocol. USB on this example drive is for parameter setting/status monitoring. [Panasonic MBDHT2510 specifications](https://industry.panasonic.com/global/en/products/motor/fa-motor/ac-servo_driver/number/mbdht2510).

**Hux assessment — engineering inference:** Retain as bench/future-project stock. A geared positioning axis, transmission experiment or restrained actuator test fixture is plausible after drive qualification. It is a poor fit for active V1-PROOF: the bare motor is 40% of the robot's 3.0 kg maximum, before drive, supply and transmission. Its drive requirements do not match the 3S / 9 V architecture or ST3215 TTL interface, and one motor cannot supply a matched two-wheel pair. Continuous 1.3 N·m is useful, but a 3000 rpm motor needs application-specific reduction for slow joints/wheels. Check torque versus speed, duty, transmission efficiency/backlash, reflected inertia, shaft loads and total mass; peak torque is not sustained joint torque. With no holding brake, a gravity-loaded mechanism needs a qualified restraint or holding arrangement when power is removed. This motor does not establish a full-size Hux actuator choice or displace its future RobStride work.

### Stepper stock — quantity 2 total

**Direct photo evidence:** One motor bears **ASTROSYN**, **610-024** and `www.astrosyn.com`. Wire leads and surface wear are visible. No current, voltage, step angle or torque rating is legible. Complete lead count, winding connections and lead condition cannot be established from this view. Steve's statement establishes two steppers on hand; **do not label both 610-024 until the other unit is checked**.

**Manufacturer verification:** No exact 610-024 datasheet was found in the [Astrosyn technical-data index](https://www.astrosyn.com/technical-data-sheets) or exact-model searches on 2026-10-01. Model-specific phase current, voltage, resistance/inductance, winding scheme, step angle, torque-speed curve, frame size, mass and shaft dimensions therefore remain **unknown**. “024” is not evidence of a 24 V rating. Custom/OEM status is possible but unconfirmed; no neighboring model's specifications are substituted.

**Hux assessment — engineering inference:** Potentially useful for a slow positioning fixture, small linear stage or mechanism prototype once identified and measured. No axis is assigned. Neither is qualified to replace V1-PROOF's encoder wheel motors or feedback leg servos: usable moving torque, thermal duty, positional feedback and response to lost steps are unestablished. Verify the complete winding arrangement and rated phase current before selecting a compatible current-regulated stepper driver; its supply voltage and current setting must match the documented motor/driver configuration. Winding voltage and driver bus voltage are different constraints. Driver, cables/connectors, power supply, encoder, gearbox and tested condition are all unknown. Measure mass and mounting/shaft geometry; compare moving torque at the required speed and gearing, not just holding torque. Astrosyn's [drive-selection guide](https://www.astrosyn.com/wp-content/uploads/2015/10/Guide-to-Stepper-Motor-Drive-Selection.pdf) and [motor-selection guide](https://www.astrosyn.com/wp-content/uploads/2015/10/Guide-to-Stepper-Motor-Selection.pdf) provide general selection principles, not ratings for 610-024.

### Evidence needed before reuse

1. Record the second stepper's label and any additional ratings/wiring labels on both steppers, or their original machine documentation. Obtain exact-model winding/current specifications from Astrosyn if no further label exists.
2. Inventory any Panasonic drive by its full model label, plus both cable ends/connectors and any external brake/gearbox; verify the exact motor/encoder/drive combination and command interface in its manual.
3. Record measured mass, envelope, shaft/mount dimensions and unpowered condition for each unit. Resolve the intended load, reduction, supply, current/thermal limits, fault handling and return-energy behavior before planning a restrained powered test.

**Disposition:** inventory only; no energizing unknown wiring and no driver/supply purchase until those details are verified. The [locked V1-PROOF hardware](v1-proof-hardware.md), [mass/power scope](v1-proof.md) and existing purchase totals remain the basis for the current robot.
