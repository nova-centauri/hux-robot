# Hux — V1-PROOF

**Build a small wheeled robot that balances, drives and adjusts its height for under $1,000.** The stair project is parked. V1-PROOF is the active model as of 2026-09-28; old requirements do not gate this build.

| Design target | V1-PROOF |
| --- | --- |
| Cash budget | **$940 planning ceiling**, including $100 shipping/tax and $125 repair contingency; strictly under $1,000 |
| Mass | **2.5 kg target; 3.0 kg maximum**, including battery |
| Actuators | **Four:** two encoder wheel gearmotors, one small leg servo per side |
| First milestone | Pin the legs; balance using only the two wheel motors |
| Size | Approximately **28–31 cm high, 25.5 cm wide**, 10 cm rubber wheels |
| Motion | Flat indoor floor; 0.25 m/s cruise, 0.5 m/s cap; approximately 28 mm leg-height adjustment |
| Reuse | Existing controller, IMU, manual input, battery/charger and shop stock when confirmed |
| Finish line | Repeatable two-wheel balance, slow manual driving, controlled stops and slow height changes |

Start with the **[V1-PROOF plan](docs/v1-proof.md)**, **[model page](tools/living-drawings/index.html)**, **[2D layout](cad/layouts/v1-proof.svg)** and **[budget](docs/bom.md)**. The budget includes replacement allowances because available parts are still unconfirmed. Component references support feasibility; this is not a fully quoted shopping cart or a validated robot.

No stairs, one-wheel stance, jumping, rough terrain, cameras, autonomy or required onboard Linux computer. In-wheel BLDC, CAN, 8S, carbon spars and the previous large head are no longer requirements. A geared brushed wheel drive is acceptable for this proof.

## Working documents

- [Requirements](docs/requirements.md) and [decision log](docs/decisions.md)
- [Mechanical](docs/mechanical.md), [electronics](docs/electronics.md), [software](docs/software.md)
- [Parts to confirm](docs/parts-on-hand.md) and [next work](NOTES.md)
- [Build checklists](docs/checklists/), [sizing calculations](docs/v1-proof-sizing.md)
- [Model source and checks](tools/v1-proof/README.md)

## Parked work

The [STAIR-V1 archive](docs/archive/stair-v1/README.md) preserves the earlier plans. Existing research, H1 layout, actuator studies and the old eight-axis simulator remain available as historical work. They do not define V1-PROOF, and this proof chassis has no promised stair upgrade path.

Regenerate the active model with `python3 tools/v1-proof/review.py --write`; verify it with `python3 tools/v1-proof/test_review.py` and `python3 tools/v1-proof/review.py --check`. From `tools/living-drawings`, `npm test` checks the active model; `npm run test:legacy` retains the old regression suite.

This repository remains a planning and engineering scaffold. No physical build, firmware implementation, component order or successful balance test is claimed. [MIT](LICENSE).
