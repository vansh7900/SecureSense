// API Configuration
// For development, we use localhost hardcoded
// For production, this should be set via environment variables
const isDev = import.meta.env.DEV;
const API_HOST = isDev ? "http://localhost:8000" : import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_BASE = `${API_HOST}/api`;

export const API_KEYS = {
  VIRUSTOTAL: "VIRUSTOTAL_API_KEY",
  ABUSEIPDB: "ABUSEIPDB_API_KEY"
};