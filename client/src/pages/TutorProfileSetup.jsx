// client/src/pages/TutorProfileSetup.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Loader from "../components/common/Loader.jsx";
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
  rose: "#F43F5E",

  white: "#FFFFFF",
  whiteMuted: "#A8B2CC",
  whiteDim: "#6B7699",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const emptySlot = () => ({ startTime: "09:00", endTime: "17:00" });

const STEPS = [
  { id: 1, label: "Basics", icon: "👤", desc: "Subjects, rate, bio" },
  { id: 2, label: "Availability", icon: "🗓️", desc: "Days & slots" },
  { id: 3, label: "Review", icon: "✓", desc: "Confirm details" },
];

export default function TutorProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditRoute = location.pathname.includes("/edit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [availability, setAvailability] = useState([]);

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await tutorService.getMyTutorProfile();
        const t = res?.data?.data?.tutor || res?.data?.tutor || null;
        if (cancelled) return;

        if (t) {
          setIsUpdate(true);
          setSubjects((t.subjects || []).join(", "));
          setHourlyRate(String(t.hourlyRate ?? ""));
          setBio(t.bio || "");
          setExperience(String(t.experience ?? ""));
          setLanguages((t.languages || []).join(", "));
          setCurrency(t.currency || "USD");
          setAvailability(
            Array.isArray(t.availability) && t.availability.length
              ? t.availability
              : []
          );
        }
      } catch (err) {
        const msg = String(err?.message || "");
        if (!msg.toLowerCase().includes("not found")) {
          console.warn("Load tutor profile:", msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Parsed values for review
  const parsedSubjects = useMemo(
    () => subjects.split(",").map((s) => s.trim()).filter(Boolean),
    [subjects]
  );
  const parsedLanguages = useMemo(
    () => languages.split(",").map((s) => s.trim()).filter(Boolean),
    [languages]
  );
  const rateNum = Number(hourlyRate) || 0;
  const symbol =
    currency === "INR" ? "₹" :
    currency === "EUR" ? "€" :
    currency === "GBP" ? "£" : "$";

  // Availability helpers
  const toggleDay = (day) => {
    setAvailability((prev) => {
      const exists = prev.find((a) => a.day === day);
      if (exists) return prev.filter((a) => a.day !== day);
      return [...prev, { day, slots: [emptySlot()] }];
    });
  };

  const updateSlot = (day, idx, field, value) => {
    setAvailability((prev) =>
      prev.map((a) => {
        if (a.day !== day) return a;
        const slots = [...a.slots];
        slots[idx] = { ...slots[idx], [field]: value };
        return { ...a, slots };
      })
    );
  };

  const addSlot = (day) => {
    setAvailability((prev) =>
      prev.map((a) =>
        a.day === day ? { ...a, slots: [...a.slots, emptySlot()] } : a
      )
    );
  };

  const removeSlot = (day, idx) => {
    setAvailability((prev) =>
      prev.map((a) => {
        if (a.day !== day) return a;
        const slots = a.slots.filter((_, i) => i !== idx);
        return { ...a, slots: slots.length ? slots : [emptySlot()] };
      })
    );
  };

  // Step validation
  const canGoNext = () => {
    if (step === 1) {
      if (parsedSubjects.length === 0) {
        setError("Please enter at least one subject.");
        return false;
      }
      if (!hourlyRate || rateNum < 0) {
        setError("Please enter a valid hourly rate.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const nextStep = () => {
    if (!canGoNext()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  // Submit
  const handleSubmit = async () => {
    setError("");
    const rateCheck = Number(hourlyRate);
    if (!hourlyRate || Number.isNaN(rateCheck) || rateCheck < 0) {
      setError("Please enter a valid hourly rate (number ≥ 0).");
      return;
    }
    if (parsedSubjects.length === 0) {
      setError("Please enter at least one subject.");
      return;
    }

    const payload = {
      subjects: parsedSubjects,
      hourlyRate: rateCheck,
      bio: bio.trim(),
      experience: Number(experience) || 0,
      languages: parsedLanguages,
      currency: currency || "USD",
      availability: availability.map((a) => ({
        day: a.day,
        slots: a.slots
          .filter((s) => s.startTime && s.endTime)
          .map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
      })),
    };

    setSaving(true);
    try {
      if (isUpdate) {
        await tutorService.updateTutorProfile(payload);
      } else {
        await tutorService.registerTutor(payload);
      }
      navigate("/tutor-profile");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
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
        {/* Glows */}
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

        <div className="relative max-w-3xl mx-auto px-6 py-10">
          {/* HEADER */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: COLORS.marigold }}
              >
                {isUpdate ? "Update Profile" : "Become a Tutor"}
              </span>
              <span style={{ color: COLORS.whiteDim }}>•</span>
              <span className="text-xs" style={{ color: COLORS.whiteDim }}>
                Step {step} of {STEPS.length}
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: COLORS.white }}
            >
              {isUpdate ? "Update Tutor Profile" : "Create Tutor Profile"}
            </h1>
          </div>

          {/* STEPPER */}
          <div
            className="rounded-2xl p-4 mb-6"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const isDone = step > s.id;
                const isLast = i === STEPS.length - 1;

                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all"
                        style={{
                          background: isDone
                            ? COLORS.emerald
                            : isActive
                            ? COLORS.marigold
                            : COLORS.midnightNavy,
                          color: isActive || isDone ? COLORS.midnightNavy : COLORS.whiteDim,
                          border: `2px solid ${
                            isDone
                              ? COLORS.emerald
                              : isActive
                              ? COLORS.marigold
                              : COLORS.midnightNavyBorder
                          }`,
                          boxShadow: isActive
                            ? `0 0 20px ${COLORS.marigold}60`
                            : "none",
                        }}
                      >
                        {isDone ? "✓" : s.icon}
                      </div>
                      <div className="hidden sm:block">
                        <div
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{
                            color: isActive
                              ? COLORS.marigold
                              : isDone
                              ? COLORS.emerald
                              : COLORS.whiteDim,
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          className="text-[10px]"
                          style={{ color: COLORS.whiteDim }}
                        >
                          {s.desc}
                        </div>
                      </div>
                    </div>
                    {!isLast && (
                      <div
                        className="flex-1 h-0.5 mx-2 rounded transition-all"
                        style={{
                          background: isDone
                            ? COLORS.emerald
                            : COLORS.midnightNavyBorder,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm animate-pulse"
              style={{
                background: `${COLORS.rose}15`,
                border: `1px solid ${COLORS.rose}40`,
                color: COLORS.rose,
              }}
            >
              ❌ {error}
            </div>
          )}

          {/* STEP CONTENT */}
          <div
            className="rounded-2xl p-6 mb-4"
            style={{
              background: COLORS.midnightNavyLight,
              border: `1px solid ${COLORS.midnightNavyBorder}`,
            }}
          >
            {/* ═══════════ STEP 1: BASICS ═══════════ */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label
                    className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: COLORS.skyBlueBright }}
                  >
                    👨‍🏫 Subjects <span style={{ color: COLORS.marigold }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="Math, Physics, Chemistry"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
                    style={inputStyle()}
                    onFocus={(e) => e.target.style.borderColor = COLORS.skyBlue}
                    onBlur={(e) => e.target.style.borderColor = COLORS.midnightNavyBorder}
                  />
                  <p className="text-xs mt-1" style={{ color: COLORS.whiteDim }}>
                    Comma-separated. At least one required.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                      style={{ color: COLORS.skyBlueBright }}
                    >
                      💵 Hourly Rate <span style={{ color: COLORS.marigold }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputStyle()}
                      onFocus={(e) => e.target.style.borderColor = COLORS.skyBlue}
                      onBlur={(e) => e.target.style.borderColor = COLORS.midnightNavyBorder}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                      style={{ color: COLORS.skyBlueBright }}
                    >
                      💱 Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputStyle()}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: COLORS.skyBlueBright }}
                  >
                    📖 Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Tell students about yourself and how you teach..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition resize-none"
                    style={inputStyle()}
                    onFocus={(e) => e.target.style.borderColor = COLORS.skyBlue}
                    onBlur={(e) => e.target.style.borderColor = COLORS.midnightNavyBorder}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                      style={{ color: COLORS.skyBlueBright }}
                    >
                      💼 Experience (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="3"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputStyle()}
                      onFocus={(e) => e.target.style.borderColor = COLORS.skyBlue}
                      onBlur={(e) => e.target.style.borderColor = COLORS.midnightNavyBorder}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1.5 uppercase tracking-wider"
                      style={{ color: COLORS.skyBlueBright }}
                    >
                      🗣️ Languages
                    </label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      placeholder="English, Hindi"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputStyle()}
                      onFocus={(e) => e.target.style.borderColor = COLORS.skyBlue}
                      onBlur={(e) => e.target.style.borderColor = COLORS.midnightNavyBorder}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 2: AVAILABILITY ═══════════ */}
            {step === 2 && (
              <div>
                <label
                  className="block text-sm font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: COLORS.skyBlueBright }}
                >
                  🗓️ Pick Days & Time Slots
                </label>

                {/* Day pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {DAYS.map((d) => {
                    const active = availability.some((a) => a.day === d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className="w-14 h-14 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105"
                        style={{
                          background: active ? COLORS.marigold : COLORS.midnightNavy,
                          color: active ? COLORS.midnightNavy : COLORS.whiteMuted,
                          border: `2px solid ${active ? COLORS.marigold : COLORS.midnightNavyBorder}`,
                          boxShadow: active ? `0 8px 20px -4px ${COLORS.marigold}60` : "none",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                {availability.length === 0 && (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{
                      background: COLORS.midnightNavyLighter,
                      border: `1px dashed ${COLORS.midnightNavyBorder}`,
                    }}
                  >
                    <div className="text-4xl mb-2">🗓️</div>
                    <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
                      Select days above to set your availability
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {availability.map((a) => (
                    <div
                      key={a.day}
                      className="rounded-xl p-4"
                      style={{
                        background: COLORS.midnightNavyLighter,
                        border: `1px solid ${COLORS.midnightNavyBorder}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-sm font-bold uppercase tracking-wider"
                          style={{ color: COLORS.marigold }}
                        >
                          {a.day}
                        </span>
                        <button
                          type="button"
                          onClick={() => addSlot(a.day)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition hover:scale-105"
                          style={{
                            background: `${COLORS.skyBlue}20`,
                            color: COLORS.skyBlueBright,
                            border: `1px solid ${COLORS.skyBlue}40`,
                          }}
                        >
                          + Add slot
                        </button>
                      </div>
                      <div className="space-y-2">
                        {a.slots.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <input
                              type="time"
                              value={s.startTime}
                              onChange={(e) => updateSlot(a.day, idx, "startTime", e.target.value)}
                              className="px-2 py-1.5 rounded-lg text-sm outline-none"
                              style={inputStyle()}
                            />
                            <span className="text-xs" style={{ color: COLORS.whiteDim }}>to</span>
                            <input
                              type="time"
                              value={s.endTime}
                              onChange={(e) => updateSlot(a.day, idx, "endTime", e.target.value)}
                              className="px-2 py-1.5 rounded-lg text-sm outline-none"
                              style={inputStyle()}
                            />
                            {a.slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSlot(a.day, idx)}
                                className="text-xs px-2 py-1.5 rounded-lg font-semibold ml-auto"
                                style={{
                                  background: `${COLORS.rose}15`,
                                  color: COLORS.rose,
                                  border: `1px solid ${COLORS.rose}40`,
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════ STEP 3: REVIEW ═══════════ */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎉</span>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: COLORS.white }}
                  >
                    Review Your Profile
                  </h2>
                </div>

                {/* Preview card */}
                <div
                  className="rounded-2xl p-5 mb-4"
                  style={{
                    background: COLORS.midnightNavy,
                    border: `1px solid ${COLORS.skyBlue}40`,
                  }}
                >
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: COLORS.white }}
                      >
                        Your Tutor Profile
                      </h3>
                      <p className="text-xs" style={{ color: COLORS.whiteDim }}>
                        This is how students will see you
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: COLORS.whiteDim }}>
                        Rate
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{ color: COLORS.marigold }}
                      >
                        {symbol}{rateNum}
                        <span className="text-sm" style={{ color: COLORS.whiteMuted }}>/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  {parsedSubjects.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: COLORS.whiteDim }}>
                        Subjects
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedSubjects.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg"
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

                  {/* Languages */}
                  {parsedLanguages.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: COLORS.whiteDim }}>
                        Languages
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsedLanguages.map((l, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg"
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

                  {/* Bio */}
                  {bio.trim() && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: COLORS.whiteDim }}>
                        Bio
                      </div>
                      <p className="text-sm" style={{ color: COLORS.whiteMuted }}>
                        {bio.trim()}
                      </p>
                    </div>
                  )}

                  {/* Availability preview */}
                  {availability.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: COLORS.whiteDim }}>
                        Availability
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availability.map((a) => (
                          <span
                            key={a.day}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg"
                            style={{
                              background: COLORS.midnightNavyLighter,
                              color: COLORS.whiteMuted,
                              border: `1px solid ${COLORS.midnightNavyBorder}`,
                            }}
                          >
                            {a.day}: {(a.slots || []).map((s) => `${s.startTime}-${s.endTime}`).join(", ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    background: `${COLORS.emerald}10`,
                    border: `1px solid ${COLORS.emerald}40`,
                  }}
                >
                  <span className="text-xl">✓</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: COLORS.emerald }}>
                      Ready to go!
                    </div>
                    <div className="text-xs" style={{ color: COLORS.whiteMuted }}>
                      Click "{isUpdate ? "Update Profile" : "Create Profile"}" to save
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm transition"
                style={{
                  background: COLORS.midnightNavyLighter,
                  color: COLORS.whiteMuted,
                  border: `1px solid ${COLORS.midnightNavyBorder}`,
                }}
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105"
                style={{
                  background: COLORS.marigold,
                  color: COLORS.midnightNavy,
                  boxShadow: `0 8px 24px -8px ${COLORS.marigold}80`,
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition hover:scale-105 disabled:opacity-50"
                style={{
                  background: COLORS.emerald,
                  color: COLORS.white,
                  boxShadow: `0 8px 24px -8px ${COLORS.emerald}80`,
                }}
              >
                {saving
                  ? "Saving..."
                  : isUpdate
                  ? "✓ Update Profile"
                  : "✓ Create Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
function inputStyle() {
  return {
    background: COLORS.midnightNavy,
    border: `1px solid ${COLORS.midnightNavyBorder}`,
    color: COLORS.white,
  };
}