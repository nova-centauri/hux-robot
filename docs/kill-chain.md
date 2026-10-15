# Kill chain — actuator rail switch, kill button and heartbeat gate

**Opened 2026-10-15. This is a design proposal for the bench and the robot. No part is ordered, built or tested.** The user asked for a momentary button that shuts the actuators down. This document gives a circuit that does that without software, plus a hardware heartbeat gate and a deliberate arm button. It replaces the open items "hardware kill gate" and "watchdog gate on nSLEEP" in the [hardware plan](v1-proof-hardware.md#interfaces-that-must-be-built-correctly) with one switched rail.

## What the kill chain must do

1. One press of a momentary **KILL** button removes the actuator power. The button works when the laptop, the USB cable or the Pico 2 is dead.
2. The power stays off after the press. A second press does not turn it on.
3. A stop of the Pico 2 control loop removes the actuator power in less than 100 ms. A stuck-high or stuck-low heartbeat pin counts as a stop.
4. The power returns only after a deliberate press of a separate **ARM** button, and only when the control loop runs.
5. A reset or a reboot of the Pico 2 does not turn the power on.
6. The logic power of the Pico 2 stays on through a kill, so the log continues.

A momentary button alone cannot do item 2. The circuit needs a latch. The latch sits in the power path, not in the firmware.

## Circuit

```text
UNSWITCHED BUS (bench supply 12 V, or the pack)
  |
  +--> fuse --> Pololu 2813 power switch (VIN -> VOUT) --> SWITCHED RAIL
  |                 |  ON   OFF                              |
  |                 |  ^    ^                                +--> DRV8874 VIN (both drivers)
  |                 |  |    |                                +--> 9 V servo regulator (later)
  +--> 3.3 V LDO ---+  |    |                                +--> 100 k / 22 k divider --> Pico GP28
       (kill-chain     |    +---< diode OR <---+--- KILL button (3.3 V, momentary)
        logic power)   |                       |
                       |                       +--- /HB_OK  (74HC14 output: high = heartbeat missing)
                       |
                       +---< ARM button (3.3 V through 4.7 k), clamped low by HB_OK = low

Pico GP22 heartbeat --> 220 nF --> BAT54S charge pump --> 1 uF || 100 k --> 74HC14 --> /HB_OK --> 74HC14 --> HB_OK
Pico GP10 ------------> DRV8874 nSLEEP (both drivers), software disable, unchanged
```

The switched rail feeds both wheel drivers and, later, the servo regulator. The Pico 2 keeps its own power from USB or from the robot 5 V regulator. The kill-chain logic has its own 3.3 V regulator from the unswitched bus, so the buttons and the gate work without the Pico 2.

### The latch: Pololu 2813

The [Pololu Big Pushbutton Power Switch with Reverse Voltage Protection, HP](https://www.pololu.com/product/2813) is a latched high-side MOSFET switch. Its voltage range is 4.5–40 V. Its continuous current is approximately 16 A at 12 V. A high pulse above 1 V on **ON** turns the output on. A high pulse above 1 V on **OFF** turns the output off. The off-state current is below 0.2 µA.

The board has its own pushbutton. That button toggles the output. **Do not use the onboard button as the kill.** A toggle button turns the power on when it is already off. Leave the onboard button unused, or remove it.

The vendor page does not say which input wins when ON and OFF are high at the same time. The design holds OFF high while the heartbeat is missing. Stage K2 below tests this condition. If ON wins, add a second clamp diode from the ON node to /HB_OK.

### The heartbeat gate

The Pico 2 toggles GP22 two times in each 2 ms control cycle. The result is a 500 Hz square wave while the loop runs. The charge pump turns the edges into a voltage on the 1 µF capacitor. The 100 kΩ resistor drains it. With the pump active, the capacitor holds approximately 2.4 V. Without edges, it falls below the 74HC14 threshold in approximately 80 ms.

| Part | Value | Function |
| --- | --- | --- |
| C1 | 220 nF | Edge coupling from GP22 |
| D1, D2 | BAT54S (dual Schottky) | Charge pump. D1 clamps the node to ground. D2 passes charge to C2. |
| C2 | 1 µF | Holds the heartbeat voltage |
| R1 | 100 kΩ | Drains C2 in approximately 80 ms |
| U1 | 74HC14, at 3.3 V | Schmitt inverters. Output 1 = /HB_OK. Output 2 = HB_OK. |

A stuck pin gives no edges. A reset gives no edges during the boot. A hang gives no edges and the RP2350 watchdog resets the board. In each case /HB_OK goes high and the rail turns off. After the reset the firmware starts in `DISARMED`, the heartbeat returns, and the rail stays off until a person presses ARM.

Measure the C2 voltage on the first build. It must be above 2.3 V with the heartbeat present. If it is lower, use 470 nF for C1. A dedicated window watchdog IC is an alternative to the charge pump. The charge pump uses parts that are easy to get.

### The buttons

| Button | Connection | Result |
| --- | --- | --- |
| KILL, momentary, normally open | 3.3 V → button → diode → OFF pin. 100 kΩ from OFF to ground. | The rail turns off and stays off. The Pico 2 sees the rail voltage fall on GP28 and latches `FAULT`. |
| ARM, momentary, normally open | 3.3 V → button → 4.7 kΩ → ON pin. 100 kΩ from ON to ground. Diode from the ON node (anode) to HB_OK (cathode). | With the heartbeat present, HB_OK is high and the ON node follows the button. Without the heartbeat, the diode holds the ON node below 0.4 V and the press does nothing. |

Use a red mushroom-head momentary button for KILL, in reach of the operator position. Use a small green button for ARM. Mount both on the fixture, not on the robot body, for the bench. The /HB_OK output reaches the OFF pin through its own diode, so the two kill sources do not load each other.

### The firmware side

- GP10 keeps the software disable. `disarm` and `FAULT` set nSLEEP low in the same loop cycle. The rail switch is the second, independent layer.
- GP28 reads the switched rail through the 100 kΩ / 22 kΩ divider. 12.6 V gives 2.27 V at the pin. The firmware command `rail on` enables the check. The `arm` command then refuses when the rail is below 8 V, and a rail loss in `BENCH_ARMED` latches `FAULT` with the reason `rail_lost`.
- A firmware fault does not stop the heartbeat. The firmware is healthy, the actuators are off through nSLEEP. The rail stays on so that the next `arm` needs no ARM press. Only a dead loop or a person removes the rail.
- The 100 ms RP2350 watchdog and the 80 ms gate overlap. A hang removes the rail before the board resets.

## Parts to buy

| Qty | Part | Note |
| ---: | --- | --- |
| 1 | Pololu 2813 Big Pushbutton Power Switch, HP | Confirm the current item number and the price on the Pololu page |
| 1 | 74HC14 hex Schmitt inverter, DIP-14 | 3.3 V supply |
| 1 | 3.3 V linear regulator, input rated above 13 V (for example LD1117V33) | With 10 µF input and output capacitors |
| 2 | BAT54S dual Schottky, or 4 × 1N5819 | Charge pump and the two OR / clamp diodes |
| 1 | 220 nF, 1 µF, 2 × 10 µF capacitors | |
| 4 | 100 kΩ, 1 × 4.7 kΩ, 1 × 22 kΩ resistors | |
| 1 | Red mushroom-head momentary button, normally open | KILL |
| 1 | Green momentary button, normally open | ARM |
| 1 | Inline fuse holder and fuses | The fuse value remains open |

Record the paid order in [purchases.md](purchases.md) and regenerate the budget. The prices are not recorded here.

## Test stages

Do these stages with the wheel lifted, after stage E5 of the [electronics bench guide](electronics-bench-guide.md). Record each result in the [session record](checklists/one-leg-bench-session.md).

| Stage | Action | Pass |
| --- | --- | --- |
| K0 | Build the circuit on a small board. Power only the kill-chain logic from the bench supply. Measure 3.3 V. | 3.3 V ±0.1 V at U1. No rail load connected. |
| K1 | Connect GP22. Start the firmware. Measure C2. Then stop the heartbeat with the `hang` command. | C2 above 2.3 V with the heartbeat. /HB_OK goes high within 100 ms after the stop. |
| K2 | Connect the Pololu switch with a 12 V lamp or a 1 kΩ load on VOUT. Press ARM with the heartbeat stopped. | The rail stays off. Then press ARM with the heartbeat present: the rail turns on. |
| K3 | With the rail on, press KILL. Press KILL again. Press ARM. | The rail turns off on the first press, stays off on the second, and returns on ARM. |
| K4 | With the rail on, pull the USB cable from the Pico 2. | The rail turns off within 100 ms. Reconnect USB: the rail stays off. |
| K5 | Connect the driver. Enable `rail on` in the firmware. Arm and run +10 rpm. Press KILL. | The wheel coasts to a stop. The firmware reports `rail_lost`. A new `speed` command is refused until `arm`. |
| K6 | Repeat K3, K4 and K5 three times each. | Three passes each, with the log and a video. |

A pass on the bench with one driver does not qualify the robot harness. The robot adds the 9 V servo regulator and both drivers to the switched rail. Repeat K5 with every load that joins the rail.

## What remains open

- The fuse value, the wire gauge and the connectors of the switched rail.
- The return-energy clamp. The Pololu switch turns off the supply path. The motor energy then has no path to the supply. Keep the bench reversals slow until the clamp exists.
- The GPIO allocation keeps GP19 free. A later revision can read the ARM button on GP19 for the log.
- The electrical sheets EL-01 and EL-04 show the kill as an open dashed block. Update them after the first build passes K6.
