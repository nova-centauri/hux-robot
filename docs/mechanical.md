# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this.

**Parts on hand:** [`parts-on-hand.md`](parts-on-hand.md). A 5" walker-wheel pair is already ordered (document only).

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.

## Wheel diameter (working hypothesis)

Steve 2026-09-20. Soft, not CAD. Do not treat this as locked geometry.

- **Range still:** ~**4–6"** skinny rubber.
- **Preferred now:** **5"** — a pair of 5" Zantle walker wheels is already ordered. Inventory: [`parts-on-hand.md`](parts-on-hand.md).
- **Caveat:** those parts are walker *caster/fork* assemblies (free-rolling medical walkers), not ready-made BLDC hubs. Plan to use the **rubber wheel** (and maybe axle geometry) with a **custom hub for in-wheel BLDC**. Discard or adapt the walker stem/fork as needed.
- Measure bore / OD / width when they arrive. Stroke still owns the 9.5" step.

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real.

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke (**5" preferred**, 4–6" range).
- [ ] Pick a printable wheel-leg envelope (one side only).
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. The 5" Zantle pair is **already ordered** — document only; no new wheel spend.
- Locking an FC mount before the FC is chosen.

CAD drops in [`../cad/`](../cad/).
