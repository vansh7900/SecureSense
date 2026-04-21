# SecureSense Real System Integration Guide

## Overview
This guide explains how to integrate SecureSense threat detection with real Fedora and Windows systems for live monitoring and threat blocking.

---

## Part 1: FEDORA SYSTEM SETUP

### 1.1 Backend Server Configuration

**Start the backend (accessible from other systems):**
```bash
cd /home/config/Downloads/backend-20260412T201846Z-3-001/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Note:** Replace `127.0.0.1` with your Fedora machine's IP address (e.g., `192.168.1.100`)

### 1.2 Log Collection from Fedora

**Method A: Send System Logs via API (Recommended)**

Create `/opt/securesense/fedora_log_forwarder.py`:

```python
#!/usr/bin/env python3
import requests
import subprocess
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "http://192.168.1.100:8000"  # Change to your Fedora IP
AUTH_LOG = "/var/log/auth.log"
SECURE_LOG = "/var/log/secure"
SYSLOG = "/var/log/syslog"

def get_recent_logs(log_file, last_lines=10):
    """Get last N lines from log file"""
    try:
        result = subprocess.run(['tail', '-f', log_file], 
                              capture_output=True, text=True, timeout=2)
        return result.stdout.strip().split('\n')
    except:
        return []

def send_log_to_backend(log_line, source="fedora-system"):
    """Send log to SecureSense backend"""
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
                print(f"🚨 THREAT DETECTED: {threat.get('prediction')}")
                print(f"   Severity: {threat.get('analysis', {}).get('severity_score')}")
                if threat.get('blocked'):
                    print(f"   ✓ BLOCKED!")
        
    except Exception as e:
        print(f"Error sending log: {e}")

def monitor_logs():
    """Monitor system logs and forward to backend"""
    print("Starting SecureSense Log Forwarder...")
    print(f"Target: {BACKEND_URL}")
    
    log_files = [AUTH_LOG, SECURE_LOG, SYSLOG]
    
    # Get initial position
    positions = {}
    for log_file in log_files:
        try:
            with open(log_file, 'r') as f:
                f.seek(0, 2)  # Go to end
                positions[log_file] = f.tell()
        except:
            positions[log_file] = 0
    
    while True:
        for log_file in log_files:
            try:
                with open(log_file, 'r') as f:
                    f.seek(positions[log_file])
                    new_lines = f.readlines()
                    positions[log_file] = f.tell()
                    
                    for line in new_lines:
                        if line.strip():
                            send_log_to_backend(line.strip())
                            
            except FileNotFoundError:
                pass
            except Exception as e:
                print(f"Error reading {log_file}: {e}")
        
        time.sleep(2)  # Check every 2 seconds

if __name__ == "__main__":
    try:
        monitor_logs()
    except KeyboardInterrupt:
        print("\nLog forwarder stopped")
```

**Install and run:**
```bash
sudo mkdir -p /opt/securesense
sudo cp fedora_log_forwarder.py /opt/securesense/
sudo chmod +x /opt/securesense/fedora_log_forwarder.py
sudo python3 /opt/securesense/fedora_log_forwarder.py
```

**Method B: Real-time SSH Log Forwarding**

```bash
# Monitor remote SSH attempts
tail -f /var/log/auth.log | while read line; do
  curl -X POST http://192.168.1.100:8000/api/logs/ingest \
    -H "Content-Type: application/json" \
    -d "{\"raw_log\":\"$line\",\"source\":\"fedora-ssh\"}"
done
```

---

## Part 2: WINDOWS SYSTEM SETUP

### 2.1 PowerShell Log Forwarder

Create `C:\SecureSense\log_forwarder.ps1`:

```powershell
# SecureSense Log Forwarder for Windows
param(
    [string]$BackendUrl = "http://192.168.1.100:8000",
    [string]$Source = "windows-system"
)

# Function to send log to backend
function Send-LogToBackend {
    param(
        [string]$LogLine,
        [string]$Source
    )
    
    $payload = @{
        raw_log = $LogLine
        source = $Source
        timestamp = (Get-Date -Format o)
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/logs/ingest" `
            -Method POST `
            -ContentType "application/json" `
            -Body $payload `
            -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            $result = $response.Content | ConvertFrom-Json
            if ($result.status -eq "threat_detected") {
                Write-Host "🚨 THREAT DETECTED: $($result.threat.prediction)" -ForegroundColor Red
                Write-Host "   Severity: $($result.threat.analysis.severity_score)"
                if ($result.threat.blocked) {
                    Write-Host "   ✓ BLOCKED!" -ForegroundColor Green
                }
            }
        }
    }
    catch {
        Write-Host "Error sending log: $_" -ForegroundColor Yellow
    }
}

# Monitor Event Viewer Logs
function Monitor-EventLogs {
    Write-Host "Starting SecureSense Log Forwarder for Windows..."
    Write-Host "Target: $BackendUrl"
    Write-Host "Source: $Source"
    
    # Event Log sources to monitor
    $logNames = @("Security", "System", "Application")
    
    # Get last event ID for each log
    $lastEventIds = @{}
    foreach ($logName in $logNames) {
        $lastEvent = Get-EventLog -LogName $logName | Select-Object -First 1 -ErrorAction SilentlyContinue
        $lastEventIds[$logName] = if ($lastEvent) { $lastEvent.Index } else { 0 }
    }
    
    while ($true) {
        foreach ($logName in $logNames) {
            try {
                # Get events newer than last checked
                $events = Get-EventLog -LogName $logName `
                    -After (Get-Date).AddMinutes(-1) `
                    -ErrorAction SilentlyContinue
                
                foreach ($event in $events) {
                    if ($event.Index -gt $lastEventIds[$logName]) {
                        $logEntry = "[$($event.EventID)] $($event.Source): $($event.Message)"
                        Send-LogToBackend -LogLine $logEntry -Source "windows-$logName"
                        $lastEventIds[$logName] = $event.Index
                    }
                }
            }
            catch {
                Write-Host "Error reading $logName : $_" -ForegroundColor Yellow
            }
        }
        
        Start-Sleep -Seconds 2
    }
}

# Monitor PowerShell Event Log
function Monitor-PowerShellLogs {
    Write-Host "Monitoring PowerShell Event Logs..."
    
    $logPath = "Microsoft-Windows-PowerShell/Operational"
    $lastEventId = 0
    
    while ($true) {
        try {
            $events = Get-WinEvent -FilterHashtable @{
                LogName = $logPath
                StartTime = (Get-Date).AddMinutes(-1)
            } -ErrorAction SilentlyContinue
            
            foreach ($event in $events) {
                if ($event.RecordId -gt $lastEventId) {
                    $logEntry = "[$($event.Id)] $($event.Message)"
                    Send-LogToBackend -LogLine $logEntry -Source "windows-powershell"
                    $lastEventId = $event.RecordId
                }
            }
        }
        catch {
            Write-Host "Error reading PowerShell logs: $_" -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds 2
    }
}

# Main execution
Monitor-EventLogs
```

**Run PowerShell Forwarder:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
C:\SecureSense\log_forwarder.ps1 -BackendUrl "http://192.168.1.100:8000"
```

### 2.2 Windows Firewall Log Integration

Enable Windows Firewall logging:
```powershell
# Run as Administrator
netsh advfirewall set allprofiles logging maxfilesize 4096
netsh advfirewall set allprofiles logging level verbose
```

Monitor firewall logs:
```powershell
# C:\SecureSense\firewall_forwarder.ps1
$logPath = "C:\Windows\System32\logfiles\Firewall\*"

while ($true) {
    Get-ChildItem $logPath -Filter "*.log" | ForEach-Object {
        Get-Content $_.FullName -Tail 5 | ForEach-Object {
            if ($_ -notmatch "^#") {
                # Parse and send to backend
                Invoke-WebRequest -Uri "http://192.168.1.100:8000/api/logs/ingest" `
                    -Method POST `
                    -ContentType "application/json" `
                    -Body (@{
                        raw_log = $_
                        source = "windows-firewall"
                    } | ConvertTo-Json)
            }
        }
    }
    Start-Sleep -Seconds 5
}
```

---

## Part 3: NETWORK CONFIGURATION

### 3.1 Firewall Rules (Fedora)

```bash
# Allow backend port
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# Or with iptables
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
```

### 3.2 Network Testing

**Test from Fedora to Backend:**
```bash
curl -X GET http://192.168.1.100:8000/health
# Should return: {"status":"ok","threats_detected":0}
```

**Test from Windows to Backend:**
```powershell
Invoke-WebRequest -Uri "http://192.168.1.100:8000/health"
```

---

## Part 4: TESTING PROCEDURES

### 4.1 Test SQL Injection Detection (Fedora)

```bash
# Send a test SQL injection log
curl -X POST http://192.168.1.100:8000/api/logs/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "raw_log": "SELECT * FROM users WHERE id=1 OR 1=1",
    "source": "fedora-test"
  }'
```

### 4.2 Test Brute Force Detection (Windows)

```powershell
# Simulate multiple failed login attempts
$payload = @{
    raw_log = "Failed password for admin from 192.168.1.50 port 22"
    source = "windows-test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://192.168.1.100:8000/api/logs/ingest" `
    -Method POST `
    -ContentType "application/json" `
    -Body $payload
```

### 4.3 View Blocked Threats

```bash
# Check all blocked threats
curl http://192.168.1.100:8000/api/threats/blocked-threats

# Check statistics
curl http://192.168.1.100:8000/api/threats/blocked-threats/stats
```

---

## Part 5: SYSTEM SERVICE SETUP

### 5.1 Fedora SystemD Service

Create `/etc/systemd/system/securesense-forwarder.service`:

```ini
[Unit]
Description=SecureSense Log Forwarder
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/securesense/fedora_log_forwarder.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable securesense-forwarder
sudo systemctl start securesense-forwarder
sudo systemctl status securesense-forwarder
```

### 5.2 Windows Task Scheduler

Create scheduled task:
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File C:\SecureSense\log_forwarder.ps1"

$trigger = New-ScheduledTaskTrigger -AtStartup

Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "SecureSenseForwarder" -Description "Monitor and forward logs to SecureSense"
```

---

## Part 6: CONFIGURATION FILE

Create `/opt/securesense/config.json` (Linux) or `C:\SecureSense\config.json` (Windows):

```json
{
  "backend": {
    "url": "http://192.168.1.100:8000",
    "timeout": 5
  },
  "logs": {
    "sources": ["auth.log", "syslog", "application"],
    "check_interval": 2
  },
  "alerts": {
    "email": "admin@company.com",
    "slack": "https://hooks.slack.com/...",
    "alert_on_block": true
  },
  "threat_blocking": {
    "auto_block_high_severity": true,
    "block_threshold": 6
  }
}
```

---

## Part 7: MONITORING DASHBOARD

Access the frontend from any system:
```
http://192.168.1.100:3000
```

Or run frontend on separate system:
```bash
cd securesense-frontend
npm install
npm run dev -- --host 0.0.0.0
```

---

## Part 8: INTEGRATION CHECKLIST

- [ ] Fedora backend running on accessible IP (port 8000 or 8001)
- [ ] Windows can ping Fedora backend
- [ ] Log forwarder running on Fedora
- [ ] PowerShell forwarder running on Windows
- [ ] Test logs being sent to backend
- [ ] Verify blocked threats showing in dashboard
- [ ] Firewall rules allowing traffic
- [ ] Services auto-starting on system boot

---

## Part 9: TROUBLESHOOTING

**Backend not accessible from Windows:**
```powershell
# Check connectivity
Test-NetConnection -ComputerName 192.168.1.100 -Port 8000
# Check firewall on Fedora
sudo firewall-cmd --list-all
```

**Logs not being forwarded:**
```bash
# Check forwarder is running
ps aux | grep securesense
# Check logs
sudo journalctl -u securesense-forwarder -f
```

**Threats not being detected:**
- Verify log format matches patterns
- Check threat severity threshold (default: 6)
- Verify AI model is loaded

---

## Part 10: SECURITY CONSIDERATIONS

1. **Use HTTPS in production:**
   ```bash
   python3 -m uvicorn app.main:app --ssl-keyfile key.pem --ssl-certfile cert.pem
   ```

2. **Add API authentication:**
   - Implement HTTP Basic Auth
   - Use API tokens
   - Restrict IP access

3. **Encrypt sensitive data:**
   - Store API credentials securely
   - Use environment variables
   - Rotate keys regularly

4. **Monitor the monitor:**
   - Track failed API calls
   - Alert on forwarder crashes
   - Verify log forwarding is working

---

## Contact & Support

For issues or questions, refer to the main README.md
