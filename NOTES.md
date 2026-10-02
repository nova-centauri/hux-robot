# Working notes — V1-PROOF, updated 2026-10-02

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

**2026-10-02 mechanical timeline:** added the [mechanical testing page](tools/living-drawings/mechanical-tests.html) with a movable side/end-view diagram, the R01 print rendering, eight evidence gates and shared dated history. Device session drafts record measurements, trial outcomes and evidence with export/import and recoverable removal. [Recording workflow](docs/mechanical-testing.md). No physical test result is inferred from this page.

**2026-10-02 arrival and printing update:** the user reports the **30:1 metal gearmotor and DRV8874 drivers received**, and the **parts 3D printed**, ready to begin mechanical testing. Start the [first mechanical fit session](docs/checklists/2026-10-02-mechanical-fit.md): inspect and measure prints, assemble the passive parallelogram, sweep 15–45° by hand, and dry-fit the motor/wheel envelope with all power disconnected. Confirm printed revision/material and total driver count. ST3215 arrival, powered mounts, load capacity and electrical qualification remain open. No test pass is claimed; recorded paid spend remains **$143.12**. This supersedes the arrival/printing status in the dated September 29 notes below.

**2026-09-29 receipt update (supersedes missing-cost notes below):** [Paid receipts](docs/purchases.md) establish one Pololu 4752 motor + one 4035 driver shipped ($88.34), and two ST3215 servos paid ($54.78). Total **$143.12**, including shipping/tax. These models lock the actuator baseline; the second wheel channel is still required. The website now explains [motor wiring](docs/v1-proof-hardware.md) and [Pico-based intelligence](docs/software.md). Firmware and physical qualification remain open.

**2026-09-29 print-kit update:** drafted the [V1-PROOF R01 passive mockup](cad/prints/v1-proof-r01/README.md) for **Bambu X1C / PLA**, with eight STL part types and a Blender project. It preserves 110 mm link centers and 40 mm pivot spacing; M4 interfaces are provisional. Print and measure the fit coupon first, then inspect the passive linkage by hand. No physical print, fit, load or bench milestone is complete. Pololu 4752 motors and ST3215 12 V servos remain ordered and awaiting arrival.

**2026-09-29 update:** the user confirmed **Pololu 4752 motors and ST3215 12 V servos are ordered for V1-PROOF**; quantities and actual costs remain to record. RobStride is for the future full-size Hux. A bench supply is available with ratings still to confirm, and controller/driver/interface availability remains open. Start the [single-leg bench plan](docs/one-leg-bench.md) while awaiting delivery. Its [1:1 template](cad/layouts/one-leg-bench-template.svg) supports a passive mockup now; hardware-specific machining follows receipt/label checks. Supported leg motion can precede balance. The pinned-leg-first sequence below governs the freely moving robot.

1. Inspect and measure the received **Pololu 4752 and DRV8874 drivers** and the printed parts; confirm total driver count against the [paid-order ledger](docs/purchases.md). **$143.12 paid** is reconciled. Record ST3215 arrival and verify servo voltage labels when available. Confirm bench-supply rating, servo interface, controller/IMU, radio/transmitter, battery/charger, wheels and stock. The second wheel motor remains to buy; another driver depends on the inventory count.
2. Make a scrap/cardboard mockup at the proposed 28–31 cm height. Weigh the pile. Check that two gearmotors, bearings, wheels, wiring and the battery fit.
3. Qualify one wheel channel and controller in a supported fixture. Verify encoder sign, reversal, hardware current limit, kill, watchdog and available torque at speed.
4. Build the second wheel channel and pin both legs at neutral. Tune conventional two-wheel balance and slow manual driving.
5. Bench-test one small servo with its 3:1 reduction and a loaded leg. Then add both leg channels, slowly, while keeping both wheels planted.
6. Run the expanded [mobility and disturbance trials](docs/v1-proof-validation.md), then the height/duty/fault finish line. Replace simulation assumptions with measured data and rerun the matrix.

No stair analysis, perception hardware or detailed cosmetic head work is on the critical path. The 2026-09-28 design revision placed no orders; the user's subsequent purchase report is recorded above. Source/model tests cannot check physical balance.

## Latest simulation outcome

Final broad sweep: **388/391** numerical passes; all forward/reverse, left/right arcs and both in-place turns pass **17/17 configurations**. Three settling failures remain at seed 102 with nearly −4 mm fore/aft CoM error. All six separate ±2 mm CoM-placement checks pass. Retain the ±2 mm assembly requirement and every failed result. Nominal suite 23/23; finer-timestep checks pass. Large shoves, 20 mm obstacles and excessive latency are outside the supported study envelope. [Full evidence](docs/v1-proof-simulation.md).
