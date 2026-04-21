from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Load API key with fallback
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Initialize client safely - will handle missing API key gracefully
try:
    if GROQ_API_KEY and GROQ_API_KEY.strip():
        client = Groq(api_key=GROQ_API_KEY)
        GROQ_AVAILABLE = True
    else:
        print("⚠️  WARNING: GROQ_API_KEY not set. Using fallback AI responses.")
        client = None
        GROQ_AVAILABLE = False
except Exception as e:
    print(f"⚠️  ERROR: Failed to initialize Groq client: {e}")
    client = None
    GROQ_AVAILABLE = False


# ---------- AI SUMMARY ----------

class SummaryRequest(BaseModel):
    threats: list


@router.post("/ai-summary")
def ai_summary(payload: SummaryRequest):
    """Generate AI threat summary with Groq fallback"""
    
    threats = payload.threats

    if not threats:
        return {"summary": "✓ No threats detected. Network security posture is nominal."}

    # Extract threat statistics
    threat_types = {}
    severity_scores = []
    top_ips = {}
    
    for t in threats:
        pred = t.get("prediction", "Unknown")
        threat_types[pred] = threat_types.get(pred, 0) + 1
        
        score = t.get("analysis", {}).get("severity_score", 0)
        severity_scores.append(score)
        
        ip = t.get("parsed", {}).get("metadata", {}).get("source_ip", "Unknown")
        if ip != "Unknown":
            top_ips[ip] = top_ips.get(ip, 0) + 1
    
    # Sort and summarize
    highest_severity = max(severity_scores) if severity_scores else 0
    avg_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 0
    critical_count = sum(1 for s in severity_scores if s > 7)
    medium_count = sum(1 for s in severity_scores if 4 < s <= 7)
    
    top_threat = max(threat_types.items(), key=lambda x: x[1]) if threat_types else ("Unknown", 0)
    top_ip = max(top_ips.items(), key=lambda x: x[1]) if top_ips else ("--", 0)
    
    # Try to use Groq for summary generation
    try:
        if GROQ_AVAILABLE and client:
            prompt = f"""You are a cybersecurity analyst. Provide a 3-4 sentence executive summary of these threat statistics:
- Total threats: {len(threats)}
- Critical threats: {critical_count}
- Medium threats: {medium_count}
- Highest severity score: {highest_severity}/10
- Average severity: {avg_severity:.1f}/10
- Top threat type: {top_threat[0]} ({top_threat[1]} instances)
- Most active attacker IP: {top_ip[0]} ({top_ip[1]} attempts)

Be concise and actionable."""
            
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=250
            )
            return {"summary": response.choices[0].message.content}
    except Exception as e:
        print(f"❌ Summary generation error: {e}")
    
    # Fallback: Generate summary manually
    summary = f"""
Threat Intelligence Summary
━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Events Detected: {len(threats)}
🔴 Critical Threats: {critical_count}
🟠 Medium Threats: {medium_count}
🟢 Low Risk: {len(threats) - critical_count - medium_count}

📈 Threat Analysis:
• Highest Severity: {highest_severity}/10
• Average Severity: {avg_severity:.1f}/10
• Top Attack Vector: {top_threat[0]}
• Most Active Source: {top_ip[0]}

🎯 Recommendation:
{"Immediate action required - critical threats detected!" if critical_count > 0 else "Maintain heightened monitoring - medium threats present." if medium_count > 0 else "Network security posture is good. Continue standard monitoring."}
"""
    
    return {"summary": summary}


# ---------- AI CHAT ----------

class ChatRequest(BaseModel):
    message: str


FALLBACK_RESPONSES = {
    "sql injection": "SQL Injection is a code injection technique where attackers insert malicious SQL queries into input fields. Prevention: Use parameterized queries, input validation, and prepared statements. Always sanitize user input before using it in SQL queries.",
    "xss": "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages. Protection: Implement Content Security Policy (CSP), encode output, validate input, and use security headers like X-XSS-Protection.",
    "ddos": "DDoS (Distributed Denial of Service) attacks flood your servers with traffic. Mitigation: Deploy DDoS protection services, rate limiting, WAF rules, and have an incident response plan. Monitor traffic patterns constantly.",
    "mfa": "Multi-Factor Authentication (MFA) uses multiple verification methods. Best practices: Use TOTP apps (not SMS when possible), enforce MFA for admins, backup codes, and educate users on phishing.",
    "ransomware": "Ransomware encrypts your files and demands payment. Defense: Regular backups (offline copies), endpoint protection, patch management, user training, and network segmentation.",
    "brute force": "Brute force attacks try multiple credentials. Protection: Implement account lockout policies, rate limiting, strongpass requirements, MFA, and monitor failed login attempts.",
    "privilege escalation": "Privilege escalation gains higher access levels. Prevention: Run services with minimal privileges, regular audits, patch systems, disable unnecessary services, and use RBAC.",
    "phishing": "Phishing tricks users into revealing credentials. Defense: Employee training, email filtering, DMARC/SPF/DKIM, verify sender IDs, and report suspicious emails.",
}

def get_fallback_response(question: str) -> str:
    """Return a relevant fallback response based on keywords in the question"""
    q_lower = question.lower()
    
    for keyword, response in FALLBACK_RESPONSES.items():
        if keyword in q_lower:
            return response
    
    # Generic fallback
    return f"Security Question: '{question}'\n\nGeneral guidance: Always follow the principle of least privilege, maintain updated systems, use strong authentication, monitor logs, and implement defense-in-depth strategies. For specific threats, consult your security team and threat intelligence reports."


@router.post("/chat")
def chat(payload: ChatRequest):
    """AI chat endpoint with Groq fallback"""
    
    try:
        if GROQ_AVAILABLE and client:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a cybersecurity SOC analyst AI. Answer briefly and professionally about security topics."
                    },
                    {"role": "user", "content": payload.message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            return {"reply": response.choices[0].message.content}
        else:
            # Use fallback response
            fallback = get_fallback_response(payload.message)
            return {"reply": fallback}
    
    except Exception as e:
        print(f"❌ Chat error: {e}")
        # Fallback on any error
        fallback = get_fallback_response(payload.message)
        return {"reply": fallback}