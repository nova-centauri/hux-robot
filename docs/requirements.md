# V1-PROOF requirements

**Active from 2026-09-28.** The user's scope reset supersedes the stair project. The [archive](archive/stair-v1/requirements.md) keeps the historical R1–R44 requirements. They do not constrain this proof build. [Plan and finish line](v1-proof.md).

| ID | Requirement | Acceptance / scope |
| --- | --- | --- |
| PF01 | Strictly under $1,000 new cash | Entire proof build, all stages, tax, shipping, consumables and repairs; $900 planned ceiling |
| PF02 | Reuse suitable equipment first | Confirm exact items before deducting budget; no assumed free inventory |
| PF03 | Small, lightweight robot | 2.5 kg proposed target; 3.0 kg maximum including battery |
| PF04 | Four powered axes maximum | Two wheels plus one leg adjustment per side; no roll or ankle axes |
| PF05 | First balance with pinned legs | Same structure/wheel/electronics hardware carries into leg-motion stage |
| PF06 | Two-wheel balance and manual drive | 60 s balance 9/10 starts; forward/reverse, left/right arcs and both in-place rotations; [physical protocol](v1-proof-validation.md) |
| PF07 | Modest leg movement, both wheels down | Ten low/high/low cycles; target ≥25 mm measured height change |
| PF08 | Shallow indoor irregularities | At 0.15 m/s: ±3° cross-slope, 3° ascent/descent, 5 mm smooth bump over 300 mm, 3 mm seam; no rough terrain or stairs |
| PF09 | Slow travel | 0.25 m/s cruise; 0.5 m/s remains unqualified; recovery clearance to 0.65 m/s |
| PF10 | Flexible, inexpensive drives | Geared brushed wheel motors and small servos allowed; encoder feedback and mounted duty tests required |
| PF11 | Minimal electronics | Received Pico 2 + SparkFun LSM6DSO baseline; electrical/timing qualification required; zero onboard cameras |
| PF12 | Compatible power and fault handling | Pack/rails verified at full charge and low operating voltage; current limits, physical cut and stale-data handling |
| PF13 | Serviceable shop construction | Existing/COTS stock, removable pack, accessible fasteners, proper bearings and cable strain relief |
| PF14 | Honest model and evidence | Preliminary drawings before detail CAD; measured mass/CoM and trial logs before performance claims |
| PF15 | Ten-minute mixed demonstration | Within mounted thermal/electrical limits and no resets; fault recovery requires deliberate rearm |

| PF16 | Bounded push recovery | Fore/aft 0.8 N·s, lateral 0.4 N·s at 0.20 m height; 50/200 ms pulses, settle within 3 s; larger human shoves unqualified |
| PF17 | Explicit hardware baseline | [Selected components and bench gates](v1-proof-hardware.md); no purchase or physical validation implied |
| PF18 | Foundation for later versions | Versioned telemetry/commands, measured motor/IMU/contact models, retained failures and regression matrix before payload/perception expansion |

PF01/PF02 and the reduced scope come directly from the user's request. The later 2026-09-28 request adds reliable maneuvers, bounded disturbances, component decisions and a path to higher requirements. The numerical test envelopes and the selected components are design decisions that put that request into effect. They are not measured capabilities. Change them deliberately with the [decision log](decisions.md) and [model.json](../tools/v1-proof/model.json). Keep the user's budget and scope.
