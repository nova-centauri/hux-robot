# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori + Serra per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve. Steal Serra *packaging* (in-wheel BLDC+encoder, CoG-over-contact, serviceable prints, wheel-under-CoG) — not their files.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**). FC stays TBD; do not block the print on electronics. Do not start this to skip research.
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
- Do not lock knee/hip swing to steppers or servos. **Servo vs stepper+belt TBD** — both open, no lean. Size either for one-leg (~2×) load.
- Size plant-side joints for **one-wheel standing load (~2×)**, not two-wheel average.
- 4S preferred; **step down** pose/logic rails so wheel FOC does not brown them out. No BEC SKU.
- Do not vendor XRobots or Serra trees, or relicense (MIT Hux vs GPL3 RobotX / CC BY-NC-ND PCB) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md) · Serra [`docs/research/inspiration.md`](docs/research/inspiration.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R11 4S+step-down · R12 servo vs stepper TBD · R14 ~2× plant load
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2 · https://www.youtube.com/watch?v=K1lzzVGCzAQ
