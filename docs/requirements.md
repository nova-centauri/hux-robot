# V1-PROOF requirements

**Active from 2026-09-28.** The user's scope reset supersedes the stair project. Historical R1–R44 requirements are preserved in the [archive](archive/stair-v1/requirements.md); they do not constrain this proof build. [Plan and finish line](v1-proof.md).

| ID | Requirement | Acceptance / scope |
| --- | --- | --- |
| PF01 | Strictly under $1,000 new cash | Entire proof build, all stages, tax, shipping, consumables and repairs; $940 planned ceiling |
| PF02 | Reuse suitable equipment first | Confirm exact items before deducting budget; no assumed free inventory |
| PF03 | Small, lightweight robot | 2.5 kg proposed target; 3.0 kg maximum including battery |
| PF04 | Four powered axes maximum | Two wheels plus one leg adjustment per side; no roll or ankle axes |
| PF05 | First balance with pinned legs | Same structure/wheel/electronics hardware carries into leg-motion stage |
| PF06 | Two-wheel balance and manual drive | 60 s balance 9/10 starts; five controlled drive sequences |
| PF07 | Modest leg movement, both wheels down | Ten low/high/low cycles; target ≥25 mm measured height change |
| PF08 | Flat indoor floor | No stairs, one-wheel stance, jumping, slopes or sills required |
| PF09 | Slow travel | 0.25 m/s cruise, 0.5 m/s qualified cap |
| PF10 | Flexible, inexpensive drives | Geared brushed wheel motors and small servos allowed; encoder feedback and mounted duty tests required |
| PF11 | Minimal electronics | Suitable existing MCU/IMU/manual link; no mandatory CAN, Pi, ROS or camera |
| PF12 | Compatible power and fault handling | Pack/rails verified at full charge and low operating voltage; current limits, physical cut and stale-data handling |
| PF13 | Serviceable shop construction | Existing/COTS stock, removable pack, accessible fasteners, proper bearings and cable strain relief |
| PF14 | Honest model and evidence | Preliminary drawings before detail CAD; measured mass/CoM and trial logs before performance claims |
| PF15 | Ten-minute mixed demonstration | Within mounted thermal/electrical limits and no resets; fault recovery requires deliberate rearm |

PF01/PF02 and the reduced scope come directly from the user's request. Numerical geometry, mass, motor classes and trial counts are proposed implementation targets. Change them deliberately with the [decision log](decisions.md) and [model.json](../tools/v1-proof/model.json), while preserving the user's budget and scope.
