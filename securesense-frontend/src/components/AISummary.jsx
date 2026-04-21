import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";

const STL = `
  @keyframes typewriter-cursor {
    0%,100% { opacity:1; } 50% { opacity:0; }
  }
  @keyframes shimmer-sweep {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes threat-ring {
    0%   { transform: scale(1); opacity:0.8; }
    50%  { transform: scale(1.15); opacity:0.4; }
    100% { transform: scale(1); opacity:0.8; }
  }
  .ais-loading-text {
    background: linear-gradient(90deg,
      var(--muted) 0%, var(--accent) 40%, var(--accent2) 60%, var(--muted) 100%);
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer-sweep 2s linear infinite;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
  }
  .ais-cursor {
    display: inline-block;
    width: 2px; height: 13px;
    background: var(--accent);
    border-radius: 1px;
    vertical-align: middle;
    animation: typewriter-cursor 0.8s steps(1) infinite;
    margin-left: 2px;
  }
  .ais-stat {
    display: flex; flex-direction: column; align-items: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 8px 14px;
    min-width: 58px;
    transition: border-color 0.22s, transform 0.22s;
  }
  .ais-stat:hover { border-color: var(--border2); transform: translateY(-1px); }
  .ais-stat-val {
    font-family: var(--font-head);
    font-size: 20px; font-weight: 700; line-height: 1;
  }
  .ais-stat-lbl {
    font-family: var(--font-mono);
    font-size: 8px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted);
    margin-top: 3px;
  }
`;

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef({ text: "", i: 0, timer: null });

  useEffect(() => {
    const s = ref.current;
    clearInterval(s.timer);
    if (!text) { setDisplayed(""); setDone(false); return; }
    s.text = text; s.i = 0;
    setDisplayed(""); setDone(false);
    s.timer = setInterval(() => {
      s.i++;
      setDisplayed(s.text.slice(0, s.i));
      if (s.i >= s.text.length) { clearInterval(s.timer); setDone(true); }
    }, speed);
    return () => clearInterval(s.timer);
  }, [text]);

  return { displayed, done };
}

export default function AISummary({ threats }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const { displayed, done } = useTypewriter(summary);

  const highCount = threats.filter(t => (t?.analysis?.severity_score ?? 0) > 7).length;
  const medCount  = threats.filter(t => { const s = t?.analysis?.severity_score ?? 0; return s > 4 && s <= 7; }).length;
  const lowCount  = threats.filter(t => (t?.analysis?.severity_score ?? 0) <= 4).length;

  useEffect(() => {
    if (!threats.length) return;
    setLoading(true);
    axios.post(`${API_BASE}/ai-summary`, { threats })
      .then(res => { setSummary(res.data.summary); setLoading(false); })
      .catch(() => { setSummary("Unable to fetch AI summary. Backend may be offline."); setLoading(false); });
  }, [threats]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STL }} />

      {/* Threat stats row */}
      <div style={{ display:"flex", gap:8, marginBottom:10, flexShrink:0 }}>
        <div className="ais-stat">
          <span className="ais-stat-val" style={{ color:"var(--danger)", textShadow:"0 0 12px rgba(255,45,107,0.5)" }}>
            {highCount}
          </span>
          <span className="ais-stat-lbl">Critical</span>
        </div>
        <div className="ais-stat">
          <span className="ais-stat-val" style={{ color:"var(--warn)", textShadow:"0 0 12px rgba(255,170,0,0.4)" }}>
            {medCount}
          </span>
          <span className="ais-stat-lbl">Medium</span>
        </div>
        <div className="ais-stat">
          <span className="ais-stat-val" style={{ color:"var(--safe)", textShadow:"0 0 12px rgba(0,255,213,0.4)" }}>
            {lowCount}
          </span>
          <span className="ais-stat-lbl">Low</span>
        </div>
        <div className="ais-stat" style={{ flex:1 }}>
          <span className="ais-stat-val" style={{ color:"var(--text-bright)" }}>{threats.length}</span>
          <span className="ais-stat-lbl">Total</span>
        </div>
      </div>

      {/* Summary text */}
      <div style={{
        flex:1, overflowY:"auto",
        fontFamily:"var(--font-mono)", fontSize:"11.5px",
        color:"var(--text)", lineHeight:1.75,
        paddingRight: 2,
        scrollbarWidth:"thin",
        scrollbarColor:"var(--border2) transparent"
      }}>
        {loading ? (
          <span className="ais-loading-text">SCANNING THREAT INTELLIGENCE DATABASE…</span>
        ) : summary ? (
          <>
            {displayed}
            {!done && <span className="ais-cursor"/>}
          </>
        ) : (
          <span style={{ color:"var(--muted)", fontSize:"10px", letterSpacing:"0.1em" }}>
            AWAITING THREAT DATA — CONNECT TO BACKEND
          </span>
        )}
      </div>
    </>
  );
}