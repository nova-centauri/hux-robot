# Bill of materials

Started **2026-09-21**. Prices are page prices or class estimates from that day. Shipping and tax are extra. A tire outside **5.75–6.25"** overall, or wider than **~1.25"**, does not count as the foot.

The BOM is **need-driven**: the project buys what the design needs. Inventory ([`parts-on-hand.md`](parts-on-hand.md)) is a reference, not a design driver. Steve owns edits to the order-now breakout.

**To order now: about $230** — tires, tubes and carbon tube $89.41, the Teensy CAN kit ~$54, XT90-S ~$5, one 8S 3300 mAh pack ~$80. That is the only authorized spend. MCU, anti-spark and pack added 2026-09-26; **8S confirmed by Steve the same day.**

**Working total if the later estimates are bought as written: about $1,580.** Eight real QDD actuators moved it; that is the cost of the CAN decision and it is the honest number. The actuator block ($1,120 at the prices in `tools/living-drawings/actuators.js`) is most of that; it is a temporary lock, not an order.

Inventory of what is already here: [`parts-on-hand.md`](parts-on-hand.md).

3D models of the bought parts (RobStride 00 / 02 / 05, Teensy 4.1 — vendor STEP files, full and sandbox meshes, orientation notes): [`../cad/vendor/`](../cad/vendor/README.md). Tire, pack, connector and breakout boards have no vendor model yet; the sandbox draws those from the BOM's dimensions.

## Order now — about $230

| Qty | What | Unit | Line | Store |
| --- | --- | ---: | ---: | --- |
| 3 | 6×1.25 ribbed pneumatic tire, 85 PSI, 3.75" bead | $11.00 | $33.00 | [Scooterworks 154-18](https://www.scooterworks.com/products/universal-parts-6x1-25-tire-154-18). If that page is out: [DIY Mobility 6×1¼ rib](https://diymobilityparts.com/collections/pneumatic-wheelchair-tires) at about $12. |
| 3 | 6×1.25 inner tube, bent Schrader stem | $7.95 | $23.85 | [ElectricScooterParts TUB-6X1.25](https://electricscooterparts.com/tubes.html) |
| 2 | Carbon tube, 16×14 mm, 1 m | $16.28 | $32.56 | [Windcatcher 16×14×1000](https://windcatcherrc.com/product/carbon-fiber-tube-16mm-x-14mm-x-1000mm/). A 16×12 or 16×13 stick is the stiffer wall if the price is close. |
| 1 | **Teensy 4.1** | ~$32 | $32 | **CAN real-time MCU (Steve 2026-09-26: "add the CAN MCU").** 600 MHz, **3× CAN** (CAN3 FD-capable), built-in microSD (blackbox), plenty of UARTs. [PJRC](https://www.pjrc.com/store/teensy41.html). Chosen over an H743-WING because eight classic-CAN nodes need two buses minimum ([`research/actuator-shortlist.md`](research/actuator-shortlist.md) §1.4). |
| 1 | ICM-42688-P IMU breakout (SPI) | ~$12 | $12 | The Teensy has no IMU. One 6-axis on the balance board; the Wing's MPU6000 stays on the bench. Adafruit / SparkFun class. |
| 3 | CAN transceiver breakout, 3.3 V (SN65HVD230 / TJA1051-class) | ~$3–4 | ~$10 | One per Teensy CAN port. Add a 120 Ω terminator at each bus end. |
| 1 | **XT90-S anti-spark connector pair** | ~$5 | $5 | **Steve 2026-09-26: "add the anti spark."** On the harness side; the pack keeps a plain XT90. |
| 1 | **8S 3300 mAh 50–60C LiPo, XT90** | ~$70–90 | ~$80 | **Steve 2026-09-26: 8S yes.** One pack (~98 Wh, 1–2 h at 40–80 W, ~620 g (550–700), envelope 150 × 45 × 56 mm). Brand / store his pick (HRB / Ovonic / Zeee / Tattu class). 33.6 V full, 29.6 V nominal, **alarm / cutoff 26.4 V** (3.3 V/cell). Needs an 8S-capable balance charger — check the drone bench. Why 8S: the RobStride 00/01/02 input floor is 24 V ([`research/actuator-shortlist.md`](research/actuator-shortlist.md) §3). 2700 mAh is the smaller alternative if the 3300 will not package. |
| | **Total to order now** | | **~$230** | $89.41 tires/tubes/tube + ~$54 MCU kit + ~$5 anti-spark + ~$80 pack. Shipping extra. |

## Already here — $0 more

| Item | Notes |
| --- | --- |
| Zantle 5" walker pair | Already bought, about $15. Bench donor, not the foot. |
| F722 Wing, F765 Wing, F722 drone FC, Mamba F405 | On hand. Pick one to blink. Not a new board. |
| TBS Nano RX | On hand. |
| Raspberry Pi, ESP32 | On hand. Face, cameras, and telemetry later. |

Pack in the order-now table. 4S → 6S → 8S all on 2026-09-26; 8S is the one that survived the actuator voltage check.

## Later — class estimates, not a cart

Only the actuators carry a (temporary) SKU lock; the rest are class estimates. The dollar is a midpoint so the total is not a blank. Do not buy them off this table.

| Qty | What | Est. each | Line | Store / note |
| --- | --- | ---: | ---: | --- |
| 2 | Wheel actuator (in-wheel) | $110 | $220 | **Temporary lock 2026-09-26: 2× RobStride 05** (1.7 rated / 5.5 peak N·m, 191 g, 46 × 46 × 44 mm). Driver and encoder are on the actuator. Sheet 2 sets it flush with the tire's outboard face on a turned rim; confirm its output-bearing rating under the cantilevered rim before ordering (open call 14). |
| 2 | Hip roll actuator | $145 | $290 | **Temporary lock 2026-09-26: 2× RobStride 02.** Roll axes at **3.0"** on Sheet 1: one-wheel hold **5.2 N·m** vs 7 rated (10.7 at the old 5.4" hips, which nothing in the family holds at rating). Not an order. |
| 4 | Knee and hip-swing actuator | $145 / $160 | $610 | **Temporary lock 2026-09-26:** knees **2× RobStride 02** (at the knee, R39), swing **2× RobStride 00**. One RS02 first on the Teensy before the set. Servo / stepper+belt is the fallback. |
| 2 | Knee spring + cable + pulley | $10 | $20 | Sheet 2: extension spring ~1.8 kN/m (10 lbf/in), 7 N preload, 3.4" travel, ~160 N at the stop, on a Ø2.5" knee pulley. No part picked (open call 15); a torsion or gas spring are the alternatives. |
| 7 | Cameras (2 front, plus back, sides, top, bottom) | $20 | $140 | No module picked. |
| 1 | Small front display, about 2.2" × 1.0" | $20 | $20 | Preset faces. No panel picked. |
| 2 | RGB into the eye sockets | $10 | $20 | The lit socket is the eye. No LED picked. |
| 1 | Step-down and distribution | $30 | $30 | 5 V and 12–19 V bucks rated ≥36 V in, a hardware kill, fuse. No board picked. |
| | **Later estimate** | | **~$1,350** | Actuator block $1,120 for eight RobStride units (`actuators.js`). |

Hubs, fasteners, wire, and bearings are shop stock. They are not in the total.

## Totals

| | Amount |
| --- | ---: |
| Order now | ~$230 |
| Later, class estimate | ~$1,350 |
| **Working total** | **about $1,580** |

Shipping, tax, and a wrong actuator guess move the $1,580. The order-now ~$230 is the only authorized part.
