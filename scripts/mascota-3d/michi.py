# Her pet, v5 — the body Brian chose (2026-10-25): standing, a big wide head, one peach ear with a
# patch spilling from it, an open happy mouth, a pear-shaped body, one paw at rest and one waving,
# two short legs with feet, a pink bow. Every part is its OWN object, fully formed (D-17); no ink
# outline — light and shadow give the form (D-16). Feet at z=0, facing -Y.
import bpy, bmesh, math
from mathutils import Vector

OUT = "/home/brianweb3/mascota-3d/out"

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)
for m in list(bpy.data.materials):
    bpy.data.materials.remove(m)


def mat(name, rgb, rough=0.55, sss=0.0, spec=0.4):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = sss
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = spec
    return m


PELO = mat("pelo", (0.93, 0.89, 0.80), 0.6, 0.15)
DURAZNO = mat("durazno", (0.95, 0.52, 0.30), 0.6, 0.1)
ROSA = mat("rosa", (0.95, 0.55, 0.62), 0.5)
BOCA = mat("boca", (0.42, 0.08, 0.12), 0.7)
LENGUA = mat("lengua", (0.96, 0.52, 0.58), 0.45)
OJO = mat("ojo", (0.02, 0.015, 0.02), 0.08, 0.0, 0.8)
BRILLO = mat("brillo", (1, 1, 1), 0.1)
MONO = mat("mono", (0.93, 0.38, 0.62), 0.45)


def smooth(o, levels=2):
    for p in o.data.polygons:
        p.use_smooth = True
    mod = o.modifiers.new("subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels


def esfera(name, loc, scale, m, seg=48, rings=32, sub=1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    o.data.materials.append(m)
    smooth(o, sub)
    return o


def capsula(name, a, b, r, m):
    """A rounded limb from point a to point b: a smooth tube (a curve with a round bevel), its ends
    closed by spheres — a cylinder showed ribs once smoothed."""
    a, b = Vector(a), Vector(b)
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(1)
    sp.points[0].co = (*a, 1)
    sp.points[1].co = (*b, 1)
    cu.bevel_depth = r
    cu.bevel_resolution = 8
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    for p in (a, b):
        esfera(name + "-cap", p, (r, r, r), m, 32, 16)
    return o


# ── head: wide, a little flattened, sitting ON the body so the neck shows ──────────────────
HZ = 1.78
cabeza = esfera("cabeza", (0, 0, HZ), (1.08, 0.9, 0.86), PELO, 64, 48, 2)
# the peach patch: a soft-edged circle in the head's own coordinates, painted in its material
m = PELO.copy()
m.name = "pelo-cabeza"
cabeza.data.materials[0] = m
nt = m.node_tree
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tc.outputs["Object"], sep.inputs[0])
def op(kind, a, b):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = kind
    for i, v in enumerate((a, b)):
        if isinstance(v, float):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]
dx = op("POWER", op("ADD", sep.outputs["X"], 0.98), 2.0)
dz = op("POWER", op("SUBTRACT", sep.outputs["Z"], 1.02), 2.0)
d = op("ADD", dx, dz)
rango = nt.nodes.new("ShaderNodeMapRange")
nt.links.new(d, rango.inputs["Value"])
rango.inputs["From Min"].default_value = 0.66
rango.inputs["From Max"].default_value = 0.74
rango.inputs["To Min"].default_value = 1.0
rango.inputs["To Max"].default_value = 0.0
mix = nt.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
nt.links.new(rango.outputs[0], mix.inputs["Factor"])
mix.inputs["A"].default_value = (0.93, 0.89, 0.80, 1)
mix.inputs["B"].default_value = (0.95, 0.52, 0.30, 1)
nt.links.new(mix.outputs["Result"], nt.nodes["Principled BSDF"].inputs["Base Color"])

# ── ears: a cone each, the left one peach, a pink hollow inside ────────────────────────────
for lado, m in ((-1, DURAZNO), (1, PELO)):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.44, radius2=0.05, depth=0.72, location=(lado * 0.66, -0.02, HZ + 0.72))
    o = bpy.context.object
    o.name = f"oreja-{'izq' if lado < 0 else 'der'}"
    o.rotation_euler = (math.radians(-6), math.radians(lado * 26), 0)
    o.scale = (1, 0.6, 1)
    o.data.materials.append(m)
    smooth(o, 2)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.27, radius2=0.03, depth=0.46, location=(lado * 0.64, -0.2, HZ + 0.68))
    i = bpy.context.object
    i.name = o.name + "-hueco"
    i.rotation_euler = (math.radians(-6), math.radians(lado * 26), 0)
    i.scale = (1, 0.3, 1)
    i.data.materials.append(ROSA)
    smooth(i, 2)

# ── face, in relief: bead eyes, a nose, an open mouth sunk in with a tongue, blush ────────
for lado in (-1, 1):
    esfera(f"ojo-{lado}", (lado * 0.36, -0.8, HZ + 0.02), (0.085, 0.06, 0.11), OJO, 32, 16)
    esfera(f"brillo-{lado}", (lado * 0.36 + 0.025, -0.855, HZ + 0.06), (0.022, 0.012, 0.022), BRILLO, 16, 8)
    esfera(f"chapa-{lado}", (lado * 0.58, -0.69, HZ - 0.17), (0.13, 0.03, 0.07), ROSA, 24, 12)
esfera("nariz", (0, -0.885, HZ - 0.12), (0.07, 0.04, 0.05), ROSA, 24, 12)
esfera("boca", (0, -0.86, HZ - 0.27), (0.15, 0.025, 0.1), BOCA, 32, 16)
esfera("lengua", (0, -0.875, HZ - 0.32), (0.09, 0.02, 0.045), LENGUA, 24, 12)

# ── body: a pear, wider at the bottom ──────────────────────────────────────────────────────
cuerpo = esfera("cuerpo", (0, 0.02, 0.72), (0.66, 0.58, 0.6), PELO, 48, 32, 2)
for v in cuerpo.data.vertices:
    v.co.x *= 1 + 0.18 * (-v.co.z)
    v.co.y *= 1 + 0.12 * (-v.co.z)

# ── arms: one at rest, one waving OUTSIDE the head, a paw that reads as a paw ─────────────
capsula("brazo-izq", (-0.55, -0.02, 1.02), (-0.86, -0.08, 0.7), 0.15, PELO)
esfera("mano-izq", (-0.9, -0.1, 0.64), (0.17, 0.15, 0.16), PELO, 32, 16)
capsula("brazo-der", (0.55, -0.04, 1.06), (1.14, -0.14, 1.36), 0.15, PELO)
esfera("mano-der", (1.22, -0.17, 1.47), (0.18, 0.13, 0.2), PELO, 32, 16)
for k, dx in enumerate((-0.08, 0, 0.08)):
    esfera(f"dedo-{k}", (1.22 + dx, -0.27, 1.57 - abs(dx) * 0.4), (0.045, 0.035, 0.045), PELO, 16, 8)
    esfera(f"cojin-{k}", (1.22 + dx, -0.295, 1.57 - abs(dx) * 0.4), (0.025, 0.012, 0.025), ROSA, 12, 6)

# ── legs with feet ─────────────────────────────────────────────────────────────────────────
for lado in (-1, 1):
    capsula(f"pierna-{lado}", (lado * 0.26, 0.0, 0.32), (lado * 0.27, -0.02, 0.1), 0.17, PELO)
    esfera(f"pie-{lado}", (lado * 0.28, -0.1, 0.08), (0.2, 0.26, 0.11), PELO, 32, 16)

# ── a tail curling behind ──────────────────────────────────────────────────────────────────
curva = bpy.data.curves.new("cola", "CURVE")
curva.dimensions = "3D"
sp = curva.splines.new("BEZIER")
sp.bezier_points.add(2)
for bp, co in zip(sp.bezier_points, [(0.3, 0.45, 0.5), (0.8, 0.75, 0.8), (0.65, 0.85, 1.25)]):
    bp.co = co
    bp.handle_left_type = bp.handle_right_type = "AUTO"
curva.bevel_depth = 0.1
curva.bevel_resolution = 6
cola = bpy.data.objects.new("cola", curva)
bpy.context.collection.objects.link(cola)
cola.data.materials.append(PELO)

# ── the pink bow under the chin ────────────────────────────────────────────────────────────
for lado in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.16, radius2=0.03, depth=0.32, location=(lado * 0.17, -0.62, 1.02))
    o = bpy.context.object
    o.name = f"mono-{lado}"
    o.rotation_euler = (0, math.radians(lado * -90), 0)
    o.scale = (1, 0.55, 1)
    o.data.materials.append(MONO)
    smooth(o, 2)
esfera("mono-centro", (0, -0.66, 1.02), (0.08, 0.06, 0.08), MONO, 24, 12)

# ── studio: soft key, fill, rim; a floor that catches the shadow ───────────────────────────
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
piso = bpy.context.object
piso.data.materials.append(mat("piso", (0.82, 0.74, 0.86), 0.9))
for nombre, loc, energia, size in (("key", (-3, -4, 5), 900, 3), ("fill", (4, -3, 2.5), 350, 4), ("rim", (1, 4, 4), 600, 2)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.name = nombre
    L.data.energy = energia
    L.data.size = size
    L.rotation_mode = "QUATERNION"
    L.rotation_quaternion = (Vector((0, 0, 1.1)) - Vector(loc)).to_track_quat("-Z", "Y")
w = bpy.context.scene.world or bpy.data.worlds.new("w")
bpy.context.scene.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.26, 0.36, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6

sc = bpy.context.scene
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.render.resolution_x = sc.render.resolution_y = 900
sc.render.film_transparent = False


def foto(nombre, loc):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.data.lens = 70
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = (Vector((0, 0, 1.3)) - Vector(loc)).to_track_quat("-Z", "Y")
    sc.camera = cam
    sc.render.filepath = f"{OUT}/v7-{nombre}.png"
    bpy.ops.render.render(write_still=True)


foto("frente", (0, -10.5, 1.8))
foto("tres-cuartos", (5.2, -9, 2.4))
partes = sorted(o.name for o in bpy.data.objects if o.type in ("MESH", "CURVE") and o.name != "Plane")
bpy.ops.wm.save_as_mainfile(filepath=f"{OUT}/michi-v7.blend")
result = {"engine": sc.render.engine, "partes": len(partes)}
print(result)
