# Firmware

**2026-10-15:** the first program exists. [`firmware/bench`](bench/README.md) runs the electronics bench stages E0–E6 on the Pico 2. It compiles for `pico2`, with a prebuilt UF2 in `bench/release/`. No board test is recorded. **2026-10-03:** one Pico 2 with pre-soldered headers is received, untested. Start the [USB/LED bring-up checklist](../docs/checklists/2026-10-03-pico-bringup.md) with the official vendor examples.

V1-PROOF targets C/C++ with `PICO_BOARD=pico2`. The target also includes the received LSM6DSO IMU over SPI, two encoder wheel drivers and, later, two small leg servos. Sensor qualification is not complete. The LSM6DSO IMU replaces the earlier LSM6DSOX selection. Use the register initialization of the LSM6DSO IMU. [Software contract](../docs/software.md) and [software checklist](../docs/checklists/software-bringup.md).

Robot modes are `DISARMED`, `BALANCE`, `DRIVE`, `FAULT`. The `BENCH_ARMED` state of the bench firmware supports a lifted wheel before balance. Refer to the [bench controls and test plan](../docs/one-leg-bench.md). The servo bus is not implemented. CAN, one-wheel stance modes and stair control belong to the parked project.

The [electronics bench guide](../docs/electronics-bench-guide.md) defines the first program, `firmware/bench`, and its command contract. First jobs can be readback, bounded actuator motion and fault checks in the fixture. Then sensor logs and pinned-leg balance can follow.
