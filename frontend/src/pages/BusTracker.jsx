import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar";
import api from "../api";
import socket from "../socket";
import { Bus, MapPin, Clock, Wifi, WifiOff, Sunrise, Sun, RefreshCw, Navigation } from "lucide-react";
import "../styles/BusTracker.css";

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom bus icon
const busIcon = (color = "#2563eb") => L.divIcon({
  className: "",
  html: `<div style="
    width:44px;height:44px;border-radius:50%;
    background:${color};border:3px solid #fff;
    box-shadow:0 2px 12px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
    font-size:22px;cursor:pointer;
    animation: busping 1.5s infinite;
  ">🚌</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

const ROUTE_COLORS = {
  Biratnagar: "#7c3aed",
  Damak:      "#059669",
  Dharan:     "#2563eb",
  Inaruwa:    "#dc2626",
};

// IIC College center coordinates
const IIC_CENTER = [26.6630, 87.2836];

// Approx start coords for each route (for demo)
const ROUTE_START_COORDS = {
  Biratnagar: [26.4525, 87.2718],
  Damak:      [26.6580, 87.6960],
  Dharan:     [26.8065, 87.2841],
  Inaruwa:    [26.5600, 87.1400],
};

function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 1.2 });
  }, [position, map]);
  return null;
}

function BusTracker() {
  const [busLocations, setBusLocations] = useState({});
  const [registration, setRegistration]   = useState(null);
  const [connected, setConnected]         = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [lastUpdate, setLastUpdate]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [myBusAlert, setMyBusAlert]       = useState(null); // { type: 'live'|'offline', route }
  const alertTimerRef = useRef(null);

  const routes = ["Biratnagar", "Damak", "Dharan", "Inaruwa"];

  useEffect(() => {
    // Get student's own registration to highlight their route
    api.get("/registration/my")
      .then(res => {
        if (res.data) {
          setRegistration(res.data);
          setSelectedRoute(res.data.today_route || res.data.route);
        }
      })
      .catch(() => {});

    // Get initial locations via REST
    api.get("/bus-location/all")
      .then(res => {
        setBusLocations(res.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Socket events
    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.emit("client:get_locations");

    socket.on("bus:all_locations", (data) => {
      setBusLocations(data || {});
    });

    const myRoute = localStorage.getItem("_btMyRoute"); // set after reg loads
    const seenLive = new Set();

    socket.on("bus:location_update", (data) => {
      const { route, ...loc } = data;
      setBusLocations(prev => {
        const wasLive = prev[route]?.isLive;
        // Trigger alert only when bus transitions to live for student's route
        if (!wasLive && !seenLive.has(route)) {
          seenLive.add(route);
          setRegistration(reg => {
            const studentRoute = reg?.today_route || reg?.route;
            if (studentRoute === route) {
              setMyBusAlert({ type: "live", route });
              if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
              alertTimerRef.current = setTimeout(() => setMyBusAlert(null), 8000);
            }
            return reg;
          });
          setTimeout(() => seenLive.delete(route), 60000);
        }
        return { ...prev, [route]: loc };
      });
      setLastUpdate(new Date());
    });

    socket.on("bus:offline", ({ route }) => {
      setBusLocations(prev => ({
        ...prev,
        [route]: prev[route] ? { ...prev[route], isLive: false } : prev[route],
      }));
      // Alert student if their bus went offline
      setRegistration(reg => {
        const studentRoute = reg?.today_route || reg?.route;
        if (studentRoute === route) {
          setMyBusAlert({ type: "offline", route });
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          alertTimerRef.current = setTimeout(() => setMyBusAlert(null), 8000);
        }
        return reg;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("bus:all_locations");
      socket.off("bus:location_update");
      socket.off("bus:offline");
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  const myRoute    = registration?.today_route || registration?.route;
  const myBusLoc  = myRoute ? busLocations[myRoute] : null;
  const flyTarget = selectedRoute && busLocations[selectedRoute]
    ? [busLocations[selectedRoute].lat, busLocations[selectedRoute].lng]
    : null;

  const timeSince = (iso) => {
    if (!iso) return "—";
    const secs = Math.floor((new Date() - new Date(iso)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  return (
    <div className="tracker-page">
      <Navbar />

      <div className="tracker-header">
        <div>
          <h1><Bus size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />Live Bus Tracker</h1>
          <p>Real-time location of IIC buses — updated live as buses move</p>
        </div>
        <div className={`connection-badge ${connected ? "live" : "offline"}`}>
          {connected
            ? <><Wifi size={14} /> Live</>
            : <><WifiOff size={14} /> Reconnecting...</>}
        </div>
      </div>

      {/* In-page alert for student's own bus */}
      {myBusAlert && (
        <div className={`bt-alert-banner ${myBusAlert.type === "live" ? "bt-alert-live" : "bt-alert-offline"}`}>
          <span className="bt-alert-icon">{myBusAlert.type === "live" ? "🚌" : "⚠️"}</span>
          <div className="bt-alert-text">
            {myBusAlert.type === "live"
              ? <><strong>{myBusAlert.route} bus is now LIVE!</strong> Your bus has started sharing its location.</>
              : <><strong>{myBusAlert.route} bus went offline.</strong> The driver stopped sharing location.</>
            }
          </div>
          <button className="bt-alert-close" onClick={() => setMyBusAlert(null)}>✕</button>
        </div>
      )}

      <div className="tracker-body">

        {/* Left panel */}
        <div className="tracker-sidebar">

          {/* My bus highlight */}
          {registration && (
            <div className="my-bus-card">
              <div className="my-bus-label">🎯 My Bus Today</div>
              <div className="my-bus-route" style={{ color: ROUTE_COLORS[myRoute] }}>
                {myRoute} Route
              </div>
              <div className="my-bus-shift">
                {(registration.today_shift || registration.shift) === "morning"
                  ? <><Sunrise size={13} style={{ marginRight: 4 }} />Morning Shift</>
                  : <><Sun size={13} style={{ marginRight: 4 }} />Day Shift</>}
              </div>
              {myBusLoc ? (
                myBusLoc.isLive ? (
                  <div className="my-bus-status live">
                    <span className="live-dot"></span> Bus is Live · {timeSince(myBusLoc.updatedAt)}
                  </div>
                ) : (
                  <div className="my-bus-status offline-status">⚠ Bus went offline</div>
                )
              ) : (
                <div className="my-bus-status pending">📡 Waiting for bus location...</div>
              )}
              {myBusLoc?.isLive && (
                <button className="track-btn" onClick={() => setSelectedRoute(myRoute)}>
                  <Navigation size={13} style={{ marginRight: 4 }} />Track My Bus
                </button>
              )}
            </div>
          )}

          <h3 className="sidebar-title">All Routes</h3>
          {routes.map(route => {
            const loc = busLocations[route];
            return (
              <div
                key={route}
                className={`route-card ${selectedRoute === route ? "selected" : ""} ${myRoute === route ? "my-route" : ""}`}
                onClick={() => setSelectedRoute(route)}
                style={{ borderLeftColor: ROUTE_COLORS[route] }}
              >
                <div className="route-card-top">
                  <span className="route-name">{route}</span>
                  {loc
                    ? loc.isLive
                      ? <span className="status-pill live"><span className="live-dot sm"></span>Live</span>
                      : <span className="status-pill offline-pill">Offline</span>
                    : <span className="status-pill waiting">No Signal</span>}
                </div>
                {loc && (
                  <div className="route-card-meta">
                    <Clock size={11} /> {timeSince(loc.updatedAt)}
                    {loc.shift && (
                      <span style={{ marginLeft: 8 }}>
                        {loc.shift === "morning" ? "🌅 Morning" : "☀️ Day"}
                      </span>
                    )}
                  </div>
                )}
                {!loc && (
                  <div className="route-card-meta">Driver not sharing location yet</div>
                )}
              </div>
            );
          })}

          {lastUpdate && (
            <div className="last-update">
              <RefreshCw size={11} /> Updated {timeSince(lastUpdate.toISOString())}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="tracker-map-wrap">
          {loading ? (
            <div className="map-loading"><div className="spinner" /><p>Loading map...</p></div>
          ) : (
            <MapContainer
              center={IIC_CENTER}
              zoom={11}
              className="tracker-map"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {flyTarget && <FlyToMarker position={flyTarget} />}

              {/* IIC College marker */}
              <Marker position={IIC_CENTER} icon={L.divIcon({
                className: "",
                html: `<div style="width:36px;height:36px;border-radius:50%;background:#1e293b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🏫</div>`,
                iconSize: [36, 36], iconAnchor: [18, 18],
              })}>
                <Popup><strong>IIC Campus</strong><br />Itahari International College</Popup>
              </Marker>

              {/* Bus markers */}
              {routes.map(route => {
                const loc = busLocations[route];
                if (!loc || !loc.lat || !loc.lng) return null;
                return (
                  <Marker
                    key={route}
                    position={[loc.lat, loc.lng]}
                    icon={busIcon(ROUTE_COLORS[route])}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 4, color: ROUTE_COLORS[route] }}>
                          🚌 {route} Bus
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: 2 }}>
                          {loc.isLive
                            ? <span style={{ color: "#16a34a", fontWeight: 700 }}>● Live</span>
                            : <span style={{ color: "#dc2626" }}>● Offline</span>}
                          &nbsp;· Updated {timeSince(loc.updatedAt)}
                        </div>
                        <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
                          Shift: <strong>{loc.shift === "morning" ? "🌅 Morning" : "☀️ Day"}</strong>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
                          {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                    {loc.isLive && (
                      <Circle
                        center={[loc.lat, loc.lng]}
                        radius={300}
                        pathOptions={{ color: ROUTE_COLORS[route], fillColor: ROUTE_COLORS[route], fillOpacity: 0.1, weight: 1 }}
                      />
                    )}
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* Map legend */}
          <div className="map-legend">
            <div className="legend-item"><span style={{ background: "#1e293b" }} className="legend-dot">🏫</span> IIC Campus</div>
            {routes.map(r => (
              <div key={r} className="legend-item">
                <span className="legend-dot" style={{ background: ROUTE_COLORS[r] }}>🚌</span> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusTracker;
