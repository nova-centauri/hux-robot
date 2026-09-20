# Inspiration (Steve shares)

Steve shared this maker video as inspiration **and** as a steal-list for mechanical packaging. **Steal the ideas below. Do not start build work from their files.** No spend. Flight controller stays **TBD**. Nothing here is a Hux BOM, CAD tree, or Arduino stack.

These sit **next to** the study set — they do not replace [XRobots](xrobots.md), Hattori, or [study-plan.md](study-plan.md) Phases A–D.

| # | What | Scale | Steal |
| --- | --- | --- | --- |
| 1 | [Build Some Stuff / Kelton Serra — Arduino self-balancing robot](#1-build-some-stuff--kelton-serra--arduino-self-balancing-robot) | Maker, fully 3D-printed two-wheel balancer | In-wheel BLDC+encoder; jointed legs keep CoG over contact; serviceable modular prints; simple wheel-under-CoG loop. **Not stairs.** |

Packaging and loop geometry land in [`../mechanical.md`](../mechanical.md), [`../electronics.md`](../electronics.md), and [`../software.md`](../software.md).

---

## 1. Build Some Stuff / Kelton Serra — Arduino self-balancing robot

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
| **3S** LiPo + **Arduino** Nano 33 BLE + custom PCB | **4S** LiPo class (preferred) + **controlled step-down** to servo/logic rails + **FC (TBD)** + Raspberry Pi |
| One **40 kg-class servo** per jointed leg | Knee / hip swing: **servo vs stepper+belt TBD** (both open, no lean). Size either for one-leg (~2×) load. Wheels stay brushless. **No SKU.** |
| Two-wheel floor balance; height change keeps CoG over contact | Steal that CoG-over-contact packaging. North star is still lift → **one-leg balance** → plant on a **~9.5"** riser |
| **No stair / one-leg plant yet** | One-leg plant is a Hux gate ([`../vision.md`](../vision.md), R2). Plant-side joints sized for **~2×** two-wheel load (R14) |

Hux path stays XRobots + Hattori for loops and stairs. Serra is the **maker-scale packaging** reference: in-wheel drive, CoG-over-contact legs, serviceable prints, wheel-under-CoG correction.

### Hux takeaways

1. **Steal in-wheel BLDC + encoder.** Matches Hux brushless wheels. Do not buy their hub motor.
2. **Steal jointed-leg CoG-over-contact.** Height change must keep mass over the contact patch. Hux still needs one-leg balance and a 9.5" plant; this bot has not shown those.
3. **Steal serviceable modular prints.** Inserts and independently removable parts. Phase D habit, not a reason to vendor STLs.
4. **Steal wheel-under-CoG geometry.** Teaching loop, not the Hux controller. Phase A still reads XRobots PID / hold.
5. **Do not lock the leg class.** Their 40 kg-class servos show one option that can pose jointed legs. Hux knee / hip swing stay **servo vs stepper+belt TBD** — both open, no lean. Size either for one-leg (~2×) load. No SKU. No spend.
6. **Do not steal their power stack.** 3S + Arduino is *theirs*. Hux prefers **4S** and steps down for pose/logic so wheel FOC spikes do not brown out the legs.
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

### Cite

When a later note is informed by this share, record:

- **Build Some Stuff / Kelton Serra** — [YouTube](https://www.youtube.com/watch?v=K1lzzVGCzAQ); [Printables](https://www.printables.com/model/1533590-self-balancing-robot-arduino); [PCBWay PCB](https://www.pcbway.com/project/shareproject/Self_Balancing_Robot_PCB_b7f23d41.html) (CC BY-NC-ND)

What we **steal**: in-wheel BLDC+encoder, CoG-over-contact as height changes, serviceable modular prints, wheel-under-CoG correction geometry. What we did **not** copy: geometry files, Gerbers, firmware, 3S/Arduino stack, 40 kg servo SKU, or the YouTube parts list.

## Do not

- Start a Hux build, print, or firmware branch from this video
- Spend, or treat their 3S pack / Arduino / 40 kg servo SKU / PCB as a Hux spec
- Order the PCBWay board or shop the YouTube BOM
- Vendor Printables STLs, Fusion files, Gerbers, or their sketch into this repo
- Lock an FC (their Nano 33 BLE is not a Hux candidate)
- Lock steppers or servos — knee / hip swing stay **TBD** (both open, no lean)
- Read a two-wheel P-balancer as “skip one-leg gate / skip 9.5" mapping”
- Relicense their CC BY-NC-ND PCB (or anything else) as MIT
