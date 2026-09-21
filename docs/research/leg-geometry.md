# Leg geometry — strength, give, and reaction speed

Steve **2026-09-21**: review the plan and the leg math. The ordered walker wheels are not a good enough foot. Real rubber, yes. A kids bike tire, no.

Steve **2026-09-21**, follow-up: the wheel has to sit **comfortably on one step** so the robot can **pivot on it and place the raised wheel on the next step**. Settle the diameter now.

**Settled: 6" overall diameter**, width **~1–1.25"**, real rubber, torsionally stiff. A real tire that measures **5.75–6.25"** outside still counts. **No spend. No tire SKU. No spokes.** FC stays TBD. This note does not open Phase D. Decision log: [`../decisions.md`](../decisions.md).

The earlier **~8" working draw is withdrawn.** On the design step it leaves about **±0.75"** of roll, which is not enough room to balance while pivoting.

## Design step

| Item | Locked for the fit | How it is measured |
| --- | --- | --- |
| Rise | **9.5"** | Already R3. Vertical, nosing to nosing. |
| Going | **9.5"** | Nosing to nosing, same nominal as the rise. A square step. |
| Nosing | up to **~1¼"**, bullnose radius ≤ **9/16"** | IRC-typical. The wheel does **not** depend on tucking under it. |

Code tread depth is the horizontal distance between the leading edges of adjacent treads (nosing to nosing). A 1" nosing makes the board about an inch deeper than that, and the next nosing hangs over the back of the shelf. Comfortable means the **whole tire sits between the two nosing planes**, with air above it, so a balance roll does not put rubber across a nosing or under the bullnose.

A deeper real stair is spare room. It is not a reason to grow the wheel. Reopen the diameter only if a measured going is **under ~9"**.

## What still holds

- North star stays lift → one-leg balance → plant (R3). Modes stay `PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY` before any autonomy (R14).
- **In-wheel brushless FOC** (R6 / R30). **Hip roll in V1**, dynamic class, not a stepper (R16 / R27).
- Knee and hip swing stay **servo vs stepper+belt TBD** (R12). **GIM8108-8** stays a candidate, not an order.
- **Carbon-tube** spars, fittings at the ends (R34). Envelope **~24" × ~10"** (R35 / R15). **2D before Blender** (R23).
- Mass stays **soft** (R24). **4S + step-down** (R11). Plant-side joints sized for one wheel (R36).
- Linkages + springs (R7). Shop can turn a hub ([`../capabilities.md`](../capabilities.md)).

## Why 6"

The planted wheel is an inverted pendulum **on a shelf**. While the body pivots and the free leg swings up, that wheel has to roll forward and back to keep the contact under the mass. The landing wheel then has to arrive inside the next shelf, not on a line.

Rule used to settle: at the parked pose, **at least ~1.75" of rubber-to-nosing gap on each side** of a 9.5" going, and **at least ~2" of air** between the top of the tire and a 1" soffit under the next tread. The axle rise onto the next step is **9.5" for any diameter** — a bigger tire does not shorten the lift.

| OD | Gap each side on a 9.5" going | Balance roll before rubber crosses a nosing | Lean that roll can catch at a ~17" hip | Air under a 1" soffit |
| --- | ---: | ---: | ---: | ---: |
| 5" | 2.25" | ±2.25" | ±7.5° | 3.5" |
| **6" (locked)** | **1.75"** | **±1.75"** | **±6°** | **2.5"** |
| 7" | 1.25" | ±1.25" | ±4° | 1.5" |
| 8" (withdrawn) | 0.75" | ±0.75" | ±2.5° | 0.5" |
| 12" kids | tire wider than the slot | none | — | tire taller than the riser |

```
|<-------------- 9.5" nosing to nosing -------------->|
| 1.75" |<------------- 6" tire ------------->| 1.75" |
          axle may roll ±1.75" while pivoting

upper tread _____________________________  9.5"
                 3.5" open  (2.5" under a 1" soffit)
            ____________________  top of tire
            |                  |
____________|__________________|__________  this tread
```

On a code 10" going the same 6" tire has **±2"** of roll. On an 11" going, **±2.5"**. The landing tolerance is that same gap: the raised axle has to arrive within **±1.75"** of the center of the next 9.5" slot. An 8" tire would have demanded **±0.75"**, which is a precision place, not a pivot.

A 12" spoked kids wheel cannot enter the slot. Width stays **~1–1.25"** so two tires still fit in the 10" stance (a 2" kids tire uses about 4.3" of that stance).

## Settled leg

Side view at full extension, hip over the axle:

```
top of stance                          24"
├──────── body / pack / FC / Pi ──────  6"     (assumption)
hip axis                               18" above contact
├──────── upper tube ─────────────────  7.5"
knee
├──────── lower tube ─────────────────  7.5"
axle                                    3" above contact
└──────── 6" wheel, ~1–1.25" wide ─────  contact
```

Balance stance shortens the leg to 92% (links about **23°** off vertical). Knee sits about **2.9"** off the weight line. Hip stays over the axle.

Reach at that stance, swing axle one 9.5" going forward and 9.5" up: about **4.3"** of leg still unused. The swing leg is not stretched out flat.

If the body needs 8" above the hip instead of 6", each link loses an inch (6.5" + 6.5"). Do not grow the wheel to "use" that. The diameter is settled.

## Assumptions behind the torque numbers

| Item | Value used | Why |
| --- | --- | --- |
| Full height | 24" contact to top | R35 |
| Body above hip axis | **6"** | Pack, FC, Pi. Not measured. |
| Links | Equal, hip over the axle in stance | CoG-over-contact. Serial zigzag is the conservative knee. |
| Stance | **92%** of full leg extension | Slight crouch so the knee is not locked straight. |
| Wheel mass for the sums | **0.30 kg**, `J = 0.65 m R²` | Estimate until a tire is weighed. |
| Mass | **4 / 6 / 8 kg** worked; **6 kg** is the example | Soft budget. Not a target. |
| Arrest torque | `τ = (m − m_wheel + J/R²) · g · R · sin θ` | Torque that stops the fall at lean θ on **one** wheel. |

`g = 9.81`. One inch of CoG offset at 6 kg is **1.5 N·m** about the contact.

## Strong — hip roll

The wheel cannot help sideways. At the moment one wheel unloads, if the CoG is still on the centerline, gravity pulls toward the free side.

`τ = m · g · (track / 2)`

Track for a **1.25"** tire inside a 10" body is about **8.75"**. Height cancels. Once the CoG is over the planted wheel, the moment falls to the leftover offset: **1.5 N·m per inch at 6 kg**.

| Mass | ~1" tire (track 9") | **~1.25" tire (track 8.75")** |
| ---: | ---: | ---: |
| 4 kg | 4.5 N·m | 4.4 N·m |
| **6 kg** | 6.7 N·m | **6.5 N·m** |
| 8 kg | 9.0 N·m | 8.7 N·m |

Size **peak** roll torque to beat that full moment. Size **continuous** for an inch or two of leftover error, not for sitting at the full moment. Roll inertia is small because the body is narrow, so the shift is quick once the torque exists.

**GIM8108-8 yardstick** (published SteadyWin-class numbers, **not a buy**): about **7.5 N·m** nominal, **22 N·m** stall, **~380 g**. The 6.5 N·m example sits next to the nominal rating. On **4S** the published output speed constant (~6.7 rpm/V) is only about **110 rpm** at 16.8 V. Hip roll does not need the 48 V top speed. Do not hang this mass on the axle. The wheel does not need 7.5 N·m.

## Flexible — springs, not whippy tubes

At **92%** on the **7.5" / 6" wheel** leg, knee poke `d ≈ 2.9"`. Torque `τ = m_on_that_leg · g · d`.

| Mass | One-leg knee | Two-leg knee = spring | Actuator left on one leg |
| ---: | ---: | ---: | ---: |
| 4 kg | 2.9 N·m | 1.5 N·m | 1.5 N·m |
| **6 kg** | **4.4 N·m** | **2.2 N·m** | **2.2 N·m** |
| 8 kg | 5.9 N·m | 2.9 N·m | 2.9 N·m |

A deeper crouch (75% extension, 6 kg) is about **7.4 N·m** on one leg. Size the spring for the two-leg pose (~**2.2 N·m** at 6 kg). The actuator pays the other half on one leg, plus the landing. A linkage that keeps the knee on the weight line drives this toward zero. Prefer that in the 2D set. The roll moment does not shrink when the poke does.

**Tubes.** Example only, not a SKU: 16 mm OD, 12 mm ID, long-fiber modulus ~100 GPa, 7.5" link, 0.30 kg at the end. First bending is on the order of **~90 Hz**. Keep it **above ~40 Hz**.

## Quick — the wheel

Arrest on one wheel, **6 kg**, 6" OD, estimated 0.30 kg tire:

| Lean | Torque to stop the fall |
| --- | ---: |
| 10° | 0.8 N·m |
| 20° | 1.5 N·m |
| 30° | 2.2 N·m |

**Wheel target: about 3 N·m peak**, and about **1–2 N·m** for ordinary corrections. At 3 N·m the contact accelerates at about **6.7 m/s²** and a 30° lean is inside the motor. A bare **0.5 N·m** gimbal arrests about **6°** on this wheel — trim, not a catch. Small outrunner plus a reduction is the honest class. Not a hoverboard hub. Not a GIM8108 at the rim.

On the stair itself the shelf, not the motor, caps the catch: about **±6°** before the tire crosses a nosing. Bigger catches belong on the floor, before the wheel is committed to the step.

Useful axle speed is slow: about **60 rpm** at 0.5 m/s, **190 rpm** at 1.5 m/s, **380 rpm** at 3 m/s. kV match (R31) means that band on 4S.

Fall time at the 92% stance is about **145 ms** to double a small lean. A soft carcass that lets the encoder move before the ground does will eat that. High pressure or a firm elastomer: radial give for the nosing, torsional stiffness for the loop.

The 5" Zantle is slightly quicker and a worse foot. Hard caster rubber, a fork, no motor hub. Use it to learn a hub and to spin a restrained motor. Do not cut the 7.5" tubes to suit it. The leg is drawn at 6".

## Floors and carpet (later)

Balance wheels scrub. A soft black carcass marks hard floors and sinks into carpet, and that softness is delay in the wheel loop. Deal with it later as compound and pressure at this **same 6" × ~1.25"**. Do not pick a knobby. Do not reopen the diameter for the floor.

## What the first 2D sheet should show

Not Blender. One side view, one front view.

1. The **9.5" × 9.5"** slot with the **6"** tire centered and the **1.75"** gaps drawn.
2. **7.5" + 7.5"** tubes, **6"** above the hip, 24" and 10" envelopes boxed. Width of the tire **~1–1.25"**.
3. Hip over the axle at 92% stance. Raised axle 9.5" up and 9.5" forward, inside the next slot (±1.75").
4. Spring noted at ~**2.2 N·m** for a 6 kg two-leg stance. Hip roll ~**6.5 N·m** at 6 kg on an 8.75" track.
5. Motor **at the wheel**, about **3 N·m peak**. Pose actuators high. Inside/outside belt runs only if that class is the one being sketched.

## What this note does not do

- Spend, or turn the 6" lock into a tire order
- Lock a tube SKU, a kV, spokes, or GIM8108
- Change modes, 4S, hip-roll-in-V1, or servo-vs-stepper TBD
- Treat 6 kg as a mass target
- Claim the arrest formula is a measured motor test
