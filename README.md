# Hux — V1-PROOF

**Build a small wheeled robot that balances, drives and adjusts its height for under $1,000.** The stair project is parked. V1-PROOF is the active model as of 2026-09-28; old requirements do not gate this build.

| Design target | V1-PROOF |
| --- | --- |
| Cash budget | **$900 planning ceiling**, including $100 shipping/tax and $125 repair contingency; strictly under $1,000 |
| Mass | **2.5 kg target; 3.0 kg maximum**, including battery |
| Actuators | **Four:** two encoder wheel gearmotors, one small leg servo per side |
| First milestone | Pin the legs; balance using only the two wheel motors |
| Size | Approximately **28–31 cm high, 25.5 cm wide**, 10 cm rubber wheels |
| Motion | Indoor mobility; 0.25 m/s cruise, 0.15 m/s on qualified shallow uneven surfaces; approximately 28 mm leg-height adjustment |
| Reuse | Existing controller, IMU, manual input, battery/charger and shop stock when confirmed |
| Finish line | Repeatable balance, five movement types, controlled stops, bounded disturbances and slow height changes |

Start with the **[V1-PROOF plan](docs/v1-proof.md)**, **[model page](tools/living-drawings/index.html)**, **[2D layout](cad/layouts/v1-proof.svg)** and **[budget](docs/bom.md)**. The budget includes replacement allowances because available parts are still unconfirmed. The [selected hardware](docs/v1-proof-hardware.md), [simulation report](docs/v1-proof-simulation.md), [interactive replay](tools/living-drawings/proof-simulation.html), [drivable 3D sandbox](tools/living-drawings/proof-sandbox.html) and [physical validation protocol](docs/v1-proof-validation.md) define this revision. This is not a fully quoted cart or a validated physical robot.

No stairs, one-wheel stance, jumping, rough terrain, onboard cameras, autonomy or required onboard Linux computer. Bounded push recovery and shallow indoor irregularities are now explicit qualification targets. In-wheel BLDC, CAN, 8S, carbon spars and the previous large head are no longer requirements. A geared brushed wheel drive is acceptable for this proof.

## Working documents

- [Single-leg bench preparation](docs/one-leg-bench.md), [printable geometry template](cad/layouts/one-leg-bench-template.svg) and [session record](docs/checklists/one-leg-bench-session.md)
- [Requirements](docs/requirements.md) and [decision log](docs/decisions.md)
- [Mechanical](docs/mechanical.md), [electronics](docs/electronics.md), [software](docs/software.md)
- [Parts to confirm](docs/parts-on-hand.md) and [next work](NOTES.md)
- [Build checklists](docs/checklists/), [sizing calculations](docs/v1-proof-sizing.md)
- [Model source and checks](tools/v1-proof/README.md)

## Living website

The website routes **V1-PROOF** to the current build and **V0-GENESIS** to the original planning archive. The current workbench tracks actuator orders, the supported single-leg exercise, milestone gates and dated updates. A third version remains future and unscoped. Browser bench notes are local drafts; the shared plan is maintained in `tools/living-drawings/plan-data.json` alongside its referenced documents.

Run `npm run build` and `npm run test:site` from `tools/living-drawings`; serve or publish `dist/site`. Markdown guides become real HTML pages with version navigation. See [website maintenance](docs/site-maintenance.md) for the update and preview workflow.

## Parked work

The [V0-GENESIS archive](docs/archive/stair-v1/README.md) preserves the earlier plans (historically named STAIR-V1). Existing research, H1 layout, actuator studies and the old eight-axis simulator remain available as historical work. They do not define V1-PROOF, and this proof chassis has no promised stair upgrade path.

Regenerate the active model with `python3 tools/v1-proof/review.py --write`; verify it with `python3 tools/v1-proof/test_review.py` and `python3 tools/v1-proof/review.py --check`. From `tools/living-drawings`, `npm test` checks the active model; `npm run test:legacy` retains the old regression suite.

This repository contains planning, sizing and a reproducible pinned-leg 3D simulation study. **One Pololu 4752 motor and one Pololu 4035 driver are shipped; two ST3215 servos are paid**, with the 12 V variant confirmed by the user. **$143.12 is spent**, including shipping/tax, against the $900 plan. These actuator models are locked for V1-PROOF; the second wheel motor/driver are still needed. See [paid orders](docs/purchases.md), [motor connections](docs/v1-proof-hardware.md) and [how the intelligence works](docs/software.md). RobStride actuators are intended for the future full-size Hux. No physical build, firmware implementation or successful balance test is claimed. [MIT](LICENSE).
