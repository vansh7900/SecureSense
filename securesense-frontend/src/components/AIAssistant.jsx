import { useState, useRef, useEffect } from "react";
import axios from "axios";

const STL = `
  @keyframes msgIn {
    from { opacity:0; transform:translateY(12px) scale(0.94); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes blink {
    0%,80%,100% { opacity:0; transform: scale(0.7); }
    40%         { opacity:1; transform: scale(1); }
  }
  @keyframes ai-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(129,140,248,0), 0 0 8px rgba(34,211,238,0); }
    50%     { box-shadow: 0 0 0 5px rgba(129,140,248,0.12), 0 0 16px rgba(34,211,238,0.2); }
  }
  @keyframes typing-pulse {
    0%,100% { opacity: 0.6; }
    50%     { opacity: 1; }
  }

  .ai-wrap {
    display: flex; flex-direction: column; height: 100%; min-height: 0;
    background: transparent;
  }

  /* Quick prompts */
  .ai-quick-row {
    display: flex; gap: 7px; flex-wrap: wrap;
    margin-bottom: 12px; flex-shrink: 0;
  }
  .ai-quick-btn {
    font-family: var(--font-mono); font-size: 9.5px;
    letter-spacing: 0.07em; cursor: pointer;
    border: 1px solid rgba(34,211,238,0.22);
    background: rgba(34,211,238,0.06);
    color: rgba(34,211,238,0.65); padding: 5px 12px;
    border-radius: 20px; transition: all 0.18s;
    white-space: nowrap;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .ai-quick-btn:hover:not(:disabled) {
    color: #22d3ee; border-color: #22d3ee;
    background: rgba(34,211,238,0.14);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(34,211,238,0.22);
  }
  .ai-quick-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Scroll container */
  .ai-scroll {
    flex: 1; overflow-y: auto; padding: 4px 2px 10px;
    display: flex; flex-direction: column; gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(34,211,238,0.2) transparent;
  }

  /* Message groups */
  .ai-msg-group { display: flex; flex-direction: column; gap: 4px; }

  /* Labels */
  .ai-label-system {
    font-family: var(--font-mono); font-size: 8px;
    letter-spacing: 0.20em; text-transform: uppercase;
    color: rgba(34,211,238,0.55); display: flex; align-items: center; gap: 7px;
  }
  .ai-label-user {
    font-family: var(--font-mono); font-size: 8px;
    letter-spacing: 0.20em; text-transform: uppercase;
    color: rgba(167,139,250,0.70); display: flex; align-items: center; gap: 7px;
    justify-content: flex-end;
  }
  .ai-label-icon {
    width: 16px; height: 16px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 7px; flex-shrink: 0;
  }
  .ai-label-icon.system {
    background: rgba(34,211,238,0.14); border: 1px solid rgba(34,211,238,0.30);
    animation: ai-pulse 3s ease-in-out infinite;
    color: #22d3ee;
  }
  .ai-label-icon.user {
    background: rgba(167,139,250,0.14); border: 1px solid rgba(167,139,250,0.28);
  }

  /* User bubble */
  .ai-bubble-user {
    background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(167,139,250,0.12), rgba(34,211,238,0.06));
    border: 1px solid rgba(99,102,241,0.32);
    border-radius: 16px 16px 3px 16px;
    padding: 11px 16px; margin-left: auto; max-width: 86%;
    font-family: var(--font-ui); font-size: 12.5px;
    color: var(--text-bright); line-height: 1.65;
    animation: msgIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    position: relative; overflow: hidden;
    box-shadow: 0 0 20px rgba(99,102,241,0.16);
  }
  .ai-bubble-user::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(129,140,248,0.7), rgba(34,211,238,0.4), transparent);
  }

  /* Bot bubble */
  .ai-bubble-bot {
    background: rgba(8,10,20,0.75);
    border: 1px solid rgba(34,211,238,0.12);
    border-radius: 16px 16px 16px 3px;
    padding: 11px 16px; max-width: 94%;
    font-family: var(--font-mono); font-size: 11.5px;
    color: var(--text); line-height: 1.8;
    animation: msgIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    white-space: pre-wrap;
    position: relative;
    box-shadow: 0 0 20px rgba(34,211,238,0.06);
  }
  .ai-bubble-bot::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, rgba(34,211,238,0.3), rgba(99,102,241,0.2), transparent);
  }
  .ai-bubble-bot::after {
    content: attr(data-time);
    display: block; margin-top: 7px;
    font-size: 8px; color: rgba(34,211,238,0.35);
    letter-spacing: 0.10em;
  }

  /* Typing indicator */
  .ai-typing-row {
    display: flex; gap: 6px; align-items: center;
    padding: 12px 16px;
  }
  .ai-typing-dot {
    display: inline-block; width: 6px; height: 6px;
    border-radius: 50%; background: #22d3ee;
    box-shadow: 0 0 8px #22d3ee;
    animation: blink 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ai-typing-dot:nth-child(2) { animation-delay: 0.20s; background: #818cf8; box-shadow: 0 0 8px #818cf8; }
  .ai-typing-dot:nth-child(3) { animation-delay: 0.40s; background: #a78bfa; box-shadow: 0 0 8px #a78bfa; }
  .ai-typing-label {
    font-family: var(--font-mono); font-size: 9px;
    color: rgba(34,211,238,0.5); letter-spacing: 0.12em; margin-left: 5px;
    animation: typing-pulse 1.5s ease-in-out infinite;
  }

  /* Input area */
  .ai-input-row {
    display: flex; gap: 10px; align-items: flex-end;
    padding: 12px 14px;
    border-top: 1px solid rgba(34,211,238,0.10);
    background: rgba(4,5,13,0.60);
    border-radius: 0 0 14px 14px;
    flex-shrink: 0; margin-top: 6px;
    position: relative;
  }
  .ai-input-row::before {
    content: '';
    position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(34,211,238,0.25), rgba(99,102,241,0.2), transparent);
  }
  .ai-textarea {
    flex: 1; background: transparent; border: none; outline: none; resize: none;
    font-family: var(--font-ui); font-size: 12.5px; color: var(--text-bright);
    line-height: 1.55; max-height: 80px; min-height: 20px;
    scrollbar-width: none;
  }
  .ai-textarea::placeholder { color: var(--muted); font-size: 12px; }
  .ai-textarea::-webkit-scrollbar { display: none; }

  @keyframes send-glow {
    0%,100% { box-shadow: 0 0 10px rgba(34,211,238,0.3), 0 0 0 rgba(99,102,241,0); }
    50%     { box-shadow: 0 0 20px rgba(34,211,238,0.5), 0 0 30px rgba(99,102,241,0.2); }
  }
  .ai-send-btn {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    border: 1px solid rgba(34,211,238,0.35);
    background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.12));
    color: #22d3ee; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s ease;
    position: relative; overflow: hidden;
    animation: send-glow 3s ease-in-out infinite;
  }
  .ai-send-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
  }
  .ai-send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(34,211,238,0.28), rgba(99,102,241,0.20));
    border-color: #22d3ee;
    box-shadow: 0 0 24px rgba(34,211,238,0.5), 0 0 8px rgba(99,102,241,0.3);
    transform: translateY(-2px) scale(1.05);
  }
  .ai-send-btn:active:not(:disabled) { transform: scale(0.95); }
  .ai-send-btn:disabled { opacity: 0.3; cursor: not-allowed; animation: none; }
`;

const QUICK_PROMPTS = [
  { icon: "⚡", text: "What is SQL injection?" },
  { icon: "🌐", text: "Explain XSS attacks" },
  { icon: "🛡️", text: "How to detect DDoS?" },
  { icon: "🔑", text: "Best MFA practices?" },
];

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello, SOC Analyst. I'm your AI Security Assistant powered by GPT-4o.\n\nAsk me anything about cyber threats, vulnerabilities, incident response, or security best practices.",
      time: now(),
    }
  ]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ask = async (question) => {
    const q = (question || msg).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: "user", text: q, time: now() }]);
    setMsg("");
    if (textareaRef.current) { textareaRef.current.style.height = "20px"; }
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/chat", { message: q });
      setMessages(prev => [...prev, { role: "bot", text: res.data.reply || "No response.", time: now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "⚠ AI assistant unreachable. Check backend connection.", time: now() }]);
    }
    setLoading(false);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
  };
  const onInput = (e) => {
    setMsg(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "20px"; ta.style.height = Math.min(ta.scrollHeight, 80) + "px"; }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STL }} />
      <div className="ai-wrap">

        {/* Quick prompts */}
        <div className="ai-quick-row">
          {QUICK_PROMPTS.map(p => (
            <button key={p.text} className="ai-quick-btn" onClick={() => ask(p.text)} disabled={loading}>
              {p.icon} {p.text}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="ai-scroll" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className="ai-msg-group">
              {m.role === "user" ? (
                <div className="ai-label-user">
                  <span style={{ opacity: 0.5, fontSize: 8 }}>{m.time}</span>
                  YOU
                  <span className="ai-label-icon user">🕵</span>
                </div>
              ) : (
                <div className="ai-label-system">
                  <span className="ai-label-icon system">◈</span>
                  GPT-4o ASSISTANT
                  <span style={{ opacity: 0.4, fontSize: 8 }}>{m.time}</span>
                </div>
              )}
              {m.role === "user" ? (
                <div className="ai-bubble-user">{m.text}</div>
              ) : (
                <div className="ai-bubble-bot" data-time={`RESPONSE · ${m.time}`}>{m.text}</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-msg-group">
              <div className="ai-label-system">
                <span className="ai-label-icon system">◈</span>
                GPT-4o ASSISTANT
              </div>
              <div className="ai-bubble-bot">
                <div className="ai-typing-row" style={{ padding: 0 }}>
                  <span className="ai-typing-dot"/>
                  <span className="ai-typing-dot"/>
                  <span className="ai-typing-dot"/>
                  <span className="ai-typing-label">Analyzing threat intelligence…</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="ai-input-row">
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            rows={1}
            placeholder="Ask a security question… (Enter to send, Shift+Enter for newline)"
            value={msg}
            onChange={onInput}
            onKeyDown={onKey}
          />
          <button className="ai-send-btn" onClick={() => ask()} disabled={!msg.trim() || loading} title="Send (Enter)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}