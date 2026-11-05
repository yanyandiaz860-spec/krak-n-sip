"""Extracts Krak N Sip artwork from Home.pdf into public/images.

Every image comes straight from the embedded PDF objects. Nothing is redrawn.
Run:  python tools/extract_assets.py <path-to-Home.pdf> <project-root>
Needs: pymupdf, pillow
"""
import io
import os
import sys

import pymupdf
from PIL import Image

PDF, ROOT = sys.argv[1], sys.argv[2]
OUT = os.path.join(ROOT, "public", "images")
doc = pymupdf.open(PDF)


def load(page, xref):
    """Return an embedded image as RGBA, applying its soft mask if it has one."""
    info = next(i for i in doc[page - 1].get_images(full=True) if i[0] == xref)
    pix = pymupdf.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if pix.alpha:
        pix = pymupdf.Pixmap(pix, 0)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    if info[1]:
        mask_pix = pymupdf.Pixmap(doc, info[1])
        mask = Image.open(io.BytesIO(mask_pix.tobytes("png"))).convert("L")
        img.putalpha(mask.resize(img.size) if mask.size != img.size else mask)
    return img.convert("RGBA")


def rect(page, xref):
    r = doc[page - 1].get_image_rects(xref)[0]
    return r.x0, r.y0, r.x1, r.y1


def save(img, rel, max_side=None, quality=88):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if max_side and max(img.size) > max_side:
        img = img.copy()
        img.thumbnail((max_side, max_side), Image.LANCZOS)
    if rel.endswith(".webp"):
        img.save(path, "WEBP", quality=quality, method=6)
    elif rel.endswith(".jpg"):
        img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    else:
        img.save(path, optimize=True)
    print(f"{rel:44s} {img.size[0]}x{img.size[1]}  {os.path.getsize(path)//1024} KB")


def trim(img, pad=6):
    box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def sign_layer(page_no, sign_xref, zoom=4):
    """Render the wooden sign and its PDF lettering with every other layer removed."""
    tmp = pymupdf.open(PDF)
    tmp.select([page_no - 1])
    page = tmp[0]
    rects = page.get_image_rects(sign_xref)
    big = max(rects, key=lambda r: r.width * r.height)
    for info in page.get_images(full=True):
        if info[0] != sign_xref:
            page.delete_image(info[0])
    page.add_redact_annot(page.rect)
    page.apply_redactions(
        images=pymupdf.PDF_REDACT_IMAGE_NONE,
        graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED,
        text=pymupdf.PDF_REDACT_TEXT_NONE,
    )
    clip = big + (-6, -6, 6, 6)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=True)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")


# ---- products: cup + brand sticker composited at their page positions -----
PRODUCTS = {
    # slug: page, cup, sticker, sign, garnish
    "cucum": (27, 2963, 4563, 2965, 2966),
    "lemo": (28, 3011, 4605, 3006, 3013),
    "berrie": (29, 3058, 4645, 3047, 3060),
    "coke": (30, 3105, 4685, 3088, 3107),
}
for slug, (page, cup_x, sticker_x, sign_x, garnish_x) in PRODUCTS.items():
    cup = load(page, cup_x)
    cx0, cy0, cx1, _ = rect(page, cup_x)
    sx0, sy0, sx1, sy1 = rect(page, sticker_x)
    scale = cup.width / (cx1 - cx0)
    sticker = load(page, sticker_x).resize(
        (round((sx1 - sx0) * scale), round((sy1 - sy0) * scale)), Image.LANCZOS
    )
    # keep the sticker inside the cup silhouette so its soft shadow never spills outside
    layer = Image.new("RGBA", cup.size, (0, 0, 0, 0))
    layer.paste(sticker, (round((sx0 - cx0) * scale), round((sy0 - cy0) * scale)))
    layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", cup.size, 0), cup.getchannel("A")))
    canvas = cup.copy()
    canvas.alpha_composite(layer)
    save(trim(canvas, pad=2), f"products/{slug}.webp", max_side=1200, quality=90)
    save(trim(load(page, garnish_x)), f"products/{slug}-garnish.webp", quality=90)
    save(trim(sign_layer(page, sign_x)), f"products/{slug}-sign.webp", max_side=640, quality=90)

# ---- logo system ----------------------------------------------------------
save(trim(load(24, 528)), "brand/secondary-logo.webp", max_side=1000, quality=92)
save(trim(load(24, 528)), "brand/secondary-logo-small.webp", max_side=200, quality=90)
# Same 857x889 canvas on p18, so the three highlights line up exactly when crossfaded.
for letter, xref in {"k": 2430, "s": 2435, "i": 2438}.items():
    save(load(18, xref), f"brand/breakdown-{letter}.webp", quality=92)
save(trim(load(22, 456)), "brand/component-emblem.webp", max_side=700)
save(trim(load(22, 461)), "brand/component-name.webp", max_side=900)
save(trim(load(22, 466)), "brand/component-droplets.webp", max_side=500, quality=90)

# ---- first brand post and poster: native size, no recompression loss -------
post = load(43, 727)
save(trim(post, pad=0), "post/first-brand-post.png")
save(trim(post, pad=0), "post/first-brand-post.webp", quality=95)
save(load(44, 3249), "poster/promotional-poster.png")
save(load(44, 3249), "poster/promotional-poster.webp", quality=95)

# ---- brand applications ---------------------------------------------------
for name, (page, xref) in {
    "stall": (35, 686), "cup-carrier": (36, 689), "poster-stand": (37, 692), "menu-board": (38, 695),
    "loyalty-card": (39, 698), "paper-bag": (40, 701), "cap": (41, 704), "apron": (42, 707),
}.items():
    save(load(page, xref), f"mockups/{name}.webp", max_side=1100, quality=86)

# ---- temporary team portraits (template image from page 2) ------------------
# One independent file per member so each can be replaced on its own.
portrait = load(2, 1802)
for i, bg in enumerate(["#FD791B", "#1F65FF", "#FD791B", "#1F65FF"], start=1):
    flat = Image.new("RGBA", portrait.size, bg)
    flat.alpha_composite(portrait)
    save(flat, f"team/member-{i:02d}.jpg", quality=90)


# ---- round icons from "Meet the Brand" (p3) --------------------------------
ICONS = {"seafood": (620, 293, 742, 415), "on-the-go": (921, 292, 1042, 414), "cup": (1218, 293, 1340, 415)}
for name, clip in ICONS.items():
    pix = doc[2].get_pixmap(matrix=pymupdf.Matrix(1.3, 1.3), clip=pymupdf.Rect(*clip), alpha=False)
    save(Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB"), f"brand/icon-{name}.webp", quality=90)
