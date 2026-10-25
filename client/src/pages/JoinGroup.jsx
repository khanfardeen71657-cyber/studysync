// src/pages/JoinGroup.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupService } from "../services/groupService";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Loader from "../components/common/Loader.jsx";

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // ✅ FIXED: previewByInvite (not previewInvite)
        const res = await groupService.previewByInvite(inviteCode);
        const g = res?.data?.group || res?.data?.data?.group || res?.data;
        setPreview(g);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Invalid invite link"
        );
      } finally {
        setLoading(false);
      }
    };
    if (inviteCode) fetchPreview();
  }, [inviteCode]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      setError("");
      // ✅ joinByInvite is correct
      const res = await groupService.joinByInvite(inviteCode);
      const g = res?.data?.group || res?.data?.data?.group || res?.data;
      const groupId = g?._id || g?.id;
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate("/groups");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to join group"
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader />
        </div>
      </>
    );
  }

  if (error && !preview) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Invalid Invite Link
            </h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/groups")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold"
            >
              Go to Groups
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            You've been invited to
          </p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            {preview?.name || "Group"}
          </h1>

          {preview?.subject && (
            <p className="text-sm text-emerald-400 mb-3">
              📚 {preview.subject}
            </p>
          )}

          {preview?.description && (
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {preview.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 py-5 border-y border-slate-800 mb-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Members
              </div>
              <div className="text-lg font-bold text-white">
                {preview?.memberCount ?? preview?.members?.length ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Capacity
              </div>
              <div className="text-lg font-bold text-white">
                {preview?.maxMembers ?? 50}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Admin
              </div>
              <div className="text-sm font-bold text-white truncate">
                {preview?.admin?.name || "Unknown"}
              </div>
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {preview?.isFull ? (
            <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm">
              ⚠️ This group is full
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg text-white font-bold disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join Group →"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}