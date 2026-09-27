# Software

Empty on purpose. Linux companion code (Pi 5 now, ROS 2 in containers; Jetson Orin Nano Super class at P5) lives here later.

Intended later work (not now):

- Wi‑Fi telemetry that **reports the active manual mode**
- One camera stream for teleop
- Pathfinding inference (not on the MCU)
- Optional step/dir host **only if** the stepper fallback is used for knee / swing (R29)

See [`../docs/software.md`](../docs/software.md). Four manual modes come before cameras. Pathfinding **motion** waits on those modes.
