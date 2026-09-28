# Working notes — V1-PROOF, 2026-09-28

The active objective is a useful, inexpensive proof robot. **Under $1,000; reuse first; 2.5 kg target; four actuators; flat floor.** The previous stair work is [parked](docs/archive/stair-v1/README.md).

## Ready for review

- [x] Separate V1-PROOF model, requirements, cost/mass allocations and finish line.
- [x] Small four-actuator concept; first build uses two driven wheels and pinned legs.
- [x] Conservative $940 budget including replacement allowances and reserves.
- [x] Preliminary 2D envelopes and reproducible geometry/load calculations.
- [x] Previous plans preserved and legacy pages labeled.

## Next physical work

1. Confirm reusable motors/servos, controller/IMU, radio/transmitter, batteries/charger, wheels and stock in [inventory](docs/parts-on-hand.md). Record exact variants; do not count a zero-cost row before confirmation.
2. Make a scrap/cardboard mockup at the proposed 28–31 cm height. Weigh the pile. Check that two gearmotors, bearings, wheels, wiring and the battery fit.
3. Qualify one wheel channel and controller in a supported fixture. Verify encoder sign, reversal, hardware current limit, kill, watchdog and available torque at speed.
4. Build the second wheel channel and pin both legs at neutral. Tune conventional two-wheel balance and slow manual driving.
5. Bench-test one small servo with its 3:1 reduction and a loaded leg. Then add both leg channels, slowly, while keeping both wheels planted.
6. Run the [acceptance trials](docs/v1-proof.md#finish-line). Keep measured results separate from this planning screen.

No stair analysis, perception hardware or detailed cosmetic head work is on the critical path. No components bought by this revision. Source/model tests cannot check physical balance.
