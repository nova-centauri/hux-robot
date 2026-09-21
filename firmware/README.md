# Firmware

Empty on purpose. FC firmware / embedded bring-up lives here **after** an FC is on the bench.

- Flight controller is **TBD** (candidates in [`../docs/electronics.md`](../docs/electronics.md)).
- Do not pick Betaflight / INAV / ArduPilot / custom in this stub.
- Manual modes (`PARKED` / `TWO_WHEEL` / `LEFT_ONLY` / `RIGHT_ONLY`) are specified in [`../docs/software.md`](../docs/software.md) — do not invent a mixer here.
- **Do not** treat drone firmware as a stepper host (R29). FC does not drive stepper coils.
- First jobs: blink LED, then restrained wheel spin. See [`../docs/checklists/electronics-bringup.md`](../docs/checklists/electronics-bringup.md).
- Reuse existing control patterns (R18). Do not invent a novel Hux V1 balance stack to fill this folder.
