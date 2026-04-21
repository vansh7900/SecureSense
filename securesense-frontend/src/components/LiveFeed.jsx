import { useEffect, useRef, useState } from "react";

const STL = `
  @keyframes lf-slide-in {
    from { opacity:0; transform: translateX(24px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes lf-flash {
    0%   { background: rgba(34,211,238,0.14); border-color: rgba(34,211,238,0.35); }
    100% { background: transparent; border-color: transparent; }
  }
  @keyframes lf-dot-pulse {
    0%,100% { transform: scale(1);    opacity: 1; }
    50%     { transform: scale(1.35); opacity: 0.7; }
  }

  .lf-row {
    display: flex; align-items: flex-start; gap:12px;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid transparent;
    animation: lf-slide-in 0.28s ease both;
    cursor: default;
    transition: border-color 0.18s, background 0.18s;
    position: relative; overflow: hidden;
  }
  .lf-row:first-child {
    animation: lf-flash 1.4s ease-out;
  }
  .lf-row:hover {
    border-color: rgba(34,211,238,0.18);
    background: rgba(34,211,238,0.04);
  }

  /* Hover left accent */
  .lf-row::before {
    content: '';
    position: absolute; left: 0; top: 20%; bottom: 20%; width: 2px;
    background: linear-gradient(180deg, transparent, #22d3ee, transparent);
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .lf-row:hover::before { opacity: 1; }

  .lf-dot {
    width:9px; height:9px; border-radius:50%; flex-shrink:0; margin-top:4px;
  }

  .lf-body { flex:1; min-width:0; }

  .lf-type {
    font-family: var(--font-mono); font-size: 11.5px;
    color: var(--text-bright); letter-spacing: 0.04em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 3px; font-weight: 600;
  }
  .lf-meta { display:flex; gap:8px; align-items:center; }
  .lf-ip {
    font-family: var(--font-mono); font-size: 10px; color: #22d3ee;
    text-shadow: 0 0 8px rgba(34,211,238,0.4);
  }
  .lf-score {
    font-family: var(--font-mono); font-size: 9px; padding: 2px 7px;
    border-radius: 4px; font-weight: 700;
  }
  .lf-time {
    font-family: var(--font-mono); font-size: 9px; color: var(--muted);
    margin-left: auto; flex-shrink: 0;
  }
  .lf-empty {
    text-align:center; padding:36px 0;
    font-family: var(--font-mono); font-size: 10px;
    color: rgba(16,255,197,0.4); letter-spacing: 0.18em;
    text-transform: uppercase;
    text-shadow: 0 0 12px rgba(16,255,197,0.3);
  }
  .lf-header {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:12px; flex-shrink:0;
  }
  .lf-stream-label {
    font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.20em;
    color: rgba(34,211,238,0.55); text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
  }
  .lf-stream-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22d3ee; box-shadow: 0 0 10px #22d3ee;
    animation: lf-dot-pulse 1.8s ease-in-out infinite;
  }
  .lf-count-badge {
    font-family: var(--font-mono); font-size: 9px;
    color: var(--muted); background: rgba(34,211,238,0.07);
    border: 1px solid rgba(34,211,238,0.15); border-radius: 5px;
    padding: 2px 9px; letter-spacing: 0.10em;
  }
  .lf-new-badge {
    font-family: var(--font-mono); font-size: 8px; font-weight: 800;
    letter-spacing: 0.16em; color: #10ffc5;
    background: rgba(16,255,197,0.10); border: 1px solid rgba(16,255,197,0.30);
    border-radius: 12px; padding: 2px 9px; text-transform: uppercase;
    display: flex; align-items: center; gap: 5px;
    text-shadow: 0 0 10px rgba(16,255,197,0.6);
    box-shadow: 0 0 12px rgba(16,255,197,0.12);
  }
`;

function getColor(score) {
  if (score > 7) return "#ff4d6d";
  if (score > 4) return "#fbbf24";
  return "#10ffc5";
}
function getScoreStyle(score) {
  if (score > 7) return {
    background:"rgba(255,77,109,0.14)", color:"#ff4d6d",
    border:"1px solid rgba(255,77,109,0.30)",
    boxShadow: "0 0 8px rgba(255,77,109,0.25)"
  };
  if (score > 4) return {
    background:"rgba(251,191,36,0.12)", color:"#fbbf24",
    border:"1px solid rgba(251,191,36,0.28)",
    boxShadow: "0 0 8px rgba(251,191,36,0.2)"
  };
  return {
    background:"rgba(16,255,197,0.10)", color:"#10ffc5",
    border:"1px solid rgba(16,255,197,0.25)",
    boxShadow: "0 0 8px rgba(16,255,197,0.2)"
  };
}

export default function LiveFeed({ threats = [] }) {
  const scrollRef = useRef(null);
  const prevLen = useRef(0);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const delta = threats.length - prevLen.current;
    if (delta > 0) {
      setNewCount(delta);
      const t = setTimeout(() => setNewCount(0), 2600);
      return () => clearTimeout(t);
    }
    prevLen.current = threats.length;
  }, [threats.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [threats.length]);

  const items = threats.slice(0, 15);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STL }} />
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
        <div className="lf-header">
          <div className="lf-stream-label">
            <span className="lf-stream-dot"/>
            Stream · {threats.length} events
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {newCount > 0 && (
              <div className="lf-new-badge">
                <span style={{ width:5,height:5,borderRadius:"50%",background:"#10ffc5",display:"inline-block",boxShadow:"0 0 8px #10ffc5" }}/>
                +{newCount} NEW
              </div>
            )}
            <span className="lf-count-badge">LAST {items.length}</span>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:5,
          scrollbarWidth:"thin", scrollbarColor:"rgba(34,211,238,0.2) transparent" }}>
          {items.map((t, i) => {
            const score = t?.analysis?.severity_score ?? 0;
            const c = getColor(score);
            return (
              <div className="lf-row" key={i} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="lf-dot" style={{ background: c, boxShadow: `0 0 10px ${c}, 0 0 4px ${c}` }}/>
                <div className="lf-body">
                  <div className="lf-type">{t.prediction || "Unknown"}</div>
                  <div className="lf-meta">
                    <span className="lf-ip">{t.source_ip || "—"}</span>
                    <span className="lf-score" style={getScoreStyle(score)}>{score.toFixed ? score.toFixed(1) : score}</span>
                    <span className="lf-time">{new Date().toLocaleTimeString("en-US", { hour12:false })}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="lf-empty">◈ &nbsp; NO LIVE EVENTS &nbsp; ◈</div>}
        </div>
      </div>
    </>
  );
}