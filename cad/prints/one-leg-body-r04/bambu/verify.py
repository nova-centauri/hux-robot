#!/usr/bin/env python3
"""Check the saved Bambu projects against the released R04 STL meshes."""
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
import xml.etree.ElementTree as E
import numpy as np
from scipy.spatial import cKDTree
import trimesh

HERE = Path(__file__).resolve().parent
manifest = json.loads((HERE.parent / 'manifest.json').read_text())
quantities = {p['id'] + '.stl': p['quantity'] for p in manifest['parts']}
C = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
P = 'http://schemas.microsoft.com/3dmanufacturing/production/2015/06'
source = {}
for name in quantities:
    mesh = trimesh.load_mesh(HERE.parent / 'stl' / name)
    mesh.vertices -= mesh.bounds.mean(axis=0)
    source[name] = mesh
records = []
for filename, expected in [
    ('hux-r04-first-fit-pla.3mf', {'02_open_deck_angle.stl': 1, '19_fit_coupon.stl': 1, '21_side_joint_sample.stl': 1, '22_deck_joint_sample.stl': 1}),
    ('hux-r04-plate-02-pla.3mf', {'01_body_side.stl': 1, '03_power_deck.stl': 1, '02_open_deck_angle.stl': 3}),
]:
    path = HERE / filename
    with ZipFile(path) as z:
        assert z.testzip() is None
        model = E.fromstring(z.read('3D/3dmodel.model'))
        assert model.get('unit') == 'millimeter'
        config = E.fromstring(z.read('Metadata/model_settings.config'))
        settings = json.loads(z.read('Metadata/project_settings.config'))
        assert settings['printer_model'] == 'Bambu Lab X1 Carbon'
        assert settings['printer_variant'] == '0.4'
        assert settings['filament_settings_id'] == ['Bambu PLA Basic @BBL X1C']
        assert settings['curr_bed_type'] == 'Textured PEI Plate'
        assert settings['layer_height'] == '0.2'
        assert settings['wall_loops'] == '5'
        assert settings['sparse_infill_density'] == '40%'
        assert settings['enable_support'] == '0'
        objects = {o.get('id'): o for o in config.findall('object')}
        names = {i: o.find("metadata[@key='name']").get('value') for i, o in objects.items()}
        assert Counter(names.values()) == Counter(expected), filename
        plates = {}
        for plate in config.findall('plate'):
            number = int(plate.find("metadata[@key='plater_id']").get('value'))
            for instance in plate.findall('model_instance'):
                oid = instance.find("metadata[@key='object_id']").get('value')
                assert oid not in plates
                plates[oid] = number
        resources = {o.get('id'): o for o in model.find('{' + C + '}resources')}
        items = []
        for item in model.find('{' + C + '}build'):
            oid = item.get('objectid')
            name = names[oid]
            assert item.get('printable') == '1'
            transform = np.array(list(map(float, item.get('transform').split()))).reshape(4, 3)
            assert np.allclose(transform[:3], np.eye(3)), (name, 'scale or orientation')
            component = resources[oid].find('{' + C + '}components/{' + C + '}component')
            assert component.get('transform') == '1 0 0 0 1 0 0 0 1 0 0 0'
            sub = E.fromstring(z.read(component.get('{' + P + '}path').lstrip('/')))
            mesh_node = sub.find("{*}resources/{*}object[@id='" + component.get('objectid') + "']/{*}mesh")
            vertices = np.array([[float(v.get(k)) for k in ('x', 'y', 'z')] for v in mesh_node.find('{*}vertices')])
            faces = np.array([[int(t.get(k)) for k in ('v1', 'v2', 'v3')] for t in mesh_node.find('{*}triangles')])
            mesh = trimesh.Trimesh(vertices, faces, process=False)
            original = source[name]
            assert len(faces) == len(original.faces)
            error = max(cKDTree(original.vertices).query(vertices)[0].max(), cKDTree(vertices).query(original.vertices)[0].max())
            assert error < 0.0001, (name, error)
            assert abs(mesh.volume - original.volume) < 0.1, name
            placed = mesh.bounds + transform[3]
            # Bambu uses 307.2 mm between virtual plate origins.
            placed[:, 0] -= (plates[oid] - 1) * 307.2
            assert placed[0, :2].min() >= 0 and placed[1, :2].max() <= 256
            assert abs(placed[0, 2]) < 0.0001
            if 'spacer' in name:
                assert objects[oid].find("metadata[@key='sparse_infill_density']").get('value') == '100%'
            items.append({'part': name, 'plate': plates[oid], 'source_vertex_error_mm': float(error),
                          'plate_bounds_mm': np.round(placed, 5).tolist()})
        assert len(items) == sum(expected.values()) == len(plates)
        for index, a in enumerate(items):
            for b in items[index + 1:]:
                if a['plate'] != b['plate']:
                    continue
                aa, bb = np.array(a['plate_bounds_mm']), np.array(b['plate_bounds_mm'])
                gap = np.maximum(bb[0, :2] - aa[1, :2], aa[0, :2] - bb[1, :2])
                assert gap.max() >= 5, (a['part'], b['part'], 'less than 5 mm separation')
        records.append({'file': filename, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                        'objects': len(items), 'plates': len(set(plates.values())),
                        'quantities': expected, 'checks': 'Source vertices, face count, volume, flat orientation, scale, plate bounds and profile agree.',
                        'parts': items})
(HERE / 'validation.json').write_text(json.dumps({'date': '2026-10-13', 'projects': records}, indent=2) + '\n')
print('Bambu project checks pass: 2 projects, 9 objects, original STL geometry and PLA profiles.')
