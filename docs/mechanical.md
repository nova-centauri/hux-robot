# V1-PROOF mechanical plan

Active: a **2.5 kg target / 3.0 kg maximum**, four-actuator robot on two approximately 100 mm rubber wheels. The [old stair mechanism](archive/stair-v1/mechanical.md) is parked. [Envelope sketch](../cad/layouts/v1-proof.svg) · [formulas and mass budget](v1-proof-sizing.md).

Use a simple bolted chassis and suitable scrap/COTS stock. Aluminum flat bar, plywood body plates and existing tube are acceptable. No carbon, molded shell, large head, in-wheel hub or elaborate battery cassette requirement. Keep the pack and electronics removable and include rest skids and a catch fixture.

## Wheel and leg arrangement

One selected Pololu 4752 encoder gearmotor at each wheel carrier. Use proper hubs, supported axles and a bearing path for robot weight; an unqualified motor shaft is not automatically a structural axle. Inboard motors are allowed. Check the complete motor length and wiring sweep before fixing the track. Proposed track is 230 mm and wheel width 25 mm, giving 255 mm across the tires.

Each leg has two 110 mm parallel links. Body pivots and wheel-carrier pivots have matching 40 mm vertical separation, making a planar parallelogram. One servo drives one body pivot through a 3:1 belt reduction; the other pivots are passive and bearing-supported. Link angle is 15–45° rearward from downward vertical. Use independent bearings on the driven shaft, hard stops and removable lock pins. This is one powered leg coordinate per side, not independently commanded hip/knee joints.

The upright layout yields 278–306 mm overall height with a 150 mm body allocation above the lower pivot. Nominal vertical travel is 28.5 mm, but the axle also shifts 49.3 mm fore/aft. Balance must accommodate the real pose-dependent CoM/pitch trim. Do not describe this as pure vertical suspension or a finished CAD mechanism. Keep both leg commands synchronized initially; independent single-wheel unloading is outside scope.

## Size the load honestly

Use the full mass for the conservative sprung-load screen and a 60/40 two-wheel load split. The proposed 3:1 reduction gives about 0.54 N·m worst static servo demand at 3 kg, before horizontal forces, acceleration and measured losses. Require a mounted 0.75 N·m hold qualification for 10 minutes and a separate 1.0 N·m transient test. A quoted stall torque is insufficient. No spring credit is used; springs are unnecessary for the pinned-leg first milestone.

Measure mass, whole-robot CoM, gear backlash, tire traction and pitch trim across the leg range. Reduce travel, speed or mass before adding hardware. A Pi, larger battery or heavy shell must fit the same mass budget. No payload requirement.

## Fabrication sequence

1. Mock up the body, wheels, full gearmotor envelopes, battery, pivots and wiring in 2D/scrap.
2. Build the pinned neutral stance (30° link angle) and qualify two-wheel balance.
3. Detail one reduced-servo leg, including belt engagement, bearings, stops and cable sweep; test it under load in a fixture.
4. Fit both powered legs and qualify small, slow synchronized height changes.

The sketch does not validate bolts, bearing fits, swept clearance or structure. Detailed dimensions follow measured available parts. [Build checklist](checklists/mechanical-v1.md).

## Bounded disturbance envelope

The [pinned-leg 3D study](v1-proof-simulation.md) exercises the 230 mm track against longitudinal/lateral pushes and shallow uneven fixtures. Lateral recovery comes from track width and passive ground contact; no roll axis or active one-wheel recovery is present. Keep travel pinned at 30° until the [physical protocol](v1-proof-validation.md) passes. Fixed 15°/45° simulated corners do not validate servo motion, belt compliance or real load distribution. Measured CoM/inertia and tire friction must replace the assumed values before expanding terrain or payload.

Provide adjustable battery/electronics mounting and measure the sprung fore/aft CoM at pinned neutral. Target **within ±2 mm of the nominal balance line** before grade qualification; a near −4 mm offset failed the strict grade-settling gate. Recheck trim at each fixed height. The full uncertainty matrix retains its wider ±4 mm corners and their failures.
