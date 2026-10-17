# R05 Basic PLA plates

**2026-10-14.** The user requested the R05 parts in PLA. Five Bambu Studio projects contain one complete R05 set. `build_plates.py` writes them from the R05 STL files.

| Plate | File | Contents |
| --- | --- | --- |
| 1 | [hux-r05-plate-1-walls.3mf](hux-r05-plate-1-walls.3mf) | Two part 01 walls |
| 2 | [hux-r05-plate-2-decks.3mf](hux-r05-plate-2-decks.3mf) | Parts 03 and 04, twelve part 02 angles |
| 3 | [hux-r05-plate-3-deck-tray.3mf](hux-r05-plate-3-deck-tray.3mf) | Part 05, part 24 tray, two part 06 carriers, eight leg spacers |
| 4 | [hux-r05-plate-4-links-servo.3mf](hux-r05-plate-4-links-servo.3mf) | Four struts, two part 13 cradles, four part 14 cap bars |
| 5 | [hux-r05-plate-5-electronics.3mf](hux-r05-plate-5-electronics.3mf) | Four cassettes, Pico 2 and IMU plates, standoffs and feet |

The projects use the R04 profile: Bambu PLA Basic, X1 Carbon with a 0.4 mm nozzle, textured PEI, 0.20 mm layers, five walls, 40% infill and no supports. Each part keeps its source scale and flat orientation. The struts turn 90° about Z only. The parts stay clear of the purge area at the front left.

[plates.json](plates.json) records the position of each object. Print one plate at a time. Remove each finished plate before the next print.

## Print record

**2026-10-14, plate 1 sliced.** Bambu Studio opened `hux-r05-plate-1-walls.3mf` with the X1 Carbon, textured PEI and Bambu PLA Basic profiles. It sliced the plate without an error. The estimate is 4 hours, 4 minutes and 230.55 g.

MSL-Bambi-X1C shows the R04 plate 2 job at 100%, 110/110 layers and Finished. The camera view shows the bed at the bottom of its travel, and the plate surface is not clear in the image. No R05 job was sent. Remove the R04 parts and confirm a clear bed before the dispatch.

**2026-10-14, plate 1 sent.** The user reports a clear bed. Bambu Studio sliced plate 1 again with the same result. At 17:37 EDT, MSL-Bambi-X1C accepted `hux-r05-plate-1-walls_R05 walls`. It showed 0% at layer 0/30 with the nozzle at heat, and an initial finish estimate of 21:41 EDT. Timelapse, bed leveling and flow calibration were on. Plate 1 completion and the wall fits remain unverified.

**2026-10-15, plate 2 sent.** At 07:27 EDT, Bambu Studio showed the plate 1 job at 100%, 30/30 layers and Finished. The user reports a clear bed. The user did not measure the walls and said, "The printer is very accurate". The wall fits remain unmeasured.

Bambu Studio sliced plate 2 without an error. The estimate is 4 hours, 40 minutes and 211.87 g. At 07:28 EDT, MSL-Bambi-X1C accepted `hux-r05-plate-2-decks_R05 lower and middle decks and angles`. It showed 0% at layer 0/110, with an initial finish estimate of 12:08 EDT. Plate 2 completion remains unverified.

**2026-10-15, plate 2 complete.** At 12:34 EDT, the user reports that plate 2 is complete. The deck and angle fits remain unmeasured. Plates 3, 4 and 5 are not printed.

**2026-10-15, plate 3 sent.** At 12:51 EDT, Bambu Studio showed the plate 2 job at 100%, 110/110 layers and Finished. The user reports a clear bed. Bambu Studio sliced plate 3 without an error. The estimate is 3 hours, 8 minutes and 150.49 g.

At 12:52 EDT, MSL-Bambi-X1C accepted `hux-r05-plate-3-deck-tray_R05 upper deck, tray and leg parts`. It showed 0% at layer 0/70, with an initial finish estimate of 15:59 EDT. Plate 3 completion remains unverified.

**2026-10-16, plate 4 sent.** At 07:04 EDT, Bambu Studio showed the plate 3 job at 100%, 70/70 layers and Finished. The user reports a clear bed. Bambu Studio sliced plate 4 without an error. The estimate is 3 hours, 11 minutes and 95.86 g.

At 07:08 EDT, MSL-Bambi-X1C accepted `hux-r05-plate-4-links-servo_R05 links and servo mounts`. It showed 0% at layer 0/202 and waited for the bed temperature. The initial finish estimate is approximately 10:19 EDT. Plate 4 completion remains unverified.

**2026-10-16, plate 4 complete, plate 6 sent.** At 15:00 EDT, Bambu Studio showed the plate 4 job at 100%, 202/202 layers and Finished. The user reports a clear bed. Bambu Studio opened `hux-r05-plate-6-leg-drive.3mf` and sliced it without an error. The estimate is 2 hours, 48 minutes and 104.11 g, with 156 layers.

At 15:11 EDT, MSL-Bambi-X1C accepted `hux-r05-plate-6-leg-drive_R05 leg drive, servo frames, crank hubs, bushings, upper links and drill jigs`. It showed 0% at layer 0/156, with an initial finish estimate of 17:59 EDT. Timelapse, bed leveling and flow calibration were on. Plate 6 completion and the leg-drive fits remain unverified.

A first plate title with a colon caused a Bambu Studio error, "Invalid name". `build_plates.py` now uses a comma. Plate titles must not contain `< > : / \ | ? *`.
