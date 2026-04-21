from fastapi import APIRouter
from pydantic import BaseModel
import requests
import threading
import time
import os
from dotenv import load_dotenv
from app.services.threat_blocker import (
    block_threat, get_blocked_threats, get_blocked_threat_stats, 
    should_block_threat, detect_threat_type
)

load_dotenv()

def classify_threat(severity):

    if severity >= 7:
        return "Critical Threat"
    elif severity >= 4:
        return "Suspicious Activity"
    else:
        return "Benign Event"

router = APIRouter()

# In-memory store for dashboard
threats = []

# API Keys
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")


# ================================
# Request Models
# ================================
class ScanRequest(BaseModel):
    url: str


class IPRequest(BaseModel):
    ip: str


class CVERequest(BaseModel):
    cve: str


# ================================
# GET threats for dashboard
# ================================
@router.get("/threats")
def get_threats():
    return {"threats": threats}


# ================================
# URL SCAN (Async)
# ================================
@router.post("/scan-url")
def scan_url(payload: ScanRequest):
    threading.Thread(target=process_url_scan, args=(payload.url,)).start()
    return {"status": "scanning started"}


def process_url_scan(url):

    try:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}

        submit = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            data={"url": url},
            headers=headers
        )

        analysis_id = submit.json()["data"]["id"]

        time.sleep(4)

        res = requests.get(
            f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
            headers=headers
        )

        stats = res.json()["data"]["attributes"]["stats"]

        threat = {
            "prediction": classify_threat(stats.get("malicious",0)),
            "source_ip": url,
            "analysis": {
                "severity_score": stats.get("malicious", 0),
                "explanation": "VirusTotal URL scan",
                "recommended_action": "Block"
                if stats.get("malicious", 0) > 0 else "Allow"
            }
        }

        threats.insert(0, threat)

    except Exception as e:
        print("URL scan error:", e)


# ================================
# IP Reputation
# ================================
@router.post("/check-ip")
def check_ip(payload: IPRequest):

    try:
        headers = {
            "Key": ABUSEIPDB_API_KEY,
            "Accept": "application/json"
        }

        params = {
            "ipAddress": payload.ip,
            "maxAgeInDays": "90"
        }

        res = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers=headers,
            params=params
        )

        data = res.json()["data"]

        threat = {
            "prediction": "IP Reputation",
            "source_ip": payload.ip,
            "analysis": {
                "severity_score": data["abuseConfidenceScore"],
                "explanation": "AbuseIPDB reputation check",
                "recommended_action":
                    "Block" if data["abuseConfidenceScore"] > 50 else "Monitor"
            }
        }

        threats.insert(0, threat)

        return data

    except Exception as e:
        return {"error": str(e)}


# ================================
# CVE Lookup
# ================================
@router.post("/lookup-cve")
def lookup_cve(payload: CVERequest):

    try:
        res = requests.get(
            f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={payload.cve}"
        )

        data = res.json()

        severity = 0
        try:
            severity = data["vulnerabilities"][0]["cve"]["metrics"][
                "cvssMetricV31"][0]["cvssData"]["baseScore"]
        except:
            pass

        threat = {
            "prediction": "CVE Lookup",
            "source_ip": payload.cve,
            "analysis": {
                "severity_score": severity,
                "explanation": "NVD CVE lookup",
                "recommended_action":
                    "Patch Immediately" if severity >= 7 else "Review"
            }
        }

        threats.insert(0, threat)

        return data

    except Exception as e:
        return {"error": str(e)}
        import asyncio

async def broadcast(threat):
    from app.main import connections

    for conn in connections:
        await conn.send_json({
            "type": "new_threat",
            "data": threat
        })


# ================================
# BLOCKED THREATS
# ================================
@router.get("/threats/blocked-threats")
def get_blocked_threats_list():
    """Get all blocked threats."""
    return {"blocked_threats": get_blocked_threats()}


@router.get("/threats/blocked-threats/stats")
def get_blocked_threats_summary():
    """Get statistics on blocked threats."""
    return get_blocked_threat_stats()


@router.post("/threats/block-threat")
def create_blocked_threat(threat_data: dict):
    """Block a threat and log it."""
    try:
        severity = threat_data.get("severity_score", 0)
        blocked = block_threat(threat_data, severity)
        return {"status": "blocked", "threat": blocked}
    except Exception as e:
        return {"error": str(e)}