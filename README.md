# 🛡️ Scam Shield

**Check before you click.** A free, privacy-first scam checker for India's first-time retail investors, in English, Hindi and Telugu.
Built for the **Sangyan Hackathon (IIT BHU + SEBI + NSDL), Track A: Digital Fraud & Scam Resilience**.

## Features
**Core**
- Check a **message**, a **link** or a **screenshot** → risk level (Safe / Suspicious / High), score 0-100, red flags, plain-language advice
- Multi-layer engine: keywords (EN/HI/TE) · regex patterns · URL analysis · weighted scoring · negation-aware (a bank saying "never share your OTP" is not flagged)
- Accessible UI: big buttons, icons, high contrast, dark/light, keyboard and screen-reader friendly
- One-tap reporting to [cybercrime.gov.in](https://cybercrime.gov.in) and the 1930 helpline

**New in v2**
| Feature | What it does | Where data goes |
|---|---|---|
| 🎤 **Voice input** | Speak the message in English, Hindi or Telugu; live transcription with a Stop button | Browser speech service (Chrome/Edge). Not our server |
| 🕘 **Recent checks** | Last 5 checks in a collapsible panel; tap to re-run; Clear history | Your browser's localStorage only |
| 🔗 **Shareable results** | "Share result" makes a link with the result inside it; opens read-only, no re-analysis; Copy link + toast | In the URL `#fragment`. No server storage |
| 📚 **Learn** | Scam phrases with examples, fake-domain patterns, how to report, official SEBI / RBI / cybercrime links, all in EN/HI/TE | Static content |
| 📷 **Screenshot (OCR)** | Upload an SMS/WhatsApp screenshot, see the text we read (editable), then check it | Image processed in server memory, never stored |

**Privacy:** no accounts, no analytics, no stored messages, URLs are never fetched.

## Run locally
```bash
# 1. OCR engine (only needed for the Screenshot tab)
#    Ubuntu/Debian: sudo apt install tesseract-ocr tesseract-ocr-hin tesseract-ocr-tel
#    macOS:         brew install tesseract tesseract-lang
#    Windows:       install from https://github.com/UB-Mannheim/tesseract/wiki (tick Hindi + Telugu),
#                   then set TESSERACT_CMD in backend/.env

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
python -m http.server 5500        # open http://localhost:5500
```
Interactive API docs: http://localhost:8000/docs · Voice input needs Chrome/Edge on `localhost` or HTTPS.

## API
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | none | `{"status":"ok"}` |
| POST | `/api/analyze` | JSON `{"text","language":"en\|hi\|te"}` | `risk_level, score, flags[], urls[], explanation, recommendations[], disclaimer` |
| POST | `/api/analyze-url` | JSON `{"url","language"}` | same shape |
| POST | `/api/analyze-image` | multipart `file` (PNG/JPG/WebP, max 5 MB) + `language` | same shape + `ocr_text` |

Image errors: `413 img_too_large`, `415 img_format`, `422 no_text`, `503 ocr_unavailable` (as `{"detail":{"code","message"}}`).

## Deploy
1. **Backend: use Docker** so Tesseract is installed. On Render choose *New Web Service → Docker*, root directory `backend` (uses `backend/Dockerfile`). Set `ALLOWED_ORIGINS` to your Netlify URL. Without Docker the app still works; only the Screenshot tab shows a friendly "not available" message.
2. **Frontend → Netlify:** connect the repo (`netlify.toml` publishes `frontend/`). Put your backend URL in `frontend/js/config.js`.
3. **Smoke test:** tap an example → red result · upload a screenshot → text appears · Share → open the link in a private window.

## Project layout
```
backend/   FastAPI app, detection engine (analyzer, patterns, languages, url_checker), ocr.py, Dockerfile
frontend/  Vanilla HTML/CSS/JS (i18n, voice, history, share, learn, screenshot)
docs/      Problem, solution, tech, impact + SUBMISSION_KIT.md (video script, LinkedIn post, test messages)
```

## Guardrails
No stock tips · no price predictions · no broker/product promotion · uncertainty shown on every result · educational tool, not legal or financial advice.

## Limits (honest)
Rule-based detection can miss new scams and flag genuine messages. OCR can misread blurry or stylised text (that is why the text is editable). Telugu/Hindi voice accuracy varies by device. Shared links contain the result text, so only share what you are comfortable with. Verify the official links on the Learn page before relying on them.
