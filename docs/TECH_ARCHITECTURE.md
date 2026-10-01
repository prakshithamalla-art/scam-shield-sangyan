# Technology Architecture

## System diagram
```
 ┌────────────────────────┐        HTTPS / JSON         ┌────────────────────────────────┐
 │  Frontend (Netlify)    │  POST /api/analyze          │  Backend (FastAPI)             │
 │  Vanilla HTML/CSS/JS   │ ───────────────────────────▶│  main.py   routing, CORS, size │
 │  i18n EN/HI/TE         │  POST /api/analyze-url      │     │                          │
 │  Inline-SVG UI         │ ◀───────────────────────────│     ▼                          │
 └────────────────────────┘      risk JSON              │  analyzer.py  orchestration    │
                                                        │   ├─ patterns.py  (EN rules)   │
                                                        │   ├─ languages.py (HI/TE)      │
                                                        │   └─ url_checker.py            │
                                                        └────────────────────────────────┘
```

## Data flow
1. Browser sends `{text, language}`. The message exists only in request memory.
2. `analyzer.py` normalises Unicode (NFC) and lower-cases.
3. **Keyword layer:** English + Hindi + Telugu sets across 7 categories (all languages are always checked because scams mix scripts). Latin keywords use word-boundary matching (`pin` ≠ `spinning`); Indic scripts use substring matching.
4. **Regex layer:** return promises ("300% weekly"), advance-fee requests, "share your OTP" structures, account-freeze threats.
5. **URL layer:** every link is extracted and analysed (shorteners, risky TLDs, brand look-alikes incl. digit/letter swaps, IP hosts, `@` tricks, punycode, excess subdomains, APK downloads, HTTP).
6. **Combination bonuses:** e.g. credentials + urgency.
7. **Score** = sum of weights, per-category caps, clamped to 100. 0-25 Safe, 26-60 Suspicious, 61-100 High.
8. Response includes flags, explanation and recommendations in the chosen language.

## Backend
FastAPI + Pydantic. Stateless, no database, no logging of bodies, 5,000-character input cap, configurable CORS. URLs are analysed as strings only: the server never visits them (no SSRF, no tracking).

## Frontend
Dependency-free vanilla JS in five small modules: `config` (API base), `api` (fetch), `i18n` (strings + localStorage), `ui` (rendering with escaped output), `app` (wiring). Accessibility: 56px targets, AA contrast, visible focus, ARIA live results, reduced-motion support, dark/light themes.

## Why this architecture
- **Explainable rules beat black-box AI** for a regulator-facing tool: every flag is auditable.
- **Fast and cheap**: runs on free tiers; no GPU, no API cost.
- **Privacy by design**: stateless means nothing to leak.
- **Extensible**: new scam patterns or languages are data edits, not code changes. An ML or LLM layer can be added behind `analyzer.py` without changing the API contract.

## v2 additions
- **Voice input:** browser Web Speech API (`en-IN`, `hi-IN`, `te-IN`). Audio goes from the browser to the browser vendor's speech service, never to our server.
- **Scan history:** `localStorage` only (last 5, with a Clear button). Never transmitted.
- **Shareable results:** the result is Base64URL-encoded JSON in the URL `#fragment`. Fragments are never sent to any server. Incoming links are validated, length-capped and HTML-escaped before display, and shown read-only without re-analysis.
- **Learn view:** static `learn-data.js` (EN/HI/TE), toggled client-side.
- **Screenshot OCR:** the browser re-encodes the image (max 1600px, JPEG, EXIF stripped) and POSTs it to `/api/analyze-image`. `ocr.py` checks size/format/pixel limits, pre-processes (grayscale, dark-mode inversion, upscaling), runs Tesseract (`eng+hin+tel`) and passes the text to the same `analyze_text()`. Image bytes live in memory only; files above ~1 MB may be spooled by the web framework to an OS temp file that is deleted when the request ends.
