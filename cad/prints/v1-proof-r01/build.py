"""Generate V1-PROOF R01 passive PLA parts with Blender 5.x.
Run: /Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python cad/prints/v1-proof-r01/build.py
One Blender coordinate is one millimetre; STL files are written explicitly in mm.
Regeneration replaces this folder's generated files. Edit this source for revisions.
"""
from pathlib import Path
import bpy, bmesh, math, json, struct
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
STL = HERE / 'stl'
STL.mkdir(exist_ok=True)
HOLE = 4.5
TAU = 2 * math.pi
parts = []

# A clean background generation session, never the user's live scene.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.name = '01 PRINT LAYOUT - millimetres'
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.001
scene.unit_settings.length_unit = 'MILLIMETERS'


def material(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = 0.68
    return mat

teal = material('HUX | forest PLA', (0.055, 0.29, 0.22))
orange = material('HUX | copper PLA', (0.74, 0.25, 0.075))
sage = material('HUX | sage PLA', (0.40, 0.58, 0.45))
gray = material('Reference only | steel', (0.22, 0.26, 0.28))
paper = material('Reference only | warm white', (0.75, 0.77, 0.69))
wood = material('Reference only | shop upright', (0.38, 0.29, 0.18))


def outline_rect(w, h, r, cx=0, cy=0, steps=10):
    points = []
    for x, y, start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(steps+1):
            a = math.radians(start+90*i/steps)
            points.append((cx+x+r*math.cos(a),cy+y+r*math.sin(a)))
    return points


def prism(name, poly, h, z=0):
    clean = []
    for point in poly:
        if not clean or math.dist(point, clean[-1]) > 1e-7: clean.append(point)
    if math.dist(clean[0], clean[-1]) < 1e-7: clean.pop()
    poly = clean
    n = len(poly)
    verts = [(x,y,z) for x,y in poly] + [(x,y,z+h) for x,y in poly]
    faces = [tuple(reversed(range(n))), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def cylinder(name, diameter, h, x=0, y=0, z=0, sides=96):
    return prism(name, [(x+diameter/2*math.cos(TAU*i/sides),y+diameter/2*math.sin(TAU*i/sides)) for i in range(sides)],h,z)


def boolean(obj, cutter, operation='DIFFERENCE'):
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Manufactured geometry', 'BOOLEAN')
    modifier.operation = operation
    modifier.solver = 'EXACT'
    modifier.object = cutter
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def holes(obj, centers, thickness, diameter=HOLE):
    for x,y in centers:
        boolean(obj, cylinder('Hole tool',diameter,thickness+2,x,y,-1))


def slot(obj, x, y, length, width, thickness, along='x'):
    poly = outline_rect(length if along=='x' else width,width if along=='x' else length,width/2,x,y)
    boolean(obj,prism('Slot tool',poly,thickness+2,-1))


def engrave(obj, content, x, y, top, size=3.2, depth=0.4):
    curve = bpy.data.curves.new('Recessed label','FONT')
    curve.body = content
    curve.size = size
    curve.space_character = 1.05
    curve.extrude = depth + 0.1
    curve.resolution_u = 4
    txt = bpy.data.objects.new('Label cutter',curve)
    bpy.context.collection.objects.link(txt)
    txt.location = (x,y,top-depth)
    bpy.ops.object.select_all(action='DESELECT')
    txt.select_set(True)
    bpy.context.view_layer.objects.active = txt
    bpy.ops.object.convert(target='MESH')
    boolean(obj,txt)


def bevel(obj, width=0.25):
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Small edge break','BEVEL')
    mod.width=width
    mod.segments=1
    mod.limit_method='ANGLE'
    mod.angle_limit=math.radians(35)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def clean_and_audit(obj):
    mesh=obj.data
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    volume=bm.calc_volume(signed=True)
    if volume < 0:
        bmesh.ops.reverse_faces(bm,faces=list(bm.faces));volume=-volume
    nonmanifold=sum(not e.is_manifold for e in bm.edges)
    loose=sum(not v.link_faces for v in bm.verts)
    zero_area=sum(f.calc_area()<1e-9 for f in bm.faces)
    seen=set();components=0
    for v in bm.verts:
        if v in seen:continue
        components+=1;seen.add(v)
        stack=[v]
        while stack:
            vertex=stack.pop()
            for edge in vertex.link_edges:
                other=edge.other_vert(vertex)
                if other not in seen:seen.add(other);stack.append(other)
    bm.to_mesh(mesh);bm.free();mesh.update()
    coords=[v.co for v in mesh.vertices]
    low=[min(v[i] for v in coords) for i in range(3)]
    high=[max(v[i] for v in coords) for i in range(3)]
    result={'watertight':nonmanifold==0,'nonmanifold_edges':nonmanifold,'loose_vertices':loose,'zero_area_faces':zero_area,'connected_solids':components,'volume_mm3':round(volume,2),'bounds_mm':[round(high[i]-low[i],3) for i in range(3)],'minimum_z_mm':round(low[2],6)}
    assert nonmanifold==0 and loose==0 and zero_area==0 and components==1 and volume>0, (obj.name,result)
    assert abs(low[2])<1e-5, (obj.name,low)
    return result


def export_stl(obj, path):
    mesh=obj.data
    mesh.calc_loop_triangles()
    # Binary STL has no unit metadata. Coordinates below are explicitly mm.
    with path.open('wb') as out:
        out.write(b'HUX V1-PROOF R01 | MILLIMETRES | PASSIVE MOCKUP'.ljust(80,b' '))
        out.write(struct.pack('<I',len(mesh.loop_triangles)))
        for tri in mesh.loop_triangles:
            a,b,c=[mesh.vertices[i].co for i in tri.vertices]
            normal=(b-a).cross(c-a).normalized()
            out.write(struct.pack('<12fH',*normal,*a,*b,*c,0))


def finish(obj, filename, qty, use, mat, layout, features):
    obj.name=filename
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for face in obj.data.polygons: face.material_index = 0
    audit=clean_and_audit(obj)
    export_stl(obj,STL/(filename+'.stl'))
    obj['part_id']=filename
    obj['units']='millimetres'
    obj['quantity_for_one_mockup']=qty
    obj['use']=use
    obj['status']='Print candidate; physical fit and strength unverified'
    obj['nominal_hole_diameter_mm']=HOLE
    obj.location=layout
    parts.append({'id':filename,'file':'stl/'+filename+'.stl','quantity':qty,'use':use,'features':features,'audit':audit})
    return obj


# 01: proof envelope footprint, deliberately generic mounting interfaces.
obj=prism('Layout deck',outline_rect(120,110,6),4)
for x in (-44,44):
    for y in (-35,35):slot(obj,x,y,18,HOLE,4,along='y')
for x in (-23,23):slot(obj,x,0,24,6,4,along='y')
bevel(obj)
engrave(obj,'HUX  /  V1-PROOF',-50,41,4,4)
engrave(obj,'LAYOUT DECK  /  R01',-50,-48,4,3)
deck=finish(obj,'01_layout_deck',1,'Electronics and packaging layout; generic slots, not qualified chassis',teal,(-45,52,0),{'footprint_mm':[120,110],'thickness_mm':4,'mounting_slot_centers_mm':[[x,y] for x in (-44,44) for y in (-35,35)],'mounting_slots_mm':[18,HOLE],'cable_slots_mm':[24,6]})

# 02: 40 mm fixed pivot spacing; mounting slots intentionally generic.
obj=prism('Fixed pivot plate',outline_rect(70,70,5),6)
holes(obj,[(0,-20),(0,20)],6)
for x in (-25,25):
    for y in (-20,20):slot(obj,x,y,14,HOLE,6,along='y')
bevel(obj)
engrave(obj,'HUX',-28,-2,6,4)
engrave(obj,'40',8,-2,6,4)
fixed=finish(obj,'02_fixed_pivot_plate',1,'Fixed side of passive full-size parallelogram; mount to independent rigid backing',teal,(55,72,0),{'pivot_centers_mm':[[0,-20],[0,20]],'center_distance_mm':40,'thickness_mm':6})

# 03: 110 mm pivot spacing; narrow middle clears crossing spacer envelopes.
poly=[]
for i in range(33):
    a=math.pi/2+math.pi*i/32;poly.append((8*math.cos(a),8*math.sin(a)))
poly += [(14,-4),(96,-4),(110,-8)]
for i in range(1,33):
    a=-math.pi/2+math.pi*i/32;poly.append((110+8*math.cos(a),8*math.sin(a)))
poly += [(96,4),(14,4)]
obj=prism('110 mm link',poly,5)
holes(obj,[(0,0),(110,0)],5)
bevel(obj)
engrave(obj,'110  /  PASSIVE',35,-1.3,5,2.8)
link=finish(obj,'03_link_110',2,'Passive geometry link; no motor or payload loads',orange,(-87,-28,0),{'pivot_centers_mm':[[0,0],[110,0]],'center_distance_mm':110,'boss_diameter_mm':16,'neck_width_mm':8,'thickness_mm':5})
link2=link.copy();link2.data=link.data.copy();scene.collection.objects.link(link2);link2.name='03_link_110 - second copy';link2.location=(-87,-53,0)

# 04: carrier, 40 mm centers; the wheel disc is only an envelope check.
obj=prism('Carrier',outline_rect(56,16,8,20,0,16),6)
holes(obj,[(0,0),(40,0)],6)
bevel(obj)
engrave(obj,'40',15,-1.5,6,3.5)
carrier=finish(obj,'04_carrier_40',1,'Passive carrier; no bearing, motor or wheel load interface',sage,(35,19,0),{'pivot_centers_mm':[[0,0],[40,0]],'center_distance_mm':40,'thickness_mm':6})

spacers={}
for number,height,loc in [(5,2,(52,-9,0)),(6,12,(80,-9,0))]:
    obj=cylinder('Spacer',9,height)
    holes(obj,[(0,0)],height)
    bevel(obj,0.15)
    obj=finish(obj,f'{number:02d}_spacer_{height}mm',2,'Loose passive spacing; not a bearing or preload sleeve',sage,loc,{'outside_diameter_mm':9,'inside_diameter_mm':HOLE,'height_mm':height})
    spacers[height]=obj
    duplicate=obj.copy();duplicate.data=obj.data.copy();scene.collection.objects.link(duplicate);duplicate.name=f'{number:02d}_spacer_{height}mm - second copy';duplicate.location=(loc[0]+12,loc[1],0)

# 07: print this first; nominal diameters, no hidden shrinkage compensation.
obj=prism('Fit coupon',outline_rect(82,26,3),4)
for x,d in zip((-28,-14,0,14,28),(4.1,4.3,4.5,4.7,4.9)):
    holes(obj,[(x,3)],4,d)
bevel(obj,0.15)
for x,d in zip((-28,-14,0,14,28),(4.1,4.3,4.5,4.7,4.9)):
    engrave(obj,f'{d:.1f}',x-3,-7,4,3)
coupon=finish(obj,'07_hole_fit_coupon',1,'Print first; choose hole fit on this printer and filament',orange,(-52,-88,0),{'hole_diameters_mm':[4.1,4.3,4.5,4.7,4.9],'hole_centers_mm':[[x,3] for x in (-28,-14,0,14,28)],'thickness_mm':4})

# 08: an optional very thin wheel envelope, not a running wheel/hub.
obj=cylinder('Wheel envelope',100,2,sides=192)
for x in (-22,22):
    for y in (-22,22):
        boolean(obj,cylinder('Lightening hole',24,4,x,y,-1))
holes(obj,[(0,0)],2)
bevel(obj,0.12)
engrave(obj,'100 MM',-11,33,2,4,0.3)
engrave(obj,'GAUGE ONLY',-15,-38,2,3.5,0.3)
wheel=finish(obj,'08_wheel_envelope_100',1,'Optional wheel-size clearance gauge; not a driven wheel or hub',sage,(85,-85,0),{'outside_diameter_mm':100,'thickness_mm':2,'bore_mm':HOLE})

print_objects=[obj for obj in scene.objects if obj.type=='MESH']
for obj in print_objects:obj.color=obj.data.materials[0].diffuse_color

# Second scene: the same meshes with a faithful near/far pivot stack.
assembly=bpy.data.scenes.new('02 PASSIVE ASSEMBLY - reference')
assembly.unit_settings.system='METRIC';assembly.unit_settings.scale_length=.001;assembly.unit_settings.length_unit='MILLIMETERS'
q=math.radians(30)
body_z=200
axle=(110*math.sin(q),body_z-110*math.cos(q))
front=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
link_rot=Matrix(((math.sin(q),math.cos(q),0,0),(0,0,-1,0),(-math.cos(q),math.sin(q),0,0),(0,0,0,1)))
carrier_rot=Matrix(((0,-1,0,0),(0,0,-1,0),(1,0,0,0),(0,0,0,1)))


def placed(source,name,rotation,position):
    obj=source.copy();obj.data=source.data
    assembly.collection.objects.link(obj);obj.name=name
    obj.matrix_world=Matrix.Translation(Vector(position)) @ rotation
    return obj

placed(fixed,'A | fixed plate | 40 mm',front,(0,0,body_z+20))
placed(carrier,'A | carrier | 40 mm',carrier_rot,(axle[0],0,axle[1]))
placed(link,'A | lower link | near plane',link_rot,(0,-8,body_z))
placed(link,'A | upper link | far plane',link_rot,(0,-18,body_z+40))
for x,z,h in [(0,body_z,2),(0,body_z+40,12),(axle[0],axle[1],2),(axle[0],axle[1]+40,12)]:
    placed(spacers[h],f'A | {h} mm matched spacer',front,(x,-6,z))
# A 9 mm minimum separation beyond the far link gives the gauge its own plane.
# This is a loose layout position, not a designed axle spacer or drivetrain fit.
placed(wheel,'REFERENCE | wheel envelope in separate plane',front,(axle[0],-32,axle[1]))

# Reference fixtures belong to the assembly only and are never in STL exports.
bpy.context.window.scene=assembly
upright=prism('REFERENCE | independent shop upright - not supplied',outline_rect(70,18,1),260)
upright.location=(0,14,0);upright.data.materials.append(wood)
# Bolts are bounded placeholders: shaft diameter 4; hardware envelope <=9.
for x,z,outer in [(0,200,13),(0,240,23),(axle[0],axle[1],13),(axle[0],axle[1]+40,23)]:
    shaft=cylinder('REFERENCE | M4 shaft - length to measure',4,outer+3)
    shaft.matrix_world=Matrix.Translation((x,0,z)) @ front
    shaft.data.materials.append(gray)
    nut=cylinder('REFERENCE | nut envelope <=9 mm',8.1,3.2,sides=6)
    nut.matrix_world=Matrix.Translation((x,-outer,z)) @ front
    nut.data.materials.append(gray)

# Quantitative kinematic audit; these are geometry checks, not physical tests.
sweep=[]
for degree in range(15,46):
    angle=math.radians(degree)
    separation=40*math.sin(angle)
    sweep.append({'angle_deg':degree,'axle_rearward_mm':round(110*math.sin(angle),4),'axle_below_pivot_mm':round(110*math.cos(angle),4),'projected_neck_hardware_clearance_mm':round(separation-4-4.5,4)})
assert min(row['projected_neck_hardware_clearance_mm'] for row in sweep)>1.8
# Interferences with bosses are not at this closest point: at 15 degrees, the
# crossing projects 38.64 mm from an end, inside the constant 8 mm neck.
assert 14 < 40*math.cos(math.radians(45)) < 96


def camera_and_lights(scn,target,position,ortho):
    bpy.context.window.scene=scn
    cam_data=bpy.data.cameras.new(scn.name+' camera');cam=bpy.data.objects.new('Presentation camera',cam_data);scn.collection.objects.link(cam)
    cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=ortho;cam_data.clip_end=5000
    scn.camera=cam
    for location,power,size in [((-200,-180,500),6000000,350),((200,250,350),4500000,300)]:
        light=bpy.data.lights.new('Softbox','AREA');light.energy=power;light.shape='DISK';light.size=size
        obj=bpy.data.objects.new('Softbox',light);scn.collection.objects.link(obj);obj.location=location;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    scn.world=bpy.data.worlds.new('Workshop backdrop');scn.world.use_nodes=True;scn.world.node_tree.nodes['Background'].inputs[0].default_value=(0.45,0.48,0.43,1);scn.world.node_tree.nodes['Background'].inputs[1].default_value=.4
    scn.render.engine='CYCLES';scn.cycles.samples=24;scn.cycles.use_denoising=True
    scn.render.resolution_x=1600;scn.render.resolution_y=1200;scn.render.resolution_percentage=100
    scn.view_settings.view_transform='AgX'
    scn.render.image_settings.file_format='PNG'
    scn.render.film_transparent=False
    scn.render.image_settings.color_mode='RGB'
    scn['units']='One coordinate unit = 1 mm. STL exported explicitly in millimetres.'
    scn['status']='Passive PLA mockup R01; no physical fit, strength or actuator qualification.'

camera_and_lights(scene,(10,-10,0),(160,-280,550),430)
# Ground plane for the printable-parts presentation only.
bpy.context.window.scene=scene
floor=prism('DISPLAY ONLY | backdrop',outline_rect(1100,1100,5),1,-1.8);floor.data.materials.append(paper)
# Keep print objects and display aids in separately named collections.
print_collection=bpy.data.collections.new('PRINT PARTS | export individual STLs');scene.collection.children.link(print_collection)
for obj in print_objects:
    for coll in list(obj.users_collection):coll.objects.unlink(obj)
    print_collection.objects.link(obj)
display=bpy.data.collections.new('DISPLAY ONLY | camera, lights, backdrop');scene.collection.children.link(display)
for obj in list(scene.objects):
    if obj not in print_objects:
        for coll in list(obj.users_collection):coll.objects.unlink(obj)
        display.objects.link(obj)

camera_and_lights(assembly,(25,-8,150),(390,-650,380),430)
bpy.context.window.scene=assembly
floor2=prism('REFERENCE | bench surface',outline_rect(1100,1100,5),1,-1.8);floor2.data.materials.append(paper)
# Saved viewport shows the actual printable pieces; the second scene holds the assembly.
bpy.context.window.scene=scene
bpy.ops.object.select_all(action='DESELECT')
for obj in print_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=deck
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active
            space.shading.type='SOLID';space.shading.color_type='MATERIAL';space.clip_end=5000
            space.overlay.show_floor=False;space.overlay.show_axis_x=False;space.overlay.show_axis_y=False
            space.region_3d.view_perspective='CAMERA'
            space.region_3d.view_camera_zoom=8
            space.lens=50

manifest={'revision':'V1-PROOF R01','date':'2026-09-29','printer':'Bambu X1C','material':'PLA','units':'mm','status':'Print candidates for passive fit/geometry checks; not powered or load qualified','hole_diameter_default_mm':HOLE,'planned_geometry':{'link_centers_mm':110,'pivot_centers_mm':40,'angle_range_deg':[15,45],'neutral_deg':30},'parts':parts,'assembly_stack_mm':{'plate':[0,6],'lower_link':[8,13],'upper_link':[18,23],'lower_spacers':2,'upper_spacers':12},'not_included':['actuator mounts','bearing seats','wheel hubs','powered fixture load rating','final bolt lengths','slicer G-code'],'source':'build.py'}
(HERE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(HERE/'geometry-audit.json').write_text(json.dumps({'mesh_checks':{p['id']:p['audit'] for p in parts},'sweep':sweep,'minimum_neck_hardware_clearance_mm':min(r['projected_neck_hardware_clearance_mm'] for r in sweep),'scope':'Mesh topology and nominal geometry only; no print, fit or load test has occurred.'},indent=2)+'\n')
textblock=bpy.data.texts.new('START HERE - print notes')
textblock.write('HUX V1-PROOF / R01\nBambu X1C / PLA\n\nPrint 07_hole_fit_coupon first at 100%, in millimetres.\nIndividual STLs are in the stl folder beside this Blender file.\nScene 01 contains flat printable parts; scene 02 is a passive assembly reference.\nDisplay floor, bolts and upright are not printed parts.\n110 mm link centres, 40 mm carrier centres. M4/4.5 mm holes are provisional.\nNo motor mounts, bearing fits or strength qualification are claimed.\nRead README.md and manifest.json before printing.\n')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'hux-v1-proof-r01.blend'))
for scn,name in [(scene,'print-layout.png'),(assembly,'passive-assembly.png')]:
    bpy.context.window.scene=scn;scn.render.filepath=str(HERE/name);bpy.ops.render.render(write_still=True)
print('HUX_PRINT_KIT_COMPLETE '+str(HERE))
