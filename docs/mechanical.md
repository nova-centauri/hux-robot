# Mechanical

**Status:** TBD. No CAD, no printed parts, no locked geometry.

V1 target is **one wheel-leg** (printed **customs** on **COTS** structure) with a linkage + spring stub, sized toward a **~9.5"** step. Do not wait on the flight controller for this. **Do not open Blender until several 2D sketch layouts exist** (R23).

## Intent

- Two legs, each ending in a **brushless driven wheel**.
- Legs via **strong linkages + springs** (gravity compensation / energy return).
- Prefer linkage over pure serial belts for V1 simplicity.
- Design stroke and clearance around a ~9.5" residential riser (up and down).
- Extra DOF is desirable later (stairs / fall recovery); do not invent a 6-DOF stack on paper.
- **COTS stock** for primary structure. Printed / molded parts are connectors, hubs, and brackets — not the spar.
- Customs stay **draft-friendly**, with **wire ports** and **service access** (R19–R22).

## Design rules (Steve 2026-09-20)

These are requirements, not vibes. IDs: **R19–R23**. Tick the matching items in [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md).

### 1. Structural parts — cheap COTS first (R19)

Prefer **cheap off-the-shelf stock** for anything that is a beam, tube, plate, or fastener.

Examples of “use this, do not print it”:

- Carbon rods / tubes
- Metal stock (bar, angle, plate)
- Tube (carbon, aluminum, or whatever is already on hand)
- Fasteners, standoffs, shafting, bearings

**Do not custom-print primary structure when COTS will do.** A printed carbon-tube-shaped spar is a miss. Print the **joints** that grab the tube (clamps, hubs, linkage plates, motor mounts). The V1 “printable wheel-leg” is a **fit-check of those customs on stock**, not a sealed printed mono-leg.

No spend. Prefer stock Steve already owns. Do not invent a COTS SKU list here.

### 2. Custom parts — draft in mind (R20)

Every custom (printed now, maybe molded later) is designed with **draft** so it is easy to **3D print** *and* later **injection mold**.

Hard biases:

- **Draft angles** on walls that would pull from a mold or sit on a print bed.
- **Avoid undercuts** where possible. If a feature cannot be printed or tooled without a side-action / support cave, redesign it.
- **Parting-line awareness** — know which way the part splits. Do not hide a hook across that plane.
- **Printable orientation** — pick a build direction before you sculpt. Layer strength, overhangs, and the future mold pull should agree.

This is not “make it look organic in Blender and hope.” If it cannot be printed as one or two simple orientations, it is not a V1 custom.

### 3. Wire management — openings and ports (R21)

Include **openings and ports for wires** whenever possible. Cable paths go **through** links and the body, not taped to the outside after the print.

- Every link, hip block, and body shell gets a planned wire path (through-hole, channel, or grommet port).
- Leave bend radius and service loops — do not size a port for a single bare conductor and then stuff a servo lead.
- Moving joints need a path that survives articulation (clearance through the pivot, or a dedicated loop).
- Wheel-motor leads (Hattori: cables must survive flailing) are part of the layout, not a later drill.

If a part has no wire and never will, say so. Default is: **leave a port**.

### 4. Serviceability (R22)

Explicit **V1** consideration — this robot will be opened constantly.

- **Access to fasteners** without destroying a fairing.
- **Access to batteries** (serviceable bay; no glued-in cell).
- **Access to the FC** (FC is still **TBD** — still leave a replaceable mount / bay, do not lock the board).
- **Access to actuators** (hip, knee, wheel drive) so a failed unit comes out as a module.
- **Replaceable modules preferred over sealed mono-bodies.** A one-piece printed torso that hides the FC and pack is out of intent.

Serviceable ≠ “add more screws later.” Design the split first.

### 5. Process — several 2D sketch layouts before Blender (R23)

**Gate:** 2D layouts exist **before** Blender (or other 3D CAD) work starts.

- Do **several** 2D sketch layouts — not one doodle. Side, front, and top of the stance; plus a linkage / stroke layout for the wheel-leg.
- Paper, tablet, or files are all fine. What matters is that the layouts exist and can be pointed at.
- 2D answers: envelope, COTS stock vs printed customs, cable paths, fastener/service access, and how the raised wheel reaches ~9.5".
- **Blender / 3D CAD is closed until those layouts exist.** A `.blend` with no preceding 2D is a process miss, even if the mesh looks cool.
- Drop real 2D scans / exports under [`../cad/`](../cad/) (or link them from [`../NOTES.md`](../NOTES.md)) when they exist. An empty `cad/` folder is not a layout.

This gate sits in front of Phase D in [`research/study-plan.md`](research/study-plan.md). Research (A–C) still comes first; 2D still comes before 3D.

## Hattori notes (steal, do not copy blindly)

From [STRIDE V2](https://www.alex-hattori.com/blog/wheeled-biped-v2):

- Larger wheels help terrain; small wheels + low clearance make grass/rocks a non-starter.
- Serial / linkage knees are kinder to stairs than parallel “knees both sides.”
- Wheel motors at the wheel are simpler than remote-drive belts (cables need to survive flailing).
- Springs are worth it if actuators are small.

## V1 checklist

Use this instead of a fake finished BOM. Tick in [`NOTES.md`](../NOTES.md) when something is real. Canonical box list: [`checklists/mechanical-v1.md`](checklists/mechanical-v1.md).

- [ ] Measure a real ~9.5" riser / fixture (riser, tread, nosing).
- [ ] **Several 2D sketch layouts** (side / front / top + linkage). **No Blender until this is real** (R23).
- [ ] Sketch wheel diameter vs. step height vs. knee stroke (part of the 2D set).
- [ ] Choose **COTS structure** where possible (tube / rod / stock / fasteners). Do not print the spar (R19).
- [ ] Pick a wheel-leg envelope (one side only) as printed **customs** on that stock.
- [ ] Customs have **draft**, no lazy undercuts, printable orientation, parting-line awareness (R20).
- [ ] **Wire ports / cable paths** through links and body (R21).
- [ ] **Service access** to fasteners, battery, FC (TBD), actuators — modules, not a sealed mono-body (R22).
- [ ] Linkage layout + spring stub (gravity assist, not decorative).
- [ ] Wheel hub / BLDC mount (motor model still TBD).
- [ ] Print + fit the first leg. No second copy until the first one articulates.
- [ ] Clearance check: raised wheel can reach the next 9.5" tread without self-collision.

## Out of scope for V1

- Full stair gait hardware (two finished legs + body).
- Buying new actuators or wheels. No COTS shopping list until Steve asks.
- Locking an FC mount *model* before the FC is chosen (the **bay** still gets designed).
- Opening Blender / 3D CAD before several 2D layouts exist.
- Printing primary structure that stock already covers.
- Sealed mono-body legs or torsos that hide wires, fasteners, pack, or FC.

CAD drops in [`../cad/`](../cad/) — **after** 2D layouts.
