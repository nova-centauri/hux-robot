# V1-PROOF paid orders and incoming parts

**Reconciled 2026-09-29: $143.12 paid.** This is new V1-PROOF project spend, including recorded shipping and tax. The purchased actuator models now define the bench design. Delivery, fit, firmware and physical performance remain WIP.

## What is coming

| Vendor / part | Ordered quantity | Unit paid | Goods total | Latest evidence |
| --- | ---: | ---: | ---: | --- |
| Pololu **4752**, 30:1 Metal Gearmotor 37Dx68L mm, 12 V, 64 CPR encoder, helical pinion | **1** | $60.95 | $60.95 | Shipped 2026-09-28, UPS Ground |
| Pololu **4035**, DRV8874 Single Brushed DC Motor Driver Carrier | **1** | $11.94 | $11.94 | Same shipment as the motor |
| Waveshare **22414**, ST3215 servo series; **12 V variant confirmed by user** | **2** | $21.19 | $42.38 | Paid 2026-09-28; vendor receipt says **Awaiting Shipment** |

The Pololu shipment notification estimates **Thursday, October 1, 2026** delivery. This is the estimate in the September 28 email, not a current carrier tracking check or a confirmed arrival. No servo dispatch or arrival date is established by the available records. Inspect the servo labels: the receipt names the ST3215 series, while the 12 V choice comes from the user's September 29 confirmation.

## What has been spent

| Paid order | Goods | Shipping / handling | Tax | Total paid |
| --- | ---: | ---: | ---: | ---: |
| Pololu, 2026-09-28 | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare, 2026-09-28 | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| **Recorded V1-PROOF spend** | **$115.27** | **$22.85** | **$5.00** | **$143.12** |

The Pololu invoice explicitly records $88.34 paid and $0 due. Waveshare's payment confirmation and the corresponding PayPal receipt both record $54.78. Do not add the payment-service confirmation as a second purchase.

Against the **$900 planning ceiling**, **$756.88 remains unspent**, including everything still to buy and retained reserves. The original $675 parts allowance has $559.73 not yet spent; the $100 shipping/tax allowance has $72.15 not yet spent; the **$125 repair reserve remains intact**. These are remaining allocations, not a quote for completing the robot. The hard all-in limit remains strictly below $1,000. [Full budget](bom.md).

## What this locks into the design

- **The first wheel channel:** the incoming 4752 connects through a harness to the incoming 4035 driver. The motor's encoder feeds the Pico through level conversion. [Connection plan](v1-proof-hardware.md).
- **The two leg actuators:** the two ST3215 servos define the planned reduced leg drive, subject to arrival-label and 9 V mounted-load qualification.
- **The full robot:** still two wheel motors, two drivers and two leg servos. **Only one wheel motor and one driver are purchased**; the second wheel channel is still required. The one-channel bench is part of the same robot budget.
- **Controls and supporting parts:** Pico 2, LSM6DSOX, servo bus interface, encoder level shifting, current-limit passives, wheels/hubs, protected power and wiring still require inventory/receipt confirmation. An available bench supply has not yet been rated or qualified.

An ordered part is a design commitment, not proof of delivered quantity, mechanical fit or tested capability. Reopen a component choice explicitly if bench evidence rejects it; do not silently substitute another actuator family. [Inventory](parts-on-hand.md) · [Control architecture](software.md) · [Single-leg bench](one-leg-bench.md).

## Evidence and maintenance

Read-only reconciliation of the September 28 Pololu processing/shipment emails, the UPS shipment notification, the Waveshare payment confirmation and the matching PayPal receipt. Reviewed September 29, 2026. The user's September 29 clarification supplies the ST3215 voltage variant. Private receipts remain in the mailbox; order identifiers, addresses, payment details and tracking links are intentionally omitted from this public repository.

The published order records are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. Purchase-card `actualCost` is the goods-only line total; `orders[].paidTotal` includes that order's recorded shipping/tax. The budget generator and homepage both use those order records. Update this evidence summary and the inventory alongside changes. Keep unknown amounts as `null`; never turn a reference price or an unconfirmed legacy purchase into paid V1-PROOF spend.
