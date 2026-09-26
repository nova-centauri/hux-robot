# 3D sandbox — corrected model and measured simulation results

The sandbox is a design investigation, not firmware or hardware validation. Run `cd tools/living-drawings && npm test`. The [correction record](model-corrections.md) explains the changes; the [original audit](real-world-validation.md) records the earlier baseline.

## Current model

- Rapier 0.20.0, impulse revolute joints, 2 kHz physics/joint updates and 500 Hz outer balance loop.
- Shared geometry and working joint/torque limits. Physical stops on roll, pitch and knee; zero knee angle is allowed for initial assembly, while the servo avoids straight-leg operation.
- **Tire (2026-09-25 fix).** One shared cross-section in `tire.js`: a 6 × 1.25" tread with a **full-round crown** (crown radius = half the width, the shape a scooter pneumatic takes on a narrow rim; `M.tireCrown` flattens it). The Rapier hull, the Three.js lathe mesh and the 2D projection (`spatial.js`) are all built from that one profile, so the flat-shoulder cylinder is gone and the contact point **walks around the crown** as the wheel cambers — measured in `sim-test.js` at 0/10/20/30° against the profile's prediction (9.4 / 19.5 / 29.0 mm at 10/20/30°), with the full load carried on the crown. Each wheel is now a **hub plus a tread ring on a carcass spring** (isotropic; `tireK` 40 kN/m and `tireZeta` 0.2 are knobs and guesses for a high-pressure 6×1.25, not measurements): the tire squishes 0.7 mm under half the weight and shifts sideways on the hub under side load, and the HUD reports the pad that deflection implies (0.84 × 0.38" at rest). Rapier still resolves the contact at points; the pad is an estimate, not a resolved patch. The ring's free-roll numerical error is unchanged (0.515 m/s from 0.500). Still absent: anisotropic (softer lateral) stiffness, rolling resistance, carcass hysteresis.
- Self-contact between separate robot parts enabled. Direct joint neighbors and overlapping trunk/hip mount geometry are excluded. This is an approximate assembly, not a CAD interference check.
- Delayed ideal outer-loop state/contact samples (4 ms default), first-order torque response (2 ms default), and joint output torque-speed roll-off (20 rad/s default). All are adjustable **unmeasured assumptions**. The inner servo still uses ideal current joint state.
- Tire load reports upward normal impulse, ignoring robot self-contact. Contact load and ground-clearance rays are still simulator ground truth; a physical estimator is absent.
- Requested mode is separate from observed support. Single support requires >5% weight on the plant tire, <2% on the free tire, >10 mm free-tire clearance, and 1.55 seconds sustained before the interval indicator qualifies it. This indicator is not a hardware qualification.
- Parking without the proposed skid is refused; translation/yaw commands go to zero and balance stays on. With a skid, the existing experimental crouch/rest sequence remains available. The HUD declares `PARKED` only after a load-bearing skid contact and low body motion are observed. The settling maneuver and contact measurement remain simulated, not a hardware interlock.
- Yaw PI control compensates steady turning resistance with a bounded integral; pitch balance retains priority at wheel saturation.

The mass is 6.12 kg: the 6.00 kg drawing lumps plus four 0.03 kg tubes. These are estimates, not measured mass properties. Tire compliance, backlash, electrical power, battery limits, temperature, contact estimator noise and hardware watchdog behavior remain unmodeled. Displayed motor power is mechanical `torque × speed`, not battery draw.

## Corrected default results, 2026-09-23 (tire rows re-run 2026-09-25)

| Test | Observed result |
| --- | --- |
| Stationary 92% stance | 1.85 N·m per knee; 16.8-inch hip height; wheel loads sum to weight within 2%. |
| Default 75% ride height | 3.17 N·m per knee; 14.3-inch hip height. |
| Floor drive, turn, reverse, shoves and height changes | Completes; peak lean 10.6°, wheel torque 1.45 N·m, knee torque 6.9 N·m. |
| Floor shove sweep | Recovers through tested 10 N·s forward (8 before the compliant tire) and 5 N·s sideways; larger tested impulses fail. |
| Half-inch threshold at 0.5 m/s | Crosses. |
| One-inch threshold | Falls at 0.3, 0.75 and 1.5 m/s; crosses at 0.5 and 1.0 m/s (0.5 fell on the rigid tire). Knee demand reaches the 12 N·m cap. |
| Park without skid | Refused, remains balancing. |
| Park with proposed skid | Rests near −17° and stands back up. |
| Left/right poise request | Enters and returns to two-wheel mode without falling. The sampled free-wheel load ranges 10–24% in the left trial (planned 15%), so this is not single support. Before the 2026-09-25 contact fix it was 3–24%: the controller measured the mass offset from the **hub**, but a 6" crowned tire cambered 24° touches the floor about 25 mm from under its hub, so the poise sat on the bail-out threshold. With the compliant tire reading load cleanly the bail-out fired and the robot fell; pivoting the one-leg model on the crown contact (`contactOf` in `sim-core.js`) fixed it. Since 2026-09-26 the planted hip roll is a stiff integrating hold (250 N·m/rad + integral) and reads 6.6 N·m at the poise; the 4.3 N·m of 2026-09-25 was a 90 N·m/rad hold sagging into the load. |
| Experimental full lift | Falls, and now it is known why: a one-wheel stand on this geometry is an acrobot with 2–3 mm of capture region ([`one-leg-stance.md`](one-leg-stance.md)). With the servo sag fixed, clean rates, a handover at 8% free-wheel load, and even with roll limits opened to ±1.5 rad, 40 N·m and no delay, the body swings 36–39° and it falls. |
| Dynamic single support (hop) | New 2026-09-26, `oneHop` / `hopKeep` knobs: from the poise, free wheel up for T with the hip rolls held stiff, no balancer, land, return. From an **8% poise** a **0.2 s hop tips 1.5°, lands 42 mm inboard at 0.02 m/s, planted hip roll 12.5 N·m peak, and returns to two wheels** (asserted). 0.3 s: tips 2.8°, lands at 63 mm and 0.05 m/s, but the return fails (controller). From the 15% poise 0.3 s tips 11.5° and lands at 144 mm and 0.19 m/s. The flight matches the closed-form pendulum (`frontal.js`). |
| 9.5-inch stairs / descent | No working controller; not passed. |

The floor-driving regression now removes course fixtures. Previously it approached the stair during a supposed flat-floor arc; differences in forward speed changed whether it hit the fixture. Obstacle trials retain the course and report every outcome separately.

## Interpretation

Passing the regression suite means the model preserves its stated invariants and baseline floor functions. It does not mean every capability trial passed. In particular, the historical sphere model's successful 0.5/0.75 m/s one-inch sill crossings have **regressed under the corrected physical assumptions**. The code reports those failures instead of asserting the old capability.

The full-lift controller remains experimental and off by default; [`one-leg-stance.md`](one-leg-stance.md) explains why it fails (physics, not tuning) and what the stair needs instead. A two-contact poise cannot establish sustained hip-roll torque, tire stability or controllability on one wheel. Select no actuator from a transient peak or a stall rating. Match the exact motor, driver, reduction and 4S bus, including thermal duty, regeneration and low-voltage behavior, then replace the assumed drive limits with measurements.

Steve, 2026-09-25: the 3D sandbox taught a lot and framed capabilities / expectations. It is still a **design toy**, not the digital twin. Pipeline (Isaac / MuJoCo / mjlab / other) stays **TBD** — lock the twin contract first, including crown tire contact. See [`../decisions.md`](../decisions.md) and [`../software.md`](../software.md).

## 2026-09-26 — the locked actuator set applied

`actuators.js` now feeds the sandbox: lumps (body 4.35, hips 1.50, knee 0.46, wheel 0.49 → **7.75 kg**, was 6.0), torque caps = RobStride peaks (wheel 5.5, knee 17, hip swing 14, roll 17 N·m), per-joint no-load speeds on 8S (wheel 31, knee / roll 26.5, swing 20 rad/s), rated torque reported beside every joint torque, and the motor envelopes (RS02 78.5 mm square at the knee and hip roll, RS00 57 mm at the swing, RS05 46 mm in the wheel).

- **Physics rate 2 → 3 kHz.** The heavier RS05 hub (0.29 kg) on the 0.2 kg tread ring chattered at 2 kHz: contact-force bursts up to 1.45× the weight, periodic, none of it physical (rigid tire: clean; 16 solver iterations: halved; 3 kHz: gone). The 2026-09-25 model had the same artefact at 1.12× and it slipped past the weight check by timing. Solver mass-ratio problem, not a tire finding.
- **Stance knee torque** scales with the mass: ~2.8 N·m two-leg at 7.75 kg (was 2.2 at 6). The test bound now scales with `M.exampleMassKg`.
- **One-wheel hold** at the drawn 5.4" hips: 10.7 N·m (frontal.js, was 8.3 at 6 kg). Above RS02's 7 rated; at RS06's 11. At 3" hips: 6.0. The hip offset is now a requirement (decisions 2026-09-26).
- **RS05 housing (44 mm) is wider than the tire (31.75 mm)** and reaches into the 0.975" axle spacer — the sandbox draws the hub as a 46 mm disc, it does not collide it. Hub drawing needed.
- **Two controller fixes the heavier robot forced, both already prescribed by `one-leg-stance.md` §5:** (1) leg-length levelling is frozen for the whole one-leg sequence, not only in the air — with the actuator masses the levelling integrator and the shift servo fell into a **2 Hz limit cycle during the shift** (free-wheel load 3 ↔ 21 N, knees ±1°, mass ±5 mm) and the poise never settled; level with the parallelogram. (2) The planted hip roll gets the **lump model's gravity feed-forward through the whole shift / poise / landing**, scaled by the share of the weight the free wheel is not carrying — the P+I hold alone sagged 1–3° into the 10.7 N·m cantilever after a landing and walked the mass over the planted tire in 0.4 s (fell every time; stiffer free-hip P did nothing). Post-landing re-poise rate 0.2 → 0.08 rad/s. With these the 0.2 s hop lands (2.6°, 31 mm) and returns to two wheels again; the 0.3 s hops land but still fall on the return (controller work, as before).
- **Hop peak on the planted hip roll: 17 N·m = the RS02 cap**, at the drawn 5.4" hips, for both the 0.2 and 0.3 s hops (was 12–13 at 6 kg). The step of taking the whole cantilever as the free wheel leaves is torque-limited now. Same message as the hold: the hips come in, or the roll actuator goes up a class.
- **1" sill regressed:** crosses only at 1.0 m/s (0.5 and 0.75 m/s fall; 2026-09-23 crossed from 0.5 to 1.0). Heavier robot, the same hop reflex; RS05 peak 5.5 N·m is not the limit (peak wheel torque in the runs is ~1.7 N·m) — it is the leg spring / hop timing tuned for 6 kg. Not re-tuned today.
- **Yaw loop hunts** ±0.4 rad/s about a 1.5 rad/s command at 1 m/s (at 6 kg too — the old test sampled a lucky phase). The test now asserts the last-second mean; the swing is reported. Sandbox controller, not layer 2.
- Still not modelled: reflected rotor inertia through the 7.75:1 / 10:1 reductions (not published), backlash, actuator thermal limits (rated is reported, not enforced).
