# Knee: actuator at the joint, actuator at the hip through a linkage, or no knee (compound-linkage leg)

Steve **2026-09-26**: "I wonder if we should get rid of the knee actuator and use a compound linkage … same effect. That is what stepbysteprobotics did and AgileX does not appear to have a knee actuator. Consider it while we're early."

**Status: decided 2026-09-27 (R39) — knee RS02 at the knee for V1, spring in scope, hip-driven linkage parked as V2, no five-bar.** Below is the trade as it was worked. Nothing here lifts the temporary actuator lock (`decisions.md`, 2026-09-26). Written before the first 2D sheet, which is where this gets settled (R23).

## The two references

| | StepByStep Robotics — [Try Making Wheeled-Legs Balancing Bot](https://www.youtube.com/watch?v=iCJNfWUn47Q) (May 2026) | AgileX — [T-REX launch](https://www.youtube.com/watch?v=mQfc8o9RyxU) / [T-REX 2.0](https://www.roboticgizmos.com/trex-2-0-wheeled-legged-robot/) |
| --- | --- | --- |
| Leg | One **Dynamixel XM540-W150** per leg driving a **four-bar** synthesised in MotionGen (the video's tagged product and the comments). Wheel axle follows one fixed coupler curve: **1 planar DoF per leg = height only.** Cites Ascento, Diablo and T-REX as its references. | Parallel leg with the pose motors on the body and no actuator at the knee (launch footage; AgileX publishes no linkage spec — **unverified**, the video would not play in the automation tab). Published numbers: jump ≤ **100 mm**, 1 kg payload, 1 m/s loaded, 20° slope, "single-leg climbing" of a curb. |
| Task it was built for | Tabletop balance + posture on a flat floor | Balance, hop, curb, slopes — a Diablo / Tencent-Ollie-class machine |
| Stair one wheel at a time | No | No |

Neither reference does Hux's north star. Their leg is right for their task; "same effect" does not carry to a 9.5" step.

## What "remove the knee actuator" can mean

1. **Four-bar leg, one motor (StepByStep, Ascento).** Removes a DoF, not just a motor. The axle traces one curve; fore-aft foot placement is not independent of height. The stair step is a **(9.5" forward, 9.5" up)** placement of the raised wheel while the planted wheel stays inside its ±1.75" slot — that is two independent planar coordinates per leg. A 1-DoF leg cannot do it; it is a balance-and-hop leg. **Dead for the north star.** This is the Hattori lesson already in `requirements.md` ("serial / linkage knees beat 'knees both sides' parallel for stairs") and `vision.md`.
2. **Five-bar leg, two motors on the body (Diablo, T-REX-class, RoboMaster balance legs).** Keeps 2 DoF. **Does not remove an actuator — it relocates the knee motor to the hip.** Same count (hip swing + knee-equivalent + wheel + hip roll = 4 per leg), same BOM line.
3. **Serial leg, knee motor at the hip driving the knee through a linkage** (parallelogram / pushrod four-bar; Cheetah / Hattori style; the belt version is already R32–R33). Kinematics unchanged; only the transmission moves. Also does not remove an actuator.

## Planar check on the settled draw (7.5" + 7.5", hip 13.8" over the planted axle at 92%)

Five-bar with equal 7.5" links on both chains and the two hip pivots 2.5" apart fore-aft; serial for comparison. Foot position is relative to the hip, x forward, y up, inches. (`tools/living-drawings/studies/fivebar-check.py`; a real five-bar would be tuned, but the shape of the result is structural.)

| Pose | Serial knee | Five-bar elbows (out / crossed) | What it means |
| --- | --- | --- | --- |
| Raised foot on the next tread, (9.5, −4.3) | (2.5, −7.1) | front (8.1, **+3.1**) rear (2.4, −6.6) / front (2.7, −7.4) rear (5.9, **+2.3**) | One elbow rises **above the hip axis** into the body volume, 6–8" ahead of it. |
| Shove, rear leg near straight, (−7, −13) | (−4.7, −5.9) | front chain **cannot reach** (15.4" > 15") | The throw window is set by the rear leg's reach (`stair-climb-dynamics.md`: 2.7" of "behind"). Split pivots shorten the diagonal reach and close the window further. |
| Front leg standing up on the shelf, (1, −9) | (−5.4, −5.2) | front (**7.1**, −4.7) / rear (5.6, −3.1) | An elbow 6" ahead of the wheel — into the next riser. Hattori's parallel-leg clearance failure, exactly. |

Add the packaging: two links converge on the axle where the RS05 (44 mm) is already wider than the 1.25" tire; two 78.5 mm RS02 housings must live on the roll frame at the hip, where the roll axes have to sit ≤ 3" from the centreline inside a 7" head with ~57 mm of side room. **Option 2 is worse than serial on every axis that matters for the stair.** Not recommended.

## What is worth taking from the references: motors on the hip (option 3)

Move the knee RS02 (0.39 kg) up to the hip carriage and drive the knee through a linkage along the upper tube.

**Wins**

- No motor and no motor cable at the knee (R21). Only the RS05 lead runs the lower leg.
- Swing-leg inertia about the hip drops roughly **15–20 %** (0.39 kg at 7.5" out of a wheel-dominated 0.08 kg·m²). Modest, not decisive.
- The knee gravity spring (R7, ~2.2 N·m two-leg) packages at the hip beside the motor instead of across the knee.
- A **non-parallelogram four-bar** can be synthesised with a torque advantage at the stand-up pose: the 13.6 N·m one-leg hold (1.9 × RS02 rated) at 1.3–1.5:1 is 9–10 N·m at the motor, at the cost of knee speed in that region — which is the slow part of the cycle anyway. This is the same MotionGen exercise StepByStep did, applied to a transmission instead of the whole leg. It is the strongest reason to do it.

**Costs**

- A pushrod / coupler runs the length of the upper tube and competes with the wire path and the belt option for the tube faces (R21 / R33).
- Two extra joint pairs, their backlash, and a link buckling check on the 13.6 N·m hold; the knee loop stiffness is now the linkage's, not the actuator's.
- The hip carriage carries RS00 (swing) + RS02 (knee drive) + the roll RS02 behind the yoke. The ≤ 3" roll-axis requirement already makes the hip the tightest volume on the robot; this adds a 78.5 mm cube to it. Has to be drawn before it is believed.
- CAD → URDF → firmware: a closed loop in the leg is a full-update item (`stompy-sim2real.md`).

## Recommendation

- Keep **2 planar DoF per leg** (hip swing + knee). Not negotiable for the stair.
- Do **not** go five-bar.
- Draw **both** serial layouts on the first 2D sheet: knee RS02 at the knee (baseline) and knee RS02 at the hip through a linkage, with the hip carriage at ≤ 3" roll offset and the pushrod / wire / belt faces assigned. Pick on the drawing, then re-run `kin.js` with the knee lump moved into the hip lump (`actuators.js`, one line) to see what the throw window and the one-leg roll hold do.
- The actuator lock stands either way: same four RS02, two RS00, two RS05.

## Addendum 2026-09-27 — T-REX 2.0 is a five-bar with two hip motors; no five-bar in the envelope reaches the shove

Steve: T-REX 2.0 is very close to what he wants (plus stair reach and hip roll); he prefers the leg in the [MyBotShop listing](https://www.mybotshop.de/AgileX-T-REX-20_3) over the newer split-leg render at [MGSL](https://mgsl.in/products/agilex-t-rex-2-0); it ships with an Orin Nano.

**T-REX 2.0 spec (MyBotShop / MGSL):** 5.8 kg; 269 × 341 × 215 mm min / 242 × 341 × 363 mm max (**148 mm of height travel**); 125 mm wheels; track 291 mm; **"direct-drive motor ×2, joint motor ×4"** — two pose motors per leg, both on the body; jump 100 mm; obstacle 50 mm; slope 20°; 1 m/s; 1 kg payload; 21.6 V 5 Ah, 2 h; no roll DoF; MGSL configuration adds Mid-360 LiDAR + Orbbec depth camera + **Orin Nano** (SLAM / vision, not the balance loop); €6,545.

So T-REX has the knee-equivalent actuator; it lives at the hip and drives a **five-bar** (both product photos: two cranks from the body meeting at an apex above / ahead of the wheel — the MyBotShop unit converges the cranks into a wedge, the MGSL render opens the same linkage into a split frame). The look Steve likes is *motors in the body, a clean two-link leg*; that look is also what a serial leg with a hip-driven knee gives.

**Scale:** T-REX's whole stroke (148 mm) is 60 % of one Hux riser (241 mm); its obstacle spec (50 mm) is a fifth of it. "Higher step capability" is not a knob on that design — it is legs ~2× longer relative to the body, which is exactly the regime where the elbow and reach problems above appear.

**Search (`tools/living-drawings/studies/fivebar-check.py`):** every five-bar with hip pivots 1.5–4.5" apart and crank / coupler lengths 4–10" per chain (chains ≤ 15.5" so the leg fits the 24" envelope with the 6" wheel), both elbow-side choices, tested against the four poses (stance, raised foot, shelf stand-up, shove) with the elbows kept below the hip axis and not ahead of the wheel at the shelf poses: **zero pass.** Drop the shove pose and 120 pass; drop any other pose and still zero pass with the shove kept. **The shove — the rear leg nearly straight, foot 7" back and 13" down — is a 15" diagonal reach that a single-pivot serial leg makes and a split-pivot five-bar cannot, inside 24".** The stair throw is already reach-limited on the serial leg (2.7" of mass behind the front contact); a five-bar closes the window entirely unless the robot grows past 24" or the climb stops relying on the shove.

**Hip roll on a five-bar:** the whole two-motor carriage rolls — more roll inertia at a hip that already has to sit ≤ 3" from the centreline.

**Orin Nano:** confirms the P5 perception slot in the head (`mechanical.md`); changes nothing about V1 (Pi 5 in the slot, balance on the CAN MCU). T-REX runs SLAM on it, not balance.

**Position unchanged:** serial hip swing + knee, knee RS02 at the hip through a linkage as the layout to draw first if the T-REX look is the target.
