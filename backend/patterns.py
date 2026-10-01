"""Scam pattern database (English). Hindi/Telugu sets live in languages.py.

Each category: weight per match, cap per category (prevents one category
from saturating the score), and a plain-language explanation.
"""
import re

CATEGORIES = {
    "urgency": {
        "weight": 10, "cap": 20,
        "explanation": "Scammers create panic so you act before thinking.",
        "keywords": ["immediately", "urgent", "urgently", "last chance", "expires today",
                     "act now", "limited time", "within 24 hours", "hurry", "final notice",
                     "account will be blocked", "account will be suspended", "before midnight"],
    },
    "financial_lure": {
        "weight": 15, "cap": 30,
        "explanation": "Real investments never promise guaranteed or risk-free profit.",
        "keywords": ["prize", "lottery", "winner", "you have won", "double your money",
                     "guaranteed returns", "guaranteed profit", "risk-free", "risk free",
                     "100% profit", "assured returns", "jackpot", "free gift", "cashback offer"],
    },
    "credential_request": {
        "weight": 20, "cap": 40,
        "explanation": "Banks, SEBI and depositories never ask for OTP, PIN, CVV or passwords.",
        "keywords": ["otp", "kyc", "pin", "password", "cvv", "aadhaar", "aadhar", "pan card",
                     "bank details", "card number", "net banking", "upi pin", "share your",
                     "update your kyc", "verify your account"],
    },
    "fake_authority": {
        "weight": 15, "cap": 30,
        "explanation": "Scammers pretend to be regulators, banks or government to gain trust.",
        "keywords": ["rbi", "sebi", "income tax", "pm scheme", "government scheme", "pm kisan",
                     "customs", "cbi", "police", "arrest warrant", "nsdl", "cdsl",
                     "hdfc", "sbi", "icici", "axis bank", "kotak", "paytm", "bank manager",
                     "official notice", "ministry"],
    },
    "investment_scam": {
        "weight": 20, "cap": 40,
        "explanation": "Tips, 'insider info' and doubling schemes are the most common investment frauds.",
        "keywords": ["crypto doubling", "forex", "trading tips", "stock tips", "insider info",
                     "insider tip", "guaranteed stock", "sure shot", "sureshot", "multibagger",
                     "pump", "vip group", "premium group", "join our telegram", "whatsapp group",
                     "operator", "bulk deal tip", "ipo allotment guaranteed", "daily profit",
                     "bitcoin", "usdt", "binary option"],
    },
    "phishing_link": {
        "weight": 20, "cap": 20,
        "explanation": "Links in scam messages lead to fake sites that steal your details.",
        "keywords": ["bit.ly", "tinyurl", "t.co/", "cutt.ly", "rb.gy", "shorturl", "is.gd",
                     "click here", "click the link", "apk", "download app", "install app"],
    },
    "pressure_tactics": {
        "weight": 15, "cap": 30,
        "explanation": "Secrecy and exclusivity stop you from asking family or experts.",
        "keywords": ["only today", "don't tell anyone", "do not tell anyone", "keep it secret",
                     "secret deal", "exclusive", "only for you", "selected few", "limited seats",
                     "do not inform", "don't inform"],
    },
}

# Regex patterns for structure keywords cannot capture
REGEX_PATTERNS = [
    {"type": "investment_scam", "weight": 25, "label": "unrealistic return promise",
     "regex": re.compile(r"\b\d{2,4}\s?%\s*(?:daily|weekly|monthly|per day|per week|per month|returns?|profit)\b", re.I),
     "explanation": "Promising double-digit % returns per day/week/month is a classic fraud sign."},
    {"type": "financial_lure", "weight": 20, "label": "pay a fee to receive money",
     "regex": re.compile(r"\b(?:processing fee|registration fee|release fee|claim fee|pay (?:rs\.?|₹|inr)\s?\d+)\b", re.I),
     "explanation": "Asking you to pay first to receive a prize or refund is a scam."},
    {"type": "credential_request", "weight": 25, "label": "asks you to send/share a code",
     "regex": re.compile(r"\b(?:send|share|enter|tell|provide)\b[^.\n]{0,25}\b(?:otp|pin|cvv|password)\b", re.I),
     "explanation": "Nobody legitimate needs you to send or read out your OTP/PIN."},
    {"type": "fake_authority", "weight": 15, "label": "account freeze / legal threat",
     "regex": re.compile(r"\b(?:account (?:will be )?(?:blocked|frozen|suspended|closed)|legal action|demat (?:account )?(?:blocked|frozen|suspended))\b", re.I),
     "explanation": "Threats of blocking or legal action are used to scare you."},
]

# Combination bonuses: (set of categories, bonus, explanation)
COMBOS = [
    ({"credential_request", "urgency"}, 10, "Asking for credentials AND rushing you is the most common phishing combo."),
    ({"fake_authority", "credential_request"}, 10, "Pretending to be an authority while asking for credentials."),
    ({"investment_scam", "pressure_tactics"}, 10, "Investment pitch plus secrecy/pressure is a strong fraud signal."),
]

OFFICIAL_DOMAINS = {
    "hdfc": ["hdfcbank.com"], "sbi": ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"],
    "icici": ["icicibank.com"], "axis": ["axisbank.com"], "kotak": ["kotak.com"],
    "paytm": ["paytm.com"], "sebi": ["sebi.gov.in"], "nsdl": ["nsdl.co.in"],
    "cdsl": ["cdslindia.com"], "rbi": ["rbi.org.in"], "incometax": ["incometax.gov.in"],
    "npci": ["npci.org.in"],
}
URL_SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "cutt.ly", "rb.gy", "shorturl.at",
                  "is.gd", "goo.gl", "ow.ly", "tiny.cc", "buff.ly", "rebrand.ly", "t.ly"}
SUSPICIOUS_TLDS = {"tk", "ml", "ga", "cf", "gq", "xyz", "top", "click", "buzz", "work",
                   "support", "loan", "icu", "monster", "rest", "cyou", "live", "vip"}
