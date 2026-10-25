// client/src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: (cb) => {
    const token = localStorage.getItem("token");
    cb({ token: token || undefined });
  },
});

// ─────────────────────────────────────────────────────
// Connection lifecycle logs (dev only)
// ─────────────────────────────────────────────────────
if (import.meta.env.DEV) {
  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("🔌 Socket connect_error:", err.message);
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔌 Reconnecting... attempt ${attempt}`);
  });

  socket.on("reconnect", (attempt) => {
    console.log(`🔌 Reconnected after ${attempt} attempts`);
  });
}

// ─────────────────────────────────────────────────────
// Helper: connect with fresh token
// ─────────────────────────────────────────────────────
export const connectSocket = (token) => {
  if (token) {
    socket.auth = { token };
  } else {
    const stored = localStorage.getItem("token");
    socket.auth = { token: stored || undefined };
  }

  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

// ─────────────────────────────────────────────────────
// Helper: disconnect
// ─────────────────────────────────────────────────────
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;