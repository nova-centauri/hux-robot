# V1-PROOF hardware decisions — updated 2026-10-02

**Freeze this component baseline for bench qualification.** The user requested dependable forward/reverse travel, both turns, turning in place, bounded disturbance tolerance and a useful foundation for later versions. Receipts reconciled September 29 confirm **one Pololu 4752 motor, one Pololu 4035 driver and two ST3215-series servos**, with **$143.12 paid including shipping and tax**. **2026-10-02: the user reports the 30:1 motor and DRV8874 drivers received and parts printed**; total delivered driver count, received labels and printed revision/material remain to record. The user confirmed the 12 V servo variant; servo arrival remains unreported. [Purchase evidence](purchases.md) and [inventory](parts-on-hand.md) track those facts. Begin the [passive mechanical fit session](checklists/2026-10-02-mechanical-fit.md). RobStride is intended for the future full-size Hux. Fit and physical performance remain separate release gates. The [budget](bom.md) retains a **$900 planning allocation including $100 freight/tax and $125 repair reserve**, with no assumed reuse credit.

## Ordered parts define the build

**Pololu 4752 wheel motors, Pololu 4035 wheel drivers and ST3215 12 V leg servos are the locked purchased baseline.** Design the harness, motor mounts, wheel hubs and leg transmission around these exact models. The robot needs two of each: one wheel motor is received and a second remains to buy; drivers are received, with total count pending; both leg servos are ordered, with arrival unreported. Inspection and tested condition still need recording. Retain the 100 mm wheel / 3:1 leg-belt concept while fit, strength and performance are qualified.

The remaining supporting electronics are **selected, purchase unconfirmed**: Pico 2, LSM6DSOX IMU, encoder level conversion, servo bus interface and power protection. The purchased motor/driver pair supports one bench wheel channel, not a complete two-wheel drive system. Substituting an actuator or driver reopens this baseline explicitly; finding a suitable existing controller only changes the implementation after qualification. See [what the motor connects to](electronics.md#what-will-the-motor-plug-into) and [how Hux intelligence works](software.md#how-the-intelligence-works).

| Subsystem | Decision | Reason and release condition |
| --- | --- | --- |
| Wheel motors | **2 × Pololu 4752**, 12 V, 30:1, integrated encoders | Keep 100 mm rubber wheels. Bench-test reversals, backlash, current and torque at minimum operating voltage. This is the selected motor, replacing the earlier open motor-class choice. |
| Wheel drivers | **2 × Pololu 4035, DRV8874** | Adjustable current limit suits this motor; default sleep supports disabled startup. Use PH/EN, 3.3 V control, measured 2.5 A peak limit and initial 1.2 A RMS ceiling. Replaces the G2 18v17 reference and saves $60 in allocations. |
| Leg actuators | **2 × Waveshare ST3215, 30 kg-cm @ 12 V variant**, 3:1 belts | Bearing-supported pivots, physical stops and lock pins. **Regulated 9 V branch**; qualify 0.75 N·m hold for ten minutes and 1.0 N·m transient at its lowest loaded output. No credit for the advertised 12 V stall torque at 9 V. |
| Controller | **Raspberry Pi Pico 2, RP2350, non-wireless; C/C++** | Concrete firmware target with encoder PIO, SPI, UART and USB logging. Confirmed existing equipment may displace it only after meeting the same I/O, latency and fault contract. |
| IMU | **Adafruit 4438 LSM6DSOX breakout, SPI + data-ready interrupt** | Raw six-axis data; estimator runs on the MCU. Initial ±4 g, ±500°/s, 833 Hz sensor output and timestamped 500 Hz control. Tune filtering from measured noise and latency. |
| Other feedback | Both wheel encoders, both driver CS/fault outputs, divided pack voltage, servo position/voltage/load feedback | Encoders on the motor side do not measure gearbox play or wheel slip. Verify leg home mechanically; servo feedback does not prove belt integrity. No magnetometer or distance sensor is required for manual proof trials. |
| Cameras | **Zero onboard cameras for V1-PROOF** | Use an existing external phone/camera to measure paths and record trials. No vision dependency in balance. V2 perception gets its own mass/power budget and camera decision after mobility passes. |
| Operator input | Existing laptop/gamepad via USB serial deadman for the fixture; qualified existing RC for untethered driving | Timestamped speed/yaw commands, deliberate arm, 250 ms command timeout. Keep a tether slack and overhead; tether forces invalidate a successful trial. A new full RC system is not assumed to fit the $60 allowance. |
| Power | **3S, approximately 2.2 Ah; separate 9 V servo and 5 V logic branches** | Exact reused battery/charger remain an inventory decision. Protection/regulator allowance increases from $45 to $65. A new nominal capacity does not prove discharge capability or pack health. |
| Structure | 230 mm track, 100 × 25 mm rubber tires, 110 mm parallel links, four total axes | First driving configuration is pinned at 30°. Keep electronics, wheel carriers and battery accessible. Tires/hubs/bearings are dimension-locked, not a falsely specified shopping cart. |

Primary specifications: [motor and encoder](https://www.pololu.com/product/4752), [driver carrier](https://www.pololu.com/product/4035), [ST3215 variants](https://www.waveshare.com/product/st3215-servo.htm), [Pico 2](https://www.raspberrypi.com/products/raspberry-pi-pico-2/), [LSM6DSOX breakout](https://www.adafruit.com/product/4438), [ST LSM6DSOX register/data-rate reference](https://www.st.com/resource/en/datasheet/lsm6dsox.pdf). Motor wiring and driver interfaces rechecked against Pololu on 2026-09-29. Other selection specifications were checked 2026-09-28. Vendor stock labels do not establish what shipped in this order; [inventory](parts-on-hand.md) records the user's purchase status separately.

## Interfaces that must be built correctly

The encoder provides **1920 counts per output revolution** using both edges of both channels. Power it at 5 V and level-shift its A/B signals to 3.3 V; its specified supply starts above 3.3 V. Do not connect 5 V outputs directly to the Pico. At 100 mm wheel diameter, one count is approximately 0.164 mm. Estimate speed over several samples while retaining low-latency position counts.

Set DRV8874 **PMODE low** before enable. Set **IMODE directly to ground** for fixed-off-time regulation: its default 20 kΩ state reports routine current chopping on nFAULT, which must not be mistaken for a latched robot fault. Add a 3.3 V pull-up to each fault output, a physical actuator-power cut and hardware watchdog gate on **SLEEP**, and MCU fault latching requiring deliberate rearm. In PH/EN mode, EN low brakes; SLEEP low disables the outputs. Driver automatic retry never authorizes robot rearming. Start VREF sizing near 2.8 V with the board's 2.49 kΩ CS resistor, then measure the threshold and tolerance; an approximate divider is not a calibrated current limit. [TI current regulation and fault modes, Table 6](https://www.ti.com/lit/ds/symlink/drv8874.pdf).

Use PWM-synchronized CS samples and an instrumented motor-current check. Confirm sensing during drive, braking and reversal before deriving RMS current or closing any current loop. The simulation's bounded torque response is a bench target, not an implemented torque controller.

Use a proper 3.3 V-compatible half-duplex transceiver for the TTL servo bus with direction control. Validate the servo rail at simultaneous demand: size around **6 A short peak**, verify regulator thermal duty, brownout margin and a defined return-energy clamp. Neither an ordinary buck regulator nor a bench supply is presumed to absorb regenerated energy. The pack, motor bus and both regulated branches need measured overvoltage protection. Exact regulator, fuse and clamp values await this measured circuit; do not call this a released schematic.

Proposed Pico pin allocation, to verify before soldering:

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

1. Measure total mass, CoM and pitch inertia; use the same measured parameters in the simulator. Adjust battery/frame mass placement to keep the sprung fore/aft CoM within ±2 mm of the nominal balance line at pinned 30°. A near −4 mm offset exposed a grade-settling limit; do not accept it by relaxing the test. Test tire traction on both intended floors. Inspect full motor/bearing fit inside the 230 mm track.
2. Characterize **both** wheel channels at loaded battery minimum: 0.50 N·m short peak near 96 rpm, 0.15 N·m continuous, reversal response, voltage-to-torque response, deadband and gearbox lost motion. Keep measured current/temperature traces. If the selected pair fails, reopen the motor decision with evidence instead of increasing limits.
3. Demonstrate ≤6 ms sensor/estimator age and ≤10 ms effective drive lag under logging load. These are simulation study bounds, not datasheet promises. Firmware must account for estimator delay; a 25 ms delayed angle is not acceptable.
4. Complete the [mobility and disturbance protocol](v1-proof-validation.md) with pinned legs before powered height adjustment. Fixed low/high simulated poses do not validate moving linkages.
5. Test servo hold, rail behavior and measured pitch trim before ten powered height cycles. If 9 V torque is insufficient, keep legs pinned and reopen transmission/servo selection within the budget; do not connect the servos directly to an unprotected full 3S pack.

## Carry forward to higher requirements

Keep a versioned command/telemetry contract: SI units, monotonic timestamps, sequence number, requested speed/yaw, measured attitude/rates, signed encoder counts, wheel current/voltage, leg feedback, control mode, saturation, sensor age and fault reason. A future Linux/vision computer sends bounded commands to the same MCU; the MCU retains balance, limits, watchdog and kill behavior.

V1 delivers the measured actuator maps, calibrated estimator, fault behavior, simulation regression cases and repeatable test fixture. V2 may add a single forward perception camera and companion compute after allocating their power/mass and rerunning these tests. Larger steps, rough ground, side-shove recovery and stairs need new contact/leg authority and probably different mechanics and actuators. The proof chassis is not promised to scale to stair climbing.
