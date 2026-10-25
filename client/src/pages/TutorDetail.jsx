// client/src/pages/TutorDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import BookTutorModal from "../components/tutor/BookTutorModal.jsx";
import { tutorService } from "../services/tutorService.js";

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE
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

export default function TutorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBook, setShowBook] = useState(false);
  const [reviews, setReviews] = useState([]);

  // Fetch tutor
  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      setError("Invalid tutor link.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await tutorService.getTutorById(id);
        const tutorData =
          res?.data?.data?.tutor ||
          res?.data?.tutor ||
          null;

        if (!cancelled) {
          if (!tutorData || !tutorData._id) {
            setError("Tutor not found.");
          } else {
            setTutor(tutorData);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = String(err?.message || "");
          if (msg.toLowerCase().includes("invalid")) {
            setError("Invalid tutor ID.");
          } else if (msg.toLowerCase().includes("not found")) {
            setError("Tutor not found.");
          } else {
            setError(msg || "Failed to load tutor.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!tutor?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await tutorService.getTutorReviews(tutor._id);
        const list = res?.data?.data?.reviews || res?.data?.reviews || [];
        if (!cancelled) setReviews(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn("Reviews fetch failed:", err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [tutor?._id]);

  // Loading
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

  // Error
  if (error || !tutor) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          style={{ background: COLORS.midnightNavy, color: COLORS.white }}
        >
          <div className="text-5xl">🔍</div>
          <p style={{ color: COLORS.marigold }} className="text-center max-w-md">
            {error || "Tutor not found."}
          </p>
          <button
            onClick={() => navigate("/tutors")}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: COLORS.skyBlue, color: COLORS.white }}
          >
            ← Back to Tutors
          </button>
        </div>
      </>
    );
  }

  // Data
  const name = tutor?.user?.name || "Tutor";
  const email = tutor?.user?.email || "";
  const avatar = tutor?.avatar || tutor?.user?.avatar || "";
  const initial = name[0]?.toUpperCase() || "T";
  const subjects = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
  const rate = Number(tutor?.hourlyRate ?? 0);
  const currency = tutor?.currency || "USD";
  const rating = Number(tutor?.rating ?? 0);
  const reviewCount = Number(tutor?.totalReviews ?? 0);
  const sessions = Number(tutor?.totalSessions ?? 0);
  const experience = Number(tutor?.experience ?? 0);
  const bio = tutor?.bio || "";
  const languages = Array.isArray(tutor?.languages) ? tutor.languages : [];
  const availability = Array.isArray(tutor?.availability) ? tutor.availability : [];
  const verified = tutor?.isVerified === true;

  const symbol =
    currency === "INR" ? "₹" :
    currency === "EUR" ? "€" :
    currency === "GBP" ? "£" : "$";

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

        <div className="relative max-w-4xl mx-auto px-6 py-10">
          {/* Back */}
          <button
            onClick={() => navigate("/tutors")}
            className="text-sm mb-6 flex items-center gap-1 transition hover:opacity-80"
            style={{ color: COLORS.skyBlueBright }}
          >
            ← Back to Tutors
          </button>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* HERO CARD */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-6 md:p-8 mb-6"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            <div className="flex items-start gap-5 flex-wrap">
              {/* Avatar */}
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: `2px solid ${COLORS.skyBlue}40` }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
                  style={{
                    background: `${COLORS.skyBlue}20`,
                    border: `2px solid ${COLORS.skyBlue}40`,
                    color: COLORS.skyBlueBright,
                  }}
                >
                  {initial}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2 flex-wrap"
                  style={{ color: COLORS.white }}
                >
                  {name}
                  {verified && (
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{
                        background: `${COLORS.skyBlue}20`,
                        color: COLORS.skyBlueBright,
                        border: `1px solid ${COLORS.skyBlue}40`,
                      }}
                    >
                      ✓ VERIFIED
                    </span>
                  )}
                </h1>
                {email && (
                  <p className="text-sm mb-2" style={{ color: COLORS.whiteMuted }}>
                    {email}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span style={{ color: COLORS.whiteMuted }}>
                    ⭐ <strong style={{ color: COLORS.marigold }}>{rating.toFixed(1)}</strong> ({reviewCount})
                  </span>
                  <span style={{ color: COLORS.whiteDim }}>•</span>
                  <span style={{ color: COLORS.whiteMuted }}>
                    🎓 {sessions} sessions
                  </span>
                  {experience > 0 && (
                    <>
                      <span style={{ color: COLORS.whiteDim }}>•</span>
                      <span style={{ color: COLORS.whiteMuted }}>
                        💼 {experience} yrs
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Rate + Book */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold mb-2" style={{ color: COLORS.marigold }}>
                  {symbol}{rate}
                  <span className="text-sm font-medium" style={{ color: COLORS.whiteMuted }}>/hr</span>
                </div>
                <button
                  onClick={() => setShowBook(true)}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                  style={{
                    background: COLORS.skyBlue,
                    color: COLORS.white,
                    boxShadow: `0 8px 24px -8px ${COLORS.skyBlue}80`,
                  }}
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SUBJECTS */}
          {/* ═══════════════════════════════════════════════════════ */}
          {subjects.length > 0 && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                📚 Subjects
              </h2>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-semibold rounded-lg"
                    style={{
                      background: `${COLORS.skyBlue}20`,
                      color: COLORS.skyBlueBright,
                      border: `1px solid ${COLORS.skyBlue}40`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ABOUT */}
          {/* ═══════════════════════════════════════════════════════ */}
          {bio && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                📖 About
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: COLORS.whiteMuted }}>
                {bio}
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* LANGUAGES */}
          {/* ═══════════════════════════════════════════════════════ */}
          {languages.length > 0 && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                🗣️ Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-semibold rounded-lg"
                    style={{
                      background: `${COLORS.marigold}15`,
                      color: COLORS.marigold,
                      border: `1px solid ${COLORS.marigold}40`,
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* AVAILABILITY */}
          {/* ═══════════════════════════════════════════════════════ */}
          {availability.length > 0 && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                🗓️ Availability
              </h2>
              <div className="space-y-3">
                {availability.map((a) => (
                  <div
                    key={a.day}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{
                      background: COLORS.midnightNavyLighter,
                      border: `1px solid ${COLORS.midnightNavyBorder}`,
                    }}
                  >
                    <div
                      className="w-14 text-center text-xs font-bold uppercase py-1 rounded-lg flex-shrink-0"
                      style={{
                        background: `${COLORS.marigold}20`,
                        color: COLORS.marigold,
                      }}
                    >
                      {a.day}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(a.slots || []).map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs font-medium rounded-lg"
                          style={{
                            background: COLORS.midnightNavy,
                            color: COLORS.whiteMuted,
                            border: `1px solid ${COLORS.midnightNavyBorder}`,
                          }}
                        >
                          {s.startTime} – {s.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* REVIEWS */}
          {/* ═══════════════════════════════════════════════════════ */}
          {reviews.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                ⭐ Reviews ({reviews.length})
              </h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="pb-4"
                    style={{ borderBottom: `1px solid ${COLORS.midnightNavyBorder}` }}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: COLORS.white }}
                      >
                        {r.student?.name || "Student"}
                      </span>
                      <span style={{ color: COLORS.marigold }} className="text-xs">
                        {"★".repeat(r.rating)}
                        <span style={{ color: COLORS.midnightNavyBorder }}>
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm leading-relaxed" style={{ color: COLORS.whiteMuted }}>
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBook && tutor && (
        <BookTutorModal
          tutor={tutor}
          onClose={() => setShowBook(false)}
          onBooked={() => {
            setShowBook(false);
            navigate("/my-bookings");
          }}
        />
      )}
    </>
  );
}