import { useState } from "react";
import axios from "axios";

/* ─────────────────────────────────────────
   PASTE YOUR VIRUSTOTAL API KEY HERE
   ───────────────────────────────────────── */
const VT_KEY = "c7fd7ec902baba9a48693c7e1bfabee5feeff4563de54acd67b8702b6b5d8c0e";

const VT  = "https://www.virustotal.com/api/v3";
const NVD = "https://services.nvd.nist.gov/rest/json/cves/2.0";

/* ── helpers ── */
const vtHeaders    = { "x-apikey": VT_KEY, "Content-Type": "application/x-www-form-urlencoded" };
const vtGetHeaders = { "x-apikey": VT_KEY };

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ── HIBP k-anonymity (SHA-1 prefix — never sends full password) ── */
async function hibpCheck(password) {
  const buf  = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-1", buf);
  const sha1 = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
  for (const line of res.data.split("\n")) {
    const [h, count] = line.trim().split(":");
    if (h === suffix) return parseInt(count, 10);
  }
  return 0;
}

/* ── Phishing URL heuristic (fully offline) ── */
function phishingUrlScore(url) {
  let score = 0;
  const reasons = [];
  const u = url.toLowerCase();

  const shorteners = ["bit.ly","tinyurl","t.co","goo.gl","shorte.st","is.gd","adf.ly"];
  if (shorteners.some(s => u.includes(s)))                { score += 25; reasons.push("URL shortening service detected"); }
  if (/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/.test(u))      { score += 25; reasons.push("IP-based URL (no real domain)"); }
  const badTlds = [".zip",".xyz",".top",".lol",".monster",".click",".rest"];
  if (badTlds.some(t => u.endsWith(t)))                   { score += 15; reasons.push("Suspicious top-level domain"); }
  const bait = ["login","secure","verify","paypal","bank","account"];
  if (bait.some(b => u.includes(b)))                      { score += 20; reasons.push("Credential bait keywords in URL"); }
  if (url.length > 80)                                    { score += 10; reasons.push("Unusually long URL"); }
  if (u.includes("@") || u.includes("%"))                 { score += 10; reasons.push("Obfuscation characters (@ or %)"); }
  if (u.includes("xn--"))                                 { score += 25; reasons.push("Punycode — possible homograph attack"); }

  score = Math.min(score, 100);
  const verdict = score >= 65 ? "MALICIOUS" : score >= 35 ? "SUSPICIOUS" : "CLEAN";
  return { score, verdict, reasons };
}

/* ── shared card base style ── */
const card = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg, 10px)",
  padding: "14px",
  position: "relative",
};

/* ════════════════════════════════════════
   SHARED UI PRIMITIVES
════════════════════════════════════════ */
function ToolCard({ title, icon, children }) {
  return (
    <div style={card}>
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(32,160,255,0.3),transparent)"
      }}/>
      <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{
          fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
          fontSize:10, fontWeight:600, letterSpacing:"0.12em",
          textTransform:"uppercase", color:"var(--accent,#20a0ff)",
          display:"flex", alignItems:"center", gap:6
        }}>
          <span style={{
            display:"inline-block", width:3, height:12,
            background:"var(--accent,#20a0ff)", borderRadius:2,
            boxShadow:"0 0 6px var(--accent,#20a0ff)"
          }}/>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, disabled, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display:"flex", alignItems:"center",
      background:"var(--bg,#060a10)",
      border:`1px solid ${focused ? "var(--accent,#20a0ff)" : "var(--border,rgba(32,160,255,0.12))"}`,
      borderRadius:6,
      boxShadow: focused ? "0 0 8px rgba(32,160,255,0.2)" : "none",
      padding:"0 10px", transition:"all 0.18s",
      opacity: disabled ? 0.5 : 1
    }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
        style={{
          background:"transparent", border:"none", outline:"none",
          fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
          fontSize:12, color:"var(--text,#c8daf0)",
          width:"100%", padding:"9px 0",
        }}
      />
    </div>
  );
}

function ScanButton({ onClick, loading, label, loadingLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      style={{
        marginTop:10, width:"100%",
        fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
        fontSize:11, fontWeight:600, letterSpacing:"0.1em",
        cursor: loading ? "not-allowed" : "pointer",
        border:"1px solid var(--accent,#20a0ff)",
        background: loading ? "rgba(32,160,255,0.05)" : "rgba(32,160,255,0.1)",
        color:"var(--accent,#20a0ff)",
        padding:"8px 0", borderRadius:6,
        transition:"all 0.18s",
        opacity: loading ? 0.7 : 1,
        display:"flex", alignItems:"center", justifyContent:"center", gap:7
      }}
    >
      {loading ? <><Spinner/> {loadingLabel}</> : label}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{
      display:"inline-block", width:10, height:10,
      border:"2px solid rgba(32,160,255,0.3)",
      borderTopColor:"var(--accent,#20a0ff)",
      borderRadius:"50%", animation:"spin 0.7s linear infinite"
    }}/>
  );
}

/* ════════════════════════════════════════
   RESULT PANEL  (shared, full-width)
════════════════════════════════════════ */
function ResultPanel({ result, onClose }) {
  if (!result) return null;

  const isError = !!result.error;
  const isURL   = result._type === "url";
  const isIP    = result._type === "ip";
  const isCVE   = result._type === "cve";
  const isHash  = result._type === "hash";
  const isPwd   = result._type === "password";
  const isPhish = result._type === "phish";

  return (
    <div style={{
      ...card,
      borderColor: isError ? "rgba(255,59,107,0.3)" : "rgba(0,229,195,0.2)",
      gridColumn:"1 / -1", marginTop:0
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{
          fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
          fontSize:10, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase",
          color: isError ? "var(--danger,#ff3b6b)" : "var(--safe,#00e5c3)",
          display:"flex", alignItems:"center", gap:6
        }}>
          <span style={{
            display:"inline-block", width:3, height:12, borderRadius:2,
            background: isError ? "var(--danger,#ff3b6b)" : "var(--safe,#00e5c3)"
          }}/>
          {isError ? "Error" : "Scan Result"}
        </span>
        <button onClick={onClose} style={{
          background:"none", border:"none", cursor:"pointer",
          color:"var(--muted,#4a6280)", fontSize:16, lineHeight:1
        }}>×</button>
      </div>

      {isError           && <ErrorMsg msg={result.error}/>}
      {(isURL || isIP) && !isError && <VTResult   data={result}/>}
      {isCVE           && !isError && <CVEResult  data={result}/>}
      {isHash          && !isError && <HashResult data={result}/>}
      {isPwd           && !isError && <PwdResult  data={result}/>}
      {isPhish         && !isError && <PhishResult data={result}/>}
    </div>
  );
}

/* ── helpers inside ResultPanel ── */
function ErrorMsg({ msg }) {
  return <p style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:12, color:"var(--danger,#ff3b6b)" }}>{msg}</p>;
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background:"var(--bg,#060a10)", border:"1px solid var(--border,rgba(32,160,255,0.12))",
      borderRadius:6, padding:"10px 14px", textAlign:"center", flex:1
    }}>
      <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:9,
        letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted,#4a6280)", marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800,
        color: color || "var(--text,#c8daf0)", textShadow: color ? `0 0 10px ${color}55` : "none" }}>{value}</div>
    </div>
  );
}

function EngineList({ results }) {
  const hits = Object.entries(results || {})
    .filter(([, v]) => v.category === "malicious" || (v.result && v.result !== "clean" && v.result !== "unrated"))
    .slice(0, 15);
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:9,
        letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted,#4a6280)", marginBottom:6 }}>
        Engine Detections
      </div>
      <div style={{ maxHeight:120, overflowY:"auto", display:"flex", flexDirection:"column", gap:2 }}>
        {hits.length > 0 ? hits.map(([engine, v]) => (
          <div key={engine} style={{
            display:"flex", justifyContent:"space-between",
            fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:10,
            background:"rgba(255,59,107,0.05)", borderRadius:4, padding:"3px 8px",
            borderLeft:"2px solid var(--danger,#ff3b6b)"
          }}>
            <span style={{ color:"var(--text,#c8daf0)" }}>{engine}</span>
            <span style={{ color:"var(--danger,#ff3b6b)" }}>{v.result}</span>
          </div>
        )) : (
          <span style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
            color:"var(--safe,#00e5c3)" }}>No malicious detections.</span>
        )}
      </div>
    </div>
  );
}

/* ── VT result (URL + IP reuse same display) ── */
function VTResult({ data }) {
  const stats   = data.last_analysis_stats || {};
  const mal     = stats.malicious  ?? 0;
  const sus     = stats.suspicious ?? 0;
  const clean   = stats.harmless   ?? stats.undetected ?? 0;
  const total   = Object.values(stats).reduce((a, b) => a + b, 0);
  const verdict = mal > 0 ? "MALICIOUS" : sus > 0 ? "SUSPICIOUS" : "CLEAN";
  const vColor  = mal > 0 ? "var(--danger,#ff3b6b)" : sus > 0 ? "var(--warn,#ffab00)" : "var(--safe,#00e5c3)";

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <StatBox label="Verdict"    value={verdict} color={vColor}/>
        <StatBox label="Malicious"  value={mal}     color={mal > 0 ? "var(--danger,#ff3b6b)" : undefined}/>
        <StatBox label="Suspicious" value={sus}     color={sus > 0 ? "var(--warn,#ffab00)"   : undefined}/>
        <StatBox label="Clean"      value={clean}   color="var(--safe,#00e5c3)"/>
        <StatBox label="Engines"    value={total}/>
      </div>
      {data.url && (
        <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
          color:"var(--muted,#4a6280)", wordBreak:"break-all", marginBottom:6 }}>
          <span style={{ color:"var(--accent,#20a0ff)" }}>URL: </span>{data.url}
        </div>
      )}
      {data.ip_address && (
        <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
          color:"var(--muted,#4a6280)", marginBottom:6 }}>
          <span style={{ color:"var(--accent,#20a0ff)" }}>IP: </span>{data.ip_address}
          {data.country  && <span style={{ marginLeft:10 }}>🌍 {data.country}</span>}
          {data.as_owner && <span style={{ marginLeft:10, color:"var(--text,#c8daf0)" }}>{data.as_owner}</span>}
        </div>
      )}
      <EngineList results={data.last_analysis_results}/>
    </div>
  );
}

/* ── CVE result ── */
function CVEResult({ data }) {
  const vuln   = data.vulnerabilities?.[0]?.cve;
  if (!vuln) return <ErrorMsg msg="No CVE data found."/>;

  const desc   = vuln.descriptions?.find(d => d.lang === "en")?.value || "No description.";
  const cvss   = vuln.metrics?.cvssMetricV31?.[0]?.cvssData || vuln.metrics?.cvssMetricV2?.[0]?.cvssData;
  const score  = cvss?.baseScore;
  const sColor = score >= 9 ? "var(--danger,#ff3b6b)" : score >= 7 ? "var(--warn,#ffab00)" : score >= 4 ? "#ffcc44" : "var(--safe,#00e5c3)";

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {score              && <StatBox label="CVSS Score"    value={score}               color={sColor}/>}
        {cvss?.baseSeverity && <StatBox label="Severity"      value={cvss.baseSeverity}   color={sColor}/>}
        {cvss?.attackVector && <StatBox label="Attack Vector" value={cvss.attackVector}/>}
      </div>
      <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
        color:"var(--text,#c8daf0)", lineHeight:1.7, marginBottom:10 }}>{desc}</div>
      {vuln.references?.slice(0, 3).map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
          display:"block", fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
          fontSize:10, color:"var(--accent,#20a0ff)", marginBottom:3,
          wordBreak:"break-all", textDecoration:"none"
        }}>{r.url}</a>
      ))}
    </div>
  );
}

/* ── Hash result ── */
function HashResult({ data }) {
  const stats   = data.last_analysis_stats || {};
  const mal     = stats.malicious  ?? 0;
  const sus     = stats.suspicious ?? 0;
  const und     = stats.undetected ?? 0;
  const total   = Object.values(stats).reduce((a, b) => a + b, 0);
  const verdict = mal > 0 ? "MALICIOUS" : sus > 0 ? "SUSPICIOUS" : "CLEAN";
  const vColor  = mal > 0 ? "var(--danger,#ff3b6b)" : sus > 0 ? "var(--warn,#ffab00)" : "var(--safe,#00e5c3)";

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <StatBox label="Verdict"    value={verdict} color={vColor}/>
        <StatBox label="Malicious"  value={mal}     color={mal > 0 ? "var(--danger,#ff3b6b)" : undefined}/>
        <StatBox label="Suspicious" value={sus}     color={sus > 0 ? "var(--warn,#ffab00)"   : undefined}/>
        <StatBox label="Undetected" value={und}     color="var(--safe,#00e5c3)"/>
        <StatBox label="Engines"    value={total}/>
      </div>
      {data.meaningful_name && (
        <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
          color:"var(--muted,#4a6280)", marginBottom:4 }}>
          <span style={{ color:"var(--accent,#20a0ff)" }}>File: </span>{data.meaningful_name}
          {data.type_description && <span style={{ marginLeft:10 }}>· {data.type_description}</span>}
        </div>
      )}
      {data.size && (
        <div style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:11,
          color:"var(--muted,#4a6280)", marginBottom:10 }}>
          <span style={{ color:"var(--accent,#20a0ff)" }}>Size: </span>{(data.size / 1024).toFixed(1)} KB
        </div>
      )}
      <EngineList results={data.last_analysis_results}/>
    </div>
  );
}

/* ── Password result ── */
function PwdResult({ data }) {
  const pwned   = data.count > 0;
  const vColor  = pwned ? "var(--danger,#ff3b6b)" : "var(--safe,#00e5c3)";
  const verdict = pwned ? "PWNED" : "SAFE";

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <StatBox label="Verdict"      value={verdict}                               color={vColor}/>
        <StatBox label="Breach Count" value={pwned ? data.count.toLocaleString() : "0"} color={vColor}/>
      </div>
      <p style={{ fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)", fontSize:12,
        color: vColor, lineHeight:1.7 }}>
        {pwned
          ? `⚠️  Found in ${data.count.toLocaleString()} known data breach${data.count > 1 ? "es" : ""}. Change it immediately and enable MFA.`
          : "✅  Not found in any known breach database. Still, use a unique password per site."}
      </p>
    </div>
  );
}

/* ── Phishing link result ── */
function PhishResult({ data = {} }) {
  const vColor = data.verdict === "MALICIOUS" ? "var(--danger,#ff3b6b)"
              : data.verdict === "SUSPICIOUS" ? "var(--warn,#ffab00)"
              : "var(--safe,#00e5c3)";

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <StatBox label="Verdict" value={data.verdict || "UNKNOWN"} color={vColor}/>
        <StatBox label="Risk Score" value={`${data.score || 0}/100`} color={vColor}/>
      </div>

      <div style={{ marginBottom:12 }}>
        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
          <div style={{
            height:"100%",
            width:`${data?.score || 0}%`,
            borderRadius:2,
            background: vColor,
            boxShadow:`0 0 6px ${vColor}`,
            transition:"width 0.4s ease"
          }}/>
        </div>
      </div>

      {data?.reasons?.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{
            fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
            fontSize:9,
            letterSpacing:"0.1em",
            textTransform:"uppercase",
            color:"var(--muted,#4a6280)",
            marginBottom:4
          }}>
            Detection Reasons
          </div>

          {data.reasons.map((r, i) => (
            <div key={i} style={{
              fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
              fontSize:11,
              background:"rgba(255,171,0,0.05)",
              borderRadius:4,
              padding:"4px 10px",
              borderLeft:`2px solid ${vColor}`,
              color:"var(--text,#c8daf0)"
            }}>
              • {r}
            </div>
          ))}
        </div>
      ) : (
        <p style={{
          fontFamily:"var(--font-mono,'IBM Plex Mono',monospace)",
          fontSize:12,
          color:"var(--safe,#00e5c3)"
        }}>
          ✅ No phishing indicators detected.
        </p>
      )}
    </div>
  );
}
/* ════════════════════════════════════════
  MAIN EXPORT
════════════════════════════════════════ */
export default function SecurityTools() {
  const [url,   setUrl]   = useState("");
  const [ip,    setIp]    = useState("");
  const [cve,   setCve]   = useState("");
  const [hash,  setHash]  = useState("");
  const [pwd,   setPwd]   = useState("");
  const [phUrl, setPhUrl] = useState("");

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState("");   // "url" | "ip" | "cve" | "hash" | "pwd" | ""

  /* ── URL SCAN ── */
  const scanURL = async () => {
    if (!url.trim()) return;
    try {
      setLoading("url"); setResult(null);
      const submitRes = await axios.post(
        `${VT}/urls`, `url=${encodeURIComponent(url)}`, { headers: vtHeaders }
      );
      const analysisId = submitRes.data?.data?.id;
      if (!analysisId) throw new Error("No analysis ID returned");

      let status = "queued", attempts = 0;
      while (status !== "completed" && attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await axios.get(`${VT}/analyses/${analysisId}`, { headers: vtGetHeaders });
        status = poll.data?.data?.attributes?.status;
        attempts++;
      }

      const urlId  = b64url(url);
      const report = await axios.get(`${VT}/urls/${urlId}`, { headers: vtGetHeaders });
      setResult({ ...report.data.data.attributes, _type: "url" });
    } catch (err) {
      setResult({ error: err.response?.data?.error?.message || err.message || "URL scan failed" });
    }
    setLoading("");
  };

  /* ── IP REPUTATION ── */
  const checkIP = async () => {
    if (!ip.trim()) return;
    try {
      setLoading("ip"); setResult(null);
      const res = await axios.get(`${VT}/ip_addresses/${ip.trim()}`, { headers: vtGetHeaders });
      setResult({ ...res.data.data.attributes, ip_address: ip.trim(), _type: "ip" });
    } catch (err) {
      setResult({ error: err.response?.data?.error?.message || err.message || "IP check failed" });
    }
    setLoading("");
  };

  /* ── CVE LOOKUP ── */
  const lookupCVE = async () => {
    if (!cve.trim()) return;
    try {
      setLoading("cve"); setResult(null);
      const res = await axios.get(`${NVD}?cveId=${cve.trim().toUpperCase()}`);
      if (!res.data?.vulnerabilities?.length) throw new Error("CVE not found");
      setResult({ ...res.data, _type: "cve" });
    } catch (err) {
      setResult({ error: err.response?.data?.message || err.message || "CVE lookup failed" });
    }
    setLoading("");
  };

  /* ── FILE HASH CHECK (VirusTotal) ── */
  const checkHash = async () => {
    if (!hash.trim()) return;
    try {
      setLoading("hash"); setResult(null);
      const res = await axios.get(`${VT}/files/${hash.trim()}`, { headers: vtGetHeaders });
      setResult({ ...res.data.data.attributes, _type: "hash" });
    } catch (err) {
      const msg = err.response?.status === 404
        ? "Hash not found in VirusTotal database."
        : err.response?.data?.error?.message || err.message || "Hash check failed";
      setResult({ error: msg });
    }
    setLoading("");
  };

  /* ── PASSWORD BREACH CHECK (HIBP) ── */
  const checkPassword = async () => {
    if (!pwd.trim()) return;
    try {
      setLoading("pwd"); setResult(null);
      const count = await hibpCheck(pwd);
      setResult({ count, _type: "password" });
    } catch (err) {
      setResult({ error: "HIBP lookup failed — service may be unreachable." });
    }
    setLoading("");
  };

  /* ── PHISHING LINK DETECTOR (offline, instant) ── */
  const analyzePhish = () => {
    if (!phUrl.trim()) return;
    setResult({ ...phishingUrlScore(phUrl.trim()), _type: "phish" });
  };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Row 1: original 3 tools ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
        <ToolCard title="URL Scanner" icon="🔍">
          <StyledInput value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com" disabled={!!loading}/>
          <ScanButton onClick={scanURL} loading={loading==="url"} label="SCAN URL" loadingLabel="SCANNING…"/>
        </ToolCard>

        <ToolCard title="IP Reputation" icon="🌐">
          <StyledInput value={ip} onChange={e => setIp(e.target.value)}
            placeholder="8.8.8.8" disabled={!!loading}/>
          <ScanButton onClick={checkIP} loading={loading==="ip"} label="CHECK IP" loadingLabel="CHECKING…"/>
        </ToolCard>

        <ToolCard title="CVE Lookup" icon="📋">
          <StyledInput value={cve} onChange={e => setCve(e.target.value)}
            placeholder="CVE-2024-1234" disabled={!!loading}/>
          <ScanButton onClick={lookupCVE} loading={loading==="cve"} label="LOOKUP CVE" loadingLabel="LOADING…"/>
        </ToolCard>
      </div>

      {/* ── Row 2: 3 new tools ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom: result ? 10 : 0 }}>
        <ToolCard title="File Hash Check" icon="🔐">
          <StyledInput value={hash} onChange={e => setHash(e.target.value)}
            placeholder="MD5 / SHA-1 / SHA-256" disabled={!!loading}/>
          <ScanButton onClick={checkHash} loading={loading==="hash"} label="CHECK HASH" loadingLabel="CHECKING…"/>
        </ToolCard>

        <ToolCard title="Password Breach" icon="🔑">
          <StyledInput type="password" value={pwd} onChange={e => setPwd(e.target.value)}
            placeholder="Enter password to check…" disabled={!!loading}/>
          <ScanButton onClick={checkPassword} loading={loading==="pwd"} label="CHECK PASSWORD" loadingLabel="CHECKING…"/>
        </ToolCard>

        <ToolCard title="Phishing Link Detector" icon="⚠️">
          <StyledInput value={phUrl} onChange={e => setPhUrl(e.target.value)}
            placeholder="https://secure-login-paypal.xyz" disabled={!!loading}/>
          {/* offline — synchronous, no loading state */}
          <ScanButton onClick={analyzePhish} loading={false} label="ANALYZE LINK" loadingLabel=""/>
        </ToolCard>
      </div>

      {/* ── Shared result panel spans full width ── */}
      <ResultPanel result={result} onClose={() => setResult(null)}/>
    </>
  );
}