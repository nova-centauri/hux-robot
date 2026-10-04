# Hux — V1-PROOF

**Build a small wheeled robot that balances, drives and adjusts its height for under $1,000.** The stair project is parked. V1-PROOF is the active model as of 2026-09-28. Old requirements do not gate this build.

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

Start with the **[V1-PROOF plan](docs/v1-proof.md)**, **[model page](tools/living-drawings/index.html)**, **[2D layout](cad/layouts/v1-proof.svg)** and **[budget](docs/bom.md)**. The budget includes replacement allowances because the available parts are still unconfirmed. The [selected hardware](docs/v1-proof-hardware.md), [simulation report](docs/v1-proof-simulation.md), [interactive replay](tools/living-drawings/proof-simulation.html), [drivable 3D sandbox](tools/living-drawings/proof-sandbox.html) and [physical validation protocol](docs/v1-proof-validation.md) define this revision. This is not a fully quoted cart or a validated physical robot.

The scope has no stairs, one-wheel stance, jumps, rough terrain, onboard cameras, autonomy or required onboard Linux computer. Bounded push recovery and shallow indoor irregularities are now explicit qualification targets. In-wheel BLDC, CAN, 8S, carbon spars and the previous large head are no longer requirements. A geared brushed wheel drive is permitted for this proof.

## Working documents

- [Mechanical testing layout and timeline](tools/living-drawings/mechanical-tests.html): movable side/end views, the R01 render, test steps and dated session drafts.
- [Single-leg bench preparation](docs/one-leg-bench.md), [printable geometry template](cad/layouts/one-leg-bench-template.svg) and [session record](docs/checklists/one-leg-bench-session.md)
- [Requirements](docs/requirements.md) and [decision log](docs/decisions.md)
- [Mechanical](docs/mechanical.md), [electronics](docs/electronics.md), [software](docs/software.md)
- [Parts to confirm](docs/parts-on-hand.md) and [next work](NOTES.md)
- [Build checklists](docs/checklists/), [sizing calculations](docs/v1-proof-sizing.md)
- [Writing standard](docs/writing-standard.md): all active text obeys Simplified Technical English
- [Model source and checks](tools/v1-proof/README.md)

## Living website

The website organizes **V1-PROOF** into Overview, Mechanical, Electrical, Build & test, Parts & budget, and Documents. The interactive tools and the rendered guides have the same navigation. Mechanical includes [joint close-up studies](tools/living-drawings/joints.html). Electrical contains the [source-checked EL-01–04 wiring atlas](tools/living-drawings/electrical.html), with zoomable vector sheets and a printable PDF. [Pinout verification and open circuit decisions](docs/wiring-atlas.md) keep the physical release boundary.

The [build board](tools/living-drawings/build.html) tracks the supported single-leg exercise, the milestone gates and the dated updates. [Parts and budget](tools/living-drawings/parts.html) keeps procurement separate. **V0-GENESIS** remains the original plan archive. Browser bench notes are local drafts. The shared plan is in `tools/living-drawings/plan-data.json` with its referenced documents.

Run `npm run build` and `npm run test:site` from `tools/living-drawings`. Then serve or publish `dist/site`. Markdown guides become real HTML pages with version navigation. Refer to [website maintenance](docs/site-maintenance.md) for the update and preview workflow.

## Parked work

The [V0-GENESIS archive](docs/archive/stair-v1/README.md) keeps the earlier plans (historically named STAIR-V1). The earlier research, the H1 layout, the actuator studies and the old eight-axis simulator remain available as historical work. They do not define V1-PROOF, and this proof chassis has no promised stair upgrade path.

Regenerate the active model with `python3 tools/v1-proof/review.py --write`. Check it with `python3 tools/v1-proof/test_review.py` and `python3 tools/v1-proof/review.py --check`. From `tools/living-drawings`, `npm test` checks the active model. `npm run test:legacy` keeps the old regression suite. This repository contains the plan, the size calculations and a reproducible pinned-leg 3D simulation study.

**2026-10-02: the 30:1 gearmotor and the DRV8874 drivers are received, and the parts are 3D printed**, per the user. Start the [first mechanical fit session](docs/checklists/2026-10-02-mechanical-fit.md). The paid record covers one Pololu 4752 gearmotor and one Pololu 4035 driver. The total delivered driver count remains to confirm. Two ST3215 servos are paid, with the 12 V variant confirmed and the arrival unreported.

**2026-10-03: one Pico 2 with pre-soldered headers is received. The LSM6DSO IMU is also received, untested, per the user.** Start the [Pico USB/LED check](docs/checklists/2026-10-03-pico-bringup.md). The $30.58 controller/IMU order brings the **recorded spend to $173.70** and leaves **$726.30** under the $900 plan. The charge breakdown of the new order is unshown.

These actuator models are locked for V1-PROOF. A second wheel motor is still necessary. Refer to [paid orders](docs/purchases.md), [motor connections](docs/v1-proof-hardware.md) and [how the intelligence works](docs/software.md). RobStride actuators are intended for the future full-size Hux. Fit, load, firmware and balance qualification remain open. [MIT](LICENSE).
