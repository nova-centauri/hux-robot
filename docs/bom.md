# Bill of materials

Started **2026-09-21**. Prices are page prices or class estimates from that day. Shipping and tax are extra. A tire outside **5.75–6.25"** overall, or wider than **~1.25"**, does not count as the foot.

The BOM is **need-driven**: the project buys what the design needs. Inventory ([`parts-on-hand.md`](parts-on-hand.md)) is a reference, not a design driver. Steve owns edits to the order-now breakout.

**To order now: $89.41 + the CAN MCU kit (~$55) + one pack (on hold — voltage under decision, see below).** That is the only authorized spend. MCU and pack added 2026-09-26.

**Working total if the later estimates are bought as written: about $1,600.** Eight real QDD actuators moved it; that is the cost of the CAN decision and it is the honest number. The actuator block is most of that, and it is not chosen.

Inventory of what is already here: [`parts-on-hand.md`](parts-on-hand.md).

## Order now — $89.41

| Qty | What | Unit | Line | Store |
| --- | --- | ---: | ---: | --- |
| 3 | 6×1.25 ribbed pneumatic tire, 85 PSI, 3.75" bead | $11.00 | $33.00 | [Scooterworks 154-18](https://www.scooterworks.com/products/universal-parts-6x1-25-tire-154-18). If that page is out: [DIY Mobility 6×1¼ rib](https://diymobilityparts.com/collections/pneumatic-wheelchair-tires) at about $12. |
| 3 | 6×1.25 inner tube, bent Schrader stem | $7.95 | $23.85 | [ElectricScooterParts TUB-6X1.25](https://electricscooterparts.com/tubes.html) |
| 2 | Carbon tube, 16×14 mm, 1 m | $16.28 | $32.56 | [Windcatcher 16×14×1000](https://windcatcherrc.com/product/carbon-fiber-tube-16mm-x-14mm-x-1000mm/). A 16×12 or 16×13 stick is the stiffer wall if the price is close. |
| 1 | **Teensy 4.1** | ~$32 | $32 | **CAN real-time MCU (Steve 2026-09-26: "add the CAN MCU").** 600 MHz, **3× CAN 2.0 / FD**, built-in microSD (blackbox), plenty of UARTs. [PJRC](https://www.pjrc.com/store/teensy41.html). Chosen over an H743-WING because eight classic-CAN nodes need two buses minimum ([`research/actuator-shortlist.md`](research/actuator-shortlist.md) §1.4). |
| 1 | ICM-42688-P IMU breakout (SPI) | ~$12 | $12 | The Teensy has no IMU. One 6-axis on the balance board; the Wing's MPU6000 stays on the bench. Adafruit / SparkFun class. |
| 3 | CAN transceiver breakout, 3.3 V (SN65HVD230 / TJA1051-class) | ~$3–4 | ~$10 | One per Teensy CAN port. Add a 120 Ω terminator at each bus end. |
| 1 | **XT90-S anti-spark connector pair** | ~$5 | $5 | **Steve 2026-09-26: "add the anti spark."** On the harness side; the pack keeps a plain XT90. |
| 1 | **Pack — ON HOLD** | ~$60–90 | — | Steve's first pick was a 6S 5200 mAh 60C ("somewhat randomly"; a smaller one is fine; wants reasonable runtime). Then the actuator check found the RobStride 00/01/02 floor is **24 V** — below a 6S pack for most of its discharge. **Recommendation: one 8S 2700–3300 mAh 50–60C, XT90** (~80–98 Wh, 1–2 h at 40–80 W, ~½–¾ kg). Buy after Steve confirms 8S + the shortlist. [`research/actuator-shortlist.md`](research/actuator-shortlist.md) §3–4. |
| | **Total to order now** | | **~$150 + pack** | $89.41 tires/tubes/tube + ~$59 MCU kit + anti-spark; pack ~$60–90 once the voltage is confirmed. Shipping extra. |

## Already here — $0 more

| Item | Notes |
| --- | --- |
| Zantle 5" walker pair | Already bought, about $15. Bench donor, not the foot. |
| F722 Wing, F765 Wing, F722 drone FC, Mamba F405 | On hand. Pick one to blink. Not a new board. |
| TBS Nano RX | On hand. |
| Raspberry Pi, ESP32 | On hand. Face, cameras, and telemetry later. |

Pack decided 2026-09-26 (order-now table). 6S superseded 4S the same day.

## Later — class estimates, not a cart

No SKU is locked on these. The dollar is a midpoint so the total is not a blank. Do not buy them off this table.

| Qty | What | Est. each | Line | Store / note |
| --- | --- | ---: | ---: | --- |
| 2 | Wheel actuator (in-wheel), about 3 N·m | $100 | $200 | Shortlist: **RobStride 05** (5.5 N·m peak, 191 g, 15–60 V) — [`research/actuator-shortlist.md`](research/actuator-shortlist.md). Driver and encoder are on the actuator; no separate lines. Do not buy before the hub drawing. |
| 2 | Hip roll actuator | $160 | $320 | Shortlist: **RobStride 02** if the hip offset comes in to ≤ 3.5" (5.4 N·m hold), **RobStride 06** at the drawn 5.4" (8.3 N·m continuous hold, 12–13 peak — [`research/one-leg-stance.md`](research/one-leg-stance.md)). RS00 is out for roll. GIM8108-8 was the earlier yardstick. Not an order. |
| 4 | Knee and hip-swing actuator | $170 | $680 | Shortlist: **2× RobStride 02** (knee) + **2× RobStride 00** (swing); hip roll also RS00. One RS00 first on the Teensy before the set. Servo / stepper+belt is the fallback. |
| 7 | Cameras (2 front, plus back, sides, top, bottom) | $20 | $140 | No module picked. |
| 1 | Small front display, about 2.2" × 1.0" | $20 | $20 | Preset faces. No panel picked. |
| 2 | RGB into the eye sockets | $10 | $20 | The lit socket is the eye. No LED picked. |
| 1 | Step-down and distribution | $20 | $20 | Logic and pose off the motor rail. No board picked. |
| | **Later estimate** | | **~$1,400** | Actuator block ~$1,200 for eight RobStride units. |

Hubs, fasteners, wire, and bearings are shop stock. They are not in the total.

## Totals

| | Amount |
| --- | ---: |
| Order now | $89.41 |
| Later, class estimate | $1,050 |
| **Working total** | **about $1,140** |

Shipping, tax, and a wrong actuator guess move the $1,140. The $89.41 does not.
