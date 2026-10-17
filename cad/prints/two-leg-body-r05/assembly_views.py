#!/usr/bin/env python3
"""Render the R05 assembly steps from the reference meshes. New parts in each step are orange.

Output: docs/assets/r05-assembly/step-*.png. Needs numpy, trimesh and matplotlib.
"""
from pathlib import Path
import json, math
import numpy as np
import trimesh
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[2] / 'docs/assets/r05-assembly'
OUT.mkdir(parents=True, exist_ok=True)
M = json.loads((HERE / 'manifest.json').read_text())
SKIP = ('component_space', 'pico_USB', 'pico_header', 'ST3215_connector')


def group(name):
    if name.startswith('body_near') or name.startswith('body_far'): return 'walls'
    if name.startswith('servo_frame') or name.startswith('wall_bushing'): return 'cradles'
    if name.startswith('crank_hub') or name.startswith('pushrod'): return 'drive'
    if name.startswith('ST3215_'): return 'servos'
    if name.startswith('angle_') or name.endswith('_deck'): return 'frame'
    if name.startswith('battery_tray'): return 'tray'
    if name.startswith('battery_envelope'): return 'battery'
    if any(name.startswith(k) for k in ('11_pico', '12_imu', 'DRV8874', 'power_cut', 'servo_bus', 'regulator')): return 'electronics'
    if any(name.startswith(k) for k in ('lower_link', 'upper_link', 'body_lower_spacer', 'body_upper_spacer', 'carrier')): return 'legs'
    if any(name.startswith(k) for k in ('gearbox', 'motor', 'encoder')): return 'motors'
    if name.startswith('wheel'): return 'wheels'
    return 'other'


meshes = {}
for inst in M['assembly']:
    if any(s in inst['name'] for s in SKIP): continue
    meshes[inst['name']] = (group(inst['name']), trimesh.load_mesh(HERE / inst['file']))

STEPS = [
    ('step-1-cradles', 'Step 1. Servo frames and wall bushings on both walls', ['walls'], ['cradles']),
    ('step-2-frame', 'Step 2. Decks and angles between the walls', ['walls', 'cradles'], ['frame']),
    ('step-3-tray', 'Step 3. Battery tray at the bottom of the walls', ['walls', 'cradles', 'frame'], ['tray']),
    ('step-4-electronics', 'Step 4. Electronics modules on the decks', ['walls', 'cradles', 'frame', 'tray'], ['electronics']),
    ('step-5-legs', 'Step 5. Struts and carriers at the rear hips', ['walls', 'cradles', 'frame', 'tray', 'electronics'], ['legs']),
    ('step-6-drive', 'Step 6. Gearmotors and wheels', ['walls', 'cradles', 'frame', 'tray', 'electronics', 'legs'], ['motors', 'wheels']),
    ('step-7-servo-battery', 'Step 7. Servos, crank hubs, pushrods and battery', ['walls', 'cradles', 'frame', 'tray', 'electronics', 'legs', 'motors', 'wheels'], ['servos', 'drive', 'battery']),
]
BASE = {'walls': '#5f8a80', 'cradles': '#c9b9a3', 'frame': '#b9c9bf', 'tray': '#b9c9bf', 'electronics': '#8fb3cf',
        'legs': '#c9b9a3', 'motors': '#9aa1a8', 'wheels': '#3a3f42', 'servos': '#4a4f52', 'drive': '#c9b9a3', 'battery': '#6f9fca'}
NEW = '#e07a3f'


def view(az, el):
    a, e = math.radians(az), math.radians(el)
    # Direction from the robot to the camera, in body coordinates (X rear, Y outward of near wall, Z up).
    cam = np.array([math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)])
    fwd = -cam
    right = np.cross(fwd, [0, 0, 1]); right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    return fwd, right, up


def render(name, title, old, new, az=135, el=28, note='View from the front, near side and above.'):
    fwd, right, up = view(az, el)
    light = -fwd * .4 + up * .6 + right * .3; light /= np.linalg.norm(light)
    polys, depth, cols = [], [], []
    for n, (g, m) in meshes.items():
        if g not in old and g not in new: continue
        tri = m.vertices[m.faces]
        nrm = m.face_normals
        vis = (nrm @ -fwd) > -0.02
        tri, nrm = tri[vis], nrm[vis]
        shade = 0.55 + 0.45 * np.clip(np.abs(nrm @ light), 0, 1)
        base = np.array(matplotlib.colors.to_rgb(NEW if g in new else BASE[g]))
        c = np.clip(base[None, :] * shade[:, None], 0, 1)
        if g not in new: c = c * .85 + .15
        p2 = np.stack([tri @ right, tri @ up], axis=-1)
        polys.append(p2); depth.append(tri.mean(1) @ fwd); cols.append(c)   # larger = farther
    P = np.concatenate(polys); D = np.concatenate(depth); C = np.concatenate(cols)
    order = np.argsort(-D)
    fig, ax = plt.subplots(figsize=(8, 7), dpi=110)
    ax.add_collection(PolyCollection(P[order], facecolors=C[order], edgecolors=C[order], linewidths=.15))
    ax.autoscale(); ax.set_aspect('equal'); ax.axis('off')
    ax.set_title(title, loc='left', fontsize=13, fontweight='bold', color='#243239')
    ax.text(0, -0.02, 'Orange: new parts in this step. ' + note + ' Hux R05.', transform=ax.transAxes, fontsize=9, color='#647078')
    fig.patch.set_facecolor('#fbfbf7')
    plt.tight_layout(); plt.savefig(OUT / (name + '.png'), facecolor=fig.get_facecolor()); plt.close(fig)


for s in STEPS: render(*s)
# Side view of the leg geometry.
render('side-hip-geometry', 'Side view. Rear hips and forward struts',
       ['walls', 'cradles', 'frame', 'tray', 'motors', 'wheels'], ['legs'], az=90, el=0,
       note='Side view from the near side. Forward is to the right.')
render('side-leg-drive', 'Side view. Crank hub, pushrod and upper link boss at 30 degrees',
       ['walls', 'frame', 'tray', 'motors', 'wheels', 'legs'], ['cradles', 'drive'], az=90, el=0,
       note='Side view from the near side. Forward is to the right. The servo is inside the wall.')
print('rendered', len(STEPS) + 2, 'views to', OUT)
