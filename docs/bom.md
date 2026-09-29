# V1-PROOF budget

**$900 planned ceiling, including shipping, tax and repair contingency.** The hard limit is strictly under $1,000. The paid Pololu and Waveshare orders below are committed V1-PROOF spend. The previous stair budget is [parked](archive/stair-v1/bom.md).

**Recorded paid spend: $143.12. Remaining against the planning ceiling: $756.88.** Remaining money includes all unfinished purchases and reserves; it is not a completion quote.

## What is coming

| Vendor / ordered part | Ordered quantity | Unit paid | Goods total | Order status |
| --- | ---: | ---: | ---: | --- |
| Pololu 4752 · 30:1 12 V encoder gearmotor | 1 | $60.95 | $60.95 | Shipped |
| Pololu 4035 · DRV8874 motor driver | 1 | $11.94 | $11.94 | Shipped |
| Waveshare 22414 · ST3215 servo series (12 V per user) | 2 | $21.19 | $42.38 | Paid; awaiting shipment |

- **Pololu:** Shipped 28 September via UPS Ground. Shipment email estimates Thursday 1 October; not a live tracking check.
- **Waveshare:** Paid; latest vendor receipt says awaiting shipment. No dispatch or delivery date confirmed. Tax is not separately charged in this receipt.

**Wheel orders: 1 of 2 motors and 1 of 2 drivers. Still needed: 1 motor and 1 driver.** The first restrained bench channel is ordered; the second wheel channel is still required. Leg orders: 2 of 2 ST3215 servos; 0 still needed. Verify their 12 V labels on arrival: the receipt names the ST3215 series and the user confirmed the voltage variant. [Motor connections and controls](v1-proof-hardware.md).

## Paid orders

| Vendor / paid date | Goods | Shipping / handling | Tax | Total paid |
| --- | ---: | ---: | ---: | ---: |
| Pololu / 2026-09-28 | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare / 2026-09-28 | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| **Recorded spend** | **$115.27** | **$22.85** | **$5.00** | **$143.12** |

Receipt amounts are authoritative for recorded purchases; reference prices below are historical. A payment-service confirmation corroborates its vendor order and is not counted again. Missing amounts stay unrecorded, never zero. See [purchase evidence](purchases.md) for the September 29 reconciliation and the [inventory](parts-on-hand.md) for delivery and qualification gates.

## Remaining planning allocations

| Allocation | Not yet spent |
| --- | ---: |
| Parts and fixture allowance | $559.73 |
| Shipping, tax and import-charge allowance | $72.15 |
| Repair and overrun reserve retained | $125.00 |
| **Remaining against the planning ceiling** | **$756.88** |

The controller, IMU, servo interface, encoder level conversion, current-limit passives, wheels/hubs, protected power and wiring still need inventory or receipt confirmation. Bench-supply ratings remain unconfirmed. Historical carts and unassigned V0-GENESIS parts are not recorded V1-PROOF spending.

## Original planning caps

These maximum allocations are retained for comparison with actual spending; they are not a fully quoted remaining cart. Delivery, import charges and unpurchased rows need current quotes. Existing shop tools and unpaid fabrication labor are assumed; new tools or outsourced work must fit this same total or the design must change. See the [hardware decisions](v1-proof-hardware.md).

**No free inventory is assumed.** Confirmed reuse credit is $0. The quantities below are planned build quantities, not ordered quantities. Paid purchases already consume these allocations; do not add their cost to the $900 ceiling or subtract them again as free reuse. Credit qualified existing equipment only when it displaces a purchase; retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.

| Qty | Item | Unit cap | Total cap | Stage |
| ---: | --- | ---: | ---: | --- |
| 2 | [Pololu 4752 12 V 30:1 encoder gearmotors](https://www.pololu.com/product/4752) | $62.50 | $125.00 | P1 |
| 2 | [Pololu 4035 DRV8874 carriers + current-limit passives](https://www.pololu.com/product/4035) | $20.00 | $40.00 | P1 |
| 2 | [Waveshare ST3215, 12 V variant (9 V qualified rail)](https://www.waveshare.com/product/st3215-servo.htm) | $30.00 | $60.00 | P3 |
| 1 | Two 3:1 reductions, shafts, pivots, bearings, stops and lock pins | $60.00 | $60.00 | P3 |
| 1 | Two rubber wheels, hubs and supported axle hardware | $35.00 | $35.00 | P1 |
| 1 | Pico 2, LSM6DSOX and half-duplex servo interface | $40.00 | $40.00 | P0 |
| 1 | Manual input/link replacement allowance | $60.00 | $60.00 | P0 |
| 1 | Compatible 3S battery | $35.00 | $35.00 | P1 |
| 1 | Compatible balance charger, supply and lead | $45.00 | $45.00 | P1 |
| 1 | 9 V servo and 5 V logic rails, fuse, kill, regeneration protection | $65.00 | $65.00 | P1 |
| 1 | Wire, connectors, encoder level shifting and strain relief | $30.00 | $30.00 | P1 |
| 1 | Scrap/COTS frame, links, brackets, fasteners and prototype material | $60.00 | $60.00 | P1 |
| 1 | Catch frame, rest skids and padding materials | $20.00 | $20.00 | P1 |
| | **Parts and fixture subtotal** | | **$675.00** | |
| | Shipping, sales tax and any import charges | | $100.00 | Reserved |
| | Repairs, replacement parts and overrun reserve | | $125.00 | Reserved |
| | **Total** | | **$900.00** | |

The difference to $1,000 is $100; spending the entire difference would violate the strictly-under-$1,000 requirement. Prefer savings from reuse; do not turn them into added features.

## Historical reference prices and scope

The following price and availability observations were checked **2026-09-28**. They are not current stock checks or evidence of further purchases; the receipt table above controls actual spend.

- Pololu 4752: reference price $60.95 each; two selected encoder motors fit the $125 allocation. Current purchased quantities and remaining needs are calculated above.
- Pololu 4035 DRV8874: reference $11.94 each; two carriers plus current-limit passives fit the $40 allowance. Current-limit passives still need confirmation; measure the 2.5 A limit. The historical stock page allowed backorders; this replaces the oversized G2 reference.
- Waveshare ST3215 series: reference listing $16.99–21.99 depending on variant; receipt prices are recorded above. Qualify holding performance on the regulated 9 V rail. The $60 allocation remains the original cap, with a separate transmission row.
- Pico 2 + Adafruit LSM6DSOX 4438 + half-duplex adapter share the $40 controller allowance. The IMU reference was $11.95 and out of stock; board/interface costs and availability still need a current complete quote.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 inventories and qualifies existing controls. P1 builds the supported wheel rig and pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos/reductions. P4 runs the finish-line trials. These stages share one budget; do not add a second two-motor robot to the four-motor cost. Quotes exceeding an allocation consume the reserve or force a substitution before purchase.

Sources: planning caps in [model.json](../tools/v1-proof/model.json); paid orders in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`; [receipt provenance](purchases.md). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
