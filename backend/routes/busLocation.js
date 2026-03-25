const express = require("express");
const router  = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// GET all current bus locations (for initial page load before socket connects)
router.get("/all", verifyToken, (req, res) => {
  const busLocations = req.app.get("busLocations");
  res.json(busLocations || {});
});

// GET specific route location
router.get("/:route", verifyToken, (req, res) => {
  const busLocations = req.app.get("busLocations");
  const loc = busLocations[req.params.route];
  if (!loc) return res.json(null);
  res.json(loc);
});

// Admin: manually set bus location (fallback if no socket)
router.post("/update", verifyToken, verifyAdmin, (req, res) => {
  const { route, lat, lng, driverName, shift } = req.body;
  if (!route || !lat || !lng) return res.status(400).json({ message: "route, lat, lng required" });

  const busLocations = req.app.get("busLocations");
  const io = req.app.get("io");

  busLocations[route] = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    driverName: driverName || "Admin",
    shift: shift || "morning",
    updatedAt: new Date().toISOString(),
    isLive: true,
  };

  io.emit("bus:location_update", { route, ...busLocations[route] });
  res.json({ message: "Location updated", location: busLocations[route] });
});

module.exports = router;
