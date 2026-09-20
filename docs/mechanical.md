# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Whole robot **under 6 lb** (aspirational 4–5 lb). Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- V1 **mass ceiling under 6 lb**; aim **4–5 lb** (~1.8–2.3 kg). Wheel-drive class must leave room for hip/knee, structure, pack, FC, Pi.

## Mass budget (sketch, TBD)

Steve 2026-09-20. Hard target: **under 6 lb** total V1. Aspirational **4–5 lb** (~1.8–2.3 kg). Lines below are a sketch so we do not pretend a number is allocated. Fill them when something is weighed or honestly estimated — not with invented SKUs.

| Bucket | Mass (TBD) | Notes |
| --- | --- | --- |
| Two wheel motors + drivers + encoders | TBD | Reaction-speed / torque-bandwidth class. Must leave room for everything below. See [`electronics.md`](electronics.md). |
| Hip + knee actuators | TBD | Powerful / fast / reliable; class TBD (R12 when that lands). |
| Structure (COTS stock + printed joints / hubs) | TBD | Do not spend the budget on a printed spar if tube/rod will do. |
| 4S pack | TBD | 4S LiPo *class* (R11 when that lands). Capacity / C TBD. |
| FC + TBS Nano RX | TBD | **FC is TBD.** Do not lock a mount to invent a mass. |
| Raspberry Pi + camera(s) | TBD | Companion. Not on the FC. |
| Fasteners, wire, springs, margin | TBD | Leave slack. One-leg balance is unkind to optimistic spreadsheets. |
| **V1 total** | **< 6 lb** | Aim 4–5 lb. Do not “fix” an overrun by buying a heavier wheel motor. |

Tick a line only when a real part is on the bench or a measured print exists. Empty TBD is correct.

### Rough physics (order-of-magnitude)

At ~**2 kg** and ~**0.25 m** CoG height, a ~**10°** tip needs on the order of **~0.8 Nm** restoring at the CoG (`m g h sinθ` ≈ 2 × 9.8 × 0.25 × sin 10°). **One-leg** puts that on **one** wheel. Reduction (planetary / cycloidal) multiplies motor torque but adds backlash and reflected inertia — tradeoffs against the gimbal-direct class. This is a sanity check for wheel-motor *class*, not a locked rating and not a CAD number.

Wheel diameter (~4–6", skinny rubber) and this torque sit together: a larger rim is more tread, more inertia, more moment arm. Stroke still owns the 9.5" step.

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke.
- [ ] Pick a printable wheel-leg envelope (one side only).
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Wheel hub / BLDC mount (motor *class* still TBD — gimbal 2208–4108 vs small outrunner + reduction. No SKU).
- [ ] Mass-budget sketch: fill TBD lines above as parts are weighed. Two wheel motors + drivers must leave room for hip/knee, structure, 4S, FC, Pi.
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.
- [ ] Running mass check vs **under 6 lb** / aspirational 4–5 lb. Do not grow the first leg into a SonicRobot-class hub.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. No pack or FOC-board purchase either.
- Locking an FC mount before the FC is chosen.
- Locking a wheel-motor SKU, or picking ODrive 63xx / hoverboard hubs (too heavy for this mass).

CAD drops in [`../cad/`](../cad/).
