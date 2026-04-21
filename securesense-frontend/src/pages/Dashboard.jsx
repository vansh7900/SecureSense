import LiveStats from "../components/LiveStats";
import LiveFeed from "../components/LiveFeed";
import SeverityChart from "../components/SeverityChart";
import SOCTicker from "../components/SOCTicker";

export default function Dashboard({ threats }) {
  return (
    <div className="space-y-6">

      <LiveStats threats={threats} />

      <div className="grid grid-cols-2 gap-6">
        <LiveFeed threats={threats}/>
        <SeverityChart threats={threats}/>
      </div>

      <SOCTicker threats={threats}/>

    </div>
  );
}