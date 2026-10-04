# Single-leg bench session record

Copy this template for each test session. If a test is not done, leave its box unchecked. Obey the [bench plan](../one-leg-bench.md). The creation of this file does not complete a physical test.

## Setup

- Date / operator / session ID:
- Purpose and stage:
- Motor, driver and servo exact models / quantity / serial or bus ID:
- Controller / interface / firmware version / host revision:
- Supply model / output voltage / current limit / grounding arrangement:
- Actuator current-limit setting / verification method:
- Fuse / wire / physical cut / catch fixture / return-energy protection:
- Logic rail / encoder level conversion:
- Link centers / pivot separation / reduction / wheel diameter:
- Neutral reference / sign mapping / physical and software travel limits:
- Load, force direction, lever arm and assembly self-weight contribution:
- Planned duration / speed / acceleration:
- Predeclared stop limits: voltage ___ / measured current ___ / temperature ___ / tracking error ___ / stale feedback ___:
- Photo, wiring drawing and log paths:

## Before motion

- [ ] The exact actuator voltage variant and the connector polarity are confirmed.
- [ ] The fixture is clamped. The catch supports the mechanism with the torque off.
- [ ] The passive sweep is checked. The cables and the wheel are clear.
- [ ] The current limits, fuse, return-energy path and independent power cut are checked for this test.
- [ ] The sign and the neutral are measured. The targets are bounded. No lock pin is engaged on an energized leg.
- [ ] The readback is fresh. The first target matches the supported current position.
- [ ] There is no automatic enable or sweep on connect/reset.

## Measurements

| Trial / command | Actual angle or rpm | Error / backlash | Rail min/max | Current (state what/where measured) | Start/end/peak temperature | Result / stop reason |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |
| | | | | | | |
| | | | | | | |

## Fault checks, when implemented

- [ ] The software stop behavior is observed.
- [ ] The deadman release and the command timeout are observed.
- [ ] The host disconnect / controller reset is observed.
- [ ] The servo communication loss / missing wheel feedback is observed in a supported test.
- [ ] The physical cut works without laptop or controller cooperation.
- [ ] A reconnect / reset / fault clearance produces no motion until a deliberate rearm.
- [ ] Both actuator feeds are tested. The servo hold after loss of communications is contained.

## Outcome

- Passed stages (with evidence):
- Failures / unexpected motion / resets / binding / transients:
- Changed assumptions or dimensions:
- Next bounded test:
- Qualification still open:
