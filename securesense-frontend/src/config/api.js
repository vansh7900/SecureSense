// API Configuration

// Detect environment
const isDev = import.meta.env.DEV;

// Backend URL
const API_HOST = isDev
  ? "http://localhost:8000"
  : import.meta.env.VITE_API_URL;

// Fallback safety (optional)
if (!API_HOST) {
  console.warn("⚠️ VITE_API_URL not set, using fallback backend URL");
}

// Base API URL
export const API_BASE = `${API_HOST || "https://securesense.onrender.com"}/api`;

// API Keys (if needed in future)
export const API_KEYS = {
  VIRUSTOTAL: "VIRUSTOTAL_API_KEY",
  ABUSEIPDB: "ABUSEIPDB_API_KEY"
};  