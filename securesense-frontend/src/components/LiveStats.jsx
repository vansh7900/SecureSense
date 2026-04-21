export default function LiveStats({ threats = [] }) {

  const active = threats.length;
  const critical = threats.filter(t => t?.analysis?.severity_score >= 8).length;
  const sources = new Set(threats.map(t => t?.source_ip)).size;
  const eps = Math.floor(Math.random() * 50) + 10;

  return (
    <div className="grid grid-cols-4 gap-6">
      <Stat title="Events/sec" value={eps}/>
      <Stat title="Active Alerts" value={active}/>
      <Stat title="Critical" value={critical}/>
      <Stat title="Sources" value={sources}/>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
      <div className="text-gray-400 text-sm">{title}</div>
      <div className="text-2xl font-semibold text-green-400">{value}</div>
    </div>
  );
}