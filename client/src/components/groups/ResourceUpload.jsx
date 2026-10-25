import { useState, useRef } from 'react'
import { groupService } from '../../services/groupService'

export default function ResourceUpload({ groupId, onUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.size > 20 * 1024 * 1024) {
      setError('File too large (max 20MB)')
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
    setError('')
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title || file.name)
      formData.append('description', description)

      const res = await groupService.uploadResource(groupId, formData, (e) => {
        if (e.total) {
          setProgress(Math.round((e.loaded * 100) / e.total))
        }
      })

      onUploaded?.(res.data.data.resource)

      setFile(null)
      setTitle('')
      setDescription('')
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px dashed rgba(255,255,255,0.15)',
      borderRadius: 16,
      padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          📁
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            Upload resource
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            PDF, images, docs · Max 20MB
          </div>
        </div>
      </div>

      {!file ? (
        <>
          <input
            ref={inputRef}
            type="file"
            onChange={handleFile}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx,.txt"
            style={{ display: 'none' }}
            id="file-input"
          />
          <label
            htmlFor="file-input"
            style={{
              display: 'block',
              padding: '24px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-2)',
            }}
          >
            Click to select a file
          </label>
        </>
      ) : (
        <div>
          <div style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>📎</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            {!uploading && (
              <button
                onClick={() => setFile(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            style={{
              width: '100%', padding: '10px 12px',
              borderRadius: 10, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
              outline: 'none', marginBottom: 10,
            }}
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              borderRadius: 10, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
              outline: 'none', resize: 'vertical', marginBottom: 12,
            }}
          />

          {uploading && (
            <div style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
              marginBottom: 12,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                transition: 'width 0.2s ease',
              }} />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {uploading ? `Uploading… ${progress}%` : 'Upload'}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 12,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}