# Leg actuators — by axis role (decision note)

Steve asked (2026-09-20) to consider the **best actuators** for three different jobs on one Hux leg: **knee rotation**, **hip rotation** (swing), and **hip-angling / roll** for one-leg balance.

This is a **class decision note**, not a BOM. **No spend. No locked SKUs.** Do not force one actuator type onto all three axes.

Companion notes (some concurrent, IDs reserved):

- Hip / knee *performance bar* (powerful, fast, reliable): **R12** when that lands — [`../mechanical.md`](../mechanical.md)
- Hip **roll** as a DOF for CoG shift: **R16** when that lands — [`../mechanical.md`](../mechanical.md)
- One-leg loop = hip-roll **and** planted-wheel pitch: **R17** — [`../software.md`](../software.md)
- Reuse existing control (position / torque modes, not a novel joint controller): **R18** — [`../software.md`](../software.md)
- V1 mass ceiling **under 6 lb**, aspirational **4–5 lb**: **R24** when that lands — [`../mechanical.md`](../mechanical.md)

This note owns **R26**: pick actuators **by axis role**.

---

## Jobs differ

Hux V1 is a wheeled biped that must (requirements R1–R3, R7):

1. Balance on two wheels, then on **one**.
2. Lift a wheeled foot onto a **~9.5"** riser.
3. Use **linkages + springs** for gravity compensation / energy return.

Those three joints are not the same motor problem.

| Axis | Job | Duty | What “good” means |
| --- | --- | --- | --- |
| **Hip roll** (angling) | Shift CoG over the planted wheel. Pairs with the wheel fore/aft loop. | Continuous **small** corrections. Highest **control bandwidth**. Prefer **backdrivable**. | Fast, light, proprioceptive enough to lean without fighting the wheel loop. **Mass-critical** — two of them. |
| **Hip rotation** (swing) | Swing / place the raised wheel on the next tread. Step-cycle position + speed. | **Intermittent.** | Repeatable placement, not continuous balance. Can share a family with hip roll for spares / common drivers. |
| **Knee rotation** | Highest **gravity + step torque** for a ~9.5" riser. | Intermittent, high load. | Strongest of the three pairs. Springs / linkage gravity compensation **strongly recommended** (Hattori). Heaviest pair — budget it. |

Do not pick a “Hux actuator” and stamp it on every joint. A knee that can hold a 9.5" riser is usually too heavy and too slow for hip-roll bandwidth. A hip-roll module that is light and backdrivable is usually too weak for the knee.

---

## 1. Hip roll — angling for balance / CoG shift

One-leg balance is not a hip pose. The roll joint keeps the body weight over the planted rim while that wheel drives fore/aft under the CoG (R16 / R17 when they land). This axis therefore wants:

- Highest **control bandwidth** of the three.
- **Continuous** small corrections, not a step-and-hold.
- **Backdrivable** (or quasi-direct) so the lean can yield instead of fighting the wheel loop.
- Low reflected inertia. Two of them sit high on the robot — **mass-critical**.

**Lean (TBD, not locked):** small **QDD / FOC BLDC + low reduction**, *or* a fast **digital bus servo**.

Either class is acceptable if it can do high-rate position *or* torque from an **existing** driver (R18). Do not invent a Hux joint controller for this axis.

This axis is the one most likely to be **skipped on V1** if Steve defers hip roll (R16 is TBD-if-mandatory). If V1 skips it, do not fake the CoG shift in firmware.

---

## 2. Hip rotation — swing / place wheel on tread

This is the swing that puts a raised wheel on the next tread (vision step 5). It is a **position + speed** problem for a step cycle, not a continuous balance loop.

- Duty is **intermittent**.
- Needs enough speed to complete a step without hanging in one-leg for longer than the planted loop can hold.
- Accuracy matters more than peak torque (the knee and springs own most of the lift).

**Lean (TBD, not locked):** **share a family with hip roll** — same serial-bus servo line, or the same CAN / FOC QDD family — so V1 can share drivers, spares, and software modes.

Same family ≠ same size. Hip swing can be the same module as hip roll, or one step up, if packaging allows. Do not invent a second ecosystem just because the job is “rotation” instead of “roll.”

---

## 3. Knee rotation — gravity + 9.5" step

The knee sees the **highest gravity and step torque** of the three pairs. It has to raise a wheeled foot toward a **~9.5"** residential riser (R3) and hold it while the hip places the wheel.

- Heaviest of the three pairs. Budget mass here; do not also park lab-scale QDDs on the hips.
- **Springs / linkage gravity compensation strongly recommended.** Hattori [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2): springs are worth it if actuators are small; V2 dropped torsion springs because the actuators were no longer the limit. Hux V1 still prefers **strong linkages + springs** (R7). Do not treat a stronger motor as a reason to delete the spring stub.
- Linear into a linkage is a first-class option here in a way it is *not* for hip roll (roll wants rotary bandwidth and backdrive).

**Lean (TBD, not locked):** stronger **QDD or geared BLDC** in the *same* family as the hips (one size up), **or** a **linear actuator into the linkage + spring**.

Do not pick the knee first and then force that module onto hip roll.

---

## Mass context

V1 ceiling is **under 6 lb**, aspirational **4–5 lb** (~1.8–2.3 kg) — R24 when that lands. Two hip-roll + two hip-swing + two knee actuators eat that budget before wheels, pack, FC, and Pi.

Lab machines that *prove the control pattern* are usually too heavy and too costly for Hux V1. Cite them as **patterns, not buys**.

| Lab ref | What it proves | Why it is not a Hux V1 buy |
| --- | --- | --- |
| **[Upkie](https://github.com/upkie/upkie)** hips/knees = [mjbots qdd100](https://mjbots.com/products/qdd100-beta-3) (~**16 Nm** peak &lt; 1 s; module ~**507 g**) | QDD + FOC, torque/position from an existing driver, wheeled-biped hip/knee layout. Joint limits: [Upkie kinematics](https://upkie.github.io/upkie/kinematics.html). | Six qdd100-class modules would be ~3 kg of actuators **alone** — already over a 4–5 lb robot. Capability reference. |
| **[DIABLO](https://arxiv.org/abs/2407.21500)** — 6-DoF wheeled biped, **all direct-drive** (M1502D class; platform ~**23 kg**) | Gearbox-free bandwidth, backdrive, roll/height/split controllers on a wheeled biped. | Lab / product mass and cost. Pattern: direct-drive *behavior*, not a Hux joint. |

Do not put **63xx / hoverboard** iron on a Hux *leg* either. That class is a SonicRobot study object (IMU → PID → torque), not a V1 hip or knee. Same mass argument as the concurrent wheel-drive note.

---

## Maker refs (toy scale ≠ stair torque)

**[StackForce mini](https://wiki.seeedstudio.com/stackforce_mini_wheeled_legged_robot/)** — ~**540 g** wheeled-leg kit. Hip DOF are small **metal-gear digital servos** (DS041MG class); wheels are 2208 gimbal BLDCs + FOC.

That kit **proves light servos can work at toy scale**. It does **not** prove they can lift a Hux wheel onto a **~9.5"** riser. Hux stairs need more knee torque (and likely more hip-swing torque) than that kit. Use it as a *mass / integration* reference: bus servos + FOC wheels on a sub-kilo robot. Do not treat the kit, the DS041MG, or the 2208 as a Hux lock.

---

## V1 pragmatic lean (TBD — not locked)

A working hypothesis so Phase D has something to package against. Steve can throw this out.

1. **Prefer one ecosystem** for **hip roll + hip swing**: either a **serial bus servo** family **or** a **CAN / FOC QDD** family. Common drivers, spares, and software modes beat mixing PWM hobby servos with a CAN QDD on the same hip.
2. **Knee:** step **one size up** in that same family, **or** go **linear + linkage + spring** (R7). Do not invent a third ecosystem for the knee unless the sketch shows the rotary family cannot make the 9.5" stroke.
3. **Avoid**
   - Huge **63xx / hoverboard** motors as *leg* actuators.
   - Inventing a **custom gearbox**. Use COTS reduction or a QDD *module*.
4. **Reuse control stacks (R18).** Drive these joints in **position and/or torque modes the existing drivers already expose**. Do not write a novel Hux joint controller. Which stack we adopt is still **TBD** (Phase C).

Classes still in play (not SKUs):

| Class | Fits | Watch |
| --- | --- | --- |
| Small QDD / FOC BLDC + low reduction | Hip roll (bandwidth, backdrive); hip swing if the same family | Mass at the hip; 4S bus range |
| Fast digital **bus** servo | Hip roll and/or hip swing; possible knee if a size-up exists | Backdrive, continuous-correction heating, 4S-side voltage |
| Stronger QDD or geared BLDC | Knee (one size up) | Heaviest pair; do not also park these on roll |
| Linear + linkage + spring | Knee | Stroke vs 9.5"; how “rotation” is produced; spring is not decorative |

**4S LiPo class** (~14.8 V nom / ~16.8 V full) is the bus lean (R11 when it lands). Any class has to live on that range or an explicit BEC — do not invent a second battery to make a servo happy.

---

## What this note does not do

- Lock a SKU, vendor, or reduction ratio.
- Recommend a purchase.
- Invent a gearbox, a PDB, or a joint controller.
- Treat Upkie, DIABLO, StackForce mini, SonicRobot, or Hattori as a Hux parts list.
- Force hip roll onto V1 (R16 is TBD).
- Replace R7 (linkages + springs) or R12 (powerful / fast / reliable). This note says **which job** gets which *class*.

When a real actuator is on the bench, record axis, class, measured mass, bus voltage, and whether we used the driver’s stock position or torque mode. Until then: **TBD by axis role, no SKU.**
