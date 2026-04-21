import { useMemo, useEffect, useRef } from "react";

const STL = `
  @keyframes tl-entry {
    from { opacity:0; transform: translateX(-10px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes tl-dot-ping {
    0%   { transform: scale(1); opacity:1; }
    60%  { transform: scale(2.2); opacity:0; }
    100% { transform: scale(1); opacity:0; }
  }
  .tl-row {
    display: flex; align-items: center; gap:10px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(0,180,255,0.05);
    animation: tl-entry 0.3s ease both;
    transition: background 0.16s;
    border-radius: 4px;
    cursor: default;
  }
  .tl-row:hover {
    background: rgba(0,180,255,0.04);
    padding-left: 4px;
  }
  .tl-dot-wrap {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    width: 16px; height: 16px;
  }
  .tl-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    position: relative; z-index: 1;
  }
  .tl-dot-ping {
    position: absolute; inset: 0;
    border-radius: 50%;
    animation: tl-dot-ping 2s ease-out infinite;
  }
  .tl-label {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-bright);
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tl-time {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--muted);
    flex-shrink: 0;
  }
  .tl-score-bar {
    height: 3px; border-radius: 2px;
    width: 36px; flex-shrink: 0;
    opacity: 0.7;
    transition: width 0.4s ease, opacity 0.16s;
  }
  .tl-row:hover .tl-score-bar { opacity: 1; }
  .tl-empty {
    text-align: center;
    padding: 30px 0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.14em;
  }
`;

function getColor(score) {
  if (score > 7) return "#ff2d6b";
  if (score > 4) return "#ffaa00";
  return "#00ffd5";
}

export default function AttackTimeline({ threats = [] }) {
  const scrollRef = useRef(null);

  const data = useMemo(() =>
    threats.slice(0, 20).map((t, i) => ({
      type:  t.prediction || "Unknown",
      score: t.analysis?.severity_score || 0,
      time:  new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      delay: i * 40,
    }))
  , [threats]);

  // Auto-scroll new threats to the top
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [threats.length]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STL }} />
      <div style={{ height:"100%", overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div ref={scrollRef} style={{ overflowY:"auto", flex:1, paddingRight:4, scrollbarWidth:"thin", scrollbarColor:"var(--border2) transparent" }}>
          {data.map((item, i) => {
            const c = getColor(item.score);
            const barW = Math.max(4, Math.min(36, item.score * 3.6));
            return (
              <div className="tl-row" key={i} style={{ animationDelay: `${item.delay}ms` }}>
                {/* Dot + ping */}
                <div className="tl-dot-wrap">
                  <div className="tl-dot-ping" style={{ background: c, opacity: item.score > 7 ? 1 : 0.4 }}/>
                  <div className="tl-dot" style={{ background: c, boxShadow: `0 0 8px ${c}` }}/>
                </div>

                {/* Label */}
                <div className="tl-label" title={item.type}>{item.type}</div>

                {/* Score bar */}
                <div className="tl-score-bar" style={{ width: barW, background: c, boxShadow: `0 0 4px ${c}80` }}/>

                {/* Time */}
                <div className="tl-time">{item.time}</div>
              </div>
            );
          })}

          {data.length === 0 && (
            <div className="tl-empty">NO ATTACKS DETECTED</div>
          )}
        </div>
      </div>
    </>
  );
}