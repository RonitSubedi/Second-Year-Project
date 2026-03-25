const express = require("express");
const cors    = require("cors");
const http    = require("http");
const { Server } = require("socket.io");
const jwt     = require("jsonwebtoken");
require("dotenv").config();

const authRoutes         = require("./routes/auth");
const paymentRoutes      = require("./routes/payment");
const registrationRoutes = require("./routes/registration");
const feedbackRoutes     = require("./routes/feedback");
const userRoutes         = require("./routes/user");
const busLocationRoutes  = require("./routes/busLocation");

const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : "*",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// { routeName: { lat, lng, driverName, driverEmail, shift, updatedAt, isLive } }
const busLocations = {};

// Track which socketId belongs to which route (for cleanup on disconnect)
const driverSockets = {}; // socketId -> route

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Driver authenticates and registers their route
  socket.on("driver:identify", ({ token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "driver" && decoded.role !== "admin") {
        socket.emit("driver:auth_error", { message: "Not a driver account" });
        return;
      }
      socket.driverRoute = decoded.assignedRoute || null;
      socket.driverName  = decoded.name;
      socket.driverRole  = decoded.role;
      driverSockets[socket.id] = socket.driverRoute;
      socket.emit("driver:identified", { route: socket.driverRoute, name: socket.driverName });
      console.log(`🚌 Driver identified: ${decoded.name} → Route: ${decoded.assignedRoute || "ALL (admin)"}`);
    } catch {
      socket.emit("driver:auth_error", { message: "Invalid token" });
    }
  });

  // Driver sends GPS location — LOCKED to their assigned route only
  socket.on("driver:update_location", (data) => {
    // { route, lat, lng, shift }
    const allowedRoute = socket.driverRoute; // null = admin (can send any route)

    // If driver and route mismatch — reject
    if (socket.driverRole === "driver" && allowedRoute && data.route !== allowedRoute) {
      socket.emit("driver:location_rejected", { message: `You can only update ${allowedRoute} route.` });
      return;
    }

    const routeKey = allowedRoute || data.route; // use assigned route for drivers, data.route for admin
    busLocations[routeKey] = {
      lat:         parseFloat(data.lat),
      lng:         parseFloat(data.lng),
      driverName:  socket.driverName || "Driver",
      shift:       data.shift || "morning",
      updatedAt:   new Date().toISOString(),
      isLive:      true,
    };

    io.emit("bus:location_update", { route: routeKey, ...busLocations[routeKey] });
    console.log(`📍 ${routeKey} bus → ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
  });

  // Driver goes offline — mark their route offline
  socket.on("driver:offline", () => {
    const route = socket.driverRoute;
    if (route && busLocations[route]) {
      busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
      console.log(`🔴 ${route} bus went offline`);
    }
  });

  // Admin goes offline for a specific route
  socket.on("admin:route_offline", ({ route }) => {
    if (busLocations[route]) {
      busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
    }
  });

  // Client requests all current locations
  socket.on("client:get_locations", () => {
    socket.emit("bus:all_locations", busLocations);
  });

  socket.on("disconnect", () => {
    // Auto-mark route offline if driver disconnects
    const route = driverSockets[socket.id];
    if (route && busLocations[route] && busLocations[route].isLive) {
      busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
      console.log(`🔴 ${route} driver disconnected — marked offline`);
    }
    delete driverSockets[socket.id];
    console.log("🔌 Client disconnected:", socket.id);
  });
});

app.set("io", io);
app.set("busLocations", busLocations);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : "*",
  credentials: true,
}));
app.use(express.json());

app.get("/api", (req, res) => res.json({ status: "OK", message: "IIC Bus Management System API" }));

app.use("/api/auth",         authRoutes);
app.use("/api/payment",      paymentRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/feedback",     feedbackRoutes);
app.use("/api/user",         userRoutes);
app.use("/api/bus-location", busLocationRoutes);

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API at http://localhost:${PORT}/api`);
  console.log(`🗺️  Live bus tracking with route-locking enabled`);
});
