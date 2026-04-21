import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,10,22,0.97)",
      border: "1px solid rgba(34,211,238,0.30)",
      borderRadius: 10, padding: "10px 16px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      color: "#22d3ee",
      boxShadow: "0 0 20px rgba(34,211,238,0.20)",
    }}>
      <span style={{ color: "#10ffc5", fontWeight: 700 }}>{payload[0].value}</span>
      <span style={{ color: "#475569", marginLeft: 6 }}>events</span>
    </div>
  );
}

export default function ThreatTrend({ threats }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [
        ...prev.slice(-28),
        { time: new Date().toLocaleTimeString(), value: threats.length }
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, [threats]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.40}/>
            <stop offset="50%"  stopColor="#818cf8" stopOpacity={0.18}/>
            <stop offset="100%" stopColor="#6366f1"  stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6366f1"/>
            <stop offset="40%"  stopColor="#818cf8"/>
            <stop offset="80%"  stopColor="#22d3ee"/>
            <stop offset="100%" stopColor="#10ffc5"/>
          </linearGradient>
          <filter id="line-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(99,102,241,0.08)"
          vertical={false}
        />
        <XAxis dataKey="time" hide />
        <YAxis
          tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(34,211,238,0.25)", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#trendStroke)"
          strokeWidth={2.5}
          fill="url(#trendGrad)"
          dot={false}
          activeDot={{ r: 5, fill: "#22d3ee", stroke: "#10ffc5", strokeWidth: 2, filter: "url(#line-glow)" }}
          filter="url(#line-glow)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}