# V1-PROOF parts and reuse inventory

**2026-09-29, confirmed by the user:** **Pololu 4752 wheel gearmotors and ST3215 12 V servos are ordered for V1-PROOF**, awaiting arrival. A bench supply is available. Ordered quantities, actual costs, driver/interface purchases and supply ratings remain to be recorded. [Single-leg bench preparation](one-leg-bench.md).

**RobStride belongs to the future full-size Hux**, not the current V1-PROOF build. The user's clarification resolves the earlier ambiguity from vendor-CAD notes; it does not confirm a RobStride order. Pololu 4035 DRV8874 remains the selected V1-PROOF wheel driver, with purchase status unconfirmed. No actual cost or reuse credit is inferred from the actuator order confirmation.

| Part / candidate reuse | Availability / condition | V1-PROOF use | Reuse credit currently counted |
| --- | --- | --- | ---: |
| F765-Wing, F722 boards, Mamba board | Historical mentions; verify exact board | MCU + built-in IMU if pins/timing work | $0 |
| ESP32 | Historical mention; revision/IMU unknown | Alternative controller or manual-link bridge | $0 |
| TBS Nano RX and compatible transmitter | Receiver mentioned historically; full link unconfirmed | Manual input | $0 |
| Pi 5 / existing laptop | Historical Pi mention; availability unconfirmed | Off-robot logging; no onboard Pi required | $0 |
| Pololu 4752 encoder gearmotors | Ordered, awaiting arrival; model confirmed by user 2026-09-29; quantity and actual cost pending | One restrained wheel channel first, then a qualified pair | $0 |
| ST3215 12 V servos | Ordered, awaiting arrival; model/voltage variant confirmed by user 2026-09-29; quantity and actual cost pending | Supported single-leg bench now; robot height adjustment after pinned-leg balance | $0 |
| Pololu 4035 DRV8874 drivers | Selected; purchase/availability unconfirmed | H-bridge and current limiting for each wheel motor | $0 |
| Servo interface / adapter | Purchase/availability unconfirmed | Half-duplex TTL commands and feedback | $0 |
| Bench supply | Available per user 2026-09-29; model, voltage/current range and reverse-energy behavior pending | Sequential single-actuator tests after rating/interface checks | $0 |
| Battery and balance charger | Cell count, condition and models unknown | Compatible 3S-class system or deliberate requalification | $0 |
| Wheels, hubs, bearings, belts, fasteners | None reserved | Approximately 100 mm wheel package and simple legs | $0 |
| Aluminum, plywood, tube, wire, connectors | Shop stock not inventoried | Frame, fixture and harness | $0 |

For each confirmed item record date, exact variant, quantity, condition, electrical limits, measured mass/envelope and whether it is available for Hux. A vendor CAD file is not owned hardware. A board's presence does not establish spare pins or compatible logic levels. A receiver needs a usable transmitter/link.

The [budget](bom.md) remains a planning allocation until actual costs are recorded. Newly ordered actuators count toward project spend; they are not zero-cost reuse or a reason to subtract their budget rows. Credit existing equipment only when it actually displaces a purchase; do not count the same item twice or spend the savings on new features. Keep the reserve. [Shop capabilities](capabilities.md) describes tools, not component stock.

The control baseline remains [Pico 2 + SPI LSM6DSOX, Pololu 4035 wheel drivers and a compatible ST3215 interface](v1-proof-hardware.md). Controller, IMU and interface ownership are not established by the actuator order. Historical reuse candidates above earn credit only after qualification.
