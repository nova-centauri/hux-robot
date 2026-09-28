> **PARKED STAIR-V1 — 2026-09-28.** Preserved planning history. [V1-PROOF](../../v1-proof.md) now governs active work.

# Mechanical

**2026-09-28: architecture review; no components purchased; no fabrication release.** The existing eight-actuator arrangement is rejected as a stair purchase baseline. Keep the one 9.5-inch step objective and fix single support and reach before committing to motors. [Full head and leg review](../../head-and-leg-review.md) contains the equations, dimensions, measured-vs-assumed distinctions, results and release gates.

## Current intent

- Wheeled biped, one complete 9.5 × 9.5-inch step from a standstill, 9/10 trials. Both wheels must end on the upper tread. A floor hop is not the acceptance test.
- Carbon-tube primary spars with replaceable machined/printed fittings; COTS stock, accessible wiring, threaded fasteners, service access and 2D layouts before CAD.
- In-wheel drive, approximately 6-inch OD; motor bearing capacity and the actual tire/rim interface must be established.
- Approximately 24-inch height and 14-inch maximum outside width remain the compact target. The approximately 26-inch study is an explicit **alternative**, not an accepted change to that requirement.
- Knee actuator at the knee remains the starting arrangement. Springs are optional aids to be sized against the complete stance/swing cycle, not credits used to pass an unvalidated load case.
- Hip roll remains necessary in the current research direction; ankle roll and wider wheel contacts are under evaluation. Motor count, tire width, roll travel, link lengths and reductions are reopened.

## Head H1 — candidate allocation

Detailed dimensioned layout: [head-h1.svg](../../../cad/layouts/head-h1.svg). Machine-readable source: [baseline.json](../../../tools/engineering/baseline.json). Coordinate frame: mm, X forward, Y left, Z up, origin halfway between hip roll axes.

| Interface | Candidate dimension |
| --- | --- |
| Middle / top cap | 203.2 mm deep; middle 120 mm wide at Z 48…100, cap 177.8 mm wide at Z 80…100 |
| Lower central bay | 203.2 mm deep × 68 mm wide; Z −44…48 mm |
| Guarded hip cassette | 242 mm wide; X 32…89, Z −45…45 mm |
| Hip roll centerlines | Y ±76.2 mm, Z 0; fore-aft |
| Existing RS02 reference housing | 78.5 mm square × 45.5 mm axial, center X = +60.5 mm, outputs rearward toward pitch pivots |
| Battery allocation | 150 × 50 × 60 mm, center (8, 0, −8); actual SKU not chosen |
| Companion / cooler allocation | 115 × 105 × 44 mm, rear upper bay; plugs and airflow still open |
| Head estimated mass / CoM | 2.26 kg including 0.30 kg contingency; (+6.19, 0, +20.78) mm |

The hip torque goes through an aluminum frame/heat spreaders, not the printed cover. Covers and battery/compute trays are independently removable. Keep the rear upper-link sweep open and the middle bay narrow for hip-pitch housing clearance. The earlier aft motor layout collided with the links; revision B corrects this. Do not claim a larger hip motor or a reduction fits this cassette without revising it.

The head's old +1-inch CoM was an unsubstantiated dynamics setting. Moving a 0.7 kg pack 1 inch moves a 4.35 kg head CoM only 0.16 inch. CAD and control parameters must derive head CoM and inertia from all components.

## Legs and contact architecture

The 80 mm-wide candidate wheel foot provides two separated contact regions and active ankle roll to resist lateral tipping. A free gimbal would discard the moment. Simply moving the existing hip motors to the ankles removes a needed degree of freedom and is not a drop-in fix.

The ten-axis screen assumes a passive mechanism keeps the ankle-roll axis fore-aft as the shin pitches. That mechanism is **not designed**. Bolting a roll motor directly to the shin introduces wheel yaw as well as camber. Alternative: properly leveled, positively locked nonrolling landing shoes; this also requires its own joints, load path and gait. Neither is an authorized component buy.

At 8.5-inch links and a 100 mm head top, theoretical full extension is 608 mm (23.94 inches). The wide-entry compact case fails 14/91 reach samples; narrowing the entry still leaves three reach failures and 17 envelope flags. A 9-inch-link narrow comparison has a knee/riser envelope flag during full load transfer.

With **9.5-inch links**, a 70° hip-roll limit, 75° ankle-roll limit, axle Y = ±60 mm throughout the step and X −90→+90 mm, the solver connects all 91 poses. Another 810 interpolated samples have no reach, limited-envelope or 355.6 mm width-gate flags. The +0.60 kg head case also connects. Nominal peak modeled span is **355.44 mm**, leaving only 0.16 mm to that width limit, so toleranced fit is not established. The **658.8 mm (25.94-inch)** height is a proposed relaxation only. The ankle carrier, full solids and timed dynamics remain unvalidated; 0.17 mm modeled COM residual is numerical consistency, not hardware accuracy.

The old 7.5-inch link dimensions and 16×14 mm tube cuts, 2.5-inch knee pulley, 3 kN/m spring, flush RS05 rim and 9.1-inch hip band are **historical proposals**. Sheets 1/2 and the Rapier sandbox still represent that experiment; they are not fabrication drawings for H1 or the ten-axis candidate.

## Loads and procurement gates

- Bare RS02 stationary reference is 6 N·m under vendor thermal conditions. The narrow-entry candidate needs 6.61 N·m roll, 3.92 N·m pitch and 7.89 N·m knee torque before dynamics; all three reference selections need changes or qualification. Consider reduction or a different actuator only after the geometry is closed.
- Compute support reactions and every joint's gravity, acceleration and braking torque; do not use “twice average load” as a substitute for inverse dynamics.
- Provide a rated external wheel bearing path unless vendor radial/axial/moment/shock ratings explicitly cover the installation. Keep wheel impact out of undocumented actuator bearings.
- Recalculate tube bending/torsion, socket bond, pin holes and spring loads for the selected geometry. Generic 100 GPa/500 MPa carbon properties are assumptions, not a supplier laminate certificate. No stock purchase or tube cuts from old Sheet 2.
- Establish real contact width at load/camber and the allowable center-of-pressure margin. Tire overall width is not a measured support polygon.
- Show a continuous collision-free full step, controlled one-leg hold and return, mounted thermal duty, power-loss support and abort behavior before full-set procurement.

Checklist: [mechanical-v1.md](checklists/mechanical-v1.md). Current budget: [bom.md](bom.md). Decision and supersession log: [decisions.md](../../decisions.md).
