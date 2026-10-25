// client/src/pages/TutorProfile.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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

export default function TutorProfile() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Photo upload state
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Fetch tutor profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await tutorService.getMyTutorProfile();
        const t = res?.data?.data?.tutor || res?.data?.tutor || null;
        if (!cancelled) {
          if (!t) setError("Tutor profile not found. Create one first.");
          else {
            setTutor(t);
            setAvatarPreview(t?.avatar || t?.user?.avatar || "");
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ✅ Photo select handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB");
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await tutorService.uploadAvatar(formData);
      const updatedTutor =
        res?.data?.data?.tutor || res?.data?.tutor || null;

      if (updatedTutor) {
        setTutor(updatedTutor);
        setAvatarPreview(updatedTutor?.avatar || "");
        await refreshUser?.();
      }
    } catch (err) {
      setUploadError(err.message || "Upload failed");
      setAvatarPreview(tutor?.avatar || "");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (error || !tutor) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          style={{ background: COLORS.midnightNavy, color: COLORS.white }}
        >
          <p style={{ color: COLORS.marigold }}>{error || "Tutor profile not found."}</p>
          <button
            onClick={() => navigate("/become-tutor")}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: COLORS.skyBlue, color: COLORS.white }}
          >
            Create Tutor Profile
          </button>
        </div>
      </>
    );
  }

  const name = tutor?.user?.name || "Tutor";
  const email = tutor?.user?.email || "";
  const subjects = Array.isArray(tutor?.subjects) ? tutor.subjects : [];
  const languages = Array.isArray(tutor?.languages) ? tutor.languages : [];
  const availability = Array.isArray(tutor?.availability) ? tutor.availability : [];
  const rate = Number(tutor?.hourlyRate ?? 0);
  const currency = tutor?.currency || "USD";
  const symbol =
    currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

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
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: COLORS.marigold }}
              >
                My Profile
              </p>
              <h1
                className="text-2xl md:text-3xl font-bold tracking-tight"
                style={{ color: COLORS.white }}
              >
                Tutor Profile
              </h1>
            </div>
            <button
              onClick={() => navigate("/tutor-profile/edit")}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
              style={{
                background: COLORS.skyBlue,
                color: COLORS.white,
                boxShadow: `0 8px 24px -8px ${COLORS.skyBlue}80`,
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* HERO CARD — photo upload */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div
            className="rounded-2xl p-6 md:p-8 mb-6"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            <div className="flex items-start gap-5 flex-wrap">
              {/* Photo with upload */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold"
                  style={{
                    background: `${COLORS.marigold}20`,
                    border: `2px solid ${COLORS.marigold}40`,
                    color: COLORS.marigold,
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    name[0]?.toUpperCase() || "T"
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition hover:scale-110 disabled:opacity-50"
                  style={{
                    background: COLORS.skyBlue,
                    color: COLORS.white,
                    border: `2px solid ${COLORS.midnightNavyLight}`,
                    boxShadow: `0 4px 12px ${COLORS.skyBlue}60`,
                  }}
                  title="Change photo"
                >
                  {uploading ? "..." : "📷"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ color: COLORS.white }}
                >
                  {name}
                  {tutor?.isVerified && (
                    <span
                      className="ml-2 text-xs px-2 py-0.5 rounded font-bold align-middle"
                      style={{
                        background: `${COLORS.skyBlue}20`,
                        color: COLORS.skyBlueBright,
                      }}
                    >
                      ✓ VERIFIED
                    </span>
                  )}
                </h2>
                {email && (
                  <p className="text-sm mb-2" style={{ color: COLORS.whiteMuted }}>
                    {email}
                  </p>
                )}
                <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
                  ⭐ <strong style={{ color: COLORS.white }}>{Number(tutor?.rating ?? 0).toFixed(1)}</strong> · {tutor?.totalSessions || 0} sessions
                </p>

                {uploadError && (
                  <p className="text-xs mt-2" style={{ color: COLORS.marigold }}>
                    ⚠️ {uploadError}
                  </p>
                )}
                {uploading && (
                  <p className="text-xs mt-2" style={{ color: COLORS.skyBlueBright }}>
                    Uploading photo...
                  </p>
                )}
              </div>

              {/* Rate */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.whiteDim }}>
                  Hourly Rate
                </div>
                <div className="text-2xl font-bold" style={{ color: COLORS.marigold }}>
                  {symbol}{rate}
                  <span className="text-sm font-medium" style={{ color: COLORS.whiteMuted }}>/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUBJECTS + LANGUAGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                📚 Subjects
              </h3>
              {subjects.length > 0 ? (
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
              ) : (
                <p className="text-sm" style={{ color: COLORS.whiteDim }}>No subjects added</p>
              )}
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                🗣️ Languages
              </h3>
              {languages.length > 0 ? (
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
              ) : (
                <p className="text-sm" style={{ color: COLORS.whiteDim }}>No languages added</p>
              )}
            </div>
          </div>

          {/* BIO */}
          {tutor?.bio && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: COLORS.skyBlueBright }}
              >
                📖 About Me
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: COLORS.whiteMuted }}>
                {tutor.bio}
              </p>
            </div>
          )}

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MiniStat
              icon="💼"
              label="Experience"
              value={`${tutor?.experience || 0} yrs`}
              accent={COLORS.skyBlue}
            />
            <MiniStat
              icon="🎓"
              label="Sessions"
              value={tutor?.totalSessions || 0}
              accent={COLORS.marigold}
            />
            <MiniStat
              icon="📝"
              label="Reviews"
              value={tutor?.totalReviews || 0}
              accent={COLORS.skyBlue}
            />
          </div>

          {/* AVAILABILITY */}
          {availability.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: COLORS.midnightNavyLight,
                border: `1px solid ${COLORS.midnightNavyBorder}`,
              }}
            >
              <h3
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                🗓️ Availability
              </h3>
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
        </div>
      </div>
    </>
  );
}

function MiniStat({ icon, label, value, accent }) {
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
      <div className="text-xl font-bold mb-1" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: COLORS.whiteDim }}>
        {label}
      </div>
    </div>
  );
}