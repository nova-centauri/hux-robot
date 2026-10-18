# Working notes — V1-PROOF, updated 2026-10-17

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

**2026-10-17 harness assembly review:** the user requested clear instructions for a novice. The [harness guide](cad/wiring/v1-proof-harness.html) now groups parts, wire colors, connector positions and checks by cable. The Electrical page links to the guide before the system drawings. H6 is the simple two-wire example.

The user then requested plug renderings and 3D pinouts. The guide now shows shaded XH and motor plugs, socket faces, reversed wire entries and board header views. Select a connector, then a wire, to inspect its position. Empty cavities have no wire or metal socket. Motor labels show the wire functions. Orientation and physical release remain open.

The review found that PH-C spans both Pico pin rows. Direct XH attachment needs a corrected interface before header removal. Splice SP1 needs measured segment lengths. The XT30 contact sex and button-side mating parts remain open. The guide marks these limits. No physical harness or powered test is complete.

**2026-10-17 wiring atlas Rev C, by location:** the user asked for a new pass on the schematic. The wiring stays. Each item moves to where it mounts in the machine, each run gets a wire length, and the harness gets bundled connectors. The user then asked for one JST connector type for the low-voltage circuit and for an Amazon kit link in the BOM.

EL-01 is now a rear elevation of the R05 body. The CTRL deck is at the top with the IMU and the Pico 2. The BUS deck with the power distribution board is next. The PWR deck with the kill-chain board and the driver board is below it. The leg junction board and the pack are below.

Robot LEFT is the near wall, by the decision of the user today. Every port is a connector position, for example `P1.PH-A.2 / GP3`.

The pass found a conflict and the user chose the fix. Rev B drew the old kill gate. The [kill chain](docs/kill-chain.md) and `firmware/bench/src/pins.h` use the Pololu 2813 switch, GP10 to nSLEEP, GP22 heartbeat and GP28 rail sense. Rev C draws that circuit on EL-01 and EL-04. The servo branch is out of the V1-PROOF sheets. Both drivers stay on one board on the PWR deck.

New files: `cad/wiring/harness.py` holds the mount positions, the connectors, the wires and the length rule. EL-06 gives a cut length for each of 19 bundles. EL-07 gives the loading of every connector. The [harness register](cad/wiring/v1-proof-harness.html) has the same data with the purchase candidates. The build stops when EL-01 and the harness model differ.

The standard is JST XH 2.50 mm, with XT30 for the pack and the rail. The Pololu pigtail keeps its 1x6 0.1 in housing and lands on a proposed junction board under the PWR deck. The left pigtail cannot reach the driver board. 

The received Pico 2 has pre-soldered pins. The user decided to desolder them and to solder the XH headers to the board, so the harness plugs in directly. The user accepted the leg junction board and the 335 mm Pico-to-driver runs.

The [R06 plan](docs/r06-plan.md) collects the body corrections from the R05 build and from Rev C. It waits for the R05 measurements. The lengths are estimates from a route model. No harness is built and no part is ordered.

**2026-10-16 leg drive designed, plate 6:** the user asked for a cradle that fits the servo and a drive to the legs, printed now. The R05 kit now has the crank-and-pushrod leg drive.

New parts: the servo frame (25), the crank hub (26), the wall bushing (27) and two drill jigs (28, 29). The upper link (08) has a new boss at 42 mm. Parts 13 and 14 are superseded.

`validate.py` sweeps the hub and the pushrod with the legs: minimum clearance 1.0 mm, crank sweep 69°, transmission angles 55° to 90°. [Plate 6](cad/prints/two-leg-body-r05/bambu/README.md) holds the ten parts. At 15:11 EDT, MSL-Bambi-X1C accepted it: 2 h 48 min, 104.11 g, 156 layers, finish estimate 17:59 EDT.

The printed walls need a 24 mm bore and four M4 holes on each side. The drill jigs add them. A new wall print is the alternative. The frame bolts need M4 x 20.

The servo screws are M2 x 10 and the hub screw is M3 x 35. The ball studs, the ball links and the pushrods are RC parts that the user has. The disc hardware and the connector position still need a check on the real servo.

**Open conflict.** The decision log of this morning says that V1-PROOF has no powered hips and that the servos stay in stock. This request puts the leg drive back into the R05 build. The decision log is not changed. The user must say whether V1-PROOF now includes the powered legs.

**2026-10-16 leg drive concept:** the user asks for a cradle that fits the real ST3215, and a drive to the leg. We measured the vendor STEP model and the 2D drawing in `cad/vendor/waveshare-st3215/`, a local download that the repository does not publish. The body is 45.22 x 24.72 x 28.7 mm. The output disc is 19.2 mm in diameter and stands 5.2 mm proud of the body. The rear idler disc stands 3.3 mm proud. The height over both discs is 37.25 mm.

The R05 cap bars sit 36.5 mm from the wall, so they land on the idler disc. The output face has four 2.0 mm mounting holes on a 20.7 x 20.5 mm pattern. The output disc has four 2.5 mm holes on a 14 mm pattern.

The proposed drive is a crank and a pushrod, not a belt. Refer to the [concept drawing](docs/assets/r06-leg-drive/concept.png) and the geometry search in `tools/leg-drive/kin.py`. The servo sits inside the wall with its output at X = -18, Z = +34. A printed hub bolts to the output disc and passes through a 22 mm bore in the wall. A 16 mm crank on the hub drives a 40 mm pushrod to a boss at 42 mm on the upper link.

The ratio is 2.6 to 3.1 : 1 and the crank sweeps 69 degrees for the leg range 15 to 40 degrees. The transmission angles stay between 55 and 124 degrees. A drive on the lower link was rejected: its pushrod crosses the upper link plane with 1 mm of clearance.

This is a proposal, with no printed part and no test. The user must confirm the disc hardware, the connector position and the RC linkage parts before the CAD work starts. The walls need the bore and four bolt holes: a drill jig or a new wall print.

**2026-10-16 servo fit report:** at 12:21 EDT, the user reports that all R05 parts are printed and the assembly continues. The ST3215 servos do not fit well in the inner servo cradles, part 13. The user did not give the dimension or the position of the contact. The cradle pocket is the nominal case envelope plus 0.5 mm on each side. The CAD checks do not include a servo fit check.

The user also asks how the servo moves the leg. The answer is in the [R05 kit record](cad/prints/two-leg-body-r05/README.md#limits): the 3:1 belt drive is a concept, not a design. The hip shaft, the wall bearings, the pulleys and the belt tension do not exist. V1-PROOF does not use the servos, so the cradles stay optional. The [fit record](docs/checklists/2026-10-15-r05-fit-record.md) records the report.

**2026-10-16 budget update:** the user reports a 5-pack of DC step-down converters for $8.47 and a Waveshare servo board for $13.77. Recorded spend is now $195.94, with $704.06 remaining in the $900 plan. The vendor of the converters, the models, the charge breakdowns and the delivery status are not recorded.

The model now has two powered axes. The hip drive allowance of $60 left the budget, and the servo row now equals the $42.38 paid goods. The $77.62 difference moved to the repair and overrun reserve, which is now $202.62. `review.py --write` regenerated the budget, the sizing screen and the page data. The mass list keeps the servo allowance until a measured mass replaces it.

**2026-10-16 hips leave V1-PROOF:** the user said: "We are leaving hips out of V1-Proof and will bring it back in the next version. We dropped the one-leg and stair-climbing requirements." V1-PROOF now has two powered axes, and both legs stay locked at 30°. The [decision log](docs/decisions.md), the requirements, the build brief, the validation protocol, the assembly guide, the plan data and the website show this change.

The single-leg bench plan is parked. The plan data moves it, the powered-leg milestone and the hip drive design to the next version. The V1-PROOF bench is now the electronics bench, stages E0–E6. The numerical model and the budget still include the servo and leg transmission allowances.

The user reports that the hip-hole measurement is "perfect", without the values. The user still needs to order a second gearmotor, a second driver, the wheels and possibly a battery. The [inventory](docs/parts-on-hand.md) lists the Pololu prices of 2026-10-16: $106.11 goods for the Pololu items. No order is placed.

**2026-10-16 R05 frame and website update:** the user reports an assembled R05 body: two walls, three decks and the battery tray. The servos are received. No dimension is measured. The [fit record](docs/checklists/2026-10-15-r05-fit-record.md) and the [assembly guide](docs/r05-assembly.md) record this. The guide now tells how to install the servo cradles through the front opening of an assembled frame.

The home page now shows the live R05 anatomy, the build status and one group of R05 links. The Mechanical page, the document library, the README files and the plan data now put R05 first. Each R01–R04 record shows a superseded notice. The anatomy servo position now agrees with the R05 kit: 41 mm forward of the lower hip and 3 mm above it.

The plan data adds the 3:1 hip drive as an open design action. It also records the R05 leg range of 15–40° and the need for different servo bus IDs. No STL changed.

**2026-10-16 R05 plate 4:** Bambu Studio showed plate 3 at 100% and Finished. The user reports a clear bed. At 07:08 EDT, the X1C accepted plate 4 with four struts, two servo cradles and four cap bars. The estimate is 3 hours, 11 minutes and 95.86 g, with an initial finish time of approximately 10:19 EDT.

**2026-10-15 bench firmware, kill chain and servo arrival:** the user reports that two ST3215 servos are received, with labels unchecked. The first firmware, [`firmware/bench`](firmware/bench/README.md), compiles for `pico2` with Pico SDK 2.2.0 and Arm GCC 15.2.1 in the cloud toolchain. The prebuilt `hux_bench.uf2` and the host console `tools/bench/hux_bench.py` are in the repository. No board test is recorded.

The [kill chain](docs/kill-chain.md) proposes a Pololu 2813 rail switch with a momentary KILL button on its OFF pin. An ARM button and a charge-pump heartbeat detector on GP22 gate the power-on. No part is ordered. Recorded spend stays $173.70.

**2026-10-15 electronics bench guide:** the user is ready for bench tests with the Pico 2, the IMU and the motor. The [electronics bench guide](docs/electronics-bench-guide.md) gives stages E0–E6: toolchain and blink, IMU identity and raw data, encoder counts, driver and motor jog, wheel speed loop, fault checks and a tilt-follow routine. It gives the seven-wire IMU connection, the sensor register values, the encoder divider, the DRV8874 driver pads and a bench firmware command contract.

The Build & test section links the guide. No bench firmware exists. No stage is closed. Recorded spend stays $173.70.

**2026-10-14 animated anatomy:** the user requested animated top, side and front views, and an electronics x-ray. The new [anatomy page](tools/living-drawings/anatomy.html) uses the R04 reference geometry and mirrors the leg for the far side. The page shows leg motion, balance trim, drive and the harness classes of the EL netlist.

The [dated review](docs/checklists/2026-10-14-anatomy-review.md) records six findings. The R04 pivot position gives an estimated 17-35° balance trim. The simulation assumes 0° at neutral. R04 is 320-348 mm high, above the 280-310 mm target. R04 has one driver position and no battery position.

The "R05 proposal" layout shows the corrections. The R04 CAD and the print files did not change. The user decides each correction. No physical test result changed. Recorded spend stays $173.70.

**2026-10-14 correction:** the user states that the hips go near the rear of the body. The struts slant forward to the wheel, and the servos go inside the body. The first R05 proposal is withdrawn. The corrected R05 puts the hips at X = +50 with internal servos and a 3:1 belt to the lower hip. Its estimated lean is 3-24° forward. The JD-03 axle offset causes approximately 10° of this lean.

**2026-10-15 R05 plate 3:** the user reports a clear bed. At 12:52 EDT, the X1C accepted plate 3 with the upper deck, the battery tray, two carriers and eight leg spacers. The estimate is 3 hours, 8 minutes and 150.49 g, with an initial finish time of 15:59 EDT.

**2026-10-15 R05 assembly guide:** the user reports plate 2 complete and requests an assembly document on the website. The [R05 assembly guide](docs/r05-assembly.md) gives the parts, the hardware and eight steps with views from the CAD. The [fit record](docs/checklists/2026-10-15-r05-fit-record.md) lists the open measurements. No R05 dimension is measured.

**2026-10-15 R05 plate 2:** Bambu Studio showed the R05 walls plate at 100% and Finished. The user reports a clear bed and did not measure the walls. At 07:28 EDT, the X1C accepted plate 2 with the lower and middle decks and twelve angles. The estimate is 4 hours, 40 minutes and 211.87 g, with an initial finish time of 12:08 EDT.

**2026-10-14 R05 two-leg body kit:** the user requested new STL files and PLA prints for this build. The [R05 kit](cad/prints/two-leg-body-r05/README.md) puts the hips at X = +30, an inner ST3215 cradle on each wall and a battery tray below the decks. The rear lower-deck angles move to X = +48, clear of the upper hip nut.

The exact CAD check shows 0.23 mm between the gearmotor and the lower strut at 45°. This corrects the 2.1 mm value in the entry below, which used mesh points. R05 limits the leg to 15–40°, with 2.1 mm at 40°. The CAD checks pass. The servo transmission is not in the kit.

Five Basic PLA plates hold one set. Bambu Studio sliced plate 1, two walls, at 4 hours, 4 minutes and 230.55 g. The R04 plate 2 job shows Finished. The camera view did not confirm a clear bed, so no R05 job was sent. At 17:37 EDT, after the user reported a clear bed, the X1C accepted plate 1. The initial finish estimate is 21:41 EDT.

**2026-10-14 balanced R05 layout:** the user reports that the published page still showed the unbalanced R04 layout. The page now opens with R05. R05 puts the hips at X = +30 and keeps the R04 motor carrier without a mirror. The battery is in a tray in the body, and the CoM includes it. The estimated lean is 10° back, 0° and 10° forward at 15°, 30° and 45°. The minimum CAD clearance between the gearmotor and the struts is 2.1 mm.

**2026-10-13 R04 plate 2 started:** the user said, "Not checked yet. Keep printing". The live camera showed a clear bed. MSL-Bambi-X1C accepted one wall, the lower deck and three more angles in Basic PLA. The printer showed an active heat cycle at 0/110 layers. The estimate is 3 hours, 43 minutes and 190.62 g, with an initial finish time of 19:17 EDT.

The [saved plate 2 project](cad/prints/one-leg-body-r04/bambu/hux-r04-plate-02-pla.3mf) retains the source geometry, scale and flat orientations. The [print record](cad/prints/one-leg-body-r04/bambu/README.md) records the settings and authorization. Plate 1 is complete. Plate 2 completion, sample fit and measured dimensions remain unverified. Recorded spend stays $173.70.

**2026-10-13 R04 first plate complete:** the user reports that plate 1 is complete. At 15:31 EDT, Bambu Studio showed `hux-r04-first-fit-pla_R04 first fit` at 100%, 110/110 layers and Finished. The [print record](cad/prints/one-leg-body-r04/bambu/README.md) now confirms completion of the four small Basic PLA parts. The actual finish time, measured dimensions and corner joint fit remain unrecorded.

Check both M4 bolts, nuts, washers and the actual tool in the sample corner. One wall and the lower deck are next after the joint fits. The larger R04 parts remain unprinted. Recorded spend stays $173.70.

**2026-10-13 R04 PLA print start:** the user requested Basic PLA. Bambu Studio sliced the four small R04 fit parts without an error. The live camera showed a clear plate. MSL-Bambi-X1C accepted `hux-r04-first-fit-pla_R04 first fit` and started heating at about 13:23 EDT. The estimate is 54 minutes and 33.73 g. Bed leveling and flow calibration were on.

The [saved project and dispatch record](cad/prints/one-leg-body-r04/bambu/README.md) include geometry and profile checks. Completion and physical fit remain unverified. Test both bolts, nuts and the actual tool in the sample corner before the larger body prints. No larger R04 parts received a print command. Recorded spend stays $173.70.

**2026-10-13 body fit revision:** the user reports poor body fit and missing actuator mounts. The [dated review](docs/checklists/2026-10-13-r04-fit-review.md) records the report. The [R04 kit](cad/prints/one-leg-body-r04/README.md) supplies matched walls, three decks, larger angles and removable component mounts. It adds an ST3215 case cradle and retains the motor carrier interface.

The CAD checks include board hardware, socket access, connector spaces and sampled leg clearance. Small corner samples precede full body prints. Servo arrival, physical fit and the powered leg transmission remain open. No print was dispatched and no powered result changed. Recorded spend remains $173.70.

**2026-10-11 IndexNow files:** the site build writes robots.txt, sitemap.xml and the IndexNow key file at the site root. The sitemap contains the public HTML pages. The sitemap does not include `/sim.html`. No hardware status changed.

**2026-10-09 3D sandbox:** the two sandbox pages are now one page. A robot control sets V1-PROOF or V0-GENESIS. The user can hide the info panels. `sim.html` opens the archived robot. `proof-sandbox.html` is the merged page. No hardware status changed.

**2026-10-07 R03 prints complete:** the user confirms that all parts are printed. The [dated record and assembly checklist](docs/checklists/2026-10-07-r03-assembly.md) closes the kit print-completion task. The October 6 setup uses default PLA. The next step is an unpowered fit check, then frame and leg assembly with the R03 spacer arrangement.

Inventory and the shared plan now reflect this report. Measured fits, assembly results and powered qualification remain open. The earlier print-dispatch entries below retain their status at that date. Recorded spend stays $173.70.

**2026-10-06 plate two:** the user reports the first fit plate complete and requests plate two. Bambu Studio confirms 90/90 layers and Finished for `hux-r03-first-fit-pla`. The live camera shows a clear plate. The X1C accepted `hux-r03-full-kit-pla_Decks and motor carrier` with the same PLA profile. The estimate is 3 hours, 11 minutes and 137.07 g.

Plate two contains two equipment decks, the motor carrier, the upper link, one coupon and two spacers. The printer shows an active job at 0/60 layers after dispatch. Measured fits, assembly strength and plate two completion remain unverified. No completion record exists for the full-kit plate one.

**2026-10-06 PLA print start:** the user selected default PLA and authorized the print. The [Bambu Studio projects](cad/prints/one-leg-body-r03/bambu/README.md) include a first fit plate and the complete kit on two plates. The X1C accepted the coupon and one deck angle, then entered its heat and bed-level cycle. The slicer estimate is 29 minutes and 14.47 g. Print completion and measured fits remain unverified. The complete kit includes the first fit parts again and requires the checks in the assembly guide before further prints.

**2026-10-06 leg motion and next body:** the user reports completed leg tests and satisfactory travel. The [dated observation](docs/checklists/2026-10-06-leg-motion.md) records the report. Exact endpoints, clearances, free play and loads remain unmeasured in the shared record.

The user confirms sufficient adjustable bench-supply capacity and requests a body with one leg. The [R03 body kit](cad/prints/one-leg-body-r03/README.md) supplies nine STL/STEP part types, a STEP/Blender assembly and four engineering sheets. Its first-stage assumption is a fixed leg with a suspended wheel. The kit preserves the 110 mm links and 40 mm pivots. It adds two body sides, two decks, eight angles, a neutral lock link and the JD-03 motor carrier interface.

Print the interface coupon and one angle first. Confirm the actual motor, wheel, hub and fastener fits before the full batch. The ST3215 transmission, driven shaft and bearings remain open. The motor shaft does not carry body weight in this stage. The new CAD passes nominal geometry and export checks, without a physical load or power qualification. The existing simulation retains its R01 axle position.

**2026-10-05 electrical print views:** EL-01 and EL-05 now use separate 11 x 17 inch landscape PDFs with 0.5 inch margins. The Electrical page includes a PDF view and a download link for each sheet. The five-sheet atlas uses the same paper size. The SVGs supply both the screen diagrams and the PDFs.

The [export procedure](cad/wiring/README.md) describes the update command and visual checks. A source or export change stops the site build until the PDFs match. The source audit remains Rev B. No physical test result changed.

**2026-10-04 wheel drive mount (JD-03):** we worked out how the Pololu 4752 gearmotor mounts to the wheel. The [living sheet](tools/living-drawings/wheel-mount.html) holds the side view, the lateral section, the hole table, the load screen and live clearance checks. The [1:1 carrier template](cad/layouts/wheel-mount-r02.svg) prints the proposed carrier R02. The 37D shaft is 7.0 mm off the motor axis, so the axle moves 25 mm rearward of the lower pivot. The carrier R02 goes outboard of both links. The wheel is a Pololu 3278 scooter wheel on a Pololu 2674 adapter, on the motor shaft.

This is a design proposal from vendor drawings and the Pololu STEP model. Nothing is measured, printed or ordered for it. The proposal asks for an exception to the supported-axle rule in [docs/mechanical.md](docs/mechanical.md#wheel-drive-mount). The shaft play record is the release condition. The simulation still uses the R01 axle position.

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
