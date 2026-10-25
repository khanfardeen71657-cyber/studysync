// client/src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// ═══════════════════════════════════════════════════════════════
const COLORS = {
  midnightNavy: "#0A1128",
  midnightNavyLight: "#111936",
  midnightNavyBorder: "#232E52",
  marigold: "#E8A33D",
  skyBlue: "#0EA5E9",
  skyBlueBright: "#38BDF8",
  emerald: "#10B981",
  rose: "#F43F5E",
  violet: "#A855F7",
  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

// ═══════════════════════════════════════════════════════════════
// LIVE CLOCK
// ═══════════════════════════════════════════════════════════════
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs font-mono font-bold hidden lg:block" style={{ color: COLORS.skyBlueBright }}>
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION BELL
// ═══════════════════════════════════════════════════════════════
function NotificationBell({ count = 3 }) {
  return (
    <button
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-105"
      style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}
      title="Notifications"
    >
      <span className="text-base">🔔</span>
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
          style={{ background: COLORS.rose, color: COLORS.white, boxShadow: `0 0 8px ${COLORS.rose}` }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROFILE DROPDOWN
// ═══════════════════════════════════════════════════════════════
function ProfileDropdown({ user, roleColor, roleLabel, onLogout, navigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { icon: "📊", label: "Dashboard", to: "/dashboard" },
    ...(user.role === "tutor"
      ? [{ icon: "👨‍🏫", label: "My Profile", to: "/tutor-profile" }]
      : []),
    ...(user.role === "admin"
      ? [{ icon: "🛡️", label: "Admin Panel", to: "/admin/tutors" }]
      : []),
    ...(user.role !== "tutor" && user.role !== "admin"
      ? [{ icon: "📋", label: "My Bookings", to: "/my-bookings" }]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition"
        style={{
          background: COLORS.midnightNavyLight,
          border: `1px solid ${open ? roleColor : COLORS.midnightNavyBorder}`,
          boxShadow: open ? `0 0 16px ${roleColor}40` : "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)`,
            color: COLORS.midnightNavy,
            boxShadow: `0 0 12px ${roleColor}60`,
          }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div className="min-w-0 hidden md:block">
          <div className="text-xs font-bold truncate max-w-[100px]" style={{ color: COLORS.white }}>
            {user?.name || "User"}
          </div>
          <div className="text-[9px] font-bold tracking-wider" style={{ color: roleColor }}>
            {roleLabel}
          </div>
        </div>
        <span className="text-xs" style={{ color: COLORS.whiteDim }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: COLORS.midnightNavyLight,
            border: `1px solid ${COLORS.midnightNavyBorder}`,
            animation: "slide-down 0.2s ease-out",
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.midnightNavyBorder }}>
            <div className="text-sm font-bold truncate" style={{ color: COLORS.white }}>{user.name}</div>
            <div className="text-xs truncate" style={{ color: COLORS.whiteDim }}>{user.email}</div>
          </div>

          <div className="py-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition"
                style={{ color: COLORS.whiteMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.midnightNavy;
                  e.currentTarget.style.color = COLORS.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = COLORS.whiteMuted;
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="py-1 border-t" style={{ borderColor: COLORS.midnightNavyBorder }}>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left"
              style={{ color: COLORS.rose }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.rose}15`}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN NAVBAR
// ═══════════════════════════════════════════════════════════════
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);

  const isTutor = user?.role === "tutor";
  const isAdmin = user?.role === "admin";

  const roleColor = isAdmin ? COLORS.rose : isTutor ? COLORS.marigold : COLORS.skyBlue;
  const roleLabel = isAdmin ? "ADMIN" : isTutor ? "TUTOR" : "STUDENT";

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/tutors?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setSearchOpen(false);
    }
  };

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-sm font-semibold transition ${
      isActive ? "text-white" : "text-slate-300 hover:text-white"
    }`;

  const navLinkStyle = (activeColor) => ({ isActive }) =>
    isActive
      ? { background: `${activeColor}20`, color: activeColor }
      : {};

  return (
    <nav
      className="sticky top-0 z-40 transition-all duration-300 relative"
      style={{
        background: scrolled ? `${COLORS.midnightNavy}E6` : COLORS.midnightNavy,
        backdropFilter: scrolled ? "blur(20px)" : "blur(12px)",
        borderBottom: `1px solid ${scrolled ? COLORS.midnightNavyBorder : "transparent"}`,
      }}
    >
      {/* ✅ Gradient bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${COLORS.skyBlue}, ${COLORS.violet}, ${COLORS.marigold}, transparent)`,
          opacity: scrolled ? 1 : 0.3,
          transition: "opacity 0.3s",
        }}
      />

      <style>{`
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 20px ${COLORS.skyBlue}40; transform: scale(1); }
          50% { box-shadow: 0 0 30px ${COLORS.skyBlue}80; transform: scale(1.05); }
        }
        @keyframes logo-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* LOGO + HOME */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              onClick={() => setMobileOpen(false)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative overflow-hidden transition group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.skyBlue}, ${COLORS.violet})`,
                  animation: "logo-pulse 3s ease-in-out infinite",
                }}
              >
                📚
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:block">
                <span style={{
                  background: `linear-gradient(90deg, ${COLORS.white}, ${COLORS.skyBlueBright}, ${COLORS.white})`,
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "logo-shine 4s linear infinite",
                }}>Study</span>
                <span style={{ color: COLORS.skyBlue }}>Sync</span>
              </span>
            </Link>
            {user && (
              <Link
                to="/"
                className="hidden md:flex ml-2 px-3 py-1.5 text-sm font-medium rounded-lg transition"
                style={{ color: COLORS.whiteMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.white; e.currentTarget.style.background = COLORS.midnightNavyLight; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.whiteMuted; e.currentTarget.style.background = "transparent"; }}
              >
                🏠 Home
              </Link>
            )}
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {user ? (
              <>
                <NavLink to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.skyBlue)}>Dashboard</NavLink>
                <NavLink to="/groups" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.skyBlue)}>Groups</NavLink>
                <NavLink to="/tutors" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.skyBlue)}>Tutors</NavLink>
                {isTutor && (
                  <>
                    <NavLink to="/tutor-profile" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.marigold)}>My Profile</NavLink>
                    <NavLink to="/tutor-dashboard" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.marigold)}>Bookings</NavLink>
                  </>
                )}
                {isAdmin && (
                  <NavLink to="/admin/tutors" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.rose)}>🛡️ Admin</NavLink>
                )}
                {!isTutor && !isAdmin && (
                  <NavLink to="/my-bookings" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white" style={navLinkStyle(COLORS.skyBlue)}>My Bookings</NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/tutors" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white">Tutors</NavLink>
                <NavLink to="/login" className="px-3 py-2 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white">Login</NavLink>
              </>
            )}
          </div>

          {/* RIGHT AREA */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {user && (
              <>
                <LiveClock />
                <button
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-105"
                  style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}
                  title="Search (Cmd+K)"
                >
                  🔍
                </button>
                <NotificationBell count={3} />
                <ProfileDropdown
                  user={user}
                  roleColor={roleColor}
                  roleLabel={roleLabel}
                  onLogout={handleLogout}
                  navigate={navigate}
                />
              </>
            )}
            {!user && (
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-lg text-sm font-bold transition hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.skyBlue}, ${COLORS.violet})`,
                  color: COLORS.white,
                  boxShadow: `0 8px 24px -8px ${COLORS.skyBlue}80`,
                }}
              >
                Get Started →
              </Link>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
              color: COLORS.white,
            }}
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      {searchOpen && (
        <div
          className="absolute top-full left-0 right-0 px-4 py-3"
          style={{ background: COLORS.midnightNavy, borderBottom: `1px solid ${COLORS.midnightNavyBorder}`, animation: "slide-down 0.2s ease-out" }}
        >
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutors, groups, quizzes... (Press Enter)"
              className="w-full px-5 py-3 pr-24 rounded-xl text-sm outline-none"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.skyBlue}40`,
                color: COLORS.white,
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: COLORS.midnightNavy, color: COLORS.whiteDim, border: `1px solid ${COLORS.midnightNavyBorder}` }}>ESC</span>
            </div>
          </form>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto"
          style={{ background: COLORS.midnightNavy, borderColor: COLORS.midnightNavyBorder, animation: "slide-down 0.3s ease-out" }}
        >
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 mb-2 rounded-xl" style={{ background: COLORS.midnightNavyLight, border: `1px solid ${COLORS.midnightNavyBorder}` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold overflow-hidden" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}CC)`, color: COLORS.midnightNavy }}>
                  {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: COLORS.white }}>{user?.name}</div>
                  <div className="text-xs" style={{ color: roleColor }}>{roleLabel}</div>
                </div>
                <NotificationBell count={3} />
              </div>

              <NavLink to="/" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.skyBlue}20`, color: COLORS.skyBlueBright } : {}}>🏠 Home</NavLink>
              <NavLink to="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.skyBlue}20`, color: COLORS.skyBlueBright } : {}}>📊 Dashboard</NavLink>
              <NavLink to="/groups" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.skyBlue}20`, color: COLORS.skyBlueBright } : {}}>📚 Groups</NavLink>
              <NavLink to="/tutors" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.skyBlue}20`, color: COLORS.skyBlueBright } : {}}>🎓 Tutors</NavLink>

              {isTutor && (
                <>
                  <NavLink to="/tutor-profile" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.marigold}20`, color: COLORS.marigold } : {}}>👨‍🏫 My Profile</NavLink>
                  <NavLink to="/tutor-dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.marigold}20`, color: COLORS.marigold } : {}}>📅 Bookings</NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink to="/admin/tutors" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.rose}20`, color: COLORS.rose } : {}}>🛡️ Admin</NavLink>
              )}
              {!isTutor && !isAdmin && (
                <NavLink to="/my-bookings" className={mobileLinkClass} onClick={() => setMobileOpen(false)} style={({ isActive }) => isActive ? { background: `${COLORS.skyBlue}20`, color: COLORS.skyBlueBright } : {}}>📋 My Bookings</NavLink>
              )}

              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm font-bold text-left"
                style={{ background: `${COLORS.rose}15`, color: COLORS.rose, border: `1px solid ${COLORS.rose}40` }}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/tutors" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>🎓 Tutors</NavLink>
              <NavLink to="/login" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Login</NavLink>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block mt-2 px-4 py-3 rounded-xl text-sm font-bold text-center" style={{ background: `linear-gradient(135deg, ${COLORS.skyBlue}, ${COLORS.violet})`, color: COLORS.white }}>
                Get Started →
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}