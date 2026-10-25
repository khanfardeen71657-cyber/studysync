// client/src/pages/Dashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { tutorService } from "../services/tutorService.js";

const COLORS = {
  midnightNavy: "#0A1128",
  midnightNavyLight: "#111936",
  midnightNavyBorder: "#232E52",
  marigold: "#E8A33D",
  marigoldBright: "#F4B942",
  skyBlue: "#0EA5E9",
  skyBlueBright: "#38BDF8",
  emerald: "#10B981",
  emeraldBright: "#34D399",
  rose: "#F43F5E",
  amber: "#F59E0B",
  violet: "#A855F7",
  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "The expert in anything was once a beginner.",
  "Study while others are sleeping; work while others are loafing.",
  "The future depends on what you do today.",
  "Small progress is still progress.",
];

const ACHIEVEMENTS = [
  { icon: "🎯", label: "First Quiz", unlocked: true, color: COLORS.skyBlue },
  { icon: "🔥", label: "7 Day Streak", unlocked: true, color: COLORS.marigold },
  { icon: "📚", label: "Bookworm", unlocked: true, color: COLORS.emerald },
  { icon: "🏆", label: "Top 10", unlocked: true, color: COLORS.violet },
  { icon: "⚡", label: "Speed Run", unlocked: true, color: COLORS.amber },
  { icon: "💎", label: "Diamond", unlocked: false, color: COLORS.rose },
];

// ✅ Daily challenges (rotates by day)
const DAILY_CHALLENGES = [
  "Complete 1 quiz today 🎯",
  "Study for 25 minutes 📚",
  "Help a friend with a doubt 🤝",
  "Review your notes for 10 min 📝",
  "Join a study group session 👥",
  "Attempt a new quiz 🧠",
  "Take a 5-min break and stretch 🧘",
];

// ✅ Friends online (mock)
const FRIENDS_ONLINE = [
  { name: "jaat bhai", initial: "J", color: COLORS.skyBlue },
  { name: "fardeen", initial: "F", color: COLORS.marigold },
  { name: "zade", initial: "Z", color: COLORS.emerald },
];

// ✅ Recent files (mock)
const RECENT_FILES = [
  { name: "Calculus Notes.pdf", icon: "📄", size: "2.3 MB", time: "2h ago" },
  { name: "Physics Formula.pdf", icon: "📐", size: "1.1 MB", time: "Yesterday" },
  { name: "Chemistry Lab.docx", icon: "⚗️", size: "890 KB", time: "2d ago" },
];

// ✅ Progress timeline
const TIMELINE = [
  { icon: "🎯", title: "First Quiz", done: true, color: COLORS.skyBlue },
  { icon: "🔥", title: "7 Day Streak", done: true, color: COLORS.marigold },
  { icon: "📚", title: "10 Sessions", done: true, color: COLORS.emerald },
  { icon: "🏆", title: "Top 10 Rank", done: true, color: COLORS.violet },
  { icon: "💎", title: "Diamond Badge", done: false, color: COLORS.rose },
];

// ═══════════════════════════════════════════════════════════════
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (target === 0) return;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

function useFocusTimer(onComplete) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { setRunning(false); onComplete?.(); return 25 * 60; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, onComplete]);
  const toggle = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setSeconds(25 * 60); };
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / (25 * 60);
  return {
    progress, running, toggle, reset,
    display: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
  };
}

function CursorGlow() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div className="fixed pointer-events-none z-0 rounded-full blur-3xl opacity-20" style={{
      left: pos.x - 150, top: pos.y - 150, width: 300, height: 300,
      background: `radial-gradient(circle, ${COLORS.skyBlue}, transparent 70%)`,
      transition: "left 0.1s ease-out, top 0.1s ease-out",
    }} />
  );
}

function Particles() {
  const particles = useMemo(
    () => Array.from({ length: 24 }).map((_, i) => ({
      id: i, left: Math.random() * 100, top: Math.random() * 100,
      size: 2 + Math.random() * 3, delay: Math.random() * 8,
      duration: 8 + Math.random() * 8,
      color: i % 3 === 0 ? COLORS.skyBlue : i % 3 === 1 ? COLORS.marigold : COLORS.violet,
    })), []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full" style={{
          left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size,
          background: p.color, opacity: 0.4, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ProgressRing({ value, max, color, icon, label }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);
  const animated = useCounter(Math.round(pct * 100), 1200);
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden text-center transition hover:-translate-y-1" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ background: color }} />
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke={`${COLORS.whiteDim}20`} strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="6" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease-out", filter: `drop-shadow(0 0 6px ${color}80)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl">{icon}</span>
          <span className="text-lg font-bold" style={{ color }}>{animated}%</span>
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: COLORS.white }}>{value}</div>
      <div className="text-xs uppercase tracking-wider mt-0.5" style={{ color: COLORS.whiteDim }}>{label}</div>
    </div>
  );
}

function Sparkline({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
          height: `${Math.max((v / max) * 100, 8)}%`,
          background: `linear-gradient(to top, ${color}, ${color}80)`,
          boxShadow: v > 0 ? `0 0 8px ${color}60` : "none",
          opacity: v > 0 ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
}

function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 50 }).map((_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.3,
    color: [COLORS.skyBlue, COLORS.marigold, COLORS.emerald, COLORS.rose, COLORS.violet][i % 5],
    rotate: Math.random() * 360, size: 6 + Math.random() * 6,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="absolute top-0" style={{
          left: `${p.left}%`, width: p.size, height: p.size, background: p.color,
          transform: `rotate(${p.rotate}deg)`, borderRadius: p.id % 2 === 0 ? "50%" : "2px",
          animation: `confetti-fall 2.5s ease-out ${p.delay}s forwards`,
        }} />
      ))}
    </div>
  );
}

function getTimeIcon() {
  const h = new Date().getHours();
  if (h < 5) return "🌙";
  if (h < 12) return "🌅";
  if (h < 17) return "☀️";
  if (h < 21) return "🌇";
  return "🌙";
}

// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ groups: 0, bookings: 0, sessions: 0, pendingTutors: 0 });
  const [celebrate, setCelebrate] = useState(false);
  const [note, setNote] = useState("");

  const focus = useFocusTimer(() => {
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 3000);
  });
  const isTutor = user?.role === "tutor";
  const isAdmin = user?.role === "admin";

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const dailyChallenge = DAILY_CHALLENGES[new Date().getDate() % DAILY_CHALLENGES.length];
  const streak = [true, true, true, true, true, false, true];
  const streakCount = streak.filter(Boolean).length;
  const weeklyActivity = [3, 5, 2, 8, 4, 6, 3];

  const xp = stats.groups * 50 + stats.bookings * 30 + stats.sessions * 100 + 250;
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = (xp % 500) / 500;

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const s = { groups: 0, bookings: 0, sessions: 0, pendingTutors: 0 };
        if (Array.isArray(user.groups)) s.groups = user.groups.length;
        if (!isAdmin) {
          try {
            const role = isTutor ? "tutor" : "student";
            const res = await tutorService.getMyBookings(role);
            const list = res?.data?.data?.bookings || res?.data?.bookings || [];
            s.bookings = list.length;
            s.sessions = list.filter((b) => b.status === "confirmed" || b.status === "completed").length;
          } catch {}
        }
        if (isAdmin) {
          try {
            const res = await tutorService.listPendingTutors();
            const list = res?.data?.data?.tutors || res?.data?.tutors || [];
            s.pendingTutors = list.length;
          } catch {}
        }
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isTutor, isAdmin]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.midnightNavy }}>
          <Loader />
        </div>
      </>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const roleColor = isAdmin ? COLORS.rose : isTutor ? COLORS.marigold : COLORS.skyBlue;
  const roleLabel = isAdmin ? "ADMIN" : isTutor ? "TUTOR" : "STUDENT";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const whatsNext = isAdmin
    ? stats.pendingTutors > 0
      ? { icon: "🛡️", text: `${stats.pendingTutors} tutor${stats.pendingTutors > 1 ? "s" : ""} need your verification`, cta: "Review", to: "/admin/tutors", color: COLORS.rose }
      : { icon: "✅", text: "All tutors verified. Great job!", cta: "View Tutors", to: "/tutors", color: COLORS.emerald }
    : isTutor
    ? stats.sessions > 0
      ? { icon: "📅", text: `You have ${stats.sessions} active session${stats.sessions > 1 ? "s" : ""}`, cta: "View Sessions", to: "/tutor-dashboard", color: COLORS.emerald }
      : { icon: "✨", text: "You don't have active sessions", cta: "Share your profile", to: "/tutor-profile", color: COLORS.marigold }
    : stats.bookings === 0
      ? { icon: "🎓", text: "Book your first tutor session", cta: "Find Tutors", to: "/tutors", color: COLORS.marigold }
      : { icon: "📅", text: `You have ${stats.bookings} booking${stats.bookings > 1 ? "s" : ""}`, cta: "View Bookings", to: "/my-bookings", color: COLORS.skyBlue };

  return (
    <>
      <Navbar />
      <Confetti show={celebrate} />
      <div className="min-h-screen relative overflow-hidden" style={{ background: COLORS.midnightNavy, color: COLORS.white }}>
        <style>{`
          @keyframes pulse-glow { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.85; } }
          @keyframes float-particle { 0%, 100% { transform: translate(0, 0); opacity: 0.3; } 50% { transform: translate(20px, -30px); opacity: 0.6; } }
          @keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
          @keyframes mesh-move { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-20px, 20px) scale(1.1); } }
          @keyframes shine { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
          @keyframes fire-pulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px ${COLORS.rose}); } 50% { transform: scale(1.2); filter: drop-shadow(0 0 12px ${COLORS.rose}); } }
        `}</style>

        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: COLORS.skyBlue, animation: "mesh-move 15s ease-in-out infinite" }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: COLORS.marigold, animation: "mesh-move 18s ease-in-out infinite reverse" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: COLORS.violet, animation: "mesh-move 20s ease-in-out infinite", opacity: 0.5 }} />
        </div>

        <CursorGlow />
        <Particles />

        <div className="relative max-w-5xl mx-auto px-6 py-12">
          {/* HERO */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full" style={{ background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40`, boxShadow: `0 0 24px ${roleColor}40` }}>{roleLabel}</span>
              <span className="text-xs" style={{ color: COLORS.whiteDim }}>{dateStr}</span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full" style={{ background: `linear-gradient(135deg, ${COLORS.violet}20, ${COLORS.marigold}20)`, color: COLORS.white, border: `1px solid ${COLORS.violet}40` }}>⚡ LEVEL {level}</span>
              <span className="text-lg">{getTimeIcon()}</span>
              {/* ✅ Motivational badge */}
              <span className="px-3 py-1 text-[11px] font-bold rounded-full" style={{ background: `${COLORS.rose}20`, color: COLORS.rose, border: `1px solid ${COLORS.rose}40` }}>
                <span style={{ animation: "fire-pulse 1.5s ease-in-out infinite", display: "inline-block" }}>🔥</span> You're on fire!
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-3">
              Welcome back,{" "}
              <span style={{ background: `linear-gradient(135deg, ${roleColor}, ${COLORS.white}, ${roleColor})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shine 4s linear infinite" }}>{firstName}</span>.
            </h1>
            <p className="text-base md:text-lg mb-5" style={{ color: COLORS.whiteMuted }}>
              {isAdmin ? "Manage the platform and verify tutors." : isTutor ? "Your sessions are waiting. Let's go." : "Ready to learn something new today?"}
            </p>

            <div className="mb-5 max-w-md">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: COLORS.whiteDim }}>
                <span>XP: {xp} / {level * 500}</span>
                <span>{Math.round(levelProgress * 100)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${levelProgress * 100}%`, background: `linear-gradient(90deg, ${COLORS.violet}, ${COLORS.marigold})`, boxShadow: `0 0 12px ${COLORS.violet}` }} />
              </div>
            </div>

            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl flex-wrap" style={{ background: `linear-gradient(135deg, ${whatsNext.color}15, transparent)`, border: `1px solid ${whatsNext.color}40`, boxShadow: `0 8px 24px -8px ${whatsNext.color}40` }}>
              <span className="text-2xl">{whatsNext.icon}</span>
              <span className="text-sm font-medium" style={{ color: COLORS.white }}>{whatsNext.text}</span>
              <Link to={whatsNext.to} className="px-4 py-1.5 rounded-lg text-xs font-bold transition hover:scale-105" style={{ background: whatsNext.color, color: COLORS.midnightNavy }}>{whatsNext.cta} →</Link>
            </div>
          </div>

          {/* FOCUS + STREAK */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.midnightNavyLight}, ${COLORS.midnightNavy})`, border: `1px solid ${COLORS.skyBlue}30` }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: COLORS.skyBlue }} />
              <div className="relative flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 flex-shrink-0" style={{ animation: focus.running ? "pulse-glow 2s ease-in-out infinite" : "none" }}>
                    <svg className="transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" stroke={`${COLORS.whiteDim}30`} strokeWidth="6" fill="none" />
                      <circle cx="50" cy="50" r="44" stroke={focus.running ? COLORS.emeraldBright : COLORS.skyBlueBright} strokeWidth="6" fill="none" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - focus.progress)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease", filter: `drop-shadow(0 0 8px ${focus.running ? COLORS.emeraldBright : COLORS.skyBlueBright})` }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold font-mono" style={{ color: COLORS.white }}>{focus.display}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.skyBlueBright }}>Focus Session</div>
                    <div className="text-lg font-bold" style={{ color: COLORS.white }}>{focus.running ? "Stay focused 🎯" : "Ready to focus?"}</div>
                    <div className="text-xs" style={{ color: COLORS.whiteMuted }}>25-min Pomodoro · Deep work</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={focus.toggle} className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105" style={{ background: focus.running ? COLORS.rose : COLORS.skyBlue, color: COLORS.white, boxShadow: `0 8px 24px -8px ${focus.running ? COLORS.rose : COLORS.skyBlue}80` }}>
                    {focus.running ? "Pause" : "Start Focus"}
                  </button>
                  <button onClick={focus.reset} className="px-4 py-2.5 rounded-lg font-semibold text-sm transition" style={{ background: COLORS.midnightNavy, color: COLORS.whiteMuted, border: `1px solid ${COLORS.midnightNavyBorder}` }}>Reset</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.marigold }}>🔥 Streak</div>
                <div className="text-lg font-bold" style={{ color: COLORS.marigold }}>{streakCount}/7</div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition" style={{ background: streak[i] ? COLORS.marigold : COLORS.midnightNavy, color: streak[i] ? COLORS.midnightNavy : COLORS.whiteDim, border: `1px solid ${streak[i] ? COLORS.marigold : COLORS.midnightNavyBorder}`, boxShadow: streak[i] ? `0 0 12px ${COLORS.marigold}60` : "none" }}>{d}</div>
                ))}
              </div>
              <div className="text-xs" style={{ color: COLORS.whiteMuted }}>{streakCount === 7 ? "Perfect week! 🏆" : `${7 - streakCount} more for perfect week`}</div>
            </div>
          </div>

          {/* ✅ AI STUDY BUDDY + DAILY CHALLENGE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* AI Study Buddy */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.violet}15, ${COLORS.midnightNavyLight})`, border: `1px solid ${COLORS.violet}40` }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: COLORS.violet }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.violet }}>AI Study Buddy</div>
                </div>
                <p className="text-sm mb-3" style={{ color: COLORS.whiteMuted }}>
                  "Hey {firstName}! Ready to learn something new today? Ask me anything."
                </p>
                <Link to="/tutors" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition hover:scale-105" style={{ background: COLORS.violet, color: COLORS.white }}>
                  Chat with AI →
                </Link>
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.marigold}15, ${COLORS.midnightNavyLight})`, border: `1px solid ${COLORS.marigold}40` }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: COLORS.marigold }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🎯</span>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.marigold }}>Daily Challenge</div>
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.white }}>
                  {dailyChallenge}
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition hover:scale-105" style={{ background: COLORS.marigold, color: COLORS.midnightNavy }}>
                  Mark Complete ✓
                </button>
              </div>
            </div>
          </div>

          {/* QUOTE */}
          <div className="mb-8 flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: `${COLORS.marigold}10`, border: `1px solid ${COLORS.marigold}30` }}>
            <span className="text-xl">💡</span>
            <span className="text-sm italic" style={{ color: COLORS.marigold }}>"{quote}"</span>
          </div>

          {/* WEEKLY ACTIVITY */}
          <div className="rounded-2xl p-5 mb-8" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.skyBlueBright }}>Weekly Activity</div>
              </div>
              <div className="text-xs" style={{ color: COLORS.whiteDim }}>Last 7 days</div>
            </div>
            <Sparkline data={weeklyActivity} color={COLORS.skyBlue} />
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: COLORS.whiteDim }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
            </div>
          </div>

          {/* STATS RINGS */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <ProgressRing icon="📚" label="Groups" value={stats.groups} max={10} color={COLORS.skyBlue} />
            {!isAdmin && <ProgressRing icon="📅" label="Bookings" value={stats.bookings} max={10} color={COLORS.marigold} />}
            {!isAdmin && <ProgressRing icon="🎥" label="Sessions" value={stats.sessions} max={10} color={COLORS.emerald} />}
            {isAdmin && <ProgressRing icon="⏳" label="Pending Tutors" value={stats.pendingTutors} max={10} color={COLORS.amber} />}
          </div>

          {/* ✅ FRIENDS + RECENT FILES + TIMELINE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Friends Online */}
            <div className="rounded-2xl p-5" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🟢</span>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.emerald }}>Friends Online</div>
                </div>
                <div className="text-xs" style={{ color: COLORS.whiteDim }}>{FRIENDS_ONLINE.length} online</div>
              </div>
              <div className="space-y-2">
                {FRIENDS_ONLINE.map((f) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: f.color, color: COLORS.midnightNavy }}>{f.initial}</div>
                    <span className="text-sm" style={{ color: COLORS.white }}>{f.name}</span>
                    <span className="ml-auto text-xs" style={{ color: COLORS.emerald }}>● online</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Files */}
            <div className="rounded-2xl p-5" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📁</span>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.skyBlueBright }}>Recent Files</div>
                </div>
              </div>
              <div className="space-y-2">
                {RECENT_FILES.map((f) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: COLORS.white }}>{f.name}</div>
                      <div className="text-xs" style={{ color: COLORS.whiteDim }}>{f.size} · {f.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Timeline + Quick Note */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Timeline */}
            <div className="rounded-2xl p-5" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📈</span>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.marigold }}>Progress Timeline</div>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: COLORS.midnightNavyBorder }} />
                <div className="space-y-3">
                  {TIMELINE.map((t) => (
                    <div key={t.title} className="flex items-center gap-3 relative">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm z-10" style={{ background: t.done ? t.color : COLORS.midnightNavy, color: t.done ? COLORS.midnightNavy : COLORS.whiteDim, border: `2px solid ${t.done ? t.color : COLORS.midnightNavyBorder}` }}>{t.icon}</div>
                      <span className="text-sm" style={{ color: t.done ? COLORS.white : COLORS.whiteDim }}>{t.title}</span>
                      {t.done && <span className="ml-auto text-xs" style={{ color: t.color }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Note */}
            <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${COLORS.amber}10, ${COLORS.midnightNavyLight})`, border: `1px solid ${COLORS.amber}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.amber }}>Quick Note</div>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a quick note..."
                rows={6}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: COLORS.midnightNavy, border: `1px solid ${COLORS.midnightNavyBorder}`, color: COLORS.white }}
              />
            </div>
          </div>

          {/* ACHIEVEMENTS */}
          <div className="rounded-2xl p-5 mb-8" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.marigold }}>Achievements</div>
              </div>
              <div className="text-xs" style={{ color: COLORS.whiteDim }}>{ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.label} className="rounded-xl p-3 text-center transition hover:-translate-y-1" style={{ background: a.unlocked ? `${a.color}15` : COLORS.midnightNavy, border: `1px solid ${a.unlocked ? a.color + "40" : COLORS.midnightNavyBorder}`, opacity: a.unlocked ? 1 : 0.4, boxShadow: a.unlocked ? `0 4px 12px ${a.color}20` : "none" }} title={a.label}>
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: a.unlocked ? a.color : COLORS.whiteDim }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.whiteMuted }}>⚡ Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickAction to="/groups" icon="📚" label="My Groups" desc={`${stats.groups} active`} color={COLORS.skyBlue} />
              {isAdmin ? (
                <QuickAction to="/admin/tutors" icon="🛡️" label="Admin Panel" desc={`${stats.pendingTutors} pending`} color={COLORS.rose} />
              ) : isTutor ? (
                <QuickAction to="/tutor-dashboard" icon="📅" label="My Sessions" desc={`${stats.sessions} active`} color={COLORS.emerald} />
              ) : (
                <QuickAction to="/tutors" icon="🎓" label="Find Tutors" desc="Book a session" color={COLORS.marigold} />
              )}
              <QuickAction to={isAdmin ? "/admin/tutors" : isTutor ? "/tutor-dashboard" : "/my-bookings"} icon="📋" label={isAdmin ? "All Tutors" : isTutor ? "Bookings" : "My Bookings"} desc="View all" color={COLORS.violet} />
            </div>
          </div>

          {/* ADMIN WARNING */}
          {isAdmin && stats.pendingTutors > 0 && (
            <div className="rounded-2xl p-5 flex items-center gap-4 flex-wrap" style={{ background: `linear-gradient(135deg, ${COLORS.amber}15, ${COLORS.rose}10)`, border: `1px solid ${COLORS.amber}40` }}>
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <p className="font-bold" style={{ color: COLORS.amber }}>{stats.pendingTutors} tutor{stats.pendingTutors > 1 ? "s" : ""} awaiting verification</p>
                <p className="text-sm" style={{ color: COLORS.whiteMuted }}>Review profiles to approve them</p>
              </div>
              <Link to="/admin/tutors" className="px-5 py-2.5 rounded-lg text-sm font-bold transition hover:scale-105" style={{ background: COLORS.amber, color: COLORS.midnightNavy }}>Review →</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function QuickAction({ to, icon, label, desc, color }) {
  return (
    <Link to={to} className="group rounded-2xl p-4 flex items-center gap-3 transition hover:-translate-y-1 relative overflow-hidden" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" style={{ background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div className="relative w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition group-hover:scale-110" style={{ background: `${color}20`, boxShadow: `0 0 20px ${color}30` }}>{icon}</div>
      <div className="relative flex-1 min-w-0">
        <div className="font-bold text-sm" style={{ color: COLORS.white }}>{label}</div>
        <div className="text-xs" style={{ color: COLORS.whiteDim }}>{desc}</div>
      </div>
      <span className="relative text-lg transition group-hover:translate-x-1" style={{ color }}>→</span>
    </Link>
  );
}