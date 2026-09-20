# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Overall width hypothesis **~10"**. Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- **~10"** overall width hypothesis (outside-to-outside of the stance). Measure before CAD lock.
- Likely a **hip roll** axis so the body can shift CoG over the planted wheel. **TBD if mandatory for V1.** Distinct from hip pitch / knee rotation.
- Extra DOF is desirable later (stairs / fall recovery); hip **roll** is the one extra axis we are actually talking about for CoG shift. Do not invent a 6-DOF stack on paper.

## V1 width envelope (~10")

Steve 2026-09-20. Working hypothesis: Hux V1 is about **10 inches** overall width (body + both wheel-legs, outside-to-outside). This is an envelope, not a locked CAD number.

Implications for the first sketches:

- A narrow stance keeps the CoG closer to either wheel, so a hip-roll lean can actually put weight over the planted contact.
- Whatever wheel diameter we pick still has to fit this envelope (skinny wheels help).
- Body width, hip spacing, and wheel thickness share the same 10" budget. Do not grow the torso and then “add legs beside it.”
- Measure a real stance / doorway / stair width before treating 10" as geometry.

Tick the width sketch in the V1 checklist when it exists. Do not print a second-leg copy to invent a width.

## Hip roll axis (CoG shift)

One-leg balance (`LEFT_ONLY` / `RIGHT_ONLY`) needs the body CoG over the **planted** wheel. A **roll axis at the hips** is the likely way to do that: lean the torso toward the planted side so the CoG projection sits on that contact patch.

This is **not** the same joint as hip pitch (swing / lift the leg for a step) or knee rotation. Those still matter for the stair cycle. Hip **roll** is the coronal CoG-shift DOF.

| Mode | What hip roll is for |
| --- | --- |
| **Parked** | Off. No balance loop. |
| **2-wheel** | Both wheels planted. CoG can sit between the two contacts. Hip roll is optional lean / disturbance rejection, not a one-leg gate. |
| **LEFT_ONLY** | Right wheel free. Roll toward the **left** so weight sits over the left wheel. Without this (or an equivalent shift), the body falls toward the free side. |
| **RIGHT_ONLY** | Mirror: roll toward the **right** planted wheel. |

Hip roll **alone** does not balance. The planted wheel still has to drive forward/back to keep the contact under the CoG (inverted-pendulum pitch). That coupled loop is [`software.md`](software.md) / R17. Mechanical job here: leave room for a hip-roll axis, or explicitly defer it.

**TBD if mandatory for V1.** If the first printable wheel-leg has no roll axis, treat one-leg modes as a later hardware + control gate — do not fake a CoG shift in firmware. No actuator SKU. No spend.

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
- [ ] Pick a printable wheel-leg envelope (one side only) that can share a **~10"** overall width.
- [ ] Sketch hip spacing vs. body width vs. wheel thickness against that 10" budget.
- [ ] Note a **hip roll** axis (or an explicit V1 deferral). Distinct from hip pitch / knee. TBD if mandatory.
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision. One-leg CoG shift still needs a path over the planted wheel (hip roll or a recorded deferral).

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels.
- Locking an FC mount before the FC is chosen.
- Locking hip roll as mandatory V1 hardware (R16 is TBD).
- Inventing a 6-DOF hip stack or a novel balance mechanism to “solve” one-leg on paper.

CAD drops in [`../cad/`](../cad/).
