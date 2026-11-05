"""Saves untouched native-resolution copies of the artwork that gets corrected.

Run:  python tools/backup_originals.py <path-to-Home.pdf> <project-root>
Needs: pymupdf, pillow
"""
import io
import os
import sys

import pymupdf
from PIL import Image

PDF, ROOT = sys.argv[1], sys.argv[2]
OUT = os.path.join(ROOT, "artwork", "originals")
os.makedirs(OUT, exist_ok=True)
doc = pymupdf.open(PDF)

ITEMS = {
    "promotional-poster": (44, 3249),
    "stall": (35, 686),
    "cup-carrier": (36, 689),
    "poster-stand": (37, 692),
    "menu-board": (38, 695),
    "loyalty-card": (39, 698),
    "cap": (41, 704),
    "apron": (42, 707),
}

for name, (page, xref) in ITEMS.items():
    info = next(i for i in doc[page - 1].get_images(full=True) if i[0] == xref)
    pix = pymupdf.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if pix.alpha:
        pix = pymupdf.Pixmap(pix, 0)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    if info[1]:
        mask = Image.open(io.BytesIO(pymupdf.Pixmap(doc, info[1]).tobytes("png"))).convert("L")
        img.putalpha(mask.resize(img.size) if mask.size != img.size else mask)
    path = os.path.join(OUT, f"{name}.png")
    img.save(path, optimize=True)
    print(name, img.size, img.mode, os.path.getsize(path) // 1024, "KB")
