# V1-PROOF budget

**$900 planned ceiling. The ceiling includes shipping, tax and the repair contingency.** The hard limit is strictly under $1,000. The recorded orders below are committed V1-PROOF spend. The previous stair budget is [parked](archive/stair-v1/bom.md).

**Recorded spend: $195.94. Remaining against the planning ceiling: $704.06.** The remaining money includes all unfinished purchases and the reserves. It is not a quote for completion.

## Ordered parts and delivery

| Vendor / ordered part | Ordered quantity | Unit paid | Goods total | Order status |
| --- | ---: | ---: | ---: | --- |
| Pololu 4752 · 30:1 12 V encoder gearmotor | 1 | $60.95 | $60.95 | Received; untested |
| Pololu 4035 · DRV8874 motor driver | 1 | $11.94 | $11.94 | Received; untested |
| Waveshare 22414 · ST3215 servo series (12 V per user) | 2 | $21.19 | $42.38 | Received; untested |
| Amazon Pico 2 with yellow pre-soldered headers | 1 | Not recorded | Not recorded | Received; untested |
| Amazon SparkFun LSM6DSO Qwiic IMU | 1 | Not recorded | Not recorded | Received; untested |
| Vendor not recorded DC step-down converters, 5-pack | 5 | Not recorded | Not recorded | Paid; delivery unconfirmed |
| Waveshare Servo bus driver board | 1 | Not recorded | Not recorded | Paid; delivery unconfirmed |

- **Pololu:** The user report recorded 2 October says that the gearmotor and the DRV8874 drivers are received. The exact delivery date, the total driver count, the labels and the inspection remain unrecorded. This paid receipt covers one gearmotor and one driver. The order shipped 28 September via UPS Ground.
- **Waveshare:** Paid. The user reports that the two servos are received on 15 October, with labels unchecked. They stay in stock for the next version, because V1-PROOF has no powered hips. This receipt does not charge tax separately.
- **Amazon:** The supplied screenshot shows the order placed 2 October with a $30.58 total. The user confirmation recorded 3 October says that both the Pico 2 and the LSM6DSO IMU are received, untested. This confirmation supersedes the screenshot arrival estimate. The item prices, shipping, tax and payment date are not shown.
- **Vendor not recorded:** The user reports $8.47 for a 5-pack of DC step-down converters, recorded 16 October. The vendor, the model, the output rating, the charge breakdown and the delivery status are not recorded.
- **Waveshare:** The user reports $13.77 for a Waveshare servo board, recorded 16 October. It is the half-duplex interface for the ST3215 servos, which are for the next version. The model, the charge breakdown and the delivery status are not recorded.

**Recorded wheel orders cover 1 of 2 motors and 1 of 2 drivers. Not covered by recorded orders: 1 motor and 1 driver.** The first restrained bench channel is ordered. The second wheel channel is still required. Confirm the total received driver count before you buy another driver.

Recorded leg orders cover 2 of 2 ST3215 servos, with 0 still needed. The servos are received and stay in stock for the next version, because V1-PROOF has no powered hips. Check that the labels say 12 V. [Motor connections and controls](v1-proof-hardware.md).

## Recorded order totals

| Vendor / recorded date | Goods | Shipping / handling | Tax | Order total |
| --- | ---: | ---: | ---: | ---: |
| Pololu / 2026-09-28 (paid) | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare / 2026-09-28 (paid) | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| Amazon / 2026-10-02 (ordered) | Not recorded | Not recorded | Not recorded | **$30.58** |
| Vendor not recorded / Not recorded | Not recorded | Not recorded | Not recorded | **$8.47** |
| Waveshare / Not recorded | Not recorded | Not recorded | Not recorded | **$13.77** |
| **Recorded spend** | **Not recorded** | **Not recorded** | **Not recorded** | **$195.94** |

Recorded order totals count each purchase one time. The reference prices below are historical. A payment-service confirmation confirms its vendor order, and we do not count it again. An order-placement date does not establish the payment date. Missing amounts stay unrecorded, never zero. An order total without itemized charges can establish the overall spend while the separate goods and shipping/tax balances remain unknown.

Refer to the [purchase evidence](purchases.md) and the [inventory](parts-on-hand.md) for the delivery and qualification gates.

## Remaining planning allocations

| Allocation | Not yet spent |
| --- | ---: |
| Parts and fixture allowance | Not recorded |
| Shipping, tax and import-charge allowance | Not recorded |
| Repair and overrun reserve retained | $202.62 |
| **Remaining against the planning ceiling** | **$704.06** |

On 2026-10-16, the hip drive allowance left the plan, and the servo row became the paid servo cost. The $77.62 difference moved to the repair and overrun reserve, so the planning ceiling stays $900. Refer to the inventory for the receipt status. The encoder level conversion, current-limit passives, wheels/hubs, protected power and wire harness still need confirmation. Bench-supply ratings remain unconfirmed. Historical carts and unassigned V0-GENESIS parts are not recorded V1-PROOF spend.

## Remaining shopping list

The Pico 2, the LSM6DSO IMU and two ST3215 servos are received and paid. The servos and the Waveshare servo board stay in stock for the next version. V1-PROOF still needs a second gearmotor, a second driver, two wheels with adapters and possibly a battery. Confirm the stock of the support parts before you buy replacements.

| Part / assembly | What remains | Next step |
| --- | --- | --- |
| Pololu 4752 encoder wheel motor | 1 more motor. The complete drive requires two wheel gearmotors of the same model. Buy one more: $60.95 goods, checked 2026-10-16. | Still to buy |
| DRV8874 wheel driver and current-limit passives | Confirm coverage for 2 wheel channels. R05 needs two drivers. The receipt covers one. Buy one more Pololu 4035: $11.94 goods, checked 2026-10-16. | Still to buy |
| Rubber wheels, hubs and supported axle hardware | 2 wheel assemblies. Two Pololu 3278 wheels, 100 × 24 mm, $8.86 each, and two Pololu 2674 adapters for the 6 mm shaft, $7.75 each. Goods only, checked 2026-10-16. | Still to buy |
| Leg reductions, shafts, pivots, bearings, stops and lock pins | Hardware for both legs. Next version only. V1-PROOF locks the legs at 30° with the printed lock links. | Future · unscoped |
| Manual input / deadman link | 1 usable control link. Confirm a laptop/gamepad or a compatible receiver/transmitter before you buy replacements. | Check stock first |
| Compatible 3S battery | 1 pack. Buy only if no compatible pack is on hand. Approximately 2.2 Ah, maximum 106 × 35 × 25 mm for the R05 tray. The model, cell count and condition of any current pack are unconfirmed. | Check stock first |
| Compatible balance charger, supply and charge lead | 1 charging setup. Confirm that the current charger and leads match the selected pack before you buy. | Check stock first |
| Regulators and protected power distribution | 9 V servo and 5 V logic rails, plus fuse, kill and return-energy protection. A 5-pack of DC step-down converters is bought, $8.47 per the user. Confirm their output and current rating against the 5 V logic rail. The fuse, the kill chain and the regeneration protection are not confirmed. | Check stock first |
| Wiring, connectors, encoder level shifting and strain relief | Harness for both wheel channels and the servo bus. Confirm the shop stock. The 5 V encoder signals require suitable 3.3 V level conversion. | Check stock first |
| Frame/bracket stock and mechanical fasteners | Remaining structure and assembly hardware. The R05 frame is printed and assembled, per the user. Confirm the M4 and M3 bolts, nuts and washers in the hardware table of the R05 assembly guide. | Check stock first |
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
| 2 | [Waveshare ST3215, 12 V variant, paid and kept for the next version](https://www.waveshare.com/product/st3215-servo.htm) | $21.19 | $42.38 | Next version |
| 1 | Two rubber wheels, hubs and supported axle hardware | $35.00 | $35.00 | P1 |
| 1 | Pico 2, SparkFun LSM6DSO and Waveshare servo bus board | $40.00 | $40.00 | P0 |
| 1 | Manual input/link replacement allowance | $60.00 | $60.00 | P0 |
| 1 | Compatible 3S battery | $35.00 | $35.00 | P1 |
| 1 | Compatible balance charger, supply and lead | $45.00 | $45.00 | P1 |
| 1 | 5 V logic rail, DC step-down converters, fuse, kill and regeneration protection | $65.00 | $65.00 | P1 |
| 1 | Wire, connectors, encoder level shifting and strain relief | $30.00 | $30.00 | P1 |
| 1 | Printed R05 body, lock links, brackets, fasteners and prototype material | $60.00 | $60.00 | P1 |
| 1 | Catch frame, rest skids and padding materials | $20.00 | $20.00 | P1 |
| | **Parts and fixture subtotal** | | **$597.38** | |
| | Shipping, sales tax and any import charges | | $100.00 | Reserved |
| | Repairs, replacement parts and overrun reserve | | $202.62 | Reserved |
| | **Total** | | **$900.00** | |

The difference to $1,000 is $100. If you spend the full difference, you violate the strictly-under-$1,000 requirement. Prefer savings from reuse. Do not change savings into added features.

## Historical reference prices and scope

We checked the price and availability observations that follow on **2026-09-28**. They are not current stock checks or evidence of more purchases. The receipt table above controls the actual spend.

- Pololu 4752 gearmotor: the reference price is $60.95 each. Two of the selected encoder motors fit the $125 allocation. The report above calculates the current purchased quantities and the remaining needs.
- DRV8874 driver (Pololu 4035): the reference price is $11.94 each. Two carriers plus the current-limit passives fit the $40 allowance. The current-limit passives still need confirmation. Measure the 2.5 A limit. The historical stock page permitted backorders. This driver replaces the oversized G2 reference.
- ST3215 servo (Waveshare ST3215 series): the reference price is $16.99–21.99 as a function of the variant. The receipt prices are recorded above. The servos are for the next version. The allocation now equals the paid goods, and the transmission row is removed.
- The original allocation for the Pico 2, the Adafruit LSM6DSOX 4438 and the half-duplex adapter was $40. The IMU reference price on September 28 was $11.95. The October 2 controller/IMU order instead names the SparkFun LSM6DSO IMU. That order has a $30.58 combined total and no itemized charges. The user reports a Waveshare servo board at $13.77 on 2026-10-16. Keep the original cap and record the remaining costs separately.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 makes an inventory of the controls on hand and qualifies them. P1 builds the supported wheel rig and the pinned structure. P2 proves two-wheel balance and slow teleop. P4 runs the finish-line trials. P3, the two leg servos and their reductions, moved to the next version on 2026-10-16.

These stages share one budget. Do not add a second robot to this cost. A quote that exceeds an allocation consumes the reserve or forces a substitution before purchase.

Sources: the planning caps are in [model.json](../tools/v1-proof/model.json). The paid orders are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. Refer to the [receipt provenance](purchases.md). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
