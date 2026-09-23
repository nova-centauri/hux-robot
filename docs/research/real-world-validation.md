# Hux: real-world assumptions review

**Historical baseline audit.** The findings below describe the pre-correction model at the commit named here. [Implemented corrections](model-corrections.md) and [current sandbox results](sim-sandbox.md) supersede its descriptions of the live code. Running the commands now tests the corrected model; the saved baseline output remains unchanged.


Reviewed **2026-09-23**, against commit `3b239a63b7beefca391781283c992a7378c15405`. No measured robot, motor characterization, or finished CAD was available. Numbers use the repository's **6 kg example**, not a measured mass. Recommendations are research findings, not new hardware decisions.

**Verdict:** the wheeled-biped concept is credible, and the basic planar kinematics check out. **The present drawings do not establish a buildable stair gait.** The combined side/front trajectory exceeds available spatial reach; single-wheel balance remains unsuccessful in the sandbox; and the stair calculation reports loads above proposed actuator limits while passing its self-test. Resolve these before using the animation for fabrication or actuator selection.

Reproduce the review:

```sh
node tools/living-drawings/assumption-audit.js
cd tools/living-drawings
npm test
```

The audit needs only Node. The simulation test needs the pinned Rapier dependency. [Audit source](../../tools/living-drawings/assumption-audit.js), [calculated results](assumption-audit-results.json), and [baseline test output](assumption-baseline-tests.txt) are included. Audit exit status checks arithmetic consistency; `designChecks` explicitly records failing design assumptions. A successful process exit is not a robot acceptance test.

## What is supported

| Assumption | Checked result | Meaning |
| --- | --- | --- |
| 6″ wheel, two 7.5″ links, 6″ body above hip | 24″ full height; 16.8″ hip height at 92% extension | Consistent planar, upright envelope; not a spatial clearance proof |
| Wheel placement one design step ahead/up | Hip-to-raised-axle distance 10.43″, leaving 4.57″ planar reach | Endpoint reachable; transferring the body is harder |
| Forward/inverse kinematics and torque Jacobian | 20 configurations agree with independent finite-difference virtual work | Correct algebra for the modeled two-link chain |
| Knee leverage at 92% extension | 2.94″ offset; 4.39 N·m for an ideal 6 kg point load on one leg, 2.20 per knee on two legs | Useful initial sizing; distributed mass and acceleration change it |
| Whole-robot tipping moment with CoM centered as one wheel unloads | 9.53 N·m about the planted contact | Correct gravity moment; not automatically the hip actuator torque |
| Wheel speeds | 63 / 188 / 376 rpm at 0.5 / 1.5 / 3 m/s | Consistent with a 6″ rolling diameter |
| Flat-floor sandbox | Existing suite passes; 75% ride height holds with ~3.16 N·m per knee | Evidence about this idealized model, not hardware |

The Jacobian/virtual-work method is standard; see [Modern Robotics, open-chain statics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-2-statics-of-open-chains/). These numerical checks were calculated locally.

## 1. Geometry: the front and side views cannot both describe this mechanism

In [`kin.js`](../../tools/living-drawings/kin.js), `solveLegs()` solves sagittal geometry; `frontView()` independently translates the body laterally without reducing sagittal reach. At **3.289 s**, during the rear-wheel shove, the drawn left hip-to-axle separation is:

```text
fore/aft     5.718″
vertical   13.551″
lateral     7.350″
distance = sqrt(5.718² + 13.551² + 7.350²) = 16.442″
```

Even allowing the sandbox's **0.975″ lateral axle spacer** to point in any direction, the triangle inequality permits at most **7.5 + 7.5 + 0.975 = 15.975″**. The pose exceeds that generous bound by **0.467″**. The actual perpendicular spacer arrangement is more restrictive. This proves an inconsistency in the combined drawings; it does not prove that no alternative trajectory can work.

**Required correction:** solve hip roll, hip pitch, knee, body pose, and axle offset in one spatial chain. Regenerate all views from it. Recalculate reach during weight shifts, wheel lift, and unequal tread heights, including wheel camber and changing contact location.

Other geometry findings:

- The stair path folds the leading knee to **162.36°**, beyond the sandbox's **2.7 rad / 154.70°** soft stop. Harmonize joint travel, stops, cables, and collision geometry.
- The sampled trailing knee reaches **711°/s away from phase seams**, and 1,178°/s including seams. These are demands, not proven actuator speeds. Retime a smooth trajectory against simultaneous torque/speed limits.
- Avoid using exact full extension as recovery margin. Check Jacobian conditioning throughout the transfer, not just endpoint reach. [Modern Robotics, singularities](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/)
- `comReport()` labels CoM within **one wheel radius** of an axle “over a foot.” A 3″ radius is not a 3″ support patch. Use actual contact geometry and a dynamic stability metric.
- `sim-core.js` filters out robot self-collision. Knee-to-body, leg-to-leg, motor, pulley, and cable interference remain unchecked. Motor envelopes are placeholders.
- The wheel collider is a **6″ sphere**. At the 12.75″ track its total lateral collision envelope is **18.75″**, versus the intended 14″ tire envelope. Its lateral rocking radius also differs from a narrow tire. Planar rolling tests cannot validate lateral fit or one-wheel balance.

Keep 6″ as the current wheel decision. The **±1.75″** slot allowance is correct for the chosen rule that the whole circular silhouette remains between nosing planes. It is a conservative geometry allowance, not a universal support or balance limit.

**9.5″ rise × 9.5″ going is Hux's demanding design fixture, not a nominal residential stair.** Ordinary 2021 IRC stair provisions use a maximum **7¾″ riser** and minimum **10″ tread**. Actual sites and locally adopted provisions vary. Measure the intended stairs; a lower rise can also reduce under-tread clearance, so the square fixture does not bound every collision case. [ICC risers](https://codes.iccsafe.org/s/IRC2021P3/chapter-3-building-planning/IRC2021P3-Pt03-Ch03-SecR311.7.5.1), [ICC treads](https://codes.iccsafe.org/s/IRC2021P3/chapter-3-building-planning/IRC2021P3-Pt03-Ch03-SecR311.7.5.2)

## 2. CoG/CoM: align the whole mass, then calculate joint loads separately

In approximately uniform gravity, **center of gravity and center of mass coincide for this engineering analysis**. Their position relative to actual support contacts matters, along with velocity, acceleration, and angular momentum.

The 2D mass model puts CoM **16.415″ high and 0.245″ behind the axles** with hips directly above the axles. “Hip over wheel” already differs from “CoM over wheel.” The 3D model adds 120 g of tubes, reaching **6.12 kg**; neither has a verified mass inventory or measured inertia tensor.

The earlier claim that hip roll holds approximately zero torque after the sway is **incorrect**. Zero whole-body gravity moment about the contact does not mean zero internal joint torque. With the body upright, the **4 kg body alone**, hanging 5.4″ sideways from the planted hip axis, produces:

`4 × 9.81 × 5.4 × 0.0254 = 5.38 N·m`

That excludes the free leg and other supported components. Calculate the free body supported by the planted hip. The earlier sandbox's ~9 N·m full-lift result is qualitatively consistent with substantial holding load. Do not substitute the 9.53 N·m whole-robot tipping moment for the joint calculation.

`frontView()` shifts the **body center**, while the lateral calculation assigns that position to the **whole CoM**. Wheels and leg mass remain elsewhere. Calculate all transformed link masses.

**One-wheel support is unresolved.** The passing test leaves **15–18% of total weight on the nominally free wheel**; full lift falls. A 1.25″ tire has at most **±0.625″** lateral extent, with a smaller usable footprint on a rounded or cambered tire. Hip motion redistributes mass and angular momentum; it cannot create an arbitrary external restoring moment. Contact forces and momentum must be satisfied together. [MIT, legged-robot contact dynamics](https://underactuated.mit.edu/humanoids.html)

Keep the manual one-leg gate. Test a genuinely clear, unloaded free wheel for the required swing interval plus margin. The current raise/place phases alone take **1.55 s**. A momentary lift or two-contact poise does not satisfy that requirement.

**Use adjustable ballast/pack placement initially.** Moving the 4 kg body lump 1″ forward moves the 6 kg CoM only **⅔″**. It reduces the modeled transfer deficit, but unchanged shove timing overshoots for both +1″ and +2″. Optimize ascent, descent, reverse motion, roll load, and packaging together; the present model does not justify permanently fixing the pack 1–2″ forward.

## 3. Movement: recoverability depends on velocity and grip

The quoted “torque to stop a 10°/20°/30° fall” is an acceleration-scale estimate. It omits initial angular velocity, stopping distance, drivetrain response, and full coupled dynamics. It cannot establish a catch envelope. The **~6°** slot angle is likewise a position-only ratio.

A useful diagnostic is the constant-height point-mass capture point:

`x_capture = x_com + v_com / sqrt(g/h)`

At `h = 0.41694 m`, `sqrt(g/h) = 4.851 /s`. Even with CoM centered, **0.216 m/s** produces a capture-point offset equal to the entire 1.75″ allowance. A wheel must reach that location with finite acceleration, and moving legs change the model. This is a screening calculation, not a safe-speed guarantee. [Pratt et al., Capture Point](https://www.cs.cmu.edu/~cga/legs/Pratt_Goswami_Humanoids2006.pdf)

Tractive moment obeys `|F_t| R ≤ μ N R`. For a 6 kg robot with one wheel carrying the full static weight:

| Assumed μ | Available tractive moment |
| ---: | ---: |
| 0.15 | 0.67 N·m |
| 0.30 | 1.35 N·m |
| 0.50 | 2.24 N·m |
| 0.70 | 3.14 N·m |

**3 N·m of tractive moment needs μ ≈ 0.669** before reserving grip for lateral forces. Half-load gives half these values. Motor torque also accelerates wheel/rotor inertia, so this is not an absolute motor-current cap. Use instantaneous normal load and combined tangential force during lift and landing.

The prescribed 12.75″ lateral sway over 0.85 s has a cubic-profile peak acceleration of **2.69 m/s²**, absent from the 2D friction check. Enforce spatial contact forces and `N ≥ 0`. `contactSplit()` permits small tangential force at near-zero normal load and checks only part of the shove. “Zero cone failures” is not a cycle-wide proof.

## 4. Actuators, springs, and structure

The baseline 2D stair run reports:

| Load | Current result | Assessment |
| --- | ---: | --- |
| Static knee peak | 10.56 N·m | Far above the 4.39 N·m stance example |
| Dynamic knee peak | 19.12 N·m | Above the sandbox's 12 N·m cap |
| Dynamic hip-pitch peak | 6.74 N·m | Above the 3–4 N·m holding guidance |
| Wheel peak estimate | 4.03 N·m | Above proposed 3 N·m peak; two samples away from excluded seams exceed it |

These dynamic numbers are **warnings, not new motor specifications**. The prescribed trajectory has velocity kinks, accelerations are smoothed, seam samples are omitted from peaks, body attitude is constrained, and some forces are assigned after constructing motion. Reflected inertia and realistic actuation are absent. Establish a feasible smooth trajectory before specifying peak/RMS torque. The reported ±6% momentum window belongs to this reduced model, not a measured physical limit.

For each actuator obtain **torque versus speed at loaded bus voltage**, continuous/RMS capability, peak duration, temperature limits, output backlash, reflected inertia, shaft load limits, and output-position accuracy. Test motoring and braking. Stall torque is not a one-second holding guarantee. Reduction increases torque but reflects rotor inertia approximately with the square of ratio.

The **GIM8108-8 name does not establish 4S compatibility**. The manufacturer's catalog contains winding/driver variants and differing voltage ranges; the family page lists nominal torques around 6.6–7.5 N·m and ~396 g with driver. Speed-constant extrapolation does not prove startup or required torque on discharged 4S. Obtain the exact variant drawing and drive limits before adopting its envelope, mass, or ratings. [SteadyWin family page](https://www.steadywin.cn/en/pd.jsp?fromColId=0&id=133), [manufacturer catalog, specification table and variant key](https://www.worldrobotconference.com/profile/robot/download/2025/07/23/20250723171358000848_20250723171358A002.pdf)

The sandbox's active suspension requires **torque-controlled, sufficiently backdrivable joints**. A conventional position servo or open-loop stepper does not reproduce this interface. Real compliance is an alternative, with its own sensing and torque curve. Current-controlled FOC needs appropriate current sensing and rotor feedback; ordinary drone throttle control is not equivalent. [SimpleFOC current control](https://docs.simplefoc.com/foc_current)

The **2.2 N·m spring** offsets the two-leg stance at one angle only. Specify `τ_spring(q)`, preload, travel, stored energy, hysteresis, and unloading behavior. A spring stores impact energy; damping or regeneration must remove it. It may also resist folding the free leg.

The earlier **~90 Hz** tube estimate checks out for a simplified **16×12 mm** cantilever, 190.5 mm long, with assumed 100 GPa modulus and 0.30 kg tip mass. The BOM's **16×14 mm** tube is closer to **70 Hz** under those assumptions. Neither proves assembled resonance. Joint compliance, layup, fittings, and attached inertia matter. At nominal 10 N·m bending, corresponding beam stresses are ~36 and ~60 MPa: demands, **not composite allowables**. Test clamp crushing, pullout, torsion, fitting retention, bearings, and fatigue with actual stock.

“2× two-wheel stance” covers static load transfer only. Illustratively, a **25 mm drop stopped over 5 mm** requires average normal force `mg(1 + 25/5)`, about **353 N at 6 kg**, with potentially higher peaks. Use measured compliance and impact cases for shafts, hubs, bearings, fittings, and gearboxes.

## 5. Controls, sensing, power, and descent

The 500 Hz outer / 2 kHz joint settings are plausible simulation choices, not demonstrated bandwidth. The sandbox reads exact body states and contact impulses without sensor delay or noise. Contact load drives its one-wheel sequence, yet a physical load-estimation system is unspecified.

Recommended implementation contract:

- Local drives close current/torque loops. A deterministic controller owns attitude estimation, joint state, wheel balance, coordinated leg targets, and contact transitions. The Pi supplies bounded high-level requests. “Pose” joints remain dynamically coupled to balance.
- Provide joint/output encoders and calibrated load measurement or estimation. Wheel encoders do not observe slip, carcass twist, or backlash. Validate IMU estimation under acceleration; accelerometers measure specific force, not gravity alone.
- Measure complete sensor-to-torque delay, jitter, bus load, and packet age. At 10 Hz, 10 ms pure delay adds **36° phase lag**. Counting samples during a 57 ms obstacle encounter does not establish adequate response.
- Preserve balance priority over yaw. Include saturation handling, rate limits, watchdogs, and contact-guarded transitions. Gate unloading on measured support and feasible pose; a mode name does not prove contact state.
- Retain the existing classical-control plan. PID versus LQR matters less here than valid plant assumptions, estimation, actuator authority, and contact handling.

**`PARKED` needs a physical support state.** With balance off, the baseline simulator rolls onto its back without the optional skid. Select a rest mechanism or supported sit pose. Distinguish a controlled stop/lower on lost RC while control is healthy from emergency torque removal. Use physical catch/support equipment during early experiments. Shorted motor phases provide speed-dependent braking, not a static parking brake.

**Descent requires its own trajectory and tests.** Reversing the ascent animation does not validate it. One 9.5″ descent releases **14.2 J** at 6 kg, plus changes in kinetic energy. Check landing shock, bus overvoltage, battery charge-current/state-of-charge limits, driver fault behavior, and regulated rails that cannot absorb reverse power. Low mechanical speed does not mean low winding heat while holding a knee. [ODrive power, regeneration, and thermal documentation](https://docs.odriverobotics.com/v/latest/manual/hardware-config.html)

Hattori's first-hand STRIDE V2 account supports motor-at-wheel packaging, serial-leg clearance tradeoffs, and body translation with two leg DOFs. It also describes preliminary open-loop stepping and difficult jump landings. This is useful precedent, not validation of Hux's dimensions or one-wheel controller. [Hattori, STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2)

## Validation sequence

Proposed experiments, not completed hardware work or purchase authorization:

| Order | Experiment | Evidence needed to proceed |
| --- | --- | --- |
| 1 | Measure stairs and component inventory | Rise/going/nosing/overhang variations, surface; component masses, CoMs, envelopes and travel. Weigh at multiple supported orientations to estimate assembled CoM. |
| 2 | Unify spatial geometry | Every pose respects reach, joint limits, self/terrain clearance, tire contact and cable travel. Find a feasible transfer or explicitly revise gait/envelope. |
| 3 | Characterize restrained wheel and joint | Torque-speed-current-temperature data at full/low 4S; backlash/compliance, loaded encoders, latency, braking and faults. |
| 4 | Load an assembled leg | Pose loads, spring curve, deflection, fitting retention and assembled resonance. Establish allowable loads from actual materials/tests. |
| 5 | Two-wheel balance with a catch rig | Repeatable starts, stops, height changes, turns, disturbances, lost-link response, supported parking; log saturation and slip across voltage/mass/surface conditions. |
| 6 | True single support, both sides | Free wheel clear and unloaded for planned swing duration plus margin; stable lateral recovery and controlled return. Log load, clearance, CoM estimate and torque. |
| 7 | Broad low step, progressively taller/narrower | Repeatable placement, load transfer, ascent and descent under landing-error/friction variation; no animation-only state resets. |
| 8 | Target fixture and actual staircase geometry | Measured stopping/placement margin and repeated-cycle thermal endurance, with independent catch protection during development. |

First make the failed assumptions observable in the simulator: shared spatial geometry, actual tire shape, valid contact forces, joint travel and torque-speed limits, true free-wheel clearance, realistic sensors, and fault cases. Use simulation to reject weak designs. Physical capability remains unvalidated until the corresponding measurements exist.
