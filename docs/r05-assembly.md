# R05 two-leg body assembly guide

**Revision R05, 2026-10-16.** This guide tells you how to assemble the [R05 two-leg body](../cad/prints/two-leg-body-r05/README.md). It follows the [anatomy layout](../tools/living-drawings/anatomy.html) with rear hips, inner servos and a battery tray. Plates 1 to 4 are printed. Plate 5 remains to print. Plate 6, the leg drive, is new on 2026-10-16.

The user reports that the frame is assembled: the two walls, the three decks and the battery tray. The user reports that the hip-hole measurements agree with step 0. The user reports that the ST3215 servos do not fit the part 13 cradles. The leg drive supersedes parts 13 and 14. No R05 load or powered test is recorded.

**V1-PROOF has no powered hips (2026-10-16).** Both legs stay locked at 30°. Steps 1 and 7 install the leg drive: the servo frames, the servos, the crank hubs and the pushrods. They are optional for V1-PROOF. Do steps 2 to 6 and step 8 first.

![Side view of the R05 leg geometry with rear hips and forward struts](assets/r05-assembly/side-hip-geometry.png)

## Before you start

WARNING: Disconnect the battery and the bench supply before you assemble or adjust Hux. A motor or a servo can move and cause injury.

CAUTION: Do not power a servo with its pushrod connected and the lock bolt installed. The servo pulls against the lock and can cause damage to the link, the hub or the servo gears. Remove the lock bolt before a powered test, or disconnect the pushrod.

CAUTION: Do not move a leg beyond 40°. At 45° the gearmotor is 0.23 mm from the lower strut. Contact can cause damage to the strut.

### Words in this guide

| Word | Meaning |
| --- | --- |
| Front | The forward direction of Hux. X decreases toward the front. |
| Rear | The direction of the hips. X increases toward the rear. |
| Near wall | The wall that you see in the side view. |
| Far wall | The opposite wall. Its parts are the mirror of the near-wall parts. |
| Hip | The pivot of a strut on a wall. Each wall has a lower hip at Z = 0 and an upper hip at Z = +40. |
| Strut | The lower lock link (part 07) or the upper link (part 08). |
| Neutral | The leg angle of 30°. The lock link holds this angle. |

### Printed parts

Count the parts before you start. The plate column tells you where each part prints.

| Part | Name | Quantity | Plate |
| --- | --- | ---: | ---: |
| 01 | Body wall | 2 | 1 |
| 02 | Deck angle | 12 | 2 |
| 03 | Lower deck, engraved "R05 PWR" | 1 | 2 |
| 04 | Middle deck, engraved "R05 BUS" | 1 | 2 |
| 05 | Upper deck, engraved "R05 CTRL" | 1 | 3 |
| 24 | Battery tray | 1 | 3 |
| 06 | Motor carrier | 2 | 3 |
| 09 | Leg spacer, 2 mm | 4 | 3 |
| 10 | Leg spacer, 12 mm | 4 | 3 |
| 07 | Lower lock link | 2 | 4 |
| 08 | Upper link with pushrod boss | 2 | 6 |
| 25 | Servo frame | 2 | 6 |
| 26 | Crank hub | 2 | 6 |
| 27 | Wall bushing | 2 | 6 |
| 28 | Drill jig, near wall | 1 | 6 |
| 29 | Drill jig, far wall | 1 | 6 |
| 15 | Interface cassette | 4 | 5 |
| 11 | Pico 2 plate | 1 | 5 |
| 12 | IMU plate | 1 | 5 |
| 16 | Pico standoff | 4 | 5 |
| 17 | Board standoff | 16 | 5 |
| 18 | IMU standoff | 4 | 5 |
| 23 | Module foot | 24 | 5 |

The lower deck and the middle deck look almost the same. On the lower deck, the two rear angle slots are 4 mm nearer to the rear edge. Use the engraved names.

### Hardware

| Item | Quantity | Use |
| --- | ---: | --- |
| M4 x 16 bolt, plain nut, two 0.5 mm washers | 24 | Twelve deck angles, two bolts each |
| M4 x 20 bolt, plain nut, one washer | 8 | Two servo frames, four bolts each. The nut sits in the frame pocket. |
| M4 x 16 bolt, plain nut, washer | 4 | Battery tray, two bolts in each wall |
| M2 x 10 screw | 8 | Two servos, four screws each, into the servo face holes |
| M3 x 35 screw | 2 | One through each crank hub into the servo output |
| Ball stud, 2 mm thread, with nut | 4 | One on each crank, one on each upper link boss |
| RC pushrod with two ball links, 40 mm between ball centres | 2 | One each side |
| M4 pivot bolt, nut and smooth washers | 8 | Four hips and four carrier pivots |
| M4 lock bolt and nut | 2 | Neutral lock, one each side |
| M3 x 8 screw | 12 | Two gearmotors, six screws each |
| M3 x 16 screw, nut and thin washer | 24 | Six module plates to the decks |
| M3 x 16 screw, nut and thin washer | 20 | Four interface boards and the IMU |
| M2 x 18 screw, nut and insulating washer | 4 | Pico 2 |
| Hook-and-loop strap, 20 mm | 2 | Battery |

Measure the pivot bolt length on the actual stack. The stack at each hip is the wall, a spacer and a strut. The stack at each carrier pivot is the strut, a spacer and the carrier. Use the spacer table in step 5.

### Tools

- 2.5 mm and 3 mm hex keys
- 7 mm socket or wrench for M4 nuts, maximum 12 mm outside diameter
- 5.5 mm wrench for M3 nuts
- Calipers
- Square

## Step 0. Check the first parts

1. Remove the brim and loose material from each part.
2. Examine each part for cracks, warped faces and damaged holes.
3. Measure the distance between the two hip holes on each wall. The value must be 40.0 mm.
4. Measure the hip holes from the rear edge of each wall. The centre must be 30 mm from the rear edge.
5. Put one M4 bolt through a hip hole and turn it by hand. The bolt must turn without force.
6. Record each measurement in the [R05 fit record](checklists/2026-10-15-r05-fit-record.md).

If a measurement is more than 0.3 mm from its value, stop. Record the value before you continue.

## Step 1. Prepare the walls and install the servo frames (optional for V1-PROOF)

![Step 1. Servo frames and wall bushings on both walls](assets/r05-assembly/step-1-cradles.png)

The printed walls of 2026-10-14 do not have the leg-drive holes. Add them with the drill jigs before you install the frames. If the frame is already assembled, remove the struts first.

1. Put the near-wall jig (part 28) on the outer face of the near wall. Bolt it to the two hip holes with M4 bolts.
2. Drill the four frame holes at 4.5 mm and the pilot hole at 3.2 mm through the wall.
3. Remove the jig. Open the pilot hole to 24 mm with a step bit or a 15/16 in Forstner bit. Remove the burr on both faces.
4. Do items 1 to 3 again on the far wall with part 29.
5. Push a wall bushing (part 27) into each bore from the outside, flange out. Glue it if it is loose.
6. Attach each servo to its frame on the bench. Put the servo output face in the frame recess, with the output disc in the round window and the cable sockets in the rear window. Install four M2 x 10 screws from the wall side of the frame.
7. Connect the servo cables before you install the frame. Route them out of the rear window.
8. Put four M4 nuts into the frame pockets. Put the frame on the inner face of the wall. Install four M4 x 20 bolts from the outer face, with a washer under each head.
9. Make sure that the output disc is central in the wall bushing. Then tighten the bolts.
10. Do items 6 to 9 again on the far wall.

## Step 2. Assemble the decks and the angles

![Step 2. Decks and angles between the walls](assets/r05-assembly/step-2-frame.png)

1. Attach four angles to each wall with M4 x 16 bolts. Leave the nuts loose.
2. Use the wall holes below each deck height. The rear lower-deck angle uses the hole 48 mm from the centre line.
3. Put the lower deck "R05 PWR" on its four angles. Install the four deck bolts. Leave the nuts loose.
4. Put the middle deck "R05 BUS" and the upper deck "R05 CTRL" on their angles in the same way.
5. Measure the inside width between the walls at each deck. The value must be 135 mm.
6. Put the square against a wall and a deck. Adjust the frame until it is square.
7. Tighten all 24 nuts. Do not crack the angles.

## Step 3. Install the battery tray

![Step 3. Battery tray at the bottom of the walls](assets/r05-assembly/step-3-tray.png)

1. Put the tray between the walls with the flanges up. The flange notches must point to the rear.
2. Push the tray down until its bottom face aligns with the bottom edges of the walls.
3. Install four M4 x 16 bolts from the outer faces of the walls through the flanges.
4. Tighten the nuts inside the flanges.
5. Look at each lock hole from inside the body. The flange notch must leave the hole clear.

## Step 4. Install the electronics modules

![Step 4. Electronics modules on the decks](assets/r05-assembly/step-4-electronics.png)

Assemble each module on the bench before you attach it to a deck. The [R04 guide](../cad/prints/one-leg-body-r04/README.md#component-mounts) gives the board hole patterns and the standoff lengths. R05 uses the same modules.

1. Attach the Pico 2 to its plate with four M2 screws and the 10 mm standoffs.
2. Attach the LSM6DSO IMU to its plate with four M3 screws and the 8 mm standoffs.
3. Install both DRV8874 drivers on one 52 x 38 mm insulating board, 3 mm apart. Do not put a screw through a driver board.
4. Prepare the power cut and fuse board, the servo bus board and the regulator board.
5. Attach each module to its deck with four M3 x 16 screws through the module feet.

| Deck | Near half | Far half |
| --- | --- | --- |
| Upper, "R05 CTRL" | IMU | Pico 2 |
| Middle, "R05 BUS" | Regulators | Servo bus and encoder conversion |
| Lower, "R05 PWR" | Power cut and fuse | Two DRV8874 drivers |

Route the harness through the cable exits on the front edge of each deck. Refer to the [wiring atlas](wiring-atlas.md) for each connection. The atlas Rev C of 2026-10-17 gives a cut length for each bundle and the connector loading.

**Change of 2026-10-17.** The wiring atlas adds a leg junction board under the lower deck, accepted by the user. It carries the two motor pigtail headers and the encoder dividers. The far half of the middle deck then has no board in V1-PROOF. The board layout and its mount under the deck are open. Measure the pigtail route on the frame before you fix the position.

## Step 5. Install the struts and the carriers

![Step 5. Struts and carriers at the rear hips](assets/r05-assembly/step-5-legs.png)

Each strut goes from a hip down and forward to its carrier. The carrier stays vertical through the full leg range.

| Joint | Spacer |
| --- | ---: |
| Wall to lower strut, at the lower hip | 2 mm |
| Wall to upper strut, at the upper hip | 12 mm |
| Lower strut to carrier | 12 mm |
| Upper strut to carrier | 2 mm |

1. Install the lower lock link at the lower hip, with a 2 mm spacer against the wall.
2. Install the upper link at the upper hip, with a 12 mm spacer against the wall.
3. Turn both struts so that they point forward and down.
4. Put the carrier outboard of both struts. The motor holes must be to the rear of the strut ends, toward the hips.
5. Install the lower carrier pivot with a 12 mm spacer and the upper carrier pivot with a 2 mm spacer.
6. Tighten each pivot nut until the joint turns freely without play. Do not clamp a strut.
7. Turn the leg to 30°. Install the lock bolt through the lower lock link and the wall.
8. Do steps 1 to 7 again on the other side.

CAUTION: Use the same carrier hand on both sides. The gearmotor must sit toward the hip. A carrier with the motor toward the front puts the wheel 25 mm too far forward.

## Step 6. Install the gearmotors and the wheels

![Step 6. Gearmotors and wheels](assets/r05-assembly/step-6-drive.png)

1. Put the Pololu 4752 gearmotor against the inboard face of the carrier, through the 12.4 mm pilot bore.
2. Measure the screw engagement. It must be 2 to 3 mm, never more than 3 mm.
3. Install six M3 x 8 screws. Tighten them in a cross pattern.
4. Attach the hub and the wheel to the motor shaft.
5. Put a cable tie through the carrier anchor slots. Leave a service loop for the full leg range.
6. Do steps 1 to 5 again on the other side.

## Step 7. Install the crank hubs, the pushrods and the battery

![Step 7. Servos, crank hubs, pushrods and battery](assets/r05-assembly/step-7-servo-battery.png)

For V1-PROOF, you can skip items 1 to 6. Then do items 7 and 8.

1. Remove the M3 screw from the servo output disc. Keep the disc on the spline.
2. Put the crank hub (part 26) on the disc from the outside, through the wall bushing. The four pins enter the disc holes. Turn the hub until the pins drop in.
3. Install the M3 x 35 screw through the hub into the servo output. Tighten it until the hub cannot turn on the disc.
4. Install one ball stud in the crank tip and one in the upper link boss, both pointing outward. Tighten the nuts on the back.
5. Set the pushrod to 40 mm between the ball centres. Put the leg at 30°, with the lock bolt installed. Turn the hub until the pushrod snaps onto both studs without force. Adjust the pushrod length if necessary.
6. Turn the servo on with torque disabled and record the position at 30°. Then remove the lock bolt and move the leg by hand from 15° to 40°. The crank must turn about 69°. Nothing must touch.
7. Put the 3S pack on the tray.
8. Put two straps through the tray slots and around the pack.

CAUTION: Do not power a servo with the lock bolt installed and the pushrod connected.

Measure the actual pack before you buy straps. The CAD space is 106 x 35 x 25 mm.

![Side view of the leg drive at 30 degrees](assets/r05-assembly/side-leg-drive.png)

## Step 8. Final checks

1. Remove the lock bolt on one side. Hold the leg.
2. Turn the leg slowly from 15° to 40° by hand.
3. Look at the gap between the gearmotor and the lower strut. The gap must be visible at 40°.
4. Make sure that no cable, nut or bolt end touches a part that moves.
5. Install the lock bolt again at 30°.
6. Do steps 1 to 5 again on the other side.
7. Weigh the assembled robot. Record the mass.
8. Find the CoM: balance the robot on a rod below the axle. Record the X position.

Record each result in the [R05 fit record](checklists/2026-10-15-r05-fit-record.md). The simulation uses the measured mass and CoM.

## References

- [R05 kit and CAD checks](../cad/prints/two-leg-body-r05/README.md)
- [R05 print plates](../cad/prints/two-leg-body-r05/bambu/README.md)
- [Anatomy page](../tools/living-drawings/anatomy.html)
- [2026-10-14 layout review](checklists/2026-10-14-anatomy-review.md)
- [Wiring atlas](wiring-atlas.md)
