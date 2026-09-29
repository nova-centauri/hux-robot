> **PARKED STAIR-V1 — 2026-09-28.** Preserved planning history. [V1-PROOF](../../v1-proof.md) now governs active work.

# Hux

Early R&D for a **wheeled biped**: two legs that end in driven wheels.

**North star:** climb and descend stairs by stepping one wheel at a time. Design riser target is **~9.5"**; actual stair geometry must be measured. **V1 finish line (2026-09-27, R37): one 9.5" step, 9 of 10 attempts, from a standstill.** Pace is a brisk walk (1.5 m/s top, 1.0 cruise); V1 terrain is flat + 1" sills + ~20° slopes. Direction and reasoning: [docs/decisions.md](../../decisions.md).

This repo is the source of truth for Steve Barrett's Hux project. It is a docs-and-layout scaffold — not a finished robot.

**Current engineering review (2026-09-28):** [head and leg audit](../../head-and-leg-review.md) reopens the stair architecture and procurement. **Earlier review (2026-09-23):** [real-world validation audit](../../research/real-world-validation.md) checks geometry, CoM, loads, contacts, and controls. The combined stair drawings exceed spatial reach, and true one-wheel balance remains unproven. Includes reproducible calculations and a bench-test sequence.

**Research first.** Study James Bruton / [XRobots](https://github.com/XRobots), Hattori, and Steve's [inspirations](../../research/inspiration.md) (Roadrunner, FrRonconi student balancer, Build Some Stuff / Serra, Tazer, Stompy) before hardware. Do not vendor upstream trees yet. RobotX is GPL3 — that conflicts with Hux's MIT if we adapt code; Steve decides, we do not relicense. Packet: [`docs/research/`](../../research).

**Decisions live in [`docs/decisions.md`](../../decisions.md).** Merge docs PRs promptly; keep `main` current; log each merge there.

## Current engineering status — 2026-09-28

**No components purchased. The existing stair design is not ready for an actuator order.** Steve asked to fix the legs to justify the actuator cost; controlled single support and a complete reachable step are the gate. A successful short hop is insufficient.

Start with the [head and leg engineering review](../../head-and-leg-review.md), [archived engineering page](../../../tools/living-drawings/engineering.html), [H1 dimensioned head layout](../../../cad/layouts/head-h1.svg), and [revised BOM](bom.md).

| Item | Current state |
| --- | --- |
| Head | H1 revision B: 203.2 mm depth, 120 mm middle bay / 177.8 mm top cap, 242 lower cassette; top 100 mm above hips. Itemized 2.26 kg estimate, no pack=CoM assumption |
| Compact legs | 8.5-inch links fit a nominal 24-inch height with H1, but fail 14/91 step samples |
| Alternative geometry | About 26-inch height, 9.5-inch links and 120 mm wheel-center track throughout the step: 810 interpolated reach/clearance/width checks pass nominally; mechanism, dynamics and thermal duty remain open |
| Contact / support | Hip + ankle roll with finite-width wheel contacts under investigation; passive pitch-level carrier unresolved. Ten powered axes is a candidate, not a validated fix |
| Actuators | Old RobStride set reopened. New gravity demands exceed hip-roll, hip-pitch and knee stationary references; reduction/alternate selection needs mounted tests |
| Electronics | 8S retained conservatively; 60-V-input regulator class and regen handling. Three classic-CAN buses with mixed update rates |
| Compute | Portable control core → CAN MCU → Linux companion architecture retained. No firmware implementation yet |
| Procurement | None ordered. Full candidate allowance $2,236–3,498 before shipping/tax; no full-set release |
| Legacy drawings / simulator | Preserved, prominently marked as the old eight-axis experiment; not a digital twin of the proposed mechanism |

Numerical sources: [`tools/engineering/baseline.json`](../../../tools/engineering/baseline.json) and [`bom.json`](../../../tools/engineering/bom.json). Regenerate results, head SVG, engineering page and BOM with `python3 tools/engineering/review.py --write`; run the physical-invariant tests with `python3 tools/engineering/test_review.py`. The old model's `npm test` also includes these tests and still rejects its stair candidate.

## How it is supposed to work

Balance on two wheeled legs for teleop. Redesign and validate the lateral support mechanism before stair work. The intended cycle is: lift one wheeled leg → balance on the planted wheel → place the raised wheel on the next tread (~9.5") → plant → repeat.

## Repo layout

```
docs/         requirements, decisions, vision, research, mechanical, electronics, software, checklists
NOTES.md      working notes and first milestones
cad/          dimensioned candidate layout and vendor references; no released custom parts
tools/engineering/       numerical candidate, static screen, mass model, budget and tests
tools/living-drawings/   engineering review plus legacy drawings (index.html), 3D sandbox (sim.html), data flow (flow.html), software (software.html), hardware (hardware.html), media (media.html)
art/          exploratory concept renders and rough meshes — not CAD
firmware/     FC / embedded bring-up (empty)
software/     companion compute — Pi cameras / pathfinding (empty)
```

## Docs

- [Decisions](../../decisions.md) — dated log from #1 onward; standing merge rule
- [Research](../../research) — research-first stance, XRobots shortlist, inspiration shares, actuator trade, study plan (Phases A–D)
- [Requirements](requirements.md) — hard / soft requirements, candidate hardware, no-spend rule
- [Vision](vision.md) — stair gait, split-brain intent, lessons to steal
- [Mechanical](mechanical.md) — H1 head allocation, compact versus taller leg studies, contact mechanism and load gates. Historical leg math: [research/leg-geometry.md](../../research/leg-geometry.md)
- [Electronics](electronics.md) — 8S, power protection, CAN MCU and proposed ten-node mixed-rate bus schedule
- [Minimum electronics](electronics-minimum.md) — P0–P5 class list (no SKU, no new spend)
- [Current inventory (updated after this archive)](../../parts-on-hand.md) — this snapshot recorded no confirmed Hux purchases or orders; later V1-PROOF orders and reuse confirmations are tracked at that link.
- [BOM](bom.md) — complete candidate allowances, unresolved selection gates and a staged bench sequence; no released shopping cart.
- [Sheet 1 — V1 layout](../../../tools/living-drawings/sheet.html) — the first 2D sheet (R23): side, front, plan and stroke at the historical geometry, drawn from the model files; roll axes, hip band, leg plane, actuator placement, the pack, the landing target; what it settles and what Sheet 2 owns
- [Sheet 2 — tubes, fittings, spring, hub, wires](../../../tools/living-drawings/sheet2.html) — what the leg is made of: carbon tube cuts and loads, fittings F1–F7, the knee pulley-spring and its torque curve, the hub section with the RS05 flush to the tire, the hip-band shell, the wire path
- [Living drawings](../../../tools/living-drawings/stairs.html) — side, top and front views of the historical leg, and the stair climb with its dynamics (momentum window, wheel catch, joint torques, sway). Play runs the climb in real time. Findings: [research/stair-climb-dynamics.md](../../research/stair-climb-dynamics.md)
- [3D sandbox](../../../tools/living-drawings/sim.html) — drive the working model in 3D with rigid-body physics (Rapier + three.js): torque-limited joints, LQR balance, ride height (medium by default), spring legs with an impact hop, stumble catch, a planned one-wheel poise, stair / ramps / sills / curb / wet tile. A design toy, not the digital twin. Findings: [research/sim-sandbox.md](../../research/sim-sandbox.md)
- [Data flow](../../../tools/living-drawings/flow.html) — command, power, motion, modes, and what waits until later
- [Software](../../../tools/living-drawings/software.html) — the 2026-09-25 **bench-learning** plan for the F765-Wing + Pi 5 (P0–P1). Superseded as the robot's stack by [docs/software.md](software.md).
- [Archived engineering page](../../../tools/living-drawings/engineering.html) — head layout and procurement status. [Legacy hardware page](../../../tools/living-drawings/hardware.html) is historical; use [bom.md](bom.md) for current numbers.
- [Media](../../../tools/living-drawings/media.html) — exploratory concept renders and rough meshes in [art/](../../../art). Look studies only. Not the drawings, not CAD.
- [Shop capabilities](../../capabilities.md) — mill, lathe, bender, brake, bandsaw, solder, weld, breadboards (not parts)
- [Software](software.md) — four layers (CAN actuators, portable control core, CAN RT MCU, ROS 2 companion); layer-2 skeleton → blink → spin → four manual modes → cameras → perception
- [Archived checklists](checklists/README.md) — prefer these over fake finished stacks

## Inspiration

Study before we copy. Licenses differ; RobotX is GPL3.

- [docs/research/xrobots.md](../../research/xrobots.md) — James Bruton / [XRobots](https://github.com/XRobots) shortlist ([RobotX](https://github.com/XRobots/RobotX), [TallBalancer](https://github.com/XRobots/TallBalancer), [SonicRobot](https://github.com/XRobots/SonicRobot), [Stairs](https://github.com/XRobots/Stairs))
- [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2)
- [Steve's inspirations](../../research/inspiration.md) — RAI Roadrunner (lab), FrRonconi student two-leg/wheel balancer (maker-scale), Build Some Stuff / Serra (steal packaging; do not vendor), [Tazer](../../research/tazer-lessons.md) (learn from the mistakes), [Stompy](../../research/stompy-sim2real.md) (CAD/reality match; not RL walking for V1)

## License

[MIT](../../../LICENSE)
