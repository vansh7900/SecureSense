from app.services.mitigation import mitigate
def mitigate(prediction, parsed):

    if prediction == "normal":
        return "No action required"

    return f"Blocking IP {parsed['ip']}"