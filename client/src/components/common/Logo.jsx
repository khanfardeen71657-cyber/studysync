import { Link } from 'react-router-dom'

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-slate-100">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(135deg, #7c5cff, #ec4899)',
          boxShadow: '0 4px 12px rgba(124, 92, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </div>
      StudySync
    </Link>
  )
}