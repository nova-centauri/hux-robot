# First mechanical fit session — opened 2026-10-02

**Status: ready to start. No test results are recorded.** The user reports that the 30:1 metal gearmotor and the DRV8874 drivers arrived. The user also reports that the parts are 3D printed. The paid baseline is Pololu 4752 / 4035.

Do a check of the received labels and the total driver count. The servo arrival is not reported. This session checks the printed geometry and the packaging by hand, with all power disconnected. These checks do not need a controller or a servo.

Use the [living layout and dated session timeline](../../tools/living-drawings/mechanical-tests.html) during the session. Use it to inspect the spacer stack and to compare the poses. Use it to draft the measurements as the session happens.

If the prints match revision R01, use the [R01 assembly guide](../../cad/prints/v1-proof-r01/README.md#assemble-and-check-by-hand). Its generic slots, pivot holes and wheel disc do not give actuator mounts, bearing support or load capacity. Confirm the printed revision before you use its spacer layout.

## Setup and received parts

- Test date / operator:
- Printed filenames or revision / printer / material / settings / quantities:
- Motor label / quantity / measured mass:
- Driver label / received quantity (paid receipt records one):
- Fasteners / washers / spacers / actual stack dimensions:
- Photos and measurement notes:

## First session

1. **Inspect and measure.** Look for cracks, separated layers, warped plates and damaged holes. If the fit coupon is printed, measure it. Try the intended M4 hardware. Do not apply force. Measure both link center distances and both pivot separations. Do not scale the whole kit to correct a hole fit.
2. **Assemble the passive leg.** For R01, fit 2 mm spacers at both ends of the lower link. Fit 12 mm spacers at both ends of the upper link. Keep the fixed plate and the carrier behind both links. Select the bolt lengths against the actual stack. Retain the fasteners, but let the pivots move. Make sure that the bolt ends, heads and washers do not touch the other link.
3. **Support and sweep by hand.** Secure the fixed plate. Support the carrier. Make sure that the servo/belt is disconnected. Move the leg carefully through 15°, 30° and 45° rearward from the downward vertical. Check the intermediate positions. Approach each position from both directions. Stop if a part binds, rubs or cracks. Stop if hardware is loose. Record the cause before you change anything.
4. **Check the packaging with the received motor.** Measure the motor body, the shaft, the mount features and the cable exit. Hold the motor in the proposed location, or support it independently. Inspect the motor, hub, wheel and cable envelope during the full sweep. The optional 100 mm printed disc is a clearance reference, not a usable wheel. Do not load the provisional printed holes or the generic slots. Record the missing axle/bearing support and the missing mount details.
5. **Record repeatability.** If the first sweep is clear, make five slow hand sweeps. Then check the pivot retention and the print condition again. At neutral, carefully reverse the approach direction. Record the free play or the axle-position change. Do not apply a test payload. Save photos of the neutral pose and the closest clearances.

For the 110 mm / 40 mm parallelogram, measure the axle position relative to the lower body pivot. Rearward and downward are positive. The reference values below are model references, not measured results or fit tolerances.

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

- [ ] The printed revision and the dimensions are recorded.
- [ ] The actual fastener stack is retained. No part binds or collides.
- [ ] The full passive sweep and the closest clearances are recorded with photos.
- [ ] The motor/wheel packaging and the open mount/bearing details are recorded.
- [ ] The repeat sweeps are complete. The print condition and the free play are recorded.

- Fit issues / failed checks / changes needed:
- Evidence paths:
- Next bounded test:

This session can give passive fit observations only. Before a powered wheel test, detail a restrained motor mount and a wheel support. Then complete the [bench plan's power, current-limit, encoder and fault checks](../one-leg-bench.md#power-and-interfaces). Powered leg motion also needs the received servo, a supported transmission and a qualified fixture. R01 has no applied-load qualification, so a loaded test needs a reviewed load path and the later bench gates. If a stage is not done, keep it open in the [full session record](one-leg-bench-session.md).
