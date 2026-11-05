"""Copies corrected artwork into the website and builds before-and-after sheets.

Run after fix_artwork.py:  python tools/publish_artwork.py <project-root>
Needs: pillow
"""
import os
import sys

from PIL import Image, ImageDraw

ROOT = sys.argv[1]
ART = os.path.join(ROOT, "artwork")
SITE = os.path.join(ROOT, "public", "images")
SHEETS = os.path.join(ART, "comparisons")
os.makedirs(SHEETS, exist_ok=True)

MOCKUPS = ["stall", "cup-carrier", "poster-stand", "menu-board", "cap", "apron"]


def flat(path):
    img = Image.open(path).convert("RGBA")
    ground = Image.new("RGBA", img.size, (235, 235, 235, 255))
    ground.alpha_composite(img)
    return ground.convert("RGB")


def sheet(name, height=1000):
    before = flat(os.path.join(ART, "originals", f"{name}.png"))
    after = flat(os.path.join(ART, "corrected", f"{name}.png"))
    scale = height / before.height
    w = round(before.width * scale)
    out = Image.new("RGB", (w * 2 + 30, height + 44), "white")
    draw = ImageDraw.Draw(out)
    draw.text((8, 14), "BEFORE", fill="black")
    draw.text((w + 38, 14), "AFTER", fill="black")
    out.paste(before.resize((w, height), Image.LANCZOS), (0, 44))
    out.paste(after.resize((w, height), Image.LANCZOS), (w + 30, 44))
    out.save(os.path.join(SHEETS, f"{name}.jpg"), quality=90)


for name in MOCKUPS:
    img = Image.open(os.path.join(ART, "corrected", f"{name}.png"))
    img.thumbnail((1100, 1100), Image.LANCZOS)
    img.save(os.path.join(SITE, "mockups", f"{name}.webp"), "WEBP", quality=88, method=6)
    sheet(name)

poster = Image.open(os.path.join(ART, "corrected", "promotional-poster.png"))
poster.save(os.path.join(SITE, "poster", "promotional-poster.png"), optimize=True)
poster.save(os.path.join(SITE, "poster", "promotional-poster.webp"), "WEBP", quality=95, method=6)
sheet("promotional-poster")
print("published", len(MOCKUPS) + 1, "images")
