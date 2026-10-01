window.SCAM_SHIELD_CONFIG = {
  API_BASE: window.SCAM_SHIELD_API ||
    (["localhost", "127.0.0.1", ""].includes(location.hostname)
      ? "http://localhost:8000"
      : "https://scam-shield-sangyan.onrender.com")
};