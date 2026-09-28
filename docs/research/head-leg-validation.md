> **PARKED STAIR-V1 — 2026-09-28.** This is historical research, not an active requirement, BOM or build gate. [V1-PROOF](../v1-proof.md) governs current work.

# Engineering verification — 2026-09-28

Revision: **2026-09-28-B**. Input SHA-256: `3aef03b21d75b8c224e416facf1859d6a5627259db956ccc661751a9979dd252`.

- `python3 tools/engineering/review.py --write` completed with the stored results. The preferred candidate uses 241.3 mm links, H1-B and a 120 mm stepping track. All `release` flags remain false.
- `python3 tools/engineering/test_review.py`: **13 checks passed**. Coverage includes mass/inertia translation, battery/COM sensitivity, enclosure fit, exact split-offset FK/IK, unreachable targets, gravity virtual work, lateral mirroring, contact sequencing, CAN/height budgets, moving width, continuous segment/box distance and the rejected aft motor package.
- `npm test` in `tools/living-drawings`: **passed**, including the engineering checks, 200 legacy spatial FK/IK cases, 402 projection frames, assumption/frontal checks and the Rapier regression suite. Its old stair candidate remains deliberately rejected; the short-hop regression does not prove controlled support.
- Python compilation and JavaScript syntax checks passed. `git diff --check` passed.
- Stored head properties agree with the current input. Regenerating SVG, HTML and BOM from the stored results produces identical hashes. Revised Markdown local-link targets exist.
- H1 SVG and the engineering page were visually inspected. This checks presentation, not manufacturing fit.

Preferred candidate: 91 connected poses plus 810 interpolated samples; no reach, limited-envelope or width-gate flags. The heavier-head case also passes those screens. Peak nominal gravity roll/pitch/knee torque: 6.61 / 3.92 / 7.89 N·m. Maximum modeled nominal span: 355.44 mm, leaving only 0.16 mm to the nominal width bound.

**Not verified:** real ankle carrier, exact component SKUs, complete inter-part swept solids, service/harness access, structural allowables, smooth timed dynamics, real contact footprint/traction, installed thermal duty, current/regen, firmware, single-leg support or a physical step. No purchases or fabrication release were made. Steve subsequently authorized committing and pushing the review to `main`.
