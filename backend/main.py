"""Scam Shield API. Privacy-first: request bodies are analysed in memory and never stored or logged."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from starlette.concurrency import run_in_threadpool

from analyzer import analyze_link, analyze_text
from ocr import MAX_BYTES, OCRError, extract_text

load_dotenv()
MAX_LEN = int(os.getenv("MAX_TEXT_LENGTH", "5000"))
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

app = FastAPI(title="Scam Shield API", version="1.0.0",
              description="Educational scam-risk checker for retail investors. Not legal or investment advice.")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["*"])


class TextIn(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = "en"


class UrlIn(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048)
    language: str = "en"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(body: TextIn):
    if len(body.text) > MAX_LEN:
        raise HTTPException(413, f"Message too long (max {MAX_LEN} characters).")
    return analyze_text(body.text, body.language)


@app.post("/api/analyze-url")
def analyze_url_endpoint(body: UrlIn):
    result = analyze_link(body.url, body.language)
    if not result["urls"][0]["valid"]:
        raise HTTPException(422, "That does not look like a valid link.")
    return result


@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...), language: str = Form("en")):
    """Screenshot -> OCR -> analyze_text. The image is read into memory and discarded; nothing is saved."""
    data = await file.read(MAX_BYTES + 1)
    try:
        text = await run_in_threadpool(extract_text, data)
    except OCRError as e:
        raise HTTPException(e.status, detail={"code": e.code, "message": e.message})
    finally:
        del data
    result = analyze_text(text, language)
    result["ocr_text"] = text
    return result
