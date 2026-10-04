# V1-PROOF electronics

**Selected baseline: Pico 2, the LSM6DSO IMU on SPI, two DRV8874 drivers and two ST3215 servos (12 V variant).** [Exact interfaces, proposed GPIO map, component sources and qualification gates](v1-proof-hardware.md). Confirmed equivalent equipment on hand can reduce the spend only after it meets the same contract. No onboard Linux computer or camera is necessary.

The [Electrical page](../tools/living-drawings/electrical.html) now contains the color-coordinated **EL-01–04 wiring atlas**, with an enlarged vector viewer and a printable PDF. The [source checks and detailed pin maps](wiring-atlas.md) separate the vendor-confirmed pinouts from the proposed GPIO assignments and the unresolved circuits. This is a build-plan drawing. The physical harness and the power-protection release remain open.

**Status, 2026-10-02:** the user reports that the 30:1 motor and the DRV8874 drivers are received and that the parts are printed. Receipts cover one Pololu 4752 gearmotor and one DRV8874 driver. The total received driver count remains to confirm. Two ST3215 servos are ordered, with the 12 V variant confirmed and the arrival unreported. A second wheel motor is still required. Confirm the driver coverage before you buy another driver.

The controller, IMU, adapters and power electronics remain purchase-unconfirmed. [Receipts and delivery status](purchases.md). Start with the [passive mechanical fit checks](checklists/2026-10-02-mechanical-fit.md). This wiring plan still waits for assembly and bench checks.

**2026-10-03:** one Pico 2 with pre-soldered headers is received, untested. The user reports that the LSM6DSO IMU is also received, untested. It replaces the earlier Adafruit LSM6DSOX selection. Start the [board-only USB/LED checks](checklists/2026-10-03-pico-bringup.md). Before you connect the sensor wires, examine the received IMU pads/jumpers and use 3.3 V power/logic.

## What will the motor plug into?

**Each Pololu 4752 gearmotor connects to its own DRV8874 driver (an H-bridge) through a breakout harness.** The driver switches the battery power through the motor. The Pico 2 sends low-power direction/PWM commands. The encoder wires of the motor return the movement feedback to the Pico 2 through level conversion.

The supplied connector of the Pololu 4752 gearmotor is a six-position female header at 2.54 mm pitch. It contains both the motor wires and the encoder wires. It needs a correctly wired mating header/harness. It is not a ready-made Pico 2 plug or servo-bus plug. [Pololu motor connector and wire reference](https://www.pololu.com/product/4752).

| Motor lead | Planned connection |
| --- | --- |
| Red | Driver OUT1 motor terminal |
| Black | Driver OUT2 motor terminal; this is a switched motor lead, not encoder ground |
| Green | Encoder ground / common logic reference |
| Blue | Regulated 5 V encoder supply |
| Yellow | Encoder A → 5 V-to-3.3 V level conversion → Pico encoder input |
| White | Encoder B → 5 V-to-3.3 V level conversion → Pico encoder input |

Repeat for the other wheel. Make sure of the connector orientation by wire function. Establish the forward/encoder sign of each wheel while the wheel is lifted. The harness, the lock/strain relief and the high-current connections still need fabrication. Keep the motor current out of breadboards and MCU supply pins. The proposed Pico 2 GPIO assignment is in the [hardware plan](v1-proof-hardware.md#interfaces-that-must-be-built-correctly).

The first driver for this motor was in the same Pololu shipment as the motor. The user reports that both are received, and the total driver count is not yet confirmed. The driver takes fused, switchable motor power at VIN/GND. It accepts the 3.3 V signals of the Pico 2: PWM to EN, direction to PH, with PMODE grounded. Its SLEEP input is the watchdog/kill-gated output-disable path.

The driver needs soldered connections or headers. It is a separate power board. Set and measure the current limit before you run a motor. [Pololu driver connections](https://www.pololu.com/product/4035).

**The ST3215 servo uses a different connection:** the protected 9 V servo branch supplies the power. A compatible half-duplex TTL interface carries the serial commands and the feedback between the servo bus and the Pico 2 UART. Assign distinct servo IDs and examine the received cable pinout before you power either unit. An H-bridge is for the brushed wheel motors. Each ST3215 servo already contains its own motor control electronics. The interface/adapter is still to be confirmed.

## Power and command paths

```text
3S pack -> fuse + physical actuator-power cut
  -> two DRV8874 H-bridges -> Pololu 4752 encoder gearmotors
  -> regulated/protected 9 V branch -> two ST3215 leg servos
  -> separate 5 V logic regulator -> Pico 2 + 3.3 V IMU/interface logic
Pico <- SPI IMU + 5 V encoder signals through level conversion
Pico <- both driver current/fault signals + divided pack voltage
Pico -> PWM/direction + watchdog/kill-gated SLEEP -> wheel drivers
Pico <-> half-duplex UART transceiver -> servo bus
Pico <- timed manual commands / deliberate arm
Pico <-> USB serial -> existing laptop logging/gamepad
```

## Power and interfaces

Keep the motor/servo current out of the controller PCB. Make sure of the common signal reference, connector ratings, fuses, wire gauge, strain relief and local capacitance. The 9.9 V simulation input is a size-calculation point. Measure the actual pack condition and the loaded cutoff. The battery, charger, regulators and energy clamps are not yet released circuits.

Target a 9 V servo branch that can supply approximately 6 A as a short peak for both servos at the same time. Then qualify the actual duty at the lowest loaded output. Protect every branch against regenerated energy. Ordinary regulators and bench supplies do not necessarily absorb it. Do not connect the selected 12 V servo variant directly to an unprotected, fully charged 3S bus. The mounted servo hold duty must pass at 9 V.

Set both wheel drivers to PH/EN with **PMODE low and IMODE directly grounded**. This keeps the normal current chop separate from a reported driver fault. Measure the 2.5 A peak current threshold, the response at reversal and the PWM-synchronized current sense. Start with a 1.2 A RMS limit and qualify the temperature and the pulse duration. Do not infer the actual current from the PWM duty. Pull the fault outputs up to 3.3 V.

The fault and watchdog behavior latch at the robot controller and need a deliberate rearm.

The motor encoders need a suitable 5 V supply and level conversion to the Pico 2. The SPI IMU uses a data-ready interrupt and timestamps. The servo bus needs a correct 3.3 V-compatible half-duplex transceiver, not bare TX/RX pins tied together.

## Bring-up order

Do the USB-powered log and the sensor calibration first. Then do one restrained wheel, both wheel channels and the pinned chassis. Before free balance, examine the direction/encoder sign, motor response, current limit, stale data, reset, watchdog and physical kill. Measure a sensor/estimator age ≤6 ms and an effective drive lag ≤10 ms under the worst intended telemetry load. These are study limits to make sure of, not guaranteed component performance.

The TBS Nano is reusable only with a compatible, available transmitter. The initial laptop/gamepad commands use a 250 ms deadman and a slack tether in the fixture. Untethered RC and the ten-minute duty trial are separate physical checks. [Electronics checklist](checklists/electronics-bringup.md).
