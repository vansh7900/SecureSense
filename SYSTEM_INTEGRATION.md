# 🔒 SecureSense Real System Integration

Complete guide to integrate SecureSense threat detection with your real Fedora and Windows systems.

## 📁 Files You Need

| File | Purpose | Platform |
|------|---------|----------|
| `QUICK_START.md` | ⭐ **START HERE** - 5-step setup guide | Both |
| `INTEGRATION_GUIDE.md` | Detailed integration reference | Both |
| `scripts/fedora_setup.sh` | Automated Fedora setup | Fedora |
| `scripts/windows_setup.bat` | Automated Windows setup | Windows |
| `scripts/test_integration.sh` | Test your integration | Both |

---

## 🎯 What You'll Get

After integration, SecureSense will:

✅ **Monitor real system logs**
- SSH authentication logs
- Windows Event Viewer
- System events
- Firewall logs

✅ **Detect threats automatically**
- SQL Injection attacks
- Brute force attempts
- DDoS patterns
- Malware signatures
- Privilege escalation
- And 5+ more threat types

✅ **Block threats instantly**
- Automatic IP blocking
- Log suspicious activity
- Alert on detection
- Display on dashboard

✅ **Show real-time dashboard**
- Live threat counter
- Blocked threats list
- Threat distribution charts
- Global attack map
- AI-powered analysis

---

## 🚀 Quick Start (Choose Your Path)

### Path A: Fully Automated (Recommended)

**On Fedora (as sudo):**
```bash
sudo bash scripts/fedora_setup.sh
# Enter your backend URL when prompted
# Service auto-starts and runs forever
```

**On Windows (as Administrator):**
```powershell
C:\>scripts\windows_setup.bat
# Enter your backend URL when prompted
# Scheduled task auto-starts on login
```

### Path B: Manual Setup

For step-by-step instructions, see **QUICK_START.md**

---

## 📊 How It Works

```
Your Systems (Fedora + Windows)
  │
  ├─ System Logs (auth.log, Event Viewer, etc.)
  │
  ▼
Log Forwarders (Python + PowerShell)
  │
  ├─ Monitor logs in real-time
  ├─ Send to backend API
  │
  ▼
SecureSense Backend (FastAPI)
  │
  ├─ Analyze logs
  ├─ Detect threats
  ├─ Block automatically
  │
  ▼
Database (In-memory)
  │
  ├─ Store blocked threats
  ├─ Maintain statistics
  │
  ▼
Web Dashboard (React)
  │
  └─ Display in real-time
```

---

## 🔌 Network Setup

**You need:**
1. Fedora system (backend)
2. Windows system (log forwarder)
3. Network connectivity between them
4. Same network or routable IPs

**Example:**
- Fedora IP: `192.168.1.100`
- Windows IP: `192.168.1.105`
- Both can ping each other ✓

---

## ✅ Pre-Integration Checklist

- [ ] Fedora has Python 3 installed
- [ ] Windows has PowerShell 5+ (included in Windows 10+)
- [ ] Both systems on same network or connected via VPN
- [ ] Fedora backend running on accessible IP:port
- [ ] Firewall ports open (8000, 3000)
- [ ] Read access to system logs (may need sudo)

---

## 🎬 Getting Started Now

### Step 1: Read QUICK_START.md
```bash
less QUICK_START.md
# or
cat QUICK_START.md | less
```

### Step 2: Get System IPs
```bash
# On Fedora
hostname -I

# On Windows (PowerShell)
ipconfig
```

### Step 3: Run Setup Script
```bash
# Fedora
sudo bash scripts/fedora_setup.sh

# Windows
C:\>scripts\windows_setup.bat
```

### Step 4: Verify
```bash
bash scripts/test_integration.sh
```

### Step 5: Monitor
See real-time threats in dashboard:
```
http://192.168.1.100:3000
```

---

## 📚 Documentation Map

```
QUICK_START.md
├─ 5-step quick setup
├─ Real-world scenarios
├─ Troubleshooting
└─ Monitoring guide

INTEGRATION_GUIDE.md
├─ Detailed Fedora setup
├─ Detailed Windows setup
├─ Network configuration
├─ System services
├─ Security best practices
└─ Full reference

scripts/
├─ fedora_setup.sh (automated)
├─ windows_setup.bat (automated)
├─ test_integration.sh (verification)
└─ (Python/PowerShell forwarders inside)
```

---

## 🔥 This Week's Workflow

**Day 1:**
- [ ] Read QUICK_START.md
- [ ] Get system IPs
- [ ] Start Fedora backend

**Day 2:**
- [ ] Run Fedora setup script
- [ ] Run Windows setup script
- [ ] Verify both forwarders running

**Day 3:**
- [ ] Test with test_integration.sh
- [ ] Access dashboard
- [ ] Monitor real logs

**Day 4+:**
- [ ] Watch threats being blocked
- [ ] Fine-tune detection rules
- [ ] Set up alerting (optional)

---

## 💡 Pro Tips

**For testing without real threats:**
```bash
# Use the test script to inject fake threat logs
bash scripts/test_integration.sh

# Send custom logs via curl
curl -X POST http://192.168.1.100:8000/api/logs/ingest \
  -H "Content-Type: application/json" \
  -d '{"raw_log":"your log here","source":"test"}'
```

**For production monitoring:**
```bash
# Keep forwarder logs open
sudo journalctl -u securesense-forwarder -f

# Check blocked threats
curl http://192.168.1.100:8000/api/threats/blocked-threats/stats
```

**For debugging:**
```bash
# Test connectivity between systems
ping 192.168.1.100

# Check API endpoint
curl http://192.168.1.100:8000/health

# Verify forwarder logs
sudo tail -f /var/log/securesense/forwarder.log
```

---

## 🆘 Something Not Working?

1. **Backend not starting?**
   ```bash
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   # Check for port conflicts or missing dependencies
   ```

2. **Cannot connect from Windows?**
   ```powershell
   Test-NetConnection -ComputerName 192.168.1.100 -Port 8000
   # Check firewall on Fedora
   ```

3. **Logs not being forwarded?**
   ```bash
   # Check forwarder status
   sudo systemctl status securesense-forwarder
   # Check logs
   sudo journalctl -u securesense-forwarder
   ```

4. **Still stuck?**
   - Check INTEGRATION_GUIDE.md troubleshooting section
   - Review script output for errors
   - Verify network connectivity

---

## 📞 Quick Links

- **API Docs:** http://192.168.1.100:8000/docs
- **Dashboard:** http://192.168.1.100:3000
- **Health Check:** http://192.168.1.100:8000/health
- **Blocked Threats:** http://192.168.1.100:8000/api/threats/blocked-threats

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Backend shows: `INFO: Uvicorn running on 0.0.0.0:8000`

✅ Forwarder shows: `[2026-04-15 12:34:56] [INFO] SecureSense Log Forwarder started`

✅ Dashboard shows: List of recent threats and blocked threats counter

✅ Logs show: Real system events like failed logins, firewall alerts

✅ Test shows: `✅ SQL Injection detected`, `✅ Brute Force detected`

---

## 📖 Next Steps

1. **Start here:** `QUICK_START.md`
2. **Detailed setup:** `INTEGRATION_GUIDE.md`
3. **Automated setup:** `scripts/fedora_setup.sh` and `scripts/windows_setup.bat`
4. **Verify:** `scripts/test_integration.sh`

Happy secure sensing! 🛡️🔒

---

*Last updated: April 15, 2026*
*SecureSense v2.4.1*
