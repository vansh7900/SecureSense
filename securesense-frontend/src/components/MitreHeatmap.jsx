export default function MitreHeatmap({ threats }) {

  const stages = [
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Command & Control",
  ];

  // 🔥 COUNT BASED ON mitre_stage (REAL) OR prediction (fallback)
  const counts = {};

  stages.forEach(stage => counts[stage] = 0);

  threats.forEach(t => {
    // ✅ Preferred: real mitre_stage
    if (t.mitre_stage && counts[t.mitre_stage] !== undefined) {
      counts[t.mitre_stage]++;
    } 
    // ⚠️ Fallback: your current logic
    else if (t.prediction) {
      const p = t.prediction.toLowerCase();

      if (p.includes("brute")) counts["Initial Access"]++;
      if (p.includes("malware")) counts["Execution"]++;
      if (p.includes("backdoor")) counts["Persistence"]++;
      if (p.includes("privilege")) counts["Privilege Escalation"]++;
      if (p.includes("evasion")) counts["Defense Evasion"]++;
      if (p.includes("credential")) counts["Credential Access"]++;
      if (p.includes("scan")) counts["Discovery"]++;
      if (p.includes("lateral")) counts["Lateral Movement"]++;
      if (p.includes("c2")) counts["Command & Control"]++;
    }
  });

  // 🔥 max value for scaling
  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <h3 className="mb-4 font-semibold text-white">
        MITRE ATT&CK Heatmap
      </h3>

      {stages.map((name, i) => {
        const val = counts[name];
        const width = (val / max) * 100;

        return (
          <div key={i} className="mb-3">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{name}</span>
              <span>{val}</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded">
              <div
                className="h-2 rounded transition-all duration-500"
                style={{
                  width: `${width}%`,
                  background:
                    val > 5
                      ? "#ff3b6b"   // 🔴 high
                      : val > 2
                      ? "#ffab00"   // 🟡 medium
                      : "#00e5c3",  // 🟢 low
                  boxShadow: "0 0 8px rgba(0,0,0,0.5)"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}