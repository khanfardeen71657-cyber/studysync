import { useEffect, useState } from 'react'
import { groupService } from '../../services/groupService'

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function ResourceList({ groupId, refresh }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    groupService.getResources(groupId)
      .then((res) => { if (!cancelled) setResources(res.data.data.resources || []) })
      .catch(console.error)
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [groupId, refresh])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>

  if (resources.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, color: 'var(--text-muted)', fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        No resources yet. Upload your first file!
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {resources.map((r) => (
        <div key={r._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📄</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.uploadedBy?.name || 'Unknown'} · {fmtSize(r.fileSize)}</div>
          </div>
          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Open</a>
        </div>
      ))}
    </div>
  )
}
