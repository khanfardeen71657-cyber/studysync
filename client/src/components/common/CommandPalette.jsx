import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: '📊', path: '/dashboard' },
  { id: 'groups', label: 'Go to Groups', icon: '👥', path: '/groups' },
  { id: 'tutors', label: 'Find Tutors', icon: '🎓', path: '/tutors' },
  { id: 'bookings', label: 'My Bookings', icon: '📅', path: '/bookings' },
  { id: 'new-group', label: 'Create New Group', icon: '➕', path: '/groups' },
  { id: 'logout', label: 'Logout', icon: '🚪', action: 'logout' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!user) return
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [user])

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setSelected(0)
  }, [search])

  const handleSelect = (cmd) => {
    if (cmd.action === 'logout') {
      logout()
      navigate('/login')
    } else if (cmd.path) {
      navigate(cmd.path)
    }
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    }
    if (e.key === 'Enter' && filtered[selected]) {
      handleSelect(filtered[selected])
    }
  }

  if (!open || !user) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #131320, #0f0f18)',
          border: '1px solid rgba(124, 92, 255, 0.3)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(124, 92, 255, 0.1)',
          animation: 'scaleIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-100 placeholder:text-slate-500"
          />
          <kbd className="px-2 py-1 rounded-md text-[11px] font-mono text-slate-500 border border-white/[0.1]"
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-[13px]">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                onMouseEnter={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                style={
                  selected === i
                    ? {
                        background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(236, 72, 153, 0.08))',
                        border: '1px solid rgba(124, 92, 255, 0.3)',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <span className="text-[18px]">{cmd.icon}</span>
                <span className="text-[14px] font-medium text-slate-100 flex-1">
                  {cmd.label}
                </span>
                {selected === i && (
                  <kbd className="px-2 py-1 rounded-md text-[10.5px] font-mono text-slate-500 border border-white/[0.1]"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-4 text-[11.5px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.1] font-mono">⌘K</kbd>
            <span>Toggle</span>
          </div>
        </div>
      </div>
    </div>
  )
}