(() => {
  const $ = id => document.getElementById(id);
  let mode = "msg", busy = false, lastResult = null, sharedResult = null;
  const baseUrl = () => location.href.split("#")[0];
  const stripHash = () => { if (location.hash.startsWith("#result=")) history.replaceState(null, "", baseUrl()); };

  /* =====================================================================
   * Voice input (Web Speech API)
   * ===================================================================== */
  const Voice = (() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const LOCALES = { en: "en-IN", hi: "hi-IN", te: "te-IN" };
    const MAX = 5000;
    let rec = null, listening = false, base = "";

    const msg = key => {
      const el = $("voiceMsg");
      if (!key) { el.hidden = true; el.textContent = ""; return; }
      el.textContent = I18N.get()[key];
      el.hidden = false;
    };
    const ui = on => {
      listening = on;
      $("voiceBar").hidden = !on;
      $("micBtn").hidden = on;
      if (on) $("stopBtn").focus(); else if (document.activeElement === $("stopBtn") || document.activeElement === document.body) $("micBtn").focus();
    };
    const joiner = s => (s && !/\s$/.test(s) ? " " : "");

    function start() {
      msg(null);
      if (!SR) { msg("mic_err_unsupported"); return; }
      if (listening) return;
      rec = new SR();
      rec.lang = LOCALES[I18N.lang()] || "en-IN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      base = $("msgInput").value;
      let gotText = false;

      rec.onresult = e => {
        let fin = "", interim = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
        }
        const spoken = (fin + interim).trim();
        if (spoken) gotText = true;
        $("msgInput").value = (base + joiner(base) + spoken).slice(0, MAX);
      };
      rec.onerror = e => {
        const map = {
          "not-allowed": "mic_err_denied", "service-not-allowed": "mic_err_denied",
          "no-speech": "mic_err_nospeech", "audio-capture": "mic_err_nomic", "network": "mic_err_network",
        };
        if (e.error === "aborted") return;
        msg(map[e.error] || "mic_err_other");
      };
      rec.onend = () => {
        ui(false);
        rec = null;
        if (!gotText && $("voiceMsg").hidden) msg("mic_err_nospeech");
      };
      try { rec.start(); ui(true); } catch (_) { rec = null; ui(false); msg("mic_err_other"); }
    }
    const stop = () => { if (rec && listening) { try { rec.stop(); } catch (_) {} } };
    const abort = () => { if (rec) { try { rec.abort(); } catch (_) {} } rec = null; ui(false); msg(null); };
    return { start, stop, abort };
  })();

  /* =====================================================================
   * Scan history: localStorage only, never sent anywhere
   * ===================================================================== */
  const Recent = (() => {
    const KEY = "ss_history", MAX = 5, INPUT_CAP = 2000;
    // Re-running a check needs the full text, so we keep it (on this device only).
    // Set to false to store just the 50-character preview; re-run then uses that preview.
    const STORE_FULL_INPUT = true;
    const LEVELS = ["SAFE", "SUSPICIOUS", "HIGH"];
    const valid = e => e && LEVELS.includes(e.level) && ["msg", "url"].includes(e.mode) &&
      typeof e.preview === "string" && typeof e.input === "string" && Number.isFinite(e.score) && Number.isFinite(e.ts);
    const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.filter(valid).slice(0, MAX) : []; } catch (_) { return []; } };
    const save = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {} };

    function add(m, input, r) {
      const text = String(input).trim();
      if (!text) return;
      const entry = {
        ts: Date.now(), level: r.risk_level, score: r.score, mode: m,
        preview: text.slice(0, 50), input: STORE_FULL_INPUT ? text.slice(0, INPUT_CAP) : text.slice(0, 50),
      };
      const list = load().filter(e => !(e.mode === m && e.input === entry.input));
      list.unshift(entry);
      save(list.slice(0, MAX));
      render();
    }
    function clear() { try { localStorage.removeItem(KEY); } catch (_) {} render(); UI.toast(I18N.get().hist_cleared); }
    function pick(e) {
      Voice.abort();
      setMode(e.mode);
      (e.mode === "url" ? $("urlInput") : $("msgInput")).value = e.input;
      check();
    }
    const render = () => UI.renderHistory(load(), pick);
    return { add, clear, render };
  })();

  /* =====================================================================
   * Shareable result links: result lives in the URL fragment, nothing is stored
   * ===================================================================== */
  const Share = (() => {
    const LEVELS = ["SAFE", "SUSPICIOUS", "HIGH"];
    const enc = obj => {
      let bin = "";
      new TextEncoder().encode(JSON.stringify(obj)).forEach(b => { bin += String.fromCharCode(b); });
      return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
    const dec = s => {
      s = s.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))));
    };
    const pack = r => ({
      v: 1, l: r.risk_level, s: r.score,
      f: r.flags.slice(0, 25).map(f => [f.type, f.matched, f.weight, (f.type.startsWith("url_") || f.type === "combo") ? f.explanation : ""]),
      e: r.explanation, r: r.recommendations, d: r.disclaimer, g: r.language,
    });
    // Links are untrusted input: validate and cap everything before rendering.
    const str = (x, n) => (typeof x === "string" ? x.slice(0, n) : "");
    function unpack(o) {
      if (!o || o.v !== 1 || !LEVELS.includes(o.l)) return null;
      return {
        risk_level: o.l,
        score: Math.max(0, Math.min(100, Math.round(Number(o.s) || 0))),
        flags: (Array.isArray(o.f) ? o.f.slice(0, 25) : []).filter(Array.isArray).map(a => ({
          type: /^[a-z_]{1,30}$/.test(a[0]) ? a[0] : "combo",
          matched: str(a[1], 200), weight: Number(a[2]) || 0, explanation: str(a[3], 400),
        })),
        explanation: str(o.e, 500),
        recommendations: (Array.isArray(o.r) ? o.r.slice(0, 8) : []).map(x => str(x, 300)),
        disclaimer: str(o.d, 400), language: str(o.g, 2),
      };
    }
    const link = r => baseUrl() + "#result=" + enc(pack(r));
    function fromHash() {
      const m = location.hash.match(/^#result=([A-Za-z0-9_\-+/=]+)$/);
      if (!m) return undefined;                   // no shared result in URL
      try { return unpack(dec(m[1])) || false; } catch (_) { return false; }   // false = damaged
    }
    async function copy(text, input) {
      const t = I18N.get();
      try { await navigator.clipboard.writeText(text); UI.toast(t.share_copied); return; } catch (_) {}
      try { input.focus(); input.select(); UI.toast(document.execCommand("copy") ? t.share_copied : t.share_failed); }
      catch (_) { UI.toast(t.share_failed); }
    }
    return { link, copy, fromHash };
  })();

  function showLive(r) {
    sharedResult = null;
    UI.showResult(r, { getLink: () => Share.link(r), onCopy: Share.copy });
  }
  function showShared(r) {
    sharedResult = r; lastResult = null;
    UI.showResult(r, { readonly: true, onOwn: () => { stripHash(); sharedResult = null; UI.hideResult(); $("msgInput").focus(); } });
  }
  function applyHash() {
    const r = Share.fromHash();
    if (r === undefined) return;
    setView("check");
    if (r === false) { sharedResult = null; UI.showError(I18N.get().err_shared); } else showShared(r);
  }

  /* =====================================================================
   * Screenshot input (OCR runs on the server, in memory)
   * ===================================================================== */
  const Shot = (() => {
    const TYPES = ["image/png", "image/jpeg", "image/webp"], MAX_IN = 10 * 1024 * 1024, MAX_W = 1600;
    let file = null, done = false;
    const msg = key => {
      const el = $("imgMsg");
      if (!key) { el.hidden = true; el.textContent = ""; return; }
      el.textContent = I18N.get()[key]; el.hidden = false;
    };
    // Re-encode to JPEG at max 1600px: faster upload, mostly under the server's in-memory limit, and strips EXIF/GPS metadata.
    async function shrink(f) {
      const bmp = await createImageBitmap(f);
      const s = Math.min(1, MAX_W / bmp.width);
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(bmp, 0, 0, c.width, c.height);
      if (bmp.close) bmp.close();
      const blob = await new Promise(res => c.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("encode");
      return new File([blob], "screenshot.jpg", { type: "image/jpeg" });
    }
    async function pick(f) {
      msg(null);
      if (!f) return;
      if (!TYPES.includes(f.type)) { msg("err_img_format"); return; }
      if (f.size > MAX_IN) { msg("err_img_too_large"); return; }
      try {
        const small = await shrink(f);
        file = small; done = false;
        UI.hideOcr(); UI.showPreview(f);
        $("imgRemove").focus();
      } catch (_) { msg("err_img_format"); }
    }
    function clear() { file = null; done = false; UI.clearPreview(); UI.hideOcr(); msg(null); $("imgInput").value = ""; }
    function finish(text) { done = true; UI.showOcr(text); }
    function wire() {
      $("imgInput").addEventListener("change", e => pick(e.target.files[0]));
      $("imgRemove").addEventListener("click", () => { clear(); $("imgInput").focus(); });
      const z = $("dropZone");
      ["dragenter", "dragover"].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add("is-over"); }));
      ["dragleave", "drop"].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove("is-over"); }));
      z.addEventListener("drop", e => pick(e.dataTransfer && e.dataTransfer.files[0]));
    }
    return { wire, clear, finish, pick, file: () => file, hasFile: () => !!file, done: () => done };
  })();

  /* =====================================================================
   * Tabs, views, checking
   * ===================================================================== */
  function setMode(m) {
    if (m !== mode) Voice.abort();
    mode = m;
    $("panelMsg").hidden = m !== "msg";
    $("panelUrl").hidden = m !== "url";
    $("panelImg").hidden = m !== "img";
    document.querySelectorAll(".tab").forEach(t => {
      const on = t.dataset.mode === m;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  }

  function setView(v) {
    if (v === "learn") Voice.abort();
    UI.setView(v);
  }

  function pickExample(text) {
    setView("check");
    setMode("msg");
    $("msgInput").value = text;
    $("msgInput").focus();
    $("checker").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  async function check() {
    if (busy) return;
    Voice.stop();
    const t = I18N.get(), lang = I18N.lang();
    let value = "";
    if (mode === "img") {
      if (!Shot.hasFile()) { UI.showError(t.empty_img); return; }
    } else {
      value = (mode === "msg" ? $("msgInput").value : $("urlInput").value).trim();
      if (!value) { UI.showError(mode === "msg" ? t.empty_msg : t.empty_url); return; }
    }
    busy = true;
    stripHash();
    const btn = $("checkBtn");
    btn.disabled = true;
    const reading = mode === "img" && !Shot.done();
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span>${reading ? t.ocr_reading : t.btn_checking}`;
    try {
      let r, histMode = mode, histInput = value;
      if (mode === "msg") r = await API.analyzeText(value, lang);
      else if (mode === "url") r = await API.analyzeUrl(value, lang);
      else {
        if (reading) {
          r = await API.analyzeImage(Shot.file(), lang);
          Shot.finish(r.ocr_text);
          histInput = r.ocr_text;
        } else {
          histInput = $("ocrText").value.trim();
          if (!histInput) throw new Error("no_text");
          r = await API.analyzeText(histInput, lang);
        }
        histMode = "msg";                      // history re-runs the extracted text, not the image
      }
      lastResult = r;
      showLive(r);
      Recent.add(histMode, histInput, r);
    } catch (e) {
      if (!t["err_" + e.message]) console.error("Scam Shield:", e);
      UI.showError(t["err_" + e.message] || t.err_server);
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = I18N.get().btn_check;
    }
  }

  function clearAll() {
    Voice.abort();
    Shot.clear();
    $("msgInput").value = ""; $("urlInput").value = "";
    lastResult = null; sharedResult = null; stripHash(); UI.hideResult();
  }

  function refreshLanguage() {
    Voice.abort();
    I18N.apply();
    UI.renderExamples(pickExample);
    UI.renderLearn(pickExample);
    Recent.render();
    if ($("imgPreviewImg").getAttribute("src")) $("imgPreviewImg").alt = I18N.get().img_alt;
    if (sharedResult) showShared(sharedResult);               // re-label the shared view, no re-check
    else if (lastResult && !$("results").hidden) check();    // re-run so server text matches the language
  }

  /* ---------- wiring ---------- */
  document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
  document.querySelectorAll(".lang-btn").forEach(b => b.addEventListener("click", () => { I18N.set(b.dataset.lang); refreshLanguage(); }));
  document.querySelectorAll(".nav-btn").forEach(b => b.addEventListener("click", () => {
    setView(b.dataset.view);
    window.scrollTo({ top: 0, behavior: "auto" });
  }));
  $("checkBtn").addEventListener("click", check);
  $("clearBtn").addEventListener("click", clearAll);
  $("historyClear").addEventListener("click", Recent.clear);
  $("micBtn").addEventListener("click", Voice.start);
  $("stopBtn").addEventListener("click", Voice.stop);
  $("urlInput").addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  $("msgInput").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) check(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") Voice.stop(); });
  window.addEventListener("hashchange", applyHash);
  Shot.wire();

  // Theme
  let theme = "dark";
  try { theme = localStorage.getItem("ss_theme") || "dark"; } catch (_) {}
  const applyTheme = () => { document.documentElement.dataset.theme = theme; };
  $("themeToggle").addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("ss_theme", theme); } catch (_) {}
    applyTheme();
  });
  applyTheme();

  I18N.apply();
  UI.renderExamples(pickExample);
  UI.renderLearn(pickExample);
  Recent.render();
  if (matchMedia("(min-width:1100px)").matches) $("historyPanel").open = true;
  applyHash();
  API.health(); // wake a sleeping free-tier backend early
})();
