// client/src/pages/Tutors.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { tutorService } from "../services/tutorService.js";

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE — professional dark theme
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  midnightNavy: "#0A1128",
  midnightNavyLight: "#111936",
  midnightNavyLighter: "#1A2342",
  midnightNavyBorder: "#232E52",

  marigold: "#E8A33D",
  marigoldBright: "#F4B942",
  marigoldDim: "#C88A2E",

  skyBlue: "#0EA5E9",
  skyBlueBright: "#38BDF8",
  skyBlueDim: "#0284C7",

  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

export default function Tutors() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await tutorService.getTutors();

        const body = res?.data;
        const payload = body?.data;
        const list = payload?.tutors || body?.tutors || [];

        if (!cancelled) setTutors(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load tutors");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Client-side search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter((t) => {
      const name = t?.user?.name?.toLowerCase() || "";
      const subjects = (t?.subjects || []).join(" ").toLowerCase();
      return name.includes(q) || subjects.includes(q);
    });
  }, [tutors, search]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: COLORS.midnightNavy }}
        >
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: COLORS.midnightNavy, color: COLORS.white }}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
            style={{ background: COLORS.skyBlue }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
            style={{ background: COLORS.marigold }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                Marketplace
              </span>
              <span style={{ color: COLORS.whiteDim }}>•</span>
              <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                {filtered.length} tutors
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
              style={{ color: COLORS.white }}
            >
              Find a Tutor
            </h1>
            <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
              Learn from the best verified experts.
            </p>
          </div>

          {/* SEARCH */}
          <div className="mb-6">
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: COLORS.whiteDim }}
              >
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or subject..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition"
                style={{
                  background: COLORS.midnightNavyLight,
                  border: `1px solid ${COLORS.midnightNavyBorder}`,
                  color: COLORS.white,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.skyBlue;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.midnightNavyBorder;
                }}
              />
            </div>
          </div>

          {error && (
            <div
              className="mb-6 p-4 rounded-xl text-sm"
              style={{
                background: `${COLORS.marigold}15`,
                border: `1px solid ${COLORS.marigold}40`,
                color: COLORS.marigold,
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* TUTORS GRID */}
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.white }}>
                {search ? `No tutors match "${search}"` : "No tutors found"}
              </h2>
              <p className="text-sm mb-6" style={{ color: COLORS.whiteMuted }}>
                {search ? "Try a different search term" : "Be the first to become a tutor!"}
              </p>
              {!search && (
                <Link
                  to="/become-tutor"
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition hover:scale-105"
                  style={{
                    background: COLORS.skyBlue,
                    color: COLORS.white,
                  }}
                >
                  Become a Tutor
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t, i) => {
                const name = t?.user?.name || "Tutor";
                const avatar = t?.avatar || t?.user?.avatar || "";
                const initial = name[0]?.toUpperCase() || "T";
                const subjects = Array.isArray(t?.subjects) ? t.subjects : [];
                const rate = Number(t?.hourlyRate ?? 0);
                const currency = t?.currency || "USD";
                const rating = Number(t?.rating ?? 0);
                const reviews = t?.totalReviews ?? 0;
                const verified = t?.isVerified === true;
                const symbol =
                  currency === "INR" ? "₹" :
                  currency === "EUR" ? "€" :
                  currency === "GBP" ? "£" : "$";

                return (
                  <Link
                    key={t?._id || `tutor-${i}`}
                    to={t?._id ? `/tutors/${t._id}` : "#"}
                    className="rounded-2xl p-6 transition-all hover:-translate-y-1 flex flex-col"
                    style={{
                      background: COLORS.midnightNavyLight,
                      border: `1px solid ${COLORS.midnightNavyBorder}`,
                      boxShadow: `0 4px 16px rgba(14, 165, 233, 0.05)`,
                      minHeight: "220px",
                    }}
                  >
                    {/* Avatar + Info */}
                    <div className="flex items-start gap-3 mb-4">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          style={{ border: `1px solid ${COLORS.midnightNavyBorder}` }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                          style={{
                            background: `${COLORS.skyBlue}20`,
                            color: COLORS.skyBlueBright,
                            border: `1px solid ${COLORS.skyBlue}40`,
                          }}
                        >
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3
                            className="font-bold text-base truncate"
                            style={{ color: COLORS.white }}
                          >
                            {name}
                          </h3>
                          {verified && (
                            <span
                              className="text-[10px] flex-shrink-0"
                              style={{ color: COLORS.skyBlueBright }}
                              title="Verified"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs truncate"
                          style={{ color: COLORS.whiteMuted }}
                        >
                          {subjects.length ? subjects.slice(0, 3).join(", ") : "General"}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span style={{ color: COLORS.marigold }} className="text-xs">
                            ★
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.white }}
                          >
                            {rating.toFixed(1)}
                          </span>
                          <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                            ({reviews})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Rate + Arrow */}
                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: `1px solid ${COLORS.midnightNavyBorder}` }}
                    >
                      <div>
                        <span
                          className="text-lg font-bold"
                          style={{ color: COLORS.marigold }}
                        >
                          {symbol}{rate}
                        </span>
                        <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                          {" "}/hr
                        </span>
                      </div>
                      <span
                        className="text-sm transition group-hover:translate-x-1"
                        style={{ color: COLORS.skyBlue }}
                      >
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}