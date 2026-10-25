// client/src/pages/AdminTutors.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { tutorService } from "../services/tutorService.js";

export default function AdminTutors() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("pending"); // pending | all
  const [actionLoading, setActionLoading] = useState(null);

  // ✅ Admin check
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      setError("");
      const res =
        tab === "pending"
          ? await tutorService.listPendingTutors()
          : await tutorService.listAllTutors();

      const body = res?.data;
      const payload = body?.data;
      const list = payload?.tutors || body?.tutors || [];
      setTutors(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load tutors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleVerify = async (tutorId, isVerified) => {
    setActionLoading(tutorId);
    try {
      await tutorService.verifyTutor(tutorId, isVerified);
      // Local state update
      setTutors((prev) =>
        prev.map((t) =>
          t._id === tutorId ? { ...t, isVerified } : t
        )
      );
      // Pending tab se remove karo agar verified
      if (tab === "pending" && isVerified) {
        setTutors((prev) => prev.filter((t) => t._id !== tutorId));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && tutors.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🛡️ Admin — Tutor Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify or unverify tutor profiles
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-800">
            <button
              onClick={() => setTab("pending")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                tab === "pending"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              ⏳ Pending ({tab === "pending" ? tutors.length : "?"})
            </button>
            <button
              onClick={() => setTab("all")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                tab === "all"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              📋 All Tutors
            </button>
          </div>

          {/* Tutor list */}
          {tutors.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">
                {tab === "pending" ? "✅" : "📋"}
              </div>
              <p className="text-slate-400">
                {tab === "pending"
                  ? "No pending tutors. All verified!"
                  : "No tutors found."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tutors.map((t) => {
                const name = t?.user?.name || "Tutor";
                const email = t?.user?.email || "";
                const initial = name[0]?.toUpperCase() || "T";
                const subjects = Array.isArray(t?.subjects) ? t.subjects : [];
                const rate = Number(t?.hourlyRate ?? 0);
                const currency = t?.currency || "USD";
                const symbol =
                  currency === "INR" ? "₹" :
                  currency === "EUR" ? "€" :
                  currency === "GBP" ? "£" : "$";

                return (
                  <div
                    key={t._id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg">{name}</span>
                            {t.isVerified ? (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-600/20 text-emerald-400 rounded font-bold">
                                ✓ VERIFIED
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded font-bold">
                                ⏳ PENDING
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate">
                            {email}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {subjects.length > 0
                              ? subjects.join(", ")
                              : "No subjects"}{" "}
                            • {symbol}
                            {rate}/hr
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {!t.isVerified ? (
                          <button
                            onClick={() => handleVerify(t._id, true)}
                            disabled={actionLoading === t._id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-semibold"
                          >
                            {actionLoading === t._id
                              ? "Verifying..."
                              : "✓ Verify"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(t._id, false)}
                            disabled={actionLoading === t._id}
                            className="px-4 py-2 bg-red-600/70 hover:bg-red-600 disabled:opacity-50 rounded-lg text-sm font-semibold"
                          >
                            {actionLoading === t._id
                              ? "Unverifying..."
                              : "✕ Unverify"}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/tutors/${t._id}`)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}