# V1-PROOF budget

**$900 planned ceiling, including shipping, tax and repair contingency.** The hard limit is strictly under $1,000. No purchases made by this revision. The previous stair budget is [parked](archive/stair-v1/bom.md).

These are maximum allocations, not a fully quoted cart. Selected motor/driver/servo parts fit their rows at prices checked 2026-09-28. Driver backorders and IMU stock remain procurement issues; delivery, import charges and remaining rows need quotes. Existing shop tools and unpaid fabrication labor are assumed; new tools or outsourced work must fit this same total or the design must change. See the [hardware decisions](v1-proof-hardware.md).

**No free inventory is assumed.** Confirmed reuse credit is $0. Replace a row's cash cost only after the exact usable item is confirmed in [parts-on-hand.md](parts-on-hand.md); retain the shipping/tax and repair reserves. A Pi, cameras, display and Jetson are outside this build.

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

## Reference prices and scope

- Pololu 4752: $60.95 each; two selected encoder motors fit the $125 allocation. No order placed.
- Pololu 4035 DRV8874: $11.94 each; two carriers plus current-limit passives fit the $40 allowance. Measure the 2.5 A limit; stock page allows backorders. This replaces the oversized G2 reference.
- Waveshare ST3215 series: listed $16.99–21.99 depending on variant. Select the 12 V variant; qualify holding performance on the regulated 9 V rail. Two fit the $60 allocation, with a separate transmission row.
- Pico 2 + Adafruit LSM6DSOX 4438 + half-duplex adapter share the $40 controller allowance. The IMU lists $11.95 and was out of stock; board/interface costs still need a complete quote.
- Manual input can reuse RC or a laptop/gamepad with a timed deadman link. The $60 fallback is an allocation, not a claim that a new TBS receiver and transmitter together cost $60.

## Build sequence

P0 inventories and qualifies existing controls. P1 builds the supported wheel rig and pinned structure. P2 proves two-wheel balance and slow teleop. P3 adds the two leg servos/reductions. P4 runs the finish-line trials. These stages share one budget; do not add a second two-motor robot to the four-motor cost. Quotes exceeding an allocation consume the reserve or force a substitution before purchase.

Source: [model.json](../tools/v1-proof/model.json). Regenerate with `python3 tools/v1-proof/review.py --write`. [Active plan](v1-proof.md) · [Inventory](parts-on-hand.md).
