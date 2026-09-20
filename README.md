# Hux

Early R&D for a **wheeled biped**: two legs that end in driven wheels.

**North star:** climb and descend stairs by stepping one wheel at a time. Nominal residential riser is **~9.5"**.

This repo is the source of truth for Steve Barrett's Hux project. It is a docs-and-layout scaffold — not a finished robot.

**Research first.** Study James Bruton / [XRobots](https://github.com/XRobots) and Hattori before hardware. Do not vendor upstream trees yet. RobotX is GPL3 — that conflicts with Hux's MIT if we adapt code; Steve decides, we do not relicense. Packet: [`docs/research/`](docs/research/).

## Status

| Item | State |
| --- | --- |
| Research | Packet in [`docs/research/`](docs/research/) — study before build |
| Requirements | Draft captured in [`docs/requirements.md`](docs/requirements.md) |
| Flight controller | **TBD** — candidates listed, not locked |
| Mechanical V1 | First printable wheel-leg is **Phase D** (after study). Not started. |
| Spend | None. No purchases until Steve asks. Prefer parts already on hand. |

First milestones live in [`NOTES.md`](NOTES.md).

## How it is supposed to work

Balance on two wheeled legs for teleop. Gate stair work behind one-leg balance. Then: lift one wheeled leg → balance on the planted wheel → place the raised wheel on the next tread (~9.5") → plant → repeat.

## Repo layout

```
docs/         requirements, vision, research, mechanical, electronics, software, checklists
NOTES.md      working notes and first milestones
cad/          printable / CAD parts (empty)
firmware/     FC / embedded bring-up (empty)
software/     companion compute — Pi cameras / pathfinding (empty)
```

## Docs

- [Research](docs/research/) — research-first stance, XRobots shortlist, study plan (Phases A–D)
- [Requirements](docs/requirements.md) — hard/soft requirements, candidate hardware, no-spend rule
- [Vision](docs/vision.md) — stair gait, split-brain intent, lessons to steal
- [Mechanical](docs/mechanical.md) — wheel-leg, linkages + springs, 9.5" stroke
- [Electronics](docs/electronics.md) — FC TBD, TBS Nano RX, brushless wheels, Wi‑Fi telem, Pi
- [Software](docs/software.md) — blink → spin → balance → cameras later
- [Checklists](docs/checklists/) — prefer these over fake finished stacks

## Inspiration

Study before we copy. Licenses differ; RobotX is GPL3.

- [docs/research/xrobots.md](docs/research/xrobots.md) — James Bruton / [XRobots](https://github.com/XRobots) shortlist ([RobotX](https://github.com/XRobots/RobotX), [TallBalancer](https://github.com/XRobots/TallBalancer), [SonicRobot](https://github.com/XRobots/SonicRobot), [Stairs](https://github.com/XRobots/Stairs))
- [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2)

## License

[MIT](LICENSE)
