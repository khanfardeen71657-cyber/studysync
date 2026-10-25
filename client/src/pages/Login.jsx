// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE (same as Landing)
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  iceSilver: "#E8E8EA",
  iceSilverMuted: "#B8B8C0",
  iceSilverDim: "#8A8A95",
  deepAubergine: "#2D1B2E",
  deepAubergineLight: "#3D2540",
  deepAubergineDark: "#1F1220",
  marigold: "#E8A33D",
  marigoldBright: "#F4B942",
  marigoldDim: "#C88A2E",
};

const BG_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80&auto=format&fit=crop";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12"
      style={{ background: COLORS.deepAubergineDark }}
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={BG_IMAGE}
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: 0.15 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${COLORS.deepAubergineDark}E6 0%, ${COLORS.deepAubergine}99 50%, ${COLORS.deepAubergineDark}E6 100%)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${COLORS.marigold}30, transparent 60%)`,
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 md:p-10 backdrop-blur-md"
        style={{
          background: `${COLORS.deepAubergine}CC`,
          border: `1px solid ${COLORS.deepAubergineLight}`,
          boxShadow: `0 24px 64px -12px ${COLORS.deepAubergineDark}`,
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div
              className="text-2xl font-bold tracking-tight mb-1"
              style={{ color: COLORS.iceSilver }}
            >
              Study<span style={{ color: COLORS.marigold }}>Sync</span>
            </div>
          </Link>
          <p className="text-sm" style={{ color: COLORS.iceSilverMuted }}>
            Welcome back. Let's get studying.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: COLORS.iceSilverDim }}
            >
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@university.edu"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: `${COLORS.deepAubergineDark}99`,
                border: `1px solid ${COLORS.deepAubergineLight}`,
                color: COLORS.iceSilver,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.marigold;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = COLORS.deepAubergineLight;
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: COLORS.iceSilverDim }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: `${COLORS.deepAubergineDark}99`,
                  border: `1px solid ${COLORS.deepAubergineLight}`,
                  color: COLORS.iceSilver,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.marigold;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.deepAubergineLight;
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                style={{ color: COLORS.iceSilverMuted }}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                background: "#7F1D1D30",
                border: "1px solid #EF444450",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            style={{
              background: COLORS.marigold,
              color: COLORS.deepAubergineDark,
              boxShadow: `0 8px 24px -8px ${COLORS.marigold}80`,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div
            className="flex-1 h-px"
            style={{ background: COLORS.deepAubergineLight }}
          />
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: COLORS.iceSilverDim }}
          >
            or
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: COLORS.deepAubergineLight }}
          />
        </div>

        {/* Register link */}
        <p
          className="text-center text-sm"
          style={{ color: COLORS.iceSilverMuted }}
        >
          New to StudySync?{" "}
          <Link
            to="/register"
            className="font-semibold transition hover:opacity-80"
            style={{ color: COLORS.marigold }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}