"""Make a TRELLIS .glb fit the scene: feet on the floor, centred, the cat's height, phone weight.

    python prepare.py out/michi-conectada.glb out/michi-conectada-ready.glb [max_triangles]

Runs Blender headless as a Python module (`bpy`), no window. The scene in
`src/components/mascota/escena.tsx` frames a cat about 2.6 units tall standing on y = 0;
a model that matches needs no camera change. The triangle cap (default 40,000) is a
starting point, to be measured on a real phone.

Splitting into parts (hat · face · body · tail · feet) comes after the first real model:
where to cut depends on the mesh TRELLIS returns.
"""
import sys

import bpy

HEIGHT = 2.6


def height(obj: bpy.types.Object) -> float:
    # only vertices that belong to a face: the exporter drops the loose ones
    zs = [obj.data.vertices[i].co.z for p in obj.data.polygons for i in p.vertices]
    return max(zs) - min(zs)


def prepare(src: str, dst: str, cap: int) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    cat = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # the importer splits vertices at every seam, and the decimate treats a seam as an open edge:
    # unwelded, it trimmed the bottom of a test sphere by 5%. UVs live per corner, so they survive
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.object.mode_set(mode="OBJECT")

    before = sum(len(p.vertices) - 2 for p in cat.data.polygons)
    tall = height(cat)
    if before > cap:
        dec = cat.modifiers.new("phone", "DECIMATE")
        dec.ratio = cap / before
        bpy.ops.object.modifier_apply(modifier=dec.name)
    after = sum(len(p.vertices) - 2 for p in cat.data.polygons)
    # the guard stays: a model cut short loses its feet first
    if height(cat) < tall * 0.99:
        sys.exit(f"decimating to {after:,} triangles cut the model short: raise the cap")

    # glTF is y-up; Blender is z-up and the importer turns it, so height is z here
    xs, ys, zs = zip(*(cat.data.vertices[i].co for p in cat.data.polygons for i in p.vertices))
    k = HEIGHT / (max(zs) - min(zs))
    cat.location = (-(max(xs) + min(xs)) / 2 * k, -(max(ys) + min(ys)) / 2 * k, -min(zs) * k)
    cat.scale = (k, k, k)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=True)
    print(f"{dst} · triangles {before:,} → {after:,} · scale ×{k:.3f}")


if __name__ == "__main__":
    prepare(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 40_000)
