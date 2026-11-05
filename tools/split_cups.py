"""Splits each product image into a tray layer and a cup layer along the rim.

The cut is crisp across the cup itself and fades softly through the artwork's
drop shadow, so neither layer shows a hard edge when the tray lifts. Stacked
together the two layers look like the original image.

Run:  python tools/split_cups.py <project-root>
Needs: pillow, numpy
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = sys.argv[1]
FOLDER = os.path.join(ROOT, "public", "images", "products")
RIM = {"cucum": 44, "lemo": 44, "berrie": 44, "coke": 42}  # % of image height

# (x %, how far above the rim's lowest point the cut sits, % of height)
CURVE = np.array(
    [[0, 7], [22, 7], [26, 4.6], [30, 3], [35, 1.8], [40, 0.9], [45, 0.3], [50, 0],
     [55, 0.3], [60, 0.9], [65, 1.8], [70, 3], [74, 4.6], [78, 7], [100, 7]],
    dtype=float,
)

for slug, rim in RIM.items():
    img = Image.open(os.path.join(FOLDER, f"{slug}.webp")).convert("RGBA")
    w, h = img.size
    px = np.asarray(img).astype(np.float32)
    xs = np.arange(w) / w * 100
    boundary = (rim - np.interp(xs, CURVE[:, 0], CURVE[:, 1])) / 100 * h
    # softness: under a pixel across the cup, wide out in the shadow
    outside = np.clip((np.abs(xs - 50) - 24) / 6, 0, 1)
    soft = 0.6 + outside * (0.06 * h)
    ys = np.arange(h)[:, None]
    mask = np.clip((boundary[None, :] + soft[None, :] - ys) / (2 * soft[None, :]), 0, 1)
    for name, part in (("tray", mask), ("cup", 1 - mask)):
        layer = px.copy()
        layer[..., 3] *= part
        out = Image.fromarray(layer.astype(np.uint8), "RGBA")
        path = os.path.join(FOLDER, f"{slug}-{name}.webp")
        out.save(path, "WEBP", quality=90, method=6)
        print(os.path.basename(path), out.size, os.path.getsize(path) // 1024, "KB")
