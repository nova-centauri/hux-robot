"""Build plate 02 with original R04 meshes and the established PLA profile."""
from pathlib import Path
import zipfile, json, uuid
import xml.etree.ElementTree as E
import trimesh
root=Path(__file__).resolve().parents[2]
src=root/'one-leg-body-r04/stl'
C='http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
P='http://schemas.microsoft.com/3dmanufacturing/production/2015/06'
B='http://schemas.bambulab.com/package/2021'
E.register_namespace('',C); E.register_namespace('p',P); E.register_namespace('BambuStudio',B)
q=lambda s:'{'+C+'}'+s
model=E.Element(q('model'),{'unit':'millimeter','{http://www.w3.org/XML/1998/namespace}lang':'en-US','requiredextensions':'p','xmlns:BambuStudio':B})
E.SubElement(model,q('metadata'),{'name':'Application'}).text='BambuStudio-02.08.02.61'
E.SubElement(model,q('metadata'),{'name':'BambuStudio:3mfVersion'}).text='1'
res=E.SubElement(model,q('resources')); build=E.SubElement(model,q('build'),{'{'+P+'}UUID':str(uuid.uuid4())})
config=E.Element('config'); plate=E.Element('plate')
def meta(parent,k,v): E.SubElement(parent,'metadata',{'key':k,'value':str(v)})
for k,v in [('plater_id',1),('plater_name','Wall lower deck and angles'),('locked','false'),('filament_map_mode','Auto For Flush'),('filament_maps',1),('filament_volume_maps',0)]:meta(plate,k,v)
rels=E.Element('Relationships',xmlns='http://schemas.openxmlformats.org/package/2006/relationships')
parts=[('01_body_side.stl',65,139),('03_power_deck.stl',191,156),('02_open_deck_angle.stl',148,57),('02_open_deck_angle.stl',190,57),('02_open_deck_angle.stl',232,57)]
files={}
for i,(name,x,y) in enumerate(parts):
 mid=2*i+1; oid=mid+1; mesh=trimesh.load_mesh(src/name); off=mesh.bounds.mean(axis=0);mesh.vertices-=off
 sub=E.Element(q('model'),{'unit':'millimeter'}); sr=E.SubElement(sub,q('resources'));o=E.SubElement(sr,q('object'),{'id':str(mid),'type':'model'});mn=E.SubElement(o,q('mesh')); vs=E.SubElement(mn,q('vertices'));fs=E.SubElement(mn,q('triangles'))
 for v in mesh.vertices:E.SubElement(vs,q('vertex'),dict(zip(('x','y','z'),map(lambda f:format(f,'.9g'),v))))
 for f in mesh.faces:E.SubElement(fs,q('triangle'),dict(zip(('v1','v2','v3'),map(str,f))))
 path=f'3D/Objects/object_{oid}.model';files[path]=E.tostring(sub,encoding='utf-8',xml_declaration=True)
 obj=E.SubElement(res,q('object'),{'id':str(oid),'type':'model','{'+P+'}UUID':str(uuid.uuid4())})
 comp=E.SubElement(obj,q('components'));E.SubElement(comp,q('component'),{'{'+P+'}path':'/'+path,'objectid':str(mid),'transform':'1 0 0 0 1 0 0 0 1 0 0 0','{'+P+'}UUID':str(uuid.uuid4())})
 E.SubElement(build,q('item'),{'objectid':str(oid),'transform':f'1 0 0 0 1 0 0 0 1 {x} {y} {off[2]}','printable':'1','{'+P+'}UUID':str(uuid.uuid4())})
 oc=E.SubElement(config,'object',{'id':str(oid)});meta(oc,'name',name);meta(oc,'extruder',1);E.SubElement(oc,'metadata',{'face_count':str(len(mesh.faces))})
 pc=E.SubElement(oc,'part',{'id':str(mid),'subtype':'normal_part','uuid':str(uuid.uuid4())})
 for k,v in [('name',name),('matrix','1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1'),('source_file',name),('source_object_id',0),('source_volume_id',0),('source_offset_x',off[0]),('source_offset_y',off[1]),('source_offset_z',off[2])]:meta(pc,k,v)
 E.SubElement(pc,'mesh_stat',{'face_count':str(len(mesh.faces)),'edges_fixed':'0','degenerate_facets':'0','facets_removed':'0','facets_reversed':'0','backwards_edges':'0'})
 inst=E.SubElement(plate,'model_instance')
 for k,v in [('object_id',oid),('instance_id',0),('identify_id',oid)]:meta(inst,k,v)
 E.SubElement(rels,'Relationship',{'Target':'/'+path,'Id':f'rel-{oid}','Type':'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel'})
config.append(plate)
with zipfile.ZipFile(root/'one-leg-body-r04/bambu/hux-r04-first-fit-pla.3mf') as z:
 for n in ['[Content_Types].xml','_rels/.rels','Metadata/project_settings.config']:files[n]=z.read(n)
settings=json.loads(files['Metadata/project_settings.config']);settings.update({'layer_height':'0.2','wall_loops':'5','sparse_infill_density':'40%','enable_support':'0'})
files['Metadata/project_settings.config']=json.dumps(settings).encode()
files['3D/3dmodel.model']=E.tostring(model,encoding='utf-8',xml_declaration=True)
files['3D/_rels/3dmodel.model.rels']=E.tostring(rels,encoding='utf-8',xml_declaration=True)
files['Metadata/model_settings.config']=E.tostring(config,encoding='utf-8',xml_declaration=True)
out=root/'one-leg-body-r04/bambu/hux-r04-plate-02-pla.3mf'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for n,d in files.items():z.writestr(n,d)
print(out)
