import { Link } from 'react-router-dom'

export default function VideoHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ═══════════ VIDEO BACKGROUND ═══════════ */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80&auto=format&fit=crop"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
          style={{ filter: 'brightness(0.35) saturate(1.1) contrast(1.05)' }}
        >
          <source
            src="https://cdn.pixabay.com/video/2023/10/22/185865-877653869_large.mp4"
            type="video/mp4"
          />
          <source
            src="https://cdn.pixabay.com/video/2020/08/12/47138-450501801_large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark Overlay with color glows */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124, 92, 255, 0.25), transparent 70%),
              radial-gradient(ellipse 50% 40% at 80% 30%, rgba(236, 72, 153, 0.15), transparent 70%),
              linear-gradient(
                180deg,
                rgba(10, 10, 15, 0.75) 0%,
                rgba(10, 10, 15, 0.55) 40%,
                rgba(10, 10, 15, 0.95) 100%
              )
            `,
          }}
        />

        {/* Vignette edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(10, 10, 15, 0.9) 100%)',
          }}
        />
      </div>

      {/* ═══════════ HERO CONTENT ═══════════ */}
      <div className="relative z-10 text-center max-w-[900px] mx-auto px-6 py-24">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-[12.5px] font-medium mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#d1d1d8',
            boxShadow:
              '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.05em] text-white"
            style={{ background: 'linear-gradient(135deg, #7c5cff, #ec4899)' }}
          >
            New
          </span>
          <span>Real-time whiteboard is live</span>
        </div>

        {/* Heading */}
        <h1
          className="text-[clamp(44px,7vw,88px)] font-extrabold tracking-[-0.045em] leading-none mb-7"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #c8c8d1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 40px rgba(0, 0, 0, 0.7)',
          }}
        >
          Study together.
          <br />
          <span
            style={{
              background:
                'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Not alone.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[clamp(16px,2vw,19px)] max-w-[620px] mx-auto mb-10 leading-relaxed"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
          }}
        >
          The collaborative workspace for modern students. Form groups, share
          notes, draw together on a shared canvas, and quiz each other — in
          real-time.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center flex-wrap mb-8">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start for free
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <button className="btn btn-secondary btn-lg">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Watch demo
          </button>
        </div>

        {/* Social Proof */}
        <div
          className="flex items-center justify-center gap-3 text-[13px]"
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex">
            {[
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80&auto=format&fit=crop',
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-6 h-6 rounded-full border-2 object-cover"
                style={{
                  marginLeft: i > 0 ? '-8px' : 0,
                  borderColor: '#0a0a0f',
                }}
              />
            ))}
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Free forever · No credit card required
        </div>
      </div>

      {/* ═══════════ SCROLL INDICATOR ═══════════ */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2.5"
        style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        <div
          className="relative"
          style={{
            width: '22px',
            height: '36px',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '11px',
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '6px',
              width: '3px',
              height: '7px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '2px',
              animation: 'scroll-wheel 1.8s infinite',
            }}
          />
        </div>
        <span>Scroll</span>
      </div>

      {/* Keyframes */}
      <style>
        {`
          @keyframes scroll-wheel {
            0% { top: 6px; opacity: 1; }
            100% { top: 20px; opacity: 0; }
          }
        `}
      </style>
    </section>
  )
}