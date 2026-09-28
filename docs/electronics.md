# V1-PROOF electronics

**Reuse a suitable MCU, IMU, manual controller and power equipment.** No CAN, 8S, new Linux computer or camera is required. [Previous electronics plan](archive/stair-v1/electronics.md) is parked.

```text
Compatible 3S battery -> fuse + physical motor-power cut
  -> two bidirectional H-bridges -> encoder wheel gearmotors
  -> suitable servo rail -> two small leg servos (later stage)
  -> separate logic regulator -> MCU + IMU + receiver
MCU -> PWM/direction/enable -> wheel drivers
MCU <- wheel encoders + current/fault feedback
MCU <-> UART half-duplex adapter or PWM -> leg servos
MCU <- RC or other timed manual command link
MCU -> USB/serial logs -> existing laptop
```

## Reuse qualification

Historical candidates are F765/F722/Mamba boards or ESP32 plus an IMU. Ownership and exact revisions remain unconfirmed. Select the available board after mapping two wheel PWM/direction channels, driver enables, two quadrature encoders, IMU, current inputs and manual/servo communications. Verify logic levels, usable pins and timer/interrupt capacity. CAN support is irrelevant to this proposed interface.

The TBS Nano requires a compatible transmitter, not just a receiver. A known laptop/gamepad can provide a bounded-rate manual link with a deadman timeout if RC is unavailable. Pi 5 can be an off-robot logger; it does not run the time-critical balance loop or need a robot power allocation.

## Power and drivers

The proposed battery is a 3S pack around 2.2 Ah: 11.1 V nominal, 12.6 V full. The 9.9 V wheel sizing point is an assumption, not the selected pack's approved cutoff. Determine low-voltage behavior from the actual pack and load. Do not reuse an unknown/damaged pack or feed a higher-cell-count pack into 12 V parts.

Wheel reference: a 12 V encoder gearmotor and a current-sensing, bidirectional H-bridge such as the G2 18v17. Driver operating voltage must cover full charge and braking transients. Initially qualify 2.5 A short peaks and 1.2 A RMS per wheel. The reference driver's factory chopping threshold is far too high; implement and measure a lower limit before connecting an unrestricted pack. Motor torque/current estimates are in [sizing](v1-proof-sizing.md).

The current G2 revision enables its sleep input by default; provide a deliberate hardware disable at reset. Its current-sense output omits braking intervals, so an unqualified average of that signal is not motor RMS current. Verify the waveform and limit with bench instrumentation before relying on telemetry. [Manufacturer pinout and current-sense notes](https://www.pololu.com/product/2991).

The 12 V ST3215 reference is listed for 6–12.6 V; that maximum leaves no transient headroom on a fully charged 3S pack. Prefer a suitable regulated servo rail with voltage margin and a defined clamp/energy path, then qualify torque at its lowest loaded voltage. Verify the exact servo variant. Its power wiring must support simultaneous servo current without resetting logic. A half-duplex interface is required for the serial version; a bare UART TX/RX tie is not the design.

Encoders may need level conversion for a 3.3 V MCU. Keep motor/servo current out of the controller board, use a common signal reference, and provide appropriate connectors, fusing, branch wiring, strain relief and local capacitance. A bench supply that cannot absorb braking energy is not a battery substitute without a defined energy path. Power conversion, protection and interfaces have explicit [budget](bom.md) rows.

## First bench result

USB-powered control and sensor logging, then one restrained wheel, then two. Check encoder direction, timing, current limit, fault flags, kill and command loss before putting the pinned chassis in its catch frame. [Electronics checklist](checklists/electronics-bringup.md).
