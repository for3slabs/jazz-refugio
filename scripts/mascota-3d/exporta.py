# Her pet v7 → the web: open the approved v7, give it its wardrobe as switchable pieces
# (acc-mono · acc-sombrero · acc-gorro-chef · acc-mandil), bake the peach patch into vertex
# colours (a shader node does not travel to glTF), turn curves into meshes, and export ONE .glb
# light enough for a phone.
import bpy, math
from mathutils import Vector

SRC = "/home/brianweb3/mascota-3d/out/michi-v7.blend"
OUT = "/home/brianweb3/mascota-3d/out/michi.glb"
bpy.ops.wm.open_mainfile(filepath=SRC)
HZ = 1.78
INK = None

def mat(name, rgb, rough=0.55):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

def smooth(o, levels=1):
    for p in o.data.polygons:
        p.use_smooth = True
    mod = o.modifiers.new("subsurf", "SUBSURF")
    mod.levels = mod.render_levels = levels

def vacio(name):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    return e

def a(parent, o):
    o.parent = parent
    return o

# ── the peach patch, baked into vertex colours ────────────────────────────────────────────
cabeza = bpy.data.objects["cabeza"]
me = cabeza.data
col = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
PELO = (0.93, 0.89, 0.80)
DUR = (0.95, 0.52, 0.30)
for loop in me.loops:
    v = me.vertices[loop.vertex_index].co
    d = (v.x + 0.98) ** 2 + (v.z - 1.02) ** 2
    t = min(1.0, max(0.0, (0.74 - d) / 0.08))  # 1 inside the patch, 0 outside, soft edge
    c = [PELO[i] * (1 - t) + DUR[i] * t for i in range(3)]
    col.data[loop.index].color = (*c, 1)
m = cabeza.active_material
nt = m.node_tree
for n in list(nt.nodes):
    if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
        nt.nodes.remove(n)
ca = nt.nodes.new("ShaderNodeVertexColor")
ca.layer_name = "Col"
nt.links.new(ca.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])

# ── wardrobe ───────────────────────────────────────────────────────────────────────────────
mono = vacio("acc-mono")
for name in ("mono--1", "mono-1", "mono-centro"):
    if name in bpy.data.objects:
        a(mono, bpy.data.objects[name])

PAJA = mat("paja", (0.85, 0.62, 0.25), 0.7)
MAGENTA = mat("magenta", (0.75, 0.15, 0.45), 0.5)
BLANCO = mat("blanco", (0.97, 0.96, 0.95), 0.6)
LILA = mat("lila", (0.72, 0.58, 0.88), 0.6)

som = vacio("acc-sombrero")
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1.35, depth=0.06, location=(0, 0, HZ + 0.74))
o = bpy.context.object; o.name = "sombrero-ala"; o.data.materials.append(PAJA); smooth(o, 1); a(som, o)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=(0, 0, HZ + 0.78))
o = bpy.context.object; o.name = "sombrero-copa"; o.scale = (0.5, 0.5, 0.55); o.data.materials.append(PAJA); smooth(o, 1); a(som, o)
bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.07, location=(0, 0, HZ + 0.86))
o = bpy.context.object; o.name = "sombrero-cinta"; o.data.materials.append(MAGENTA); smooth(o, 1); a(som, o)
bpy.ops.mesh.primitive_torus_add(major_radius=1.33, minor_radius=0.05, location=(0, 0, HZ + 0.76))
o = bpy.context.object; o.name = "sombrero-borde"; o.data.materials.append(MAGENTA); smooth(o, 1); a(som, o)

gorro = vacio("acc-gorro-chef")
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.58, depth=0.3, location=(0, 0, HZ + 0.8))
o = bpy.context.object; o.name = "gorro-banda"; o.data.materials.append(BLANCO); smooth(o, 1); a(gorro, o)
for k, (x, y, z, r) in enumerate([(0, 0, 1.18, 0.5), (-0.38, 0, 1.08, 0.36), (0.38, 0, 1.08, 0.36), (0, -0.3, 1.1, 0.34), (0, 0.3, 1.1, 0.34)]):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(x, y, HZ + z))
    o = bpy.context.object; o.name = f"gorro-nube-{k}"; o.scale = (r, r, r * 0.85); o.data.materials.append(BLANCO); smooth(o, 1); a(gorro, o)

mandil = vacio("acc-mandil")
bpy.ops.mesh.primitive_cube_add(location=(0, -0.6, 0.66))
o = bpy.context.object; o.name = "mandil-pano"; o.scale = (0.4, 0.05, 0.36); o.data.materials.append(LILA)
bev = o.modifiers.new("bevel", "BEVEL"); bev.width = 0.06; bev.segments = 3
smooth(o, 1); a(mandil, o)
bpy.ops.mesh.primitive_torus_add(major_radius=0.62, minor_radius=0.035, location=(0, -0.05, 1.08))
o = bpy.context.object; o.name = "mandil-tira"; o.rotation_euler = (math.radians(70), 0, 0); o.scale = (1, 1, 1); o.data.materials.append(LILA); smooth(o, 1); a(mandil, o)

# ── curves → meshes; lighter subdivision for the web ──────────────────────────────────────
for o in [o for o in bpy.data.objects if o.type == "CURVE"]:
    o.data.bevel_resolution = 4
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
for o in bpy.data.objects:
    for mod in getattr(o, "modifiers", []):
        if mod.type == "SUBSURF":
            mod.levels = mod.render_levels = 1

# ── everything but the studio, exported as one model ───────────────────────────────────────
studio = {"Plane", "key", "fill", "rim"}
bpy.ops.object.select_all(action="DESELECT")
for o in bpy.data.objects:
    if o.type in ("MESH", "EMPTY") and o.name not in studio and not o.name.startswith("Plane"):
        o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_lights=False,
    export_cameras=False,
    # Draco: ~10× smaller for a phone; three's DRACOLoader decodes it from the app's own files
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_color_quantization=10,
)
import os
tris = 0
dg = bpy.context.evaluated_depsgraph_get()
for o in bpy.context.selected_objects:
    if o.type == "MESH":
        ev = o.evaluated_get(dg)
        mm = ev.to_mesh()
        tris += sum(len(p.vertices) - 2 for p in mm.polygons)
        ev.to_mesh_clear()
print({"glb_kb": round(os.path.getsize(OUT) / 1024), "tris": tris, "objetos": len(bpy.context.selected_objects)})
