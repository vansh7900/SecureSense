from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio
import os
import psutil
import random
from dotenv import load_dotenv

try:
    load_dotenv()
except:
    pass

from app.services.log_parser import parse_log_line as parse_log
from app.services.ml_detector import detect_threat
from app.services.ai_engine import RiskAnalyzer
from app.services.threat_blocker import should_block_threat, block_threat, get_blocked_threats

from app.api.routes_threats import router as threats_router
from app.api.routes_chat import router as chat_router
from app.api.routes_logs import router as logs_router


app = FastAPI(title="SecureSense", version="1.0.0")

app.include_router(threats_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(logs_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores
threat_store: List[dict] = []
log_store: List[dict] = []

# AI analyzer
analyzer = RiskAnalyzer()

# Simulation mode
SIMULATION_MODE =False
# MITRE STAGES
mitre_stages = [
    "Initial Access", "Execution", "Persistence", "Privilege Escalation",
    "Defense Evasion", "Credential Access", "Discovery",
    "Lateral Movement", "Command & Control"
]

# ✅ FIX 1: Labels that mean "no threat" — skip these
BENIGN_LABELS = {"normal traffic", "normal", "benign", "clean", "safe"}

# ✅ FIX 2: Fallback severity map so blocking always fires for known threats
THREAT_SEVERITY_MAP = {
    "sql injection":        8,
    "brute force":          7,
    "ddos":                 9,
    "syn flood":            9,
    "malware":              8,
    "xss attack":           7,
    "port scanning":        6,
    "privilege escalation": 8,
    "data exfiltration":    9,
    "unauthorized access":  7,
    "csrf":                 6,
}

# ✅ FIX 3: Map ML label → ai_engine threat type key (used for rule-based fallback)
LABEL_TO_ENGINE_TYPE = {
    "sql injection":        "sql_injection",
    "brute force":          "brute_force",
    "ddos":                 "dos_attack",
    "syn flood":            "dos_attack",
    "malware":              "malware",
    "privilege escalation": "privilege_escalation",
    "xss attack":           "xss_attack",
    "port scanning":        "port_scanning",
    "data exfiltration":    "data_exfiltration",
    "unauthorized access":  "unauthorized_access",
    "csrf":                 "csrf",
}


def get_severity_for_threat(prediction: str, analysis: dict) -> float:
    """
    ✅ FIX: Get severity with fallback chain:
    1. Use AI/rule-based severity_score if it's meaningful (> 0)
    2. Fall back to THREAT_SEVERITY_MAP based on prediction label
    3. Default to 5
    """
    ai_score = analysis.get("severity_score", 0)
    if ai_score and ai_score > 0:
        return float(ai_score)

    label_key = prediction.lower()
    return float(THREAT_SEVERITY_MAP.get(label_key, 5))


def build_threat_obj(prediction: str, parsed: dict) -> dict:
    """Build threat object for ai_engine using correct type key."""
    engine_type = LABEL_TO_ENGINE_TYPE.get(prediction.lower(), prediction.lower().replace(" ", "_"))
    return {
        "type": engine_type,          # ✅ matches ai_engine template keys
        "severity": "high" if THREAT_SEVERITY_MAP.get(prediction.lower(), 5) >= 7 else "medium",
        "raw_log": parsed.get("raw", ""),
        "metadata": parsed.get("metadata", {}),
    }


# ---------------- WebSocket Manager ----------------
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.active:
            try:
                await ws.send_json(data)
            except:
                pass


manager = ConnectionManager()


# ---------------- Schemas ----------------
class LogIngestion(BaseModel):
    source: str
    raw_log: str


# ---------------- Real-time log monitor ----------------
async def monitor_system_logs():
    log_file = r"C:\Windows\System32\LogFiles\Firewall\pfirewall.log"

    if not os.path.exists(log_file):
        print("Firewall log not found, skipping real-time monitoring")
        return

    print("Real-time monitoring started...")

    with open(log_file, "r", errors="ignore") as f:
        f.seek(0, 2)

        while True:
            line = f.readline()
            if not line:
                await asyncio.sleep(1)
                continue

            parsed = parse_log(line.strip(), "firewall")
            log_store.append(parsed)

            prediction = detect_threat(parsed)

            # Normal traffic — show as low risk event
            if not prediction or prediction.lower() in BENIGN_LABELS:
                normal_data = {
                    "prediction": "Normal Traffic",
                    "parsed": parsed,
                    "analysis": {
                        "explanation": "Regular network traffic with no indicators of compromise.",
                        "impact": "No impact. This is expected traffic.",
                        "recommended_action": "No action required. Continue standard monitoring.",
                        "severity_score": 1,
                        "affected_assets": []
                    },
                    "mitre_stage": "None",
                    "blocked": False,
                    "risk_level": "low"
                }
                threat_store.append(normal_data)
                await manager.broadcast({"type": "new_threat", "data": normal_data})
                continue

            threat_obj = build_threat_obj(prediction, parsed)
            analysis = await analyzer.analyze(threat_obj)

            severity = get_severity_for_threat(prediction, analysis)

            threat_data = {
                "prediction": prediction,
                "parsed": parsed,
                "analysis": analysis,
                "mitre_stage": random.choice(mitre_stages),
                "risk_level": "critical" if severity >= 8 else "medium" if severity >= 5 else "low"
            }

            threat_store.append(threat_data)

            if should_block_threat(prediction, severity):
                blocked = block_threat({
                    "prediction": prediction,
                    "source_ip": parsed.get("metadata", {}).get("source_ip", "Unknown"),
                    "raw_log": line.strip(),
                    "metadata": parsed.get("metadata", {})
                }, severity)
                threat_data["blocked"] = True
                threat_data["blocked_info"] = blocked
                print(f"⊗ BLOCKED: {prediction} from {parsed.get('metadata', {}).get('source_ip', 'Unknown')} (severity: {severity})")

            await manager.broadcast({"type": "new_threat", "data": threat_data})


# ---------------- SIMULATION ----------------
async def simulate_threats():
    threats = ["SQL Injection", "Brute Force", "DDoS", "Malware", "XSS Attack", "Port Scanning"]

    while True:
        await asyncio.sleep(5)

        severity = random.randint(5, 9)
        threat_type = random.choice(threats)
        source_ip = f"192.168.1.{random.randint(1, 255)}"

        threat_obj = build_threat_obj(threat_type, {
            "raw": f"Simulated {threat_type} from {source_ip}",
            "metadata": {"source_ip": source_ip}
        })
        analysis = await analyzer.analyze(threat_obj)
        # Override with realistic score for simulation
        analysis["severity_score"] = severity

        threat_data = {
            "prediction": threat_type,
            "parsed": {"ip": source_ip, "metadata": {"source_ip": source_ip}},
            "analysis": analysis,
            "mitre_stage": random.choice(mitre_stages)
        }

        threat_store.append(threat_data)

        if should_block_threat(threat_type, severity):
            blocked = block_threat({
                "prediction": threat_type,
                "source_ip": source_ip,
                "raw_log": str(threat_data),
                "metadata": threat_data["parsed"]
            }, severity)
            threat_data["blocked"] = True
            threat_data["blocked_info"] = blocked
            print(f"⊗ BLOCKED: {threat_type} from {source_ip} (severity: {severity})")

        await manager.broadcast({"type": "new_threat", "data": threat_data})


# ---------------- Routes ----------------
@app.get("/health")
def health():
    return {"status": "ok", "threats_detected": len(threat_store)}


@app.post("/api/logs/ingest")
async def ingest_log(payload: LogIngestion):
    parsed = parse_log(payload.raw_log, payload.source)
    log_store.append(parsed)

    prediction = detect_threat(parsed)

    # Normal traffic — show in dashboard as low risk
    if not prediction or prediction.lower() in BENIGN_LABELS:
        normal_data = {
            "prediction": "Normal Traffic",
            "parsed": parsed,
            "analysis": {
                "explanation": "Regular network traffic with no indicators of compromise.",
                "impact": "No impact. This is expected traffic.",
                "recommended_action": "No action required. Continue standard monitoring.",
                "severity_score": 1,
                "affected_assets": []
            },
            "mitre_stage": "None",
            "blocked": False,
            "risk_level": "low"
        }
        threat_store.append(normal_data)
        await manager.broadcast({"type": "new_threat", "data": normal_data})
        return {"status": "clean", "log": parsed, "event": normal_data}

    threat_obj = build_threat_obj(prediction, parsed)
    analysis = await analyzer.analyze(threat_obj)

    severity = get_severity_for_threat(prediction, analysis)

    print(f"[DEBUG] prediction={prediction}, severity={severity}")

    threat_data = {
        "prediction": prediction,
        "parsed": parsed,
        "analysis": analysis,
        "mitre_stage": random.choice(mitre_stages),
        "risk_level": "critical" if severity >= 8 else "medium" if severity >= 5 else "low"
    }

    threat_store.append(threat_data)

    if should_block_threat(prediction, severity):
        blocked = block_threat({
            "prediction": prediction,
            "source_ip": parsed.get("metadata", {}).get("source_ip", "Unknown"),
            "raw_log": payload.raw_log,
            "metadata": parsed.get("metadata", {})
        }, severity)
        threat_data["blocked"] = True
        threat_data["blocked_info"] = blocked
        print(f"⊗ BLOCKED: {prediction} from {parsed.get('metadata', {}).get('source_ip', 'Unknown')} (severity: {severity})")

    await manager.broadcast({"type": "new_threat", "data": threat_data})

    return {"status": "threat_detected", "threat": threat_data}


@app.get("/api/logs")
def get_logs(limit: int = 50):
    return {"logs": log_store[-limit:]}


@app.get("/api/threats")
def get_threats():
    return {"threats": threat_store}


@app.get("/api/threats/summary")
def get_threats_summary():
    blocked = get_blocked_threats()
    return {
        "total_threats": len(threat_store),
        "total_blocked": len(blocked),
        "blocked_threats": blocked,
        "threats": threat_store
    }


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/api/flow")
def flow():
    return {"requests_per_sec": random.randint(50, 300)}


@app.get("/api/metrics")
def metrics():
    return {"cpu": psutil.cpu_percent()}


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    asyncio.create_task(monitor_system_logs())
    if SIMULATION_MODE:
        asyncio.create_task(simulate_threats())