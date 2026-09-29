# V1-PROOF parts and reuse inventory

**2026-09-29 receipt reconciliation:** **one Pololu 4752 wheel motor and one Pololu 4035 DRV8874 driver are shipped; two ST3215 servos are paid and awaiting shipment in the latest vendor record.** Recorded V1-PROOF spend is **$143.12**, including shipping/tax. The user confirmed the servo 12 V variant; verify labels on arrival. A bench supply is available, with ratings unconfirmed. [Paid orders and delivery evidence](purchases.md) · [Single-leg bench preparation](one-leg-bench.md).

**RobStride belongs to the future full-size Hux**, not the current V1-PROOF build. The user's clarification resolves the earlier ambiguity from vendor-CAD notes; it does not confirm a RobStride order. The receipt establishes one purchased Pololu 4035 DRV8874 wheel driver. The planned two-wheel robot still needs a second 4752 motor and 4035 driver. Purchased parts count as new cash spend; no reuse credit is inferred.

| Part / candidate reuse | Availability / condition | V1-PROOF use | Reuse credit currently counted |
| --- | --- | --- | ---: |
| F765-Wing, F722 boards, Mamba board | Historical mentions; verify exact board | MCU + built-in IMU if pins/timing work | $0 |
| ESP32 | Historical mention; revision/IMU unknown | Alternative controller or manual-link bridge | $0 |
| TBS Nano RX and compatible transmitter | Receiver mentioned historically; full link unconfirmed | Manual input | $0 |
| Pi 5 / existing laptop | Historical Pi mention; availability unconfirmed | Off-robot logging; no onboard Pi required | $0 |
| Pololu 4752 encoder gearmotors | 1 shipped; $60.95 goods, part of the $88.34 paid Pololu order; second motor still required | One restrained wheel channel first, then a qualified pair | $0 |
| ST3215 12 V servos | 2 paid; $42.38 goods + $12.40 shipping = $54.78; awaiting shipment in latest receipt; 12 V variant confirmed by user | Supported single-leg bench now; robot height adjustment after pinned-leg balance | $0 |
| Pololu 4035 DRV8874 drivers | 1 shipped; $11.94 goods in the same Pololu order; second driver and passives still required | H-bridge and current limiting for each wheel motor | $0 |
| Servo interface / adapter | Purchase/availability unconfirmed | Half-duplex TTL commands and feedback | $0 |
| Bench supply | Available per user 2026-09-29; model, voltage/current range and reverse-energy behavior pending | Sequential single-actuator tests after rating/interface checks | $0 |
| Battery and balance charger | Cell count, condition and models unknown | Compatible 3S-class system or deliberate requalification | $0 |
| Wheels, hubs, bearings, belts, fasteners | None reserved | Approximately 100 mm wheel package and simple legs | $0 |
| Aluminum, plywood, tube, wire, connectors | Shop stock not inventoried | Frame, fixture and harness | $0 |

For each confirmed item record date, exact variant, quantity, condition, electrical limits, measured mass/envelope and whether it is available for Hux. A vendor CAD file is not owned hardware. A board's presence does not establish spare pins or compatible logic levels. A receiver needs a usable transmitter/link.

The [budget](bom.md) now separates **$143.12 paid** from the **$900 planning ceiling**. See the [two paid orders](purchases.md) for shipping/tax and goods totals. Newly ordered components count once as project spend; they are not zero-cost reuse. The remaining $756.88 includes unpurchased parts and reserves. Credit existing equipment only when it actually displaces a purchase; do not count the same item twice or spend the savings on new features. Keep the reserve. [Shop capabilities](capabilities.md) describes tools, not component stock.

The control baseline remains [Pico 2 + SPI LSM6DSOX, Pololu 4035 wheel drivers and a compatible ST3215 interface](v1-proof-hardware.md). Controller, IMU and servo interface ownership are not established by these receipts. Historical reuse candidates above earn credit only after qualification.
