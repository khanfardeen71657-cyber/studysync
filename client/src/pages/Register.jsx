// client/src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { register, logout } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");   // ✅ role state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ 1. Purana user cache clear karo
      try { await logout(); } catch {}

      // ✅ 2. localStorage clear karo
      localStorage.removeItem("token");

      // ✅ 3. Payload banao (role ke saath)
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,   // ✅ "student" ya "tutor"
      };
      if (password.trim()) payload.password = password.trim();

      console.log("🔍 Register payload:", payload);   // debug

      // ✅ 4. Register karo
      const user = await register(payload);
      console.log("✅ Registered user:", user);        // debug

      // ✅ 5. Role ke hisaab se redirect
      if (role === "tutor") {
        navigate("/become-tutor");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Register error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join StudySync and start studying together
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              I want to join as
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  role === "student"
                    ? "border-purple-500 bg-purple-600/20"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="text-2xl mb-1">🎓</div>
                <div className="font-semibold text-sm">Student</div>
                <div className="text-xs text-slate-400">Join groups, learn</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("tutor")}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  role === "tutor"
                    ? "border-purple-500 bg-purple-600/20"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="text-2xl mb-1">👨‍🏫</div>
                <div className="font-semibold text-sm">Tutor</div>
                <div className="text-xs text-slate-400">Teach, earn</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Password (optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Khali chhodoge toh random password set hoga.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm"
          >
            {loading
              ? "Creating account..."
              : role === "tutor"
              ? "Continue as Tutor"
              : "Create Student Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}