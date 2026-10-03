# Pico 2 USB bring-up — opened 2026-10-03

**Received:** one Pico 2 with yellow pre-soldered headers and one SparkFun LSM6DSO Qwiic IMU, per user confirmation recorded October 3. Both are untested. This supersedes the screenshot delivery estimate. The October 2 Amazon order total is **$30.58**. Item prices, shipping, tax and payment date are not shown. [Inventory](../parts-on-hand.md) · [Order evidence](../purchases.md).

## First check: USB and the onboard LED

Place the board on a nonconductive surface. Leave the motor drivers, servos, battery and external GPIO wiring disconnected for this board-only check. Use a **Micro-USB data cable** to the computer.

1. Hold **BOOTSEL** while plugging the Pico into USB, then release it.
2. Confirm that a drive named **RP2350** appears. Pico 2 uses this name; the first-generation Pico uses RPI-RP2. If no drive appears, retry with a known data cable and USB port.
3. Download the official **Blink UF2** linked under [Raspberry Pi's C/C++ SDK first binaries](https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html#your-first-binaries). Raspberry Pi documents that this download supports all Pico variants.
4. Copy the UF2 to **RP2350**. The board should reboot, the drive should disappear and the onboard LED should blink.
5. Optionally repeat with the official **Hello World UF2** from that same page to check USB serial output. On macOS, identify the new `/dev/cu.usbmodem…` device by comparing before/after connection; record the exact port and observed output.

The robot firmware target remains **C/C++ with `PICO_BOARD=pico2`**. These vendor examples check the board and USB path; Hux firmware is still unimplemented. [Software contract](../software.md).

## Check the received IMU

The received sensor is **SparkFun LSM6DSO Qwiic (manufacturer model SEN-18020)**, replacing the earlier Adafruit LSM6DSOX selection. Verify the received label and board revision. Use the LSM6DSO register definitions and initialization; treat sensor identification as part of bring-up.

SparkFun specifies **3.3 V operation**, SPI and I2C support, with interrupt pins exposed. Power this breakout from Pico **3V3(OUT)** and GND; keep its power and logic at 3.3 V. The Qwiic connectors carry I2C. Hux's proposed SPI connection uses the breakout's main SPI pads and a separate interrupt wire, with the exact pad/jumper configuration checked against the received board and [SparkFun schematic](https://cdn.sparkfun.com/assets/3/1/6/b/c/SparkFun_Qwiic_6DoF_LSM6DSO_Schematic.pdf) before soldering.

| Proposed Pico signal | IMU function |
| --- | --- |
| GP12 | Main SPI MISO / SDO |
| GP13 | Main SPI chip-select / CS |
| GP14 | Main SPI clock / SCK |
| GP15 | Main SPI MOSI / SDI |
| GP16 | INT1, configured for data-ready |

This retains the [proposed GPIO allocation](../v1-proof-hardware.md#interfaces-that-must-be-built-correctly). Start with raw sensor readback, stationary bias logging and axis/sign checks before balance control. The ±4 g, ±500°/s, 833 Hz sensor settings and 500 Hz control loop remain qualification targets. [SparkFun specifications](https://www.sparkfun.com/sparkfun-6-degrees-of-freedom-breakout-lsm6dso-qwiic.html) · [ST LSM6DSO datasheet, hosted by SparkFun](https://cdn.sparkfun.com/assets/c/f/9/d/1/lsm6dso_datasheet.pdf).

## Session record — results pending

- [ ] Record board markings, header condition and any visible damage.
- [ ] Record BOOTSEL drive enumeration: cable/port, host and observed drive name.
- [ ] Record the Blink UF2 source and observed LED behavior.
- [ ] Record optional USB serial port, UF2 source and actual output.
- [ ] Record the received IMU label, board revision, condition and connection check.
- [ ] Record IMU identity, raw readings, stationary bias, axis signs and measured timing after firmware exists.

**Observed results:** none recorded. Delivery opens this checklist; it does not complete a firmware, sensor or powered-motion gate.
