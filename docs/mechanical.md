# V1-PROOF mechanical plan

**2026-10-16 status:** R05 is the current build. In the [R05 two-leg body](../cad/prints/two-leg-body-r05/README.md), the hips are 30 mm rearward of the body centre, and the struts slant forward to the wheels. The ST3215 servos and the battery are inside the body. Follow the [R05 assembly guide](r05-assembly.md).

The user reports that the frame is assembled, with the two walls, the three decks and the battery tray. No R05 dimension is measured. The 3:1 servo drive to the hips is not designed.

R05 keeps the 110 mm struts, the 40 mm hip spacing, the 30° neutral lock and the JD-03 carrier. The R05 leg range is 15–40°. The [earlier revisions](#earlier-revisions) are at the end of this document.

Active: a **2.5 kg target / 3.0 kg maximum**, four-actuator robot on two approximately 100 mm rubber wheels. The [old stair mechanism](archive/stair-v1/mechanical.md) is parked. [Envelope sketch](../cad/layouts/v1-proof.svg) · [formulas and mass budget](v1-proof-sizing.md).

Use a simple bolted chassis and suitable scrap/COTS stock. Aluminum flat bar, plywood body plates and tube on hand are permitted. There is no requirement for carbon, a molded shell, a large head, an in-wheel hub or an elaborate battery cassette. Keep the pack and the electronics removable. Include rest skids and a catch fixture.

## Wheel and leg arrangement

One selected Pololu 4752 gearmotor with encoder at each wheel carrier. Use proper hubs, supported axles and a bearing path for the robot weight. An unqualified motor shaft is not automatically a structural axle. Inboard motors are permitted. The [wheel drive mount](#wheel-drive-mount) proposal below asks for an explicit exception to the supported-axle rule.

Do a check of the complete motor length and the wire-harness sweep before you fix the track. The proposed track is 230 mm and the wheel width is 25 mm. This gives 255 mm across the tires.

Each leg has two 110 mm parallel links. The body pivots and the wheel-carrier pivots have the same 40 mm vertical separation. This makes a planar parallelogram. One leg servo drives one body pivot through a 3:1 belt reduction. The other pivots are passive and have bearings.

In R05, the hips are near the rear of the body. Each strut slants forward and down from its hip to the wheel carrier. The R05 range is 15–40° from the downward vertical, with 30° at neutral.

Use independent bearings on the driven shaft, hard stops and removable lock pins. This is one powered leg coordinate per side, not independently commanded hip/knee joints.

The original upright layout gives 278–306 mm overall height with a 150 mm body allocation above the lower pivot. The R05 CAD is approximately 320–348 mm high, because the three-deck body is taller. Accept this height or remove one deck.

The nominal vertical travel is 28.5 mm, but the axle also moves 49.3 mm fore/aft. The balance control must allow for the real pose-dependent CoM/pitch trim. Do not describe this as pure vertical suspension or a finished CAD mechanism. Keep both leg commands synchronized at first. To unload one wheel independently is outside the scope.

## Wheel drive mount

**JD-03, design proposal R02, recorded 2026-10-04.** The [wheel drive mount sheet](../tools/living-drawings/wheel-mount.html) gives the geometry between the Pololu 4752 gearmotor, the carrier and the Ø100 wheel. The dimensions come from the Pololu 37D drawing, the Pololu STEP model and the Pololu 2674 adapter drawing. No measurement of the received motor exists yet.

Three facts fix the arrangement. The 37D output shaft is 7.0 mm off the axis of the motor body. The six M3 holes sit on Ø31 around that body axis. The shaft is 16 mm long with a 12 mm flat, so the wheel must sit next to the carrier plate. The lower link ends on the R01 kinematic axle, so the real axle cannot stay there.

The proposal moves the axle 25 mm rearward of the lower carrier pivot. The parallelogram keeps every carrier point on the same arc, so the leg travel and the body height do not change. The wheel contact moves 25 mm rearward. The balance line and the CoM trim move with it.

The carrier R02 goes outboard of both links, at 25–31 mm in the R01 lateral convention. The R01 link planes stay at 8–13 mm and 18–23 mm. Each pivot bolt is then in double shear between the body plate and the carrier. The gearbox face sits on the inboard face of the carrier. The motor body passes the link planes with 5.6 mm between the gearbox and the lower link end at every angle.

The wheel is a Pololu 3278 scooter wheel, 100 × 24 mm, on a Pololu 2674 adapter with two M4 set screws on the flat. The wheel midplane is 22.5 mm from the gearbox face. The floor clears the motor body by 31.6 mm. At a 230 mm track the two motors point at each other with 29.8 mm between the lead ends.

**This proposal differs from the rule above about supported axles.** The wheel load goes through the motor shaft and the gearbox bushing. The 16 mm shaft leaves no room for an outboard bearing. Pololu publishes no radial load rating. The static shaft moment is 0.40 N·m at 3.0 kg.

Record the shaft play before and after each trial. If the play grows, add an outboard support in the next revision. The user must accept or reject this change explicitly.

Measure the received motor against the [1:1 carrier template](../cad/layouts/wheel-mount-r02.svg) at the fit session. Then print the R02 carrier. The simulation still uses the R01 axle position. Update the model when the R02 carrier is printed and measured.

## Size the load honestly

Use the full mass for the conservative sprung-load screen and a 60/40 two-wheel load split. The proposed 3:1 reduction gives approximately 0.54 N·m worst static servo demand at 3 kg. This is before horizontal forces, acceleration and measured losses. The leg servo must pass a mounted 0.75 N·m hold qualification for 10 minutes and a separate 1.0 N·m transient test. A quoted stall torque is insufficient.

We use no spring credit. Springs are unnecessary for the pinned-leg first milestone.

Measure the mass, the whole-robot CoM, the gear backlash, the tire traction and the pitch trim across the leg range. Reduce the travel, the speed or the mass before you add hardware. A Pi, a larger battery or a heavy shell must fit the same mass budget. There is no payload requirement.

## Fabrication sequence

The user can use the [single-leg bench plan](one-leg-bench.md) and the [1:1 paper template](../cad/layouts/one-leg-bench-template.svg) before these full-robot stages. A clamp holds the body, and a support holds the mechanism when the torque disappears. Detail the lateral link separation. At 15°, the link centerlines are only 10.35 mm apart perpendicular to their length. Thus ordinary coplanar flat bars can collide.

The upper carrier pivot also lies inside the projected radius of the wheel and needs lateral clearance. The current envelope sketch does not resolve either interference.

1. Mock up the body, wheels, full gearmotor envelopes, battery, pivots and wire harness in 2D/scrap.
2. Build the pinned neutral stance (30° link angle) and qualify two-wheel balance.
3. Detail one reduced-servo leg with belt engagement, bearings, stops and cable sweep. Do a load test of it in a fixture.
4. Fit both powered legs and qualify small, slow synchronized height changes.

The sketch does not validate bolts, bearing fits, swept clearance or structure. The detailed dimensions come from the measured available parts. [Build checklist](checklists/mechanical-v1.md).

## Bounded disturbance envelope

The [pinned-leg 3D study](v1-proof-simulation.md) exercises the 230 mm track against longitudinal/lateral pushes and shallow uneven fixtures. Lateral recovery comes from the track width and passive ground contact. There is no roll axis and no active one-wheel recovery. Keep the travel pinned at 30° until the [physical protocol](v1-proof-validation.md) passes. Fixed 15°/45° simulated corners do not validate servo motion, belt compliance or real load distribution. Measured CoM/inertia and tire friction must replace the assumed values before the terrain or the payload increases.

Provide adjustable mounts for the battery/electronics and measure the sprung fore/aft CoM at pinned neutral. Target **within ±2 mm of the nominal balance line** before grade qualification. A near −4 mm offset failed the strict grade-settling gate. Recheck the trim at each fixed height. The full uncertainty matrix keeps its wider ±4 mm corners and their failures.

## Earlier revisions

R05 replaces these revisions. The dated records stay for the history.

- **2026-10-13, R04:** the user reports that the walls and horizontal layers do not fit together. The [dated evaluation](checklists/2026-10-13-r04-fit-review.md) records the report and CAD findings. The [R04 matched body](../cad/prints/one-leg-body-r04/README.md) corrected the fit, but its hips were on the centre line.
- **2026-10-07, R03:** the user confirms that all R03 parts are printed. The [fit and assembly checklist](checklists/2026-10-07-r03-assembly.md) records that stage. R03 put the motor carrier outboard of both links.
- **2026-10-06, R03:** the user reports satisfactory leg travel and requests a body with one leg. The [R03 body kit](../cad/prints/one-leg-body-r03/README.md) supplied the next supported assembly, printable parts and engineering sheets. The [dated observation](checklists/2026-10-06-leg-motion.md) preserves the report. Exact travel measurements and powered qualification remain open.

R03 kept the 110 mm links and 40 mm pivots. It added a removable 30 degree lock, two equipment decks and a motor carrier.
