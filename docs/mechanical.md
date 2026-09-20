# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- **Leg actuators TBD by axis role** (R26). Hip roll, hip swing, and knee are different jobs — do not force one type on all three. Classes: [`research/actuators-legs.md`](research/actuators-legs.md).

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small. Hux V1 still wants the spring stub, especially at the **knee** (highest gravity + 9.5" step torque). A stronger motor is not a reason to delete it.

## Leg actuators — three jobs, not one type

Steve 2026-09-20. Decision note: [`research/actuators-legs.md`](research/actuators-legs.md). **No SKU. No spend.**

| Axis | Mechanical job | Class lean (TBD) |
| --- | --- | --- |
| **Hip roll** (angling) | CoG over the planted wheel. Continuous small corrections; prefer backdrivable. Mass-critical (two of them). | Small QDD / FOC BLDC + low reduction, or fast digital bus servo. |
| **Hip rotation** (swing) | Place the raised wheel on the next tread. Intermittent position + speed. | Same family as hip roll (spares / common drivers). |
| **Knee rotation** | Highest gravity + step torque for the ~9.5" riser. Heaviest pair. | One size up in that family, **or** linear + linkage + spring. |

Prefer **one ecosystem** (serial bus servos **or** CAN/FOC QDD) for the two hip axes. Avoid huge 63xx / hoverboard as leg actuators. Avoid inventing a custom gearbox — COTS reduction or a QDD module. Drive them with existing position/torque modes (R18), not a novel joint controller.

Lab refs (Upkie qdd100 ~16 Nm, DIABLO direct-drive) are **capability patterns**, usually too heavy/costly for a V1 under 6 lb / 4–5 lb. StackForce mini (~540 g, metal-gear hip servos) proves light servos work at toy scale; Hux stairs need more knee torque than that kit.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke.
- [ ] Pick a printable wheel-leg envelope (one side only).
- [ ] Linkage layout + spring stub (gravity assist, not decorative). Knee is the axis that most needs this.
- [ ] Leg actuator *classes* by axis (hip roll / hip swing / knee). No SKU. See [`research/actuators-legs.md`](research/actuators-legs.md).
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. Do not lock a hip/knee SKU, or force one actuator type onto all three axes.
- Locking an FC mount before the FC is chosen.

CAD drops in [`../cad/`](../cad/).
