# Direct Drive Tech — Diablo (wheeled-leg)

Steve 2026-09-21: more research — watch [ETA Prime's Diablo review](https://www.youtube.com/watch?v=S5PoZ8aNwvs) and cite the paper [DIABLO: A 6-DoF Wheeled Bipedal Robot Composed Entirely of Direct-Drive Joints](https://ar5iv.labs.arxiv.org/html/2407.21500) (arXiv:2407.21500). Shop / SDK only as a brief cite.

Diablo is a **commercial self-balancing wheeled-leg** platform (Direct Drive Tech / DDTRobot). Inspiration + control / packaging lessons. **Not a Hux stack, BOM, or buy.** No spend. FC stays **TBD**. Keep **reuse simple balance** (R18).

Index: [`inspiration.md`](inspiration.md). Study plan: [`study-plan.md`](study-plan.md). Actuator trade: [`actuators-legs.md`](actuators-legs.md). Split brain: [`../software.md`](../software.md). Decisions: [`../decisions.md`](../decisions.md).

## What it is

[~22.9 kg](https://shop.directdrive.com/products/diablo-world-s-first-direct-drive-self-balancing-wheeled-leg-robot) wheeled biped. Six **direct-drive** joints, no gearboxes. ETA Prime (and the shop) describe those six as:

- **2 wheel** hub motors
- **2 crouch / height** (leg)
- **2 head tilt**

The paper maps the same six **M1502D** motors as **2 wheels + 2 hip + 2 knee**. A **parallelogram / four-bar** linkage turns hip + knee into **height + head pitch**. Both namings are the same machine.

Compute on the unit ETA Prime reviewed: **Raspberry Pi 4 + motor / controller board** (Pi on GPIO / serial to the drive board). The paper's lab stack is a **micro-controller** (ChibiOS, BMI088 IMU, CAN to drives) plus a mini-PC over UART. The [open SDK](https://diablo-sdk-docs.readthedocs.io/en/latest/) / [ROS2 package](https://github.com/DDTRobot/diablo_ros2) supports Raspberry Pi and an X3Pi variant. **Open SDK / ROS2** is the commercial development path. Do not treat Pi4, their MCU, or ROS2 Foxy as a Hux lock.

Standing vs creeping is the payload story: **~4 kg standing**, **~80 kg creeping** (head-down, driven wheels + **auxiliary rollers** under the head so the body does not scrape). Shop: no-load **jump ~8 cm**. Paper: ~8 cm obstacle / curb class on flat ground; head height travel ~20 cm. Width **540 mm** — more than **twice** Hux's **~10"** stance.

This is a **paid platform**, not a maker first-prototype. Do not buy it. Do not scale Hux to 22 kg because theirs is.

## Links

| | |
| --- | --- |
| ETA Prime review (Steve) | https://www.youtube.com/watch?v=S5PoZ8aNwvs |
| Paper (HTML) | https://ar5iv.labs.arxiv.org/html/2407.21500 |
| Paper (arXiv) | https://arxiv.org/abs/2407.21500 |
| Accompanying paper video | https://youtu.be/mm0XruFvZ4U |
| Shop | https://shop.directdrive.com/products/diablo-world-s-first-direct-drive-self-balancing-wheeled-leg-robot |
| Tutorials / user manual | https://shop.directdrive.com/pages/diablo-saukele |
| SDK docs | https://diablo-sdk-docs.readthedocs.io/en/latest/ |
| ROS2 | https://github.com/DDTRobot/diablo_ros2 |

Cite ETA Prime + the paper first. Shop / SDK only to confirm payload, jump, Pi, and that an SDK exists.

## Paper — model-based LQR, not RL

Liu, Yang, Liao, Lyu (Direct Drive Tech + Sun Yat-sen). Claim: first **fully direct-drive** 6-DoF wheeled biped.

**Why they skipped gearboxes.** High-ratio joints add backlash, noise, lubrication, and a bandwidth ceiling. Direct drive is the AGV / force-control choice: high control bandwidth, less transmission loss, honest torque. That is the plant that makes a linearized model usable.

**Why not RL.** They call out neural-net opacity and long training. They pick **model-based** control for interpretability and tuning. Balance is **LQR** on a **second-order inverted pendulum** (legs collapsed to a variable-length rod; head / rod / wheels analyzed separately; linearized near upright). Extra loops are ordinary:

- **Height** — PD + feed-forward on leg length (knee torque via the linkage Jacobian)
- **Roll** — PD so the head can stay level on a slope / one-leg obstacle
- **Yaw** — LQR on the wheel pair
- **Split-angle** — PD so left/right legs do not splay when the 2D model meets a 3D steer

**Curb / lean / crouch via the parallel linkage.** The four-bar lets them change height and keep (or command) head pitch independently of the pendulum angle. That is the DoF reason they rejected Ascento-class 1-DoF legs (head pitch locked to lean). Standing, squatting, and creeping are **posture states** on that linkage, not a learned gait. Aux rollers under the head are extra **contact** for the creep / payload state.

Tazer already showed **LQR-on-a-bad-model** wastes a month ([tazer-lessons.md](tazer-lessons.md) #7). Diablo is the other side of that coin: LQR works when the joints are high-bandwidth and the model is the real plant. Hux V1 still **reuses simple balance** (R18) — XRobots IMU → PID → wheel torque. Do not start V1 by copying their Riccati gain. Steal the *order*: **interpretable LQR / PID before RL**, not “buy Diablo’s controller.”

## Hux steal

Rewrite in Hux terms. **Do not buy the robot. Do not copy their 22 kg / 540 mm / head-cargo machine.**

| Steal | Hux rewrite |
| --- | --- |
| **Split brain** | Real-time balance on a motor / IMU board (or **TBD FC**); high-level / SDK / cameras on a Pi. Matches the existing [split-brain intent](../software.md). Steal the *cut*: balance loop is not a Python script on the Pi. Pi4 + their board is **theirs**. FC stays **TBD**. |
| **DD / QDD for joints** | Direct-drive (or quasi-DD) is how you get honest torque and bandwidth on **wheels** (already in-wheel FOC) and **hip roll** (already dynamic FOC / QDD / fast servo in V1). Knee / hip swing stay **servo vs stepper+belt TBD**. GIM8108-class remains a *candidate*, not an order. **M1502D is not a Hux SKU.** |
| **LQR / PID before RL** | Prefer an interpretable loop (PID cascade now; LQR only if the model is honest later) over a Roadrunner / Stompy-style policy trainer. **V1 stays R18** — reuse existing simple balance. Do not invent a Hux LQR stack to “match the paper.” |
| **Height modes as states** | Standing / squat / creep are **named postures**, not a free analog slider. Hux already names **`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`**. Later, a height or crouch flag can be another state on that machine. Do **not** add creeping / cargo modes to V1. |
| **Aux contact later** | Their head rollers are extra contact for creep + 80 kg. Hux V1 plants **two wheels**, then **one wheel**. Extra casters / belly contact is a later payload or park idea — **not** a V1 mechanism. |
| **Payload vs height** | **4 kg standing vs 80 kg creeping** is the same robot, different posture. Low and many contacts carry; tall and two-wheel-balance does not. Hux already sizes plant-side joints for **~2×** one-leg load (R36). Do not chase 80 kg cargo. Do not treat 4 kg as a Hux payload spec. |

## Study vs our path

| Diablo | Hux |
| --- | --- |
| Commercial ~22.9 kg, 540 mm wide, paid SDK platform | Maker R&D; **~10"** width; **~24"** full extension; mass **soft** — still not 22 kg |
| 6× M1502D direct-drive; Pi4 + motor board (or MCU + mini-PC) | Wheels FOC; hip roll dynamic in V1; knee / swing **TBD**; **FC TBD** + Pi later |
| Standing 4 kg / creeping 80 kg; aux rollers; top cargo; head tilt | No head DoF, no cargo bay, no creep rollers for **V1** |
| Model-based **LQR** + PD auxiliaries; ROS2 SDK | **Reuse simple balance** (R18). Phase A = XRobots IMU → PID → wheel. No ROS lock |
| ~8 cm jump / curb; 2 m/s; ~3 h class runtime | North star is **lift → one-leg balance → plant** on a **~9.5"** riser, not an 8 cm hop |
| Open SDK to *study in place* | Cite. Do not vendor `DDTRobot/*` into MIT Hux |

## Cite

When a later note is informed by this share, record:

- **Diablo** — Direct Drive Tech / DDTRobot; Liu et al., arXiv:2407.21500
- URLs: ETA Prime, paper, shop, tutorials, SDK / ROS2 above
- License: **commercial platform** + published paper + open SDK/ROS2 to study in place. Not a Hux vendor. Do not drop their ROS tree next to our MIT docs.
- What we took: split-brain cut; DD/QDD as a *class* for high-bandwidth joints; LQR/PID before RL; height as named states; aux contact as a later idea; payload trades with posture. What we did **not** copy: the robot, the 22 kg scale, M1502D, Pi4-as-FC, ROS2 Foxy, head tilt, cargo deck, creep rollers, or their LQR gains.

## Do not

- **Buy Diablo** (or TITA / D1, or their M1502D joints)
- Scale Hux toward **22 kg** / 540 mm because the commercial unit is that size
- Add **head tilt** or a **cargo deck** to V1
- Replace R18 with their LQR / ROS2 / “open SDK” stack
- Treat Pi4, their motor board, BMI088, or 24 V / M1502D as Hux hardware — those stay **TBD**
- Add creeping / aux-wheel contact or an 80 kg payload story to V1
- Vendor `diablo_ros2` or the SDK
- Spend
