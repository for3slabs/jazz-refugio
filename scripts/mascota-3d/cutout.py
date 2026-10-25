"""Cut one cat out of its sheet cell, ready for an image-to-3D model.

The cat is cream on near-white paper, so the generators' own background removal
eats it (measured: TRELLIS.2 returned a flat plane). The black outline is the
reliable edge: flood the paper from every border point and it stops there.

    python cutout.py input/michi-conectada-sheet.png input/michi-conectada.png [x0,y0,x1,y1 ...]

Each optional box (in the 1024 px output) is wiped: motion marks drawn beside the
cat would otherwise become geometry.
"""
import sys

from PIL import Image, ImageDraw, ImageFilter

PAPER = (255, 0, 255)


def flood_paper(img: Image.Image, step: int = 12) -> None:
    w, h = img.size
    edge = [(x, y) for x in range(0, w, step) for y in (0, h - 1)]
    edge += [(x, y) for y in range(0, h, step) for x in (0, w - 1)]
    for point in edge:
        if img.getpixel(point) != PAPER:
            ImageDraw.floodfill(img, point, PAPER, thresh=40)


def cutout(src: str, dst: str, wipes: list[tuple[int, int, int, int]]) -> None:
    cell = Image.open(src).convert("RGB")
    big = cell.resize((cell.width * 3, cell.height * 3), Image.LANCZOS)

    mask = big.copy()
    flood_paper(mask)
    alpha = Image.new("L", big.size, 255)
    px, ap = mask.load(), alpha.load()
    for y in range(big.height):
        for x in range(big.width):
            if px[x, y] == PAPER:
                ap[x, y] = 0
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


if __name__ == "__main__":
    boxes = [tuple(int(n) for n in arg.split(",")) for arg in sys.argv[3:]]
    cutout(sys.argv[1], sys.argv[2], boxes)
