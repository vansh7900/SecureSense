"""
ml_detector.py — Regex-based threat detector.

Replaces the broken sklearn 1.6.1 pickle model (incompatible with sklearn 1.8.0).
Uses two-stage detection:
  1. Trust log_parser's log_type tags directly
  2. Fallback regex scan on raw log string
"""

import re
from typing import Optional

# ---------------------------------------------------------------------------
# Stage 1: Direct mapping from log_parser log_type → threat label
# Covers every log_type that parse_log_line() can produce
# ---------------------------------------------------------------------------
LOG_TYPE_MAP = {
    "ssh_fail":    "Brute Force",           # Failed password for user from IP
    "syn_flood":   "DDoS",                  # SYN flood detected from IP
    "port_scan":   "Port Scanning",         # port scan from IP
    "sql_inject":  "SQL Injection",         # SELECT/DROP/etc FROM/INTO/TABLE
    "ip_blocked":  "Unauthorized Access",   # BLOCKED from IP
    "wget_curl":   "Data Exfiltration",     # wget/curl to external URL
    "sudo":        "Privilege Escalation",  # sudo command execution
    # ssh_success and generic are benign — not mapped
}

# ---------------------------------------------------------------------------
# Stage 2: Regex patterns for anything log_parser doesn't tag
# ---------------------------------------------------------------------------
THREAT_PATTERNS = {
    "SQL Injection": [
        r"(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*?(-{2}|;|'|\||&&)",
        r"\bOR\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+",
        r"('|\").*?(\bOR\b|\bAND\b).*?('|\")",
        r"\bxp_cmdshell\b|\bINFORMATION_SCHEMA\b",
        r"WAITFOR\s+DELAY|BENCHMARK\s*\(",
    ],
    "Brute Force": [
        r"failed\s+(password|login|authentication)\s+for",
        r"(invalid|incorrect)\s+(password|username|credential)",
        r"authentication\s+failure",
        r"too\s+many\s+(failed|incorrect)\s+(attempts|logins)",
        r"account\s+locked",
    ],
    "DDoS": [
        r"(SYN|FIN|RST|ACK)\s*flood",
        r"syn\s+flood\s+detected",
        r"(bandwidth|traffic|packet)\s+(exceed|overflow|drop)",
        r"rate\s+limit\s+exceeded",
        r"too\s+many\s+requests",
    ],
    "Port Scanning": [
        r"(port|nmap|scan(ning)?)\s+(open|closed|filtered|detected)",
        r"(SYN|TCP|UDP)\s+scan",
        r"reconnaissance|enumeration.*?(port|service)",
        r"half.open\s+scan",
        r"probe\s+from",
    ],
    "Privilege Escalation": [
        r"(sudo|su\b|root)\s+(access|denied|granted|attempt)",
        r"(permission|privilege)\s+(denied|escalat)",
        r"setuid|chmod\s+(777|4755)|chown\s+root",
        r"running\s+as\s+root",
    ],
    "Malware": [
        r"(execute|payload|shellcode|reverse.shell)",
        r"(trojan|ransomware|virus|worm|rootkit|spyware)",
        r"(cmd|powershell)\s+(invoke|script|obfuscat|encode|bypass)",
        r"base64.*?(decode|encode).*?(exec|eval)",
        r"mshta|regsvr32|certutil.*?-decode",
    ],
    "XSS Attack": [
        r"<script[\s>]|</script>",
        r"javascript\s*:",
        r"(onerror|onload|onclick|onmouseover)\s*=",
        r"(%3c|&lt;)\s*script",
        r"(alert|eval|document\.cookie)\s*\(",
        r"innerHTML\s*=",
    ],
    "Data Exfiltration": [
        r"(large|unusual|suspicious)\s+(transfer|upload|outbound)",
        r"(backup|dump)\s+(database|credential|passwd)",
        r"exfiltrat",
        r"data\s+(leak|theft|loss)",
        r"unauthorized\s+(export|download|copy)",
    ],
    "Unauthorized Access": [
        r"unauthorized\s+(access|request|connection)",
        r"(forbidden|access\s+denied)",
        r"invalid\s+(token|session|api.?key)",
        r"expired\s+session",
        r"\b(403|401)\b.*?(method|access|forbidden)",
    ],
    "CSRF": [
        r"csrf.token\s+(missing|invalid|expired|mismatch)",
        r"xsrf.token\s+(missing|invalid)",
        r"cross.site\s+request\s+forg",
        r"state\s+mismatch",
    ],
}

SQL_KEYWORDS = {"SELECT", "UNION", "DROP", "INSERT", "UPDATE", "DELETE", "EXEC"}


def detect_threat(parsed_log: dict) -> Optional[str]:
    """
    Detect threat type from a parsed log dict.
    Returns a threat label or "Normal Traffic" for clean logs.
    """

    # Stage 1: use log_parser's log_type if it maps to a known threat
    log_type = parsed_log.get("log_type", "")
    if log_type in LOG_TYPE_MAP:
        return LOG_TYPE_MAP[log_type]

    # Stage 2: regex scan on raw log string
    raw = parsed_log.get("raw", "")
    if raw:
        for threat_label, patterns in THREAT_PATTERNS.items():
            for pattern in patterns:
                try:
                    if re.search(pattern, raw, re.IGNORECASE):
                        return threat_label
                except re.error:
                    continue

    # Stage 3: metadata keyword fallback
    keyword = parsed_log.get("metadata", {}).get("keyword", "").upper()
    if keyword in SQL_KEYWORDS:
        return "SQL Injection"

    return "Normal Traffic"