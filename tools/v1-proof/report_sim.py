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
        f"Timestep comparison: {'passed' if s['convergencePass'] else 'FAILED. Investigate before you rely on the results'}. "
        '**This report claims no physical reliability and no powered-leg validation.**', '',
        f"Model {r['modelRevision']}, {r['engine']}, deterministic seed {r['seed']}. "
        '[Interactive trajectories and traces](../tools/living-drawings/proof-simulation.html) · '
        '[complete raw results and parameters](../tools/v1-proof/sim-results.json) · '
        '[hardware decisions](v1-proof-hardware.md) · [physical protocol](v1-proof-validation.md).', '',
        '## What ran', '',
        '23 scenarios × 17 configurations: nominal, twelve seeded parameter sets, and four explicit corner/pose sets. '
        'Each configuration runs all five requested maneuver types, both pivot directions and a 60-second stand. '
        'It also runs forward/rear/side pushes at two pulse durations, low grades/cross-slopes, smooth full-width and one-wheel bumps, '
        'a floor seam and a push during a drive.', '',
        'Six separate challenge cases explore failure. Five representative cases '
        'run again at 2000 Hz against the 1000 Hz baseline. Control remains 500 Hz in both.', '',
        'Each case starts from rest. The commands start at two seconds. Each case ends with several seconds to stop. '
        'Scored endpoints use the integrated slew-limited command trajectory in world coordinates. '
        'A body that stays upright but misses its path, direction, turn or settling criterion fails.', '',
        '| Scenario | Passed / runs | Worst endpoint error, m | Worst heading error, ° | Worst pitch excursion, ° | Failure reasons |',
        '| --- | ---: | ---: | ---: | ---: | --- |',
    ]
    for x in s['groups']:
        lines.append(f"| {x['id']} | {x['passed']}/{x['total']} | {x['worstPathErrorM']:.3f} | {x['worstHeadingErrorDeg']:.2f} | {x['worstPitchDeg']:.2f} | {', '.join(x['failureReasons']) or 'None'} |")
    lines += ['', f"Across the qualification cases, the maximum modeled current is **{worst('peakCurrentA'):.2f} A**, "
              f"and the maximum session RMS is **{max(max(x['metrics']['rmsCurrentA']) for x in rows):.2f} A** per motor. "
              f"The maximum catch speed is **{worst('maxSpeedMs'):.3f} m/s**. These are motor-model estimates, not bench readings or thermal certification.", '',
              '## Controller change justified by the sweep', '',
              'The initial controller passed 23/23 nominal scenarios but only **139/391** across the first sweep. '
              'A fore/aft CoM offset of a few millimeters consumed its weak authority to restore position and caused endpoint failures or drift. '
              'We increased the position/velocity weights from [4, 3] to [64, 12]. The intermediate controller passed 387/391. '
              'We rejected a higher pitch-rate weight of 4 after it produced motor-current oscillation under delay/lost motion (330/391).', '',
              'The final pitch/rate weights remain [120, 2], and the torque cost is 3. We widened the position-reference bound to ±0.20 m '
              'for sufficient authority to restore position after the small seam. '
              'We kept the acceptance thresholds and the original ±4 mm sweep. The tuning aggregates and source hashes remain in '
              '[sim-tuning-history.json](../tools/v1-proof/sim-tuning-history.json). We adjusted these gains against a synthetic model only. Independent hardware trials are still necessary.', '',
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
              'Seeded draws sample these ranges. They do not exhaust every combination. The four explicit corners are '
              'low voltage + max mass + reduced torque/traction/delay, fixed low pose, fixed high pose, and max mass/high CoM/offset. '
              'This is sensitivity coverage, not a probability distribution or a confidence interval.', '',
              '## Physics and observation contract', '',
              'Rapier advances one free 3D sprung rigid body and two independent wheel bodies with revolute joints. '
              'The floor, ramps, rounded wheel cylinders, triangle-mesh smooth bumps and box seam collide physically. '
              'The simulator applies the wheel torque equal and opposite to the wheel and the body. There is no hidden support, planar constraint, '
              'upright reset, pose animation or ground-truth linear-velocity feedback to the controller.', '',
              'A fixed four-state LQR uses encoder distance/speed and delayed, biased/noisy pitch and gyro estimates. '
              'Heading feedback integrates the modeled yaw gyro. Wheel encoders are quantized to 1920 counts/revolution and speed is filtered. '
              'The pitch input is an **assumed attitude-estimator output**, not raw accelerometer fusion. The simulation does NOT include acceleration rejection, '
              'vibration aliasing or physical IMU calibration. Ideal IMU-derived rates remain an optimistic approximation.', '',
              'The drive output passes through a voltage/speed/current envelope, a first-order lag, a torque deadband and a simplified reversal lost motion. '
              'The same conservative drive envelope also bounds the brake torque. The supply sag uses the sum of the inferred motor currents, not a full PWM battery model. '
              'A bounded yaw allocator gives priority to the common balance torque. Reference speed/yaw ramps and bounded position/heading error prevent windup.', '',
              'This H-bridge does not give torque directly. The mounted PWM/current response must reproduce the modeled response before you use the gains.', '',
              'Contact separation uses a fresh collider distance to every ground shape (0.8 mm tolerance). '
              'Cached contact manifold distances and triangle-mesh impulses proved unsuitable for this metric. '
              'This is a test of geometry separation, not of normal load or a guaranteed load-share margin. '
              'Tires are rigid rounded cylinders with Coulomb contact, not a measured compliant tire model.', '',
              '## Pass gates', '',
              'A run passes only when it meets all of these gates:', '',
              '- No body contact or fall.',
              '- Pitch excursion from pose trim ≤12°, roll ≤10°, wheel separation ≤80 ms.',
              '- Modeled current ≤2.5 A peak / 1.2 A session RMS, and catch speed ≤0.65 m/s.',
              '- Endpoint error ≤0.12 m (grade ≤0.15 m, push during a drive ≤0.20 m), heading error ≤5°.',
              '- Final uninterrupted settling ≥1 s: pitch error <3°, speed <0.06 m/s, yaw rate <0.12 rad/s.',
              '- Stationary pushes settle within 3 s with maximum travel ≤0.35 m.', '',
              'The physical protocol also needs repeated trials and thermal/fault checks.', '',
              '## Challenge cases — retain the failures', '',
              '| Case | Result | Observed limit |', '| --- | --- | --- |']
    for x in r['challenge']:
        lines.append(f"| {x['id']} | {'Pass within this model' if x['pass'] else 'Fail'} | {', '.join(x['reasons']) or 'No gate crossed. Not added to the qualified operating envelope'} |")
    lines += ['', 'The passive track width and the friction limit the strong side pushes. There is no roll actuator. '
              'A controller cannot guarantee recovery from arbitrary human shoves. A 20 mm square obstacle is outside the defined shallow-surface fixtures. '
              'A pass in a simplified lost-motion challenge is not a gearbox backlash certification.', '',
              '## Assembly mitigation for settling', '',
              'The near −4 mm fore/aft CoM corner can miss the strict final settling gate after a push or on a grade (near 3° static pitch). '
              'Keep those failures.', '',
              'Adjust the battery/frame mass distribution so that the sprung CoM is within **±2 mm** '
              'of the nominal fore/aft balance line at the pinned pose. Then measure the actual trim and recheck the full model. '
              'The separate reruns below keep seed 102, all the other uncertainties and every threshold unchanged. '
              'Only the fore/aft CoM offset changes. They do not count as replacements for failed qualification runs.', '',
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
              'pinned-leg mobility experiments. It does not release fabrication or establish physical reliability. '
              'Powered four-bar motion, servo dynamics, frame/gear/belt compliance, real backlash, raw IMU fusion, '
              'pack/BMS/regeneration, current-control firmware, hard-kill behavior and thermal duty remain unvalidated. '
              'Fixed leg-pose corners do not clear the ten powered height cycles. No 0.5 m/s, payload, perception or rough-terrain release.', '',
              '## Reproduce', '', '```sh', 'cd tools/living-drawings', 'npm ci', 'npm run simulate', 'npm test', '```', '',
              '`npm run simulate` regenerates the complete matrix and this report. It keeps the failed cases and returns the results. '
              'It does not change a failure into a success. `npm test` checks meaningful physics/controller invariants and stale artifacts. '
              'The raw result stores SHA-256 hashes of the model, simulator and runner. Check them before you quote saved results.', '']
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
