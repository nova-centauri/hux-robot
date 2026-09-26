# Decisions

Dated log of Steve's Hux decisions as they landed on `main`. Newest intent **supersedes** older language on the same topic.

**Standing rule (Steve):** merge docs PRs promptly; keep `main` current; **log each merge here.** Do not leave conflicting docs PRs open against stale `main`.

Source of truth is this repo (`nova-centauri/hux-robot`). Docs only. **No spend.** No SKU locks beyond what is already decided below.

## Current locked decisions

These must stay true on `main`. Later rows in the log explain how we got here.

| Topic | Locked intent |
| --- | --- |
| Stairs | **9.5" rise × 9.5" going** (nosing to nosing). Rise was already the north star. Going is the design tread the wheel was settled against. A deeper real tread is spare. |
| Modes | **`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`** before any autonomy |
| Power | **All-electric.** **6S** pack class (LiPo preferred; high-drain Li-ion 21700 acceptable) — **~22.2 V nominal / 25.2 V full**. Pack **on hold between 6S and 8S** pending the actuator voltage floor (2026-09-26; 8S recommended). **XT90-S anti-spark on the harness** (decided). **Regulated step-down** for 5 V / 12 V logic and pose rails. TBS Nano RX. **Superseded 4S on 2026-09-26.** |
| Architecture | **Four layers** (2026-09-26): (1) **smart actuators on CAN** (FOC + joint PD on the actuator); (2) the **control core as a portable C++ library** — estimator, mode machine, balance controller, no hardware calls — that links into the MCU firmware, the Linux companion and the twin alike; (3) a **small real-time MCU with CAN** runs that core at 1 kHz with the IMU, RC and a hardware watchdog; (4) a **Linux companion on ROS 2** for teleop, logging, params, cameras, later perception and policy. **The actuator bus picks the MCU.** |
| Real-time board | **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers (2026-09-26; in the order-now cart). **Not the F765-Wing** (no CAN) — that is the P0–P1 bench board only. |
| Companion | **Pi 5 now**, in containers, no Pi-specific libraries, so a **Jetson (Orin Nano Super kit class) at P5** is a bolt-in. Head has a companion **slot** with a 12–19 V feed. **Jetson is a perception buy, not a V1 buy.** |
| Wheels | **6" OD locked** (a real tire at **5.75–6.25"** still counts). Width **~1–1.25"**. Real rubber, torsionally stiff. **In-wheel BLDC FOC.** Zantle 5" is a bench donor, not the foot. Not a buy. No spokes. |
| Knee + hip swing | **CAN QDD / FOC is the working class** on 6S (2026-09-26); servo or stepper+belt is the **fallback**. Size for **~2× one-leg plant load** (~10 N·m knee holding). |
| Hip roll | **IN V1** (dynamic FOC / QDD / fast servo), even if imperfect. Not a stepper. Not V2. |
| Structure / envelope | **Carbon fiber tubes** for upper / lower leg spars. **~24"** full extension. **~14"** outside width. Head inside, wheels and legs outside the head. Mass budget **soft / blown.** |
| Fabrication | **COTS** structure, **draft-friendly** customs, **wire ports**, **serviceability**, **2D before Blender** |
| Shop | Mill / lathe / brake / bender / bandsaw / weld / solder / breadboards. Fab is welcome. |
| Stepper I/O (if chosen) | **The RT MCU does not drive stepper coils.** Stepper drivers behind CAN / step-dir for pose. Steppers are now the **fallback**, not the peer, for knee / swing: CAN QDD on 6S is the working class. |
| Research | Steal **Build Some Stuff (Serra)** + **Roadrunner** + **FrRonconi** + **XRobots** as research / inspiration. **Tazer**: learn from the mistakes (anti-patterns). **Stompy**: CAD/reality match + shared zero; **not** RL walking for V1. **Diablo**: split brain, DD/QDD class, LQR/PID before RL, height as states; **do not buy**; not 22 kg; no head/cargo V1. **SpdrBot**: Isaac Sim / Lab pipeline + failure modes for the Phase E horizon; **not** spider morphology; **not** Isaac Lab before `TWO_WHEEL`; **do not buy** Indystry packs or a 4090 for V1. Twin stack (Isaac / MuJoCo / mjlab / other) stays **TBD** — steal pipeline lessons, do not pick a dojo. Do not vendor. |
| Twin / sim | **Pipeline TBD.** Lock the *contract* first (CAD→URDF/USD or MJCF lockstep, observation parity, motorcycle-crown tire contact, firmware zeros, stack willingness). Do **not** lock Isaac / MuJoCo / mjlab. Living-drawings 3D sandbox is a **design toy**, not the twin. Not a V1 gate. |
| Process / horizon | Repo is the plan SoT. Hux bot is **advisory / tracking / brainstorming / adversarial** — not a large-task executor. **Inventory does not drive design.** Prefer the correct actuator / wheel over the shelf part. Authorized spend stays the [`bom.md`](bom.md) order-now cart; Steve owns those breakout edits. **Digital twin + training dojo** is the long-term north star, **after** Phase V1 classical / reused balance + modes (R14 / R18). Not a V1 gate. Do **not** stand up Isaac Lab, buy a 4090, or make RL a V1 balance gate before `TWO_WHEEL`. |
| Actuator shortlist (not ordered) | **RobStride 02** knees, **RobStride 00** hip swing, **RobStride 05** wheels; **hip roll = RS02 if the hip offset comes in to ≤ 3.5", RS06 at the drawn 5.4"** (8.3 N·m continuous hold per the same-day one-leg-stance study). One RS00/RS02 first on the Teensy. Classic CAN 1 Mbit on **two buses** (wheels + roll; knees + swing). Requires **≥24 V bus → 8S**. GIM8108-8 was the earlier yardstick. [`research/actuator-shortlist.md`](research/actuator-shortlist.md). Steve confirms; then it is a cart line. |

---

## Log

### 2026-09-20 — #1 scaffold (merged)

Initialize Hux wheeled-biped docs scaffold and requirements. SoT is this GitHub repo. North star: climb / descend **~9.5"** residential stairs one wheeled leg at a time. Empty `cad/`, `firmware/`, `software/`. MIT license. No spend. FC not locked.

### 2026-09-20 — #2 XRobots research (merged)

Research-first study packet: [XRobots shortlist](research/xrobots.md), [study plan](research/study-plan.md) Phases A–D. Watch / extract before any print. Do not vendor XRobots trees. RobotX is GPL3 — do not relicense Hux (MIT) without Steve. Printable wheel-leg is **Phase D**.

### 2026-09-20 — #3 Roadrunner + FrRonconi inspiration (merged)

Steve's X-share inspirations: [RAI Roadrunner](research/roadrunner.md) (lab RL wheeled biped — capability existence, not a Hux stack) and the [FrRonconi student two-leg/wheel balancer](research/inspiration.md) (maker-scale vibe). Watch; do not build from the clips.

### 2026-09-20 — #4 electric / 4S / wheel-actuator intent (merged)

**Electric-only** powertrain (R10). Battery lean **4S LiPo** class (~14.8 V / ~16.8 V) — not a pack SKU (R11). Hip + knee actuators **TBD**, class research only (R12). Wheels **~4–6"** skinny rubber; **~6"** was the working hypothesis at this date (R13). Later notes prefer **5"** and put **in-wheel BLDC FOC** on the rim.

### 2026-09-20 — #5 modes (consolidated here)

Four **manual** control modes **before** autonomy (R14):

1. **`PARKED`** — safe idle / failsafe; no balance loop driving wheels
2. **`TWO_WHEEL`** — both wheels active; bipedal teleop
3. **`LEFT_ONLY`** — balance / drive on the left planted wheel; right leg free
4. **`RIGHT_ONLY`** — mirror

Pilot selects via **TBS Nano** (likely aux / flight-modes style). Wi‑Fi telem reports the active mode. Mode change does not lift, plant, or path-follow.

### 2026-09-20 — #6 CoG / hip-roll / reuse-control (consolidated here)

V1 overall width **~10"** (R15). One-leg balance is a **full loop** (R17): hip roll keeps weight over the planted wheel **and** that wheel drives fore/aft (inverted-pendulum pitch). **Reuse existing control** — do not write a novel Hux balance stack for V1 (R18). Pointers: XRobots TallBalancer / SonicRobot / RobotX, Hattori, Mini-Cheetah-style stacks, FC attitude loops, ODrive / FOC torque modes.

Hip roll was "TBD if mandatory for V1" in this packet. **#10 supersedes that softness:** hip roll is **in V1**.

### 2026-09-20 — #7 fabrication / 2D-before-3D (consolidated here)

- **R19** — Prefer cheap **COTS** stock for primary structure (carbon rods / tubes, metal stock, fasteners). Printed parts are joints / hubs / brackets.
- **R20** — Customs are **draft-friendly** (print now, mold later).
- **R21** — **Wire openings and ports** through links and body.
- **R22** — **Serviceable V1**: fasteners, pack, FC, actuators as replaceable modules.
- **R23** — **Several 2D sketch layouts before any Blender / 3D CAD.** Hard process gate.

### 2026-09-20 — #8 mass / wheel motors (consolidated here; mass hardness superseded)

Wheel motors sized for **reaction speed / torque bandwidth** (balance), not max continuous power (R25). Candidate *classes*: lightweight gimbal BLDC ~2208–4108 + FOC + encoder; mid small-outrunner + reduction if needed. Avoid SonicRobot-class 63xx / hoverboard hubs.

Original **under 6 lb** / aspirational **4–5 lb** target (R24) is kept as a **historical preference only**. **#15 supersedes** any hard mass ceiling: budget is **soft / blown**.

### 2026-09-20 — #9 leg actuators by axis (consolidated here)

Jobs differ — do not force one actuator type on every axis (R26). Trade write-up: [`research/actuators-legs.md`](research/actuators-legs.md).

| Axis | Job | Class lean (later refined) |
| --- | --- | --- |
| Hip roll | Highest bandwidth, continuous small corrections, prefer backdrivable | Dynamic FOC / QDD / fast servo — **locked in V1 by #10** |
| Hip swing | Position + speed for the step cycle | **Servo vs stepper+belt TBD** (#14) |
| Knee | Highest gravity + step torque for ~9.5" | **Servo vs stepper+belt TBD** (#14); springs / linkage still recommended |

### 2026-09-20 — #10 V1 actuator baseline + 8-axis I/O + hip roll in V1 (consolidated here; swing/knee lock lifted)

**Hip roll is IN V1** (R16 / R27): dynamic FOC BLDC / small QDD / fast bus servo. Experimental — may not work as hoped. Still ship the joint and `LEFT_ONLY` / `RIGHT_ONLY`. **Not a stepper. Not V2.**

This packet also locked knee + hip swing to **stepper + belt/gear**. **#14 lifts that lock.** What remains:

- Wheels stay **brushless FOC** (R6).
- **8-axis I/O** (R29) is the architecture **if** pose joints are steppers: 2 wheel BLDC + 4 steppers + 2 hip-roll dynamic.
- **FC does not drive stepper coils.** TMC-class / multi-axis driver board(s) between host and motors. Preferred: FC = IMU + wheel FOC (+ hip-roll if PWM/CAN); **Pi or dedicated stepper controller** = 4× step/dir.
- Drone firmware as a stepper host is a V1 **anti-pattern**.

### 2026-09-20 — #11 electronics-minimum (consolidated here)

Minimum electronics plan: [`electronics-minimum.md`](electronics-minimum.md). Text block diagram, parts *classes* (not SKUs), phased assemble order **P0–P5**. FC stays TBD. No spend.

### 2026-09-20 — #12 mechanical layout (consolidated here)

- **R30** — Wheel drive **BLDC at the wheel** (hub / coaxial), not remote from the hip.
- **R31** — **kV match** is a sizing *goal* (4S + diameter + balance bandwidth). No invented number.
- **R32** — If pose joints are steppers: mount **high** (above the knee); **belts** to the pivots.
- **R33** — If belts: **one inside, one outside**; integrate toothed pulley into the printed custom where draft-friendly.

Hip roll stays the V1 **dynamic** actuator. Placement TBD. Do not drop CoG with heavy roll actuators if avoidable.

### 2026-09-20 — #13 parts-on-hand + shop (consolidated here)

Inventory: [`parts-on-hand.md`](parts-on-hand.md). Shop tools (not parts): [`capabilities.md`](capabilities.md).

- **Zantle 5"** walker wheels ordered (ASIN B0D534PDRT). **OK to hack apart** — disposable donor rubber, not a part to preserve.
- Wheel diameter soft-preference moves to **5"** (still 4–6" band).
- Shop: mill, lathe, metal bender, metal brake, bandsaw, soldering, welding, breadboards. Hardware fab is intentional.

### 2026-09-20 — #14 Serra / Build Some Stuff + servo vs stepper TBD + 2× plant + 4S step-down (consolidated here)

Steal [Kelton Serra / Build Some Stuff](research/inspiration.md) **packaging**, not files: in-wheel BLDC + encoder; jointed legs keep CoG over contact as height changes; serviceable modular prints; wheel-under-CoG correction geometry.

- **R12 lifted:** knee / hip swing are **servo vs stepper+belt TBD**. No lean either way. Serra's 40 kg-class servos are a data point, not a Hux SKU.
- **R36:** plant-side knee / hip / hip roll see roughly **~2×** two-wheel stance. Size for that case.
- **R11 addendum:** keep **4S**; add **controlled step-down** (BEC / regulator *class*) to 5 V / 6 V / 7.4 V pose or logic rails so wheel FOC spikes do not brown out planted joints.

### 2026-09-21 — #15 carbon tubes + ~24" height + soft mass (consolidated here)

- **R34** — Primary **upper + lower leg spars** are **carbon fiber tubes**. Printed / machined **end fittings** only.
- **R35** — V1 height up to **~24" at full extension**. Width stays **~10"**. Still must reach **~9.5"** with margin.
- **R24** — Mass budget is **explicitly blown / soft**. Capability and packaging beat the old 4–5 lb / under 6 lb numbers. Those stay as historical preference, **not a kill-switch**.
- Longer tubes → longer belt runs if a belt is the reducer. Joint actuators sit at hip / knee with tube between.
- **GIM8108-class** noted as a knee / swing *candidate* (not ordered, not locked). Aligns with #14's open class.

### 2026-09-21 — consolidation PR (this file)

Open PRs **#5–#15** conflicted with each other and with `main` (which already had #1–#4). Unique content is merged here. **Latest intent wins** on actuators and mass. After this lands, close #5–#15 as obsolete.

### 2026-09-21 — Tazer lessons (folded into consolidation)

Steve shared [Tazer — My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM): **learn a lot from this guy's mistakes.** Note: [`research/tazer-lessons.md`](research/tazer-lessons.md).

Does **not** change locks. Reinforces: GIM8108-class is a live *candidate* (still not ordered); carbon tubes confirmed; 4S stays preferred (lighter than his ~48 V) but FOC stalls still need a real power bus, not a logic PCB; start with simple PID / existing control (R18), not LQR-on-a-bad-model; rubber not TPU; carbon-dust PPE; serviceability + software torque limits later.

### 2026-09-21 — #17 Stompy CAD→sim→real

Steve asked to analyze [Stompy](https://www.youtube.com/watch?v=gEjg179fvmc) (Kayden Knapik — week-build RL walking biped), especially simulations and matching CAD to reality. Note: [`research/stompy-sim2real.md`](research/stompy-sim2real.md). Indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md), and [`research/README.md`](research/README.md).

Does **not** change locks. Walking ≠ Hux wheeled balance — still steal fixture / home pose, measure-vs-CAD, tether, default angles in CAD+firmware, and a later CAD→model lockstep for geometry / stairs. **Do not require RL walking for Hux V1.** Keep **reuse simple balance control** (R18). Sim is not a day-one wheel-balance task. No spend. No Jetson / Robstride / mjlab lock.

### 2026-09-21 — #18 Diablo wheeled-leg research

Steve shared [ETA Prime's Diablo review](https://www.youtube.com/watch?v=S5PoZ8aNwvs) plus paper [arXiv:2407.21500](https://ar5iv.labs.arxiv.org/html/2407.21500) (Direct Drive Tech / DDTRobot commercial self-balancing wheeled-leg). Note: [`research/diablo.md`](research/diablo.md). Indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md), and [`research/README.md`](research/README.md). Shop / SDK cited only.

Does **not** change locks. Steal: split brain (Pi vs motor board), DD/QDD as a *class* for high-bandwidth joints, **LQR/PID before RL**, height modes as states, aux contact later, payload vs height. **Do not buy Diablo.** Do not scale Hux to ~22 kg. No head tilt / cargo / creep rollers for V1. Keep **reuse simple balance** (R18). Hardware stays **TBD**. No spend. No M1502D / ROS2 / Pi4-as-FC lock.

### 2026-09-21 — leg geometry + wheel contact

Steve asked for a plan review and new leg math. The ordered walker wheels are not a good enough foot. He is considering a small spoked bike tire with real rubber. Carpet and interior floors can wait.

Study: [`research/leg-geometry.md`](research/leg-geometry.md). **No spend. No tire SKU. Spokes not locked.**

- **R13 updated.** The **4–6" / 5" preferred** contact plan is dropped. Zantle stays a disposable **bench donor**. Working draw is **~8" OD**, **~1–1.25" wide**, real rubber, torsionally stiff, until a real tread is measured. A **12–16"** kids bike wheel fails the tread, the **~10"** width, or the reaction-speed trade.
- Hip over the wheel: knee gravity is the poke (a few N·m); a spring cancels the two-leg share. Hip roll sees the large moment when the other wheel unloads (`m g ×` half-track, ~6.5 N·m at 6 kg on the draw).
- Tubes stay stiff (bending above ~40 Hz). Give lives in the spring and in radial tire compliance.
- The old **~0.8 N·m** wheel figure is historical (2 kg). Wheel target on the 8" draw is about **3–4 N·m peak**. Not a SKU.

### 2026-09-21 — wheel settled at 6"

Steve: the wheel has to fit comfortably on one stair so the robot can pivot and place the raised wheel on the next step. Settle the diameter early.

Study update: [`research/leg-geometry.md`](research/leg-geometry.md). **No spend. No tire SKU.**

- **Design step is 9.5" rise × 9.5" going**, nosing to nosing. The going matches the riser already in R3. A deeper measured tread is spare margin, not a reason to grow the wheel. Reopen only if a measured going is under ~9".
- **R13 settled at 6" overall diameter** (5.75–6.25" still counts), width ~1–1.25", real rubber, torsionally stiff. The whole tire sits between the nosing planes with about **±1.75"** of balance roll, and about **2.5"** of air under a 1" soffit.
- The **~8" working draw is withdrawn.** On a 9.5" going it leaves about ±0.75" of roll. A 12" kids wheel does not enter the slot.
- Leg draw follows: **7.5" + 7.5"** tubes, **6"** of body above the hip. Wheel peak about **3 N·m** on the 6 kg example. Not a motor SKU.

### 2026-09-21 — first buy

Steve asked whether a BOM existed and said he wants parts coming. There was no buy list. [`bom.md`](bom.md) is that list.

Spend is open **only** for 3× **6×1.25** ribbed pneumatic tires, 3× matching tubes, and 2× **1 m** carbon tube (**16 mm OD**, 12–14 mm ID). Motors, GIM8108, drivers, and another FC stay unauthorized. Zantle, the on-hand FC pile, TBS Nano, ESP32, and the Pi are not reordered.

### 2026-09-21 — knee to the rear, face, cameras

On the living drawings, Steve wants the **knee behind** the hip. Poke stays about **2.9"** at the 92% stance. The page also carries rough motor bulk (not a buy), seven cameras (front stereo pair plus back, sides, top, bottom), a small front display for preset faces, and an RGB in each eye socket. The lit socket is the eye. None of the face or camera parts are authorized to buy.

### 2026-09-21 — 14" wide, BOM prices

Overall width moves from **~10"** to **~14"** (R15). The head stays a narrower unit, about **7"** on the drawing. Wheels and legs are outside it. Track is about **12.75"** with a 1.25" tire, so the one-leg moment at 6 kg is about **9.5 N·m**.

[`bom.md`](bom.md) now has store links, line prices, and totals. **$89.41** is the authorized order. The working total of about **$1,140** includes class estimates for parts that are not chosen and not authorized.

### 2026-09-22 — stair climb dynamics in the living drawings

Steve asked for judgement calls on gravity, weight, CoM, momentum, inertia and motion in the stair animation, and for the tool to be improved. The climb in `tools/living-drawings/kin.js` now models the front wheel rolling back under the mass during the flight and catching the leftover after the crest, joint torques for both legs, the lateral sway and roll moment (with a front view), real-time playback, and design knobs that rebuild the step. Findings in [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md): on the settled geometry the step-to gait is a **±6% precision throw** because the rear leg leaves the mass 2.7" behind the front contact; a **forward landing error of ½" makes the step impossible**, so aim at the rear of the slot; body CoM **1–2" ahead of the hip axes** is the cheapest fix and makes the step routine; the knee is a **~10.6 N·m** holding joint standing up over the front wheel, not the 4.4 N·m stance figure. **Nothing locked.** No spend. The lump masses are still a picture, not a weighed robot.

### 2026-09-22 — Hux bot advisory + digital-twin horizon

Steve set the Hux-bot role and a long-term north star. **Docs only. No lock lifted. No spend. No SKU. No BOM cart rewrite.**

- **Role:** Hux bot is advisory / tracking / brainstorming / adversarial opinions. Not a large-task executor. The repo stays the plan SoT. Planning notes get updated; builds / CAD / firmware / spend wait for a specific Steve ask.
- **Current state:** stance **~14"**, **6"** foot locked, BOM started, living-drawings + stair-climb-dynamics and Diablo / Stompy / Tazer research are on `main`. Plan language should talk about that machine, not the early ~10" / soft-5" era.
- **Inventory ≠ design driver.** Parts on hand inform options. Prefer the correct actuators and wheels over the shelf. Zantle 5" stays a bench donor (already documented).
- **Spend rails:** avoid wrong actuators / wheels; keep cheap. Authorized spend is whatever [`bom.md`](bom.md) already says. Do not expand the order-now cart. Steve owns those breakout edits.
- **Horizon:** identical digital twin + training dojo (ML/RL) so a policy trained in sim runs locally. Later domains: stairs, rubble, dirt, fall leaves, wet mud. **Phased:** V1 classical / reused balance + modes (R14 / R18) → later CAD/URDF twin lockstep (Stompy) → later dojo / RL for hard terrains. Do **not** replace R18 with an RL gate. Consistent with Tazer / Diablo / Stompy: LQR / PID before RL.
- **Motion control:** high-bandwidth FOC / QDD / model-based loops where they matter (wheels, hip roll). Class only. No vendor lock.

### 2026-09-22 — 3D sandbox in the living drawings

Steve asked for a 3D view of the robot in the living drawings, three.js with simple controls, "almost like a video game" but with accurate physics and kinematics, as a first pass at fleshing out the design. Added [`tools/living-drawings/sim.html`](../tools/living-drawings/sim.html): Rapier rigid bodies at 2 kHz built from the same `kin.js` geometry and lumps, torque-limited joints, an LQR balance loop at 500 Hz, keyboard / gamepad / touch driving, and a course with the 9.5" × 9.5" stair, ramps, sills, a curb and wet tile. `npm test` in that folder checks it headless. Findings in [`research/sim-sandbox.md`](research/sim-sandbox.md): a **1" sill** crosses only near 1 m/s (6" wheel needs μ ≈ 1.1 to climb it on traction; knee saturates on the hit); **PARKED has no rest pose** (it rolls onto its back over the knee housings); one-wheel hold is not solved in the sandbox yet; one-wheel hip-roll holding torque ~9 N·m agrees with the 2D number. **Flags:** this is a design toy, not the digital twin and not a V1 job ([`software.md`](software.md)); the 3D robot is built only from the 2D numbers, so it is not CAD ahead of R23. The rear **parking skid** in the sandbox is a **proposal, off by default, not a decision**. Nothing locked. No spend.

### 2026-09-23 — sandbox second pass: ride height, suspension, stumbles, one wheel

Steve asked for ride-height control with a **medium stance by default** (lower CoG), leg suspension with an active lift on impact, better stumble recovery, and a planned, coordinated one-leg stand (the free leg kicked out wildly). All in the 3D sandbox; findings in [`research/sim-sandbox.md`](research/sim-sandbox.md) (second pass). Default ride is now **75%** (hip 14.3" vs 16.8") with Low / Medium / High presets. Legs are a 3.5 Hz virtual spring-damper. An impact reflex and a stall hop lift the wheel over edges: the **1" sill now crosses from 0.5 to 1.0 m/s** (was only 1.0). A capture-point leg catch and a hip-roll side step raise sideways shove recovery from **3 to 5.5 N·s**. The one-leg kick was a controller bug (balance point ~4° off → hip roll slammed to its limit); LEFT / RIGHT ONLY is now a planned **poise** over one wheel with ~15% left on the other, holding ~3.3 N·m on the planted hip roll. **Free wheel fully off the floor is still not held**; experimental switch, off. **Flags:** 75% is a sandbox driving default, not a change to the 92% stance in `leg-geometry.md` / the stair climb; the suspension and hop need **torque-controlled, backdrivable knee and hip-swing joints (FOC / QDD class) or real springs**. That leans on the open "servo vs stepper+belt" row; **Steve's call**, not decided here. Nothing locked. No spend.

### 2026-09-23 — geometry / contact / feasibility honesty (283bd23)

Major honesty pass already on `main`, not previously logged here. Implemented in the living-drawings model and recorded in [`research/model-corrections.md`](research/model-corrections.md), [`research/sim-sandbox.md`](research/sim-sandbox.md), [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md). **No lock change. No spend.**

Shared spatial FK/IK (side and front no longer imply different mechanisms); whole-robot CoM; tipping moment is not hip holding torque; stair playback no longer looks successful when it is not — **current stair candidate rejected** (197/201 spatial samples fail). Tire: 6" sphere → rounded convex **6 × 1.25"** hull (free-roll numerical error still ~3%). Joint stops, self-contact, delayed sensing / drive lag, yaw integral, observed support vs requested mode, refuse `PARKED` without rest support. Historical planar pack-forward / ±6% throw recommendations retired as design decisions. **True one-wheel hold still fails.** Collision and tire remain approximations — the visual cylinder and the rounded hull are not a motorcycle crown (see 2026-09-25).

### 2026-09-24 — SpdrBot Isaac Sim research

Steve shared [Indystry SpdrBot](https://www.youtube.com/watch?v=YDzHL2JSCHc) plus [Indystrycc/SpdrBot](https://github.com/Indystrycc/SpdrBot) (Isaac Sim / Isaac Lab 4-leg spider; Fusion → URDF → USD; RL then a hand-tuned gait). Note: [`research/spdrbot.md`](research/spdrbot.md). Indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md) (Phase E + research index), and [`research/README.md`](research/README.md).

Does **not** change locks. Docs only. No spend. No SKU. No BOM cart rewrite. No CAD / firmware. Steal for the **Phase E** twin / dojo horizon: observation parity with real sensors, CAD→URDF→USD lockstep, reward-hacking risk, validate in Sim before hardware, mid/zero before assembly, power delivery, friction hacks can hurt. **Do not** adopt spider morphology, the hobby-servo / Pico stack, buy Indystry packs, stand up Isaac Lab before `TWO_WHEEL`, assume RL drops onto the robot, or buy a 4090 for V1. Ties to Stompy CAD/reality, Diablo LQR-before-RL, Phase E in the study plan, and **R18** classical first.

### 2026-09-25 — twin pipeline TBD, hip-roll rethink open, tire crown, website sync

Steve asked to log the 2026-09-25 planning conversation while hardware and planning run in parallel. He wants pipeline *direction* before / while hardware. **Docs only. No lock lifted. No spend. No SKU. No BOM cart. No CAD / firmware.** Hip roll stays **IN V1** (R16). Twin / RL stays a **horizon**.

- **Twin / RL pipeline TBD.** Choosing a digital-twin / RL simulation software pipeline is open research, not a stack lock. **Lock the contract first:** CAD→URDF/USD or MJCF lockstep, observation parity with real sensors, motorcycle-crown tire contact, firmware zeros matching the model, and willingness to live in the stack. Do **not** stand up Isaac Lab, buy a 4090, or make RL a V1 balance gate before `TWO_WHEEL`. Do **not** lock Isaac / MuJoCo / mjlab. Matches SpdrBot / Diablo / Stompy / R18 / Phase E. See [`software.md`](software.md) and [`research/study-plan.md`](research/study-plan.md).
- **Living-drawings ≠ twin.** The 3D sandbox taught a lot and framed capabilities / expectations. It is a **design toy**, not the identical digital twin. Findings: [`research/sim-sandbox.md`](research/sim-sandbox.md).
- **Hip-roll rethink (open).** Steve does **not** like the hip-pivot unload to get onto one foot — it seems to work poorly. Log the dislike. **Do not remove the R16 lock.** Bad feel may be the wrong stair trajectory, the two-contact poise, or sim contact — not proof the DOF is useless. Separate (1) need some lateral CoG path, (2) is hip roll the cheapest DOF, (3) is the stair path asking an infeasible throw. The stair candidate is already **rejected** in [`research/model-corrections.md`](research/model-corrections.md) / [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md).
- **Tire crown.** Sandbox wheels look like a flat ~90° edge profile, not a motorcycle-round rubber crown. A real Hux tire should keep a rubber contact pad when tipped / cambered. A hard edge messes lean / one-leg physics. Real world may be better; the twin **must** match the crown. Sep 23 already moved sphere → rounded convex 6×1.25 hull; visual is still `THREE.CylinderGeometry` (flat shoulders) and collision is not a true torus. Half-fixed. Twin / sandbox honesty requirement.
- **Website vs docs.** Living-drawings F765-Wing / Pi 5 pages are a concrete **bench plan** Steve wrote. Canonical docs still say **FC TBD** ([`electronics.md`](electronics.md), [`software.md`](software.md)). Keep website language from looking more locked than the plan.

### 2026-09-25 — tire crown and contact pad fixed in the sandbox

Steve: the tire profile / contact pad notes above "need to get fixed". Done in `tools/living-drawings/`: one shared cross-section (`tire.js`, full-round crown by default, `M.tireCrown` flattens it) now builds the Rapier hull, the Three.js lathe mesh and the 2D projection, so the flat-shoulder cylinder is gone and the contact walks the crown under camber (tested at 0–30°). Each wheel is a hub plus a **tread ring on a carcass spring** (`tireK` 40 kN/m, `tireZeta` 0.2 — guesses, knobs); the HUD shows squish and the implied pad. Side finding: the one-leg poise controller pivoted on the **hub**, but a cambered crown touches an inch away from under it — the poise was on its own bail-out threshold, and the compliant tire exposed it (fell). Pivoting on the crown contact (`contactOf`) fixed the poise (free-wheel load 11–31% vs 3–24%, planted hip roll 4.3 vs 6.6 N·m). Regression suite updated and passing. **No lock changed. No spend.** The tire stiffness is unmeasured; measure a real 6×1.25 before trusting the pad numbers. The twin-contract requirement (crown contact) is now met by the sandbox, which is still a design toy, not the twin. Findings: [`research/sim-sandbox.md`](research/sim-sandbox.md).

### 2026-09-26 — compute / stack review, then 6S, CAN, control core, ROS 2 companion

Steve asked for a review of the software stack and whether a "$400–600 NVIDIA SBC" fits ([`research/compute-stack-review.md`](research/compute-stack-review.md)). Findings: the F765-Wing has **no CAN**; every torque-mode actuator on the candidate list speaks CAN; the bench firmware plan lacked blackbox, live params, a framed link and a hardware torque cut; the Pi 5 is right for V1 and wrong for seven cameras; Jetson prices moved 2026-07-22 (Orin Nano Super kit $399, Orin NX 16 GB module $999).

Steve then said **nothing is locked**, he owns the Pi 5 and F765 but need not use them, and he wants to **make this a real project** — a stepping stone is fine if the logic carries, otherwise start on the better board. He approved **4S → 6S** (large pack or two in parallel; LiPo or similar).

**Decided (supersedes older language above):**

- **Power: 6S** class, ~22.2 V nominal / 25.2 V full. Later the same day Steve picked a pack — **one 6S 5200 mAh 60C LiPo with XT90** — then said it was picked somewhat randomly, a smaller pack is fine, he wants reasonable runtime, and **"add the anti spark"** (XT90-S on the harness — done). The actuator check that followed ([`research/actuator-shortlist.md`](research/actuator-shortlist.md)) found the RobStride 00/01/02 input floor is **24 V**, below a 6S pack for most of its discharge. **Pack is on hold; recommendation is 8S 2700–3300 mAh.** Steve's confirmation of 8S (or a 6S-compatible actuator set) closes it, and the 6S language on the canonical pages gets swept to 8S then. Rails: **5 V** (MCU, RX, Pi), **12–19 V** (companion slot; a Jetson kit needs this — 6S full exceeds its 19 V input), pose rail if servos. Motor bus is 6S direct.
- **Actuator bus is CAN.** Wheels, hip roll, and — working class — knee / hip swing are **CAN QDD / FOC actuators with their own PD** on 6S. Servo / stepper for knee and swing drop to **fallback** status; steppers stay off roll and wheels. **This bus decision picks the MCU.**
- **Control core is a portable library.** Estimator, mode machine and balance controller in plain C++, no hardware calls, unit-tested; the same code links into the MCU firmware, the companion and the twin. Carry-forward is by design, not by porting.
- **Real-time MCU with CAN** runs the core at 1 kHz with IMU, CRSF, hardware watchdog and torque cut. **F765-Wing is P0–P1 bench learning only** (CRSF, one SimpleFOC wheel). **Steve (same day): "add the CAN MCU to the project." Picked: Teensy 4.1** + ICM-42688-P breakout + 3× CAN transceivers, in the [`bom.md`](bom.md) order-now table (~$55). Teensy over H743-WING because eight classic-CAN nodes need at least two buses at 1 kHz.
- **Companion: ROS 2 on Linux.** "No ROS" (V1 minimalism) is withdrawn for the companion; the MCU stays plain. Pi 5 now, containerized, V4L2/GStreamer cameras, no Pi-specific libraries. **Jetson (Orin Nano Super kit class) is the P5 perception buy**, not a V1 buy; the head carries a companion slot sized for it.
- **First image** must include blackbox logging (SD / MCAP), live parameters, a framed CRC'd binary link before any setpoint goes down, encoder velocity in the estimator, and a hardware torque cut. "Blink and print" is not the first image.

**Not changed:** R14 modes before autonomy; R18 reuse an existing balance pattern, PID before LQR before RL; hip roll in V1; 6" wheel; 9.5" × 9.5" step; 2D before CAD; twin pipeline TBD, contract first; no spend beyond [`bom.md`](bom.md) until Steve asks. **Spend implied but not yet authorized:** a CAN RT board (~$30–70) and the actuators; Steve owns those cart lines.

---

### 2026-09-26 — one-leg stance study: shift mechanics, hold torque, why the stand fails, hop budget

Steve asked for more high-effort simulation on the physics and geometry of the one-leg movement: the one-leg stand needed much more work, the hip-roll weight-shift mechanics were unclear, and the one-leg action did not work in the sandbox. Findings in [`research/one-leg-stance.md`](research/one-leg-stance.md); closed form in `tools/living-drawings/frontal.js`, checked against the Rapier sandbox. Ran in parallel with the same-day stack decision above and is consistent with it (the hip-roll hold becomes a torque feed-forward the control core sends to a CAN QDD actuator's PD). **Docs and sandbox only. No lock changed. No spend.**

- **Shift mechanics.** Both wheels down, the legs + body + floor are a parallelogram: both hip rolls turn the same angle. **24.7°** puts the mass over one crown contact at the 92% stance (29.5° at 75%); the axle spacer costs, the crown walk helps. 9.7° of the ±34° roll travel is left.
- **Hold torque.** The planted hip roll carries the body + free leg cantilever whenever a wheel is up: **8.3 N·m continuous** at 5.4" hips (5.4 at 3.5", 3.1 at 2"), **12–13 N·m peak** through a hop. That is above a GIM8108-class nominal (7.5). The 2026-09-22 "0 if the sway is done first" was the tipping moment, not the joint torque.
- **The static one-wheel stand is not a controller problem.** It is an acrobot (passive crown contact, two hip rolls as the only actuators) with the body CoM at hip-axis height, so rolling the body barely moves the mass: a 10 mm CoM error costs a 40° body swing on the planted hip (9° with both hips, but 52° of free-leg swing). **Capture region 2–3 mm.** The sandbox confirms it even with roll limits, torque and delay removed. Not a V1 capability on this geometry, whatever the firmware.
- **Dynamic single support is what the stair needs**, and it works within a clock: from a ~8% poise, ≤ 0.3 s in the air with a ±20 mm CoM estimate (≤ 0.5 s with ±5 mm or a one-shot 10° hip swing, worth ~11 mm). The sandbox lands and returns a 0.2 s hop (asserted in `npm test`); longer hops land but the return is unfinished controller work.
- **Sandbox fixes with hardware meaning:** hip-roll position hold needs integral / gravity feed-forward (a 90 N·m/rad hold sagged 4° = 40 mm of mass shift when the free wheel left); one stiff hip and one soft on the closed parallelogram; no leg-length levelling while the mass is off centre.

**Flags for Steve (contradictions with what is on file, not changed here):** R17 frames one-leg balance as a full-loop *gate before any stair cycle*; the physics says the achievable gate is a timed hop, not a hold. R36's "~2×" plant-side sizing is right for the knee/swing but the hip roll needs the 8.3 N·m hold + 13 N·m peak number, not a ratio. The 14" width / 5.4" hip offset is what sets that hold; bringing the roll axes inboard is the cheapest lever and is a 2D-layout question (R23), not a decision made here.

## How to log the next merge

When a docs PR merges, add a dated heading:

```
### YYYY-MM-DD — #<n> <short title> (merged)

One-paragraph intent. Note any ID it owns or supersedes.
```

Keep the **Current locked decisions** table honest if the new PR changes a lock.
