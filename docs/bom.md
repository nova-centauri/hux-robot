# First buy

Started **2026-09-21** because Steve asked for parts coming. This is the buy list. Inventory of what is already owned stays on [`parts-on-hand.md`](parts-on-hand.md).

**Authorized now:** the Order now table only. **Not authorized:** motors, drivers, GIM8108, another flight controller, an 8" or 12" tire, a caster-wheel assembly.

Prices are what the pages showed on 2026-09-21. Confirm stock, then measure what arrives. A tire outside **5.75–6.25"** overall, or wider than **~1.25"**, does not count as the settled foot.

## Order now

Two feet, one spare, and spar stock. The hub is a lathe part, so buy the rubber and the tube, not a finished caster.

| Qty | What | Spec that matters | Where | About |
| --- | --- | --- | --- | --- |
| **3** | **6×1.25 pneumatic tire**, ribbed, tube-type | Nominal **6 × 1.25"**. Bead seat **3.75" ID**. Pressure class **50–85 PSI** (higher is the stiffer carcass). Ribbed, not a knobby. Cheng Shin 6×1¼ publishes **153 mm OD** (~6.02") and **32 mm** section (~1.26"), which is the size we want. | [Scooterworks 154-18](https://www.scooterworks.com/products/universal-parts-6x1-25-tire-154-18) ($11, 85 PSI, 3.75" bead). If that page is sold out, the same size from a scooter-parts house. [DIY Mobility 6×1¼ rib](https://diymobilityparts.com/collections/pneumatic-wheelchair-tires) lists a C-179 rib at about $12. | ~$11 each |
| **3** | **6×1.25 inner tube**, bent Schrader stem | Must say **6×1.25** or **6×1¼**, inner about **3.75"**. A bent stem clears a hub flange. | [ElectricScooterParts TUB-6X1.25](https://electricscooterparts.com/tubes.html) ($7.95). | ~$8 each |
| **2** | **Carbon tube, 1 m** | **16 mm OD, 12–14 mm ID** (1–2 mm wall). Round. Pultruded or roll-wrapped. One meter covers four 7.5" links; the second meter is the mis-cut. Wet-cut, respirator. | Example in stock when checked: [Windcatcher 16×14×1000 mm](https://windcatcherrc.com/product/carbon-fiber-tube-16mm-x-14mm-x-1000mm/) (~$16). A 16×12 or 16×13 stick is the stiffer wall if you see one at a similar price. | ~$16 each |

Roughly **$100** before shipping. That is the whole first buy.

When the tires arrive: inflate, measure OD and width, write the numbers on [`parts-on-hand.md`](parts-on-hand.md). Bead seat for the hub drawing is **3.75"**.

## Already here — do not buy again

| Item | Status |
| --- | --- |
| Zantle 5" walker pair | Ordered. Bench donor. Not the foot. |
| F722 Wing, F765 Wing, F722 drone FC, Mamba F405 | On hand. FC still not locked. Blink one of these. |
| TBS Nano RX | On hand. |
| ESP32, Raspberry Pi | On hand. Not needed to start the wheel. |

Look through the drone pile for a **4S LiPo** before buying a pack. Connector and capacity stay open until a wheel driver exists.

## Do not order yet

| Leave it | Why |
| --- | --- |
| Wheel motors, FOC drivers, encoders | Target is about **3 N·m** peak at **60–380 rpm** on 4S. No SKU. A motor bought before the hub drawing is the Tazer "wrong motors" spend. |
| **GIM8108-8**, any 6-pack of actuators | Candidate for knee / swing only. Not a lock. Nominal rating is 48 V; Hux is 4S. Do not buy a set. |
| Knee, hip-swing, hip-roll actuators | Servo vs stepper is still open. Roll class is open. |
| Another flight controller, ODrive, Teensy, Jetson | Boards for blink are already on the shelf. |
| 8", 10", 12" tires, knobbies, caster forks | 6×1.25 is the settled foot. A caster hub gets hacked off, which we already did once with the Zantle. |
| Cameras, a new Pi | After the wheels balance. |

## What this file is not

A full robot BOM. Fasteners, bearings, the hub blank, wire, and the 4S pack get lines when a drawing or a driver exists. Until then they are shop stock or "look first."
