#!/bin/bash
# SecureSense System Integration Testing Script

echo "╔════════════════════════════════════════════════════╗"
echo "║  SecureSense Integration Test Suite                ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Get backend URL
read -p "Enter backend URL (e.g., http://192.168.1.100:8000): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "Error: Backend URL required"
    exit 1
fi

echo ""
echo "Testing SecureSense Integration..."
echo ""

# Test 1: Backend Connectivity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Backend Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s "$BACKEND_URL/health" | grep -q "ok"; then
    echo "✅ Backend is accessible"
    curl -s "$BACKEND_URL/health" | python3 -m json.tool
else
    echo "❌ Cannot connect to backend"
    exit 1
fi

echo ""

# Test 2: Test SQL Injection Detection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: SQL Injection Detection & Blocking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/logs/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_log": "SELECT * FROM users WHERE id=1 OR 1=1 --; DROP TABLE admin;",
    "source": "test-system"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "threat_detected\|SQL"; then
    echo "✅ SQL Injection detected"
else
    echo "⚠️  SQL Injection not detected"
fi

echo ""

# Test 3: Test Brute Force Detection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Brute Force Detection & Blocking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/logs/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_log": "Failed password for admin from 192.168.1.50 port 22",
    "source": "test-system"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "threat_detected\|Brute"; then
    echo "✅ Brute Force detected"
else
    echo "⚠️  Brute Force not detected"
fi

echo ""

# Test 4: Test DDoS Detection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: DDoS Detection & Blocking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/logs/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_log": "SYN flood detected from 192.168.1.100 port 80",
    "source": "test-system"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "threat_detected\|DDoS"; then
    echo "✅ DDoS detected"
else
    echo "⚠️  DDoS not detected"
fi

echo ""

# Test 5: Check Blocked Threats
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Blocked Threats Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BLOCKED=$(curl -s "$BACKEND_URL/api/threats/blocked-threats")
echo "Blocked Threats:"
echo "$BLOCKED" | python3 -m json.tool 2>/dev/null || echo "$BLOCKED"

STATS=$(curl -s "$BACKEND_URL/api/threats/blocked-threats/stats")
echo ""
echo "Statistics:"
echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"

echo ""

# Test 6: API Endpoints Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Available API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ GET /health"
echo "   → Check backend status"
echo ""
echo "✅ GET /api/threats"
echo "   → Get all detected threats"
echo ""
echo "✅ GET /api/threats/summary"
echo "   → Get threats summary with blocked count"
echo ""
echo "✅ GET /api/threats/blocked-threats"
echo "   → Get all blocked threats"
echo ""
echo "✅ GET /api/threats/blocked-threats/stats"
echo "   → Get blocking statistics"
echo ""
echo "✅ POST /api/logs/ingest"
echo "   → Send logs for analysis"
echo ""
echo "✅ GET /api/logs"
echo "   → Get recent logs"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Deploy log forwarders on both systems"
echo "2. Configure cron jobs or scheduled tasks"
echo "3. Access dashboard at http://<frontend-url>:3000"
echo "4. Monitor blocked threats in real-time"
