# Mechanical

**Status (2026-09-27):** 2D stage. **Sheet 1 (layout) and Sheet 2 (make-up) are drawn** on the site; both are proposals until Steve agrees them. No CAD, no parts made. Geometry is the settled draw (6" wheel, 7.5" + 7.5" links, 9.5" × 9.5" step) plus the Sheet 1 layout.

V1 target is **one wheel-leg** — printed / machined **fittings** on **carbon-tube spars** — with the knee pulley spring (Sheet 2), sized toward a **~9.5"** step. Envelope: up to **~24" tall at full extension**, **~14" wide**. The head sits inside that width. Wheels and legs are outside the head. Do not wait on electronics. **Do not open Blender until several 2D sketch layouts exist** (R23).

**Parts on hand:** [`parts-on-hand.md`](parts-on-hand.md). A **5"** walker-wheel pair is already ordered — **bench donor only**, not the foot. Wheel diameter is **settled at 6" OD**: [`research/leg-geometry.md`](research/leg-geometry.md).

**Shop / fab:** [`capabilities.md`](capabilities.md). End fittings (F1–F7 on Sheet 2: hip and knee flanges, the knee arm and pulley, the axle fitting, the hub) are a natural print / mill / lathe job. **Do not mill a spar that a carbon tube already is** (R19 / R34).

**Decisions:** [`decisions.md`](decisions.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md).

## Intent

- Two legs, each ending in a **brushless FOC driven wheel** whose motor sits **at the wheel** (hub / coaxial at the rim) — not remote-driven from the hip (R6 / R30).
- Legs via **springs** for gravity compensation (R7): V1 is a serial leg with the knee spring on a pulley (Sheet 2). No belts in the working plan; the belt rules below apply only to the stepper / servo fallback.
- Design stroke and clearance around a ~9.5" residential riser (up and down). The **~24"** full-extension envelope has to **reach that riser with margin**.
- **Jointed legs should keep CoG over wheel contact as height changes** (Serra packaging).
- **Knee actuator at the knee joint** for V1 with a gravity spring; hip-driven linkage is a V2 refinement; **no five-bar / parallel leg** (R39, 2026-09-27; [`research/knee-linkage.md`](research/knee-linkage.md)).
- **Sheet 1 — V1 layout** is drawn (2026-09-27): [`../tools/living-drawings/sheet.html`](../tools/living-drawings/sheet.html). Roll axes 3.0", 9.1" hip band under the 7" head, leg plane 4.75", knee RS02 inboard of the tube plane, RS00 outboard at the hip, axle spacer 1.63"; the 8S pack at the **top of the head**, 1" forward and 4.3" above the roll axes (moved up 2026-09-27; body CoM +1.0" / +3.39"). Sheet 2 owns tubes, fittings, spring, wire ports, head shape, the RS05 hub.
- **Sheet 2 — make-up** is drawn (2026-09-27): [`../tools/living-drawings/sheet2.html`](../tools/living-drawings/sheet2.html). BOM 16 × 14 carbon for both links (cuts ~191 / 196 mm, 40 mm bonded + pinned sockets), fittings F1–F7, a knee pulley-spring (Ø2.5" pulley on the knee arm, 3.0 kN/m extension spring along the upper tube: stand-up hold 12.4 → 6.4 N·m at the RS02), the RS05 flush with the tire's outboard face on a turned 3.75"-bead rim, a 9.1" hip-band shell, wires inside the tubes. Open: the RS05 output bearing rating; bolt patterns from `cad/vendor`.
- **Hip roll is in V1** (R16) so the body can shift CoG over the planted wheel. Distinct from hip swing / knee. Experimental — still ship the joint.
- **Serviceable modular customs:** threaded inserts, independently removable parts, inside access (R22 + Serra).
- **Size plant-side joints for one-wheel standing load** (~2× two-wheel stance, R36).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- Overall width is **~14"** (R15). The head is inside. Wheels and legs are outside the head.
- Entire robot is **electric**. Battery is **one 8S 3300 mAh LiPo** (~700 g) — see [`electronics.md`](electronics.md).

## Scale + structure (Steve 2026-09-21)

Docs only. Envelope and structure bias — not locked CAD, not a SKU list, **no spend**.

### Carbon-tube spars (R34)

**Primary leg spars** are **carbon fiber tubes** for the main lengths of the **upper and lower leg**. This is COTS structure (R19): the tube *is* the beam.

Printed or machined **fittings at the ends** only:

- Hubs (the RS05 web and rim, F6)
- The knee arm with its spring pulley
- Joint flanges (hip, knee, axle)

Do not print a carbon-tube-shaped spar. Do not turn a tube on the lathe to “make a nicer spar.” Cut COTS tube to length (bandsaw is enough); the shop owns the **ends**. **Wet-cut + respirator** — carbon dust (Tazer; [`capabilities.md`](capabilities.md)). **16 × 14 mm** for both links (Windcatcher 16×14×1000, 2 in the order-now cart). Sheet 2: cuts ~191 / 196 mm, 40 mm bonded + cross-pinned sockets, knee bending 75 MPa at the 12.4 N·m stand-up, 102 MPa at the RS02's 17 peak — the bonded socket, not the tube, is the limit.

### Height envelope — ~24" at full extension (R35)

Hux may stand up to **~24" tall at full extension** (wheel contact to top of stance). This is the **primary scale change** vs the earlier compact lean.

Still gated by **R3**: the raised wheel must reach a **~9.5"** residential riser **with margin**. Taller tubes buy stroke and clearance; they do not replace the step. The axle-to-axle rise is **9.5" for any wheel diameter** — a bigger tire does not make the lift shorter. Stroke still owns the riser.

Settled draw against the 24" cap ([`research/leg-geometry.md`](research/leg-geometry.md)): **7.5" + 7.5"** equal tubes, **~6"** of body above the hip, **6" OD** wheel. Do not grow past ~24" on paper to invent extra reach. Do not grow the wheel if a real tread is deeper than 9.5".

### Width envelope (~14") (R15)

Overall width is **~14"** outside-to-outside, wheels included. Steve 2026-09-21. The head is a narrower unit in the middle. Legs and wheels stand outside it.

Implications:

- A narrow stance keeps the CoG closer to either wheel, so a hip-roll lean can actually put weight over the planted contact.
- A 1.25" tire flush with the outside puts the track at about **12.75"**. The head drawing is about **7"** wide, so there is room for the leg between the head and the tire.
- A doorway is still wider than 14". The stair slot is the tight constraint, and that constraint is the tread, not this width.

### Mass — blown / soft (R24)

Capability and packaging **beat** the old **4–5 lb** / **under 6 lb** numbers. Those are a **historical soft preference only**. They are **not a kill-switch**.

Do not reject carbon-tube length, end fittings, or a capable joint class to protect a spreadsheet. Do not spend the extra mass on a printed spar. Record a real weigh-in when one exists.

Sketch lines (fill when something is weighed — empty TBD is correct):

| Bucket | Mass (TBD) | Notes |
| --- | --- | --- |
| Two wheel actuators (RS05, driver + encoder on board) | vendor 2 × 0.19 kg | Temporary lock. In-wheel (R25 / R30). |
| Hip swing + knee actuators (2× RS00, 2× RS02) | vendor 2 × 0.31 + 2 × 0.39 kg | Temporary lock (R12). Knee stand-up 12.4 N·m, 6.4 at the motor with the spring. |
| Hip-roll actuators (2× RS02) | vendor 2 × 0.39 kg | Temporary lock, **in V1** (R16 / R27). |
| Structure (carbon tubes + end fittings) | TBD | Do not spend mass on a printed spar. |
| 8S 3300 mAh 50–60C LiPo | ~700 g, ~150 × 60 × 50 mm | R11, 2026-09-26. **Top of the head, long axis lateral, centre 1" forward and 4.3" above the roll axes** (Steve 2026-09-27: move the battery up; `tools/living-drawings/studies/pack-sweep.js`). Serviced from the head's top lid. |
| Hip roll axis lateral offset | **3.0" from the centreline — drawn on Sheet 1 (2026-09-27); ≤ 3" was the 2026-09-26 requirement** | The one-wheel hold with the locked actuator masses: 10.7 N·m at the drawn 5.4", 6.0 at 3". RS02 is rated 7. Model hold at 3.0": **6.3 N·m** (`frontal.js`, Sheet 1 geometry). The roll housings sit in a **9.1"** hip band — one wider lower shell under the 7" head (Sheet 2). |
| Actuator envelopes | RS02 78.5 × 78.5 × 45.5 mm (knee, roll); RS00 57 × 57 × 51 (swing); RS05 46 × 46 × 44 (wheel) | From `actuators.js`; drawn in the living drawings. The RS05 (44 mm) is wider than the 1.25" tire: Sheet 2 sets its outboard face flush with the tire and lets it reach 0.48" into the spacer. Open: its output-bearing rating under the cantilevered rim. |
| Companion slot | TBD | Head carries a slot sized for an Orin Nano dev kit (~100 × 79 × 21 mm + fan) with a 12–19 V feed and airflow; the Pi 5 occupies it in V1 (R22). |
| CAN real-time MCU + TBS Nano RX | TBD | **Teensy 4.1** + IMU + 3 CAN transceivers (2026-09-26), in the hip band above the pack (Sheet 2). F765 is bench only. |
| Raspberry Pi 5 + camera(s) | TBD | Companion, in the head slot. |
| Fasteners, wire, springs, margin | TBD | Leave slack. |
| **V1 total** | **soft** — model picture **7.75 kg** | Lumps in `actuators.js`: body 4.35 (8S pack inside), hips 1.50, knee 0.46 each, wheel 0.49 each. Historical preference 4–5 lb / under 6 lb. Not a gate. |

### Implications of the taller tubes

| What changes | Why it matters |
| --- | --- |
| **Wires run inside the tubes** | No belts in the working plan, so the tube bore is the wire path: ports in F2 / F3 / F5, service loops at the knee and hip (Sheet 2, R21). |
| **Actuators sit at the joints** | RS00 at the hip, RS02 at the knee, **tube between** (R39). The spar is empty length, not a motor house. |
| **CoG sits higher** | Helps: inverted-pendulum fall is slower (`ω ≈ √(g/h)`). At the working stance that doubling time is about **145 ms**. Hurts: more inertia and a longer disturbance arm. Static moment about the planted wheel is `m g d` (height drops out): ~**12.3 N·m** at the 7.75 kg picture (9.5 at the old 6 kg) if the CoG is still on the **12.75"** track's centerline. |

Do not hang joint mass in the middle of a tube to “use the length.”

## Design rules (Steve 2026-09-20)

These are requirements, not vibes. IDs **R19–R23**. Tick the matching items in [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md). Shop tools: [`capabilities.md`](capabilities.md).

### 1. Structural parts — cheap COTS first (R19)

Prefer **cheap off-the-shelf stock** for anything that is a beam, tube, plate, or fastener: carbon tubes / rods, metal stock, fasteners, standoffs, shafting, bearings.

**Do not custom-print primary structure when COTS will do.** A printed carbon-tube-shaped spar is a miss. Print or machine the **joints** that grab the tube. The V1 “printable wheel-leg” is a **fit-check of those customs on stock**, not a sealed printed mono-leg.

### 2. Custom parts — draft in mind (R20)

Every custom (printed now, maybe molded later) is designed with **draft** so it is easy to **3D print** *and* later **injection mold**: draft angles, avoid undercuts, parting-line awareness, printable orientation.

Customs may also be **machined, bent, or welded**. Do not treat “printable” as the only legal custom. Draft-friendly print still for plastics.

### 3. Wire management — openings and ports (R21)

Cable paths go **through** links and the body, not taped to the outside after the print. Moving joints need a path that survives articulation. Wheel-motor leads (motor-at-wheel) still need a surviving path through the articulating leg. If belts exist, **wires must not occupy the belt run**.

### 4. Serviceability (R22)

Access to fasteners, the pack, the MCU (Teensy 4.1, in the hip band), and actuators as **replaceable modules**. Steal Serra's habit: threaded inserts, independently removable parts, inside access. A sealed mono-leg that hides a belt or a pack is out of intent.

### 5. Process — several 2D sketch layouts before Blender (R23)

**Gate:** 2D layouts exist **before** Blender (or other 3D CAD). Several views: side, front, top, plus linkage / stroke. The 2D set must show **motor-at-wheel**, the **~24" / ~14"** envelope, and **inside/outside belt runs** if belts are on the sketch. A `.blend` with no preceding 2D is a process miss.

## Wheels — 6" OD, in-wheel drive

Steve 2026-09-21: settle the wheel so it fits comfortably on one step. The robot pivots on the planted wheel and sets the raised wheel on the next step. Full math: [`research/leg-geometry.md`](research/leg-geometry.md). **Size is locked.** The 6×1.25 pneumatic tires and tubes are in the order-now cart.

- **6" overall diameter** (a real tire at **5.75–6.25"** still counts). Width **~1–1.25"**. Real rubber, torsionally stiff (high pressure or a firm elastomer). Radial give for a nosing. Not carcass twist between the encoder and the ground.
- Design step is **9.5" rise × 9.5" going**, nosing to nosing. The whole tire sits between the nosings with about **±1.75"** of roll (~±6° of lean at a 17" hip) and about **2.5"** of air under a 1" soffit. That is the pivot-and-place margin.
- **No spokes.** A turned hub with the rubber on it. A 12" kids wheel is wider than the slot.
- **5" Zantle** stays a disposable **bench donor**. Do not cut the 7.5" tubes to suit it. [`parts-on-hand.md`](parts-on-hand.md).
- Drive is **in-wheel brushless FOC** (R6 / R30): **RobStride 05**, temporary lock. Sheet 2 hub: the RS05's outboard face flush with the tire, stator on the axle fitting F5 inboard, a disc web from the output flange to a turned 3.75"-bead rim. Open: the output-bearing rating under the cantilevered rim (38 / 76 / ~230 N static / one-leg / landing).

The rim still does **not** own the step height. The axle rises 9.5" whatever the diameter. The going owns how large a tire can sit there and still roll.

### Motor at the wheel (R30)

**Brushless motor at the wheel** (hub or coaxial at the rim). **Not** a hip-mounted drive with a long belt or shaft down the leg.

Why: Hattori V2 + Serra packaging. The wheel is the balance actuator. A remote reduction from the hip adds backlash and a failure mode we do not need on the planted contact. Leaves the leg’s inside / outside faces free for pose-joint belts (if belts).

The in-wheel BLDC hub is a **natural lathe / mill part** ([`capabilities.md`](capabilities.md)).

### kV match is a sizing goal (R31)

Answered by the RS05 lock: on the 8S bus at the 6" wheel it runs 296 rpm no-load (nominal), 188 rpm at the 1.5 m/s top speed with 2.0 N·m still in hand (R38, `spec.js`). Revisit only if the wheel actuator changes.

### Wheel drive class (R25)

The wheel motor is a **balance actuator**. Catch a tip on one skinny rim — torque-bandwidth / reaction speed, not max continuous watts.

**Temporary lock: RobStride 05** (1.7 rated / 5.5 peak N·m, 7.75:1). The class survey that led there, kept for reference — see [`electronics.md`](electronics.md):

- Lightweight: gimbal BLDC ~2208–4108 + FOC + magnetic encoder, **with reduction**. Bare ~0.5 N·m is trim on the 6" wheel, not a catch. [StackForce mini](https://wiki.seeedstudio.com/stackforce_mini_wheeled_legged_robot/) (~540 g / 2208) is a **scale** reference, not a kit lock.
- Mid: small outrunner + planetary / cycloidal. This is the honest band for about **3 N·m** peak at the 6" contact.
- Avoid for Hux: large ODrive 63xx / hoverboard hubs (SonicRobot class — steal loops, not iron).

Wheel torque (one planted wheel, **6" OD**, lean-equilibrium estimate m·g·R·sin θ): about **1.0 / 2.0 / 2.9 N·m** at **10° / 20° / 30°** on the 7.75 kg picture (0.8 / 1.5 / 2.2 at the old 6 kg). The RS05's 5.5 N·m peak is above the traction limit (~4.1 N·m fully loaded at μ 0.7), so the catch is grip-limited before it is torque-limited. **At the 1.5 m/s top speed the RS05 has 2.0 N·m left — about a 20° lean's worth** (1.6 near cutoff); that is what R38's reserve buys. On the step the shelf caps the catch at about **±6°** before the tire crosses a nosing. Formula: [`research/leg-geometry.md`](research/leg-geometry.md). Recompute when a robot is weighed.

## Hip roll axis (CoG shift) — IN V1

One-leg balance (`LEFT_ONLY` / `RIGHT_ONLY`) needs the body CoG over the **planted** wheel. A **roll axis at the hips** is the way we intend to do that (R16).

This is **not** the same joint as hip swing (pitch / lift the leg for a step) or knee rotation. Hip **roll** is the side-to-side CoG-shift DOF.

| Mode | What hip roll is for |
| --- | --- |
| **Parked** | Off. No balance loop. |
| **TWO_WHEEL** | Both wheels planted. CoG can sit between two contacts. Hip roll is optional lean / disturbance rejection, not the one-leg gate. |
| **LEFT_ONLY** | Right wheel free. Roll toward the **left** so weight sits over the left wheel. |
| **RIGHT_ONLY** | Mirror: roll toward the **right** planted wheel. |

Hip roll **alone** does not balance. The planted wheel still has to drive forward / back to keep the contact under the CoG (R17). Spec: [`software.md`](software.md).

**In V1.** Experimental — may not work as hoped. Still include the joint mechanically and in the modes. Do not fake a CoG shift in firmware if the joint is unplugged, and do not unplug it to wait for V2. Placement: **roll axes 3.0" from the centreline** in a 9.1" hip band (Sheet 1 / Sheet 2); RS02, temporary lock; one-wheel hold 6.3 N·m vs 7 rated. Steve 2026-09-25 dislikes the hip-pivot unload onto one foot; that is an **open rethink**, not a lift of this lock. See [`research/stair-climb-dynamics.md`](research/stair-climb-dynamics.md) and [`decisions.md`](decisions.md).

Actuator class: **dynamic** FOC BLDC / small QDD / fast bus servo (R27). **Not a stepper.**

## Leg actuators — CAN QDD working class; servo vs stepper+belt is the fallback

*Revised 2026-09-26: on 8S the working class for every joint is a CAN QDD actuator, **temporarily locked to the RobStride set** (`tools/living-drawings/actuators.js`). 2026-09-27: the knee RS02 sits **at the knee** (R39). The servo / stepper trade below is kept as the fallback and for its packaging lessons.*

History: Steve's 2026-09-20 follow-up said not to lock either class for knee and hip swing (R12), and lifted an earlier stepper+belt lock. The 2026-09-26 CAN decision and actuator lock superseded that.

| Joint | Status | Notes |
| --- | --- | --- |
| **Wheels** | In-wheel brushless FOC (R6 / R30) | **RS05**, temporary lock; flush in the hub (Sheet 2). |
| **Knee / hip swing** | **CAN QDD working class**; servo / stepper+belt fallback | **RS02 knee (at the knee, with the pulley spring), RS00 hip swing**, temporary lock. Knee stand-up 12.4 N·m → 6.4 at the motor with the spring (RS02 7 rated / 17 peak). GIM8108-8 was the earlier yardstick. |
| **Hip roll** | **In V1.** Dynamic FOC / QDD / fast servo | **RS02**, temporary lock. **Not a stepper.** Sized by the one-wheel cantilever: 6.3 N·m at the 3.0" axes. Experimental. |

If **steppers** are later chosen:

- Knee is **not** a bare stepper — belt / gear reduction is required.
- Hip-swing **belt is the reduction** for that joint — not a second actuator.
- Mount **above the knee** (mass high) (R32). **One belt inside, one outside** (R33).
- **The MCU does not drive stepper coils** (R29).

If **servos** are later chosen: still size for R36; still keep mass high if the packaging allows; still serviceable modules.

R7 still stands on any class: springs assist gravity.

## Design rule — one-wheel standing load (~2×) (R36)

When Hux stands on **one** wheeled leg (R2; stair plant), the plant-side knee, hip swing, and hip roll see roughly **all** the robot weight on one leg path — about **~2×** the per-leg load of two-wheel stance.

**Size those joints for the one-wheel case, not the average two-wheel case.**

- “Holds fine on two wheels” is not a pass.
- Dynamic spike (push, step commit, missed plant) is at least this bad, not better.
- ~2× is a **design rule of thumb** until we weigh a real Hux and measure a plant. The hip roll does not follow it — its load is the body + free-leg cantilever (6.3 N·m at 3.0").

Sheets 1 and 2 carry the one-leg numbers (knee 5.7 N·m at 92 %, 12.4 at the stand-up; roll 6.3).

## Layout (if belts — fallback only)

Applies when pose joints use belts (stepper+belt path, or a servo+belt reducer). IDs **R30–R33**.

- Wheel drive stays **at the rim**.
- Pose actuators **high** (above the knee / hip region).
- Belts to the **knee pivot** and **hip-swing pivot**.
- **One belt on the inside of the leg, one on the outside** — clearance, service, no rub. Face assignment TBD on the 2D set.
- **Integrate the toothed pulley / gear** into the printed leg custom where it stays draft-friendly (R20 / R33). COTS pulley fallback is fine.
- Wire ports along the belt path (R21). Service access to belts / tension (R22).
- 2D sketches must show inside / outside belt runs and motor-at-wheel before Blender (R23).

## Inspiration notes (steal, do not copy files)

### Hattori STRIDE V2

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help open terrain. On a **9.5" × 9.5"** step the settled diameter is **6"**. Overall width is **~14"**, with the tires outside the head. [`research/leg-geometry.md`](research/leg-geometry.md).
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- **Wheel motors at the wheel** are simpler than remote-drive belts (cables need to survive flailing). Hux V1 **locks that placement** (R30).
- Springs are worth it if actuators are small.

### Build Some Stuff / Kelton Serra

From [the video](https://www.youtube.com/watch?v=K1lzzVGCzAQ) — full note [`research/inspiration.md`](research/inspiration.md):

- **In-wheel BLDC + encoder**
- **Jointed legs keep CoG over contact** as the body raises and lowers
- **Serviceable modules** — threaded inserts; independently removable parts
- **Wheel-under-CoG** correction geometry (software). They used a simple P loop; Hux still studies XRobots PID.

Do not vendor their STLs, Fusion, or Gerbers. Do not buy their 40 kg servos or 3S pack.

## V1 checklist

Use this instead of a fake finished BOM. Canonical box list: [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md). Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] **Several 2D sketch layouts** (side / front / top + linkage) show **motor-at-wheel** and the **~24" / ~14"** envelope. **No Blender until this is real** (R23). *Sheet 1 + Sheet 2 drawn 2026-09-27 — tick when Steve agrees them.*
- [ ] Sketch the settled **6"** wheel inside the **9.5" × 9.5"** slot, with **7.5" + 7.5"** tubes and **~6"** above the hip ([`research/leg-geometry.md`](research/leg-geometry.md)).
- [ ] **COTS carbon tubes** for upper + lower main lengths. Printed / machined **end fittings** only. Do not print the spar (R34 / R19).
- [ ] Customs have **draft**, wire **ports**, **service** access (R20–R22).
- [ ] Knee spring (Sheet 2: pulley + extension spring, 3.05 N·m/rad + 0.38 preload) — part picked and bench-checked (open call 15). Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Plant-side joints sized for **one-wheel standing load (~2×)** (R36).
- [ ] Actuators on the sketch: RS02 knee + roll, RS00 swing, RS05 wheel (temporary lock). Hip roll **in V1**. One RS02 validated on the bench before the set is bought.
- [ ] Wheel hub — RS05 **at the rim** (R30), flush outboard, turned 3.75"-bead rim (Sheet 2). Output-bearing rating confirmed (open call 14). Lathe / mill welcome.
- [ ] Print and/or machine + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread **with margin**, without self-collision. *A feasible one-step trajectory on the Sheet 1 geometry is still open (NOTES open call 16).*

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Spend beyond the [`bom.md`](bom.md) order-now cart (tires, tubes, carbon tube, Teensy kit, XT90-S, pack). Actuators wait for one validated RS02. The 5" pair is **already ordered** — bench donor only.
- Belts, and a belt pitch — none in the working plan.
- Printing or machining a spar that COTS carbon tube already is.
- Treating 4–5 lb / under 6 lb as a hard mass gate.
- Remote wheel drive from the hip.
- Opening Blender / 3D CAD before 2D layouts exist.
- Sealed mono-body legs or torsos.
- Omitting the hip-roll axis “until V2.”

CAD drops in [`../cad/`](../cad/) — **after** 2D layouts.
