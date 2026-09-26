# Actuator shortlist — what decides it, and what the 2026 numbers say

**2026-09-26.** Steve: "I am not sure about the actuator shortlist. I think it's a good time to decide. What should I consider?" This note is the decision framework plus the candidates checked against Hux's own numbers. **No SKU locked here. No spend.** Steve owns the cart line.

Hux numbers used (settled geometry, 6 kg example, [`leg-geometry.md`](leg-geometry.md), [`stair-climb-dynamics.md`](stair-climb-dynamics.md), [`sim-sandbox.md`](sim-sandbox.md)):

| Axis | Peak | Holding / continuous | Notes |
| --- | ---: | ---: | --- |
| Wheel (×2) | **~3 N·m** | ~1 N·m | Balance actuator: torque bandwidth and low reflected inertia matter more than torque. Encoder mandatory. Packaged at the hub inside / beside a 6 × 1.25" tire. |
| Knee (×2) | ~12 N·m | **~10.6 N·m for ~1 s** standing up over the front wheel; 4.4 N·m at balance stance | The sizing joint. A spring can take the 2.2 N·m two-leg crouch, not the stand-up. |
| Hip swing (×2) | ~4 N·m | ~3 N·m | Position + speed for the step cycle. |
| Hip roll (×2) | **12–13 N·m** through a hop | **8.3 N·m continuous whenever a wheel is up** at the drawn 5.4" hip offset (5.4 N·m at 3.5", 3.1 at 2") — [`one-leg-stance.md`](one-leg-stance.md), same day | The cantilever of body + free leg about the planted hip axis. The 4.3 N·m "poise" was a two-contact stance. **This is now the sizing joint alongside the knee**, and the hip offset is the cheapest lever. |

## 1. The seven things that decide it

1. **Voltage floor and ceiling vs the pack.** Check the actuator's *minimum* input against the pack at **cutoff**, and its *maximum* against the pack **full**. This is the constraint that bit today (section 3).
2. **Torque at the right duty.** Peak numbers are 1–3 s numbers. The knee's 10.6 N·m is a ~1 s hold every ~5.6 s step — that is a **rated-torque-plus-thermal** question, not a peak question. Use rated × ~2 as the honest peak you will get repeatedly.
3. **Reflected inertia and backdrivability.** Ratio² × rotor inertia. A 10:1 QDD is fine on a knee; on a balance wheel it adds inertia the controller has to fight and hides ground contact. Wheels want the lowest ratio that meets 3 N·m. Hip roll wants backdrivable.
4. **Protocol and bus load.** Nearly every candidate is **classic CAN 2.0 at 1 Mbit/s**, not CAN FD. One command + one reply per node per cycle is ~260 bits. **Eight nodes at 1 kHz on one bus does not fit** (~2.1 Mbit/s). Eight nodes at 500 Hz on one bus is ~100% — still no. **Two buses of four at 1 kHz is ~100% each; three buses is comfortable.** This is why the MCU is a Teensy 4.1 (3× CAN) and not a one-CAN Wing board.
5. **Encoder count and homing.** Dual-encoder units (rotor + output) know absolute joint position at power-on. Single-encoder units need a homing routine or a hard stop. For a robot that must stand up from `PARKED` with a verified pose, dual encoder is worth money on the legs; the wheels do not care.
6. **Mass and where it sits.** Eight actuators at 300–400 g is 2.4–3.2 kg — half the 6 kg example. Mass at the hip and knee is tolerable; mass at the wheel raises the sprung ratio and slows the balance loop. Weigh the whole set before choosing, and put it in the body / leg lumps.
7. **Ecosystem you can actually debug.** Open protocol documentation, a Python/C driver you can read, a configurator, spares in stock in the US, and other maker robots running it. A great actuator with a closed tool chain is a bad actuator for a one-person project.

Also: backlash (arc-minutes at the output; matters for the knee under load reversal), thermal path (aluminium housing you can bolt to a heat spreader), connector and cable exit (wire ports, R21), and firmware torque limits you can set from the bus.

## 2. Candidates, as of 2026-09-26

Prices are US retail seen today; specs from vendor tables. **Verify the minimum voltage in the datasheet before buying anything** — store pages omit it.

| Actuator | Rated / peak | Ratio | Mass | Input V | Encoders | Protocol | Price | Hux fit |
| --- | ---: | ---: | ---: | ---: | --- | --- | ---: | --- |
| **RobStride 00** (CyberGear successor) | 5 / 14 N·m | 10:1 | 310 g | **24–60 V** | 2 | CAN 2.0, 1 Mbit, open docs + drivers | ~$160 | Hip swing. Knee only at 2× rated on the hold. **Not hip roll at 5.4" hips** (8.3 N·m continuous > 5 rated). Not the wheel (10:1). |
| **RobStride 01** | 7 / 17 N·m | 7.75:1 | 380 g | **24–48 V** | 1 | same | ~$150–170 | Knee with margin; single encoder = homing. |
| **RobStride 02** | 7 / 17 N·m | 7.75:1 | 380 g | **24–60 V** | 2 | same | ~$180–200 | **Best knee**: 7 rated covers the 10.6 hold at 1.5×, dual encoder. **Hip roll only if the hip offset comes in to ≤ 3.5"** (5.4 N·m hold, ~8 peak); at 5.4" the 8.3 N·m hold is above rated. |
| **RobStride 05** | 1.8 / 5.5 N·m | 7.75:1 | **191 g** | **15–60 V** | 2 | same | ~$100 | **Wheel candidate**: 5.5 peak covers 3 N·m; lightest; low ratio; and it runs on 6S. Also honest for hip swing (3 N·m rated needed — marginal). |
| RobStride 06 | 11 / 36 N·m | 9:1 | 621 g | 15–60 V | 2 | same | ~$170 | **Hip roll at the drawn 5.4" offset**: 11 rated covers the 8.3 hold, 36 peak covers 13. Costs +240 g per hip, high on the body. Overkill everywhere else. |
| **CubeMars AK60-6 V3** | 3 / 9 N·m | 6:1 | 380 g | 24 V or 48 V class (min not on store page — manual) | 1 (21-bit) | MIT CAN 2.0, 1 Mbit | **$230–300** | Hip swing / hip roll class; too little rated torque for the knee hold; pricier than RobStride for less. |
| MyActuator RMD-X6 V3 8:1 | 4.5 / 8 N·m | 8:1 | ~400 g | 24–48 V class | 1 | CAN 2.0 / RS485 | **~$420** | Out on price/torque. |
| Xiaomi CyberGear | 4 / 12 N·m | 7.75:1 | 317 g | 16–28 V | 1 | CAN 2.0 | — | **EOL** at retailers. Was the 6S-friendly option; RobStride 00 replaced it at a higher voltage floor. |
| GIM8108-8 + separate CAN driver | ~7.5 N·m nominal | 8:1 | ~480 g + driver | 24–48 V class | driver-dependent | driver-dependent | ~$85 + driver | The 2026-09-21 yardstick. Motor + third-party driver + encoder integration is a project in itself; RobStride is the same class already integrated. |
| Gimbal BLDC + SimpleFOC board + encoder (in-wheel) | ~0.5 N·m bare | 1:1 | ~150 g | any | 1 | UART / CAN (board-dependent) | ~$60 | Bench spin only. Cannot hit 3 N·m direct-drive at 6"; needs a reduction, at which point RS05 is simpler. |

## 3. The voltage finding

**The RobStride joints that fit Hux (00 / 01 / 02) specify a 24 V minimum.** A 6S pack is 25.2 V full, 22.2 V nominal, ~19.8 V at cutoff — below the floor for most of the discharge. Undervoltage protection will trip or the current loop will run out of headroom exactly when a knee is holding 10 N·m. RS05 / 03 / 04 / 06 are 15 V-minimum parts and are fine on 6S, but 05 is too small for the knee and 06 is too big.

Options:

| Bus | Full / nominal / cutoff | Who works | Cost |
| --- | --- | --- | --- |
| **6S** | 25.2 / 22.2 / 19.8 V | RS05 (wheels), RS06 (heavy knee), CubeMars *if* its manual allows <20 V (unverified) | Cheapest packs; **locks out RS00/01/02** |
| 7S | 29.4 / 25.9 / 23.1 V | RS00/01/02 until the last ~15% of the pack | Odd cell count; few packs; still dips under 24 V |
| **8S** | **33.6 / 29.6 / 26.4 V** | **Every candidate above**, through the whole discharge (RS01's 48 V ceiling is far away) | Common drone size; regulators must take 36 V; same energy at ~75% of the current of 6S |

**Recommendation: 8S.** Then the pack follows the runtime, not the voltage. **Steve, same day: "8S yes."**

## 4. Runtime and pack size

Steve: the 6S 5200 was picked "somewhat randomly"; a smaller pack is fine; he wants a reasonable running time.

Rough budget for Hux balancing and driving (no measurement yet): 8 actuators quiescent ~12 W; Teensy + Pi 5 ~10 W; wheel balance work 10–20 W; loaded joints holding pose 10–30 W (QDD holding is I²R) → **40–80 W typical**, stair cycles peaking well above. So:

| Pack | Energy | ~Mass | Typical runtime at 40–80 W |
| --- | ---: | ---: | ---: |
| 6S 5200 mAh (the random pick) | 115 Wh | ~750 g | 1.4–2.9 h — more than "reasonable", and the wrong voltage |
| **8S 3300 mAh** | **98 Wh** | ~700 g | **1.2–2.4 h** |
| 8S 2700 mAh | 80 Wh | ~560 g | 1.0–2.0 h |
| 8S 2200 mAh | 65 Wh | ~470 g | 0.8–1.6 h |

**Decided: one 8S 3300 mAh, 50–60C, XT90 on the pack, XT90-S anti-spark on the harness** (in [`../bom.md`](../bom.md)). 1–2 h at the budget, ~700 g, common drone SKU. Measure real draw at P2 and re-size; 2700 mAh if it will not package.

## 5. A shortlist that closes

| Axis | First choice | Why | Alt |
| --- | --- | --- | --- |
| Knee ×2 | **RobStride 02** | 7 N·m rated covers the 10.6 N·m hold at 1.5×; dual encoder for a verified `PARKED` pose; 380 g | RobStride 00 (cheaper, lighter, 2× on the hold) |
| Hip roll ×2 | **RobStride 02, with the hip roll axes at ≤ 3.5" from the centreline** (recommended). Hold 5.4 N·m vs 7 rated; hop peak ~8.5 vs 17; shift 17° with 17° of roll travel left. | The hold is ≈ 60 N × hip offset, continuous whenever a wheel is up ([`one-leg-stance.md`](one-leg-stance.md)). 3.5" is the head's half-width, so the roll actuators sit at the head's outer faces — a packaging question for the 2D layout, not a physics one. Same part as the knee: one spare covers four joints. | If the layout cannot get under ~4" (6.2 N·m hold): **RobStride 06** (11 rated, +240 g each, high on the body). RS00 is **out** for roll at any offset over ~2.5". |
| Hip swing ×2 | **RobStride 00** | 3–4 N·m is inside rated; same part as roll = one spare covers both | RS05 if mass is tight (marginal at 3 N·m rated needed) |
| Wheel ×2 | **RobStride 05** | 5.5 peak covers 3 N·m; lightest at 191 g; lowest ratio in the family; 15 V floor | Direct-drive gimbal + SimpleFOC only for the bench |
| Bus | **8S**, 3 CAN buses on a Teensy 4.1: A = wheels + roll (4 nodes, the balance loop), B = knees + swing (4 nodes), C spare / bench | Eight classic-CAN nodes need two buses minimum at 1 kHz | — |

Set of eight, hips inboard (≤ 3.5"): 4× RS02 (knee + roll) + 2× RS00 (swing) + 2× RS05 (wheel) ≈ **~$1,250** and **~2.2 kg**. Hips as drawn (5.4"): 2× RS02 + 2× RS06 + 2× RS00 + 2× RS05 ≈ **~$1,250** and **~2.7 kg**. Either is the actuator line in [`../bom.md`](../bom.md) as a **class estimate**, not an order. One protocol, one vendor, one spare policy. **The hip offset decision should come first** — it is cheaper to move a bearing 2" on paper than to carry 480 g of extra actuator up high.

**Recommendation to Steve (2026-09-26): 4× RS02 + 2× RS00 + 2× RS05, hips at ≤ 3.5".** Four of one part (knee + roll) means one spare and one set of gains covers half the robot; RS02's dual encoder gives an absolute pose on the four joints that matter for `PARKED`; RS05 is the only part in the family light and low-ratio enough for a balance wheel. ~$1,250, ~2.2 kg. **Buy one RS02 first** — it is the part that has to hold both the 10.6 N·m knee stand-up and the 5.4 N·m roll cantilever, so it is the one to put on the Teensy, hold at 7 N·m for 30 s with a thermocouple on the case, and read the encoder back at 1 kHz before the other seven are ordered.

**Before ordering:** settle the hip roll offset in the 2D layout (NOTES open call 6; target ≤ 3.5"). Then download the RobStride 02 / 00 / 05 datasheets and confirm (a) the 24 V floor is a hard undervoltage trip, (b) backlash at the output, (c) the CAN protocol is the documented open one at 1 Mbit/s, (d) US stock and return terms. Buy **one RS00 first** and run it on the Teensy: torque mode, encoder readback, thermal at 5 N·m held for 10 s. Then the set.

**What this does not settle:** in-wheel packaging of an RS05 behind a 6 × 1.25" tire on a shop-turned hub (mechanical, [`../mechanical.md`](../mechanical.md)); whether springs still take the crouch (yes, cheap, keep them); the exact pack SKU.

## Sources

- RobStride product information (spec tables for RS00–RS06) — https://github.com/RobStride/Product_Information
- RobStride 00 at Robotics Center ($160, US stock) — https://www.roboticscenter.ai/store/product/robstride-00
- RobStride 02 overview (48 V nominal, 24–60 V range) — https://openelab.com/blogs/learn/what-is-robstride02-dual-encoder-qdd-actuator-humanoid-robots
- CubeMars AK60-6 V3.0 (3 / 9 N·m, 380 g, 24/48 V, $230–300) — https://www.cubemars.com/product/ak60-6-v3-0-kv80-robotic-actuator.html and https://openelab.io/products/cubemars-ak60-v3-actuator-motor
- MyActuator RMD-X6 V3 8:1 ($422) — https://www.robotshop.com/products/myactuator-rmd-x6-v3-can-bus-18-mc-x-300-o-brushless-servo-driver
- Xiaomi CyberGear (EOL) — https://openelab.io/products/xiaomi-cybergear-micromotor-intelligent-motor
