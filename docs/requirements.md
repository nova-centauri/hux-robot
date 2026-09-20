# Hux requirements

Draft from Steve, 2026-09-20. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), [`mechanical.md`](mechanical.md), and [`software.md`](software.md).

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) and similar platforms.

## Hard requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R1 | Balance on **two** wheeled legs | Baseline stance / teleop |
| R2 | Balance on **one** wheeled leg | Gate before stair cycle. Full loop is R16–R18 (`LEFT_ONLY` / `RIGHT_ONLY`). |
| R3 | Step **up or down ~9.5"** | Nominal residential riser target; design leg stroke/clearance around this |
| R4 | Wi‑Fi telemetry | Companion or bridge |
| R5 | RC control via **TBS Nano RX** | Bind to FC (or dedicated link into FC) |
| R6 | **Brushless** driven wheels | ESC + BLDC per wheel |
| R7 | Legs via **strong linkages + springs** | Gravity compensation / energy return; prefer linkage over pure serial belts for V1 simplicity |
| R8 | Local compute for **pathfinding inference** | Needs cameras; not on the FC |
| R9 | Cameras | At least one stream for teleop; stereo/depth later for stairs |
| R15 | V1 overall width **~10"** | Hypothesis (Steve 2026-09-20). Outside-to-outside envelope for body + two wheel-legs. Measure a real stance before CAD lock. |
| R16 | **Hip roll** DOF so the body can shift CoG over the planted wheel | Needed for one-leg balance (`LEFT_ONLY` / `RIGHT_ONLY`). Distinct from hip *pitch* / knee rotation (those swing or lift a leg). **TBD if mandatory for V1** — if V1 skips hip roll, one-leg modes stay a later gate. |
| R17 | One-leg balance is a **full loop**: hip-roll **and** planted-wheel fore/aft | (a) hip roll keeps weight over the planted wheel; (b) that wheel drives forward/back to keep the contact under the CoG (classic inverted-pendulum / Segway-style pitch). Not hip-roll alone, not wheel-only. Spec: [`software.md`](software.md). |
| R18 | **Reuse existing control systems** — no novel V1 balance stack | Research pointers, **not a lock**. **TBD which we adopt.** Explicit non-goal: writing a Hux-original balance controller from scratch for V1. See [`software.md`](software.md) and [`research/`](research/). |

IDs **R10–R14** are unused here so concurrent 2026-09-20 hardware and manual-mode notes can take them without renumbering this packet.

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- V1 width lean is **~10"** overall (hypothesis). Hip **roll** at the hips is the likely CoG-shift DOF for one-leg; TBD if V1 must have it.
- One-leg (`LEFT_ONLY` / `RIGHT_ONLY`) is two coupled jobs: roll the hips to put CoG over the planted wheel, **and** drive that wheel fore/aft so the contact stays under the CoG.
- **Reuse, do not reinvent** the balance stack (R18). Study existing PID+IMU / attitude / torque patterns; pick one later. Do not invent a Hux-original controller to look busy.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- No spend until Steve approves purchases. Prefer parts he already owns.

## Candidate hardware (on hand)

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD)

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one printable wheel-leg with linkage+spring stub sized toward 9.5" step, before full stair gait software. Overall width hypothesis **~10"**. Hip roll **TBD if mandatory for V1**.

Do not buy anything for this list. Do not lock the FC in this scaffold.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Size + print first wheel-leg for ~9.5" step (FC stays TBD).
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance (`LEFT_ONLY` / `RIGHT_ONLY`) — hip-roll + planted-wheel pitch loop (R17), using an **existing** control pattern (R18), not a novel stack.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
