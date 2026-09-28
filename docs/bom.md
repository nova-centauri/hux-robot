# Bill of materials — procurement review, 2026-09-28

**No Hux components purchased or ordered. No order is being placed.** Earlier order-now and free-inventory totals are superseded by Steve's clarification. Prior discussion of a cart was not evidence of purchase.

**Actuator-set purchase: HOLD.** The current stair design fails single-support/geometry gates. Read [the head and leg review](head-and-leg-review.md) before selecting parts. Ten actuators below are a costed research candidate, not a recommendation to buy all ten.

Complete candidate allowance: **$2,236–3,498**, before shipping/tax. These are **unverified planning prices**, not quotes. The old $1,140/$1,640 totals omitted or contradicted necessary items. All previously assumed shop stock, compute, receiver and charging equipment are included until ownership is confirmed.

The eight-motor reference was $1,120 at its old point estimates; two reference ankle motors add $320. Extra motors alone do not solve the stair mechanism. Hip/knee transmissions or replacement actuators may increase this budget. Labor, machining services and test fixtures are excluded. Jetson and seven-camera coverage are excluded.

| Qty | Item | Unit allowance | Line allowance | Stage / acceptance condition |
| ---: | --- | ---: | ---: | --- |
| 4 | RS02 reference actuators: two knees, two hip rolls | $145–200 | $580–800 | **HOLD** — hip roll and knee exceed bare RS02 stationary reference in the preferred 26-inch study; reduction/replacement or validated spring must be closed |
| 2 | RS00 hip pitch reference actuators | $150–180 | $300–360 | **HOLD** — 3.92 Nm gravity peak exceeds 3.6 Nm stationary reference; geometry and mounted duty required |
| 2 | RS05 wheel reference actuators | $100–130 | $200–260 | **HOLD** — independent wheel bearings, wheel inertia and continuous-turn firmware |
| 2 | Additional ankle-roll reference actuators for ten-axis study | $150–180 | $300–360 | **CANDIDATE** — architecture approval, pitch-level carrier and contact footprint; omit if architecture changes |
| 4 | Real-rubber 6-inch narrow treads for dual-contact wheel feet | $11–25 | $44–100 | **CANDIDATE** — tread spacing/contact tests; tube/rim interface and actual diameter |
| 4 | Inner tubes if pneumatic treads are selected | $8–12 | $32–48 | **CANDIDATE** — compatible tire, bead and valve clearance |
| 2 | 16 mm carbon stock, 1 m; wall/layup not released | $17–30 | $34–60 | **HOLD** — new link lengths, bonded socket coupon, supplier laminate data |
| 1 | Teensy 4.1 | $32–45 | $32–45 | **BENCH CANDIDATE** — three bus pin assignment and carrier layout |
| 1 | SPI IMU breakout, ICM-42688-P class | $12–25 | $12–25 | **BENCH CANDIDATE** — actual breakout and SPI voltage compatibility |
| 3 | 3.3-V-logic-compatible CAN transceivers | $4–10 | $12–30 | **BENCH CANDIDATE** — controller-side logic and bus common-mode ratings; not all TJA1051 variants are 3.3 V supply |
| 1 | Pi 5 class companion, cooler and storage | $80–150 | $80–150 | **DEFER** — reuse only if separately confirmed; not needed for balance bench |
| 1 | RC receiver | $30–50 | $30–50 | **DEFER** — existing transmitter compatibility and failsafe |
| 1 | 8S LiPo, 2.7-3.3 Ah packaging study | $70–120 | $70–120 | **HOLD** — actual dimensions <=150 x 50 x 60 mm, mass, discharge/regen current and charger |
| 1 | 8S-capable balance charging system | $90–180 | $90–180 | **HOLD** — no charger ownership assumed; suitable supply and 8S balance connection |
| 1 | 60-V-input-class bucks, fuse, motor disconnect, anti-spark, distribution, voltage/current sensing | $80–160 | $80–160 | **BENCH CANDIDATE** — 5 V/5 A companion plus separate controller branch; verified transient/regen handling |
| 1 | Actuator connector harness, CAN pairs, six terminators, strain relief | $50–100 | $50–100 | **HOLD** — joint travel, current and branch topology |
| 1 | Frame/heat-spreader stock, axle bearings, shafts, rims and hardware | $120–240 | $120–240 | **HOLD** — no free shop stock assumed; drawings and bearing load path |
| 1 | End fittings, shell/trays, inserts and prototype material | $40–90 | $40–90 | **HOLD** — head and leg clearance review |
| 2 | Knee gravity compensation assemblies | $20–50 | $40–100 | **HOLD** — torque curve throughout stance and swing; stored energy and spring travel |
| 2 | Passive pitch-level ankle carrier/linkage allowance | $30–70 | $60–140 | **CANDIDATE** — unresolved mechanism; allowance is not a finished BOM |
| 1 | One camera/face module allowance | $30–80 | $30–80 | **DEFER** — keep seven cameras and Jetson out of V1 purchase |
| | **Total** | | **$2,236–3,498** | Not a released cart |

## Sensible purchase sequence

1. First resolve the load path and make a full-size cardboard/stock fixture of the head, joints, tire envelope and stair. No motor purchase is required to expose collisions or impossible reach.
2. Once the mechanism closes, select one representative motor plus the controller/IMU/CAN/power bench harness. RS02 remains a useful test candidate, but its stationary 6 N·m fixture reference does not qualify the preferred candidate’s hip/knee loads; include the intended reduction or test a different candidate.
3. Buy one real tire/contact assembly only after its diameter, actual contact spacing and rim/valve clearance are resolved. Two existing 1.25-inch treads do not fit the 80 mm candidate footprint with 60 mm contact-center spacing.
4. Release the remaining axes and final battery only after mounted thermal tests, independent bearing design, a measured support footprint and full step geometry pass. Buy electronics needed for that bench, not perception hardware.

## Sources and updates

Canonical budget rows: [`tools/engineering/bom.json`](../tools/engineering/bom.json). Regenerate this table with `python3 tools/engineering/review.py --write`. Prices are allowances retained or introduced for budgeting; supplier stock and quotes must be checked at purchase. [Manufacturer engineering references](head-and-leg-review.md#evidence-and-reproducibility) support specifications, not these prices.

Inventory confirmation lives in [parts-on-hand.md](parts-on-hand.md). Package masses and installed positions live separately in [`baseline.json`](../tools/engineering/baseline.json); budget rows must not be added again to the mass budget.
