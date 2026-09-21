# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- Entire robot is **electric**. Battery class is 4S LiPo — see [`electronics.md`](electronics.md). Do not wait on a pack to sketch the leg.

## Wheels — diameter hypothesis (TBD)

Diameter is **undecided**. Steve 2026-09-20:

- Working hypothesis **~6"** for US stair dimensions (tread contact / reach).
- **4–5"** is still in play.
- Must be **skinny**, **sturdy**, and have **some rubber** (traction). Hard plastic-only rims are not the intent.
- Drive is already **brushless** (R6). Motor/ESC models TBD. No wheel SKU.

**6" wheel vs ~9.5" riser:** the wheel size is about how the rim sits on and reaches a tread (contact patch, nosing, fitting on the run). It does **not** own the step height. **Leg stroke / clearance** still has to lift a wheeled foot onto a ~9.5" riser. A 6" wheel is not a 9.5" climber by itself.

Do not buy wheels. Sketch ~6" (and a 4–5" fallback) against a measured tread before printing a hub.

## Hip + knee actuators — TBD (open research)

**Hip rotation** and **knee rotation** actuators are **undecided**. Do not lock a part.

Requirements for those two joints (Steve 2026-09-20): **powerful, fast, reliable**.

Candidate *classes* only — not SKUs, not a shopping list:

| Class | Why it is on the list | Still TBD |
| --- | --- | --- |
| BLDC + gearbox / cycloidal | High torque density, common on legged platforms | Ratio, backdrive, packaging |
| Quasi-direct drive | Fast, proprioceptive, shock-tolerant | Mass at the joint, cost, availability on hand |
| Linear + linkage + springs | Matches V1 linkage+spring bias; gravity assist | Stroke, force, how “rotation” is produced |
| High-torque servo class | Simple integration if something on hand is strong enough | Speed, reliability, 4S-side voltage |

Do not pick a winner in this file. Do not invent a BOM. Research first; no spend; do not lock actuators.

R7 (linkages + springs) still stands as the V1 *leg* bias. R12 is the *actuator* question. They can meet (linear + linkage + springs) or the springs can assist a rotary class. That meeting is the research.

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter. Hux V1 still leans **skinny ~6"** for stair tread contact — that is a stair choice, not a forgotten terrain lesson.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small. Hux hip/knee class is still TBD and must be powerful / fast / reliable even if springs assist.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke. Start with **~6"** hypothesis (4–5" fallback). Remember: diameter = tread contact / reach; **stroke owns the 9.5"**.
- [ ] Pick a printable wheel-leg envelope (one side only). Skinny wheel, rubber contact.
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Hip + knee actuator *class* research (powerful / fast / reliable). No SKU, no buy, no lock.
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. No pack purchase either.
- Locking an FC mount before the FC is chosen.
- Locking hip / knee actuator class or a wheel SKU.

CAD drops in [`../cad/`](../cad/).
