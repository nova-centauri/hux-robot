# Firmware

No embedded implementation yet. V1-PROOF starts on the selected Pico 2 / SPI LSM6DSOX baseline or a qualified reused equivalent, with two encoder wheel drivers and later two small leg servos. [Software contract](../docs/software.md) and [bring-up checklist](../docs/checklists/software-bringup.md).

Modes are `DISARMED`, `BALANCE`, `DRIVE`, `FAULT`. CAN, one-wheel modes and stair control belong to the parked project. First jobs are sensor logging, restrained wheel testing and pinned-leg balance.
