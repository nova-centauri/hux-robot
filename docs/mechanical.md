# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry. **Servo vs stepper+belt TBD.** Size plant-side joints for **~2×** one-wheel load.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this.

## Intent

- Two legs, each ending in a **brushless driven wheel** — **motor + encoder at the wheel** (in-wheel / hub / coaxial at the rim), not remote-driven from the hip for balance.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity. If a belt exists later, it is reduction — not “belts instead of a linkage.”
- Design stroke and clearance around a ~9.5" residential riser (up and down). **Jointed legs should keep CoG over wheel contact as height changes.**
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- **Serviceable modular prints:** threaded inserts, independently removable parts, inside access.
- **Size plant-side joints for one-wheel standing load** (~2× two-wheel stance). See R14 below.

## Leg actuators — servo vs stepper+belt TBD

Steve 2026-09-20. **Do not lock either class.** Knee and hip swing stay **undecided**. A concurrent packet locked stepper+belt — **that lock is lifted.** Do not write a servo lean into the baseline either.

| Joint | Status | Notes |
| --- | --- | --- |
| **Wheels** | Brushless + encoder at the wheel (R6) | Locked *class* (brushless). SKU TBD. |
| **Knee / hip swing** | **Servo vs stepper+belt TBD** | Both are open options. Size **either** for one-leg plant load (R14). Serra's 40 kg-class servos are a data point, not a Hux SKU and not a preference. |
| **Hip roll** | Class TBD; **size for ~2× plant-side load** if the axis exists | Do not size roll for average two-wheel stance. |

No NEMA size, no servo SKU, no belt pitch, no spend. No “lean servos” / “lean steppers” in this baseline. Pick the class later — not to match a video.

R7 still stands. A servo or a stepper+belt can drive a linkage; springs still assist gravity.

## Design rule — one-wheel standing load (~2×)

When Hux stands on **one** wheeled leg (R2; stair plant), the plant-side knee, hip, and hip roll see roughly **all** the robot weight on one leg path — about **~2×** the per-leg load of two-wheel stance.

**Size those joints for the one-wheel case, not the average two-wheel case.**

- “Holds fine on two wheels” is not a pass.
- Dynamic spike (push, step commit, missed plant) is at least this bad, not better.
- ~2× is a **design rule of thumb** until we weigh a real Hux and measure a plant. Do not invent a torque SKU from it.

Write the rule on the first wheel-leg sketch (Phase D). Do not wait for a second leg to discover the plant-side joint is undersized.

## Build Some Stuff notes (steal packaging, do not copy files)

From [Kelton Serra / Build Some Stuff](https://www.youtube.com/watch?v=K1lzzVGCzAQ) — full note [`research/inspiration.md`](research/inspiration.md):

- **In-wheel BLDC + encoder** — motor-at-wheel packaging for the balance actuator.
- **Jointed legs keep CoG over contact** as the body raises and lowers.
- **Serviceable modules** — threaded inserts on every screw; each part independently removable from the body.
- **Wheel-under-CoG** correction geometry (software). They used a simple P loop; Hux still studies XRobots PID.

Do not vendor their STLs, Fusion, or Gerbers. Do not buy their 40 kg servos or 3S pack.

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
- [ ] Linkage layout + spring stub (gravity assist, not decorative). Jointed motion keeps CoG over wheel contact as height changes.
- [ ] Wheel hub / BLDC + encoder mount (motor-at-wheel; model still TBD).
- [ ] Service: threaded inserts; independently removable parts; inside access.
- [ ] Plant-side joints (knee / hip / hip roll) sized for **one-wheel standing load (~2×)**, not two-wheel average.
- [ ] Leg actuator class on the sketch: **servo vs stepper+belt TBD** (both open; size for R14). No SKU, no buy, no lean.
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. No servo or stepper purchase either.
- Locking an FC mount before the FC is chosen.
- Locking servo vs stepper+belt to look finished.
- Sizing knee/hip for two-wheel stance only.

CAD drops in [`../cad/`](../cad/).
