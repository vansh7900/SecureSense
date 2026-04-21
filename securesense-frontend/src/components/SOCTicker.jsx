export default function SOCTicker({ threats }) {
    return (
      <div className="bg-slate-900 p-2 rounded-xl overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {threats.slice(0,5).map((t,i)=>(
            <span key={i} className="mr-10 text-red-400">
              {t.prediction} from {t.parsed?.metadata?.source_ip}
            </span>
          ))}
        </div>
      </div>
    );
  }