import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import {
  Bus, MapPin, Play, Square, Wifi, WifiOff, Navigation,
  Clock, AlertTriangle, CheckCircle, LogOut, Sunrise, Sun, Signal
} from "lucide-react";
import "../styles/DriverPanel.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ROUTE_COLORS = {
  Biratnagar: "#7c3aed", Damak: "#059669", Dharan: "#2563eb", Inaruwa: "#dc2626"
};

const IIC_CENTER = [26.6630, 87.2836];

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 14, { duration: 1 }); }, [position, map]);
  return null;
}

export default function DriverPanel() {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const token      = localStorage.getItem("token");
  const route      = user.assignedRoute;
  const routeColor = ROUTE_COLORS[route] || "#2563eb";

  const [connected,   setConnected]   = useState(false);
  const [identified,  setIdentified]  = useState(false);
  const [isSharing,   setIsSharing]   = useState(false);
  const [gpsOk,       setGpsOk]       = useState(null); // null|true|false
  const [position,    setPosition]    = useState(null);  // [lat, lng]
  const [accuracy,    setAccuracy]    = useState(null);
  const [speed,       setSpeed]       = useState(null);
  const [shift,       setShift]       = useState("morning");
  const [updateCount, setUpdateCount] = useState(0);
  const [lastSent,    setLastSent]    = useState(null);
  const [log,         setLog]         = useState([]);
  const [error,       setError]       = useState("");

  const watchRef = useRef(null);

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLog(prev => [{ time, msg, type }, ...prev.slice(0, 29)]);
  };

  // Connect socket and identify as driver
  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("driver:identify", { token });
      addLog("Connected to server", "success");
    });
    socket.on("disconnect", () => {
      setConnected(false);
      setIdentified(false);
      addLog("Disconnected from server", "error");
    });
    socket.on("driver:identified", ({ route: r, name }) => {
      setIdentified(true);
      addLog(`Identified as ${name} — Route: ${r}`, "success");
    });
    socket.on("driver:auth_error", ({ message }) => {
      setError(message);
      addLog("Auth error: " + message, "error");
    });
    socket.on("driver:location_rejected", ({ message }) => {
      setError(message);
      addLog("Rejected: " + message, "error");
    });

    if (socket.connected) {
      setConnected(true);
      socket.emit("driver:identify", { token });
    }

    return () => {
      socket.off("connect"); socket.off("disconnect");
      socket.off("driver:identified"); socket.off("driver:auth_error");
      socket.off("driver:location_rejected");
    };
  }, [token]);

  const sendLocation = useCallback((lat, lng, acc, spd) => {
    if (!connected || !identified) return;
    socket.emit("driver:update_location", { route, lat, lng, shift });
    setPosition([lat, lng]);
    setAccuracy(acc);
    setSpeed(spd);
    setLastSent(new Date());
    setUpdateCount(c => c + 1);
  }, [connected, identified, route, shift]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("GPS not supported by this browser/device.");
      setGpsOk(false);
      return;
    }
    setError("");
    setIsSharing(true);
    addLog("GPS tracking started", "success");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsOk(true);
        sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, pos.coords.speed);
        addLog(`📍 ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`, "info");
      },
      (err) => {
        setGpsOk(false);
        setError("GPS error: " + err.message);
        addLog("GPS error: " + err.message, "error");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  };

  const stopSharing = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    socket.emit("driver:offline");
    setIsSharing(false);
    setGpsOk(null);
    addLog("Location sharing stopped — bus marked offline", "warning");
  };

  const handleLogout = () => {
    stopSharing();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!route) {
    return (
      <div className="dp-page">
        <div className="dp-error-screen">
          <AlertTriangle size={48} color="#dc2626" />
          <h2>No Route Assigned</h2>
          <p>Your account has no assigned route. Please contact the administrator.</p>
          <button onClick={handleLogout} className="dp-logout-btn">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-page">
      {/* ── TOP BAR ── */}
      <div className="dp-topbar" style={{ borderBottomColor: routeColor }}>
        <div className="dp-topbar-left">
          <div className="dp-bus-icon" style={{ background: routeColor }}>🚌</div>
          <div>
            <div className="dp-topbar-title">IIC Bus Driver Panel</div>
            <div className="dp-topbar-sub">{user.name} &nbsp;·&nbsp;
              <span style={{ color: routeColor, fontWeight: 800 }}>{route} Route</span>
            </div>
          </div>
        </div>
        <div className="dp-topbar-right">
          <div className={`dp-conn-badge ${connected ? "live" : "offline"}`}>
            {connected ? <><Wifi size={13} /> Live</> : <><WifiOff size={13} /> Offline</>}
          </div>
          <button className="dp-logout-btn" onClick={handleLogout}>
            <LogOut size={14} style={{ marginRight: 4 }} />Logout
          </button>
        </div>
      </div>

      <div className="dp-body">
        {/* ── LEFT PANEL ── */}
        <div className="dp-sidebar">

          {/* Route badge */}
          <div className="dp-route-badge" style={{ background: routeColor }}>
            <MapPin size={20} style={{ marginRight: 8 }} />
            {route} Route — Your Bus
          </div>

          {/* Shift selector */}
          <div className="dp-section">
            <label className="dp-label">Today's Shift</label>
            <div className="dp-shift-row">
              <button className={`dp-shift-btn ${shift === "morning" ? "active" : ""}`} onClick={() => setShift("morning")} disabled={isSharing} style={{ "--sc": shift === "morning" ? routeColor : "" }}>
                <Sunrise size={15} /> Morning
              </button>
              <button className={`dp-shift-btn ${shift === "day" ? "active" : ""}`} onClick={() => setShift("day")} disabled={isSharing} style={{ "--sc": shift === "day" ? routeColor : "" }}>
                <Sun size={15} /> Day
              </button>
            </div>
          </div>

          {/* Status cards */}
          <div className="dp-status-grid">
            <div className="dp-status-card">
              <div className="dp-status-label">GPS Status</div>
              <div className={`dp-status-value ${gpsOk === true ? "green" : gpsOk === false ? "red" : "gray"}`}>
                {gpsOk === true ? <><CheckCircle size={14} /> Active</> : gpsOk === false ? <><AlertTriangle size={14} /> Error</> : "—"}
              </div>
            </div>
            <div className="dp-status-card">
              <div className="dp-status-label">Accuracy</div>
              <div className="dp-status-value">{accuracy ? `±${Math.round(accuracy)}m` : "—"}</div>
            </div>
            <div className="dp-status-card">
              <div className="dp-status-label">Speed</div>
              <div className="dp-status-value">{speed != null ? `${Math.round(speed * 3.6)} km/h` : "—"}</div>
            </div>
            <div className="dp-status-card">
              <div className="dp-status-label">Updates Sent</div>
              <div className="dp-status-value" style={{ color: routeColor }}>{updateCount}</div>
            </div>
          </div>

          {/* Last sent */}
          {lastSent && (
            <div className="dp-last-sent">
              <Clock size={12} /> Last update: {lastSent.toLocaleTimeString()}
            </div>
          )}

          {/* Error */}
          {error && <div className="dp-error-box"><AlertTriangle size={14} /> {error}</div>}

          {/* Big action button */}
          {!isSharing ? (
            <button
              className="dp-start-btn"
              style={{ background: routeColor }}
              onClick={startSharing}
              disabled={!connected || !identified}
            >
              <Play size={20} style={{ marginRight: 8 }} />
              Start Sharing Location
            </button>
          ) : (
            <button className="dp-stop-btn" onClick={stopSharing}>
              <Square size={20} style={{ marginRight: 8 }} />
              Stop Sharing
            </button>
          )}

          {isSharing && (
            <div className="dp-live-banner" style={{ borderColor: routeColor }}>
              <span className="dp-live-dot" style={{ background: routeColor }}></span>
              LIVE — Students can see your location
            </div>
          )}

          {!connected && (
            <div className="dp-warning-box">
              <WifiOff size={14} /> No server connection. Check your internet.
            </div>
          )}

          {/* Activity log */}
          <div className="dp-section" style={{ marginTop: "1rem" }}>
            <label className="dp-label"><Signal size={13} style={{ marginRight: 4 }} />Activity Log</label>
            <div className="dp-log">
              {log.length === 0 && <div className="dp-log-empty">Waiting for activity...</div>}
              {log.map((l, i) => (
                <div key={i} className={`dp-log-row ${l.type}`}>
                  <span className="dp-log-time">{l.time}</span>
                  <span className="dp-log-msg">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAP ── */}
        <div className="dp-map-wrap">
          <MapContainer center={IIC_CENTER} zoom={11} className="dp-map" zoomControl>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && <FlyTo position={position} />}

            {/* IIC Campus */}
            <Marker position={IIC_CENTER} icon={L.divIcon({
              className: "",
              html: `<div style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🏫</div>`,
              iconSize: [34, 34], iconAnchor: [17, 17],
            })}>
              <Popup><strong>IIC Campus</strong><br />Itahari International College</Popup>
            </Marker>

            {/* My bus */}
            {position && (
              <Marker position={position} icon={L.divIcon({
                className: "",
                html: `<div style="width:50px;height:50px;border-radius:50%;background:${routeColor};border:4px solid #fff;box-shadow:0 2px 16px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:24px;animation:busping 1.5s infinite;">🚌</div>`,
                iconSize: [50, 50], iconAnchor: [25, 25], popupAnchor: [0, -28],
              })}>
                <Popup>
                  <strong style={{ color: routeColor }}>{route} Bus (YOU)</strong><br />
                  🟢 Live<br />
                  Shift: {shift === "morning" ? "🌅 Morning" : "☀️ Day"}<br />
                  <small>{position[0].toFixed(5)}, {position[1].toFixed(5)}</small>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map overlays */}
          <div className="dp-map-route-tag" style={{ background: routeColor }}>
            🚌 {route} Route
          </div>
          {!position && (
            <div className="dp-map-placeholder">
              <Navigation size={32} style={{ opacity: 0.3 }} />
              <p>{isSharing ? "Getting GPS signal..." : "Start sharing to see your location"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
