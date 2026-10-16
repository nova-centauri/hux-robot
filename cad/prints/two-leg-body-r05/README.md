# Two-leg body R05

**2026-10-14. Two-leg body with rear hips, inner servos and a battery tray. Print candidate.**

R05 follows the [anatomy layout](../../../tools/living-drawings/anatomy.html) and the [2026-10-14 review](../../../docs/checklists/2026-10-14-anatomy-review.md). The user requested new STL files and PLA prints on 2026-10-14. Physical fit, strength and powered tests remain open.

![Side, front and top views of the R05 assembly](views.png)

- [Complete kit](two-leg-body-r05-kit.zip), [assembly STEP](two-leg-body-r05.step) and [parameters](parameters.json)
- [Part quantities](manifest.json) and [CAD checks](validation.json)
- [Bambu Studio plates](bambu/README.md)

## Changes from R04

| Item | R04 | R05 |
| --- | --- | --- |
| Hips | X = 0, struts slant rearward | X = +30, struts slant forward |
| Legs | One leg | Two legs, the far side is the mirror of the near side |
| Motor carrier | Axle 25 mm rearward of the strut end | Same carrier. The axle and the gearmotor sit toward the hip. |
| Leg range | 15° to 45° | 15° to 40°. The gearmotor clears the lower strut by 2.1 mm at 40° and 0.23 mm at 45°. |
| ST3215 servos | One cradle outside the near wall | Part 13 cradle inside each wall, below the lower deck |
| Battery | No position | Part 24 tray at the bottom of the walls |
| Rear lower-deck angles | X = +44 | X = +48, clear of the upper hip nut and its socket |
| Bench fixture | Uprights and fixture holes | Removed |

Coordinates are the R04 body coordinates. X points rearward, Y points outward from the near wall and Z points up. The origin is on the body centre line at the lower hip height.

## Parts

Print one set of the quantities in [manifest.json](manifest.json). The [plate files](bambu/README.md) contain one complete set. Part 19 is the R04 hole coupon. It is not on a plate.

The walls are identical parts. Each wall has the two hip holes at X = +30, Z = 0 and Z = +40. The neutral lock hole is at X = +18, Z = −20.8. The servo cradle uses four M4 wall bolts and four 7 mm access holes for its M3 nuts. The tray uses two M4 bolts in each wall.

The inner servo cradle holds the ST3215 case with its long axis horizontal. The output points into the body and is 41 mm forward of the lower hip. Two cap bars hold the case. Each bar uses two M3 x 45 bolts through the cradle rails. Do not compress the case.

The battery tray has a flange along each wall and four strap slots. The pack envelope in the CAD is 106 x 35 x 25 mm, as an example. Measure the actual pack before you fit straps.

## Limits

**2026-10-16:** V1-PROOF has no powered hips. Both legs stay locked at 30° with the lock links. The servo cradles and cap bars are optional in V1-PROOF.

The 3:1 belt drive from each servo to its lower hip is not in this kit. It is for the next version. The hip shaft, the wall bearings and the pulleys remain to design. The hips use the passive M4 pivot stack of R04. Do not apply servo torque through these pivots.

Limit the leg to 40° until a hand sweep confirms the gearmotor clearance. Use the neutral lock link for the first balance tests.

## Checks

`validate.py` reopens every STL and STEP and checks each hole section. It checks the fixed assembly, the board fasteners and the wall bolt envelopes on both walls. It sweeps both legs from 15° to 40° at 0.5° steps. The minimum exact clearance is 2.0 mm, at the leg spacers. The minimum gearmotor clearance is 2.1 mm.

These are nominal CAD checks. They exclude cables, print errors, deflection and the servo transmission.

```sh
pip install -r requirements.txt
python build.py
python validate.py
python bambu/build_plates.py
python package.py
```
