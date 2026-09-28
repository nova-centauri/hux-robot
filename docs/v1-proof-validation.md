# V1-PROOF mobility acceptance protocol

These are **physical tests to perform**, not completed results. The [simulation report](v1-proof-simulation.md) records synthetic evidence separately. All physical boxes remain open. The user's requested reliability becomes repeatable, logged trials at final measured mass; no statistical real-world reliability is inferred from simulated seeds.

## Conditions and records

Use a catch frame or slack overhead catch, clear runoff, an accessible hard kill and pinned 30° legs. Successful runs have no catch/skid contact, no human assistance and no reset. Measure paths and angles with floor marks and a calibrated external camera; encoders alone cannot certify slip-free distance. Record firmware/config hash, mass, CoM, tire condition, floor, battery loaded voltage, motor/driver temperature and timestamped control logs.

Test on two representative dry indoor floors, at nominal battery voltage and again at the actual pack's approved loaded minimum. The simulation's 9.9 V input is a sizing condition, not a universal battery cutoff. Start each new condition with low-power supported tuning. Before grade trials, adjust battery/frame placement to within ±2 mm sprung fore/aft CoM offset at pinned 30° and measure actual pitch trim; the broad simulation retained a near −4 mm corner that missed its settling gate.

## Mobility

| Trial | Target and permitted error | Repeats per floor/voltage condition |
| --- | --- | --- |
| Stand | 60 s; within 0.12 m of the start, pitch within ±3° of calibrated trim after settling | 10 starts, at least 9 successful |
| Forward | 2 m at 0.25 m/s, stop and hold; endpoint error ≤0.12 m, heading error ≤5° | 10 consecutive successful runs |
| Reverse | Same, commanded −0.25 m/s | 10 consecutive |
| Left / right arc | 90° each, 0.20 m/s and 0.40 rad/s; endpoint ≤0.12 m, heading ≤5° | 10 consecutive per direction |
| Turn in place | Full 360° both ways, ≤0.60 rad/s; drift ≤0.12 m, heading ≤5° | 10 consecutive per direction |
| Combined sequence | Forward, stop, reverse, left, right, both pivots, stop | Five consecutive sequences |

Ramp travel at ≤0.35 m/s² and yaw at ≤1.2 rad/s². Commanded speed is limited to 0.25 m/s for this release; 0.5 m/s remains a later qualification target. During recovery, provision up to 0.65 m/s wheel-ground travel in the clear fixture; this is transient catch authority, not a manual cruise setting. Pitch stabilization has priority over travel/yaw. Qualify excessive-tilt, overspeed and current fault thresholds in the fixture before free trials.

After each maneuver require one uninterrupted second with speed <0.06 m/s, yaw rate <0.12 rad/s and pitch error <3°. A fall, missed path, sustained oscillation, excessive current, support contact or unplanned disable fails that run. Repeating a failed run does not erase it; retain all logs and restart the consecutive series after a documented fix.

## Pushes and shoves

Use a compliant, instrumented fixture or calibrated pendulum with a load cell; integrate the measured contact force over time. A pendulum's initial momentum alone does not establish delivered impulse because it may rebound. Apply at **0.20 m above the floor**, near the body centerline. Test both signs along and across the axle direction.

| Direction | Initial qualifying impulse | Pulse-duration targets | Pass |
| --- | --- | --- | --- |
| Forward / rearward | **0.8 N·s** | 0.20 s (~4 N average) and 0.05 s (~16 N) | Settle within 3 s; catch travel ≤0.35 m; final offset ≤0.12 m |
| Lateral, both sides | **0.4 N·s** | 0.20 s (~2 N) and 0.05 s (~8 N) | Same; no sustained contact loss or roll excursion above 10° |
| While driving forward | 0.8 N·s forward at 0.25 m/s | 0.20 s | Complete the route, ≤0.20 m endpoint error, then settle |

Begin below these impulses and increase gradually in the fixture. Complete ten consecutive repetitions per sign/duration at nominal mass, then repeat the qualifying set at final mass and low voltage. Pitch excursion from trim must remain ≤12°, modeled motor peaks ≤2.5 A and session RMS ≤1.2 A per motor, subject to stricter measured thermal limits. The higher current pulse duration must be qualified independently on the bench.

Strong human shoves are **not** a promised capability. The study includes 4 N·s fore/aft and lateral failure cases at 0.24 m height. Changing pulse duration, height, contact point or friction changes the result even at equal impulse. Off-axis twisting impulses, unpredictable collisions and recovery from one-wheel stance remain unqualified.

## Uneven indoor surfaces

At **0.15 m/s**, test straight ascent/descent of a 3° grade, traverse ±3° cross-slopes, a 5 mm smooth bump with a 300 mm transition length, the same bump under one wheel, and a 3 mm square floor seam. Ten consecutive traversals each at final mass and low voltage; same stop/path criteria (grade endpoint allowance 0.15 m), no body contact, roll ≤10°, no wheel separation lasting >80 ms. Use high-frame-rate video for the contact condition; simulated geometric contact is not a physical load measurement.

These are separate intended test fixtures; simultaneous shove + turn + bump combinations are not qualified. No loose gravel, rugs, holes, curbs, 20 mm thresholds or stairs. Powered leg leveling and moving-height disturbance recovery need a later dynamic model and physical trials.

## Duty, faults and next-version release

- [ ] Repeat the ten-minute mixed balance/drive/height session within measured temperature and electrical limits, including controlled stops and both steering directions. The current simulator has no thermal model; short runs cannot clear this gate.
- [ ] Test hard kill, stale command >250 ms, stale IMU/encoder, missed deadlines, undervoltage, reset and driver fault. Require deliberate rearm. Test power removal in the catch fixture.
- [ ] Complete ten powered low/high/low cycles over the measured qualified range; target ≥25 mm height change. This is a separate gate from pinned-leg mobility.
- [ ] Maintain total mass ≤3.0 kg and actual all-in new cash < $1,000.
- [ ] Replace simulation assumptions with measured motor, delay, inertia, friction and backlash data; rerun the complete matrix and investigate every failure.
- [ ] Archive trial CSVs/video references and failure counts with firmware/model hashes before adding V2 payload, compute, cameras or terrain requirements.
