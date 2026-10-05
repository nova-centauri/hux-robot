# V1-PROOF wiring atlas — Rev B

**Revision dated October 4, 2026. This is a source-checked build-plan drawing. The physical harness and circuit release remain open.** The [Electrical page](../tools/living-drawings/electrical.html) leads with the full system schematic and a separate two-motor sheet. Enlarge a sheet, choose Read labels, and pan to inspect individual conductors. Download the [five-page printable atlas](../cad/wiring/v1-proof-wiring-atlas.pdf) or search the [wire register](../cad/wiring/v1-proof-wire-register.html) by conductor ID, signal or endpoint.

| Sheet | Drawing | Coverage |
| --- | --- | --- |
| EL-01 | [Complete system wiring](../cad/wiring/v1-proof-el-01-overview.svg) | Individual proposed external conductors, both wheel motors and drivers, controller, sensor, power branches, hardware enable and servo bus |
| EL-02 | [Pico 2 + IMU](../cad/wiring/v1-proof-el-02-pico-imu.svg) | Component-side pin maps and seven-wire main SPI connection |
| EL-03 | [Wheel harness](../cad/wiring/v1-proof-el-03-wheel-harness.svg) | Exact DRV8874 pad order, motor lead colors, encoder conversion and wheel GPIOs |
| EL-04 | [Power + servo bus](../cad/wiring/v1-proof-el-04-power-servo.svg) | Power-cut boundary, VSYS isolation, TTL interface and unresolved protection circuits |
| EL-05 | [Both wheel motors — every wire](../cad/wiring/v1-proof-el-05-both-wheels.svg) | Separate left and right motor leads, encoder supply and feedback, driver command and monitoring, and gated enable |

## 11 x 17 inch print views

The [system PDF](../cad/wiring/v1-proof-el-01-overview-11x17.pdf) and the [motor PDF](../cad/wiring/v1-proof-el-05-both-wheels-11x17.pdf) each contain one sheet. Both use landscape orientation and 0.5 inch margins. Select 11 x 17 inch paper and print at 100% scale. The five-sheet atlas uses the same page size.

The print layout date is October 5, 2026. The source audit remains Rev B. EL-01 uses less vertical space. Text and circular symbols keep their proportions. EL-01 and EL-05 omit the dot grid for clear print output. Their website diagrams and PDFs use the same generated SVGs.

Follow the [export procedure](../cad/wiring/README.md) after each electrical change. The site build rejects exports that do not match their recorded source hashes.

## Diagram conventions

Colors identify the rail families or the signal families. The motor lead colors keep their documented function, and outlined white is encoder B. Dots show connected branches. Crossings without dots do not connect. Ground symbols share the common reference. Dashed component frames mark circuits or interfaces whose implementation remains undecided.

EL-01 shows individual conductors with global IDs and named endpoints. Those IDs refer to the searchable wire register. EL-05 labels wheel terminals without separate wire IDs. Search those terminal names in the same register.

IDs are references for the proposed harness. They do not establish released wire gauges, connector contacts or internal circuit designs. Functional blocks are not connector face views. EL-02–04 provide closer pin maps and implementation notes alongside the complete system drawing.

## Both motors and the wire register

The [two-wheel sheet](../cad/wiring/v1-proof-el-05-both-wheels.svg) shows both planned channels independently. Each motor has two switched power leads and four encoder leads. Each driver also needs its own power and ground, command signals, fault feedback, conditioned current feedback, mode straps and a current-limit setting network (TBD). Encoder A and B need separate conversion channels. The hardware gate supplies SLEEP to both drivers.

Match a conductor ID in the schematic to its source and destination in the [searchable register](../cad/wiring/v1-proof-wire-register.html). The [machine-readable endpoint and connection register](../cad/wiring/v1-proof-netlist.json) supports review and generation. These files describe proposed external wiring. They do not close any dashed internal interface or protection circuit. Both channels are planned, and the [inventory](parts-on-hand.md) records the actual received quantities.

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

Each Pololu 4752 gearmotor needs its own DRV8874 driver. Red and black connect to OUT1 and OUT2. **Black is a switched motor lead.** Encoder green is GND, blue is regulated 5 V, yellow is A and white is B. A/B pass through non-inverted conversion to 3.3 V. The view orientation of the six-position 2.54 mm female connector and its mating harness remain to verify. We assign no arbitrary pin-1 number.

The drawing shows the DRV8874 driver component side up, in the orientation of the vendor. Feed the actuator power through VIN. VM is access to the reverse-protected motor bus. Ground PMODE and IMODE directly. SLEEP is active low and must come from the hardware gate. Each open-drain FAULT needs its own 3.3 V pull-up.

CS returns through an ADC protection and conditioning interface. The VREF network remains to select and to calibrate against the 2.5 A peak target. The default limit of the carrier is not the released Hux value. EN low brakes. SLEEP low sets the outputs to off.

| Interface | Left GPIO / physical pin | Right GPIO / physical pin |
| --- | --- | --- |
| Encoder A | GP2 / 4 | GP4 / 6 |
| Encoder B | GP3 / 5 | GP5 / 7 |
| EN / PWM | GP6 / 9 | GP8 / 11 |
| PH / direction | GP7 / 10 | GP9 / 12 |
| FAULT | GP11 / 15 | GP18 / 24 |
| CS via conditioning | GP26 / 31 | GP27 / 32 |

We independently compared these sources: [Pololu 4752](https://www.pololu.com/product/4752), [4035 carrier and pinout](https://www.pololu.com/product/4035), [carrier schematic](https://www.pololu.com/file/0J1862/drv887x-single-brushed-dc-motor-driver-carrier-schematic.pdf), and [TI DRV8874 datasheet, current regulation and fault modes](https://www.ti.com/lit/ds/symlink/drv8874.pdf). The GPIO assignments come from the [Hux hardware proposal](v1-proof-hardware.md#interfaces-that-must-be-built-correctly), not from installed firmware. Wheel direction and encoder sign need lifted-wheel checks.

## Power and servo interfaces — functional plan

The fused distribution splits before the physical actuator cut. The logic stays powered for the log. The cut removes the positive feed to both wheel drivers and to the 9 V servo branch. All grounds share a reference. High-current returns need deliberate physical routing. The regulator, fuse, wire, connector and energy-clamp choices are still open.

External regulated 5 V enters **VSYS, physical pin 39**, through a suitable Schottky isolation diode or a power-OR circuit. Do not assume that the onboard USB diode of the Pico 2 isolates an external regulator from USB backfeed. Feed the LSM6DSO IMU from 3V3(OUT). Qualify the loaded rail voltage and the power-off injection at all GPIO/ADC interfaces.

| Function | Proposed Pico endpoint |
| --- | --- |
| Wheel enable request into gate | GP10 / pin 14 |
| External watchdog heartbeat | GP22 / pin 29 |
| Servo UART1 TX / RX | GP20 / pin 26; GP21 / pin 27 |
| Servo transceiver direction, if supported | GP17 / pin 22 |
| Deliberate arm input | GP19 / pin 25 |
| Pack voltage via protected divider | GP28 / pin 34 |
| Optional UART0 manual link | GP0 / pin 1; GP1 / pin 2 |

The plan supplies the selected ST3215 servo (12 V variant) from a protected regulated 9 V supply. The mounted torque and duty at that voltage remain unmeasured. Both servos share a single half-duplex TTL DATA net with distinct IDs. The cable contact order, the bus voltage compatibility and the adapter remain unconfirmed. Separate Pico 2 TX/RX connect to a compatible directional interface. They are not tied together on the bus.

The proposed wheel watchdog gate does not itself cut servo power. EL-01 adds a proposed servo torque-cut switch driven by the gated hardware enable. Its circuit and failure behavior still need selection and powered tests. The physical actuator cut covers both branches.

We independently compared these sources: [Pico 2 datasheet, power and ADC guidance](https://datasheets.raspberrypi.com/pico/pico-2-datasheet.pdf), [Raspberry Pi SDK pin functions](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html), [Waveshare ST3215 variants](https://www.waveshare.com/product/modules/st3215-servo.htm), and [Waveshare directional bus interface example](https://files.waveshare.com/upload/d/d3/Bus_servo_control_circuit.pdf). This example documents the interface principle and does not select a purchased adapter.

## What was double checked

Independent reviews compared the vendor documents, schematics and component-side images with the repository proposal. A second review checked the generated SVGs and the endpoint register: all 40 Pico 2 pins, seven sensor connections, both wheel GPIO allocations, the DRV8874 pad order and six motor lead functions. The automated generation rejects duplicate Pico 2 pin allocations and checks the SPI/UART/ADC physical pins. The visual review covers line endpoints, ground crossings, board proportions, legibility and the enlarged viewer of the site.

Rev B adds a conductor graph that checks terminal coverage and endpoint/net conflicts. It checks all 26 proposed GPIO endpoints, 12 motor cable leads and six servo leads. Geometry checks reject overlapping wires of different nets and endpoint touches between different nets. They also reject wires hidden inside component bodies. EL-01 checks that all branches of each drawn net join, including its rails and junctions.

These checks verify the drawing data. They cannot prove physical wiring or the behavior of a TBD circuit.

This is source verification, not a measured assembly pass. The [received inventory](parts-on-hand.md), [Pico bring-up record](checklists/2026-10-03-pico-bringup.md) and [electrical qualification checklist](checklists/electronics-bringup.md) keep their current status. Before we can release an assembly schematic, we must record these items: the fuse and wire ratings, the energy clamps, the ADC protection and the encoder conversion. We must also record the servo interface, the watchdog circuits, the harness contact orientation and the physical tests.

[cad/wiring/README.md](../cad/wiring/README.md) describes the editable drawing source and the reproducible exports. The [endpoint register](../cad/wiring/v1-proof-netlist.json) is a review aid, not a firmware implementation.
