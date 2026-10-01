"""Screenshot -> text with Tesseract. Everything happens in memory: bytes in, text out, nothing written to disk by us."""
import io
import os
import re

import pytesseract
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError

if os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

MAX_BYTES = int(os.getenv("MAX_IMAGE_MB", "5")) * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 40_000_000  # decompression-bomb guard
ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP"}
OCR_TIMEOUT = int(os.getenv("OCR_TIMEOUT", "25"))


class OCRError(Exception):
    def __init__(self, code: str, status: int, message: str):
        super().__init__(message)
        self.code, self.status, self.message = code, status, message


def _languages() -> str:
    wanted = os.getenv("OCR_LANGS", "eng+hin+tel").split("+")
    try:
        have = set(pytesseract.get_languages(config=""))
    except pytesseract.TesseractNotFoundError:
        raise OCRError("ocr_unavailable", 503, "Tesseract is not installed on the server.")
    use = [l for l in wanted if l in have] or (["eng"] if "eng" in have else [])
    if not use:
        raise OCRError("ocr_unavailable", 503, "No OCR language data installed.")
    return "+".join(use)


def _prepare(data: bytes) -> Image.Image:
    if len(data) > MAX_BYTES:
        raise OCRError("img_too_large", 413, f"Image is larger than {MAX_BYTES // 1024 // 1024} MB.")
    try:
        probe = Image.open(io.BytesIO(data))
        fmt = probe.format
        probe.verify()
        if fmt not in ALLOWED_FORMATS:
            raise OCRError("img_format", 415, "Only PNG, JPG or WebP images are supported.")
        img = Image.open(io.BytesIO(data))
        img.load()
    except OCRError:
        raise
    except Image.DecompressionBombError:
        raise OCRError("img_too_large", 413, "Image dimensions are too large.")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise OCRError("img_format", 415, "That file is not a readable image.")

    img = ImageOps.exif_transpose(img).convert("L")
    if ImageStat.Stat(img).mean[0] < 110:      # dark-mode chat screenshots: Tesseract wants dark text on light
        img = ImageOps.invert(img)
    img = ImageOps.autocontrast(img)
    if img.width < 1000:                        # small screenshots OCR much better when upscaled
        f = 2 if img.width >= 500 else 3
        img = img.resize((img.width * f, img.height * f), Image.LANCZOS)
    return img


def extract_text(data: bytes) -> str:
    img = _prepare(data)
    langs = _languages()
    try:
        text = pytesseract.image_to_string(img, lang=langs, config="--psm 6", timeout=OCR_TIMEOUT)
    except pytesseract.TesseractNotFoundError:
        raise OCRError("ocr_unavailable", 503, "Tesseract is not installed on the server.")
    except RuntimeError:
        raise OCRError("ocr_unavailable", 503, "Reading the image took too long.")
    except pytesseract.TesseractError:
        raise OCRError("ocr_unavailable", 503, "The OCR engine failed on this image.")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(re.sub(r"\W", "", text)) < 3:
        raise OCRError("no_text", 422, "No readable text was found in the image.")
    return text[:5000]
