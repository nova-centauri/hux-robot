# Electronics bench guide — Pico 2, IMU and one wheel channel

**Opened 2026-10-15.** This guide prepares the first powered electronics bench for V1-PROOF. The user wants to program the Pico 2, connect the LSM6DSO IMU and run a test routine with the motor. The guide gives the bench layout, the connections, the firmware stages and the pass conditions. It is a plan. A physical result exists only after a dated [session record](checklists/one-leg-bench-session.md) with measured evidence.

**Parts for this bench:** one Pico 2, one LSM6DSO IMU, one Pololu 4752 gearmotor and the received DRV8874 drivers. The adjustable bench supply replaces the battery. Two ST3215 servos are received on 2026-10-15, with the labels not yet checked. The second wheel gearmotor is not purchased. [Inventory](parts-on-hand.md) · [Hardware baseline and pin allocation](v1-proof-hardware.md) · [Electrical sheets EL-01 to EL-05](wiring-atlas.md).

**Firmware, 2026-10-15:** the bench program exists in [`firmware/bench`](../firmware/bench/README.md), with a prebuilt `hux_bench.uf2` and the host console `tools/bench/hux_bench.py`. It compiles for `pico2`. No board test is recorded.

**Scope.** This bench qualifies one controller, one sensor and one wheel channel on a fixture. It does not balance the robot. It does not move a leg. Balance and manual travel follow the [software contract](software.md) after both wheel channels pass. The [single-leg bench plan](one-leg-bench.md) covers the leg servo and the loaded leg tests.

## Stage list

| Stage | Name | Result that closes the stage |
| --- | --- | --- |
| E0 | Toolchain and blink | A Hux C/C++ build runs on the Pico 2 and prints over USB serial |
| E1 | IMU identity and raw data | `WHO_AM_I` reads `0x6C`; a stationary log and a six-face check are recorded |
| E2 | Encoder counts | One hand turn of the output shaft gives 1920 ±4 counts with the correct sign |
| E3 | Driver and motor jog | The lifted wheel turns in both directions at low duty, and the encoder sign agrees |
| E4 | Wheel speed loop | +10 rpm → 0 → −10 rpm with stable control and a log |
| E5 | Fault checks | Stale command, USB loss, reset and the physical cut all stop the wheel |
| E6 | Tilt-follow routine | The lifted wheel follows the IMU pitch in the correct direction, with the log |
| K0–K6 | Kill chain | The [kill chain](kill-chain.md) stages: rail switch, KILL and ARM buttons, heartbeat gate |

Do the stages in this order. Do not skip E5 before E6. Each stage ends with a dated record. "Done" in a browser note does not close a stage.

## Bench layout and safety

Clamp the motor in a fixture. Lift the wheel clear of the bench through the full rotation. Put the Pico 2 and the IMU on a nonconductive board next to the fixture. Keep the motor current out of the solderless breadboard and out of the Pico 2 pins. Put the laptop where you can reach the supply output button without a reach across the wheel.

**WARNING: Keep your hands, hair and cables clear of the wheel during all powered tests. A wheel that turns can catch a cable and pull it.**

**CAUTION: Make sure that the supply output is off before you connect or disconnect the motor. A live motor lead can cause damage to the driver.**

**CAUTION: Do not connect a 5 V signal to a Pico 2 GPIO pin. The RP2350 GPIO pins are not 5 V tolerant and can get permanent damage.**

| Item | Bench configuration |
| --- | --- |
| Logic power | Laptop USB to the Pico 2 Micro-USB. The IMU gets 3.3 V from 3V3(OUT), pin 36. |
| Motor power | Bench supply at **12.0 V**. First current limit **1.0 A**. Supply positive → fuse → physical cut → driver VIN. Supply negative → driver GND. |
| Fuse | A fast fuse in the VIN lead, maximum 3 A for this bench. The project fuse value remains open. |
| Physical cut | A switch in the VIN lead, or the supply output button in reach, until the [kill chain](kill-chain.md) exists. The cut must work when the laptop or the Pico 2 stops. |
| Common ground | One connection between the supply negative, the driver GND and a Pico 2 GND pin. |
| Encoder power | 5 V from VBUS, pin 40. Encoder A and B go through 5 V → 3.3 V conversion. |
| Instruments | Multimeter, a second multimeter or clamp for the supply current, calipers, a camera and a timer. A scope is optional for E3 and E4. |

Do not connect the supply positive to VSYS or to VBUS. Do not connect two supplies in parallel. The supply current under PWM is not the motor current. Record the supply model, the setpoints and the fuse on the session record.

**Return energy.** A lifted wheel at 10 rpm stores very little energy. The supply manual states if the output can absorb reverse current. Read it before E4. Keep the reversals slow and short. The bus clamp for loaded reversals remains an open [power gate](one-leg-bench.md#power-and-interfaces). Do not test a hard stop from high speed on this bench.

## Stage E0 — toolchain and blink

The Hux firmware target is C/C++ with the Pico SDK and `PICO_BOARD=pico2`. The bench programs become the first firmware modules: the SPI sensor driver, the PIO encoder counter and the PWM driver output. Write them one time in C. MicroPython can read the sensor faster on day one, but the 500 Hz balance loop needs C. Two toolchains cost more time than one.

Install the toolchain on the Mac mini with one of these methods:

1. **Pico extension for VS Code (recommended).** Install the "Raspberry Pi Pico" extension. It installs the SDK, the Arm GNU toolchain, CMake, Ninja and picotool. Make a new C/C++ project and select the board `pico2`.
2. **Command line.** Install `cmake`, `ninja` and the Arm GNU toolchain with Homebrew. Clone `pico-sdk` and `pico-examples` from the Raspberry Pi GitHub organization. Run `git submodule update --init` in the SDK. Set `PICO_SDK_PATH`.

Then do these steps:

1. Complete the [USB and LED checklist](checklists/2026-10-03-pico-bringup.md) with the vendor Blink UF2. Record the drive name `RP2350`.
2. Flash [`firmware/bench/release/hux_bench.uf2`](../firmware/bench/release/hux_bench.uf2) by a copy to the `RP2350` drive. The [firmware README](../firmware/bench/README.md) gives the build steps for the Mac mini.
3. Install `pyserial` and start `python3 tools/bench/hux_bench.py`. The console opens `/dev/cu.usbmodem…`, sends the keepalive and saves a log.
4. Make sure that the board prints its `ID` line and one telemetry line at 50 Hz. The LED gives one short blink each second. Record the build ID from the `ID` line.

The firmware sets GP10 low as its first instruction after boot. GP10 is the driver SLEEP line. A low SLEEP sets the driver outputs to off. Keep this instruction first in every Hux program.

## Stage E1 — IMU identity and raw data

### Prepare the IMU board

The sensor is the SparkFun LSM6DSO Qwiic, model SEN-18020. Inspect the received board revision and the labels. Then prepare the jumpers for SPI:

1. **Open the I2C address jumper** (0x6B/0x6A). Leave its selection pads unbridged.
2. Open both I2C pull-up jumpers. This step is a recommendation, not a requirement.
3. Keep the SCX and SDIX ground jumpers intact.
4. Compare the pads with the [SparkFun schematic](https://cdn.sparkfun.com/assets/3/1/6/b/c/SparkFun_Qwiic_6DoF_LSM6DSO_Schematic.pdf) before you solder.

Solder a seven-pin header on the main pad row and on INT1. Use solid wires or a seven-wire jumper harness, maximum 150 mm long.

### Connect seven wires

| Pico 2 signal | Physical pin | IMU pad | Wire |
| --- | --- | --- | --- |
| GND | 18 | GND | black |
| 3V3(OUT) | 36 | 3V3 | red |
| GP15 / SPI1 MOSI | 20 | SDA / SDI | |
| GP14 / SPI1 SCK | 19 | SCL | |
| GP12 / SPI1 MISO | 16 | SDO | |
| GP13 / chip-select | 17 | CS | |
| GP16 / data-ready input | 21 | INT1 | |

These assignments come from [sheet EL-02](../cad/wiring/v1-proof-el-02-pico-imu.svg). Keep the IMU power and logic at 3.3 V. Inspect each wire two times before the first USB connection. Then measure 3.3 V between the IMU 3V3 and GND pads with USB connected.

### Sensor settings for the firmware

Use SPI mode 3 (clock idle high). Start at 1 MHz. The sensor permits 10 MHz. Set the read bit (bit 7) in the register address for a read. Confirm each value against the [ST LSM6DSO datasheet](https://cdn.sparkfun.com/assets/c/f/9/d/1/lsm6dso_datasheet.pdf) before you write it.

| Register | Address | Value | Meaning |
| --- | --- | --- | --- |
| `WHO_AM_I` | `0x0F` | reads `0x6C` | Sensor identity |
| `CTRL3_C` | `0x12` | `0x44` | BDU = 1, IF_INC = 1, 4-wire SPI |
| `CTRL9_XL` | `0x18` | `0xE2` | I3C disable, default bits kept |
| `CTRL1_XL` | `0x10` | `0x78` | Accelerometer 833 Hz, ±4 g |
| `CTRL2_G` | `0x11` | `0x74` | Gyroscope 833 Hz, ±500°/s |
| `INT1_CTRL` | `0x0D` | `0x02` | Gyroscope data-ready on INT1 |
| `STATUS_REG` | `0x1E` | read | Bits 0 and 1 = new accelerometer / gyroscope data |
| `OUTX_L_G` … `OUTZ_H_G` | `0x22`–`0x27` | read | Gyroscope X, Y, Z, 16-bit signed, low byte first |
| `OUTX_L_A` … `OUTZ_H_A` | `0x28`–`0x2D` | read | Accelerometer X, Y, Z, 16-bit signed, low byte first |

Scale factors at these settings: **0.122 mg per count** and **17.5 mdps per count**. Read all twelve output bytes in one burst from `0x22`. One burst keeps the gyroscope and accelerometer samples together.

### Checks

1. Read `WHO_AM_I` ten times. Each read must return `0x6C`. A value of `0x00` or `0xFF` indicates a wire, chip-select or mode error.
2. Write the settings. Read each register back and compare.
3. Count the INT1 low-to-high edges for 10 s. Expect 8330 ±50. Record the count.
4. Put the board flat and still for 60 s. Log all six channels at 100 Hz. Record the mean and the standard deviation of each channel. The gyroscope means are the stationary bias.
5. Turn the board on each of its six faces. Record the axis that reads approximately +1 g and −1 g for each face. Record the sign of each gyroscope axis with a slow hand rotation.
6. Make a table of the IMU axes against the Hux body axes: forward, left and up. Record the position of the IMU on the body.

Keep the log file and the table with the session record. The ±4 g, ±500°/s and 833 Hz values are the [software targets](software.md#minimal-control-contract). They are qualification targets, not measured performance, until this stage closes.

## Stage E2 — encoder counts

The Pololu 4752 gearmotor has a six-wire connector. The encoder gives **1920 counts per output revolution** with both edges of both channels. Power it at 5 V. Its minimum supply is 3.5 V, so 3V3 is not sufficient.

| Motor wire | Function | Connection for E2 |
| --- | --- | --- |
| Red | Motor lead | Not connected in E2 |
| Black | Motor lead (switched, not ground) | Not connected in E2 |
| Green | Encoder GND | Pico 2 GND |
| Blue | Encoder 5 V | VBUS, pin 40 |
| Yellow | Encoder A | 5 V → 3.3 V conversion → GP2, pin 4 |
| White | Encoder B | 5 V → 3.3 V conversion → GP3, pin 5 |

For the bench, a resistor divider is sufficient. The encoder edges are slow at bench speed. Put **2.2 kΩ** between the encoder output and the GPIO pin. Put **3.3 kΩ** between the GPIO pin and GND. The high level is then 3.0 V.

The project level-conversion part for the robot harness remains open. Measure the high level on GP2 with the multimeter before you connect the Pico 2.

Use the `quadrature_encoder` PIO program from `pico-examples`. It needs A on the base pin and B on the next pin. GP2 and GP3 meet this rule. Then:

1. Print the count at 10 Hz. Make sure that the count is stable at rest.
2. Mark the output shaft. Turn it one turn by hand in the forward direction of the wheel. Expect **+1920 ±4** counts.
3. Turn it one turn back. Expect the count to return to the start value ±4.
4. If the sign is reversed, swap A and B in the firmware pin table, not in the harness. Record the final pin table.
5. Record the count for ten turns. A drift of more than 10 counts indicates a lost edge or a noisy level.

The forward direction of the wheel is the direction that moves Hux forward when the wheel is on the floor. Record the direction with a photo and an arrow on the fixture.

## Stage E3 — driver and motor jog

### Connect the DRV8874 driver

Read the [Pololu 4035 carrier page](https://www.pololu.com/product/4035) and [sheet EL-03](../cad/wiring/v1-proof-el-03-wheel-harness.svg) first. Set the output off before each connection.

| Driver pad | Connection | Note |
| --- | --- | --- |
| VIN | Supply positive, through the fuse and the physical cut | 12.0 V |
| GND | Supply negative and Pico 2 GND | Common ground |
| OUT1 | Motor red | |
| OUT2 | Motor black | Switched lead |
| PMODE | GND | PH/EN mode. Set before the first power-up. |
| IMODE | GND | Fixed-off-time current regulation |
| nSLEEP | GP10, pin 14 | Low = outputs off. The hardware gate is not built. The bench firmware drives this pin. |
| nFAULT | GP11, pin 15, with a 10 kΩ pull-up to 3V3 | Active low, open drain |
| EN / IN1 | GP6, pin 9 | PWM at 20 kHz. Low = brake. |
| PH / IN2 | GP7, pin 10 | Direction |
| VREF | Divider from 3V3, approximately 2.8 V | Sets the current limit near 2.5 A with the 2.49 kΩ CS resistor. Measure it. |
| CS | GP26, pin 31, through a 1 kΩ series resistor | Approximately 1.12 V per ampere. The project conditioning circuit remains open. |

In PH/EN mode, `EN` high drives the motor, `EN` low brakes, and `nSLEEP` low sets both outputs to off. The driver can retry after a fault on its own. That retry never arms the robot. The bench firmware must latch the fault.

### Static checks before the motor

1. With the supply off, measure the resistance between VIN and GND at the driver. Expect no short.
2. Set the supply to 12.0 V and a 1.0 A limit with the output off. Connect VIN and GND. Leave OUT1 and OUT2 open.
3. Set the output on. Measure 12.0 V at VIN and VM. Measure the VREF voltage. Record all three.
4. Make sure that the Pico 2 holds GP10 low. Measure 0 V at nSLEEP. Make sure that nFAULT reads high.
5. Set the output off. Wait 10 s. Connect the motor leads. Lift the wheel clear.

### First jog

1. Set the output on. Arm the bench firmware. The firmware sets nSLEEP high and `EN` low.
2. Command a forward jog at **10% duty for 1.0 s**. Expect the wheel to turn in the forward direction and the count to increase.
3. Command a reverse jog at **10% duty for 1.0 s**. Expect the opposite rotation and a count that decreases.
4. If the rotation is reversed, swap the PH polarity in the firmware. Do not swap the motor leads after E2. Record the final polarity.
5. Record the supply current, the CS voltage and the nFAULT state during each jog.
6. Repeat at 20% and 30% duty. Stop at 30% for this stage. Record the free-run rpm from the encoder at each duty.

Stop if the supply current reaches the limit, the driver gets hot, or nFAULT goes low without a command. Record the event. Inspect the connections before you continue. The project ceilings for the robot are **2.5 A short peak and 1.2 A RMS**. The 1.0 A supply limit on this bench is below both.

## Stage E4 — wheel speed loop

Implement a speed loop in the bench firmware at 100 Hz. The input is the encoder speed, estimated over a 50 ms window at low rpm. The output is the bounded PWM duty, maximum 30% in this stage. Use anti-windup on the integrator.

1. Command **+10 rpm**. Hold 5 s. Expect a measured speed between 8 and 12 rpm after 1 s.
2. Command **0 rpm**. Wait for a measured zero.
3. Command **−10 rpm**. Hold 5 s. Then command 0 rpm again.
4. Record the measured speed, the duty, the supply current and the CS voltage at 100 Hz for the full sequence.
5. Repeat the sequence five times. The responses must be repeatable.

If stiction prevents 10 rpm, record the duty at which the wheel starts to turn. Do not raise the duty limit in this stage. The 10 rpm value and the 10 rpm/s ramp are the [bench start points](one-leg-bench.md#controls-to-prepare), not robot performance.

## Stage E5 — fault checks

Do each check with the wheel lifted and the supply at the 1.0 A limit. Each check must stop the wheel. Record the time from the event to the stop when you can measure it.

| Check | Action | Pass |
| --- | --- | --- |
| Stale command | Arm, command +10 rpm, then stop the host program. | The firmware disarms 250 ms after the last command. nSLEEP goes low. |
| USB loss | Arm, command +10 rpm, then pull the USB cable. | The Pico 2 loses power and nSLEEP goes low. The wheel coasts to a stop. |
| Firmware hang | Arm, then command the test function that stops the main loop. | The RP2350 hardware watchdog resets the board in 100 ms. GP10 is low after the reset. |
| Driver fault | With the output off, short OUT1 to OUT2 for one jog command. | nFAULT goes low. The firmware latches `FAULT` and does not retry. |
| Physical cut | Arm, command +10 rpm, then open the physical cut. | The wheel coasts to a stop. The Pico 2 stays on and logs the loss of VIN. |
| Rearm | After each fault, send one new command without a rearm. | The firmware rejects the command. Only the arm command clears the fault. |

A loss of USB power is a loss of the controller. The physical cut must work without the controller. Do each check two times. A pass on this bench does not prove the robot kill chain. The [kill chain design](kill-chain.md) adds the rail switch, the buttons and the heartbeat gate, with its own stages K0–K6.

## Stage E6 — tilt-follow routine

This routine connects the sensor to the wheel for the first time. It is not balance. The wheel is lifted. The IMU is on a small board that you tilt by hand.

1. Mount the IMU with its pitch axis parallel to the wheel axle. Use the axis table from E1.
2. Compute the pitch angle in the firmware. Use a complementary filter: 98% from the integrated gyroscope rate and 2% from the accelerometer angle, at 500 Hz.
3. Arm. Set the follow gain to **1 rpm per degree**. Hold the IMU level. Expect 0 rpm ±1 rpm.
4. Tilt the IMU 10° forward. Expect the wheel to turn forward at approximately 10 rpm. Return to level.
5. Tilt the IMU 10° back. Expect the wheel to turn back at approximately 10 rpm.
6. Record the pitch angle, the commanded speed, the measured speed and the loop time at 100 Hz for 60 s.
7. Measure the loop time with a GPIO toggle on a spare pin and the scope, or with the timestamp log. Record the maximum.

Pass: the wheel follows the tilt in the correct direction, with no jump at arm and no fault. The 500 Hz loop time and the data age are the [control-loop targets](software.md#minimal-control-contract). This routine measures them for the first time. The robot filter and gains come from the simulation and the measured response. They do not come from this test.

## Bench firmware contract

The bench firmware is the [`firmware/bench`](../firmware/bench/README.md) program. It uses the same modes as the [single-leg bench](one-leg-bench.md#controls-to-prepare): `DISARMED`, `BENCH_ARMED` and `FAULT`. The host sends ASCII commands over USB serial. The firmware sends one telemetry line at 50 Hz.

| Command | Action | Permitted in |
| --- | --- | --- |
| `id` | Print the firmware version, the build commit and `WHO_AM_I` | all modes |
| `imu on` / `imu off` | Start or stop the raw IMU stream at 100 Hz | all modes |
| `enc` | Print the encoder count and the speed | all modes |
| `arm` | Enter `BENCH_ARMED`. Set nSLEEP high and the duty to 0. | `DISARMED` and `FAULT` only |
| `jog <duty %> <ms>` | Open-loop jog, maximum 30% and 2000 ms | `BENCH_ARMED` |
| `speed <rpm>` | Closed-loop speed, maximum ±30 rpm | `BENCH_ARMED` |
| `follow <gain>` | Tilt-follow, maximum 2 rpm per degree | `BENCH_ARMED` |
| `stop` | Ramp the duty to 0 and hold `BENCH_ARMED` | `BENCH_ARMED` |
| `disarm` | Set nSLEEP low, enter `DISARMED` | all modes |
| `hang` | Stop the main loop, for the watchdog test | `DISARMED` only |
| `k` | Keepalive. Renews the deadman. The host console sends it at 20 Hz. | all modes |
| `imu rate` / `imu regs` | Print the INT1 edge rate, or the configuration registers | all modes |
| `zero` | Set the encoder count to zero | all modes |
| `rail on` / `rail off` | Enable the switched-rail check on GP28, after the kill chain exists | all modes |
| `kp <v>` / `ki <v>` | Set the speed loop gains | all modes |
| `tele on` / `tele off` | Start or stop the 50 Hz telemetry line | all modes |

Rules for the firmware:

- Set GP10 low before all other initialization. Set the PWM duty to 0 before nSLEEP goes high.
- Enable the RP2350 hardware watchdog with a 100 ms timeout. Update it in the control loop only.
- Reject a command that is older than 250 ms. Each command renews the deadman. A telemetry read does not.
- Latch `FAULT` on nFAULT low, a stale command or a loop overrun. Also latch it on a CS current above 2.0 A or a speed above 60 rpm. Set nSLEEP low in the same loop cycle.
- Never enter `BENCH_ARMED` at boot, after a reset or after a USB reconnection.
- Clamp the duty to 30% and the ramp to 10 rpm/s in all modes of this guide.

The telemetry line has these comma-separated fields:

| Field | Unit |
| --- | --- |
| time | ms |
| mode, fault reason | text |
| ax, ay, az | g |
| gx, gy, gz | °/s |
| pitch | degrees |
| encoder count | counts |
| speed | rpm |
| duty | percent |
| CS current | A |
| nFAULT state | 0 or 1 |
| loop time | µs |
| switched rail | V |

Put the units in the log header. Save each log with the session date and the stage ID.

## Records

Copy the [session record](checklists/one-leg-bench-session.md) for each bench day. Add the stage IDs E0–E6 to the purpose line. Record these items for each stage:

- The firmware commit, the SDK version and the toolchain version.
- Photos of the connections before the first power-up and after any change.
- The supply model, the voltage, the current limit and the fuse.
- The measured values in the stage table and the log file paths.
- Each fault, each unexpected event and each repeat.

Then add a dated entry to `NOTES.md` and update the [plan data](../tools/living-drawings/plan-data.json). A stage closes only with this record.

## Open items that this bench does not close

- Two ST3215 servos are received. Check the 12 V labels. The half-duplex TTL transceiver is not selected. The leg tests wait for it. [Single-leg bench plan](one-leg-bench.md).
- The second Pololu 4752 gearmotor is not purchased. The total received driver count is not confirmed. Two-wheel balance needs both.
- The [kill chain](kill-chain.md) is a design. No part is ordered or tested. The robot regulator, the fuse value, the level-conversion part and the return-energy clamp also remain open. [Electronics plan](electronics.md).
- E6 measures the 500 Hz loop, the ≤6 ms data age and the ≤10 ms drive lag. They are not proven until the robot firmware runs on the robot.
- The IMU position on the R05 body and the body axis table need a record after the body assembly.
