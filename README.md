# Hux

Early R&D for a **wheeled biped**: two legs that end in driven wheels.

**North star:** climb and descend stairs by stepping one wheel at a time. Design riser target is **~9.5"**; actual stair geometry must be measured.

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
| Compute | **Four layers** (2026-09-26): CAN actuators → portable control core → CAN real-time MCU (Teensy 4.1 / H743-class, not bought) → ROS 2 companion (Pi 5 now, Jetson at P5). F765-Wing is a bench board. |
| Actuators | **Temporary lock (2026-09-26):** 4× RobStride 02, 2× RS00, 2× RS05 — `tools/living-drawings/actuators.js` feeds every model. Not ordered. Mass picture now **7.75 kg**; hip roll axes must come in to **≤ 3"**. |
| Power | **8S** (decided 2026-09-26: 4S → 6S → 8S once the actuator voltage floor was checked), one 3300 mAh pack, XT90 / XT90-S, step-down rails |
| Mechanical V1 | First wheel-leg is **Phase D** (after study + 2D). Not started. **~24" × ~14"**, carbon-tube spars. Head inside, wheels outside. |
| Modes | `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY` before autonomy |
| Spend | First buy is tires, tubes, carbon tube, the Teensy 4.1 CAN MCU kit, XT90-S anti-spark, and one 8S 3300 mAh pack ([`docs/bom.md`](docs/bom.md)). 5" walker wheels already ordered as a bench donor. Wheel size **settled at 6" OD**. Motors not authorized. |
| Parts on hand | Inventory in [`docs/parts-on-hand.md`](docs/parts-on-hand.md) — owned ≠ reserved |
| Shop / fab | Tools (not parts) in [`docs/capabilities.md`](docs/capabilities.md) — mill, lathe, weld; fab welcome |

First milestones live in [`NOTES.md`](NOTES.md).

## How it is supposed to work

Balance on two wheeled legs for teleop. Gate stair work behind one-leg balance (hip roll **in V1** + planted-wheel fore/aft). Then: lift one wheeled leg → balance on the planted wheel → place the raised wheel on the next tread (~9.5") → plant → repeat.

## Repo layout

```
docs/         requirements, decisions, vision, research, mechanical, electronics, software, checklists
NOTES.md      working notes and first milestones
cad/          printable / CAD parts (empty — 2D before Blender)
tools/living-drawings/   drawings (index.html), 3D sandbox (sim.html), data flow (flow.html), software (software.html), hardware (hardware.html), media (media.html)
art/          exploratory concept renders and rough meshes — not CAD
firmware/     FC / embedded bring-up (empty)
software/     companion compute — Pi cameras / pathfinding (empty)
```

## Docs

- [Decisions](docs/decisions.md) — dated log from #1 onward; standing merge rule
- [Research](docs/research/) — research-first stance, XRobots shortlist, inspiration shares, actuator trade, study plan (Phases A–D)
- [Requirements](docs/requirements.md) — hard / soft requirements, candidate hardware, no-spend rule
- [Vision](docs/vision.md) — stair gait, split-brain intent, lessons to steal
- [Mechanical](docs/mechanical.md) — carbon-tube spars, ~24" × ~14", in-wheel FOC, hip roll in V1, servo vs stepper TBD, ~2× plant load. Leg math: [research/leg-geometry.md](docs/research/leg-geometry.md)
- [Electronics](docs/electronics.md) — 8S + step-down, CAN actuator bus, CAN real-time MCU (F765 is bench only), TBS Nano RX, in-wheel FOC, 8 CAN nodes
- [Minimum electronics](docs/electronics-minimum.md) — P0–P5 class list (no SKU, no new spend)
- [Parts on hand](docs/parts-on-hand.md) — owned / ordered inventory + candidates (GIM8108-8 not ordered)
- [First buy](docs/bom.md) — 6×1.25 tires, tubes, 16 mm carbon tube, Teensy 4.1 CAN kit, anti-spark, one pack (voltage pending). Actuators shortlisted, not on this list: [actuator shortlist](docs/research/actuator-shortlist.md).
- [Living drawings](tools/living-drawings/index.html) — side, top and front views of the settled leg, and the stair climb with its dynamics (momentum window, wheel catch, joint torques, sway). Play runs the climb in real time. Findings: [research/stair-climb-dynamics.md](docs/research/stair-climb-dynamics.md)
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
