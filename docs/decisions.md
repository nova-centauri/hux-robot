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
| Power | **All-electric.** **4S LiPo** class + **regulated step-down** for pose / logic. TBS Nano RX. **FC TBD.** |
| Wheels | **6" OD locked** (a real tire at **5.75–6.25"** still counts). Width **~1–1.25"**. Real rubber, torsionally stiff. **In-wheel BLDC FOC.** Zantle 5" is a bench donor, not the foot. Not a buy. No spokes. |
| Knee + hip swing | **Servo vs stepper+belt TBD.** Size for **~2× one-leg plant load.** No lean. |
| Hip roll | **IN V1** (dynamic FOC / QDD / fast servo), even if imperfect. Not a stepper. Not V2. |
| Structure / envelope | **Carbon fiber tubes** for upper / lower leg spars. **~24"** full extension. **~14"** outside width. Head inside, wheels and legs outside the head. Mass budget **soft / blown.** |
| Fabrication | **COTS** structure, **draft-friendly** customs, **wire ports**, **serviceability**, **2D before Blender** |
| Shop | Mill / lathe / brake / bender / bandsaw / weld / solder / breadboards. Fab is welcome. |
| Stepper I/O (if chosen) | **FC does not drive stepper coils.** Stepper drivers / Pi for pose. |
| Research | Steal **Build Some Stuff (Serra)** + **Roadrunner** + **FrRonconi** + **XRobots** as research / inspiration. **Tazer**: learn from the mistakes (anti-patterns). **Stompy**: CAD/reality match + shared zero; **not** RL walking for V1. **Diablo**: split brain, DD/QDD class, LQR/PID before RL, height as states; **do not buy**; not 22 kg; no head/cargo V1. Do not vendor. |
| Candidate (not ordered) | **GIM8108-8** noted for knee / swing. Not a lock. Not a buy. |

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

---

## How to log the next merge

When a docs PR merges, add a dated heading:

```
### YYYY-MM-DD — #<n> <short title> (merged)

One-paragraph intent. Note any ID it owns or supersedes.
```

Keep the **Current locked decisions** table honest if the new PR changes a lock.
