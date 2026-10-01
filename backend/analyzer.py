"""Core scam detection: keywords (en/hi/te) + regex + URL analysis + weighted score."""
import re
import unicodedata

from languages import KEYWORDS, MESSAGES
from patterns import CATEGORIES, COMBOS, REGEX_PATTERNS
from url_checker import analyze_url, extract_urls

SAFE_MAX, SUS_MAX = 25, 60


def _norm(text: str) -> str:
    return unicodedata.normalize("NFC", text or "").lower()


# Warnings like "Never share your OTP" are protective, not scams: skip credential hits that are negated.
NEG_BEFORE = re.compile(r"(never|do not|don't|dont|not to|no one|nobody|without|avoid)\W+(?:\w+\W+){0,4}$")
NEG_AFTER = re.compile(r"^\W*(?:\w+\W+){0,3}?(?:न बताएं|न बताएँ|साझा न|न दें|चెప్పకండి|చెప్పవద్దు|పంచుకోకండి|never|not)")


def _negated(text: str, start: int, end: int) -> bool:
    return bool(NEG_BEFORE.search(text[max(0, start - 40):start]) or NEG_AFTER.search(text[end:end + 40]))


def _find(keyword: str, text: str, guard_negation: bool = False) -> bool:
    kw = keyword.lower()
    pat = (r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])") if kw.isascii() else re.escape(kw)
    for m in re.finditer(pat, text):  # Latin: word-boundary ("pin" != "spinning"); Indic: substring
        if not (guard_negation and _negated(text, m.start(), m.end())):
            return True
    return False


def _level(score: int) -> str:
    return "SAFE" if score <= SAFE_MAX else "SUSPICIOUS" if score <= SUS_MAX else "HIGH"


def analyze_text(text: str, language: str = "en") -> dict:
    lang = language if language in MESSAGES else "en"
    msgs = MESSAGES[lang]
    t = _norm(text)
    flags, per_cat = [], {}

    # 1. Keyword layer (English always checked; selected language added; all langs checked as scams mix scripts)
    for cat, spec in CATEGORIES.items():
        sets = [spec["keywords"]] + [KEYWORDS[l].get(cat, []) for l in KEYWORDS]
        seen = set()
        for kws in sets:
            for kw in kws:
                if kw in seen or not _find(kw, t, cat == "credential_request"):
                    continue
                seen.add(kw)
                used = per_cat.get(cat, 0)
                if used >= spec["cap"]:
                    continue
                w = min(spec["weight"], spec["cap"] - used)
                per_cat[cat] = used + w
                flags.append({"type": cat, "matched": kw, "weight": w, "explanation": spec["explanation"]})

    # 2. Regex layer
    for p in REGEX_PATTERNS:
        m = p["regex"].search(text or "")
        if m and p["type"] == "credential_request" and _negated(_norm(text), m.start(), m.end()):
            m = None
        if m:
            per_cat.setdefault(p["type"], 0)
            flags.append({"type": p["type"], "matched": m.group(0).strip(), "weight": p["weight"],
                          "explanation": p["explanation"]})

    # 3. URL layer
    url_results = []
    for u in extract_urls(text or ""):
        r = analyze_url(u)
        if not r["valid"]:
            continue
        url_results.append(r)
        for f in r["flags"]:
            flags.append({**f, "weight": min(f["weight"], 30)})

    # 4. Combination bonuses
    cats = {f["type"] for f in flags}
    for combo, bonus, expl in COMBOS:
        if combo <= cats:
            flags.append({"type": "combo", "matched": " + ".join(sorted(combo)), "weight": bonus, "explanation": expl})

    score = min(100, sum(f["weight"] for f in flags))
    level = _level(score)
    key = {"HIGH": "recs_high", "SUSPICIOUS": "recs_sus", "SAFE": "recs_safe"}[level]
    flags.sort(key=lambda f: -f["weight"])
    return {
        "risk_level": level,
        "score": score,
        "flags": flags,
        "urls": url_results,
        "explanation": msgs[level],
        "recommendations": msgs[key],
        "disclaimer": msgs["uncertain"],
        "language": lang,
    }


def analyze_link(url: str, language: str = "en") -> dict:
    lang = language if language in MESSAGES else "en"
    msgs = MESSAGES[lang]
    r = analyze_url(url)
    level = r["risk_level"]
    key = {"HIGH": "recs_high", "SUSPICIOUS": "recs_sus", "SAFE": "recs_safe"}[level]
    return {"risk_level": level, "score": r["risk_score"], "flags": r["flags"], "urls": [r],
            "explanation": msgs[level], "recommendations": msgs[key],
            "disclaimer": msgs["uncertain"], "language": lang}
