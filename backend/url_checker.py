"""URL / domain risk analysis. Pure string analysis: no network calls, no URL is ever fetched."""
import ipaddress
import re
from urllib.parse import urlparse

from patterns import OFFICIAL_DOMAINS, SUSPICIOUS_TLDS, URL_SHORTENERS

URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>\"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|co\.in|net|org|xyz|tk|ml|ga|cf|gq|top|click|buzz|live|vip|icu|app|link)(?:/[^\s<>\"']*)?", re.I)
SECOND_LEVEL = {"co", "org", "gov", "ac", "net", "nic", "res"}
HOMOGLYPHS = str.maketrans({"0": "o", "1": "l", "3": "e", "5": "s", "@": "a"})


def extract_urls(text: str) -> list[str]:
    urls = [u.rstrip(".,;:!?)]}") for u in URL_RE.findall(text or "")]
    return list(dict.fromkeys(urls))[:5]


def _registered_domain(host: str) -> str:
    parts = host.split(".")
    if len(parts) >= 3 and parts[-2] in SECOND_LEVEL and len(parts[-1]) == 2:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def analyze_url(url: str) -> dict:
    raw = (url or "").strip()
    flags, score = [], 0

    def add(ftype, matched, weight, expl):
        nonlocal score
        score += weight
        flags.append({"type": ftype, "matched": matched, "weight": weight, "explanation": expl})

    parsed = urlparse(raw if "://" in raw else "http://" + raw)
    host = (parsed.hostname or "").lower()
    if not host or "." not in host:
        return {"url": raw, "domain": host, "risk_score": 0, "risk_level": "SAFE",
                "flags": [], "valid": False}

    # IP-based
    try:
        ipaddress.ip_address(host)
        add("url_ip", host, 35, "Link uses a raw IP address instead of a real website name.")
        is_ip = True
    except ValueError:
        is_ip = False

    reg = _registered_domain(host)
    tld = host.rsplit(".", 1)[-1]

    if not is_ip:
        if reg in URL_SHORTENERS or host in URL_SHORTENERS:
            add("url_shortener", host, 25, "Shortened link hides the real destination.")
        if tld in SUSPICIOUS_TLDS:
            add("url_tld", "." + tld, 25, f"'.{tld}' is a cheap domain ending often used in scams.")
        # Brand impersonation / typosquatting
        norm = host.translate(HOMOGLYPHS)
        for brand, official in OFFICIAL_DOMAINS.items():
            is_official = any(reg == d or host.endswith("." + d) or host == d for d in official)
            if is_official:
                continue
            if brand in norm.replace("-", "").replace(".", ""):
                add("url_fake_brand", host, 40,
                    f"Looks like it imitates '{brand}' but is not its official website ({official[0]}).")
                break
        if host.count(".") >= 4:
            add("url_subdomains", host, 15, "Too many sub-domains: a trick to make a fake site look real.")
        if host.count("-") >= 2:
            add("url_hyphens", host, 10, "Many hyphens in the domain name are common in fake sites.")
        if host.startswith("xn--") or ".xn--" in host:
            add("url_punycode", host, 30, "Domain uses look-alike international characters.")

    if "@" in (parsed.netloc or ""):
        add("url_at_sign", "@", 30, "The '@' trick sends you to a different site than the one shown.")
    if parsed.scheme == "http":
        add("url_no_https", "http://", 10, "Not a secure (HTTPS) connection.")
    if len(raw) > 100:
        add("url_long", f"{len(raw)} chars", 8, "Very long links can hide the real destination.")
    if re.search(r"\.(apk)(\?|$)", parsed.path, re.I):
        add("url_apk", parsed.path.split("/")[-1], 30, "Direct app file download. Install apps only from official stores.")

    score = min(score, 100)
    level = "SAFE" if score <= 25 else "SUSPICIOUS" if score <= 60 else "HIGH"
    return {"url": raw, "domain": host, "risk_score": score, "risk_level": level,
            "flags": flags, "valid": True}
