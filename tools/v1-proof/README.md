# V1-PROOF numerical studies

Four actuators, 2.5 kg target / 3.0 kg maximum, indoor mobility and bounded disturbances, strictly under $1,000. [Plan](../../docs/v1-proof.md) · [hardware decisions](../../docs/v1-proof-hardware.md).

```sh
python3 tools/v1-proof/review.py --write
cd tools/living-drawings
npm ci
npm run simulate
npm test
```

`model.json` owns hardware selections, dimensions, mass, electrical screens, operation targets and budget. Standard-library `review.py` generates the BOM, the size calculations, the SVG, the results and the plan data for the browser. Its `--check` finds stale outputs.

`sim.js` builds the pinned-leg 3D rigid-body model and controller with the pinned Rapier 0.20.0 dependency of the repository. It imports no legacy stair motors, masses or joint model. `run_sim.js` runs 23 scenarios across 17 configurations, six challenge cases, five timestep comparisons and six separate CoM-adjustment checks. `--quick` runs nominal/challenge/convergence only. Use `--write` without `--quick` for published evidence. `--check` makes sure that the saved source hashes are correct.

`report_sim.py` generates the [evidence report](../../docs/v1-proof-simulation.md). [Interactive replay](../living-drawings/proof-simulation.html).

**3D sandbox.** [`proof-sandbox.html`](../living-drawings/proof-sandbox.html) loads this same `sim.js` in the browser (`HuxProofSimFactory(RAPIER, model)`). You drive it from the keyboard or a gamepad at full scale, on the fixtures of the physical protocol (3° grade, 3° cross-slope, 5 mm bumps, 3 mm seam, 20 mm challenge threshold). [`proof-sandbox-core.js`](../living-drawings/proof-sandbox-core.js) adds only the fixtures, lane starts, robot-frame shoves, fall detection and a slow leg-height preview. `test_sandbox.js` checks it headless and runs in `npm test`. The leg preview re-places the CoM and pitch trim at 10°/s. The sandbox does not model servo dynamics, so legs that move are not evidence.

The sandbox adds nothing to `sim-results.json`. The page opens correctly straight from disk. three.js and Rapier load from jsDelivr.

`npm test` covers budgets/geometry plus gravity without control, mass, contact, voltage/speed/current bounds, balance-priority steering, signed maneuvers and deterministic reruns. The full sweep is explicit with `npm run simulate`. Failed cases remain in the report. `sim-tuning-history.json` keeps the weaker results of the initial controller.

The simulation assumes delayed attitude estimates and bounded torque response. It does not implement raw IMU fusion, MCU firmware, a thermal model, regenerative power electronics or powered leg dynamics. Read the assumptions of the report before you quote outcomes. All [physical tests](../../docs/v1-proof-validation.md) remain open. The previous stair model is parked separately.
