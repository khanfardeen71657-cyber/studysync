import { useState } from 'react'

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    color: '#3b82f6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M22 6l-10 7L2 6"/>
      </svg>
    ),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#0088cc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Twitter',
    color: '#1DA1F2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

export default function InviteModal({ open, onClose, inviteLink, groupName }) {
  const [copied, setCopied] = useState(false)
  const [qrMode, setQrMode] = useState(false)

  if (!open) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const share = (platform) => {
    const text = `Join my study group "${groupName}" on StudySync!`
    const encodedLink = encodeURIComponent(inviteLink)
    const encodedText = encodeURIComponent(text)

    let url = ''
    if (platform === 'whatsapp') url = `https://wa.me/?text=${encodedText}%20${encodedLink}`
    else if (platform === 'email') url = `mailto:?subject=${encodeURIComponent('Join my study group')}&body=${encodedText}%0A%0A${encodedLink}`
    else if (platform === 'telegram') url = `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`
    else if (platform === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`

    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(15,20,35,0.98)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px -20px rgba(16,185,129,0.4)',
          animation: 'inviteFadeIn 0.2s ease-out',
          position: 'relative',
        }}
      >
        {/* Top gradient line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          borderRadius: '24px 24px 0 0',
          background: 'linear-gradient(90deg, #10b981, #14b8a6)',
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16, right: 16,
            width: 32, height: 32,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981, #14b8a6)',
          boxShadow: '0 12px 28px -8px rgba(16,185,129,0.6)',
          marginBottom: 18,
          fontSize: 26,
        }}>
          🔗
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: 'var(--text)',
          marginBottom: 6,
        }}>
          Invite to <span style={{
            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{groupName || 'group'}</span>
        </h2>
        <p style={{
          fontSize: 13.5,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: 20,
        }}>
          Share this link with classmates. Anyone with the link can join instantly.
        </p>

        {/* Link box */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
        }}>
          <div style={{
            flex: 1,
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            fontSize: 12,
            color: 'var(--text-2)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: '#34d399', fontSize: 14 }}>🔒</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{inviteLink}</span>
          </div>
          <button
            onClick={copyLink}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'white',
              background: copied
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #10b981, #14b8a6)',
              boxShadow: copied
                ? '0 8px 20px -6px rgba(16,185,129,0.6)'
                : '0 6px 16px -4px rgba(16,185,129,0.5)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            or share via
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
        </div>

        {/* Share buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}>
          {SHARE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => share(opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '14px 8px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${opt.color}15`
                e.currentTarget.style.borderColor = `${opt.color}50`
                e.currentTarget.style.color = opt.color
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'var(--card-border)'
                e.currentTarget.style.color = 'var(--text-2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ color: opt.color }}>{opt.icon}</div>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Info footer */}
        <div style={{
          padding: 12,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 12,
          color: 'var(--text-2)',
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span>Anyone with this link can join the group. You can regenerate it anytime from settings.</span>
        </div>
      </div>

      <style>{`
        @keyframes inviteFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}