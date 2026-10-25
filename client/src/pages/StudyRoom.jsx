// src/pages/StudyRoom.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import VideoCall from "../components/session/VideoCall";
import { useAuth } from "../context/AuthContext";
import { groupService } from "../services/groupService";
import { socket } from "../socket";
import { api } from "../api";

const AVATAR_COLORS = [
  "#a78bfa", "#f472b6", "#34d399", "#fbbf24",
  "#22d3ee", "#f87171", "#60a5fa", "#c084fc",
];

const FREE_COLORS = [
  "#22d3ee", "#a78bfa", "#f472b6",
  "#34d399", "#fbbf24", "#f87171",
];

const PREMIUM_COLORS = [
  ...FREE_COLORS,
  "#60a5fa", "#c084fc", "#fb923c",
  "#4ade80", "#38bdf8", "#e879f9",
];

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const computeCanDraw = (groupData, userId) => {
  if (!groupData || !userId) return false;
  const adminId =
    groupData.admin?._id ||
    groupData.admin ||
    groupData.owner?._id ||
    groupData.owner;
  if (adminId && adminId === userId) return true;
  const me = groupData.members?.find(
    (m) => (m.user?._id || m.user) === userId
  );
  return me?.role === "admin" || me?.role === "moderator";
};

export default function StudyRoom() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const currentStrokeIdRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#22d3ee");
  const [lineWidth, setLineWidth] = useState(3);

  const isPremium = user?.isPremium === true;

  const [canDraw, setCanDraw] = useState(false);
  const canDrawRef = useRef(false);

  useEffect(() => {
    canDrawRef.current = canDraw;
  }, [canDraw]);

  const [goal, setGoal] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoStartedBy, setVideoStartedBy] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("chat");

  // ─────────────────────────────────────────────────────
  // Load group
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await groupService.getById(groupId);
        const g = res?.data?.data?.group || res?.data?.group || res?.data;
        if (cancelled) return;
        setGroup(g);
        setGoal(g?.goal || "");
        setGoalInput(g?.goal || "");
        setIsLocked(g?.isLocked || false);
        setStrokes(Array.isArray(g?.whiteboardStrokes) ? g.whiteboardStrokes : []);
        setQuizzes(Array.isArray(g?.quizzes) ? g.quizzes : []);
        setResources(Array.isArray(g?.resources) ? g.resources : []);

        if (user?._id && g) {
          setCanDraw(computeCanDraw(g, user._id));
        }

        const msgs = await groupService.getMessages(groupId);
        const list = msgs?.data?.data || msgs?.data || [];
        if (cancelled) return;
        setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load room");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [groupId, user?._id]);

  // ─────────────────────────────────────────────────────
  // Socket wiring
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId || !user?._id || !socket) return;

    socket.emit("join-group", { groupId }, (res) => {
      if (!res?.success) {
        console.warn("join-group failed:", res?.message);
        return;
      }
      if (group) {
        setCanDraw(computeCanDraw(group, user._id));
      }
    });

    const onNewMessage = (msg) => {
      if (!msg) return;
      setMessages((prev) => [...prev, msg]);
    };

    const onPresence = ({ users }) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    };

    const onTyping = ({ userId, name, isTyping }) => {
      if (!userId || userId === user._id) return;
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== userId);
        return isTyping ? [...filtered, { userId, name: name || "User" }] : filtered;
      });
    };

    const onStroke = ({ strokes: newStrokes }) => {
      const incoming = Array.isArray(newStrokes) ? newStrokes : [];
      setStrokes((prev) => {
        const existing = new Set(prev.map((s) => s.id).filter(Boolean));
        const fresh = incoming.filter((s) => !s.id || !existing.has(s.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      setRedoStack([]);
    };

    const onStrokePoint = ({ strokeId, point }) => {
      if (!strokeId || !point) return;
      setStrokes((prev) => {
        const idx = prev.findIndex((s) => s.id === strokeId);
        if (idx === -1) return prev;
        const copy = [...prev];
        const target = { ...copy[idx], points: [...(copy[idx].points || []), point] };
        copy[idx] = target;
        return copy;
      });
    };

    const onWhiteboardSync = (all) => {
      setStrokes(Array.isArray(all) ? all : []);
    };
    const onWhiteboardClear = () => setStrokes([]);
    const onGoal = (g) => { setGoal(g || ""); setGoalInput(g || ""); };
    const onLock = (l) => setIsLocked(!!l);
    const onResourceAdded = (r) => {
      if (!r) return;
      setResources((prev) => [r, ...prev]);
    };

    const onPermission = ({ canDraw: ok }) => {
      console.log("🔍 whiteboard-permission:", ok);
      setCanDraw(!!ok);
    };
    const onDenied = ({ reason }) => {
      console.warn("Whiteboard denied:", reason);
    };

    // ✅ Video call group-wide
    const onVideoStarted = ({ startedBy, name: starterName }) => {
      console.log(`🎥 Video started by ${starterName || startedBy}`);
      setShowVideo(true);
      setVideoStartedBy(starterName || "Someone");
    };
    const onVideoEnded = () => {
      console.log("📵 Video ended");
      setShowVideo(false);
      setVideoStartedBy(null);
    };

    socket.on("new-message", onNewMessage);
    socket.on("presence-update", onPresence);
    socket.on("typing", onTyping);
    socket.on("stroke-received", onStroke);
    socket.on("stroke-point-received", onStrokePoint);
    socket.on("whiteboard-sync", onWhiteboardSync);
    socket.on("whiteboard-clear", onWhiteboardClear);
    socket.on("goal-sync", onGoal);
    socket.on("goal-update", onGoal);
    socket.on("lock-sync", onLock);
    socket.on("lock-update", onLock);
    socket.on("resource-added", onResourceAdded);
    socket.on("whiteboard-permission", onPermission);
    socket.on("whiteboard-denied", onDenied);
    socket.on("video-started", onVideoStarted);
    socket.on("video-ended", onVideoEnded);

    return () => {
      try { socket.emit("leave-group", { groupId }); } catch {}
      socket.off("new-message", onNewMessage);
      socket.off("presence-update", onPresence);
      socket.off("typing", onTyping);
      socket.off("stroke-received", onStroke);
      socket.off("stroke-point-received", onStrokePoint);
      socket.off("whiteboard-sync", onWhiteboardSync);
      socket.off("whiteboard-clear", onWhiteboardClear);
      socket.off("goal-sync", onGoal);
      socket.off("goal-update", onGoal);
      socket.off("lock-sync", onLock);
      socket.off("lock-update", onLock);
      socket.off("resource-added", onResourceAdded);
      socket.off("whiteboard-permission", onPermission);
      socket.off("whiteboard-denied", onDenied);
      socket.off("video-started", onVideoStarted);
      socket.off("video-ended", onVideoEnded);
    };
  }, [groupId, user?._id, group]);

  // ─────────────────────────────────────────────────────
  // Chat
  // ─────────────────────────────────────────────────────
  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text || isLocked || !socket) return;
    socket.emit("send-message", { groupId, text });
    setMessageInput("");
    socket.emit("typing", { groupId, isTyping: false });
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { groupId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { groupId, isTyping: false });
    }, 1500);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─────────────────────────────────────────────────────
  // Whiteboard draw
  // ─────────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#1a1f3a");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.06)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    (Array.isArray(strokes) ? strokes : []).forEach((s) => {
      if (!s?.points?.length) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color || "#22d3ee";
      ctx.lineWidth = s.tool === "eraser" ? 20 : s.lineWidth || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isPremium && s.tool !== "eraser") {
        ctx.shadowColor = s.color || "#22d3ee";
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      if (s.tool === "highlighter") {
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = (s.lineWidth || 3) * 4;
      } else {
        ctx.globalAlpha = 1;
      }

      if (s.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }, [strokes, isPremium]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !wrapper) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.floor(w * 0.5);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        redrawCanvas();
      }
    };

    resize();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(wrapper);
    }
    window.addEventListener("resize", resize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [redrawCanvas]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX =
      e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX;
    const clientY =
      e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
    if (clientX == null || clientY == null) return null;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startDraw = (e) => {
    if (isLocked || !socket) return;
    if (!canDrawRef.current) return;
    const p = getCanvasPos(e);
    if (!p) return;
    drawingRef.current = true;
    lastPointRef.current = p;
    const strokeId = makeId();
    currentStrokeIdRef.current = strokeId;
    const stroke = {
      id: strokeId,
      tool,
      color,
      lineWidth,
      points: [p],
    };
    setStrokes((prev) => [...prev, stroke]);
    setRedoStack([]);
    socket.emit("whiteboard-draw", { groupId, stroke });
  };

  const draw = (e) => {
    if (!drawingRef.current || isLocked || !socket) return;
    if (!canDrawRef.current) return;
    const p = getCanvasPos(e);
    if (!p) return;
    const last = lastPointRef.current;
    if (!last) return;

    setStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === currentStrokeIdRef.current);
      if (idx === -1) return prev;
      const copy = [...prev];
      const target = { ...copy[idx], points: [...copy[idx].points, p] };
      copy[idx] = target;
      return copy;
    });

    lastPointRef.current = p;
    socket.emit("whiteboard-draw-point", {
      groupId,
      strokeId: currentStrokeIdRef.current,
      point: p,
    });
  };

  const endDraw = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
    currentStrokeIdRef.current = null;
  };

  const clearWhiteboard = async () => {
    if (isLocked || !canDrawRef.current) return;
    if (!confirm("Clear the whiteboard for everyone?")) return;
    try {
      await groupService.clearWhiteboard(groupId);
      setStrokes([]);
    } catch (err) {
      console.error(err);
      alert("Clear failed: " + err.message);
    }
  };

  const saveWhiteboard = async () => {
    if (!canDrawRef.current) return;
    try {
      await groupService.saveWhiteboard(groupId, strokes, true);
      alert("Whiteboard saved ✅");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const exportPng = () => {
    if (!isPremium) {
      alert("⭐ Export PNG requires Premium");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const undo = () => {
    if (!canDrawRef.current) return;
    if (!isPremium) {
      alert("⭐ Undo requires Premium");
      return;
    }
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    if (!canDrawRef.current) return;
    if (!isPremium) {
      alert("⭐ Redo requires Premium");
      return;
    }
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const saveGoal = async () => {
    try {
      await groupService.updateGoal(groupId, goalInput);
      setGoal(goalInput);
    } catch (err) { alert(err.message); }
  };

  const toggleLock = async () => {
    try {
      const next = !isLocked;
      await groupService.setLock(groupId, next);
      setIsLocked(next);
    } catch (err) { alert(err.message); }
  };

  // ✅ VIDEO CALL — group-wide toggle
  const toggleVideo = () => {
    const next = !showVideo;
    setShowVideo(next);
    if (!next) setVideoStartedBy(null);
    if (socket) {
      socket.emit(next ? "video-started" : "video-ended", { groupId });
    }
  };

  // ✅ DELETE group
  const handleDeleteGroup = async () => {
    if (!confirm(`Delete "${group.name}" permanently? All messages, files, quizzes will be lost.`)) return;
    try {
      await groupService.delete(groupId);
      alert("Group deleted ✅");
      navigate("/groups");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // ✅ LEAVE group
  const handleLeaveGroup = async () => {
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await groupService.leave(groupId);
      alert("Left group ✅");
      navigate("/groups");
    } catch (err) {
      alert("Leave failed: " + err.message);
    }
  };

  const uploadResource = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      const res = await api.upload(`/groups/${groupId}/resources`, fd);
      const newResource =
        res?.data?.data?.resource || res?.data?.resource || null;
      if (newResource) setResources((prev) => [newResource, ...prev]);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─────────────────────────────────────────────────────
  // Guards
  // ─────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader />
        </div>
      </>
    );
  }

  if (error || !group) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
          <p className="text-red-400">{error || "Group not found"}</p>
          <button
            onClick={() => navigate("/groups")}
            className="px-4 py-2 bg-purple-600 rounded-lg"
          >
            Back
          </button>
        </div>
      </>
    );
  }

  const isAdmin =
    group.admin?._id === user?._id || group.admin === user?._id;

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{group.emoji || "📚"}</span>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {group.name}
                  {isPremium && (
                    <span className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full font-bold">
                      ⭐ PRO
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-400">
                  {group.subject || "General"} •{" "}
                  {group.members?.length || 0} members
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* ✅ VIDEO BUTTON — group-wide */}
              <button
                onClick={toggleVideo}
                className={`px-3 py-2 rounded-lg text-sm ${
                  showVideo ? "bg-red-600" : "bg-emerald-600"
                }`}
              >
                {showVideo ? "📵 End Video" : "🎥 Start Video"}
              </button>

              <button
                onClick={toggleLock}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isLocked ? "bg-red-600" : "bg-slate-700"
                }`}
                disabled={!isAdmin}
              >
                {isLocked ? "🔒 Locked" : "🔓 Open"}
              </button>

              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  className="px-3 py-2 bg-red-700 rounded-lg text-sm hover:bg-red-600"
                  title="Delete group permanently"
                >
                  🗑️ Delete
                </button>
              )}

              {!isAdmin && (
                <button
                  onClick={handleLeaveGroup}
                  className="px-3 py-2 bg-orange-700 rounded-lg text-sm hover:bg-orange-600"
                  title="Leave this group"
                >
                  🚪 Leave
                </button>
              )}

              <button
                onClick={() => navigate("/groups")}
                className="px-3 py-2 bg-slate-700 rounded-lg text-sm"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Goal */}
          <div className="mb-4 p-3 bg-slate-900 rounded-lg flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-400">🎯 Goal:</span>
            <input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="flex-1 bg-slate-800 rounded px-3 py-1 text-sm min-w-[200px]"
              placeholder="Set a study goal..."
              disabled={!isAdmin}
            />
            {isAdmin && (
              <button
                onClick={saveGoal}
                className="px-3 py-1 bg-purple-600 rounded text-sm"
              >
                Save
              </button>
            )}
          </div>

          {/* ✅ VIDEO SECTION — sabko show */}
          {showVideo && (
            <div className="mb-4">
              {videoStartedBy && (
                <div className="mb-2 text-xs text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  🎥 Video call active — started by {videoStartedBy}
                </div>
              )}
              <VideoCall groupId={groupId} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* WHITEBOARD */}
            <div className="lg:col-span-2 rounded-xl p-3 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
              <div className="absolute top-0 left-1/4 w-64 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-64 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

              {/* Toolbar */}
              <div className="relative flex flex-wrap items-center gap-2 mb-3 z-10">
                <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  🖊️ Whiteboard
                </span>

                {isPremium ? (
                  <span className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold">
                    ⭐ PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-700/80 text-slate-300 rounded-full backdrop-blur">
                    Free
                  </span>
                )}

                {!canDraw && (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-700/80 text-slate-300 rounded-full backdrop-blur">
                    👁️ View only
                  </span>
                )}

                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                  disabled={isLocked || !canDraw}
                  className="bg-slate-800/80 backdrop-blur rounded px-2 py-1 text-xs border border-slate-700 disabled:opacity-50"
                >
                  <option value="pen">✏️ Pen</option>
                  <option value="eraser">🧹 Eraser</option>
                  {isPremium && <option value="highlighter">🖍️ Highlighter</option>}
                </select>

                <div className="flex gap-1 items-center">
                  {(isPremium ? PREMIUM_COLORS : FREE_COLORS).map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      disabled={!canDraw}
                      className={`w-6 h-6 rounded-full border-2 transition-all disabled:opacity-40 ${
                        color === c
                          ? "border-white scale-110"
                          : "border-slate-700 hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: c,
                        boxShadow: color === c ? `0 0 12px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>

                <input
                  type="range"
                  min="1"
                  max={isPremium ? 20 : 10}
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-20 accent-cyan-500"
                  disabled={isLocked || !canDraw}
                  title={`Brush: ${lineWidth}px`}
                />

                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={undo}
                    disabled={!canDraw}
                    className={`px-2 py-1 backdrop-blur rounded text-xs border ${
                      isPremium && canDraw
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700"
                        : "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                    title={isPremium ? "Undo" : "⭐ Premium"}
                  >
                    ↶
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canDraw}
                    className={`px-2 py-1 backdrop-blur rounded text-xs border ${
                      isPremium && canDraw
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700"
                        : "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                    title={isPremium ? "Redo" : "⭐ Premium"}
                  >
                    ↷
                  </button>
                  <button
                    onClick={exportPng}
                    className={`px-2 py-1 backdrop-blur rounded text-xs border ${
                      isPremium
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700"
                        : "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                    title={isPremium ? "Export PNG" : "⭐ Premium"}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={clearWhiteboard}
                    className="px-2 py-1 bg-red-700/80 backdrop-blur rounded text-xs hover:bg-red-600 disabled:opacity-40"
                    disabled={isLocked || !canDraw}
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveWhiteboard}
                    className="px-2 py-1 bg-emerald-700/80 backdrop-blur rounded text-xs hover:bg-emerald-600 disabled:opacity-40"
                    disabled={!canDraw}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Canvas wrapper */}
              <div ref={canvasWrapperRef} className="relative z-10 w-full">
                <canvas
                  ref={canvasRef}
                  className={`w-full rounded-lg block ${
                    isLocked || !canDraw
                      ? "cursor-not-allowed"
                      : "cursor-crosshair touch-none"
                  }`}
                  style={{ border: "1px solid rgba(99, 102, 241, 0.3)" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />

                {!canDraw && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg text-sm text-slate-300 shadow-lg">
                      👁️ Sirf admin/moderator draw kar sakta hai
                    </div>
                  </div>
                )}

                {!isPremium && (
                  <div className="absolute bottom-3 right-3 pointer-events-auto">
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            "Unlock Premium to get highlighter, undo/redo, export, glow, 12 colors?"
                          )
                        )
                          return;
                        try {
                          await api.patch("/auth/premium", { isPremium: true });
                          window.location.reload();
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-xs font-bold shadow-lg hover:opacity-90"
                    >
                      ⭐ Unlock Premium
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SIDE PANEL */}
            <div className="bg-slate-900 rounded-xl p-3 flex flex-col">
              <div className="flex gap-1 mb-2 border-b border-slate-800">
                {["chat", "resources", "quizzes"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm rounded-t ${
                      activeTab === tab
                        ? "bg-slate-800 text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {tab === "chat" && "💬 Chat"}
                    {tab === "resources" && "📁 Files"}
                    {tab === "quizzes" && "🧠 Quizzes"}
                  </button>
                ))}
              </div>

              {activeTab === "chat" && (
                <>
                  <div className="flex-1 overflow-y-auto max-h-96 space-y-2 pr-1">
                    {messages.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-6">
                        No messages yet. Say hi! 👋
                      </p>
                    )}
                    {messages.map((m, i) => (
                      <div key={m._id || `msg-${i}`} className="text-sm">
                        <span
                          className="font-semibold"
                          style={{ color: m.authorColor || "#a78bfa" }}
                        >
                          {m.authorName || "User"}:{" "}
                        </span>
                        <span className="text-slate-200">{m.text}</span>
                      </div>
                    ))}
                    {typingUsers.length > 0 && (
                      <p className="text-xs text-slate-500 italic">
                        {typingUsers.map((u) => u.name).join(", ")} typing...
                      </p>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={messageInput}
                      onChange={handleTyping}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder={isLocked ? "Room is locked" : "Type a message..."}
                      className="flex-1 bg-slate-800 rounded px-3 py-2 text-sm"
                      disabled={isLocked}
                    />
                    <button
                      onClick={sendMessage}
                      className="px-3 py-2 bg-purple-600 rounded text-sm"
                      disabled={isLocked}
                    >
                      Send
                    </button>
                  </div>
                </>
              )}

              {activeTab === "resources" && (
                <>
                  <div className="flex-1 overflow-y-auto max-h-96 space-y-2">
                    {resources.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-6">
                        No files yet.
                      </p>
                    )}
                    {resources.map((r, i) => (
                      <a
                        key={r._id || `res-${i}`}
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-2 bg-slate-800 rounded hover:bg-slate-700"
                      >
                        <p className="text-sm truncate">{r.title}</p>
                        <p className="text-xs text-slate-500">
                          by {r.uploadedBy?.name || "User"} •{" "}
                          {r.downloads || 0} downloads
                        </p>
                      </a>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={uploadResource}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.txt"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-3 py-2 bg-emerald-600 rounded text-sm"
                    >
                      + Upload File
                    </button>
                  </div>
                </>
              )}

              {activeTab === "quizzes" && (
                <div className="flex-1 overflow-y-auto max-h-96 space-y-2">
                  {quizzes.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-6">
                      No quizzes yet.
                    </p>
                  )}
                  {quizzes.map((q, i) => (
                    <button
                      key={q._id || `quiz-${i}`}
                      onClick={() => q._id && navigate(`/quizzes/${q._id}`)}
                      className="w-full text-left p-2 bg-slate-800 rounded hover:bg-slate-700"
                    >
                      <p className="text-sm">{q.title}</p>
                      <p className="text-xs text-slate-500">
                        {q.totalPoints} pts • {q.attempts || 0} attempts
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-1">
                  🟢 Online ({onlineUsers.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {onlineUsers.map((u, i) => {
                    const id = typeof u === "string" ? u : u._id;
                    const name = typeof u === "string" ? u : u.name;
                    return (
                      <span
                        key={id || i}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{
                          backgroundColor:
                            AVATAR_COLORS[i % AVATAR_COLORS.length],
                        }}
                        title={name || id}
                      >
                        {(name || id || "?").slice(0, 1).toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}