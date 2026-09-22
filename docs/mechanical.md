# Mechanical

**Status:** TBD. No CAD, no printed or machined customs, no locked geometry.

V1 target is **one wheel-leg** — printed / machined **fittings** on **carbon-tube spars** — with a linkage + spring stub, sized toward a **~9.5"** step. Envelope: up to **~24" tall at full extension**, **~14" wide**. The head sits inside that width. Wheels and legs are outside the head. Do not wait on the flight controller. **Do not open Blender until several 2D sketch layouts exist** (R23).

**Parts on hand:** [`parts-on-hand.md`](parts-on-hand.md). A **5"** walker-wheel pair is already ordered — **bench donor only**, not the foot. Wheel diameter is **settled at 6" OD**: [`research/leg-geometry.md`](research/leg-geometry.md).

**Shop / fab:** [`capabilities.md`](capabilities.md). End fittings (hubs, belt mounts, joint flanges) are a natural print / mill / lathe job. **Do not mill a spar that a carbon tube already is** (R19 / R34).

**Decisions:** [`decisions.md`](decisions.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md).

## Intent

- Two legs, each ending in a **brushless FOC driven wheel** whose motor sits **at the wheel** (hub / coaxial at the rim) — not remote-driven from the hip (R6 / R30).
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over *pure* serial belts for V1 simplicity. A belt, if present, is **reduction / run** — not “belts instead of a linkage.” Longer spars still mean **longer belt runs** if a belt is the reducer.
- Design stroke and clearance around a ~9.5" residential riser (up and down). The **~24"** full-extension envelope has to **reach that riser with margin**.
- **Jointed legs should keep CoG over wheel contact as height changes** (Serra packaging).
- **Hip roll is in V1** (R16) so the body can shift CoG over the planted wheel. Distinct from hip swing / knee. Experimental — still ship the joint.
- **Serviceable modular customs:** threaded inserts, independently removable parts, inside access (R22 + Serra).
- **Size plant-side joints for one-wheel standing load** (~2× two-wheel stance, R36).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- Overall width is **~14"** (R15). The head is inside. Wheels and legs are outside the head.
- Entire robot is **electric**. Battery class is 4S LiPo — see [`electronics.md`](electronics.md).

## Scale + structure (Steve 2026-09-21)

Docs only. Envelope and structure bias — not locked CAD, not a SKU list, **no spend**.

### Carbon-tube spars (R34)

**Primary leg spars** are **carbon fiber tubes** for the main lengths of the **upper and lower leg**. This is COTS structure (R19): the tube *is* the beam.

Printed or machined **fittings at the ends** only:

- Hubs
- Belt mounts / pulley faces
- Joint flanges (hip, knee, wheel)

Do not print a carbon-tube-shaped spar. Do not turn a tube on the lathe to “make a nicer spar.” Cut COTS tube to length (bandsaw is enough); the shop owns the **ends**. **Wet-cut + respirator** — carbon dust (Tazer; [`capabilities.md`](capabilities.md)). Tube diameter / wall **TBD**. No carbon-tube SKU.

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
| Two wheel motors + drivers + encoders | TBD | Reaction-speed / torque-bandwidth class (R25). In-wheel. |
| Hip swing + knee actuators | TBD | Servo vs stepper+belt **TBD** (R12). Size for ~2× plant (R36). |
| Hip-roll actuators | TBD | Dynamic class **in V1** (R16 / R27). |
| Structure (carbon tubes + end fittings) | TBD | Do not spend mass on a printed spar. |
| 4S pack | TBD | Class only (R11). |
| FC + TBS Nano RX | TBD | **FC is TBD.** |
| Raspberry Pi + camera(s) | TBD | Companion. Not on the FC. |
| Fasteners, wire, springs, margin | TBD | Leave slack. |
| **V1 total** | **soft** | Historical preference 4–5 lb / under 6 lb. Not a gate. |

### Implications of the taller tubes

| What changes | Why it matters |
| --- | --- |
| **Belt runs get longer** | Knee / hip-swing reducers (if belts) span more tube. Plan tension, idlers, and service along the spar. Wires must not occupy the belt path (R21). |
| **Actuators sit at the joints** | Servo / stepper / **GIM8108-class** *candidate* at **hip and knee**, with **tube between**. The spar is empty length, not a motor house. Class is **not locked** (R12). No SKU. |
| **CoG sits higher** | Helps: inverted-pendulum fall is slower (`ω ≈ √(g/h)`). At the working stance that doubling time is about **145 ms**. Hurts: more inertia and a longer disturbance arm. Static moment about the planted wheel is `m g d` (height drops out): ~**9.5 N·m** at 6 kg if the CoG is still on the **12.75"** track's centerline. |

Do not hang joint mass in the middle of a tube to “use the length.” Do not invent a GIM8108 buy to fill the class.

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

Access to fasteners, batteries, FC (bay — board still TBD), and actuators as **replaceable modules**. Steal Serra's habit: threaded inserts, independently removable parts, inside access. A sealed mono-leg that hides a belt or a pack is out of intent.

### 5. Process — several 2D sketch layouts before Blender (R23)

**Gate:** 2D layouts exist **before** Blender (or other 3D CAD). Several views: side, front, top, plus linkage / stroke. The 2D set must show **motor-at-wheel**, the **~24" / ~14"** envelope, and **inside/outside belt runs** if belts are on the sketch. A `.blend` with no preceding 2D is a process miss.

## Wheels — 6" OD, in-wheel drive

Steve 2026-09-21: settle the wheel so it fits comfortably on one step. The robot pivots on the planted wheel and sets the raised wheel on the next step. Full math: [`research/leg-geometry.md`](research/leg-geometry.md). **Size is locked. Not a buy.**

- **6" overall diameter** (a real tire at **5.75–6.25"** still counts). Width **~1–1.25"**. Real rubber, torsionally stiff (high pressure or a firm elastomer). Radial give for a nosing. Not carcass twist between the encoder and the ground.
- Design step is **9.5" rise × 9.5" going**, nosing to nosing. The whole tire sits between the nosings with about **±1.75"** of roll (~±6° of lean at a 17" hip) and about **2.5"** of air under a 1" soffit. That is the pivot-and-place margin.
- **No spokes.** A turned hub with the rubber on it. A 12" kids wheel is wider than the slot.
- **5" Zantle** stays a disposable **bench donor**. Do not cut the 7.5" tubes to suit it. [`parts-on-hand.md`](parts-on-hand.md).
- Drive is **in-wheel brushless FOC** (R6 / R30). Motor / ESC / encoder models TBD. No wheel-motor SKU.

The rim still does **not** own the step height. The axle rises 9.5" whatever the diameter. The going owns how large a tire can sit there and still roll.

### Motor at the wheel (R30)

**Brushless motor at the wheel** (hub or coaxial at the rim). **Not** a hip-mounted drive with a long belt or shaft down the leg.

Why: Hattori V2 + Serra packaging. The wheel is the balance actuator. A remote reduction from the hip adds backlash and a failure mode we do not need on the planted contact. Leaves the leg’s inside / outside faces free for pose-joint belts (if belts).

The in-wheel BLDC hub is a **natural lathe / mill part** ([`capabilities.md`](capabilities.md)).

### kV match is a sizing goal (R31)

Aim to match motor kV to (1) the **4S** bus, (2) **wheel diameter**, (3) **balance bandwidth** (R25). This is a **goal**, not a picked kV. Do not invent a number or a “close enough” SKU.

### Wheel drive class (R25)

The wheel motor is a **balance actuator**. Catch a tip on one skinny rim — torque-bandwidth / reaction speed, not max continuous watts.

Candidate *classes* (not buys) — see [`electronics.md`](electronics.md):

- Lightweight: gimbal BLDC ~2208–4108 + FOC + magnetic encoder, **with reduction**. Bare ~0.5 N·m is trim on the 6" wheel, not a catch. [StackForce mini](https://wiki.seeedstudio.com/stackforce_mini_wheeled_legged_robot/) (~540 g / 2208) is a **scale** reference, not a kit lock.
- Mid: small outrunner + planetary / cycloidal. This is the honest band for about **3 N·m** peak at the 6" contact.
- Avoid for Hux: large ODrive 63xx / hoverboard hubs (SonicRobot class — steal loops, not iron).

Wheel torque target (one planted wheel, ~6 kg example, **6" OD**): about **0.8 / 1.5 / 2.2 N·m** to stop a **10° / 20° / 30°** fall, so about **3 N·m peak**. On the step itself the shelf caps the catch at about **±6°** before the tire crosses a nosing. Formula: [`research/leg-geometry.md`](research/leg-geometry.md). The old **~0.8 N·m** line was a 2 kg machine. Do not hang a GIM8108-class actuator on the axle. Axle speed for balance is roughly **60–380 rpm**. Recompute when a robot is weighed.

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

**In V1.** Experimental — may not work as hoped. Still include the joint mechanically and in the modes. Do not fake a CoG shift in firmware if the joint is unplugged, and do not unplug it to wait for V2. Placement **TBD**. Do not drop CoG with heavy roll actuators if avoidable.

Actuator class: **dynamic** FOC BLDC / small QDD / fast bus servo (R27). **Not a stepper.**

## Leg actuators — servo vs stepper+belt TBD

Steve 2026-09-20 follow-up. **Do not lock either class** for knee and hip swing (R12). A earlier packet locked stepper+belt — **that lock is lifted.** Do not write a servo lean into the baseline either.

| Joint | Status | Notes |
| --- | --- | --- |
| **Wheels** | In-wheel brushless FOC (R6 / R30) | Locked *class*. SKU TBD. |
| **Knee / hip swing** | **Servo vs stepper+belt TBD** | Both open. Size **either** for one-leg plant load (R36). **GIM8108-8** is a candidate (not ordered). Serra's 40 kg-class servos are a data point, not a Hux SKU. |
| **Hip roll** | **In V1.** Dynamic FOC / QDD / fast servo | **Not a stepper.** Size for ~2× plant-side load (R36). Experimental. |

If **steppers** are later chosen:

- Knee is **not** a bare stepper — belt / gear reduction is required.
- Hip-swing **belt is the reduction** for that joint — not a second actuator.
- Mount **above the knee** (mass high) (R32). **One belt inside, one outside** (R33).
- **FC does not drive stepper coils** (R29).

If **servos** are later chosen: still size for R36; still keep mass high if the packaging allows; still serviceable modules.

R7 still stands. A servo or a stepper+belt can drive a linkage; springs still assist gravity.

## Design rule — one-wheel standing load (~2×) (R36)

When Hux stands on **one** wheeled leg (R2; stair plant), the plant-side knee, hip swing, and hip roll see roughly **all** the robot weight on one leg path — about **~2×** the per-leg load of two-wheel stance.

**Size those joints for the one-wheel case, not the average two-wheel case.**

- “Holds fine on two wheels” is not a pass.
- Dynamic spike (push, step commit, missed plant) is at least this bad, not better.
- ~2× is a **design rule of thumb** until we weigh a real Hux and measure a plant. Do not invent a torque SKU from it.

Write the rule on the first wheel-leg sketch (Phase D).

## Layout (if belts)

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
- [ ] **Several 2D sketch layouts** (side / front / top + linkage) show **motor-at-wheel**, **~24" / ~14"** envelope, and **inside/outside belt runs** if belts. **No Blender until this is real** (R23).
- [ ] Sketch the settled **6"** wheel inside the **9.5" × 9.5"** slot, with **7.5" + 7.5"** tubes and **~6"** above the hip ([`research/leg-geometry.md`](research/leg-geometry.md)).
- [ ] **COTS carbon tubes** for upper + lower main lengths. Printed / machined **end fittings** only. Do not print the spar (R34 / R19).
- [ ] Customs have **draft**, wire **ports**, **service** access (R20–R22).
- [ ] Linkage layout + spring stub. Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Plant-side joints sized for **one-wheel standing load (~2×)** (R36).
- [ ] Leg actuator class on the sketch: **servo vs stepper+belt TBD** (both open). Hip roll **in V1** (dynamic). No SKU.
- [ ] Wheel hub / coaxial BLDC — motor **at the rim** (R30). kV match is a **goal** (R31). Lathe / mill welcome.
- [ ] Print and/or machine + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread **with margin**, without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- **New** spend on actuators, carbon tube, or wheels. The 5" pair is **already ordered** — bench donor only. The 6" size is not an order.
- Locking an FC mount *model* before the FC is chosen (the **bay** still gets designed).
- Locking servo vs stepper+belt, a tube OD / wall, GIM8108 SKU, or belt pitch.
- Printing or machining a spar that COTS carbon tube already is.
- Treating 4–5 lb / under 6 lb as a hard mass gate.
- Remote wheel drive from the hip.
- Opening Blender / 3D CAD before 2D layouts exist.
- Sealed mono-body legs or torsos.
- Omitting the hip-roll axis “until V2.”

CAD drops in [`../cad/`](../cad/) — **after** 2D layouts.
