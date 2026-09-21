# Parts on hand

**Status:** inventory started 2026-09-20. What to buy is [`bom.md`](bom.md). This page stays the owned / ordered list. First buy authorized 2026-09-21 is tires, tubes, and carbon tube only.

This page records what Steve already **owns** or has **already ordered**, plus a short **candidates** list that is explicitly **not owned / not ordered**. Owned ≠ reserved for Hux. If a row does not say reserved, treat reservation as **TBD**.

Do not add buy recommendations, alternate SKUs, or “you should also get” notes here. When a part arrives or is weighed, update the row. When something is actually on the Hux bench, also record it in [`electronics.md`](electronics.md) / [`mechanical.md`](mechanical.md) and [`../NOTES.md`](../NOTES.md).

See also: [`electronics.md`](electronics.md) · [`electronics-minimum.md`](electronics-minimum.md) (classes / P0–P5, not inventory) · [`mechanical.md`](mechanical.md) · [`requirements.md`](requirements.md) · [`decisions.md`](decisions.md) · **shop tools (not parts):** [`capabilities.md`](capabilities.md).

## Shop capabilities (not parts)

Steve has a shop. That is **tools he can use**, not inventory. Full list: [`capabilities.md`](capabilities.md).

Hardware fab is **intentional and welcome** — mill, lathe, metal bender, metal brake, bandsaw, soldering, welding, breadboards. Customs may be machined / bent / welded, not only printed. The in-wheel BLDC hub is a natural lathe / mill part. Still prefer COTS structure (carbon tube / stock) where it fits; draft-friendly print still for plastics.

Do not list these as rows above. They are not parts on hand.

## Mechanical

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Zantle Universal Walker Wheels Replacement — 5 inch, grey | 1 pair | **Ordered 2026-09-20 (Steve)** | [Amazon B0D534PDRT](https://www.amazon.com/dp/B0D534PDRT). Listing: 5" rubber wheels; for walkers with ~1" tube / 0.31" adjustment holes; includes 1 pair wheels + 2 pairs caster fittings; up to ~300 lb capacity rating; 8 height adjustments on stem. Package ~1.5 lb. ~$14.59 when ordered. | **Bench donor only** — hack apart to learn a hub / restrained spin. **Not the foot.** Settled foot is **6" OD** real rubber ([`research/leg-geometry.md`](research/leg-geometry.md)). Lathe / mill path: [`capabilities.md`](capabilities.md). | **Already purchased — document only.** Walker *caster / fork* assemblies — **not** ready-made BLDC hubs. Steve 2026-09-20: **OK to hack apart**. Steve 2026-09-21: not the contact; diameter settled at 6". Discard the stem / fork as needed. Measure bore / OD / width / mass when they arrive. Reserved for Hux: **yes** (this order). Do not cut the 7.5" tubes to suit 5". |

## Electronics

On-hand pile from project notes. **On hand (Steve)** means owned today, not “on the Hux bench” and not “reserved.”

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| F722 Wing | TBD | on hand (Steve) | Wing FC class. No SKU lock. | FC candidate | **FC stays TBD.** Prefer a Wing board *when* we lock. Reserved: **TBD**. |
| F765 Wing | TBD | on hand (Steve) | Wing FC class. No SKU lock. | FC candidate | Same pile. Not selected. Reserved: **TBD**. |
| F722 drone FC | TBD | on hand (Steve) | Drone FC class. No SKU lock. | FC candidate | Same pile. Not selected. Reserved: **TBD**. |
| Mamba F405 | TBD | on hand (Steve) | F405-class drone FC. No SKU lock. | FC candidate | Same pile. Not selected. Reserved: **TBD**. |
| TBS Nano RX | TBD | on hand (Steve) | Crossfire Nano RX. | RC in — bind to the FC (or a dedicated link into the FC). Locked enough to write down. | Reserved: **TBD**. |
| ESP32 | TBD | on hand (Steve) | Dev-board class. Module TBD. | Optional thin Wi‑Fi / telem bridge if the Pi should not own that link. | Reserved: **TBD**. |
| Raspberry Pi | TBD | on hand (Steve) | Companion compute. Board / RAM TBD. | Cameras + pathfinding inference. Not on the FC. Possible later pose / stepper brain. | Reserved: **TBD**. |

## Actuators

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Wheel BLDC / in-wheel hub motor | — | none yet | — | Custom hub. First spin can use the 5" **donor** rubber. The foot is the settled **6"** real-rubber wheel. FOC + encoder *class* when one exists. Target about **3 N·m peak** — not a SKU. | The Zantle order is **wheels / caster forks**, not motors. OK to hack the rubber off the walker hub. |
| Wheel FOC driver / ESC | — | none yet | — | Per-wheel FOC channel. | — |
| Knee / hip-swing actuator | — | none yet | — | Pose joints. Class **servo vs stepper+belt TBD**. | See Candidates. |
| Hip-roll actuator | — | none yet | — | Dynamic roll **in V1**. | — |

## Candidates (not owned / not ordered)

Research pointers only. **Not a buy list. No spend.** Do not treat a row here as reserved or as a lock.

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| **GIM8108-8** | — | **Not ordered.** Candidate only. | GIM8108-class integrated BLDC + reduction (8:1 class). Exact vendor page TBD when we research, not shop. | **Knee / hip swing** candidate (R12). Size whichever class we pick for ~2× plant load (R36). | Steve 2026-09-21: noted as a candidate. Tazer later ran 6× GIM8108 on a ~2 ft carbon-tube wheeled biped — **data point, not a buy** ([`research/tazer-lessons.md`](research/tazer-lessons.md)). Aligns with servo vs stepper+belt remaining **TBD**. No SKU lock. |

## Other

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | none yet | — | Fasteners, wire, springs, packs, cameras | Not inventoried. Buy lines live on [`bom.md`](bom.md), not in this table. |
