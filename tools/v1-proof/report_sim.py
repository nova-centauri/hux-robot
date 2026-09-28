#!/usr/bin/env python3
"""Publish the saved simulation evidence without rerunning or hiding failures."""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def render(r):
    s = r['summary']
    rows = r['nominal'] + r['variations']
    worst = lambda key: max(x['metrics'][key] for x in rows)
    lines = [
        '# V1-PROOF simulation evidence', '',
        f"**{s['passed']} / {s['total']} qualification scenarios passed every numerical gate.** "
        f"Nominal: {sum(x['pass'] for x in r['nominal'])}/{len(r['nominal'])}. "
        f"Timestep comparison: {'passed' if s['convergencePass'] else 'FAILED; investigate before relying on results'}. "
        '**No physical reliability or powered-leg validation is claimed.**', '',
        f"Model {r['modelRevision']}; {r['engine']}; deterministic seed {r['seed']}. "
        '[Interactive trajectories and traces](../tools/living-drawings/proof-simulation.html) · '
        '[complete raw results and parameters](../tools/v1-proof/sim-results.json) · '
        '[hardware decisions](v1-proof-hardware.md) · [physical protocol](v1-proof-validation.md).', '',
        '## What ran', '',
        '23 scenarios × 17 configurations: nominal, twelve seeded parameter sets, and four explicit corner/pose sets. '
        'Each configuration runs all five requested maneuver types, both pivot directions, 60-second standing, '
        'forward/rear/side pushes at two pulse durations, low grades/cross-slopes, smooth full-width and one-wheel bumps, '
        'a floor seam and a push while driving. Six separate challenge cases explore failure; five representative cases '
        'are repeated at 2000 Hz against the 1000 Hz baseline. Control remains 500 Hz in both.', '',
        'Each case starts from rest, commands begin at two seconds, and ends with several seconds to stop. '
        'Scored endpoints use the integrated slew-limited command trajectory in world coordinates. '
        'A body that stays upright but misses its path, direction, turn or settling criterion fails.', '',
        '| Scenario | Passed / runs | Worst endpoint error, m | Worst heading error, ° | Worst pitch excursion, ° | Failure reasons |',
        '| --- | ---: | ---: | ---: | ---: | --- |',
    ]
    for x in s['groups']:
        lines.append(f"| {x['id']} | {x['passed']}/{x['total']} | {x['worstPathErrorM']:.3f} | {x['worstHeadingErrorDeg']:.2f} | {x['worstPitchDeg']:.2f} | {', '.join(x['failureReasons']) or 'None'} |")
    lines += ['', f"Across qualification cases: maximum modeled current **{worst('peakCurrentA'):.2f} A**, "
              f"maximum session RMS **{max(max(x['metrics']['rmsCurrentA']) for x in rows):.2f} A** per motor; "
              f"maximum catch speed **{worst('maxSpeedMs'):.3f} m/s**. These are motor-model estimates, not bench readings or thermal certification.", '',
              '## Controller change justified by the sweep', '',
              'The initial controller passed 23/23 nominal scenarios but only **139/391** across the first sweep. '
              'A fore/aft CoM offset of a few millimeters consumed its weak position-restoring authority and caused endpoint failures or drift. '
              'The position/velocity weights were increased from [4, 3] to [64, 12]. The intermediate controller passed 387/391. '
              'A higher pitch-rate weight of 4 was rejected after it produced motor-current oscillation under delay/lost motion (330/391). '
              'Final pitch/rate weights remain [120, 2], torque cost 3 and the position-reference bound is widened to ±0.20 m '
              'for sufficient restoring authority after the small seam. '
              'Acceptance thresholds and the original ±4 mm sweep were retained. The tuning aggregates and source hashes remain in '
              '[sim-tuning-history.json](../tools/v1-proof/sim-tuning-history.json). This is tuning against a synthetic model; independent hardware trials are still required.', '',
              '## Explicit assumptions and uncertainty', '',
              '| Quantity | Nominal | Seeded sweep / corners |', '| --- | --- | --- |',
              '| Total mass | 2.5 kg | 2.3–3.0 kg; explicit 3.0 kg corner |',
              '| Sprung CoM above axle | 140 mm | 125–160 mm plus fixed-pose geometry |',
              '| Unmodeled CoM displacement | 0 | ±4 mm fore/aft and lateral |',
              '| Pitch/roll inertia | Lumped 120 × 180 mm box | 0.8–1.2 × |',
              '| Coulomb friction | 0.65 | 0.45–0.80; no wet/loose terrain claim |',
              '| Supply before modeled sag | 11.1 V | 9.9–12.6 V; 0.12 Ω lumped sag |',
              '| Motor torque envelope | Published 12 V linear DC approximation | 0.8–1.0 ×, ±5% side mismatch |',
              '| Sensor delay / drive lag | 4 / 6 ms | 2–6 / 4–10 ms |',
              '| Pitch bias / yaw gyro bias | 0 | ±0.15° / ±0.05°/s |',
              '| Torque deadband | 0.012 N·m | 0.005–0.020 N·m |',
              '| Effective wheel inertia | 0.00022 kg·m² each | 0.00015–0.00035, including assumed reflected inertia |',
              '| Rolling coefficient / lost motion | 0.015 / 0 | 0.01–0.03 / 0–0.15° output-side lost travel |',
              '| Leg angle | Pinned 30° | Fixed 15° and 45° corners; known pose trim, no moving legs |', '',
              'Seeded draws sample these ranges; they do not exhaust every combination. The four explicit corners are '
              'low voltage + max mass + reduced torque/traction/delay, fixed low pose, fixed high pose, and max mass/high CoM/offset. '
              'This is sensitivity coverage, not a probability distribution or a confidence interval.', '',
              '## Physics and observation contract', '',
              'Rapier advances one free 3D sprung rigid body and two independent wheel bodies with revolute joints. '
              'The floor, ramps, rounded wheel cylinders, triangle-mesh smooth bumps and box seam collide physically. '
              'Wheel torque is applied equal and opposite to wheel and body. There is no hidden support, planar constraint, '
              'upright reset, pose animation or ground-truth linear-velocity feedback to the controller.', '',
              'A fixed four-state LQR uses encoder distance/speed and delayed, biased/noisy pitch and gyro estimates. '
              'Heading feedback integrates the modeled yaw gyro. Wheel encoders are quantized to 1920 counts/revolution and speed is filtered. '
              'The pitch input is an **assumed attitude-estimator output**, not raw accelerometer fusion: acceleration rejection, '
              'vibration aliasing and physical IMU calibration are NOT simulated. Ideal IMU-derived rates remain an optimistic approximation.', '',
              'Drive output passes through a voltage/speed/current envelope, first-order lag, torque deadband and simplified reversal lost motion. '
              'The same conservative motoring envelope bounds braking; supply sag uses summed inferred motor current rather than a full PWM battery model. '
              'A bounded yaw allocator preserves common balance torque first. Reference speed/yaw ramps and bounded position/heading error prevent windup. '
              'Torques are not directly available from this H-bridge: the mounted PWM/current response must reproduce the modeled response before using the gains.', '',
              'Contact separation uses a fresh collider distance to every ground shape (0.8 mm tolerance). '
              'Cached contact manifold distances and triangle-mesh impulses proved unsuitable for this metric. '
              'This tests geometry separation, not normal load or a guaranteed load-sharing margin. '
              'Tires are rigid rounded cylinders with Coulomb contact, not a measured compliant tire model.', '',
              '## Pass gates', '',
              'No body contact or fall; pitch excursion from pose trim ≤12°, roll ≤10°, wheel separation ≤80 ms, '
              'modeled current ≤2.5 A peak / 1.2 A session RMS and catch speed ≤0.65 m/s. '
              'Endpoint error ≤0.12 m (grade ≤0.15 m; driving push ≤0.20 m), heading error ≤5°. '
              'Final uninterrupted settling ≥1 s: pitch error <3°, speed <0.06 m/s, yaw rate <0.12 rad/s. '
              'Stationary pushes settle within 3 s with maximum travel ≤0.35 m. The physical protocol requires repeated trials and thermal/fault checks as well.', '',
              '## Challenge cases — retain the failures', '',
              '| Case | Result | Observed limit |', '| --- | --- | --- |']
    for x in r['challenge']:
        lines.append(f"| {x['id']} | {'Pass within this model' if x['pass'] else 'Fail'} | {', '.join(x['reasons']) or 'No gate crossed; not added to the qualified operating envelope'} |")
    lines += ['', 'Strong side pushes are limited by passive track width and friction: there is no roll actuator. '
              'A controller cannot guarantee recovery from arbitrary human shoves. A 20 mm square obstacle is outside the defined shallow-surface fixtures. '
              'Passing a simplified lost-motion challenge is not a gearbox backlash certification.', '',
              '## Assembly mitigation for settling', '',
              'The near −4 mm fore/aft CoM corner can miss the strict final settling gate after a push or on a grade (near 3° static pitch). '
              'Retain those failures. Adjust the battery/frame mass distribution so the sprung CoM is within **±2 mm** '
              'of the nominal fore/aft balance line at the pinned pose, measure the actual trim, and recheck the full model. '
              'The following separate reruns keep seed 102, all other uncertainties and every threshold unchanged; '
              'only fore/aft CoM offset changes. They are not counted as replacements for failed qualification runs.', '',
              '| Case / corrected offset | Result | Endpoint error, m | Final settled time, s |',
              '| --- | --- | ---: | ---: |']
    for x in r.get('mitigation', []):
        lines.append(f"| {x['id']} | {'Pass' if x['pass'] else 'Fail: ' + ', '.join(x['reasons'])} | {x['metrics']['pathErrorM']:.3f} | {x['metrics']['settledSeconds']:.2f} |")
    lines += ['', '## Numerical consistency', '',
              '| Case | Same pass outcome | Endpoint delta, m | Heading delta, ° | Pitch peak delta, ° |',
              '| --- | --- | ---: | ---: | ---: |']
    for x in r['convergence']:
        lines.append(f"| {x['id']} | {x['finePass'] == x['coarsePass']} | {x['pathDeltaM']:.4f} | {x['headingDeltaDeg']:.3f} | {x['pitchDeltaDeg']:.3f} |")
    lines += ['', 'Thresholds: same classification, <0.04 m endpoint-error delta, <3° heading delta and <2° pitch-peak delta. '
              'This is a two-step-size consistency check, not independent solver validation.', '',
              '## Remaining gaps and release decision', '',
              'Proceed with the selected hardware **for instrumented bench qualification**. The simulation supports the specified '
              'pinned-leg mobility experiments; it does not release fabrication or establish physical reliability. '
              'Powered four-bar motion, servo dynamics, frame/gear/belt compliance, real backlash, raw IMU fusion, '
              'pack/BMS/regeneration, current-control firmware, hard-kill behavior and thermal duty remain unvalidated. '
              'Fixed leg-pose corners do not clear the ten powered height cycles. No 0.5 m/s, payload, perception or rough-terrain release.', '',
              '## Reproduce', '', '```sh', 'cd tools/living-drawings', 'npm ci', 'npm run simulate', 'npm test', '```', '',
              '`npm run simulate` regenerates the complete matrix and this report; it retains failed cases and returns results without '
              'turning a failure into a success. `npm test` checks meaningful physics/controller invariants and stale artifacts. '
              'The raw result stores SHA-256 hashes of the model, simulator and runner. Check them before quoting saved results.', '']
    return '\n'.join(lines)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = render(json.loads((HERE / 'sim-results.json').read_text()))
    target = ROOT / 'docs/v1-proof-simulation.md'
    if args.check:
        if not target.exists() or target.read_text() != result:
            raise SystemExit('Stale simulation report; run report_sim.py')
    else:
        target.write_text(result)
    print('Simulation report current; physical qualification remains open.')
