# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**). Mass is **aspirational** 4–5 lb / under 6 lb (OK to exceed for capability). FC stays TBD; do not block the print on electronics. Do not start this to skip research.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet).
- [ ] **Two-leg balance** teleop (TBS Nano RX + Wi‑Fi telem).
- [ ] **One-leg balance** — gate before any stair cycle.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No spend until Steve asks. Prefer parts already on hand. Do not buy a stepper, pulley set, FOC board, or encoder to fill a class.
- Do not lock an FC in docs to make the repo look finished.
- Do not treat under 6 lb as a hard gate. Do not put steppers on hip roll (or wheels) just to match the knees.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md) · legs [`docs/research/actuators-legs.md`](docs/research/actuators-legs.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R24 mass aspirational; R26 stepper+belt on knee/swing; R27 hip roll FOC/QDD; R28 all-stepper = risk
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2
