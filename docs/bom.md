# V1-PROOF budget

**$900 planned ceiling, including shipping, tax and repair contingency.** The hard limit is strictly under $1,000. The recorded orders below are committed V1-PROOF spend. The previous stair budget is [parked](archive/stair-v1/bom.md).

**Recorded spend: $173.70. Remaining against the planning ceiling: $726.30.** Remaining money includes all unfinished purchases and reserves; it is not a completion quote.

## Ordered parts and delivery

| Vendor / ordered part | Ordered quantity | Unit paid | Goods total | Order status |
| --- | ---: | ---: | ---: | --- |
| Pololu 4752 · 30:1 12 V encoder gearmotor | 1 | $60.95 | $60.95 | Received; untested |
| Pololu 4035 · DRV8874 motor driver | 1 | $11.94 | $11.94 | Received; untested |
| Waveshare 22414 · ST3215 servo series (12 V per user) | 2 | $21.19 | $42.38 | Paid; awaiting shipment |
| Amazon Pico 2 with yellow pre-soldered headers | 1 | Not recorded | Not recorded | Received; untested |
| Amazon SparkFun LSM6DSO Qwiic IMU | 1 | Not recorded | Not recorded | Received; untested |

- **Pololu:** Motor and DRV8874 drivers received per user report recorded 2 October; exact delivery date, total driver count, labels and inspection remain unrecorded. This paid receipt covers one motor and one driver. Shipped 28 September via UPS Ground.
- **Waveshare:** Paid; latest vendor receipt says awaiting shipment. No dispatch or delivery date confirmed. Tax is not separately charged in this receipt.
- **Amazon:** Order placed 2 October, total $30.58 in the supplied screenshot. Both the Pico 2 and SparkFun LSM6DSO IMU are received per user confirmation recorded 3 October; untested. This supersedes the screenshot arrival estimate. Item prices, shipping, tax and payment date are not shown.

**Wheel orders: 1 of 2 motors and 1 of 2 drivers. Not covered by recorded orders: 1 motor and 1 driver.** The first restrained bench channel is ordered; the second wheel channel is still required. Confirm total received driver count before buying another driver. Leg orders: 2 of 2 ST3215 servos; 0 still needed. Verify their 12 V labels on arrival: the receipt names the ST3215 series and the user confirmed the voltage variant. [Motor connections and controls](v1-proof-hardware.md).

## Recorded order totals

| Vendor / recorded date | Goods | Shipping / handling | Tax | Order total |
| --- | ---: | ---: | ---: | ---: |
| Pololu / 2026-09-28 (paid) | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare / 2026-09-28 (paid) | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| Amazon / 2026-10-02 (ordered) | Not recorded | Not recorded | Not recorded | **$30.58** |
| **Recorded spend** | **Not recorded** | **Not recorded** | **Not recorded** | **$173.70** |

Recorded order totals count each purchase once; reference prices below are historical. A payment-service confirmation corroborates its vendor order and is not counted again. An order-placement date does not establish its payment date. Missing amounts stay unrecorded, never zero: an unitemized order total can establish overall spend while separate goods and shipping/tax balances remain unknown. See [purchase evidence](purchases.md) and the [inventory](parts-on-hand.md) for delivery and qualification gates.

## Remaining planning allocations

| Allocation | Not yet spent |
| --- | ---: |
| Parts and fixture allowance | Not recorded |
| Shipping, tax and import-charge allowance | Not recorded |
| Repair and overrun reserve retained | $125.00 |
| **Remaining against the planning ceiling** | **$726.30** |

See the inventory for controller and IMU receipt status. The servo interface, encoder level conversion, current-limit passives, wheels/hubs, protected power and wiring still need confirmation. Bench-supply ratings remain unconfirmed. Historical carts and unassigned V0-GENESIS parts are not recorded V1-PROOF spending.

## Remaining shopping list

Pico 2 and SparkFun LSM6DSO IMU are received and paid for; two ST3215 servos are also already paid, with arrival unreported. Other paid parts are recorded in the order ledger above. Confirm stock for the supporting parts before buying replacements.

| Part / assembly | What remains | Next step |
| --- | --- | --- |
| Pololu 4752 encoder wheel motor | 1 more motor. Two matching wheel motors are required for the complete drive. | Still to buy |
| DRV8874 wheel driver and current-limit passives | Confirm coverage for 2 wheel channels. Receipt covers one driver; total received count is unconfirmed. Buy a second Pololu 4035 only if missing. Current-limit passives still need confirmation. | Check stock first |
| Compatible half-duplex TTL servo interface | 1 interface. Pico and IMU are received. The ST3215 bus adapter is a separate part with no confirmed purchase or stock. | Check stock first |
| Rubber wheels, hubs and supported axle hardware | 2 wheel assemblies. Approximately 100 mm wheels; hubs and axle support must fit the selected motor and layout. No stock is reserved. | Check stock first |
| Leg reductions, shafts, pivots, bearings, stops and lock pins | Hardware for both legs. Two 3:1 reductions are planned. Printed links are on hand; transmission and pivot hardware still need inventory confirmation. | Check stock first |
| Manual input / deadman link | 1 usable control link. Confirm a laptop/gamepad or compatible receiver/transmitter before buying replacements. | Check stock first |
| Compatible 3S battery | 1 pack. Existing pack model, cell count and condition are unconfirmed; reuse a qualified pack or buy one. | Check stock first |
| Compatible balance charger, supply and charge lead | 1 charging setup. Confirm the existing charger and leads match the chosen pack before buying. | Check stock first |
| Regulators and protected power distribution | 9 V servo and 5 V logic rails; fuse, kill and return-energy protection. Bench supply is available, with ratings unconfirmed. The robot power/protection parts are not yet confirmed. | Check stock first |
| Wiring, connectors, encoder level shifting and strain relief | Harness for both wheel channels and the servo bus. Confirm shop stock; 5 V encoder signals require suitable 3.3 V level conversion. | Check stock first |
| Frame/bracket stock and mechanical fasteners | Remaining structure and assembly hardware. 3D printing is reported complete. Confirm printed fit and available fasteners/frame stock before buying more. | Check stock first |
| Catch frame, rest skids and padding | 1 test fixture / catch setup. Confirm usable shop materials and build the fixture before free-standing trials. | Check stock first |

Original planning caps below cover the full build allocations, including parts already bought. Missing parts still need quotes or confirmed reuse.

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
| 1 | Pico 2, SparkFun LSM6DSO and half-duplex servo interface | $40.00 | $40.00 | P0 |
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
- The original Pico 2 + Adafruit LSM6DSOX 4438 + half-duplex adapter allocation was $40, with an $11.95 IMU reference on September 28. The October 2 controller/IMU order instead names SparkFun LSM6DSO, with a $30.58 combined total and no itemized charges. The servo interface remains unconfirmed; preserve the original cap and record remaining costs separately.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 inventories and qualifies existing controls. P1 builds the supported wheel rig and pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos/reductions. P4 runs the finish-line trials. These stages share one budget; do not add a second two-motor robot to the four-motor cost. Quotes exceeding an allocation consume the reserve or force a substitution before purchase.

Sources: planning caps in [model.json](../tools/v1-proof/model.json); paid orders in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`; [receipt provenance](purchases.md). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
