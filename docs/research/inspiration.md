# Steve's inspirations

Steve clarified these shares are inspiration. **Watch and extract vibe / capability / packaging. Do not start build work.** No spend. Flight controller stays **TBD**. Nothing here is a Hux stack, BOM, or CAD source. Diablo is a **commercial** platform — still inspiration only; **do not buy it.**

These sit **next to** the study set — they do not replace [XRobots](xrobots.md), Hattori, or [study-plan.md](study-plan.md) Phases A–D.

| # | What | Scale | Steal |
| --- | --- | --- | --- |
| 1 | [RAI Institute — Roadrunner](roadrunner.md) | Lab RL prototype (~15 kg) | Stairs, one-wheel balance, multimodal drive. **Not our maker path.** |
| 2 | FrRonconi student two-leg/wheel balancer (this page) | Maker-scale, **3-month** student first prototype | Closer vibe to Hux early R&D than lab Roadrunner. |
| 3 | [Build Some Stuff / Kelton Serra](#3-build-some-stuff--kelton-serra--arduino-self-balancing-robot) | Maker, fully 3D-printed two-wheel balancer | In-wheel BLDC+encoder; jointed legs keep CoG over contact; serviceable modular prints; wheel-under-CoG. **Not stairs.** |
| 4 | [Tazer — uni wheeled biped](tazer-lessons.md) | Maker, ~0.7 m carbon-tube legs, 6× GIM8108 | **Learn from the mistakes:** wrong first motors, TPU tires, skinny power, LQR-too-early, carbon dust. Not a Hux stack. |
| 5 | [Stompy — Kayden Knapik](stompy-sim2real.md) | Maker, 6-DOF 3D-printed **walker** (week build, RL) | CAD pose = physical home; CAD→URDF→sim lockstep; resting geometry biases gait; tether. **Not** RL walking for Hux V1. |
| 6 | [Diablo — Direct Drive Tech](diablo.md) | Commercial wheeled-leg (~22.9 kg); Pi4 + motor board | Split brain; DD/QDD class; LQR/PID before RL; height as states; aux contact later; payload vs height. **Do not buy.** Not 22 kg. No head/cargo V1. |

Packaging and loop geometry land in [`../mechanical.md`](../mechanical.md), [`../electronics.md`](../electronics.md), and [`../software.md`](../software.md).

---

## 1. RAI Institute — Roadrunner (lab)

Full note: [roadrunner.md](roadrunner.md).

[~15 kg](https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/) bipedal wheeled prototype. Side-by-side and in-line drive + stepping; stairs up/down; one-wheel balance; stand from ground; symmetric knees. Single trained policy; some behaviors zero-shot on hardware.

**Hux take:** validates one-leg / one-wheel balance as a **gate**, and drive-vs-step as a mode choice. **Lab RL ≠ Hux.** Our path stays XRobots + TBD FC.

| | |
| --- | --- |
| RAI page | https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/ |
| YouTube | https://www.youtube.com/watch?v=9kae-UAME1U |
| X share (Steve) | https://x.com/Ronald_vanLoon/status/2101340064286433440 |

---

## 2. FrRonconi — student two-leg/wheel balancer (maker-scale)

Steve's second share. **Inspiration only.**

> First prototype of a two-leg/wheel balancing #robot. Designed & developed by 2 students within a 3-month project

| | |
| --- | --- |
| X share (Steve) | https://x.com/FrRonconii/status/1373657222480269317 |

`@FrRonconii` is the sharer, not a Hux vendor and not (from the post) the student authors. The same caption circulated with [AA4CC / CTU](https://techfocus.cz/2822-na-cvut-postavili-robota-balancujiciho-na-dvou-nohach-bude-se-ucit-skakat-i-do-schodu.html) credits for **SK8O**: a 3-month (2020) two-leg/wheel balancer built by students, topology inspired by ETH Zürich **Ascento**, own mechanics / electronics / algorithms. Cite the X post first. Do not treat SK8O theses or sim packages as a Hux tree to vendor.

### Why Hux cares (vibe, not a clone)

This is the **closer early-R&D vibe** than Roadrunner:

- **Maker / student timescale** — two people, three months, a *first prototype* that already balances on two wheeled legs. That is the class of object Hux is (docs + one wheel-leg later), not a 15 kg institute policy stack.
- **Two-leg/wheel balance first** — matches Hux's teleop baseline ([`../vision.md`](../vision.md) step 1; [`../../NOTES.md`](../../NOTES.md) two-leg milestone) before stairs or one-leg gates.
- **Scope discipline** — a small team shipped a balancer without a lab RL trainer. Hux still does **research first** (Phases A–C) and does **not** skip to a print to “match the three months.”
- **Ascento-class topology (if it is SK8O)** — legs that extend/contract + driven wheels. Useful as a silhouette, not as Hux CAD. Hux V1 bias stays **linkages + springs** and a **~9.5"** step ([`../requirements.md`](../requirements.md) R7 / R3).

### Hux takeaways

1. **Early Hux should look more like this than like Roadrunner.** Student-scale two-wheel-leg balance is the honest first machine. Roadrunner is the later capability existence proof (stairs, one-wheel, knee symmetry).
2. **Two-leg balance is a finished-looking demo and still only the baseline.** Do not read a 3-month clip as “skip one-leg gate / skip 9.5" mapping.”
3. **Not a stack lock.** No FC, no BOM, no “use their MCU because the video did.” FC stays **TBD**.
4. **No public tree on the X post.** Watching a clip is allowed. Copying whoever's CAD/code (SK8O or otherwise) is Phase C and Steve-owned — default is study + rewrite.

### Study vs our path

| FrRonconi / student balancer | Hux |
| --- | --- |
| 3-month student first prototype | Early R&D; first wheel-leg is **Phase D** |
| Two-leg/wheel balance demo | Same class as the two-leg teleop milestone |
| Sharer post; no license on the tweet | Cite the URL. Do not vendor from a video |
| Closer *vibe* to a maker build | Still XRobots for loops; Hattori + Roadrunner for stairs |

---

## 3. Build Some Stuff / Kelton Serra — Arduino self-balancing robot

Steve shared this maker video as inspiration **and** as a steal-list for mechanical packaging. **Steal the ideas below. Do not start build work from their files.**

| | |
| --- | --- |
| Video | [I built a self-balancing robot from scratch (Arduino Based)](https://www.youtube.com/watch?v=K1lzzVGCzAQ) |
| Author | Kelton Serra / [Build Some Stuff](https://www.youtube.com/channel/UCVLxKs0KtyO8KQkefyew8Hw) |
| Printables (print, CAD) | https://www.printables.com/model/1533590-self-balancing-robot-arduino |
| PCBWay (PCB) | https://www.pcbway.com/project/shareproject/Self_Balancing_Robot_PCB_b7f23d41.html |
| MCU / power (theirs) | Arduino Nano 33 BLE on a custom PCB; **3S** LiPo |
| License notes | Author calls the project open source. PCBWay marks the PCB **CC BY-NC-ND**. Printables is the author's original model; study in place. **Do not vendor STLs, Gerbers, or firmware into MIT Hux.** |

Maker-scale two-wheel balancer. Fully 3D printed (including treads), zero supports. Floor balance and body height change — **not** a stair machine and **not** a one-leg plant demo.

### Steal (ideas + mechanical packaging)

Steve 2026-09-20 follow-up: **steal these explicitly.** Rewrite in Hux terms. Do not copy their parts tree.

- **In-wheel BLDC + encoder.** Brushless motor embedded in each wheel, encoder on that axis. Hux R6 already wants brushless driven wheels. **Steal the packaging:** motor-at-wheel, encoder on the drive, not a remote hip-to-rim belt for balance. Motor / ESC / encoder **TBD**. No SKU.
- **Jointed legs keep CoG over wheel contact as height changes.** Two jointed legs; as the body raises and lowers, the mechanism keeps the center of mass roughly over each wheel's point of rotation. **Steal the kinematic intent** for Hux knee / height travel. Not their linkage CAD. Hux still sizes stroke toward a **~9.5"** riser ([`../requirements.md`](../requirements.md) R3 / R7).
- **Serviceable modular prints.** Every screw gets a threaded insert (no crossthreading printed holes). Each part comes off the body on its own so you can repair and debug from the inside. **Steal the habit:** inserts, independently removable modules, inside access. Apply on Phase D prints — do not print their STLs.
- **Simple wheel-under-CoG balance loop.** Their published loop is a simple **P** controller: when the bot is shaken or pushed off center, it returns to balance by rotating the wheels back under the center of mass. **Steal the correction geometry** (planted wheel under CoG). Phase A still extracts IMU → PID → wheel torque from XRobots. Do not flash their Arduino sketch or treat P-only as the Hux controller.

Also on the machine (context, **not** a Hux spec): one **40 kg-class servo per leg**, front ultrasonic, side power button. That servo is a data point that high-torque servos can pose jointed legs — **not** a Hux lean. Knee / hip swing stay **servo vs stepper+belt TBD**. Do not buy a 40 kg servo because they did. Author says the bot is not well tuned; onboard BLE appeared to fight the balance loop. Do not “fix” their firmware in this repo.

Open source to **study in place**: Printables + PCBWay + YouTube parts list. **That list is not a Hux BOM.**

### Diffs vs Hux (working intent)

This table is a contrast so we do not treat their *stack* as ours. We **do** steal the packaging ideas above. It does **not** lock Hux hardware.

| Serra (this video) | Hux (working intent) |
| --- | --- |
| **3S** LiPo + **Arduino** Nano 33 BLE + custom PCB | **4S** LiPo class (preferred) + **controlled step-down** to servo / logic rails + **FC (TBD)** + Raspberry Pi |
| One **40 kg-class servo** per jointed leg | Knee / hip swing: **servo vs stepper+belt TBD** (both open, no lean). Size either for one-leg (~2×) load. Wheels stay brushless. **No SKU.** |
| Two-wheel floor balance; height change keeps CoG over contact | Steal that CoG-over-contact packaging. North star is still lift → **one-leg balance** → plant on a **~9.5"** riser |
| **No stair / one-leg plant yet** | One-leg plant is a Hux gate ([`../vision.md`](../vision.md), R2). Plant-side joints sized for **~2×** two-wheel load (R36) |

Hux path stays XRobots + Hattori for loops and stairs. Serra is the **maker-scale packaging** reference: in-wheel drive, CoG-over-contact legs, serviceable prints, wheel-under-CoG correction.

### Hux takeaways

1. **Steal in-wheel BLDC + encoder.** Matches Hux brushless wheels. Do not buy their hub motor.
2. **Steal jointed-leg CoG-over-contact.** Height change must keep mass over the contact patch. Hux still needs one-leg balance and a 9.5" plant; this bot has not shown those.
3. **Steal serviceable modular prints.** Inserts and independently removable parts. Phase D habit, not a reason to vendor STLs.
4. **Steal wheel-under-CoG geometry.** Teaching loop, not the Hux controller. Phase A still reads XRobots PID / hold.
5. **Do not lock the leg class.** Their 40 kg-class servos show one option that can pose jointed legs. Hux knee / hip swing stay **servo vs stepper+belt TBD** — both open, no lean. Size either for one-leg (~2×) load. No SKU. No spend.
6. **Do not steal their power stack.** 3S + Arduino is *theirs*. Hux prefers **4S** and steps down for pose / logic so wheel FOC spikes do not brown out the legs.
7. **Not a stack lock.** FC stays **TBD**. No spend.

### Study vs our path

| Serra / Build Some Stuff | Hux |
| --- | --- |
| 3S + Arduino Nano 33 BLE + custom PCB | 4S class + step-down rails + FC (TBD) + Pi |
| Servo legs, BLDC-in-wheel + encoder | **Steal** in-wheel BLDC+encoder. Knee / hip swing: **servo vs stepper+belt TBD** (both open, no lean) |
| Simple P; wheel under CoG | **Steal** the geometry. Phase A: IMU → PID → wheel command from XRobots |
| Floor balancer; height change only | Stairs + one-leg plant; size joints for **~2×** plant-side load |
| Printables / PCBWay / YouTube BOM | Study in place. **Not a Hux shopping list** |
| PCB **CC BY-NC-ND**; “open source” claim | Cite. Do not vendor. ND/NC is not a free pass into MIT Hux |

---

## 4. Tazer — uni wheeled biped (learn from the mistakes)

Full note: [tazer-lessons.md](tazer-lessons.md).

Steve 2026-09-21: watch [My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM) and **learn a lot from this guy's mistakes.**

Maker-scale ~0.7 m (~2 ft) wheeled biped: octagonal carbon-fiber tube legs, 6× GIM8108 QDD, CAN, Teensy 4.1 + BNO055, T8S RC, dual 6S (~48 V) + buck, silicone tires (not TPU).

**Hux take:** anti-patterns, not a stack. GIM8108-class stays a *candidate* (not ordered). Carbon tubes confirmed. Keep **4S + step-down**; still plan a real power bus for FOC stalls. Start with simple PID / existing control (R18), not LQR-on-a-bad-model. Rubber, not TPU. Wet-cut carbon. Do not buy his 48 V / Teensy bill.

Twelve numbered mistakes live on [tazer-lessons.md](tazer-lessons.md).

---

## 5. Stompy — Kayden Knapik (CAD → sim → real)

Full note: [stompy-sim2real.md](stompy-sim2real.md).

Steve 2026-09-21: analyze [I Trained a Robot in Simulation. Then I Made It Walk.](https://www.youtube.com/watch?v=gEjg179fvmc) — especially **simulations and matching CAD to reality**.

Maker-scale **6-DOF 3D-printed walking biped** (week build; RL policy on a Jetson). Walking challenges **differ** from Hux's wheeled biped. **Still learn.**

**Hux take:** steal the **shared zero** (physical stand = CAD pose; dual encoders zeroed there), the CAD→URDF→sim lockstep (a foot change forced a full update + retrain), resting-geometry bias, tether, and “sim later for geometry / stairs.” **Do not require RL walking for Hux V1.** Keep **reuse simple balance control** (R18).

---

## 6. Direct Drive Tech — Diablo (commercial wheeled-leg)

Full note: [diablo.md](diablo.md).

Steve 2026-09-21: watch [ETA Prime — Diablo](https://www.youtube.com/watch?v=S5PoZ8aNwvs). Also cite [arXiv:2407.21500](https://ar5iv.labs.arxiv.org/html/2407.21500) and the shop / SDK briefly.

Commercial **self-balancing wheeled-leg**: 6 DD joints (2 wheel, 2 crouch/height, 2 head tilt), **Pi4 + motor board**, **~22.9 kg**. Standing **~4 kg** vs creeping **~80 kg**; no-load jump **~8 cm**; aux rollers in creep; open SDK / ROS2. Paper: **model-based LQR**, not RL; high-bandwidth direct drive; curb / lean / crouch via a **parallel linkage**.

**Hux take:** steal split brain, DD/QDD as a *class*, LQR/PID-before-RL, height as named states, aux contact *later*, payload-vs-height. **Do not buy Diablo.** Do not scale to 22 kg. No head DoF / cargo for V1. Keep **R18**. Hardware stays **TBD**.

---

## Cite

When a later note is informed by these shares, record:

- **Roadrunner** — RAI Institute; URLs in [roadrunner.md](roadrunner.md). No public CAD/code.
- **FrRonconi share** — https://x.com/FrRonconii/status/1373657222480269317 ; quote the 2-student / 3-month line. If we later confirm SK8O as the machine, add AA4CC / CTU names and whatever license their materials state. Until then: **inspiration, not a vendor.**
- **Build Some Stuff / Kelton Serra** — [YouTube](https://www.youtube.com/watch?v=K1lzzVGCzAQ); [Printables](https://www.printables.com/model/1533590-self-balancing-robot-arduino); [PCBWay PCB](https://www.pcbway.com/project/shareproject/Self_Balancing_Robot_PCB_b7f23d41.html) (CC BY-NC-ND)
- **Tazer** — [My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM); lessons in [tazer-lessons.md](tazer-lessons.md)
- **Stompy** — [I Trained a Robot in Simulation. Then I Made It Walk.](https://www.youtube.com/watch?v=gEjg179fvmc) (Kayden Knapik); lessons in [stompy-sim2real.md](stompy-sim2real.md)
- **Diablo** — [ETA Prime review](https://www.youtube.com/watch?v=S5PoZ8aNwvs); [arXiv:2407.21500](https://ar5iv.labs.arxiv.org/html/2407.21500); shop / SDK in [diablo.md](diablo.md)

What we **steal**: vibe (maker-scale first prototype); capability existence (two-leg/wheel balance; Roadrunner's stairs / one-wheel); packaging (in-wheel BLDC+encoder, CoG-over-contact as height changes, serviceable modular prints, wheel-under-CoG correction geometry); Tazer **anti-patterns** (wrong first motors, TPU tires, skinny power, LQR-too-early); Stompy **CAD/reality match** (fixture / home pose, measure-vs-CAD, tether, default angles in CAD+firmware, sim lockstep later); Diablo **split brain + DD/QDD class + LQR/PID before RL + height-as-state**. What we did **not** copy: geometry files, Gerbers, firmware, policy, 3S / Arduino / 48 V / Teensy / Jetson / Pi4-as-FC stacks, 40 kg servo SKU, GIM8108 / Robstride / M1502D buys, Diablo itself, or anyone's parts list. **Not** an RL-walking requirement for Hux V1.

## Do not

- Start a Hux build, print, or firmware branch from these clips
- Spend, or treat student / RAI / Serra / Tazer / Stompy / Diablo actuators as a Hux spec
- **Buy Diablo** (or scale Hux to ~22 kg / 540 mm, or add head tilt / cargo / creep rollers to V1)
- Lock an FC (Roadrunner's RL trainer, Stompy's Jetson + mjlab, Tazer's Teensy, Diablo's Pi4 + motor board, anyone's LQR in a thesis, or Serra's Nano 33 BLE)
- Require RL walking — or any learned gait — for Hux V1; keep reuse simple balance (R18)
- Vendor SK8O / Ascento / Roadrunner / Printables / PCBWay / `DDTRobot/*` trees
- Order the PCBWay board or shop the YouTube BOM
- Lock steppers or servos — knee / hip swing stay **TBD** (both open, no lean)
- Pretend a 3-month student demo or a two-wheel P-balancer skips Phases A–C / one-leg gate / 9.5" mapping
- Relicense their CC BY-NC-ND PCB (or anything else) as MIT
