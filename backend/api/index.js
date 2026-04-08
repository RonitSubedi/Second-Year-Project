require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const authRoutes = require("../routes/auth");
const paymentRoutes = require("../routes/payment");
const registrationRoutes = require("../routes/registration");
const feedbackRoutes = require("../routes/feedback");
const userRoutes = require("../routes/user");
const busLocationRoutes = require("../routes/busLocation");

const app = express();

// Global state for bus locations and driver sockets
global.busLocations = global.busLocations || {};
global.driverSockets = global.driverSockets || {};

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
  "https://second-year-project-inky.vercel.app",
  "https://*.vercel.app",
].filter(Boolean);

// Create HTTP server for socket.io on Vercel
const server = http.createServer(app);

const ioOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["polling", "websocket"],
};

const io = new Server(server, ioOptions);

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("driver:identify", ({ token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "driver" && decoded.role !== "admin") {
        socket.emit("driver:auth_error", { message: "Not a driver account" });
        return;
      }
      socket.driverRoute = decoded.assignedRoute || null;
      socket.driverName = decoded.name;
      socket.driverRole = decoded.role;
      global.driverSockets[socket.id] = socket.driverRoute;
      socket.emit("driver:identified", {
        route: socket.driverRoute,
        name: socket.driverName,
      });
      console.log(`🚌 Driver: ${decoded.name} → Route: ${decoded.assignedRoute || "ALL"}`);
    } catch (error) {
      socket.emit("driver:auth_error", { message: "Invalid token" });
    }
  });

  socket.on("driver:update_location", (data) => {
    const allowedRoute = socket.driverRoute;
    if (socket.driverRole === "driver" && allowedRoute && data.route !== allowedRoute) {
      socket.emit("driver:location_rejected", {
        message: `You can only update ${allowedRoute} route.`,
      });
      return;
    }

    const routeKey = allowedRoute || data.route;
    global.busLocations[routeKey] = {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      driverName: socket.driverName || "Driver",
      shift: data.shift || "morning",
      updatedAt: new Date().toISOString(),
      isLive: true,
    };

    io.emit("bus:location_update", {
      route: routeKey,
      ...global.busLocations[routeKey],
    });
  });

  socket.on("driver:offline", () => {
    const route = socket.driverRoute;
    if (route && global.busLocations[route]) {
      global.busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
    }
  });

  socket.on("admin:route_offline", ({ route }) => {
    if (global.busLocations[route]) {
      global.busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
    }
  });

  socket.on("client:get_locations", () => {
    socket.emit("bus:all_locations", global.busLocations);
  });

  socket.on("disconnect", () => {
    const route = global.driverSockets[socket.id];
    if (route && global.busLocations[route] && global.busLocations[route].isLive) {
      global.busLocations[route].isLive = false;
      io.emit("bus:offline", { route });
    }
    delete global.driverSockets[socket.id];
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Store io and busLocations for routes
app.set("io", io);
app.set("busLocations", global.busLocations);

// Health check
app.get("/", (req, res) =>
  res.json({ status: "OK", message: "IIC Bus Management System API" })
);

app.get("/health", (req, res) => res.json({ status: "OK" }));

// API Routes
app.use("/auth", authRoutes);
app.use("/payment", paymentRoutes);
app.use("/registration", registrationRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/user", userRoutes);
app.use("/bus-location", busLocationRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ API Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Export for Vercel
module.exports = app;
