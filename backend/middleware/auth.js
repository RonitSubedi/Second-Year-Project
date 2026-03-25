const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token. Please log in again." });
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

const verifyDriver = (req, res, next) => {
  if (!req.user || (req.user.role !== "driver" && req.user.role !== "admin")) {
    return res.status(403).json({ message: "Access denied. Driver only." });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, verifyDriver };
