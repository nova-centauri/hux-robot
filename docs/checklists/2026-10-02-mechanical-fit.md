# First mechanical fit session — opened 2026-10-02

**Status: ready to begin; no test results recorded.** The user reports the 30:1 metal gearmotor and DRV8874 drivers received and the parts 3D printed. The existing paid baseline is Pololu 4752 / 4035; verify the received labels and total driver count. Servo arrival is unreported. This session checks the printed geometry and packaging by hand, with all power disconnected. No controller or servo is needed for these checks.

Use the [living layout and dated session timeline](../../tools/living-drawings/mechanical-tests.html) to inspect the spacer stack, compare poses and draft measurements as the session happens.

Use the [R01 assembly guide](../../cad/prints/v1-proof-r01/README.md#assemble-and-check-by-hand) if the prints match that revision. Its generic slots, pivot holes and wheel disc do not establish actuator mounts, bearing support or load capacity. Confirm the printed revision before using its spacer layout.

## Setup and received parts

- Test date / operator:
- Printed filenames or revision / printer / material / settings / quantities:
- Motor label / quantity / measured mass:
- Driver label / received quantity (paid receipt records one):
- Fasteners / washers / spacers / actual stack dimensions:
- Photos and measurement notes:

## First session

1. **Inspect and measure.** Look for cracks, separated layers, warped plates and damaged holes. Measure the fit coupon if printed; try the intended M4 hardware without forcing it. Measure both link center distances and both pivot separations. Do not scale the whole kit to correct a hole fit.
2. **Assemble the passive leg.** For R01, fit 2 mm spacers at both ends of the lower link and 12 mm spacers at both ends of the upper link, keeping the fixed plate and carrier behind both links. Select bolt lengths against the actual stack. Retain fasteners while allowing the pivots to move; check that bolt ends, heads and washers clear the other link.
3. **Support and sweep by hand.** Secure the fixed plate and support the carrier. With the servo/belt disconnected, move gently through 15°, 30° and 45° rearward from downward vertical. Check intermediate positions and approach from both directions. Stop at binding, rubbing, cracking or loose hardware; record the cause before changing anything.
4. **Check packaging with the received motor.** Measure its body, shaft, mounting features and cable exit. Hold or independently support it in the proposed location and inspect the motor, hub, wheel and cable envelope throughout the sweep. The optional 100 mm printed disc is a clearance reference, not a usable wheel. Record missing axle/bearing support and mounting details rather than loading the provisional printed holes or generic slots.
5. **Record repeatability.** If the first sweep is clear, make five slow hand sweeps and recheck pivot retention and print condition. At neutral, gently reverse the approach direction and record free play or axle-position change without applying a test payload. Save photos of the neutral pose and closest clearances.

For the 110 mm / 40 mm parallelogram, measure axle position relative to the lower body pivot; rearward and downward are positive. These are model references, not measured results or fit tolerances.

| Leg angle | Reference rearward x | Reference downward y | Measured x / y | Minimum clearance / binding / play |
| --- | ---: | ---: | --- | --- |
| 15° | 28.47 mm | 106.25 mm | | |
| 30° | 55.00 mm | 95.26 mm | | |
| 45° | 77.78 mm | 77.78 mm | | |

| Item | Design reference | Measured result / disposition |
| --- | --- | --- |
| Lower / upper link centers | 110 mm each | |
| Fixed / carrier pivot spacing | 40 mm each | |
| R01 pivot holes / intended hardware | 4.5 mm nominal / M4 provisional | |
| R01 lower / upper spacers | 2 mm / 12 mm at both ends | |
| Motor mass, envelope, shaft and mount | Measure received hardware | |
| Wheel, hub, bearings and cable clearance | 100 mm nominal wheel envelope | |
| Five hand sweeps / neutral free play | Observe and record | |

## Outcome and next gate

- [ ] Printed revision and dimensions recorded.
- [ ] Actual fastener stack retained without binding or collision.
- [ ] Full passive sweep and closest clearances recorded with photos.
- [ ] Motor/wheel packaging and outstanding mount/bearing details recorded.
- [ ] Repeat sweeps completed; print condition and free play recorded.

- Fit issues / failed checks / changes needed:
- Evidence paths:
- Next bounded test:

This session can establish passive fit observations only. Before powered wheel testing, detail a restrained motor mount and wheel support, then complete the [bench plan's power, current-limit, encoder and fault checks](../one-leg-bench.md#power-and-interfaces). Powered leg motion additionally needs the received servo, supported transmission and qualified fixture. R01 has no applied-load qualification; loaded testing needs a reviewed load path and the later bench gates. Keep every unperformed stage open in the [full session record](one-leg-bench-session.md).
