# V1-PROOF recorded orders and delivery status

**Updated 2026-10-03: $173.70 recorded spend.** The user confirms that the **Pico 2 and LSM6DSO IMU are both received**, untested. The October 2 Amazon order of the user totals **$30.58** in the supplied screenshot. We count this total one time, together with the earlier $143.12 in Pololu and Waveshare receipts. This receipt confirmation supersedes the screenshot arrival estimate.

The Amazon order does not show the item prices, shipping, tax and payment date. **$726.30 remains** under the $900 plan. [Pico/IMU bring-up](checklists/2026-10-03-pico-bringup.md) · [Remaining shopping list](bom.md#remaining-shopping-list).

**2026-10-02 mechanical arrival:** the user reports that the 30:1 metal gearmotor and the DRV8874 drivers are received. The paid order covers one motor and one driver. The total delivered driver count remains to confirm. The user also reports that the parts are 3D printed. Fit, firmware and physical performance remain WIP. [First mechanical fit session](checklists/2026-10-02-mechanical-fit.md).

## Ordered parts and delivery

| Vendor / part | Ordered quantity | Unit paid | Goods total | Latest evidence |
| --- | ---: | ---: | ---: | --- |
| Pololu **4752**, 30:1 Metal Gearmotor 37Dx68L mm, 12 V, 64 CPR encoder, helical pinion | **1** | $60.95 | $60.95 | Received per user report recorded 2026-10-02; untested |
| Pololu **4035**, DRV8874 Single Brushed DC Motor Driver Carrier | **1** | $11.94 | $11.94 | Drivers received per user 2026-10-02; total received count pending; untested |
| Waveshare **22414**, ST3215 servo series; **12 V variant confirmed by user** | **2** | $21.19 | $42.38 | Paid 2026-09-28; vendor receipt says **Awaiting Shipment** |
| Pico 2 with yellow pre-soldered headers, via Amazon | **1** | Not recorded | Not recorded | Received per user and screenshot 2026-10-03; untested |
| SparkFun **LSM6DSO Qwiic** IMU, via Amazon | **1** | Not recorded | Not recorded | Received per user confirmation 2026-10-03; untested |

The September 28 Pololu shipment notification estimated delivery on **Thursday, October 1, 2026**. The report of the user, recorded October 2, now establishes receipt. The exact delivery date and a carrier tracking check are not recorded. The available records do not establish a servo dispatch date or arrival date. Inspect the servo labels. The receipt names the ST3215 series, but the 12 V choice comes from the September 29 confirmation of the user.

## Recorded spend

| Paid order | Goods | Shipping / handling | Tax | Total paid |
| --- | ---: | ---: | ---: | ---: |
| Pololu, 2026-09-28 | $72.89 | $10.45 | $5.00 | **$88.34** |
| Waveshare, 2026-09-28 | $42.38 | $12.40 | $0.00 separately charged | **$54.78** |
| Amazon, ordered 2026-10-02; payment date unshown | Not recorded | Not recorded | Not recorded | **$30.58** order total |
| **Recorded V1-PROOF spend** | **Not recorded** | **Not recorded** | **Not recorded** | **$173.70** |

The Pololu invoice explicitly records $88.34 paid and $0 due. The Waveshare payment confirmation and the PayPal receipt for that order both record $54.78. Do not add the payment-service confirmation as a second purchase.

The two earlier orders have a known breakdown of $115.27 goods, $22.85 shipping and $5.00 tax. The new screenshot supplies only a combined order total. Do not infer individual prices, and do not treat missing charges as zero. Record its $30.58 one time in the order ledger. Leave the purchase-card goods costs unknown.

Against the **$900 planning ceiling**, **$726.30 remains**. This amount includes everything still to buy and the retained reserves. With the **$125 repair reserve intact**, $601.30 remains for parts and shipping/tax combined. Their exact separate balances are unknown until the Amazon breakdown is available. These are remaining allocations, not a quote to complete the robot.

The hard all-in limit remains strictly below $1,000. [Full budget](bom.md).

## What this locks into the design

- **The first wheel channel:** the received Pololu 4752 gearmotor connects through a harness to a received DRV8874 driver. Connect them after the identification and electrical checks. The encoder of the gearmotor feeds the Pico 2 through level conversion. [Connection plan](v1-proof-hardware.md).
- **The two leg actuators:** the two ST3215 servos define the planned reduced leg drive. This choice is subject to the arrival-label check and the 9 V mounted-load qualification.
- **The full robot:** still two wheel motors, two drivers and two leg servos. **Paid receipts cover one wheel motor and one driver.** The second wheel motor is still required. Confirm the delivered driver count and any more orders before you buy another driver. The one-channel bench is part of the same robot budget.
- **Controller and IMU:** one Pico 2 and one LSM6DSO IMU are received, untested. The received LSM6DSO IMU replaces the earlier Adafruit LSM6DSOX selection. This replacement is subject to arrival identification and qualification. Start with the USB/LED checks, then do the raw sensor readback and the timing check. [Connection baseline](v1-proof-hardware.md).
- **Support parts:** the servo bus interface, encoder level conversion, current-limit passives, wheels/hubs, protected power and wire harness still need inventory/receipt confirmation. A bench supply is available, but it is not yet rated or qualified.

An ordered part is a design commitment, not proof of delivered quantity, mechanical fit or tested capability. If bench evidence rejects a component choice, reopen that choice explicitly. Do not silently substitute another actuator family. [Inventory](parts-on-hand.md) · [Control architecture](software.md) · [Single-leg bench](one-leg-bench.md).

## Evidence and maintenance

This record is a read-only reconciliation of these sources: the September 28 Pololu order and shipment e-mails, the UPS shipment notification, the Waveshare payment confirmation and the PayPal receipt for the Waveshare order. We reviewed them on September 29, 2026. The September 29 clarification of the user supplies the ST3215 voltage variant.

Private receipts remain in the mailbox. We intentionally omit order identifiers, addresses, payment details and tracking links from this public repository.

The October 2 report of the user establishes the motor/driver receipt and the completed 3D printing. It supplies no new quantity breakdown, payment, inspection result or test measurement. We keep the receipt quantities and amounts. Any more driver costs and the print costs remain unrecorded.

The October 3 report of the user and the supplied Amazon order screenshot establish two facts. They establish the Pico 2 receipt and the $30.58 October 2 controller/IMU order. The screenshot lists the Pico 2 and the SparkFun LSM6DSO. The manufacturer specifications identify the named breakout as SEN-18020. The received label is still to verify.

The user then confirms, on the October 3 record, that both the Pico 2 and the IMU are received. This confirmation supersedes the relative delivery estimate.

The exact carrier delivery time remains unrecorded. No new board test or sensor test is reported. We omit the private account details, the order identifier and the unredacted screenshot from this public repository.

The published order records are in [plan-data.json](../tools/living-drawings/plan-data.json), under V1-PROOF `orders`. The purchase-card `actualCost` is the goods-only line total. The `orders[].paidTotal` includes the recorded shipping/tax of that order. The budget generator and the homepage both use those order records. Update this evidence summary and the inventory in the same change as the order records. Keep unknown amounts as `null`.

Never change a reference price or an unconfirmed legacy purchase into paid V1-PROOF spend.
