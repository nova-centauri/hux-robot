# Working notes — V1-PROOF, 2026-09-28

The active objective is a useful, inexpensive proof robot. **Under $1,000; reuse first; 2.5 kg target; four actuators; indoor mobility with bounded disturbance tests.** The previous stair work is [parked](docs/archive/stair-v1/README.md).

## Ready for review

- [x] Separate V1-PROOF model, requirements, cost/mass allocations and finish line.
- [x] Small four-actuator concept; first build uses two driven wheels and pinned legs.
- [x] Conservative $900 budget including replacement allowances and reserves.
- [x] Preliminary 2D envelopes and reproducible geometry/load calculations.
- [x] Selected hardware baseline and physical mobility/disturbance protocol.
- [x] Pinned-leg 3D maneuver simulation, uncertainty sweep and saved challenge cases.
- [x] Previous plans preserved and legacy pages labeled.
- [x] Drivable [3D sandbox](tools/living-drawings/proof-sandbox.html) on the study's own simulator and the protocol fixtures, with size references. Leg-height motion there is a preview only.

## Next physical work

1. Confirm reusable motors/servos, controller/IMU, radio/transmitter, batteries/charger, wheels and stock in [inventory](docs/parts-on-hand.md). Record exact variants; do not count a zero-cost row before confirmation.
2. Make a scrap/cardboard mockup at the proposed 28–31 cm height. Weigh the pile. Check that two gearmotors, bearings, wheels, wiring and the battery fit.
3. Qualify one wheel channel and controller in a supported fixture. Verify encoder sign, reversal, hardware current limit, kill, watchdog and available torque at speed.
4. Build the second wheel channel and pin both legs at neutral. Tune conventional two-wheel balance and slow manual driving.
5. Bench-test one small servo with its 3:1 reduction and a loaded leg. Then add both leg channels, slowly, while keeping both wheels planted.
6. Run the expanded [mobility and disturbance trials](docs/v1-proof-validation.md), then the height/duty/fault finish line. Replace simulation assumptions with measured data and rerun the matrix.

No stair analysis, perception hardware or detailed cosmetic head work is on the critical path. No components bought by this revision. Source/model tests cannot check physical balance.

## Latest simulation outcome

Final broad sweep: **388/391** numerical passes; all forward/reverse, left/right arcs and both in-place turns pass **17/17 configurations**. Three settling failures remain at seed 102 with nearly −4 mm fore/aft CoM error. All six separate ±2 mm CoM-placement checks pass. Retain the ±2 mm assembly requirement and every failed result. Nominal suite 23/23; finer-timestep checks pass. Large shoves, 20 mm obstacles and excessive latency are outside the supported study envelope. [Full evidence](docs/v1-proof-simulation.md).
