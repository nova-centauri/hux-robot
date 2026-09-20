# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**), shareable with a **~10"** overall width. Hip roll noted or deferred (R16). FC stays TBD; do not block the print on electronics. Do not start this to skip research.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet).
- [ ] **Two-leg balance** teleop (TBS Nano RX + Wi‑Fi telem).
- [ ] **One-leg balance** — `LEFT_ONLY` / `RIGHT_ONLY` gate before any stair cycle. Full loop: hip roll (CoG over planted wheel) **and** that wheel fore/aft under the CoG. Reuse an existing control pattern (R18); do not invent a Hux stack. Hip roll TBD if mandatory for V1.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No spend until Steve asks. Prefer parts already on hand.
- Do not lock an FC in docs to make the repo look finished.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.
- Do not write a novel V1 balance controller. Study existing PID+IMU / FC attitude / torque patterns; TBD which we adopt.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R15 ~10" width · R16 hip roll (TBD V1) · R17 one-leg = hip-roll + wheel pitch · R18 reuse existing control
- Mechanical: [`docs/mechanical.md`](docs/mechanical.md) — width envelope, hip roll vs `LEFT_ONLY` / `RIGHT_ONLY`
- Software: [`docs/software.md`](docs/software.md) — one-leg loop sketch, reuse-don't-reinvent
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2
