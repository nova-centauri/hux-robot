# V1-PROOF numerical model

Active planning model: four actuators, 2.5 kg target, flat indoor floor and a strictly-under-$1,000 cash budget. [Plan](../../docs/v1-proof.md).

```sh
python3 tools/v1-proof/review.py --write
python3 tools/v1-proof/test_review.py
python3 tools/v1-proof/review.py --check
```

No dependencies beyond Python's standard library. `model.json` owns geometry, mass allocations, electrical sizing assumptions, budget caps and source references. `review.py` generates the active BOM, sizing note, results JSON, 2D SVG and browser data. `--check` detects stale generated outputs without writing.

Tests cover strict budget rejection at $1,000, no speculative reuse discounts, constant link lengths, gravity virtual work, mass/voltage/speed sensitivity and the distinction between a preliminary screen and hardware release. None tests closed-loop balance. The website is a planning view, not a simulator.

The previous [stair numerical model](../engineering/README.md) is separate and parked. Its publisher writes only the archived stair budget; do not import those motors, masses or stair gates into V1-PROOF.
