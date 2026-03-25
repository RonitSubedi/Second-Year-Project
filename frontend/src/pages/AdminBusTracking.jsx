import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar";
import socket from "../socket";
import api from "../api";
import { Bus, MapPin, Play, Square, Navigation, Wifi, WifiOff, Sunrise, Sun, RefreshCw, Users, Clock } from "lucide-react";
import "../styles/AdminBusTracking.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ROUTE_COLORS = { Biratnagar:"#7c3aed", Damak:"#059669", Dharan:"#2563eb", Inaruwa:"#dc2626" };
const ROUTES = ["Biratnagar","Damak","Dharan","Inaruwa"];
const IIC_CENTER = [26.6630, 87.2836];

const busIcon = (color, live) => L.divIcon({
  className: "",
  html: `<div style="width:44px;height:44px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:22px;opacity:${live?1:0.45};">🚌</div>`,
  iconSize:[44,44], iconAnchor:[22,22], popupAnchor:[0,-24],
});

function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({ click(e) { if (enabled) onMapClick(e.latlng); } });
  return null;
}

export default function AdminBusTracking() {
  const token = localStorage.getItem("token");
  const [busLocations, setBusLocations] = useState({});
  const [connected,    setConnected]    = useState(false);
  const [identified,   setIdentified]   = useState(false);

  // Per-route admin sharing state
  const [activeRoute,  setActiveRoute]  = useState("Biratnagar");
  const [activeShift,  setActiveShift]  = useState("morning");
  const [isSharing,    setIsSharing]    = useState(false);
  const [mapClickMode, setMapClickMode] = useState(false);
  const [manualLat,    setManualLat]    = useState("");
  const [manualLng,    setManualLng]    = useState("");
  const [message,      setMessage]      = useState({ text:"", type:"" });
  const [selectedView, setSelectedView] = useState(null); // which route to focus
  const watchRef = useRef(null);

  const showMsg = (text, type="info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 4000);
  };

  const timeSince = (iso) => {
    if (!iso) return "—";
    const s = Math.floor((new Date() - new Date(iso)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  useEffect(() => {
    api.get("/bus-location/all").then(r => setBusLocations(r.data||{})).catch(()=>{});

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("driver:identify", { token });
    });
    socket.on("disconnect", () => { setConnected(false); setIdentified(false); });
    socket.on("driver:identified", () => setIdentified(true));
    socket.emit("client:get_locations");
    socket.on("bus:all_locations", d => setBusLocations(d||{}));
    socket.on("bus:location_update", ({ route, ...loc }) => setBusLocations(p => ({ ...p, [route]: loc })));
    socket.on("bus:offline", ({ route }) => setBusLocations(p => ({ ...p, [route]: p[route] ? {...p[route], isLive:false} : p[route] })));

    if (socket.connected) { setConnected(true); socket.emit("driver:identify", { token }); }

    return () => {
      socket.off("connect"); socket.off("disconnect");
      socket.off("driver:identified");
      socket.off("bus:all_locations"); socket.off("bus:location_update"); socket.off("bus:offline");
    };
  }, [token]);

  const sendLocationForRoute = (route, lat, lng) => {
    socket.emit("driver:update_location", { route, lat, lng, shift: activeShift });
    setBusLocations(p => ({ ...p, [route]: { lat, lng, driverName:"Admin", shift:activeShift, updatedAt:new Date().toISOString(), isLive:true } }));
    showMsg(`📍 ${route} location updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, "success");
  };

  const startGps = () => {
    if (!navigator.geolocation) { showMsg("GPS not supported","error"); return; }
    setIsSharing(true);
    showMsg(`📡 GPS started for ${activeRoute} route`,"success");
    watchRef.current = navigator.geolocation.watchPosition(
      pos => sendLocationForRoute(activeRoute, pos.coords.latitude, pos.coords.longitude),
      err => { showMsg("GPS error: "+err.message,"error"); setIsSharing(false); },
      { enableHighAccuracy:true, maximumAge:5000, timeout:15000 }
    );
  };

  const stopGps = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    socket.emit("admin:route_offline", { route: activeRoute });
    setBusLocations(p => ({ ...p, [activeRoute]: p[activeRoute] ? {...p[activeRoute], isLive:false} : p[activeRoute] }));
    setIsSharing(false);
    showMsg(`⏹ Stopped sharing ${activeRoute}`,"warning");
  };

  const handleManualSend = () => {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat)||isNaN(lng)) { showMsg("Enter valid coordinates","error"); return; }
    sendLocationForRoute(activeRoute, lat, lng);
  };

  const handleMapClick = ({ lat, lng }) => {
    sendLocationForRoute(activeRoute, lat, lng);
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
  };

  const liveCount = ROUTES.filter(r => busLocations[r]?.isLive).length;

  return (
    <div className="abt-page">
      <Navbar />

      <div className="abt-header">
        <div>
          <h1><Bus size={22} style={{verticalAlign:"middle",marginRight:8}} />Live Bus Tracking — Admin Control</h1>
          <p>Monitor all 4 routes · Share location for any route · View driver feeds live</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div className="abt-live-count">
            <span className="live-dot-sm"></span>{liveCount}/4 Routes Live
          </div>
          <div className={`connection-badge ${connected?"live":"offline"}`}>
            {connected ? <><Wifi size={14}/> Connected</> : <><WifiOff size={14}/> Offline</>}
          </div>
        </div>
      </div>

      {/* Route overview cards */}
      <div className="abt-route-overview">
        {ROUTES.map(r => {
          const loc = busLocations[r];
          return (
            <div
              key={r}
              className={`abt-route-card ${selectedView===r?"selected":""} ${loc?.isLive?"live-card":""}`}
              style={{ borderTopColor: ROUTE_COLORS[r] }}
              onClick={() => setSelectedView(selectedView===r?null:r)}
            >
              <div className="arc-top">
                <span className="arc-name" style={{color:ROUTE_COLORS[r]}}>🚌 {r}</span>
                <span className={`arc-status ${loc?.isLive?"live":"offline"}`}>
                  {loc?.isLive ? "● LIVE" : loc ? "● Offline" : "○ No Signal"}
                </span>
              </div>
              <div className="arc-meta">
                {loc ? (
                  <>
                    <div><Clock size={11}/> {timeSince(loc.updatedAt)}</div>
                    <div>{loc.shift==="morning"?"🌅 Morning":"☀️ Day"}</div>
                    <div style={{fontSize:"0.7rem",color:"#94a3b8"}}>{loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}</div>
                  </>
                ) : <div style={{color:"#94a3b8",fontSize:"0.78rem"}}>Driver not sharing</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="abt-body">
        {/* Controls */}
        <div className="abt-controls">
          <div className="ctrl-title">Admin Location Control</div>

          <div className="ctrl-section">
            <label className="ctrl-label">Target Route</label>
            <div className="route-pills">
              {ROUTES.map(r => (
                <button
                  key={r}
                  className={`route-pill ${activeRoute===r?"active":""}`}
                  style={{"--rc":ROUTE_COLORS[r]}}
                  onClick={() => setActiveRoute(r)}
                  disabled={isSharing}
                >{r}</button>
              ))}
            </div>
          </div>

          <div className="ctrl-section">
            <label className="ctrl-label">Shift</label>
            <div className="shift-toggle">
              <button className={`toggle-btn ${activeShift==="morning"?"active":""}`} onClick={()=>setActiveShift("morning")} disabled={isSharing}>
                <Sunrise size={13}/> Morning
              </button>
              <button className={`toggle-btn ${activeShift==="day"?"active":""}`} onClick={()=>setActiveShift("day")} disabled={isSharing}>
                <Sun size={13}/> Day
              </button>
            </div>
          </div>

          <div className="ctrl-section">
            <label className="ctrl-label">📡 GPS Sharing ({activeRoute})</label>
            <p className="ctrl-desc">Share your GPS as the {activeRoute} bus. Drivers see this too.</p>
            {!isSharing
              ? <button className="start-btn" onClick={startGps}>
                  <Play size={14} style={{marginRight:6}}/>Start GPS for {activeRoute}
                </button>
              : <button className="stop-btn" onClick={stopGps}>
                  <Square size={14} style={{marginRight:6}}/>Stop {activeRoute} Sharing
                </button>}
          </div>

          <div className="ctrl-section">
            <label className="ctrl-label">📌 Manual Coordinates</label>
            <p className="ctrl-desc">Or click the map below.</p>
            <div className="coord-inputs">
              <input type="number" step="0.0001" placeholder="Latitude" value={manualLat} onChange={e=>setManualLat(e.target.value)}/>
              <input type="number" step="0.0001" placeholder="Longitude" value={manualLng} onChange={e=>setManualLng(e.target.value)}/>
            </div>
            <button className="send-btn" onClick={handleManualSend}><Navigation size={13} style={{marginRight:6}}/>Send for {activeRoute}</button>
          </div>

          <div className="ctrl-section">
            <label className="ctrl-label">🗺 Click Map</label>
            <button className={`map-click-btn ${mapClickMode?"active":""}`} onClick={()=>setMapClickMode(p=>!p)}>
              <MapPin size={13} style={{marginRight:6}}/>{mapClickMode?"Click Mode ON":"Enable Click Mode"}
            </button>
          </div>

          {message.text && (
            <div className={`abt-message ${message.type}`}>{message.text}</div>
          )}
        </div>

        {/* Map */}
        <div className="abt-map-wrap">
          <MapContainer center={IIC_CENTER} zoom={11} className="abt-map">
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <MapClickHandler onMapClick={handleMapClick} enabled={mapClickMode}/>

            <Marker position={IIC_CENTER} icon={L.divIcon({
              className:"",
              html:`<div style="width:36px;height:36px;border-radius:50%;background:#1e293b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">🏫</div>`,
              iconSize:[36,36],iconAnchor:[18,18],
            })}>
              <Popup><strong>IIC Campus</strong></Popup>
            </Marker>

            {ROUTES.map(r => {
              const loc = busLocations[r];
              if (!loc?.lat||!loc?.lng) return null;
              return (
                <Marker key={r} position={[loc.lat,loc.lng]} icon={busIcon(ROUTE_COLORS[r],loc.isLive)}>
                  <Popup>
                    <div style={{minWidth:170}}>
                      <div style={{fontWeight:800,color:ROUTE_COLORS[r],marginBottom:4}}>🚌 {r} Bus</div>
                      <div>{loc.isLive ? "🟢 Live" : "🔴 Offline"} · {timeSince(loc.updatedAt)}</div>
                      <div>Shift: {loc.shift==="morning"?"🌅 Morning":"☀️ Day"}</div>
                      <div style={{fontSize:"0.75rem",color:"#888",marginTop:4}}>{loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}</div>
                    </div>
                  </Popup>
                  {loc.isLive && <Circle center={[loc.lat,loc.lng]} radius={250} pathOptions={{color:ROUTE_COLORS[r],fillColor:ROUTE_COLORS[r],fillOpacity:0.08,weight:1}}/>}
                </Marker>
              );
            })}
          </MapContainer>

          {mapClickMode && (
            <div className="map-click-overlay">
              🖱 Click map → set <strong>{activeRoute}</strong> location
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
