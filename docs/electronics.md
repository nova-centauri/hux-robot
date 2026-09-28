# Electronics

**Status:** architecture decided 2026-09-26 ([`decisions.md`](decisions.md)). No wiring diagram, no actuator SKU, no components purchased; budget and release gates in [`bom.md`](bom.md).

**8S + regulated step-down** is the power class (2026-09-26: 4S → 6S → 8S, retained conservatively while vendor 15/24 V minimum tables conflict). **Actuator bus is CAN.** **Hip roll is in V1.** **The real-time MCU must have CAN — the F765-Wing does not, so it is a bench board.**

Parent plan (classes, P0–P5, not a BOM): [`electronics-minimum.md`](electronics-minimum.md). Inventory: [`parts-on-hand.md`](parts-on-hand.md). Software layers: [`software.md`](software.md). Actuator trade: [`research/actuators-legs.md`](research/actuators-legs.md). Review behind this page: [`research/compute-stack-review.md`](research/compute-stack-review.md).

## Current engineering disposition — 2026-09-28

**No components purchased. Full actuator-set procurement is on hold.** [Head and leg review](head-and-leg-review.md) governs component qualification; [bom.md](bom.md) is a budget, not a released cart.

| Interface | Baseline / open qualification |
| --- | --- |
| Battery | 8S retained: 33.6 V full, 29.6 nominal, 26.4 planning cutoff; actual cells, sag, capacity, dimensions and regen acceptance unverified |
| Logic power | 60-V-input-rated converter class plus measured transient/regen protection; 5 V / 5 A companion branch and separately protected MCU/RX branch |
| Future companion power | Regulated 12–19 V only when the selected companion requires it; never raw 8S into the kit |
| Motor distribution | Dedicated fused harness and hardware disconnect; logic bypasses motor disconnect so it can log/report. Anti-spark is not a regen clamp |
| Controller | Teensy 4.1 candidate; three CAN controllers, only one FD-capable; external IMU and three transceivers |
| Candidate ten-node CAN | Bus A: two wheels, 1000 Hz. B: hip roll + ankle roll, four nodes at 400 Hz. C: hip pitch + knee, four nodes at 400 Hz |
| Bus load budget | 160 bits per extended eight-byte frame, command + reply, plus 10% allowance: A 74%, B/C 61.2%; prove deadline/latency on hardware |
| Termination | Two 120-ohm ends per physical bus, six total on three buses; short stubs and a deliberate signal-ground/common-mode plan |
| Actuators | RS02/RS00/RS05 are references, not accepted selections; ankle architecture and possible hip reduction are unresolved |
| Hold torque | Vendor stationary references RS02 6 / RS00 3.6 / RS05 1.2 N·m, conditional on cooling; not installed ratings |
| Companion | Pi 5 class; one camera initially. No ownership or zero-cost reuse assumed. Jetson and multi-camera coverage deferred |
| RC | TBS Nano class pending confirmed transmitter compatibility; watchdog and loss-of-link behavior tested independently of Linux |
| F765 / other legacy boards | Historical reuse possibilities only, unconfirmed for Hux; they do not replace the CAN MCU |

The July RS00/02 manuals say 24–60 V; the September manufacturer table says 15–60 V. Keep the conservative 24 V floor for now and record actual part/firmware revision before changing the bus. 26.4 V is a planning cutoff, not proof of cell-level protection or voltage under a motor pulse.

A four-node bus at 1 kHz with command/reply can require 1.28 Mbit/s. A 1 kHz estimator can consume 400 Hz timestamped joint feedback and let the actuators run local PD loops. Do not claim that CAN FD support on one controller accelerates classic-CAN nodes. Choose compatible transceivers by exact suffix; a 3.3-V logic interface does not imply a 3.3-V supply requirement.

At 8S 3.3 Ah, nominal energy is 97.68 Wh. With 80% usable energy and 90% distribution efficiency, predicted load energy is 70.33 Wh: 1.76 / 0.88 / 0.59 hours at 40 / 80 / 120 W. Measure actual draw. Include an 8S-capable charger in procurement; none is assumed owned.

## Before energizing a leg

- Select actual connectors, conductor size, fusing, disconnect and converter input ratings from load/fault measurements. Verify polarity and current limiting on the bench.
- Establish a rated independent wheel-bearing load path, restraint/overhead catch, real contact support and a supported rest pose. A power cut can make a balancing robot fall.
- Calibrate joint IDs, directions, offsets and IMU transform; report sample timestamps, faults and temperature. Verify watchdog behavior on each actuator's actual firmware.
- Test temperature with the proposed frame and heat spreaders. A cold overload curve or a controller temperature threshold is not repeated-duty qualification.
- Log supply and per-cell voltage/current during acceleration, braking and disconnect; verify the regen path with a full battery. Bench supplies may not absorb returned energy.
- Do one representative axis before the full set. No automatic motor enable after reconnect/reset.

Software contract: [software.md](software.md). Current physical layout and mass model: [head-and-leg-review.md](head-and-leg-review.md). Historical research/class phases remain in [electronics-minimum.md](electronics-minimum.md), but its old quantities and shopping statements are not current procurement instructions.
