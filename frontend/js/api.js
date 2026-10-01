const API = (() => {
  const base = () => window.SCAM_SHIELD_CONFIG.API_BASE;

  async function send(path, init) {
    let res;
    try {
      res = await fetch(base() + path, init);
    } catch (e) {
      throw new Error("network");
    }
    if (!res.ok) {
      let code = "";
      try { const j = await res.json(); code = j && j.detail && j.detail.code; } catch (_) {}
      if (code) throw new Error(code);                       // no_text, img_too_large, img_format, ocr_unavailable
      throw new Error(res.status === 422 ? "invalid" : res.status === 413 ? "toolong" : "server");
    }
    return res.json();
  }
  const post = (path, body) => send(path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

  return {
    analyzeText: (text, language) => post("/api/analyze", { text, language }),
    analyzeUrl: (url, language) => post("/api/analyze-url", { url, language }),
    analyzeImage: (file, language) => {
      const fd = new FormData();
      fd.append("file", file, file.name || "screenshot.jpg");
      fd.append("language", language);
      return send("/api/analyze-image", { method: "POST", body: fd });
    },
    health: () => fetch(base() + "/api/health").then(r => r.json()).catch(() => null),
  };
})();
