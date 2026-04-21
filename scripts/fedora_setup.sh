#!/bin/bash
# SecureSense Fedora Setup Script
# Run as: sudo bash fedora_setup.sh

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  SecureSense Fedora Integration Setup              ║"
echo "╚════════════════════════════════════════════════════╝"

# Get user input
read -p "Enter backend URL (default: http://127.0.0.1:8000): " BACKEND_URL
BACKEND_URL=${BACKEND_URL:-http://127.0.0.1:8000}

echo ""
echo "📦 Creating SecureSense directories..."
mkdir -p /opt/securesense
mkdir -p /var/log/securesense

echo "✓ Created /opt/securesense"
echo "✓ Created /var/log/securesense"

echo ""
echo "📝 Creating log forwarder service..."

cat > /opt/securesense/log_forwarder.py << 'EOF'
#!/usr/bin/env python3
import requests
import subprocess
import time
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
LOG_FILES = [
    "/var/log/auth.log",
    "/var/log/secure",
    "/var/log/syslog",
    "/var/log/audit/audit.log"
]
LOG_DIR = "/var/log/securesense"
STATE_FILE = f"{LOG_DIR}/forwarder.state"

def log_message(msg, level="INFO"):
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] [{level}] {msg}")
    with open(f"{LOG_DIR}/forwarder.log", "a") as f:
        f.write(f"[{timestamp}] [{level}] {msg}\n")

def send_log_to_backend(log_line, source="fedora-system"):
    try:
        payload = {
            "raw_log": log_line,
            "source": source,
            "timestamp": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/logs/ingest",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "threat_detected":
                threat = result.get("threat", {})
                log_message(
                    f"🚨 THREAT: {threat.get('prediction')} "
                    f"(Severity: {threat.get('analysis', {}).get('severity_score')})",
                    "ALERT"
                )
                if threat.get('blocked'):
                    log_message(f"✓ BLOCKED: {threat.get('prediction')}", "BLOCKING")
        
    except requests.exceptions.ConnectionError:
        log_message(f"Cannot connect to backend: {BACKEND_URL}", "ERROR")
    except Exception as e:
        log_message(f"Error sending log: {e}", "ERROR")

def monitor_logs():
    log_message(f"SecureSense Log Forwarder started (Backend: {BACKEND_URL})")
    
    positions = {}
    for log_file in LOG_FILES:
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', errors='ignore') as f:
                    f.seek(0, 2)
                    positions[log_file] = f.tell()
                log_message(f"Monitoring: {log_file}")
            except PermissionError:
                log_message(f"Permission denied: {log_file}", "WARNING")
    
    while True:
        for log_file in LOG_FILES:
            if not os.path.exists(log_file):
                continue
            
            try:
                with open(log_file, 'r', errors='ignore') as f:
                    current_pos = positions.get(log_file, 0)
                    f.seek(current_pos)
                    new_lines = f.readlines()
                    positions[log_file] = f.tell()
                    
                    for line in new_lines:
                        if line.strip():
                            send_log_to_backend(line.strip())
                            
            except Exception as e:
                log_message(f"Error reading {log_file}: {e}", "ERROR")
        
        time.sleep(2)

if __name__ == "__main__":
    try:
        monitor_logs()
    except KeyboardInterrupt:
        log_message("Log forwarder stopped")
        sys.exit(0)
    except Exception as e:
        log_message(f"Fatal error: {e}", "FATAL")
        sys.exit(1)
EOF

chmod +x /opt/securesense/log_forwarder.py
echo "✓ Created log_forwarder.py"

echo ""
echo "🔧 Creating systemd service..."

cat > /etc/systemd/system/securesense-forwarder.service << EOF
[Unit]
Description=SecureSense Log Forwarder
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/securesense/log_forwarder.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="BACKEND_URL=${BACKEND_URL}"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable securesense-forwarder
echo "✓ Created systemd service"

echo ""
echo "🔌 Configuring firewall..."
firewall-cmd --permanent --add-port=8000/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=8001/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true
echo "✓ Firewall configured"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your system IP: hostname -I"
echo "2. Edit /etc/systemd/system/securesense-forwarder.service to update BACKEND_URL"
echo "3. Start the forwarder: systemctl start securesense-forwarder"
echo "4. Check status: systemctl status securesense-forwarder"
echo "5. View logs: journalctl -u securesense-forwarder -f"
echo ""
echo "Backend URL configured: ${BACKEND_URL}"
