"""Remove fundo sólido das logos Lizin/Xiclé e gera PNG transparente."""
from pathlib import Path
from PIL import Image

assets = Path(r"C:\Users\USER\.cursor\projects\d-DEV-Conex-oAfiliado\assets")
out_dir = Path(__file__).resolve().parents[1] / "client" / "public" / "brands"
out_dir.mkdir(parents=True, exist_ok=True)

xicle_src = next(assets.glob("*XICL*"))
lizin_src = next(assets.glob("*logolizin*"))


def color_dist(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def flood_remove(img: Image.Image, tol: int, soft: int = 40) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    visited = [[False] * w for _ in range(h)]
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    step_x = max(1, w // 40)
    step_y = max(1, h // 40)
    for x in range(0, w, step_x):
        stack.extend([(x, 0), (x, h - 1)])
    for y in range(0, h, step_y):
        stack.extend([(0, y), (w - 1, y)])

    bg_mask = [[False] * w for _ in range(h)]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, _a = px[x, y]
        if color_dist((r, g, b), bg) <= tol:
            bg_mask[y][x] = True
            stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    out = Image.new("RGBA", (w, h))
    out_px = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if bg_mask[y][x]:
                out_px[x, y] = (r, g, b, 0)
                continue
            d = color_dist((r, g, b), bg)
            if d < tol + soft:
                alpha = int(255 * (d - tol) / soft) if d > tol else 0
                out_px[x, y] = (r, g, b, max(0, min(255, alpha)))
            else:
                out_px[x, y] = (r, g, b, a)
    return out


def trim_transparent(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.split()[-1].getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(img.width, r + pad),
            min(img.height, b + pad),
        )
    )


def process(src: Path, dest: Path, tol: int, soft: int):
    img = Image.open(src)
    out = trim_transparent(flood_remove(img, tol=tol, soft=soft))
    # limita largura para uso em card/avatar (mantém nitidez)
    max_w = 900
    if out.width > max_w:
        ratio = max_w / out.width
        out = out.resize((max_w, max(1, int(out.height * ratio))), Image.Resampling.LANCZOS)
    out.save(dest, "PNG", optimize=True)
    p = out.load()
    corners = [p[0, 0][3], p[out.width - 1, 0][3], p[0, out.height - 1][3], p[out.width - 1, out.height - 1][3]]
    print(f"{dest.name}: {img.size} -> {out.size}, {dest.stat().st_size} bytes, corner_alpha={corners}")


process(xicle_src, out_dir / "xicle-logo.png", tol=45, soft=35)
process(lizin_src, out_dir / "lizin-logo.png", tol=55, soft=40)
print("OK", out_dir)
