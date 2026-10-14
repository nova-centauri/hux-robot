# Anatomy animation and two-leg layout review - 2026-10-14

## Request

The user requested animated views of Hux. The views show the kinematics and the component layout. The user requested top, side and front orthographic views. The user also requested an x-ray view of the electronics and their connections. The user requested corrections to the drawings where parts do not work or fit together.

## Result

The new [anatomy page](../../tools/living-drawings/anatomy.html) (AN-01) shows four synchronized views. The top, side and front views are orthographic at one scale. The fourth view is a 3D view. The animation has three chapters:

1. Leg kinematics: the leg angle moves from 15° to 45°. The robot leans to keep its CoM above the axle.
2. Drive and balance: the robot moves forward 320 mm and returns. The wheels turn without slip.
3. Electronics x-ray: the body becomes transparent. Labels identify each board. Pulses move along each harness class.

The geometry comes from the R04 reference STL instances. `tools/living-drawings/build_anatomy.py` packs them into `anatomy-mesh.js` without a change to the geometry. The far leg is the near R04 leg stack, mirrored about the body mid-plane. Harness classes come from the EL netlist, Rev B. Harness paths are illustrations. They are not a harness release.

## Method

The leg uses the R04 equations. The lower carrier pivot is at (110 sin q, -110 cos q) from the lower body pivot. The JD-03 axle is 25 mm rearward of that point. The motor axis is 32 mm rearward.

The CoM estimate uses the model.json mass list. The positions are assumptions. Body items are on the body centre line. The servos are at the cradle. The links are at their mid-points. The gearmotors and wheels are on their axes.

The balance trim is the angle that puts this CoM above the axle. The simulation uses the same principle. Measure the real mass and CoM before you change the simulation.

## Findings

The user corrected the first R05 proposal on 2026-10-14. The plan puts the hips near the rear of the body. Each strut slants forward and down to the wheel. The servos and the battery go inside the body.

The user then reported that the published page still showed the unbalanced R04 layout. The page now opens with the R05 layout. The R05 layout keeps the R04 motor carrier without a mirror and puts the hips at X = +30. The table shows this layout.

| ID | Finding | Evidence | Correction in R05 |
| --- | --- | --- | --- |
| F-1 | Hips on the centre line | R04 puts the hips at X = 0 and the struts slant rearward. The axle is 54-103 mm rearward of the body centre. The estimated lean is 17° / 26° / 35° back at 15° / 30° / 45°. | Hips at X = +30. The struts slant forward. The two rear lower-deck angles go above the deck. The estimated lean is 10° back / 0° / 10° forward. At neutral, the axle is below the body centre. |
| F-2 | Motor carrier hand | A mirrored carrier puts the axle 25 mm forward of the strut end. The lean at neutral is then 13° forward. | Keep the R04 carrier without a mirror. The axle and the gearmotor sit rearward of the strut end, toward the hip. The exact CAD clearance between the gearmotor and the lower strut is 2.1 mm at 40° and 0.23 mm at 45°. R05 limits the leg to 15–40°. |
| F-3 | Height above target | R04 is 320-348 mm high to the Pico 2 board, upright. The target is 280-310 mm. | Decision for the user: accept the height, or reduce the body to two decks. |
| F-4 | One driver position | The lower deck has one DRV8874 position. V1-PROOF needs two. | Put both 15.2 x 17.8 mm drivers on the one driver board, 3 mm apart. |
| F-5 | No battery position | R04 uses the bench supply. The mass list includes a 0.2 kg 3S pack. | A tray at the bottom of the walls holds the pack, between the two servo belts. The CoM and the lean include the pack at X = -5, Z = -17.5. |
| F-6 | Servos outside the body | R04 mounts the ST3215 servo on the outer face of the near wall. | Each servo goes inside, against its wall, below the lower deck. The output is at X = -15, Z = +12. A 3:1 belt drives the lower hip shaft on the inner side of the wall. |
| F-7 | Circuits without a position | The watchdog, the latching gate, the ADC conditioning and the ARM switch have no board. | Assign each circuit to a board before the harness release. |

The internal servo case measures 45.2 x 35 x 24.7 mm. It occupies X = -50 to -5 and Z = 0 to +24. This is clear of the front lower-deck angles. The two belts are 45 mm apart. The hip shaft, the wall bearings and the belt tension are not designed.

The [R05 kit](../../cad/prints/two-leg-body-r05/README.md) checks this clearance with exact STEP distances. The value excludes the motor screws, the cables and print errors. Check it by hand through the full sweep.

These checks pass in the mirrored layout:

- The two encoder ends are 50 mm apart.
- The track is 230 mm. The overall width is 254 mm. These agree with model.json.
- The gearmotor clears the wall bottom by 24 mm at 45°.
- The far wall is the same part as the near wall.

## Decision status

The R05 items are proposals. The page shows them with the "R05 proposal" layout button. The R04 CAD, the STL files and the print files did not change. R04 plate 2 contains a wall with the R04 pivot holes. A hip change makes that wall a fit sample only. The user decides each correction.

## Next checks

- [ ] Confirm the R05 hip position X = +30 for the two-leg body.
- [ ] Check the gearmotor clearance to the struts by hand at 15°, 30° and 45°.
- [ ] Decide F-3. Accept the R04 height, or reduce the deck count.
- [ ] Measure two received DRV8874 drivers on one board blank. Record heat after a 2 A bench run.
- [ ] Measure the actual battery. Record its size, mass and connector.
- [ ] Weigh the assembled body and find its CoM. Update the simulation `comOffset` with the measured value.

## Rebuild

Run `python3 build_anatomy.py` in `tools/living-drawings` after an R04 rebuild. Run `python3 build_anatomy.py --check` to find a stale mesh file. The script needs numpy.
