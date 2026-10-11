"""
tools/make-portrait.py — turn a photo into 64x64 and 128x128 pixel-art face pictures.

Needs Python 3 and Pillow:   pip3 install pillow

Usage:
  python3 tools/make-portrait.py PHOTO NAME [--crop LEFT,TOP,SIZE] [--bg #3a4a5e]

  PHOTO   the photo file (jpg or png)
  NAME    short name for the files, e.g. borhan
  --crop  square around the head, in photo pixels: left edge, top edge, size.
          Open the photo in Preview → Tools → Show Inspector to read pixel positions.
          If left out, the script uses a square from the top middle of the photo.
  --bg    background color behind the person (default dark blue-gray)

It writes www/characters/portraits/NAME-64.png and NAME-128.png.
Then add to that character's file:   portrait: "characters/portraits/NAME-64.png",

Example (how Preston's was made):
  python3 tools/make-portrait.py design/preston-photo.jpg preston --crop 150,799,879

Works best with a plain, light background behind the person (like an ID photo).
"""
import argparse, colorsys, os
from collections import deque
from PIL import Image, ImageEnhance

ap = argparse.ArgumentParser()
ap.add_argument("photo"); ap.add_argument("name")
ap.add_argument("--crop", default=None)
ap.add_argument("--bg", default="#3a4a5e")
args = ap.parse_args()

src = Image.open(args.photo).convert("RGB")
if args.crop:
    l, t, s = [int(v) for v in args.crop.split(",")]
else:
    s = int(min(src.width, src.height) * 0.7); l = (src.width - s) // 2; t = int(src.height * 0.08)
box = (l, t, l + s, t + s)
BG = tuple(int(args.bg.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
OUT = (22, 23, 28)

# sample the background from the top corners of the crop
raw_small = src.crop(box).resize((32, 32), Image.BOX).load()
samples = [raw_small[1, 1], raw_small[30, 1], raw_small[1, 12], raw_small[30, 12]]
def hls(p): return colorsys.rgb_to_hls(*[v / 255 for v in p])
bh = sum(hls(p)[0] for p in samples) / 4

def make(N):
    c = src.crop(box)
    c = ImageEnhance.Contrast(c).enhance(1.25)
    c = ImageEnhance.Color(c).enhance(1.2)
    c = c.resize((N, N), Image.LANCZOS)
    raw = src.crop(box).resize((N, N), Image.BOX).load()

    def isbg(p):
        h, l_, s_ = hls(p)
        return 0.38 < l_ < 0.92 and s_ < 0.18 and abs(h - bh) < 0.04

    mask = [[False] * N for _ in range(N)]
    q = deque([(x, 0) for x in range(N)] + [(0, y) for y in range(N)] + [(N - 1, y) for y in range(N)])
    while q:
        x, y = q.popleft()
        if not (0 <= x < N and 0 <= y < N) or mask[y][x] or not isbg(raw[x, y]): continue
        mask[y][x] = True
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # keep only the biggest blob (the person)
    seen = [[False] * N for _ in range(N)]; comps = []
    for yy in range(N):
        for xx in range(N):
            if mask[yy][xx] or seen[yy][xx]: continue
            comp = []; dq = deque([(xx, yy)]); seen[yy][xx] = True
            while dq:
                a, b = dq.popleft(); comp.append((a, b))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    na, nb = a + dx, b + dy
                    if 0 <= na < N and 0 <= nb < N and not seen[nb][na] and not mask[nb][na]:
                        seen[nb][na] = True; dq.append((na, nb))
            comps.append(comp)
    comps.sort(key=len)
    for comp in comps[:-1]:
        for a, b in comp: mask[b][a] = True

    q2 = c.quantize(colors=24 if N == 64 else 32, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB").load()
    res = Image.new("RGB", (N, N), BG); r = res.load()
    for y in range(N):
        for x in range(N):
            if not mask[y][x]: r[x, y] = q2[x, y]
    for y in range(N):
        for x in range(N):
            if mask[y][x] and any(0 <= x + dx < N and 0 <= y + dy < N and not mask[y + dy][x + dx]
                                  for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                r[x, y] = OUT
    return res

here = os.path.dirname(os.path.abspath(__file__))
outdir = os.path.join(here, "..", "www", "characters", "portraits")
os.makedirs(outdir, exist_ok=True)
for N in (64, 128):
    out = os.path.join(outdir, f"{args.name}-{N}.png")
    make(N).save(out)
    print("Wrote", os.path.relpath(out))
