// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await authService.getMe();
          const u = res?.data?.data?.user || res?.data?.user || res?.data;
          setUser(u);
          connectSocket(token);
        }
      } catch (err) {
        console.warn("Auth check failed:", err.message);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const payload = res?.data?.data || res?.data || {};
    const { user: u, token } = payload;
    if (token) localStorage.setItem("token", token);
    setUser(u);
    connectSocket(token);
    return u;
  };

  const register = async (data) => {
    // ✅ data = { name, email, password?, role }
    console.log("🔍 AuthContext.register:", data);   // debug
    const res = await authService.register(data);
    const payload = res?.data?.data || res?.data || {};
    const { user: u, token } = payload;
    console.log("✅ Backend returned user:", u);      // debug
    if (token) localStorage.setItem("token", token);
    setUser(u);
    connectSocket(token);
    return u;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem("token");
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      const u = res?.data?.data?.user || res?.data?.user || res?.data;
      setUser(u);
      return u;
    } catch (err) {
      console.warn("refreshUser failed:", err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;