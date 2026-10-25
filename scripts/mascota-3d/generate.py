"""Turn a cut-out cat into a textured .glb with TRELLIS.2 (MIT) on its free Space.

    python generate.py input/michi-conectada.png out/michi-conectada.glb

The Hugging Face token is read from the local login (`hf auth login`); it is never
passed on the command line or printed. The free quota is about one run a day:
each of the two GPU steps reserves 120 s (measured 2026-10-24).
"""
import shutil
import sys
import time

from gradio_client import Client, handle_file

SPACE = "microsoft/TRELLIS.2"


def generate(src: str, dst: str) -> None:
    started = time.time()
    client = Client(SPACE, verbose=False)
    client.predict(api_name="/start_session")
    prepared = client.predict(handle_file(src), api_name="/preprocess_image")
    prepared = prepared["path"] if isinstance(prepared, dict) else prepared
    shutil.copy(prepared, dst.rsplit(".", 1)[0] + "-prepared.png")
    client.predict(handle_file(prepared), 0, "1024", api_name="/image_to_3d")
    glb, _ = client.predict(300000, 2048, api_name="/extract_glb")
    shutil.copy(glb, dst)
    print(f"{dst} in {round(time.time() - started)} s")


if __name__ == "__main__":
    generate(sys.argv[1], sys.argv[2])
