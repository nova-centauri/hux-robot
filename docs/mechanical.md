# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one printable wheel-leg** with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this.

Steve 2026-09-20 **layout** (this note): brushless motor **at the wheel**; knee + hip-swing **steppers high** (above the knee); **belts** to the pivots, **one inside / one outside**. No spend. No SKU.

## Intent

- Two legs, each ending in a **brushless driven wheel** whose motor sits **at the wheel** (hub / coaxial at the rim) — not remote-driven from the hip (R30).
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over *pure* serial belts for V1 simplicity. Belts here are **transmission / reduction** from high-mounted steppers to the knee and hip-swing pivots — not “belts instead of a linkage.”
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF: **hip roll stays in V1** as the dynamic actuator (class on the actuator baseline). Placement **TBD**. Do not drop CoG with heavy roll actuators if avoidable.
- Do not invent a 6-DOF stack on paper.

Actuator *classes* (wheels FOC, knee stepper+reduction, swing stepper+belt, roll dynamic in V1) live on the concurrent **actuator baseline**. What must power them: concurrent **electronics-minimum**. This page is the **mechanical layout**.

## Layout (Steve 2026-09-20)

IDs **R30–R33**. Apply fabrication rules **R20–R23** when that packet lands. Tick matching items in [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md).

### Wheel drive — motor at the wheel (R30)

**Brushless motor at the wheel** (hub or coaxial at the rim). **Not** a hip-mounted drive with a long belt or shaft down the leg.

Why:

- Matches the [Hattori STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) lesson already on this page: motors at the wheels are simpler than remote-drive belts; wheel-motor cables still have to survive flailing.
- Wheel is the balance actuator. A remote reduction from the hip adds backlash, cable/belt path, and a failure mode we do not need on the planted contact.
- Leaves the leg’s inside/outside faces free for the **knee / hip-swing** belts (below).

Exact motor / hub / encoder **TBD**. No SKU. No buy.

### kV match is a sizing goal (R31)

Aim to **match motor kV** to:

1. the **4S** bus (nominal ~14.8 V / full ~16.8 V — R11 when that lands),
2. **wheel diameter** (~4–6", skinny rubber — R13 when that lands),
3. **balance bandwidth** (reaction speed / torque at the contact — R25 when that lands).

This is a **goal**, not a picked kV. Do not invent a number, a shopping link, or a “close enough” SKU in this file. Write the real kV down only when a motor is on the bench or Steve asks to size one.

A mismatch shows up as either a wheel that cannot snap the CoG back (too much kV / too little torque) or a wheel that hits voltage/RPM limit before useful speed (too little kV / too much reduction). The trade is documented here so the first hub sketch does not pretend kV is free.

### Leg steppers — mass high, belts to the pivots (R32)

**Knee** and **hip-swing** steppers mount **above the knee**, toward the hip / body, so mass stays **high** (above the hip region) for balance.

- Do **not** hang those steppers at the knee, shin, or wheel.
- **Belts** transmit from the high motors to the **knee pivot** and the **hip-swing pivot**.
- Layout lean: **one belt on the inside of the leg, one on the outside** — clearance, serviceability, no rub.

Which belt is inside vs outside is **TBD** on the first 2D set (R23). The rule is “opposite faces,” not a locked left/right assignment. Two belts stacked on the same face is a miss (rub, no service, no port room).

R7 still stands: linkages + springs do the gravity work. The belt is the **reducer / run** to the joint, not a second actuator and not a replacement linkage. That split is the actuator baseline (knee = stepper **with** belt/gear; hip swing = stepper + belt, belt = that joint’s reduction).

No NEMA size, belt pitch, or tooth count. No spend.

### Integrated pulley (R20, R33)

**Integrate the toothed pulley / gear into the printed leg custom** where possible.

- Fewer discrete pieces (no orphan pulley + set-screw stack if the print can be the pulley).
- Still a **draft-friendly custom** (R20): printable now, moldable later; avoid undercuts that trap the tooth form; pick an orientation where the teeth survive both print and a future parting line.
- COTS stock still owns the spar (R19 when that lands). The printed part is the joint / hub / pulley — not a printed beam with teeth on the end as an excuse to skip tube.

If an integrated tooth form is a weak print, fall back to a COTS pulley on the same custom. Do not invent a pulley SKU to look finished.

### Implications — wires, service, 2D, hip roll

- **Wire ports along the belt path** (R21). Cable paths through the link / hip block must not occupy the belt run, and belt motion must not saw the leads. Wheel-motor leads (motor-at-wheel) still need a surviving path through the articulating leg.
- **Service access to belts and tension** (R22). Tensioners, idlers, and pulley faces must come off without destroying a fairing. A sealed mono-leg that hides a belt is out of intent.
- **2D sketches before Blender** (R23) must show **inside/outside belt runs** and **motor-at-wheel**. A side view that hides the second belt, or a hub that still looks remote-driven from the hip, is not a passing layout.
- **Hip roll** remains the V1 **dynamic** actuator (FOC BLDC / small QDD / fast bus servo — not a stepper). **Placement TBD.** Note: do **not** drop CoG with heavy roll actuators if avoidable. High stepper mass already lives toward the hip/body; do not hang the roll pair low on the shin or at the wheel to “get them out of the way.”

### Cross-links (light)

| Packet | What it owns | What this page owns |
| --- | --- | --- |
| **Actuator baseline** | *Class*: wheels FOC; knee stepper+reduction; swing stepper+belt; roll dynamic **in V1**. I/O: 8 axes, FC ≠ stepper coils. | *Where they sit*: motor at rim; steppers above the knee; belts in/out; integrated pulley. |
| **Electronics-minimum** | Smallest electronics set, classes, P0–P5. [`electronics-minimum.md`](electronics-minimum.md) when that lands. | Mechanical envelope those wires and drivers have to live in (ports along the belt path). |

Pointers: [`electronics.md`](electronics.md) · [`research/actuators-legs.md`](research/actuators-legs.md) when that lands · [`requirements.md`](requirements.md).

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- **Wheel motors at the wheel** are simpler than remote-drive belts (cables need to survive flailing). Hux V1 **locks that placement** (R30). kV vs 4S vs diameter vs bandwidth is still a sizing goal (R31), not a copied motor.
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real. Canonical box list: [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md).

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] **2D layouts** (side / front / top + linkage) show **motor-at-wheel** and **inside/outside belt runs**. **No Blender until this is real** (R23).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke (part of the 2D set).
- [ ] Wheel hub / coaxial BLDC mount — motor **at the rim**, not a hip-remote drive (R30). Motor model still TBD. kV match is a **goal** (R31) — do not invent a number.
- [ ] Knee + hip-swing steppers **above the knee** (mass high). Belts to the two pivots; **one inside, one outside** (R32).
- [ ] Integrated toothed pulley / gear in the printed custom where it stays draft-friendly (R33 / R20).
- [ ] Wire ports along the belt path (R21). Service access to belts / tension (R22).
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Hip-roll axis in V1 (dynamic class). Placement TBD — do not drop CoG with a heavy roll pack if avoidable.
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision. Belts do not rub; wires do not occupy the belt run.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators, belts, pulleys, or wheels. No kV / NEMA / pitch lock.
- Locking an FC mount before the FC is chosen.
- **Remote wheel drive** from the hip (long belt / shaft down the leg).
- Steppers at the knee, shin, or wheel (mass low).
- Both belts on the same face of the leg.
- Sealed mono-leg that hides belts, tension, or wheel-motor leads.
- Opening Blender / 3D CAD before 2D shows motor-at-wheel and the two belt runs.
- Hanging heavy hip-roll actuators low enough to undo the high-mass stepper layout.
- Inventing a kV, pulley SKU, or belt pitch to look finished.

CAD drops in [`../cad/`](../cad/) — **after** 2D layouts.
