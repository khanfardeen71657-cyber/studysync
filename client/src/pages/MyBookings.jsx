// client/src/pages/MyBookings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import ReviewModal from "../components/tutor/ReviewModal.jsx";
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

  emerald: "#10B981",
  emeraldBright: "#34D399",
  rose: "#F43F5E",
  roseBright: "#FB7185",
  amber: "#F59E0B",

  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

// ═══════════════════════════════════════════════════════════════
// STATUS STYLES
// ═══════════════════════════════════════════════════════════════
const STATUS_STYLES = {
  pending: {
    label: "PENDING",
    color: COLORS.amber,
    bg: `${COLORS.amber}15`,
    border: `${COLORS.amber}40`,
    icon: "⏳",
  },
  confirmed: {
    label: "CONFIRMED",
    color: COLORS.emerald,
    bg: `${COLORS.emerald}15`,
    border: `${COLORS.emerald}40`,
    icon: "✓",
  },
  completed: {
    label: "COMPLETED",
    color: COLORS.skyBlue,
    bg: `${COLORS.skyBlue}15`,
    border: `${COLORS.skyBlue}40`,
    icon: "🎓",
  },
  cancelled: {
    label: "CANCELLED",
    color: COLORS.rose,
    bg: `${COLORS.rose}15`,
    border: `${COLORS.rose}40`,
    icon: "✕",
  },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewBooking, setReviewBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await tutorService.getMyBookings("student");
      const body = res?.data;
      const payload = body?.data;
      const list = payload?.bookings || body?.bookings || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await tutorService.updateBookingStatus(id, "cancelled", "Cancelled by student");
      fetchBookings();
    } catch (err) {
      alert("Error cancelling booking: " + err.message);
    }
  };

  // ✅ Filter by tab
  const filtered = useMemo(() => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  }, [bookings, activeTab]);

  // ✅ Group by date (upcoming vs past)
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = [];
    const past = [];

    filtered.forEach((b) => {
      const d = new Date(b.date);
      d.setHours(0, 0, 0, 0);
      if (d >= now && b.status !== "cancelled" && b.status !== "completed") {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcoming, past };
  }, [filtered]);

  // ✅ Counts per status
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

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

  const tabs = [
    { key: "all", label: "All", count: counts.all, icon: "📋" },
    { key: "pending", label: "Pending", count: counts.pending, icon: "⏳" },
    { key: "confirmed", label: "Confirmed", count: counts.confirmed, icon: "✓" },
    { key: "completed", label: "Completed", count: counts.completed, icon: "🎓" },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled, icon: "✕" },
  ];

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

        <div className="relative max-w-5xl mx-auto px-6 py-10">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: COLORS.marigold }}
                >
                  My Bookings
                </span>
                <span style={{ color: COLORS.whiteDim }}>•</span>
                <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                  {counts.all} total
                </span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: COLORS.white }}
              >
                Sessions & Bookings
              </h1>
              <p className="text-sm mt-1" style={{ color: COLORS.whiteMuted }}>
                Manage your tutoring sessions
              </p>
            </div>
            <Link
              to="/tutors"
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
              style={{
                background: COLORS.skyBlue,
                color: COLORS.white,
                boxShadow: `0 8px 24px -8px ${COLORS.skyBlue}80`,
              }}
            >
              + Book a Tutor
            </Link>
          </div>

          {/* TAB FILTERS */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const s = STATUS_STYLES[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap flex items-center gap-2"
                  style={{
                    background: isActive ? (s?.color || COLORS.skyBlue) : COLORS.midnightNavyLight,
                    color: isActive ? COLORS.midnightNavy : COLORS.whiteMuted,
                    border: `1px solid ${isActive ? (s?.color || COLORS.skyBlue) : COLORS.midnightNavyBorder}`,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: isActive ? "rgba(0,0,0,0.15)" : COLORS.midnightNavy,
                      color: isActive ? COLORS.midnightNavy : COLORS.whiteDim,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div
              className="mb-6 p-4 rounded-xl text-sm"
              style={{
                background: `${COLORS.rose}15`,
                border: `1px solid ${COLORS.rose}40`,
                color: COLORS.roseBright,
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* EMPTY */}
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.white }}>
                {activeTab === "all" ? "No bookings yet" : `No ${activeTab} bookings`}
              </h2>
              <p className="text-sm mb-6" style={{ color: COLORS.whiteMuted }}>
                {activeTab === "all" ? "Book your first tutoring session" : "Try a different filter"}
              </p>
              {activeTab === "all" && (
                <Link
                  to="/tutors"
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition hover:scale-105"
                  style={{
                    background: COLORS.skyBlue,
                    color: COLORS.white,
                  }}
                >
                  Find a Tutor
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════ */}
              {/* UPCOMING SESSIONS */}
              {/* ═══════════════════════════════════════════════════ */}
              {upcoming.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔜</span>
                    <h2
                      className="text-sm font-semibold uppercase tracking-wider"
                      style={{ color: COLORS.skyBlueBright }}
                    >
                      Upcoming Sessions
                    </h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{
                        background: `${COLORS.skyBlue}20`,
                        color: COLORS.skyBlueBright,
                      }}
                    >
                      {upcoming.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {upcoming.map((b) => (
                      <BookingCard
                        key={b._id}
                        booking={b}
                        onCancel={handleCancel}
                        onReview={setReviewBooking}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════ */}
              {/* PAST SESSIONS */}
              {/* ═══════════════════════════════════════════════════ */}
              {past.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📜</span>
                    <h2
                      className="text-sm font-semibold uppercase tracking-wider"
                      style={{ color: COLORS.whiteMuted }}
                    >
                      Past Sessions
                    </h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{
                        background: COLORS.midnightNavyLighter,
                        color: COLORS.whiteDim,
                      }}
                    >
                      {past.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {past.map((b) => (
                      <BookingCard
                        key={b._id}
                        booking={b}
                        onCancel={handleCancel}
                        onReview={setReviewBooking}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewed={() => {
            setReviewBooking(null);
            fetchBookings();
          }}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOOKING CARD COMPONENT
// ═══════════════════════════════════════════════════════════════
function BookingCard({ booking, onCancel, onReview }) {
  const b = booking;
  const tutorName = b?.tutor?.user?.name || b?.tutor?.name || "Tutor";
  const tutorAvatar = b?.tutor?.avatar || b?.tutor?.user?.avatar || "";
  const initial = tutorName[0]?.toUpperCase() || "T";

  const currency = b?.currency || "USD";
  const symbol =
    currency === "INR" ? "₹" :
    currency === "EUR" ? "€" :
    currency === "GBP" ? "£" : "$";

  const statusStyle = STATUS_STYLES[b.status] || STATUS_STYLES.pending;

  const groupId =
    typeof b?.sessionGroup === "object" && b?.sessionGroup !== null
      ? b.sessionGroup._id
      : b?.sessionGroup;

  const canJoinGroup = b.status === "confirmed" && !!groupId;
  const canCancel = b.status !== "cancelled" && b.status !== "completed";
  const canReview = b.status === "completed";

  const dateObj = new Date(b.date);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isToday = isSameDay(dateObj, new Date());

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: COLORS.midnightNavyLight,
        border: `1px solid ${COLORS.midnightNavyBorder}`,
      }}
    >
      {/* Status strip */}
      <div
        className="h-1"
        style={{ background: statusStyle.color }}
      />

      <div className="p-5">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {tutorAvatar ? (
              <img
                src={tutorAvatar}
                alt={tutorName}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                style={{ border: `1px solid ${COLORS.midnightNavyBorder}` }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
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
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3
                  className="font-bold text-base truncate"
                  style={{ color: COLORS.white }}
                >
                  {tutorName}
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-bold flex-shrink-0"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                >
                  {statusStyle.icon} {statusStyle.label}
                </span>
                {isToday && b.status !== "cancelled" && b.status !== "completed" && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{
                      background: `${COLORS.marigold}20`,
                      color: COLORS.marigold,
                    }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: COLORS.whiteMuted }}>
                📅 {dateStr} at {b.startTime} ({b.duration} mins)
              </p>
              {b.notes && (
                <p className="text-xs mt-1 italic truncate" style={{ color: COLORS.whiteDim }}>
                  "{b.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: COLORS.whiteDim }}>
              Amount
            </div>
            <div className="text-lg font-bold" style={{ color: COLORS.marigold }}>
              {symbol}{b.amount}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-2 mt-4 pt-4 flex-wrap"
          style={{ borderTop: `1px solid ${COLORS.midnightNavyBorder}` }}
        >
          {canJoinGroup && (
            <Link
              to={`/groups/${groupId}/room`}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition hover:scale-105 flex items-center gap-1.5"
              style={{
                background: COLORS.emerald,
                color: COLORS.white,
              }}
            >
              🎥 Join Session
            </Link>
          )}

          {canReview && (
            <button
              onClick={() => onReview(b)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition hover:scale-105 flex items-center gap-1.5"
              style={{
                background: COLORS.marigold,
                color: COLORS.midnightNavy,
              }}
            >
              ⭐ Leave Review
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(b._id)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition hover:scale-105 flex items-center gap-1.5 ml-auto"
              style={{
                background: `${COLORS.rose}15`,
                color: COLORS.roseBright,
                border: `1px solid ${COLORS.rose}40`,
              }}
            >
              ✕ Cancel
            </button>
          )}

          {b.status === "cancelled" && b.cancelledBy && (
            <span className="text-xs" style={{ color: COLORS.whiteDim }}>
              Cancelled by {b.cancelledBy}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER — same day check
// ═══════════════════════════════════════════════════════════════
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}