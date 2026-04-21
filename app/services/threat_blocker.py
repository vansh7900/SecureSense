import re
import time
from datetime import datetime
from typing import Dict, List, Optional

# Global threat tracking
blocked_threats = []
MAX_BLOCKED_THREATS = 100

THREAT_PATTERNS = {
    "SQL Injection": [
        r"(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b|\bUPDATE\b).*(?:--|;|'|\||&&)",
        r"('|\").*(\bOR\b|\bAND\b).*('|\")",
        r"(;|\*).*EXEC.*(\(|\[)"
    ],
    "Brute Force": [
        r"(auth|login|signin).*(?:\d{3,}|failed)",
        r"(invalid|incorrect).*(?:password|username|credential)",
        r"(401|403|failed.*auth).*{5,}"  # Multiple failed attempts
    ],
    "DDoS": [
        r"(SYN|FIN|RST|ACK).*flood",
        r"(HTTP|GET|POST|HEAD).*request.*(?:1000|10000|100000)",
        r"(bandwidth|traffic|packet).*(?:exceed|overflow|drop)"
    ],
    "Privilege Escalation": [
        r"(sudo|su|root|admin).*(?:access|denied|granted)",
        r"(permission|privilege).*(?:denied|error|failed)",
        r"(setuid|chmod|chown).*(?:644|755|777)"
    ],
    "Malware": [
        r"(execute|payload|shellcode|reverse.*shell)",
        r"(trojan|ransomware|virus|worm)",
        r"(cmd|powershell).*(?:invoke|script|obfuscate)"
    ],
    "Port Scanning": [
        r"(port|nmap|scan).*(?:open|closed|filtered)",
        r"(SYN.*scan|TCP.*scan|UDP.*scan)",
        r"(reconnaissance|enumeration).*(?:port|service)"
    ],
    "XSS Attack": [
        r"(<script|javascript:|onerror=|onload=|onclick=)",
        r"(&lt;script|%3cscript)",
        r"(alert|eval|innerHTML).*(?:<|%3c)"
    ],
    "CSRF": [
        r"(csrf|xsrf).*token.*(?:missing|invalid|expired)",
        r"(cross.*site.*request|state.*mismatch)"
    ],
    "Data Exfiltration": [
        r"(export|download|send).*(?:data|database|file)",
        r"(large.*transfer|unusual.*traffic).*(?:outbound|egress)",
        r"(backup|dump).*(?:database|credential)"
    ],
    "Unauthorized Access": [
        r"(unauthorized|forbidden|access.*denied)",
        r"(invalid.*token|expired.*session)",
        r"(405|403|401).*method"
    ]
}

def detect_threat_type(log_data: str, source_ip: str = None) -> Optional[str]:
    """Detect specific threat type from log data."""
    if not log_data:
        return None
    
    log_upper = log_data.upper()
    
    for threat_type, patterns in THREAT_PATTERNS.items():
        for pattern in patterns:
            try:
                if re.search(pattern, log_upper, re.IGNORECASE):
                    return threat_type
            except:
                continue
    
    return None


def block_threat(threat_data: Dict, severity_score: float = 0) -> Dict:
    """
    Block a threat and log it.
    
    Args:
        threat_data: Threat information containing prediction, source_ip, etc.
        severity_score: Threat severity score (0-10)
    
    Returns:
        Dictionary with blocking result
    """
    global blocked_threats
    
    # Detect specific threat type
    log_content = threat_data.get("raw_log", "")
    detected_type = detect_threat_type(log_content, threat_data.get("source_ip"))
    threat_type = detected_type or threat_data.get("prediction", "Unknown Threat")
    
    # Create blocked threat record
    blocked_threat = {
        "id": len(blocked_threats) + 1,
        "timestamp": datetime.now().isoformat(),
        "blocked_at": int(time.time() * 1000),  # milliseconds
        "threat_type": threat_type,
        "source_ip": threat_data.get("source_ip", "Unknown"),
        "severity_score": float(severity_score),
        "action": "BLOCKED",
        "details": {
            "raw_log": log_content[:200],  # First 200 chars
            "metadata": threat_data.get("metadata", {}),
            "confidence": "HIGH" if severity_score > 7 else "MEDIUM" if severity_score > 4 else "LOW"
        }
    }
    
    # Add to blocked list (keep last MAX_BLOCKED_THREATS)
    blocked_threats.insert(0, blocked_threat)
    if len(blocked_threats) > MAX_BLOCKED_THREATS:
        blocked_threats = blocked_threats[:MAX_BLOCKED_THREATS]
    
    return blocked_threat


def get_blocked_threats() -> List[Dict]:
    """Get all blocked threats."""
    return blocked_threats


def get_blocked_threat_stats() -> Dict:
    """Get statistics on blocked threats."""
    if not blocked_threats:
        return {
            "total_blocked": 0,
            "by_type": {},
            "by_severity": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
        }
    
    stats = {
        "total_blocked": len(blocked_threats),
        "by_type": {},
        "by_severity": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
        "top_ips": {}
    }
    
    for threat in blocked_threats:
        # Count by threat type
        ttype = threat.get("threat_type", "Unknown")
        stats["by_type"][ttype] = stats["by_type"].get(ttype, 0) + 1
        
        # Count by severity
        confidence = threat.get("details", {}).get("confidence", "LOW")
        stats["by_severity"][confidence] = stats["by_severity"].get(confidence, 0) + 1
        
        # Top source IPs
        ip = threat.get("source_ip", "Unknown")
        stats["top_ips"][ip] = stats["top_ips"].get(ip, 0) + 1
    
    # Sort top IPs
    stats["top_ips"] = dict(sorted(stats["top_ips"].items(), key=lambda x: x[1], reverse=True)[:10])
    
    return stats


def should_block_threat(prediction: str, severity_score: float) -> bool:
    """Determine if a threat should be blocked."""
    # Block if severity is high (>7) or prediction indicates threat
    known_threats = ["sql injection", "brute force", "ddos", "malware", "xss", 
                     "privilege escalation", "port scanning", "data exfiltration",
                     "unauthorized access", "csrf"]
    
    if severity_score > 6:
        return True
    
    if any(threat in prediction.lower() for threat in known_threats):
        return True
    
    return False
