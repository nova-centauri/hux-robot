# V1-PROOF recorded orders and delivery status

**Updated 2026-10-03: $173.70 recorded spend.** The user confirms the **Pico 2 and SparkFun LSM6DSO Qwiic IMU are both received**, untested. Their October 2 Amazon order totals **$30.58** in the supplied screenshot, counted once alongside the earlier $143.12 in Pololu and Waveshare receipts. This receipt confirmation supersedes the screenshot arrival estimate. Item prices, shipping, tax and payment date are not shown for the Amazon order. **$726.30 remains** under the $900 plan. [Pico/IMU bring-up](checklists/2026-10-03-pico-bringup.md) · [Remaining shopping list](bom.md#remaining-shopping-list).

**2026-10-02 mechanical arrival:** the user reports the 30:1 metal gearmotor and DRV8874 drivers received. The paid order covers one motor and one driver; total delivered driver count remains to confirm. Parts are also reported 3D printed. Fit, firmware and physical performance remain WIP. [First mechanical fit session](checklists/2026-10-02-mechanical-fit.md).

## Ordered parts and delivery

| Vendor / part | Ordered quantity | Unit paid | Goods total | Latest evidence |
| --- | ---: | ---: | ---: | --- |
| Pololu **4752**, 30:1 Metal Gearmotor 37Dx68L mm, 12 V, 64 CPR encoder, helical pinion | **1** | $60.95 | $60.95 | Received per user report recorded 2026-10-02; untested |
| Pololu **4035**, DRV8874 Single Brushed DC Motor Driver Carrier | **1** | $11.94 | $11.94 | Drivers received per user 2026-10-02; total received count pending; untested |
| Waveshare **22414**, ST3215 servo series; **12 V variant confirmed by user** | **2** | $21.19 | $42.38 | Paid 2026-09-28; vendor receipt says **Awaiting Shipment** |
| Pico 2 with yellow pre-soldered headers, via Amazon | **1** | Not recorded | Not recorded | Received per user and screenshot 2026-10-03; untested |
| SparkFun **LSM6DSO Qwiic** IMU, via Amazon | **1** | Not recorded | Not recorded | Received per user confirmation 2026-10-03; untested |

The September 28 Pololu shipment notification estimated **Thursday, October 1, 2026** delivery. The user's report recorded October 2 now establishes receipt; the exact delivery date and a carrier tracking check are not recorded. No servo dispatch or arrival date is established by the available records. Inspect the servo labels: the receipt names the ST3215 series, while the 12 V choice comes from the user's September 29 confirmation.

## Recorded spend

| Paid order | Goods | Shipping / handling | Tax | Total paid |
| --- | ---: | ---: | ---: | ---: |
| Pololu, 2026-09-28 | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare, 2026-09-28 | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| Amazon, ordered 2026-10-02; payment date unshown | Not recorded | Not recorded | Not recorded | **$30.58** order total |
| **Recorded V1-PROOF spend** | **Not recorded** | **Not recorded** | **Not recorded** | **$173.70** |

The Pololu invoice explicitly records $88.34 paid and $0 due. Waveshare's payment confirmation and the corresponding PayPal receipt both record $54.78. Do not add the payment-service confirmation as a second purchase.

The two earlier orders have a known breakdown of $115.27 goods, $22.85 shipping and $5.00 tax. The new screenshot supplies only a combined order total; do not infer individual prices or treat missing charges as zero. Record its $30.58 once in the order ledger; leave purchase-card goods costs unknown.

Against the **$900 planning ceiling**, **$726.30 remains**, including everything still to buy and retained reserves. With the **$125 repair reserve intact**, $601.30 remains for parts and shipping/tax combined; their exact separate balances are unknown until the Amazon breakdown is available. These are remaining allocations, not a quote for completing the robot. The hard all-in limit remains strictly below $1,000. [Full budget](bom.md).

## What this locks into the design

- **The first wheel channel:** the received 4752 connects through a harness to a received 4035 driver after identification and electrical checks. The motor's encoder feeds the Pico through level conversion. [Connection plan](v1-proof-hardware.md).
- **The two leg actuators:** the two ST3215 servos define the planned reduced leg drive, subject to arrival-label and 9 V mounted-load qualification.
- **The full robot:** still two wheel motors, two drivers and two leg servos. **Paid receipts cover one wheel motor and one driver**; the second wheel motor is still required. Confirm the delivered driver count and any additional order before buying another driver. The one-channel bench is part of the same robot budget.
- **Controller and IMU:** one Pico 2 and one SparkFun LSM6DSO IMU are received, untested; the received LSM6DSO replaces the earlier Adafruit LSM6DSOX selection, subject to arrival identification and qualification. Start with USB/LED checks, then raw sensor readback and timing. [Connection baseline](v1-proof-hardware.md).
- **Supporting parts:** servo bus interface, encoder level shifting, current-limit passives, wheels/hubs, protected power and wiring still require inventory/receipt confirmation. An available bench supply has not yet been rated or qualified.

An ordered part is a design commitment, not proof of delivered quantity, mechanical fit or tested capability. Reopen a component choice explicitly if bench evidence rejects it; do not silently substitute another actuator family. [Inventory](parts-on-hand.md) · [Control architecture](software.md) · [Single-leg bench](one-leg-bench.md).

## Evidence and maintenance

Read-only reconciliation of the September 28 Pololu processing/shipment emails, the UPS shipment notification, the Waveshare payment confirmation and the matching PayPal receipt. Reviewed September 29, 2026. The user's September 29 clarification supplies the ST3215 voltage variant. Private receipts remain in the mailbox; order identifiers, addresses, payment details and tracking links are intentionally omitted from this public repository.

The user's October 2 report establishes motor/driver receipt and completed printing. It supplies no new quantity breakdown, payment, inspection result or test measurement. Receipt quantities and amounts are retained; any additional driver and print costs remain unrecorded.

The user's October 3 report and supplied Amazon order screenshot establish Pico receipt and the $30.58 October 2 controller/IMU order. The screenshot lists the Pico and SparkFun LSM6DSO; manufacturer specifications identify the named breakout as SEN-18020, with the received label still to verify. The user subsequently confirms both the Pico and IMU received on the October 3 record, superseding the relative delivery estimate. Exact carrier delivery time remains unrecorded. No new board or sensor test is reported. Private account details, order identifier and the unredacted screenshot are omitted from this public repository.

The published order records are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. Purchase-card `actualCost` is the goods-only line total; `orders[].paidTotal` includes that order's recorded shipping/tax. The budget generator and homepage both use those order records. Update this evidence summary and the inventory alongside changes. Keep unknown amounts as `null`; never turn a reference price or an unconfirmed legacy purchase into paid V1-PROOF spend.
