@echo off
REM SecureSense Windows Setup Script
REM Run as Administrator

echo ═══════════════════════════════════════════════════════
echo   SecureSense Windows Integration Setup
echo ═══════════════════════════════════════════════════════
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator
    pause
    exit /b 1
)

REM Get backend URL
setlocal enabledelayedexpansion
set /p BACKEND_URL="Enter backend URL (default: http://127.0.0.1:8000): "
if "!BACKEND_URL!"=="" set BACKEND_URL=http://127.0.0.1:8000

echo.
echo Creating directories...
if not exist "C:\SecureSense" mkdir C:\SecureSense
if not exist "C:\SecureSense\logs" mkdir C:\SecureSense\logs
echo Created C:\SecureSense

echo.
echo Creating log forwarder script...

(
echo # SecureSense Windows Log Forwarder
echo param(
echo     [string]$BackendUrl = "!BACKEND_URL!",
echo     [string]$LogDir = "C:\SecureSense\logs"
echo )
echo.
echo $logFile = "$LogDir\forwarder.log"
echo.
echo function Write-Log {
echo     param([string]$Message)
echo     $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
echo     $logMsg = "[$timestamp] $Message"
echo     Write-Host $logMsg
echo     Add-Content -Path $logFile -Value $logMsg
echo }
echo.
echo function Send-LogToBackend {
echo     param(
echo         [string]$LogLine,
echo         [string]$Source
echo     )
echo.
echo     try {
echo         $payload = @{
echo             raw_log = $LogLine
echo             source = $Source
echo             timestamp = (Get-Date -Format o)
echo         } ^| ConvertTo-Json
echo.
echo         $response = Invoke-WebRequest -Uri "$BackendUrl/api/logs/ingest" `
echo             -Method POST `
echo             -ContentType "application/json" `
echo             -Body $payload `
echo             -TimeoutSec 5
echo.
echo         if ($response.StatusCode -eq 200) {
echo             $result = $response.Content ^| ConvertFrom-Json
echo             if ($result.status -eq "threat_detected") {
echo                 $threat = $result.threat
echo                 Write-Log "^^!^^! THREAT: $($threat.prediction) (Severity: $($threat.analysis.severity_score))"
echo                 if ($threat.blocked) {
echo                     Write-Log "BLOCKED: $($threat.prediction)"
echo                 }
echo             }
echo         }
echo     }
echo     catch {
echo         Write-Log "Error: $_"
echo     }
echo }
echo.
echo function Monitor-EventLogs {
echo     Write-Log "SecureSense Forwarder started (Backend: $BackendUrl)"
echo.
echo     while ($true) {
echo         try {
echo             $lastMinute = (Get-Date).AddMinutes(-1)
echo.
echo             # Security Log
echo             Get-EventLog -LogName Security -After $lastMinute -ErrorAction SilentlyContinue ^| ForEach-Object {
echo                 $logEntry = "[$($_.EventID)] $($_.Source): $($_.Message)"
echo                 Send-LogToBackend -LogLine $logEntry -Source "windows-security"
echo             }
echo.
echo             # System Log
echo             Get-EventLog -LogName System -After $lastMinute -ErrorAction SilentlyContinue ^| ForEach-Object {
echo                 $logEntry = "[$($_.EventID)] $($_.Source): $($_.Message)"
echo                 Send-LogToBackend -LogLine $logEntry -Source "windows-system"
echo             }
echo.
echo             # Application Log
echo             Get-EventLog -LogName Application -After $lastMinute -ErrorAction SilentlyContinue ^| ForEach-Object {
echo                 $logEntry = "[$($_.EventID)] $($_.Source): $($_.Message)"
echo                 Send-LogToBackend -LogLine $logEntry -Source "windows-application"
echo             }
echo         }
echo         catch {
echo             Write-Log "Error reading event logs: $_"
echo         }
echo.
echo         Start-Sleep -Seconds 2
echo     }
echo }
echo.
echo Monitor-EventLogs
) > C:\SecureSense\log_forwarder.ps1

echo Created C:\SecureSense\log_forwarder.ps1

echo.
echo Configuring PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" >nul 2>&1
echo Configured execution policy

echo.
echo Creating Windows Firewall rules...
netsh advfirewall firewall add rule name="SecureSense Backend" dir=out action=allow protocol=tcp remoteport=8000 >nul 2>&1
netsh advfirewall firewall add rule name="SecureSense Backend Alt" dir=out action=allow protocol=tcp remoteport=8001 >nul 2>&1
netsh advfirewall firewall add rule name="SecureSense Frontend" dir=out action=allow protocol=tcp remoteport=3000 >nul 2>&1
echo Added firewall rules

echo.
echo Creating scheduled task...
(
echo ^<?xml version="1.0" encoding="UTF-16"?^>
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
echo   ^<RegistrationInfo^>
echo     ^<Date^>2026-04-15T12:00:00^</Date^>
echo     ^<Description^>SecureSense Log Forwarder - Monitors system logs and sends to backend^</Description^>
echo   ^</RegistrationInfo^>
echo   ^<Triggers^>
echo     ^<LogonTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo       ^<UserId^>NT AUTHORITY\SYSTEM^</UserId^>
echo     ^</LogonTrigger^>
echo   ^</Triggers^>
echo   ^<Principals^>
echo     ^<Principal id="Author"^>
echo       ^<UserId^>NT AUTHORITY\SYSTEM^</UserId^>
echo       ^<RunLevel^>HighestAvailable^</RunLevel^>
echo     ^</Principal^>
echo   ^</Principals^>
echo   ^<Settings^>
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^>
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^>
echo   ^</Settings^>
echo   ^<Actions Context="Author"^>
echo     ^<Exec^>
echo       ^<Command^>powershell.exe^</Command^>
echo       ^<Arguments^>-NoProfile -WindowStyle Hidden -File C:\SecureSense\log_forwarder.ps1^</Arguments^>
echo     ^</Exec^>
echo   ^</Actions^>
echo ^</Task^>
) > C:\SecureSense\SecureSenseForwarder.xml

schtasks /create /tn "SecureSenseForwarder" /xml C:\SecureSense\SecureSenseForwarder.xml /f >nul 2>&1
echo Created scheduled task

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Get your Fedora system IP (run: hostname -I on Fedora)
echo 2. Edit the backend URL in scheduled task if needed
echo 3. Manually start: powershell -File C:\SecureSense\log_forwarder.ps1
echo 4. Or wait for system reboot to auto-start
echo 5. Check logs: C:\SecureSense\logs\forwarder.log
echo.
echo Backend URL configured: !BACKEND_URL!
echo.
pause
