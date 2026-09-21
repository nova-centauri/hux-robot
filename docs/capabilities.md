# Shop capabilities

**Status:** Steve 2026-09-20. **Docs only.** These are **tools he can use**, not parts on hand and not a buy list. **No new spend.**

Hardware fab is **intentional and welcome**. Hux is allowed to be milled, turned, bent, cut, soldered, and welded — not only 3D printed. Inventory of owned / ordered *parts* stays on [`parts-on-hand.md`](parts-on-hand.md). Mechanical intent: [`mechanical.md`](mechanical.md).

## Metal / machine shop

| Capability | What it is for (intent) | Notes |
| --- | --- | --- |
| Mill | Plates, flats, pockets, hub features, mounts | Natural home for an **in-wheel BLDC hub** (bore, register, bolt circle). |
| Lathe | Round work: hubs, shafts, spacers, registers | Pair with the mill for the first custom wheel hub. |
| Metal bender | Brackets, light formed sheet | Prefer COTS stock as the blank. |
| Metal brake | Folds / flanges in sheet | Same — form stock; do not invent a sheet SKU. |
| Bandsaw | Cut stock to length | Carbon rod / tube / bar / plate. **Do not mill a spar that a tube already is.** |

## Join / proto

| Capability | What it is for (intent) | Notes |
| --- | --- | --- |
| Soldering | Harness, proto, rework | Bench electronics. Not a reason to invent a Hux PCB. |
| Welding | Steel / weldable stock joints | Welcome when a weld is the honest joint. Not a sealed mono-body excuse. |
| Breadboards | Electronics proto | Fine for blink / bind / driver bring-up. Not a flight stack. |

## How this sits next to structure rules

- **Customs may be machined, bent, or welded** as well as 3D printed. Do not treat “printable” as the only legal custom.
- The **in-wheel BLDC hub** (donor Zantle rubber + custom hub) is a **natural lathe / mill part**. That is the intended first shop job, not a stretch goal.
- Still **prefer COTS structure** (carbon rod / tube, metal stock, fasteners) where it fits. Do not mill a spar that a tube already is (R19 / R34).
- **Draft-friendly print still for plastics** — joints, clamps, brackets, fairings. Print is welcome; it is not the only shop.

Do not add a tooling shopping list here. Do not recommend machines, inserts, or stock SKUs. When a real custom exists, drop CAD / 2D in [`../cad/`](../cad/) and note it in [`../NOTES.md`](../NOTES.md).
