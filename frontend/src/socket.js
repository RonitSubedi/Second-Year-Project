import { io } from "socket.io-client";

// Socket.io configuration with fallback to polling for Vercel
const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // On production, use the same origin
  return window.location.origin;
};

const SOCKET_URL = getSocketURL();
console.log("🔌 Socket URL:", SOCKET_URL);

const socket = io(SOCKET_URL, {
  path: "/socket.io",
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  // Vercel doesn't support WebSocket, so fallback to polling
  transports: ["polling", "websocket"], // polling first for Vercel
});

// Log connection status
socket.on("connect", () => {
  console.log("✅ Socket.io connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket.io disconnected");
});

socket.on("connect_error", (error) => {
  console.error("Socket.io connection error:", error);
});

export default socket;
