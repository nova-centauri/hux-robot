"""Render the CAD exports in a fresh Blender process. No geometry edits."""
from pathlib import Path
import json
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'manifest.json').read_text())
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.name='01 BODY AND ONE LEG'
scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=.001
scene.unit_settings.length_unit='MILLIMETERS'


def material(name,color):
    mat=bpy.data.materials.new(name); mat.diffuse_color=(*color,1); mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.55
    return mat


for item in M['assembly']:
    bpy.ops.wm.stl_import(filepath=str(HERE/item['file']))
    obj=bpy.context.object; obj.name=item['name']
    obj.data.materials.append(material(item['name'],item['color']))
    obj['part_id']=item['part_id'] or 'REFERENCE ONLY'
    obj['status']='Fit candidate. Refer to README.md.'
    # Smooth curved faces only. Keep the exported geometry intact.
    for polygon in obj.data.polygons: polygon.use_smooth=False


def configure(scn,target,position,scale):
    bpy.context.window.scene=scn
    camera=bpy.data.objects.new('Camera',bpy.data.cameras.new('Camera'))
    scn.collection.objects.link(camera); camera.location=position
    camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO'; camera.data.ortho_scale=scale; camera.data.clip_end=5000; scn.camera=camera
    for pos,power,size in [((100,260,550),6000000,360),((-300,-220,350),4500000,300)]:
        lamp=bpy.data.lights.new('Softbox','AREA'); lamp.energy=power; lamp.size=size
        obj=bpy.data.objects.new('Softbox',lamp); scn.collection.objects.link(obj); obj.location=pos
        obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    scn.world=bpy.data.worlds.new('Warm neutral'); scn.world.use_nodes=True
    scn.world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.70,.66,1)
    scn.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    scn.render.engine='CYCLES'; scn.cycles.samples=24; scn.cycles.use_denoising=True
    scn.render.resolution_x=1600; scn.render.resolution_y=1400; scn.render.resolution_percentage=100
    scn.render.image_settings.file_format='PNG'; scn.view_settings.view_transform='AgX'
    scn.render.image_settings.color_mode='RGB'


configure(scene,(20,-60,-20),(470,570,390),650)
text=bpy.data.texts.new('READ ME')
text.write('HUX R04 | millimeters\nPrint the individual STL parts, not the whole assembly.\nWood, motor, servo, electronics, hub, wheel and service spaces are references.\nThe fixture requires cleats, bolts and bench clamps.\nThe first stage uses a fixed leg and a suspended wheel.\nThe case cradle is included. The powered leg transmission remains open.\nRead README.md and the drawing PDF before assembly.\n')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.clip_end=5000
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'one-leg-body-r04.blend'))
scene.render.filepath=str(HERE/'assembly.png'); bpy.ops.render.render(write_still=True)
full_camera_location=scene.camera.location.copy()
full_camera_rotation=scene.camera.rotation_euler.copy()
full_camera_scale=scene.camera.data.ortho_scale
# A clear equipment view omits the near wall and the wood fixture.
for obj in scene.objects:
    if obj.name=='body_near' or obj.name.startswith('fixture_'):
        obj.hide_render=True
scene.camera.location=(360,500,360)
scene.camera.rotation_euler=(Vector((0,-60,75))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=370
scene.render.filepath=str(HERE/'equipment.png'); bpy.ops.render.render(write_still=True)
for obj in scene.objects: obj.hide_render=False
scene.camera.location=full_camera_location
scene.camera.rotation_euler=full_camera_rotation
scene.camera.data.ortho_scale=full_camera_scale
# A separate scene puts each unique part flat on its print face. This is a catalog, not one plate.
catalog=bpy.data.scenes.new('02 PRINT PART CATALOG')
catalog.unit_settings.system='METRIC'; catalog.unit_settings.scale_length=.001
bpy.context.window.scene=catalog
positions=[((i%5)*160-320, (i//5)*-240+480) for i in range(len(M['parts']))]
for item,(x,y) in zip(M['parts'],positions):
    bpy.ops.wm.stl_import(filepath=str(HERE/'stl'/(item['id']+'.stl')))
    obj=bpy.context.object; obj.name=item['id']
    bbox=[Vector(v) for v in obj.bound_box]
    center=Vector(tuple((max(v[i] for v in bbox)+min(v[i] for v in bbox))/2 for i in range(3)))
    obj.location=(x-center.x,y-center.y,0)
    color={'frame':(.17,.38,.32),'deck':(.56,.67,.59),'link':(.82,.40,.15),'mount':(.85,.47,.20)}[item['color']]
    obj.data.materials.append(material(item['id'],color))
configure(catalog,(0,0,0),(0,-100,1400),1300)
catalog.render.resolution_y=1600; catalog.render.filepath=str(HERE/'parts.png')
bpy.ops.render.render(write_still=True)
bpy.context.window.scene=scene
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'one-leg-body-r04.blend'))
print('R04 render complete')
