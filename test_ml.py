import requests
import time
import random

URL = "https://securesense.onrender.com/api/logs/ingest"

start = time.time()

for i in range(50):
    ip = f"192.168.1.{random.randint(1,255)}"

    payload = {
        "source":"firewall",
        "raw_log": f"DROP TCP {ip} 10.0.0.5 445"
    }

    requests.post(URL, json=payload)

end = time.time()

print("Total time:", end-start)


print("Requests/sec:", 50/(end-start))