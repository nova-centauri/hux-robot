# Hux

Early R&D for a **wheeled biped**: two legs that end in driven wheels.

**North star:** climb and descend stairs by stepping one wheel at a time. Design riser target is **~9.5"**; actual stair geometry must be measured. **V1 finish line (2026-09-27, R37): one 9.5" step, 9 of 10 attempts, from a standstill.** Pace is a brisk walk (1.5 m/s top, 1.0 cruise); V1 terrain is flat + 1" sills + ~20° slopes. Direction and reasoning: [docs/decisions.md](docs/decisions.md).

This repo is the source of truth for Steve Barrett's Hux project. It is a docs-and-layout scaffold — not a finished robot.

**Engineering review (2026-09-23):** [real-world validation audit](docs/research/real-world-validation.md) checks geometry, CoM, loads, contacts, and controls. The combined stair drawings exceed spatial reach, and true one-wheel balance remains unproven. Includes reproducible calculations and a bench-test sequence.

**Research first.** Study James Bruton / [XRobots](https://github.com/XRobots), Hattori, and Steve's [inspirations](docs/research/inspiration.md) (Roadrunner, FrRonconi student balancer, Build Some Stuff / Serra, Tazer, Stompy) before hardware. Do not vendor upstream trees yet. RobotX is GPL3 — that conflicts with Hux's MIT if we adapt code; Steve decides, we do not relicense. Packet: [`docs/research/`](docs/research/).

**Decisions live in [`docs/decisions.md`](docs/decisions.md).** Merge docs PRs promptly; keep `main` current; log each merge there.

## Status

| Item | State |
| --- | --- |
| Research | Packet in [`docs/research/`](docs/research/) — study before build |
| Requirements | Draft captured in [`docs/requirements.md`](docs/requirements.md) |
| Decisions | Dated log in [`docs/decisions.md`](docs/decisions.md) |
| Compute | **Four layers** (2026-09-26): CAN actuators → portable control core → CAN real-time MCU (**Teensy 4.1**, in the order-now cart) → ROS 2 companion (Pi 5 now, Jetson at P5). F765-Wing is a bench board. |
| Actuators | **Temporary lock (2026-09-26):** 4× RobStride 02, 2× RS00, 2× RS05 — `tools/living-drawings/actuators.js` feeds every model. Not ordered. Mass picture **7.75 kg**; hip roll axes at **3.0"** on Sheet 1 (one-wheel hold 6.3 N·m vs RS02's 7 rated). |
| Power | **8S** (decided 2026-09-26: 4S → 6S → 8S once the actuator voltage floor was checked), one 3300 mAh pack, XT90 / XT90-S, step-down rails |
| Mechanical V1 | **Sheet 1 (layout) and Sheet 2 (make-up) drawn 2026-09-27**; the leg and hip band go to CAD once Steve agrees both. No part made yet. **~24" × ~14"**, 16 × 14 carbon-tube spars, RS02 at the knee with a pulley spring, RS05 flush in the hub. Head inside, wheels outside. |
| Modes | `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY` before autonomy |
| Spend | First buy is tires, tubes, carbon tube, the Teensy 4.1 CAN MCU kit, XT90-S anti-spark, and one 8S 3300 mAh pack ([`docs/bom.md`](docs/bom.md)). 5" walker wheels already ordered as a bench donor. Wheel size **settled at 6" OD**. Motors not authorized. |
| Parts on hand | Inventory in [`docs/parts-on-hand.md`](docs/parts-on-hand.md) — owned ≠ reserved |
| Shop / fab | Tools (not parts) in [`docs/capabilities.md`](docs/capabilities.md) — mill, lathe, weld; fab welcome |

First milestones live in [`NOTES.md`](NOTES.md).

## How it is supposed to work

Balance on two wheeled legs for teleop. Gate stair work behind one-leg work (hip roll **in V1** + planted-wheel fore/aft). Then: shift the mass over one wheel → lift the other for a short, timed single support (a *static* one-wheel stand is not available on this geometry — [`one-leg-stance.md`](docs/research/one-leg-stance.md)) → place the raised wheel at the rear of the next tread's slot (~9.5") → shove and catch → plant. V1 is one such step; a flight repeats it (V2).

## Repo layout

```
docs/         requirements, decisions, vision, research, mechanical, electronics, software, checklists
NOTES.md      working notes and first milestones
cad/          printable / CAD parts (empty — 2D before Blender)
tools/living-drawings/   the source of truth: drawings (index.html), Sheet 1 (sheet.html), Sheet 2 (sheet2.html), 3D sandbox (sim.html), data flow (flow.html), software (software.html), hardware (hardware.html), media (media.html); spec.js + actuators.js hold the numbers
art/          exploratory concept renders and rough meshes — not CAD
firmware/     layer 2 control core + Teensy 4.1 firmware (empty)
software/     layer 4 ROS 2 companion — Pi 5 now, Jetson at P5 (empty)
```

## Docs

- [Decisions](docs/decisions.md) — dated log from #1 onward; standing merge rule
- [Research](docs/research/) — research-first stance, XRobots shortlist, inspiration shares, actuator trade, study plan (Phases A–D)
- [Requirements](docs/requirements.md) — hard / soft requirements, candidate hardware, no-spend rule
- [Vision](docs/vision.md) — stair gait, split-brain intent, lessons to steal
- [Mechanical](docs/mechanical.md) — carbon-tube spars, ~24" × ~14", Sheet 1 / Sheet 2 summary, RS02 knee at the knee + spring, RS05 hub, hip roll in V1 at 3.0". Leg math: [research/leg-geometry.md](docs/research/leg-geometry.md)
- [Electronics](docs/electronics.md) — 8S + step-down, CAN actuator bus, CAN real-time MCU (F765 is bench only), TBS Nano RX, in-wheel FOC, 8 CAN nodes
- [Minimum electronics](docs/electronics-minimum.md) — P0–P5 class list (no SKU, no new spend)
- [Parts on hand](docs/parts-on-hand.md) — owned / ordered inventory + candidates (the RobStride set is a temporary lock, not ordered)
- [First buy](docs/bom.md) — 6×1.25 tires, tubes, 16 × 14 carbon tube, Teensy 4.1 CAN kit, XT90-S anti-spark, one 8S 3300 mAh pack. Actuators are temporarily locked, not on the order list: [actuator shortlist](docs/research/actuator-shortlist.md).
- [Sheet 1 — V1 layout](tools/living-drawings/sheet.html) — the first 2D sheet (R23): side, front, plan and stroke at the settled geometry, drawn from the model files; roll axes, hip band, leg plane, actuator placement, the pack, the landing target; what it settles and what Sheet 2 owns
- [Sheet 2 — tubes, fittings, spring, hub, wires](tools/living-drawings/sheet2.html) — what the leg is made of: carbon tube cuts and loads, fittings F1–F7, the knee pulley-spring and its torque curve, the hub section with the RS05 flush to the tire, the hip-band shell, the wire path
- [Living drawings](tools/living-drawings/index.html) — side, top and front views of the settled leg, and a **candidate** stair climb with its dynamics (momentum window, wheel catch, joint torques, sway) — rejected by the spatial model; no validated V1 step yet (NOTES open call 16). Play runs the climb in real time. Findings: [research/stair-climb-dynamics.md](docs/research/stair-climb-dynamics.md)
- [3D sandbox](tools/living-drawings/sim.html) — drive the working model in 3D with rigid-body physics (Rapier + three.js): torque-limited joints, LQR balance, ride height (medium by default), spring legs with an impact hop, stumble catch, a planned one-wheel poise, stair / ramps / sills / curb / wet tile. A design toy, not the digital twin. Findings: [research/sim-sandbox.md](docs/research/sim-sandbox.md)
- [Data flow](tools/living-drawings/flow.html) — command, power, motion, modes, and what waits until later
- [Software](tools/living-drawings/software.html) — the 2026-09-25 **bench-learning** plan for the F765-Wing + Pi 5 (P0–P1). Superseded as the robot's stack by [docs/software.md](docs/software.md).
- [Hardware](tools/living-drawings/hardware.html) — order now, on hand, shop, and the class estimates. Same numbers as [bom.md](docs/bom.md)
- [Media](tools/living-drawings/media.html) — exploratory concept renders and rough meshes in [art/](art/). Look studies only. Not the drawings, not CAD.
- [Shop capabilities](docs/capabilities.md) — mill, lathe, bender, brake, bandsaw, solder, weld, breadboards (not parts)
- [Software](docs/software.md) — four layers (CAN actuators, portable control core, CAN RT MCU, ROS 2 companion); layer-2 skeleton → blink → spin → four manual modes → cameras → perception
- [Checklists](docs/checklists/) — prefer these over fake finished stacks

## Inspiration

Study before we copy. Licenses differ; RobotX is GPL3.

- [docs/research/xrobots.md](docs/research/xrobots.md) — James Bruton / [XRobots](https://github.com/XRobots) shortlist ([RobotX](https://github.com/XRobots/RobotX), [TallBalancer](https://github.com/XRobots/TallBalancer), [SonicRobot](https://github.com/XRobots/SonicRobot), [Stairs](https://github.com/XRobots/Stairs))
- [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2)
- [Steve's inspirations](docs/research/inspiration.md) — RAI Roadrunner (lab), FrRonconi student two-leg/wheel balancer (maker-scale), Build Some Stuff / Serra (steal packaging; do not vendor), [Tazer](docs/research/tazer-lessons.md) (learn from the mistakes), [Stompy](docs/research/stompy-sim2real.md) (CAD/reality match; not RL walking for V1)

## License

[MIT](LICENSE)
