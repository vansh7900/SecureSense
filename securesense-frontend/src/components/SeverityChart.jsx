export default function SeverityChart({ threats = [] }) {

  const low = threats.filter(t => (t?.analysis?.severity_score ?? 0) < 5).length;
  const medium = threats.filter(t => {
    const s = t?.analysis?.severity_score ?? 0;
    return s >= 5 && s < 8;
  }).length;
  const critical = threats.filter(t => (t?.analysis?.severity_score ?? 0) >= 8).length;

  const max = Math.max(low, medium, critical, 1);

  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <h3 className="mb-4 font-semibold">Threat Severity</h3>

      <div className="space-y-3">

        <Bar label="Low" value={low} max={max} color="bg-green-500"/>
        <Bar label="Medium" value={medium} max={max} color="bg-yellow-500"/>
        <Bar label="Critical" value={critical} max={max} color="bg-red-500"/>

      </div>
    </div>
  );
}

function Bar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded">
        <div
          className={`${color} h-2 rounded`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}