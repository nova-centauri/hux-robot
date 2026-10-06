# Bambu Studio PLA projects

**2026-10-06.** The user selected default PLA and authorized the print. These projects use Bambu PLA Basic on an X1 Carbon with a 0.4 mm nozzle and textured PEI.

- [First fit plate](hux-r03-first-fit-pla.3mf): one interface coupon and one deck angle.
- [Complete kit](hux-r03-full-kit-pla.3mf): all nine part types, with the full quantities on two plates.
- [Project verification](validation.json): quantities, source geometry, placement and profile checks.

Run [verify.py](verify.py) with numpy, scipy and trimesh after a project edit. Recheck each slice after a geometry or profile change.

Both projects use 0.20 mm layers, five walls and 40% infill. The four small spacers use 100% infill. The PLA temperature settings retain the stock profile. Supports are off. All models retain their original scale and flat print orientation.

| Project or plate | Slicer estimate | PLA estimate |
| --- | ---: | ---: |
| First fit plate | 29 minutes, 4 seconds | 14.47 g |
| Complete kit, plate 1 | 4 hours, 13 minutes | 209.39 g |
| Complete kit, plate 2 | 3 hours, 11 minutes | 137.07 g |

Each time estimate includes preparation. The complete kit includes another coupon and all eight angles. It does not subtract the first fit plate.

1. Measure the first coupon holes against the actual fasteners and motor pilot.
2. Check access to both deck-angle nuts with both bolts in place.
3. Print the next fit parts in the order from the [assembly guide](../README.md#parts-and-print-order).
4. Remove duplicate parts from later plates if you reuse the first angle or the R01 parts.
5. Arrange and slice each changed plate again before the next print.

## Print session, 2026-10-06

Bambu Studio 2.8.2.61 accepted all nine STL files. Both complete-kit plates sliced without errors. The full project contains 20 objects and uses about 346.46 g of PLA.

The connected printer is **MSL-Bambi-X1C**. Its external spool reports PLA. The live camera showed a clear plate before dispatch. The printer accepted **hux-r03-first-fit-pla** and entered its heat and bed-level cycle. Automatic bed leveling and flow calibration were on.

Only the first fit plate received a print command. Print completion, measured fit and assembly strength remain unverified in this record. The complete kit is a prepared project for later work.
