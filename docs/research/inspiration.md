# Steve's X-share inspirations

Steve clarified **both** X posts are inspiration. **Watch and extract vibe / capability existence. Do not start build work.** No spend. Flight controller stays **TBD**. Nothing here is a Hux stack, BOM, or CAD source.

These sit **next to** the study set — they do not replace [XRobots](xrobots.md), Hattori, or [study-plan.md](study-plan.md) Phases A–D.

| # | What | Scale | Detail |
| --- | --- | --- | --- |
| 1 | [RAI Institute — Roadrunner](roadrunner.md) | Lab RL prototype (~15 kg) | Stairs, one-wheel balance, multimodal drive. **Not our maker path.** |
| 2 | FrRonconi student two-leg/wheel balancer (this page) | Maker-scale, **3-month** student first prototype | Closer vibe to Hux early R&D than lab Roadrunner. |

---

## 1. RAI Institute — Roadrunner (lab)

Full note: [roadrunner.md](roadrunner.md).

[~15 kg](https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/) bipedal wheeled prototype. Side-by-side and in-line drive + stepping; stairs up/down; one-wheel balance; stand from ground; symmetric knees. Single trained policy; some behaviors zero-shot on hardware.

**Hux take:** validates one-leg / one-wheel balance as a **gate**, and drive-vs-step as a mode choice. **Lab RL ≠ Hux.** Our path stays XRobots + TBD FC.

| | |
| --- | --- |
| RAI page | https://rai-inst.com/resources/videos/meet-roadrunner-a-bipedal-wheeled-robot-for-multi-modal-locomotion/ |
| YouTube | https://www.youtube.com/watch?v=9kae-UAME1U |
| X share (Steve) | https://x.com/Ronald_vanLoon/status/2101340064286433440 |

---

## 2. FrRonconi — student two-leg/wheel balancer (maker-scale)

Steve's second share. **Inspiration only.**

> First prototype of a two-leg/wheel balancing #robot. Designed & developed by 2 students within a 3-month project

| | |
| --- | --- |
| X share (Steve) | https://x.com/FrRonconii/status/1373657222480269317 |

`@FrRonconii` is the sharer, not a Hux vendor and not (from the post) the student authors. The same caption circulated with [AA4CC / CTU](https://techfocus.cz/2822-na-cvut-postavili-robota-balancujiciho-na-dvou-nohach-bude-se-ucit-skakat-i-do-schodu.html) credits for **SK8O**: a 3-month (2020) two-leg/wheel balancer built by students, topology inspired by ETH Zürich **Ascento**, own mechanics / electronics / algorithms. Cite the X post first. Do not treat SK8O theses or sim packages as a Hux tree to vendor.

### Why Hux cares (vibe, not a clone)

This is the **closer early-R&D vibe** than Roadrunner:

- **Maker / student timescale** — two people, three months, a *first prototype* that already balances on two wheeled legs. That is the class of object Hux is (docs + one printable wheel-leg later), not a 15 kg institute policy stack.
- **Two-leg/wheel balance first** — matches Hux's teleop baseline ([`../vision.md`](../vision.md) step 1; [`../../NOTES.md`](../../NOTES.md) two-leg milestone) before stairs or one-leg gates.
- **Scope discipline** — a small team shipped a balancer without a lab RL trainer. Hux still does **research first** (Phases A–C) and does **not** skip to a print to “match the three months.”
- **Ascento-class topology (if it is SK8O)** — legs that extend/contract + driven wheels. Useful as a silhouette, not as Hux CAD. Hux V1 bias stays **linkages + springs** and a **~9.5"** step ([`../requirements.md`](../requirements.md) R7 / R3).

### Hux takeaways

1. **Early Hux should look more like this than like Roadrunner.** Student-scale two-wheel-leg balance is the honest first machine. Roadrunner is the later capability existence proof (stairs, one-wheel, knee symmetry).
2. **Two-leg balance is a finished-looking demo and still only the baseline.** Do not read a 3-month clip as “skip one-leg gate / skip 9.5" mapping.”
3. **Not a stack lock.** No FC, no BOM, no “use their MCU because the video did.” FC stays **TBD**.
4. **No public tree on the X post.** Watching a clip is allowed. Copying whoever's CAD/code (SK8O or otherwise) is Phase C and Steve-owned — default is study + rewrite.

### Study vs our path

| FrRonconi / student balancer | Hux |
| --- | --- |
| 3-month student first prototype | Early R&D; printable wheel-leg is **Phase D** |
| Two-leg/wheel balance demo | Same class as the two-leg teleop milestone |
| Sharer post; no license on the tweet | Cite the URL. Do not vendor from a video |
| Closer *vibe* to a maker build | Still XRobots for loops; Hattori + Roadrunner for stairs |

---

## Cite

When a later note is informed by either share, record:

- **Roadrunner** — RAI Institute; URLs in [roadrunner.md](roadrunner.md). No public CAD/code.
- **FrRonconi share** — https://x.com/FrRonconii/status/1373657222480269317 ; quote the 2-student / 3-month line. If we later confirm SK8O as the machine, add AA4CC / CTU names and whatever license their materials state. Until then: **inspiration, not a vendor.**

What we took: vibe (maker-scale first prototype) and capability existence (two-leg/wheel balance; Roadrunner's stairs / one-wheel). What we did **not** copy: geometry, firmware, policy, or parts lists.

## Do not

- Start a Hux build, print, or firmware branch from these clips
- Spend, or treat student or RAI actuators as a Hux spec
- Lock an FC (Roadrunner's RL trainer or anyone's Teensy/LQR in a thesis)
- Vendor SK8O / Ascento / Roadrunner trees
- Pretend a 3-month student demo skips Phases A–C
