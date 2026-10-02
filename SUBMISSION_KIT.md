# Submission Kit (Unstop)

| Requirement | Where |
|---|---|
| Working prototype (live URL) | Deploy per README, paste Netlify URL |
| Problem statement | `docs/PROBLEM_STATEMENT.md` |
| Solution overview | `docs/SOLUTION_OVERVIEW.md` |
| Technology details | `docs/TECH_ARCHITECTURE.md` + `ARCHITECTURE.md` |
| Demo video (3-5 min) | Script below |
| Impact & scalability | `docs/IMPACT_SCALABILITY.md` |

---
## Demo video script (≈4:45): all features

**Scene 1: The problem (0:00-0:30)** *Phone showing a "KYC expiring" SMS.*
VO: "Every day, first-time investors in towns like Varanasi and Warangal get messages like this. Urgent, official-looking, and dangerous. One tap and savings are gone."

**Scene 2: The idea (0:30-0:50)** *Hero: "Check before you click."*
VO: "Meet Scam Shield. Free, no login, and your messages are never stored."

**Scene 3: Message check (0:50-1:30)** *Tap "KYC update SMS" → Check now. Score animates to 100, red.*
VO: "A fake bank KYC message: 100 out of 100, High risk. Urgency, an OTP request, a fake bank website on a cheap '.xyz' address. Every flag is explained in plain words, with clear next steps."

**Scene 4: Voice input (1:30-2:00)** *Tap the mic, speak in Hindi, words appear, tap Stop, Check.*
VO: "Not everyone types easily. Tap the microphone and just say the message, in English, Hindi or Telugu."

**Scene 5: Screenshot (2:00-2:35)** *Screenshot tab → upload a WhatsApp screenshot → preview → extracted text → result.*
VO: "Got it as a screenshot? Upload it. We read the text, show it to you so you can fix any mistake, and check it. The image is processed in memory and never saved."

**Scene 6: Link check + languages (2:35-3:05)** *Link tab: hdfc-bank.xyz. Switch EN → हिं → తె.*
VO: "Paste just a link and we catch look-alike bank domains. And the whole experience, flags and advice included, works in three languages."

**Scene 7: Share + history (3:05-3:40)** *Tap Share result → Copy link → toast. Open link in a private window: read-only result. Then open Recent checks.*
VO: "Share a result with a family member. The result lives inside the link itself, so nothing is stored on our server. Recent checks stay on your own device, and you can clear them any time."

**Scene 8: Learn (3:40-4:05)** *Learn tab: phrases, fake domains, steps, official links; tap "Check this example".*
VO: "The Learn page teaches the tricks: phrases scammers use, fake domain patterns, what to do if you are targeted, and official SEBI, RBI and cybercrime links. One tap sends any example to the checker."

**Scene 9: Report + honesty (4:05-4:20)** *Tap "Report to cybercrime.gov.in", show disclaimer.*
VO: "If it's a scam, report it in one tap, or call 1930. Scam Shield never gives tips or predictions, and always says it's guidance, not proof."

**Scene 10: Close (4:20-4:45)** *Architecture diagram, then logo.*
VO: "Transparent rules, privacy by design, three languages. Next: more Indian languages, a WhatsApp bot, and partnerships with SEBI, depositories and banks. Scam Shield: check before you click."

---
## LinkedIn post
🛡️ Introducing **Scam Shield**, built for the Sangyan Hackathon by IIT BHU, SEBI and NSDL (Track A: Digital Fraud & Scam Resilience).

Scammers follow India's new investors onto WhatsApp, SMS and Telegram: fake KYC alerts, "guaranteed return" groups, bank impersonation. First-time investors in smaller cities are hit hardest, often with warnings only in English.

Paste a message or link, upload a screenshot, or just speak it, and Scam Shield returns:
✅ a risk level and the exact red flags in plain language
✅ what to do next + one-tap reporting to cybercrime.gov.in
✅ English, Hindi and Telugu
✅ shareable results (the result lives in the link, nothing stored)
✅ a Learn page with real scam patterns and official SEBI/RBI resources
✅ no accounts, no stored messages, no tips, no predictions

Transparent rules instead of a black box, so every flag is explainable.

Try it: [LIVE URL] | Code: [GITHUB URL]
Thank you @SEBI @NSDL @IIT BHU. Feedback welcome!
#Sangyan #IITBHU #SEBI #NSDL #InvestorProtection #CyberSecurity #FinTech #India

---
## Sample scam messages for testing
1. **KYC phishing:** `URGENT: Your SBI account will be blocked today. Update KYC immediately at http://sbi-kyc-update.xyz and share the OTP you receive.` → HIGH
2. **Tip group:** `Join our VIP Telegram group! Sure shot stock tips, guaranteed returns 300% weekly. Only today, don't tell anyone.` → HIGH
3. **Lottery:** `Congratulations! You have won a lottery of Rs 25,00,000. Pay processing fee Rs 4999 to claim. Click here: http://bit.ly/claim-now` → HIGH
4. **Fake authority:** `Income Tax Department official notice: legal action will be taken. Send your PAN card and bank details immediately.` → HIGH
5. **Crypto doubling:** `Double your money with crypto doubling! Daily profit, risk-free. Join our WhatsApp group. Exclusive for few.` → HIGH
6. **Hindi KYC:** `तुरंत ध्यान दें! आपका केवाईसी अभी अपडेट करें और ओटीपी बताएं वरना खाता बंद। http://bit.ly/abc` → HIGH
7. **Telugu lottery:** `మీరు లాటరీ గెలిచారు! వెంటనే ఓటీపీ చెప్పండి. ఈ రోజు మాత్రమే` → HIGH
8. **Mild:** `Limited time offer on our new savings plan. Visit our branch for details.` → SAFE/low
9. **Genuine bank message (tests the "never share OTP" logic):** `Your monthly statement is ready. Log in at https://www.hdfcbank.com. Never share your OTP.` → SAFE
10. **Normal chat:** `Hi, are we meeting for lunch tomorrow at 1pm?` → SAFE

URL tests: `https://hdfc-bank.xyz/login` (HIGH), `http://192.168.4.5/app.apk` (HIGH), `https://www.sebi.gov.in` (SAFE)

## Feature test checklist (before recording)
- **Voice:** Chrome, mic allowed, speak in each language; try blocking the mic to show the error message.
- **Screenshot:** make a screenshot of sample 1 on your phone (light and dark mode); also try a blank image and a GIF to show the errors.
- **Share:** copy the link, open it in a private window; edit one character of the link to show the "damaged link" message.
- **History:** run 6 checks, confirm only 5 remain; tap one; Clear history.
- **Learn:** switch languages; tap "Check this example".
