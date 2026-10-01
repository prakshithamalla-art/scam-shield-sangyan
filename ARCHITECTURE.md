# Architecture (summary)

See [docs/TECH_ARCHITECTURE.md](docs/TECH_ARCHITECTURE.md) for the full write-up.

```
Browser (static, Netlify) ──JSON/HTTPS──▶ FastAPI (Render)
                                            main.py → analyzer.py → patterns.py
                                                                  → languages.py
                                                                  → url_checker.py
```

**Scoring:** `score = min(100, Σ flag weights + combo bonuses)`; per-category caps stop one category dominating.
0-25 SAFE · 26-60 SUSPICIOUS · 61-100 HIGH.

**Design rules:** stateless, no stored messages, URLs never fetched, all rules explainable, no investment advice.
