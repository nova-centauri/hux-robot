"""Leg-drive kinematics shared by build.py and validate.py.

Body coordinates: X rearward, Z up. The upper hip is at (HIP, 40). The crank centre, the crank radius,
the pushrod length and the link boss radius come from parameters.json. All angles are in degrees.
"""
from pathlib import Path
import json
import math

P = json.loads((Path(__file__).resolve().parent / 'parameters.json').read_text())
LD = P['leg_drive']
HIP = P['hip']['x']
UPPER = (HIP, 40.0)
C = tuple(LD['crank_centre_xz'])
RS, RL, L = LD['crank_radius'], LD['link_boss_from_hip'], LD['pushrod_ball_to_ball']


def boss(q):
    """Pushrod boss on the upper link at leg angle q (from the downward vertical, forward positive)."""
    a = math.radians(q)
    return (UPPER[0] - RL * math.sin(a), UPPER[1] - RL * math.cos(a))


def crank_tip(q):
    """Crank tip S: on the crank circle, one pushrod length from the boss. The crank points down and forward."""
    P1 = boss(q)
    dx, dy = P1[0] - C[0], P1[1] - C[1]
    d = math.hypot(dx, dy)
    if d > RS + L or d < abs(RS - L):
        raise ValueError(f'no pushrod solution at {q} degrees')
    a = (RS * RS - L * L + d * d) / (2 * d)
    h = math.sqrt(max(RS * RS - a * a, 0))
    mx, my = C[0] + a * dx / d, C[1] + a * dy / d
    return (mx + h * dy / d, my - h * dx / d)


def crank_angle(q):
    """Crank angle from +X toward +Z."""
    S = crank_tip(q)
    return math.degrees(math.atan2(S[1] - C[1], S[0] - C[0]))


def transmission_angles(q):
    """Acute angles between the pushrod and the link lever, and between the pushrod and the crank."""
    P1, S = boss(q), crank_tip(q)
    def ang(u, v):
        c = (u[0] * v[0] + u[1] * v[1]) / (math.hypot(*u) * math.hypot(*v))
        a = math.degrees(math.acos(max(-1, min(1, c))))
        return min(a, 180 - a)
    rod = (S[0] - P1[0], S[1] - P1[1])
    return ang(rod, (P1[0] - UPPER[0], P1[1] - UPPER[1])), ang(rod, (S[0] - C[0], S[1] - C[1]))


if __name__ == '__main__':
    for q in (15, 20, 25, 30, 35, 40):
        tl, tc = transmission_angles(q)
        print(q, [round(v, 1) for v in boss(q)], [round(v, 1) for v in crank_tip(q)], round(crank_angle(q), 1), round(tl, 1), round(tc, 1))
