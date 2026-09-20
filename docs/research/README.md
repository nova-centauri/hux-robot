# Research first

Hux is still early R&D. **Study before we build.** Watch, read, extract control and stair heuristics, then decide what to adapt versus rewrite. Do not vendor James Bruton / [XRobots](https://github.com/XRobots) trees into this repo yet. Do not spend. Flight controller stays **TBD**.

This packet is the working study set. It does not replace [`../requirements.md`](../requirements.md) or [`../vision.md`](../vision.md).

| Doc | What it is |
| --- | --- |
| [xrobots.md](xrobots.md) | Curated XRobots shortlist, why each matters, study order |
| [roadrunner.md](roadrunner.md) | RAI Institute Roadrunner — lab wheeled biped; watch alongside Hattori |
| [study-plan.md](study-plan.md) | Phased checklist before hardware (Phases A–D) |

Inspiration already in requirements: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

Also watch (Steve share; not a build source): [RAI Institute — Roadrunner](roadrunner.md).

## Stance

1. **Learn the lineage** — RobotX (wheeled biped / dynamic balance), then TallBalancer and SonicRobot for IMU → PID → wheel-torque and remote patterns.
2. **Map stairs** — XRobots Stairs is a different mechanism. Steal heuristics, not geometry. Pair it with Hattori (and [Roadrunner](roadrunner.md)) for Hux's lift → one-leg balance → plant cycle on a **~9.5"** riser.
3. **Decide license + adapt vs rewrite** — Steve decides. Do not relicense Hux to absorb copyleft code, and do not pretend GPL/LGPL sources are MIT.
4. **Only then** print a wheel-leg fit-check. Mechanical V1 is Phase D, not the next commit.

No purchases until Steve asks. Prefer parts already on hand. Do not invent a BOM from upstream parts lists (SonicRobot's README is a study aid, not a Hux shopping list).

## How we cite and adapt upstream

Respect each upstream license. XRobots repos are **not** one license. RobotX is the copyleft tripwire for this phase.

### Cite

When a note, sketch, or later file is informed by upstream, record:

- Project name and org (`XRobots/RobotX`, Hattori STRIDE V2, RAI Roadrunner, …)
- URL (repo, playlist, or post)
- License as stated by the author **and** the `LICENSE` file if they disagree
- What we took (idea, heuristic, control topology) versus what we did **not** copy

### Study vs vendor

| Allowed now | Not allowed yet |
| --- | --- |
| Watch playlists, read CAD/code in *their* repos | Copy CAD, firmware, or large trees into Hux |
| Notes, diagrams, and checklists in `docs/research/` | Treat upstream parts lists as a Hux BOM |
| Rewrite a loop from understanding (clean-room) | Drop GPL/LGPL sources next to our MIT tree |
| Link and quote short facts with attribution | Relicense anyone's code, including Hux itself |

Vendoring or adapting code is a **Phase C** decision. Until Steve picks a path, this repo stays MIT documentation and empty layout.

### RobotX is GPL3 — implications for MIT Hux

Hux is [MIT](../../LICENSE) (Steve Barrett, 2026).

[XRobots/RobotX](https://github.com/XRobots/RobotX) README states:

> All CAD and code is licensed under GPL3.

The repo also ships an **LGPL-3.0** `LICENSE` file. GitHub therefore labels the repo LGPL-3.0. **Do not resolve that conflict in Hux's favor.** Conservative reading for this phase: treat RobotX CAD/code as **GPL-3.0** as the author wrote in the README, and treat the LGPL file as an unresolved ambiguity Steve must look at before any vendor/adapt.

If we later **vendor or adapt** RobotX (or other GPL) code into Hux:

- We **cannot** relicense that material as MIT.
- A combined Hux tree that includes GPL-3.0 code is typically distributable only under GPL-3.0 (copyleft applies to the derivative).
- Even if the LGPL file controls, modified RobotX sources stay copyleft; LGPL is not a free pass to relicense or to hide provenance.
- MIT Hux and GPL RobotX can coexist as **separate** repos we study. Mixing them in one tree is the problem.

**Do not relicense Hux (MIT → GPL) or relicense upstream (GPL → MIT) without Steve deciding.** Phase C exists so that decision is explicit.

Other copyleft in the shortlist (still study-only):

- [XRobots/SonicRobot](https://github.com/XRobots/SonicRobot) — GitHub license **GPL-2.0** (closest brushless + balance electronics lessons)
- [XRobots/BalancingStrandbeest](https://github.com/XRobots/BalancingStrandbeest) — **GPL-3.0** (optional)

Several secondary XRobots repos are MIT (TallBalancer, Stairs, YouCanBuildBiPed, BallWheels, BeltWheelRobot, Ball-BIke, Mid-Walker). MIT-to-MIT adaptation still needs attribution and a Phase C yes; it does not force Hux off MIT.

Watching, learning, and rewriting from understanding is the default path that keeps Hux MIT. Copying RobotX or SonicRobot sources is the path that forces a license decision.

## Out of scope for this packet

- Locking an FC
- A Hux BOM or shopping list
- Vendoring `XRobots/*`
- Starting the printable wheel-leg before Phase D
- Changing [`../vision.md`](../vision.md)
