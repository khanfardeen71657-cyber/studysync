import { useState, useRef } from 'react'
import { resourceService } from '../../services/resourceService'

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export default function UploadModal({ groupId, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (f) => {
    if (f.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (max 20MB)' }
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      return { valid: false, error: 'File type not allowed (PDF, Image, Word only)' }
    }
    return { valid: true }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setFile(selectedFile)
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setUploading(true)
    setProgress(20)
    setError('')

    try {
      // Convert to base64
      const reader = new FileReader()

      const fileUrl = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setProgress(60)

      // Save metadata to backend
      await resourceService.upload(groupId, {
        title: title.trim(),
        description: description.trim(),
        fileUrl,
        fileKey: `${groupId}-${Date.now()}-${file.name}`,
        fileType: file.type,
        fileSize: file.size,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })

      setProgress(100)
      setTimeout(() => onSuccess(), 300)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to upload')
      setUploading(false)
      setProgress(0)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = () => {
    if (!file) return '📄'
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type === 'application/pdf') return '📕'
    if (file.type.includes('word')) return '📘'
    return '📄'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8 overflow-y-auto"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] rounded-3xl relative overflow-hidden my-auto"
        style={{
          background: 'linear-gradient(180deg, #131320, #0f0f18)',
          border: '1px solid rgba(124, 92, 255, 0.2)',
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-1"
          style={{ background: 'linear-gradient(90deg, #7c5cff, #ec4899)' }}
        />

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #7c5cff, #ec4899)',
                  boxShadow: '0 8px 20px -4px rgba(124, 92, 255, 0.5)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-slate-100">
                  Upload Resource
                </h2>
                <p className="text-[12.5px] text-slate-500">
                  Share notes, PDFs, or images with your group
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-100 hover:bg-white/[0.06] transition disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              className="relative rounded-2xl p-6 text-center transition-all cursor-pointer"
              style={{
                background: dragOver ? 'rgba(124, 92, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: `2px dashed ${
                  dragOver
                    ? 'rgba(124, 92, 255, 0.5)'
                    : file
                    ? 'rgba(16, 185, 129, 0.4)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                disabled={uploading}
              />

              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-[24px]"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {getFileIcon()}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-slate-100 truncate mb-0.5">
                      {file.name}
                    </div>
                    <div className="text-[12px] text-slate-500">
                      {formatSize(file.size)} · Ready
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setProgress(0)
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(236, 72, 153, 0.1))',
                      border: '1px solid rgba(124, 92, 255, 0.2)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-100 mb-1">
                    Drop file here or click to browse
                  </p>
                  <p className="text-[12px] text-slate-500">
                    PDF, Images, or Word · Max 20MB
                  </p>
                </>
              )}
            </div>

            {uploading && progress > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 text-[12px]">
                  <span className="text-slate-400">Uploading...</span>
                  <span className="text-[#a78bfa] font-semibold">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #7c5cff, #ec4899)',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Calculus Chapter 1 Notes"
                className="input"
                required
                disabled={uploading}
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's in this file?"
                className="input"
                rows={2}
                disabled={uploading}
              />
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. calculus, exam, chapter1"
                className="input"
                disabled={uploading}
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[13px]">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold text-slate-300 transition disabled:opacity-40"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex-1 py-3 rounded-xl text-[13.5px] font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7c5cff, #a855f7)',
                  boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
                }}
              >
                {uploading ? `Uploading ${progress}%` : 'Upload Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}