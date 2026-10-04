# V1-PROOF budget

**$900 planned ceiling. The ceiling includes shipping, tax and the repair contingency.** The hard limit is strictly under $1,000. The recorded orders below are committed V1-PROOF spend. The previous stair budget is [parked](archive/stair-v1/bom.md).

**Recorded spend: $173.70. Remaining against the planning ceiling: $726.30.** The remaining money includes all unfinished purchases and the reserves. It is not a quote for completion.

## Ordered parts and delivery

| Vendor / ordered part | Ordered quantity | Unit paid | Goods total | Order status |
| --- | ---: | ---: | ---: | --- |
| Pololu 4752 · 30:1 12 V encoder gearmotor | 1 | $60.95 | $60.95 | Received; untested |
| Pololu 4035 · DRV8874 motor driver | 1 | $11.94 | $11.94 | Received; untested |
| Waveshare 22414 · ST3215 servo series (12 V per user) | 2 | $21.19 | $42.38 | Paid; awaiting shipment |
| Amazon Pico 2 with yellow pre-soldered headers | 1 | Not recorded | Not recorded | Received; untested |
| Amazon SparkFun LSM6DSO Qwiic IMU | 1 | Not recorded | Not recorded | Received; untested |

- **Pololu:** The user report recorded 2 October says that the gearmotor and the DRV8874 drivers are received. The exact delivery date, the total driver count, the labels and the inspection remain unrecorded. This paid receipt covers one gearmotor and one driver. The order shipped 28 September via UPS Ground.
- **Waveshare:** Paid. The latest vendor receipt says that the order is not yet shipped. No dispatch or delivery date is confirmed. This receipt does not charge tax separately.
- **Amazon:** The supplied screenshot shows the order placed 2 October with a $30.58 total. The user confirmation recorded 3 October says that both the Pico 2 and the LSM6DSO IMU are received, untested. This confirmation supersedes the screenshot arrival estimate. The item prices, shipping, tax and payment date are not shown.

**Recorded wheel orders cover 1 of 2 motors and 1 of 2 drivers. Not covered by recorded orders: 1 motor and 1 driver.** The first restrained bench channel is ordered. The second wheel channel is still required. Confirm the total received driver count before you buy another driver.

Recorded leg orders cover 2 of 2 ST3215 servos, with 0 still needed. When the servos arrive, make sure that the labels say 12 V. The receipt names the ST3215 series. The user confirmed the voltage variant. [Motor connections and controls](v1-proof-hardware.md).

## Recorded order totals

| Vendor / recorded date | Goods | Shipping / handling | Tax | Order total |
| --- | ---: | ---: | ---: | ---: |
| Pololu / 2026-09-28 (paid) | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare / 2026-09-28 (paid) | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| Amazon / 2026-10-02 (ordered) | Not recorded | Not recorded | Not recorded | **$30.58** |
| **Recorded spend** | **Not recorded** | **Not recorded** | **Not recorded** | **$173.70** |

Recorded order totals count each purchase one time. The reference prices below are historical. A payment-service confirmation confirms its vendor order, and we do not count it again. An order-placement date does not establish the payment date. Missing amounts stay unrecorded, never zero. An order total without itemized charges can establish the overall spend while the separate goods and shipping/tax balances remain unknown.

Refer to the [purchase evidence](purchases.md) and the [inventory](parts-on-hand.md) for the delivery and qualification gates.

## Remaining planning allocations

| Allocation | Not yet spent |
| --- | ---: |
| Parts and fixture allowance | Not recorded |
| Shipping, tax and import-charge allowance | Not recorded |
| Repair and overrun reserve retained | $125.00 |
| **Remaining against the planning ceiling** | **$726.30** |

Refer to the inventory for the controller and IMU receipt status. The servo interface, encoder level conversion, current-limit passives, wheels/hubs, protected power and wire harness still need confirmation. Bench-supply ratings remain unconfirmed. Historical carts and unassigned V0-GENESIS parts are not recorded V1-PROOF spend.

## Remaining shopping list

The Pico 2 and the LSM6DSO IMU are received and paid. Two ST3215 servos are also already paid, with arrival unreported. The order ledger above records the other paid parts. Confirm the stock of the support parts before you buy replacements.

| Part / assembly | What remains | Next step |
| --- | --- | --- |
| Pololu 4752 encoder wheel motor | 1 more motor. The complete drive requires two wheel gearmotors of the same model. | Still to buy |
| DRV8874 wheel driver and current-limit passives | Confirm coverage for 2 wheel channels. The receipt covers one driver. The total received count is unconfirmed. Buy a second Pololu 4035 only if one is missing. The current-limit passives still need confirmation. | Check stock first |
| Compatible half-duplex TTL servo interface | 1 interface. The Pico 2 and the IMU are received. The ST3215 bus adapter is a separate part with no confirmed purchase or stock. | Check stock first |
| Rubber wheels, hubs and supported axle hardware | 2 wheel assemblies. Approximately 100 mm wheels. The hubs and the axle support must fit the selected gearmotor and layout. No stock is reserved. | Check stock first |
| Leg reductions, shafts, pivots, bearings, stops and lock pins | Hardware for both legs. Two 3:1 reductions are planned. The printed links are on hand. The transmission and pivot hardware still need inventory confirmation. | Check stock first |
| Manual input / deadman link | 1 usable control link. Confirm a laptop/gamepad or a compatible receiver/transmitter before you buy replacements. | Check stock first |
| Compatible 3S battery | 1 pack. The model, cell count and condition of the current pack are unconfirmed. Reuse a qualified pack or buy one. | Check stock first |
| Compatible balance charger, supply and charge lead | 1 charging setup. Confirm that the current charger and leads match the selected pack before you buy. | Check stock first |
| Regulators and protected power distribution | 9 V servo and 5 V logic rails, plus fuse, kill and return-energy protection. The bench supply is available, with ratings unconfirmed. The robot power/protection parts are not yet confirmed. | Check stock first |
| Wiring, connectors, encoder level shifting and strain relief | Harness for both wheel channels and the servo bus. Confirm the shop stock. The 5 V encoder signals require suitable 3.3 V level conversion. | Check stock first |
| Frame/bracket stock and mechanical fasteners | Remaining structure and assembly hardware. The user reports that the 3D print is complete. Confirm the printed fit and the available fasteners/frame stock before you buy more. | Check stock first |
| Catch frame, rest skids and padding | 1 test fixture / catch setup. Confirm usable shop materials and build the fixture before free-standing trials. | Check stock first |

The original planning caps below cover the full build allocations. The allocations include parts already bought. Missing parts still need quotes or confirmed reuse.

## Original planning caps

We keep these maximum allocations for comparison with the actual spend. They are not a fully quoted remaining cart. Delivery, import charges and unpurchased rows need current quotes. The plan assumes the shop tools on hand and unpaid fabrication labor. New tools or outsourced work must fit this same total, or the design must change. Refer to the [hardware decisions](v1-proof-hardware.md).

**The plan assumes no free inventory.** The confirmed reuse credit is $0. The quantities below are planned build quantities, not ordered quantities. Paid purchases already consume these allocations. Do not add their cost to the $900 ceiling, and do not subtract them again as free reuse.

Give credit for qualified equipment on hand only when it displaces a purchase. Retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.

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

The difference to $1,000 is $100. If you spend the full difference, you violate the strictly-under-$1,000 requirement. Prefer savings from reuse. Do not change savings into added features.

## Historical reference prices and scope

We checked the price and availability observations that follow on **2026-09-28**. They are not current stock checks or evidence of more purchases. The receipt table above controls the actual spend.

- Pololu 4752 gearmotor: the reference price is $60.95 each. Two of the selected encoder motors fit the $125 allocation. The report above calculates the current purchased quantities and the remaining needs.
- DRV8874 driver (Pololu 4035): the reference price is $11.94 each. Two carriers plus the current-limit passives fit the $40 allowance. The current-limit passives still need confirmation. Measure the 2.5 A limit. The historical stock page permitted backorders. This driver replaces the oversized G2 reference.
- ST3215 servo (Waveshare ST3215 series): the reference price is $16.99–21.99 as a function of the variant. The receipt prices are recorded above. Qualify the hold performance on the regulated 9 V rail. The $60 allocation remains the original cap, with a separate transmission row.
- The original allocation for the Pico 2, the Adafruit LSM6DSOX 4438 and the half-duplex adapter was $40. The IMU reference price on September 28 was $11.95. The October 2 controller/IMU order instead names the SparkFun LSM6DSO IMU. That order has a $30.58 combined total and no itemized charges. The servo interface remains unconfirmed. Keep the original cap and record the remaining costs separately.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 makes an inventory of the controls on hand and qualifies them. P1 builds the supported wheel rig and the pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos and their reductions. P4 runs the finish-line trials.

These stages share one budget. Do not add a second two-motor robot to the four-motor cost. A quote that exceeds an allocation consumes the reserve or forces a substitution before purchase.

Sources: the planning caps are in [model.json](../tools/v1-proof/model.json). The paid orders are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. Refer to the [receipt provenance](purchases.md). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
