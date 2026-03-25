import { io } from "socket.io-client";

// In dev: Vite proxies /socket.io → http://localhost:5000
// In prod: use VITE_SOCKET_URL env variable
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"],
});

export default socket;
