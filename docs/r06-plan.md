# R06 body plan

**Opened 2026-10-17. This is a plan for the next body print revision of V1-PROOF. No R06 part is designed, printed or tested.** R06 keeps the R05 layout: rear hips, forward struts, three decks, inner servo frames and a battery tray. It corrects what the R05 build and the wiring atlas Rev C found.

The scope of V1-PROOF does not change: two wheel gearmotors, legs locked at 30°, no powered hips.

Do not start the R06 CAD before the R05 measurements in the [fit record](checklists/2026-10-15-r05-fit-record.md) are complete. R06 needs the assembled mass, the CoM position, the inside width at each deck and the actual pack dimensions.

## What R05 taught us

| Finding | Source | R06 answer |
| --- | --- | --- |
| The printed walls have the superseded cradle holes and not the leg-drive holes. Two drill jigs add them. | [R05 kit](../cad/prints/two-leg-body-r05/README.md) | Walls with the 24 mm bore and the four M4 frame holes in the print. No jigs. |
| The ST3215 servos did not fit the part 13 cradles. The leg drive replaced them. | Fit record, 2026-10-16 | Keep the leg drive of plate 6. Remove parts 13 and 14 from the kit. |
| The left motor pigtail cannot reach the driver board. A leg junction board goes under the PWR deck. | [Wiring atlas Rev C](wiring-atlas.md) | A mount for the JLEG board on the underside of the PWR deck, with a pass for both pigtails. |
| The far cassette of the BUS deck has no board in V1-PROOF. | Wiring atlas Rev C | Keep the position as a spare, or move the PDB there and free the near half. Decide after the KC board size is known. |
| The 52 x 38 mm cassette board is too small for the kill-chain board and tight for two DRV8874 carriers with six XH headers. | [Kill chain](kill-chain.md), EL-07 | Cassettes for a 70 x 50 mm perfboard, the common size. One cassette design for KC, DB and PDB. |
| The harness runs down the front face of the far half. The decks have cable notches but no tie points. | EL-01, EL-06 | Tie slots or printed clips along the front edge of each deck, both halves. A strain-relief anchor for the right trunk at each deck. |
| The pack envelope 106 x 35 x 25 mm is an example. The user can build a 3S pack from NCR20700B cells. | [Parameters](../cad/prints/two-leg-body-r05/parameters.json), user 2026-10-17 | A tray sized to the measured pack. A 3S1P pack of 20700 cells is about 62 x 70 x 21 mm, so the strap slots move. |
| The gearmotor clears the lower strut by 2.1 mm at 40° and 0.23 mm at 45°. | R05 kit limits | Move the carrier pivot or relieve the strut, so the full 15° to 45° range returns with 2 mm of clearance. |
| The KILL and ARM buttons sit on the bench fixture. The robot has no button position. | Kill chain | A KILL button position on the top of the body, in reach when the robot stands. ARM stays on the fixture. |
| The Pico 2 gets XH headers after the pins come off. | Wiring atlas Rev C | Check the clearance over the Pico plate for the XH housings and the cable bend. |

## What does not change

- The hip position at X = +30, the 110 mm link centres and the 40 mm pivot spacing.
- The three deck heights at Z +60, +120 and +170, and the 135 mm inside width.
- The motor carrier of R04. The wheel mount question of JD-03 stays open and separate.
- The Pico 2 on the CTRL deck. The user accepts the 335 mm runs to the driver board.
- The leg drive geometry: crank centre (−18, +34), 16 mm crank, 40 mm pushrod, boss at 42 mm.

## Inputs that R06 needs first

1. The assembled R05 mass and the CoM position in X, from step 8 of the [assembly guide](r05-assembly.md).
2. The inside width at each deck, nominal 135 mm.
3. The pack: cell count, arrangement, outside dimensions and lead exit. Measure the built pack or the bought pack.
4. The first kill-chain board on a perfboard, so that the board size and the connector positions are real.
5. The measured harness lengths from the R05 build, against the EL-06 estimates.
6. The leg-drive fit checks of plate 6, from the fit record.

## Proposed change list

1. **Walls.** Add the leg-drive bore and the four M4 holes. Keep the hip holes, the lock hole and the deck angle holes. Add two tie slots per wall at the front edge for the harness trunk.
2. **Decks.** Keep the mount pattern for the Pico plate and the IMU plate. Change the cassette feet to the 70 x 50 mm perfboard pattern. Add a JLEG mount under the PWR deck with a 30 mm pass for the two pigtails.
3. **Cassette.** One cassette for a 70 x 50 mm perfboard with four M3 standoffs and a 60 x 40 x 25 mm component space. Three cassettes: KC, DB, PDB. The BUS far position stays empty or takes the PDB.
4. **Tray.** Parametric on the measured pack. Strap slots at the pack ends. A notch for the pack lead toward the near wall and the KC board.
5. **Carrier or strut.** Restore 2 mm of gearmotor clearance at 45°. The first candidate is a 3 mm relief on the inner face of the lower strut at the gearmotor arc.
6. **KILL position.** A boss for a 22 mm mushroom button, on the rear edge of the CTRL deck or on the near wall top. Its two leads go to KC.JKILL.
7. **Kit.** Remove parts 13, 14, 28 and 29. Add the JLEG mount and the three cassettes. Regenerate the plates.

## Open questions for the user

- Does R06 wait for the first balance tests on R05, or does it start when the pack is measured? The balance tests can change the CoM and the tray position.
- Does the ARM button also go on the robot, or does it stay on the fixture?
- Is the 70 x 50 mm perfboard the standard for the small boards, or does the user prefer a custom PCB for the kill chain?
- Does R06 print all parts again, or only the walls, the cassettes and the tray? The decks and the struts of R05 can stay.

## Sequence

1. Complete the R05 fit record and the first bench tests.
2. Build the kill-chain board and the JLEG board on perfboard. Measure them.
3. Measure the pack and the harness.
4. Update `parameters.json` to R06 and run `build.py` and `validate.py`.
5. Print the walls first and check the leg-drive holes against the frames and the hubs.
6. Print the cassettes, the JLEG mount and the tray. Move the boards over.
7. Record the R06 fit in a dated record and update the assembly guide.
