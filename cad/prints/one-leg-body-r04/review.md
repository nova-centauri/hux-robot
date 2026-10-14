# Body fit review and R04 revision - 2026-10-13

## User report

The user reports that the two body walls and three horizontal layers do not fit together properly. The user also reports missing servo and leg motor holes. The user retains the planned parts. The ST3215 servos have not arrived. Most other parts are on hand, but the report gives no further itemized inventory.

The printed revision and the identity of the third horizontal plate remain to confirm. R03 defines two decks. No photographs, dimensions, gap measurements or hole measurements accompany this report. Do not assign a measured cause to an individual failed joint.

## CAD findings

| Finding | Evidence | R04 correction |
| --- | --- | --- |
| Zero deck side clearance | R03 deck width and frame opening both equal 135 mm | 133.8 mm deck in a 135 mm opening, 0.6 mm per side |
| Tight bracket cavity | R03 angle has 26 mm arms and holes 13 mm from the corner | 34 mm arms, 18 mm hole offsets, checked M4 hardware and 12 mm socket access |
| Body deck count differs from user report | R03 manifest supplies two decks; user describes three layers | One matched set with three distinct decks and twelve angles |
| No dedicated PCB interfaces | R03 decks contain generic slots | Removable Pico and IMU plates with manufacturer hole patterns |
| No ST3215 case mount | R03 guide explicitly excludes this mount | Open case cradle, two cap bars, captive nuts and wall access holes |
| Unclear motor attachment | Motor pattern exists on R03 carrier, not body walls | Explicit motor carrier, retained offset shaft pattern and cable anchors |
| Incomplete assembly validation | R03 checks omit fasteners, tools, electronics and servo | R04 checks include brackets, socket access, board hardware and component space |

The first R04 CAD checks exposed a Pico spacer/header clash and a servo cap clash against the vendor model. The revision corrects both. It also adds 4 mm feet below removable plates for nut access. These are CAD findings, not observations of printed R04 parts.

## Deliverables

Use the [R04 kit and assembly guide](README.md). The kit includes STL parts, STEP solids, a Blender assembly, four engineering sheets and repeatable source checks. It includes a hole coupon and two small corner samples.

The kit supplies mounts for the identified one-leg bench components. Configurable carriers provide attachment space for the remaining interface and power boards. Exact fits for unidentified switches, regulators and protection boards remain open. The external bench supply stays off the body.

The ST3215 mount supports initial servo bench tests. The 3:1 transmission, supported driven shaft, bearings, pulleys and hard stops remain unfinished. Do not apply servo torque through the passive M4 pivots. This limitation remains separate from the new case mount.

## First fit checklist

Keep actuator power disconnected for these checks.

- [ ] Identify the third horizontal plate from its shape and dimensions.
- [ ] Record the old body joint that fails, with a photograph and measured gap.
- [ ] Print the R04 coupon, one angle and both joint samples.
- [ ] Fit both M4 x 16 bolts, washers and plain nuts into the sample joint.
- [ ] Check both nuts with the actual tool.
- [ ] Check the 4.6 mm holes and the adjustment slot without force.
- [ ] Print one R04 wall and lower deck after the joint trial fits.
- [ ] Check 135 mm inside width, 0.6 mm side gaps and the angle positions.
- [ ] Check the real Pico headers, IMU pattern, motor pilot and motor screw engagement.
- [ ] Record the exact power and interface boards before their carrier layout.
- [ ] Check the servo case, connector and both output faces after arrival.
- [ ] Record the full harness sweep with the retained leg stack and catch support.

## Status

The user report establishes a body fit problem. The new geometry passes the checks described in the kit validation record. No R04 print, physical fit, load test or powered test is complete. No print was dispatched. Recorded project spend remains $173.70.
