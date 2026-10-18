# V1-PROOF wiring atlas — Rev C

**Revision dated October 17, 2026. This is a source-checked build-plan drawing. The physical harness and circuit release remain open.** Rev C puts each board where it mounts in the R05 body. It adds the harness run lengths and a connector standard. The [Electrical page](../tools/living-drawings/electrical.html) leads with the full system schematic by location. Download the [seven-page printable atlas](../cad/wiring/v1-proof-wiring-atlas.pdf) or search the [conductor register](../cad/wiring/v1-proof-wire-register.html).

The [harness assembly guide](../cad/wiring/v1-proof-harness.html) has one card for each cable. Each card shows the parts, proposed wire colors, connector positions and checks. The full engineering register remains available below the cards.

Each XH or motor connector has a shaded plug view and numbered end views. The wire-entry view reverses the socket-face order. Select a color to highlight its position. The adjacent list gives the function and the other endpoint. Board views show the separate mating pins.

These illustrations use the proposed schedule. Verify position 1 against the physical parts before assembly.

## Assembly review — October 17, 2026

The previous register required several tables to assemble one cable. It did not specify physical wire colors for new cables. The new guide groups the information by harness. H6 is the first example, with two wires and two XHP-2 housings.

The guide defines a proposed insulation color for each new wire. Vendor motor colors stay unchanged. Black is motor OUT2 on H6–H9. Green is encoder ground on H8 and H9. Read the endpoint labels as well as the colors.

The connector strips are position schedules. They are not physical face views. The guide explains the mirror effect between the mating face and the wire-entry face. Verify the actual orientation before contact insertion.

**Pico interface correction required.** PH-C groups physical pins 16–21 into one six-position header. Pins 16–20 are on one row. Pin 21 is on the opposite row. One straight header cannot span this group. See the [official Pico 2 pinout](https://datasheets.raspberrypi.com/pico/Pico-2-Pinout.pdf).

Do not remove the existing Pico headers until the interface is resolved. The electrical endpoint assignments remain unchanged. A revised connector split or an adapter needs a separate layout check.

**Cut-length limits.** SP1 needs three individually measured legs. Its position is about 30 mm from the Pico housing. The 95 mm sensor route and 335 mm driver route do not specify these three cuts. H10 also needs separate measurements after the pack connector and fuse holder are selected.

**Mating parts remain open.** H4 and H10 need an exact XT30 contact-sex schedule. H11 and H12 need button terminals and button-side XH mating parts. The custom boards need physical header positions. None of these changes releases a harness for power.

| Sheet | Drawing | Coverage |
| --- | --- | --- |
| EL-01 | [Complete system wiring by location](../cad/wiring/v1-proof-el-01-overview.svg) | Rear elevation of the R05 body. Each board in its mount position. Every harness conductor with its connector position and a register ID |
| EL-02 | [Pico 2 + IMU](../cad/wiring/v1-proof-el-02-pico-imu.svg) | Component-side pin maps and the seven-wire main SPI connection |
| EL-03 | [Wheel harness](../cad/wiring/v1-proof-el-03-wheel-harness.svg) | Exact DRV8874 pad order, motor lead colors, the leg junction board and the wheel GPIOs |
| EL-04 | [Power + kill chain](../cad/wiring/v1-proof-el-04-power-servo.svg) | Fused pack, Pololu 2813 latched rail switch, 74HC14 heartbeat gate, logic branch and the open items |
| EL-05 | [Both wheel motors — every wire](../cad/wiring/v1-proof-el-05-both-wheels.svg) | Two complete channels through the leg junction board, with terminal names |
| EL-06 | [Harnesses](../cad/wiring/v1-proof-el-06-harness-runs.svg) | One card for each of the twelve harnesses: the two ends, the housings and the cut length of each branch |
| EL-07 | [Connector loading](../cad/wiring/v1-proof-el-07-connectors.svg) | Each harness connector with its positions, pins, nets and mating wire |

## What changed in Rev C

Rev B drew the circuits in a logical order. Rev C draws them in their mount positions. The sheet is a rear elevation: the CTRL deck at the top, then the BUS deck, the PWR deck and the tray. The left lane holds the near-wall items and the right lane holds the far-wall items. The user asked for this layout on 2026-10-17.

Rev C also removes a conflict. Rev B drew the old kill gate, with a latching gate on SLEEP, an ARM input on GP19 and a pack divider on GP28. The [kill chain](kill-chain.md) of 2026-10-15 and `firmware/bench/src/pins.h` use a different circuit. GP10 drives both nSLEEP pins directly. GP22 sends the heartbeat to the gate. GP28 reads the switched rail.

Rev C draws that circuit. The gate is still a design, with no part ordered or tested.

The servo branch is out of the V1-PROOF sheets. V1-PROOF has no powered hips, by the decision of 2026-10-16. The two ST3215 servos, the 9 V regulator and the bus interface stay in stock for the next version. The old EL-04 file name remains for the site links.

## Side naming

**Robot LEFT is the near wall.** The R05 CAD and the assembly guide use near wall and far wall. The electrical sheets and the firmware use left and right. The user set this mapping on 2026-10-17. The near wall is the wall that you see in the side view of the assembly guide. EL-01 shows the robot from the rear, so the left wheel is at the left of the sheet.

## Mount positions

The positions come from `cad/prints/two-leg-body-r05/build.py` and `parameters.json` of 2026-10-16. The body coordinates are X rearward, Y into the body from the near wall and Z up.

| Board | Mount position | Centre, mm |
| --- | --- | --- |
| P1 Pico 2 | CTRL deck, far half | (0, −97.5, 193) |
| U1 LSM6DSO | CTRL deck, near half | (0, −41.5, 190) |
| PDB power distribution | BUS deck, near half, regulator cassette | (0, −38.5, 145) |
| Spare | BUS deck, far half, the former servo bus cassette | no board |
| KC kill chain | PWR deck, near half, power-cut cassette | (0, −38.5, 85) |
| DB driver board | PWR deck, far half, driver cassette | (0, −96.5, 85) |
| JLEG leg junction | under the PWR deck, centre | (0, −67.5, 52) |
| Left gearmotor pigtail exit | under the body, near side | (7, −42.6, −95) |
| Right gearmotor pigtail exit | under the body, far side | (7, −92.4, −95) |
| Pack lead exit | tray, rear end, assumed | (48, −50, −10) |

Both drivers stay on one board on the far half of the PWR deck, as the R05 assembly guide says. The user confirmed this on 2026-10-17. Each gearmotor reaches the body with one six-wire vendor pigtail.

## The leg junction board

The Pololu 4752 pigtail is 200 mm long and ends in a 1x6 0.1 in female housing. The left pigtail cannot reach the driver board. The route model gives 216 mm. Both pigtails can reach a point under the PWR deck. The route model gives 179 mm.

Rev C adds a small junction board, JLEG, under the PWR deck. The user accepted this unified junction on 2026-10-17. It has two 1x6 male headers for the pigtails. The motor leads pass across the board to JPL and JPR, then to the driver board. The four encoder channels pass through 2.2 kΩ / 3.3 kΩ dividers, the bench values from the [electronics bench guide](electronics-bench-guide.md). The 3.0 V outputs go to the Pico on one five-position connector.

This changes the R05 module table. The far cassette of the BUS deck, planned for the servo bus and the encoder conversion, becomes a spare position. The JLEG board layout and its mount under the deck remain open. Measure the pigtail route on the frame before you fix the position.

## Connector standard

**JST XH 2.50 mm is the proposed standard for the low-voltage harness connectors.** The selected boards use 2.54 mm grids. Do not assume direct fit. A six-position header accumulates 0.20 mm of pitch difference. Check the exact board footprint and connector dimensions before solder work.

The [JST XH specification](https://www.jst-mfg.com/product/pdf/eng/eXH.pdf) lists 3 A with 22 AWG wire. SXH-001T-P0.6 accepts 22–28 AWG with insulation diameter 0.9–1.9 mm. The current rating depends on the selected wire and assembly. It does not release the motor or power circuit.

| Part | Use |
| --- | --- |
| B2B-XH-A to B6B-XH-A | Board headers, top entry. Use S#B-XH-A side entry where the cassette height is tight. |
| XHP-2 to XHP-6 | Housings |
| SXH-001T-P0.6 | Contacts, 22 to 28 AWG |
| 24 AWG | Signals |
| 22 AWG | 5 V, 3V3 and the motor OUT1 / OUT2 leads |
| 20 AWG, XT30 | The pack, the fuse and the switched rail |
| 1x6 0.1 in male header | The Pololu pigtail housing stays as received |

One kit covers the housing, header and contact counts of this harness. The [harness register](../cad/wiring/v1-proof-harness.html) lists the kit, the crimp tool and a pre-crimped alternative, with the prices seen on 2026-10-17. Record the paid order in [purchases.md](purchases.md).

**The Pico end.** The received Pico 2 has pre-soldered pins. The user proposed direct XH attachment on 2026-10-17. The assembly review found the PH-C row conflict described above. Resolve this interface before header removal.

## Pico 2 headers

The model proposes eight Pico connector groups. PH-C crosses the two rows and needs correction. The table records logical assignments, not a released physical layout.

| Header | Pins | Positions | Function |
| --- | --- | ---: | --- |
| PH-A | p4–p7 | 4 | Encoder inputs GP2–GP5 |
| PH-A2 | p8–p10 | 3 | GND, left EN GP6, left PH GP7 |
| PH-B | p11–p15 | 5 | Right EN GP8, right PH GP9, GND, nSLEEP GP10, left nFAULT GP11 |
| PH-C | p16–p21 | 6 | SPI1 to the IMU: GP12–GP16 and GND |
| PH-D | p24–p29 | 6 | Right nFAULT GP18, GND, heartbeat GP22. GP19–GP21 empty |
| PH-E | p31–p34 | 4 | Left CS GP26, right CS GP27, AGND, rail sense GP28 |
| PH-F | p36–p39 | 4 | 3V3(OUT), GND, VSYS. 3V3_EN empty |
| PH-G | p1–p3 | 3 | Optional UART0 link. No cable in V1-PROOF |

The 3V3 output of PH-F feeds the IMU and the driver pull-ups through one splice, SP1, about 30 mm from the Pico header.

## Twelve harnesses

The wires build as twelve harnesses. Every connector housing belongs to one harness. EL-06 shows one card for each harness.

H1 is the CTRL deck harness. It runs from PH-C and PH-F to the IMU, the PDB and the driver 3V3 input. H2 is the right trunk. It runs from PH-A to PH-E down to the driver board, the leg junction board and the kill-chain board.

The other ten are two-wire or six-wire runs between two housings. The driver board gets its own two-position 3V3 input, J3V3, so that no housing is shared.

| Harness | From | To | Wires | Longest cut |
| --- | --- | --- | ---: | ---: |
| H1 CTRL deck | P1.PH-C, P1.PH-F | U1.JMAIN, U1.JINT, PDB.JPICO, DB.J3V3 | 11 | 335 mm |
| H2 Right trunk | P1.PH-A, PH-A2, PH-B, PH-D, PH-E | DB.JSIG-L, DB.JSIG-R, DB.JCTL, JLEG.JENC, KC.JHB | 19 | 395 mm |
| H3 Logic bus | KC.JBUS | PDB.JIN | 2 | 280 mm |
| H4 Switched rail | KC.XRAIL | DB.XRAIL | 2 | 95 mm |
| H5 Encoder supply | PDB.J5V | JLEG.J5V | 2 | 295 mm |
| H6 Left motor power | DB.JML | JLEG.JPL | 2 | 100 mm |
| H7 Right motor power | DB.JMR | JLEG.JPR | 2 | 100 mm |
| H8 Left motor pigtail | ML | JLEG.JML_IN | 6 | 200 mm, vendor |
| H9 Right motor pigtail | MR | JLEG.JMR_IN | 6 | 200 mm, vendor |
| H10 Pack lead | BAT | F1, KC.XPACK | 3 | 200 mm |
| H11 KILL button | SWK | KC.JKILL | 2 | 600 mm, fixture |
| H12 ARM button | SWA | KC.JARM | 2 | 600 mm, fixture |

## Bundles and run lengths

The bundles below are the detail behind the harness cards. The route model is a Manhattan path. It goes from the board to the front cable notch of its deck lane, then along the front face of the body. It then goes through the notch of the other lane to the board. The cut length is the path length plus 10 percent, plus 15 mm at each end for the termination, rounded up to 5 mm. **The lengths are estimates.** Cut each run long, route it on the frame, trim it and record the measured length.

| Bundle | Name | Wires | AWG | Model path | Cut length |
| --- | --- | ---: | ---: | ---: | ---: |
| B1 | Sensor, P1 to U1 | 7 | 24 | 59 mm | 95 mm |
| B2 | 3V3 feed, P1 to DB | 2 | 22 | 275 mm | 335 mm |
| B3 | Left driver signals, P1 to DB | 5 | 24 | 275 mm | 335 mm |
| B4 | Right driver signals, P1 to DB | 5 | 24 | 275 mm | 335 mm |
| B5 | Driver sleep, P1 to DB | 1 | 24 | 275 mm | 335 mm |
| B6 | Encoder signals, P1 to JLEG | 5 | 24 | 287 mm | 350 mm |
| B7 | Kill-chain sense, P1 to KC | 3 | 24 | 329 mm | 395 mm |
| B8 | Pico power, PDB to P1 | 2 | 22 | 269 mm | 330 mm |
| B9 | Logic bus, KC to PDB | 2 | 22 | 226 mm | 280 mm |
| B10 | Switched rail, KC to DB | 2 | 20 | 58 mm | 95 mm |
| B11 | Encoder supply, PDB to JLEG | 2 | 22 | 238 mm | 295 mm |
| B12 | Left motor power, DB to JLEG | 2 | 22 | 62 mm | 100 mm |
| B13 | Right motor power, DB to JLEG | 2 | 22 | 62 mm | 100 mm |
| B14 | Left motor pigtail, vendor | 6 | — | — | 200 mm fixed |
| B15 | Right motor pigtail, vendor | 6 | — | — | 200 mm fixed |
| B16 | Pack, BAT to KC | 3 | 20 | 154 mm | 200 mm |
| B17 | KILL button, fixture | 2 | 24 | — | 600 mm |
| B18 | ARM button, fixture | 2 | 24 | — | 600 mm |

Bundles B2 to B7 run together down the front face of the far half. The route from the Pico to the driver board is 275 mm. The Pico is on the top deck and the drivers are on the bottom deck. A Pico position on the PWR deck can cut these runs to about 60 mm. The user accepts the 335 mm runs (2026-10-17), so the Pico stays on the CTRL deck.

## Diagram conventions

Colors identify the rail families or the signal families. The motor lead colors keep their documented function, and outlined white is encoder B. Dots show connected branches. Crossings without dots do not connect. Dashed boards mark circuits whose parts remain unselected.

EL-01 shows every harness conductor with a global ID and a connector position at each end. The register IDs refer to the searchable conductor register. The harness register adds the bundle, the gauge and the cut length. EL-05 labels wheel terminals without separate wire IDs.

IDs are references for the proposed harness. They do not establish released wire gauges or circuit designs. Functional blocks are not connector face views. EL-02 and EL-03 provide closer pin maps and implementation notes.

## Sensor harness — source checked

The Pico 2 component side faces the viewer, with the Micro-USB at the top. Physical pins run 1–20 down the left and 40–21 down the right. GPIO numbers are different from physical pin numbers.

| Pico signal | Physical pin | SparkFun SEN-18020 pad |
| --- | --- | --- |
| GND | 18 | GND |
| 3V3(OUT) | 36 | 3V3 |
| GP15 / SPI1 MOSI | 20 | SDA / SDI |
| GP14 / SPI1 SCK | 19 | SCL |
| GP12 / SPI1 MISO | 16 | SDO |
| GP13 / chip-select | 17 | CS |
| GP16 / data-ready input | 21 | INT1 |

**Before SPI, open the 0x6B/0x6A address jumper and leave its selection pads unbridged.** We also recommend that you open both I2C pull-up traces. Keep the SCX and SDIX ground jumpers intact. Qwiic and the auxiliary SPI pads are unused. The main SPI connection uses the six-pad main header and INT1.

The drawing rotates the SparkFun component view clockwise 90 degrees. This puts the main pads on the left. Board outlines and pad spacing are proportional. Internal component graphics are simplified. Inspect the received board revision, labels and jumper state before you solder.

We independently compared these sources: [Raspberry Pi Pico 2 pinout](https://datasheets.raspberrypi.com/pico/Pico-2-Pinout.pdf), [SparkFun hardware overview](https://learn.sparkfun.com/tutorials/qwiic-6dof-lsm6dso-breakout-hookup-guide/hardware-overview), [SparkFun schematic](https://cdn.sparkfun.com/assets/3/1/6/b/c/SparkFun_Qwiic_6DoF_LSM6DSO_Schematic.pdf), and [SparkFun PCB layout](https://github.com/sparkfun/SparkFun_Qwiic_6DoF_LSM6DSO/blob/main/Hardware/SparkFun_6DoF_LSM6DSO.brd).

## Wheel harness — source checked

Each Pololu 4752 gearmotor needs its own DRV8874 driver. Red and black connect to OUT1 and OUT2 through the junction board. **Black is a switched motor lead.** Encoder green is GND, blue is regulated 5 V, yellow is A and white is B. A and B pass through the dividers on JLEG to 3.0 V.

The pigtail is six leads, 200 mm long, in a 1x6 0.1 in female housing. The [Pololu 4752 page](https://www.pololu.com/product/4752) says that you can remove the crimped wires or cut the housing off. We keep the housing.

The drawing shows the DRV8874 driver component side up, in the orientation of the vendor. Feed the switched rail through VIN. VM is access to the reverse-protected motor bus. Ground PMODE and IMODE directly. nSLEEP is active low and comes from GP10 for both carriers. Each open-drain nFAULT gets a 10 kΩ pull-up to 3V3 on the driver board.

CS returns through a 1 kΩ series resistor. The VREF divider from 3V3 gives about 2.8 V, which sets the limit near 2.5 A with the 2.49 kΩ carrier resistor. Measure it. EN low brakes. nSLEEP low sets the outputs to off.

| Interface | Left GPIO / physical pin | Right GPIO / physical pin |
| --- | --- | --- |
| Encoder A | GP2 / 4 | GP4 / 6 |
| Encoder B | GP3 / 5 | GP5 / 7 |
| EN / PWM | GP6 / 9 | GP8 / 11 |
| PH / direction | GP7 / 10 | GP9 / 12 |
| nFAULT | GP11 / 15 | GP18 / 24 |
| CS via 1 kΩ | GP26 / 31 | GP27 / 32 |

We independently compared these sources: [Pololu 4752](https://www.pololu.com/product/4752), [4035 carrier and pinout](https://www.pololu.com/product/4035), [carrier schematic](https://www.pololu.com/file/0J1862/drv887x-single-brushed-dc-motor-driver-carrier-schematic.pdf), and [TI DRV8874 datasheet, current regulation and fault modes](https://www.ti.com/lit/ds/symlink/drv8874.pdf). The GPIO assignments agree with `firmware/bench/src/pins.h`. Wheel direction and encoder sign need lifted-wheel checks.

## Power and kill chain — functional plan

The pack lead passes through the inline fuse F1 to the kill-chain board. The Pololu 2813 latched switch turns the rail on and off. The switched rail feeds both driver VIN pads through one XT30 pair. The 5 V regulator sits before the switch, so the logic stays on through a kill. The kill-chain logic has its own LD1117V33 regulator from the unswitched bus.

External regulated 5 V enters **VSYS, physical pin 39**, through a Schottky diode on the power distribution board. Do not assume that the onboard USB diode of the Pico 2 isolates an external regulator from USB backfeed. Feed the LSM6DSO IMU from 3V3(OUT). Qualify the loaded rail voltage and the power-off injection at all GPIO/ADC interfaces.

| Function | Proposed Pico endpoint |
| --- | --- |
| Driver nSLEEP, both carriers | GP10 / pin 14 |
| Heartbeat to the kill-chain gate | GP22 / pin 29 |
| Switched rail via 100 kΩ / 22 kΩ divider | GP28 / pin 34 |
| Optional UART0 manual link | GP0 / pin 1; GP1 / pin 2 |
| NC | GP17 / pin 22, GP19 / pin 25, GP20 / pin 26, GP21 / pin 27 |

The KILL and ARM buttons go on the bench fixture, not on the robot, as the [kill chain](kill-chain.md) says. The fuse value, the rail wire gauge, the return-energy clamp and the ON / OFF priority of the 2813 remain open. Stages K0 to K6 remain open.

## What was double checked

Rev C keeps the Rev B source checks. They cover the Pico 2 pins, the IMU pads, the DRV8874 pad order and the six motor lead functions. The automated generation rejects duplicate Pico 2 pin allocations and checks the SPI and ADC physical pins. The conductor graph checks terminal coverage and endpoint/net conflicts for 20 GPIO endpoints and 12 motor pigtail leads. Geometry checks reject overlapping wires of different nets, endpoint touches between different nets and wires hidden inside component bodies.

Rev C adds a consistency check. The wires drawn on EL-01 must equal the wire list of `cad/wiring/harness.py`, with the same nets. The harness model checks that every loaded connector position has one wire and that every XH connector has two to six positions. The route model checks that both pigtails can reach JLEG.

These checks verify the drawing data. They cannot prove physical wiring, the behavior of a TBD circuit or the actual cable length. This is source verification, not a measured assembly pass. The [received inventory](parts-on-hand.md), [Pico bring-up record](checklists/2026-10-03-pico-bringup.md) and [electrical qualification checklist](checklists/electronics-bringup.md) keep their current status.

[cad/wiring/README.md](../cad/wiring/README.md) describes the editable drawing source and the reproducible exports. The [endpoint register](../cad/wiring/v1-proof-netlist.json) and the [harness data](../cad/wiring/v1-proof-harness.json) are review aids, not a firmware implementation.
