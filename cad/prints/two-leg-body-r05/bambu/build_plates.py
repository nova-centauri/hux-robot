#!/usr/bin/env python3
"""Pack the R05 kit onto X1C plates and write one Bambu Studio 3MF project per plate.

Meshes keep their source scale and flat orientation. Parts can turn 90 degrees about Z only.
The print profile copies the R04 Basic PLA project: 0.20 mm layers, five walls, 40% infill, no supports.
"""
from pathlib import Path
import json, uuid, zipfile
import xml.etree.ElementTree as E
import numpy as np
import trimesh

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / 'stl'
TEMPLATE = HERE.parents[1] / 'one-leg-body-r04/bambu/hux-r04-plate-02-pla.3mf'
GAP, X0, X1, Y0, Y1 = 5, 5, 251, 32, 251        # keep clear of the 18 x 28 mm purge area at the front left

PLATES = [
    ('hux-r05-plate-1-walls', 'R05 walls', [('01_body_side', 2)]),
    ('hux-r05-plate-2-decks', 'R05 lower and middle decks and angles', [('03_power_deck', 1), ('04_interface_deck', 1), ('02_open_deck_angle', 12)]),
    ('hux-r05-plate-3-deck-tray', 'R05 upper deck, tray and leg parts',
        [('05_control_deck', 1), ('24_battery_tray', 1), ('06_motor_carrier', 2), ('09_spacer_2mm', 4), ('10_spacer_12mm', 4)]),
    ('hux-r05-plate-4-links-servo', 'R05 links and servo mounts',
        [('07_lower_lock_link', 2, True), ('08_upper_link', 2, True), ('13_inner_servo_cradle', 2), ('14_servo_cap_bar', 4)]),
    ('hux-r05-plate-5-electronics', 'R05 electronics mounts and standoffs',
        [('15_interface_cassette', 4), ('11_pico_plate', 1), ('12_imu_plate', 1), ('16_pico_standoff', 4),
         ('17_board_standoff', 16), ('18_imu_standoff', 4), ('23_module_foot', 24)]),
]


def pack(items):
    """Shelf packer. Returns (pid, mesh, x, y, rotated) with centre positions."""
    placed, x, y, shelf = [], X0, Y0, 0
    items = sorted(items, key=lambda it: -it[1].extents[1])
    for pid, mesh in items:
        w, d = mesh.extents[0], mesh.extents[1]
        rot = False
        if x + w > X1 and x + d <= X1 and d > 0: rot = True
        if rot: w, d = d, w
        if x + w > X1:
            x, y, shelf = X0, y + shelf + GAP, 0
        if y + d > Y1: raise SystemExit(f'{pid} does not fit on the plate')
        placed.append((pid, mesh, x + w / 2, y + d / 2, rot))
        x += w + GAP; shelf = max(shelf, d)
    return placed


C = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
PNS = 'http://schemas.microsoft.com/3dmanufacturing/production/2015/06'
B = 'http://schemas.bambulab.com/package/2021'
E.register_namespace('', C); E.register_namespace('p', PNS); E.register_namespace('BambuStudio', B)
q = lambda s: '{' + C + '}' + s


def meta(parent, k, v): E.SubElement(parent, 'metadata', {'key': k, 'value': str(v)})


def write(name, title, placed):
    model = E.Element(q('model'), {'unit': 'millimeter', '{http://www.w3.org/XML/1998/namespace}lang': 'en-US', 'requiredextensions': 'p'})
    E.SubElement(model, q('metadata'), {'name': 'Application'}).text = 'BambuStudio-02.08.02.61'
    E.SubElement(model, q('metadata'), {'name': 'BambuStudio:3mfVersion'}).text = '1'
    res = E.SubElement(model, q('resources')); build = E.SubElement(model, q('build'), {'{' + PNS + '}UUID': str(uuid.uuid4())})
    config = E.Element('config'); plate = E.Element('plate')
    for k, v in [('plater_id', 1), ('plater_name', title), ('locked', 'false'), ('filament_map_mode', 'Auto For Flush'), ('filament_maps', 1), ('filament_volume_maps', 0)]:
        meta(plate, k, v)
    rels = E.Element('Relationships', xmlns='http://schemas.openxmlformats.org/package/2006/relationships')
    files, record = {}, []
    for i, (pid, mesh0, cx, cy, rot) in enumerate(placed):
        mesh = mesh0.copy()
        if rot: mesh.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 0, 1]))
        off = mesh.bounds.mean(axis=0); mesh.vertices -= off
        mid, oid = 2 * i + 1, 2 * i + 2
        sub = E.Element(q('model'), {'unit': 'millimeter'}); sr = E.SubElement(sub, q('resources'))
        o = E.SubElement(sr, q('object'), {'id': str(mid), 'type': 'model'}); mn = E.SubElement(o, q('mesh'))
        vs = E.SubElement(mn, q('vertices')); fs = E.SubElement(mn, q('triangles'))
        for v in mesh.vertices: E.SubElement(vs, q('vertex'), dict(zip(('x', 'y', 'z'), (format(f, '.9g') for f in v))))
        for f in mesh.faces: E.SubElement(fs, q('triangle'), dict(zip(('v1', 'v2', 'v3'), map(str, f))))
        path = f'3D/Objects/object_{oid}.model'; files[path] = E.tostring(sub, encoding='utf-8', xml_declaration=True)
        obj = E.SubElement(res, q('object'), {'id': str(oid), 'type': 'model', '{' + PNS + '}UUID': str(uuid.uuid4())})
        comp = E.SubElement(obj, q('components'))
        E.SubElement(comp, q('component'), {'{' + PNS + '}path': '/' + path, 'objectid': str(mid), 'transform': '1 0 0 0 1 0 0 0 1 0 0 0', '{' + PNS + '}UUID': str(uuid.uuid4())})
        E.SubElement(build, q('item'), {'objectid': str(oid), 'transform': f'1 0 0 0 1 0 0 0 1 {cx:.4f} {cy:.4f} {off[2]:.6f}', 'printable': '1', '{' + PNS + '}UUID': str(uuid.uuid4())})
        label = f'{pid}.stl'
        oc = E.SubElement(config, 'object', {'id': str(oid)}); meta(oc, 'name', label); meta(oc, 'extruder', 1)
        E.SubElement(oc, 'metadata', {'face_count': str(len(mesh.faces))})
        pc = E.SubElement(oc, 'part', {'id': str(mid), 'subtype': 'normal_part', 'uuid': str(uuid.uuid4())})
        for k, v in [('name', label), ('matrix', '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1'), ('source_file', label), ('source_object_id', 0), ('source_volume_id', 0)]:
            meta(pc, k, v)
        E.SubElement(pc, 'mesh_stat', {'face_count': str(len(mesh.faces)), 'edges_fixed': '0', 'degenerate_facets': '0', 'facets_removed': '0', 'facets_reversed': '0', 'backwards_edges': '0'})
        inst = E.SubElement(plate, 'model_instance')
        for k, v in [('object_id', oid), ('instance_id', 0), ('identify_id', oid)]: meta(inst, k, v)
        E.SubElement(rels, 'Relationship', {'Target': '/' + path, 'Id': f'rel-{oid}', 'Type': 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel'})
        record.append({'part': pid, 'x': round(cx, 2), 'y': round(cy, 2), 'rotated_90': rot, 'extents': [round(float(e), 3) for e in mesh.extents]})
    config.append(plate)
    with zipfile.ZipFile(TEMPLATE) as z:
        for n in ['[Content_Types].xml', '_rels/.rels', 'Metadata/project_settings.config']: files[n] = z.read(n)
    settings = json.loads(files['Metadata/project_settings.config'])
    settings.update({'layer_height': '0.2', 'wall_loops': '5', 'sparse_infill_density': '40%', 'enable_support': '0'})
    files['Metadata/project_settings.config'] = json.dumps(settings).encode()
    files['3D/3dmodel.model'] = E.tostring(model, encoding='utf-8', xml_declaration=True)
    files['3D/_rels/3dmodel.model.rels'] = E.tostring(rels, encoding='utf-8', xml_declaration=True)
    files['Metadata/model_settings.config'] = E.tostring(config, encoding='utf-8', xml_declaration=True)
    out = HERE / (name + '.3mf')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for n, d in files.items(): z.writestr(n, d)
    return {'file': out.name, 'title': title, 'objects': record}


if __name__ == '__main__':
    manifest = json.loads((HERE.parent / 'manifest.json').read_text())
    need = {p['id']: p['quantity'] for p in manifest['parts'] if p['id'] != '19_fit_coupon'}
    got = {}
    report = []
    for name, title, items in PLATES:
        meshes = []
        for it in items:
            pid, n = it[0], it[1]
            m = trimesh.load_mesh(SRC / (pid + '.stl'))
            if len(it) > 2 and it[2]:
                m.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 0, 1])); m.rezero()
            meshes += [(pid, m)] * n; got[pid] = got.get(pid, 0) + n
        report.append(write(name, title, pack(meshes)))
    assert got == need, (got, need)
    (HERE / 'plates.json').write_text(json.dumps({'revision': 'R05', 'profile': 'Bambu PLA Basic, X1 Carbon 0.4 nozzle, 0.20 mm, 5 walls, 40% infill, no supports', 'plates': report}, indent=2) + '\n')
    for r in report: print(r['file'], len(r['objects']), 'objects')
