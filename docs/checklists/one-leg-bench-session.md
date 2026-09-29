# Single-leg bench session record

Copy this template for each test session; leave unperformed tests unchecked. Follow the [bench plan](../one-leg-bench.md). No physical test has been completed by creating this file.

## Setup

- Date / operator / session ID:
- Purpose and stage:
- Motor, driver and servo exact models / quantity / serial or bus ID:
- Controller / interface / firmware version / host revision:
- Supply model / output voltage / current limit / grounding arrangement:
- Actuator current-limit setting and how it was verified:
- Fuse / wire / physical cut / catch fixture / return-energy protection:
- Logic rail / encoder level conversion:
- Link centers / pivot separation / reduction / wheel diameter:
- Neutral reference / sign mapping / physical and software travel limits:
- Load, force direction, lever arm and assembly self-weight contribution:
- Planned duration / speed / acceleration:
- Predeclared stop limits: voltage ___; measured current ___; temperature ___; tracking error ___; stale feedback ___:
- Photo, wiring drawing and log paths:

## Before motion

- [ ] Exact actuator voltage variant and connector polarity confirmed.
- [ ] Fixture clamped; catch supports the mechanism with torque off.
- [ ] Passive sweep checked; cables and wheel clear.
- [ ] Current limits, fuse, return-energy path and independent power cut checked for this test.
- [ ] Sign and neutral measured; targets bounded; no lock pin engaged on an energized leg.
- [ ] Readback is fresh; first target matches supported current position.
- [ ] No automatic enable or sweep on connect/reset.

## Measurements

| Trial / command | Actual angle or rpm | Error / backlash | Rail min/max | Current (state what/where measured) | Start/end/peak temperature | Result / stop reason |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
| | | | | | | |
| | | | | | | |

## Fault checks, when implemented

- [ ] Software stop behavior observed.
- [ ] Deadman release and command timeout observed.
- [ ] Host disconnect / controller reset observed.
- [ ] Servo communication loss / missing wheel feedback observed in a supported test.
- [ ] Physical cut works without laptop or controller cooperation.
- [ ] Reconnect / reset / fault clearance produces no motion until deliberate rearm.
- [ ] Both actuator feeds tested; servo hold after loss of communications is contained.

## Outcome

- Passed stages (with evidence):
- Failures / unexpected motion / resets / binding / transients:
- Changed assumptions or dimensions:
- Next bounded test:
- Qualification still open:
