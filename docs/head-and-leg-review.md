> **PARKED STAIR-V1 — 2026-09-28.** This is historical research, not an active requirement, BOM or build gate. [V1-PROOF](v1-proof.md) governs current work.

# Head and leg engineering review — 2026-09-28

**Disposition:** retain the one-step objective, reopen the leg architecture, and do not buy the actuator set yet. The old robot has no demonstrated controlled single-support phase and no feasible full spatial stair trajectory. A 0.2-second floor hop does not prove either. Today the user told us to fix the legs to justify the actuator cost, or to explicitly drop stairs. This review does **not** silently drop stairs.

**The user purchased no Hux components.** Earlier “already bought,” “ordered,” and “on order” claims are superseded. Vendor geometry is a design reference, not inventory.

The preferred *research direction* is a finite-width wheel support with active ankle roll and also hip roll. It gives the missing lateral ground moment. It is **not yet a buildable, validated replacement**. The compact version still fails reach.

The first promising screened candidate uses 9.5-inch links and an approximately 26-inch full height. It uses a narrow 120 mm wheel-center track during the step. Its connected poses and 810 interpolated samples pass the limited reach/clearance/width checks. Its real ankle linkage, full collisions and timed dynamic behavior remain unvalidated. A purchase of larger motors alone does not fix either problem.

## What is firm, and what is a candidate

| Status | Decision / finding | Consequence |
| --- | --- | --- |
| User direction | Fix support and stair geometry before committing to expensive actuators | Stair capability remains the target; old motor lock is now a reference set |
| Firm engineering correction | Battery position is not head CoM; use every component's mass and position | Remove the assumed +1-inch head CoM as a packaging requirement |
| Firm engineering correction | A stationary hold is not the catalog rotating torque rating | Use stationary thermal data and the actual mounting fixture before accepting a joint |
| Firm engineering correction | A free swivel at a broad wheel foot cannot transmit the required roll moment | The foot must have a controlled or positively locked roll load path |
| Firm interface baseline | SI, X forward / Y left / Z up, hip-center origin; record transforms and revisions | CAD, dynamics and firmware must use the same physical joint centers |
| Candidate | 203.2 mm depth, 120 mm middle bay and 177.8 mm top cap; top +100 mm, forward cassette 242 mm wide, bottom −45 mm | Saves 52.4 mm above the hips; enables longer legs without automatically making the robot taller |
| Candidate | Hip roll + hip pitch + knee + ankle roll + wheel on each leg | Ten powered axes, plus an unresolved mechanism keeping ankle-roll axes correctly oriented |
| Not accepted | “Ten actuators fixes stairs,” “all static poses fit therefore the gait works,” or “the renderer clears it” | See the failed screens below and the release gates |

## Findings that change the design

1. **The earlier work conflated two independent failures.** Lateral balance on one crowned tire is underactuated. The current stair path also misses spatial targets. A successful balance controller cannot lengthen a leg. The current regression suite deliberately asserts that its stair candidate is rejected.
2. **The old universal impossibility claim was too strong.** The acrobot study and the failed controller show a very poor tested capture region. They do not prove that every controller or every wheeled biped must fail. The prose of the study also drifts from the code: the head CoM of the current frontal model is **68.6 mm above the hips**, not zero. A raised head to cure this adds inertia and still does not give a lateral ground moment.
3. **There is no honest thermal margin for the former 6.3 N·m RS02 hold.** The September vendor sheet gives two values. It gives 7 N·m in rotation with a 150 × 150 mm aluminum heat sink. It gives 6 N·m as the stationary reference. The July manual instead rates 6 N·m in rotation with a 260 × 280 mm plate. Neither qualifies a small enclosed robot mount. We withdraw the old “6.4 after spring < 7, therefore passes” claim.
4. **The battery could not produce the asserted head balance.** That claim used a 4.35 kg head and a 0.7 kg pack. A pack movement of 25.4 mm forward moves the head CoM only **4.09 mm**, not 25.4 mm. The old pack placement leaves only 1.2 mm to the front of an 8-inch body. That is before shell, padding and connector allowance.
5. **The hip band was a zero-clearance envelope.** 2 × 76.2 + 78.5 = **230.9 mm** is the motor envelope, not a finished shell. A 242 mm guarded cassette has 5.55 mm per outer face: 2.5 mm wall plus 3.05 mm assembly clearance. Cable exits, bolts, brackets and yokes that move still need their own space.
6. **The simulation does not represent the drawn yoke.** The legacy spatial FK puts the knee plane at the roll axis. It puts the entire lateral offset at the axle. The sheet puts the offset at 120.65 mm, 44.45 mm outboard of the 76.2 mm roll axis. The new screen includes separate yoke and axle offsets. Its knee locations and load moments therefore differ. Do not update only a drawing and then claim a digital twin.
7. **CAN was oversubscribed.** Four nodes at 1 kHz send one extended-frame command and reply each. They need up to **128%** of a 1 Mbit/s bus before diagnostic traffic. FD capability on an MCU does not make a classic-CAN actuator speak FD.

## Head arrangement: engineering candidate H1

The “head” remains the primary body/compute/battery assembly, not an additional neck joint. The dimensions below are in mm relative to the midpoint of the hip roll axes. X is forward, Y is left and Z is up.

The middle enclosure is **X ±101.6, Y ±60, Z 48…100**. The wider top cap is **X ±101.6, Y ±88.9, Z 80…100**. The central lower bay is **X ±101.6, Y ±34, Z −44…48**. The motor cassette is **X 32…89, Y ±121, Z ±45**. Keep the rear sweep of the rear-folding upper links open. The cassette is forward, and the roll outputs point rearward toward the pitch-pivot plane at X = 0.

| Package allocation | Center X, Y, Z | Reserved size X × Y × Z | Purpose / status |
| --- | --- | --- | --- |
| Pack | 8, 0, −8 | Actual class 150 × 50 × 60; reservation 162 × 60 × 66 | 0.70 kg assumption. Forward removable tray; actual SKU must fit, including leads |
| Companion and cooling | −40, 0, 73 | 115 × 105 × 44 | Pi 5 initially; prospective Orin carrier/cooling envelope. Exact plugs/airflow unverified |
| MCU, IMU, transceivers | 50.5, 0, 63 | 60 × 90 × 22 | Teensy board oriented across Y; rigid IMU mounting, rear/side connector access |
| Power distribution | −64, 0, 38 | 58 × 56 × 18 | Class reservation only; a selected converter may require resizing |
| Pack connector/service | 53, 0, 39 | 50 × 28 × 20 | Above the pack; removable front cover. Harness bend test required |
| Face/camera | 91, 0, 75 | 12 × 110 × 40 | Shared front allocation; exact lens, board and face treatment still to select |
| Roll motors | 60.5, ±76.2, 0 | RS02 45.5 × 78.5 × 78.5, fore-aft shaft | Reference envelopes; a different motor or reduction reopens this cassette |

The six package reservations do not overlap in the model and fit inside the wall allowance. The narrow lower bay is open into the upper bay. No unmodeled solid partition crosses the power/service space. This is a **nominal box fit**, not cable, fastener, service or thermal signoff.

The motor-to-motor gap is 73.9 mm. The 60 mm pack reservation leaves **6.95 mm per side**. The pack trim is limited to center X **−10…15 mm**. The entire adjustment changes the nominal head CoM by only **7.74 mm**. Do not add ballast to make a rejected trajectory work.

**Revision B corrects a real interference.** The aft motor/cassette placement intersected the rear-folding upper links. An unrelieved 177.8 mm-wide middle bay also intersected the rolled hip-pitch housing envelope. A move of the roll-motor centers to X = +60.5 mm and a narrower middle bay fix those modeled interferences. Revision B keeps the wide cap above Z = 80 mm.

The RS00 housing reaches X = ±28.5 mm. That leaves 3.5 mm to the cassette rear face. The roll-motor clearance to the inner cassette is 3.05 mm laterally and 3.25 mm axially/vertically. Couplers, shaft support, ports and attachment fasteners still need actual CAD.

The structural load path is roll-motor mount → aluminum cross-frame/heat spreaders → opposite mount and head attachment. Printed covers carry electronics and exclude debris. They do not carry the hip torque. A 17 N·m reaction across a 50 mm bolt-row separation is a **340 N force couple** before dynamic factors. This is not a bolt, bearing, plate or fatigue qualification. We must examine the housing temperature, the clamp contact, the fastener preload and the insert pullout in the real assembly.

Use removable front battery access and a separate rear/top companion lid. Attach the IMU to the structural frame and record its transform. Isolate the battery protection/retention from hot converters and motors.

Size the active ventilation from the dissipation, not from the fan diameter. The ideal airflow for 20 W with a 15 K rise is approximately **1.1 L/s (2.3 CFM)**. This uses an air density of 1.2 kg/m³ and a heat capacity of 1005 J/(kg·K). The actual fan flow must be more than this after restrictions and recirculation. Motor heat is additional and must flow into the structure, not into the pack.

### Mass, balance and inertia

`tools/engineering/baseline.json` contains the itemized head budget and dimensions. All head masses are **estimates**. This includes a separate 0.30 kg contingency. Roll/swing/knee/wheel actuators are outside the head budget and counted once in the articulated model.

- Nominal head: **2.26 kg**, CoM **(+6.19, 0, +20.78) mm**. The high case adds 0.60 kg at Z = 50 mm.
- Nominal ten-axis robot: **7.02 kg**. High case: **7.62 kg**. This is not a weighed replacement for the old 7.75/7.87 kg scenario.
- Nominal head body-frame diagonal terms: **Ixx 0.00643, Iyy 0.00882, Izz 0.00957 kg·m²** (read the exact tensor in the generated JSON). The off-diagonal Ixz term is retained. These are box approximations, not CAD inertias.
- Equations: `M = Σm`, `c = Σ(m r)/M`, `I = Σ[I_local + m((d·d)1 − d dᵀ)]`, with the dimensions converted to meters for the inertia.

The head has a useful height budget: `2L + R + headAboveHip`. At L = 215.9, R = 76.2 and headAboveHip = 100 mm, full extension is **608 mm / 23.94 inches**. This does **not** prove usable stair reach. Full extension is singular, and the joint stops reduce it.

## Fixing single support: what the mechanisms actually provide

| Arrangement | Lateral ground moment | Cost / geometry consequence | Disposition |
| --- | --- | --- | --- |
| Existing 8 axes, crowned skinny tire, hip roll only | Negligible reliable finite support width | Already fails the tested hold and stair geometry | Retire as a stair purchase baseline |
| Move the two hip roll motors to ankles, remove hip roll | A broad foot could provide moment, but removes the independent lateral motion needed in double support | Not a drop-in eight-axis repair; requires another articulation, linkage or locks | Reject the simple swap |
| Keep hip roll; add ankle roll and two separated tire contacts per foot | Yes, if both contacts remain loaded and the ankle transmits torque | Ten powered axes; nominal 80 mm wheel-foot envelope; a pitch-level carrier is required | Preferred mechanism to investigate, not a released design |
| Deployable nonrolling landing shoes with leveling and positive locks | Yes, if locks carry the load and both pitch and roll support are real | May reuse eight main motors but adds deployment, locks, sensors, joints and a new gait | Worth a separate mechanical trade; a loose swivel or printed skid is not enough |
| Flat-floor-only robot | No single-support stair requirement | Least expensive and quickest build | Only if the user explicitly drops stairs |

**Important ankle geometry:** a roll motor bolted to a pitched shin does not make a world fore-aft roll axis. `Rx(hipRoll) Ry(shinPitch) Rx(ankleRoll)` does not generally cancel camber without the introduction of wheel yaw. The ten-axis screen assumes a **passive pitch-level carrier**, such as a correctly designed parallel linkage, so that the ankle axis remains fore-aft. The pivots, link interference, stiffness and force transmission of the carrier are still open.

An additional powered ankle-pitch axis is an alternative with a larger BOM. No invisible joint is permitted in CAD or simulation.

For an 80 mm wheel-foot assembly, provisionally allocate the contact centers at approximately ±30 mm. Two 31.75 mm tires 60 mm apart are actually **91.75 mm wide**. Thus a doubled old 6×1.25 tire does not fit inside this 80 mm allocation.

Either find narrower tread sections with measured contact separation, or run the study again at the real wider envelope. If paired treads share one rigid drive shaft, a turn demands unequal contact speeds. Quantify the scrub, the yaw torque and the traction loss that result. The 80 mm package is a **design allocation, not a sourced wheel**.

For nominal mass 7.02 kg and effective half support width b = 30 mm:

`|yCoM − yContact − h aY/g| < b` is the simplified lateral center-of-pressure condition, with a zero angular-momentum-rate assumption. A 10 mm CoM error costs **0.689 N·m** at the ankle. The full edge moment is **2.066 N·m**. After a 10 mm estimation error and a 10 mm reserved margin, only 10 mm remains for acceleration. That is approximately **0.245 m/s²** at h = 0.4 m.

This leaves only slow lateral motion in that simplified model. We must measure the real tire compliance, camber, friction, yaw moment and tread load distribution. A free ankle joint discards this benefit.

## Full step screening results

Run `python3 tools/engineering/review.py --write`. The generated [results](research/head-leg-results.json) contain all 91 sampled poses for the compact and 27-inch comparisons and the preferred narrow-entry 26-inch candidate. They also contain the joint angles, the COM residuals, the gravity torques and the clearance flags.

The path explicitly includes these steps: the first foot unloads, lifts vertically, advances over the riser and lands. Then the robot transfers all weight to that foot. The second foot lifts, advances and lands. Then the robot centers. Both wheels must end on the upper tread.

The solver sums the head, fixed roll motors, movable hip/yokes, knees, tubes, carrier allowance and wheel/ankle masses. It solves body X/Y from the whole-robot COM and searches the body height. It enforces split yoke/axle offsets and joint-angle limits. Static joint torque comes from the moments of the contact forces and the downstream weights (`JᵀF`), with no spring assistance credit.

| Screen | Kinematic/COM failures | Envelope-flagged samples | Peak gravity roll / pitch / knee | Result |
| --- | ---: | ---: | --- | --- |
| 8.5-inch links / wide entry | 14 / 91 | 2 | 9.29 / 3.11 / 6.43 N·m | Rejected |
| 8.5-inch links / narrow entry + width gate | 3 / 91 | 17 | 6.63 / 3.72 / 6.50 N·m | Rejected: reach and envelopes |
| 9-inch links / narrow entry + width gate | 0 / 91 | 1 | 6.61 / 3.82 / 6.51 N·m | Knee-envelope/riser flag at transfer |
| 9.5-inch links / wide entry | 0 / 91 | 1 | 8.91 / 3.61 / 7.61 N·m | No connected clear path |
| 10-inch links / wide entry | 0 / 91 | 0 | 9.03 / 3.71 / 8.87 N·m | Connects, but exceeds width target |
| **9.5-inch links / narrow entry + width gate** | 0 / 91 | 0 | 6.61 / 3.92 / 7.89 N·m | **Preferred research candidate; no release** |
| Preferred candidate, head +0.60 kg | 0 / 91 | 0 | 7.02 / 3.84 / 8.95 N·m | Connects; loads worsen |
| 10-inch links / narrow entry + width gate | 0 / 91 | 0 | 6.61 / 4.02 / 8.38 N·m | Connects; taller alternative |

**With revision B, the 26-inch narrow-entry case becomes the preferred candidate.** Its links are 241.3 mm. They give a theoretical full height of **658.8 mm / 25.94 inches**. The 228.6 mm-link (24.94-inch) comparison still has a conservative knee-envelope/riser intersection at frame 50, during full load transfer. The 215.9 mm-link (23.94-inch) narrow case fails three reach/joint/COM samples and flags 17 envelope samples. These failures are for this path family, not a proof of a universal minimum robot height.

A layered search connects reachable, clearance-screened poses. It limits the adjacent body displacement to 60 mm and minimizes the total squared displacement with a small torque cost. This is a geometric connection heuristic, not a velocity limit or a dynamics solver. The wide-entry 9.5-inch-link comparison cannot connect. Its independently optimized heights jump by as much as 135 mm.

**Wheel track is not moving-body width.** A start with 275.6 mm between wheel centers produces a large sideways head excursion. With the rolled hip-pitch housings included, the wide-entry 27-inch comparison reaches a **547.1 mm / 21.54 inches** modeled span. It does not meet the approximately 14-inch width target despite clear sampled reach.

**Start narrow, not only land narrow.** The preferred study starts and ends in the same stance. That stance has axle Y = ±60 mm, a 120 mm track and 200 mm outside tread width. The fixed yoke/axle offsets are unchanged. The legs roll inward for that stance.

A **355.6 mm maximum modeled span** limit gives a connected 26-inch path with a peak span of **355.44 mm**. That is only a **0.16 mm nominal allowance**. This is not a robust manufacturing or obstacle-clearance guarantee. Full CAD, tolerances, tire compliance and tracking error can make it larger. The allowed envelope still needs real margin. The 27-inch narrow alternative also connects but increases the height and the knee demand.

Between the 91 frames of the preferred candidate, **810 linearly interpolated poses** have no IK, limited clearance or width failures. The maximum modeled COM residual is **0.17 mm**, and the largest frame-to-frame height increment is **6.0 mm**. The maximum sampled hip/ankle roll is 52.97°, the hip pitch 102.77°, and the knee flexion 138.01°.

The +0.60 kg case also connects. It has a 0.16 mm maximum COM residual, a 355.46 mm peak span and a 4.13 mm maximum height increment. Residuals measure numerical consistency, not achievable hardware accuracy. The path is not a smooth timed gait, a continuous-solid collision proof, or a global optimum.

The taller studies explicitly relax the 24-inch height envelope. The first axle lands 90 mm beyond the riser. This leaves **13.8 mm** between the rear tangent of the wheel and the entry nosing. It leaves 75.1 mm to the far edge of a 241.3 mm tread.

The collision model checks one isolated riser. These remain unmodeled: a next riser, a real nosing profile, downhill control, the transition from the normal rolling stance into the narrow stance, and repeated flights. This is not proof of R3/R37.

The limited clearance check uses conservative wheel cylinders against head boxes and a 60 mm knee bounding sphere against the riser. It also uses continuous 8 mm-radius tube/axle-offset capsules against head boxes and the riser. It also uses knee spheres against head boxes, conservative rolled hip-pitch housing bounds, and wheel-to-wheel spacing. The check minimizes the segment-to-box distance exactly along each straight segment. The poses are still sampled in time.

The screen omits many inter-leg self-collisions, bolts, bearings, flange details, harnesses, the real ankle carrier and springs. A flagged conservative envelope needs detailed solids, not dismissal. A clear screen does not certify those omitted parts.

**Torque result:** the narrow entry is a useful geometric improvement, but it does not qualify the reference motor set:

| Axis | Preferred candidate gravity peak | +0.60 kg head | Reference stationary torque | Disposition |
| --- | ---: | ---: | ---: | --- |
| Hip roll | 6.61 N·m | 7.02 N·m | RS02 6 N·m | Reduction, geometry or different actuator required before dynamic margin |
| Hip pitch | 3.92 N·m | 3.84 N·m | RS00 3.6 N·m | Reopen selection/leverage; heavier mass does not worsen every joint monotonically |
| Knee | 7.89 N·m | 8.95 N·m | RS02 6 N·m | Revised spring/reduction/actuator and full-cycle duty required |

All reference ratings depend on vendor thermal fixtures, not on the proposed small mounts. A hypothetical 1.5:1, 90%-efficient roll reduction maps 6.61 N·m to **4.90 N·m** at the motor. But it also changes speed, backdrivability, reflected inertia, backlash and packaging. It is not a selected transmission or a demonstrated dynamic/thermal margin.

A larger RS06 changes mass, geometry and heat rejection. Its 8 N·m stationary reference alone is not a qualification. Do not buy a full set from rotation or peak labels.

We must redesign the springs after the motion and mass model. The old 3 kN/m / 271 N / 86 mm travel knee spring is not a catalog selection. It can be too long to package on the link, and it loads the free leg in the opposite direction. Do not count its torque as always beneficial. Tube cut length is not joint-center length. Revise the sockets, the fitting reaches, the pin-hole weakening and the bond coupons for each new link candidate.


### First-order structure and energy checks

For the historical **16 × 14 mm carbon tube** and a 254 mm joint-center reference length, `A = π(Do² − Di²)/4 = 47.12 mm²` and `I = π(Do⁴ − Di⁴)/64 = 1331 mm⁴`. The entire 7.02 kg weight as a transverse cantilever end load is **68.87 N**. This load gives a **17.49 N·m root moment, 105 MPa bending stress and 2.83 mm tip deflection**. The assumption is a homogeneous axial modulus of 100 GPa. Twice that illustrative load doubles the stress and the deflection. Ideal pin-ended Euler buckling is approximately 20.4 kN, so that idealized number is not the likely limit case.

These are sanity checks, not laminate or assembly allowables. Real loads run through motors, offsets, sockets, holes, bearings and bonded joints. Ply direction, local crushing, torsional stiffness, impact and fatigue can dominate. The link center distance is not the unsupported tube length. This screen claims no factor of safety without supplier laminate data and joint coupons. The source records this calculation under `tube_reference_screen` with `release: false`.

A rise of the same 7.02 kg posture by 241.3 mm needs only **16.6 J** of gravitational potential energy. Actual gait work includes posture changes, losses and recovery. At a 20° slope, the steady wheel torque is approximately **0.90 N·m each** before rolling resistance or acceleration. The minimum ideal traction coefficient is `tan(20°) ≈ 0.364`. Those gravity-only numbers do not establish the RS05 thermal/speed reserve or the real tire traction.

## Component disposition and electrical consequences

- **8S retained for now.** The July RS00/RS02 manuals and the live vendor README say 24–60 V. The September PDF says 15–60 V. Treat 24 V as the conservative revision floor until you identify the proposed hardware/firmware revision. Do not claim that 6S is universally impossible, and do not switch to it from a conflicting table.
- **Regulators:** use a **60-V-input-rated class** and verify the transients/clamping. A 36 V label leaves only 2.4 V above a full 8S pack. Anti-spark is not a regenerative-energy absorber. Verify the battery acceptance of regen, the bus clamp/discharge path and the controller brownout behavior when motor power is cut. Fuse size and wire gauge come from measured current and fault clearing, not from pack C-rating alone.
- **Runtime:** 97.68 Wh nominal. With an explicit 80% usable energy and 90% distribution efficiency, 70.33 Wh reaches the loads: **1.76 / 0.88 / 0.59 h at 40 / 80 / 120 W**. The old “1–2 h” was an unmeasured optimistic band. No-load phase current is not battery current. Do not sum it as a DC power estimate.
- **Teensy 4.1 remains suitable as a candidate.** It has three CAN controllers, **only one FD-capable**, and all need transceivers. Candidate ten-node schedule: A two wheels at 1 kHz, B four hip/ankle roll nodes at 400 Hz, C four pitch/knee nodes at 400 Hz. With 160 bits/frame, command+reply, and 10% bus allowance: **74%, 61.2%, 61.2%**. The estimator can run at 1 kHz. It must consume timestamped slower joint samples. Verify the actual arbitration, reply policy, error frames and deadlines on the bench.
- **RS05 wheel remains a bench candidate.** Use independent bearings for radial/axial/shock loads until the actuator output bearing ratings are documented. The published equivalent output inertia is 0.0007 kg·m². That is approximately **0.121 kg equivalent translational mass per wheel** at 76.2 mm radius. The old simulator omits this. Do tests of continuous rotation, wraparound, speed/torque at battery minimum and regen before you commit.
- **Compute and cameras:** one V1 companion slot and one camera at the start. Reserve space for a later Jetson, but do not buy seven cameras or a Jetson for the balance problem. A container does not make camera drivers or hardware acceleration portable automatically.
- **BOM:** [bom.md](bom.md) now includes bearings, wiring, thermal structure, regulators and charger. We do not assume that any item is free “shop stock”. The reference ten-actuator allowance is $1,440 at the old point prices, versus $1,120 for eight. The full candidate range is **$2,236–3,498 before tax/shipping**. It is not a purchase quote and not a released purchase list.

## Release gates and cascade

1. **Architecture gate:** select a mechanism that produces lateral ground moment. Draw its real joints and load path. Decide if approximately 26 inches is permitted, with a real margin on the moving width. Keep the 24-inch constraint active for H1 until it is explicitly replaced. Do not count a passive swivel as an ankle actuator.
2. **Geometry gate:** extend the narrow-entry 26-inch connected static path to a smooth timed trajectory with the real mechanism. Cover the entire 9.5 × 9.5-inch step and both directions of support, with lower-leg reach during weight transfer. Examine the swept head, housings, yokes, tubes, treads, connector bends and spring travel. No clamped IK targets or instantaneous height changes are permitted.
3. **Support bench gate:** a restrained/overhead-caught rig, with measured COM and tire footprint. Hold controlled one-leg support for **10 seconds**, with ±10 mm COM uncertainty and a defined small disturbance. Then do a controlled return. Repeat on both legs. This is a proposed acceptance test, not evidence that it already passes.
4. **Load gate:** measured motor torque/speed/duty, RMS current and temperature with the actual frame/cooling. Also measure the bearing reactions and retention, and the peak acceleration and missed-plant cases. Do a test of one representative axis before the rest. Do not infer repeatable duty from one cold overload run.
5. **Integration gate:** fresh joint timestamps, calibrated encoder signs/zeros, IMU transform, contact/load estimator, watchdog, controlled abort and supported parking. A hardware kill removes torque and therefore needs a physical catch/support during tests.
6. **Success gate:** demonstrate 9 of 10 full steps from a standstill after the gates above. No partial hop or forward simulation animation counts.

| Source / consumer | Current action | Next required cascade |
| --- | --- | --- |
| `tools/engineering/baseline.json`, `bom.json` | Candidate dimensions, masses, electrical schedule and procurement assumptions are explicit | Revise one source, regenerate report and drawing |
| `review.py`, `test_review.py` | Reproducible mass/inertia, split-offset IK, loads, moving envelope and negative gates | Add actual ankle mechanism, full solid collisions, trajectory timing and inverse dynamics |
| `docs/decisions.md`, requirements, mechanical, BOM, inventory | Current intent and purchase status corrected | Mark candidate accepted only when the corresponding gate passes |
| `actuators.js`, `spec.js`, legacy pages | Vendor caveats and rejected-baseline status made explicit | Replace legacy body lump, geometry and motors together after architecture selection |
| CAD | H1 dimensioned layout in `cad/layouts/head-h1.svg`; no fabrication release | Exact mounts, bearings, connectors and toleranced interfaces |
| `sim-core.js` / `spatial.js` | Remain the eight-axis legacy experiment, **not** the ten-axis candidate | New articulation/contact model, inertias, head collision solids and hardware limits |
| Portable controller / firmware | No implementation exists to claim updated | Versioned SI geometry, joint count/map, footprint/COP estimator, inverse dynamics, rate schedule |

## Evidence and reproducibility

New numerical source: [`tools/engineering/baseline.json`](../tools/engineering/baseline.json). Run `python3 tools/engineering/review.py --write` and `python3 tools/engineering/test_review.py`. Run the legacy checks with `npm test` in `tools/living-drawings`. A regression suite that passes means that the calculations keep their invariants, **not that stairs pass**. [Verification record](research/head-leg-validation.md).

We checked these manufacturer sources on 2026-09-28:

- [RobStride product information and manuals](https://github.com/RobStride/Product_Information): September 17 PDF pages 3–5 (RS00), 11–13 (RS02), 27–29 (RS05), 31–33 (RS06). July RS02 manual PDF pages 8–11. Local vendor PDFs were already present and remain untracked. The sources disagree on voltage and thermal fixtures. The conflict is kept explicitly.
- [PJRC Teensy 4.1](https://www.pjrc.com/store/teensy41.html): controller capabilities and board references.
- [Raspberry Pi 5 product information](https://www.raspberrypi.com/products/raspberry-pi-5/) and [mechanical drawing](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-mechanical-drawing.pdf): board and power interface. The 85 × 56 mm PCB is not the installed cooler/cable envelope.
- [NVIDIA Orin Nano hardware layout](https://docs.nvidia.com/jetson/orin-nano-devkit/user-guide/latest/hardware_layout.html) and [manufacturer kit dimensions](https://developer.nvidia.com/blog/develop-ai-powered-robots-smart-vision-systems-and-more-with-nvidia-jetson-orin-nano-developer-kit/): reference carrier. A future fit still needs the selected revision, cooler and connectors.

Supplier discovery through Stripe Directory returned no RobStride results. We contacted no supplier and placed no order. Prices in the budget are allowances, not verified September 28 quotes.
