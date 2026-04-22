import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import axios from "axios";

import LiveFeed from "./components/LiveFeed";
import BlockedThreats from "./components/BlockedThreats";
import SeverityChart from "./components/SeverityChart";
import GeoMap from "./components/GeoMap";
import AttackTimeline from "./components/AttackTimeline";
import MitreHeatmap from "./components/MitreHeatmap";
import SecurityTools from "./components/securitytools";
import AISummary from "./components/AISummary";
import AIAssistant from "./components/AIAssistant";
import Login from "./pages/Login";
import ThreatTrend from "./components/ThreatTrend";
import ThreatDistribution from "./components/ThreatDistribution";
import TopAttacks from "./components/TopAttacks";

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES — Ultra-Premium Cyber SOC Theme
═══════════════════════════════════════════════════════════ */
const API = "https://securesense.onrender.com";
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@700;800&family=Orbitron:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ─── Backgrounds ─── */
    --bg:          #04050d;
    --bg2:         #070914;
    --surface:     #0c0e1c;
    --surface2:    #101328;
    --surface3:    #161930;
    --surface4:    #1b1e38;

    /* ─── Borders ─── */
    --border:      rgba(99,102,241,0.12);
    --border2:     rgba(99,102,241,0.28);
    --border3:     rgba(99,102,241,0.50);
    --border-sub:  rgba(255,255,255,0.06);

    /* ─── Primary: Indigo/Violet ─── */
    --accent:      #818cf8;
    --accent-dim:  rgba(129,140,248,0.16);
    --accent-deep: #6366f1;
    --accent-glow: rgba(99,102,241,0.45);

    /* ─── Secondary: Violet ─── */
    --violet:      #a78bfa;
    --violet-dim:  rgba(167,139,250,0.14);

    /* ─── Neon Cyan ─── */
    --cyan:        #22d3ee;
    --cyan-dim:    rgba(34,211,238,0.12);
    --cyan-glow:   rgba(34,211,238,0.40);

    /* ─── Neon Pink / Magenta ─── */
    --pink:        #f472b6;
    --pink-dim:    rgba(244,114,182,0.12);
    --pink-glow:   rgba(244,114,182,0.35);

    /* ─── Amber ─── */
    --amber:       #fbbf24;
    --amber-dim:   rgba(251,191,36,0.12);

    /* ─── Semantic ─── */
    --danger:      #ff4d6d;
    --danger-dim:  rgba(255,77,109,0.14);
    --danger-deep: #e11d48;
    --warn:        #fb923c;
    --warn-dim:    rgba(251,146,60,0.14);
    --safe:        #10ffc5;
    --safe-dim:    rgba(16,255,197,0.10);
    --info:        #60a5fa;
    --info-dim:    rgba(96,165,250,0.10);

    /* ─── Purple (AI) ─── */
    --purple:      #c084fc;
    --purple-dim:  rgba(192,132,252,0.12);

    /* ─── Text ─── */
    --text:        #94a3b8;
    --text-bright: #f1f5f9;
    --text-dim:    #64748b;
    --muted:       #475569;
    --muted2:      #334155;

    /* ─── Shadows ─── */
    --glow-accent:  0 0 24px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.10);
    --glow-sm:      0 0 16px rgba(99,102,241,0.40);
    --glow-cyan:    0 0 20px rgba(34,211,238,0.45);
    --glow-pink:    0 0 20px rgba(244,114,182,0.40);
    --glow-danger:  0 0 20px rgba(255,77,109,0.40);
    --glow-safe:    0 0 20px rgba(16,255,197,0.35);
    --shadow-card:  0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset;
    --shadow-lg:    0 24px 80px rgba(0,0,0,0.6);

    /* ─── Typography ─── */
    --font-mono:   'JetBrains Mono', monospace;
    --font-ui:     'Inter', sans-serif;
    --font-head:   'Syne', sans-serif;
    --font-display:'Orbitron', sans-serif;

    /* ─── Radii & Transitions ─── */
    --radius:      8px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-2xl:  22px;
    --transition:  0.18s cubic-bezier(0.4,0,0.2,1);
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    font-size: 14px;
    line-height: 1.5;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }

  /* ════════════════════════════
     ANIMATED BACKGROUND
  ════════════════════════════ */
  .ss-root {
    min-height: 100vh;
    position: relative;
    padding: 0 0 60px;
  }

  .ss-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    background: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(15,10,40,1) 0%, #04050d 60%);
  }

  /* Animated dot grid */
  .ss-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 100% 80% at 50% 0%, black 0%, transparent 100%);
    opacity: 0.6;
    animation: grid-shift 60s linear infinite;
  }

  @keyframes grid-shift {
    from { background-position: 0 0; }
    to   { background-position: 32px 32px; }
  }

  /* Multi-colour mesh blobs */
  .ss-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 80%  -5%, rgba(99,102,241,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 45% 35% at  5%  60%, rgba(167,139,250,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 50% 40% at 50% 110%, rgba(16,255,197,0.06)  0%, transparent 65%),
      radial-gradient(ellipse 35% 25% at 95%  88%, rgba(244,114,182,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 30% 20% at 20%  15%, rgba(34,211,238,0.06) 0%, transparent 60%);
    animation: mesh-pulse 18s ease-in-out infinite alternate;
  }

  @keyframes mesh-pulse {
    0%   { opacity: 0.8; }
    100% { opacity: 1; }
  }

  .ss-content {
    position: relative;
    z-index: 1;
    padding: 0 32px 80px;
    max-width: 1800px;
    margin: 0 auto;
  }

  /* ════════════════════════════
     FLOATING ORBS — Neon
  ════════════════════════════ */
  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    25%     { transform: translate(30px,-22px) scale(1.04); }
    50%     { transform: translate(-18px,14px) scale(0.97); }
    75%     { transform: translate(14px,8px) scale(1.02); }
  }

  .ss-orb {
    position: fixed; border-radius: 50%;
    pointer-events: none; z-index: 0;
    filter: blur(70px);
  }
  .ss-orb-1 {
    width:500px; height:500px; top:0%; left:5%;
    background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%);
    animation: orb-drift 22s ease-in-out infinite;
    opacity: 0.8;
  }
  .ss-orb-2 {
    width:380px; height:380px; top:40%; right:3%;
    background: radial-gradient(circle, rgba(167,139,250,0.16) 0%, transparent 70%);
    animation: orb-drift 28s ease-in-out infinite reverse;
    opacity: 0.7;
  }
  .ss-orb-3 {
    width:300px; height:300px; bottom:8%; left:38%;
    background: radial-gradient(circle, rgba(16,255,197,0.10) 0%, transparent 70%);
    animation: orb-drift 35s ease-in-out infinite;
    opacity: 0.9;
  }
  .ss-orb-4 {
    width:250px; height:250px; top:20%; right:30%;
    background: radial-gradient(circle, rgba(244,114,182,0.10) 0%, transparent 70%);
    animation: orb-drift 40s ease-in-out infinite reverse;
    opacity: 0.6;
  }
  .ss-orb-5 {
    width:200px; height:200px; bottom:30%; left:8%;
    background: radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%);
    animation: orb-drift 30s ease-in-out infinite;
    opacity: 0.5;
  }

  /* ════════════════════════════
     HEADER — Neon Enterprise
  ════════════════════════════ */
  .ss-header {
    position: sticky;
    top: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 70px;
    background: rgba(4,5,13,0.90);
    backdrop-filter: blur(32px) saturate(220%);
    -webkit-backdrop-filter: blur(32px) saturate(220%);
    border-bottom: 1px solid rgba(99,102,241,0.14);
    margin-bottom: 40px;
  }

  /* Animated gradient underline */
  .ss-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(34,211,238,0.7) 10%,
      rgba(99,102,241,0.9) 35%,
      rgba(167,139,250,0.6) 60%,
      rgba(244,114,182,0.5) 80%,
      rgba(16,255,197,0.4) 92%,
      transparent 100%);
    background-size: 200% 100%;
    animation: header-line 4s linear infinite;
  }

  @keyframes header-line {
    0%   { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  @keyframes hdr-pulse {
    0%,100% { box-shadow: 0 2px 0 0 rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.03); }
    50%      { box-shadow: 0 2px 0 0 rgba(99,102,241,0.45), 0 0 80px rgba(99,102,241,0.08); }
  }
  .ss-header.live { animation: hdr-pulse 4s ease-in-out infinite; }

  /* ── Holographic Logo ── */
  .ss-logo { display: flex; align-items: center; gap: 16px; text-decoration: none; }

  .ss-logo-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(167,139,250,0.18), rgba(34,211,238,0.12));
    border: 1px solid rgba(99,102,241,0.45);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 1px rgba(99,102,241,0.12), var(--glow-sm), 0 0 30px rgba(34,211,238,0.15);
    position: relative;
    overflow: hidden;
    animation: logo-pulse 3s ease-in-out infinite;
  }
  @keyframes logo-pulse {
    0%,100% { box-shadow: 0 0 0 1px rgba(99,102,241,0.12), 0 0 16px rgba(99,102,241,0.4), 0 0 30px rgba(34,211,238,0.15); }
    50%     { box-shadow: 0 0 0 1px rgba(99,102,241,0.25), 0 0 28px rgba(99,102,241,0.6), 0 0 50px rgba(34,211,238,0.25); }
  }
  .ss-logo-icon::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%);
  }
  .ss-logo-icon::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(225deg, rgba(34,211,238,0.12) 0%, transparent 50%);
  }
  .ss-logo-icon svg { width: 20px; height: 20px; color: #a5b4fc; position: relative; z-index: 1; }

  .ss-logo-text { display: flex; flex-direction: column; gap: 1px; }
  .ss-logo-name {
    font-family: var(--font-head);
    font-size: 20px; font-weight: 800;
    background: linear-gradient(135deg, #e2e8f0 0%, #a5b4fc 40%, #c084fc 70%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.01em;
    line-height: 1;
    background-size: 200% 200%;
    animation: holo-text 5s ease-in-out infinite alternate;
  }
  @keyframes holo-text {
    0%   { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  .ss-logo-sub {
    font-family: var(--font-mono);
    font-size: 9px; color: var(--muted);
    letter-spacing: 0.22em; text-transform: uppercase;
  }

  /* ── Header Nav ── */
  .ss-nav { display: flex; align-items: center; gap: 2px; }
  .ss-nav-item {
    font-family: var(--font-ui); font-size: 13px; font-weight: 500;
    color: var(--text-dim); padding: 7px 16px; border-radius: var(--radius);
    cursor: pointer; border: none; background: none;
    transition: color var(--transition), background var(--transition);
    text-decoration: none; display: flex; align-items: center; gap: 7px;
    position: relative;
  }
  .ss-nav-item:hover { color: var(--text-bright); background: rgba(255,255,255,0.06); }
  .ss-nav-item.active {
    color: var(--accent);
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.20);
  }
  .ss-nav-item.active::after {
    content: '';
    position: absolute; bottom: -1px; left: 20%; right: 20%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    border-radius: 1px;
  }

  /* ── Header right ── */
  .ss-header-right { display: flex; align-items: center; gap: 10px; }

  .ss-clock {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--cyan); letter-spacing: 0.05em;
    padding: 7px 14px;
    border: 1px solid rgba(34,211,238,0.20);
    border-radius: var(--radius);
    background: rgba(34,211,238,0.06);
    box-shadow: 0 0 12px rgba(34,211,238,0.10);
  }

  .ss-status {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 7px 16px; border-radius: 20px;
    color: var(--safe);
    background: rgba(16,255,197,0.08);
    border: 1px solid rgba(16,255,197,0.25);
    box-shadow: 0 0 16px rgba(16,255,197,0.12);
    transition: var(--transition);
  }
  .ss-status.offline {
    color: var(--danger); background: var(--danger-dim);
    border-color: rgba(255,77,109,0.28);
    box-shadow: 0 0 16px rgba(255,77,109,0.12);
  }

  @keyframes live-dot {
    0%,100% { opacity:1; transform:scale(1); box-shadow: 0 0 8px var(--safe); }
    50%     { opacity:0.4; transform:scale(0.7); box-shadow: 0 0 4px var(--safe); }
  }
  .ss-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--safe);
    box-shadow: 0 0 10px var(--safe), 0 0 20px rgba(16,255,197,0.5);
    animation: live-dot 1.8s ease-in-out infinite;
  }
  .ss-dot.off { background: var(--danger); box-shadow: 0 0 8px var(--danger); animation: none; }

  .ss-logout {
    font-family: var(--font-ui); font-size: 12px; font-weight: 600;
    letter-spacing: 0.02em; cursor: pointer;
    border-radius: var(--radius);
    border: 1px solid rgba(255,77,109,0.28);
    background: rgba(255,77,109,0.08);
    color: var(--danger); padding: 7px 16px;
    transition: var(--transition);
  }
  .ss-logout:hover {
    background: rgba(255,77,109,0.18);
    border-color: rgba(255,77,109,0.5);
    box-shadow: var(--glow-danger);
  }

  /* ════════════════════════════
     SECTION HEADERS — Neon
  ════════════════════════════ */
  .ss-section {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 18px;
    margin-top: 28px;
  }
  .ss-section:first-of-type { margin-top: 0; }
  .ss-section-icon {
    width: 38px; height: 38px; border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-dim), rgba(34,211,238,0.12));
    border: 1.5px solid var(--border2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
    transition: all 0.3s ease;
  }
  .ss-section:hover .ss-section-icon {
    background: linear-gradient(135deg, var(--accent-dim), rgba(34,211,238,0.18));
    box-shadow: 0 0 28px rgba(99,102,241,0.45);
    border-color: var(--accent);
  }
  .ss-section-icon svg { width: 16px; height: 16px; color: var(--accent); }
  .ss-section-label {
    font-family: var(--font-head);
    font-size: 15px; font-weight: 800;
    color: var(--text-bright); letter-spacing: 0.02em;
  }
  .ss-section-sub {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--cyan); letter-spacing: 0.08em;
    margin-left: 2px; opacity: 0.85;
  }
  .ss-section-line {
    flex: 1; height: 1.5px;
    background: linear-gradient(90deg, var(--border2), rgba(34,211,238,0.25), transparent);
  }

  /* ════════════════════════════
     CARDS — Glassmorphism + Glow
  ════════════════════════════ */
  .ss-card {
    background: linear-gradient(145deg, rgba(12,14,28,0.95) 0%, rgba(10,12,24,0.80) 100%);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: var(--radius-xl);
    padding: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;
    backdrop-filter: blur(16px);
  }

  /* Animated shimmer sweep */
  .ss-card::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(99,102,241,0.08) 40%,
      rgba(167,139,250,0.10) 50%,
      rgba(34,211,238,0.06) 60%,
      transparent 100%);
    transition: left 0.8s ease;
    pointer-events: none;
  }

  /* Top shimmer border */
  .ss-card::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(99,102,241,0.6) 20%,
      rgba(167,139,250,0.4) 50%,
      rgba(34,211,238,0.3) 80%,
      transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: var(--radius-xl);
  }

  .ss-card:hover {
    border-color: rgba(99,102,241,0.32);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 20px 70px rgba(0,0,0,0.7),
                0 0 50px rgba(99,102,241,0.12);
    transform: translateY(-6px);
  }
  .ss-card:hover::before { left: 100%; }
  .ss-card:hover::after  { opacity: 1; }

  /* AI Card */
  .ss-ai-card {
    background: linear-gradient(145deg, rgba(12,14,28,0.98) 0%, rgba(16,12,36,0.85) 100%);
    border-color: rgba(167,139,250,0.22);
    min-height: 240px;
    border-top: 2px solid rgba(167,139,250,0.35);
  }
  .ss-ai-card:hover { 
    border-color: rgba(167,139,250,0.42);
    border-top-color: rgba(167,139,250,0.55);
  }

  /* ── Panel Title ── */
  .ss-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .ss-card-title {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-ui); font-size: 14px; font-weight: 800;
    color: var(--text-bright); letter-spacing: 0.01em;
  }
  .ss-card-title-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-deep), var(--cyan));
    box-shadow: 0 0 12px rgba(99,102,241,0.8), 0 0 24px rgba(34,211,238,0.4);
    animation: dot-glow 2.8s ease-in-out infinite;
  }
  @keyframes dot-glow {
    0%,100% { box-shadow: 0 0 12px rgba(99,102,241,0.8), 0 0 24px rgba(34,211,238,0.4); }
    50%     { box-shadow: 0 0 18px rgba(99,102,241,1), 0 0 40px rgba(34,211,238,0.6); }
  }
  .ss-card-badge {
    font-family: var(--font-mono); font-size: 8.5px; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--cyan); background: rgba(34,211,238,0.10);
    border: 1px solid rgba(34,211,238,0.28);
    border-radius: 6px; padding: 3px 11px;
  }

  /* ════════════════════════════
     TICKER BAR — Neon
  ════════════════════════════ */
  .ss-ticker {
    display: flex; align-items: center;
    background: linear-gradient(90deg, rgba(99,102,241,0.08) 0%, rgba(34,211,238,0.04) 100%);
    border: 1.5px solid rgba(99,102,241,0.20);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 32px;
    height: 42px;
    box-shadow: 0 0 24px rgba(99,102,241,0.10);
    transition: all 0.3s ease;
  }
  .ss-ticker:hover {
    border-color: rgba(99,102,241,0.32);
    box-shadow: 0 0 32px rgba(99,102,241,0.15);
  }
  .ss-ticker-label {
    font-family: var(--font-mono); font-size: 9.5px; font-weight: 800;
    letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--cyan); background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.06));
    border-right: 1.5px solid rgba(34,211,238,0.28);
    padding: 0 20px; height: 100%;
    display: flex; align-items: center;
    white-space: nowrap; flex-shrink: 0; gap: 8px;
    box-shadow: 6px 0 24px rgba(34,211,238,0.10);
  }
  .ss-ticker-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 10px var(--cyan), 0 0 20px rgba(34,211,238,0.6);
    animation: live-dot 1.8s ease-in-out infinite;
  }
  .ss-ticker-scroll { flex: 1; overflow: hidden; height: 100%; display: flex; align-items: center; }
  @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .ss-ticker-inner { display: flex; white-space: nowrap; animation: ticker 32s linear infinite; }
  .ss-ticker-item {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--text-dim); padding: 0 32px;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: inline-flex; align-items: center; gap: 10px;
  }
  .ss-ticker-item .hi { color: var(--danger); text-shadow: 0 0 12px rgba(255,77,109,0.6); font-weight: 700; }
  .ss-ticker-item .md { color: var(--amber); text-shadow: 0 0 12px rgba(251,191,36,0.5); font-weight: 700; }
  .ss-ticker-item .lo { color: var(--safe);  text-shadow: 0 0 12px rgba(16,255,197,0.5); font-weight: 700; }

  /* ════════════════════════════
     AI ROW
  ════════════════════════════ */
  .ss-ai-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }

  /* ════════════════════════════
     CONTROLS BAR
  ════════════════════════════ */
  .ss-controls {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 14px;
    margin-bottom: 28px;
    align-items: center;
  }

  .ss-search-wrap {
    background: linear-gradient(145deg, rgba(12,14,28,0.95) 0%, rgba(10,12,24,0.85) 100%);
    border: 1.5px solid rgba(99,102,241,0.18);
    border-radius: var(--radius-xl);
    display: flex; align-items: center; gap: 12px;
    padding: 0 18px;
    transition: border-color 0.25s, box-shadow 0.25s;
    backdrop-filter: blur(12px);
  }
  .ss-search-wrap:focus-within {
    border-color: rgba(99,102,241,0.50);
    box-shadow: 0 0 0 3.5px rgba(99,102,241,0.14), 0 0 24px rgba(99,102,241,0.12);
    background: linear-gradient(145deg, rgba(14,16,32,0.97) 0%, rgba(12,14,28,0.92) 100%);
  }
  .ss-search-wrap svg { width: 16px; height: 16px; color: var(--accent); flex-shrink: 0; }
  .ss-search {
    background: transparent; border: none; outline: none;
    font-family: var(--font-ui); font-size: 13px;
    color: var(--text-bright); width: 100%; padding: 13px 0;
  }
  .ss-search::placeholder { color: var(--muted); }

  .ss-time-group {
    background: linear-gradient(145deg, rgba(12,14,28,0.95) 0%, rgba(10,12,24,0.85) 100%);
    border: 1.5px solid rgba(99,102,241,0.16);
    border-radius: var(--radius-xl);
    display: flex; gap: 3px; padding: 5px;
    backdrop-filter: blur(12px);
  }
  .ss-btn {
    font-family: var(--font-ui); font-size: 11px; font-weight: 700;
    cursor: pointer; border-radius: 9px;
    border: 1px solid transparent;
    background: transparent; color: var(--muted);
    padding: 7px 18px; transition: var(--transition);
    letter-spacing: 0.03em;
  }
  .ss-btn:hover { 
    color: var(--text-bright); 
    background: rgba(255,255,255,0.08);
  }
  .ss-btn.active {
    color: var(--cyan); 
    border-color: rgba(34,211,238,0.35);
    background: rgba(34,211,238,0.12);
    box-shadow: 0 0 14px rgba(34,211,238,0.18);
  }

  .ss-events-badge {
    background: linear-gradient(145deg, rgba(12,14,28,0.95) 0%, rgba(10,12,24,0.85) 100%);
    border: 1.5px solid rgba(99,102,241,0.16);
    border-radius: var(--radius-xl);
    padding: 10px 24px; text-align: center; white-space: nowrap; min-width: 100px;
    backdrop-filter: blur(12px);
    transition: all 0.25s ease;
  }
  .ss-events-badge:hover {
    border-color: rgba(99,102,241,0.30);
    box-shadow: 0 0 16px rgba(99,102,241,0.12);
  }

  /* ════════════════════════════
     KPI CARDS — Vibrant Neon
  ════════════════════════════ */
  .ss-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .ss-kpi {
    background: linear-gradient(145deg, rgba(12,14,28,0.98), rgba(10,12,22,0.88));
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: var(--radius-xl);
    padding: 22px 18px 20px;
    position: relative; overflow: hidden; cursor: default;
    transition: border-color 0.28s ease, transform 0.28s ease, box-shadow 0.28s ease;
    box-shadow: var(--shadow-card);
    backdrop-filter: blur(16px);
  }

  /* Animated diagonal sweep */
  .ss-kpi::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--accent-deep) 45%,
      var(--cyan) 85%,
      transparent 100%);
    background-size: 200% 100%;
    opacity: 0.85;
    animation: kpi-line-sweep 6s linear infinite;
  }

  @keyframes kpi-line-sweep {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .ss-kpi.danger::before { background: linear-gradient(90deg, transparent, var(--danger), var(--pink), transparent); opacity: 0.95; }
  .ss-kpi.warn::before   { background: linear-gradient(90deg, transparent, var(--warn), var(--amber), transparent); opacity: 0.90; }
  .ss-kpi.safe::before   { background: linear-gradient(90deg, transparent, var(--safe), var(--cyan), transparent); opacity: 0.90; }

  /* Corner glow dot */
  .ss-kpi::after {
    content: '';
    position: absolute; bottom: 12px; right: 14px;
    width: 45px; height: 45px; border-radius: 50%;
    opacity: 0.08;
    background: var(--accent-deep);
    filter: blur(22px);
    transition: opacity 0.3s;
  }
  .ss-kpi.danger::after { background: var(--danger); }
  .ss-kpi.warn::after   { background: var(--warn); }
  .ss-kpi.safe::after   { background: var(--safe); }

  .ss-kpi:hover { 
    transform: translateY(-5px) scale(1.02); 
    border-color: rgba(99,102,241,0.38);
  }
  .ss-kpi:hover::after { opacity: 0.20; }
  .ss-kpi:hover { 
    box-shadow: 0 14px 48px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(99,102,241,0.12), var(--glow-accent); 
  }
  .ss-kpi.danger:hover { 
    border-color: rgba(255,77,109,0.42); 
    box-shadow: 0 14px 48px rgba(255,77,109,0.18), 0 0 0 1.5px rgba(255,77,109,0.14);
  }
  .ss-kpi.warn:hover   { 
    border-color: rgba(251,146,60,0.40);  
    box-shadow: 0 14px 48px rgba(251,146,60,0.18), 0 0 0 1.5px rgba(251,146,60,0.14);
  }
  .ss-kpi.safe:hover   { 
    border-color: rgba(16,255,197,0.35);  
    box-shadow: 0 14px 48px rgba(16,255,197,0.15), 0 0 0 1.5px rgba(16,255,197,0.12);
  }

  .ss-kpi-iconwrap {
    width: 40px; height: 40px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
    transition: all 0.3s ease;
  }
  .ss-kpi:hover .ss-kpi-iconwrap {
    transform: scale(1.12);
  }
  .ss-kpi-iconwrap svg { width: 18px; height: 18px; }

  .ss-kpi-label {
    font-family: var(--font-ui); font-size: 11px; font-weight: 700;
    color: var(--text-dim); margin-bottom: 8px;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .ss-kpi-value {
    font-family: var(--font-display);
    font-size: 36px; font-weight: 900;
    color: var(--text-bright); line-height: 1;
    letter-spacing: -0.02em;
  }
  .ss-kpi-value.danger { color: var(--danger); text-shadow: 0 0 28px rgba(255,77,109,0.7); }
  .ss-kpi-value.warn   { color: var(--amber);  text-shadow: 0 0 28px rgba(251,191,36,0.6); }
  .ss-kpi-value.safe   { color: var(--safe);   text-shadow: 0 0 28px rgba(16,255,197,0.6); }
  .ss-kpi-value.cyan   { color: var(--cyan);   text-shadow: 0 0 28px rgba(34,211,238,0.6); }
  .ss-kpi-value.violet { color: var(--violet); text-shadow: 0 0 28px rgba(167,139,250,0.6); }

  @keyframes kpi-pop {
    from { opacity:0; transform: translateY(12px) scale(0.85); }
    to   { opacity:1; transform: translateY(0) scale(1); }
  }
  .ss-kpi-animated { animation: kpi-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ════════════════════════════
     ANALYTICS GRIDS
  ════════════════════════════ */
  .ss-analytics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .ss-analytics-wide {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  .ss-panel-h    { height: 260px; }
  .ss-panel-h-lg { height: 320px; }

  /* ════════════════════════════
     TABLE
  ════════════════════════════ */
  .ss-table { width: 100%; border-collapse: collapse; }
  .ss-table thead tr { border-bottom: 1.5px solid rgba(99,102,241,0.18); }
  .ss-table th {
    font-family: var(--font-ui); font-size: 11.5px; font-weight: 800;
    color: var(--text-dim); text-align: left; padding: 13px 18px;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .ss-table td {
    font-family: var(--font-mono); font-size: 12px; color: var(--text);
    padding: 13px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .ss-table tbody tr { transition: background var(--transition); }
  .ss-table tbody tr:hover { background: rgba(99,102,241,0.08); }
  .ss-table tbody tr:hover td:first-child {
    box-shadow: inset 4px 0 0 var(--cyan);
  }

  /* ════════════════════════════
     SEVERITY BADGES
  ════════════════════════════ */
  .ss-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--font-ui); font-size: 10.5px; font-weight: 800;
    padding: 5px 12px; border-radius: 20px; letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ss-badge::before {
    content: ''; display: inline-block;
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    animation: badge-dot 2s ease-in-out infinite;
  }
  @keyframes badge-dot {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.6; transform: scale(0.75); }
  }
  .ss-badge.high   { 
    background: rgba(255,77,109,0.16); 
    color: var(--danger); 
    border: 1px solid rgba(255,77,109,0.36); 
    box-shadow: 0 0 12px rgba(255,77,109,0.18); 
  }
  .ss-badge.high::before { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
  .ss-badge.medium { 
    background: rgba(251,191,36,0.16); 
    color: var(--amber); 
    border: 1px solid rgba(251,191,36,0.34); 
  }
  .ss-badge.medium::before { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
  .ss-badge.low    { 
    background: rgba(16,255,197,0.12); 
    color: var(--safe); 
    border: 1px solid rgba(16,255,197,0.28); 
    box-shadow: 0 0 12px rgba(16,255,197,0.12); 
  }
  .ss-badge.low::before { background: var(--safe); box-shadow: 0 0 8px var(--safe); }

  /* ════════════════════════════
     TABLE TOOLBAR
  ════════════════════════════ */
  .ss-table-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .ss-table-count {
    font-family: var(--font-ui); font-size: 12px; color: var(--text-dim);
  }
  .ss-table-count span { color: var(--cyan); font-weight: 800; }

  /* ════════════════════════════
     TOAST NOTIFICATIONS
  ════════════════════════════ */
  @keyframes toastIn {
    from { opacity:0; transform: translateX(110%) scale(0.88) rotateY(-10deg); }
    to   { opacity:1; transform: translateX(0) scale(1) rotateY(0deg); }
  }
  @keyframes toastOut {
    from { opacity:1; transform: translateX(0) scale(1); }
    to   { opacity:0; transform: translateX(110%) scale(0.9); }
  }
  .ss-toast-container {
    position: fixed; bottom: 28px; right: 28px;
    z-index: 9999; display: flex; flex-direction: column;
    gap: 10px; align-items: flex-end; pointer-events: none;
  }
  .ss-toast {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 18px;
    background: rgba(10,12,24,0.97);
    backdrop-filter: blur(24px) saturate(200%);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255,77,109,0.32);
    box-shadow: 0 0 0 1px rgba(255,77,109,0.06), 0 12px 50px rgba(0,0,0,0.7),
                0 0 30px rgba(255,77,109,0.15);
    animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    pointer-events: auto; max-width: 360px; min-width: 260px;
  }
  .ss-toast.warn-toast {
    border-color: rgba(251,191,36,0.30);
    box-shadow: 0 0 0 1px rgba(251,191,36,0.06), 0 12px 50px rgba(0,0,0,0.7),
                0 0 30px rgba(251,191,36,0.15);
  }
  .ss-toast.exiting { animation: toastOut 0.25s ease forwards; }
  .ss-toast-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .ss-toast-body { flex:1; min-width:0; }
  .ss-toast-title { font-family: var(--font-ui); font-size: 11px; font-weight: 800; color: var(--danger); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
  .ss-toast-title.warn { color: var(--amber); }
  .ss-toast-msg { font-family: var(--font-mono); font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ss-toast-close { background:none; border:none; cursor:pointer; color:var(--muted); font-size:18px; line-height:1; padding: 0 2px; flex-shrink:0; transition: color var(--transition); }
  .ss-toast-close:hover { color: var(--text-bright); }

  /* ════════════════════════════
     SCANLINE EFFECT
  ════════════════════════════ */
  @keyframes scanline {
    0%   { transform: translateY(-100vh); }
    100% { transform: translateY(100vh); }
  }
  .ss-scanline {
    position: fixed; top: 0; left: 0; right: 0;
    height: 180px; pointer-events: none; z-index: 9990;
    background: linear-gradient(to bottom, transparent 0%,
      rgba(34,211,238,0.005) 35%,
      rgba(99,102,241,0.02) 50%,
      rgba(34,211,238,0.005) 65%,
      transparent 100%);
    animation: scanline 14s linear infinite;
  }

  /* ════════════════════════════
     ENTRY ANIMATIONS
  ════════════════════════════ */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-fade-1 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.05s; }
  .ss-fade-2 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.13s; }
  .ss-fade-3 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.22s; }
  .ss-fade-4 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.31s; }
  .ss-fade-5 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.40s; }
  .ss-fade-6 { animation: fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both; animation-delay: 0.50s; }

  /* ════════════════════════════
     FOOTER
  ════════════════════════════ */
  .ss-footer {
    margin-top: 48px;
    padding-top: 28px;
    border-top: 1.5px solid rgba(99,102,241,0.18);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ss-footer-brand {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase;
    display: flex; align-items: center; gap: 10px;
  }
  .ss-footer-status {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--safe); letter-spacing: 0.12em;
    display: flex; align-items: center; gap: 7px;
    text-shadow: 0 0 12px rgba(16,255,197,0.5);
  }

  /* ════════════════════════════
     UTILITY
  ════════════════════════════ */
  .ss-mono { font-family: var(--font-mono); }
  .ss-mb12 { margin-bottom: 12px; }
  .ss-mb16 { margin-bottom: 16px; }
  .ss-mb20 { margin-bottom: 24px; }
  .ss-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), rgba(34,211,238,0.1), transparent); margin: 28px 0; }
`;

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENTS
═══════════════════════════════════════════════════════════ */
function PanelTitle({ title, badge }) {
  return (
    <div className="ss-card-header">
      <div className="ss-card-title">
        <span className="ss-card-title-dot"/>
        {title}
      </div>
      {badge && <span className="ss-card-badge">{badge}</span>}
    </div>
  );
}

function SeverityBadge({ score }) {
  if (score > 7) return <span className="ss-badge high">CRITICAL</span>;
  if (score > 4) return <span className="ss-badge medium">MEDIUM</span>;
  return <span className="ss-badge low">LOW</span>;
}

function ThreatTicker({ threats }) {
  if (!threats.length) return null;
  const items = threats.slice(0, 20).map(t => ({
    label: t?.prediction ?? "Unknown",
    ip:    t?.source_ip ?? "—",
    score: t?.analysis?.severity_score ?? 0,
  }));
  const all = [...items, ...items];

  return (
    <div className="ss-ticker">
      <div className="ss-ticker-label">
        <span className="ss-ticker-dot"/>
        LIVE FEED
      </div>
      <div className="ss-ticker-scroll">
        <div className="ss-ticker-inner">
          {all.map((item, i) => (
            <div className="ss-ticker-item" key={i}>
              <span className={item.score > 7 ? "hi" : item.score > 4 ? "md" : "lo"}>
                ▸ {item.label}
              </span>
              <span style={{ opacity: 0.4 }}>{item.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text, sub, icon }) {
  const icons = {
    ai: <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zM4 8a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2zM18 8a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>,
    analytics: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    tools: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    log: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  };
  return (
    <div className="ss-section ss-mb12">
      {icon && (
        <div className="ss-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[icon] || null}
          </svg>
        </div>
      )}
      <span className="ss-section-label">{text}</span>
      {sub && <span className="ss-section-sub">{sub}</span>}
      <span className="ss-section-line"/>
    </div>
  );
}

/* ─── Animated counter hook ─── */
function useAnimatedCount(target, duration = 700) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff  = target - start;
    if (diff === 0) return;
    const steps = 28;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setVal(Math.round(start + diff * ease));
      if (step >= steps) { clearInterval(t); prev.current = target; }
    }, duration / steps);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

/* ─── Toast notification ─── */
let _toastId = 0;
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="ss-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`ss-toast${t.warn ? " warn-toast" : ""}${t.exiting ? " exiting" : ""}`}>
          <span className="ss-toast-icon">{t.icon}</span>
          <div className="ss-toast-body">
            <div className={`ss-toast-title${t.warn ? " warn" : ""}`}>{t.title}</div>
            <div className="ss-toast-msg">{t.msg}</div>
          </div>
          <button className="ss-toast-close" onClick={() => onDismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI icon components ─── */
function KpiIcon({ color, bg, shadow, children }) {
  return (
    <div className="ss-kpi-iconwrap" style={{ background: bg, boxShadow: shadow || `0 0 16px ${color}30` }}>
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [threats,       setThreats]       = useState([]);
  const [connected,     setConnected]     = useState(true);
  const [cpu,           setCpu]           = useState(0);
  const [flow,          setFlow]          = useState(0);
  const [search,        setSearch]        = useState("");
  const [activeTime,    setActiveTime]    = useState("1h");
  const [clock,         setClock]         = useState(new Date());
  const [toasts,        setToasts]        = useState([]);
  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem("auth") === "true"
  );

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const addToast = useCallback((title, msg, icon = "🔴", warn = false) => {
    const id = ++_toastId;
    setToasts(prev => [...prev.slice(-4), { id, title, msg, icon, warn, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
    }, 5000);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  };

  const loadThreats = async () => {
    try {
      const res = await axios.get(`${API}/api/threats`);
      setThreats(res.data?.threats || []);
    } catch (e) { console.error(e); }
  };

  const loadMetrics = async () => {
    try {
      const res     = await axios.get(`${API}/api/metrics`);
      const flowRes = await axios.get(`${API}/api/flow`);
      setCpu(res.data.cpu);
      setFlow(flowRes.data.requests_per_sec);
    } catch (e) { console.error(e); }
  };

  const connectWS = () => {
    const ws = new WebSocket("wss://securesense.onrender.com/ws/alerts");
    ws.onopen  = () => { setConnected(true); setInterval(() => ws.send("ping"), 5000); };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "new_threat") {
        const t = msg.data;
        setThreats(prev => [t, ...prev]);
        const sev = t?.analysis?.severity_score ?? 0;
        if (sev > 7)      addToast("Critical Threat Detected", `${t.prediction || "Unknown"} · ${t.source_ip || "—"}`, "🔴", false);
        else if (sev > 4) addToast("New Threat Detected", `${t.prediction || "Unknown"} · Score ${sev}`, "🟠", true);
      }
    };
    ws.onclose = () => { setConnected(true); setTimeout(connectWS, 3000); };
  };

  useEffect(() => {
    loadThreats();
    connectWS();
    const interval = setInterval(loadMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredThreats = useMemo(() => {
    if (!search) return threats;
    return threats.filter(t =>
      t?.prediction?.toLowerCase().includes(search.toLowerCase()) ||
      t?.source_ip?.includes(search)
    );
  }, [search, threats]);

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  const highCount = threats.filter(t => t?.analysis?.severity_score > 7).length;
  const medCount  = threats.filter(t => t?.analysis?.severity_score > 4).length;
  const lowCount  = threats.filter(t => t?.analysis?.severity_score <= 4).length;

  const animThreats = useAnimatedCount(threats.length);
  const animHigh    = useAnimatedCount(highCount);
  const animMed     = useAnimatedCount(medCount);
  const animLow     = useAnimatedCount(lowCount);
  const animCpu     = useAnimatedCount(Math.round(cpu));
  const animFlow    = useAnimatedCount(Math.round(flow));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ss-scanline" />

      {/* Ambient neon orbs */}
      <div className="ss-orb ss-orb-1" />
      <div className="ss-orb ss-orb-2" />
      <div className="ss-orb ss-orb-3" />
      <div className="ss-orb ss-orb-4" />
      <div className="ss-orb ss-orb-5" />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="ss-root">
        <div className="ss-bg" />

        {/* ── HEADER ── */}
        <header className={`ss-header${connected ? " live" : ""}`}>
          <div className="ss-logo">
            <div className="ss-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div className="ss-logo-text">
              <div className="ss-logo-name">SecureSense</div>
              <div className="ss-logo-sub">Cyber Threat Intelligence Platform</div>
            </div>
          </div>

          <nav className="ss-nav">
            <button className="ss-nav-item active">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              Overview
            </button>
            <button className="ss-nav-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Events
            </button>
            <button className="ss-nav-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Timeline
            </button>
          </nav>

          <div className="ss-header-right">
            <div className="ss-clock">
              {clock.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
              &nbsp;·&nbsp;
              {clock.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: false })}
            </div>

            <div className={`ss-status ${connected ? "" : "offline"}`}>
              <span className={`ss-dot ${connected ? "" : "off"}`}/>
              {connected ? "Live" : "Offline"}
            </div>

            <button className="ss-logout"
              onClick={() => { localStorage.removeItem("auth"); window.location.reload(); }}>
              Sign out
            </button>
          </div>
        </header>

        {/* ── PAGE BODY ── */}
        <div className="ss-content">

          {/* Live threat ticker */}
          <ThreatTicker threats={threats} />

          {/* ─── KPI ROW - More Prominent ─── */}
          <SectionLabel text="Security Status" sub="Real-time metrics" icon="analytics" />
          <div className="ss-kpi-grid ss-fade-1">
            <div className="ss-kpi danger">
              <KpiIcon color="#ff4d6d" bg="rgba(255,77,109,0.12)">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </KpiIcon>
              <div className="ss-kpi-label">Critical Threats</div>
              <div className="ss-kpi-value danger ss-kpi-animated" key={`h${animHigh}`}>{animHigh}</div>
            </div>
            <div className="ss-kpi warn">
              <KpiIcon color="#fbbf24" bg="rgba(251,191,36,0.12)">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </KpiIcon>
              <div className="ss-kpi-label">Medium Risk</div>
              <div className="ss-kpi-value warn ss-kpi-animated" key={`m${animMed}`}>{animMed}</div>
            </div>
            <div className="ss-kpi safe">
              <KpiIcon color="#10ffc5" bg="rgba(16,255,197,0.10)">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </KpiIcon>
              <div className="ss-kpi-label">Low Risk</div>
              <div className="ss-kpi-value safe ss-kpi-animated" key={`l${animLow}`}>{animLow}</div>
            </div>
            <div className="ss-kpi">
              <KpiIcon color="#818cf8" bg="rgba(99,102,241,0.12)">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </KpiIcon>
              <div className="ss-kpi-label">Total Events</div>
              <div className="ss-kpi-value ss-kpi-animated" key={animThreats}>{animThreats}</div>
            </div>
            <div className="ss-kpi">
              <KpiIcon color="#22d3ee" bg="rgba(34,211,238,0.12)">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </KpiIcon>
              <div className="ss-kpi-label">CPU Usage</div>
              <div className="ss-kpi-value cyan ss-kpi-animated" key={animCpu}>{animCpu}%</div>
            </div>
            <div className="ss-kpi">
              <KpiIcon color="#a78bfa" bg="rgba(167,139,250,0.12)">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </KpiIcon>
              <div className="ss-kpi-label">Requests/sec</div>
              <div className="ss-kpi-value violet ss-kpi-animated" key={animFlow}>{animFlow}</div>
            </div>
          </div>

          {/* ─── CONTROL & SEARCH SECTION ─── */}
          <SectionLabel text="Threat Intelligence" sub="Search & filter" icon="analytics" />
          <div className="ss-controls ss-mb12">
            <div className="ss-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ss-search"
                placeholder="Search by threat type or IP address…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="ss-time-group">
              {["5m","15m","1h","24h"].map(t => (
                <button
                  key={t}
                  className={`ss-btn ${activeTime === t ? "active" : ""}`}
                  onClick={() => setActiveTime(t)}
                >{t}</button>
              ))}
            </div>

            <div className="ss-events-badge">
              <div style={{ fontFamily:"var(--font-ui)", fontSize:"10px", color:"var(--text-dim)", fontWeight:600, marginBottom:"3px", letterSpacing:"0.04em", textTransform:"uppercase" }}>Events</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"26px", fontWeight:"900", color:"var(--cyan)", lineHeight:1, letterSpacing:"-0.02em", textShadow:"0 0 20px rgba(34,211,238,0.5)" }}>{threats.length}</div>
            </div>
          </div>

          {/* ─── LIVE ANALYTICS GRID ─── */}
          <div className="ss-analytics ss-fade-4">
            <div className="ss-card ss-panel-h">
              <PanelTitle title="Threat Trend" badge="24h"/>
              <ThreatTrend threats={filteredThreats}/>
            </div>
            <div className="ss-card ss-panel-h">
              <PanelTitle title="Type Distribution" badge="LIVE"/>
              <ThreatDistribution threats={filteredThreats}/>
            </div>
            <div className="ss-card ss-panel-h">
              <PanelTitle title="Top Attacks" badge="TOP 5"/>
              <TopAttacks threats={filteredThreats}/>
            </div>
            <div className="ss-card ss-panel-h">
              <PanelTitle title="Timeline View" badge="RECENT"/>
              <AttackTimeline threats={filteredThreats}/>
            </div>
          </div>

          {/* ─── GEO + SEVERITY ─── */}
          <SectionLabel text="Geospatial Analysis" sub="Global threat landscape" icon="analytics" />
          <div className="ss-analytics-wide ss-fade-5">
            <div className="ss-card ss-panel-h-lg">
              <PanelTitle title="Global Attack Map" badge="GEO-IP"/>
              <GeoMap threats={filteredThreats}/>
            </div>
            <div className="ss-card ss-panel-h-lg">
              <PanelTitle title="Severity Breakdown" badge="ANALYSIS"/>
              <SeverityChart threats={filteredThreats}/>
            </div>
          </div>

          {/* ─── AI INTELLIGENCE Section ─── */}
          <SectionLabel text="AI Intelligence Center" sub="Powered by GPT-4o" icon="ai" />
          <div className="ss-ai-row ss-mb20">
            <div className="ss-card ss-ai-card ss-fade-2">
              <PanelTitle title="Threat Analysis Summary" badge="GPT-4o" />
              <AISummary threats={threats} />
            </div>
            <div className="ss-card ss-ai-card ss-fade-3">
              <PanelTitle title="AI Security Assistant" badge="Interactive" />
              <AIAssistant />
            </div>
          </div>

          {/* ─── AI SECURITY TOOLS ─── */}
          <SectionLabel text="Security Toolkit" sub="6 Advanced Modules" icon="tools" />
          <div className="ss-card ss-mb20 ss-fade-5">
            <PanelTitle title="Security Toolkit" badge="6 MODULES"/>
            <SecurityTools />
          </div>

          {/* ─── THREAT MONITORING: Blocked Threats & Live Feed ─── */}
          <SectionLabel text="Threat Monitoring" sub="Blocked & Live events" icon="log" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"32px" }}>
            <div className="ss-card ss-fade-5" style={{ minHeight:"500px" }}>
              <BlockedThreats />
            </div>
            <div className="ss-card ss-fade-5" style={{ minHeight:"500px" }}>
              <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
                <PanelTitle title="Live Threat Stream" badge={`${threats.length} LIVE`}/>
                <LiveFeed threats={filteredThreats}/>
              </div>
            </div>
          </div>

          {/* ─── THREAT EVENT LOG ─── */}
          <SectionLabel text="Event Log & Analysis" sub={`${filteredThreats.length} total events`} icon="log" />
          <div className="ss-card ss-fade-6">
            <div className="ss-table-toolbar">
              <PanelTitle title="Recent Threat Events" />
              <div className="ss-table-count">
                Showing <span>{Math.min(filteredThreats.length, 10)}</span> of <span>{filteredThreats.length}</span> events
              </div>
            </div>

            <table className="ss-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Threat Type</th>
                  <th>Severity</th>
                  <th>Source IP</th>
                  <th>Timestamp</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredThreats.slice(0, 10).map((t, i) => (
                  <tr key={i}>
                    <td style={{ color:"var(--muted)", fontSize:"11px", fontFamily:"var(--font-mono)" }}>{String(i+1).padStart(2,"0")}</td>
                    <td style={{ color:"var(--text-bright)", fontWeight:600, fontSize:"13px", fontFamily:"var(--font-ui)" }}>{t?.prediction ?? "—"}</td>
                    <td><SeverityBadge score={t?.analysis?.severity_score ?? 0}/></td>
                    <td style={{ color:"var(--cyan)", fontFamily:"var(--font-mono)", fontSize:"12px", textShadow:"0 0 10px rgba(34,211,238,0.3)" }}>
                      {t?.source_ip ?? "—"}
                    </td>
                    <td style={{ color:"var(--text-dim)", fontSize:"11px" }}>
                      {clock.toLocaleTimeString("en-US", { hour12:false })}
                    </td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ position:"relative", height:"6px", borderRadius:"3px",
                          width:"80px", background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                          <div style={{
                            position:"absolute", left:0, top:0, bottom:0,
                            width:`${Math.min((t?.analysis?.severity_score ?? 0) * 10, 100)}%`,
                            borderRadius:"3px",
                            background: (t?.analysis?.severity_score ?? 0) > 7
                              ? "linear-gradient(90deg, #e11d48, #ff4d6d, #f472b6)"
                              : (t?.analysis?.severity_score ?? 0) > 4
                              ? "linear-gradient(90deg, #d97706, #fbbf24, #fb923c)"
                              : "linear-gradient(90deg, #059669, #10ffc5, #22d3ee)",
                            boxShadow: (t?.analysis?.severity_score ?? 0) > 7
                              ? "0 0 10px rgba(255,77,109,0.6)"
                              : (t?.analysis?.severity_score ?? 0) > 4
                              ? "0 0 10px rgba(251,191,36,0.5)"
                              : "0 0 10px rgba(16,255,197,0.5)",
                          }}/>
                        </div>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-dim)", minWidth:"16px" }}>
                          {t?.analysis?.severity_score ?? 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredThreats.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{
                      textAlign:"center", color:"var(--safe)", padding:"48px",
                      fontFamily:"var(--font-mono)", fontSize:"13px", fontWeight:600,
                      letterSpacing:"0.06em", textShadow:"0 0 16px rgba(16,255,197,0.4)"
                    }}>
                      ✓ &nbsp; No events detected — all systems nominal
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="ss-footer">
            <div className="ss-footer-brand">
              <span style={{ color:"var(--cyan)", opacity:0.7 }}>◈</span>
              SecureSense CTIP · v2.4.1 · {new Date().getFullYear()}
            </div>
            <div className="ss-footer-status">
              <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--safe)",display:"inline-block",boxShadow:"0 0 10px var(--safe), 0 0 20px rgba(16,255,197,0.4)" }}/>
              All systems operational
            </div>
          </div>

        </div>{/* ss-content */}
      </div>{/* ss-root */}
    </>
  );
}