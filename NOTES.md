# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**). Layout: motor **at the wheel**; knee + hip-swing steppers **above the knee**; belts **one inside / one outside**. 2D must show that before Blender. FC stays TBD; do not block the print on electronics. Do not start this to skip research.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet).
- [ ] **Two-leg balance** teleop (TBS Nano RX + Wi‑Fi telem).
- [ ] **One-leg balance** — gate before any stair cycle.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No spend until Steve asks. Prefer parts already on hand.
- Do not lock an FC in docs to make the repo look finished.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.
- **Motor at the wheel** — not remote-driven from the hip. Do not hang knee / hip-swing steppers low. Do not invent a kV or pulley SKU. Do not drop CoG with heavy hip-roll actuators if avoidable.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R30 motor-at-wheel · R31 kV goal · R32 high steppers + in/out belts · R33 integrated pulley
- Mechanical layout: [`docs/mechanical.md`](docs/mechanical.md) · V1 checklist [`docs/checklists/mechanical-v1.md`](docs/checklists/mechanical-v1.md)
- Actuator baseline / electronics-minimum: concurrent packets — [`docs/electronics.md`](docs/electronics.md) · [`docs/electronics-minimum.md`](docs/electronics-minimum.md) when that lands
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2
