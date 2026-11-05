"""Applies the approved text corrections to copies of the artwork.

Reads artwork/originals/*.png, which are never modified, and writes
artwork/corrected/*.png.

Run:  python tools/fix_artwork.py <project-root>
Needs: opencv-python-headless, pillow, fonttools, numpy
"""
import io
import os
import sys

import cv2
import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from wordmark import extract_sip  # noqa: E402

ROOT = sys.argv[1]
SRC = os.path.join(ROOT, "artwork", "originals")
OUT = os.path.join(ROOT, "artwork", "corrected")
os.makedirs(OUT, exist_ok=True)
SIP = extract_sip(os.path.join(SRC, "loyalty-card.png"))


def font(name, size):
    """Loads a Poppins web font from node_modules as a TrueType font."""
    path = os.path.join(ROOT, "node_modules", "@fontsource", "poppins", "files", f"poppins-latin-{name}.woff")
    face = TTFont(path)
    face.flavor = None
    data = io.BytesIO()
    face.save(data)
    data.seek(0)
    return ImageFont.truetype(data, size)


def find_old_word(rgb, box, grow, light_ground=True, n_depth=5.0, stain=True):
    """Finds the old letters by shape, and protects everything around them.

    Orange shapes whose centre falls inside `box` are the old word. Every other
    orange shape (RAK, the squid) and the blue N are protected from erasing.
    Returns the erase mask, the bounding box of the old word, and its ink colour.
    """
    r, g, b = [rgb[..., i].astype(np.int16) for i in range(3)]
    orange = ((r - b) > 35).astype(np.uint8)
    count, labels, stats, centres = cv2.connectedComponentsWithStats(orange, connectivity=8)
    x0, y0, x1, y1 = box
    chosen = np.zeros(orange.shape, np.uint8)
    others = np.zeros(orange.shape, np.uint8)
    for index in range(1, count):
        cx, cy = centres[index]
        if stats[index, cv2.CC_STAT_AREA] < 6:
            continue
        inside = x0 <= cx <= x1 and y0 <= cy <= y1 and stats[index, cv2.CC_STAT_AREA] < 40000
        (chosen if inside else others)[labels == index] = 1

    # The N is thick; the blue outline on the old letters is thin and must go with them.
    blue = ((b - r) > 25).astype(np.uint8)
    depth = cv2.distanceTransform(blue, cv2.DIST_L2, 3)
    count, labels = cv2.connectedComponents(blue, connectivity=8)
    thick = np.zeros(blue.shape, np.uint8)
    for index in range(1, count):
        piece = labels == index
        if depth[piece].max() > n_depth:
            thick[piece] = 1
    protect = cv2.dilate(others | thick, np.ones((3, 3), np.uint8))

    mask = cv2.dilate(chosen, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
    if light_ground and stain:
        # Soft shading and outlines near the letters are not orange enough to detect above.
        near = cv2.dilate(chosen, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) > 0
        spread = np.max(rgb, axis=2).astype(np.int16) - np.min(rgb, axis=2).astype(np.int16)
        stain = near & ((np.min(rgb, axis=2) < 205) | (spread > 22))
        stain = cv2.dilate(stain.astype(np.uint8), np.ones((5, 5), np.uint8))
        stain[cv2.dilate(protect, np.ones((3, 3), np.uint8)) > 0] = 0
        mask |= stain
    elif stain:
        near = cv2.dilate(chosen, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))) > 0
        trace = near & (((b - r) > 9) | (np.max(rgb, axis=2) > 74))
        trace = cv2.dilate(trace.astype(np.uint8), np.ones((3, 3), np.uint8))
        trace[cv2.dilate(protect, np.ones((5, 5), np.uint8)) > 0] = 0
        mask |= trace
    mask[protect > 0] = 0
    ys, xs = np.nonzero(chosen)
    core = cv2.erode(chosen, np.ones((3, 3), np.uint8)) > 0
    ink = np.median(rgb[core if core.any() else chosen > 0], axis=0)
    return mask * 255, (xs.min(), ys.min(), xs.max(), ys.max()), tuple(float(v) for v in ink)


def fill_flat(rgb, mask, radius=4):
    return cv2.inpaint(np.ascontiguousarray(rgb), mask, radius, cv2.INPAINT_TELEA)


def fill_ground(rgb, mask, sigma=18):
    """Fills from clean paper only, so old outlines cannot tint the repair."""
    spread = np.max(rgb, axis=2).astype(np.int16) - np.min(rgb, axis=2).astype(np.int16)
    clean = ((mask == 0) & (np.min(rgb, axis=2) > 205) & (spread < 24)).astype(np.float32)
    weight = cv2.GaussianBlur(clean, (0, 0), sigma) + 1e-4
    ground = cv2.GaussianBlur(rgb.astype(np.float32) * clean[..., None], (0, 0), sigma) / weight[..., None]
    soft = cv2.GaussianBlur(mask, (0, 0), 1.0).astype(np.float32)[..., None] / 255
    soft = np.maximum(soft, (mask > 0)[..., None].astype(np.float32))
    return np.clip(rgb * (1 - soft) + ground * soft, 0, 255).astype(np.uint8)


def fill_fabric(rgb, mask, shift):
    """Fills with local brightness from the surroundings and fine weave from nearby cloth."""
    clean = ((mask == 0) & (np.max(rgb, axis=2) < 120) & (np.abs(rgb[..., 2].astype(np.int16) - rgb[..., 0]) < 14)).astype(np.float32)
    weight = cv2.GaussianBlur(clean, (0, 0), 16) + 1e-4
    smooth = cv2.GaussianBlur(rgb.astype(np.float32) * clean[..., None], (0, 0), 16) / weight[..., None]
    donor = np.roll(np.roll(rgb, shift[1], axis=0), shift[0], axis=1).astype(np.float32)
    weave = donor - cv2.GaussianBlur(donor, (0, 0), 6)
    filled = smooth + weave
    soft = cv2.GaussianBlur(mask, (0, 0), 1.2).astype(np.float32)[..., None] / 255
    return np.clip(rgb * (1 - soft) + filled * soft, 0, 255).astype(np.uint8)


def place_word(rgb, centre, width, angle, tint, stretch=1.0, edge=None, blur=0.0, weight=0):
    """Composites the SIP layer, matched to the local ink colour, sharpness and edge."""
    word = SIP.copy()
    height = round(word.height * width / word.width * stretch)
    scale = 3  # work larger so the final downsample stays smooth
    word = word.resize((width * scale, height * scale), Image.LANCZOS)
    arr = np.asarray(word).astype(np.float32)
    if weight:
        size = abs(weight) * scale * 2 + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))
        grown = cv2.dilate(arr[..., 3], kernel) if weight > 0 else cv2.erode(arr[..., 3], kernel)
        # Heavier lettering is flat ink, as on the menu board.
        arr[..., :3] = np.median(arr[..., :3][arr[..., 3] > 128], axis=0)
        arr[..., 3] = cv2.GaussianBlur(grown, (0, 0), scale * 0.6)
    ink = arr[..., :3][arr[..., 3] > 200]
    arr[..., :3] = np.clip(arr[..., :3] * (np.array(tint, np.float32) / np.median(ink, axis=0)), 0, 255)
    word = Image.fromarray(arr.astype(np.uint8), "RGBA").rotate(angle, resample=Image.BICUBIC, expand=True)
    word = word.resize((word.width // scale, word.height // scale), Image.LANCZOS)
    if blur:
        word = word.filter(ImageFilter.GaussianBlur(blur))

    canvas = Image.fromarray(rgb, "RGB").convert("RGBA")
    x, y = round(centre[0] - word.width / 2), round(centre[1] - word.height / 2)
    if edge:
        colour, dx, dy = edge
        shadow = Image.new("RGBA", word.size, colour + (0,))
        shadow.putalpha(word.getchannel("A"))
        canvas.alpha_composite(shadow, (x + dx, y + dy))
    canvas.alpha_composite(word, (x, y))
    return np.asarray(canvas.convert("RGB"))


def load(name):
    img = Image.open(os.path.join(SRC, f"{name}.png"))
    alpha = img.getchannel("A") if img.mode == "RGBA" else None
    return np.array(img.convert("RGB")), alpha


def store(name, rgb, alpha):
    img = Image.fromarray(rgb, "RGB")
    if alpha is not None:
        img.putalpha(alpha)
    img.save(os.path.join(OUT, f"{name}.png"), optimize=True)
    print("wrote", name)


def correct(rgb, box, grow=7, fabric=None, fit=1.0, nudge=(0, 0), angle=2, edge=None, blur=0.6, weight=0, stretch=1.0, n_depth=5.0, sigma=18, stain=True, extra=()):
    """Replaces one old wordmark: erase by shape, then place SIP over the same footprint."""
    mask, (x0, y0, x1, y1), ink = find_old_word(rgb, box, grow, light_ground=fabric is None, n_depth=n_depth, stain=stain)
    print(f"   old word {x0},{y0} to {x1},{y1}, ink {tuple(round(v) for v in ink)}")
    for ex, ey, rx, ry in extra:
        cv2.ellipse(mask, (ex, ey), (rx, ry), 0, 0, 360, 255, -1)
    rgb = fill_fabric(rgb, mask, fabric) if fabric else fill_ground(rgb, mask, sigma)
    centre = ((x0 + x1) / 2 + nudge[0], (y0 + y1) / 2 + nudge[1])
    return place_word(rgb, centre, round((x1 - x0) * fit), angle, ink, stretch=stretch, edge=edge, blur=blur, weight=weight)


# ---- wordmarks -------------------------------------------------------------
BLUE_EDGE = (28, 70, 150)
JOBS = {
    "stall": [
        dict(box=(722, 225, 960, 350), edge=(BLUE_EDGE, -1, 1), blur=0.7, fit=0.98, nudge=(0, -2)),
        dict(box=(728, 1150, 960, 1290), edge=(BLUE_EDGE, -1, 1), blur=0.8, fit=0.98, nudge=(0, -2)),
    ],
    "cup-carrier": [dict(box=(672, 950, 905, 1105), edge=(BLUE_EDGE, -1, 1), blur=0.6, fit=0.95, angle=3, nudge=(8, 5))],
    "menu-board": [dict(box=(495, 205, 625, 295), grow=5, blur=0.3, weight=1, fit=1.1, angle=5, nudge=(0, -3))],
    "cap": [dict(box=(720, 640, 1040, 830), grow=9, fabric=(0, -190), edge=((36, 60, 170), -1, 1), blur=0.45, fit=0.95, nudge=(9, 6), extra=[(793, 716, 13, 15), (772, 753, 26, 9)])],
    "apron": [dict(box=(700, 470, 845, 610), grow=7, fabric=(0, -150), blur=0.45, fit=1.08)],
}
for name, jobs in JOBS.items():
    print(name)
    art, art_alpha = load(name)
    for job in jobs:
        art = correct(art, **job)
    store(name, art, art_alpha)


# ---- poster: text in Poppins, calibrated against the poster's own lettering -----
def draw_text(box, text, face, size, xy, anchor):
    """Renders text 8x larger then scales down, so its softness matches the artwork."""
    k = 8
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    layer = Image.new("L", (w * k, h * k), 0)
    ImageDraw.Draw(layer).text(((xy[0] - x0) * k, (xy[1] - y0) * k), text, fill=255, font=font(face, size * k), anchor=anchor)
    return np.asarray(layer.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255


def calibrate(rgb, roi, old_text, faces, anchor, is_ink):
    """Finds the Poppins weight, size and position that reproduce the existing text."""
    x0, y0, x1, y1 = roi
    ink = is_ink(rgb[y0:y1, x0:x1].astype(np.int16))
    ys, xs = np.nonzero(ink)
    bx0, bx1, by1 = xs.min() + x0, xs.max() + x0 + 1, ys.max() + y0 + 1
    target = ink.astype(np.float32)
    best = None
    for face in faces:
        for size in np.arange(8, 26, 0.1):
            width = font(face, size * 8).getlength(old_text) / 8
            if abs(width - (bx1 - bx0)) > 2.2:
                continue
            for dy in np.arange(-5, 3.1, 0.5):
                for dx in np.arange(-2, 2.1, 0.5):
                    start = (bx1 + dx if anchor[0] == "r" else bx0 + dx, by1 + dy)
                    error = float(np.abs(draw_text(roi, old_text, face, size, start, anchor) - target).mean())
                    if best is None or error < best[0]:
                        best = (error, face, float(size), start)
    print(f"   calibrated '{old_text}': {best[1]} {best[2]:.1f}px, error {best[0]:.3f}")
    return best


def replace_text(rgb, roi, old_text, new_text, faces, anchor, is_ink, erase_ink=None, flat_ground=False):
    _, face, size, start = calibrate(rgb, roi, old_text, faces, anchor, is_ink)
    x0, y0, x1, y1 = roi
    ink = is_ink(rgb[y0:y1, x0:x1].astype(np.int16))
    erase = (erase_ink or is_ink)(rgb[y0:y1, x0:x1].astype(np.int16))
    colour = np.percentile(rgb[y0:y1, x0:x1][ink].reshape(-1, 3), 28, axis=0)
    mask = np.zeros(rgb.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = erase.astype(np.uint8) * 255
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
    mask[:y0] = 0  # never touch the line above
    if flat_ground:
        ground = np.median(rgb[y1 + 3 : y1 + 7, x0:x1].reshape(-1, 3), axis=0)
        rgb = rgb.astype(np.float32)
        rgb[mask > 0] = ground
    else:
        rgb = fill_flat(rgb, mask, 3).astype(np.float32)
    wide = (max(0, x0 - 40), y0 - 4, min(rgb.shape[1], x1 + 40), y1 + 4)
    cover = draw_text(wide, new_text, face, size, start, anchor)[..., None]
    a, b, c, d = wide
    rgb[b:d, a:c] = rgb[b:d, a:c] * (1 - cover) + colour * cover
    return np.clip(rgb, 0, 255).astype(np.uint8)


NEW_LINE = "juicy at the bottom, non-stop."
OLD_LINE = "Juicy on the bottom, non-stop"
navy_on_orange = lambda a: (a[..., 0] < 150) & (a[..., 2] > 40)
dark_on_cream = lambda a: a.max(axis=2) < 150
any_on_cream = lambda a: a.max(axis=2) < 232  # catches the faint edges of old letters too

print("promotional-poster")
poster, _ = load("promotional-poster")
poster = replace_text(poster, (195, 54, 430, 71), OLD_LINE, NEW_LINE, ["400-italic"], "rs", navy_on_orange)
poster = replace_text(poster, (220, 1022, 320, 1038), "SATURDAY", "SUNDAY", ["400-normal"], "ls", dark_on_cream, any_on_cream, flat_ground=True)
poster = correct(poster, (487, 64, 530, 98), grow=3, blur=0.3, fit=1.16, nudge=(0, -1), angle=3, n_depth=1.2, sigma=5, stain=False,
                 extra=[(486, 86, 6, 5), (491, 79, 6, 6), (496, 72, 6, 6), (501, 66, 5, 4)])
store("promotional-poster", poster, None)

# The stand's poster is its own rendering, so it gets the same treatment directly.
print("poster-stand")
stand, stand_alpha = load("poster-stand")
stand = replace_text(stand, (505, 144, 735, 165), OLD_LINE, NEW_LINE, ["400-italic", "500-italic"], "rs", navy_on_orange)
stand = replace_text(stand, (500, 965, 600, 982), "SATURDAY", "SUNDAY", ["400-normal"], "ls", dark_on_cream, any_on_cream, flat_ground=True)
stand = correct(stand, (780, 150, 845, 200), grow=3, blur=0.35, fit=0.96, nudge=(1, -1), angle=3, n_depth=1.5, sigma=6)
store("poster-stand", stand, stand_alpha)
