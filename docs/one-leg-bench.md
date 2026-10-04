# Single-leg bench plan

**Updated 2026-10-02 — motor/drivers received and parts printed, no test results recorded.** Start with the [first mechanical fit session](checklists/2026-10-02-mechanical-fit.md), with all power disconnected. Then build a restrained, two-axis test article: one leg adjustment and one driven wheel. Learn wiring, signs, position control, wheel speed control, backlash and power behavior before you try balance. These first experiments do not need an IMU, a second leg, a battery or a full chassis.

## Parts and scope

**2026-10-03 controller update:** one Pico 2 with pre-soldered headers is received and untested. Start the [USB/LED checks](checklists/2026-10-03-pico-bringup.md). The LSM6DSO IMU is also received, per the user, and untested. The recorded spend is now **$173.70**.

This note updates the controller availability and the current total in the older arrival note below. The servo interface, the encoder level conversion, the harness and the protected power still need confirmation.

**Arrival reported 2026-10-02:** the user received the **30:1 metal gearmotor and DRV8874 drivers** and completed the prints. The paid baseline is **one Pololu 4752 wheel motor + one Pololu 4035 driver**. Confirm the received labels and the total driver count. **Two ST3215 servos are paid**, with arrival unreported and shipment unconfirmed in the latest vendor record. **$143.12 is recorded paid**, including shipping/tax.

The user confirms the servo 12 V variant. Verify the labels on arrival. The two-wheel robot still needs a second motor, and the driver coverage is still to confirm. A bench supply is available, with ratings unconfirmed. Controller, servo interface and harness availability are still to record. Refer to [paid orders](purchases.md), [inventory](parts-on-hand.md) and [hardware selection](v1-proof-hardware.md).

**This plan is for V1-PROOF and the confirmed Pololu/ST3215 actuators.** RobStride is the intended actuator for the future full-size Hux. The 110 mm linkage geometry applies to this test version. The final structural fits and the power circuit still need measured hardware and supply checks.

This bench work can happen **before** two-wheel balance. The pinned-leg-first rule still applies to the free-standing robot. A successful single-leg bench test does not prove balance or payload capacity.

## Start with passive mechanical checks

The [V1-PROOF R01 kit](../cad/prints/v1-proof-r01/README.md), drafted September 29, gives eight STL part types and a Blender project. The kit is for a **Bambu X1C / PLA** mockup of the 110 mm links and 40 mm pivot spacing. The prints are now reported complete. Record the revision, the material and the quantities of the printed parts. **Measure the fit coupon if it is printed**, and try the intended M4 hardware. The clearances and the printed sections remain provisional.

Use the [first fit-session checklist](checklists/2026-10-02-mechanical-fit.md) to assemble and sweep the passive linkage. Then do a check of the packaging against the received motor. This is a hand-moved geometry mockup. Powered mounts, bearings and load capacity remain unqualified. Receipt of parts or completed prints does not close a bench stage.

Complete the identification and passive geometry checks (stages 0 and 3 below) before powered motion. The passive checks do not depend on servo arrival or completed electronics.

1. Print the [1:1 geometry template](../cad/layouts/one-leg-bench-template.svg) at actual size and make sure that its 100 mm scale is correct. Make a paper or scrap linkage. Leave the actuator-specific mounts and the bearing holes unfinished.
2. Assemble a rigid base and upright, with two body-pivot centers 40 mm apart vertically. Clamp or bolt the base to the bench. Include a padded catch immediately below the assembly that moves. Leave room for its whole sweep.
3. Prepare two equal link blanks, a vertical carrier, spacers and a removable neutral-position lock. Use a common drilling jig so that the two center distances match. The final material section, edge distances, bearings, fits and fasteners wait for a side-view **and end-view** assembly detail.
4. Lay out a fused actuator-power harness, a physical power cut, a separate USB/logic path and labeled test points. Leave the supply output off until you identify the received parts and the connector polarities.
5. Prepare a ruler/angle scale, calipers, a multimeter, temperature measurement, a camera and the [session record](checklists/one-leg-bench-session.md). A scope is necessary to qualify short power transients. A supply display cannot show them reliably.
6. Confirm the available controller/servo interface and the supply model. Identify if the actual laptop needs a supported host driver. Make an inventory of the missing functions before you buy anything else.

## Link lengths and fixture

This leg is a **parallelogram**, not a thigh and shin in series. Both bars connect the body to the same carrier. There is one powered leg coordinate.

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

110 mm is the distance **between holes**, not the finished stock length. Do not cut two 110 mm end-to-end bars and then place the holes inside them. The extra end material depends on the selected bearings, bolt size and load path. Mark the centers now. The final structural machining follows those choices.

For the lower body pivot at `(0, 0)`, rearward `x` positive and downward `y` positive, the axle is `(110 sin q, 110 cos q)` in millimeters. The upper body and carrier pivots are 40 mm above the corresponding lower pivots.

| Leg angle q | Axle rearward x | Axle below lower body pivot y | Servo offset from calibrated neutral |
| --- | ---: | ---: | ---: |
| 15° | 28.47 mm | 106.25 mm | −45° × installed direction sign |
| 30° | 55.00 mm | 95.26 mm | 0° |
| 45° | 77.78 mm | 77.78 mm | +45° × installed direction sign |

Full travel changes the vertical separation by **28.47 mm** and moves the axle fore/aft by **49.31 mm**. It is not a straight vertical slide. For loads with floor support, let the body rise and fall while the wheel rolls. On the fixed-body bench rig, apply a measured load that can follow both coordinates of the carrier arc. A fixed-height floor or roller blocks the vertical motion even if the wheel is free to roll.

**Resolve these clearances in the mockup:**

- The parallel link centerlines are only `40 sin(q)` apart perpendicular to their length: **10.35 mm at 15°**. Common flat bars in the same plane can collide. Offset the bars into separate lateral planes with applicable spacers/bearing support. Examine the bolts, bosses and flex through the full sweep. Spacers cause bending loads that still need a structural review.
- The upper carrier pivot is 40 mm from the axle, inside the 50 mm radius of the nominal wheel in side view. The carrier, link hardware and tire therefore need lateral separation. Also reserve space for the actual motor, hub, bearings and cable exits.
- Put the leg load through bearings and frame members, not through an unsupported servo horn. The wheel load also needs a defined bearing path. Do not assume that the motor output shaft supports the robot.
- Put the mechanical stops outside the commissioned software travel, with a verified clearance margin, and inside a collision-free envelope. Add a 30° lock pin for assembly. Stops are containment, not a homing method. Do not enable the servo against an installed lock pin.

Start with the body pivots fixed and the wheel off the bench. Do a test of the linkage by hand **with the servo/belt disconnected**. Support the leg before you connect the drive or release the lock. Then the fixture can catch the leg if the torque disappears.

For a first fixture layout, put the lower body pivot **200 mm above the base** and the upper pivot at 240 mm. The nominal wheel then has at least **43.75 mm clearance above the base** through the design range, before brackets/cables. Reserve space for the wheel sweep alone, relative to the lower pivot: at least **21.53 mm forward to 127.78 mm rearward**, and **27.78–156.25 mm downward**. Make this space larger for the measured hardware and the catch. These are geometry allowances, not a strength rating.

## Power and interfaces

A bench supply gives energy. It does not generate the data commands of the servo or give bidirectional wheel control. Do a test of **one actuator at a time** first. With a single-output supply, change the configuration between tests with the output off. Do not connect USB power or supply outputs in parallel.

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

Before you energize, confirm the ground arrangement of the supplies, the current capacity, the connector polarity, the USB backfeed protection and the wire/fuse ratings. Motor current does not go through the MCU or the solderless signal breadboard. The physical cut must remove actuator power even if the laptop or the MCU freezes. Logic can remain powered for the logs.

| Item / status | Bench configuration |
| --- | --- |
| ST3215 **12 V variant — two paid** | The project uses a **9 V** servo rail for this confirmed variant. Check the received label against the order before power-up. Use position mode with readback, one servo connected initially. [Variant specifications](https://www.waveshare.com/product/modules/st3215-servo.htm). |
| Waveshare Bus Servo Adapter A, if available | An official USB/Python route for the one-servo test. It passes input voltage through and is rated **5 A maximum**; it is not a 9 V regulator or a qualified path for the planned two-servo 6 A peak. [Adapter documentation](https://docs.waveshare.com/Bus_Servo_Adapter_A/FAQ). |
| Pololu 4752 motor — received, untested | A brushed motor requiring an H-bridge for commanded reversal. Qualify at **12 V**, then the project's **9.9 V sizing point**; the actual battery minimum remains unconfirmed. Encoder supply is 3.5–20 V, so use the selected 5 V supply with logic conversion. Expected quadrature scale is **1920 counts/output revolution**. [Motor specification](https://www.pololu.com/product/4752). |
| Pololu 4035 drivers — received, count pending | Configure PH/EN (`PMODE=0`) before waking it, `IMODE` directly grounded, fault pulled up to 3.3 V, and a measured hardware current limit. `EN=0` brakes; `SLEEP=0` coasts. Default current limiting is not the project's calibrated setting. [Driver specification](https://www.pololu.com/product/4035). |

The MCU servo path needs a compatible half-duplex TTL interface. Do not tie bare TX/RX together. Do not treat the ST3215 servo as an ordinary three-wire PWM hobby servo. Verify every connector against its own documentation. Colors or plug shapes that match are not sufficient.

If you use Adapter A, obey its [USB wiring example](https://docs.waveshare.com/Bus_Servo_Adapter_A/Product-Wiring-Example) (USB mode jumper B). Start with the official [Python ping/readback workflow](https://docs.waveshare.com/Bus_Servo_Adapter_A/Python_Execution_Example). Inspect the motion examples before you run them. Identify the actual serial port. Assign unique IDs with only one new servo connected at a time. Do not overwrite the mode, the calibration or the persistent settings blindly.

**Commission the current limits instead of a copied supply setting.** For the first servo power-up, secure the servo case. Remove the horn, the belt and the load. Assume that the shaft can move until you verify the startup/torque-enable behavior. Keep the wheel driver asleep. Use current-limited power, with the initial supply limit from the idle/inrush needs of the confirmed device and the harness rating.

Stop on unexpected current or repeated brownouts. Use a conservative wheel-driver limit for the first unloaded jogs, then measure its threshold before you continue. The project ceilings are **2.5 A short motor peak and initially 1.2 A motor RMS**. The pulse duration and the temperature are still to be qualified. Supply current under PWM is not motor winding current. A reported servo load is not automatically calibrated torque, and a USB adapter does not add a servo current limiter.

**Regeneration remains a power-circuit gate.** Read the supply manual for the capability to sink reverse energy and for the behavior when its output is disabled. Neither a current limit nor a normal buck regulator proves that the rail can absorb braking energy. Define and verify a bus clamp/dump or other energy-absorption path at the actuator bus, also after the upstream power cut. Monitor the rail during stops.

Before that path is qualified, keep the work to disabled communications and to unloaded, low-energy jogs that the supply/drive documentation permits. Defer aggressive reversals, backdriving and descent under load. If you cannot establish a safe return-energy path, continue the passive and communications tests. Do not add a battery across a supply as an improvised fix.

Combined wheel/leg tests need a separately regulated/protected **9 V servo branch** next to the motor branch, or separately verified outputs. They also need a cut that covers both actuator feeds. The limit of the single-servo adapter still applies.

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

These small motion values are **proposed commissioning limits**, not demonstrated actuator performance. Convert the vendor raw speed/acceleration fields with the units of the correct revision. Zero sometimes selects the maximum speed. Verify the conversion before you send commands. This document does not supply a live control program.

## Controls to prepare

Keep the interface small: **Connect/read → Arm → Jog leg → Set wheel speed → Stop → Disarm**, plus a held deadman and a clear fault display. Expose physical units and show requested versus measured motion. Do not enable an automatic full-range sweep on connection.

Suggested bench states are `DISARMED`, `BENCH_ARMED` and `FAULT`. They are additions to plan and implement, not firmware that exists. Gate each actuator independently so that arm does not immediately energize both. The leg uses the internal position loop of its servo. The wheel speed uses encoder feedback on the MCU. An IMU and a balance controller can wait.

Use `servo_angle = calibrated_neutral + direction_sign × 3 × (leg_angle − 30°)`. Measure the mapping before you install the belt. Keep every command in the permitted single-turn range of the servo and in the verified mechanical envelope. Do not assume that the factory midpoint, the absolute angle or the reboot state is the mechanical neutral. Confirm the real leg angle with an external reference, because internal servo feedback cannot detect belt slip.

Renew the host commands at **20 Hz** at the start. Reject commands older than **250 ms**, invalid sequence numbers, out-of-range targets and bad feedback. Arm only from a fresh, valid state.

Start the servo/readback log at approximately 20 Hz. Start the wheel speed control at approximately 100 Hz if the selected controller supports it. These are bench start points, not the later 500 Hz balance-loop acceptance test. Log the actual timing and use a longer/adaptive encoder speed-estimation window at low rpm.

Measure the command age with the monotonic receive time of the MCU and an arm-session identifier. Telemetry polls do not renew the motion permission. Reject nonfinite values and replayed commands. Zero encoder edges at rest are valid, so separate an acquisition failure from an implausible absence of counts while motion is commanded. Use bounded output and anti-windup for the wheel loop. Start with speed ramps of approximately 10 rpm/s and short runs of maximum 5 s.

Distinguish the actions:

- **Stop:** with healthy feedback, ramp the wheel speed to zero and stop the leg trajectory at its current position. The servo hold torque can remain on. This is not safe access to the mechanism.
- **Disarm/fault:** request servo torque off, force the wheel driver `SLEEP` low and latch the state. If the servo link or the MCU fails, the tested actuator-power gate must remove the torque power. A stop of the UART data is not a dependable torque-off command.
- **Physical kill:** cuts the actuator power and does not depend on USB or firmware. The leg can drop and the wheel can coast. The fixture contains that motion. An explicit rearm is necessary after recovery.

An MCU reset test must prove that both actuators disable through the actual gate/watchdog wiring. A laptop plus the vendor USB servo utility can do the first supervised unloaded checks with a reachable physical cut. But it does not implement this deadman/fault contract alone. Do not credit later fault or loaded-test passes until that contract is implemented and measured.

## Loading without confusing the measurement

First, do a repeatability test with only the mass of the leg. Then use a captured weight or a measured spring-scale force. Apply the force to the **supported carrier/load fixture**, with a catch that limits a fall. Keep your hands out of the sweep. Record the force direction and the perpendicular lever arm: `joint torque = force × perpendicular distance`.

For a vertical carrier force, `joint torque = F × 0.110 × sin(q)`. A useful project load is **17.7 N upward** on one carrier (60% of the weight of a 3 kg robot). At 45° this is **1.37 N·m at the driven pivot**. This is **0.54 N·m servo demand only if the assumed 3:1 ratio and 85% efficiency hold**.

Approach that load in steps, for example 25%, 50%, 75%, then 100%, after the power/thermal gates are set. A mass hung downward gives the opposite torque direction. It does not reproduce the ground reaction alone. Count the fixture and leg self-weight moments in the measured net load.

The later **0.75 N·m servo hold for 10 minutes** and **1.0 N·m short transient** of the repository remain separate qualification targets. Do not go directly to a ten-minute loaded hold on arrival day. Do short holds first, then 30 s, 2 min and finally 10 min. Log the temperature and the tracking error during the holds. Stop at the predeclared limit for the weakest component or at a loss of control. Set the actual temperature, voltage and pulse-duration limits from the received hardware documentation and instrumentation before the loaded tests.

To claim a servo-output torque, measure it at that output with a supported torque fixture/load cell. An assumed belt efficiency or a servo load register does not prove it. For orientation, **0.75 N·m = 7.5 N at a 100 mm perpendicular lever arm**, before the weight of the lever itself. An independently supported shaft/coupling keeps the measurement load out of an unqualified horn/bearing. Tests on the assembled leg give its measured external load capacity instead.

## What this bench should deliver

Save one [session record](checklists/one-leg-bench-session.md) for each wiring or firmware revision, with photos, logs and failures. Keep the exact device/firmware IDs, rail min/max, command/measured angles and speed, signed encoder counts, valid current measurements, temperatures and timestamps. Also keep the state, the limits and the fault reasons. Mark absent feedback as unavailable, not zero.

The first success is deliberately modest: **one repeatable slow leg cycle, one controlled wheel start/stop in each direction, and a demonstrated power cut**, all in the fixture. Later, ten repeatable cycles, measured clearances/backlash, fault tests and load data make the single-leg assembly ready to inform the two-wheel build. The [physical validation plan](v1-proof-validation.md) still governs balance and full-robot height changes.
