# Firmware

Empty on purpose. Robot firmware lives here **after** the RT MCU is on the bench.

- RT MCU: **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers (picked 2026-09-26; order-now cart). Two classic CAN 1 Mbit buses: A = wheels + hip roll, B = knees + hip swing. See [`../docs/electronics.md`](../docs/electronics.md).
- It runs the portable C++ control core at 1 kHz ([`../docs/software.md`](../docs/software.md)). No Betaflight / INAV / ArduPilot.
- F765-Wing images (P0–P1 bench: blink, CRSF, one SimpleFOC wheel) are throwaway.
- Manual modes (`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`) are specified in [`../docs/software.md`](../docs/software.md) — do not invent a mixer here.
- **Do not** treat drone firmware as a stepper host (R29). The MCU does not drive stepper coils (steppers are fallback only).
- First jobs: blink LED, then restrained wheel spin. See [`../docs/checklists/electronics-bringup.md`](../docs/checklists/electronics-bringup.md).
- Reuse existing control patterns (R18). Do not invent a novel Hux V1 balance stack to fill this folder.
