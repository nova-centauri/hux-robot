# Hux requirements

Draft from Steve, 2026-09-20, plus scale/structure 2026-09-21. Source of truth: this GitHub repo (`nova-centauri/hux-robot`). Architecture intent is also folded into [`vision.md`](vision.md), [`electronics.md`](electronics.md), and [`mechanical.md`](mechanical.md).

## Goal

Wheeled biped that can climb and descend stairs by: lift one wheeled leg → balance on the planted leg → rotate/place the raised wheel onto the next tread → plant → repeat.

Inspiration: [Alex Hattori — STRIDE wheeled biped V2](https://www.alex-hattori.com/blog/wheeled-biped-v2) and similar platforms.

## Hard requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R1 | Balance on **two** wheeled legs | Baseline stance / teleop |
| R2 | Balance on **one** wheeled leg | Gate before stair cycle |
| R3 | Step **up or down ~9.5"** | Nominal residential riser target; design leg stroke/clearance around this |
| R4 | Wi‑Fi telemetry | Companion or bridge |
| R5 | RC control via **TBS Nano RX** | Bind to FC (or dedicated link into FC) |
| R6 | **Brushless** driven wheels | ESC + BLDC per wheel |
| R7 | Legs via **strong linkages + springs** | Gravity compensation / energy return; prefer linkage over pure serial belts for V1 simplicity |
| R8 | Local compute for **pathfinding inference** | Needs cameras; not on the FC |
| R9 | Cameras | At least one stream for teleop; stereo/depth later for stairs |
| R34 | Primary **upper + lower leg spars** are **carbon fiber tubes** | COTS structure (R19 style when that lands). Printed / machined **fittings at the ends** (hubs, belt mounts, joint flanges). Do not print or mill the spar. Tube OD/wall TBD. No SKU. Spec: [`mechanical.md`](mechanical.md). |
| R35 | V1 envelope up to **~24" tall at full extension** | Steve 2026-09-21. Primary scale change is **height**. Still must reach a **~9.5"** riser **with margin** (R3). **5"** wheels already on order ([`parts-on-hand.md`](parts-on-hand.md) when that lands). Width stays **~10"** (R15 when that lands) unless Steve changes it. |

IDs **R10–R23** and **R25–R33** are unused here so concurrent 2026-09-20 hardware, modes, hip-roll, fabrication (R19), wheel-drive, actuators, and layout notes can take them without renumbering this packet. **R24** is owned here as **soft** (mass blown).

## Soft requirements

| ID | Requirement | Notes |
| --- | --- | --- |
| R24 | V1 mass **aspirational 4–5 lb** / **under 6 lb** — **historical soft preference only** | Steve 2026-09-21: budget is **explicitly blown / soft**. Capability and packaging over the old number. **Not a gate.** If a concurrent note treated under 6 lb as a hard ceiling, this update **supersedes that hardness** — keep the ID, drop the kill-switch. Sketch: [`mechanical.md`](mechanical.md). |

## Soft / architecture intent

- Split brain: FC = IMU + attitude + wheel (and likely leg) actuation; Pi = vision + inference; ESP32 optional Wi‑Fi/telemetry bridge.
- V1 scale: **~24" tall at full extension** (R35), **~10" wide** (unchanged). Height is the new primary scale change. Leg geometry still owns the **~9.5"** step (R3) with margin.
- Structure: **carbon tubes** for the long bits of upper and lower leg (R34). Shop fittings at the ends — print / mill / lathe; see [`capabilities.md`](capabilities.md) when that lands. Inventory: [`parts-on-hand.md`](parts-on-hand.md).
- Longer tubes → **longer belt runs** if a belt is the joint reducer. Joint actuators sit at **hip / knee** with tube between. Class is **GIM8108-class or servo/stepper TBD** (R12 when that lands — do not lock). No SKU.
- Higher CoG: slower inverted-pendulum fall (helps) and more inertia / longer disturbance arms (hurts). Documented on [`mechanical.md`](mechanical.md) — not a reason to shrink back to a compact printed spar.
- Mass is **soft**. Old 4–5 lb / under 6 lb numbers stay as a preference, not a kill-switch.
- Hattori V2 lessons to steal: extra leg DOF helps stairs/fall recovery; larger wheels help terrain; serial/linkage knees beat “knees both sides” parallel for stairs; springs for gravity assist if actuators are small.
- No **new** spend until Steve approves purchases. Prefer parts he already owns. 5" wheels already ordered — document only.

## Candidate hardware (on hand)

Inventory (owned / ordered, reserved TBD): [`parts-on-hand.md`](parts-on-hand.md) when that packet lands. Shop tools (not parts): [`capabilities.md`](capabilities.md).

- FC: F722 Wing, F765 Wing, F722 drone FC, Mamba F405
- Compute: ESP32, Raspberry Pi
- RX: TBS Nano RX
- Motors: brushless for wheels (exact models TBD). 5" rubber already ordered — that is a wheel, not a motor.
- Structure: carbon-tube spars **class** (R34). No tube SKU. End fittings are customs.

## Recommended default (proposal)

- **FC:** **TBD** (Steve 2026-09-20). Candidates remain F765 Wing / F722 Wing / F722 drone / Mamba F405. Prefer a Wing board when we lock; do not block mechanical work on this.
- **Companion:** Raspberry Pi for cameras + pathfinding inference.
- **Wi‑Fi:** Pi first; ESP32 if we want a thin telemetry bridge off the Pi.
- **V1 mechanical target:** one wheel-leg — carbon-tube spars + printed/machined end fittings + linkage/spring stub — sized toward a 9.5" step, inside a **~24" tall / ~10" wide** envelope, before full stair gait software.
- **Mass:** soft. 4–5 lb / under 6 lb is historical preference, not a gate.
- **Leg joints:** GIM8108-class **or** servo/stepper TBD at hip/knee. No SKU.

Do not buy anything for this list. Wheels already ordered stay on [`parts-on-hand.md`](parts-on-hand.md) only. Do not lock the FC, a tube, or a joint SKU in this scaffold.

## Milestone order

Tracked in [`../NOTES.md`](../NOTES.md). Summary:

1. Confirm SoT URL (`nova-centauri/hux-robot`) — this repo.
2. Size + fit first wheel-leg (carbon-tube spars, end fittings) for ~9.5" step inside the ~24" envelope (FC stays TBD).
3. Blink LED → restrained wheel spin once an FC is on the bench (not on carpet).
4. Two-leg balance teleop (TBS + Wi‑Fi telem).
5. One-leg balance.
6. Open-loop step-up toward 9.5" riser fixture.
7. Camera stream → local pathfinding later.
8. Lock FC into [`electronics.md`](electronics.md) when ready.
