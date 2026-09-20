# XRobots shortlist (James Bruton)

Upstream org: [github.com/XRobots](https://github.com/XRobots) · site: [XRobots.co.uk](http://XRobots.co.uk)

Study these in order. **Primary** first (balance + wheels + stairs). **Secondary** only after Phase A notes exist. Do not clone these trees into Hux. Licenses differ — see [README.md](README.md).

Also cite Hattori (already in [`../requirements.md`](../requirements.md)): [STRIDE — Wheeled Biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2).

## Suggested study order

1. **RobotX** — wheeled-biped / dynamic-balance lineage (playlist, then `ArduinoCode_current`)
2. **TallBalancer** — two-wheel balance with position / velocity hold (MPU6050 + ODrive patterns)
3. **SonicRobot** — taller balancer; load cells, Teensy, ODrive BLDC (electronics lessons)
4. **Stairs + Hattori STRIDE V2** — stair heuristics → Hux 9.5" lift → 1-leg balance → plant
5. **YouCanBuildBiPed** — simple biped kinematics
6. **BallWheels / BeltWheelRobot / Ball-BIke** — wheel / balance edge cases
7. **Mid-Walker, BalancingStrandbeest** — optional

---

## Primary

### 1. XRobots/RobotX — wheeled biped / dynamic balance lineage

| | |
| --- | --- |
| Repo | https://github.com/XRobots/RobotX |
| Playlist | https://www.youtube.com/playlist?list=PLpwJoq86vov-C5SldDA-AhxesVHPRk74x |
| Open-source video | https://www.youtube.com/watch?v=AQGueBqJt3g |
| License | README: **GPL-3.0** for all CAD and code. `LICENSE` file in repo is **LGPL-3.0**. Treat as GPL3 until Steve resolves. |

**Why Hux cares:** This is the Bruton wheeled-biped / dynamic-balance lineage we want to understand before inventing a stair gait. CAD + Arduino-era code for a two-wheel-leg machine, remotes, and IMUs.

**Look at:** playlist first; then `ArduinoCode_current/` (`IMU_*`, `RobotX020` / `RobotX201a`, `RemoteRX002`, `Rermote002` — typo is upstream). Older `ArduinoCode/` is history.

**Extract:** how pitch/roll from IMU becomes wheel command; remote TX/RX split; what is open-loop versus closed-loop when a leg leaves the ground.

**Do not:** vendor the tree. GPL3 (or unresolved LGPL) cannot be folded into MIT Hux without a Phase C license decision.

### 2. XRobots/TallBalancer — two-wheel balance, position + velocity hold

| | |
| --- | --- |
| Repo | https://github.com/XRobots/TallBalancer |
| Video | https://youtu.be/VYU8CRTD2cA |
| License | **MIT** |

**Why Hux cares:** Smaller, later two-wheel balancer. README is one line; the value is `Code/pos_hold` and `Code/vel_hold` plus CAD. This is the cleanest place to read **MPU6050 → PID → wheel torque** and ODrive encoder hold (stay put / hold a speed while balancing).

**Look at:** the video, then the two firmware folders side by side. Note how remote (if any) overlays the hold loops.

**Extract:** cascaded loops (angle inner, position/velocity outer); IMU calibration habit; what ODrive is asked to do versus what the MCU integrates.

**Hux note:** TallBalancer is MIT, so later adaptation is license-easier than RobotX — still Phase C, still cite. Do not treat ODrive as a Hux buy. FC stays TBD; this is a pattern source, not a stack lock.

### 3. XRobots/SonicRobot — closest electronics lessons (brushless + balance)

| | |
| --- | --- |
| Repo | https://github.com/XRobots/SonicRobot |
| Playlist | https://www.youtube.com/playlist?list=PLpwJoq86vov_tZ3rsMCH5sylqGT5s9TcU |
| License | **GPL-2.0** (GitHub `LICENSE`) |

**Why Hux cares:** Taller two-wheel balancer with **load cells, Teensy, ODrive BLDC**. Closest published Bruton electronics for the kind of brushless + balance bring-up Hux will eventually do. Not a wheeled-biped stair machine — steal interconnect and loop structure.

**Look at:** playlist (parts 1–2 call out mechanical and electronics); `ARobot08/` (main), `Remote017/`, `Scale01/` (load-cell Teensys). README lists upstream modules (MPU6050 / GY-521, ODrive 3.6, nRF24L01, Qwiic Scale, CAN transceivers). **That list is not a Hux BOM.**

**Extract:** IMU → balance PID → ODrive torque/velocity; how load cells sit in the loop; NRF remote packet shape; bring-up order (IMU zero, ODrive encode, estop on RST).

**Do not:** copy the GPL-2.0 firmware into Hux. Do not shop the README.

### 4. XRobots/Stairs — stair-climbing robot (different mechanism)

| | |
| --- | --- |
| Repo | https://github.com/XRobots/Stairs |
| Video | https://youtu.be/MUyFDWbXrZ0 |
| License | **MIT** |

**Why Hux cares:** CAD/code for a **stair-climbing** robot. Mechanism is not Hux (not a wheeled biped). Still the right place for **stair heuristics**: riser timing, when a contact is “planted,” how they recover a missed tread, sensor vs open-loop.

**Look at:** the video, then CAD + code for the step state machine (whatever form it takes).

**Extract:** sequence only — detect/commit/lift/place/weight-shift — mapped onto Hux's 9.5" cycle in [study-plan.md](study-plan.md) Phase B.

---

## Already in requirements (cite with Primary)

### Alex Hattori — STRIDE wheeled biped V2

| | |
| --- | --- |
| Post | https://www.alex-hattori.com/blog/wheeled-biped-v2 |
| In Hux | [`../requirements.md`](../requirements.md), [`../vision.md`](../vision.md), [`../mechanical.md`](../mechanical.md) |

**Why Hux cares:** Contemporary wheeled biped with an extra leg DOF, larger wheels, serial/linkage knee bias for stairs, and a note that parallel “knees on both sides” fights stair clearance. V2 mentions early **open-loop swing-leg** stepping — same class of experiment as Hux's “open-loop step toward a 9.5" fixture.”

**Extract (do not copy blindly):** extra DOF for stairs/fall recovery; wheel-at-wheel vs remote belts; springs only if actuators are small; invert-the-knee vs linkage trade for climbing both ways.

Hux V1 still prefers **strong linkages + springs** (requirements R7). That bias stays; Hattori is a lesson source, not CAD. Knee gravity compensation is the strongest reason to keep the spring — see [`actuators-legs.md`](actuators-legs.md).

---

## Secondary

Do these after Primary notes exist. Kinematics and wheel-edge cases only.

### YouCanBuildBiPed — simple biped kinematics starter

| | |
| --- | --- |
| Repo | https://github.com/XRobots/YouCanBuildBiPed |
| License | **MIT** |
| README | “Simple five servo Bipedal robot” |

**Why Hux cares:** Lowest-complexity Bruton biped (servos, not wheels). Use it to read **leg IK / gait sequencing** without ODrive noise. Not a balance or stair reference.

### BallWheels / BeltWheelRobot / Ball-BIke — wheel / balance edge cases

| Repo | Link | License | Why it is an edge case |
| --- | --- | --- | --- |
| BallWheels | https://github.com/XRobots/BallWheels | MIT | Spherical / ball-wheel contact; slip and contact patch unlike a rim on a tread |
| BeltWheelRobot | https://github.com/XRobots/BeltWheelRobot | MIT | Active omni-wheel ([video](https://youtu.be/pOGL48JUIuw)); lateral force without a Hux-style plant |
| Ball-BIke | https://github.com/XRobots/Ball-BIke | MIT | Ball + bike-like balance ([video](https://www.youtube.com/watch?v=ZVFB2g25OkM)); 3-D lean, not a stair step |

**Extract:** what breaks when the contact is not a driven wheel sitting on a flat tread. Useful when we later argue one-leg balance on a nosing.

Related but not on the required list: [BigBallWheels](https://github.com/XRobots/BigBallWheels) (MIT) if BallWheels is too thin.

### Optional

| Repo | Link | License | Why optional |
| --- | --- | --- | --- |
| Mid-Walker | https://github.com/XRobots/Mid-Walker | MIT | Rideable linked-gait walker. Contact / two-feet-planted lessons only; not a wheeled biped. |
| BalancingStrandbeest | https://github.com/XRobots/BalancingStrandbeest | **GPL-3.0** | Strandbeest + balance ([playlist](https://www.youtube.com/playlist?list=PLpwJoq86vov_NvuWuCBPQFPGGEK9JjUjJ)). Fun linkage + IMU; GPL3; skip unless Phase A is done. |

---

## License snapshot (do not relicense)

| Project | Stated / GitHub license | Fold into MIT Hux? |
| --- | --- | --- |
| RobotX | README **GPL-3.0**; file **LGPL-3.0** | **No** without Steve. Copyleft. |
| SonicRobot | **GPL-2.0** | **No** without Steve. Copyleft. |
| BalancingStrandbeest | **GPL-3.0** | **No** without Steve. Optional anyway. |
| TallBalancer, Stairs, YouCanBuildBiPed, BallWheels, BeltWheelRobot, Ball-BIke, Mid-Walker | **MIT** | Possible later with attribution. Still Phase C. |
| Hattori STRIDE V2 | Blog / no code vendor | Cite. Do not scrape a robot out of a post. |

Hux stays MIT until Steve says otherwise. Details: [README.md](README.md).
