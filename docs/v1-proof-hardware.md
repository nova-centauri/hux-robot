# V1-PROOF hardware decisions — updated 2026-10-03

**Freeze this component baseline for bench qualification.** The user requested dependable forward/reverse travel, both turns, a turn in place, and bounded disturbance tolerance. The user also requested a useful foundation for later versions. The receipts reconciled September 29 confirm **one Pololu 4752 gearmotor, one DRV8874 driver and two ST3215 servos**. The paid total is **$143.12**. This total includes shipping and tax.

**2026-10-02: the user reports that the 30:1 motor and the DRV8874 drivers are received and that the parts are printed**. The total delivered driver count, the received labels and the printed revision/material remain to record. The user confirmed the 12 V servo variant. The servo arrival remains unreported.

The [purchase evidence](purchases.md) and the [inventory](parts-on-hand.md) track those facts. Start the [passive mechanical fit session](checklists/2026-10-02-mechanical-fit.md).

RobStride is intended for the future full-size Hux. Fit and physical performance remain separate release gates. The [budget](bom.md) keeps a **$900 planning allocation. The allocation includes $100 freight/tax and a $125 repair reserve**, with no assumed reuse credit.

## Ordered parts define the build

**2026-10-03 controller/IMU update:** the Pico 2 with pre-soldered headers is received, untested. The user reports that the **LSM6DSO IMU** is also received, untested. The supplied October 2 order screenshot establishes the model and the combined order total. This IMU explicitly replaces the earlier Adafruit LSM6DSOX selection.

Use the LSM6DSO-specific initialization, and examine the received breakout before you connect the wires. The $30.58 order total brings the recorded spend to **$173.70**. [Pico bring-up and proposed sensor connections](checklists/2026-10-03-pico-bringup.md).

**The Pololu 4752 gearmotors, the DRV8874 drivers and the ST3215 servos (12 V) are the locked purchased baseline**. Design the harness, motor mounts, wheel hubs and leg transmission around these exact models. The robot needs two of each. One wheel motor is received, and a second remains to buy. The drivers are received, with the total count not yet confirmed.

Both leg servos are ordered, with the arrival unreported.

The inspection and the tested condition still need a record. Keep the 100 mm wheel / 3:1 leg-belt concept while we qualify the fit, strength and performance.

The Pico 2 and the LSM6DSO IMU are received, untested. The encoder level conversion, the servo bus interface and the power protection remain **purchase/availability unconfirmed**. The purchased motor/driver pair supports one bench wheel channel, not a complete two-wheel drive system. A substitute actuator or driver reopens this baseline explicitly. A suitable controller found on hand only changes the implementation after qualification. Refer to [what the motor connects to](electronics.md#what-will-the-motor-plug-into) and [how Hux intelligence works](software.md#how-the-intelligence-works).

| Subsystem | Decision | Reason and release condition |
| --- | --- | --- |
| Wheel motors | **2 × Pololu 4752**, 12 V, 30:1, integrated encoders | Keep 100 mm rubber wheels. Bench-test reversals, backlash, current and torque at minimum operating voltage. This is the selected motor, replacing the earlier open motor-class choice. |
| Wheel drivers | **2 × Pololu 4035, DRV8874** | Adjustable current limit suits this motor; default sleep supports disabled startup. Use PH/EN, 3.3 V control, measured 2.5 A peak limit and initial 1.2 A RMS ceiling. Replaces the G2 18v17 reference and saves $60 in allocations. |
| Leg actuators | **2 × Waveshare ST3215, 30 kg-cm @ 12 V variant**, 3:1 belts | Bearing-supported pivots, physical stops and lock pins. **Regulated 9 V branch**; qualify 0.75 N·m hold for ten minutes and 1.0 N·m transient at its lowest loaded output. No credit for the advertised 12 V stall torque at 9 V. |
| Controller | **Pico 2, RP2350, non-wireless; pre-soldered headers; C/C++** | One received 2026-10-03, untested. Concrete firmware target with encoder PIO, SPI, UART and USB logging. Begin USB/LED checks before attaching external hardware. |
| IMU | **SparkFun LSM6DSO Qwiic, SEN-18020; main SPI + data-ready interrupt** | Received per user 2026-10-03, untested; replaces Adafruit 4438 LSM6DSOX. Raw six-axis data; estimator runs on the MCU. Retain initial ±4 g, ±500°/s, 833 Hz sensor output and timestamped 500 Hz control as unmeasured targets. Use 3.3 V power/logic and verify breakout pads/jumpers. |
| Other feedback | Both wheel encoders, both driver CS/fault outputs, divided pack voltage, servo position/voltage/load feedback | Encoders on the motor side do not measure gearbox play or wheel slip. Verify leg home mechanically; servo feedback does not prove belt integrity. No magnetometer or distance sensor is required for manual proof trials. |
| Cameras | **Zero onboard cameras for V1-PROOF** | Use an existing external phone/camera to measure paths and record trials. No vision dependency in balance. V2 perception gets its own mass/power budget and camera decision after mobility passes. |
| Operator input | Existing laptop/gamepad via USB serial deadman for the fixture; qualified existing RC for untethered driving | Timestamped speed/yaw commands, deliberate arm, 250 ms command timeout. Keep a tether slack and overhead; tether forces invalidate a successful trial. A new full RC system is not assumed to fit the $60 allowance. |
| Power | **3S, approximately 2.2 Ah; separate 9 V servo and 5 V logic branches** | Exact reused battery/charger remain an inventory decision. Protection/regulator allowance increases from $45 to $65. A new nominal capacity does not prove discharge capability or pack health. |
| Structure | 230 mm track, 100 × 25 mm rubber tires, 110 mm parallel links, four total axes | First driving configuration is pinned at 30°. Keep electronics, wheel carriers and battery accessible. Tires/hubs/bearings are dimension-locked, not a falsely specified shopping cart. |

Primary specifications: [motor and encoder](https://www.pololu.com/product/4752), [driver carrier](https://www.pololu.com/product/4035), [ST3215 variants](https://www.waveshare.com/product/st3215-servo.htm), [Pico 2](https://www.raspberrypi.com/products/raspberry-pi-pico-2/), [SparkFun LSM6DSO breakout](https://www.sparkfun.com/sparkfun-6-degrees-of-freedom-breakout-lsm6dso-qwiic.html), [ST LSM6DSO register/data-rate reference, hosted by SparkFun](https://cdn.sparkfun.com/assets/c/f/9/d/1/lsm6dso_datasheet.pdf). We checked the Pico 2 USB instructions and the LSM6DSO specifications on 2026-10-03. We checked the motor wires and the driver interfaces again against Pololu on 2026-09-29. We checked the other selection specifications on 2026-09-28.

Vendor stock labels do not establish what shipped in this order. The [inventory](parts-on-hand.md) records the purchase status of the user separately.

## Interfaces that must be built correctly

The encoder gives **1920 counts per output revolution** with both edges of both channels. Power it at 5 V and convert its A/B signals to 3.3 V. Its specified supply starts above 3.3 V. Do not connect the 5 V outputs directly to the Pico 2. At 100 mm wheel diameter, one count is approximately 0.164 mm. Estimate the speed over several samples, and keep the low-latency position counts.

Set the DRV8874 **PMODE low** before enable. Set **IMODE directly to ground** for fixed-off-time regulation. In its default 20 kΩ state, IMODE reports the routine current chop on nFAULT. Do not confuse that report with a latched robot fault. Add a 3.3 V pull-up to each fault output.

Add a physical actuator-power cut and a hardware watchdog gate on **SLEEP**. Add an MCU fault latch that needs a deliberate rearm. In PH/EN mode, EN low brakes. SLEEP low disables the outputs. The automatic retry of the driver never authorizes a robot rearm.

Start the VREF calculation near 2.8 V with the 2.49 kΩ CS resistor of the board. Then measure the threshold and the tolerance.

An approximate divider is not a calibrated current limit. [TI current regulation and fault modes, Table 6](https://www.ti.com/lit/ds/symlink/drv8874.pdf).

Use PWM-synchronized CS samples and an instrumented motor-current check. Confirm the current sense during drive, brake and reversal before you derive the RMS current or close a current loop. The bounded torque response of the simulation is a bench target, not an implemented torque controller.

Use a correct 3.3 V-compatible half-duplex transceiver with direction control for the TTL servo bus. Validate the servo rail at the demand of both servos at the same time. Design the rail for approximately a **6 A short peak**. Make sure of the regulator thermal duty, the brownout margin and a defined return-energy clamp.

Do not assume that an ordinary buck regulator or a bench supply absorbs regenerated energy. The pack, the motor bus and both regulated branches need measured overvoltage protection. The exact regulator, fuse and clamp values wait for this measured circuit. Do not call this a released schematic.

Proposed Pico 2 pin allocation, to make sure of before you solder:

| Pico GPIO | Function |
| --- | --- |
| 0 / 1 | UART0 manual receiver or external command bridge |
| 2 / 3, 4 / 5 | Left and right quadrature encoders through level conversion |
| 6 / 7, 8 / 9 | Left PWM/direction, right PWM/direction |
| 10 | Both driver SLEEP inputs through kill/watchdog gating |
| 11 / 18 | Left / right active-low driver fault inputs |
| 12 / 13 / 14 / 15 | SPI1 MISO / chip-select / clock / MOSI |
| 16 | IMU data-ready interrupt |
| 17 | Servo transceiver direction |
| 19 | Deliberate arm input |
| 20 / 21 | UART1 servo TX / RX |
| 22 | Watchdog heartbeat; kill status handled by enable gate |
| 26 / 27 / 28 | Left current, right current, divided battery voltage |
| USB | Laptop commands and logs; never the hard kill path |

## Measured gates before this becomes a robot claim

1. Measure the total mass, the CoM and the pitch inertia. Use the same measured parameters in the simulator. Adjust the battery/frame mass position to keep the sprung fore/aft CoM in ±2 mm of the nominal balance line at pinned 30°. A near −4 mm offset exposed a limit in the grade-settle behavior. Do not accept that offset with a less strict test. Do a tire traction test on both intended floors. Inspect the full motor/bearing fit inside the 230 mm track.
2. Characterize **both** wheel channels at loaded battery minimum: 0.50 N·m short peak near 96 rpm, 0.15 N·m continuous, reversal response, voltage-to-torque response, deadband and gearbox lost motion. Keep the measured current/temperature traces. If the selected pair fails, reopen the motor decision with evidence. Do not increase the limits.
3. Demonstrate ≤6 ms sensor/estimator age and ≤10 ms effective drive lag under log load. These are simulation study limits, not datasheet promises. The firmware must allow for the estimator delay. A 25 ms delayed angle is not permitted.
4. Complete the [mobility and disturbance protocol](v1-proof-validation.md) with pinned legs before powered height adjustment. Fixed low/high simulated poses do not validate linkages in motion.
5. Do a test of the servo hold, the rail behavior and the measured pitch trim before ten powered height cycles. If the 9 V torque is not sufficient, keep the legs pinned and reopen the transmission/servo selection in the budget. Do not connect the servos directly to an unprotected full 3S pack.

## Carry forward to higher requirements

Keep a versioned command/telemetry contract: SI units, monotonic timestamps, sequence number, requested speed/yaw, measured attitude/rates, signed encoder counts, wheel current/voltage, leg feedback, control mode, saturation, sensor age and fault reason. A future Linux/vision computer sends bounded commands to the same MCU. The MCU keeps the balance, limits, watchdog and kill behavior.

V1 delivers the measured actuator maps, calibrated estimator, fault behavior, simulation regression cases and repeatable test fixture. V2 can add a single forward perception camera and companion compute after we allocate their power/mass and run these tests again. Larger steps, rough ground, side-shove recovery and stairs need new contact/leg authority and probably different mechanics and actuators. There is no promise that the proof chassis will scale to the stair climb.
