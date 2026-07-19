#!/usr/bin/env python3
"""Generates the app icon set (PWA + apple-touch-icon) from scratch — no
source image needed. Re-run after changing the brand colors in css/style.css.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG = (16, 18, 26, 255)       # --bg
LIME = (198, 242, 78, 255)   # --lime
CORAL = (255, 107, 94, 255)  # --coral

OUT_DIR = Path(__file__).resolve().parent.parent / "icons"
FONT_PATH = "C:\\Windows\\Fonts\\arialbd.ttf"


def rounded_square(size, radius_ratio):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG)
    return img, draw


def draw_mark(draw, size, scale):
    # Bold "S" lettermark in lime, with a small coral accent dot — evokes a
    # completed sentence. `scale` shrinks the mark for maskable safe zones.
    font_size = int(size * 0.62 * scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "S"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx, cy = size / 2, size / 2
    draw.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text, font=font, fill=LIME)

    dot_r = size * 0.045 * scale
    dot_cx = cx + tw * 0.62
    dot_cy = cy + th * 0.42
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=CORAL)


def make_icon(size, radius_ratio, scale, out_name):
    img, draw = rounded_square(size, radius_ratio)
    draw_mark(draw, size, scale)
    img.save(OUT_DIR / out_name)
    print(f"wrote {out_name} ({size}x{size})")


if __name__ == "__main__":
    OUT_DIR.mkdir(exist_ok=True)
    make_icon(192, 0.22, 1.0, "icon-192.png")
    make_icon(512, 0.22, 1.0, "icon-512.png")
    make_icon(512, 0.0, 0.7, "icon-maskable-512.png")   # full-bleed bg, content in safe zone
    make_icon(180, 0.22, 1.0, "apple-touch-icon.png")
    make_icon(32, 0.22, 1.0, "favicon-32.png")
