# Working notes — V1-PROOF, updated 2026-10-05

The active objective is a useful, inexpensive proof robot. **Under $1,000. Reuse first. 2.5 kg target. Four actuators. Indoor mobility with bounded disturbance tests.** The previous stair work is [parked](docs/archive/stair-v1/README.md).

## Ready for review

- [x] Separate V1-PROOF model, requirements, cost/mass allocations and finish line.
- [x] Small four-actuator concept. The first build uses two driven wheels and pinned legs.
- [x] Conservative $900 budget that includes replacement allowances and reserves.
- [x] Preliminary 2D envelopes and reproducible geometry/load calculations.
- [x] Selected hardware baseline and physical mobility/disturbance protocol.
- [x] Pinned-leg 3D maneuver simulation, uncertainty sweep and saved challenge cases.
- [x] Previous plans preserved and legacy pages labeled.
- [x] Drivable [3D sandbox](tools/living-drawings/proof-sandbox.html) on the simulator of the study and the protocol fixtures, with size references. Leg-height motion there is a preview only.

## Next physical work

**2026-10-05 electrical print views:** EL-01 and EL-05 now use separate 11 x 17 inch landscape PDFs with 0.5 inch margins. The Electrical page includes a PDF view and a download link for each sheet. The five-sheet atlas uses the same paper size. The SVGs supply both the screen diagrams and the PDFs.

The [export procedure](cad/wiring/README.md) describes the update command and visual checks. A source or export change stops the site build until the PDFs match. The source audit remains Rev B. No physical test result changed.

**2026-10-04 writing standard:** all active text now obeys [Simplified Technical English](docs/writing-standard.md). Read `CLAUDE.md` and `tools/ste/SKILL.md` before you write. Run `python3 tools/ste/check_repo.py` before you finish. The gate is part of `npm run test:site`. The archive and the research notes keep their original text. No hardware status changed in this update.

**2026-10-03 Pico/IMU arrival:** one Pico 2 with yellow pre-soldered headers and one LSM6DSO IMU are received, untested. Start the [USB/LED bring-up checklist](docs/checklists/2026-10-03-pico-bringup.md). The October 2 Amazon order totals $30.58 and covers both received parts. The confirmation of the user supersedes the arrival estimate in the screenshot.

This sensor replaces the earlier LSM6DSOX choice, subject to qualification. Recorded spend is now **$173.70**, with **$726.30** remaining under the $900 plan. Item prices, shipping, tax and payment date remain unshown. No test pass is recorded.

**2026-10-02 mechanical timeline:** we added the [mechanical testing page](tools/living-drawings/mechanical-tests.html) with a movable side/end-view diagram, the R01 print render, eight evidence gates and shared dated history. Device session drafts record measurements, trial outcomes and evidence, with export/import and recoverable removal. [Recording workflow](docs/mechanical-testing.md). No physical test result is inferred from this page.

**2026-10-02 arrival and printing update:** the user reports the **30:1 metal gearmotor and DRV8874 drivers received**, and the **parts 3D printed**. The mechanical tests can start. Start the [first mechanical fit session](docs/checklists/2026-10-02-mechanical-fit.md): inspect and measure the prints, assemble the passive parallelogram, sweep 15–45° by hand, and dry-fit the motor/wheel envelope with all power disconnected. Confirm the printed revision/material and the total driver count.

ST3215 arrival, powered mounts, load capacity and electrical qualification remain open. No test pass is claimed. Recorded paid spend remains **$143.12**. This update supersedes the arrival/printing status in the dated September 29 notes below.

**2026-09-29 receipt update (supersedes missing-cost notes below):** [Paid receipts](docs/purchases.md) establish one Pololu 4752 gearmotor + one 4035 driver shipped ($88.34), and two ST3215 servos paid ($54.78). The total of **$143.12** includes shipping/tax. These models lock the actuator baseline, but the second wheel channel is still necessary. The website now explains [motor wiring](docs/v1-proof-hardware.md) and [Pico-based intelligence](docs/software.md). Firmware and physical qualification remain open.

**2026-09-29 print-kit update:** we drafted the [V1-PROOF R01 passive mockup](cad/prints/v1-proof-r01/README.md) for **Bambu X1C / PLA**, with eight STL part types and a Blender project. It keeps 110 mm link centers and 40 mm pivot spacing, and the M4 interfaces are provisional. Print and measure the fit coupon first, then inspect the passive linkage by hand. No physical print, fit, load or bench milestone is complete. Pololu 4752 gearmotors and ST3215 12 V servos remain ordered and not received.

**2026-09-29 update:** the user confirmed **Pololu 4752 gearmotors and ST3215 12 V servos are ordered for V1-PROOF**. Quantities and actual costs remain to record. RobStride is for the future full-size Hux. A bench supply is available with ratings still to confirm, and controller/driver/interface availability remains open. Start the [single-leg bench plan](docs/one-leg-bench.md) while you wait for the delivery.

Its [1:1 template](cad/layouts/one-leg-bench-template.svg) supports a passive mockup now. Hardware-specific machine work follows the receipt/label checks. Supported leg motion can precede balance. The pinned-leg-first sequence below governs the robot in free motion.

1. Inspect and measure the received **Pololu 4752 gearmotor and DRV8874 drivers** and the printed parts. Confirm the total driver count against the [paid-order ledger](docs/purchases.md). **$173.70 recorded spend** includes the new controller/IMU order. Examine the received Pico 2 over USB. Confirm the LSM6DSO IMU and ST3215 servo arrivals and check the labels when they are available. Confirm the bench-supply rating, servo interface, radio/transmitter, battery/charger, wheels and stock. The second wheel motor remains to buy. Another driver depends on the inventory count.
2. Make a scrap/cardboard mockup at the proposed 28–31 cm height. Weigh the pile. Make sure that two gearmotors, bearings, wheels, wires and the battery fit.
3. Qualify one wheel channel and controller in a supported fixture. Make sure that encoder sign, reversal, hardware current limit, kill, watchdog and available torque at speed are correct.
4. Build the second wheel channel and pin both legs at neutral. Tune conventional two-wheel balance and slow manual drive.
5. Do a bench test of one small servo with its 3:1 reduction and a loaded leg. Then add both leg channels slowly. Keep both wheels planted during this step.
6. Run the expanded [mobility and disturbance trials](docs/v1-proof-validation.md), then the height/duty/fault finish line. Replace the simulation assumptions with measured data and rerun the matrix.

No stair analysis, perception hardware or detailed cosmetic head work is on the critical path. The 2026-09-28 design revision placed no orders. The subsequent purchase report of the user is recorded above. Source/model tests cannot check physical balance.

## Latest simulation outcome

Final broad sweep: **388/391** numerical passes. All forward/reverse, left/right arcs and both in-place turns pass **17/17 configurations**. Three settling failures remain at seed 102 with nearly −4 mm fore/aft CoM error. All six separate ±2 mm CoM-placement checks pass. Keep the ±2 mm assembly requirement and every failed result.

The nominal suite is 23/23. The finer-timestep checks pass. Large shoves, 20 mm obstacles and excessive latency are outside the supported study envelope. [Full evidence](docs/v1-proof-simulation.md).
