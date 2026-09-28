# Parts on hand

**Status:** inventory started 2026-09-20. What to buy is [`bom.md`](bom.md). This page stays the owned / ordered list. Authorized order-now cart ([`bom.md`](bom.md)): 3× 6×1.25 tire, 3× tube, 2× 16×14 carbon tube (2026-09-21), plus the Teensy 4.1 kit, XT90-S and one 8S 3300 pack (2026-09-26). Actuators are **not** authorized. **Nothing on the order-now cart is ordered yet** (Steve, 2026-09-27). Move a line here when it is ordered or arrives. The Pi 5 and F765-Wing are on hand; the design does not have to use them.

This page records what Steve already **owns** or has **already ordered**, plus a short **candidates** list that is explicitly **not owned / not ordered**. Owned ≠ reserved for Hux. If a row does not say reserved, treat reservation as **TBD**.

Do not add buy recommendations, alternate SKUs, or “you should also get” notes here. When a part arrives or is weighed, update the row. When something is actually on the Hux bench, also record it in [`electronics.md`](electronics.md) / [`mechanical.md`](mechanical.md) and [`../NOTES.md`](../NOTES.md).

See also: [`electronics.md`](electronics.md) · [`electronics-minimum.md`](electronics-minimum.md) (classes / P0–P5, not inventory) · [`mechanical.md`](mechanical.md) · [`requirements.md`](requirements.md) · [`decisions.md`](decisions.md) · **shop tools (not parts):** [`capabilities.md`](capabilities.md).

## Shop capabilities (not parts)

Steve has a shop. That is **tools he can use**, not inventory. Full list: [`capabilities.md`](capabilities.md).

Hardware fab is **intentional and welcome** — mill, lathe, metal bender, metal brake, bandsaw, soldering, welding, breadboards. Customs may be machined / bent / welded, not only printed. The in-wheel BLDC hub is a natural lathe / mill part. Still prefer COTS structure (carbon tube / stock) where it fits; draft-friendly print still for plastics.

Do not list these as rows above. They are not parts on hand.

## Mechanical

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Zantle Universal Walker Wheels Replacement — 5 inch, grey | 1 pair | **Ordered 2026-09-20 (Steve)** | [Amazon B0D534PDRT](https://www.amazon.com/dp/B0D534PDRT). Listing: 5" rubber wheels; for walkers with ~1" tube / 0.31" adjustment holes; includes 1 pair wheels + 2 pairs caster fittings; up to ~300 lb capacity rating; 8 height adjustments on stem. Package ~1.5 lb. ~$14.59 when ordered. | **Bench donor only** — hack apart to learn a hub / restrained spin. **Not the foot.** Settled foot is **6" OD** real rubber ([`research/leg-geometry.md`](research/leg-geometry.md)). Lathe / mill path: [`capabilities.md`](capabilities.md). | **Already purchased — document only.** Walker *caster / fork* assemblies — **not** ready-made BLDC hubs. Steve 2026-09-20: **OK to hack apart**. Steve 2026-09-21: not the contact; diameter settled at 6". Discard the stem / fork as needed. Measure bore / OD / width / mass when they arrive. Reserved for Hux: **yes** (this order). Do not cut the 7.5" tubes to suit 5". |

## Electronics

On-hand pile from project notes. **On hand (Steve)** means owned today, not “on the Hux bench” and not “reserved.”

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| F722 Wing | TBD | on hand (Steve) | Wing FC class. No CAN. | Bench board (P0–P1) | Not the robot's MCU — no CAN (2026-09-26). Reserved: **TBD**. |
| F765 Wing | TBD | on hand (Steve) | STM32F765, MPU6000 + ICM20602, 7 UARTs, microSD, **no CAN**. | **Bench board (P0–P1):** blink, CRSF, one SimpleFOC wheel over UART. | Not the robot's MCU (2026-09-26). ArduPilot on it today. Reserved: **TBD**. |
| F722 drone FC | TBD | on hand (Steve) | Drone FC class. No CAN. | Bench spare | Not the robot's MCU. Reserved: **TBD**. |
| Mamba F405 | TBD | on hand (Steve) | F405-class drone FC. No CAN. | Bench spare | Not the robot's MCU. Reserved: **TBD**. |
| TBS Nano RX | TBD | on hand (Steve) | Crossfire Nano RX. | RC in — CRSF into the bench board first, then the Teensy 4.1. Locked enough to write down. | Reserved: **TBD**. |
| ESP32 | TBD | on hand (Steve) | Dev-board class. Module TBD. | Optional thin Wi‑Fi / telem bridge if the Pi should not own that link. | Reserved: **TBD**. |
| Raspberry Pi 5 | 1 | on hand (Steve) | Companion compute. RAM TBD. | V1 companion: ROS 2 in containers, telemetry, cameras. Swappable for a Jetson at P5. Not a pose brain. | Reserved: **TBD**. |

## Actuators

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| Wheel BLDC / in-wheel hub motor | — | none yet | — | **RS05** (temporary lock, not ordered): 1.7 rated / 5.5 peak N·m, flush outboard in a turned hub (Sheet 2). First bench spin can use the 5" **donor** rubber. The foot is the settled **6"** real-rubber wheel. | The Zantle order is **wheels / caster forks**, not motors. OK to hack the rubber off the walker hub. |
| Wheel FOC driver / ESC | — | none yet | — | On the RS05 (FOC + encoder + CAN). | — |
| Knee / hip-swing actuator | — | none yet | — | Pose joints: **RS02** knee, **RS00** swing (temporary lock, not ordered). Servo / stepper+belt fallback. | See Candidates. |
| Hip-roll actuator | — | none yet | — | Dynamic roll **in V1**: **RS02** at 3.0" roll axes (temporary lock, not ordered). | — |

## Candidates (not owned / not ordered)

Research pointers only. **Not a buy list. No spend.** Do not treat a row here as reserved or as a lock.

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| **Teensy 4.1** + ICM-42688-P + 3× CAN transceivers | 1 kit | **Authorized 2026-09-26, not yet ordered** ([`bom.md`](bom.md)). | 600 MHz, 3× CAN, microSD. ~$55 kit. | CAN real-time MCU from P2. | Steve: "add the CAN MCU to the project." Move to Electronics when it arrives. |
| **RobStride 00 / 02 / 05** | 2 / 4 / 2 | **Not ordered, not authorized. Temporary decision lock 2026-09-26.** | RS00 5/14 N·m 310 g $160; RS02 7/17 N·m 380–405 g $145; RS05 1.7/5.5 N·m 191 g $110 (`actuators.js`). Set of 8: 2.56 kg, $1,120. 24 V floor on 00/02 → 8S (confirmed). | Knees + hip roll RS02 (roll axes at 3.0", Sheet 1; 5.2 N·m hold vs 7 rated), swing RS00, wheels RS05. RS06 (11/36 N·m, 621 g) was the 5.4"-hips fallback; not needed at 3.0". | [`research/actuator-shortlist.md`](research/actuator-shortlist.md). First buy: **one RS02** on the Teensy (hold 7 N·m 30 s with a thermocouple, 1 kHz encoder readback, 24 V floor). |
| **Jetson Orin Nano Super dev kit** | — | **Not ordered.** P5 candidate. | $399 (post-2026-07-22 pricing). 67 TOPS, 8 GB, 7–25 W, 9–19 V in. | Companion at P5 for stereo depth / multi-camera head, if the Pi 5 cannot hold the rate. | Not a V1 buy. [`research/compute-stack-review.md`](research/compute-stack-review.md). |
| **GIM8108-8** | — | **Not ordered.** Earlier yardstick only — superseded by the RobStride temporary lock (2026-09-26). | GIM8108-class integrated BLDC + reduction (8:1 class). Exact vendor page TBD when we research, not shop. | Was the **knee / hip swing** candidate (R12, 2026-09-21). Not in the working plan. | Steve 2026-09-21: noted as a candidate. Tazer later ran 6× GIM8108 on a ~2 ft carbon-tube wheeled biped — **data point, not a buy** ([`research/tazer-lessons.md`](research/tazer-lessons.md)). Knee / swing are CAN QDD now; servo / stepper+belt is the fallback. |

## Other

| Item | Qty | Status | Specs/link | Hux use | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | none yet | — | Fasteners, wire, springs, packs, cameras | Not inventoried. Buy lines live on [`bom.md`](bom.md), not in this table. |
