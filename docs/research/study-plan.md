# Study plan (before hardware)

Phased research checklist. Tick only when the work is real. **No spend** until Steve asks. **FC stays TBD.** Printable wheel-leg is **Phase D**, not Phase A.

Track milestones in [`../../NOTES.md`](../../NOTES.md). Shortlist and links: [`xrobots.md`](xrobots.md). Steve inspirations (Roadrunner + FrRonconi student balancer + Serra / Build Some Stuff + Tazer + Stompy + Diablo): [`inspiration.md`](inspiration.md). Roadrunner detail: [`roadrunner.md`](roadrunner.md). Stompy CAD→sim→real: [`stompy-sim2real.md`](stompy-sim2real.md). Diablo wheeled-leg: [`diablo.md`](diablo.md). Actuator trade: [`actuators-legs.md`](actuators-legs.md). Leg math: [`leg-geometry.md`](leg-geometry.md). Cite/adapt rules: [`README.md`](README.md). Decision log: [`../decisions.md`](../decisions.md).

## Gates

| Until this is done | Do not start |
| --- | --- |
| Phase A notes (loops + remotes) | Phase B stair mapping as “done” |
| Phase B 9.5" cycle sketch | Treating Stairs CAD as Hux geometry |
| Phase C (adapt vs rewrite + license) | Vendoring any `XRobots/*` tree |
| Phase D | Buying parts, locking an FC, opening Blender before 2D, or claiming Mechanical V1 started |

Prefer parts already on hand. Upstream READMEs (especially SonicRobot) are **not** a Hux BOM.

---

## Phase A — Watch / read bring-up; extract loops

**Goal:** understand IMU → PID → wheel torque and remote patterns from RobotX, TallBalancer, and SonicRobot.

- [ ] Watch [RobotX playlist](https://www.youtube.com/playlist?list=PLpwJoq86vov-C5SldDA-AhxesVHPRk74x) and the [open-source release video](https://www.youtube.com/watch?v=AQGueBqJt3g).
- [ ] Read [XRobots/RobotX](https://github.com/XRobots/RobotX) `ArduinoCode_current/` (`IMU_*`, `RobotX020` / `RobotX201a`, remotes). Note GPL3 README vs LGPL `LICENSE` file; do not vendor.
- [ ] Watch [TallBalancer](https://youtu.be/VYU8CRTD2cA). Read `Code/pos_hold` and `Code/vel_hold` ([MIT](https://github.com/XRobots/TallBalancer)).
- [ ] Watch [SonicRobot playlist](https://www.youtube.com/playlist?list=PLpwJoq86vov_tZ3rsMCH5sylqGT5s9TcU) bring-up. Read `ARobot08/`, `Remote017/`, `Scale01/` ([GPL-2.0](https://github.com/XRobots/SonicRobot)). Study only; no shopping from the README.
- [ ] Watch the [FrRonconi student two-leg/wheel balancer](inspiration.md) (Steve X share). Maker-scale, 3-month first prototype — closer Hux vibe than lab Roadrunner. **Inspiration only.** Extract: what a small-team two-leg/wheel balance demo looks like. Not a stack. FC TBD.
- [ ] Watch [Build Some Stuff / Kelton Serra](inspiration.md). Steal packaging (in-wheel BLDC+encoder, CoG-over-contact, serviceable prints, wheel-under-CoG). **Do not vendor files.** Not stairs. Knee / hip swing stay **servo vs stepper+belt TBD**.
- [ ] Watch [Tazer — My Robot almost got me Kicked out of Uni](tazer-lessons.md). **Learn from the mistakes** (wrong first motors, TPU tires, skinny power / logic-PCB bus, CAN termination, LQR-too-early, no homing, carbon dust). Not a stack. Do not buy GIM8108 or 48 V because he did.
- [ ] Watch [Stompy — I Trained a Robot in Simulation. Then I Made It Walk.](stompy-sim2real.md). Steal CAD/reality match: fixture / home pose, dual-encoder zero at the **CAD** pose, measure-vs-CAD, tether, default angles in CAD **and** firmware. Walking ≠ Hux. **Do not require RL walking for V1.** Keep reuse simple balance (R18). Sim later for geometry / stairs — **not** day-one wheel balance.
- [ ] Watch [ETA Prime — Diablo](diablo.md) and skim [arXiv:2407.21500](https://ar5iv.labs.arxiv.org/html/2407.21500). Steal: split brain (Pi vs motor board), DD/QDD as a *class*, **LQR/PID before RL**, height as named states, aux contact later, payload vs posture. **Do not buy Diablo.** Not 22 kg. No head / cargo V1. Keep R18. Hardware **TBD**. Shop / SDK are a cite, not a cart.

**Extract (write notes here or in [`../../NOTES.md`](../../NOTES.md)):**

- [ ] Control loops: IMU (MPU6050 / GY-521 class) → filter/fusion → pitch/roll error → **PID** → wheel command (torque / velocity / current — record which). **Reuse existing patterns** (R18) — do not invent a Hux stack in this phase. Tazer: LQR-on-a-bad-model wasted time; PID cascade is what balanced. Diablo: model-based LQR worked *because* the plant was high-bandwidth DD — still **not** a V1 LQR project.
- [ ] Torque-bandwidth vs continuous power for the **wheel** as a balance actuator (R25). Mass class is **soft** (R24) — still do not shop SonicRobot 63xx / hoverboard iron.
- [ ] Outer hold: TallBalancer position hold vs velocity hold; what the encoder buys vs the IMU.
- [ ] SonicRobot extras: load cells in the loop; ODrive + Teensy split; estop / RST; CAN vs UART to drives.
- [ ] Remote patterns: RobotX TX/RX sketches; SonicRobot nRF remote; what the stick maps to (tilt setpoint, speed, yaw). Hux RX is **TBS Nano** — steal *semantics*, not the radio.
- [ ] Bring-up order they actually used (IMU zero, drive calibrate, restrained spin). Map onto [`../checklists/electronics-bringup.md`](../checklists/electronics-bringup.md) later — do not flash a Hux FC in this phase. Stompy add-on: a **stand that is the CAD home**, encoders zeroed there, belt/tether on first move.

**Done when:** we can explain the balance loop and remote overlay in our own words, with citations, without a copy of their firmware in this repo.

---

## Phase B — Map Stairs + Hattori (+ Roadrunner) onto Hux's 9.5" cycle

**Goal:** a Hux-shaped step cycle, not a clone of either machine.

Hux cycle (from [`../vision.md`](../vision.md)): **lift → 1-leg balance → plant** on a **~9.5"** riser.

- [ ] Watch [XRobots/Stairs](https://github.com/XRobots/Stairs) ([video](https://youtu.be/MUyFDWbXrZ0)). Different mechanism. List **heuristics only** (timing, commit-to-step, missed tread, sensors vs open-loop).
- [ ] Re-read [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) (already in requirements): extra DOF, serial/linkage knee vs parallel, wheel diameter, open-loop swing-leg stepping.
- [ ] Watch [RAI Roadrunner](roadrunner.md) **alongside Hattori** (RAI page + [YouTube](https://www.youtube.com/watch?v=9kae-UAME1U); listed in [inspiration.md](inspiration.md)). Extract: one-wheel balance as a gate; drive vs step; knee symmetry for up/down. **Lab RL policy stack — not our maker path** (XRobots + TBD FC). No CAD/code to vendor.
- [ ] If / when a Hux model exists for **geometry or the 9.5" cycle** (not day-one wheel balance): keep CAD → exported model → whatever script uses it in lockstep. Stompy: a foot-geometry change forced CAD + URDF + sim + **retrain**. See [stompy-sim2real.md](stompy-sim2real.md). Do **not** stand up an RL walker to tick this.
- [ ] Measure or note a **real** ~9.5" riser/fixture (height, tread, nosing) when Steve has one — still no print.
- [ ] Note Diablo standing / squat / creep as **height-as-state** existence (plus ~8 cm curb / jump). That does **not** add Hux modes. V1 stays `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`. Aux contact and payload-vs-height are later, not this cycle.
- [ ] Sketch Hux step-up and step-down as states, not CAD:

  1. Two-leg balance (teleop baseline — `TWO_WHEEL`).
  2. One-leg balance **gate** (`LEFT_ONLY` / `RIGHT_ONLY`): hip roll **in V1** + planted-wheel fore/aft (R16 / R17).
  3. Lift wheeled leg (stroke / clearance toward 9.5" inside a **~24"** full-extension envelope).
  4. Hold on planted wheel (Phase A loop under a narrower support). Size plant-side joints for **~2×** load (R36).
  5. Place raised wheel on next tread.
  6. Transfer / plant. Repeat.

- [ ] Mark which states can stay **open-loop** on a fixture (Hux milestone: open-loop step) vs which need closed-loop balance.
- [ ] Note one-leg balance risks on a nosing (BallWheels / BeltWheel / Ball-BIke are optional edge-case reading).

**Done when:** the 9.5" cycle is written as Hux states with citations to Stairs + Hattori (+ Roadrunner for one-wheel / multimodal / knee-symmetry heuristics), and we have explicitly said Stairs geometry is **not** Hux geometry.

---

## Phase C — Adapt vs rewrite; FC TBD; license

**Goal:** Steve-owned decisions. Nothing ships into `firmware/` or `cad/` from upstream until this is ticked.

- [ ] **Adapt vs rewrite** — for each Primary source, pick one:
  - **Study only / rewrite** (default; keeps Hux MIT)
  - **Adapt later** (cite, keep license file, only if license allows)
  - **Vendor** (explicit no for now; never a whole XRobots tree in this phase)
- [ ] **License decision (Steve):** Hux is MIT. RobotX is GPL3 per README (LGPL file unresolved). SonicRobot is GPL-2.0. **Do not relicense Hux or upstream without Steve.** Options to record:
  - Keep Hux MIT — study + clean-room rewrite only; MIT XRobots repos optional later with attribution.
  - Dual-repo / plugin — copyleft firmware lives elsewhere, Hux stays MIT docs + original code.
  - Relicense Hux to GPL-3.0 if we truly vendor RobotX — **Steve only.**
- [ ] **FC TBD** — still not locked. Candidates stay in [`../electronics.md`](../electronics.md). Phase A ODrive/Teensy notes do **not** pick a Hux FC.
- [ ] Record the decision in [`../../NOTES.md`](../../NOTES.md) (and here) before any code copy.

**Done when:** there is a written Steve decision on license and on adapt vs rewrite. Until then, no vendoring.

---

## Phase D — Only then: printable wheel-leg fit-check

**Goal:** first mechanical fit-check. Still no spend unless Steve asks. FC still TBD; do not block the print on electronics.

Use [`../checklists/mechanical-v1.md`](../checklists/mechanical-v1.md), [`../mechanical.md`](../mechanical.md), and the settled draw in [`leg-geometry.md`](leg-geometry.md). This phase is the existing “first wheel-leg” milestone — **gated** by A–C **and** by **several 2D layouts** (R23).

- [ ] Phases A–C actually done (not skipped to make the repo look busy).
- [ ] **Several 2D sketch layouts** (side / front / top + linkage) before any Blender / 3D CAD (R23). Show motor-at-wheel and belt runs if belts. Use the settled draw in [`leg-geometry.md`](leg-geometry.md): 6" wheel in the 9.5" × 9.5" slot, 7.5"+7.5" tubes, hip over the axle.
- [ ] One-side envelope: **carbon-tube spars** + end fittings, linkage + spring stub, stroke toward 9.5" inside **~24" tall / ~10" wide** (R7 / R34 / R35).
- [ ] Fit-check: raised wheel can reach a 9.5" tread **with margin**, without self-collision.
- [ ] No second-leg copy until the first articulates.
- [ ] No FC lock, no BOM, no carpet spin-up as part of this print. No new spend.

**Done when:** a real print exists or Steve explicitly defers print. A CAD `.gitkeep` is not a fit-check.

---

## Explicitly not this plan

- Buying ODrives, Teensys, load cells, or a “better” FC because SonicRobot used them.
- Locking Betaflight / INAV / ArduPilot / custom (follows FC; FC is TBD). Do not pick a drone stack as a stepper host (R29).
- Locking servo vs stepper+belt for knee / swing. Both stay open.
- Cameras / pathfinding (later, on the Pi).
- Closed-loop stair gait software.
- Training an **RL walking policy** / buying a Jetson “because Stompy.” Hux V1 keeps **simple reused balance** (R18).
- Buying Diablo (or M1502D / their Pi4 + motor board) “because wheeled-leg.” Not 22 kg. No head DoF / cargo for V1.
- Relicensing by implication.
- Opening Blender before 2D layouts (R23).
