// src/pages/Register.jsx
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
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80&auto=format&fit=crop";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
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
          className="absolute bottom-0 left-0 w-1/2 h-full opacity-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle at bottom left, ${COLORS.marigold}30, transparent 60%)`,
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
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div
              className="text-2xl font-bold tracking-tight mb-1"
              style={{ color: COLORS.iceSilver }}
            >
              Study<span style={{ color: COLORS.marigold }}>Sync</span>
            </div>
          </Link>
          <p className="text-sm" style={{ color: COLORS.iceSilverMuted }}>
            Create your free account
          </p>
        </div>

        {/* Role tabs */}
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-lg mb-5"
          style={{ background: `${COLORS.deepAubergineDark}99` }}
        >
          {[
            { key: "student", label: "🎓 Student" },
            { key: "tutor", label: "📚 Tutor" },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setForm({ ...form, role: r.key })}
              className="py-2 rounded-md text-xs font-semibold transition-all"
              style={{
                background:
                  form.role === r.key ? COLORS.marigold : "transparent",
                color:
                  form.role === r.key
                    ? COLORS.deepAubergineDark
                    : COLORS.iceSilverMuted,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: COLORS.iceSilverDim }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              required
              autoComplete="name"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: `${COLORS.deepAubergineDark}99`,
                border: `1px solid ${COLORS.deepAubergineLight}`,
                color: COLORS.iceSilver,
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.marigold)}
              onBlur={(e) =>
                (e.target.style.borderColor = COLORS.deepAubergineLight)
              }
            />
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
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
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: `${COLORS.deepAubergineDark}99`,
                border: `1px solid ${COLORS.deepAubergineLight}`,
                color: COLORS.iceSilver,
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.marigold)}
              onBlur={(e) =>
                (e.target.style.borderColor = COLORS.deepAubergineLight)
              }
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: COLORS.iceSilverDim }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 pr-12 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: `${COLORS.deepAubergineDark}99`,
                  border: `1px solid ${COLORS.deepAubergineLight}`,
                  color: COLORS.iceSilver,
                }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.marigold)}
                onBlur={(e) =>
                  (e.target.style.borderColor = COLORS.deepAubergineLight)
                }
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

          {/* Confirm Password */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: COLORS.iceSilverDim }}
            >
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              placeholder="Re-enter password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: `${COLORS.deepAubergineDark}99`,
                border: `1px solid ${COLORS.deepAubergineLight}`,
                color: COLORS.iceSilver,
              }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.marigold)}
              onBlur={(e) =>
                (e.target.style.borderColor = COLORS.deepAubergineLight)
              }
            />
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
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 mt-2"
            style={{
              background: COLORS.marigold,
              color: COLORS.deepAubergineDark,
              boxShadow: `0 8px 24px -8px ${COLORS.marigold}80`,
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p
          className="text-center text-sm mt-5"
          style={{ color: COLORS.iceSilverMuted }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold transition hover:opacity-80"
            style={{ color: COLORS.marigold }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}