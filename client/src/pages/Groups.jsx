// client/src/pages/Groups.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { groupService } from "../services/groupService.js";

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

  red: "#EF4444",
  redDim: "#DC2626",
  orange: "#F97316",
};

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // groupId being acted upon

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await groupService.getMyGroups();
        const list = res?.data?.data?.groups || res?.data?.groups || [];
        if (!cancelled) setGroups(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load groups");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ✅ DELETE group (admin only)
  const handleDeleteGroup = async (e, groupId, groupName) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${groupName}" permanently? All messages, files, quizzes will be lost.`)) return;

    setActionLoading(groupId);
    try {
      await groupService.delete(groupId);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      alert("Group deleted ✅");
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ LEAVE group (member only)
  const handleLeaveGroup = async (e, groupId, groupName) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Leave "${groupName}"?`)) return;

    setActionLoading(groupId);
    try {
      await groupService.leave(groupId);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      alert("Left group ✅");
    } catch (err) {
      alert("Leave failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
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
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: COLORS.marigold }}
                >
                  My Groups
                </span>
                <span style={{ color: COLORS.whiteDim }}>•</span>
                <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                  {groups.length} active
                </span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: COLORS.white }}
              >
                Study Groups
              </h1>
              <p className="text-sm mt-1" style={{ color: COLORS.whiteMuted }}>
                Collaborate, share, and learn together
              </p>
            </div>

            <button
              onClick={() => navigate("/groups/create")}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
              style={{
                background: COLORS.marigold,
                color: COLORS.midnightNavy,
                boxShadow: `0 8px 24px -8px ${COLORS.marigold}80`,
              }}
            >
              + Create Group
            </button>
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

          {/* EMPTY STATE */}
          {groups.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.white }}>
                No groups yet
              </h2>
              <p className="text-sm mb-6" style={{ color: COLORS.whiteMuted }}>
                Create your first study group and invite classmates
              </p>
              <button
                onClick={() => navigate("/groups/create")}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                style={{
                  background: COLORS.skyBlue,
                  color: COLORS.white,
                }}
              >
                Create Group
              </button>
            </div>
          ) : (
            /* GROUPS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => {
                const members = Array.isArray(group.members) ? group.members : [];
                const resources = Array.isArray(group.resources) ? group.resources : [];
                const quizzes = Array.isArray(group.quizzes) ? group.quizzes : [];
                const isAdmin =
                  group.admin?._id === user?._id || group.admin === user?._id;
                const isBusy = actionLoading === group._id;

                return (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="rounded-2xl p-6 transition-all hover:-translate-y-1 flex flex-col relative group"
                    style={{
                      background: COLORS.midnightNavyLight,
                      border: `1px solid ${COLORS.midnightNavyBorder}`,
                      boxShadow: `0 4px 16px rgba(14, 165, 233, 0.05)`,
                      minHeight: "260px",
                      opacity: isBusy ? 0.6 : 1,
                      pointerEvents: isBusy ? "none" : "auto",
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: `${COLORS.marigold}20` }}
                        >
                          {group.emoji || "📚"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-bold text-base truncate leading-tight"
                            style={{ color: COLORS.white }}
                          >
                            {group.name}
                          </h3>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{
                              color: COLORS.skyBlueBright,
                              fontWeight: 600,
                            }}
                          >
                            {group.subject || "General"}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-bold flex-shrink-0"
                          style={{
                            background: `${COLORS.marigold}20`,
                            color: COLORS.marigold,
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p
                      className="text-sm leading-relaxed mb-4 line-clamp-2"
                      style={{
                        color: COLORS.whiteMuted,
                        minHeight: "40px",
                      }}
                    >
                      {group.description || "No description"}
                    </p>

                    <div className="flex-1" />

                    {/* ✅ ACTION BUTTONS (hover pe dikhte hain) */}
                    <div className="flex gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {isAdmin ? (
                        <button
                          onClick={(e) =>
                            handleDeleteGroup(e, group._id, group.name)
                          }
                          disabled={isBusy}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                          style={{
                            background: `${COLORS.red}20`,
                            color: COLORS.red,
                            border: `1px solid ${COLORS.red}40`,
                          }}
                          title="Delete group permanently"
                        >
                          {isBusy ? "⏳ Deleting..." : "🗑️ Delete"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) =>
                            handleLeaveGroup(e, group._id, group.name)
                          }
                          disabled={isBusy}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                          style={{
                            background: `${COLORS.orange}20`,
                            color: COLORS.orange,
                            border: `1px solid ${COLORS.orange}40`,
                          }}
                          title="Leave this group"
                        >
                          {isBusy ? "⏳ Leaving..." : "🚪 Leave"}
                        </button>
                      )}
                    </div>

                    {/* Stats */}
                    <div
                      className="flex items-center justify-between pt-4"
                      style={{
                        borderTop: `1px solid ${COLORS.midnightNavyBorder}`,
                      }}
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">👥</span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.white }}
                          >
                            {members.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">📁</span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.white }}
                          >
                            {resources.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🧠</span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.white }}
                          >
                            {quizzes.length}
                          </span>
                        </div>
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