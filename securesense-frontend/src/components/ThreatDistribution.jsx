import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#ff4d6d", "#fbbf24", "#10ffc5"];
const GLOWS  = [
  "drop-shadow(0 0 8px rgba(255,77,109,0.6))",
  "drop-shadow(0 0 8px rgba(251,191,36,0.6))",
  "drop-shadow(0 0 8px rgba(16,255,197,0.6))",
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const color = payload[0].payload.fill;
  return (
    <div style={{
      background: "rgba(8,10,22,0.97)",
      border: `1px solid ${color}44`,
      borderRadius: 10, padding: "10px 16px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      boxShadow: `0 0 20px ${color}33`,
    }}>
      <span style={{ color }}>{payload[0].name}</span>
      <span style={{ color: "#e2e8f0", marginLeft: 10, fontWeight: 700 }}>{payload[0].value}</span>
      <span style={{ color: "#475569", marginLeft: 4, fontSize: 9 }}>events</span>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.8)" textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ThreatDistribution({ threats }) {
  const high   = threats.filter(t => (t.analysis?.severity_score ?? 0) > 7).length;
  const medium = threats.filter(t => { const s = t.analysis?.severity_score ?? 0; return s > 4 && s <= 7; }).length;
  const low    = threats.filter(t => (t.analysis?.severity_score ?? 0) <= 4).length;

  const data = [
    { name: "Critical", value: high   || 1, fill: COLORS[0] },
    { name: "Medium",   value: medium || 0, fill: COLORS[1] },
    { name: "Low",      value: low    || 0, fill: COLORS[2] },
  ].filter(d => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          <filter id="pie-glow-crit" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="pie-glow-warn" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="pie-glow-safe" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="fill-crit" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff4d6d" stopOpacity={1}/>
            <stop offset="100%" stopColor="#e11d48" stopOpacity={0.85}/>
          </radialGradient>
          <radialGradient id="fill-warn" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
            <stop offset="100%" stopColor="#d97706" stopOpacity={0.85}/>
          </radialGradient>
          <radialGradient id="fill-safe" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10ffc5" stopOpacity={1}/>
            <stop offset="100%" stopColor="#059669" stopOpacity={0.85}/>
          </radialGradient>
        </defs>
        <Pie
          data={data}
          innerRadius="38%"
          outerRadius="68%"
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
          labelLine={false}
          label={<CustomLabel />}
        >
          {data.map((entry, index) => {
            const fills = ["url(#fill-crit)", "url(#fill-warn)", "url(#fill-safe)"];
            const filters = ["url(#pie-glow-crit)", "url(#pie-glow-warn)", "url(#pie-glow-safe)"];
            return (
              <Cell key={index} fill={fills[index % fills.length]} filter={filters[index % filters.length]} />
            );
          })}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}