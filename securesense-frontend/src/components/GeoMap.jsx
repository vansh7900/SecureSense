import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function GeoMap({ threats }) {

  const getColor = (severity) => {
    if(severity >= 8) return "#ef4444";
    if(severity >= 5) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <MapContainer
      key="geo-map"
      center={[20,0]}
      zoom={2}
      scrollWheelZoom={false}
      style={{ height:"100%", width:"100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {threats?.slice(0,20).map((t,i)=>{
        const lat = Math.random()*120-60
        const lng = Math.random()*360-180
        const severity = t?.analysis?.severity_score || 3

        return (
          <CircleMarker
            key="geo-map"
            center={[lat,lng]}
            radius={6}
            pathOptions={{
              color:getColor(severity),
              fillOpacity:0.8
            }}
          />
        )
      })}

    </MapContainer>
  )
}