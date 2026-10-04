# Decisions

This is the dated log of the decisions of the user for Hux, in the order that they landed on `main`. The newest intent **supersedes** older language on the same topic.

**Standing rule (the user):** merge docs PRs promptly. Keep `main` current. **Log each merge here.** Do not leave docs PRs that conflict open against a stale `main`.

The source of truth is this repo (`nova-centauri/hux-robot`). Docs only. **No spend.** No SKU locks beyond the locks that are already decided below.

## Current governing decisions — V1-PROOF, updated 2026-10-04

The user extended V1-PROOF to dependable forward/reverse traversal, left/right turns, rotation in place, bounded pushes/uneven terrain and concrete component decisions. This extends the proof scope but keeps its cost, mass and four-axis limits. The earlier dated entries remain history.

| Topic | Current decision |
| --- | --- |
| Active model | V1-PROOF is current; V0-GENESIS names the old planning model (historically STAIR-V1); a third version follows the proof, with scope/name open |
| Cost / mass | Strictly < $1,000; **$900** allocation including $225 reserves; 2.5 kg target / 3.0 kg maximum |
| Actuators | **2 × Pololu 4752 wheels + 2 × ST3215 12 V variant legs through 3:1 belts**; first mobility with pinned 30° legs |
| Drivers | **2 × Pololu 4035 DRV8874**, configured current limiting, sleep/kill/watchdog, PH/EN and fixed-off-time regulation |
| Control / sensing | **Pico 2 + SparkFun LSM6DSO received, SPI planned**, encoder/current/fault/battery feedback; USB, sensor and timing qualification open |
| Power | 3S approximately 2.2 Ah; **9 V servo / 5 V logic branches**; actual pack, regulators and protection require measured circuit qualification |
| Cameras | **Zero onboard in V1**; existing external video for trials; perception is a later version gate |
| Motion | 0.25 m/s cruise, 0.15 m/s uneven fixtures, 0.4 rad/s arc / 0.6 rad/s pivot; 0.5 m/s not yet qualified |
| Disturbances | Qualification targets: 0.8 N·s longitudinal / 0.4 N·s lateral at 0.20 m, 50/200 ms pulses; 3° grades/cross-slopes, 5 mm smooth bump, 3 mm seam |
| Evidence | Pinned-leg 3D closed-loop simulation with seed/parameter sweep and failure cases; physical validation and powered-leg dynamics remain open |
| Next versions | Carry measured actuator/sensor models, telemetry, fault behavior and tests forward; no promised stair upgrade of this chassis |
| Orders / publication | **Motor/drivers, Pico and LSM6DSO received; 2 × ST3215 ordered; $173.70 recorded spend**. Second wheel motor still required; total delivered driver count pending. User confirms servo 12 V variant. New order charge breakdown is unshown. Publish through the existing CI/CD when authorized and verify live pages. |
| Writing standard | **All active text obeys ASD-STE100 Simplified Technical English** (2026-10-04); `python3 tools/ste/check_repo.py` is a build gate in `npm run test:site`; `docs/archive/`, `docs/research/` and the V0-GENESIS pages stay historical |

Refer to [hardware decisions](v1-proof-hardware.md), [simulation evidence](v1-proof-simulation.md), [physical acceptance](v1-proof-validation.md), [PF requirements](requirements.md) and [numerical source](../tools/v1-proof/model.json). The hardware selections are the current engineering baseline. They remain subject to explicit bench rejection criteria and budget limits.

---

## Log

### 2026-10-04 — Simplified Technical English becomes the writing standard

The user asked us to include the [simplified-technical-english skill](https://github.com/0xpili/simplified-technical-english) in the notes and to enforce it in all text. We vendored the skill in `tools/ste/` and wrote the [writing standard](writing-standard.md). A root `CLAUDE.md` tells each future session to read the skill before it writes. The gate `python3 tools/ste/check_repo.py` checks the active Markdown, the V1-PROOF plan data, the V1-PROOF page text and the text constants of `build_site.py`. `npm run test:site` fails when the gate finds an error.

We rewrote 52 active files from 846 structural errors to zero. The archive, the research notes and the V0-GENESIS pages stay in their original text, labeled as historical. An independent review compared every number, date, price, part identifier, link target and checkbox before and after the rewrite. It found no changed fact. The names table in the standard fixes one name for each part. The 869-word vocabulary check stays advisory, because robotics technical names are not in the ASD list.

### 2026-10-03 — Pico and IMU received; shopping list reconciled

The user confirms that the Pico 2 and the LSM6DSO IMU are both here. Mark the existing controller/IMU order as received. Its **$30.58** is already counted, so the recorded spend remains **$173.70**, with **$726.30** remaining under the $900 plan. Keep the individual costs and charges as unknown. No more purchases and no test are reported.

Publish the homepage spend ledger and the [remaining shopping list](bom.md#remaining-shopping-list). One more wheel motor is necessary, and you must confirm the actual driver count before you buy another driver. Two ST3215 servos are already paid, and their arrival is not reported. The remaining interfaces, wheels/transmissions, controls, battery/charging, protected power, harness, assembly hardware and fixture materials need inventory or purchase confirmation. Keep the $125 repair reserve. [Order evidence](purchases.md) · [Inventory](parts-on-hand.md).

### 2026-10-03 — Pico received; ordered LSM6DSO replaces the reference IMU

The user reports the receipt of the Pico 2 and supplies a screenshot of an October 2 Amazon order with a total of **$30.58**. The screenshot shows a Pico 2 with yellow pre-soldered headers, delivered, and an **LSM6DSO IMU** (SparkFun Qwiic) with arrival tomorrow. We recorded this on October 3, and the IMU estimate is October 4. The receipt of the IMU remains unconfirmed. Add this order one time to the recorded spend: **$173.70 total, $726.30 remaining** under the $900 plan.

Leave the individual prices, shipping, tax and payment date unknown. Do not allocate the combined total to the items. Private order/account details and the unredacted screenshot stay outside the public repo.

Use the ordered LSM6DSO IMU as the sensor baseline. It explicitly replaces the earlier Adafruit LSM6DSOX selection. Its documented primary SPI, interrupt outputs and 3.3 V operation support the proposed interface. This is an engineering fit assessment, not a measured latency or balance result. Make sure that the pads/jumpers of the received breakout are correct, and implement the LSM6DSO initialization. Keep the existing ±4 g / ±500°/s / 833 Hz sensor targets and the 500 Hz control target, all subject to qualification.

Open the [Pico USB/LED checklist](checklists/2026-10-03-pico-bringup.md) with the official Raspberry Pi example UF2s. No embedded Hux firmware, no board test result and no physical milestone pass is reported. Mechanical fit work can continue in parallel with this board-only check. [Inventory](parts-on-hand.md) · [Order evidence](purchases.md) · [Hardware](v1-proof-hardware.md).

### 2026-09-29 — Paid parts lock the proof design; publish wiring and intelligence

The user requested the incoming Pololu order and the actual spend on the budget page. The user also requested an explanation of the motor connections and the V1-PROOF intelligence, and a current published living page. A read-only reconciliation of the receipts gives **one Pololu 4752 gearmotor + one DRV8874 driver shipped for $88.34**. It also gives **two ST3215 servos paid for $54.78**. Both amounts include shipping/tax.

**Total paid: $143.12**, and **$756.88 remains in the $900 planning ceiling**. That remainder must cover future purchases and reserves.

Refer to the [public-safe purchase evidence](purchases.md). The earlier notes below about missing quantities/costs are historical.

Lock the purchased motor, driver and servo models as the V1-PROOF bench baseline. The robot still needs two wheel channels, but only one is purchased. The user confirms the servo 12 V variant, and the receipt/label check remains an arrival gate. Keep the 100 mm wheels, the 3:1 leg reductions, the 110 mm links and the pinned-leg-first free-robot sequence. Hardware fit, loaded performance and control implementation remain open. A substitution needs an explicit recorded decision with bench evidence.

The six-wire connector of the wheel motor splits into driver power and encoder feedback through a harness. The Pico 2 controls the DRV8874 driver, and the encoder A/B signals need level conversion. The V1 intelligence is timestamped IMU/encoder estimation, conventional balance control, bounded human commands, slower height control and local fault handling. The existing simulation is host software. The embedded firmware and the physical balance are not yet implemented or proven. [Hardware](v1-proof-hardware.md) · [Software](software.md).

**Publication:** the host served raw source files, so the generated document pages were not available. Infrastructure [PR #27](https://github.com/nova-centauri/vps-1/pull/27) and [PR #28](https://github.com/nova-centauri/vps-1/pull/28) passed the required CI and merged in two stages. The host now builds validated releases, promotes the site atomically, checks the document routes and shows its deployed Hux revision at `/deployment.json`. We checked the baseline rendered budget and guides before we pushed this content update. The user requested this repo update and the live CI/CD validation, and authorized publication to `main`.

**Validation:** all 42 site/data/notebook/budget tests pass. The active model and simulation checks pass, and the generated site has no broken local links. This publication completes no physical milestone.

### 2026-09-29 — Versioned living build plan

The user named the old planning model **V0-GENESIS** and confirmed **V1-PROOF** again as the current build. A third version follows V1-PROOF. The third version remains without a name and without a scope. Keep the original stair research file names, dates and historical terminology under the V0-GENESIS archive. Their requirements do not govern the proof.

The website now has separate version routes and a source-backed WIP plan for orders, the single-leg bench exercise, milestone criteria and dated updates. Render the source Markdown into navigable HTML pages. Browser bench notes remain local drafts until we review them and record them in the repository. Ordered quantities, paid costs and delivery remain open. The publication of a page completes no physical test.

**Publication:** the user requested “push to main,” and this authorized the direct push of this website and planning update to `main`. All 28 site checks and the active model/simulation checks pass. The generated site contains 65 readable guides with no broken local links or section anchors. The pre-existing local vendor CAD and the downloaded meshes remain outside the commit and the published bundle. The live hosting deployment is separate and remains unverified.

### 2026-09-29 — V1-PROOF actuator orders confirmed; single-leg bench preparation

The user confirmed that the ordered actuators are **Pololu 4752 gearmotors and ST3215 12 V servos**, for the current **V1-PROOF test version**. RobStride actuators are more expensive, and their purpose is the future full-size Hux. This clarification does not establish a RobStride purchase. The older vendor-CAD purchase text that conflicts does not govern V1-PROOF.

Prepare a supported single-leg bench before the parts arrive. Use the current 110 mm parallel-link geometry. This bench can come before the two-wheel balance. Pinned legs remain the first free-robot mobility configuration. A bench supply is available, but its model/ratings are still to record. The actuator quantities, actual costs, drivers, controller and servo interface remain to record.

This entry claims no physical test and no firmware implementation. Refer to the [bench plan](one-leg-bench.md) and the [inventory](parts-on-hand.md).

**Publication:** the user requested “Commit and push this to main,” and this authorized the direct push of this change to `main`. The change holds the bench plan, the printable geometry template, the session record and the confirmed actuator inventory. Seven model checks and the generated-output consistency checks pass. The pre-existing untracked vendor CAD and the downloaded meshes are outside this change.

### 2026-09-20 — #1 scaffold (merged)

Initialize the Hux wheeled-biped docs scaffold and requirements. The SoT is this GitHub repo. The north star is to climb / descend **~9.5″** residential stairs one wheeled leg at a time. Empty `cad/`, `firmware/`, `software/`. MIT license. No spend, and the FC is not locked.

### 2026-09-20 — #2 XRobots research (merged)

Research-first study packet: [XRobots shortlist](research/xrobots.md), [study plan](research/study-plan.md) Phases A–D. Watch / extract before any print. Do not vendor the XRobots trees. RobotX is GPL3 — do not relicense Hux (MIT) without the user. The printable wheel-leg is **Phase D**.

### 2026-09-20 — #3 Roadrunner + FrRonconi inspiration (merged)

The X-share inspirations of the user: [RAI Roadrunner](research/roadrunner.md) (lab RL wheeled biped — proof that the capability exists, not a Hux stack) and the [FrRonconi student two-leg/wheel balancer](research/inspiration.md) (maker-scale style). Watch the clips. Do not build from the clips.

### 2026-09-20 — #4 electric / 4S / wheel-actuator intent (merged)

**Electric-only** powertrain (R10). The battery preference is the **4S LiPo** class (~14.8 V / ~16.8 V) — not a pack SKU (R11). The hip + knee actuators are **TBD**, class research only (R12). The wheels are **~4–6″** thin rubber. **~6″** was the working hypothesis at this date (R13). Later notes prefer **5″** and put **in-wheel BLDC FOC** on the rim.

### 2026-09-20 — #5 modes (consolidated here)

Four **manual** control modes **before** autonomy (R14):

1. **`PARKED`** — safe idle / failsafe. No balance loop drives the wheels.
2. **`TWO_WHEEL`** — both wheels active. Bipedal teleop.
3. **`LEFT_ONLY`** — balance / drive on the left planted wheel. The right leg is free.
4. **`RIGHT_ONLY`** — the mirror of `LEFT_ONLY`.

The pilot selects the mode with the **TBS Nano** (probably in the aux / flight-modes style). The Wi‑Fi telemetry reports the active mode. A mode change does not lift, plant, or follow a path.

### 2026-09-20 — #6 CoG / hip-roll / reuse-control (consolidated here)

The V1 overall width is **~10″** (R15). One-leg balance is a **full loop** (R17): the hip roll keeps the weight over the planted wheel **and** that wheel drives fore/aft (inverted-pendulum pitch). **Reuse existing control** — do not write a new Hux balance stack for V1 (R18). Pointers: XRobots TallBalancer / SonicRobot / RobotX, Hattori, Mini-Cheetah-style stacks, FC attitude loops, ODrive / FOC torque modes.

Hip roll was "TBD if mandatory for V1" in this packet. **#10 supersedes that soft decision:** hip roll is **in V1**.

### 2026-09-20 — #7 fabrication / 2D-before-3D (consolidated here)

- **R19** — Prefer cheap **COTS** stock for the primary structure (carbon rods / tubes, metal stock, fasteners). The printed parts are joints / hubs / brackets.
- **R20** — Custom parts are **draft-friendly** (print now, mold later).
- **R21** — **Wire openings and ports** through the links and the body.
- **R22** — **Serviceable V1**: the fasteners, pack, FC and actuators are replaceable modules.
- **R23** — **Several 2D sketch layouts before any Blender / 3D CAD.** This is a hard process gate.

### 2026-09-20 — #8 mass / wheel motors (consolidated here; mass hardness superseded)

Size the wheel motors for **reaction speed / torque bandwidth** (balance), not for maximum continuous power (R25). Candidate *classes*: a light gimbal BLDC ~2208–4108 + FOC + encoder, or a mid small-outrunner + reduction if necessary. Avoid SonicRobot-class 63xx / hoverboard hubs.

The original **under 6 lb** / aspirational **4–5 lb** target (R24) is kept as a **historical preference only**. **#15 supersedes** any hard mass ceiling: the budget is **soft / blown**.

### 2026-09-20 — #9 leg actuators by axis (consolidated here)

The jobs are different — do not force one actuator type on every axis (R26). The trade study is in [`research/actuators-legs.md`](research/actuators-legs.md).

| Axis | Job | Class lean (later refined) |
| --- | --- | --- |
| Hip roll | Highest bandwidth, continuous small corrections, prefer backdrivable | Dynamic FOC / QDD / fast servo — **locked in V1 by #10** |
| Hip swing | Position + speed for the step cycle | **Servo vs stepper+belt TBD** (#14) |
| Knee | Highest gravity + step torque for ~9.5″ | **Servo vs stepper+belt TBD** (#14); springs / linkage still recommended |

### 2026-09-20 — #10 V1 actuator baseline + 8-axis I/O + hip roll in V1 (consolidated here; swing/knee lock lifted)

**Hip roll is IN V1** (R16 / R27): dynamic FOC BLDC / small QDD / fast bus servo. This is experimental — it can fail to work as we hope. Still ship the joint and `LEFT_ONLY` / `RIGHT_ONLY`. **Not a stepper. Not V2.**

This packet also locked the knee + hip swing to **stepper + belt/gear**. **#14 lifts that lock.** This is what remains:

- The wheels stay **brushless FOC** (R6).
- **8-axis I/O** (R29) is the architecture **if** the pose joints are steppers: 2 wheel BLDC + 4 steppers + 2 hip-roll dynamic.
- **The FC does not drive the stepper coils.** TMC-class / multi-axis driver board(s) go between the host and the motors. Preferred: FC = IMU + wheel FOC (+ hip-roll if PWM/CAN). **Pi or dedicated stepper controller** = 4× step/dir.
- Drone firmware as a stepper host is a V1 **anti-pattern**.

### 2026-09-20 — #11 electronics-minimum (consolidated here)

The minimum electronics plan is [`electronics-minimum.md`](electronics-minimum.md). It has a text block diagram, part *classes* (not SKUs) and a phased assembly order **P0–P5**. The FC stays TBD. No spend.

### 2026-09-20 — #12 mechanical layout (consolidated here)

- **R30** — The wheel drive is a **BLDC at the wheel** (hub / coaxial), not remote from the hip.
- **R31** — A **kV match** is a sizing *goal* (4S + diameter + balance bandwidth). No invented number.
- **R32** — If the pose joints are steppers, mount them **high** (above the knee), with **belts** to the pivots.
- **R33** — If belts: **one inside, one outside**. Integrate the toothed pulley into the printed custom part where it is draft-friendly.

Hip roll stays the V1 **dynamic** actuator. The placement is TBD. Do not lower the CoG with heavy roll actuators if you can avoid it.

### 2026-09-20 — #13 parts-on-hand + shop (consolidated here)

The inventory is [`parts-on-hand.md`](parts-on-hand.md). The shop tools (not parts) are in [`capabilities.md`](capabilities.md).

- **Zantle 5″** walker wheels are ordered (ASIN B0D534PDRT). **It is OK to cut them apart** — they are disposable donor rubber, not a part to keep.
- The soft preference for the wheel diameter moves to **5″** (still in the 4–6″ band).
- Shop: mill, lathe, metal bender, metal brake, bandsaw, soldering, welding, breadboards. Hardware fabrication is intentional.

### 2026-09-20 — #14 Serra / Build Some Stuff + servo vs stepper TBD + 2× plant + 4S step-down (consolidated here)

Copy the **packaging** of [Kelton Serra / Build Some Stuff](research/inspiration.md), not the files: in-wheel BLDC + encoder. The jointed legs keep the CoG over the contact as the height changes. Serviceable modular prints. Wheel-under-CoG correction geometry.

- **R12 lifted:** the knee / hip swing are **servo vs stepper+belt TBD**. No preference either way. The 40 kg-class servos of Serra are a data point, not a Hux SKU.
- **R36:** the plant-side knee / hip / hip roll see approximately **~2×** the two-wheel stance. Size them for that case.
- **R11 addendum:** keep **4S**. Add a **controlled step-down** (BEC / regulator *class*) to the 5 V / 6 V / 7.4 V pose or logic rails. Then the wheel FOC spikes do not brown out the planted joints.

### 2026-09-21 — #15 carbon tubes + ~24″ height + soft mass (consolidated here)

- **R34** — The primary **upper + lower leg spars** are **carbon fiber tubes**. Printed / machined **end fittings** only.
- **R35** — The V1 height is up to **~24″ at full extension**. The width stays **~10″**. Hux must still reach **~9.5″** with margin.
- **R24** — The mass budget is **explicitly blown / soft**. Capability and packaging win over the old 4–5 lb / under 6 lb numbers. Those numbers stay as a historical preference, **not a kill-switch**.
- Longer tubes → longer belt runs if a belt is the reducer. The joint actuators are at the hip / knee with the tube between them.
- **GIM8108-class** is noted as a knee / swing *candidate* (not ordered, not locked). This agrees with the open class of #14.

### 2026-09-21 — consolidation PR (this file)

The open PRs **#5–#15** conflicted with each other and with `main` (which already had #1–#4). The unique content is merged here. **The latest intent wins** on actuators and mass. After this lands, close #5–#15 as obsolete.

### 2026-09-21 — Tazer lessons (folded into consolidation)

The user shared [Tazer — My Robot almost got me Kicked out of Uni](https://www.youtube.com/watch?v=gqnW9qBCHnM): **learn a lot from the mistakes of this person.** The note is [`research/tazer-lessons.md`](research/tazer-lessons.md).

This does **not** change the locks, but it reinforces these points: the GIM8108-class is a live *candidate* (still not ordered). Carbon tubes are confirmed. 4S stays preferred (lighter than his ~48 V), but FOC stalls still need a real power bus, not a logic PCB. Start with simple PID / existing control (R18), not LQR on a bad model. Rubber, not TPU, carbon-dust PPE, and serviceability + software torque limits later.

### 2026-09-21 — #17 Stompy CAD→sim→real

The user asked for an analysis of [Stompy](https://www.youtube.com/watch?v=gEjg179fvmc) (Kayden Knapik — a one-week build of an RL walking biped), especially the simulations and the match of CAD to reality. The note is [`research/stompy-sim2real.md`](research/stompy-sim2real.md). It is indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md), and [`research/README.md`](research/README.md).

This does **not** change the locks. Walking ≠ Hux wheeled balance, but still copy these: the fixture / home pose, measure-vs-CAD, the tether, default angles in CAD+firmware, and a later CAD→model lockstep for geometry / stairs. **Do not make RL walking a requirement for Hux V1.** Keep **reuse simple balance control** (R18). Sim is not a day-one wheel-balance task. No spend, and no Jetson / Robstride / mjlab lock.

### 2026-09-21 — #18 Diablo wheeled-leg research

The user shared the [Diablo review of ETA Prime](https://www.youtube.com/watch?v=S5PoZ8aNwvs) plus the paper [arXiv:2407.21500](https://ar5iv.labs.arxiv.org/html/2407.21500) (Direct Drive Tech / DDTRobot commercial self-balancing wheeled-leg). The note is [`research/diablo.md`](research/diablo.md). It is indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md), and [`research/README.md`](research/README.md). The shop / SDK are cited only.

This does **not** change the locks. Copy these: the split brain (Pi vs motor board), DD/QDD as a *class* for high-bandwidth joints, **LQR/PID before RL**, height modes as states, aux contact later, payload vs height. **Do not buy Diablo.** Do not scale Hux to ~22 kg, and do not add head tilt / cargo / creep rollers for V1. Keep **reuse simple balance** (R18), and the hardware stays **TBD**. No spend, and no M1502D / ROS2 / Pi4-as-FC lock.

### 2026-09-21 — leg geometry + wheel contact

The user asked for a plan review and new leg math. The ordered walker wheels are not a sufficient foot. The user thinks about a small spoked bike tire with real rubber. Carpet and interior floors can wait.

The study is [`research/leg-geometry.md`](research/leg-geometry.md). **No spend. No tire SKU. Spokes are not locked.**

- **R13 updated.** The **4–6″ / 5″ preferred** contact plan is dropped. Zantle stays a disposable **bench donor**. The working draw is **~8″ OD**, **~1–1.25″ wide**, real rubber, torsionally stiff, until we measure a real tread. A **12–16″** kids bike wheel fails the tread, the **~10″** width, or the reaction-speed trade.
- Hip over the wheel: the knee gravity is the poke (a few N·m). A spring cancels the two-leg share. The hip roll sees the large moment when the other wheel unloads (`m g ×` half-track, ~6.5 N·m at 6 kg on the draw).
- The tubes stay stiff (bending above ~40 Hz). The compliance lives in the spring and in the radial tire compliance.
- The old **~0.8 N·m** wheel figure is historical (2 kg). The wheel target on the 8″ draw is approximately **3–4 N·m peak**. Not a SKU.

### 2026-09-21 — wheel settled at 6″

The user: the wheel must fit easily on one stair, so that the robot can pivot and put the raised wheel on the next step. Settle the diameter early.

The study update is [`research/leg-geometry.md`](research/leg-geometry.md). **No spend. No tire SKU.**

- **The design step is 9.5″ rise × 9.5″ going**, nosing to nosing. The going is the same as the riser already in R3. A deeper measured tread is spare margin, not a reason to make the wheel larger. Open this again only if a measured going is less than ~9″.
- **R13 is settled at 6″ overall diameter** (5.75–6.25″ still counts), width ~1–1.25″, real rubber, torsionally stiff. The whole tire sits between the nosing planes with approximately **±1.75″** of balance roll, and approximately **2.5″** of air under a 1″ soffit.
- The **~8″ working draw is withdrawn.** On a 9.5″ going it leaves approximately ±0.75″ of roll. A 12″ kids wheel does not enter the slot.
- The leg draw follows: **7.5″ + 7.5″** tubes, **6″** of body above the hip. The wheel peak is approximately **3 N·m** on the 6 kg example. Not a motor SKU.

### 2026-09-21 — first buy

The user asked if a BOM existed and said that he wants parts to arrive. There was no buy list. [`bom.md`](bom.md) is that list.

Spend is open **only** for 3× **6×1.25** ribbed pneumatic tires, 3× tubes that match, and 2× **1 m** carbon tube (**16 mm OD**, 12–14 mm ID). Motors, GIM8108, drivers, and another FC stay unauthorized. Do not order Zantle, the on-hand FC pile, TBS Nano, ESP32, or the Pi again.

### 2026-09-21 — knee to the rear, face, cameras

On the living drawings, the user wants the **knee behind** the hip. The poke stays approximately **2.9″** at the 92% stance. The page also has the rough motor bulk (not a buy) and seven cameras (front stereo pair plus back, sides, top, bottom). It also has a small front display for preset faces, and an RGB in each eye socket. The lit socket is the eye. None of the face or camera parts are authorized for purchase.

### 2026-09-21 — 14″ wide, BOM prices

The overall width moves from **~10″** to **~14″** (R15). The head stays a narrower unit, approximately **7″** on the drawing.
The wheels and legs are outside the head.
The track is approximately **12.75″** with a 1.25″ tire, so the one-leg moment at 6 kg is approximately **9.5 N·m**.

[`bom.md`](bom.md) now has store links, line prices, and totals. **$89.41** is the authorized order. The working total of approximately **$1,140** includes class estimates for parts that are not selected and not authorized.

### 2026-09-22 — stair climb dynamics in the living drawings

The user asked for judgment calls on gravity, weight, CoM, momentum, inertia and motion in the stair animation, and for improvements to the tool. The climb in `tools/living-drawings/kin.js` now models these: the front wheel rolls back under the mass during the flight and catches the remainder after the crest. It also models the joint torques for both legs, the lateral sway and roll moment (with a front view), real-time playback, and design knobs that rebuild the step.

The findings are in [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md). On the settled geometry, the step-to gait is a **±6% precision throw**, because the rear leg leaves the mass 2.7″ behind the front contact.
A **forward landing error of ½″ makes the step impossible**, so aim at the rear of the slot.
A body CoM **1–2″ ahead of the hip axes** is the cheapest correction and makes the step routine.
When Hux stands up over the front wheel, the knee holds **~10.6 N·m**, not the 4.4 N·m stance figure. **Nothing is locked.** No spend, and the lump masses are still a picture, not a weighed robot.

### 2026-09-22 — Hux bot advisory + digital-twin horizon

The user set the Hux-bot role and a long-term north star. **Docs only. No lock is lifted. No spend. No SKU. No BOM cart rewrite.**

- **Role:** the Hux bot gives advice, tracks, brainstorms and gives adversarial opinions. It is not an executor of large tasks. The repo stays the plan SoT. The planning notes get updates. Builds / CAD / firmware / spend wait for a specific request from the user.
- **Current state:** stance **~14″**, **6″** foot locked, BOM started, living-drawings + stair-climb-dynamics and Diablo / Stompy / Tazer research are on `main`. The plan language must talk about that machine, not the early ~10″ / soft-5″ era.
- **Inventory ≠ design driver.** The parts on hand inform the options. Prefer the correct actuators and wheels over the shelf. Zantle 5″ stays a bench donor (already documented).
- **Spend rails:** avoid wrong actuators / wheels. Keep it cheap. The authorized spend is what [`bom.md`](bom.md) already says. Do not expand the order-now cart. The user owns those breakout edits.
- **Horizon:** an identical digital twin + training dojo (ML/RL), so that a policy trained in sim runs locally. Later domains: stairs, rubble, dirt, fall leaves, wet mud. **Phased:** V1 classical / reused balance + modes (R14 / R18) → later CAD/URDF twin lockstep (Stompy) → later dojo / RL for hard terrains. Do **not** replace R18 with an RL gate. This is consistent with Tazer / Diablo / Stompy: LQR / PID before RL.
- **Motion control:** high-bandwidth FOC / QDD / model-based loops where they matter (wheels, hip roll). Class only. No vendor lock.

### 2026-09-22 — 3D sandbox in the living drawings

The user asked for a 3D view of the robot in the living drawings: three.js with simple controls, "almost like a video game" but with accurate physics and kinematics. This was a first pass to give the design more detail.

We added [`tools/living-drawings/sim.html`](../tools/living-drawings/sim.html): Rapier rigid bodies at 2 kHz, built from the same `kin.js` geometry and lumps, torque-limited joints, and an LQR balance loop at 500 Hz. It also has keyboard / gamepad / touch controls. The course has the 9.5″ × 9.5″ stair, ramps, sills, a curb and wet tile. `npm test` in that folder checks it headless.

The findings are in [`research/sim-sandbox.md`](research/sim-sandbox.md). A **1″ sill** crosses only near 1 m/s (the 6″ wheel needs μ ≈ 1.1 to climb it on traction, and the knee saturates on the hit).
**PARKED has no rest pose** (it rolls onto its back over the knee housings). The one-wheel hold is not solved in the sandbox yet. The one-wheel hip-roll hold torque of ~9 N·m agrees with the 2D number.

**Flags:** this is a design toy, not the digital twin and not a V1 job ([`software.md`](software.md)). The 3D robot is built only from the 2D numbers, so it is not CAD ahead of R23. The rear **parking skid** in the sandbox is a **proposal, off by default, not a decision**. Nothing is locked. No spend.

### 2026-09-23 — sandbox second pass: ride height, suspension, stumbles, one wheel

The user asked for ride-height control with a **medium stance by default** (lower CoG), leg suspension with an active lift on impact, and better stumble recovery. The user also asked for a planned, coordinated one-leg stand (the free leg kicked out wildly). All of this is in the 3D sandbox. The findings are in [`research/sim-sandbox.md`](research/sim-sandbox.md) (second pass). The default ride is now **75%** (hip 14.3″ vs 16.8″) with Low / Medium / High presets. The legs are a 3.5 Hz virtual spring-damper.

An impact reflex and a stall hop lift the wheel over edges. The **1″ sill now crosses from 0.5 to 1.0 m/s** (it was only 1.0 before).
A capture-point leg catch and a hip-roll side step increase the recovery from a sideways shove from **3 to 5.5 N·s**.

The one-leg kick was a controller bug (the balance point was ~4° off → the hip roll slammed to its limit). LEFT / RIGHT ONLY is now a planned **poise** over one wheel with ~15% left on the other wheel. It holds ~3.3 N·m on the planted hip roll. **The free wheel fully off the floor is still not held** (experimental switch, off).

**Flags:** 75% is a sandbox driving default, not a change to the 92% stance in `leg-geometry.md` / the stair climb. The suspension and the hop need **torque-controlled, backdrivable knee and hip-swing joints (FOC / QDD class) or real springs**. That leans on the open "servo vs stepper+belt" row. **This is the call of the user**, not decided here. Nothing is locked. No spend.

### 2026-09-23 — geometry / contact / feasibility honesty (283bd23)

This is a major honesty pass that was already on `main`, but not logged here before. We implemented it in the living-drawings model and recorded it in [`research/model-corrections.md`](research/model-corrections.md), [`research/sim-sandbox.md`](research/sim-sandbox.md), [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md). **No lock change. No spend.**

The changes: shared spatial FK/IK (the side and front views no longer imply different mechanisms), and the whole-robot CoM. The tipping moment is not the hip hold torque. The stair playback no longer looks successful when it is not — the **current stair candidate is rejected** (197/201 spatial samples fail). Tire: 6″ sphere → rounded convex **6 × 1.25″** hull (the free-roll numerical error is still ~3%).

More changes: joint stops, self-contact, delayed sensing / drive lag, yaw integral, observed support vs requested mode, and refusal of `PARKED` without rest support. The historical planar pack-forward / ±6% throw recommendations are retired as design decisions. **The true one-wheel hold still fails**. The collision and the tire remain approximations — the visual cylinder and the rounded hull are not a motorcycle crown (refer to 2026-09-25).

### 2026-09-24 — SpdrBot Isaac Sim research

The user shared [Indystry SpdrBot](https://www.youtube.com/watch?v=YDzHL2JSCHc) plus [Indystrycc/SpdrBot](https://github.com/Indystrycc/SpdrBot) (an Isaac Sim / Isaac Lab 4-leg spider. Fusion → URDF → USD. RL, then a hand-tuned gait). The note is [`research/spdrbot.md`](research/spdrbot.md). It is indexed from [`research/inspiration.md`](research/inspiration.md), [`research/study-plan.md`](research/study-plan.md) (Phase E + research index), and [`research/README.md`](research/README.md).

This does **not** change the locks. Docs only. No spend, no SKU, no BOM cart rewrite, and no CAD / firmware. Copy these for the **Phase E** twin / dojo horizon: observation parity with real sensors, CAD→URDF→USD lockstep, reward-hacking risk, and validation in Sim before hardware. Also mid/zero before assembly, power delivery, and the lesson that friction hacks can hurt.

**Do not** adopt the spider morphology or the hobby-servo / Pico stack. **Do not** buy Indystry packs, stand up Isaac Lab before `TWO_WHEEL`, assume that RL drops onto the robot, or buy a 4090 for V1. This ties to Stompy CAD/reality, Diablo LQR-before-RL, Phase E in the study plan, and **R18** classical first.

### 2026-09-25 — twin pipeline TBD, hip-roll rethink open, tire crown, website sync

The user asked us to log the 2026-09-25 planning conversation, while hardware and planning run in parallel. The user wants the pipeline *direction* before / during the hardware work. **Docs only. No lock is lifted, no spend, no SKU, no BOM cart, and no CAD / firmware**. Hip roll stays **IN V1** (R16), and the twin / RL stays a **horizon**.

- **Twin / RL pipeline TBD.** The selection of a digital-twin / RL simulation software pipeline is open research, not a stack lock. **Lock the contract first:** CAD→URDF/USD or MJCF lockstep, observation parity with real sensors, motorcycle-crown tire contact, and firmware zeros that match the model. Also the willingness to live in the stack. Do **not** stand up Isaac Lab, buy a 4090, or make RL a V1 balance gate before `TWO_WHEEL`. Do **not** lock Isaac / MuJoCo / mjlab. This agrees with SpdrBot / Diablo / Stompy / R18 / Phase E. Refer to [`software.md`](software.md) and [`research/study-plan.md`](research/study-plan.md).
- **Living-drawings ≠ twin.** The 3D sandbox taught a lot and framed the capabilities / expectations. It is a **design toy**, not the identical digital twin. The findings are in [`research/sim-sandbox.md`](research/sim-sandbox.md).
- **Hip-roll rethink (open).** The user does **not** like the hip-pivot unload to get onto one foot — it seems to work poorly. Log the dislike. **Do not remove the R16 lock**. The bad feel can be the wrong stair trajectory, the two-contact poise, or the sim contact — not proof that the DOF is useless. Separate three questions: (1) do we need some lateral CoG path, (2) is hip roll the cheapest DOF, (3) does the stair path ask for an infeasible throw. The stair candidate is already **rejected** in [`research/model-corrections.md`](research/model-corrections.md) / [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md).
- **Tire crown.** The sandbox wheels look like a flat ~90° edge profile, not a motorcycle-round rubber crown. A real Hux tire must keep a rubber contact pad when it is tipped / cambered. A hard edge disturbs the lean / one-leg physics. The real world can be better, but the twin **must** match the crown. Sep 23 already moved the sphere → rounded convex 6×1.25 hull. The visual is still `THREE.CylinderGeometry` (flat shoulders), and the collision is not a true torus. Half-fixed. This is a twin / sandbox honesty requirement.
- **Website vs docs.** The living-drawings F765-Wing / Pi 5 pages are a concrete **bench plan** that the user wrote. The canonical docs still say **FC TBD** ([`electronics.md`](electronics.md), [`software.md`](software.md)). Make sure that the website language does not look more locked than the plan.

### 2026-09-25 — tire crown and contact pad fixed in the sandbox

The user: the tire profile / contact pad notes above "need to get fixed". This is done in `tools/living-drawings/`, where one shared cross-section (`tire.js`, full-round crown by default, `M.tireCrown` flattens it) now builds the Rapier hull, the Three.js lathe mesh and the 2D projection. So the flat-shoulder cylinder is gone, and the contact walks the crown under camber (tested at 0–30°). Each wheel is a hub plus a **tread ring on a carcass spring** (`tireK` 40 kN/m, `tireZeta` 0.2 — guesses, knobs). The HUD shows the squish and the implied pad.

Side finding: the one-leg poise controller pivoted on the **hub**, but a cambered crown touches an inch away from under the hub. The poise was on its own bail-out threshold, and the compliant tire exposed it (it fell). A pivot on the crown contact (`contactOf`) corrected the poise (free-wheel load 11–31% vs 3–24%, planted hip roll 4.3 vs 6.6 N·m). The regression suite is updated and passes. **No lock changed, no spend.**

The tire stiffness is not measured. Measure a real 6×1.25 before you trust the pad numbers. The sandbox now meets the twin-contract requirement (crown contact), but the sandbox is still a design toy, not the twin. The findings are in [`research/sim-sandbox.md`](research/sim-sandbox.md).

### 2026-09-26 — compute / stack review, then 6S → 8S, CAN, control core, ROS 2 companion

The user asked for a review of the software stack, and if a "$400–600 NVIDIA SBC" fits ([`research/compute-stack-review.md`](research/compute-stack-review.md)). Findings: the F765-Wing has **no CAN**, but every torque-mode actuator on the candidate list speaks CAN. The bench firmware plan did not have a blackbox, live params, a framed link or a hardware torque cut. The Pi 5 is correct for V1 and wrong for seven cameras. The Jetson prices changed on 2026-07-22 (Orin Nano Super kit $399, Orin NX 16 GB module $999).

The user then said that **nothing is locked**. The user owns the Pi 5 and the F765, but does not need to use them. The user wants to **make this a real project** — a stepping stone is fine if the logic carries, otherwise start on the better board. The user approved **4S → 6S** (a large pack or two in parallel, LiPo or similar).

**Decided (supersedes older language above):**

- **Power: 6S** class, ~22.2 V nominal / 25.2 V full. Later the same day, the user picked a pack — **one 6S 5200 mAh 60C LiPo with XT90**. Then the user said that the selection was somewhat random, that a smaller pack is fine, and that he wants a reasonable runtime. The user also said **"add the anti spark"** (XT90-S on the harness — done). The actuator check that followed ([`research/actuator-shortlist.md`](research/actuator-shortlist.md)) found that the RobStride 00/01/02 input floor is **24 V**. This is less than a 6S pack for most of its discharge. **The user, later the same day: "8S yes."** The pack is **one 8S 3300 mAh 50–60C LiPo, XT90**, XT90-S on the harness, in the order-now cart. The canonical pages changed from 6S → 8S. The regulators must accept 36 V, and the companion slot gets a 12–19 V buck. Rails: **5 V** (MCU, RX, Pi), **12–19 V** (companion slot. A Jetson kit needs this — a full 6S exceeds its 19 V input), and a pose rail if servos. The motor bus is 6S direct.
- **The actuator bus is CAN**. The wheels, the hip roll, and (as the working class) the knee / hip swing are **CAN QDD / FOC actuators with their own PD** on 8S. Servo / stepper for the knee and swing drop to **fallback** status. Steppers stay off the roll and the wheels. **This bus decision picks the MCU.**
- **The control core is a portable library.** The estimator, mode machine and balance controller are in plain C++, with no hardware calls, and unit-tested. The same code links into the MCU firmware, the companion and the twin. The carry-forward is by design, not by a port of the code.
- **A real-time MCU with CAN** runs the core at 1 kHz with IMU, CRSF, hardware watchdog and torque cut. **The F765-Wing is for P0–P1 bench learning only** (CRSF, one SimpleFOC wheel). **The user (same day): "add the CAN MCU to the project." Picked: Teensy 4.1** + ICM-42688-P breakout + 3× CAN transceivers, in the [`bom.md`](bom.md) order-now table (~$55). Teensy over H743-WING, because eight classic-CAN nodes need at least two buses at 1 kHz.
- **Companion: ROS 2 on Linux.** "No ROS" (V1 minimalism) is withdrawn for the companion. The MCU stays plain. Pi 5 now, containerized, V4L2/GStreamer cameras, no Pi-specific libraries. **Jetson (Orin Nano Super kit class) is the P5 perception buy**, not a V1 buy. The head carries a companion slot sized for it.
- **The first image** must include blackbox logging (SD / MCAP), live parameters, and a framed CRC'd binary link before any setpoint goes down. It must also include the encoder velocity in the estimator, and a hardware torque cut. "Blink and print" is not the first image.

**Not changed:** R14 modes before autonomy. R18 reuse an existing balance pattern, PID before LQR before RL. Hip roll in V1, 6″ wheel, 9.5″ × 9.5″ step, 2D before CAD. Twin pipeline TBD, contract first. No spend beyond [`bom.md`](bom.md) until the user asks. **Spend implied but not yet authorized:** a CAN RT board (~$30–70) and the actuators, and the user owns those cart lines.

---

### 2026-09-26 — one-leg stance study: shift mechanics, hold torque, why the stand fails, hop budget

The user asked for more high-effort simulation of the physics and geometry of the one-leg movement. The one-leg stand needed much more work, the hip-roll weight-shift mechanics were not clear, and the one-leg action did not work in the sandbox. The findings are in [`research/one-leg-stance.md`](research/one-leg-stance.md), and the closed form is in `tools/living-drawings/frontal.js`, checked against the Rapier sandbox. This study ran in parallel with the same-day stack decision above and agrees with it (the hip-roll hold becomes a torque feed-forward that the control core sends to the PD of a CAN QDD actuator). **Docs and sandbox only. No lock changed, no spend.**

- **Shift mechanics.** With both wheels down, the legs + body + floor are a parallelogram: both hip rolls turn the same angle. **24.7°** puts the mass over one crown contact at the 92% stance (29.5° at 75%). The axle spacer costs, and the crown walk helps. 9.7° of the ±34° roll travel is left.
- **Hold torque.** The planted hip roll carries the body + free leg cantilever when a wheel is up: **8.3 N·m continuous** at 5.4″ hips (5.4 at 3.5″, 3.1 at 2″). The peak is **12–13 N·m** through a hop. That is more than a GIM8108-class nominal (7.5). The 2026-09-22 "0 if the sway is done first" was the tipping moment, not the joint torque.
- **The static one-wheel stand is not a controller problem.** It is an acrobot (passive crown contact, two hip rolls as the only actuators) with the body CoM at hip-axis height. So a roll of the body moves the mass only a little: a 10 mm CoM error costs a 40° body swing on the planted hip (9° with both hips, but 52° of free-leg swing). **The capture region is 2–3 mm.** The sandbox confirms this even with the roll limits, torque and delay removed. It is not a V1 capability on this geometry, whatever the firmware.
- **Dynamic single support is what the stair needs**, and it works in a clock: from a ~8% poise, ≤ 0.3 s in the air with a ±20 mm CoM estimate (≤ 0.5 s with ±5 mm or a one-shot 10° hip swing, worth ~11 mm). The sandbox lands and returns a 0.2 s hop (asserted in `npm test`). Longer hops land, but the return is unfinished controller work.
- **Sandbox fixes with hardware meaning:** the hip-roll position hold needs an integral / gravity feed-forward (a 90 N·m/rad hold sagged 4° = 40 mm of mass shift when the free wheel left). One stiff hip and one soft hip on the closed parallelogram. No leg-length leveling while the mass is off center.

**Flags for the user (contradictions with what is on file, not changed here):**

R17 frames one-leg balance as a full-loop *gate before any stair cycle*. The physics says that the achievable gate is a timed hop, not a hold. The "~2×" plant-side sizing of R36 is correct for the knee/swing. But the hip roll needs the 8.3 N·m hold + 13 N·m peak number, not a ratio. The 14″ width / 5.4″ hip offset is what sets that hold. To bring the roll axes inboard is the cheapest lever, and it is a 2D-layout question (R23), not a decision made here.

### 2026-09-26 — temporary actuator lock; masses and limits applied to the models

The user: "Put a temporary decision lock on all of those motors. We're going to proceed with that set and do more calculations. I will validate more before I buy one to test with. Apply the new weights and other specifications to the 3D models and kinematic simulations. Push decisions to main."

**Locked (temporary):** 4× RobStride 02 (knee, hip roll), 2× RobStride 00 (hip swing), 2× RobStride 05 (wheel). Not ordered. The new `tools/living-drawings/actuators.js` holds the vendor numbers (mass, rated / peak torque, ratio, no-load speed at 48 V scaled to the 8S bus, housing envelope, voltage window). It also holds the lump-mass picture that comes from those numbers. `spatial.js` (torque limits = peak), `kin.js` (lumps, envelopes, wheel torque knob), `sim-core.js` (caps, per-joint torque-speed lines, rated torque reported beside every joint torque, hub mass) and `frontal.js` (lumps) all read it. Change the set there, and every model follows.

**What the models say with the real masses** (findings, logged in [`research/sim-sandbox.md`](research/sim-sandbox.md), [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md), [`research/actuator-shortlist.md`](research/actuator-shortlist.md)):

- **Mass picture 7.75 kg**, up from 6.0: body 4.35 (8S pack inside), hips 1.50, knees 0.46 each, wheels 0.49 each. 2.56 kg of it is actuator, and 1.9 kg of that is in the legs and hips.
- **Hip roll hold** (frontal model, one wheel up, the free leg hangs): **10.7 N·m at the drawn 5.4″ hips, 8.0 at 4″, 7.0 at 3.5″**. **6.0 at 3″, 4.0 at 2″**. The RS02 is rated 7 (one retailer says 6). At 5.4″ even an RS06 (11 rated) sits at its rating. **Requirement: hip roll axes at ≤ 3″ from the centerline**. The 2D layout owns this. The head is 7″ wide, so the roll actuators (3.1″ housings) sit at or inside the faces of the head. This is a packaging problem to solve, not to wish away.
- **Knee, when Hux stands up over the front wheel: 13.6 N·m static** (it was 10.6 at 6 kg). The RS02 peak of 17 covers it. The rated 7 does not, so this is a ~1 s, ~2× rated event at every step. Gravity springs on the knees (R7) go from nice-to-have back to planned.
- **Stair throw:** with the actuator masses in the legs, the rear-leg shove no longer crests at body CoM 0. The 2D climb solver fails "reversed" (lift 0.90 vs need 1.03 kg·m²/s). **A body CoM +1″ ahead of the hip axes** restores a window (margin 0.11, window 0.15). +1.5″ gives 0.22. The 2026-09-22 pack-forward call, retired as a decision on spatial grounds, is back as a mass-placement fact. The candidate stays rejected on reach. This is a second, independent reason.
- **Wheel:** RS05 at 5.5 N·m peak, 31 rad/s no-load on 8S (2.4 m/s at the 6″ wheel). The 3 N·m stair-catch knob is now 5.5. The catch is friction-limited before it is torque-limited.
- **In-wheel packaging:** the RS05 housing is 44 mm long. The tire is 31.75 mm wide, with the axle 0.975″ outboard of the leg plane. The actuator is wider than the wheel and reaches into the spacer. A hub drawing is necessary before any wheel order.
- **Sandbox:** physics rate 2 → 3 kHz (the heavier RS05 hub on the 0.2 kg tread ring chattered at 2 kHz, a solver artifact). The mass forced two controller changes, both already prescribed in `one-leg-stance.md`. The leveling is frozen for the whole one-leg sequence (a 2 Hz limit cycle otherwise). The gravity feed-forward of the lump model acts on the planted hip through shift / poise / landing (the P+I hold sagged into the 10.7 N·m cantilever and fell). **The hop peak on the planted hip is now 17 N·m — the RS02 cap** — at the drawn hips. The 1″ sill regressed to 1.0 m/s only (the leg-spring / hop timing is tuned for 6 kg). `npm test` passes.

**Not changed:** 8S, CAN, the four layers, R14 / R18, hip roll in V1, 6″ wheel, 9.5″ step, and twin pipeline TBD. **Pushed to `origin/main`** at the request of the user.

### 2026-09-26 — exploratory concept art on a media page

The user asked for initial visuals before accurate models, then for those pieces on the HTML site. `art/` holds concept renders and four image-to-mesh studies (whole robot, leg, wheel, torso). [`tools/living-drawings/media.html`](../tools/living-drawings/media.html) shows them. **Nothing locked.** Not to scale, not CAD, and not a pass through the 2D-before-Blender gate. The drawings and the sandbox are unchanged.


### 2026-09-27 — direction: finish it; one step is the finish line; T-REX is the scale reference, not the leg

The user, after two days on the knee-linkage question: "I need to pick a direction. Their robot is for production sale. Mine is for R&D and personal use … maybe I should take an easier route and basically just match what they have done. Perhaps going up one step is enough for my needs. I want to actually finish this project so I should not make it too difficult or expensive for myself. I guess if we keep the knee motors at the knee we can have enough leg articulation to do the stairs which is a major achievement. My top flat-traversal speed should be a bit more than a normal human walking speed but not quite a jog … I would like the more capable legs if we can realistically achieve the type of controls to handle it."

**Locked (four calls, the user picked each):**

1. **V1 finish line = one 9.5″ step, 9/10 from a standstill**. One step exercises the whole mechanism (roll shift, timed single support, shove-and-catch, landing in the slot). A flight is that cycle repeated, with the error held inside ±1.75″ every time — V2, same hardware. The north star is unchanged.
2. **1.5 m/s top / 1.0 cruise**. RS05 no-load on 8S ≈ 296 rpm nominal / 264 at cutoff = 2.4 / 2.1 m/s at the 6″ wheel with nothing left. With 2 N·m of catch held, the speed is ~1.5 m/s fresh, ~1.3 near cutoff. Leg length and top speed are not a trade: a taller CoM falls slower. What caps the speed is the wheel torque at rpm. The one coupling is the bump impulse at speed (controls).
3. **Knee RS02 at the knee, spring in scope**. This is the simplest build. The hip-driven linkage is parked as V2. The five-bar is rejected on the numbers (`research/knee-linkage.md`, `tools/living-drawings/studies/fivebar-check.py`).
4. **V1 terrain = flat + 1″ sills + ~20° slopes**. Rough ground is V3 / Phase E.

**Why "match T-REX" was not the easy route:** to match it means a 150 mm-stroke five-bar, and the step is gone for good on that frame. The serial stair leg costs the same eight actuators and only design time on the hip carriage. T-REX is the scale and packaging reference (row above). Orin Nano confirms the P5 companion slot. V1 stays Pi 5 + Teensy.

**Not changed:** actuator lock, 8S, CAN, four layers, 6″ wheel, 9.5″ step, hip roll in V1, ≤ 3″ roll axes, 2D before Blender. **Uncommitted on the Mac. The user commits and pushes.**

**Cascade, same day.** The four calls are numbers in `tools/living-drawings/spec.js`, and every page reads them. **Sheet 1 — V1 layout** (`sheet.html`) is drawn from the model files: roll axes 3.0″, 9.1″ hip band under the 7″ head, leg plane 4.75″. Also knee RS02 inboard at the knee, and RS00 outboard at the hip. Also pack 1″ forward, axle spacer 1.63″, and the landing aimed 0.75″ rear of the slot center. `software.md`, `electronics.md`, `mechanical.md`, both checklists, `study-plan.md`, `README.md` carry R37–R40.

**Finding from the sheet.** The wheel planes are 3.375″ outboard of the 3.0″ roll axes. So the 24° shift needs **2.8″ of leg-length difference** to keep the body level. The sandbox needed a geometric leveling feed-forward to settle the poise at all ([`research/one-leg-stance.md`](research/one-leg-stance.md), addendum). That is a control-core requirement now (`software.md`). The roll-axis requirement stands. It was never free.

### 2026-09-27 — Sheet 2: tubes, fittings, knee spring, hub, wire path

The user: "go ahead and do sheet two and then push everything to main."

**Drawn** (`tools/living-drawings/sheet2.html`, from the same model files. The numbers are in `spec.js` → `sheet2`): proposals, not buys. Everything is drawn to parts that are already in the order-now cart or the temporary actuator lock.

- **Tubes:** the 16 × 14 mm carbon of the BOM for both links. Joint axis → tube end 35 / 45 / 30 mm at hip / knee / axle (half the housing plus a wall), 40 mm bonded + cross-pinned sockets. The upper cut is ~191 mm, the lower ~196 mm, four cuts = 0.77 m of the 2 m on order. Knee bending 12.4 N·m (stand-up) → 75 MPa, 17 N·m peak → 102 MPa on a 166 mm³ section. The bonded socket is the limit, not the tube. Hub offset (41 mm): 3.1 N·m bending under the one-leg load, 3.0 N·m torsion from peak drive. The first mode with the wheel on the exposed lower tube is ~116 Hz (E 100 GPa assumed).
- **Knee spring**: an extension spring along the rear of the upper tube, with a cable over a **Ø2.5″ pulley on the knee arm** (a two-anchor spring across the joint reverses past ~2·atan(offset/anchor) of fold). It is fitted to the two-leg gravity torque at 92% (2.8 N·m) and 75% (4.8): **3.05 N·m/rad + 0.4 N·m preload → 3.0 kN/m (17 lbf/in) spring, 12 N preload**. **The travel is 3.4″ to the 155° stop, 271 N there**. Result: the **stand-up hold goes from 12.4 → 6.4 N·m at the motor, less than the rated 7 of the RS02**. The swing leg holds ~5.6 N·m against the spring while it is raised. A torsion spring on the knee-arm boss or a gas spring are the alternatives. Size them on the bench.
- **Hub:** the RS05 moves inboard, so that its outboard face is **flush with the tire** — nothing proud, nothing past the 14″ envelope (this closes open call 10 of Sheet 1). The stator is on the axle fitting F5 inboard (0.52″ from the leg plane), with a disc web from the output flange to a turned 3.75″-bead rim. **Open:** the rim rides cantilevered on the output bearing of the RS05 (38 / 76 / ~230 N static / one-leg / landing). The rating is not in the spec table.
- **Hip band:** one wider lower shell (9.1″ × 3.1″ × ~3.0″, chamfered to the 7″ head), not pods (this closes open call 11). The pack, XT90-S and step-down are on its floor, and the Teensy + IMU are above. The yokes roll on the flanges outside the shell, so there is no slot.
- **Wires (R21):** bundles inside both tubes, ports in F2 / F3 / F5, service loops at the knee and hip. The entry is in the lower front face of the band, beside each roll housing. No belts, so R33 does not apply.
- **Fittings F1–F7** are listed on the sheet with the process (F1 / F5 / F6 machined, F2–F4 / F7 printed with inserts, draft-friendly). The bolt patterns come from the STEP files in `cad/vendor` — not drawn.

**R23 status:** Sheet 1 (layout) and Sheet 2 (make-up) exist for the leg and the hip band. Blender can open for the style of the head. The leg and the band go to CAD from these two sheets after the user agrees to them. Pushed to `main` with everything from 2026-09-27.


### 2026-09-28 — head audit and stair architecture reopened

The user requested a high-effort pass with a focus on math, physics, geometry, kinematics and BOM. The user explicitly said that **no components are bought**, and authorized better component selections. During the review, the user identified the fundamental failure of single-leg support. The user asked that the legs justify the actuator cost, and that we do not quietly abandon the stairs.

The user then instructed: **“Commit and push to main.”** This authorizes the publication of the engineering review and its reproducible analyses. It does not change the validation gates. It is not an approval to purchase components or to fabricate the candidate.

**Firm corrections:** there are no confirmed Hux purchases/orders. The old motor set is a reference, not a release. A floor hop does not qualify R2/R17/R37. The battery location is not the body CoM. Stationary torque and actual cooling must govern the holds. The old two-bus 1 kHz claim does not fit extended classic CAN.

We added R41–R44. 8S remains conservative, because the July manuals say 24 V minimum while the September tables say 15 V. The hardware revision must resolve that conflict.

**Candidate H1:** H1 revision B: 203.2 mm depth, 120 mm middle bay, 177.8 mm top cap above Z = 80 mm. Top +100 mm, cassette bottom −45 mm. The 242 mm-wide motor cassette is forward at X 32…89 mm, and the motor centers are at X = +60.5 mm. This corrects the interference between the rear-folding link and the motor, and clears the rolled hip-pitch housings. The previous aft cassette/full-width middle bay are rejected.

The pack class is 150 × 50 × 60 mm, with separated compute/control/power allocations. Camera space is included. The control bay is 60 × 90 × 22 mm at X = 50.5 mm. The cassette width includes a 2.5 mm wall and 3.05 mm clearance outside each motor. The itemized nominal head is 2.26 kg at (+6.19, 0, +20.78) mm, and the high case is +0.60 kg. These are estimates, with explicit contingency, not measurements or a fabrication release.

**Leg results:** the split-offset spatial model of revision B screens a complete step at 91 poses. The 24-inch wide-entry case fails 14 reach samples. A narrower stepping track of 120 mm reduces the lateral cantilever, but the 24-inch variant still fails three reach samples and flags 17 envelopes. The 25-inch variant hits the conservative knee/riser envelope during the transfer. With 9.5-inch links / 658.8 mm (25.94-inch) height, the narrow-entry candidate connects. It passes 810 interpolated reach/limited-clearance/width checks in both the nominal and the +0.60 kg head scenarios.

The modeled nominal COM residual is 0.17 mm. The peak span of 355.44 mm leaves only 0.16 mm below the nominal width limit. The gravity roll/pitch/knee demands are 6.61/3.92/7.89 N·m, or 7.02/3.84/8.95 N·m in the heavier case. **Carry this 26-inch candidate forward for research. No hardware release or approved height change**.

The 27-inch variant also connects, but adds height and knee demand. A wide-entry 27-inch variant spans 547.1 mm despite its 14-inch initial wheel envelope. So the wheel track alone must never stand in for the moving-body width.

**Support mechanism:** keep the hip roll, add active ankle roll and finite-width contacts. The ten-axis study still needs a real passive pitch-level carrier, and that carrier is not designed. A simple move of the hip motors to the ankles is not a drop-in correction. Positively locked deployable landing shoes remain an alternative to investigate.

**Actuator finding:** the vendor stationary references are RS02 6 N·m, RS00 3.6, RS05 1.2, RS06 8, conditional on the vendor fixtures. The compact candidate hip roll reaches approximately 9.29 N·m. The preferred narrow-entry candidate reduces it to 6.61 N·m before dynamics. But the hip pitch and the knee also exceed the reference stationary ratings. Do not substitute a 7 N·m rotating rating or a 17 N·m peak to pass it. Reduction/larger actuators need new packaging and duty calculations, and the full-set procurement stays on hold.

**Cascade:** `tools/engineering/baseline.json` and `bom.json` are candidate numerical sources. `review.py` regenerates `head-leg-results.json`, the H1 dimensioned SVG, the engineering page and the BOM. Physical-invariant tests cover mass/inertia, CoM sensitivity, split-offset FK/IK, gravity virtual work, contact-load sequencing, actual moving width and negative clearance/CAN gates. The full findings and the remaining checks are in [head-and-leg-review.md](head-and-leg-review.md).

The requirements, mechanical, electronics, software interfaces, checklists, inventory, README and notes point to the new disposition. The legacy model geometry/controllers are deliberately not relabeled as the ten-axis robot. The pages visibly identify them as the rejected old stair baseline.

**Budget:** the complete candidate allowance is $2,236–3,498 before tax/shipping, with no assumed free boards/charger/stock. The price allowances are unverified. No supplier is contacted, and no order is made. Firmware and validated CAD do not yet exist. **This review calls no component selection or dimension build-ready.**

When a docs PR merges, add a dated heading:

```
### YYYY-MM-DD — #<n> <short title> (merged)

One-paragraph intent. Note any ID it owns or supersedes.
```

Keep the **Current governing decisions** table honest if the new PR changes a lock.

### 2026-09-28 — V1-PROOF scope reset; stair planning parked

The user: “This project is very ambitious and basically too expensive. I want to shift all our planning to the side and create a new V1-PROOF model. This V1-PROOF model should be under $1000 and use stuff we have around. We can use a smaller target mass, less actuators, drop the stair stepping, use smaller actuators.”

This supersedes the stair finish line and its hardware constraints for active work. Keep the old plan in STAIR-V1, and keep its numerical model and simulator labeled as historical. V1-PROOF has its own requirements, numerical input, budget, calculations, 2D sketch and landing page.

The proposed implementation is 2.5 kg target / 3.0 kg maximum, two wheel gearmotors with encoders plus two small leg servos with reductions. First, balance with the legs pinned. Then add slow synchronized height adjustment while both wheels stay down. Approximately 100 mm wheels, 278–306 mm upright height, 255 mm outside width and 28.5 mm theoretical height adjustment. The four-bar also sweeps the axle 49.3 mm fore/aft, so a pose-dependent measured CoM/pitch trim is necessary. No stair-upgrade promise.

The cost allocation is $715 parts and fixture + $100 tax/shipping + $125 repair/overrun reserve = $940. The exact reusable stock remains unconfirmed, so we take no free-inventory credits. We checked the manufacturer motor/driver/servo references for the plausibility of their prices/specifications. The other rows are caps that wait for quotes, not a shopping cart. We assume the existing tools and personal fabrication labor. Any new tooling or outsourcing must fit the same cap.

No old BLDC-at-rim, CAN, 8S, carbon-spar, large-head, four manual modes or onboard-compute lock applies. Use suitable available controllers/IMUs and a compatible lower-voltage pack. The finish-line trials cover two-wheel balance, slow manual drive, leg height, fault handling and a ten-minute session. All physical tests remain open. This planning revision buys no components, flashes no firmware, builds no physical robot and deploys no site.

**Publication:** the user then requested “push to main,” and this authorized the direct push of this V1-PROOF planning/model revision to `main`. Seven active model checks and the generated-output consistency checks pass. The pre-existing untracked vendor CAD and the downloaded mesh folders are outside this revision.

### 2026-09-28 — V1-PROOF 3D sandbox

The user asked for V1-PROOF in the same 3D sandbox as before, to play with it and understand its movement and size. We added [`proof-sandbox.html`](../tools/living-drawings/proof-sandbox.html). The browser loads the own `tools/v1-proof/sim.js` of the study (now also loadable as a browser script, with the plant and the controller unchanged). So the driving feel comes from the controller that produced the 388/391 evidence, not from a look-alike. The course lanes are the fixtures of the physical protocol plus the 20 mm challenge threshold. The shoves are the 0.8 / 0.4 N·s pulses of the protocol and the 4 N·s failure case.

Size references: a floor grid in 10 cm squares, a 12 oz can, a US Letter sheet and the parked STAIR-V1 envelope (610 × 356 mm). The old `sim.html` stays as the parked stair sandbox.

We ran the full study again after the wrapper change. Every pass/fail is identical, and the numbers match the saved results to 2 × 10⁻¹³. Only the `sim.js` hash changed.

**Flags:** the leg-height slider is a quasi-static preview (the CoM and trim move at 10°/s, with no servo dynamics or reaction). The fixtures have ramp kinks that the tilted floor of the study did not have. The sandbox draws the body at a live pitch trim of approximately ±10° at the 15°/45° leg extremes. That tilt makes the body corner approximately 317 mm high at the tall pose, versus 306 mm upright. The motor/link packaging near the axle is drawn schematically. No hardware, purchases or new evidence.

### 2026-09-28 — V1-PROOF mobility and hardware baseline

The user requested more simulations, reliable movement in all directions and in-place rotation, push/uneven-surface tolerance, hardware decisions and a sound progression to later versions. We added an independent four-axis-proof simulation with the legs pinned, contact physics, actuator/sensor uncertainty, quantitative maneuver gates, saved failures and timestep checks. We added a hardware decision record and a measured acceptance protocol. We selected the smaller DRV8874 driver and a protected 9 V servo branch. The budget changes from $940 to $900, with the $225 reserves unchanged. This entry claims no hardware tests, purchases, commit, merge or deployment.

The final evidence for revision B is 388/391 in the unchanged broad uncertainty matrix. All six directional maneuver cases pass 17/17 configurations. Keep the three settling failures at the near −4 mm CoM corner, and make ±2 mm fore/aft mass placement a requirement before grade/disturbance qualification. Six separate adjusted-placement checks pass. We rejected a higher derivative gain, because the modeled RMS current was excessive under delay/lost motion. The physics/controller regression checks and the timestep consistency pass, and no physical acceptance box is closed.

**Publication:** the user then requested “Push to remote main,” and this authorized the direct push of this simulation, hardware baseline and acceptance protocol to `main`. The pre-existing untracked vendor CAD and the downloaded mesh folders are outside this revision.
