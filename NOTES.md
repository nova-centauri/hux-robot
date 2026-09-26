# Notes

Working notes. Tick boxes only when the work is real.

**Decisions (SoT log):** [`docs/decisions.md`](docs/decisions.md) — merge docs PRs promptly; keep `main` current; log each merge there.

## How Hux bot helps

Steve, 2026-09-22. **Advisory / tracking / brainstorming / adversarial opinions.** Not a large-task executor.

This repo is the source of truth for plans. Hux bot keeps planning notes current. It does **not** drive CAD, firmware, builds, or spend unless Steve asks for something specific.

## First milestones

- [x] **Create SoT** — this repo (`nova-centauri/hux-robot`) holds the scaffold + Steve's requirements.
- [ ] **Research first** — study XRobots + Hattori + Steve's inspirations (Roadrunner, FrRonconi student balancer, Serra / Build Some Stuff, **Tazer mistakes**, **Stompy CAD/reality**, **Diablo**) per [`docs/research/`](docs/research/). Phases A–C before any print. No vendoring. RobotX is GPL3; do not relicense Hux (MIT) without Steve. Steal Serra *packaging* (in-wheel BLDC+encoder, CoG-over-contact, serviceable prints, wheel-under-CoG) — not their files. Roadrunner is a lab RL demo; the student clip is closer vibe — neither is a Hux stack. Tazer is anti-patterns (wrong first motors, TPU tires, skinny power, LQR-too-early). Stompy is CAD/home-pose / sim lockstep — **not** an RL-walking requirement (R18). Diablo: LQR/PID before RL, DD/QDD as a *class*; **do not buy**. Tazer / Stompy / Diablo notes and the living-drawings / stair-climb-dynamics work are already on `main`.
- [ ] **2D layouts, then first wheel-leg** for a **9.5" × 9.5"** step (**Phase D**) — **carbon-tube** upper / lower spars + printed / machined end fittings, inside **~24" tall / ~14" wide**. Head inside, wheels and legs outside the head. Settled draw: **7.5" + 7.5"** tubes, **6" × ~1.25"** real rubber, hip over the axle ([`docs/research/leg-geometry.md`](docs/research/leg-geometry.md)). Size plant-side joints for **~2×** one-leg load. The MCU follows the actuators; do not block the print on electronics. Do not start this to skip research. Do not buy tube, a tire, or a GIM8108 to fill a class. **No Blender before 2D** (R23).
- [ ] **Real-time MCU with CAN** — Teensy 4.1-class or H743-WING-class, picked with the actuators. F765 Wing / F722 Wing / F722 drone / Mamba F405 are bench boards (no CAN). Record which board runs `TWO_WHEEL` in [`docs/electronics.md`](docs/electronics.md).
- [ ] **Layer-2 skeleton** — `hux_control` library builds and passes tests on the host before any board is flashed ([`docs/software.md`](docs/software.md)).
- [ ] **Blink, then spin** — LED on the bench FC, then a restrained in-wheel brushless FOC (not on carpet).
- [ ] **Manual modes** — `PARKED` → `TWO_WHEEL` → `LEFT_ONLY` → `RIGHT_ONLY` from TBS **before** any autonomy.
- [ ] **Two-leg balance** teleop (TBS Nano RX + telem). Classical / reused control (R18). Not an RL gate.
- [ ] **One-leg balance** — V1 **best-effort** CoG shift (hip roll + planted-wheel fore/aft). Gate before any stair cycle. May not work as hoped; still ship the joint and the modes. The same wheel loop is the stair **catch**: lean back an inch on the floor and let the wheel bring the base under, before any step ([`docs/research/stair-climb-dynamics.md`](docs/research/stair-climb-dynamics.md)). **2026-09-26 study** ([`docs/research/one-leg-stance.md`](docs/research/one-leg-stance.md)): the shift and the ~8–15% poise are real; a *static* one-wheel stand is an acrobot with 2–3 mm of capture region on this geometry and is not a V1 capability. The gate the stair needs is a timed hop — poise at ~8%, free wheel up ≤ 0.3 s, land, return — not a hold. Steve to decide whether that replaces this milestone's wording.
- [ ] **Open-loop step** toward a 9.5" riser fixture. Not before the four modes work.
- [ ] **Cameras later** — one teleop stream, then Pi pathfinding. Not on the FC.
- [ ] **Digital twin + dojo (horizon)** — identical CAD / URDF twin, then a training dojo (ML/RL) so a policy trained in sim can run locally. Domains later: stairs, rubble, dirt, fall leaves, wet mud. **After** modes and classical balance. **Not a V1 gate.** **Pipeline TBD** (Isaac / MuJoCo / mjlab / other) — lock the contract first (CAD lockstep, observation parity, motorcycle-crown tire contact, firmware zeros). Do not stand up Isaac Lab or buy a 4090 before `TWO_WHEEL`. See [`docs/software.md`](docs/software.md) and [`docs/decisions.md`](docs/decisions.md) (2026-09-25). The living-drawings **3D sandbox** (Rapier) is a design toy built from the 2D numbers, not this twin.
- [ ] **Open from the 3D sandbox** ([`docs/research/sim-sandbox.md`](docs/research/sim-sandbox.md)) — Steve's calls: (1) PARKED has no rest pose; skid / kickstand / sit pose? (2) 1" sills: measure the real ones (the sandbox now hops 1" from 0.5–1.0 m/s with virtual leg springs). (3) Keep **75% ride** as the design driving stance, or only as the sandbox default? (4) Virtual suspension + impact hop need **torque-controlled, backdrivable** knee / hip swing (FOC / QDD) or real springs; does that settle servo vs stepper+belt? (5) Is static one-leg standing needed for stairs, or is dynamic single support enough? **Answered 2026-09-26** ([`docs/research/one-leg-stance.md`](docs/research/one-leg-stance.md)): static is not available on this geometry; dynamic single support works for flights ≤ 0.3 s from a ±20 mm CoM estimate (≤ 0.5 s with ±5 mm or a one-shot hip swing). The sandbox lands and returns a 0.2 s hop; longer hops land but the return is unfinished controller work. New open calls: (6) hip roll sizing — 8.3 N·m continuous hold and 12–13 N·m peak at the 5.4" hips, above a GIM8108-class nominal; move the hips inboard (3.5" → 5.4 N·m, 17° shift) or size up? **Recommendation (stack session, same day): hips in to ≤ 3.5" and RobStride 02 on roll; RS06 only if the layout cannot get there** ([`docs/research/actuator-shortlist.md`](docs/research/actuator-shortlist.md)). Steve to confirm with the 2D layout. (7) does the stair trajectory fit a ≤ 0.3 s trailing-wheel flight? Not blocking the first buy.

## Constraints (do not “helpfully” violate)

- Research before hardware. Packet: [`docs/research/`](docs/research/).
- First buy is open: 6×1.25 tires, tubes, 16 mm carbon tube, the **Teensy 4.1 CAN MCU kit + XT90-S anti-spark** (2026-09-26), and **one 8S 3300 mAh 50–60C LiPo w/ XT90** (8S confirmed 2026-09-26 — [`docs/research/actuator-shortlist.md`](docs/research/actuator-shortlist.md)) ([`docs/bom.md`](docs/bom.md)). No motors yet. Do **not** expand that order-now cart. 5" Zantle wheels already ordered — bench donor, not the foot ([`docs/parts-on-hand.md`](docs/parts-on-hand.md)). Wheel size is **settled at 6" OD**.
- **Inventory does not drive design.** Parts on hand inform options. Prefer the correct actuator / wheel over the shelf part.
- Want **high-bandwidth FOC / QDD / model-based** control where it matters (wheels, hip roll). No vendor lock.
- Digital twin + training dojo is the **long-term horizon**, after modes and classical balance. Do not replace R18 with an RL gate.
- Do not build robot firmware on the F765-Wing; it is a bench board.
- Knee / hip swing: **CAN QDD is the working class** on 8S; servo or stepper+belt is the fallback. Size for one-leg (~2×) load. **GIM8108-8** is a candidate, not an order.
- **Hip roll is in V1** (dynamic FOC / QDD / fast servo), even if imperfect. Not a stepper. Not V2.
- Size plant-side joints for **one-wheel standing load (~2×)**, not two-wheel average.
- **8S** (2026-09-26: 4S → 6S → 8S, because the RobStride 00/01/02 floor is 24 V); one 3300 mAh pack; **step down** 5 V and 12–19 V rails, regulators rated ≥36 V in. No regulator SKU.
- **Actuator bus is CAN; the bus picks the real-time MCU.** F765-Wing has no CAN — bench board for P0–P1 only. Control core is a portable C++ library that runs on the MCU, the companion and the twin. ROS 2 on the companion, not the MCU. Jetson is a P5 perception buy. See [`docs/software.md`](docs/software.md).
- **If the stepper fallback:** the MCU does not drive coils. A driver board on CAN / step-dir.
- Do not treat 4–5 lb / under 6 lb as a mass gate. Capability and packaging win; those numbers are historical preference.
- Do not lock a carbon-tube SKU, GIM8108, or belt pitch. Classes only.
- Do not vendor XRobots or Serra trees, or relicense (MIT Hux vs GPL3 RobotX / CC BY-NC-ND PCB) unless Steve decides.
- Prefer [`docs/checklists/`](docs/checklists/) over fake stacks, fake BOMs, and fake CAD.

## Pointers

- Decisions: [`docs/decisions.md`](docs/decisions.md)
- Research: [`docs/research/README.md`](docs/research/README.md) · shortlist [`docs/research/xrobots.md`](docs/research/xrobots.md) · inspirations [`docs/research/inspiration.md`](docs/research/inspiration.md) · Roadrunner [`docs/research/roadrunner.md`](docs/research/roadrunner.md) · Tazer [`docs/research/tazer-lessons.md`](docs/research/tazer-lessons.md) · Stompy [`docs/research/stompy-sim2real.md`](docs/research/stompy-sim2real.md) · actuators [`docs/research/actuators-legs.md`](docs/research/actuators-legs.md) · **leg geometry** [`docs/research/leg-geometry.md`](docs/research/leg-geometry.md) · **stair dynamics** [`docs/research/stair-climb-dynamics.md`](docs/research/stair-climb-dynamics.md) (run `node tools/living-drawings/kin.js` for the self-test and summary) · **3D sandbox** [`tools/living-drawings/sim.html`](tools/living-drawings/sim.html), findings [`docs/research/sim-sandbox.md`](docs/research/sim-sandbox.md) (`cd tools/living-drawings && npm install && npm test`) · **one-leg stance** [`docs/research/one-leg-stance.md`](docs/research/one-leg-stance.md) (`node tools/living-drawings/frontal.js`) · plan [`docs/research/study-plan.md`](docs/research/study-plan.md)
- XRobots: https://github.com/XRobots · RobotX (GPL3): https://github.com/XRobots/RobotX
- Requirements: [`docs/requirements.md`](docs/requirements.md) — R10 electric-only · R11 8S + step-down · R12 servo vs stepper TBD · R13 **6" OD** locked (Zantle is a bench donor) · R14 modes · R16 hip roll in V1 · R24 mass soft · R34 carbon tubes · R35 ~24" · R36 ~2× plant
- Parts on hand: [`docs/parts-on-hand.md`](docs/parts-on-hand.md) (GIM8108-8 in Candidates) · shop tools [`docs/capabilities.md`](docs/capabilities.md)
- Electronics: [`docs/electronics.md`](docs/electronics.md) · minimum [`docs/electronics-minimum.md`](docs/electronics-minimum.md)
- Mechanical: [`docs/mechanical.md`](docs/mechanical.md) — carbon tubes, ~24" × ~14", in-wheel FOC, hip roll in V1, servo vs stepper TBD
- Software: [`docs/software.md`](docs/software.md) — modes + one-leg loop + reuse-control; twin / dojo is a later horizon
- Vision: [`docs/vision.md`](docs/vision.md) — stairs + modes near; digital twin + RL dojo long
- Inspiration: [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) · Steve shares in [`docs/research/inspiration.md`](docs/research/inspiration.md) (Roadrunner + FrRonconi + Serra + Tazer + Stompy + Diablo)
