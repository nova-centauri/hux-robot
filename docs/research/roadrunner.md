# RAI Institute — Roadrunner

Steve shared this as research inspiration (one of [two X shares](inspiration.md)). **Watch and extract heuristics. Do not start build work from it.**

Roadrunner is a **lab prototype** with a learned (RL) policy stack. Hux's path stays [XRobots](xrobots.md) + Hattori + a **TBD** flight controller. There is no public CAD or firmware to vendor. No spend.

## What it is

[~15 kg (33 lb)](https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/) bipedal wheeled prototype from [RAI Institute](https://rai-inst.com/) (Robotics and AI Institute; Marc Raibert / Boston Dynamics lineage). Multi-modal locomotion — it switches configuration to match the terrain:

- Drive with wheels **side-by-side**
- Shift wheels **in-line** (one behind the other)
- **Stepping** when rolling is not enough

Legs are entirely **symmetric**: knees can point **forward or backward** (obstacle avoidance and specific movements, including reversing a climb).

RAI's own page (2026-03-23): a **single control policy** was trained for both driving modes. Stand-up from various ground poses and **balancing on one wheel** were deployed **zero-shot** on hardware.

This is **not** a maker stack. Do not treat the demo as a Hux firmware, CAD, or BOM source.

## Links

| | |
| --- | --- |
| RAI page | https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/ |
| YouTube | https://www.youtube.com/watch?v=9kae-UAME1U |
| X share (Steve) | https://x.com/Ronald_vanLoon/status/2101340064286433440 |

Secondary write-ups (same demo; cite RAI first): [IEEE Spectrum](https://spectrum.ieee.org/roadrunner-bipedal-robot), [New Atlas](https://newatlas.com/robotics/rai-robotic-legs-roadrunner/).

## Capabilities relevant to Hux

From RAI + the demo coverage — extract, do not copy:

| Capability | Why Hux cares |
| --- | --- |
| Stairs **up and down** | Same north star as Hux (~9.5" riser). Demo uses wheels as feet / a step, then returns to rolling. |
| **One-wheel balance** | Validates Hux **R2**: one-leg / one-wheel balance is a real gate, not a stretch goal. |
| **Stand from ground** | Fall-recovery class of motion (Hattori also flags extra DOF for this). Not a V1 milestone. |
| **Symmetric knees** (fwd / back) | Climb and descend without a preferred knee direction. Compare with Hattori's invert-the-knee / linkage note. |

Press coverage also shows rolling on stairs vs locked-leg stomping — two different modes on the same machine. That is the multimodal point: **drive when you can, step when you must.**

## Hux takeaways

1. **One-leg / one-wheel balance is the gate.** Roadrunner showing one-wheel balance on hardware is independent evidence for the milestone already in [`../../NOTES.md`](../../NOTES.md) and [`../vision.md`](../vision.md). Do not skip it to chase stairs.
2. **Multimodal drive vs step.** Side-by-side, in-line, and stepping are different answers to the same terrain. Hux V1 is still **lift → 1-leg balance → plant** on a ~9.5" fixture ([study-plan.md](study-plan.md) Phase B). In-line / skate modes are watch-list, not a V1 requirement.
3. **Knee symmetry helps stairs both ways.** Pair this with Hattori (serial/linkage knee vs parallel “knees on both sides”). Hux V1 still prefers **strong linkages + springs** ([`../requirements.md`](../requirements.md) R7). That bias stays; Roadrunner is a lesson, not CAD.
4. **Lab RL ≠ our maker path.** RAI trained one policy and zero-shot a few behaviors. Hux studies IMU → PID → wheel torque from XRobots, then a **TBD FC**. Do not lock an FC, write a policy trainer, or invent a BOM because this demo exists.

## Study vs our path

| Roadrunner | Hux |
| --- | --- |
| Closed lab prototype, ~15 kg, no public tree | Maker R&D; printable wheel-leg is **Phase D** |
| Learned / RL policy; zero-shot deploy on hardware | Study XRobots loops; rewrite from understanding; FC **TBD** |
| Side-by-side + in-line + stepping | Two-leg teleop → one-leg gate → open-loop 9.5" step |
| Symmetric knees, torso-less legs-on-wheels | V1 bias: linkages + springs; extra DOF only if it earns stairs |

## Cite

When a later note is informed by this demo, record:

- Project: RAI Institute **Roadrunner**
- URLs: RAI page (canonical), YouTube, X share above
- License: **no public CAD/code**. Cite the page and videos. Do not scrape a robot out of a demo.
- What we took: capability existence (one-wheel balance, drive-vs-step, knee symmetry). What we did **not** copy: policy, geometry, or stack.

## Dive / do not

**Watch next (with Phase B, alongside Hattori):** the RAI page + YouTube. List which demo beats look like Hux states (two-wheel roll, one-wheel hold, step-up, step-down, stand-up).

**Do not:**

- Start a Hux build, print, or firmware branch from this note
- Vendor anything (there is nothing to vendor)
- Lock an FC or adopt an RL trainer because RAI used one
- Spend, or treat ~15 kg / RAI actuators as a Hux spec
- Relicense or pretend this is an XRobots-class open project
