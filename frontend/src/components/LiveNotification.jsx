import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { Bus, X, MapPin, WifiOff } from "lucide-react";
import "../styles/LiveNotification.css";

const ROUTE_COLORS = {
  Biratnagar: "#7c3aed",
  Damak: "#059669",
  Dharan: "#2563eb",
  Inaruwa: "#dc2626",
};

export default function LiveNotification() {
  const [notifications, setNotifications] = useState([]);
  const timerRefs = useRef({});

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
  };

  const addNotification = (notif) => {
    const id = Date.now() + Math.random();
    const newNotif = { ...notif, id };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 5)); // max 5

    // Auto-dismiss after 6 seconds
    timerRefs.current[id] = setTimeout(() => {
      removeNotification(id);
    }, 6000);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Only show notifications for student role
    if (user.role !== "student" && user.role !== undefined && user.role !== "") return;

    const handleLocationUpdate = (data) => {
      addNotification({
        type: "live",
        route: data.route,
        shift: data.shift,
        message: `${data.route} bus is now LIVE`,
        sub: `${data.shift === "morning" ? "🌅 Morning" : "☀️ Day"} shift — location updating`,
      });
    };

    const handleOffline = (data) => {
      addNotification({
        type: "offline",
        route: data.route,
        message: `${data.route} bus went offline`,
        sub: "Driver stopped sharing location",
      });
    };

    // Listen only for first "go live" event per route to avoid spam
    const seenRoutes = new Set();

    const handleFirstLive = (data) => {
      if (!seenRoutes.has(data.route)) {
        seenRoutes.add(data.route);
        handleLocationUpdate(data);
        // Reset after 30s so if bus reconnects we notify again
        setTimeout(() => seenRoutes.delete(data.route), 30000);
      }
    };

    socket.on("bus:location_update", handleFirstLive);
    socket.on("bus:offline", handleOffline);

    return () => {
      socket.off("bus:location_update", handleFirstLive);
      socket.off("bus:offline", handleOffline);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="livenotif-container">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`livenotif-card ${n.type === "offline" ? "offline" : "live"}`}
          style={{ borderLeftColor: ROUTE_COLORS[n.route] || "#2563eb" }}
        >
          <div className="livenotif-icon" style={{ background: n.type === "offline" ? "#dc2626" : (ROUTE_COLORS[n.route] || "#2563eb") }}>
            {n.type === "offline" ? <WifiOff size={16} /> : <Bus size={16} />}
          </div>
          <div className="livenotif-content">
            <div className="livenotif-title">
              {n.type === "live" && <span className="livenotif-dot"></span>}
              {n.message}
            </div>
            <div className="livenotif-sub">{n.sub}</div>
          </div>
          <button className="livenotif-close" onClick={() => removeNotification(n.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
