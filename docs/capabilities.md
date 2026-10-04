> **V1-PROOF update — 2026-09-28:** the shop capabilities below remain useful. References to carbon spars, custom in-wheel hubs and stair geometry are historical; suitable scrap/COTS construction is now preferred. [Active mechanical plan](mechanical.md).

# Shop capabilities

**Status:** the user, 2026-09-20. **Docs only.** These are **tools the user can use**, not parts on hand and not a buy list. **No new spend.**

Hardware fabrication is **intentional and welcome**. The user can mill, turn, bend, cut, solder, and weld Hux parts — not only 3D print them. The inventory of owned / ordered *parts* stays on [`parts-on-hand.md`](parts-on-hand.md). Mechanical intent: [`mechanical.md`](mechanical.md).

## Metal / machine shop

| Capability | What it is for (intent) | Notes |
| --- | --- | --- |
| Mill | Plates, flats, pockets, hub features, mounts | Natural home for an **in-wheel BLDC hub** (bore, register, bolt circle). |
| Lathe | Round work: hubs, shafts, spacers, registers | Pair with the mill for the first custom wheel hub. |
| Metal bender | Brackets, light formed sheet | Prefer COTS stock as the blank. |
| Metal brake | Folds / flanges in sheet | Same — form stock; do not invent a sheet SKU. |
| Bandsaw | Cut stock to length | Carbon rod / tube / bar / plate. **Do not mill a spar that a tube already is.** **Carbon dust:** respirator + **wet cut** (Tazer lesson). Do not dry-saw a cloud of carbon into the mill. |

## Join / proto

| Capability | What it is for (intent) | Notes |
| --- | --- | --- |
| Soldering | Harness, proto, rework | Bench electronics. Not a reason to invent a Hux PCB. |
| Welding | Steel / weldable stock joints | Welcome when a weld is the honest joint. Not a sealed mono-body excuse. |
| Breadboards | Electronics proto | Fine for blink / bind / driver bring-up. Not a flight stack. |

## How this sits next to structure rules

- **The user can machine, bend, or weld custom parts**, or 3D print them. Do not treat “printable” as the only permitted custom part.
- The **in-wheel BLDC hub** (donor Zantle rubber + custom hub) is a **natural lathe / mill part**. That is the intended first shop job, not a stretch goal.
- Still **prefer COTS structure** (carbon rod / tube, metal stock, fasteners) where it fits. Do not mill a spar that a tube already is (R19 / R34).
- **Carbon-fiber dust is not a toy.** Use a respirator and a wet cut when the bandsaw cuts tube. Refer to [`research/tazer-lessons.md`](research/tazer-lessons.md).
- **Draft-friendly print still for plastics** — joints, clamps, brackets, fairings. Print is welcome. It is not the only shop.

Do not add a list of tools to buy here. Do not recommend machines, inserts, or stock SKUs. When a real custom part exists, put the CAD / 2D files in [`../cad/`](../cad/) and note it in [`../NOTES.md`](../NOTES.md).
