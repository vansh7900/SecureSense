import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TopAttacks({ threats }) {

  const counts = {};
  threats.forEach(t => {
    const type = t.prediction || "Unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  const data = Object.keys(counts).map(k => ({
    name: k,
    value: counts[k]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" hide />
        <Tooltip />
        <Bar dataKey="value" fill="#00b4ff" />
      </BarChart>
    </ResponsiveContainer>
  );
}