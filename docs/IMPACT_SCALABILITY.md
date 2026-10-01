# Impact & Scalability

## Expected impact
- **Pause moment:** a 10-second check between receiving a scam and acting on it.
- **Literacy by use:** repeated exposure to explained red flags builds lasting pattern recognition.
- **Regional reach:** protection in the language users actually read.
- **Faster reporting:** one tap to cybercrime.gov.in and 1930 when the result is risky.

## How it scales across India
- Stateless API behind a CDN-fronted static site: horizontal scaling is trivial.
- Rule matching is microseconds per message; a single small instance serves many thousands of checks per hour.
- Pattern data is separate from code, so a community or regulator-maintained feed can update it without redeploying.

## Regional-language expansion plan
| Phase | Languages |
|---|---|
| Now | English, Hindi, Telugu |
| Next | Tamil, Marathi, Bengali, Kannada, Gujarati, Malayalam, Odia, Punjabi |
| Method | Add `KEYWORDS[lang]`, `MESSAGES[lang]` and one i18n block; reviewed by native speakers with scam-victim support groups |

## Potential partnerships
- **SEBI / SCORES & Saa₹thi:** embed as an investor-awareness tool; share verified scam typologies.
- **NSDL / CDSL:** show in depositories' investor-education channels.
- **Banks, brokers, exchanges:** link from alert SMS ("not sure about a message? check it here").
- **I4C / cybercrime.gov.in:** optional, consent-based, anonymised pattern sharing to spot new campaigns early.
- **NGOs, CSCs and financial-literacy programmes** in Tier-2/3 towns.

## Roadmap beyond the hackathon
1. **Voice and image input:** speak or screenshot a message (OCR) for low-literacy users.
2. **WhatsApp bot / SMS short-code:** forward a message, get a verdict where users already are.
3. **Browser and Android share-sheet extension:** "Share to Scam Shield".
4. **Advisor/entity verification** against official SEBI registers (user-initiated, official sources only).
5. **ML layer** trained on consented, anonymised data to catch novel scams, with the rule engine kept as the explainable baseline.
6. **Community reporting loop** to refresh patterns weekly.

## Responsible-use limits
Rule-based detection has false positives and false negatives. Scam Shield communicates uncertainty on every result and never gives investment advice.
