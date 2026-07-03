"""Generate the 'Off the Record' icon set: a vinyl record with a slash."""
from PIL import Image, ImageDraw

OUT = "/Applications/MAMP/htdocs/no-history-extension/icons"

INDIGO = (79, 70, 229, 255)        # #4F46E5 background
INDIGO_DARK = (55, 48, 163, 255)   # #3730A3 record label
WHITE = (255, 255, 255, 255)
GROOVE = (203, 205, 245, 255)      # light indigo groove lines

S = 1024  # master canvas


def rounded_bg(draw):
    draw.rounded_rectangle([0, 0, S - 1, S - 1], radius=200, fill=INDIGO)


def circle(draw, cx, cy, r, **kw):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], **kw)


def slash(draw):
    # Diagonal cut, bottom-left to top-right: white outline + indigo core so it
    # reads against both the indigo background and the white disc.
    x1, y1, x2, y2 = 236, 788, 788, 236
    for width, color in [(150, WHITE), (86, INDIGO)]:
        draw.line([x1, y1, x2, y2], fill=color, width=width)
        circle(draw, x1, y1, width // 2, fill=color)
        circle(draw, x2, y2, width // 2, fill=color)


def master(detailed=True):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded_bg(d)
    cx = cy = S // 2
    circle(d, cx, cy, 340, fill=WHITE)                     # disc
    if detailed:
        for r in (300, 258, 216):                          # grooves
            circle(d, cx, cy, r, outline=GROOVE, width=10)
    circle(d, cx, cy, 132, fill=INDIGO_DARK)               # label
    circle(d, cx, cy, 34, fill=WHITE)                      # spindle hole
    slash(d)
    return img


full = master(detailed=True)
simple = master(detailed=False)

for size in (16, 32, 48, 96):
    src = simple if size <= 32 else full
    src.resize((size, size), Image.LANCZOS).save(f"{OUT}/icon{size}.png")
    print(f"icon{size}.png written")

# Chrome Web Store spec: 128x128 canvas, 96x96 artwork, 16px transparent
# padding per side. No edge stroke, no large shadows (store UI adds its own).
store = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
store.paste(full.resize((96, 96), Image.LANCZOS), (16, 16))
store.save(f"{OUT}/icon128.png")
print("icon128.png written (96x96 art + 16px padding)")
