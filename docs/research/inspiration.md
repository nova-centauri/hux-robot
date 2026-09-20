# Inspiration (Steve shares)

Steve shared this maker video as inspiration. **Watch and extract ideas. Do not start build work.** No spend. Flight controller stays **TBD**. Nothing here is a Hux stack, BOM, or CAD source.

These sit **next to** the study set — they do not replace [XRobots](xrobots.md), Hattori, or [study-plan.md](study-plan.md) Phases A–D.

| # | What | Scale | Detail |
| --- | --- | --- | --- |
| 1 | [Build Some Stuff / Kelton Serra — Arduino self-balancing robot](#1-build-some-stuff--kelton-serra--arduino-self-balancing-robot) | Maker, fully 3D-printed two-wheel balancer | BLDC-in-wheel + encoders; jointed servo legs keep CoG over contact; simple P. **Not stairs.** |

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

### What to steal (ideas only)

- **BLDC in the wheels + encoders.** Each wheeled leg has a brushless motor embedded in the wheel and an encoder on that axis. Same class as Hux R6 (brushless driven wheels). Steal the *layout* (motor-at-wheel, encoder on the drive), not their motor/ESC SKU.
- **Jointed legs keep CoG over wheel contact as height changes.** Two jointed legs; as the body raises and lowers, the mechanism keeps the center of mass roughly over each wheel's point of rotation. Useful silhouette for Hux height / knee travel. Not Hux CAD. Hux still sizes stroke toward a **~9.5"** riser ([`../requirements.md`](../requirements.md) R3 / R7).
- **Serviceable: threaded inserts, independently removable parts.** Every screw gets a threaded insert (no crossthreading printed holes). Each part comes off the body on its own so you can repair and debug from the inside. Steal the *habit* for later Hux prints. Do not copy their parts tree.
- **Simple P balance: rotate the wheels under the CoG.** The published loop is a simple **P** controller: when the bot is shaken or pushed off center, it returns to balance by rotating the wheels back under the center of mass. Contrast with XRobots IMU → **PID** → wheel torque in Phase A. Extract the *geometry of the correction* (wheel under CoG), not their gains or Arduino sketch.
- **Open source to study in place.** Printables model + PCBWay PCB (and whatever firmware the author attached there). YouTube description has their parts list. **That list is not a Hux BOM.** Do not order their PCB, servos, or pack.

Also on the machine (context, not a Hux spec): one **40 kg servo per leg**, front ultrasonic, side power button. Author says the bot is not well tuned; onboard BLE appeared to fight the balance loop. Do not “fix” their firmware in this repo.

### Diffs vs Hux (working intent)

This table is a contrast so we do not treat their stack as ours. It does **not** lock Hux hardware.

| Serra (this video) | Hux (working intent) |
| --- | --- |
| **3S** LiPo + **Arduino** Nano 33 BLE + custom PCB | **4S** LiPo class + **FC (TBD)** + Raspberry Pi |
| One **servo** per jointed leg | Knee / hip-swing: **stepper + belt** (class, not SKU). Wheels stay brushless. |
| Two-wheel floor balance; height change keeps CoG over contact | North star: lift → **one-leg balance** → plant on a **~9.5"** riser |
| **No stair / one-leg plant yet** | One-leg plant is a Hux gate ([`../vision.md`](../vision.md), R2) before any stair attempt |

Hux path stays XRobots + Hattori for loops and stairs. Serra is a **maker-scale** two-wheel P-balancer with serviceable prints and motor-at-wheel drive.

### Hux takeaways

1. **Motor-at-wheel + encoder is the interesting drive idea.** Matches Hux brushless wheels. Do not buy their hub motor because the video used it.
2. **Keep CoG over the contact patch when height changes.** Steal the kinematic *intent* for later linkage/knee sketches. Hux still needs one-leg balance and a 9.5" plant; this bot has not shown those.
3. **Design for service.** Inserts and independently removable parts are cheap insurance on printed structure. Apply when Phase D exists — not a reason to print their STLs.
4. **P (wheel under CoG) is a teaching loop, not the Hux controller.** Phase A still extracts PID / hold patterns from RobotX, TallBalancer, and SonicRobot. Do not flash an Arduino Nano to “match the video.”
5. **Not a stack lock.** 3S + Arduino + servo legs are *their* machine. Hux working lean is 4S + FC/Pi and stepper+belt legs. FC stays **TBD**. No spend.

### Study vs our path

| Serra / Build Some Stuff | Hux |
| --- | --- |
| 3S + Arduino Nano 33 BLE + custom PCB | 4S class + FC (TBD) + Pi |
| Servo legs, BLDC-in-wheel + encoder | Stepper + belt legs (working V1 lean); brushless wheels |
| Simple P; wheel under CoG | Phase A: IMU → PID → wheel command from XRobots |
| Floor balancer; height change only | Stairs + one-leg plant are the north star |
| Printables / PCBWay / YouTube BOM | Study in place. **Not a Hux shopping list** |
| PCB **CC BY-NC-ND**; “open source” claim | Cite. Do not vendor. ND/NC is not a free pass into MIT Hux |

### Cite

When a later note is informed by this share, record:

- **Build Some Stuff / Kelton Serra** — [YouTube](https://www.youtube.com/watch?v=K1lzzVGCzAQ); [Printables](https://www.printables.com/model/1533590-self-balancing-robot-arduino); [PCBWay PCB](https://www.pcbway.com/project/shareproject/Self_Balancing_Robot_PCB_b7f23d41.html) (CC BY-NC-ND)

What we took: motor-at-wheel + encoder, CoG-over-contact as height changes, serviceable prints, simple P (wheel under CoG). What we did **not** copy: geometry, Gerbers, firmware, servo/Arduino stack, or the YouTube parts list.

## Do not

- Start a Hux build, print, or firmware branch from this video
- Spend, or treat their 3S pack / Arduino / 40 kg servos / PCB as a Hux spec
- Order the PCBWay board or shop the YouTube BOM
- Vendor Printables STLs, Fusion files, Gerbers, or their sketch into this repo
- Lock an FC (their Nano 33 BLE is not a Hux candidate)
- Read a two-wheel P-balancer as “skip one-leg gate / skip 9.5" mapping”
- Relicense their CC BY-NC-ND PCB (or anything else) as MIT
