# Single-leg bench plan

**2026-09-29 — preparation plan; no hardware has been tested.** Build a restrained, two-axis test article: one leg adjustment and one driven wheel. Learn wiring, signs, position control, wheel speed control, backlash and power behavior before attempting balance. No IMU, second leg, battery or full chassis is needed for these first experiments.

## Parts and scope

**Receipts reconciled 2026-09-29:** **one Pololu 4752 wheel motor + one Pololu 4035 DRV8874 driver are shipped; two ST3215 servos are paid**, awaiting shipment in the latest vendor record. **$143.12 is paid**, including shipping/tax. The user confirms the servo 12 V variant; verify labels on arrival. This supplies the purchased actuator baseline for the first bench channel; the two-wheel robot still needs a second motor/driver. A bench supply is available, with ratings unconfirmed. Controller, servo interface and harness availability remain to record. See [paid orders](purchases.md), [inventory](parts-on-hand.md) and [hardware selection](v1-proof-hardware.md).

**This plan is for V1-PROOF and the confirmed Pololu/ST3215 actuators.** RobStride is intended for the future full-size Hux. The 110 mm linkage geometry applies to this test version; final structural fits and the power circuit still need measured hardware and supply checks.

This bench work can happen **before** two-wheel balance. The pinned-leg-first rule still applies to the free-standing robot. A successful single-leg bench test does not establish balance or payload capacity.

## Prepare before delivery

**2026-09-29 — passive print kit drafted:** the [V1-PROOF R01 kit](../cad/prints/v1-proof-r01/README.md) provides eight STL part types and a Blender project for a **Bambu X1C / PLA** mockup of the 110 mm links and 40 mm pivot spacing. **Print the fit coupon first**, measure it and try the intended M4 hardware; its clearances and the printed sections remain provisional. This is a hand-moved geometry mockup, not the powered bench fixture. No physical print, fit or load test has been completed, and no bench stage is closed. The ordered actuators remain awaiting arrival.

1. Print the [1:1 geometry template](../cad/layouts/one-leg-bench-template.svg) at actual size and check its 100 mm scale. Make a paper or scrap linkage; leave actuator-specific mounts and bearing holes unfinished.
2. Assemble a rigid base and upright, with two body-pivot centers 40 mm apart vertically. Clamp or bolt the base to the bench. Include a padded catch immediately beneath the moving assembly and room for its whole sweep.
3. Prepare two equal link blanks, a vertical carrier, spacers and a removable neutral-position lock. Use a common drilling jig so the two center distances match. Final material section, edge distances, bearings, fits and fasteners await a side-view **and end-view** assembly detail.
4. Lay out a fused actuator-power harness, physical power cut, separate USB/logic path and labeled test points. Leave supply output off until the received parts and connector polarities are identified.
5. Prepare a ruler/angle scale, calipers, multimeter, temperature measurement, camera and the [session record](checklists/one-leg-bench-session.md). A scope is needed to qualify short power transients; a supply display cannot show them reliably.
6. Confirm the available controller/servo interface and supply model. Check whether a supported host driver is needed on the actual laptop. Inventory missing functions before buying anything else.

## Link lengths and fixture

This leg is a **parallelogram**, not a thigh and shin in series. Both bars connect the body to the same carrier; there is one powered leg coordinate.

| Feature | Prototype geometry |
| --- | --- |
| Links | **2 × 110 mm pivot-center to pivot-center**, for one leg |
| Body pivot separation | **40 mm vertically** |
| Carrier pivot separation | **40 mm vertically**, matching the body |
| Wheel axle | At the lower carrier pivot in the kinematic model; real coaxial support needs detailing |
| Neutral | **30° rearward from downward vertical** |
| Design range | **15–45°**; initial powered range is smaller |
| Reduction | Servo turns 3° for each 1° of leg motion; 3:1 belt reduction to an independently supported shaft |
| Wheel envelope | **100 mm diameter** nominal |

110 mm is the distance **between holes**, not the finished stock length. Do not cut two 110 mm end-to-end bars and then place the holes inside them. Additional end material depends on the selected bearings, bolt size and load path. Mark centers now; final structural machining follows those choices.

For the lower body pivot at `(0, 0)`, rearward `x` positive and downward `y` positive, the axle is `(110 sin q, 110 cos q)` in millimeters. The upper body and carrier pivots are 40 mm above their corresponding lower pivots.

| Leg angle q | Axle rearward x | Axle below lower body pivot y | Servo offset from calibrated neutral |
| --- | ---: | ---: | ---: |
| 15° | 28.47 mm | 106.25 mm | −45° × installed direction sign |
| 30° | 55.00 mm | 95.26 mm | 0° |
| 45° | 77.78 mm | 77.78 mm | +45° × installed direction sign |

Full travel changes the vertical separation by **28.47 mm** and shifts the axle fore/aft by **49.31 mm**. It is not a straight vertical slide. For floor-supported loading, allow the body to rise/fall while the wheel rolls. On the fixed-body bench rig, apply a measured load that can follow both coordinates of the carrier arc; a fixed-height floor or roller blocks the vertical motion even if the wheel is free to roll.

**Resolve these clearances in the mockup:**

- The parallel link centerlines are only `40 sin(q)` apart perpendicular to their length: **10.35 mm at 15°**. Common flat bars in the same plane can collide. Offset the bars into separate lateral planes with appropriate spacers/bearing support, and check bolts, bosses and flex throughout the sweep. Spacers create bending loads that still need structural review.
- The upper carrier pivot is 40 mm from the axle, inside the nominal wheel's 50 mm radius in side view. The carrier, link hardware and tire therefore need lateral separation. Reserve the actual motor, hub, bearings and cable exits too.
- Put leg load through bearings and frame members, not through an unsupported servo horn. The wheel load likewise needs a defined bearing path; do not assume the motor output shaft supports the robot.
- Locate mechanical stops outside the commissioned software travel with a verified clearance margin, still inside a collision-free envelope. Add a 30° lock pin for assembly. Stops are containment, not a homing method. Never enable the servo against an installed lock pin.

Start with the body pivots fixed and the wheel off the bench. Test the linkage by hand **with the servo/belt disconnected**. Support it before connecting the drive or releasing the lock. This lets the fixture catch the leg if torque disappears.

For a starting fixture layout, put the lower body pivot **200 mm above the base**, upper pivot at 240 mm. The nominal wheel then has at least **43.75 mm clearance above the base** through the design range, before brackets/cables. Relative to the lower pivot, reserve at least **21.53 mm forward to 127.78 mm rearward**, and **27.78–156.25 mm downward**, for the wheel sweep alone. Enlarge this for the measured hardware and catch; these are geometry allowances, not a strength rating.

## Power and interfaces

A bench supply provides energy; it does not generate the servo's data commands or provide bidirectional wheel control. Test **one actuator at a time** first. With a single-output supply, reconfigure between tests with output off; do not parallel USB power or supply outputs.

```text
SERVO TEST
laptop USB -> compatible USB / half-duplex TTL servo interface -> servo DATA
bench supply -> fuse -> physical actuator-power cut -> servo POWER
compatible signal ground shared with interface

WHEEL TEST
laptop USB -> MCU -> PWM / direction / SLEEP -> H-bridge -> motor
bench supply -> fuse -> physical actuator-power cut -> H-bridge VIN
encoder 5 V -> A/B level conversion -> MCU 3.3 V inputs
MCU <- current and fault feedback; compatible grounds shared
```

Confirm the supplies' grounding arrangement, current capacity, connector polarity, USB backfeed protection and wire/fuse ratings before energizing. Motor current does not go through the MCU or solderless signal breadboard. The physical cut must remove actuator power even if the laptop or MCU freezes; logic may remain powered for logging.

| Item / status | Bench configuration |
| --- | --- |
| ST3215 **12 V variant — two paid** | The project uses a **9 V** servo rail for this confirmed variant. Check the received label against the order before power-up. Use position mode with readback, one servo connected initially. [Variant specifications](https://www.waveshare.com/product/modules/st3215-servo.htm). |
| Waveshare Bus Servo Adapter A, if available | An official USB/Python route for the one-servo test. It passes input voltage through and is rated **5 A maximum**; it is not a 9 V regulator or a qualified path for the planned two-servo 6 A peak. [Adapter documentation](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ). |
| Pololu 4752 motor — one shipped | A brushed motor requiring an H-bridge for commanded reversal. Qualify at **12 V**, then the project's **9.9 V sizing point**; the actual battery minimum remains unconfirmed. Encoder supply is 3.5–20 V, so use the selected 5 V supply with logic conversion. Expected quadrature scale is **1920 counts/output revolution**. [Motor specification](https://www.pololu.com/product/4752). |
| Pololu 4035 driver — one shipped | Configure PH/EN (`PMODE=0`) before waking it, `IMODE` directly grounded, fault pulled up to 3.3 V, and a measured hardware current limit. `EN=0` brakes; `SLEEP=0` coasts. Default current limiting is not the project's calibrated setting. [Driver specification](https://www.pololu.com/product/4035). |

The MCU servo path requires a compatible half-duplex TTL interface; do not tie bare TX/RX together or treat ST3215 as an ordinary three-wire PWM hobby servo. Verify every connector against its own documentation; matching colors or plug shapes are insufficient.

If using Adapter A, follow its [USB wiring example](https://docs.waveshare.com/Bus_Servo_Adapter_A/Product-Wiring-Example) (USB mode jumper B) and start with the official [Python ping/readback workflow](https://docs.waveshare.com/Bus_Servo_Adapter_A/Python_Execution_Example). Inspect motion examples before execution. Identify the actual serial port and assign unique IDs with only one new servo connected at a time. Do not overwrite mode, calibration or persistent settings blindly.

**Commission current limits, rather than copying a supply setting.** For the first servo power-up, secure its case and remove the horn, belt and load; assume the shaft can move until startup/torque-enable behavior has been verified. Keep the wheel driver asleep. Use current-limited power and choose the initial supply limit from the confirmed device's idle/inrush needs and harness rating. Stop on unexpected current or repeated brownouts. Use a conservative wheel-driver limit for first unloaded jogs, then measure its threshold before progressing. The project ceilings are **2.5 A short motor peak and initially 1.2 A motor RMS**, with pulse duration and temperature still to be qualified. Supply current under PWM is not motor winding current. A servo's reported load is not automatically calibrated torque, and a USB adapter does not add a servo current limiter.

**Regeneration remains a power-circuit gate.** Check the supply manual for reverse-energy/sinking capability and behavior when its output is disabled. Neither current limiting nor a normal buck regulator proves the rail can absorb braking energy. Define and verify a bus clamp/dump or other energy-absorption path at the actuator bus, including after the upstream power cut. Monitor the rail during stops. Before that path is qualified, keep work to disabled communications and unloaded, low-energy jogs permitted by the supply/drive documentation; defer aggressive reversals, backdriving and loaded lowering. If no safe return-energy path can be established, continue passive and communications tests. Do not add a battery across a supply as an improvised fix.

Combined wheel/leg tests require a separately regulated/protected **9 V servo branch** alongside the motor branch, or separately verified outputs, plus a cut covering both actuator feeds. The single-servo adapter's limit still applies.

## Arrival-day sequence and pass conditions

| Stage | Action | Evidence required before advancing |
| --- | --- | --- |
| 0 — identify | Record labels, quantities, connector pinouts, shaft/spline, mass and mounting measurements. Inspect shipping damage. | Confirmed inventory and a marked wiring diagram; update the template for actual hardware. |
| 1 — power and readback | Verify rails/polarity with actuators disconnected. Secure the servo case, remove horn/belt/load and assume possible shaft motion on first power. Connect only that servo, inspect its torque state, verify documented disable behavior, and read ID, mode, position, voltage and available temperature/error fields. For the wheel, leave motor power off but power the encoder at 5 V through verified logic conversion; rotate the output slowly by hand and read counts/sign. | Stable communications and verified disabled startup behavior before attaching a load; one measured wheel revolution agrees with expected counts; power cut leaves actuator rail de-energized after stored energy decays. |
| 2 — bare servo | Secure the case. Read current position, configure a bounded target near it and verify documented torque-enable behavior before enabling. Command **±5° at the servo output**, at a verified nonzero speed no faster than **5°/s**. | Correct direction; no startup jump, reset, unexpected current or tracking fault. Do not run an example that sweeps the full servo range. |
| 3 — passive leg | Disconnect the drive. Move the scrap linkage through 15–45° by hand; check both end positions and all intermediate positions. | No binding or cable/hardware contact, correct center spacing, catch support works. |
| 4 — driven leg, no added load | Support/lock the leg at 30°; with actuator power physically off, install the aligned transmission using the established neutral/sign mapping. Remove the lock pin, retain the support/catch, then power up using verified disabled startup behavior and establish a matching target before arm. Begin **28–32° at 1°/s leg speed**; hold 2 s at each end. | Ten small cycles, no jump or binding; independently measured leg angle follows the target. Log error, current, voltage and temperature. |
| 5 — wider unloaded travel | After stage 4, try 25–35°, then expand toward 15–45° only as verified stop and clearance margins permit. Start with the same slow speed. | Repeatable endpoints without striking stops; measure actual vertical and fore/aft travel and approach-direction backlash. |
| 6 — wheel alone | Pin the leg, keep the wheel clear, servo torque off. Verify sign with short low-duty pulses. Then use a bounded wheel-speed loop at **+10 rpm → 0 → −10 rpm**, waiting for measured zero before reversal. | Correct feedback sign; stable low-speed control, logged response, no reset/overvoltage. If stiction prevents 10 rpm, record it and inspect before raising limits. |
| 7 — faults | In the supported small-motion envelope, test deadman release, command loss, controller reset, lost servo communications, feedback loss and physical kill. Start with one actuator, then repeat for both. | Fault latches, no automatic motion on reconnect/reboot, physical cut works independently of software, and the catch supports the assembly. |
| 8 — combined unloaded motion | After separate tests and fault checks, slowly sweep the leg over 28–32° while the lifted wheel turns at 10 rpm. | No cross-channel reset, dropped commands, wiring snag or rail violation; five repeatable combined cycles. |
| 9 — measured loading | Add a captured load in steps using a defined force direction and lever arm; see below. | Measured deflection/backlash/temperature and rail behavior under load, with supported power-loss behavior. |

These small motion values are **proposed commissioning limits**, not demonstrated actuator performance. Vendor raw speed/acceleration fields must be converted using the correct revision's units; zero sometimes selects maximum speed. Verify conversion before sending commands. No live control program is supplied by this document.

## Controls to prepare

Keep the interface small: **Connect/read → Arm → Jog leg → Set wheel speed → Stop → Disarm**, plus a held deadman and clear fault display. Expose physical units and show requested versus measured motion. Do not enable an automatic full-range sweep on connection.

Suggested bench states are `DISARMED`, `BENCH_ARMED`, `FAULT`; they are additions to plan and implement, not existing firmware. Gate each actuator independently so arm does not immediately energize both. The leg uses its servo's internal position loop; wheel speed uses encoder feedback on the MCU. An IMU and balance controller can wait.

Use `servo_angle = calibrated_neutral + direction_sign × 3 × (leg_angle − 30°)`. Measure the mapping before installing the belt; keep every command within the servo's permitted single-turn range and verified mechanical envelope. Do not assume the factory midpoint, absolute angle or reboot state is the mechanical neutral. Confirm the real leg angle with an external reference because internal servo feedback cannot detect belt slip.

Renew host commands at **20 Hz** initially. Reject commands older than **250 ms**, invalid sequence numbers, out-of-range targets and bad feedback; arm only from fresh, valid state. Start servo/readback logging around 20 Hz and wheel speed control around 100 Hz if the selected controller supports it; these are bench starting points, not the later 500 Hz balance-loop acceptance test. Log actual timing and use a longer/adaptive encoder speed-estimation window at low rpm.

Measure command age using the MCU's monotonic receive time and an arming-session identifier; telemetry polling does not renew motion permission. Reject nonfinite values and replayed commands. Zero encoder edges at rest are valid: distinguish acquisition failure from an implausible absence of counts while motion is commanded. Use bounded output and anti-windup for the wheel loop; start around 10 rpm/s speed ramps and short runs of at most 5 s.

Distinguish the actions:

- **Stop:** with healthy feedback, ramp wheel speed to zero and stop the leg trajectory at its current position. Servo holding torque can remain on; this is not safe access to the mechanism.
- **Disarm/fault:** request servo torque off, force wheel driver `SLEEP` low and latch the state. If the servo link or MCU fails, the tested actuator-power gate must remove torque power. Sending no more UART data is not a dependable torque-off command.
- **Physical kill:** cuts actuator power without relying on USB or firmware. The leg can drop and the wheel can coast; the fixture contains that motion. Require explicit rearm after recovery.

An MCU reset test must prove both actuators disable through the actual gate/watchdog wiring. A laptop plus vendor USB servo utility can do the first supervised unloaded checks using a reachable physical cut, but it does not by itself implement this deadman/fault contract. Do not credit later fault or loaded-test passes until that contract is implemented and measured.

## Loading without confusing the measurement

First test repeatability with only the leg's own mass. Then use a captured weight or measured spring-scale force, applying force to the **supported carrier/load fixture**, with a catch limiting any fall. Keep hands out of the sweep. Record force direction and perpendicular lever arm: `joint torque = force × perpendicular distance`.

For a vertical carrier force, `joint torque = F × 0.110 × sin(q)`. A useful project load is **17.7 N upward** on one carrier (60% of a 3 kg robot's weight): at 45° this is **1.37 N·m at the driven pivot**, corresponding to **0.54 N·m servo demand only if the assumed 3:1 ratio and 85% efficiency hold**. Approach it gradually, for example 25%, 50%, 75%, then 100%, after power/thermal gates are set. A downward hanging mass tests the opposite torque direction; it does not reproduce the ground reaction by itself. Count the fixture and leg self-weight moments in the measured net load.

The repository's later **0.75 N·m servo hold for 10 minutes** and **1.0 N·m short transient** remain separate qualification targets. Do not jump straight to a ten-minute loaded hold on arrival day. Establish brief holds first, then 30 s, 2 min and finally 10 min while logging temperature and tracking error; stop at the predeclared limit for the weakest component or loss of control. Set the actual temperature, voltage and pulse-duration limits from the received hardware documentation and instrumentation before loaded tests.

To claim a servo-output torque, measure it at that output with a supported torque fixture/load cell; an assumed belt efficiency or servo load register does not prove it. For orientation, **0.75 N·m = 7.5 N at a 100 mm perpendicular lever arm**, before accounting for the lever's own weight. An independently supported shaft/coupling keeps the measurement load out of an unqualified horn/bearing. Tests on the assembled leg establish its measured external load capacity instead.

## What this bench should deliver

Save one [session record](checklists/one-leg-bench-session.md) per wiring or firmware revision, with photos, logs and failures. Retain exact device/firmware IDs; rail min/max; command/measured angles and speed; signed encoder counts; valid current measurements; temperatures; timestamps; state, limits and fault reasons. Mark absent feedback as unavailable, not zero.

The first success is deliberately modest: **one repeatable slow leg cycle, one controlled wheel start/stop in each direction, and a demonstrated power cut**, all in the fixture. Later, ten repeatable cycles, measured clearances/backlash, fault tests and load data make the single-leg assembly ready to inform the two-wheel build. Balance and full-robot height changes still follow the [physical validation plan](v1-proof-validation.md).
