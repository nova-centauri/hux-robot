# V1-PROOF reuse inventory

**2026-09-28:** the user wants to use equipment already around. Earlier clarification said no Hux components had been purchased; it did not establish that no personal electronics exist. Exact available parts and reservations are still unconfirmed. This revision has bought nothing.

| Candidate reuse | Availability / condition | V1-PROOF use | Credit currently counted |
| --- | --- | --- | ---: |
| F765-Wing, F722 boards, Mamba board | Historical mentions; verify exact board | MCU + built-in IMU if pins/timing work | $0 |
| ESP32 | Historical mention; revision/IMU unknown | Alternative controller or manual-link bridge | $0 |
| TBS Nano RX and compatible transmitter | Receiver mentioned historically; full link unconfirmed | Manual input | $0 |
| Pi 5 / existing laptop | Historical Pi mention; availability unconfirmed | Off-robot logging; no onboard Pi required | $0 |
| Motors, gearboxes and encoders | No usable pair confirmed | Two bidirectional wheel channels | $0 |
| Small servos | None confirmed | Two leg adjustments after pinned-leg balance | $0 |
| Battery and balance charger/supply | Cell count, condition and models unknown | Compatible 3S-class system or deliberate requalification | $0 |
| Wheels, hubs, bearings, belts, fasteners | None reserved | Approximately 100 mm wheel package and simple legs | $0 |
| Aluminum, plywood, tube, wire, connectors | Shop stock not inventoried | Frame, fixture and harness | $0 |

For each confirmed item record date, exact variant, quantity, condition, electrical limits, measured mass/envelope and whether it is available for Hux. A vendor CAD file is not owned hardware. A board's presence does not establish spare pins or compatible logic levels. A receiver needs a usable transmitter/link.

The [budget](bom.md) contains replacement allowances until confirmation. Subtract only actual displaced purchases; do not count the same item in two rows or spend the savings on new features. Keep the reserve. [Shop capabilities](capabilities.md) describes tools, not component stock.

The selected replacement baseline is now [Pico 2 + SPI LSM6DSOX, Pololu 4752/DRV8874 wheel channels and ST3215 legs](v1-proof-hardware.md). Historical candidates above are potential substitutions, not coequal undecided architectures. They earn credit only after qualification.
