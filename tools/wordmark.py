"""Lifts the hand-lettered SIP from the loyalty card as a clean transparent layer.

The loyalty card is the only artwork where the lettering clearly reads SIP, so it
is the source for every wordmark correction. Nothing is redrawn or typeset.
"""
import cv2
import numpy as np
from PIL import Image

# Card lettering, in native pixels of artwork/originals/loyalty-card.png
SOURCE_BOX = (540, 482, 818, 682)
CARD_TILT = -8.5  # the card is photographed at this angle


def extract_sip(path, tilt=CARD_TILT):
    """Returns the SIP lettering as a level RGBA image with a tight crop."""
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    x0, y0, x1, y1 = SOURCE_BOX
    crop = img[y0:y1, x0:x1]
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]

    # Orange ink absorbs blue. Paper does not. That gives a soft coverage value.
    paper = np.percentile(b, 92)
    ink = np.percentile(b[(r - b) > 120], 40)
    alpha = np.clip((paper - b) / (paper - ink), 0, 1)
    alpha[(b - r) > 8] = 0  # the blue N and its drips are not part of the word

    # Keep only the connected pieces of the word, dropping stray paper grain.
    solid = (alpha > 0.35).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    keep = np.zeros_like(solid)
    for index in range(1, count):
        touches_top = stats[index, cv2.CC_STAT_TOP] == 0  # slivers of the R and swash above
        if stats[index, cv2.CC_STAT_AREA] > 90 and not touches_top:
            keep[labels == index] = 1
    keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
    alpha *= keep

    # Un-mix the paper from the edge pixels so no white fringe travels with the letters.
    safe = np.maximum(alpha, 0.2)[..., None]
    colour = np.clip((crop - (1 - safe) * paper) / safe, 0, 255)
    rgba = np.dstack([colour, alpha * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA").rotate(tilt, resample=Image.BICUBIC, expand=True)
    return out.crop(out.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox())
