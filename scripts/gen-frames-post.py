"""Turns raw Gemini output from gen-frames.mjs into web assets in public/photobooth/themes/:
pattern tiles -> 640px WebP, chroma-green stickers -> trimmed transparent WebP.
usage: python3 scripts/gen-frames-post.py <raw dir>"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

raw = Path(sys.argv[1])
out = Path("public/photobooth/themes")
out.mkdir(parents=True, exist_ok=True)


def key_green(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    r, g, b = im.split()
    # How much green dominates the other channels; > ~40 is background.
    dominance = ImageChops.subtract(g, ImageChops.lighter(r, b))
    alpha = dominance.point(lambda v: 0 if v > 70 else 255 if v < 25 else int(255 * (70 - v) / 45))
    alpha = alpha.filter(ImageFilter.MinFilter(3))  # eat the green fringe
    # Despill: clamp green to the brighter of red/blue where it still leaks through.
    g = ImageChops.darker(g, ImageChops.lighter(r, b).point(lambda v: min(255, v + 30)))
    w, h = im.size
    # Gemini web stamps a small sparkle in the bottom-right corner; drop it before trimming.
    alpha.paste(0, (int(w * 0.88), int(h * 0.88), w, h))
    return Image.merge("RGBA", (r, g, b, alpha))


def keep_largest_blob(im: Image.Image) -> Image.Image:
    """Drops stray specks the key left behind: keeps only the biggest connected shape (found on a 128px mask)."""
    small = im.getchannel("A").resize((128, 128)).point(lambda v: 255 if v > 64 else 0)
    px = small.load()
    seen, best = set(), set()
    for start in ((x, y) for y in range(128) for x in range(128)):
        if start in seen or not px[start]:
            continue
        blob, stack = set(), [start]
        seen.add(start)
        while stack:
            x, y = stack.pop()
            blob.add((x, y))
            for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= n[0] < 128 and 0 <= n[1] < 128 and n not in seen and px[n]:
                    seen.add(n)
                    stack.append(n)
        best = max(best, blob, key=len)
    mask = Image.new("L", (128, 128))
    for p in best:
        mask.putpixel(p, 255)
    mask = mask.filter(ImageFilter.MaxFilter(5)).resize(im.size)
    im.putalpha(ImageChops.multiply(im.getchannel("A"), mask))
    return im


for f in sorted(raw.glob("*.png")):
    im = Image.open(f)
    dest = out / f"{f.stem}.webp"
    if f.stem.endswith("-tile"):
        im.convert("RGB").resize((640, 640), Image.LANCZOS).save(dest, quality=82)
    else:
        im = keep_largest_blob(key_green(im))
        im = im.crop(im.getchannel("A").getbbox())
        im.thumbnail((360, 360), Image.LANCZOS)
        im.save(dest, quality=88)
    print(dest, dest.stat().st_size // 1024, "KB")
