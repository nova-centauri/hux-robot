# V1-PROOF electronics

**Selected baseline: Pico 2, SPI LSM6DSOX, two Pololu 4035 DRV8874 carriers and two ST3215 12 V variant servos.** [Exact interfaces, proposed GPIO map, component sources and qualification gates](v1-proof-hardware.md). Confirmed equivalent existing equipment may reduce spend only after it meets the same contract. No onboard Linux computer or camera is required.

```text
3S pack -> fuse + physical motor-power cut
  -> two DRV8874 H-bridges -> Pololu 4752 encoder gearmotors
  -> regulated/protected 9 V branch -> two ST3215 leg servos
  -> separate 5 V logic regulator -> Pico 2 + 3.3 V IMU/interface logic
Pico <- SPI IMU + 5 V encoder signals through level conversion
Pico <- both driver current/fault signals + divided pack voltage
Pico -> PWM/direction + watchdog/kill-gated enable -> wheel drivers
Pico <-> half-duplex UART transceiver -> servo bus
Pico <- timed manual commands / deliberate arm
Pico <-> USB serial -> existing laptop logging/gamepad
```

## Power and interfaces

Keep motor/servo current out of the controller PCB. Verify common signal reference, connector ratings, fusing, wire gauge, strain relief and local capacitance. The 9.9 V simulation input is a sizing point; actual pack condition and loaded cutoff must be measured. The battery, charger, regulators and energy clamps are not yet released circuits.

Target a 9 V servo branch capable of approximately 6 A short simultaneous peak, then qualify actual duty at the lowest loaded output. Protect every branch against regenerated energy; ordinary regulators and bench supplies do not necessarily absorb it. The selected 12 V servo variant is not connected directly to an unprotected fully charged 3S bus. Mounted servo holding duty must pass at 9 V.

Set both wheel drivers to PH/EN with **PMODE low and IMODE directly grounded**, making normal current chopping distinct from a reported driver fault. Measure the 2.5 A peak current threshold, response at reversal and PWM-synchronized sensing. Begin with a 1.2 A RMS limit and qualify temperature/pulse duration. Do not infer actual current from PWM duty. Pull fault outputs up to 3.3 V; fault and watchdog behavior latch at the robot controller and require deliberate rearm.

Motor encoders require a suitable 5 V supply and level conversion to the Pico. The SPI IMU uses a data-ready interrupt and timestamps. The servo bus requires a proper 3.3 V-compatible half-duplex transceiver, not tied bare TX/RX pins.

## Bring-up order

USB-powered logging and sensor calibration first; then one restrained wheel, both wheel channels and the pinned chassis. Check direction/encoder sign, motor response, current limit, stale data, reset, watchdog and physical kill before free balancing. Measure sensor/estimator age ≤6 ms and effective drive lag ≤10 ms under worst intended telemetry load; these are study bounds to verify, not guaranteed component performance.

The TBS Nano is reusable only with a compatible, available transmitter. Initial laptop/gamepad commands use a 250 ms deadman and a slack tether in the fixture. Untethered RC and the ten-minute duty trial are separate physical checks. [Electronics checklist](checklists/electronics-bringup.md).
