# mascota-3d

How the pet stops being a cat built in code (`src/components/mascota/gato.tsx`) and becomes the
cat of the approved 2D sheets, in 3D, with every part its own object. Free tools only.

## The route

```
2D sheet cell ──cutout.py──▶ clean cat (alpha) ──generate.py──▶ .glb ──Blender──▶ parts ──▶ gato.tsx
                              input/*.png         TRELLIS.2 (MIT)       hat · face · body · tail · feet
```

| Step | Tool | Why this one |
|---|---|---|
| cut the cat out | `cutout.py` (Pillow) | the cat is cream on near-white paper: the generators' own background removal ate it |
| image → 3D | TRELLIS.2 on its Hugging Face Space | MIT licence (this repo is public) and free; Hunyuan3D asks 270 s of GPU, more than the free quota allows |
| split into parts, pivots, phone weight | Blender (free) | one object per part so each can move by mood |

Ruled out: Tripo free (Tripo keeps the rights to free outputs), Meshy free (CC BY, ~3 models a
month), running TRELLIS locally (needs a 24 GB NVIDIA GPU).

## State

- `input/michi-sheet.jpg` — the approved michi sheet; `input/michi-<mode>.png` — its six poses,
  cut out. Only the largest piece of ink is kept, so sparkles, swirls and motion marks go on
  their own; the one mark that touches the cat (the desk line in *hiperfoco*) is wiped by box.
- First run with the raw sheet cell: a flat plane, discarded. The cut-out run waits on the free
  quota (≈ one run a day).
- `prepare.py` (Blender, headless) is ready and tested on stand-in models: feet on y = 0, 2.6
  units tall, ≤ 40,000 triangles, and it refuses a decimate that cuts the model short.
- Next: generate `conectada`, compare front / side / back against the sheet, then the other poses
  and the objects; splitting into parts is designed on the first real mesh.

## Run

```
uvx --from huggingface_hub hf auth login     # once, in your own terminal
uv run --with pillow python cutout.py --sheet input/michi-sheet.jpg input/michi hiperfoco:782,676,832,698
uv run --with gradio_client python generate.py input/michi-conectada.png out/michi-conectada.glb
uv run --python 3.11 --with bpy python prepare.py out/michi-conectada.glb out/michi-conectada-ready.glb
```

`bpy` needs `libSM` and `libICE`. Without sudo, unpack them into your home and point at them:
`apt-get download libsm6 libice6`, `dpkg -x <each>.deb ~/.local/lib/blender-x11`, then
`export LD_LIBRARY_PATH=~/.local/lib/blender-x11/usr/lib/x86_64-linux-gnu`.

`out/` is not committed until a model is approved.
