#!/usr/bin/env python3
"""Serial vs five-bar leg on Hux's settled draw (docs/research/knee-linkage.md, 2026-09-26/27).

Planar, inches, x forward, y up, origin at the hip (serial) or the midpoint between the two hip
pivots (five-bar). Stance is the 92% draw: hip 13.8" over the planted axle, 7.5" + 7.5" links.
Four poses the stair needs (stair-climb-dynamics.md / leg-geometry.md):
  stance   both wheels down, hip over the axle
  raised   raised wheel on the next tread: 9.5" forward, 9.5" up from the planted axle
  standup  front leg standing up on the shelf, knee 6-7" behind the weight line
  shove    rear leg nearly straight, hip ~7" ahead of the rear axle (the momentum source)
Rules for a five-bar candidate: both chains reach every pose without hitting a singularity,
elbows stay below the hip axis (the body is above it) and, at the two shelf poses, not ahead
of the wheel (the riser is there). Run: python3 fivebar-check.py
"""
import math, itertools

POSES = {'stance': (0, -13.8), 'raised': (9.5, -4.3), 'standup': (1.0, -9.0), 'shove': (-7.0, -13.0)}
L1 = L2 = 7.5

def chain(pivot, foot, l1, l2, sign, margin=0.0):
    px, py = pivot; x, y = foot[0] - px, foot[1] - py; r = math.hypot(x, y)
    if r > l1 + l2 - margin or r < abs(l1 - l2) + margin: return None
    a = math.atan2(y, x); c = max(-1, min(1, (l1**2 + r**2 - l2**2) / (2 * l1 * r))); b = math.acos(c)
    e = (px + l1 * math.cos(a + sign * b), py + l1 * math.sin(a + sign * b))
    v1 = (e[0] - px, e[1] - py); v2 = (foot[0] - e[0], foot[1] - e[1])
    mu = math.degrees(math.acos(max(-1, min(1, (v1[0]*v2[0] + v1[1]*v2[1]) / (l1 * l2)))))
    return e, mu

def serial_knee(foot):
    c = chain((0, 0), foot, L1, L2, +1)
    d = chain((0, 0), foot, L1, L2, -1)
    if c is None: return None
    return min((c[0], d[0]), key=lambda k: k[0])   # knee folds backward (Steve 2026-09-21)

def elbows_ok(name, foot, ef, er):
    if ef[1] > -0.5 or er[1] > -0.5: return False
    if name in ('standup', 'raised') and (ef[0] > foot[0] + 1.0 or er[0] > foot[0] + 1.0): return False
    return True

def show_equal_links(d=2.5):
    print(f'== equal 7.5/7.5 links, pivots {d}" apart ==')
    for name, foot in POSES.items():
        k = serial_knee(foot)
        print(f'{name:8s} foot {foot}: serial knee {None if k is None else tuple(round(v,1) for v in k)}')
        for sf, sr, label in ((1, -1, 'elbows out'), (-1, 1, 'elbows crossed')):
            f = chain((d/2, 0), foot, L1, L2, sf); r = chain((-d/2, 0), foot, L1, L2, sr)
            fe = None if f is None else tuple(round(v, 1) for v in f[0])
            re = None if r is None else tuple(round(v, 1) for v in r[0])
            print(f'           five-bar {label:14s}: front elbow {fe}  rear elbow {re}')

def search():
    rng = [4, 5, 6, 7, 8, 9, 10]
    passing = []; drop_counts = {k: 0 for k in POSES}
    for d in (1.5, 2.5, 3.5, 4.5):
        for lf1, lf2, lr1, lr2 in itertools.product(rng, repeat=4):
            if lf1 + lf2 > 15.5 or lr1 + lr2 > 15.5: continue   # inside the 24" envelope with the 6" wheel
            for sf, sr in ((1, -1), (-1, 1), (1, 1), (-1, -1)):
                results = {}
                for name, foot in POSES.items():
                    f = chain((d/2, 0), foot, lf1, lf2, sf, 0.3); r = chain((-d/2, 0), foot, lr1, lr2, sr, 0.3)
                    results[name] = (f is not None and r is not None and elbows_ok(name, foot, f[0], r[0]),
                                     min(f[1], r[1]) if f and r else 0)
                if all(v[0] for v in results.values()):
                    passing.append((min(v[1] for v in results.values()), d, lf1, lf2, lr1, lr2, sf, sr))
                for drop in POSES:
                    if all(v[0] for k, v in results.items() if k != drop): drop_counts[drop] += 1
    print(f'\n== search: {len(passing)} five-bars pass all four poses ==')
    for row in sorted(passing, reverse=True)[:8]: print('  worst transmission angle, d, Lf1, Lf2, Lr1, Lr2, sf, sr =', row)
    for k, v in drop_counts.items(): print(f'  dropping {k:8s}: {v} candidates pass the other three')

if __name__ == '__main__':
    show_equal_links(); search()
