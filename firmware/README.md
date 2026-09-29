# Firmware

No embedded implementation yet. V1-PROOF starts on the selected Pico 2 / SPI LSM6DSOX baseline or a qualified reused equivalent, with two encoder wheel drivers and later two small leg servos. [Software contract](../docs/software.md) and [bring-up checklist](../docs/checklists/software-bringup.md).

Robot modes are `DISARMED`, `BALANCE`, `DRIVE`, `FAULT`. A proposed `BENCH_ARMED` state supports a rigidly fixed single leg and lifted wheel before balance; see the [bench controls and test plan](../docs/one-leg-bench.md). No bench controller has been implemented. CAN, one-wheel stance modes and stair control belong to the parked project. First jobs can be readback, bounded actuator motion and fault checks in the fixture, followed by sensor logging and pinned-leg balance.
