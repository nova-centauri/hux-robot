# SpdrBot — Isaac Sim / Isaac Lab (pipeline, not a spider)

Steve 2026-09-24: more research — watch [I Tried To Build a Robot Like Boston Dynamics With Isaac Sim](https://www.youtube.com/watch?v=YDzHL2JSCHc) and cite [Indystrycc/SpdrBot](https://github.com/Indystrycc/SpdrBot). Fusion → URDF → USD; Isaac Lab RL; then a **hand-tuned gait** after the SKRL → Isaac Sim wall.

SpdrBot is a **4-leg spider** (12 hobby servos). Hux is a **wheeled biped**. Morphology does **not** transfer. The steal is the **CAD → sim → validate → hardware** pipeline, and the ways that pipeline failed. **Not a Hux stack, BOM, or CAD source.** No spend. FC stays **TBD**. Keep **reuse simple balance** (R18). Phase E (twin / dojo) stays a **horizon**.

Index: [`inspiration.md`](inspiration.md). Study plan: [`study-plan.md`](study-plan.md) (Phase E). Stompy CAD/reality: [`stompy-sim2real.md`](stompy-sim2real.md). Diablo LQR-before-RL: [`diablo.md`](diablo.md). Decisions: [`../decisions.md`](../decisions.md). Twin / dojo phasing: [`../software.md`](../software.md).

## What it is

Maker-scale **four-legged walker**. Not wheeled. Not a biped. Designed in Fusion 360 around a **Jetson Nano** bay; 3-DoF per leg (**12 servos**), PETG prints, Open Robotic Platform (ORP) attach points. Hardware in the clip: **Raspberry Pi Pico + 12 hobby servos** on a 16-channel servo board (12 used). Author rates the servos **~25 kg·cm / ~2.5 N·m**. Shop files (STL / 3MF / STEP / Fusion + MicroPython) are a **paid pack** on [indystry.cc](https://indystry.cc/product/3d-printable-4-legged-spider-robot/). GitHub is the **sim** tree (URDF, USD, Isaac Lab direct project, joint-test script).

| Piece (theirs) | Hux take |
| --- | --- |
| **4 legs, 12 hobby servos**, spider gait | **Not Hux.** Hux is two wheeled legs. Do not grow a third / fourth leg or a crawl gait. |
| Fusion 360 → URDF plugin → Isaac Sim USD → Isaac Lab | Steal the **export chain**. Not Fusion, not Isaac, not their meshes. |
| Isaac Sim (physics stage) + Isaac Lab (parallel RL) | Existence proof of a GPU trainer. **Not a V1 job.** No Isaac lock. |
| Designed for **Jetson Nano**; clip uses **Pico + servo board** | **Not a Hux FC or companion.** FC stays **TBD**. Pico / PCA9685-class boards are *theirs*. |
| **RTX 4090** for thousands of parallel envs (NVIDIA-sponsored clip) | Data point that Isaac Lab wants a serious GPU. **Do not buy a 4090 for V1.** |
| Paid indystry.cc pack + GitHub sim assets | Study the public tree in place. **Do not buy the pack.** |

**Do not** vendor the URDF / USD / Isaac Lab project, copy the Pico + hobby-servo stack, or treat a spider as a wheeled-biped shortcut.

## Pipeline he actually used

Spoken in the clip, matching the GitHub layout (`spyderbot_minimal_URDF/`, `spdr.usd` / `spdr_stage.usd`, `spdrbot3_direct_project/`, `spyderbot_test.py`).

1. **Fusion — simplify first.** One component must be named **`base_link`**. **No nested components** (bodies only inside a component). Merge bodies to cut joint / body count so Isaac Lab stays cheap.
2. **Fusion URDF plugin** (free, GitHub) → write the URDF.
3. **Isaac Sim import.** Movable base (not a static arm). Ground plane. Physics inspector to drive joints. Tune stiffness / damping / max force. **Save the stage as USD.**
4. **Isaac Lab RL.** Externally managed **direct** project. Hundreds / thousands of robots; rewards + observations. Policies in the clip: ~5–60 minutes, “usually ~20 minutes” on the 4090.
5. **Validation wall (SKRL → Isaac Sim).** A trained policy is **not** a robot file. He could not replay the **SKRL** policy in Isaac Sim (RSL-RL has examples; SKRL did not, as of the clip). Four-plus days, Discord, still stuck.
6. **Fallback: hand-tuned gait in Sim, then real.** Text-file joint targets in Isaac Sim (`spyderbot_test.py` style). When the motion looked honest, copy it onto the Pico. That is how the robot finally walked the “here to here” goal — **not** the RL policy.

**Hux rewrite:** Phase E, if Steve opens it, is still **CAD → exported model → firmware zeros = the same robot**. Stompy already said a foot change forces a full update ([stompy-sim2real.md](stompy-sim2real.md)). SpdrBot adds the USD / Isaac step **and** the warning that **trainer → viewer is its own integration**. Do not assume a `.pt` drops onto the robot. Do **not** stand this chain up to skip `TWO_WHEEL` or R18.

## RL then fell back to hand gait — why Hux cares

He limited **observations to sensors the real robot has**. Sim can give body velocity, privileged contacts, god-mode state. The Pico spider cannot. Early policies sat, collapsed, or depended on lucky initial conditions.

Then the robots **reward-hacked**: they maximized score by becoming a **two-leg dinosaur** (head + tail as outriggers). Legal in Sim. Useless on hardware.

He still wanted the policy on the machine. **Isaac Lab trains; Isaac Sim is where you must validate before hardware.** That hop failed for SKRL. So he wrote a gait by hand in Sim and ported the joint script.

That is the same **order** as Diablo / Tazer / Stompy: **interpretable loop before a learned one** ([diablo.md](diablo.md), [tazer-lessons.md](tazer-lessons.md)). Hux V1 already picked the interpretable side — **R18**, IMU → PID → wheel torque. SpdrBot is what happens when you invert that order on a machine with almost no sensors.

## Hardware notes that transfer as warnings

- **Mid / zero before assembly.** Servos were driven to **mid-point** with a cheap tester **before** screws went in. Same idea as Stompy’s CAD home / fixture zero. Assemble off-zero and the URDF pose is a different robot.
- **Power delivery, not nameplate torque.** 25 kg·cm looked enough on paper. Cheap long leads **voltage-dropped**; the robot “had no torque.” Short, heavier cable fixed it. Hux already wants a **real 4S bus + step-down**, not a logic PCB as the power plane ([tazer-lessons.md](tazer-lessons.md)).
- **Friction hacks can hurt.** Printed **TPU socks** for grip made the spider **less** stable. He took them off. Hux already rejected printed TPU treads; do not “help” contact with a soft sock on a 6" rubber tire either.
- **Test one limb first.** Pico script moved **one leg** (three servos) before all twelve. Hux rhyme: restrained **one wheel**, then `TWO_WHEEL` — not a twelve-axis first move.
- **Validate in Sim before you break hardware.** After the voltage-drop scare he stopped slider-driving the real spider and authored motion in Isaac Sim. Steal the *habit* for later geometry / gait scripts. Do not use it as a reason to skip a real `TWO_WHEEL` loop.

## Hux steal table (Phase E / digital-twin horizon)

Rewrite in Hux terms. **Horizon only.** Do not start this to skip Phases A–D, the four modes, or R18.

| Steal | What SpdrBot showed | Hux application |
| --- | --- | --- |
| **Observation parity with real sensors** | He refused sim-only velocity / privileged state because the Pico could not see it | When a twin exists: the policy / script observes **what Hux will have** (IMU, wheel encoders, later joint pose). Do not train on god-mode body twist and hope the FC invents it. |
| **CAD → URDF → USD lockstep** | Fusion flatten (`base_link`, no nests) → URDF → Isaac Sim USD → Lab asset. A messy CAD does not import. | Same lockstep Stompy named, plus an explicit USD / trainer asset. A linkage or **6"** wheel change is CAD + export + twin + firmware zeros. Living-drawings Rapier is **not** this twin ([sim-sandbox.md](sim-sandbox.md)). |
| **Reward-hacking risk** | Dinosaur gait scored; would not survive hardware | If a dojo ever exists: watch for Sim-only cheats (phantom contacts, two-wheel “wings,” friction gifts). Prefer rewards that a real `LEFT_ONLY` plant can also earn. |
| **Validate in Sim before hardware** | Trainer → Isaac Sim replay was the intended gate. SKRL never cleared it. | A later policy or open-loop step script gets a **viewer / twin replay** before the boom comes off. Do not treat “it trained” as “it runs.” |
| **Mid / zero before assembly** | Servos centered, then assembled | Home / fixture pose is the CAD pose (Stompy). Zero **before** the first wheel-leg is buttoned up. |
| **Power delivery** | Nameplate N·m lost in skinny leads | Size the **harness**, not just the actuator class. 4S + step-down still needs fat enough wheel / pose leads. |
| **Friction hacks can hurt** | TPU socks worsened stability | Do not add TPU, foam, or “more µ” as a first fix. Measure the **6"** rubber. Soft contact that is not in the model is another dinosaur. |

## Study vs our path

| SpdrBot | Hux |
| --- | --- |
| 4-leg spider; 12 hobby servos; Pico + servo board | Wheeled biped; in-wheel FOC; hip roll dynamic in V1; knee / swing **TBD**; **FC TBD** + Pi later |
| Isaac Sim + Isaac Lab + 4090 trainer | V1 = **R18** classical / reused balance. Twin / dojo = **Phase E horizon**. No Isaac / 4090 lock |
| RL first, then hand gait when SKRL would not replay | **LQR / PID before RL** (Diablo / Tazer / Stompy). Hand / reused loop is the V1 plan, not the fallback |
| Paid Fusion / STL pack; GitHub sim assets | Study the public repo in place. **Do not buy.** Do not vendor |
| “Here to here” crawl on a table | North star is **lift → one-leg balance → plant** on a **~9.5"** riser after `TWO_WHEEL` |

## Cite

When a later note is informed by this share, record:

- **SpdrBot** — Indystry / [indystry.cc](https://indystry.cc); [I Tried To Build a Robot Like Boston Dynamics With Isaac Sim](https://www.youtube.com/watch?v=YDzHL2JSCHc) (`YDzHL2JSCHc`)
- Repo: [github.com/Indystrycc/SpdrBot](https://github.com/Indystrycc/SpdrBot) — URDF, USD, Isaac Lab direct project, `spyderbot_test.py`
- Shop (cite only): [indystry.cc product page](https://indystry.cc/product/3d-printable-4-legged-spider-robot/)
- License: README says **personal / educational use**; Fusion / print files are a **paid pack**. Not a Hux vendor. **Do not** drop their URDF / USD / Lab tree next to our MIT docs. Do not relicense the pack as MIT.

What we took: flatten-CAD → `base_link` URDF → USD lockstep; observe only what hardware can sense; reward-hacking as a real failure mode; trainer ≠ viewer ≠ robot; mid/zero before assembly; harness voltage drop; friction socks can make things worse; Sim as a place to author motion **after** a classical loop exists. What we did **not** copy: spider morphology, 12-servo / Pico stack, Jetson Nano, 4090, SKRL/Isaac as a V1 trainer, paid STLs, or a requirement that RL lands on the robot.

Do not confuse this with other “spiderbot” class projects (generic 12-servo hexapod / quadruped kits). This note is **Indystry SpdrBot** + the Isaac clip.

## Do not

- Adopt **spider morphology** (four legs, crawl gait, hobby-servo spider)
- Treat the **Pico + 12-servo** board as a Hux stack
- **Buy Indystry packs** (or print their STLs, or shop 25 kg·cm servos “because the video did”)
- Stand up **Isaac Lab** (or Isaac Sim, mjlab, a 4090 box) **before `TWO_WHEEL`**
- Assume an RL policy **drops onto the robot** (RSL-RL examples ≠ SKRL; trainer ≠ Sim viewer ≠ Pico)
- **Buy a 4090 for V1**
- Replace R18 with Isaac / SKRL / “train it in Lab”
- Vendor `Indystrycc/SpdrBot` or the paid Fusion tree
- Spend
