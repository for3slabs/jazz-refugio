"""Cut one cat out of its sheet cell, ready for an image-to-3D model.

The cat is cream on near-white paper, so the generators' own background removal
eats it (measured: TRELLIS.2 returned a flat plane). The black outline is the
reliable edge: flood the paper from every border point and it stops there.

    python cutout.py input/michi-conectada-sheet.png input/michi-conectada.png [x0,y0,x1,y1 ...]

Only the largest piece of ink survives: sparkles, swirls and motion marks drawn
beside the cat would otherwise become geometry. Each optional box (in the 1024 px
output) is wiped too, for a mark that touches the cat.

    python cutout.py --sheet input/michi-sheet.jpg input/michi [mode:x0,y0,x1,y1 ...]

cuts the six cells of a 3 × 2 sheet, in the order of the modes.
"""
import sys
from collections import deque

from PIL import Image, ImageDraw, ImageFilter

PAPER = (255, 0, 255)
MODES = ["hiperfoco", "conectada", "mil-ideas", "saturada", "recargando", "no-arranco"]


def flood_paper(img: Image.Image, step: int = 12) -> None:
    w, h = img.size
    edge = [(x, y) for x in range(0, w, step) for y in (0, h - 1)]
    edge += [(x, y) for y in range(0, h, step) for x in (0, w - 1)]
    for point in edge:
        if img.getpixel(point) != PAPER:
            ImageDraw.floodfill(img, point, PAPER, thresh=40)


def keep_largest(alpha: Image.Image) -> None:
    w, h = alpha.size
    ap = alpha.load()
    seen = bytearray(w * h)
    best: list[int] = []
    for start in range(w * h):
        if seen[start] or not ap[start % w, start // w]:
            continue
        seen[start] = 1
        piece, queue = [start], deque([start])
        while queue:
            i = queue.popleft()
            x, y = i % w, i // w
            for j, ok in ((i - 1, x > 0), (i + 1, x < w - 1), (i - w, y > 0), (i + w, y < h - 1)):
                if ok and not seen[j] and ap[j % w, j // w]:
                    seen[j] = 1
                    piece.append(j)
                    queue.append(j)
        if len(piece) > len(best):
            best = piece
    keep = bytearray(w * h)
    for i in best:
        keep[i] = 1
    for i in range(w * h):
        if not keep[i]:
            ap[i % w, i // w] = 0


def cutout(src: str | Image.Image, dst: str, wipes: list[tuple[int, int, int, int]]) -> None:
    cell = (src if isinstance(src, Image.Image) else Image.open(src)).convert("RGB")
    big = cell.resize((cell.width * 3, cell.height * 3), Image.LANCZOS)

    mask = big.copy()
    flood_paper(mask)
    alpha = Image.new("L", big.size, 255)
    px, ap = mask.load(), alpha.load()
    for y in range(big.height):
        for x in range(big.width):
            if px[x, y] == PAPER:
                ap[x, y] = 0
    keep_largest(alpha)
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))

    cat = big.convert("RGBA")
    cat.putalpha(alpha)
    cat = cat.crop(alpha.point(lambda a: 255 if a > 128 else 0).getbbox())

    side = int(max(cat.size) * 1.15)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cat, ((side - cat.width) // 2, (side - cat.height) // 2))
    out = square.resize((1024, 1024), Image.LANCZOS)

    a = out.getchannel("A")
    draw = ImageDraw.Draw(a)
    for box in wipes:
        draw.rectangle(box, fill=0)
    out.putalpha(a)
    out.save(dst)


def cut_sheet(src: str, prefix: str, wipes: dict[str, list[tuple[int, int, int, int]]]) -> None:
    sheet = Image.open(src)
    cw, ch = sheet.width / 3, sheet.height / 2
    for n, mode in enumerate(MODES):
        col, row = n % 3, n // 3
        cell = sheet.crop((round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch)))
        cutout(cell, f"{prefix}-{mode}.png", wipes.get(mode, []))


def parse_box(text: str) -> tuple[int, int, int, int]:
    return tuple(int(n) for n in text.split(","))


if __name__ == "__main__":
    if sys.argv[1] == "--sheet":
        per_mode: dict[str, list[tuple[int, int, int, int]]] = {}
        for arg in sys.argv[4:]:
            mode, box = arg.split(":")
            per_mode.setdefault(mode, []).append(parse_box(box))
        cut_sheet(sys.argv[2], sys.argv[3], per_mode)
    else:
        cutout(sys.argv[1], sys.argv[2], [parse_box(arg) for arg in sys.argv[3:]])
