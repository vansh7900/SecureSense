import { useState, useEffect, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Syne:wght@700;800&family=Orbitron:wght@700;900&display=swap');

  .login-root {
    min-height: 100vh;
    width: 100%;
    background: #04050d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* ── Animated background layers ── */
  .login-bg-canvas { position: absolute; inset: 0; z-index: 0; }

  .login-bg-mesh {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background:
      radial-gradient(ellipse 70% 60% at 70% -10%, rgba(99,102,241,0.22) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at  0%  75%, rgba(167,139,250,0.14) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 95%  90%, rgba(16,255,197,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 30%  10%, rgba(34,211,238,0.08) 0%, transparent 60%);
  }

  .login-bg-grid {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background-image:
      linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
    background-size: 48px 48px;
    animation: grid-fade 8s ease-in-out infinite alternate;
  }
  @keyframes grid-fade {
    0%   { opacity: 0.4; }
    100% { opacity: 1; }
  }

  /* ── Floating orbs ── */
  @keyframes orb-float {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(28px,-20px) scale(1.08); }
    66%     { transform: translate(-18px,14px) scale(0.94); }
  }
  .login-orb {
    position: absolute; border-radius: 50%;
    pointer-events: none; z-index: 1; filter: blur(80px);
  }
  .login-orb-1 { width:450px; height:450px; top:-100px; right:-80px; background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%); animation: orb-float 20s ease-in-out infinite; }
  .login-orb-2 { width:350px; height:350px; bottom:-80px; left:-100px; background: radial-gradient(circle, rgba(167,139,250,0.16) 0%, transparent 70%); animation: orb-float 26s ease-in-out infinite reverse; }
  .login-orb-3 { width:260px; height:260px; top:35%; left:5%; background: radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%); animation: orb-float 32s ease-in-out infinite; }
  .login-orb-4 { width:200px; height:200px; bottom:15%; right:8%; background: radial-gradient(circle, rgba(244,114,182,0.08) 0%, transparent 70%); animation: orb-float 38s ease-in-out infinite reverse; }
  .login-orb-5 { width:180px; height:180px; top:15%; left:25%; background: radial-gradient(circle, rgba(16,255,197,0.06) 0%, transparent 70%); animation: orb-float 44s ease-in-out infinite; }

  /* ── Mouse glow ── */
  .login-mouse-glow {
    position: fixed; pointer-events: none; z-index: 3;
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 60%);
    filter: blur(50px);
    transform: translate(-50%, -50%);
    transition: left 0.15s linear, top 0.15s linear;
  }

  /* ── Scanlines overlay ── */
  .login-scanlines {
    position: fixed; inset: 0; z-index: 4; pointer-events: none;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
    );
    opacity: 0.3;
  }

  /* ── Card ── */
  @keyframes card-in {
    from { opacity:0; transform: translateY(40px) scale(0.94); }
    to   { opacity:1; transform: translateY(0) scale(1); }
  }
  .login-card {
    position: relative; z-index: 10;
    width: 420px;
    background: rgba(8,10,22,0.92);
    backdrop-filter: blur(48px) saturate(200%);
    -webkit-backdrop-filter: blur(48px) saturate(200%);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 24px;
    padding: 44px 40px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.05) inset,
      0 30px 100px rgba(0,0,0,0.7),
      0 0 80px rgba(99,102,241,0.12),
      0 0 40px rgba(34,211,238,0.06);
    animation: card-in 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  /* Holographic top border */
  .login-card::before {
    content: '';
    position: absolute; top: 0; left: 5%; right: 5%; height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(34,211,238,0.8) 15%,
      rgba(99,102,241,1.0) 40%,
      rgba(167,139,250,0.7) 60%,
      rgba(244,114,182,0.6) 80%,
      rgba(16,255,197,0.5) 92%,
      transparent 100%);
    border-radius: 24px 24px 0 0;
    background-size: 200% 100%;
    animation: holo-border 4s linear infinite;
  }
  @keyframes holo-border {
    0%   { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  /* Subtle corner glow */
  .login-card::after {
    content: '';
    position: absolute; bottom: -1px; left: 20%; right: 20%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
  }

  /* ── Logo area ── */
  .login-logo-wrap {
    display: flex; flex-direction: column; align-items: center;
    margin-bottom: 36px; gap: 16px;
  }

  @keyframes logo-spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes icon-pulse {
    0%,100% {
      box-shadow: 0 0 0 1px rgba(99,102,241,0.15),
                  0 0 30px rgba(99,102,241,0.35),
                  0 0 60px rgba(34,211,238,0.15);
    }
    50% {
      box-shadow: 0 0 0 1px rgba(99,102,241,0.30),
                  0 0 50px rgba(99,102,241,0.55),
                  0 0 90px rgba(34,211,238,0.25);
    }
  }
  .login-logo-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(167,139,250,0.20), rgba(34,211,238,0.15));
    border: 1px solid rgba(99,102,241,0.40);
    display: flex; align-items: center; justify-content: center;
    animation: icon-pulse 3s ease-in-out infinite;
    position: relative; overflow: hidden;
  }
  .login-logo-icon::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%);
  }
  .login-logo-icon::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(225deg, rgba(34,211,238,0.16) 0%, transparent 50%);
  }
  .login-logo-icon svg { width: 28px; height: 28px; color: #a5b4fc; position: relative; z-index: 1; }

  .login-brand {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    letter-spacing: -0.02em; text-align: center; line-height: 1;
    background: linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 35%, #c084fc 65%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: holo-text 5s ease-in-out infinite alternate;
  }
  @keyframes holo-text {
    0%   { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  .login-tagline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; color: rgba(34,211,238,0.6); letter-spacing: 0.26em;
    text-transform: uppercase; text-align: center; margin-top: -6px;
  }

  /* ── Avatar ── */
  @keyframes avatar-wiggle {
    0%,100% { transform: rotate(0deg) scale(1); }
    25%     { transform: rotate(-10deg) scale(1.05); }
    75%     { transform: rotate(10deg) scale(1.05); }
  }
  .login-avatar {
    font-size: 44px; line-height: 1; user-select: none;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 6px 18px rgba(99,102,241,0.4));
  }
  .login-avatar.wiggle { animation: avatar-wiggle 0.4s ease; }

  /* ── Divider ── */
  .login-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 6px 0 20px;
  }
  .login-divider-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3));
  }
  .login-divider-line:last-child {
    background: linear-gradient(90deg, rgba(99,102,241,0.3), transparent);
  }
  .login-divider-text {
    font-family: 'JetBrains Mono', monospace; font-size: 9px;
    color: rgba(99,102,241,0.5); letter-spacing: 0.2em; text-transform: uppercase;
  }

  /* ── Form ── */
  .login-field { margin-bottom: 18px; }
  .login-label {
    font-size: 11px; font-weight: 700; color: #64748b;
    letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: block;
  }
  .login-input-wrap {
    position: relative;
    display: flex; align-items: center;
  }
  .login-input-icon {
    position: absolute; left: 14px;
    font-size: 15px; pointer-events: none; z-index: 1;
    transition: filter 0.2s;
  }
  .login-input {
    width: 100%; padding: 13px 16px 13px 44px;
    background: rgba(4,5,13,0.7);
    border: 1px solid rgba(99,102,241,0.18);
    border-radius: 12px;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif; font-size: 14px;
    outline: none;
    transition: border-color 0.22s, box-shadow 0.22s, background 0.22s;
  }
  .login-input::placeholder { color: #334155; }
  .login-input:focus {
    border-color: rgba(99,102,241,0.55);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.14), 0 0 20px rgba(99,102,241,0.12);
    background: rgba(7,8,20,0.9);
  }

  /* ── Error ── */
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
  .login-error {
    font-size: 12px; font-weight: 600;
    color: #ff4d6d; padding: 10px 14px; border-radius: 10px;
    background: rgba(255,77,109,0.10);
    border: 1px solid rgba(255,77,109,0.28);
    margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
    animation: shake 0.45s ease;
    box-shadow: 0 0 16px rgba(255,77,109,0.12);
  }

  /* ── Submit button ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes btn-glow {
    0%,100% { box-shadow: 0 6px 30px rgba(99,102,241,0.45), 0 0 0 0 rgba(34,211,238,0); }
    50%     { box-shadow: 0 6px 50px rgba(99,102,241,0.65), 0 0 30px rgba(34,211,238,0.25); }
  }
  .login-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #6366f1 0%, #818cf8 40%, #a78bfa 70%, #22d3ee 100%);
    background-size: 300% 300%;
    border: none; border-radius: 12px;
    color: white; font-family: 'Orbitron', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; position: relative; overflow: hidden;
    transition: opacity 0.2s, transform 0.18s;
    box-shadow: 0 6px 30px rgba(99,102,241,0.45);
    margin-top: 6px;
    animation: btn-glow 3s ease-in-out infinite, gradient-shift 4s ease-in-out infinite alternate;
  }
  @keyframes gradient-shift {
    0%   { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  .login-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
  }
  /* Animated sweep */
  .login-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .login-btn:hover:not(:disabled)::after { transform: translateX(100%); }
  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 50px rgba(99,102,241,0.6), 0 0 40px rgba(34,211,238,0.3);
  }
  .login-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
  .login-btn:disabled { opacity: 0.7; cursor: not-allowed; animation: none; }
  .login-btn-inner { display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; z-index: 1; }
  .login-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* ── Footer text ── */
  .login-footer-text {
    text-align: center; margin-top: 26px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; color: #334155;
    letter-spacing: 0.18em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 12px;
  }
  .login-footer-text::before,
  .login-footer-text::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.18));
  }
  .login-footer-text::after {
    background: linear-gradient(90deg, rgba(99,102,241,0.18), transparent);
  }



  /* ── Auth success overlay ── */
  @keyframes auth-fill {
    from { opacity: 0; transform: scale(1.1); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes auth-text-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes progress-bar {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .login-auth-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: radial-gradient(ellipse 100% 100% at 50% 50%, rgba(15,10,45,0.98) 0%, rgba(4,5,13,0.99) 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 24px;
    animation: auth-fill 0.5s ease both;
  }
  .login-auth-icon {
    font-size: 60px;
    animation: auth-text-in 0.5s 0.15s both;
    filter: drop-shadow(0 0 30px rgba(99,102,241,0.5));
  }
  .login-auth-title {
    font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900;
    background: linear-gradient(135deg, #a5b4fc, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.12em; text-transform: uppercase;
    animation: auth-text-in 0.5s 0.3s both;
  }
  .login-auth-text {
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
    color: #4ade80; letter-spacing: 0.2em; text-transform: uppercase;
    animation: auth-text-in 0.5s 0.5s both;
  }
  .login-auth-bar-wrap {
    width: 280px; height: 3px; background: rgba(99,102,241,0.15);
    border-radius: 2px; overflow: hidden;
    animation: auth-text-in 0.5s 0.6s both;
  }
  .login-auth-bar {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #818cf8, #22d3ee);
    border-radius: 2px;
    animation: progress-bar 1s 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
    box-shadow: 0 0 12px rgba(34,211,238,0.6);
    width: 0%;
  }
`;

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [focused, setFocused]   = useState(null);
  const [isAuth,  setIsAuth]    = useState(false);
  const [mouse,   setMouse]     = useState({ x: -1000, y: -1000 });
  const [avatarKey, setAvatarKey] = useState(0);
  const canvasRef = useRef(null);

  /* Matrix rain effect — neon variant */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters  = "01SecureSense ⌘⎋⌥◈▸";
    const fontSize = 13;
    const cols     = Math.floor(canvas.width / fontSize);
    const drops    = Array(cols).fill(1);

    let raf, lastDraw = 0;
    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (ts - lastDraw < 48) return;
      lastDraw = ts;

      ctx.fillStyle = "rgba(4,5,13,0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = letters[Math.floor(Math.random() * letters.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bright = dist < 180 ? Math.max(0, 1 - dist / 180) : 0;

        // oscillate hue: indigo vs cyan
        const t = (Date.now() / 3000 + i * 0.07) % 1;
        const r = Math.round( 40 + bright * 80  + (t < 0.5 ? 0  : 60));
        const g = Math.round( 40 + bright * 90  + (t < 0.5 ? 0  : 80));
        const b = Math.round(180 + bright * 75);
        const a = 0.06 + bright * 0.55;
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mouse]);

  const getAvatar = () => {
    if (isAuth)                     return "✅";
    if (focused === "password")     return "🙈";
    if (focused === "username")     return "🕵️";
    return "🛡️";
  };

  const handleLogin = () => {
    setError("");
    if (!username || !password) { setError("Please enter both username and password."); return; }
    if (username === "admin" && password === "admin123") {
      setIsAuth(true);
      localStorage.setItem("auth", "true");
      setTimeout(onLogin, 2000);
    } else {
      setError("Invalid credentials. Please try again.");
      setAvatarKey(k => k + 1);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

  if (isAuth) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="login-auth-overlay">
        <div className="login-auth-icon">🔓</div>
        <div className="login-auth-title">Access Granted</div>
        <div className="login-auth-text">Authentication successful — initializing dashboard…</div>
        <div className="login-auth-bar-wrap">
          <div className="login-auth-bar" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        className="login-root"
        onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
      >
        <canvas ref={canvasRef} className="login-bg-canvas" />
        <div className="login-bg-mesh" />
        <div className="login-bg-grid" />
        <div className="login-scanlines" />

        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-orb login-orb-4" />
        <div className="login-orb login-orb-5" />

        <div className="login-mouse-glow" style={{ left: mouse.x, top: mouse.y }} />

        <div className="login-card">
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>

            <div>
              <div className="login-brand">SecureSense </div>
              <div className="login-tagline">Cyber Threat Intelligence Platform</div>
            </div>

            <div key={avatarKey} className="login-avatar"
              style={{ transform: `translate(${(mouse.x / Math.max(window.innerWidth,1) - 0.5) * 10}px, ${(mouse.y / Math.max(window.innerHeight,1) - 0.5) * 7}px)` }}
            >
              {getAvatar()}
            </div>
          </div>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">Secure Access Portal</span>
            <div className="login-divider-line" />
          </div>

          {/* Username */}
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">👤</span>
              <input
                className="login-input"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
                onKeyDown={onKey}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                type="password"
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                onKeyDown={onKey}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span>{error}
            </div>
          )}

          <button className="login-btn" onClick={handleLogin} disabled={isAuth}>
            <span className="login-btn-inner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Authenticate
            </span>
          </button>

          <div className="login-footer-text">Monitored · Secured · Encrypted</div>
        </div>
      </div>
    </>
  );
}
