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

- `input/michi-conectada.png` — the waving cat, cut out and checked: it is exactly what the
  Space prepares from it.
- First run with the raw sheet cell: a flat plane, discarded. The cut-out run waits on the free
  quota (≈ one run a day).
- Next: generate, compare front / side / back against the sheet, then the other poses and the
  objects.

## Run

```
uv pip install gradio_client pillow
uvx --from huggingface_hub hf auth login     # once, in your own terminal
python cutout.py input/michi-conectada-sheet.png input/michi-conectada.png 822,385,900,490
python generate.py input/michi-conectada.png out/michi-conectada.glb
```

`out/` is not committed until a model is approved.
