import os, json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
 
try:
    load_dotenv()
except:
    pass
 
RISK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a senior cybersecurity analyst.
Given a threat event, respond ONLY with a valid JSON object (no markdown) with these exact keys:
- explanation: plain-English explanation (2-3 sentences, no jargon)
- impact: potential business/system impact (1 sentence)
- recommended_action: specific, actionable step the analyst should take right now
- severity_score: integer 1-10
- affected_assets: list of strings (e.g. ["SSH server", "root account"])"""),
    ("human",
    "Threat type: {threat_type}\n"
    "Severity: {severity}\n"
    "Raw log: {raw_log}\n"
    "Source metadata: {metadata}")
])
 
FALLBACK_ANALYSIS = {
    "explanation":          "A security threat was detected in the system logs.",
    "impact":               "Potential unauthorized access or system compromise.",
    "recommended_action":   "Investigate the source IP and review recent activity.",
    "severity_score":       5,
    "affected_assets":      ["system logs"],
}
 
class RiskAnalyzer:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.enabled = False
        self.chain = None
 
        if api_key:
            try:
                self.llm = ChatGroq(
                    model="llama-3.1-8b-instant",   # ✅ FIX: llama2-70b-4096 is deprecated
                    temperature=0,
                    api_key=api_key
                )
                self.chain = RISK_PROMPT | self.llm | StrOutputParser()
                self.enabled = True
                print("✓ Groq AI Engine initialized successfully")
            except ImportError:
                print("⚠️  langchain_groq not installed. AI analysis disabled.")
                self.enabled = False
            except Exception as e:
                print(f"⚠️  Failed to initialize Groq: {e}. Using fallback analysis.")
                self.enabled = False
        else:
            print("⚠️  GROQ_API_KEY not set. Using fallback threat analysis.")
            self.enabled = False
 
    async def analyze(self, threat: dict) -> dict:
        if not self.enabled or not self.chain:
            return self._rule_based_fallback(threat)
 
        try:
            raw = await self.chain.ainvoke({
                "threat_type": threat.get("type", "Unknown"),
                "severity":    threat.get("severity", "medium"),
                "raw_log":     threat.get("raw_log", ""),
                "metadata":    json.dumps(threat.get("metadata", {})),
            })
 
            result = json.loads(raw)
            if not isinstance(result.get("severity_score"), (int, float)):
                result["severity_score"] = self._rule_based_fallback(threat).get("severity_score", 5)
            return result
 
        except json.JSONDecodeError:
            print("⚠️  AI response was not valid JSON. Using fallback.")
            return self._rule_based_fallback(threat)
        except Exception as e:
            print(f"⚠️  AI analysis failed: {e}. Using fallback.")
            return self._rule_based_fallback(threat)
 
    def _rule_based_fallback(self, threat: dict) -> dict:
        """
        ✅ FIX: severity_score now based on threat type, not just the 'severity' string.
        Templates keyed to match LABEL_TO_ENGINE_TYPE values from main.py.
        """
        # ✅ FIX: severity map for engine-type keys
        severity_by_type = {
            "sql_injection":        8,
            "brute_force":          7,
            "dos_attack":           9,
            "malware":              8,
            "xss_attack":           7,
            "privilege_escalation": 8,
            "port_scanning":        6,
            "data_exfiltration":    9,
            "unauthorized_access":  7,
            "csrf":                 6,
        }
 
        templates = {
            "brute_force": {
                "explanation":        "Multiple failed login attempts were detected from the same IP, indicating a brute-force attack.",
                "impact":             "Unauthorized root or user access if credentials are guessed successfully.",
                "recommended_action": f"Block IP {threat.get('metadata', {}).get('source_ip', 'unknown')} and enable fail2ban.",
                "affected_assets":    ["SSH service", "user accounts"],
            },
            "sql_injection": {
                "explanation":        "SQL injection keywords found in the log — attacker is probing for database vulnerabilities.",
                "impact":             "Database breach, data theft, or complete data loss.",
                "recommended_action": "Sanitize all user inputs, review WAF rules, and audit recent DB queries.",
                "affected_assets":    ["database", "web application"],
            },
            "privilege_escalation": {
                "explanation":        "A user invoked elevated privileges via sudo, indicating possible lateral movement or insider threat.",
                "impact":             "Full system compromise if the account is controlled by an attacker.",
                "recommended_action": "Audit recent commands for this user, revoke sudo access, and check cron jobs.",
                "affected_assets":    ["sudo", "root account"],
            },
            "dos_attack": {
                "explanation":        "A SYN flood was detected — a denial-of-service attack overwhelming the server's TCP stack.",
                "impact":             "Service downtime and unavailability for legitimate users.",
                "recommended_action": "Enable SYN cookies and rate-limit the source IP at the firewall.",
                "affected_assets":    ["network", "web server"],
            },
            "malware": {
                "explanation":        "Malware execution patterns detected in the log, suggesting active infection or exploitation attempt.",
                "impact":             "System compromise, data theft, or ransomware deployment.",
                "recommended_action": "Isolate the affected host immediately and run a full endpoint scan.",
                "affected_assets":    ["endpoint", "file system"],
            },
            "xss_attack": {
                "explanation":        "Cross-site scripting payload detected in request, attacker may inject malicious scripts into web pages.",
                "impact":             "Session hijacking, credential theft, or defacement.",
                "recommended_action": "Implement Content Security Policy, encode all output, and sanitize inputs.",
                "affected_assets":    ["web application", "user sessions"],
            },
            "port_scanning": {
                "explanation":        "Port scan activity detected — attacker is enumerating open services for further exploitation.",
                "impact":             "Reconnaissance that enables targeted follow-up attacks.",
                "recommended_action": "Block the scanning IP at the firewall and review exposed services.",
                "affected_assets":    ["network", "exposed services"],
            },
            "data_exfiltration": {
                "explanation":        "Unusual outbound data transfer detected, suggesting data exfiltration in progress.",
                "impact":             "Sensitive data loss including credentials, PII, or intellectual property.",
                "recommended_action": "Block outbound connections from the host and initiate incident response.",
                "affected_assets":    ["database", "file system", "network"],
            },
            "unauthorized_access": {
                "explanation":        "Unauthorized access attempt detected — invalid credentials or expired session used.",
                "impact":             "Potential account compromise or privilege abuse.",
                "recommended_action": "Force logout active sessions, reset credentials, and review access logs.",
                "affected_assets":    ["authentication system", "user accounts"],
            },
            "csrf": {
                "explanation":        "CSRF token missing or invalid — attacker may be forging cross-site requests.",
                "impact":             "Unauthorized actions performed on behalf of an authenticated user.",
                "recommended_action": "Enforce CSRF token validation on all state-changing endpoints.",
                "affected_assets":    ["web application", "user sessions"],
            },
        }
 
        threat_type = threat.get("type", "unknown")
        template = templates.get(threat_type, {
            "explanation":        threat.get("message", "A security threat was detected."),
            "impact":             "System integrity may be at risk.",
            "recommended_action": "Investigate the source IP and review recent activity.",
            "affected_assets":    ["system"],
        })
 
        # ✅ FIX: severity_score from type map, not from vague 'severity' string
        score = severity_by_type.get(threat_type, 5)
 
        return {**template, "severity_score": score}
 