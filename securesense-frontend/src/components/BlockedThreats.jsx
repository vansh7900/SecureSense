import { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

const BTL = `
  @keyframes bt-slide-in {
    from { opacity:0; transform: translateX(-20px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes bt-pulse {
    0%,100% { opacity:1; }
    50% { opacity:0.7; }
  }

  .bt-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 12px;
  }

  .bt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    margin-bottom: 4px;
  }

  .bt-title {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #ff4d6d;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 0 12px rgba(255,77,109,0.4);
  }

  .bt-shield-icon {
    width: 16px;
    height: 16px;
    border: 1.5px solid #ff4d6d;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #ff4d6d;
    animation: bt-pulse 2s ease-in-out infinite;
  }

  .bt-count {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: #ff4d6d;
    background: rgba(255,77,109,0.15);
    border: 1px solid rgba(255,77,109,0.3);
    border-radius: 6px;
    padding: 4px 10px;
    letter-spacing: 0.08em;
    box-shadow: 0 0 12px rgba(255,77,109,0.2);
  }

  .bt-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,77,109,0.3) transparent;
  }

  .bt-item {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
    border: 1.5px solid rgba(255,77,109,0.3);
    border-radius: 8px;
    background: rgba(255,77,109,0.05);
    animation: bt-slide-in 0.3s ease both;
    transition: all 0.2s;
  }

  .bt-item:hover {
    border-color: #ff4d6d;
    background: rgba(255,77,109,0.12);
    box-shadow: 0 0 16px rgba(255,77,109,0.25);
  }

  .bt-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .bt-threat-type {
    font-family: Syne, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #ff4d6d;
    text-shadow: 0 0 8px rgba(255,77,109,0.3);
  }

  .bt-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    padding: 3px 8px;
    border-radius: 4px;
    color: white;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .bt-badge-high {
    background: #ff4d6d;
    box-shadow: 0 0 10px rgba(255,77,109,0.5);
  }

  .bt-badge-medium {
    background: #fbbf24;
    color: #1f2937;
    box-shadow: 0 0 10px rgba(251,191,36,0.4);
  }

  .bt-badge-low {
    background: #22d3ee;
    color: #0c4a6e;
    box-shadow: 0 0 10px rgba(34,211,238,0.4);
  }

  .bt-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
  }

  .bt-ip {
    color: #ff4d6d;
    text-shadow: 0 0 8px rgba(255,77,109,0.3);
    font-weight: 600;
  }

  .bt-score {
    display: flex;
    align-items: center;
    gap: 4px;
    color: rgba(255,77,109,0.7);
  }

  .bt-time {
    color: rgba(255,77,109,0.5);
    flex-shrink: 0;
  }

  .bt-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-family: var(--font-mono);
    font-size: 10px;
    color: rgba(255,77,109,0.3);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .bt-action {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    font-weight: 800;
    color: #10ffc5;
    background: rgba(16,255,197,0.08);
    border: 1px solid rgba(16,255,197,0.3);
    border-radius: 4px;
    padding: 3px 7px;
    letter-spacing: 0.1em;
  }
`;

function getConfidenceBadge(confidence) {
  const conf = confidence || "LOW";
  let className = "bt-badge";
  if (conf === "HIGH") className += " bt-badge-high";
  else if (conf === "MEDIUM") className += " bt-badge-medium";
  else className += " bt-badge-low";
  return className;
}

function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "—";
  }
}

export default function BlockedThreats() {
  const [blockedThreats, setBlockedThreats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedThreats = async () => {
      try {
        const [threatsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/threats/blocked-threats`),
          fetch(`${API_BASE}/threats/blocked-threats/stats`)
        ]);

        if (threatsRes.ok) {
          const data = await threatsRes.json();
          setBlockedThreats(data.blocked_threats || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching blocked threats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedThreats();
    const interval = setInterval(fetchBlockedThreats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const displayItems = blockedThreats.slice(0, 8);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BTL }} />
      <div className="bt-container">
        <div className="bt-header">
          <div className="bt-title">
            <div className="bt-shield-icon">🛡</div>
            BLOCKED THREATS
          </div>
          <div className="bt-count">{blockedThreats.length} BLOCKED</div>
        </div>

        <div className="bt-list">
          {loading && <div className="bt-empty">LOADING...</div>}
          
          {!loading && displayItems.length === 0 && (
            <div className="bt-empty">✓ NO THREATS BLOCKED</div>
          )}

          {!loading && displayItems.map((threat, idx) => (
            <div className="bt-item" key={threat.id || idx} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="bt-row">
                <div className="bt-threat-type">{threat.threat_type}</div>
                <div className={getConfidenceBadge(threat.details?.confidence)}>
                  <span>●</span>
                  {threat.details?.confidence || "LOW"}
                </div>
              </div>
              
              <div className="bt-meta">
                <span className="bt-ip">📍 {threat.source_ip}</span>
                <span className="bt-score">
                  <span>●</span>
                  {threat.severity_score?.toFixed ? threat.severity_score.toFixed(1) : threat.severity_score}/10
                </span>
                <span className="bt-time">{formatTime(threat.timestamp)}</span>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div className="bt-action">⊗ BLOCKED</div>
                {threat.details?.raw_log && (
                  <span style={{ fontSize: "9px", color: "rgba(255,77,109,0.5)", fontFamily: "var(--font-mono)" }}>
                    {threat.details.raw_log.substring(0, 45)}...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        {stats && (
          <div style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,77,109,0.2)",
            fontSize: "9px",
            color: "rgba(255,77,109,0.6)",
            fontFamily: "var(--font-mono)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8
          }}>
            <div>HIGH: <span style={{ color: "#ff4d6d", fontWeight: 700 }}>{stats.by_severity?.HIGH || 0}</span></div>
            <div>MED: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{stats.by_severity?.MEDIUM || 0}</span></div>
          </div>
        )}
      </div>
    </>
  );
}
