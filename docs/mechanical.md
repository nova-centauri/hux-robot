# Mechanical

**Status:** TBD. No CAD, no printed or machined customs, no locked geometry.

V1 target is **one wheel-leg** — printed / machined **fittings** on **carbon-tube spars** — with a linkage + spring stub, sized toward a **~9.5"** step. New V1 envelope: up to **~24" tall at full extension**. Width stays **~10"** (unchanged). Do not wait on the flight controller for this.

**Parts on hand:** [`parts-on-hand.md`](parts-on-hand.md) when that packet lands. A **5"** walker-wheel pair is already ordered (document only).

**Shop / fab:** [`capabilities.md`](capabilities.md) when that packet lands. End fittings (hubs, belt mounts, joint flanges) are a natural print / mill / lathe job. **Do not mill a spar that a carbon tube already is** (R19-style COTS).

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over *pure* serial belts for V1 simplicity. Longer spars still mean **longer belt runs** if a belt is the joint reducer — not “belts instead of a linkage.”
- Design stroke and clearance around a ~9.5" residential riser (up and down). The **~24"** full-extension envelope has to **reach that riser with margin**.
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- **Primary scale change is height**, not width. Width hypothesis stays **~10"** (R15 when that lands).

## Scale + structure (Steve 2026-09-21)

Docs only. Envelope and structure bias — not locked CAD, not a SKU list, **no spend**.

### Carbon-tube spars (R34)

**Primary leg spars** are **carbon fiber tubes** for the main lengths of the **upper and lower leg**. This is COTS structure (R19 style when that packet lands): the tube *is* the beam.

Printed or machined **fittings at the ends** only:

- Hubs
- Belt mounts / pulley faces
- Joint flanges (hip, knee, wheel)

Do not print a carbon-tube-shaped spar. Do not turn a tube on the lathe to “make a nicer spar.” Cut COTS tube to length (bandsaw is enough — [`capabilities.md`](capabilities.md)); the shop owns the **ends**. Tube diameter / wall **TBD**. No carbon-tube SKU.

### Height envelope — ~24" at full extension (R35)

New V1 envelope: Hux may stand up to **~24" tall at full extension** (wheel contact to top of stance). This is the **primary scale change** vs the earlier compact lean.

Still gated by **R3**: the raised wheel must reach a **~9.5"** residential riser **with margin**. Taller tubes buy stroke and clearance; they do not replace the step. **5"** wheels are already on order ([`parts-on-hand.md`](parts-on-hand.md)) — stroke still owns the riser; the rim is not the climb.

Sketch wheel diameter vs. step vs. knee stroke **against this 24" cap**. Do not grow past ~24" on paper to invent extra reach.

### Width unchanged (~10")

Overall width stays **~10"** outside-to-outside (R15 when that lands) unless Steve changes it. Height moved; width did not. Body + hip spacing + wheel thickness still share that 10" budget.

### Mass — blown / soft (not a gate)

Capability and packaging **beat** the old **4–5 lb** aspiration. Those numbers (and the concurrent **under 6 lb** ceiling, R24 when that lands) are a **historical soft preference only**. They are **not a kill-switch**.

If a concurrent note treated under 6 lb as a hard ceiling, **this 2026-09-21 update supersedes that hardness**. Record a real weigh-in when one exists. Do not reject carbon-tube length, end fittings, or a capable joint class to protect a spreadsheet. Do not spend the extra mass on a printed spar.

### Implications

Longer COTS tubes change the layout even before CAD:

| What changes | Why it matters |
| --- | --- |
| **Belt runs get longer** | Knee / hip-swing reducers (if belts) span more tube. Plan tension, idlers, and service along the spar — not a short printed link. Wires must not occupy the belt path. |
| **Actuators sit at the joints** | **GIM8108-class** *or* **servo / stepper TBD** at **hip and knee**, with **tube between**. The spar is empty length, not a motor house. Class is **not locked** (R12 when that lands already lifted a stepper-only lock). No SKU. |
| **CoG sits higher** | Helps: inverted-pendulum fall is slower (`ω ≈ √(g/h)`), so there is more time to correct. Hurts: more inertia to snap back; disturbance moment arms grow; a ~10" stance still has to put CoG over one ~5" contact. Static hip-roll torque for a given lateral shift is about `m g d` (height drops out); the dynamics do not. |

Do not hang joint mass in the middle of a tube to “use the length.” Do not invent a GIM8108 (or any other) buy to fill the class.

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke against a **~24"** full-extension cap (**5"** wheels preferred / already ordered).
- [ ] Pick a wheel-leg envelope (one side only) that stays **~10"** wide and **≤ ~24"** tall at full extension.
- [ ] **COTS carbon tubes** for upper + lower main lengths. Printed / machined **end fittings** only (hubs, belt mounts, joint flanges). Do not print the spar (R34 / R19).
- [ ] Linkage layout + spring stub (gravity assist, not decorative). Note **longer belt runs** if a belt is the reducer.
- [ ] Joint actuators at **hip / knee** with tube between (GIM8108-class **or** servo/stepper TBD). No SKU.
- [ ] Wheel hub / BLDC mount (motor model still TBD). Lathe/mill welcome — [`capabilities.md`](capabilities.md).
- [ ] Print and/or machine + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread **with margin**, without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators, carbon tube, or wheels. The 5" pair is **already ordered** — document only.
- Locking an FC mount before the FC is chosen.
- Locking a tube OD/wall, GIM8108 SKU, or belt pitch.
- Printing or machining a spar that COTS carbon tube already is.
- Treating 4–5 lb / under 6 lb as a hard mass gate.

CAD drops in [`../cad/`](../cad/).
