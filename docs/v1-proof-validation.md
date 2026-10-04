# V1-PROOF mobility acceptance protocol

These are **physical tests to do**, not completed results. The [simulation report](v1-proof-simulation.md) records synthetic evidence separately. All physical boxes remain open. The reliability that the user requested becomes repeatable, logged trials at the final measured mass. We infer no statistical real-world reliability from simulated seeds.

## Conditions and records

Use a catch frame or a slack overhead catch, a clear runoff, an accessible hard kill and pinned 30° legs. Successful runs have no catch/skid contact, no human aid and no reset. Measure the paths and the angles with floor marks and a calibrated external camera. Encoders alone cannot certify slip-free distance. Record the firmware/config hash, mass, CoM, tire condition, floor, battery loaded voltage, motor/driver temperature and timestamped control logs.

Do the tests on two representative dry indoor floors. Do them at the nominal battery voltage and again at the approved loaded minimum of the actual pack. The 9.9 V input of the simulation is a sizing condition, not a universal battery cutoff. Start each new condition with low-power supported tuning. Before the grade trials, adjust the battery/frame placement to within ±2 mm sprung fore/aft CoM offset at pinned 30°. Then measure the actual pitch trim.

The broad simulation kept a near −4 mm corner that missed its settling gate.

## Mobility

| Trial | Target and permitted error | Repeats per floor/voltage condition |
| --- | --- | --- |
| Stand | 60 s; within 0.12 m of the start, pitch within ±3° of calibrated trim after settling | 10 starts, at least 9 successful |
| Forward | 2 m at 0.25 m/s, stop and hold; endpoint error ≤0.12 m, heading error ≤5° | 10 consecutive successful runs |
| Reverse | Same, commanded −0.25 m/s | 10 consecutive |
| Left / right arc | 90° each, 0.20 m/s and 0.40 rad/s; endpoint ≤0.12 m, heading ≤5° | 10 consecutive per direction |
| Turn in place | Full 360° both ways, ≤0.60 rad/s; drift ≤0.12 m, heading ≤5° | 10 consecutive per direction |
| Combined sequence | Forward, stop, reverse, left, right, both pivots, stop | Five consecutive sequences |

Ramp the travel at ≤0.35 m/s² and the yaw at ≤1.2 rad/s². Limit the commanded speed to 0.25 m/s for this release. 0.5 m/s remains a later qualification target. During recovery, make up to 0.65 m/s wheel-ground travel available in the clear fixture. This is transient catch authority, not a manual cruise speed. Pitch stabilization has priority over travel/yaw.

Qualify the excessive-tilt, overspeed and current fault thresholds in the fixture before the free trials.

After each maneuver, the robot must hold one uninterrupted second with speed <0.06 m/s, yaw rate <0.12 rad/s and pitch error <3°. A fall, a missed path, a sustained oscillation, excessive current, support contact or an unplanned disable fails that run. A repeat of a failed run does not erase it. Keep all the logs and restart the consecutive series after a documented fix.

## Pushes and shoves

Use a compliant, instrumented fixture or a calibrated pendulum with a load cell. Integrate the measured contact force over time. The initial momentum of a pendulum alone does not establish the delivered impulse, because the pendulum can rebound. Apply the push at **0.20 m above the floor**, near the body centerline. Do the test for both signs along and across the axle direction.

| Direction | Initial qualifying impulse | Pulse-duration targets | Pass |
| --- | --- | --- | --- |
| Forward / rearward | **0.8 N·s** | 0.20 s (~4 N average) and 0.05 s (~16 N) | Settle within 3 s; catch travel ≤0.35 m; final offset ≤0.12 m |
| Lateral, both sides | **0.4 N·s** | 0.20 s (~2 N) and 0.05 s (~8 N) | Same; no sustained contact loss or roll excursion above 10° |
| While driving forward | 0.8 N·s forward at 0.25 m/s | 0.20 s | Complete the route, ≤0.20 m endpoint error, then settle |

Start below these impulses and increase them gradually in the fixture. Complete ten consecutive repetitions per sign/duration at the nominal mass. Then repeat the qualifying set at the final mass and low voltage. The pitch excursion from trim must remain ≤12°. The modeled motor peaks must remain ≤2.5 A and the session RMS ≤1.2 A per motor, subject to stricter measured thermal limits. Qualify the higher current pulse duration independently on the bench.

Strong human shoves are **not** a promised capability. The study includes 4 N·s fore/aft and lateral failure cases at 0.24 m height. A change of pulse duration, height, contact point or friction changes the result even at equal impulse. Off-axis torsion impulses, unpredictable collisions and recovery from a one-wheel stance remain unqualified.

## Uneven indoor surfaces

At **0.15 m/s**, do a straight ascent and descent of a 3° grade and a traverse of ±3° cross-slopes. Also do a 5 mm smooth bump with a 300 mm transition length and the same bump under one wheel. Then do a 3 mm square floor seam. Do ten consecutive traversals of each fixture at the final mass and low voltage. Use the same stop/path criteria (grade endpoint allowance 0.15 m). There must be no body contact, roll ≤10°, and no wheel separation longer than 80 ms.

Use high-frame-rate video for the contact condition. Simulated geometric contact is not a physical load measurement.

These are separate intended test fixtures. Simultaneous shove + turn + bump combinations are not qualified. No loose gravel, rugs, holes, curbs, 20 mm thresholds or stairs. Powered leg level control and disturbance recovery during a height change need a later dynamic model and physical trials.

## Duty, faults and next-version release

- [ ] Repeat the ten-minute mixed balance/drive/height session within the measured temperature and electrical limits, with controlled stops and both steering directions. The current simulator has no thermal model. Short runs cannot clear this gate.
- [ ] Do tests of the hard kill, stale command >250 ms, stale IMU/encoder, missed deadlines, undervoltage, reset and driver fault. A deliberate rearm is necessary. Do a test of power removal in the catch fixture.
- [ ] Complete ten powered low/high/low cycles over the measured qualified range. Target ≥25 mm height change. This is a separate gate from pinned-leg mobility.
- [ ] Keep the total mass ≤3.0 kg and the actual all-in new cash < $1,000.
- [ ] Replace the simulation assumptions with measured motor, delay, inertia, friction and backlash data. Rerun the complete matrix and investigate every failure.
- [ ] Archive the trial CSVs/video references and the failure counts with the firmware/model hashes before you add V2 payload, compute, cameras or terrain requirements.
