from fastapi import APIRouter
from app.services.log_parser import parse_log_line as parse_log
from app.services.ml_detector import detect_threat
from app.services.ai_engine import RiskAnalyzer
from app.services.threat_blocker import should_block_threat, block_threat

router = APIRouter()
analyzer = RiskAnalyzer()

@router.post("/ingest")
async def ingest_logs(log: dict):

    parsed = parse_log(log)

    prediction = detect_threat(parsed)

    # Prepare threat data for AI analysis
    threat_data = {
        "type": prediction,
        "severity": "medium",
        "raw_log": str(log),
        "metadata": parsed.get("metadata", {})
    }
    
    explanation = await analyzer.analyze(threat_data)
    
    # Extract severity score from parsed or explanation
    severity_score = parsed.get("severity_score", 0)
    if isinstance(explanation, dict):
        severity_score = explanation.get("severity_score", severity_score)
    
    # Check if threat should be blocked
    blocked = False
    blocked_info = None
    if should_block_threat(prediction, severity_score):
        blocked = True
        # Build threat data for blocking
        threat_data_block = {
            "prediction": prediction,
            "source_ip": parsed.get("source_ip", "Unknown"),
            "raw_log": str(log),
            "metadata": parsed.get("metadata", {})
        }
        blocked_info = block_threat(threat_data_block, severity_score)

    return {
        "parsed": parsed,
        "prediction": prediction,
        "explanation": explanation,
        "blocked": blocked,
        "blocked_info": blocked_info
    }