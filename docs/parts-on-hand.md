# Parts on hand

**Status:** inventory started 2026-09-20. **Docs only.** Not a shopping list. **No new spend.**

This page records what Steve already **owns** or has **already ordered**. Owned ≠ reserved for Hux. If a row does not say reserved, treat reservation as **TBD**.

Do not add buy recommendations, alternate SKUs, or “you should also get” notes here. When a part arrives or is weighed, update the row. When something is actually on the Hux bench, also record it in [`electronics.md`](electronics.md) / [`mechanical.md`](mechanical.md) and [`../NOTES.md`](../NOTES.md).

See also: [`electronics.md`](electronics.md) · [`electronics-minimum.md`](electronics-minimum.md) (classes / P0–P5, not inventory) · [`mechanical.md`](mechanical.md) · [`requirements.md`](requirements.md).

## Mechanical

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Zantle Universal Walker Wheels Replacement — 5 inch, grey | 1 pair | **Ordered 2026-09-20 (Steve)** | [Amazon B0D534PDRT](https://www.amazon.com/dp/B0D534PDRT). Listing: 5" rubber wheels; for walkers with ~1" tube / 0.31" adjustment holes; includes 1 pair wheels + 2 pairs caster fittings; up to ~300 lb capacity rating; 8 height adjustments on stem. ~$14.59 when ordered. | Rubber wheel (and maybe axle geometry) for a **custom hub + in-wheel BLDC**. Matches the ~5" skinny-rubber hypothesis. | **Already purchased — document only.** Walker *caster/fork* assemblies for free-rolling medical walkers — **not** ready-made BLDC hubs. Discard or adapt the walker stem/fork as needed. Measure bore/OD when they arrive. Reserved for Hux: **yes** (this order). |

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
| Raspberry Pi | TBD | on hand (Steve) | Companion compute. Board / RAM TBD. | Cameras + pathfinding inference. Not on the FC. Possible later stepper brain. | Reserved: **TBD**. |

## Actuators

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Wheel BLDC / in-wheel hub motor | — | none yet | — | Custom hub on the 5" rubber (see Mechanical). FOC + encoder *class* when one exists. | The Zantle order is **wheels / caster forks**, not motors. |
| Wheel FOC driver / ESC | — | none yet | — | Per-wheel FOC channel. | — |
| Knee / hip-swing stepper + reduction | — | none yet | — | Pose joints (when that class lands). | — |
| Hip-roll actuator | — | none yet | — | Dynamic roll (when that class lands). | — |

## Other

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | none yet | — | Fasteners, wire, springs, packs, cameras | Not inventoried. Do not invent a BOM to fill this table. |
