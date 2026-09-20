# Study plan (before hardware)

Phased research checklist. Tick only when the work is real. **No spend** until Steve asks. **FC stays TBD.** Printable wheel-leg is **Phase D**, not Phase A.

Track milestones in [`../../NOTES.md`](../../NOTES.md). Shortlist and links: [`xrobots.md`](xrobots.md). Cite/adapt rules: [`README.md`](README.md).

## Gates

| Until this is done | Do not start |
| --- | --- |
| Phase A notes (loops + remotes) | Phase B stair mapping as “done” |
| Phase B 9.5" cycle sketch | Treating Stairs CAD as Hux geometry |
| Phase C (adapt vs rewrite + license) | Vendoring any `XRobots/*` tree |
| Phase D | Buying parts, locking an FC, or claiming Mechanical V1 started |

Prefer parts already on hand. Upstream READMEs (especially SonicRobot) are **not** a Hux BOM.

---

## Phase A — Watch / read bring-up; extract loops

**Goal:** understand IMU → PID → wheel torque and remote patterns from RobotX, TallBalancer, and SonicRobot.

- [ ] Watch [RobotX playlist](https://www.youtube.com/playlist?list=PLpwJoq86vov-C5SldDA-AhxesVHPRk74x) and the [open-source release video](https://www.youtube.com/watch?v=AQGueBqJt3g).
- [ ] Read [XRobots/RobotX](https://github.com/XRobots/RobotX) `ArduinoCode_current/` (`IMU_*`, `RobotX020` / `RobotX201a`, remotes). Note GPL3 README vs LGPL `LICENSE` file; do not vendor.
- [ ] Watch [TallBalancer](https://youtu.be/VYU8CRTD2cA). Read `Code/pos_hold` and `Code/vel_hold` ([MIT](https://github.com/XRobots/TallBalancer)).
- [ ] Watch [SonicRobot playlist](https://www.youtube.com/playlist?list=PLpwJoq86vov_tZ3rsMCH5sylqGT5s9TcU) bring-up. Read `ARobot08/`, `Remote017/`, `Scale01/` ([GPL-2.0](https://github.com/XRobots/SonicRobot)). Study only; no shopping from the README.

**Extract (write notes here or in [`../../NOTES.md`](../../NOTES.md)):**

- [ ] Control loops: IMU (MPU6050 / GY-521 class) → filter/fusion → pitch/roll error → **PID** → wheel command (torque / velocity / current — record which).
- [ ] Outer hold: TallBalancer position hold vs velocity hold; what the encoder buys vs the IMU.
- [ ] SonicRobot extras: load cells in the loop; ODrive + Teensy split; estop / RST; CAN vs UART to drives.
- [ ] Remote patterns: RobotX TX/RX sketches; SonicRobot nRF remote; what the stick maps to (tilt setpoint, speed, yaw). Hux RX is **TBS Nano** — steal *semantics*, not the radio.
- [ ] Bring-up order they actually used (IMU zero, drive calibrate, restrained spin). Map onto [`../checklists/electronics-bringup.md`](../checklists/electronics-bringup.md) later — do not flash a Hux FC in this phase.

**Done when:** we can explain the balance loop and remote overlay in our own words, with citations, without a copy of their firmware in this repo.

---

## Phase B — Map Stairs + Hattori onto Hux's 9.5" cycle

**Goal:** a Hux-shaped step cycle, not a clone of either machine.

Hux cycle (from [`../vision.md`](../vision.md)): **lift → 1-leg balance → plant** on a **~9.5"** riser.

- [ ] Watch [XRobots/Stairs](https://github.com/XRobots/Stairs) ([video](https://youtu.be/MUyFDWbXrZ0)). Different mechanism. List **heuristics only** (timing, commit-to-step, missed tread, sensors vs open-loop).
- [ ] Re-read [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) (already in requirements): extra DOF, serial/linkage knee vs parallel, wheel diameter, open-loop swing-leg stepping. Pair with [`actuators-legs.md`](actuators-legs.md): knee gets springs/linkage gravity compensation; hip roll is a different (bandwidth) job.
- [ ] Measure or note a **real** ~9.5" riser/fixture (height, tread, nosing) when Steve has one — still no print.
- [ ] Sketch Hux step-up and step-down as states, not CAD:

  1. Two-leg balance (teleop baseline).
  2. One-leg balance **gate**.
  3. Lift wheeled leg (stroke / clearance toward 9.5").
  4. Hold on planted wheel (Phase A loop under a narrower support).
  5. Place raised wheel on next tread.
  6. Transfer / plant. Repeat.

- [ ] Mark which states can stay **open-loop** on a fixture (Hux milestone: open-loop step) vs which need closed-loop balance.
- [ ] Note one-leg balance risks on a nosing (BallWheels / BeltWheel / Ball-BIke are optional edge-case reading).

**Done when:** the 9.5" cycle is written as Hux states with citations to Stairs + Hattori, and we have explicitly said Stairs geometry is **not** Hux geometry.

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

Use [`../checklists/mechanical-v1.md`](../checklists/mechanical-v1.md) and [`../mechanical.md`](../mechanical.md). This phase is the existing “first printable wheel-leg” milestone — **gated** by A–C.

- [ ] Phases A–C actually done (not skipped to make the repo look busy).
- [ ] One-side envelope, linkage + spring stub, stroke toward 9.5" (requirements R7). Leg actuator *classes* noted by axis (R26 / [`actuators-legs.md`](actuators-legs.md)) — not a SKU, not one type for all three.
- [ ] Fit-check print: raised wheel can reach a 9.5" tread without self-collision.
- [ ] No second-leg copy until the first articulates.
- [ ] No FC lock, no BOM, no carpet spin-up as part of this print.

**Done when:** a real print exists or Steve explicitly defers print. A CAD `.gitkeep` is not a fit-check.

---

## Explicitly not this plan

- Buying ODrives, Teensys, load cells, or a “better” FC because SonicRobot used them. Buying qdd100 / DIABLO / StackForce kits because they appear in [`actuators-legs.md`](actuators-legs.md) — those are patterns, not a Hux cart.
- Locking Betaflight / INAV / ArduPilot / custom (follows FC; FC is TBD).
- Cameras / pathfinding (later, on the Pi).
- Closed-loop stair gait software.
- Relicensing by implication.
