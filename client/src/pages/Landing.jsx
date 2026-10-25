// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { tutorService } from "../services/tutorService";

// ═══════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  iceSilver: "#E8E8EA",
  iceSilverMuted: "#B8B8C0",
  iceSilverDim: "#8A8A95",
  deepAubergine: "#2D1B2E",
  deepAubergineLight: "#3D2540",
  deepAubergineDark: "#1F1220",
  marigold: "#E8A33D",
  marigoldBright: "#F4B942",
  marigoldDim: "#C88A2E",
};

// ═══════════════════════════════════════════════════════════════
// HERO BACKGROUND IMAGES — rotating every 1 second
// ═══════════════════════════════════════════════════════════════
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1920&q=80&auto=format&fit=crop",
];

const BG_IMAGES = {
  features:
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80&auto=format&fit=crop",
  carousel:
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80&auto=format&fit=crop",
  tutors:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80&auto=format&fit=crop",
  cta:
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1920&q=80&auto=format&fit=crop",
};

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: "👥",
    title: "Study Groups",
    desc: "Create subject-based groups and invite classmates with a single link. Perfect for study sessions, projects, and exam prep.",
    highlight: true,
  },
  {
    icon: "🎨",
    title: "Collaborative Whiteboard",
    desc: "Draw and solve problems together on a shared infinite canvas. Every stroke syncs in real-time across all members.",
    highlight: false,
  },
  {
    icon: "💬",
    title: "Real-time Chat",
    desc: "Stay connected with your group 24/7. Powered by WebSockets with typing indicators and file sharing.",
    highlight: false,
  },
  {
    icon: "✅",
    title: "Quizzes & Leaderboards",
    desc: "Build custom MCQ and flashcard quizzes. Auto-grading, instant feedback, and group-wide leaderboards.",
    highlight: false,
  },
  {
    icon: "📁",
    title: "File Sharing",
    desc: "Upload PDFs, notes, and images to a shared drive. Only group members can access and download.",
    highlight: false,
  },
  {
    icon: "🎓",
    title: "Verified Tutors",
    desc: "Book 1-on-1 sessions with vetted experts. Simple calendar, no double-bookings, secure payments.",
    highlight: false,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your account",
    desc: "Sign up as a student or tutor. It's free and takes less than a minute. No credit card required.",
  },
  {
    num: "02",
    title: "Join or create a group",
    desc: "Find study groups for your subjects, or create your own and invite classmates with a link.",
  },
  {
    num: "03",
    title: "Study together in real-time",
    desc: "Chat, draw on the whiteboard, take quizzes, or book a tutor — all inside the group workspace.",
  },
];

const STATS = [
  { value: "12K+", label: "Active students" },
  { value: "3,500", label: "Study groups" },
  { value: "50K+", label: "Files shared" },
  { value: "99.9%", label: "Uptime" },
];

const TESTIMONIALS = [
  {
    quote:
      "StudySync completely changed how our group studies. The whiteboard is a game-changer for solving problems together.",
    name: "Sara Chen",
    role: "Computer Science, MIT",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80&auto=format&fit=crop",
  },
  {
    quote:
      "I used to study alone and struggle. Now my group meets every evening on StudySync. It's like the library but better.",
    name: "Arjun Patel",
    role: "Mechanical Eng., IIT Delhi",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop",
  },
  {
    quote:
      "The tutor marketplace is brilliant. I found a great math tutor in 5 minutes and book sessions directly in the app.",
    name: "Maya Rodriguez",
    role: "Physics, Stanford",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&q=80&auto=format&fit=crop",
  },
];

const CAROUSEL_SLIDES = [
  {
    label: "Study Groups",
    title: "Your group, one click away",
    desc: "Create a group for any subject, share the invite link, and start collaborating instantly.",
    tags: ["Invite Links", "Member Roles", "Resource Hub"],
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Whiteboard",
    title: "Draw together in real-time",
    desc: "An infinite canvas that syncs every stroke across all connected users.",
    tags: ["HTML5 Canvas", "Socket.io", "Live Sync"],
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Quizzes",
    title: "Test each other, learn faster",
    desc: "Create custom quizzes and flashcards for your group with auto-grading.",
    tags: ["MCQ + Flashcards", "Auto-grading", "Leaderboards"],
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80&auto=format&fit=crop",
  },
  {
    label: "Tutors",
    title: "Learn from the best",
    desc: "Book 1-on-1 sessions with verified tutors from top universities.",
    tags: ["Verified Tutors", "Hourly Booking", "No Double-Booking"],
    img: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80&auto=format&fit=crop",
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Landing() {
  const [slide, setSlide] = useState(0);
  const [tutors, setTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const carouselRef = useRef(null);
  const testimonialsRef = useRef(null);

  // ✅ Rotating hero background — HAR 1 SECOND
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroBgIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance testimonial
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((t) => (t + 1) % TESTIMONIALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Fetch tutors
  useEffect(() => {
    tutorService
      .list({ limit: 3 })
      .then((res) => {
        const list =
          res?.data?.tutors ||
          res?.data?.data?.tutors ||
          res?.data?.data ||
          [];
        setTutors(Array.isArray(list) ? list.slice(0, 3) : []);
      })
      .catch(() => setTutors([]))
      .finally(() => setTutorsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO — rotating background images every 1 second */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-b border-slate-800 overflow-hidden min-h-[600px] flex items-center">
        {/* Rotating background images */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
              style={{
                opacity: idx === heroBgIndex ? 0.3 : 0,
              }}
            />
          ))}
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${COLORS.deepAubergineDark}E6 0%, ${COLORS.deepAubergine}99 50%, ${COLORS.deepAubergineDark}E6 100%)`,
            }}
          />
          {/* Marigold glow */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at top right, ${COLORS.marigold}30, transparent 60%)`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6 backdrop-blur-md"
              style={{
                background: `${COLORS.deepAubergineDark}99`,
                border: `1px solid ${COLORS.marigold}40`,
                color: COLORS.iceSilverMuted,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: COLORS.marigold }}
              />
              Free for students · No credit card required
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              style={{ color: COLORS.iceSilver }}
            >
              Study together.
              <br />
              <span style={{ color: COLORS.marigold }}>Achieve more.</span>
            </h1>

            <p
              className="text-lg md:text-xl leading-relaxed mb-8 max-w-2xl"
              style={{ color: COLORS.iceSilverMuted }}
            >
              StudySync brings the library study group to your screen. Create groups,
              share resources, collaborate in real-time, and learn from expert tutors.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  background: COLORS.marigold,
                  color: COLORS.deepAubergineDark,
                  boxShadow: `0 8px 24px -8px ${COLORS.marigold}80`,
                }}
              >
                Start Learning Free
              </Link>
              <Link
                to="/tutors"
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 backdrop-blur-md"
                style={{
                  border: `1px solid ${COLORS.deepAubergineLight}`,
                  color: COLORS.iceSilver,
                  background: `${COLORS.deepAubergineDark}99`,
                }}
              >
                Browse Tutors →
              </Link>
            </div>

            <p
              className="text-xs mt-8"
              style={{ color: COLORS.iceSilverDim }}
            >
              Trusted by 12,000+ students from top universities worldwide
            </p>

            {/* Dots indicator */}
            <div className="flex gap-2 mt-6">
              {HERO_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroBgIndex(idx)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: idx === heroBgIndex ? "1.5rem" : "0.375rem",
                    background:
                      idx === heroBgIndex
                        ? COLORS.marigold
                        : `${COLORS.iceSilverDim}80`,
                  }}
                  aria-label={`Background image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STATS STRIP */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800 relative">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{ color: COLORS.marigold }}
                >
                  {s.value}
                </div>
                <div
                  className="text-xs uppercase tracking-wider"
                  style={{ color: COLORS.iceSilverDim }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FEATURES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BG_IMAGES.features}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${COLORS.deepAubergineDark}F2 0%, transparent 30%, transparent 70%, ${COLORS.deepAubergineDark}F2 100%)`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: COLORS.marigold }}
            >
              Features
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ color: COLORS.iceSilver }}
            >
              Every tool. One workspace.
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: COLORS.iceSilverMuted }}
            >
              Everything you need to study effectively — designed to feel invisible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 transition-all hover:-translate-y-1 backdrop-blur-sm"
                style={{
                  background: f.highlight
                    ? `${COLORS.deepAubergine}80`
                    : `${COLORS.deepAubergine}60`,
                  border: f.highlight
                    ? `1px solid ${COLORS.marigold}40`
                    : `1px solid ${COLORS.deepAubergineLight}`,
                }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-xl mb-4"
                  style={{
                    background: f.highlight
                      ? `${COLORS.marigold}20`
                      : `${COLORS.deepAubergine}80`,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: COLORS.iceSilver }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: COLORS.iceSilverMuted }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: COLORS.marigold }}
            >
              How it works
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: COLORS.iceSilver }}
            >
              Three steps to better studying
            </h2>
          </div>

          <div className="space-y-8">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-start gap-5">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-mono text-sm font-bold flex-shrink-0"
                  style={{
                    background: `${COLORS.deepAubergine}60`,
                    border: `1px solid ${COLORS.marigold}40`,
                    color: COLORS.marigold,
                  }}
                >
                  {s.num}
                </div>
                <div className="flex-1 pt-2">
                  <h3
                    className="font-semibold mb-1"
                    style={{ color: COLORS.iceSilver }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: COLORS.iceSilverMuted }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CAROUSEL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800 relative overflow-hidden" ref={carouselRef}>
        <div className="absolute inset-0">
          <img
            src={BG_IMAGES.carousel}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${COLORS.deepAubergineDark}F2 0%, transparent 30%, transparent 70%, ${COLORS.deepAubergineDark}F2 100%)`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: COLORS.marigold }}
            >
              Product Tour
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ color: COLORS.iceSilver }}
            >
              See it in action
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: COLORS.iceSilverMuted }}
            >
              Take a quick tour through the platform.
            </p>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl backdrop-blur-md"
            style={{
              border: `1px solid ${COLORS.deepAubergineLight}`,
              background: `${COLORS.deepAubergine}80`,
            }}
          >
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
              {CAROUSEL_SLIDES.map((s) => (
                <div
                  key={s.label}
                  className="min-w-full grid grid-cols-1 md:grid-cols-2 items-center"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to right, transparent, ${COLORS.deepAubergineDark}80)`,
                      }}
                    />
                  </div>
                  <div className="p-8 md:p-12">
                    <span
                      className="inline-block px-2.5 py-1 mb-4 text-[11px] font-semibold rounded"
                      style={{
                        color: COLORS.marigold,
                        background: `${COLORS.marigold}15`,
                        border: `1px solid ${COLORS.marigold}30`,
                      }}
                    >
                      {s.label}
                    </span>
                    <h3
                      className="text-2xl md:text-3xl font-bold mb-3"
                      style={{ color: COLORS.iceSilver }}
                    >
                      {s.title}
                    </h3>
                    <p
                      className="leading-relaxed mb-5"
                      style={{ color: COLORS.iceSilverMuted }}
                    >
                      {s.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-xs font-medium rounded"
                          style={{
                            color: COLORS.iceSilver,
                            background: `${COLORS.deepAubergine}80`,
                            border: `1px solid ${COLORS.deepAubergineLight}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() =>
                setSlide(
                  (s) =>
                    (s - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length
                )
              }
              className="w-10 h-10 rounded-lg flex items-center justify-center transition hover:scale-110"
              style={{
                border: `1px solid ${COLORS.deepAubergineLight}`,
                background: `${COLORS.deepAubergine}60`,
                color: COLORS.iceSilver,
              }}
              aria-label="Previous slide"
            >
              ←
            </button>
            <div className="flex gap-2">
              {CAROUSEL_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: slide === i ? "2rem" : "0.5rem",
                    background:
                      slide === i ? COLORS.marigold : COLORS.deepAubergineLight,
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setSlide((s) => (s + 1) % CAROUSEL_SLIDES.length)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition hover:scale-110"
              style={{
                border: `1px solid ${COLORS.deepAubergineLight}`,
                background: `${COLORS.deepAubergine}60`,
                color: COLORS.iceSilver,
              }}
              aria-label="Next slide"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TOP TUTORS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BG_IMAGES.tutors}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${COLORS.deepAubergineDark}F2 0%, transparent 30%, transparent 70%, ${COLORS.deepAubergineDark}F2 100%)`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div className="max-w-2xl">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: COLORS.marigold }}
              >
                Tutors
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                style={{ color: COLORS.iceSilver }}
              >
                Meet our verified tutors
              </h2>
              <p
                className="leading-relaxed"
                style={{ color: COLORS.iceSilverMuted }}
              >
                Hand-picked experts from top universities.
              </p>
            </div>
            <Link
              to="/tutors"
              className="text-sm font-medium transition hover:opacity-80"
              style={{ color: COLORS.marigold }}
            >
              View all tutors →
            </Link>
          </div>

          {tutorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-6 animate-pulse"
                  style={{
                    background: `${COLORS.deepAubergine}80`,
                    border: `1px solid ${COLORS.deepAubergineLight}`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-lg mb-4"
                    style={{ background: COLORS.deepAubergineLight }}
                  />
                  <div
                    className="h-4 w-32 rounded mb-2"
                    style={{ background: COLORS.deepAubergineLight }}
                  />
                  <div
                    className="h-3 w-24 rounded"
                    style={{ background: COLORS.deepAubergineLight }}
                  />
                </div>
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: COLORS.iceSilverDim }}
            >
              No tutors available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tutors.map((t) => {
                const u = t.user || t;
                return (
                  <div
                    key={t._id}
                    className="rounded-xl p-6 transition-all hover:-translate-y-1 backdrop-blur-sm"
                    style={{
                      background: `${COLORS.deepAubergine}80`,
                      border: `1px solid ${COLORS.deepAubergineLight}`,
                    }}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{
                            background: `${COLORS.marigold}20`,
                            color: COLORS.marigold,
                          }}
                        >
                          {(u.name || "T")[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          className="font-semibold truncate"
                          style={{ color: COLORS.iceSilver }}
                        >
                          {u.name || "Tutor"}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: COLORS.iceSilverDim }}
                        >
                          {t.subjects?.slice(0, 2).join(", ") || "Subject"}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span style={{ color: COLORS.marigold }} className="text-xs">
                            ★
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: COLORS.iceSilverMuted }}
                          >
                            {(t.rating ?? 5).toFixed?.(1) ?? t.rating}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: COLORS.iceSilverDim }}
                          >
                            ({t.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                    </div>

                    {t.bio && (
                      <p
                        className="text-sm leading-relaxed mb-4 line-clamp-2"
                        style={{ color: COLORS.iceSilverMuted }}
                      >
                        {t.bio}
                      </p>
                    )}

                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: `1px solid ${COLORS.deepAubergineLight}` }}
                    >
                      <div>
                        <span
                          className="text-lg font-bold"
                          style={{ color: COLORS.marigold }}
                        >
                          ${t.hourlyRate ?? "—"}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: COLORS.iceSilverDim }}
                        >
                          {" "}
                          / hr
                        </span>
                      </div>
                      <Link
                        to={`/tutors/${t._id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:scale-105"
                        style={{
                          background: COLORS.marigold,
                          color: COLORS.deepAubergineDark,
                        }}
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800" ref={testimonialsRef}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: COLORS.marigold }}
            >
              Testimonials
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ color: COLORS.iceSilver }}
            >
              Loved by students worldwide
            </h2>
            <p
              className="leading-relaxed"
              style={{ color: COLORS.iceSilverMuted }}
            >
              Hear from groups already studying smarter on StudySync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={t.name}
                className="rounded-xl p-6 transition-all hover:-translate-y-1"
                style={{
                  background:
                    idx === activeTestimonial
                      ? `${COLORS.deepAubergine}80`
                      : `${COLORS.deepAubergine}60`,
                  border:
                    idx === activeTestimonial
                      ? `1px solid ${COLORS.marigold}40`
                      : `1px solid ${COLORS.deepAubergineLight}`,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mb-4"
                  style={{ color: COLORS.marigold }}
                >
                  <path d="M3 21c3 0 7-1 7-8V5a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h3c0 3-2 4-4 4v4zM14 21c3 0 7-1 7-8V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h3c0 3-2 4-4 4v4z" />
                </svg>
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: COLORS.iceSilver }}
                >
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: COLORS.iceSilver }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: COLORS.iceSilverDim }}
                    >
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FINAL CTA */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={BG_IMAGES.cta}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.2 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${COLORS.deepAubergineDark}E6 0%, ${COLORS.deepAubergine}99 50%, ${COLORS.deepAubergineDark}E6 100%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${COLORS.marigold}30, transparent 70%)`,
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: COLORS.iceSilver }}
          >
            Ready to study smarter?
          </h2>
          <p
            className="text-lg mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: COLORS.iceSilverMuted }}
          >
            Join thousands of students already learning together on StudySync.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:scale-105"
              style={{
                background: COLORS.marigold,
                color: COLORS.deepAubergineDark,
                boxShadow: `0 12px 32px -8px ${COLORS.marigold}80`,
              }}
            >
              Get Started Free
            </Link>
            <Link
              to="/tutors"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition hover:scale-105 backdrop-blur-md"
              style={{
                border: `1px solid ${COLORS.marigold}40`,
                color: COLORS.iceSilver,
                background: `${COLORS.deepAubergineDark}99`,
              }}
            >
              Browse Tutors
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}