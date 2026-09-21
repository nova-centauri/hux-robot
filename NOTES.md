# Notes

Working notes. Tick boxes only when the work is real.

**Decisions (SoT log):** [`docs/decisions.md`](docs/decisions.md) — merge docs PRs promptly; keep `main` current; log each merge there.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori + Steve's inspirations (Roadrunner, FrRonconi student balancer, Serra / Build Some Stuff) per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve. Steal Serra *packaging* (in-wheel BLDC+encoder, CoG-over-contact, serviceable prints, wheel-under-CoG) — not their files. Roadrunner is a lab RL demo; the student clip is closer vibe — neither is a Hux stack.
- [ ] **2D layouts, then first wheel-leg** for a **~9.5"** step (**Phase D**) — **carbon-tube** upper / lower spars + printed / machined end fittings, inside **~24" tall / ~10" wide**. Size plant-side joints for **~2×** one-leg load. FC stays TBD; do not block the print on electronics. Do not start this to skip research. Do not buy tube or a GIM8108 to fill a class. **No Blender before 2D** (R23).
- [ ] **FC TBD** — still not locked. Candidates: F765 Wing / F722 Wing / F722 drone / Mamba F405. Record the bench choice in [`docs/electronics.md`](docs/electronics.md) when one actually blinks.
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained in-wheel brushless FOC (not on carpet).
- [ ] **Manual modes** — `PARKED` → `TWO_WHEEL` → `LEFT_ONLY` → `RIGHT_ONLY` from TBS **before** any autonomy.
- [ ] **Two-leg balance** teleop (TBS Nano RX + telem).
- [ ] **One-leg balance** — V1 **best-effort** CoG shift (hip roll + planted-wheel fore/aft). Gate before any stair cycle. May not work as hoped; still ship the joint and the modes.
- [ ] **Open-loop step** toward a 9.5" riser fixture. Not before the four modes work.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- No **new** spend until Steve asks. Prefer parts already on hand. 5" Zantle wheels already ordered — document only ([`docs/parts-on-hand.md`](docs/parts-on-hand.md)).
- Do not lock an FC in docs to make the repo look finished.
- Do not lock knee / hip swing to steppers or servos. **Servo vs stepper+belt TBD** — both open, no lean. Size either for one-leg (~2×) load. **GIM8108-8** is a candidate, not an order.
- **Hip roll is in V1** (dynamic FOC / QDD / fast servo), even if imperfect. Not a stepper. Not V2.
- Size plant-side joints for **one-wheel standing load (~2×)**, not two-wheel average.
- 4S preferred; **step down** pose / logic rails so wheel FOC does not brown them out. No BEC SKU.
- **If steppers:** FC does not drive stepper coils. Stepper drivers / Pi for pose.
- Do not treat 4–5 lb / under 6 lb as a mass gate. Capability and packaging win; those numbers are historical preference.
- Do not lock a carbon-tube SKU, GIM8108, or belt pitch. Classes only.
- Do not vendor XRobots or Serra trees, or relicense (MIT Hux vs GPL3 RobotX / CC BY-NC-ND PCB) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Decisions: [`docs/decisions.md`](docs/decisions.md)
- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · inspirations [`docs/research/inspiration.md`](docs/research/inspiration.md) · Roadrunner [`docs/research/roadrunner.md`](docs/research/roadrunner.md) · actuators [`docs/research/actuators-legs.md`](docs/research/actuators-legs.md) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R10 electric-only · R11 4S + step-down · R12 servo vs stepper TBD · R13 5" preferred · R14 modes · R16 hip roll in V1 · R24 mass soft · R34 carbon tubes · R35 ~24" · R36 ~2× plant
- Parts on hand: [`docs/parts-on-hand.md`](docs/parts-on-hand.md) (GIM8108-8 in Candidates) · shop tools [`docs/capabilities.md`](docs/capabilities.md)
- Electronics: [`docs/electronics.md`](docs/electronics.md) · minimum [`docs/electronics-minimum.md`](docs/electronics-minimum.md)
- Mechanical: [`docs/mechanical.md`](docs/mechanical.md) — carbon tubes, ~24" × ~10", in-wheel FOC, hip roll in V1, servo vs stepper TBD
- Software: [`docs/software.md`](docs/software.md) — modes + one-leg loop + reuse-control
- Vision: [`docs/vision.md`](docs/vision.md)
- Inspiration: [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) · Steve shares in [`docs/research/inspiration.md`](docs/research/inspiration.md) (Roadrunner + FrRonconi + Serra)
