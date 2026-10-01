// API base URL. Override at deploy time by setting window.SCAM_SHIELD_API before this script loads.
window.SCAM_SHIELD_CONFIG = {
  API_BASE: window.SCAM_SHIELD_API ||
    (["localhost", "127.0.0.1", ""].includes(location.hostname)
      ? "http://localhost:8000"
      : "https://scam-shield-api.onrender.com") // TODO: replace with your deployed backend URL
};
