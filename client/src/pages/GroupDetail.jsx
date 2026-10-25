// client/src/pages/GroupDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { groupService } from "../services/groupService.js";

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE — professional dark theme
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  // Background
  midnightNavy: "#0A1128",
  midnightNavyLight: "#111936",
  midnightNavyLighter: "#1A2342",
  midnightNavyBorder: "#232E52",

  // Accents
  marigold: "#E8A33D",
  marigoldBright: "#F4B942",
  marigoldDim: "#C88A2E",

  skyBlue: "#0EA5E9",
  skyBlueBright: "#38BDF8",
  skyBlueDim: "#0284C7",

  // Text
  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await groupService.getById(id);
        const g = res?.data?.data?.group || res?.data?.group || res?.data;
        if (!cancelled) {
          if (!g) setError("Group not found");
          else setGroup(g);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load group");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const copyInvite = async () => {
    if (!group?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(group.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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

  if (error || !group) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          style={{ background: COLORS.midnightNavy, color: COLORS.white }}
        >
          <p style={{ color: COLORS.marigold }}>{error || "Group not found"}</p>
          <button
            onClick={() => navigate("/groups")}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: COLORS.skyBlue, color: COLORS.white }}
          >
            ← Back to Groups
          </button>
        </div>
      </>
    );
  }

  const members = Array.isArray(group.members) ? group.members : [];
  const resources = Array.isArray(group.resources) ? group.resources : [];
  const quizzes = Array.isArray(group.quizzes) ? group.quizzes : [];
  const isAdmin =
    group.admin?._id === user?._id || group.admin === user?._id;

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
          {/* Back */}
          <button
            onClick={() => navigate("/groups")}
            className="text-sm mb-6 flex items-center gap-1 transition hover:opacity-80"
            style={{ color: COLORS.skyBlueBright }}
          >
            ← Back to Groups
          </button>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* HERO — professional dark card */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-8 mb-6"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                style={{
                  background: `${COLORS.skyBlue}20`,
                  color: COLORS.skyBlueBright,
                  border: `1px solid ${COLORS.skyBlue}40`,
                }}
              >
                {group.subject || "Tutoring Session"}
              </span>
              {isAdmin && (
                <span
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                  style={{
                    background: `${COLORS.marigold}15`,
                    color: COLORS.marigold,
                    border: `1px solid ${COLORS.marigold}40`,
                  }}
                >
                  🛡️ ADMIN
                </span>
              )}
            </div>

            {/* Title + emoji */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${COLORS.marigold}20` }}
              >
                {group.emoji || "📚"}
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-2xl md:text-3xl font-bold leading-tight mb-2"
                  style={{ color: COLORS.white }}
                >
                  {group.name}
                </h1>
                <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
                  {group.description || "No description"}
                </p>
              </div>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-5 flex-wrap text-sm mt-5">
              <span style={{ color: COLORS.whiteMuted }}>
                👥 <strong style={{ color: COLORS.white }}>{members.length}</strong> members
              </span>
              <span style={{ color: COLORS.whiteMuted }}>
                📁 <strong style={{ color: COLORS.white }}>{resources.length}</strong> files
              </span>
              <span style={{ color: COLORS.whiteMuted }}>
                🧠 <strong style={{ color: COLORS.white }}>{quizzes.length}</strong> quizzes
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <button
                onClick={() => navigate(`/groups/${group._id}/room`)}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                style={{
                  background: COLORS.skyBlue,
                  color: COLORS.white,
                  boxShadow: `0 8px 24px -8px ${COLORS.skyBlue}80`,
                }}
              >
                🎥 Enter Study Room
              </button>
              {group.inviteLink && (
                <button
                  onClick={copyInvite}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                  style={{
                    background: COLORS.midnightNavyLighter,
                    border: `1px solid ${COLORS.midnightNavyBorder}`,
                    color: COLORS.white,
                  }}
                >
                  {copied ? "✓ Copied!" : "🔗 Copy Invite"}
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ABOUT + GOAL — two dark cards */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                📖 About this group
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.whiteMuted }}>
                {group.description || "No description yet."}
              </p>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                🎯 Session Goal
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.whiteMuted }}>
                {group.goal || "No goal set yet."}
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* QUICK STATS — 4 dark cards */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <h2
              className="text-sm font-semibold mb-3 uppercase tracking-wider"
              style={{ color: COLORS.whiteMuted }}
            >
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="👥"
                label="Members"
                value={members.length}
                accent={COLORS.skyBlue}
              />
              <StatCard
                icon="📁"
                label="Files"
                value={resources.length}
                accent={COLORS.marigold}
              />
              <StatCard
                icon="🧠"
                label="Quizzes"
                value={quizzes.length}
                accent={COLORS.skyBlue}
              />
              <StatCard
                icon="📅"
                label="Created"
                value={new Date(group.createdAt).toLocaleDateString()}
                accent={COLORS.marigold}
                isDate
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MEMBERS — dark card, clean list */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                👥 Members
              </h2>
              <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                {members.length} total
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members.map((m) => {
                const u = m.user || m;
                const isGroupAdmin =
                  u._id === group.admin?._id || u._id === group.admin;
                return (
                  <div
                    key={u._id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: COLORS.midnightNavyLighter,
                      border: `1px solid ${COLORS.midnightNavyBorder}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isGroupAdmin ? COLORS.marigold : COLORS.skyBlue,
                        color: COLORS.midnightNavy,
                      }}
                    >
                      {(u.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-semibold truncate"
                        style={{ color: COLORS.white }}
                      >
                        {u.name || "User"}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{
                          color: isGroupAdmin ? COLORS.marigoldDim : COLORS.skyBlueDim,
                          fontWeight: 500,
                        }}
                      >
                        {isGroupAdmin ? "Admin" : m.role || "Member"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* INVITE — dark card */}
          {/* ═══════════════════════════════════════════════════════ */}
          {group.inviteLink && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h2
                className="text-sm font-semibold mb-2 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                🔗 Invite Members
              </h2>
              <p className="text-sm mb-4" style={{ color: COLORS.whiteMuted }}>
                Share this link with your classmates to join the group
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  readOnly
                  value={group.inviteLink}
                  className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg text-sm font-mono"
                  style={{
                    background: COLORS.midnightNavy,
                    border: `1px solid ${COLORS.midnightNavyBorder}`,
                    color: COLORS.whiteMuted,
                  }}
                />
                <button
                  onClick={copyInvite}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                  style={{
                    background: COLORS.skyBlue,
                    color: COLORS.white,
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stat Card — dark professional
// ═══════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, accent, isDate }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: COLORS.midnightNavyLight,
        border: `1px solid ${COLORS.midnightNavyBorder}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base mb-3"
        style={{ background: `${accent}20` }}
      >
        {icon}
      </div>
      <div
        className={`font-bold mb-1 ${isDate ? "text-base" : "text-2xl"}`}
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: COLORS.whiteDim }}>
        {label}
      </div>
    </div>
  );
}