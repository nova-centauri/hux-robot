# V1-PROOF budget

**$940 planned ceiling, including shipping, tax and repair contingency.** The hard limit is strictly under $1,000. No purchases made by this revision. The previous stair budget is [parked](archive/stair-v1/bom.md).

These are maximum allocations, not a fully quoted cart. Known motor/driver/servo references fit their rows at the listed prices checked 2026-09-28; stock, delivery, import charges and all other rows still need quotes. Existing shop tools and unpaid fabrication labor are assumed; new tools or outsourced work must fit this same total or the design must change.

**No free inventory is assumed.** Confirmed reuse credit is $0. Replace a row's cash cost only after the exact usable item is confirmed in [parts-on-hand.md](parts-on-hand.md); retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.

| Qty | Item | Unit cap | Total cap | Stage |
| ---: | --- | ---: | ---: | --- |
| 2 | [Encoder gearmotors, 12 V / 30:1 class](https://www.pololu.com/product/4752) | $62.50 | $125.00 | P1 |
| 2 | [Bidirectional H-bridges, current sensing and adjustable limiting](https://www.pololu.com/product/2991) | $50.00 | $100.00 | P1 |
| 2 | [Small position servos, ST3215 12 V class](https://www.waveshare.com/product/st3215-servo.htm) | $30.00 | $60.00 | P3 |
| 1 | Two 3:1 reductions, shafts, pivots, bearings, stops and lock pins | $60.00 | $60.00 | P3 |
| 1 | Two rubber wheels, hubs and supported axle hardware | $35.00 | $35.00 | P1 |
| 1 | MCU, IMU and servo interface allowance | $40.00 | $40.00 | P0 |
| 1 | Manual input/link replacement allowance | $60.00 | $60.00 | P0 |
| 1 | Compatible 3S battery | $35.00 | $35.00 | P1 |
| 1 | Compatible balance charger, supply and lead | $45.00 | $45.00 | P1 |
| 1 | Logic/servo regulation, fuse, kill, transient protection | $45.00 | $45.00 | P1 |
| 1 | Wire, connectors, encoder level shifting and strain relief | $30.00 | $30.00 | P1 |
| 1 | Scrap/COTS frame, links, brackets, fasteners and prototype material | $60.00 | $60.00 | P1 |
| 1 | Catch frame, rest skids and padding materials | $20.00 | $20.00 | P1 |
| | **Parts and fixture subtotal** | | **$715.00** | |
| | Shipping, sales tax and any import charges | | $100.00 | Reserved |
| | Repairs, replacement parts and overrun reserve | | $125.00 | Reserved |
| | **Total** | | **$940.00** | |

The difference to $1,000 is $60; spending the entire difference would violate the strictly-under-$1,000 requirement. Prefer savings from reuse; do not turn them into added features.

## Reference prices and scope

- Pololu 4752: $60.95 each; two encoder motors fit the $125 allocation. A reference for sizing, not an order.
- Pololu G2 18v17: $44.95 each; two fit the $100 driver allowance. Verify hardware current limiting at the intended low setting; the factory threshold does not protect these motors.
- Waveshare ST3215 series: listed $16.99–21.99 depending on variant. Two 12 V class servos fit the $60 allocation. Continuous holding performance is unverified; budget includes a separate transmission row.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 inventories and qualifies existing controls. P1 builds the supported wheel rig and pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos/reductions. P4 runs the finish-line trials. These stages share one budget; do not add a second two-motor robot to the four-motor cost. Quotes exceeding an allocation consume the reserve or force a substitution before purchase.

Source: [model.json](../tools/v1-proof/model.json). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
