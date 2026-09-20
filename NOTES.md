# Notes

Working notes. Tick boxes only when the work is real.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve.
- [ ] **First printable wheel-leg** for a **~9.5"** step (**Phase D**). FC stays TBD; do not block the print on electronics. Do not start this to skip research.
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [x] **Minimum electronics (docs)** — classes + P0–P5 in [`docs/electronics-minimum.md`](docs/electronics-minimum.md). No spend. No SKU. **FC TBD.**
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained brushless wheel (not on carpet). P0 → P1.
- [ ] **Two-leg balance** teleop (`PARKED` / `TWO_WHEEL`; TBS Nano RX). P2. Wi‑Fi telem can wait.
- [ ] **One-leg balance** — `LEFT_ONLY` / `RIGHT_ONLY` after hip-roll class is on the bench (P4). Gate before any stair cycle.
- [ ] **Open-loop step** toward a 9.5" riser fixture.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No spend until Steve asks. Prefer parts already on hand. Do not invent a custom PCB unless COTS fails ([`docs/electronics-minimum.md`](docs/electronics-minimum.md)). Do not invent a custom PCB unless COTS fails ([`docs/electronics-minimum.md`](docs/electronics-minimum.md)).
- Do not lock an FC in docs to make the repo look finished.
- Do not vendor XRobots trees or relicense (MIT Hux vs GPL3 RobotX) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md)
- Electronics: [`docs/electronics.md`](docs/electronics.md) — FC TBD · minimum plan [`docs/electronics-minimum.md`](docs/electronics-minimum.md)
- Software modes: [`docs/software.md`](docs/software.md) — `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: https://www.alex-hattori.com/blog/wheeled-biped-v2
