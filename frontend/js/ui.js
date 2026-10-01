const UI = (() => {
  const ICON = {
    urgency: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    financial_lure: '<path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    credential_request: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    fake_authority: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/><path d="M9 12l2 2 4-4"/>',
    investment_scam: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    phishing_link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    pressure_tactics: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 11l-6 0"/>',
    combo: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    url: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  };
  const svg = (p, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = id => document.getElementById(id);
  const LOCALE = { en: "en-IN", hi: "hi-IN", te: "te-IN" };

  /* ---------- examples ---------- */
  function renderExamples(onPick) {
    const box = $("exampleList");
    box.innerHTML = "";
    I18N.get().examples.forEach(ex => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "example";
      b.innerHTML = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 20) + `<span>${esc(ex.t)}<small>${esc(ex.s)}</small></span>`;
      b.addEventListener("click", () => onPick(ex.m));
      box.appendChild(b);
    });
  }

  /* ---------- result ---------- */
  function animateScore(el, ring, target) {
    const C = 2 * Math.PI * 56;
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C;
    requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = C * (1 - target / 100); }));
    if (reduce()) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function flagView(f, t) {
    const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    const key = f.type.startsWith("url_") ? "url" : f.type;
    const [title, why] = own(t.flags, key) ? t.flags[key] : [f.type, null];
    return { icon: own(ICON, key) ? ICON[key] : ICON.combo, title, why: why || f.explanation || "" };
  }

  /* opts: { readonly, getLink(): string, onCopy(link), onOwn() } */
  function showResult(r, opts = {}) {
    const t = I18N.get();
    const box = $("results");
    const flags = r.flags.map(f => {
      const v = flagView(f, t);
      return `<div class="flag"><div class="flag-ico">${svg(v.icon)}</div><div>
        <p class="flag-title">${esc(v.title)}</p>
        ${v.why ? `<p class="flag-why">${esc(v.why)}</p>` : ""}
        <p class="flag-why">${esc(t.matched)} <span class="flag-match">${esc(f.matched)}</span></p></div></div>`;
    }).join("");
    const recs = r.recommendations.map(x => `<li>${svg('<path d="M20 6 9 17l-5-5"/>')}<span>${esc(x)}</span></li>`).join("");
    const banner = opts.readonly
      ? `<div class="shared-banner" role="note">${svg(ICON.info)}<span>${esc(t.shared_banner)}</span><button id="ownBtn" class="btn btn-primary btn-sm" type="button">${esc(t.shared_cta)}</button></div>` : "";
    const share = opts.readonly ? "" : `
      <div class="block share-block">
        <button id="shareBtn" class="btn btn-ghost" type="button" aria-expanded="false" aria-controls="sharePanel">${svg(ICON.share)}${esc(t.share_btn)}</button>
        <div id="sharePanel" class="share-panel" hidden>
          <label for="shareLink" class="field-label">${esc(t.share_label)}</label>
          <div class="share-row"><input id="shareLink" type="text" readonly><button id="copyBtn" class="btn btn-primary btn-sm" type="button">${esc(t.share_copy)}</button></div>
          <p class="privacy">${esc(t.share_note)}</p>
        </div>
      </div>`;
    box.innerHTML = `${banner}
      <div class="verdict" data-level="${esc(r.risk_level)}">
        <div class="gauge" role="img" aria-label="${r.score} ${esc(t.score_of)}">
          <svg viewBox="0 0 132 132" width="132" height="132"><circle class="track" cx="66" cy="66" r="56" fill="none" stroke-width="12"/>
          <circle class="bar" cx="66" cy="66" r="56" fill="none" stroke-width="12" stroke-linecap="round"/></svg>
          <div class="gauge-num"><span id="scoreNum">0</span><small>${esc(t.score_of)}</small></div>
        </div>
        <div><span class="badge">${esc(t.risk[r.risk_level])}</span><p class="verdict-text">${esc(r.explanation)}</p></div>
      </div>
      ${share}
      <div class="block"><h3>${esc(t.flags_title)}</h3>${flags || `<p>${esc(t.no_flags)}</p>`}</div>
      <div class="block"><h3>${esc(t.recs_title)}</h3><ul class="recs">${recs}</ul></div>
      ${r.risk_level !== "SAFE" ? `<div class="block"><a class="btn btn-danger" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">${esc(t.report)}</a><p class="helpline">${esc(t.helpline)}</p></div>` : ""}
      <p class="notice">${esc(r.disclaimer || "")}</p>`;
    box.hidden = false;
    animateScore(box.querySelector("#scoreNum"), box.querySelector(".bar"), r.score);

    const sb = $("shareBtn");
    if (sb) sb.addEventListener("click", () => {
      const link = opts.getLink && opts.getLink();
      if (!link) return;
      $("shareLink").value = link;
      $("sharePanel").hidden = false;
      sb.setAttribute("aria-expanded", "true");
      $("copyBtn").focus();
    });
    const cb = $("copyBtn");
    if (cb) cb.addEventListener("click", () => opts.onCopy && opts.onCopy($("shareLink").value, $("shareLink")));
    const ob = $("ownBtn");
    if (ob) ob.addEventListener("click", () => opts.onOwn && opts.onOwn());

    box.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" });
    box.focus({ preventScroll: true });
  }

  function showError(msg) {
    const box = $("results");
    box.innerHTML = `<div class="error" role="alert">${esc(msg)}</div>`;
    box.hidden = false;
  }
  function hideResult() { $("results").hidden = true; }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ---------- history ---------- */
  function renderHistory(list, onPick) {
    const t = I18N.get(), ul = $("historyList");
    ul.innerHTML = "";
    list.forEach(e => {
      const when = new Date(e.ts).toLocaleString(LOCALE[I18N.lang()] || "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
      const modeLabel = e.mode === "url" ? t.tab_url : t.tab_msg;
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button"; b.className = "hist-item"; b.dataset.level = e.level;
      b.setAttribute("aria-label", `${t.risk[e.level]}, ${e.score}. ${e.preview}. ${t.hist_again}`);
      b.innerHTML = `<span class="hist-dot" aria-hidden="true"></span>
        <span class="hist-main"><span class="hist-text">${esc(e.preview)}</span><small>${esc(modeLabel)} · ${esc(when)}</small></span>
        <span class="hist-score">${e.score}</span>`;
      b.addEventListener("click", () => onPick(e));
      li.appendChild(b); ul.appendChild(li);
    });
    $("historyEmpty").hidden = list.length > 0;
    $("historyClear").hidden = list.length === 0;
  }

  /* ---------- learn ---------- */
  function renderLearn(onTry) {
    const L = LEARN[I18N.lang()] || LEARN.en, t = I18N.get();
    $("learnTitle").textContent = L.heading;
    $("learnIntro").textContent = L.intro;
    const phrases = L.phrases.items.map((p, i) => `<li>
      <blockquote class="scam-quote">${esc(p.q)}</blockquote>
      <p class="flag-why"><strong>${esc(t.learn_why)}:</strong> ${esc(p.why)}</p>
      <button type="button" class="btn btn-ghost btn-sm" data-try="${i}">${esc(t.learn_try)}</button></li>`).join("");
    const domains = L.domains.items.map(d => `<li><code class="domain">${esc(d.q)}</code><p class="flag-why">${esc(d.why)}</p></li>`).join("");
    const steps = L.steps.items.map(s => `<li>${esc(s)}</li>`).join("");
    const links = LEARN.links.map(l => {
      const [name, desc] = L.resources.items[l.key];
      return `<a class="res-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(name)}</strong><span>${esc(desc)}</span><small>${esc(new URL(l.url).host)} · ${esc(t.learn_open)}</small></a>`;
    }).join("");
    $("learnBody").innerHTML = `
      <section class="learn-card" aria-labelledby="lp"><h2 id="lp">${esc(L.phrases.title)}</h2><ul class="learn-list">${phrases}</ul></section>
      <section class="learn-card" aria-labelledby="ld"><h2 id="ld">${esc(L.domains.title)}</h2><ul class="learn-list">${domains}</ul></section>
      <section class="learn-card" aria-labelledby="ls"><h2 id="ls">${esc(L.steps.title)}</h2><ol class="learn-steps">${steps}</ol>
        <a class="btn btn-danger" href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">${esc(t.report)}</a><p class="helpline">${esc(t.helpline)}</p></section>
      <section class="learn-card" aria-labelledby="lr"><h2 id="lr">${esc(L.resources.title)}</h2><div class="res-grid">${links}</div></section>`;
    $("learnBody").querySelectorAll("[data-try]").forEach(b =>
      b.addEventListener("click", () => onTry(L.phrases.items[+b.dataset.try].q)));
  }

  function setView(view) {
    $("viewCheck").hidden = view !== "check";
    $("viewLearn").hidden = view !== "learn";
    document.querySelectorAll(".nav-btn").forEach(b => {
      const on = b.dataset.view === view;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  /* ---------- screenshot preview ---------- */
  let previewUrl = null;
  function showPreview(file) {
    clearPreview(true);
    previewUrl = URL.createObjectURL(file);
    const img = $("imgPreviewImg");
    img.src = previewUrl; img.alt = I18N.get().img_alt;
    $("imgPreview").hidden = false;
    $("dropZone").hidden = true;
  }
  function clearPreview(keepZone) {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    $("imgPreviewImg").removeAttribute("src");
    $("imgPreview").hidden = true;
    if (!keepZone) $("dropZone").hidden = false;
  }
  function showOcr(text) { $("ocrText").value = text; $("ocrBox").hidden = false; }
  function hideOcr() { $("ocrText").value = ""; $("ocrBox").hidden = true; }

  return { renderExamples, showResult, showError, hideResult, toast, renderHistory, renderLearn, setView,
           showPreview, clearPreview, showOcr, hideOcr };
})();
