# V1-PROOF mechanical plan

Active: a **2.5 kg target / 3.0 kg maximum**, four-actuator robot on two approximately 100 mm rubber wheels. The [old stair mechanism](archive/stair-v1/mechanical.md) is parked. [Envelope sketch](../cad/layouts/v1-proof.svg) · [formulas and mass budget](v1-proof-sizing.md).

Use a simple bolted chassis and suitable scrap/COTS stock. Aluminum flat bar, plywood body plates and tube on hand are permitted. There is no requirement for carbon, a molded shell, a large head, an in-wheel hub or an elaborate battery cassette. Keep the pack and the electronics removable. Include rest skids and a catch fixture.

## Wheel and leg arrangement

One selected Pololu 4752 gearmotor with encoder at each wheel carrier. Use proper hubs, supported axles and a bearing path for the robot weight. An unqualified motor shaft is not automatically a structural axle. Inboard motors are permitted.

Do a check of the complete motor length and the wire-harness sweep before you fix the track. The proposed track is 230 mm and the wheel width is 25 mm. This gives 255 mm across the tires.

Each leg has two 110 mm parallel links. The body pivots and the wheel-carrier pivots have the same 40 mm vertical separation. This makes a planar parallelogram. One leg servo drives one body pivot through a 3:1 belt reduction. The other pivots are passive and have bearings. The link angle is 15–45° rearward from the downward vertical.

Use independent bearings on the driven shaft, hard stops and removable lock pins. This is one powered leg coordinate per side, not independently commanded hip/knee joints.

The upright layout gives 278–306 mm overall height with a 150 mm body allocation above the lower pivot. The nominal vertical travel is 28.5 mm, but the axle also moves 49.3 mm fore/aft. The balance control must allow for the real pose-dependent CoM/pitch trim. Do not describe this as pure vertical suspension or a finished CAD mechanism. Keep both leg commands synchronized at first. To unload one wheel independently is outside the scope.

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
