# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori + Steve's X-share inspirations (Roadrunner + FrRonconi student balancer) per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve. Roadrunner is a lab RL demo; the student clip is closer vibe — neither is a Hux stack.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**). FC stays TBD; do not block the print on electronics. Do not start this to skip research.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet).
- [ ] **Two-leg balance** teleop (TBS Nano RX + Wi‑Fi telem).
- [ ] **One-leg balance** — gate before any stair cycle.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No spend until Steve asks. Prefer parts already on hand. Do not buy a LiPo, wheel, or actuator “to make progress.”
- Do not lock an FC in docs to make the repo look finished.
- Do not lock hip / knee actuators or a wheel SKU. Classes and a ~6" hypothesis only.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · inspirations [`docs/research/inspiration.md`](docs/research/inspiration.md) · Roadrunner [`docs/research/roadrunner.md`](docs/research/roadrunner.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R10 electric-only · R11 4S LiPo class · R12 hip+knee TBD · R13 ~4–6" skinny rubber
- Electronics battery: [`docs/electronics.md`](docs/electronics.md) — 4S LiPo intent, power bus TBD, no PDB/BEC BOM
- Mechanical: [`docs/mechanical.md`](docs/mechanical.md) — ~6" hypothesis, hip/knee classes, stroke owns 9.5"
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) · Steve X shares in [`docs/research/inspiration.md`](docs/research/inspiration.md) (Roadrunner + FrRonconi student balancer; not a build source)
