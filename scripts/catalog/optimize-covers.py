"""Convert an explicit local cover plan to WebP without enlarging source pixels.

Usage: python scripts/catalog/optimize-covers.py input-plan.json output-directory report.json [variants.json]
Requires Pillow with WebP support. Source files are never overwritten.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageChops, ImageDraw, ImageFont
import hashlib, json, re, sys, unicodedata

plan_path, output_path, report_path = map(Path, sys.argv[1:4])
output_path.mkdir(parents=True, exist_ok=True)
report = []
for item in json.loads(plan_path.read_text(encoding="utf-8")):
    generated = not item.get("sourceFile")
    if generated:
        image = Image.new("RGB", (640, 960), "#1e3a5f")
        draw = ImageDraw.Draw(image)
        font_path = Path("C:/Windows/Fonts/georgia.ttf")
        font = lambda size: ImageFont.truetype(str(font_path), size) if font_path.exists() else ImageFont.load_default(size=size)
        draw.rectangle((34, 34, 606, 926), outline="#e67e00", width=3)
        draw.text((65, 90), "BIBLIOCONNECT", fill="#fff7ed", font=font(25))
        draw.text((65, 290), "Livro de", fill="#fff7ed", font=font(58))
        draw.text((65, 365), "integração", fill="#fff7ed", font=font(58))
        draw.line((65, 485, 575, 485), fill="#e67e00", width=4)
        draw.text((65, 700), "EXEMPLAR DE TESTE", fill="#fff7ed", font=font(24))
        draw.text((65, 755), "Sem edição comercial", fill="#cbd5e1", font=font(22))
        source_bytes = 0
    else:
        source = Path(item["sourceFile"])
        source_bytes = source.stat().st_size
        image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    original_size = image.size
    if item.get("cropWhite"):
        mask = ImageChops.difference(image, Image.new("RGB", image.size, "white")).convert("L").point(lambda a: 255 if a > 25 else 0)
        if mask.getbbox(): image = image.crop(mask.getbbox())
    crop_size = image.size
    image.thumbnail((960, 1440), Image.Resampling.LANCZOS)
    slug = re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", item["title"]).encode("ascii", "ignore").decode().lower()).strip("-")
    filename = f"{item['id']}-{slug}.webp"
    target = output_path / filename
    image.save(target, format="WEBP", quality=88, method=6)
    with Image.open(target) as check:
        assert check.format == "WEBP" and check.size == image.size
        check.verify()
    encoded = target.read_bytes()
    variants = []
    for width in (320, 640):
        if image.width <= width: continue
        small = image.resize((width, round(image.height*width/image.width)), Image.Resampling.LANCZOS)
        small_file = f"{item['id']}-{slug}-{width}.webp"
        small.save(output_path / small_file, format="WEBP", quality=88, method=6)
        variants.append({"file":small_file,"width":width,"height":small.height,"bytes":(output_path / small_file).stat().st_size})
    report.append({"id": item["id"], "title": item["title"], "file": filename, "source": item.get("source"), "sourcePage": item.get("page"), "generatedTestCover": generated, "sourcePixels": list(original_size), "cropPixels": list(crop_size), "pixels": list(image.size), "sourceBytes": source_bytes, "webpBytes": len(encoded), "sha256": hashlib.sha256(encoded).hexdigest(),"variants":variants})
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps({"maxPixels": [960,1440], "quality": 88, "covers": report}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
if len(sys.argv)>4:
    manifest = {}
    for item in report:
        stem=f"cover-{item['id']}-{item['sha256'][:12]}"
        manifest[stem+".webp"] = [{"file":stem+f"-{v['width']}.webp","width":v['width']} for v in item['variants']]+[{"file":stem+".webp","width":item['pixels'][0]}]
    Path(sys.argv[4]).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"covers": len(report), "sourceBytes": sum(r["sourceBytes"] for r in report), "webpBytes": sum(r["webpBytes"] for r in report)}))
