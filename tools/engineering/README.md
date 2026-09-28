> **PARKED STAIR-V1.** [V1-PROOF](../v1-proof/README.md) is the active numerical model. This publisher cannot overwrite the proof BOM.

# Parked stair engineering candidate — revision 2026-09-28-B

No components purchased; no fabrication or full actuator-set release. Start with
[the review](../../docs/head-and-leg-review.md) and
[decisions](../../docs/decisions.md). No third-party Python packages are needed.

```sh
python3 tools/engineering/review.py --write
python3 tools/engineering/test_review.py
```

`baseline.json` owns head allocations, mass estimates, geometry, study overrides,
electrical assumptions and the historical tube reference. `bom.json` owns budget
rows and their procurement gates. Generated outputs:

- `docs/research/head-leg-results.json`: results and 91-frame paths for compact, extended and narrow-entry candidates; other cases summarized.
- `cad/layouts/head-h1.svg`: dimensioned head allocation.
- `tools/living-drawings/engineering.html`: parked stair review page.
- `docs/archive/stair-v1/bom.md`: archived budget computed from quantities and unit ranges.

Coordinates in the input and result positions are **mm**, X forward, Y left, Z up;
the body datum is midway between the hip-roll axes. Inertia is kg·m², torque N·m,
mass kg, force N. `angles_deg` orders hip roll, hip pitch, knee flexion, ankle roll.
Positive pitch puts the thigh rearward; the shin pitch is `hip_pitch − knee`.
Left and right legs use opposite lateral offsets. In a selected upright wheel
pose the assumed ankle counter-roll equals negative hip roll; this relies on an
unbuilt pitch-level carrier, not a motor bolted to the shin.

`leg` is the compact 24-inch target. The `studies.taller_leg_overrides` and then
`studies.extended_leg_overrides` form the roughly 27-inch wide-entry comparison. Applying `studies.narrow_stance_overrides` produces the narrow comparison: 120 mm track during the step plus a nominal 355.6 mm moving-width gate. `neutral_wheel_outside_width_mm` defines the fixed axle/yoke offset at zero roll, not the swept envelope. The preferred candidate uses the 9.5-inch link override with that narrow stance, for 25.94-inch height. The 24/25-inch narrow cases remain rejected. The high-mass
case adds the explicit 0.60 kg head uncertainty. Neither variant silently replaces
the requirement. The report's `release` flags stay false regardless of screen scores.

The screen solves whole-robot static COM, split-offset spatial IK and gravity joint
moments. A layered search connects feasible poses; interpolation checks the limited
clearance model between samples. It does not solve actuator dynamics, real contact
compliance/friction, thermal duty, full swept solids, nosings, descent or the actual
ankle linkage. The old eight-axis JavaScript simulation remains a labeled historical
experiment. Its tests intentionally assert that its stair candidate fails.

When accepting a design revision, update inputs and the dated decision entry;
regenerate outputs; check the physical invariants; update requirements, CAD joint
centers, inertia/contact model, BOM, firmware mapping and limits together. Never
promote an unmeasured mass or vendor heat-sink rating into a hardware fact.
