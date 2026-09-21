# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve.
- [ ] **First wheel-leg** for a **~9.5"** step (**Phase D**) — **carbon-tube** upper/lower spars + printed/machined end fittings, inside **~24" tall / ~10" wide**. FC stays TBD; do not block the print on electronics. Do not start this to skip research. Do not buy tube or a GIM8108 to fill a class.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet).
- [ ] **Two-leg balance** teleop (TBS Nano RX + Wi‑Fi telem).
- [ ] **One-leg balance** — gate before any stair cycle.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No **new** spend until Steve asks. Prefer parts already on hand. 5" wheels already ordered — document only ([`docs/parts-on-hand.md`](docs/parts-on-hand.md) when that lands).
- Do not lock an FC in docs to make the repo look finished.
- Do not lock a carbon-tube SKU, GIM8108, or belt pitch. Classes only.
- Do not treat 4–5 lb / under 6 lb as a mass gate. Capability and packaging win; those numbers are historical preference.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R34 carbon-tube spars · R35 ~24" height · R24 mass soft / blown
- Parts on hand: [`docs/parts-on-hand.md`](docs/parts-on-hand.md) · shop tools [`docs/capabilities.md`](docs/capabilities.md) (not parts; fab welcome) — when those packets land
- Mechanical: [`docs/mechanical.md`](docs/mechanical.md) — carbon tubes, ~24" × ~10", longer belts, CoG, GIM8108-class **or** servo/stepper TBD
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2
