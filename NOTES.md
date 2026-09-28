# Working notes — 2026-09-28

**No components purchased. Fix the stair mechanism before the actuator set.** This is Steve's current direction, superseding old ordered/on-hand claims and the temporary motor lock. [Decision log](docs/decisions.md) retains the history.

## Completed in this review

- [x] Audited head envelopes, component mass/CoM assumptions, thermal ratings, CAN capacity and cost omissions.
- [x] Created H1 dimensioned front/side/plan and a machine-readable head, mass and budget source.
- [x] Added exact split-offset leg FK/IK and 91-sample complete-step screening. Compact candidate fails; 26-inch candidate has a connected path with 810 additional sampled checks, without dynamic/hardware validation.
- [x] Corrected current inventory, requirements, mechanical/electrical/software interfaces and procurement gates.
- [x] Preserved and labeled the old drawings/simulator as the legacy eight-axis experiment.

## Next decisions and engineering work

1. **Support mechanism:** hip+ankle roll with finite-width wheel contacts and a real pitch-level carrier, or deployable positively locked landing shoes. Simple motor relocation and a free swivel are not fixes.
2. **Scale:** retain the compact 24-inch target while exploring whether the approximately 26-inch/narrow-entry option with moving-width margin is acceptable. Do not silently relax it.
3. **Real trajectory:** replace the assumed ankle carrier with real joints, validate all swept solids, and time/retime the connected 26-inch path within speed/acceleration/contact limits. Sampled static reach does not make a gait.
4. **Head hardware fit:** pick exact battery/board/connector envelopes and mocked cable routes. H1's nominal allocation passes box separation only.
5. **Joint sizing:** Narrow-entry gravity peaks of 6.61/3.92/7.89 N·m at roll/pitch/knee exceed the reference stationary ratings. Evaluate actual reduction or another axis with the mass/thermal/geometry cascade.
6. **Bench sequence:** nonpowered full-size mockup, then one representative axis/contact assembly, mounted thermal test and 10-second controlled one-leg support/return before the rest of the set.
7. **Controller contract:** explicit joint axes, SI frame, mass tensor, effective contact footprint, timestamped mixed-rate CAN and safe supported abort.

Full analysis: [docs/head-and-leg-review.md](docs/head-and-leg-review.md). Current budget: [docs/bom.md](docs/bom.md). Checklists: [docs/checklists/mechanical-v1.md](docs/checklists/mechanical-v1.md).

Research, license boundaries, COTS carbon spars, service access and the long-term digital-twin horizon remain. No new artwork, no firmware implementation and no component order. Steve subsequently authorized committing and pushing this review to `main`; all hardware validation gates remain open.
