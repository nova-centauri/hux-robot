# V1-PROOF wiring atlas — Rev A

**Source checked October 3, 2026. This is a build-plan drawing. The physical harness and the circuit release remain open.** The [Electrical page](../tools/living-drawings/electrical.html) embeds the coordinated four-sheet atlas. Enlarge a sheet to zoom and pan, or download the [four-page printable atlas](../cad/wiring/v1-proof-wiring-atlas.pdf).

| Sheet | Drawing | Coverage |
| --- | --- | --- |
| EL-01 | [Wiring overview](../cad/wiring/v1-proof-el-01-overview.svg) | Power branches, controller, sensor, wheel channels, hardware enable and servo bus |
| EL-02 | [Pico 2 + IMU](../cad/wiring/v1-proof-el-02-pico-imu.svg) | Component-side pin maps and seven-wire main SPI connection |
| EL-03 | [Wheel harness](../cad/wiring/v1-proof-el-03-wheel-harness.svg) | Exact DRV8874 pad order, motor lead colors, encoder conversion and wheel GPIOs |
| EL-04 | [Power + servo bus](../cad/wiring/v1-proof-el-04-power-servo.svg) | Power-cut boundary, VSYS isolation, TTL interface and unresolved protection circuits |

Colors identify the rail families or the signal families. The motor lead colors keep their documented function, and outlined white is encoder B. Dots show connected branches. Crossings without dots do not connect. Ground symbols share the common reference. Dashed component frames mark circuits or interfaces whose implementation remains undecided.

The detail sheets expand the bundled I/O paths on EL-01. Functional blocks are not connector face views.

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

The proposed wheel watchdog gate does not establish a servo watchdog power cut. That hardware behavior remains unresolved. The physical actuator cut covers both branches.

We independently compared these sources: [Pico 2 datasheet, power and ADC guidance](https://datasheets.raspberrypi.com/pico/pico-2-datasheet.pdf), [Raspberry Pi SDK pin functions](https://www.raspberrypi.com/documentation/pico-sdk/hardware.html), [Waveshare ST3215 variants](https://www.waveshare.com/product/modules/st3215-servo.htm), and [Waveshare directional bus interface example](https://files.waveshare.com/upload/d/d3/Bus_servo_control_circuit.pdf). This example documents the interface principle and does not select a purchased adapter.

## What was double checked

Independent reviews compared the vendor documents, schematics and component-side images with the repository proposal. A second review checked the generated SVGs and the endpoint register: all 40 Pico 2 pins, seven sensor connections, both wheel GPIO allocations, the DRV8874 pad order and six motor lead functions. The automated generation rejects duplicate Pico 2 pin allocations and checks the SPI/UART/ADC physical pins. The visual review covers line endpoints, ground crossings, board proportions, legibility and the enlarged viewer of the site.

This is source verification, not a measured assembly pass. The [received inventory](parts-on-hand.md), [Pico bring-up record](checklists/2026-10-03-pico-bringup.md) and [electrical qualification checklist](checklists/electronics-bringup.md) keep their current status. Before we can release an assembly schematic, we must record these items: the fuse and wire ratings, the energy clamps, the ADC protection and the encoder conversion. We must also record the servo interface, the watchdog circuits, the harness contact orientation and the physical tests.

[cad/wiring/README.md](../cad/wiring/README.md) describes the editable drawing source and the reproducible exports. The [endpoint register](../cad/wiring/v1-proof-netlist.json) is a review aid, not a firmware implementation.
