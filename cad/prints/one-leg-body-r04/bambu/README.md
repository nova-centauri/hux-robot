# R04 Basic PLA projects

**2026-10-13, completion confirmed.** The user reports that plate 1 is complete. At 15:31 EDT, Bambu Studio showed `hux-r04-first-fit-pla_R04 first fit` at 100%, 110/110 layers and Finished. This confirms print completion. The corner joint fit and measured dimensions remain unverified.

- [Plate 1: first fit](hux-r04-first-fit-pla.3mf)
- [Plate 2: wall, lower deck and three angles](hux-r04-plate-02-pla.3mf)
- [Project verification](validation.json)
- [Assembly and fit guide](../README.md)

The plate contains one each of part 02, part 19, part 21 and part 22. These are the deck angle, fit coupon, side joint sample and deck joint sample. This paragraph records plate 1 only. See the plate 2 record below.

The project uses Bambu PLA Basic, an X1 Carbon with a 0.4 mm nozzle and textured PEI. Settings are 0.20 mm layers, five walls and 40% infill. Supports are off. Each part retains the source scale and flat orientation. The objects have at least 5 mm separation.

Bambu Studio reports **54 minutes, 8 seconds** and **33.73 g**. It sliced the plate without an error. The live camera showed a clear plate before dispatch. The connected printer is **MSL-Bambi-X1C**. Its external spool reports PLA. Automatic bed leveling, flow calibration and timelapse were on.

At 13:23 EDT, the printer accepted the R04 job and showed 0/110 layers with an active heat cycle. The initial finish estimate was 14:17 EDT. The completion check above supersedes the status at dispatch. The actual finish time remains unrecorded.

Check both M4 bolts, nuts, washers and the actual tool in the sample corner after cooling. The user requested further prints before this check on October 13. This request changes the print order, but does not confirm fit.

Run `python verify.py` with numpy, scipy and trimesh after a project edit. It compares the saved mesh geometry with the R04 source files and checks the quantities, placement, scale and PLA settings.

## Plate 2 print start, 2026-10-13

The user said, "Not checked yet. Keep printing". Plate 2 contains one part 01 body wall, one part 03 lower deck and three part 02 angles. It uses the same Basic PLA profile. Bambu Studio sliced the plate without an error and estimated 3 hours, 43 minutes and 190.62 g. The live camera showed a clear bed.

The source geometry, quantities, placement and saved profile pass `verify.py`. Each object retains its original size and flat orientation. The first angle from plate 1 and these three angles supply the four lower-deck corners. The sample fit remains unverified.

MSL-Bambi-X1C accepted `hux-r04-plate-02-pla_Wall lower deck and angles`. It showed an active heat cycle at 0/110 layers after transfer. The job estimate is 3 hours, 43 minutes, 15 seconds and 190.62 g. The initial finish estimate is 19:17 EDT. Bed leveling, flow calibration and timelapse were on. Plate 2 completion remains unverified.
