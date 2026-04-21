from app.services.log_parser import parse_log_line
from app.services.ml_detector import detect_threat
from app.services.ai_engine import RiskAnalyzer

analyzer = RiskAnalyzer()


async def run_pipeline(log):

    parsed = parse_log_line(log)

    prediction = detect_threat(parsed)

    threat = {
        "type": prediction,
        "severity": "medium",
        "raw_log": parsed.get("raw", ""),
        "metadata": parsed.get("metadata", {})
    }

    analysis = await analyzer.analyze(threat)

    return {
        "parsed": parsed,
        "prediction": prediction,
        "analysis": analysis
    }