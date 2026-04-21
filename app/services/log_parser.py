import re, uuid
from datetime import datetime, timezone
from typing import Optional

# Regex patterns for common log formats
PATTERNS = {
    "ssh_fail":    re.compile(r"Failed password for (\S+) from ([\d.]+) port (\d+)"),
    "ssh_success": re.compile(r"Accepted (?:password|publickey) for (\S+) from ([\d.]+)"),
    "sudo":        re.compile(r"sudo:.*?(\S+)\s*:.*?COMMAND=(.+)"),
    "syn_flood":   re.compile(r"SYN flood detected from ([\d.]+)"),
    "port_scan":   re.compile(r"port scan from ([\d.]+)"),
    "sql_inject":  re.compile(r"(SELECT|DROP|INSERT|UPDATE|DELETE|UNION).*(FROM|INTO|TABLE)", re.IGNORECASE),
    "ip_blocked":  re.compile(r"BLOCKED.*from ([\d.]+)"),
    "wget_curl":   re.compile(r"(wget|curl)\s+(https?://\S+)"),
}

def parse_log_line(raw: str, source: str = "server") -> dict:
    now = datetime.now(timezone.utc).isoformat()
    parsed = {
        "id":        str(uuid.uuid4()),
        "timestamp": now,
        "source":    source,
        "raw":       raw,
        "metadata":  {},
    }

    for name, pattern in PATTERNS.items():
        m = pattern.search(raw)
        if m:
            parsed["log_type"] = name
            parsed["metadata"] = _extract_metadata(name, m)
            return parsed

    parsed["log_type"] = "generic"
    return parsed

def _extract_metadata(log_type: str, match: re.Match) -> dict:
    groups = match.groups()
    mapping = {
        "ssh_fail":    lambda g: {"username": g[0], "source_ip": g[1], "port": g[2]},
        "ssh_success": lambda g: {"username": g[0], "source_ip": g[1]},
        "sudo":        lambda g: {"username": g[0], "command": g[1].strip()},
        "syn_flood":   lambda g: {"source_ip": g[0]},
        "port_scan":   lambda g: {"source_ip": g[0]},
        "sql_inject":  lambda g: {"keyword": g[0]},
        "ip_blocked":  lambda g: {"source_ip": g[0]},
        "wget_curl":   lambda g: {"tool": g[0], "url": g[1]},
    }
    return mapping.get(log_type, lambda g: {})(groups)